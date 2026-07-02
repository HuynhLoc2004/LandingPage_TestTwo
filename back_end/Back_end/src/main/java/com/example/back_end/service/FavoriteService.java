package com.example.back_end.service;

import com.example.back_end.customize.AppException;
import com.example.back_end.entity.FavoriteList;
import com.example.back_end.entity.ProductSpec;
import com.example.back_end.entity.UserEntity;
import com.example.back_end.repository.FavoriteListRepository;
import com.example.back_end.repository.ProductSpecRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteListRepository favoriteListRepository;
    private final UserRepository userRepository;
    private final ProductSpecRepository productSpecRepository;

    @Transactional
    public FavoriteList addProductToFavoriteList(Long userId, Integer productId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        ProductSpec product = productSpecRepository.findById(productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));

        FavoriteList favoriteList = favoriteListRepository.findByUser(user)
                .orElseGet(() -> {
                    FavoriteList newFavoriteList = FavoriteList.builder().user(user).build();
                    user.setFavoriteList(newFavoriteList); // Set the favorite list for the user
                    return favoriteListRepository.save(newFavoriteList);
                });

        favoriteList.getProducts().add(product);
        return favoriteListRepository.save(favoriteList);
    }

    @Transactional
    public FavoriteList removeProductFromFavoriteList(Long userId, Integer productId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        ProductSpec product = productSpecRepository.findById(productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));

        FavoriteList favoriteList = favoriteListRepository.findByUser(user)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Favorite list not found for user"));

        favoriteList.getProducts().remove(product);
        return favoriteListRepository.save(favoriteList);
    }

    public Set<ProductSpec> getFavoriteList(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        return favoriteListRepository.findByUser(user)
                .map(FavoriteList::getProducts)
                .orElse(java.util.Collections.emptySet());
    }
}