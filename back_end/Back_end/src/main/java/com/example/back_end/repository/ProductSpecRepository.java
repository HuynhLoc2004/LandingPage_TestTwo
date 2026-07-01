package com.example.back_end.repository;

import com.example.back_end.entity.ProductSpec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductSpecRepository extends JpaRepository<ProductSpec, Integer> {
    boolean existsByProductName(String productName);
}