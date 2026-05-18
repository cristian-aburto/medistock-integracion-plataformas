package com.medistock.dto;

import com.medistock.model.Order;
import com.medistock.model.OrderItem;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class OrderDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        @NotNull
        private Long productId;
        @NotNull
        @Min(1)
        private Integer quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotEmpty
        private List<ItemRequest> items;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String productSku;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;

        public static ItemResponse fromEntity(OrderItem i) {
            return ItemResponse.builder()
                    .id(i.getId())
                    .productId(i.getProduct().getId())
                    .productName(i.getProduct().getName())
                    .productSku(i.getProduct().getSku())
                    .quantity(i.getQuantity())
                    .unitPrice(i.getUnitPrice())
                    .subtotal(i.getSubtotal())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String orderNumber;
        private Order.OrderStatus status;
        private Order.OrderType type;
        private List<ItemResponse> items;
        private BigDecimal totalAmount;
        private String notes;
        private String createdBy;
        private LocalDateTime createdAt;

        public static Response fromEntity(Order o) {
            return Response.builder()
                    .id(o.getId())
                    .orderNumber(o.getOrderNumber())
                    .status(o.getStatus())
                    .type(o.getType())
                    .items(o.getItems().stream().map(ItemResponse::fromEntity).collect(Collectors.toList()))
                    .totalAmount(o.getTotalAmount())
                    .notes(o.getNotes())
                    .createdBy(o.getCreatedBy().getFullName())
                    .createdAt(o.getCreatedAt())
                    .build();
        }
    }
}
