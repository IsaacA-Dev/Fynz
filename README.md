# Fynz

Una aplicación financiera minimalista centrada en una sola verdad: **tu dinero realmente disponible**.

## Visión y Propósito

El problema con las aplicaciones bancarias tradicionales es que te muestran un saldo ilusorio. Ver $10,000 en tu cuenta no significa que puedas gastarlos hoy si mañana se cobra automáticamente tu renta, la luz y la mensualidad de un servicio. Además, los bancos suelen mezclar tu dinero líquido con tus límites de crédito, creando una falsa sensación de riqueza.

**Fynz** nace para eliminar la fricción mental y la ansiedad financiera. Su objetivo es responder a la pregunta más importante antes de hacer una compra: *"¿Cómo quedo después de pagar lo que ya debo?"*.

## La Fórmula Central

El corazón de la aplicación es un cálculo automático y estricto. El límite de una tarjeta de crédito jamás se considera dinero a favor.

> **Disponible Real** = Dinero Líquido (Débito + Efectivo) - Pagos Próximos - Gastos Reservados - Colchón de Seguridad

**Estado actual del MVP:** la fórmula activa es `Dinero Líquido - Pagos Próximos`. Los componentes de Gastos Reservados y Colchón de Seguridad quedan pendientes de implementar.

## Características

- **Cálculo de Liquidez Real:** separación estricta entre tu dinero real (débito + efectivo) y el dinero del banco. El crédito se ignora por completo.
- **Radar de Obligaciones:** gestión de próximos pagos, recibos y deudas con fecha de vencimiento y estado de liquidación.
- **Sistema de Autenticación:** privacidad total mediante correo y contraseña con Supabase Auth.
- **Guardian de Rutas:** un proxy central verifica la sesión en cada navegación; sin sesión no hay dashboard.
- **Interfaz Fluida:** componentes modulares, notificaciones tipo toast, diálogos de confirmación y transiciones animadas con Framer Motion.
- **Clic, Confirmar, Listo:** el cierre de sesión requiere confirmación antes de ejecutarse.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Animaciones | Framer Motion |
| Iconos | Lucide |
| Base de Datos y Auth | Supabase (PostgreSQL) |
| Entorno de Ejecución | Bun |

## Modelo de Datos

El proyecto se sostiene sobre un modelo relacional. Las tablas están en singular y los registros se vinculan al usuario mediante `usuario_id`:

1. **Cuenta:** almacena el nombre, el método (`debito`, `credito`, `efectivo`) y el balance inicial.
2. **Transaccion:** bitácora histórica de ingresos y egresos por cuenta.
3. **Proximo Pago:** tareas financieras con descripción, monto, fecha de vencimiento y estado `pagado`.

> **Nota:** hoy el Row Level Security está desactivado para agilizar el MVP. La seguridad a nivel de datos (RLS + políticas por usuario) está contemplada antes de producción.

## Requisitos

- Bun **>= 1.3** (`bun --version`)
- Una cuenta en [Supabase](https://supabase.com) con un proyecto creado

## Instalación y Desarrollo Local

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd fynz
bun install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con tus llaves públicas de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

El panel de Supabase las encuentras en **Settings → API**. Si tienes algún valor preexistente en el archivo `.env.local`, conserva las llaves reales.

### 3. Preparar la base de datos

En el dashboard de Supabase (**Table Editor**):

1. Crea/importa las tablas `cuenta`, `transaccion` y `proximo_pago` con sus columnas (ver "Modelo de Datos").
2. Agrega la columna `usuario_id` (tipo UUID) a `cuenta` y `proximo_pago`, referenciando a `auth.users`.

### 4. Habilitar autenticación

En el dashboard de Supabase (**Authentication**):

1. Activa el proveedor **Email / Password**.
2. Opcional: desactiva **Confirm email** durante el desarrollo para crear cuentas sin verificación manual.

### 5. Ejecutar

```bash
bun dev
```

Abre [http://localhost:3000](http://localhost:3000), crea tu cuenta y entra a tu Dashboard.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `bun dev` | Servidor de desarrollo con hot reload |
| `bun build` | Build de producción |
| `bun start` | Ejecutar el build de producción |
| `bun lint` | Revisar el código con ESLint |

## Estructura del Proyecto

```
fynz/
├── app/                     # Rutas (App Router)
│   ├── login/               # Página de inicio de sesión / registro
│   ├── page.tsx             # Dashboard (protegido)
│   ├── not-found.tsx        # Página 404 personalizada
│   ├── layout.tsx           # Layout raíz + proveedor de toasts
│   └── globals.css          # Tokens de diseño (variables CSS)
├── components/
│   ├── dev/                 # Herramientas de desarrollo (DevToastTester)
│   ├── login/               # Componentes de la pantalla de acceso
│   ├── ui/                  # Componentes base (input, button, toast, modal...)
│   └── LogoutButton.tsx
├── lib/
│   ├── supabase/            # Clientes de Supabase (server y client)
│   ├── acciones.ts          # Lógica de datos (cálculo de Disponible Real)
│   └── utils.ts             # Helpers (validación de email, traducciones)
├── proxy.ts                 # Guardián de rutas (sesión y redirecciones)
├── .env.local               # Credenciales públicas de Supabase
└── package.json
```

## Flujo de la Aplicación

1. El usuario entra a `/` sin sesión → el proxy lo redirige a `/login`.
2. Se registra o inicia sesión (correo + contraseña via Supabase Auth).
3. Con sesión activa, el Dashboard calcula el **Disponible Real** desde sus cuentas y pagos próximos.
4. Al cerrar sesión, un modal pide confirmación antes de cerrar: la sesión se destruye y el usuario vuelve a `/login`.

## Notas para Desarrollo

- **Herramientas de debug:** `components/dev/DevToastTester` permite probar los tres tipos de notificaciones (success/error/info) sin tocar la base de datos; solo aparece en modo desarrollo.
- **Componentes reutilizables:** `ConfirmDialog` y `useToast()` están disponibles para cualquier pantalla.
- **Colores centralizados:** la paleta vive en `app/globals.css` dentro de variables CSS; cambiar el tema de la app implica solo ajustar esas variables.
