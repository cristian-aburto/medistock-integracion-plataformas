package com.medistock.controller;

import com.medistock.dto.ApiResponse;
import com.medistock.dto.ProductDTO;
import com.medistock.model.Product;
import com.medistock.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDTO.Response>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(productService.getAllProducts(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO.Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductById(id)));
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<ApiResponse<ProductDTO.Response>> getBySku(@PathVariable String sku) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductBySku(sku)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProductDTO.Response>>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(productService.searchProducts(q, pageable)));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<Page<ProductDTO.Response>>> getByCategory(
            @PathVariable Product.ProductCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductsByCategory(category, pageable)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<ProductDTO.Response>> create(@Valid @RequestBody ProductDTO.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Producto creado exitosamente", productService.createProduct(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<ProductDTO.Response>> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO.Request request) {
        return ResponseEntity.ok(ApiResponse.ok("Producto actualizado", productService.updateProduct(id, request)));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<ProductDTO.Response>> adjustStock(
            @PathVariable Long id,
            @RequestParam int adjustment,
            @RequestParam(required = false, defaultValue = "Ajuste manual") String reason) {
        return ResponseEntity.ok(ApiResponse.ok("Stock actualizado", productService.adjustStock(id, adjustment, reason)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.ok("Producto eliminado", null));
    }

    @GetMapping("/alerts/low-stock")
    public ResponseEntity<ApiResponse<List<ProductDTO.Response>>> getLowStock() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getLowStockProducts()));
    }

    @GetMapping("/alerts/expiring")
    public ResponseEntity<ApiResponse<List<ProductDTO.Response>>> getExpiring(
            @RequestParam(defaultValue = "30") int daysAhead) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getExpiringProducts(daysAhead)));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getDashboardStats()));
    }
}
