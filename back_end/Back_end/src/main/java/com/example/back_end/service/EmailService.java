package com.example.back_end.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final Random OTP_RANDOM = new SecureRandom();

    @Autowired
    private JavaMailSender emailSender;

    private final ConcurrentHashMap<String, String> otpCache = new ConcurrentHashMap<>();

    @Value("${MAIL_FROM:${spring.mail.username}}")
    private String fromEmail;

    public void sendSimpleMessage(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            emailSender.send(message);
        } catch (MailException exception) {
            logger.error("Failed to send email to {}", to, exception);
            throw new IllegalStateException("Email service is temporarily unavailable. Please try again later.", exception);
        }
    }

    public String generateAndSendOtp(String email) {
        String otp = String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
        sendSimpleMessage(email, "Your Subscription OTP", "Your OTP is: " + otp);
        otpCache.put(email, otp);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        if (otpCache.containsKey(email) && otpCache.get(email).equals(otp)) {
            otpCache.remove(email);
            return true;
        }
        return false;
    }
}
