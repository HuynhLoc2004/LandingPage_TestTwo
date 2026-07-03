package com.example.back_end.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final Random OTP_RANDOM = new SecureRandom();

    @Autowired
    private JavaMailSender emailSender;

    @Autowired
    private ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ConcurrentHashMap<String, String> otpCache = new ConcurrentHashMap<>();

    @Value("${MAIL_PROVIDER:smtp}")
    private String mailProvider;

    @Value("${MAIL_FROM:${spring.mail.username}}")
    private String fromEmail;

    @Value("${RESEND_API_KEY:}")
    private String resendApiKey;

    @Value("${RESEND_API_URL:https://api.resend.com/emails}")
    private String resendApiUrl;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:465}")
    private int mailPort;

    @Value("${spring.mail.username}")
    private String mailUsername;

    @Value("${spring.mail.password}")
    private String mailPassword;

    public static class EmailDeliveryException extends RuntimeException {
        private final String errorCode;

        public EmailDeliveryException(String errorCode, String message, Throwable cause) {
            super(message, cause);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }

    public void sendSimpleMessage(String to, String subject, String text) {
        if ("resend".equalsIgnoreCase(mailProvider)) {
            sendWithResend(to, subject, text);
            return;
        }

        try {
            emailSender.send(createMessage(to, subject, text));
        } catch (MailException exception) {
            logger.warn("Primary email send failed on {}:{}; trying Gmail fallback transport", mailHost, mailPort, exception);
            sendWithFallbackTransport(to, subject, text, exception);
        }
    }

    private void sendWithResend(String to, String subject, String text) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            logger.error("RESEND_API_KEY is missing");
            throw new EmailDeliveryException(
                    "RESEND_API_KEY_MISSING",
                    "Email service is not configured. Please try again later.",
                    null
            );
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "from", fromEmail,
                    "to", List.of(to),
                    "subject", subject,
                    "text", text
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(resendApiUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                logger.error("Resend email failed with status {} and body {}", response.statusCode(), response.body());
                throw new EmailDeliveryException(
                        "RESEND_SEND_FAILED",
                        "Email service is temporarily unavailable. Please try again later.",
                        null
                );
            }
        } catch (JsonProcessingException exception) {
            logger.error("Failed to build Resend email request", exception);
            throw new EmailDeliveryException(
                    "RESEND_REQUEST_FAILED",
                    "Email service is temporarily unavailable. Please try again later.",
                    exception
            );
        } catch (IOException exception) {
            logger.error("Failed to connect to Resend", exception);
            throw new EmailDeliveryException(
                    "RESEND_CONNECT_FAILED",
                    "Email service is temporarily unavailable. Please try again later.",
                    exception
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            logger.error("Interrupted while sending email with Resend", exception);
            throw new EmailDeliveryException(
                    "RESEND_SEND_INTERRUPTED",
                    "Email service is temporarily unavailable. Please try again later.",
                    exception
            );
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
            throw new EmailDeliveryException(
                    classifyMailFailure(primaryException, fallbackException),
                    "Email service is temporarily unavailable. Please try again later.",
                    fallbackException
            );
        }
    }

    private String classifyMailFailure(Throwable primaryException, Throwable fallbackException) {
        String failureText = (rootCauseMessage(primaryException) + " " + rootCauseMessage(fallbackException)).toLowerCase();

        if (failureText.contains("auth") || failureText.contains("username") || failureText.contains("password")
                || failureText.contains("credentials")) {
            return "SMTP_AUTH_FAILED";
        }

        if (failureText.contains("timed out") || failureText.contains("timeout")) {
            return "SMTP_CONNECT_TIMEOUT";
        }

        if (failureText.contains("couldn't connect") || failureText.contains("connection refused")
                || failureText.contains("unknownhost")) {
            return "SMTP_CONNECT_FAILED";
        }

        if (failureText.contains("ssl") || failureText.contains("handshake") || failureText.contains("certificate")) {
            return "SMTP_TLS_FAILED";
        }

        return "SMTP_SEND_FAILED";
    }

    private String rootCauseMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current != null && current.getCause() != null) {
            current = current.getCause();
        }
        return current == null || current.getMessage() == null ? "" : current.getMessage();
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
        properties.put("mail.smtp.connectiontimeout", "5000");
        properties.put("mail.smtp.timeout", "5000");
        properties.put("mail.smtp.writetimeout", "5000");

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
