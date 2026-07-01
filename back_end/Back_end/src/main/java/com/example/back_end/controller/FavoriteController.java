package com.example.back_end.controller;

import com.example.back_end.customize.AppException;
import com.example.back_end.entity.ProductSpec;
import com.example.back_end.entity.UserEntity;
import com.example.back_end.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/add")
    public ResponseEntity<String> addProductToFavoriteList(
            @AuthenticationPrincipal UserEntity currentUser,
            @RequestParam Integer productId
    ) {
        if (currentUser == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        favoriteService.addProductToFavoriteList(currentUser.getId(), productId);
        return ResponseEntity.ok("Product added to favorite list successfully");
    }

    @PostMapping("/remove")
    public ResponseEntity<String> removeProductFromFavoriteList(
            @AuthenticationPrincipal UserEntity currentUser,
            @RequestParam Integer productId
    ) {
        if (currentUser == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        favoriteService.removeProductFromFavoriteList(currentUser.getId(), productId);
        return ResponseEntity.ok("Product removed from favorite list successfully");
    }

    @GetMapping
    public ResponseEntity<Set<ProductSpec>> getFavoriteList(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        if (currentUser == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        Set<ProductSpec> favoriteProducts = favoriteService.getFavoriteList(currentUser.getId());
        return ResponseEntity.ok(favoriteProducts);
    }
}