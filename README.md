# 🏥 MediStock — Plataforma de Gestión de Inventario Médico

Proyecto desarrollado para el ramo **Integración de Plataformas**.  
Sistema web completo con API REST, tienda en línea y panel de administración.

---

## 👥 Integrantes

- Cristian Aburto
- Carlos Lienan

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 17 + Spring Boot 3.2 |
| Frontend Tienda | React 18 + Vite |
| Frontend Admin | React 18 + Vite |
| Base de Datos | H2 (en memoria) |
| Autenticación | JWT |
| Pagos | MercadoPago Checkout Pro |
| Build | Maven 3.9 |

---

## 📂 Estructura del Repositorio

```
medistock/
├── backend/                  → API REST (Spring Boot)
├── medistock-store/          → Tienda online (clientes)
└── medistock-frontend/       → Panel de administración (admin/staff)
```

---

## ⚙️ Requisitos previos

- Java 17+
- Maven 3.9+
- Node.js 18+

---

## 🚀 Cómo levantar el proyecto

### 1. Backend

```bash
cd backend
mvn spring-boot:run
```

El backend queda disponible en **http://localhost:8081**  
La consola H2 está en **http://localhost:8081/h2-console** (usuario: `sa`, sin contraseña)

> ⚠️ La terminal queda "pegada" mostrando los logs — eso es normal, el servidor está corriendo.

### 2. Tienda (clientes)

Abrir una nueva terminal:

```bash
cd medistock-store
npm install
npm run dev
```

Disponible en **http://localhost:5173**

### 3. Panel Admin

Abrir una nueva terminal:

```bash
cd medistock-frontend
npm install
npm run dev
```

Disponible en **http://localhost:5174**

---

## 🔑 Credenciales de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `farmaceutico` | `farm123` | PHARMACIST |
| `staff` | `staff123` | STAFF |

---

## 🔌 Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| GET | `/api/products` | Listar productos |
| POST | `/api/products` | Crear producto (ADMIN) |
| PUT | `/api/products/{id}` | Editar producto (ADMIN) |
| DELETE | `/api/products/{id}` | Eliminar producto (ADMIN) |
| GET | `/api/store/products` | Catálogo público |
| POST | `/api/store/orders` | Crear orden |
| POST | `/api/store/payments/create-preference` | Iniciar pago MercadoPago |

---

## 🧪 Flujo de pago

1. Cliente agrega productos al carrito
2. Hace checkout → se crea una orden en el backend
3. El backend genera una preferencia en MercadoPago
4. Cliente es redirigido al checkout de MercadoPago
5. Al completar el pago, MercadoPago redirige de vuelta a la tienda

---

## 📊 Gestión del Proyecto

La gestión de tareas y documentación del proyecto se encuentra en **Trello**.

---

## 🗃️ Base de Datos

El sistema usa **H2 en memoria** con carga automática de datos de prueba al iniciar (17 productos + usuarios). El script DDL se encuentra en el repositorio Trello del proyecto.
