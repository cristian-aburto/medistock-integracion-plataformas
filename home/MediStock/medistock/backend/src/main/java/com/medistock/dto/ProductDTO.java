package com.medistock.dto;

import com.medistock.model.Product;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProductDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 200)
        private String name;

        @Size(max = 500)
        private String description;

        @NotBlank(message = "El SKU es obligatorio")
        private String sku;

        @NotNull(message = "La categoría es obligatoria")
        private Product.ProductCategory category;

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.01")
        private BigDecimal price;

        @NotNull(message = "El stock es obligatorio")
        @Min(0)
        private Integer stockQuantity;

        @Min(0)
        private Integer minimumStock;

        private String manufacturer;
        private String batchNumber;
        private LocalDate expiryDate;
        private Product.ProductStatus status;
        private String imageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private String sku;
        private Product.ProductCategory category;
        private BigDecimal price;
        private Integer stockQuantity;
        private Integer minimumStock;
        private String manufacturer;
        private String batchNumber;
        private LocalDate expiryDate;
        private Product.ProductStatus status;
        private boolean lowStock;
        private boolean expiringSoon;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String imageUrl;

        public static Response fromEntity(Product p) {
            return Response.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .description(p.getDescription())
                    .sku(p.getSku())
                    .category(p.getCategory())
                    .price(p.getPrice())
                    .stockQuantity(p.getStockQuantity())
                    .minimumStock(p.getMinimumStock())
                    .manufacturer(p.getManufacturer())
                    .batchNumber(p.getBatchNumber())
                    .expiryDate(p.getExpiryDate())
                    .status(p.getStatus())
                    .lowStock(p.isLowStock())
                    .expiringSoon(p.isExpiringSoon())
                    .createdAt(p.getCreatedAt())
                    .updatedAt(p.getUpdatedAt())
                    .imageUrl(p.getImageUrl())
                    .build();
        }
    }
}
