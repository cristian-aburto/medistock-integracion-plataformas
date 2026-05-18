package com.medistock.config;
 
import com.medistock.model.Product;
import com.medistock.model.User;
import com.medistock.repository.ProductRepository;
import com.medistock.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
 
import java.math.BigDecimal;
import java.time.LocalDate;
 
@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements ApplicationRunner {
 
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
 
    @Override
    public void run(ApplicationArguments args) {
 
        // ── Usuarios ─────────────────────────────────────────────────────────
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin").email("admin@medistock.cl")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Administrador").role(User.Role.ADMIN).enabled(true).build());
            log.info("Usuario admin creado");
        }
 
        // ── Productos en CLP ─────────────────────────────────────────────────
        if (productRepository.count() == 0) {
 
            // Medicamentos
// Medicamentos
productRepository.save(Product.builder().name("Paracetamol 500mg x 20 comp.").sku("MED-001")
        .category(Product.ProductCategory.MEDICAMENTO).price(new BigDecimal("2490"))
        .stockQuantity(120).minimumStock(20).manufacturer("Laboratorio Chile")
        .imageUrl("https://beta.cruzverde.cl/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw6ff1f78a/images/large/260536-geniol-adultos-analgesico-antipiretico-comprimido-20-unidades-paracetamol-500-mg.jpg")
        .status(Product.ProductStatus.ACTIVE).expiryDate(LocalDate.of(2026, 12, 1)).build());

productRepository.save(Product.builder().name("Ibuprofeno 400mg x 20 comp.").sku("MED-002")
        .category(Product.ProductCategory.MEDICAMENTO).price(new BigDecimal("3290"))
        .stockQuantity(80).minimumStock(30).manufacturer("Laboratorio Chile")
        .imageUrl("https://beta.cruzverde.cl/on/demandware.static/-/Sites-masterCatalog_Chile/default/dwe169cf8e/images/large/273441-ibuprofeno-400-mg-20-comprimidos.jpg")
        .status(Product.ProductStatus.ACTIVE).expiryDate(LocalDate.of(2027, 3, 15)).build());

productRepository.save(Product.builder().name("Amoxicilina 500mg x 12 cáps.").sku("MED-003")
        .category(Product.ProductCategory.MEDICAMENTO).price(new BigDecimal("5990"))
        .stockQuantity(45).minimumStock(15).manufacturer("Biosano")
        .imageUrl("https://beta.cruzverde.cl/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw846f3396/images/large/275149-amoxcilina-+-acido-clavulanico-125-mg-20-comprimidos.jpg")
        .status(Product.ProductStatus.ACTIVE).expiryDate(LocalDate.of(2027, 6, 15)).build());

productRepository.save(Product.builder().name("Omeprazol 20mg x 14 cáps.").sku("MED-004")
        .category(Product.ProductCategory.MEDICAMENTO).price(new BigDecimal("4490"))
        .stockQuantity(60).minimumStock(20).manufacturer("Recalcine")
        .imageUrl("https://beta.cruzverde.cl/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw70b28a42/images/large/16068-losec-mups-omeprazol-20-mg-14-comprimidos.jpg")
        .status(Product.ProductStatus.ACTIVE).expiryDate(LocalDate.of(2027, 8, 20)).build());
        
productRepository.save(Product.builder().name("Loratadina 10mg x 10 comp.").sku("MED-005")
        .category(Product.ProductCategory.MEDICAMENTO).price(new BigDecimal("2190"))
        .stockQuantity(90).minimumStock(20).manufacturer("Maver")
        .imageUrl("https://beta.cruzverde.cl/on/demandware.static/-/Sites-masterCatalog_Chile/default/dwe085f136/images/large/273015-loratadina-bioequivalente-comprimido-30-unidades-loratadina-10-mg.jpg")
        .status(Product.ProductStatus.ACTIVE).expiryDate(LocalDate.of(2027, 8, 20)).build());

productRepository.save(Product.builder().name("Metformina 850mg x 30 comp.").sku("MED-006")
        .category(Product.ProductCategory.MEDICAMENTO).price(new BigDecimal("6990"))
        .stockQuantity(40).minimumStock(15).manufacturer("Laboratorio Chile")
        .imageUrl("https://beta.cruzverde.cl/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw83dcdc91/images/large/270506-1.jpg")
        .status(Product.ProductStatus.ACTIVE).expiryDate(LocalDate.of(2026, 11, 30)).build());

// Consumibles
productRepository.save(Product.builder().name("Jeringa 5ml con aguja x 10 un.").sku("CON-001")
        .category(Product.ProductCategory.CONSUMIBLE).price(new BigDecimal("3490"))
        .stockQuantity(500).minimumStock(100).manufacturer("BD Medical")
        .imageUrl("https://www.farmaciasahumada.cl/dw/image/v2/BJVH_PRD/on/demandware.static/-/Sites-ahumada-master-catalog/default/dwa47f186f/images/products/7759/7759.jpg?sw=1575&sh=1575&sm=fit")
        .status(Product.ProductStatus.ACTIVE).build());

productRepository.save(Product.builder().name("Guantes Nitrilo Talla M x 100 un.").sku("CON-002")
        .category(Product.ProductCategory.CONSUMIBLE).price(new BigDecimal("12990"))
        .stockQuantity(200).minimumStock(50).manufacturer("SafeHand")
        .imageUrl("https://cimedent.cl/wp-content/uploads/2025/11/Guante-de-nitrilo.jpg")
        .status(Product.ProductStatus.ACTIVE).build());

productRepository.save(Product.builder().name("Mascarilla KN95 x 5 un.").sku("CON-003")
        .category(Product.ProductCategory.CONSUMIBLE).price(new BigDecimal("4990"))
        .stockQuantity(300).minimumStock(80).manufacturer("3M")
        .imageUrl("https://www.saveline.cl/wp-content/uploads/2020/04/mascarilla-kn95-empaque.jpg")
        .status(Product.ProductStatus.ACTIVE).build());

productRepository.save(Product.builder().name("Gasa estéril 10x10cm x 20 un.").sku("CON-004")
        .category(Product.ProductCategory.CONSUMIBLE).price(new BigDecimal("2890"))
        .stockQuantity(400).minimumStock(100).manufacturer("Hartmann")
        .imageUrl("https://afchilespa.cl/wp-content/uploads/2022/11/WOO-Gasa-No-Tejida-Esteril-10x10cm-Cranberry-50-Sobres-X-2-Un..jpg.webp")
        .status(Product.ProductStatus.ACTIVE).build());

// Equipos
productRepository.save(Product.builder().name("Termómetro Digital Axilar").sku("EQU-001")
        .category(Product.ProductCategory.EQUIPO).price(new BigDecimal("8990"))
        .stockQuantity(30).minimumStock(5).manufacturer("Omron")
        .imageUrl("https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQFoLePiILjDtY2JlXJNGLKQIB_dLt36UmdUn5heWS-p6Jk6MMLrIpRgxS7ic64H_wIlPoftVZyBITJlhUjRvjC3VGDtXGXoR4CG_5MgM-Ld0QcMWRjEZV3")
        .status(Product.ProductStatus.ACTIVE).build());

productRepository.save(Product.builder().name("Tensiómetro Digital de Brazo").sku("EQU-002")
        .category(Product.ProductCategory.EQUIPO).price(new BigDecimal("39990"))
        .stockQuantity(15).minimumStock(3).manufacturer("Omron")
        .imageUrl("https://ortopedia.farmaciasanjuan.cl/wp-content/uploads/2024/08/toma-presion.jpg")
        .status(Product.ProductStatus.ACTIVE).build());

productRepository.save(Product.builder().name("Oxímetro de Pulso Digital").sku("EQU-003")
        .category(Product.ProductCategory.EQUIPO).price(new BigDecimal("18990"))
        .stockQuantity(20).minimumStock(4).manufacturer("Rossmax")
        .imageUrl("https://http2.mlstatic.com/D_Q_NP_772722-MLU72534585018_102023-F.webp")
        .status(Product.ProductStatus.ACTIVE).build());

// Instrumental
productRepository.save(Product.builder().name("Bisturí Desechable N°22 x 10 un.").sku("INS-001")
        .category(Product.ProductCategory.INSTRUMENTAL).price(new BigDecimal("5490"))
        .stockQuantity(80).minimumStock(25).manufacturer("SurgTech")
        .imageUrl("https://dojiw2m9tvv09.cloudfront.net/22686/product/X_bisturi12291.jpg?63&t=1779059505")
        .status(Product.ProductStatus.ACTIVE).build());

productRepository.save(Product.builder().name("Pinza Hemostática 14cm").sku("INS-002")
        .category(Product.ProductCategory.INSTRUMENTAL).price(new BigDecimal("12990"))
        .stockQuantity(25).minimumStock(8).manufacturer("MedInstruments")
        .imageUrl("https://cdnx.jumpseller.com/quirurgimedical/image/15377316/thumb/1440/876?1657480915")
        .status(Product.ProductStatus.ACTIVE).build());

// Reactivos
productRepository.save(Product.builder().name("Test Rápido COVID-19 Antígenos x 5 un.").sku("REA-001")
        .category(Product.ProductCategory.REACTIVO).price(new BigDecimal("14990"))
        .stockQuantity(100).minimumStock(20).manufacturer("Roche")
        .imageUrl("https://farmex.cl/cdn/shop/products/test-rapido-antigeno-roche-covid-19-nasal-5-unidades-roche-626033.jpg?v=1692989408&width=493")
        .status(Product.ProductStatus.ACTIVE).expiryDate(LocalDate.of(2026, 9, 30)).build());

productRepository.save(Product.builder().name("Tira Reactiva Glucosa x 50 un.").sku("REA-002")
        .category(Product.ProductCategory.REACTIVO).price(new BigDecimal("11990"))
        .stockQuantity(60).minimumStock(15).manufacturer("OneTouch")
        .imageUrl("https://http2.mlstatic.com/D_Q_NP_670486-MLA85673586378_062025-F.webp")
        .status(Product.ProductStatus.ACTIVE).expiryDate(LocalDate.of(2026, 7, 15)).build());
        }
    }
}