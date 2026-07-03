package com.example.back_end.service;

import com.example.back_end.customize.AppException;
import com.example.back_end.dto.request.AddToCartRequest;
import com.example.back_end.dto.request.UpdateCartItemQuantityRequest;
import com.example.back_end.dto.response.CartItemResponse;
import com.example.back_end.dto.response.CartResponse;
import com.example.back_end.entity.Cart;
import com.example.back_end.entity.CartItem;
import com.example.back_end.entity.ProductSpec;
import com.example.back_end.entity.UserEntity;
import com.example.back_end.repository.CartRepository;
import com.example.back_end.repository.ProductSpecRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductSpecRepository productSpecRepository;

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        return cartRepository.findByUserIdWithItems(userId)
                .map(cart -> toCartResponse(cart, "Cart loaded successfully"))
                .orElseGet(() -> emptyCartResponse(user.getId()));
    }

    @Transactional
    public CartResponse addProductToCart(Long userId, AddToCartRequest request) {
        if (request.getProductId() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Product id is required");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        ProductSpec product = productSpecRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));

        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder().user(user).build();
                    user.setCart(newCart);
                    return cartRepository.save(newCart);
                });

        int quantityToAdd = request.getQuantity() == null || request.getQuantity() < 1 ? 1 : request.getQuantity();
        CartItem cartItem = findMatchingItem(cart, product, request.getSelectedColor(), request.getSelectedSize());

        if (cartItem == null) {
            cartItem = CartItem.builder()
                    .product(product)
                    .quantity(quantityToAdd)
                    .selectedColor(request.getSelectedColor())
                    .selectedSize(request.getSelectedSize())
                    .build();
            cart.addItem(cartItem);
        } else {
            cartItem.setQuantity(cartItem.getQuantity() + quantityToAdd);
        }

        Cart savedCart = cartRepository.save(cart);
        return toCartResponse(savedCart, "Product added to cart successfully");
    }

    @Transactional
    public CartResponse updateCartItemQuantity(Long userId, Long cartItemId, UpdateCartItemQuantityRequest request) {
        if (cartItemId == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Cart item id is required");
        }
        if (request.getQuantity() == null || request.getQuantity() < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Quantity must be greater than or equal to 0");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Cart not found for user"));

        CartItem cartItem = cart.getItems().stream()
                .filter(item -> Objects.equals(item.getId(), cartItemId))
                .findFirst()
                .orElse(null);

        if (cartItem == null) {
            return toCartResponse(cart, "Cart item no longer exists");
        }

        if (request.getQuantity() == 0) {
            cart.getItems().remove(cartItem);
        } else {
            cartItem.setQuantity(request.getQuantity());
        }

        Cart savedCart = cartRepository.save(cart);
        return toCartResponse(savedCart, "Cart item quantity updated successfully");
    }

    @Transactional
    public CartResponse removeCartItem(Long userId, Long cartItemId) {
        if (cartItemId == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Cart item id is required");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Cart not found for user"));

        cart.getItems().removeIf(item -> Objects.equals(item.getId(), cartItemId));

        Cart savedCart = cartRepository.save(cart);
        return toCartResponse(savedCart, "Cart item removed successfully");
    }

    private CartItem findMatchingItem(Cart cart, ProductSpec product, String selectedColor, String selectedSize) {
        return cart.getItems().stream()
                .filter(item -> Objects.equals(item.getProduct().getProductId(), product.getProductId()))
                .filter(item -> Objects.equals(item.getSelectedColor(), selectedColor))
                .filter(item -> Objects.equals(item.getSelectedSize(), selectedSize))
                .findFirst()
                .orElse(null);
    }

    private CartResponse toCartResponse(Cart cart, String message) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(this::toCartItemResponse)
                .toList();

        int totalQuantity = itemResponses.stream()
                .mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity())
                .sum();

        double subtotal = itemResponses.stream()
                .mapToDouble(item -> (item.getPrice() == null ? 0 : item.getPrice()) * (item.getQuantity() == null ? 0 : item.getQuantity()))
                .sum();

        return CartResponse.builder()
                .cartId(cart.getId())
                .userId(cart.getUser().getId())
                .items(itemResponses)
                .totalQuantity(totalQuantity)
                .subtotal(subtotal)
                .message(message)
                .build();
    }

    private CartResponse emptyCartResponse(Long userId) {
        return CartResponse.builder()
                .userId(userId)
                .items(Collections.emptyList())
                .totalQuantity(0)
                .subtotal(0.0)
                .message("Cart is empty")
                .build();
    }

    private CartItemResponse toCartItemResponse(CartItem item) {
        ProductSpec product = item.getProduct();
        return CartItemResponse.builder()
                .cartItemId(item.getId())
                .productId(product.getProductId())
                .productName(product.getProductName())
                .price(product.getPrice())
                .imageUrl(product.getImageUrl())
                .quantity(item.getQuantity())
                .selectedColor(item.getSelectedColor())
                .selectedSize(item.getSelectedSize())
                .build();
    }
}
