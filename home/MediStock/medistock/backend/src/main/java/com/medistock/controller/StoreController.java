package com.medistock.controller;

import com.medistock.dto.ApiResponse;
import com.medistock.dto.OrderDTO;
import com.medistock.dto.PaymentDTO;
import com.medistock.dto.ProductDTO;
import com.medistock.model.Product;
import com.medistock.service.OrderService;
import com.medistock.service.PaymentService;
import com.medistock.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store")
@RequiredArgsConstructor
public class StoreController {

    private final ProductService productService;
    private final OrderService orderService;
    private final PaymentService paymentService;

    // ── Catálogo público ──────────────────────────────────────────────────────

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductDTO.Response>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name") String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return ResponseEntity.ok(ApiResponse.ok(productService.getAllProducts(pageable)));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductDTO.Response>> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductById(id)));
    }

    @GetMapping("/products/search")
    public ResponseEntity<ApiResponse<Page<ProductDTO.Response>>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(productService.searchProducts(q, pageable)));
    }

    @GetMapping("/products/category/{category}")
    public ResponseEntity<ApiResponse<Page<ProductDTO.Response>>> byCategory(
            @PathVariable Product.ProductCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductsByCategory(category, pageable)));
    }

    // ── Órdenes del cliente ───────────────────────────────────────────────────

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderDTO.Response>> createOrder(
            @Valid @RequestBody OrderDTO.CreateRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Orden creada", orderService.createOrder(request, auth.getName())));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<OrderDTO.Response>>> getMyOrders(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(orderService.getUserOrders(auth.getName(), pageable)));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderDTO.Response>> getOrder(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderById(id, auth.getName())));
    }

    // ── Pagos MercadoPago ─────────────────────────────────────────────────────

    @PostMapping("/payments/create-preference")
    public ResponseEntity<ApiResponse<PaymentDTO.PreferenceResponse>> createPreference(
            @RequestBody PaymentDTO.CreatePreferenceRequest request,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.createPreference(request.getOrderId(), auth.getName())));
    }

    @GetMapping("/payments/status")
    public ResponseEntity<ApiResponse<PaymentDTO.PaymentStatusResponse>> paymentStatus(
            @RequestParam Long orderId,
            @RequestParam(defaultValue = "approved") String status,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.handlePaymentSuccess(orderId, status)));
    }

    @PostMapping("/payments/webhook")
    public ResponseEntity<Void> webhook(@RequestBody PaymentDTO.WebhookNotification notification) {
        paymentService.handleWebhook(notification);
        return ResponseEntity.ok().build();
    }
}
