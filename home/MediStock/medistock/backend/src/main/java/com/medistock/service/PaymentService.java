package com.medistock.service;

import com.medistock.dto.PaymentDTO;
import com.medistock.exception.BusinessException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.model.Order;
import com.medistock.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final RestTemplate restTemplate;

    @Value("${mercadopago.access-token:TEST-000000000000000-000000-00000000000000000000000000000000-000000000}")
    private String accessToken;

    @Value("${mercadopago.success-url:http://localhost:5174/payment/success}")
    private String successUrl;

    @Value("${mercadopago.failure-url:http://localhost:5174/payment/failure}")
    private String failureUrl;

    @Value("${mercadopago.pending-url:http://localhost:5174/payment/pending}")
    private String pendingUrl;

    @Value("${mercadopago.webhook-url:http://localhost:8080/api/payments/webhook}")
    private String webhookUrl;

    public PaymentDTO.PreferenceResponse createPreference(Long orderId, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", orderId));

        if (!order.getCreatedBy().getUsername().equals(username)) {
            throw new BusinessException("No tienes permiso para pagar esta orden");
        }
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new BusinessException("La orden no está en estado pendiente");
        }

        // Construir el body para MercadoPago
        List<Map<String, Object>> mpItems = new ArrayList<>();
        order.getItems().forEach(item -> {
            Map<String, Object> mpItem = new HashMap<>();
            mpItem.put("id", item.getProduct().getSku());
            mpItem.put("title", item.getProduct().getName());
            mpItem.put("quantity", item.getQuantity());
            mpItem.put("unit_price", item.getUnitPrice().doubleValue());
            mpItem.put("currency_id", "CLP");
            mpItems.add(mpItem);
        });

        Map<String, Object> backUrls = new HashMap<>();
        backUrls.put("success", successUrl + "?orderId=" + orderId);
        backUrls.put("failure", failureUrl + "?orderId=" + orderId);
        backUrls.put("pending", pendingUrl + "?orderId=" + orderId);

        Map<String, Object> body = new HashMap<>();
        body.put("items", mpItems);
        body.put("back_urls", backUrls);
        body.put("external_reference", order.getOrderNumber());
        body.put("notification_url", webhookUrl);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://api.mercadopago.com/checkout/preferences",
                    entity, Map.class
            );

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String preferenceId = (String) responseBody.get("id");
                String initPoint = (String) responseBody.get("init_point");
                String sandboxInitPoint = (String) responseBody.get("sandbox_init_point");

                order.setStatus(Order.OrderStatus.PROCESSING);
                orderRepository.save(order);

                log.info("MercadoPago preference created: {} for order {}", preferenceId, order.getOrderNumber());

                return PaymentDTO.PreferenceResponse.builder()
                        .preferenceId(preferenceId)
                        .initPoint(initPoint)
                        .sandboxInitPoint(sandboxInitPoint)
                        .orderId(orderId)
                        .orderNumber(order.getOrderNumber())
                        .totalAmount(order.getTotalAmount())
                        .build();
            }
        } catch (Exception e) {
            log.warn("MercadoPago API error, using simulation mode: {}", e.getMessage());
        }

        // MODO SIMULACIÓN (cuando no hay credenciales reales)
        String simulatedId = "SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        order.setStatus(Order.OrderStatus.PROCESSING);
        orderRepository.save(order);

        return PaymentDTO.PreferenceResponse.builder()
                .preferenceId(simulatedId)
                .initPoint(successUrl + "?orderId=" + orderId + "&simulated=true")
                .sandboxInitPoint(successUrl + "?orderId=" + orderId + "&simulated=true")
                .orderId(orderId)
                .orderNumber(order.getOrderNumber())
                .totalAmount(order.getTotalAmount())
                .build();
    }

    public PaymentDTO.PaymentStatusResponse handlePaymentSuccess(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", orderId));

        String paymentStatus = status != null ? status : "approved";
        String message;

        if ("approved".equals(paymentStatus)) {
            orderService.updateOrderStatus(orderId, Order.OrderStatus.COMPLETED);
            message = "Pago aprobado. Tu pedido está en camino.";
        } else if ("pending".equals(paymentStatus)) {
            order.setStatus(Order.OrderStatus.PENDING);
            orderRepository.save(order);
            message = "Pago pendiente de confirmación.";
        } else {
            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);
            message = "Pago rechazado. Por favor intenta de nuevo.";
        }

        return PaymentDTO.PaymentStatusResponse.builder()
                .orderId(orderId)
                .orderNumber(order.getOrderNumber())
                .paymentStatus(paymentStatus)
                .orderStatus(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .message(message)
                .build();
    }

    public void handleWebhook(PaymentDTO.WebhookNotification notification) {
        log.info("MercadoPago webhook received: type={}, action={}", notification.getType(), notification.getAction());
        // En producción aquí consultarías el estado del pago a MercadoPago
        // y actualizarías la orden correspondiente
    }
}
