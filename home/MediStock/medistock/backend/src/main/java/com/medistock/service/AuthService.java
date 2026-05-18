package com.medistock.service;

import com.medistock.dto.AuthDTO;
import com.medistock.exception.BusinessException;
import com.medistock.exception.DuplicateResourceException;
import com.medistock.model.User;
import com.medistock.repository.UserRepository;
import com.medistock.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest request) {
        // Buscar usuario
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("Credenciales incorrectas"));

        // Verificar contraseña manualmente
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("Credenciales incorrectas");
        }

        // Verificar que esté habilitado
        if (!user.isEnabled()) {
            throw new BusinessException("Usuario deshabilitado");
        }

        // Generar token directamente
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        var authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(), null, authorities
        );
        String token = tokenProvider.generateToken(authentication);

        log.info("User logged in: {}", request.getUsername());

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs())
                .user(AuthDTO.UserResponse.fromEntity(user))
                .build();
    }

    public AuthDTO.UserResponse register(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("El nombre de usuario ya está en uso: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("El correo ya está registrado: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole() != null ? request.getRole() : User.Role.STAFF)
                .enabled(true)
                .build();

        User saved = userRepository.save(user);
        log.info("New user registered: {} ({})", saved.getUsername(), saved.getRole());
        return AuthDTO.UserResponse.fromEntity(saved);
    }
}