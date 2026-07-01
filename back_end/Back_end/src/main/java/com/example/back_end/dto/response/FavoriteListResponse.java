package com.example.back_end.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class FavoriteListResponse {
    private Long id;
    private Long userId;
    private List<ProductResponse> products;
}