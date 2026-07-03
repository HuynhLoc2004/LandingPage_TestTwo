package com.example.back_end.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Properties;
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

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:465}")
    private int mailPort;

    @Value("${spring.mail.username}")
    private String mailUsername;

    @Value("${spring.mail.password}")
    private String mailPassword;

    public void sendSimpleMessage(String to, String subject, String text) {
        try {
            emailSender.send(createMessage(to, subject, text));
        } catch (MailException exception) {
            logger.warn("Primary email send failed on {}:{}; trying Gmail fallback transport", mailHost, mailPort, exception);
            sendWithFallbackTransport(to, subject, text, exception);
        }
    }

    private SimpleMailMessage createMessage(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        return message;
    }

    private void sendWithFallbackTransport(String to, String subject, String text, MailException primaryException) {
        try {
            JavaMailSenderImpl fallbackSender = createFallbackSender();
            fallbackSender.send(createMessage(to, subject, text));
        } catch (MailException fallbackException) {
            logger.error("Failed to send email to {} after primary and fallback transports", to, fallbackException);
            throw new IllegalStateException("Email service is temporarily unavailable. Please try again later.", primaryException);
        }
    }

    private JavaMailSenderImpl createFallbackSender() {
        boolean fallbackToStartTls = mailPort == 465;
        int fallbackPort = fallbackToStartTls ? 587 : 465;

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mailHost);
        sender.setPort(fallbackPort);
        sender.setUsername(mailUsername);
        sender.setPassword(mailPassword);
        sender.setProtocol("smtp");
        sender.setDefaultEncoding("UTF-8");

        Properties properties = sender.getJavaMailProperties();
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.connectiontimeout", "20000");
        properties.put("mail.smtp.timeout", "20000");
        properties.put("mail.smtp.writetimeout", "20000");

        if (fallbackToStartTls) {
            properties.put("mail.smtp.starttls.enable", "true");
            properties.put("mail.smtp.starttls.required", "true");
            properties.put("mail.smtp.ssl.enable", "false");
        } else {
            properties.put("mail.smtp.starttls.enable", "false");
            properties.put("mail.smtp.starttls.required", "false");
            properties.put("mail.smtp.ssl.enable", "true");
            properties.put("mail.smtp.ssl.trust", mailHost);
        }

        return sender;
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
