package com.example.back_end.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_specs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "productId") // Add EqualsAndHashCode based on productId
public class ProductSpec {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer productId;
    private Double heightMm;
    private Double widthMm;
    private Double depthMm;
    private String wirelessNetwork;
    private String protocols;
    private String chipsetArch;
    private String coresMatrix;
    private String productName;
    private Double price;
    private String imageUrl;
}
