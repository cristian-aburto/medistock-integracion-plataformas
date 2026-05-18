package com.medistock.service;

import com.medistock.dto.OrderDTO;
import com.medistock.exception.BusinessException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.model.*;
import com.medistock.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderDTO.Response createOrder(OrderDTO.CreateRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        List<OrderItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (OrderDTO.ItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto", itemReq.getProductId()));

            if (product.getStatus() != Product.ProductStatus.ACTIVE) {
                throw new BusinessException("Producto no disponible: " + product.getName());
            }
            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new BusinessException("Stock insuficiente para: " + product.getName() +
                        ". Disponible: " + product.getStockQuantity());
            }

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();
            item.calculateSubtotal();
            items.add(item);
            total = total.add(item.getSubtotal());
        }

        String orderNumber = "ORD-" + LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .createdBy(user)
                .status(Order.OrderStatus.PENDING)
                .type(Order.OrderType.DISPENSING)
                .totalAmount(total)
                .notes(request.getNotes())
                .build();

        order = orderRepository.save(order);

        for (OrderItem item : items) {
            item.setOrder(order);
        }
        order.setItems(items);
        order = orderRepository.save(order);

        log.info("Order created: {} by {}", orderNumber, username);
        return OrderDTO.Response.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO.Response> getUserOrders(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return orderRepository.findByCreatedById(user.getId(), pageable)
                .map(OrderDTO.Response::fromEntity);
    }

    @Transactional(readOnly = true)
    public OrderDTO.Response getOrderById(Long id, String username) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", id));
        if (!order.getCreatedBy().getUsername().equals(username)) {
            throw new BusinessException("No tienes permiso para ver esta orden");
        }
        return OrderDTO.Response.fromEntity(order);
    }

    public OrderDTO.Response updateOrderStatus(Long id, Order.OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", id));
        order.setStatus(newStatus);

        // Si se aprueba el pago, descontar stock
        if (newStatus == Order.OrderStatus.COMPLETED) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                int newStock = product.getStockQuantity() - item.getQuantity();
                if (newStock < 0) throw new BusinessException("Stock insuficiente al completar la orden");
                product.setStockQuantity(newStock);
                productRepository.save(product);
            }
        }

        return OrderDTO.Response.fromEntity(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO.Response> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(OrderDTO.Response::fromEntity);
    }
}
