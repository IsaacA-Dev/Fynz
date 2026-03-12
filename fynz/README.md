# 💰 Fynz - Frontend

Una aplicación web moderna y minimalista para la gestión de finanzas personales, construida con **React 19** y **Vite**.

## 🚀 Características

- **Dashboard Intuitivo:** Visualización rápida de ingresos, egresos y balance total.
- **Gestión de Transacciones:** Registro detallado de movimientos con filtrado avanzado.
- **Bolsillos (Pockets):** Organiza tus ahorros en diferentes contenedores con metas específicas.
- **Categorías Personalizadas:** Clasifica tus gastos para un mejor análisis.
- **Panel de Admin:** Gestión de usuarios y roles (solo para administradores).
- **Diseño Moderno:** Interfaz fluida y responsiva utilizando **Tailwind CSS 4**.

## 🛠️ Stack Tecnológico

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Enrutado:** [React Router Dom 7](https://reactrouter.com/)
- **Iconos:** [Heroicons](https://heroicons.com/) / [Lucide](https://lucide.dev/) (según disponibilidad)

## 📦 Instalación y Configuración

1. **Clona el repositorio:**
   ```bash
   git clone <url-del-repo>
   cd fynz/fynz
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

## 🏗️ Estructura del Proyecto

- `src/api`: Cliente de API centralizado (fetch wrapper).
- `src/components`: Componentes reutilizables (Botones, Formularios, Layout).
- `src/context`: Estados globales (Autenticación).
- `src/pages`: Vistas principales de la aplicación.
- `src/hooks`: Lógica de React personalizada.

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
