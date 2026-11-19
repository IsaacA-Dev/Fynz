# Fynz — Contexto del producto y estado actual

> Actualizado: 19 de noviembre de 2026.
>
> Este documento describe la promesa de Fynz, las reglas financieras que no deben romperse y lo que la aplicación hace hoy. Es la referencia para producto, diseño e ingeniería antes de planear nuevas fases.

## 1. La idea

Las aplicaciones bancarias muestran cuánto dinero existe en una cuenta, pero no cuánto puede gastarse con tranquilidad. Tener $10,000 disponibles no significa que estén libres si en los próximos días deben pagarse la renta, los servicios o la tarjeta de crédito.

Fynz responde una pregunta concreta:

> **¿Cómo quedo después de pagar lo que ya debo?**

Su promesa:

> **Fynz no solo te dice cuánto tienes; te ayuda a saber cuánto puedes gastar hoy sin descuidar tus próximos pagos.**

## 2. Principios del producto

- **El crédito nunca se presenta como dinero disponible.** Se muestra como deuda y capacidad de compra, siempre separado de la liquidez.
- **El Disponible Real siempre tiene un horizonte.** La interfaz indica hasta qué fecha se está calculando.
- **Una operación se registra una sola vez.** Pagar una tarjeta no vuelve a contar como gasto.
- **Todo cambio importante es trazable.** Ajustes, pagos y transferencias conservan su registro.
- **La aplicación es conservadora, pero no engañosa.** No oculta compromisos ni descuenta obligaciones lejanas sin explicar el periodo.
- **Registrar información toma pocos segundos.**
- **La calma está por encima de la saturación.** El color, las animaciones y los mensajes ayudan a comprender.
- **Fynz orienta decisiones; no sustituye al banco.** El resultado es una estimación basada en los datos registrados.

## 3. Modelo financiero central

### 3.1 Conceptos

- **Dinero líquido:** saldo de las cuentas de efectivo y débito. Las tarjetas de crédito no forman parte de este valor.
- **Compromiso pendiente:** obligación registrada que todavía no se ha pagado, cancelado o sustituido.
- **Gasto:** consumo o adquisición. Una compra con tarjeta es un gasto aunque el efectivo todavía no haya salido.
- **Flujo de efectivo:** entrada o salida de dinero líquido. Pagar una tarjeta es una salida de efectivo, pero no un gasto nuevo si las compras ya se registraron.
- **Horizonte:** fecha límite hasta la cual se consideran los compromisos para calcular el Disponible Real.
- **Ciclo de tarjeta:** periodo entre dos fechas de corte. Las compras se agrupan por ciclo y el pago de cada ciclo tiene su propia fecha límite.

### 3.2 Fórmula

> **Disponible Real hasta una fecha = Dinero líquido actual − Compromisos pendientes que vencen hasta esa fecha**

La interfaz siempre acompaña la cifra con su periodo:

- Disponible durante los próximos 15 días.
- Disponible hasta el 30 de septiembre.
- Disponible hasta el próximo ingreso.

### 3.3 Horizonte

1. Si existe una próxima fecha de ingreso registrada, se usa como horizonte.
2. Si no existe, se usan los próximos 30 días.
3. El usuario puede elegir 7, 15 o 30 días, o una fecha concreta.
4. Los pagos atrasados siempre se incluyen, sin importar el horizonte.
5. Los compromisos posteriores al horizonte no se restan del Disponible Real, pero aparecen en **Presión futura**.
6. Un ingreso estimado no aumenta el dinero líquido hasta que se registra como recibido; su fecha solo delimita el periodo.

### 3.4 Reglas que no deben romperse

- Una transferencia entre cuentas líquidas propias no altera el Disponible Real.
- Un gasto de efectivo o débito reduce el dinero líquido y el Disponible Real.
- Una compra con crédito aumenta la deuda y el gasto, pero no reduce el dinero líquido de inmediato.
- El impacto de una compra con crédito depende del ciclo en el que cae y de la fecha de pago de ese ciclo.
- Pagar una tarjeta reduce el dinero líquido y la deuda; también reduce o liquida el compromiso del ciclo.
- Cuando un compromiso se paga, deja de restarse como pendiente.
- Los importes se guardan en centavos, nunca en decimales de punto flotante.
- Las fechas de corte y vencimiento son fechas de calendario y no deben desplazarse por zona horaria.
- Una cuenta con historial no se elimina físicamente: se archiva y conserva sus movimientos.

