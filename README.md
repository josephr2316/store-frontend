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
- React 18
- Vite 5
- CSS-in-JS (estilos inline, sin dependencias de UI)
