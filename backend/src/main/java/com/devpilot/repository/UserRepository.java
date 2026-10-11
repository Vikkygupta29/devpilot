package com.devpilot.repository;

import com.devpilot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface  UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByGithubId(Long githubId);
}
