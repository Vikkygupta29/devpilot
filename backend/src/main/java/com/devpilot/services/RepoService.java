package com.devpilot.services;

import com.devpilot.dto.IndexStatusResponse;
import com.devpilot.dto.RepositoryResponse;
import com.devpilot.entity.Repository;
import com.devpilot.entity.User;
import com.devpilot.exceptions.NotFoundException;
import com.devpilot.repository.RepoRepository;
import com.devpilot.services.github.GithubApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RepoService {

    private final RepoRepository repoRepository;
    private final UserService userService;
    private final GithubApiClient githubApiClient;

    @Transactional
    public List<RepositoryResponse> syncAndListRepo(UUID userId){

        User user = userService.requiredById(userId);
        String token = userService.decryptAccessToken(user);

        List<Map<String, Object>> remoteRepos = githubApiClient.listUserRepos(token);

        List<Repository> saved = new ArrayList<>();

        for(Map<String, Object> remote : remoteRepos){

            Long githubRepoId = toLong(remote.get("id"));

            Repository repo = repoRepository.
                    findByUserIdAndGithubRepoId(userId, githubRepoId)
                    .orElseGet(Repository::new);

            String fullName = String.valueOf(remote.get("full_name"));
            String[] parts = fullName.split("/",2);

            repo.setUserId(userId);
            repo.setGithubRepoId(githubRepoId);
            repo.setFullName(fullName);
            repo.setOwner(parts.length > 0 ? parts[0] : String.valueOf(remote.get("owner")));
            repo.setName(parts.length > 1 ? parts[1] : String.valueOf(remote.get("name")));
            repo.setPrivate(Boolean.TRUE.equals(remote.get("isPrivate")));
            repo.setDefaultBranch(remote.get("default_branch") != null
            ? String.valueOf(remote.get("default_branch"))
                    : "main");
            repo.setLanguage(remote.get("language") != null ? String.valueOf(remote.get("language")) : null);
            repo.setHtmlUrl(remote.get("html_url") != null ? String.valueOf(remote.get("html_url")) : null);
            repo.setDescription(remote.get("description") != null ? String.valueOf(remote.get("description")) : null);
            repo.setUpdatedAt(Instant.now());
            if (repo.getOwner() == null || repo.getOwner().isBlank()) {
                Object ownerObj = remote.get("owner");
                if (ownerObj instanceof Map<?, ?> ownerMap && ownerMap.get("login") != null) {
                    repo.setOwner(String.valueOf(ownerMap.get("login")));
                }
            }
            saved.add(repoRepository.save(repo));
        }
            return saved.stream()
                    .sorted((a,b)-> a.getFullName().compareToIgnoreCase(b.getFullName()))
                    .map(this::toResponse)
                    .toList();

    }


    @Transactional(readOnly= true)
    public List<RepositoryResponse> listStored(UUID userId){
        return repoRepository.findByUserIdOrderByFullNameAsc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly= true)
    public Repository requireOwned(UUID repoId, UUID userId){
        return repoRepository.findByIdAndUserId(repoId, userId)
                .orElseThrow(()-> new NotFoundException("Repository not found"));
    }

    @Transactional(readOnly= true)
    public Repository requiredOwned(UUID repoId, UUID userId){
        return requireOwned(repoId, userId);
    }

    @Transactional(readOnly= true)
    public IndexStatusResponse status(UUID repoId, UUID userId){
        Repository repo = requiredOwned(repoId, userId);

        return new IndexStatusResponse(
                repo.getId(),
                repo.getIndexStatus(),
                repo.getFilesTotal(),
                repo.getFilesProcessed(),
                repo.getChunkCount(),
                repo.getIndexedAt(),
                repo.getErrorMessage());

    }


    public  RepositoryResponse toResponse(Repository repository) {
        if (repository == null) {
            return null;
        }

        return new RepositoryResponse(
                repository.getId(),
                repository.getGithubRepoId(),
                repository.getOwner(),
                repository.getName(),
                repository.getFullName(),
                repository.isPrivate(),
                repository.getDefaultBranch(),
                repository.getLanguage(),
                repository.getHtmlUrl(),
                repository.getDescription(),
                repository.getIndexStatus(),
                repository.getIndexedAt(),
                repository.getChunkCount(),
                repository.getFilesTotal(),
                repository.getFilesProcessed(),
                repository.getErrorMessage()
        );
    }


    private static Long toLong(Object value){
        if(value instanceof Number number){
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }




}
