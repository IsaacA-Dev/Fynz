# Fynz — Contexto del producto y estado actual

## La idea

Las aplicaciones bancarias muestran cuánto dinero hay en una cuenta, pero no necesariamente cuánto se puede gastar con tranquilidad. Ver $10,000 disponibles no significa que los $10,000 estén realmente libres si en los próximos días deben pagarse la renta, la luz, una tarjeta y varios servicios.

Además, algunas interfaces mezclan el dinero líquido con las líneas de crédito disponibles, lo que puede producir una falsa sensación de capacidad económica. El crédito no es dinero propio: es una deuda potencial que deberá pagarse después.

Fynz nace para reducir esa fricción mental y la ansiedad de tener que calcularlo todo antes de cada compra. Su propósito no es solamente registrar movimientos, sino responder una pregunta concreta:

> **¿Cómo quedo después de pagar lo que ya debo?**

La propuesta de Fynz puede resumirse así:

> **Fynz no solo te dice cuánto tienes; te dice cuánto puedes gastar sin descuidar tus próximos pagos.**

## La fórmula central

> **Disponible Real = Dinero Líquido − Pagos Próximos**

El cálculo se basa en reglas sencillas:

* El dinero líquido es lo que realmente tienes disponible en cuentas de débito y efectivo.

* El límite disponible de una tarjeta de crédito jamás se cuenta como dinero a favor.

* Una compra realizada con crédito aumenta la deuda, pero no disminuye el dinero líquido hasta que se paga la tarjeta.

* Los pagos próximos representan compromisos que ya adquiriste y que todavía están pendientes.

* Las transferencias entre cuentas propias no aumentan ni disminuyen el Disponible Real, porque el dinero solamente cambia de lugar.

* Cuando un compromiso se paga, deja de restarse como pago pendiente y el dinero sale de la cuenta seleccionada.

El objetivo es que el usuario pueda tomar decisiones con base en dinero verdaderamente utilizable y no únicamente en el saldo mostrado por su banco.

## Qué hace actualmente la app

### Mis cuentas

Puedes crear, editar y eliminar cuentas de débito, efectivo o crédito. Cada cuenta comienza con un valor inicial que puede ajustarse posteriormente cuando sea necesario.

En las cuentas de débito y efectivo, el saldo inicial representa dinero líquido disponible. En las cuentas de crédito, el monto registrado representa la deuda actual y se mantiene separado del dinero líquido. Estas cuentas se distinguen dentro de la lista con la etiqueta **Crédito** y la deuda se muestra en rojo, para que nunca parezca dinero disponible. El límite total y el crédito disponible formarán parte del modelo completo de tarjetas descrito en la **Frontera actual**.

Para una cuenta de crédito se pueden definir, al crearla o editarla, la **deuda actual** (lo que hoy correspondes, 0 para una tarjeta nueva), el **límite de crédito** (opcional) y el **día de corte** con el **día límite de pago** de la tarjeta (ambos editables). Fynz muestra el **crédito disponible** (límite − deuda) y genera automáticamente en **Próximos pagos** el pago de la tarjeta: al crearla por la deuda registrada, al comprar con ella se actualiza el monto pendiente y su fecha de vencimiento sigue el ciclo de corte y pago. Los cambios del límite no generan movimientos porque no representan dinero, solo capacidad.

El saldo puede ajustarse al editar la cuenta: el campo muestra el saldo (o la deuda) actual y, si lo cambias, Fynz registra un movimiento de **Ajuste de saldo** en el historial, para que el cambio sea trazable y se aplique una sola vez.

### Gastos e ingresos

Registrar un movimiento toma pocos segundos. Solo se necesita indicar:

* El monto.

* La cuenta relacionada.

* El tipo de movimiento.

* Una nota opcional.

En las cuentas de débito y efectivo, los ingresos aumentan el saldo disponible y los gastos lo disminuyen. En las cuentas de crédito, una compra aumenta la deuda registrada, pero no reduce el dinero líquido. Todos los movimientos quedan registrados en el historial.

### Transferencias entre cuentas

Puedes mover dinero entre tus propias cuentas, por ejemplo, al depositar efectivo en una cuenta de débito.

Una transferencia no modifica el Disponible Real, porque no representa un ingreso ni un gasto. El dinero sigue siendo tuyo; solamente cambió de cuenta.

### Próximos pagos

Esta sección concentra los compromisos económicos que deben considerarse antes de gastar.

Actualmente permite registrar:

* **Pagos únicos**, con una fecha de vencimiento específica.

* **Pagos mensuales**, asociados a un día de cobro recurrente.

* **Pagos domiciliados**, vinculados con la cuenta desde la que se realizará el cobro.

Cuando se completa un pago mensual, Fynz genera automáticamente el compromiso del siguiente mes. El plan continúa activo hasta que el usuario decida eliminarlo.

