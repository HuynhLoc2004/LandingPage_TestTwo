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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Locale;
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

    @Value("${GEMINI_MODEL:gemini-2.5-flash-lite}")
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

        List<Map<String, Object>> toolResults = runToolsForMessage(message, currentUser);
        return askGemini(toolResults, message);
    }

    private List<Map<String, Object>> runToolsForMessage(String message, UserEntity currentUser) {
        String normalizedMessage = normalize(message);
        List<Map<String, Object>> results = new ArrayList<>();

        boolean asksFavorites = containsAny(normalizedMessage,
                "favorite", "favorites", "favourite", "yeu thich", "yeuthich", "yêu thích", "muc yeu thich", "wishlist");
        boolean asksCart = containsAny(normalizedMessage,
                "cart", "gio hang", "giỏ hàng", "giohang", "shopping cart", "bag", "quantity", "so luong", "số lượng");
        boolean asksProducts = containsAny(normalizedMessage,
                "product", "products", "san pham", "sản phẩm", "price", "gia", "giá", "spec", "thong so", "thông số",
                "recommend", "tu van", "tư vấn", "chip", "wireless", "protocol", "size", "kich thuoc", "kích thước");

        if (asksCart) {
            results.add(getCartToolResult(currentUser));
        }

        if (asksFavorites) {
            results.add(getFavoritesToolResult(currentUser));
        }

        if (asksProducts || (!asksCart && !asksFavorites)) {
            results.add(getProductsToolResult());
        }

        if (currentUser != null && containsAny(normalizedMessage, "toi", "tôi", "minh", "mình", "account", "profile", "user")) {
            results.add(getUserToolResult(currentUser));
        }

        return results;
    }

    private Map<String, Object> getProductsToolResult() {
        List<Map<String, Object>> products = productSpecRepository.findAll()
                .stream()
                .limit(MAX_PRODUCTS_IN_CONTEXT)
                .map(this::productToMap)
                .toList();

        return toolResult("get_products", Map.of(
                "count", products.size(),
                "products", products
        ));
    }

    private Map<String, Object> getCartToolResult(UserEntity currentUser) {
        if (currentUser == null) {
            return toolResult("get_cart", Map.of(
                    "requiresLogin", true,
                    "message", "User must log in before cart data can be read."
            ));
        }

        Optional<Cart> cart = cartRepository.findByUserIdWithItems(currentUser.getId());
        List<Map<String, Object>> items = cart
                .map(Cart::getItems)
                .orElse(List.of())
                .stream()
                .map(this::cartItemToMap)
                .toList();
        int totalQuantity = items.stream()
                .mapToInt(item -> ((Number) item.getOrDefault("quantity", 0)).intValue())
                .sum();
        double subtotal = items.stream()
                .mapToDouble(item -> ((Number) item.getOrDefault("lineTotal", 0.0)).doubleValue())
                .sum();

        return toolResult("get_cart", Map.of(
                "count", items.size(),
                "totalQuantity", totalQuantity,
                "subtotal", subtotal,
                "items", items
        ));
    }

    private Map<String, Object> getFavoritesToolResult(UserEntity currentUser) {
        if (currentUser == null) {
            return toolResult("get_favorites", Map.of(
                    "requiresLogin", true,
                    "message", "User must log in before favorite products can be read."
            ));
        }

        List<Map<String, Object>> favorites = favoriteListRepository.findByUserIdWithProducts(currentUser.getId())
                .map(FavoriteList::getProducts)
                .orElse(java.util.Collections.emptySet())
                .stream()
                .map(this::productToMap)
                .toList();

        return toolResult("get_favorites", Map.of(
                "count", favorites.size(),
                "products", favorites
        ));
    }

    private Map<String, Object> getUserToolResult(UserEntity currentUser) {
        return toolResult("get_current_user", Map.of(
                "id", currentUser.getId(),
                "username", nullSafe(currentUser.getUsername())
        ));
    }

    private Map<String, Object> productToMap(ProductSpec product) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("productId", product.getProductId());
        data.put("productName", nullSafe(product.getProductName()));
        data.put("price", product.getPrice());
        data.put("imageUrl", nullSafe(product.getImageUrl()));
        data.put("heightMm", product.getHeightMm());
        data.put("widthMm", product.getWidthMm());
        data.put("depthMm", product.getDepthMm());
        data.put("wirelessNetwork", nullSafe(product.getWirelessNetwork()));
        data.put("protocols", nullSafe(product.getProtocols()));
        data.put("chipsetArch", nullSafe(product.getChipsetArch()));
        data.put("coresMatrix", nullSafe(product.getCoresMatrix()));
        return data;
    }

    private Map<String, Object> cartItemToMap(CartItem item) {
        ProductSpec product = item.getProduct();
        int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
        double price = product.getPrice() == null ? 0.0 : product.getPrice();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("cartItemId", item.getId());
        data.put("product", productToMap(product));
        data.put("quantity", quantity);
        data.put("selectedColor", nullSafe(item.getSelectedColor()));
        data.put("selectedSize", nullSafe(item.getSelectedSize()));
        data.put("lineTotal", price * quantity);
        return data;
    }

    private Map<String, Object> toolResult(String name, Map<String, Object> data) {
        return Map.of(
                "tool", name,
                "data", data
        );
    }

    private boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(normalize(needle))) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).trim();
    }

    private String askGemini(List<Map<String, Object>> toolResults, String userMessage) {
        try {
            String prompt = """
                    You are the AI assistant for this landing page shop.
                    The backend has already selected and executed database tools that match the user question.
                    Use only TOOL RESULTS as the source of truth for products, cart, favorites, and current user data.
                    If a tool result says requiresLogin=true, tell the user they need to log in before that data can be read.
                    Do not invent cart items, favorite products, prices, or specs that are not in TOOL RESULTS.
                    If TOOL RESULTS do not contain enough information, say what is missing and suggest the closest helpful next step.
                    Keep the answer concise, friendly, and in the same language as the user.

                    TOOL RESULTS JSON:
                    %s

                    USER QUESTION:
                    %s
                    """.formatted(objectMapper.writeValueAsString(toolResults), userMessage);

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
                throw mapGeminiError(response.statusCode());
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

    private AppException mapGeminiError(int statusCode) {
        if (statusCode == 400) {
            return new AppException(HttpStatus.BAD_GATEWAY, "Gemini rejected the request. Please check the model name and request format.");
        }
        if (statusCode == 401 || statusCode == 403) {
            return new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is invalid or does not have permission.");
        }
        if (statusCode == 404) {
            return new AppException(HttpStatus.BAD_GATEWAY, "Gemini model was not found. Please check GEMINI_MODEL.");
        }
        if (statusCode == 429) {
            return new AppException(HttpStatus.TOO_MANY_REQUESTS, "Gemini quota or rate limit reached. Please try again later.");
        }
        if (statusCode >= 500) {
            return new AppException(HttpStatus.BAD_GATEWAY, "Gemini service is temporarily unavailable.");
        }
        return new AppException(HttpStatus.BAD_GATEWAY, "Gemini request failed with status " + statusCode);
    }

    private String trimTrailingSlash(String value) {
        return value.replaceAll("/+$", "");
    }
}