## 4. Lo que ya está construido

### 4.1 Cuentas

Fynz permite crear, editar y retirar cuentas de:

- **Efectivo.**
- **Débito.**
- **Crédito.**

Efectivo y débito representan dinero líquido. Las tarjetas se muestran aparte, con la etiqueta **Crédito** y la deuda en rojo. El crédito disponible se calcula como límite menos deuda y nunca se suma al dinero líquido.

Cada cuenta parte de un saldo o deuda inicial. Si después se corrige, Fynz registra un **Ajuste de saldo** trazable. Modificar el límite de crédito no genera movimientos.

Retirar una cuenta la archiva: desaparece de las operaciones diarias, pero su historial y el nombre original se conservan. El historial reciente del panel y la pantalla `/historial` siguen mostrando el nombre real de la cuenta archivada.

### 4.2 Movimientos y categorías

Se pueden registrar ingresos y gastos indicando:

- Monto.
- Cuenta.
- Nota opcional.
- Categoría opcional.

Los movimientos usan la fecha del día en que se registran. En efectivo o débito, un ingreso aumenta el saldo y un gasto lo reduce. En crédito, una compra aumenta la deuda sin tocar la liquidez.

Las categorías se pueden crear, renombrar y eliminar. Al eliminar una categoría, los movimientos que la usaban quedan sin categoría; no se borran. La aplicación muestra cuántos movimientos la utilizan antes de confirmar.

### 4.3 Transferencias

Fynz mueve dinero entre cuentas líquidas propias sin alterar el Disponible Real. Las tarjetas no participan como origen ni destino de una transferencia ordinaria: pagar una tarjeta es una operación distinta que reduce liquidez, deuda y compromiso.

### 4.4 Próximos pagos

La sección **Próximos pagos** reúne los compromisos pendientes:

- **Pagos únicos**, con fecha de vencimiento.
- **Pagos mensuales**, con día de cobro recurrente.
- **Pagos domiciliados**, vinculados a una cuenta líquida.
- **Pagos de tarjeta**, generados por los ciclos de crédito.

Un pago mensual genera el siguiente periodo al liquidarse. El plan y cada instancia son entidades distintas: eliminar el plan no borra las instancias ya pagadas.

Si un pago domiciliado no alcanza a cubrirse con el saldo de su cuenta, aparece una alerta con el faltante. Si la fecha ya pasó y sigue pendiente, se muestra en rojo como **Atrasado**.

Los pagos recurrentes contemplan meses cortos, cambios de monto, cambio de cuenta domiciliada, reprogramación de una instancia y prevención de periodos duplicados. También se puede **adelantar el siguiente periodo** sin liquidar el actual.

### 4.5 Tarjetas de crédito y ciclos

El modelo de tarjetas ya no es una estimación de un único pago: Fynz calcula ciclos reales.

Cada tarjeta guarda:

- Deuda inicial.
- Límite de crédito opcional.
- Día de corte.
- Día límite de pago.

Para cada ciclo, el sistema:

1. Genera las fechas de corte desde la creación de la tarjeta hasta hoy.
2. Asigna cada compra al primer corte posterior a su fecha.
3. Aplica los pagos al ciclo más antiguo con deuda, de forma acumulativa.
4. Calcula el objetivo del ciclo como compras menos pagos.
5. Permite sustituir el objetivo por un **monto manual** tomado del estado de cuenta y registrar un **mínimo del banco**.
6. Guarda un historial de ciclos (`ciclo_tarjeta`) con saldo, pagos, objetivo, mínimo y estado abierto/cerrado.
7. Genera un compromiso **“Pago estimado de la tarjeta … · Ciclo …”** cuando el corte ya ocurrió y queda deuda por pagar.

El compromiso se re-sincroniza después de cada compra, pago, edición de tarjeta o cambio de monto manual. Los pagos pueden ser totales o parciales: un pago parcial reduce el compromiso del ciclo y la deuda, sin crear un segundo gasto.

Si una compra ocurre después del corte, pertenece al siguiente ciclo y no aumenta el pago del ciclo ya cerrado. Los pagos atrasados de ciclos anteriores se siguen mostrando como compromisos vencidos.

### 4.6 Simulador de compras

El simulador está integrado en el formulario de gasto y compra. Antes de confirmar, responde:

> **Si compro esto, ¿cómo quedo después de mis pagos?**

El cálculo usa el monto, la cuenta y el horizonte actuales, con la fecha de hoy.

