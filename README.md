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
- **Interfaz Fluida:** componentes modulares, notificaciones tipo toast, diálogos de confirmación y animaciones accesibles (respetan `prefers-reduced-motion`).
- **Horizonte consciente:** el Disponible Real siempre indica el periodo (próximo ingreso, 7/15/30 días o fecha) y muestra la presión futura por separado.
- **Clic, Confirmar, Listo:** el cierre de sesión y las operaciones destructivas requieren confirmación.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router + Server Actions) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Animaciones | anime.js |
| Iconos | Lucide |
| Base de Datos y Auth | Supabase (PostgreSQL, RLS + RPC atómicas) |
| Entorno de Ejecución | Bun |

## Base de datos y seguridad

El esquema está versionado en `docs/sql/schema-v2.sql` (base nueva) y `docs/sql/migracion-v2.sql` (base existente; idempotente, converge al mismo estado). En ambas:

- Montos en **centavos enteros (bigint)** y fechas de negocio como **calendar date**.
- **Row Level Security habilitada** con políticas por usuario; toda escritura va por **RPC security definer** que valida la sesión y la propiedad de los recursos.
- Operaciones financieras **atómicas e idempotentes** (clave de idempotencia por operación) y **auditoría mínima** sin montos ni notas.
- En la app: Server Actions con `userId` desde la sesión (nunca del cliente) y errores traducidos a español.

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

Hay dos scripts equivalentes en `docs/sql/` que producen el **mismo estado final**:

| Proyecto | Usar | Qué hace |
|---|---|---|
| **Nuevo / vacío** | `docs/sql/schema-v2.sql` | Crea todo desde cero (tablas, CHECKs, FK, RLS, RPC) |
| **Existente con datos** | `docs/sql/migracion-v2.sql` | Convierte lo existente (¢×100, fechas `date`) y **converge** al mismo estado del schema v2 (sección 10) |

Ejecuta el que corresponda completo en **Supabase Dashboard → SQL Editor → Run**. La migración es idempotente y re-ejecutable: la guarda de tipos evita multiplicar los montos dos veces; su sección 10 incluye pre/post captura de conteos y diagnósticos de datos para confirmar que todo migró bien.

> Respalda tu proyecto antes de ejecutar: la conversión de montos es ×100 (solo migración de proyectos existentes).

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
| `bun test` | Pruebas automatizadas (lógica financiera pura) |
| `bun run lint` | Revisar el código con ESLint |

## Estructura del Proyecto

```
fynz/
├── app/                     # Rutas (App Router)
│   ├── login/               # Inicio de sesión / registro
│   ├── recuperar/           # Restablecer contraseña (enlace de Supabase)
│   ├── historial/           # Historial con filtros y relaciones
│   ├── page.tsx             # Dashboard (protegido)
│   └── layout.tsx           # Layout raíz + proveedor de toasts
├── components/
│   ├── dashboard/           # Vistas, filas, widgets, horizonte
│   ├── historial/           # Explorador y detalle de movimientos
│   ├── login/               # Pantalla de acceso y recuperación
│   ├── movimiento/          # Formularios (gasto, transferencia, pago)
│   ├── cuenta/ pago/        # Formularios de cuentas y pagos
│   └── ui/                  # Componentes base (input, button, toast, diálogos)
├── lib/
│   ├── supabase/            # Clientes de Supabase (server y client)
│   ├── acciones-servidor.ts # Server Actions (sesión + RPC atómicos)
│   ├── fechas/ dinero/      # Fechas calendario y centavos (dominio)
│   ├── horizonte/ ciclos/   # Motor del Disponible Real y ciclos de tarjeta
│   ├── simulador/           # Impacto en vivo de un gasto
│   └── errores.ts           # Traducción de errores SQL a español
├── docs/sql/                # Schema y migración versionados
├── proxy.ts                 # Guardián de rutas (sesión y redirecciones)
└── .env.local               # Credenciales públicas de Supabase
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
