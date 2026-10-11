package com.devpilot.services.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * High-performance ChatModel powered by Groq LPU inference (300+ tokens/sec)
 * with automatic fallback to secondary models and Google Gemini.
 */
@Component
@Primary
@Slf4j
public class GroqChatModel implements ChatModel {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String groqApiKey;
    private final String groqModel;
    private final String groqBaseUrl;
    private final String geminiApiKey;
    private final String geminiModel;

    public GroqChatModel(
            ObjectMapper objectMapper,
            @Value("${app.ai.groq.api-key:${GROQ_API_KEY:}}") String groqApiKey,
            @Value("${app.ai.groq.model:${GROQ_MODEL:openai/gpt-oss-120b}}") String groqModel,
            @Value("${app.ai.groq.base-url:${GROQ_BASE_URL:https://api.groq.com/openai/v1}}") String groqBaseUrl,
            @Value("${spring.ai.google.genai.api-key:${GEMINI_API_KEY:}}") String geminiApiKey,
            @Value("${spring.ai.google.genai.chat.options.model:${AI_CHAT_MODEL:gemini-flash-lite-latest}}") String geminiModel
    ) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        this.objectMapper = objectMapper;
        this.groqApiKey = cleanKey(groqApiKey);
        this.groqModel = sanitizeGroqModel(groqModel);
        this.groqBaseUrl = (groqBaseUrl != null && !groqBaseUrl.isBlank()) ? groqBaseUrl.trim() : "https://api.groq.com/openai/v1";
        this.geminiApiKey = cleanKey(geminiApiKey);
        this.geminiModel = sanitizeGeminiModel(geminiModel);
    }

    private boolean isGroqAvailable() {
        return groqApiKey != null && !groqApiKey.isBlank() && !"dummy-key".equalsIgnoreCase(groqApiKey);
    }

    private boolean isGeminiAvailable() {
        return geminiApiKey != null && !geminiApiKey.isBlank() && !"dummy-key".equalsIgnoreCase(geminiApiKey);
    }

    private String cleanKey(String key) {
        if (key == null) return "";
        String trimmed = key.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() > 2) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length() > 2) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }

    private String sanitizeGroqModel(String model) {
        if (model == null || model.isBlank()) {
            return "openai/gpt-oss-120b";
        }
        String clean = model.trim();
        // Redirect legacy or decommissioned model names to active flagship model
        if (clean.toLowerCase().contains("llama-3.1-8b")
                || clean.toLowerCase().contains("llama-3.3-70b")
                || clean.toLowerCase().contains("llama3-70b")
                || clean.toLowerCase().contains("llama3-8b")
                || clean.toLowerCase().contains("mixtral")
                || clean.toLowerCase().contains("gemma2")) {
            return "openai/gpt-oss-120b";
        }
        return clean;
    }

    private String sanitizeGeminiModel(String model) {
        if (model == null || model.isBlank()) {
            return "gemini-flash-lite-latest";
        }
        String clean = model.trim();
        if (clean.startsWith("models/")) {
            clean = clean.substring(7);
        }
        if (clean.contains("gemini-2.") || clean.contains("gemini-1.5") || clean.equalsIgnoreCase("gemini-pro")) {
            return "gemini-flash-lite-latest";
        }
        return clean;
    }

    public enum Provider {
        GROQ,
        GEMINI
    }

    public record Target(Provider provider, String model) {
        @Override
        public String toString() {
            return provider + "(" + model + ")";
        }
    }

    public List<Target> getCandidateTargets() {
        List<Target> targets = new ArrayList<>();

        if (isGroqAvailable()) {
            List<String> groqList = List.of(groqModel, "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b");
            for (String m : groqList) {
                Target t = new Target(Provider.GROQ, m);
                if (!targets.contains(t)) {
                    targets.add(t);
                }
            }
        }

        if (isGeminiAvailable()) {
            List<String> geminiList = List.of(geminiModel, "gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite");
            for (String m : geminiList) {
                Target t = new Target(Provider.GEMINI, m);
                if (!targets.contains(t)) {
                    targets.add(t);
                }
            }
        }

        return targets;
    }

    @Override
    public ChatResponse call(Prompt prompt) {
        List<Target> targets = getCandidateTargets();
        if (targets.isEmpty()) {
            throw new RuntimeException("No AI provider API key found. Please set GROQ_API_KEY in application.properties.");
        }

        Exception lastEx = null;
        for (int i = 0; i < targets.size(); i++) {
            Target target = targets.get(i);
            try {
                String responseText = (target.provider() == Provider.GROQ)
                        ? doGroqGenerateContent(prompt, target.model())
                        : doGeminiGenerateContent(prompt, target.model());
                return new ChatResponse(List.of(new Generation(new AssistantMessage(responseText))));
            } catch (Exception ex) {
                lastEx = ex;
                String next = (i + 1 < targets.size()) ? targets.get(i + 1).toString() : "None";
                log.warn("[GroqChatModel] {} failed: {}. Falling back to -> {}", target, ex.getMessage(), next);

                if (isAuthError(ex)) {
                    continue;
                }

                String msg = ex.getMessage() != null ? ex.getMessage() : "";
                if (msg.contains("503") || msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED")) {
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }

        log.error("All AI fallback targets exhausted. Last error: {}", lastEx != null ? lastEx.getMessage() : "Unknown");
        throw (lastEx instanceof RuntimeException re) ? re : new RuntimeException(lastEx != null ? lastEx.getMessage() : "AI chat failed", lastEx);
    }

    @Override
    public Flux<ChatResponse> stream(Prompt prompt) {
        List<Target> targets = getCandidateTargets();
        if (targets.isEmpty()) {
            return Flux.error(new RuntimeException("No AI provider API key found. Please set GROQ_API_KEY in application.properties."));
        }

        return Flux.create(sink -> {
            boolean succeeded = false;
            Throwable lastEx = null;

            for (int i = 0; i < targets.size(); i++) {
                Target target = targets.get(i);
                AtomicBoolean chunkEmitted = new AtomicBoolean(false);
                try {
                    if (target.provider() == Provider.GROQ) {
                        doGroqStreamGenerateContent(prompt, target.model(), sink, chunkEmitted);
                    } else {
                        doGeminiStreamGenerateContent(prompt, target.model(), sink, chunkEmitted);
                    }
                    succeeded = true;
                    sink.complete();
                    break;
                } catch (Throwable ex) {
                    lastEx = ex;
                    // If stream already started outputting tokens, avoid restarting to prevent duplicate output
                    if (chunkEmitted.get()) {
                        break;
                    }
                    String next = (i + 1 < targets.size()) ? targets.get(i + 1).toString() : "None";
                    log.warn("[GroqChatModel] {} stream failed: {}. Falling back to -> {}", target, ex.getMessage(), next);

                    if (isAuthError(ex)) {
                        continue;
                    }

                    String msg = ex.getMessage() != null ? ex.getMessage() : "";
                    if (msg.contains("503") || msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED")) {
                        try {
                            Thread.sleep(500);
                        } catch (InterruptedException ignored) {
                            Thread.currentThread().interrupt();
                        }
                    }
                }
            }

            if (!succeeded) {
                log.error("All AI stream targets exhausted. Last error: {}", lastEx != null ? lastEx.getMessage() : "Unknown");
                sink.error(lastEx != null ? lastEx : new RuntimeException("All AI chat models failed: " + (lastEx != null ? lastEx.getMessage() : "")));
            }
        });
    }

    private boolean isAuthError(Throwable ex) {
        if (ex == null) return false;
        String msg = ex.getMessage() != null ? ex.getMessage() : "";
        return msg.contains("API_KEY_INVALID") || msg.contains("API key not valid") || msg.contains("401") || msg.contains("PERMISSION_DENIED");
    }

    private String buildOpenAiMessagesJson(Prompt prompt, String model, boolean stream) {
        try {
            Map<String, Object> root = new HashMap<>();
            root.put("model", model);
            root.put("stream", stream);
            root.put("temperature", 0.3);

            List<Map<String, Object>> messages = new ArrayList<>();
            for (Message msg : prompt.getInstructions()) {
                String role = (msg.getMessageType() == MessageType.SYSTEM) ? "system"
                        : (msg.getMessageType() == MessageType.ASSISTANT) ? "assistant" : "user";
                messages.add(Map.of("role", role, "content", msg.getText()));
            }

            if (messages.isEmpty()) {
                messages.add(Map.of("role", "user", "content", "Hello"));
            }

            root.put("messages", messages);
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize request body", e);
        }
    }

    private String doGroqGenerateContent(Prompt prompt, String model) throws Exception {
        String url = groqBaseUrl + "/chat/completions";
        String requestBody = buildOpenAiMessagesJson(prompt, model, false);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey)
                .timeout(Duration.ofSeconds(45))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() >= 400) {
            throw parseGroqError(response.statusCode(), response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.path("choices").path(0).path("message").path("content").asText("");
    }

    private void doGroqStreamGenerateContent(
            Prompt prompt,
            String model,
            reactor.core.publisher.FluxSink<ChatResponse> sink,
            AtomicBoolean chunkEmitted
    ) throws Exception {
        String url = groqBaseUrl + "/chat/completions";
        String requestBody = buildOpenAiMessagesJson(prompt, model, true);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey)
                .header("Accept", "text/event-stream")
                .timeout(Duration.ofSeconds(90))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        if (response.statusCode() >= 400) {
            String errorBody;
            try (InputStream is = response.body()) {
                errorBody = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
            throw parseGroqError(response.statusCode(), errorBody);
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.startsWith("data:")) {
                    String json = trimmed.substring(5).trim();
                    if (!json.isEmpty() && !"[DONE]".equals(json)) {
                        try {
                            JsonNode root = objectMapper.readTree(json);
                            JsonNode delta = root.path("choices").path(0).path("delta");
                            String text = delta.path("content").asText(null);
                            if (text != null && !text.isEmpty()) {
                                chunkEmitted.set(true);
                                sink.next(new ChatResponse(List.of(new Generation(new AssistantMessage(text)))));
                            }
                        } catch (Exception ignored) {
                        }
                    }
                }
            }
        }
    }

    private RuntimeException parseGroqError(int statusCode, String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String message = root.path("error").path("message").asText(null);
            if (message != null && !message.isBlank()) {
                return new RuntimeException("Groq API error (" + statusCode + "): " + message);
            }
        } catch (Exception ignored) {
        }
        return new RuntimeException("Groq API request failed with status " + statusCode + ": " + body);
    }

    // --- Optional Gemini Fallback ---

    private String buildGeminiRequestBody(Prompt prompt) {
        try {
            Map<String, Object> root = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> systemInstruction = null;

            for (Message msg : prompt.getInstructions()) {
                if (msg.getMessageType() == MessageType.SYSTEM) {
                    systemInstruction = Map.of("parts", List.of(Map.of("text", msg.getText())));
                } else if (msg.getMessageType() == MessageType.USER) {
                    contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", msg.getText()))));
                } else if (msg.getMessageType() == MessageType.ASSISTANT) {
                    contents.add(Map.of("role", "model", "parts", List.of(Map.of("text", msg.getText()))));
                }
            }

            if (contents.isEmpty()) {
                contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", "Hello"))));
            }

            if (systemInstruction != null) {
                root.put("systemInstruction", systemInstruction);
            }
            root.put("contents", contents);
            root.put("generationConfig", Map.of("temperature", 0.3));

            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize Gemini request body", e);
        }
    }

    private String doGeminiGenerateContent(Prompt prompt, String model) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey;
        String requestBody = buildGeminiRequestBody(prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() >= 400) {
            throw parseGeminiError(response.statusCode(), response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (parts.isArray() && !parts.isEmpty()) {
            return parts.get(0).path("text").asText("");
        }
        return "";
    }

    private void doGeminiStreamGenerateContent(
            Prompt prompt,
            String model,
            reactor.core.publisher.FluxSink<ChatResponse> sink,
            AtomicBoolean chunkEmitted
    ) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":streamGenerateContent?alt=sse&key=" + geminiApiKey;
        String requestBody = buildGeminiRequestBody(prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(90))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        if (response.statusCode() >= 400) {
            String errorBody;
            try (InputStream is = response.body()) {
                errorBody = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
            throw parseGeminiError(response.statusCode(), errorBody);
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.startsWith("data:")) {
                    String json = trimmed.substring(5).trim();
                    if (!json.isEmpty() && !"[DONE]".equals(json)) {
                        try {
                            JsonNode root = objectMapper.readTree(json);
                            JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
                            if (parts.isArray()) {
                                for (JsonNode part : parts) {
                                    String text = part.path("text").asText(null);
                                    if (text != null && !text.isEmpty()) {
                                        chunkEmitted.set(true);
                                        sink.next(new ChatResponse(List.of(new Generation(new AssistantMessage(text)))));
                                    }
                                }
                            }
                        } catch (Exception ignored) {
                        }
                    }
                }
            }
        }
    }

    private RuntimeException parseGeminiError(int statusCode, String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String message = root.path("error").path("message").asText(null);
            if (message != null && !message.isBlank()) {
                return new RuntimeException("Gemini API error (" + statusCode + "): " + message);
            }
        } catch (Exception ignored) {
        }
        return new RuntimeException("Gemini API request failed with status " + statusCode + ": " + body);
    }

    @Override
    public ChatOptions getDefaultOptions() {
        return null;
    }
}
