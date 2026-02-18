# Tienda — Sistema de Gestión

Sistema de gestión de pedidos, inventario y ventas para tiendas con canales WhatsApp/Instagram/Shopify.

---

## Estructura del proyecto

```
tienda-sistema/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                        # Entry point de React
    ├── App.jsx                         # Layout principal + routing de tabs
    │
    ├── constants/
    │   ├── index.js                    # Estados, transiciones, colores, plantilla WA
    │   └── seedData.js                 # Datos de prueba (productos, clientes, pedidos)
    │
    ├── utils/
    │   └── index.js                    # Funciones helpers (formateo, stock, IDs)
    │
    ├── hooks/
    │   └── useStore.js                 # Estado global + lógica de negocio
    │
    ├── components/
    │   ├── UI.jsx                      # Componentes reutilizables (Btn, Input, Modal, Badge...)
    │   ├── Sidebar.jsx                 # Navegación lateral
    │   ├── WhatsAppModal.jsx           # Plantilla de mensaje WhatsApp
    │   └── CreateOrderModal.jsx        # Formulario de nuevo pedido
    │
    └── pages/
        ├── PedidosPage.jsx             # Lista + detalle de pedidos, historial, transiciones
        ├── CajaPage.jsx                # Inventario + ajuste de stock + venta directa
        └── ReportesPage.jsx            # Gráficos, top productos, stock bajo, resumen
```

---

## Verificación (componentes y APIs)

Se ha revisado que la app no explote y que todos los componentes consuman las APIs correctamente:

| Área | Uso de API | Comportamiento |
|------|------------|----------------|
| **Login** | `authApi.login` | Token guardado en `tokenManager`; 401 dispara logout y toast. |
| **Pedidos** | `ordersApi.list`, `get`, `create`, `transition`, `updateAddress`, `history` | Lista, detalle, crear, cambiar estado, editar dirección, historial. `normaliseOrder` unifica distintos formatos del backend. |
| **Caja** | `inventoryApi.balances`, `adjust`; `productsApi` + `variantsApi` vía store | Inventario, ajustes, venta directa (varios `adjust` negativos). Stock disponible con `getBalance` / `getAvailable`. |
| **Reportes** | `reportsApi.weeklySales`, `reportsApi.topProducts` | Gráfico semanal y top productos; datos normalizados por si el API devuelve formatos distintos. |
| **WhatsApp** | `whatsappApi.message(orderId)` | Plantilla de mensaje; acepta `message`/`text`/`body` y `waLink`/`link`/`url`. |
| **Store (useStore)** | `productsApi`, `variantsApi`, `ordersApi`, `inventoryApi` | Carga y mutaciones delegadas al API; errores en `setError`, loading por clave. |

- **UI**: Badge, Modal, Toast, Input, Select, Btn, AlertBox usan estados y props de forma segura; `STATE_COLORS` y `ORDER_STATE_LABELS` cubren mayúsculas y variantes en español.
- **Build**: `npm run build` termina sin errores; no hay errores de linter en `src/`.
- **Pequeñas mejoras**: `CreateOrderModal` acepta `orderId` además de `id` en la respuesta de crear pedido; gráfico de reportes usa clave estable cuando `date` falta.

---

## Instalación y uso

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`

---

## Lógica de negocio implementada

### Máquina de estados de pedidos
```
Pendiente → Confirmado → Preparando → Enviado → Entregado
    ↓           ↓           ↓           ↓
 Cancelado  Cancelado   Cancelado   (no aplica)
```

- No se puede saltar pasos (validado en `useStore.js > transitionOrder`)
- No se puede marcar Enviado si el cliente no tiene dirección registrada

### Manejo de stock (ADR-1)
| Evento          | Efecto en stock                              |
|-----------------|----------------------------------------------|
| Crear pedido    | Sin cambios (solo reserva pendiente)          |
| Confirmado      | `reserved += cantidad`                        |
| Entregado       | `stock -= cantidad`, `reserved -= cantidad`   |
| Cancelado       | `reserved -= cantidad` (si estaba confirmado) |
| Ajuste manual   | `stock += delta` (con razón obligatoria)      |
| Venta directa   | `stock -= cantidad` inmediatamente            |

### Condiciones reales resueltas
- **Stock desajustado**: Ajuste manual con razón en sección Caja
- **Dirección a último minuto**: Editable desde el detalle del pedido, bloquea "Enviado" si falta
- **Cancelación post-confirmación**: Libera stock reservado automáticamente
- **Historial de cambios**: Cada transición y nota queda registrada con fecha y autor

### Plantilla WhatsApp
Generada con variables del pedido y cliente. Incluye botón para abrir directamente en WhatsApp Web.

---

## Tecnologías
- **Framework**: React 18 + **Vite 5** (bundler y dev server)
- CSS-in-JS (estilos inline, sin dependencias de UI)

---

## REST API y token

La app se conecta a la API en:

**`https://store-production-3316.up.railway.app`**

- **Login**: `POST /auth/login` con `{ username, password }`. La respuesta incluye un JWT (`token`, `accessToken` o `jwt`).
- **Token**: Se guarda en memoria y en `sessionStorage` (`jwt_token`). Todas las peticiones autenticadas envían `Authorization: Bearer <token>`.
- **401**: Si el servidor devuelve 401, el cliente borra el token y lanza el evento `auth:logout` (la app redirige al login y muestra “Sesión expirada”).

La URL de la API está definida en `src/api/client.js` y en `src/constants/index.js`. Para comprobar que la API responde (desde tu red), abre la URL en el navegador o haz una petición a `/auth/login` con usuario y contraseña válidos.

---

## Despliegue con GitHub Actions (GitHub Pages)

El proyecto incluye un workflow para construir y desplegar el frontend en **GitHub Pages** cada vez que hagas push a `main`.

### Pasos

1. **Habilitar GitHub Pages** en el repositorio:
   - Repo → **Settings** → **Pages**
   - En **Source** elige **GitHub Actions** (ya lo tienes así).
   - **No** pulses "Configure" en Jekyll ni en Static HTML: este proyecto usa su propio workflow **"Deploy to GitHub Pages"**.

2. **Subir el código** (incluido `.github/workflows/deploy.yml`) y hacer push a `main`. El workflow:
   - Instala dependencias (`npm ci`)
   - Ejecuta `npm run build` con `BASE_PATH=/<nombre-del-repo>/` para que las rutas funcionen en Pages
   - Sube la carpeta `dist` y la despliega en Pages.

3. **URL resultante**:  
   `https://<usuario>.github.io/<nombre-repo>/`  
   (por ejemplo `https://tu-usuario.github.io/tienda-sistema/`).

El workflow se llama **"Deploy to GitHub Pages"** y también se puede lanzar a mano desde la pestaña **Actions** → **Run workflow**.
