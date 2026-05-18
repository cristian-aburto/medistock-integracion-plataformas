package com.medistock.controller;

import com.medistock.dto.ApiResponse;
import com.medistock.dto.AuthDTO;
import com.medistock.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/hash")
    public ResponseEntity<String> hash() {
    org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = 
        new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    return ResponseEntity.ok(encoder.encode("admin123"));
}

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDTO.LoginResponse>> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Login exitoso", authService.login(request)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDTO.UserResponse>> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Usuario registrado exitosamente", authService.register(request)));
    }
}