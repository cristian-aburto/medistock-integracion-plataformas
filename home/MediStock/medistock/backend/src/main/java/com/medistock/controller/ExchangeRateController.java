package com.medistock.controller;

import com.medistock.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/exchange")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    @GetMapping("/rates/{currency}")
    public ResponseEntity<?> getRates(@PathVariable String currency) {
        try {
            Map<String, Object> rates = exchangeRateService.getRates(currency);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", rates
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/convert")
    public ResponseEntity<?> convert(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam Double amount) {
        try {
            Double rate = exchangeRateService.getRate(from, to);
            Double converted = amount * rate;
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "from", from,
                    "to", to,
                    "rate", rate,
                    "originalAmount", amount,
                    "convertedAmount", Math.round(converted * 100.0) / 100.0
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}