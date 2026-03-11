---
description: Levantar el servidor de desarrollo de Fynz Frontend
---

# Desarrollo local — Fynz Frontend

## Requisitos previos
- Node.js >= 20.19 o >= 22.12
- Backend (fynz-srv) corriendo en `http://localhost:3000`

## Pasos

// turbo-all

1. Instalar dependencias (si no se ha hecho):
```bash
cd /Users/isaacabdiel/Isaac/fynz/fynz && npm install
```

2. Asegurarse de que el backend está corriendo:
```bash
curl http://localhost:3000/health
```

3. Levantar el servidor de desarrollo:
```bash
cd /Users/isaacabdiel/Isaac/fynz/fynz && npm run dev
```

El frontend estará en `http://localhost:5173`.
El proxy de Vite redirige `/api/*` al backend en `:3000`.

## Stack
- **React 19** + **Vite 7**
- **TailwindCSS v4** (config en `src/index.css`)
- **React Router v7** para navegación
- **Fetch API** para comunicación con backend

## Estructura de archivos
```
src/
├── api/client.js          — API client (fetch wrapper)
├── context/AuthContext.jsx — Manejo de JWT y sesión
├── components/
│   ├── Layout.jsx         — Sidebar + responsive nav
│   └── ProtectedRoute.jsx — Guard de autenticación
├── pages/
│   ├── Login.jsx          — Inicio de sesión
│   ├── Register.jsx       — Registro de usuario
│   ├── Dashboard.jsx      — Balance, resumen, bolsillos
│   ├── Transactions.jsx   — CRUD transacciones + filtros
│   ├── Pockets.jsx        — CRUD bolsillos de ahorro
│   └── Categories.jsx     — Gestión de categorías
└── index.css              — TailwindCSS + tema Fynz
```

## Colores del tema
- Gradiente principal: `#667eea` → `#764ba2` (indigo → purple)
- Paleta: `fynz-50` a `fynz-950` en Tailwind
- Utilities: `gradient-primary`, `text-gradient`, `glass`