Si un pago está domiciliado y el saldo de la cuenta seleccionada no es suficiente para cubrirlo antes de su vencimiento, la aplicación muestra una alerta e indica cuánto dinero falta exactamente.

Cuando la fecha de vencimiento ya pasó y el compromiso continúa abierto, se muestra en rojo con el estado **Atrasado**.

### Pago de compromisos

Cuando llega el momento de cubrir una obligación, el usuario puede marcarla como pagada y seleccionar la cuenta de la que salió el dinero.

La aplicación actualiza el saldo correspondiente y elimina ese compromiso del cálculo de pagos pendientes.

### Historial reciente

La pantalla principal muestra los movimientos más recientes para que el usuario pueda recordar rápidamente qué ocurrió, cuándo ocurrió y qué cuenta estuvo involucrada.

Un historial completo y consultable, más allá de los últimos movimientos, está pendiente de construirse (ver **Frontera actual**).

### Diseño adaptable

En teléfonos, el contenido se organiza en tres pestañas principales:

* Datos.

* Pagos.

* Historial.

Una barra de navegación inferior permite cambiar rápidamente entre ellas.

En pantallas grandes, Fynz se transforma en un panel con la información principal visible al mismo tiempo: el Disponible Real aparece en la parte superior y las cuentas, pagos e historial se distribuyen en columnas.

Cada sección incluye una opción de **Ver más** para acceder al contenido completo cuando sea necesario.

### Sesión y comunicación con el usuario

El acceso se realiza mediante correo electrónico y contraseña. Para evitar cierres accidentales, la aplicación solicita confirmación antes de terminar la sesión.

Las operaciones importantes muestran mensajes de confirmación o advertencia con un lenguaje claro y amigable.

## Cómo se usa en un día cualquiera

1. Abres Fynz y observas inmediatamente cuánto dinero tienes realmente disponible después de considerar tus compromisos abiertos.

2. Registras los ingresos y gastos conforme ocurren para mantener actualizados los saldos de tus cuentas.

3. Cuando llega la fecha de una obligación, la marcas como pagada y eliges de qué cuenta salió el dinero.

4. Antes de realizar una compra, revisas tu Disponible Real y las alertas de pagos domiciliados para saber si necesitas conservar parte del dinero.

5. Si una cuenta no tiene fondos suficientes para cubrir un cobro próximo, Fynz te indica cuánto necesitas agregar antes de la fecha de vencimiento.

## Identidad del producto

* **Logo propio:** un monograma con forma de moneda y un destello, diseñado especialmente para Fynz.

* **Sensación buscada:** calma, claridad y control.

* **Lenguaje:** directo y amigable, sin términos financieros innecesariamente complicados.

* **Prioridad visual:** mostrar primero la información necesaria para tomar una decisión.

* **Principio central:** el crédito no debe presentarse como riqueza ni como dinero disponible.

Fynz busca evitar interfaces saturadas y números que generen presión. La información importante debe poder entenderse en pocos segundos.

## Frontera actual

Fynz ya cuenta con el flujo principal para administrar cuentas, movimientos y compromisos. Quedan tres frentes de trabajo antes de considerar el producto listo para producción: **producto**, **calidad y seguridad**, y **pulido y experiencia**.

### Pendientes de producto

**Historial completo consultable.** La pantalla principal muestra los últimos movimientos; falta una pantalla para consultar con más detalle los ingresos, gastos, transferencias y pagos registrados.

**Horizonte del Disponible Real.** Actualmente, el cálculo considera los pagos próximos registrados sin definir formalmente hasta qué fecha deben incluirse. Falta establecer si el horizonte llegará hasta el siguiente ingreso, utilizará un periodo de 7, 15 o 30 días, o permitirá seleccionar una fecha. La evolución propuesta se desarrolla en **Dirección del producto**.

**Modelo completo de tarjetas de crédito.** El ciclo mínimo ya está disponible: deuda actual y límite de crédito editables (el crédito disponible se muestra como límite − deuda), día de corte y día límite de pago editables, generación automática del próximo pago de la tarjeta (por la deuda registrada y mantenido al día con cada compra) y pago desde una cuenta líquida que baja la deuda sin contabilizar dos veces la compra original. Queda pendiente del modelo completo:

* Pago total, pago parcial y pago mínimo.

* Compras a meses o mensualidades, si se incorporan posteriormente.

* Varias tarjetas con ciclos distintos.

* Periodización detallada de compras por ciclo (qué compra cae en qué corte).

Una compra con crédito debe aumentar la deuda, pero no disminuir inmediatamente el dinero líquido. Al pagar la tarjeta, el dinero debe salir de una cuenta líquida y reducir la deuda correspondiente.

Este flujo deberá evitar que una misma compra se contabilice dos veces: primero como gasto y después nuevamente como gasto al pagar la tarjeta.

**Simulador de compras.** Está pendiente incorporar la función:

> **Si compro algo de $1,500, ¿cómo quedo después de mis pagos?**

