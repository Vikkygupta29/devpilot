package com.devpilot.services.indexing;

import com.devpilot.entity.IndexStatus;
import com.devpilot.entity.Repository;
import com.devpilot.exceptions.BadRequestException;
import com.devpilot.exceptions.NotFoundException;
import com.devpilot.repository.RepoRepository;
import com.devpilot.services.UserService;
import com.devpilot.services.ai.RagSettings;
import com.devpilot.services.github.GithubApiClient;
import com.devpilot.services.github.GithubRateLimiter;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndexingService {

    private static final int VECTOR_BATCH_SIZE = 25;
    private static final int PROGRESS_EVERY_N_FILES = 5;

    private final RepoRepository repoRepository;
    private final UserService userService;
    private final GithubApiClient githubApiClient;
    private final CodeFileFilter codeFileFilter;
    private final CodeChunker codeChunker;
    private final GithubRateLimiter rateLimiter;
    private final VectorStore vectorStore;

    @Value("${app.indexing.max-file-bytes:102400}")
    private long maxFileBytes;

    public Repository startIndexing(UUID repoId, UUID userId) {
        Repository repo = repoRepository.findByIdAndUserId(repoId, userId)
                .orElseThrow(() -> new NotFoundException("Repository not found"));
        if (repo.getIndexStatus() == IndexStatus.INDEXING) {
            throw new BadRequestException("Repository is already being indexed");
        }

        repo.setIndexStatus(IndexStatus.INDEXING);
        repo.setFilesProcessed(0);
        repo.setFilesTotal(0);
        repo.setChunkCount(0);
        repo.setErrorMessage(null);
        repo.setUpdatedAt(Instant.now());

        return repoRepository.save(repo);
    }

    @Async("indexingExecutor")
    public void indexAsync(UUID repoId, UUID userId) {
        try {
            doIndex(repoId, userId);
        } catch (Exception ex) {
            log.error("Indexing failed for repo {}", repoId, ex);
            markFailed(repoId, ex.getMessage());
        }
    }

    private record IndexableFile(String path, String sha) {}

    private void doIndex(UUID repoId, UUID userId) {
        Repository repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new NotFoundException("Repository not found"));
        String token = userService.decryptAccessToken(userService.requireById(userId));

        deleteExistingVectors(repoId.toString());

        Map<String, Object> tree = githubApiClient.getRepoTree(
                token, repo.getOwner(), repo.getName(), repo.getDefaultBranch());
        List<IndexableFile> files = listIndexableFiles(tree);

        updateProgress(repoId, files.size(), 0, 0, IndexStatus.INDEXING, null);

        List<Document> batch = new ArrayList<>();
        int processed = 0;
        int totalChunks = 0;

        for (IndexableFile file : files) {
            try {
                String content = null;
                if (file.sha() != null && !file.sha().isBlank()) {
                    content = githubApiClient.getBlobContent(token, repo.getOwner(), repo.getName(), file.sha());
                }
                if (content == null) {
                    content = githubApiClient.getFileContent(token, repo.getOwner(), repo.getName(), file.path());
                }
                if (content != null) {
                    List<Document> chunks = codeChunker.chunkFile(repoId.toString(), file.path(), content);
                    if (!chunks.isEmpty()) {
                        batch.addAll(chunks);
                        if (batch.size() >= VECTOR_BATCH_SIZE) {
                            totalChunks += addDocumentsInBatches(batch);
                            batch.clear();
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Skipping file {} in {}: {}", file.path(), repo.getFullName(), ex.getMessage());
            }

            processed++;
            if (processed % PROGRESS_EVERY_N_FILES == 0 || processed == files.size()) {
                updateProgress(repoId, files.size(), processed, totalChunks, IndexStatus.INDEXING, null);
            }
            rateLimiter.pause();
        }

        if (!batch.isEmpty()) {
            totalChunks += addDocumentsInBatches(batch);
            batch.clear();
        }

        if (totalChunks == 0 && !files.isEmpty()) {
            throw new RuntimeException("Vector embedding failed: 0 chunks were stored in vector database. Please verify your embedding provider configuration and API key.");
        }

        markReady(repoId, files.size(), processed, totalChunks, repo.getFullName());
    }

    private int addDocumentsInBatches(List<Document> documents) {
        if (documents == null || documents.isEmpty()) {
            return 0;
        }
        int saved = 0;
        for (int i = 0; i < documents.size(); i += VECTOR_BATCH_SIZE) {
            int end = Math.min(i + VECTOR_BATCH_SIZE, documents.size());
            List<Document> subBatch = documents.subList(i, end);
            List<Document> cleanBatch = subBatch.stream()
                    .map(this::sanitizeDocument)
                    .toList();
            try {
                vectorStore.add(cleanBatch);
                saved += cleanBatch.size();
            } catch (Exception ex) {
                log.warn("Batch vector add failed (size {}): {}. Retrying item by item...",
                        cleanBatch.size(), rootCauseMessage(ex), ex);
                for (Document doc : cleanBatch) {
                    try {
                        vectorStore.add(List.of(doc));
                        saved++;
                    } catch (Exception singleEx) {
                        log.error("Failed to add vector chunk for file {}: {}",
                                doc.getMetadata().get("filePath"), rootCauseMessage(singleEx), singleEx);
                    }
                }
            }
        }
        return saved;
    }

    private Document sanitizeDocument(Document doc) {
        if (doc == null) return null;
        String text = (doc.getText() != null) ? doc.getText().replace("\u0000", "") : "";
        Map<String, Object> cleanMeta = new HashMap<>();
        if (doc.getMetadata() != null) {
            doc.getMetadata().forEach((k, v) -> {
                if (v instanceof String s) {
                    cleanMeta.put(k, s.replace("\u0000", ""));
                } else {
                    cleanMeta.put(k, v);
                }
            });
        }
        return new Document(doc.getId(), text, cleanMeta);
    }

    @SuppressWarnings("unchecked")
    private List<IndexableFile> listIndexableFiles(Map<String, Object> tree) {
        if (tree == null || tree.get("tree") == null) {
            return List.of();
        }

        List<Map<String, Object>> entries = (List<Map<String, Object>>) tree.get("tree");
        return entries.stream()
                .filter(entry -> "blob".equals(String.valueOf(entry.get("type"))))
                .filter(entry -> {
                    String path = String.valueOf(entry.get("path"));
                    long size = entry.get("size") instanceof Number n ? n.longValue() : 0L;
                    return codeFileFilter.isEligible(path, size, maxFileBytes);
                })
                .map(entry -> new IndexableFile(
                        String.valueOf(entry.get("path")),
                        entry.get("sha") != null ? String.valueOf(entry.get("sha")) : null
                ))
                .toList();
    }



    private void deleteExistingVectors(String repoId) {
        try {
            var filter = new FilterExpressionBuilder().eq(RagSettings.METADATA_REPO_ID, repoId).build();
            vectorStore.delete(filter);
        } catch (Exception e) {
            log.warn("could not delete existing vectors for repo {}: {}", repoId, e.getMessage());
        }
    }

    @Transactional
    protected void updateProgress(
            UUID repoId,
            int total,
            int processed,
            int chunks,
            IndexStatus status,
            String error
    ) {
        repoRepository.findById(repoId).ifPresent(repo -> {
            repo.setFilesTotal(total);
            repo.setFilesProcessed(processed);
            repo.setChunkCount(chunks);
            repo.setIndexStatus(status);
            repo.setErrorMessage(error);
            repo.setUpdatedAt(Instant.now());
            repoRepository.save(repo);
        });
    }

    private void markReady(UUID repoId, int total, int processed, int chunks, String repoFullName) {
        updateProgress(repoId, total, processed, chunks, IndexStatus.READY, null);
        log.info("Indexing completed successfully for repository {} ({} chunks, {} files)", repoFullName, chunks, processed);
    }

    private void markFailed(UUID repoId, String error) {
        repoRepository.findById(repoId).ifPresent(repo -> {
            updateProgress(repoId, repo.getFilesTotal(), repo.getFilesProcessed(), repo.getChunkCount(), IndexStatus.FAILED, error);
        });
    }

    private String rootCauseMessage(Exception exception) {
        Throwable cause = exception;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : cause.getClass().getSimpleName();
    }
}
