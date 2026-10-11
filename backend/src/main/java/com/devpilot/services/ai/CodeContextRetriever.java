package com.devpilot.services.ai;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeContextRetriever {

    private static final String NO_MATCHES = "(no matching code chunks found)";
    private final VectorStore vectorStore;
    private final CitationMapper citationMapper;

    public RetrievedContext retrieve(UUID repositoryId, String question) {
        try {
            var filter = new FilterExpressionBuilder()
                    .eq(RagSettings.METADATA_REPO_ID, repositoryId.toString())
                    .build();

            var search = SearchRequest.builder()
                    .query(question)
                    .topK(RagSettings.TOP_K_CHUNKS)
                    .filterExpression(filter)
                    .build();

            var initialDocs = vectorStore.similaritySearch(search);
            Map<String, Document> docMap = new LinkedHashMap<>();

            if (initialDocs != null) {
                for (Document doc : initialDocs) {
                    if (doc != null && doc.getId() != null) {
                        docMap.put(doc.getId(), doc);
                    }
                }
            }

            // Keyword-targeted query expansion to guarantee controllers, routes, entities and security classes are fetched
            String lower = question.toLowerCase();
            String expansionQuery = null;
            if (lower.contains("endpoint") || lower.contains("controller") || lower.contains("route") || lower.contains("api") || lower.contains("request") || lower.contains("url")) {
                expansionQuery = question + " Controller @RestController @RequestMapping @GetMapping @PostMapping router routes api";
            } else if (lower.contains("model") || lower.contains("entity") || lower.contains("schema") || lower.contains("table") || lower.contains("database")) {
                expansionQuery = question + " Entity @Entity @Table Repository schema model database";
            } else if (lower.contains("auth") || lower.contains("jwt") || lower.contains("token") || lower.contains("security") || lower.contains("login") || lower.contains("password")) {
                expansionQuery = question + " SecurityConfig Jwt filter Authentication user login token";
            } else if (lower.contains("service") || lower.contains("business") || lower.contains("logic")) {
                expansionQuery = question + " Service @Service implementation";
            }

            if (expansionQuery != null) {
                try {
                    var expandedSearch = SearchRequest.builder()
                            .query(expansionQuery)
                            .topK(8)
                            .filterExpression(filter)
                            .build();
                    var expandedDocs = vectorStore.similaritySearch(expandedSearch);
                    if (expandedDocs != null) {
                        for (Document doc : expandedDocs) {
                            if (doc != null && doc.getId() != null && !docMap.containsKey(doc.getId())) {
                                docMap.put(doc.getId(), doc);
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }

            List<Document> documents = new ArrayList<>(docMap.values());

            if (documents.isEmpty()) {
                // Secondary fallback search using general repository overview keywords
                try {
                    var overviewSearch = SearchRequest.builder()
                            .query("README architecture index main project overview entrypoint config Controller")
                            .topK(RagSettings.TOP_K_CHUNKS)
                            .filterExpression(filter)
                            .build();
                    documents = vectorStore.similaritySearch(overviewSearch);
                } catch (Exception ignored) {
                }
            }

            if (documents == null || documents.isEmpty()) {
                return new RetrievedContext(List.of(), "(No indexed code chunks found in vector database for this repository. If this repository was not indexed yet or failed, please re-index it from the repositories page.)");
            }

            var citations = documents.stream()
                    .map(citationMapper::fromDocument)
                    .distinct()
                    .toList();

            var contextText = documents.stream()
                    .map(Document::getText)
                    .collect(Collectors.joining("\n\n---\n\n"));
            if (contextText.isBlank()) {
                contextText = NO_MATCHES;
            }

            return new RetrievedContext(citations, contextText);
        } catch (Exception ex) {
            log.warn("Code context retrieval failed for repository {}: {}. Continuing without vector context.", repositoryId, ex.getMessage());
            return new RetrievedContext(List.of(), NO_MATCHES);
        }
    }
}
