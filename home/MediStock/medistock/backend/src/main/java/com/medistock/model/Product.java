package com.medistock.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Product name is required")
    @Size(max = 200)
    @Column(nullable = false)
    private String name;

    @Size(max = 500)
    private String description;

    @NotBlank(message = "SKU is required")
    @Column(unique = true, nullable = false, length = 50)
    private String sku;

    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductCategory category;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0)
    @Column(nullable = false)
    private Integer stockQuantity;

    @Min(value = 0)
    @Column(nullable = false)
    private Integer minimumStock = 10;
    
    private String imageUrl;
    private String manufacturer;
    private String batchNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status = ProductStatus.ACTIVE;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ProductCategory {
        MEDICAMENTO, INSTRUMENTAL, CONSUMIBLE, EQUIPO, REACTIVO, OTRO
    }

    public enum ProductStatus {
        ACTIVE, INACTIVE, DISCONTINUED, OUT_OF_STOCK
    }

    @Transient
    public boolean isLowStock() {
        return stockQuantity != null && minimumStock != null && stockQuantity <= minimumStock;
    }

    @Transient
    public boolean isExpiringSoon() {
        if (expiryDate == null) return false;
        return expiryDate.isBefore(LocalDate.now().plusDays(30));
    }
}