- **Efectivo o débito:** muestra el Disponible Real antes y después, indica si los pagos del horizonte siguen cubiertos y alerta si alguna cuenta domiciliada quedaría sin fondos.
- **Crédito:** muestra la deuda antes y después, el ciclo al que pertenece la compra, la fecha límite, el pago estimado del ciclo y el Disponible Real resultante. Si el pago queda fuera del horizonte, lo dice expresamente.

La simulación no registra nada hasta que la persona confirma la operación.

### 4.7 Historial

`/historial` permite consultar todos los movimientos con:

- Rango de fechas.
- Cuenta.
- Tipo: ingresos, egresos o todos.
- Operación: ingreso, gasto, compra, pago, pago de tarjeta, transferencia, ajuste o movimiento.
- Estado: todos o atrasados.
- Categoría.
- Búsqueda por descripción.
- Paginación.

Cada movimiento abre un detalle en panel lateral con su relación: cuenta de origen, pareja de una transferencia, pago liquidado, tarjeta, categoría y fecha. El historial conserva los nombres de cuentas archivadas.

### 4.8 Panel adaptable

En teléfonos, la experiencia se organiza en tres pestañas:

- **Inicio:** Disponible Real, horizonte, resumen, acciones rápidas y cuentas.
- **Pagos:** próximos pagos y presión futura.
- **Historial:** movimientos recientes y acceso al historial completo.

La navegación inferior es fija y reserva espacio al final del scroll para no tapar la última tarjeta. En pantallas grandes, el panel usa una cuadrícula de hasta cuatro columnas que se adapta al ancho disponible.

Desde **Editar panel** se puede:

- Reordenar bloques.
- Cambiar el ancho de cada bloque.
- Cambiar la altura de los bloques (el hero tiene altura automática).
- Quitar bloques.
- Elegir entre los diseños **Clásico**, **Columna**, **Compacto** y **Analítico**.
- Añadir widgets y configurar sus filtros.

El hero ocupa una fila cuando no hay alertas ni presión futura, y crece a dos solo cuando aparece contenido adicional real.

### 4.9 Reordenar con drag & drop accesible

El panel se reordena arrastrando bloques. El bloque arrastrado sigue al puntero, los demás se desplazan y la configuración se guarda al soltar.

La misma acción está disponible con teclado desde el asa de cada bloque: Enter o espacio para tomar el bloque, flechas para moverlo, Enter o espacio para soltar y Escape para cancelar y volver a la posición anterior. El asa conserva el foco y expone su estado con `aria-pressed` mientras se reordena. El orden y la configuración se guardan por usuario.

### 4.10 Widgets

El catálogo actual incluye:

- **Saldo por cuenta:** barras de saldos líquidos y deuda de tarjeta.
- **Flujo del mes:** ingresos contra gastos por mes.
- **Carga de pagos:** acumulación de compromisos pendientes en el tiempo.
- **Gastos por categoría:** distribución del gasto por categoría.
- **Distribución de saldos:** proporción del dinero líquido por cuenta.
- **Promedio diario de gasto:** gasto medio y días cubiertos.

Cada widget puede añadirse más de una vez y tiene filtros propios. El catálogo y la disposición se guardan por usuario y se conservan entre sesiones y dispositivos.

### 4.11 Identidad visual devsign y modo Noche

La interfaz usa el sistema **devsign**: componentes y primitivas compartidas, tokens semánticos de color, tipografía, radios, sombras y movimiento. Los pares principales de color buscan contraste AA y el rojo se reserva para deuda, atraso, insuficiencia o acciones destructivas.

Existen dos temas intercambiables:

- **Fynz:** claro, cálido y tranquilo.
- **Noche:** oscuro, con superficies profundas y acentos azules.

El tema se elige desde la cabecera, se guarda en el dispositivo y se aplica antes de pintar para evitar destellos. Las animaciones explican cambios de estado y respetan `prefers-reduced-motion`.

### 4.12 Sesión y comunicación

El acceso es con correo y contraseña. Incluye:

- Registro de cuenta.
- Inicio y cierre de sesión con confirmación.
- Recuperación de contraseña por correo y pantalla de enlace inválido.
- Mensajes de éxito, advertencia y error sin exponer detalles técnicos.

Si Supabase ya crea la sesión al registrarse, Fynz entra directamente al panel. Si la confirmación por correo está activa, muestra el aviso para revisar el buzón.

## 5. Calidad y QA

### 5.1 Pruebas automatizadas

