package com.devpilot.controllers;

import com.devpilot.dto.IndexStatusResponse;
import com.devpilot.dto.RepositoryResponse;
import com.devpilot.entity.Repository;
import com.devpilot.security.CurrentUser;
import com.devpilot.services.RepoService;
import com.devpilot.services.indexing.IndexingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/repos")
@RequiredArgsConstructor
public class RepoController {

    private final RepoService repoService;
    private final IndexingService indexingService;
    private final CurrentUser currentUser;

    @GetMapping
    public List<RepositoryResponse> list(
            @RequestParam(name = "refresh", defaultValue = "true")
            boolean refresh) {
        UUID userId = currentUser.require().getId();
        if (refresh) {
            return repoService.syncAndListRepo(userId);
        }

        return repoService.listStored(userId);
    }

    @GetMapping("/{id}")
    public RepositoryResponse get(@PathVariable UUID id) {
        UUID userId = currentUser.require().getId();
        return repoService.toResponse(repoService.requiredOwned(id, userId));
    }

    @GetMapping("/{id}/status")
    public IndexStatusResponse status(@PathVariable UUID id) {
        UUID userId = currentUser.require().getId();
        return repoService.status(id, userId);
    }

    @PostMapping("/{id}/index")
    public ResponseEntity<RepositoryResponse> startIndexing(@PathVariable UUID id) {
        UUID userId = currentUser.require().getId();
        Repository repo = indexingService.startIndexing(id, userId);
        indexingService.indexAsync(id, userId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(repoService.toResponse(repo));
    }



}