El simulador deberá mostrar el Disponible Real resultante sin registrar inmediatamente la operación. También deberá considerar si la compra se realizará con efectivo, débito o crédito, ya que cada opción afecta de manera diferente la liquidez y las obligaciones futuras.

**Casos especiales de pagos recurrentes.** El sistema mensual ya genera el siguiente compromiso. De los casos especiales, ya están cubiertos:

* Pagos configurados para los días 29, 30 o 31: el sistema ajusta automáticamente cuando el mes tiene menos días.

* Modificar el monto de una mensualidad (editar el pago).

* Cambiar la cuenta domiciliada (editar el pago).

* Eliminar un plan sin borrar su historial: los pagos anteriores permanecen en el historial.

* Reprogramación de compromisos atrasados: al editar un pago mensual se puede ajustar la fecha de la instancia pendiente, sin alterar el día de cobro de los siguientes periodos.

* Prevención de pagos duplicados del mismo periodo: una vez liquidado, un compromiso no puede volver a pagarse ni generar otra vez el siguiente periodo.

Y quedan pendientes:

* Pagos anticipados (adelantar el ciclo).

### Pendientes de calidad y seguridad

**Reglas financieras y pruebas automatizadas.** Las reglas principales del cálculo ya están protegidas por pruebas automatizadas (`bun test`, lógica pura en `lib/logica-financiera.test.ts`):

* Una transferencia no altera el Disponible Real.

* Un pago no se descuenta dos veces.

* Un pago mensual genera correctamente el siguiente periodo.

* Un compromiso pagado deja de aparecer como pendiente.

* Un pago atrasado conserva correctamente su estado.

* El crédito nunca se suma al dinero líquido.

* Una compra con crédito aumenta la deuda sin disminuir el dinero líquido.

* Las alertas de fondos insuficientes calculan correctamente el monto faltante.

* Un ajuste manual de saldo genera su movimiento correspondiente en el historial.

Y quedan pendientes de pruebas, a medida que se agreguen tarjetas, fechas de corte y simulaciones:

* El pago de una tarjeta reduce la deuda y el dinero líquido sin contabilizar dos veces el gasto original.

* Los movimientos concurrentes no producen saldos inconsistentes.

**Seguridad para producción.** La aplicación funciona actualmente con reglas de seguridad simplificadas adecuadas para su etapa de desarrollo. Antes de utilizarla con información financiera real deberán formalizarse:

* Autorización por usuario para cuentas, movimientos y pagos.

* Validaciones completas en el servidor.

* Protección contra la modificación de recursos pertenecientes a otros usuarios.

* Manejo seguro de sesiones y credenciales.

* Recuperación de contraseña.

* Políticas de acceso a la base de datos.

* Registro controlado de operaciones críticas.

* Manejo de errores sin exponer información sensible.

* Respaldo y recuperación de información.

Hasta completar esta etapa, Fynz debe considerarse un producto en desarrollo y no una aplicación preparada para manejar datos financieros reales en producción.

### Pulido y experiencia

**Animaciones y refinamiento visual.** También están en camino nuevas animaciones para el logo, los montos y las transiciones principales:

* Entrada suave del símbolo.

* Números que cambian progresivamente.

* Confirmaciones visuales al registrar movimientos.

* Transiciones discretas entre estados.

* Alertas claras sin resultar agresivas.

Estas animaciones deben reforzar la sensación de calma y comprensión, sin retrasar las operaciones ni distraer de la información financiera.

## Dirección del producto

El valor principal de Fynz no está solamente en registrar gastos ni en mostrar un historial. Su elemento diferenciador es convertir cuentas, movimientos y obligaciones en una respuesta útil antes de tomar una decisión de compra.

### Evolución propuesta: el horizonte del Disponible Real

Actualmente, el cálculo utiliza el dinero líquido y los pagos próximos registrados, sin definir formalmente hasta qué fecha deben considerarse esos compromisos.

La evolución más útil sería calcular:

> **Disponible Real hasta el próximo ingreso = Dinero Líquido − Pagos que vencen antes del próximo ingreso**

Para conseguirlo, Fynz deberá permitir registrar la fecha y el monto estimado del siguiente ingreso. Como alternativa, el usuario podría seleccionar un horizonte de 7, 15 o 30 días, o elegir una fecha determinada.

Esta definición es necesaria para evitar que el cálculo sea demasiado conservador o que compromisos muy lejanos reduzcan innecesariamente el dinero disponible de hoy.

Por eso, las siguientes etapas deben priorizar:

1. La exactitud del cálculo del Disponible Real.

2. La definición completa del comportamiento de las tarjetas de crédito.

3. La prevención de duplicidades e inconsistencias.

4. La seguridad y las pruebas necesarias para producción.

5. El simulador de compras.

6. Las animaciones y el refinamiento de la experiencia.

Fynz debe seguir creciendo alrededor de una sola promesa:

> **Ayudarte a saber cuánto puedes gastar hoy sin descuidar lo que tendrás que pagar después.**
