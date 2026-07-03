package com.example.back_end.controller;

import com.example.back_end.customize.AppException;
import com.example.back_end.dto.request.AddToCartRequest;
import com.example.back_end.dto.request.UpdateCartItemQuantityRequest;
import com.example.back_end.dto.response.CartResponse;
import com.example.back_end.entity.UserEntity;
import com.example.back_end.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        if (currentUser == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return ResponseEntity.ok(cartService.getCart(currentUser.getId()));
    }

    @PostMapping("/add")
    public ResponseEntity<CartResponse> addProductToCart(
            @AuthenticationPrincipal UserEntity currentUser,
            @RequestBody AddToCartRequest request
    ) {
        if (currentUser == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return ResponseEntity.ok(cartService.addProductToCart(currentUser.getId(), request));
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> updateCartItemQuantity(
            @AuthenticationPrincipal UserEntity currentUser,
            @PathVariable Long cartItemId,
            @RequestBody UpdateCartItemQuantityRequest request
    ) {
        if (currentUser == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return ResponseEntity.ok(cartService.updateCartItemQuantity(currentUser.getId(), cartItemId, request));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> removeCartItem(
            @AuthenticationPrincipal UserEntity currentUser,
            @PathVariable Long cartItemId
    ) {
        if (currentUser == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return ResponseEntity.ok(cartService.removeCartItem(currentUser.getId(), cartItemId));
    }
}
