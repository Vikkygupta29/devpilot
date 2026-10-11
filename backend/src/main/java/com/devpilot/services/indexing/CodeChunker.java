package com.devpilot.services.indexing;


import com.devpilot.services.ai.RagSettings;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

@Component
public class CodeChunker {

    private final TokenTextSplitter splitter;
    private final CodeFileFilter fileFilter;

    public CodeChunker(
            @Value("${app.indexing.chunk-size:800}")
            int chunkSize,
            CodeFileFilter fileFilter
    ) {
        int tokenSize = (chunkSize > 0) ? chunkSize : 800;
        this.splitter = TokenTextSplitter.builder()
                .withChunkSize(tokenSize)
                .build();
        this.fileFilter = fileFilter;
    }



    public List<Document> chunkFile(String repoId, String filePath, String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        String cleanContent = content.replace("\u0000", "");
        if (cleanContent.isBlank()) {
            return List.of();
        }

        String language = fileFilter.detectLanguage(filePath);
        String header = "// File: " + filePath + "\n";

        Document source = new Document(header + cleanContent, baseMetadata(repoId, filePath, language));
        List<Document> split = splitter.apply(List.of(source));

        return IntStream.range(0, split.size())
                .mapToObj(i -> withChunkIndex(split.get(i), repoId, filePath, language, i))
                .toList();
    }

    private static Map<String, Object> baseMetadata(String repoId, String filePath, String language) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put(RagSettings.METADATA_REPO_ID, repoId);
        metadata.put("filePath", filePath);
        metadata.put("language", language);
        return metadata;
    }

    private static Document withChunkIndex(
            Document chunk,
            String repoId,
            String filePath,
            String language,
            int chunkIndex
    ) {
        Map<String, Object> metadata = new HashMap<>(chunk.getMetadata());
        metadata.put(RagSettings.METADATA_REPO_ID, repoId);
        metadata.put("filePath", filePath);
        metadata.put("language", language);
        metadata.put("chunkIndex", chunkIndex);
        String text = (chunk.getText() != null) ? chunk.getText().replace("\u0000", "") : "";
        return new Document(chunk.getId(), text, metadata);
    }

}
