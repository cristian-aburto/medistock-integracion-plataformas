package com.medistock.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
public class ExchangeRateService {

    @Value("${exchangerate.api.key}")
    private String apiKey;

    @Value("${exchangerate.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> getRates(String baseCurrency) {
        try {
            String url = apiUrl + "/" + apiKey + "/latest/" + baseCurrency;
            Map response = restTemplate.getForObject(url, Map.class);
            log.info("Exchange rates obtenidos para: {}", baseCurrency);
            return response;
        } catch (Exception e) {
            log.error("Error consultando ExchangeRate API: {}", e.getMessage());
            throw new RuntimeException("No se pudo obtener el tipo de cambio");
        }
    }

    public Double getRate(String from, String to) {
        Map<String, Object> response = getRates(from);
        Map<String, Double> rates = (Map<String, Double>) response.get("conversion_rates");
        return rates.get(to);
    }
}