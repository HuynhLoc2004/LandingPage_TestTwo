package com.example.back_end.controller;

import com.example.back_end.entity.NotificationEmail;
import com.example.back_end.entity.UserEntity;
import com.example.back_end.repository.NotificationEmailRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.EmailService;
import com.example.back_end.service.EmailService.EmailDeliveryException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/subscribe")
public class SubscriptionController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationEmailRepository notificationEmailRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private TaskScheduler taskScheduler;

    @PostMapping("/request")
    public ResponseEntity<?> requestSubscription(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        String normalizedEmail = email.trim().toLowerCase();
        try {
            emailService.generateAndSendOtp(normalizedEmail);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
        } catch (EmailDeliveryException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "message", exception.getMessage(),
                            "mailErrorCode", exception.getErrorCode()
                    ));
        }
    }

    private final Map<String, String> subscriptionCache = new java.util.concurrent.ConcurrentHashMap<>();

    @PostMapping("/verify")
    public ResponseEntity<?> verifySubscription(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));
        }

        String normalizedEmail = email.trim().toLowerCase();

        if (emailService.verifyOtp(normalizedEmail, otp.trim())) {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<UserEntity> userOpt = userRepository.findByUsername(username);

            if (userOpt.isPresent()) {
                UserEntity user = userOpt.get();

                Optional<NotificationEmail> existingEmailOpt = notificationEmailRepository.findByEmail(normalizedEmail);
                if (existingEmailOpt.isPresent()) {
                    NotificationEmail existingEmail = existingEmailOpt.get();
                    if (!existingEmail.getUser().getId().equals(user.getId())) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("message", "This email is already subscribed by another account"));
                    }

                    user.setNotificationEmail(existingEmail);
                } else {
                    NotificationEmail currentEmail = user.getNotificationEmail();
                    if (currentEmail != null && !currentEmail.getEmail().equalsIgnoreCase(normalizedEmail)) {
                        user.setNotificationEmail(null);
                        userRepository.save(user);
                        notificationEmailRepository.delete(currentEmail);
                    }

                    NotificationEmail notificationEmail = new NotificationEmail();
                    notificationEmail.setEmail(normalizedEmail);
                    notificationEmail.setUser(user);
                    notificationEmailRepository.save(notificationEmail);
                    user.setNotificationEmail(notificationEmail);
                }

                // Cập nhật RAM cache
                subscriptionCache.put(username, normalizedEmail);

                // Send WebSocket message
                messagingTemplate.convertAndSend("/topic/subscription", Map.of("message", "Subscription successful", "email", normalizedEmail));

                // Schedule welcome email 5 minutes later
                taskScheduler.schedule(() -> {
                    emailService.sendSimpleMessage(normalizedEmail, "Welcome to our Newsletter!", "Thank you for subscribing. We will keep you updated with the latest news.");
                }, Instant.now().plusSeconds(300));

                return ResponseEntity.ok(Map.of("message", "Subscription verified successfully"));
            } else {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid OTP"));
    }

    @GetMapping("/status")
    public ResponseEntity<?> getSubscriptionStatus() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (username != null && !username.equals("anonymousUser")) {
            // Đọc từ RAM cache trước cho cực nhanh
            if (subscriptionCache.containsKey(username)) {
                String cachedEmail = subscriptionCache.get(username);
                if (!cachedEmail.isEmpty()) {
                    return ResponseEntity.ok(Map.of("subscribed", true, "email", cachedEmail));
                } else {
                    return ResponseEntity.ok(Map.of("subscribed", false));
                }
            }

            Optional<UserEntity> userOpt = userRepository.findByUsername(username);
            if (userOpt.isPresent()) {
                UserEntity user = userOpt.get();
                if (user.getNotificationEmail() != null) {
                    String email = user.getNotificationEmail().getEmail();
                    subscriptionCache.put(username, email);
                    return ResponseEntity.ok(Map.of("subscribed", true, "email", email));
                } else {
                    subscriptionCache.put(username, "");
                }
            }
        }
        return ResponseEntity.ok(Map.of("subscribed", false));
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();
            if (user.getNotificationEmail() != null) {
                NotificationEmail emailEntity = user.getNotificationEmail();
                user.setNotificationEmail(null);
                userRepository.save(user);
                notificationEmailRepository.delete(emailEntity);
                
                // Cập nhật RAM cache
                subscriptionCache.put(username, "");
                
                return ResponseEntity.ok(Map.of("message", "Unsubscribed successfully"));
            }
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Not subscribed"));
    }
}
