package com.example.back_end.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ProductResponse {
    private Integer productId;
    private String productName;
    private Double price;
    private String imageUrl;
}