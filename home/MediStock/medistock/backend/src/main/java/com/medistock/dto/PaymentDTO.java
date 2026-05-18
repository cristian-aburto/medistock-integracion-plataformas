package com.medistock.dto;

import lombok.*;

import java.math.BigDecimal;

public class PaymentDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePreferenceRequest {
        private Long orderId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreferenceResponse {
        private String preferenceId;
        private String initPoint;      // URL real de MercadoPago
        private String sandboxInitPoint; // URL sandbox para pruebas
        private Long orderId;
        private String orderNumber;
        private BigDecimal totalAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WebhookNotification {
        private String type;
        private String action;
        private WebhookData data;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class WebhookData {
            private String id;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentStatusResponse {
        private Long orderId;
        private String orderNumber;
        private String paymentStatus;  // approved, pending, rejected
        private String orderStatus;
        private BigDecimal totalAmount;
        private String message;
    }
}
