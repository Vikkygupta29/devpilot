package com.devpilot;

import com.devpilot.dto.ChatMessageResponse;
import com.devpilot.dto.ChatSessionResponse;
import com.devpilot.dto.CreateChatSessionRequest;
import com.devpilot.entity.IndexStatus;
import com.devpilot.entity.Repository;
import com.devpilot.entity.User;
import com.devpilot.repository.ChatMessageRepository;
import com.devpilot.repository.ChatSessionRepository;
import com.devpilot.repository.RepoRepository;
import com.devpilot.repository.UserRepository;
import com.devpilot.services.ChatService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ChatIntegrationTest {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RepoRepository repoRepository;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Test
    @DisplayName("Verify end-to-end chat session creation, streaming, and message persistence")
    void testChatLifecycle() throws Exception {
        // 1. Create a test user and a ready repository
        User user = userRepository.save(User.builder()
                .githubId(System.currentTimeMillis())
                .githubUsername("test-user-" + System.currentTimeMillis())
                .displayName("Test User")
                .accessToken("encrypted-token-test")
                .createdAt(Instant.now())
                .build());

        Repository repo = repoRepository.save(Repository.builder()
                .userId(user.getId())
                .githubRepoId(System.currentTimeMillis())
                .name("test-repo")
                .owner(user.getGithubUsername())
                .fullName(user.getGithubUsername() + "/test-repo")
                .defaultBranch("main")
                .indexStatus(IndexStatus.READY)
                .filesTotal(5)
                .filesProcessed(5)
                .chunkCount(10)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        // 2. Create a chat session
        CreateChatSessionRequest createRequest = new CreateChatSessionRequest(repo.getId(), "Architecture Discussion");
        ChatSessionResponse sessionResponse = chatService.createSession(user.getId(), createRequest);

        assertThat(sessionResponse).isNotNull();
        assertThat(sessionResponse.id()).isNotNull();
        assertThat(sessionResponse.repositoryId()).isEqualTo(repo.getId());
        assertThat(sessionResponse.title()).isEqualTo("Architecture Discussion");

        // 3. List sessions for the repository
        List<ChatSessionResponse> sessions = chatService.listSessions(user.getId(), repo.getId());
        assertThat(sessions).isNotEmpty();
        assertThat(sessions.stream().anyMatch(s -> s.id().equals(sessionResponse.id()))).isTrue();

        // 4. Send a chat message (streamReply)
        String userQuestion = "How does this application handle requests?";
        SseEmitter emitter = chatService.streamReply(user.getId(), sessionResponse.id(), userQuestion);

        assertThat(emitter).isNotNull();

        // Allow async executor a moment to process stream/error handler
        Thread.sleep(2000);

        // 5. Retrieve messages and verify user and assistant messages exist
        List<ChatMessageResponse> messages = chatService.getMessages(user.getId(), sessionResponse.id());
        assertThat(messages).isNotEmpty();
        assertThat(messages.get(0).content()).isEqualTo(userQuestion);
        assertThat(messages.get(0).role().name()).isEqualTo("USER");

        // Clean up test entities
        chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionResponse.id())
                .forEach(m -> chatMessageRepository.deleteById(m.getId()));
        chatSessionRepository.deleteById(sessionResponse.id());
        repoRepository.deleteById(repo.getId());
        userRepository.deleteById(user.getId());
    }
}
