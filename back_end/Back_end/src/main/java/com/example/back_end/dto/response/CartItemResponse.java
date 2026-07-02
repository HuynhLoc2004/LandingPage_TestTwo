package com.example.back_end.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CartItemResponse {
    private Long cartItemId;
    private Integer productId;
    private String productName;
    private Double price;
    private String imageUrl;
    private Integer quantity;
    private String selectedColor;
    private String selectedSize;
}