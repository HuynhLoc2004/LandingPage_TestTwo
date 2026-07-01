package com.example.back_end.controller;

import com.example.back_end.entity.ProductSpec;
import com.example.back_end.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductSpec>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductSpec> getProductSpecById(@PathVariable Integer id) {
        Optional<ProductSpec> productSpec = productService.getProductSpecById(id);
        return productSpec.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
