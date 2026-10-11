package com.devpilot.services.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.EmbeddingResponseMetadata;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Custom EmbeddingModel for Google Gemini (AI Studio).
 * Calls Google AI Studio REST API:
 * POST https://generativelanguage.googleapis.com/v1beta/models/{model}:batchEmbedContents?key={apiKey}
 *
 * Uses gemini-embedding-001 with outputDimensionality=768 (or configured dimensions),
 * with automatic fallback to embedding-001.
 */
@Component
@Primary
@ConditionalOnProperty(name = "app.ai.embedding.provider", havingValue = "gemini")
@Slf4j
public class GeminiEmbeddingModel implements EmbeddingModel {

    private final RestClient restClient;
    private final String apiKey;
    private final int dimensions;
    private final AtomicReference<String> activeModel;

    public GeminiEmbeddingModel(
            RestClient.Builder restClientBuilder,
            @Value("${spring.ai.google.genai.api-key:${GEMINI_API_KEY:}}") String apiKey,
            @Value("${spring.ai.google.genai.embedding.options.model:gemini-embedding-001}") String modelName,
            @Value("${spring.ai.vectorstore.pgvector.dimensions:768}") int dimensions
    ) {
        this.restClient = restClientBuilder.build();
        this.apiKey = apiKey;
        String cleanModel = modelName.startsWith("models/") ? modelName.substring(7) : modelName;
        if ("text-embedding-004".equalsIgnoreCase(cleanModel)) {
            cleanModel = "gemini-embedding-001";
        }
        this.activeModel = new AtomicReference<>(cleanModel);
        this.dimensions = dimensions;
    }

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<String> instructions = request.getInstructions();
        if (instructions == null || instructions.isEmpty()) {
            return new EmbeddingResponse(List.of(), new EmbeddingResponseMetadata());
        }

        List<Embedding> embeddings = new ArrayList<>();
        int batchSize = 50;
        for (int i = 0; i < instructions.size(); i += batchSize) {
            int end = Math.min(i + batchSize, instructions.size());
            List<String> subList = instructions.subList(i, end);
            List<Embedding> subEmbeddings = fetchBatchWithFallback(subList, i);
            embeddings.addAll(subEmbeddings);
        }

        return new EmbeddingResponse(embeddings, new EmbeddingResponseMetadata());
    }

    @Override
    public float[] embed(Document document) {
        List<float[]> embeddings = embed(List.of(document.getText()));
        return embeddings.isEmpty() ? new float[dimensions] : embeddings.getFirst();
    }

    public List<float[]> embed(List<String> texts) {
        EmbeddingRequest request = new EmbeddingRequest(texts, null);
        EmbeddingResponse response = call(request);
        return response.getResults().stream()
                .map(Embedding::getOutput)
                .toList();
    }

    @Override
    public float[] embed(String text) {
        List<float[]> embeddings = embed(List.of(text));
        return embeddings.isEmpty() ? new float[dimensions] : embeddings.getFirst();
    }

    @Override
    public int dimensions() {
        return this.dimensions;
    }

    private List<Embedding> fetchBatchWithFallback(List<String> texts, int startIndex) {
        if (apiKey == null || apiKey.isBlank() || "dummy-key".equalsIgnoreCase(apiKey)) {
            throw new RuntimeException("Google Gemini API key is not configured. Please set GEMINI_API_KEY in your environment or application.properties.");
        }

        String current = activeModel.get();
        List<String> candidateModels = List.of(current, "gemini-embedding-001", "embedding-001");
        candidateModels = candidateModels.stream().distinct().toList();

        Exception lastException = null;
        for (String candidate : candidateModels) {
            try {
                List<Embedding> results = doFetchBatch(texts, startIndex, candidate);
                activeModel.set(candidate);
                return results;
            } catch (Exception ex) {
                lastException = ex;
                String msg = ex.getMessage() != null ? ex.getMessage() : "";
                if (msg.contains("API_KEY_INVALID") || msg.contains("API key not valid") || msg.contains("401") || msg.contains("403") || msg.contains("RESOURCE_EXHAUSTED") || msg.contains("429")) {
                    log.warn("Gemini embedding API authentication or quota error: {}. Stopping fallback.", msg);
                    break;
                }
                log.warn("Gemini embedding model '{}' failed: {}. Trying fallback if available...", candidate, msg);
            }
        }

        throw new RuntimeException("Gemini embedding request failed: " +
                (lastException != null ? lastException.getMessage() : "Unknown error"), lastException);
    }

    @SuppressWarnings("unchecked")
    private List<Embedding> doFetchBatch(List<String> texts, int startIndex, String model) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":batchEmbedContents?key=" + apiKey;

        List<Map<String, Object>> requests = texts.stream()
                .map(text -> {
                    Map<String, Object> req = new HashMap<>();
                    req.put("model", "models/" + model);
                    req.put("content", Map.of("parts", List.of(Map.of("text", text))));
                    if ("gemini-embedding-001".equals(model)) {
                        req.put("outputDimensionality", dimensions);
                    }
                    return req;
                })
                .toList();

        Map<String, Object> requestBody = Map.of("requests", requests);

        Map<String, Object> response = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("embeddings")) {
            throw new IllegalStateException("Invalid response from Gemini embedding API: " + response);
        }

        List<Map<String, Object>> rawEmbeddings = (List<Map<String, Object>>) response.get("embeddings");
        List<Embedding> result = new ArrayList<>();

        for (int i = 0; i < rawEmbeddings.size(); i++) {
            Map<String, Object> item = rawEmbeddings.get(i);
            List<Number> values = (List<Number>) item.get("values");
            float[] floatValues = new float[values.size()];
            for (int j = 0; j < values.size(); j++) {
                floatValues[j] = values.get(j).floatValue();
            }
            result.add(new Embedding(floatValues, startIndex + i));
        }

        return result;
    }
}
