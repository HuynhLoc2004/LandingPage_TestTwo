package com.example.back_end.controller;

import com.example.back_end.entity.NotificationEmail;
import com.example.back_end.entity.UserEntity;
import com.example.back_end.repository.NotificationEmailRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
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
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        try {
            emailService.generateAndSendOtp(email);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Error sending email: " + e.getMessage()));
        }
    }

    private final Map<String, String> subscriptionCache = new java.util.concurrent.ConcurrentHashMap<>();

    @PostMapping("/verify")
    public ResponseEntity<?> verifySubscription(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));
        }

        if (emailService.verifyOtp(email, otp)) {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<UserEntity> userOpt = userRepository.findByUsername(username);

            if (userOpt.isPresent()) {
                UserEntity user = userOpt.get();
                
                NotificationEmail notificationEmail = new NotificationEmail();
                notificationEmail.setEmail(email);
                notificationEmail.setUser(user);
                
                user.setNotificationEmail(notificationEmail);
                userRepository.save(user);

                // Cập nhật RAM cache
                subscriptionCache.put(username, email);

                // Send WebSocket message
                messagingTemplate.convertAndSend("/topic/subscription", Map.of("message", "Subscription successful", "email", email));

                // Schedule welcome email 5 minutes later
                taskScheduler.schedule(() -> {
                    emailService.sendSimpleMessage(email, "Welcome to our Newsletter!", "Thank you for subscribing. We will keep you updated with the latest news.");
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
