package com.example.back_end.service;

import com.example.back_end.customize.AppException;
import com.example.back_end.entity.Cart;
import com.example.back_end.entity.CartItem;
import com.example.back_end.entity.FavoriteList;
import com.example.back_end.entity.ProductSpec;
import com.example.back_end.entity.UserEntity;
import com.example.back_end.repository.CartRepository;
import com.example.back_end.repository.FavoriteListRepository;
import com.example.back_end.repository.ProductSpecRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GeminiChatService {

    private static final int MAX_PRODUCTS_IN_CONTEXT = 20;

    private final ProductSpecRepository productSpecRepository;
    private final CartRepository cartRepository;
    private final FavoriteListRepository favoriteListRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GEMINI_MODEL:gemini-2.0-flash}")
    private String geminiModel;

    @Value("${GEMINI_API_URL:https://generativelanguage.googleapis.com/v1beta}")
    private String geminiApiUrl;

    public GeminiChatService(
            ProductSpecRepository productSpecRepository,
            CartRepository cartRepository,
            FavoriteListRepository favoriteListRepository,
            ObjectMapper objectMapper
    ) {
        this.productSpecRepository = productSpecRepository;
        this.cartRepository = cartRepository;
        this.favoriteListRepository = favoriteListRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Transactional(readOnly = true)
    public String chat(String message, UserEntity currentUser) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is missing");
        }

        String context = buildDatabaseContext(currentUser);
        return askGemini(context, message);
    }

    private String buildDatabaseContext(UserEntity currentUser) {
        StringBuilder context = new StringBuilder();
        context.append("DATABASE CONTEXT\n");
        context.append("Products available in the shop:\n");

        List<ProductSpec> products = productSpecRepository.findAll()
                .stream()
                .limit(MAX_PRODUCTS_IN_CONTEXT)
                .toList();

        if (products.isEmpty()) {
            context.append("- No products found.\n");
        } else {
            products.forEach(product -> context
                    .append("- ID ").append(product.getProductId())
                    .append(": ").append(nullSafe(product.getProductName()))
                    .append(", price ").append(product.getPrice())
                    .append(", size H/W/D mm ")
                    .append(product.getHeightMm()).append("/")
                    .append(product.getWidthMm()).append("/")
                    .append(product.getDepthMm())
                    .append(", wireless network: ").append(nullSafe(product.getWirelessNetwork()))
                    .append(", protocols: ").append(nullSafe(product.getProtocols()))
                    .append(", chipset: ").append(nullSafe(product.getChipsetArch()))
                    .append(", cores: ").append(nullSafe(product.getCoresMatrix()))
                    .append("\n"));
        }

        if (currentUser == null) {
            context.append("Current user: guest, no cart or favorites available.\n");
            return context.toString();
        }

        Long userId = currentUser.getId();
        context.append("Current user ID: ").append(userId).append("\n");

        Optional<Cart> cart = cartRepository.findByUserIdWithItems(userId);
        context.append("Current cart:\n");
        if (cart.isEmpty() || cart.get().getItems().isEmpty()) {
            context.append("- Empty\n");
        } else {
            for (CartItem item : cart.get().getItems()) {
                ProductSpec product = item.getProduct();
                context.append("- ")
                        .append(nullSafe(product.getProductName()))
                        .append(", quantity ").append(item.getQuantity())
                        .append(", color ").append(nullSafe(item.getSelectedColor()))
                        .append(", size ").append(nullSafe(item.getSelectedSize()))
                        .append(", price ").append(product.getPrice())
                        .append("\n");
            }
        }

        Optional<FavoriteList> favoriteList = favoriteListRepository.findByUserIdWithProducts(userId);
        context.append("Favorite products:\n");
        if (favoriteList.isEmpty() || favoriteList.get().getProducts().isEmpty()) {
            context.append("- Empty\n");
        } else {
            favoriteList.get().getProducts().forEach(product -> context
                    .append("- ")
                    .append(nullSafe(product.getProductName()))
                    .append(", price ").append(product.getPrice())
                    .append("\n"));
        }

        return context.toString();
    }

    private String askGemini(String context, String userMessage) {
        try {
            String prompt = """
                    You are the AI assistant for this landing page shop.
                    Use the DATABASE CONTEXT below as the source of truth.
                    If the user asks about products, cart, favorites, specs, price, or recommendations, answer from the context.
                    If the context does not contain enough information, say what is missing and suggest the closest helpful next step.
                    Keep the answer concise, friendly, and in the same language as the user.

                    %s

                    USER QUESTION:
                    %s
                    """.formatted(context, userMessage);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", prompt))
                    )),
                    "generationConfig", Map.of(
                            "temperature", 0.4,
                            "maxOutputTokens", 500
                    )
            );

            String encodedKey = URLEncoder.encode(geminiApiKey.trim(), StandardCharsets.UTF_8);
            String encodedModel = geminiModel.trim().startsWith("models/")
                    ? geminiModel.trim().substring("models/".length())
                    : geminiModel.trim();
            URI uri = URI.create("%s/models/%s:generateContent?key=%s"
                    .formatted(trimTrailingSlash(geminiApiUrl), encodedModel, encodedKey));

            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new AppException(
                        HttpStatus.BAD_GATEWAY,
                        "Gemini request failed with status " + response.statusCode()
                );
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "Gemini returned an empty answer");
            }

            return textNode.asText();
        } catch (AppException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AppException(HttpStatus.BAD_GATEWAY, "Gemini request was interrupted");
        } catch (Exception exception) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Could not connect to Gemini");
        }
    }

    private String nullSafe(Object value) {
        return value == null ? "N/A" : value.toString();
    }

    private String trimTrailingSlash(String value) {
        return value.replaceAll("/+$", "");
    }
}
