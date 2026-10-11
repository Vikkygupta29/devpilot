package com.devpilot.services;

import com.devpilot.dto.ChatMessageResponse;
import com.devpilot.dto.CitationDto;
import com.devpilot.entity.ChatMessage;
import com.devpilot.entity.MessageRole;
import com.devpilot.repository.ChatMessageRepository;
import com.devpilot.services.ai.CitationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executor;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatStreamHandler {

    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final CitationMapper citationMapper;
    private final Executor indexingExecutor;

    public SseEmitter stream(
            UUID sessionId,
            ChatMessageResponse userMessage,
            List<CitationDto> citations,
            String systemPrompt,
            String userPrompt
    ) {
        SseEmitter emitter = new SseEmitter(180_000L);

        indexingExecutor.execute(() -> {
            StringBuilder fullContent = new StringBuilder();
            try {
                // 1. Send user_message event
                emitter.send(SseEmitter.event()
                        .name("user_message")
                        .data(userMessage));

                // 2. Send citations event
                if (citations != null && !citations.isEmpty()) {
                    emitter.send(SseEmitter.event()
                            .name("citations")
                            .data(citations));
                }

                // 3. Build AI prompt and stream response
                Prompt prompt = new Prompt(List.of(
                        new SystemMessage(systemPrompt),
                        new UserMessage(userPrompt)
                ));

                try {
                    chatModel.stream(prompt)
                            .doOnNext(chatResponse -> {
                                if (chatResponse != null && chatResponse.getResult() != null) {
                                    var output = chatResponse.getResult().getOutput();
                                    if (output != null && output.getText() != null) {
                                        String chunk = output.getText();
                                        fullContent.append(chunk);
                                        try {
                                            emitter.send(SseEmitter.event()
                                                    .name("chunk")
                                                    .data(Map.of("delta", chunk)));
                                        } catch (IOException e) {
                                            log.warn("Error sending chunk to client: {}", e.getMessage());
                                        }
                                    }
                                }
                            })
                            .blockLast();
                } catch (Exception streamEx) {
                    log.error("Chat generation failed: {}", streamEx.getMessage(), streamEx);
                    String friendlyError = extractUserFriendlyError(streamEx);
                    if (fullContent.isEmpty()) {
                        String message = "⚠️ " + friendlyError;
                        fullContent.append(message);
                        try {
                            emitter.send(SseEmitter.event()
                                    .name("chunk")
                                    .data(Map.of("delta", message)));
                        } catch (IOException ignored) {
                        }
                    }
                }

                // 4. Save assistant response to DB
                ChatMessage assistantMessage = chatMessageRepository.save(ChatMessage.builder()
                        .sessionId(sessionId)
                        .role(MessageRole.ASSISTANT)
                        .content(fullContent.toString())
                        .citations(citationMapper.toJson(citations))
                        .build());

                // 5. Send done event
                emitter.send(SseEmitter.event()
                        .name("done")
                        .data(new ChatMessageResponse(
                                assistantMessage.getId(),
                                assistantMessage.getRole(),
                                assistantMessage.getContent(),
                                citations,
                                assistantMessage.getCreatedAt()
                        )));
                emitter.complete();

            } catch (Exception ex) {
                log.error("Fatal error streaming chat: {}", ex.getMessage(), ex);
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data(Map.of("message", extractUserFriendlyError(ex))));
                } catch (IOException ignored) {
                }
                emitter.completeWithError(ex);
            }
        });

        return emitter;
    }

    private String extractUserFriendlyError(Throwable error) {
        if (error == null) return "Unknown error occurred.";
        String msg = error.getMessage() != null ? error.getMessage() : error.toString();
        if (msg.contains("API_KEY_INVALID") || msg.contains("API key not valid") || msg.contains("dummy-key") || msg.contains("API key is missing") || msg.contains("API key is invalid") || msg.contains("No AI provider API key found")) {
            return "AI API key is missing or invalid. Please configure your `GROQ_API_KEY` (free at https://console.groq.com/keys) or `GEMINI_API_KEY` in `application.properties`.";
        }
        if (msg.contains("RESOURCE_EXHAUSTED") || msg.contains("Quota exceeded") || msg.contains("429") || msg.contains("rate limit")) {
            return "AI provider rate limit reached. The system will automatically fall back to backup models on the next request. Please wait a few moments and try again.";
        }
        if (msg.contains("503") || msg.contains("UNAVAILABLE") || msg.contains("high demand")) {
            return "AI provider is currently experiencing high demand. Please try again in a few moments.";
        }
        if (msg.contains("MODEL_NOT_FOUND") || msg.contains("is not found for API version")) {
            return "The requested AI model was not found: " + msg;
        }
        return "AI response error: " + msg;
    }
}
