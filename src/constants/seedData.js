// ─── SEED DATA ────────────────────────────────────────────────────────────────

export const seedProducts = [
  {
    id: "P001",
    name: "Camiseta Básica",
    category: "Ropa",
    variants: [
      { id: "V001", talla: "S",  color: "Blanco", stock: 15, reserved: 0, price: 450 },
      { id: "V002", talla: "M",  color: "Blanco", stock: 20, reserved: 2, price: 450 },
      { id: "V003", talla: "L",  color: "Negro",  stock: 8,  reserved: 1, price: 450 },
      { id: "V004", talla: "M",  color: "Azul",   stock: 0,  reserved: 0, price: 450 },
    ],
  },
  {
    id: "P002",
    name: "Pantalón Jogger",
    category: "Ropa",
    variants: [
      { id: "V005", talla: "M",  color: "Gris",  stock: 10, reserved: 0, price: 950 },
      { id: "V006", talla: "L",  color: "Gris",  stock: 5,  reserved: 1, price: 950 },
      { id: "V007", talla: "XL", color: "Negro", stock: 3,  reserved: 0, price: 950 },
    ],
  },
  {
    id: "P003",
    name: "Gorra Cap",
    category: "Accesorios",
    variants: [
      { id: "V008", talla: "Única", color: "Rojo",  stock: 25, reserved: 0, price: 350 },
      { id: "V009", talla: "Única", color: "Negro", stock: 18, reserved: 3, price: 350 },
    ],
  },
];

export const seedClients = [
  { id: "C001", name: "María González", phone: "8091234567", address: "Calle El Sol 12, Santiago" },
  { id: "C002", name: "Juan Pérez",     phone: "8097654321", address: "Av. Las Flores 45, SDQ" },
  { id: "C003", name: "Ana Martínez",   phone: "8095551234", address: "" },
];

export const seedOrders = [
  {
    id: "ORD-001",
    clientId: "C001",
    state: "Confirmado",
    items: [
      {
        productId: "P001", variantId: "V002",
        productName: "Camiseta Básica", variant: "M / Blanco",
        quantity: 2, price: 450,
      },
    ],
    total: 900,
    channel: "WhatsApp",
    notes: "Entregar en la tarde",
    history: [
      { date: "2025-02-10 09:00", action: "Creado",                   by: "Sistema",  note: "Pedido recibido por WhatsApp" },
      { date: "2025-02-10 09:15", action: "Pendiente → Confirmado",   by: "Operador", note: "Comprobante verificado" },
    ],
    createdAt: "2025-02-10",
  },
  {
    id: "ORD-002",
    clientId: "C002",
    state: "Preparando",
    items: [
      { productId: "P002", variantId: "V005", productName: "Pantalón Jogger", variant: "M / Gris",   quantity: 1, price: 950 },
      { productId: "P003", variantId: "V009", productName: "Gorra Cap",       variant: "Única / Negro", quantity: 1, price: 350 },
    ],
    total: 1300,
    channel: "Instagram",
    notes: "",
    history: [
      { date: "2025-02-11 10:00", action: "Creado",                   by: "Sistema",  note: "" },
      { date: "2025-02-11 10:30", action: "Pendiente → Confirmado",   by: "Operador", note: "" },
      { date: "2025-02-11 11:00", action: "Confirmado → Preparando",  by: "Operador", note: "En empaque" },
    ],
    createdAt: "2025-02-11",
  },
  {
    id: "ORD-003",
    clientId: "C003",
    state: "Pendiente",
    items: [
      { productId: "P001", variantId: "V003", productName: "Camiseta Básica", variant: "L / Negro", quantity: 1, price: 450 },
    ],
    total: 450,
    channel: "WhatsApp",
    notes: "Cliente sin dirección registrada",
    history: [
      { date: "2025-02-12 08:00", action: "Creado", by: "Sistema", note: "Falta dirección del cliente" },
    ],
    createdAt: "2025-02-12",
  },
];
