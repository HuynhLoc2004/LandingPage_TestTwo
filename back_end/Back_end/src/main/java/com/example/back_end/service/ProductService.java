package com.example.back_end.service;

import com.example.back_end.entity.ProductSpec;
import com.example.back_end.repository.ProductSpecRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductSpecRepository productSpecRepository;

    public Optional<ProductSpec> getProductSpecById(Integer id) {
        return productSpecRepository.findById(id);
    }

    @Cacheable("products")
    public List<ProductSpec> getAllProducts() {
        return productSpecRepository.findAll();
    }
}
