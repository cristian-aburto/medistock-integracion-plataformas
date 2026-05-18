package com.medistock.service;

import com.medistock.dto.ProductDTO;
import com.medistock.exception.BusinessException;
import com.medistock.exception.DuplicateResourceException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.model.Product;
import com.medistock.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<ProductDTO.Response> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable).map(ProductDTO.Response::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProductDTO.Response getProductById(Long id) {
        return productRepository.findById(id)
                .map(ProductDTO.Response::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id));
    }

    @Transactional(readOnly = true)
    public ProductDTO.Response getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .map(ProductDTO.Response::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Producto con SKU " + sku + " no encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO.Response> searchProducts(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable).map(ProductDTO.Response::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO.Response> getProductsByCategory(Product.ProductCategory category, Pageable pageable) {
        return productRepository.findByCategory(category, pageable).map(ProductDTO.Response::fromEntity);
    }

    public ProductDTO.Response createProduct(ProductDTO.Request request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("Ya existe un producto con el SKU: " + request.getSku());
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .sku(request.getSku())
                .category(request.getCategory())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .minimumStock(request.getMinimumStock() != null ? request.getMinimumStock() : 10)
                .manufacturer(request.getManufacturer())
                .batchNumber(request.getBatchNumber())
                .expiryDate(request.getExpiryDate())
                .status(request.getStatus() != null ? request.getStatus() : Product.ProductStatus.ACTIVE)
                .build();

        Product saved = productRepository.save(product);
        log.info("Product created: {} (SKU: {})", saved.getName(), saved.getSku());
        return ProductDTO.Response.fromEntity(saved);
    }

    public ProductDTO.Response updateProduct(Long id, ProductDTO.Request request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id));

        if (productRepository.existsBySkuAndIdNot(request.getSku(), id)) {
            throw new DuplicateResourceException("Ya existe otro producto con el SKU: " + request.getSku());
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSku(request.getSku());
        product.setCategory(request.getCategory());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setMinimumStock(request.getMinimumStock() != null ? request.getMinimumStock() : product.getMinimumStock());
        product.setManufacturer(request.getManufacturer());
        product.setBatchNumber(request.getBatchNumber());
        product.setExpiryDate(request.getExpiryDate());
        if (request.getStatus() != null) product.setStatus(request.getStatus());

        return ProductDTO.Response.fromEntity(productRepository.save(product));
    }

    public ProductDTO.Response adjustStock(Long id, int adjustment, String reason) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id));

        int newStock = product.getStockQuantity() + adjustment;
        if (newStock < 0) {
            throw new BusinessException("Stock insuficiente. Stock actual: " + product.getStockQuantity() +
                    ", ajuste solicitado: " + adjustment);
        }

        product.setStockQuantity(newStock);
        log.info("Stock adjusted for product {} ({}): {} -> {}, reason: {}",
                product.getName(), product.getSku(),
                product.getStockQuantity() - adjustment, newStock, reason);

        return ProductDTO.Response.fromEntity(productRepository.save(product));
    }

    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id));
        product.setStatus(Product.ProductStatus.DISCONTINUED);
        productRepository.save(product);
        log.info("Product discontinued: {}", id);
    }

    @Transactional(readOnly = true)
    public List<ProductDTO.Response> getLowStockProducts() {
        return productRepository.findLowStockProducts()
                .stream().map(ProductDTO.Response::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO.Response> getExpiringProducts(int daysAhead) {
        LocalDate threshold = LocalDate.now().plusDays(daysAhead);
        return productRepository.findExpiringProducts(threshold)
                .stream().map(ProductDTO.Response::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        long totalActive = productRepository.countActiveProducts();
        long lowStock = productRepository.countLowStockProducts();
        long expiringSoon = productRepository.findExpiringProducts(LocalDate.now().plusDays(30)).size();
        long totalProducts = productRepository.count();

        return Map.of(
                "totalProducts", totalProducts,
                "activeProducts", totalActive,
                "lowStockAlerts", lowStock,
                "expiringSoonAlerts", expiringSoon
        );
    }
}
