package com.example.back_end.repository;

import com.example.back_end.entity.NotificationEmail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificationEmailRepository extends JpaRepository<NotificationEmail, Long> {
    Optional<NotificationEmail> findByEmail(String email);
}