`bun test` cubre **153 pruebas en 14 archivos**, entre ellas:

- Disponible Real y horizontes.
- Transferencias y conservación de liquidez.
- Pagos únicos, recurrentes y atrasados.
- Ciclos de tarjeta: compras antes y después del corte, pagos totales y parciales, monto manual y mínimo.
- Simulador de compras.
- Categorías, historial y filtros.
- Formato de dinero en centavos y fechas de calendario.
- Layout, presets, widgets y drag & drop.
- Errores, logs y recuperación.

Los gates del proyecto son:

```bash
bunx tsc --noEmit
bun run lint
bun test
bun run build
```

### 5.2 QA end-to-end

El recorrido E2E completo quedó **superado** con datos sintéticos en Supabase, en tema Fynz y Noche, escritorio y móvil de 390 px. Se corrigieron y volvieron a probar los hallazgos:

- **P0:** sincronización de compromisos de tarjeta y abono desde la UI.
- **P1:** cierre del Sheet padre por un diálogo anidado y scroll horizontal en escritorio.
- **P2:** nombre de cuentas archivadas en el historial reciente, densidad móvil y mensaje de registro con sesión automática.
- **P3:** altura automática del hero y semántica del estado inicial.

El flujo probado incluye registro, login, recuperación, cuentas de los tres métodos, pagos de los cuatro tipos, horizontes, simulador, gastos, ingresos, transferencias, abono a tarjeta, historial con filtros y detalle, archivado de cuentas, temas y navegación móvil.

## 6. Seguridad e integridad

- Cada tabla financiera tiene **Row Level Security** por usuario.
- Las operaciones críticas pasan por funciones `security definer` que validan `auth.uid()`.
- Los movimientos usan **idempotencia** para evitar duplicados por reintentos o doble toque.
- Los importes se guardan en **centavos**.
- Las fechas de negocio se tratan como fechas de calendario.
- Los errores que ve el usuario son genéricos; el detalle técnico queda del lado del servidor sin exponer montos, notas ni datos sensibles en la interfaz.
- El historial conserva cuentas archivadas y relaciones entre operaciones.

Antes de producción todavía deben formalizarse respaldos, exportación/eliminación de datos, monitoreo y una revisión de seguridad independiente.

## 7. Límites actuales y fuera del MVP

Fynz no incluye todavía:

- Sincronización automática con bancos.
- Intereses, comisiones, reembolsos o contracargos.
- Compras a meses o mensualidades.
- Múltiples monedas o conversiones.
- Presupuestos compartidos o cuentas familiares.
- Adelantos de efectivo desde tarjetas.
- Puntos, cashback o recompensas.
- Analítica externa con datos financieros.

El registro de movimientos usa la fecha del día. La edición retroactiva de la fecha de un movimiento no forma parte del alcance actual.

## 8. Un día con Fynz

1. La persona abre Fynz y ve su Disponible Real con el horizonte utilizado.
2. Revisa los compromisos incluidos y, si existe, la presión futura.
3. Registra ingresos y gastos conforme ocurren.
4. Antes de una compra importante, usa el simulador para comparar efectivo, débito o crédito.
5. Si una cuenta no alcanza para un cobro domiciliado, Fynz indica cuánto falta.
6. Al cubrir una obligación, la liquida desde la cuenta de origen; si es un pago mensual, se genera el siguiente periodo.
7. Cuando cierra un ciclo de tarjeta, aparece el pago estimado y puede ajustarse al monto del estado de cuenta.
8. Consulta el historial para entender cualquier cambio y conserva la trazabilidad aunque archive una cuenta.

## 9. Criterio para considerar Fynz listo para producción

- El Disponible Real siempre explica su horizonte.
- Las tarjetas asignan compras y pagos a sus ciclos correctamente.
- Ninguna operación se contabiliza dos veces.
- Los saldos resisten reintentos y operaciones simultáneas.
- El historial permite rastrear cada cambio y sus relaciones.
- Todos los recursos están protegidos por usuario y validados en el servidor.
- Existen recuperación, respaldo, exportación y eliminación segura de datos.
- Las reglas críticas están cubiertas por pruebas automatizadas y QA end-to-end.
- La interfaz comunica cuándo los datos pueden estar desactualizados.

## 10. La promesa

Fynz debe seguir creciendo alrededor de una sola idea:

> **Ayudarte a saber cuánto puedes gastar hoy sin descuidar lo que tendrás que pagar después.**
