# Fynz — Contexto del producto y estado actual

Este documento es la fuente de verdad del producto. Describe la promesa de Fynz, las reglas financieras que no deben romperse, lo que ya está construido, las simplificaciones actuales y el trabajo pendiente antes de utilizar la aplicación con información financiera real.

## 1. La idea

Las aplicaciones bancarias muestran cuánto dinero existe en una cuenta, pero no necesariamente cuánto puede gastarse con tranquilidad. Tener $10,000 disponibles no significa que los $10,000 estén realmente libres si durante los próximos días deben pagarse la renta, servicios o una tarjeta de crédito.

Además, algunas interfaces presentan el crédito disponible cerca del dinero propio, lo que puede producir una percepción equivocada de capacidad económica. El crédito no es liquidez ni riqueza: es capacidad de endeudamiento que tendrá que pagarse posteriormente.

Fynz nace para reducir la fricción mental y la ansiedad de calcular todo antes de cada compra. Su propósito no es solamente registrar movimientos, sino responder una pregunta concreta:

> **¿Cómo quedo después de pagar lo que ya debo?**

La propuesta de Fynz puede resumirse así:

> **Fynz no solo te dice cuánto tienes; te ayuda a saber cuánto puedes gastar hoy sin descuidar tus próximos pagos.**

## 2. Principios del producto

Todas las decisiones funcionales y visuales deben respetar estos principios:

- **El crédito nunca se presenta como dinero disponible.** Puede mostrarse como capacidad de compra, pero siempre separado de la liquidez.
- **El Disponible Real siempre tiene un horizonte.** La cifra debe indicar hasta qué fecha se está calculando.
- **Una operación económica se registra una sola vez.** Un pago no debe duplicar un gasto ya reconocido.
- **Todo cambio importante debe ser trazable.** Los ajustes, pagos y correcciones deben conservar un registro comprensible.
- **La aplicación debe ser conservadora, pero no engañosa.** No debe ocultar compromisos ni descontar obligaciones lejanas sin explicar el periodo considerado.
- **Registrar información debe tomar pocos segundos.** La precisión no debe convertir el uso diario en una tarea pesada.
- **La calma está por encima de la saturación.** Los colores, mensajes, gráficas y animaciones deben ayudar a comprender, no aumentar la ansiedad.
- **Fynz orienta decisiones; no sustituye al banco.** Si la información se registra manualmente, el resultado es una estimación basada en los datos capturados por el usuario.

## 3. Modelo financiero central

### 3.1 Conceptos

**Dinero líquido:** suma de los saldos actuales de las cuentas de efectivo y débito. Las líneas de crédito no forman parte de este valor.

**Compromiso pendiente:** obligación registrada que todavía no ha sido pagada, cancelada o sustituida. Puede ser un pago único, una instancia de un plan recurrente o el pago de una tarjeta.

**Gasto:** momento en el que se adquiere o consume algo. Una compra con tarjeta de crédito es un gasto aunque el dinero líquido todavía no haya salido.

**Flujo de efectivo:** entrada o salida de dinero líquido. Pagar una tarjeta es una salida de efectivo, pero no un gasto nuevo si las compras ya fueron registradas como gastos.

**Horizonte:** fecha límite hasta la cual se consideran los compromisos para calcular el Disponible Real.

### 3.2 Fórmula

> **Disponible Real hasta una fecha = Dinero líquido actual − Compromisos pendientes que vencen hasta esa fecha**

La interfaz nunca debe mostrar únicamente “Disponible Real”. Debe indicar el periodo, por ejemplo:

- Disponible hasta el próximo ingreso.
- Disponible durante los próximos 15 días.
- Disponible hasta el 30 de septiembre.

### 3.3 Horizonte predeterminado

La evolución recomendada es utilizar el siguiente criterio:

1. Si existe una próxima fecha de ingreso registrada, se utiliza como horizonte predeterminado.
2. Si no existe, se utilizan los próximos 30 días y la interfaz lo comunica claramente.
3. El usuario puede cambiar el horizonte a 7, 15 o 30 días, o seleccionar una fecha.
4. Los pagos atrasados siempre se incluyen, independientemente del horizonte seleccionado.
5. Los compromisos posteriores al horizonte no se descuentan de esa cifra, pero deben mostrarse en una sección de presión futura para que no desaparezcan de la decisión.
6. Un ingreso estimado no aumenta el dinero líquido hasta que realmente se registra como recibido. Su fecha sirve para delimitar el periodo, no para gastar anticipadamente ese dinero.

### 3.4 Reglas que no deben romperse

- Una transferencia entre dos cuentas líquidas propias no altera el Disponible Real.
- Un gasto de efectivo o débito disminuye el saldo líquido y, por lo tanto, el Disponible Real.
- Una compra con crédito aumenta el gasto y la deuda, pero no disminuye inmediatamente el dinero líquido.
- El impacto de una compra con crédito sobre el Disponible Real depende de la fecha de pago del ciclo en el que cae la compra.
- Pagar una tarjeta disminuye el dinero líquido y la deuda. También reduce o liquida el compromiso correspondiente, por lo que la compra no vuelve a contabilizarse como gasto.
- Cuando un compromiso se paga, deja de restarse como pendiente.
- Marcar un pago como pagado debe afectar el saldo y el compromiso una sola vez, aunque la solicitud se repita.
- Los importes deben almacenarse en unidades monetarias menores —por ejemplo, centavos— y no mediante números decimales de punto flotante.
- Las fechas de corte y vencimiento son fechas de calendario y no deben cambiar de día por conversiones de zona horaria.
- Una cuenta con historial no debe eliminarse físicamente; debe archivarse para conservar la trazabilidad.

## 4. Qué hace actualmente la aplicación

### 4.1 Cuentas

Fynz permite actualmente crear, editar y eliminar cuentas de:

- Efectivo.
- Débito.
- Crédito.

Las cuentas de efectivo y débito representan dinero líquido. Las cuentas de crédito representan deuda y se muestran separadas, con la etiqueta **Crédito** y el monto adeudado en rojo para evitar que parezca dinero disponible.

Cada cuenta comienza con un saldo inicial. Si el saldo o la deuda se modifica posteriormente, Fynz registra un movimiento de **Ajuste de saldo** para que el cambio sea trazable y se aplique una sola vez.

Antes de producción, la eliminación deberá sustituirse por archivado cuando la cuenta tenga movimientos o pagos relacionados. De esta manera podrá desaparecer de las operaciones diarias sin romper el historial.

En las tarjetas de crédito se pueden registrar actualmente:

- Deuda actual.
- Límite de crédito opcional.
- Día de corte.
- Día límite de pago.

El crédito disponible se muestra como límite menos deuda. Modificar el límite no genera un movimiento porque cambia la capacidad de crédito, no el dinero ni la deuda.

### 4.2 Movimientos

Registrar un movimiento requiere:

- Monto.
- Cuenta relacionada.
- Tipo de movimiento.
- Nota opcional.

Los movimientos disponibles son ingresos, gastos, transferencias y ajustes de saldo.

En efectivo o débito, un ingreso aumenta el saldo y un gasto lo disminuye. En crédito, una compra aumenta la deuda sin reducir el dinero líquido. Todos los movimientos permanecen registrados en el historial.

### 4.3 Transferencias

Fynz permite mover dinero entre cuentas líquidas propias, por ejemplo, al depositar efectivo en una cuenta de débito. Esta operación no modifica el Disponible Real porque el dinero solamente cambia de ubicación.

Una salida desde una cuenta líquida hacia una tarjeta no debe modelarse como una transferencia ordinaria: es un **pago de tarjeta** que reduce simultáneamente la liquidez, la deuda y el compromiso asociado.

Los adelantos de efectivo desde una tarjeta y otros movimientos que convierten crédito en efectivo quedan fuera del alcance actual.

### 4.4 Próximos pagos

La sección de próximos pagos concentra los compromisos económicos que deben considerarse antes de gastar. Actualmente permite registrar:

- **Pagos únicos**, con una fecha de vencimiento específica.
- **Pagos mensuales**, asociados a un día de cobro recurrente.
- **Pagos domiciliados**, vinculados con la cuenta líquida desde la que se realizará el cobro.

Cuando se completa un pago mensual, Fynz genera la instancia del siguiente periodo. El plan continúa activo hasta que el usuario lo elimine o desactive.

El plan recurrente y cada una de sus instancias deben tratarse como entidades diferentes. Eliminar un plan impide generar pagos futuros, pero no borra el historial de las instancias ya pagadas.

Cuando un pago domiciliado no puede cubrirse con el saldo de la cuenta seleccionada, la aplicación muestra una alerta e indica cuánto dinero falta. Si la fecha de vencimiento ya pasó y el compromiso continúa abierto, se muestra en rojo con el estado **Atrasado**.

Los pagos recurrentes ya contemplan:

- Días 29, 30 o 31 en meses más cortos.
- Modificación del monto.
- Cambio de la cuenta domiciliada.
- Eliminación del plan sin borrar pagos anteriores.
- Reprogramación de una instancia pendiente sin alterar el día habitual de los siguientes periodos.
- Prevención de pagos duplicados y de generación repetida del siguiente periodo.

Los pagos anticipados o el adelanto de ciclos continúan pendientes.

### 4.5 Pago de compromisos

Cuando llega el momento de cubrir una obligación, el usuario puede marcarla como pagada y elegir la cuenta de la que salió el dinero.

Fynz actualiza el saldo, registra la salida correspondiente y elimina el compromiso del cálculo de pendientes. La operación debe ser idempotente: un mismo compromiso no puede pagarse dos veces por error, repetición de la solicitud o doble toque.

### 4.6 Historial

La pantalla principal muestra los movimientos recientes para recordar qué ocurrió, cuándo ocurrió y qué cuenta estuvo involucrada.

Todavía falta una pantalla de historial completo con búsqueda y filtros por:

- Fecha.
- Cuenta.
- Tipo de operación.
- Estado.
- Categoría, cuando las categorías se incorporen a los movimientos.

El detalle de una operación deberá mostrar sus relaciones. Por ejemplo, un pago de tarjeta debe poder vincularse con la tarjeta, la cuenta líquida utilizada y el compromiso que liquidó.

### 4.7 Diseño adaptable

En teléfonos, el contenido se distribuye actualmente en tres pestañas principales:

- Datos.
- Pagos.
- Historial.

Como mejora de lenguaje, **Datos** debería evaluarse frente a nombres más claros como **Inicio** o **Resumen**.

En pantallas grandes, Fynz se transforma en un panel: el Disponible Real aparece en la parte superior y las cuentas, pagos e historial se distribuyen en columnas. Cada sección incluye una opción de **Ver más** para acceder al contenido completo.

El panel de escritorio se adapta al ancho de la ventana: cuatro columnas en pantallas amplias y dos cuando la ventana es más angosta. Desde **Editar panel** se puede elegir entre diseños predefinidos (Clásico, Columna, Compacto y Analítico) que reordenan y ajustan el tamaño de las secciones y widgets sin eliminar nada. Los bloques también pueden reordenarse arrastrándolos; el bloque arrastrado sigue al cursor, los demás se deslizan a su nuevo lugar y es posible moverlos con el teclado desde el asa de cada bloque.

### 4.8 Tablero de widgets

Los widgets son opcionales. La primera vez que una persona inicia sesión ve la experiencia principal con Disponible Real, acciones, cuentas, pagos e historial. Desde **Crear widget** puede añadir elementos a una zona secundaria y reordenarlos arrastrando. El encabezado financiero principal permanece fijo.

El catálogo actual contiene:

- **Saldo por cuenta:** barras con saldos líquidos en azul y deuda de tarjeta en rojo; puede filtrarse por tipo de cuenta.
- **Flujo del mes:** comparación de ingresos y gastos durante 1, 3 o 6 meses.
- **Carga de pagos:** acumulación de compromisos pendientes en el tiempo, con horizontes completo, 7, 15 o 30 días y el pago individual más grande.

Cada widget posee configuración propia y puede añadirse más de una vez. El orden y la configuración se guardan por usuario y se conservan entre sesiones y dispositivos.

La expansión del catálogo queda pausada hasta estabilizar el cálculo financiero, el historial y el simulador. En especial, los widgets por categoría requieren primero incorporar categorías a los movimientos.

### 4.9 Sesión y comunicación

El acceso se realiza mediante correo electrónico y contraseña. Para evitar cierres accidentales, Fynz solicita confirmación antes de terminar la sesión.

Las operaciones importantes muestran mensajes de confirmación o advertencia con lenguaje claro y amigable. Los errores no deben exponer información sensible ni obligar al usuario a interpretar mensajes técnicos.

## 5. Estado actual de las tarjetas de crédito

### 5.1 Implementación simplificada

Fynz registra deuda, límite, día de corte y día límite de pago. Al crear una tarjeta con deuda, genera un próximo pago, y las compras posteriores actualizan la deuda y el compromiso.

Este comportamiento es todavía una **estimación simplificada**: la deuda completa se aproxima mediante un único próximo pago y todavía no se separan las compras por ciclo. Por ello, una compra realizada después del corte podría asignarse a una fecha demasiado cercana.

Mientras el modelo completo no esté terminado, el compromiso generado automáticamente debe mostrarse como **Pago estimado de tarjeta** y no como una cantidad bancaria exacta. Para datos reales, el usuario debe poder sustituir la estimación por el pago indicado en su estado de cuenta.

### 5.2 Modelo objetivo

El modelo completo deberá distinguir, como mínimo:

- Deuda total actual.
- Ciclo abierto y ciclos cerrados.
- Saldo al corte.
- Pago para no generar intereses o monto objetivo del ciclo.
- Pago mínimo, si el usuario desea registrarlo como referencia.
- Compras anteriores y posteriores al corte.
- Fecha límite correspondiente a cada ciclo.
- Pagos totales y parciales.

Una compra debe asignarse al ciclo que corresponda según su fecha. Una compra posterior al corte pertenece al siguiente ciclo y no debe aumentar el pago del ciclo ya cerrado.

El pago parcial reduce la deuda, registra una salida de dinero líquido y disminuye el compromiso del ciclo. El pago total lo liquida. Ninguno de los dos genera un segundo gasto.

### 5.3 Funcionalidades posteriores

Después de estabilizar los ciclos básicos podrán evaluarse:

- Compras a meses o mensualidades.
- Intereses y comisiones.
- Reembolsos y contracargos.
- Varias tarjetas con ciclos distintos —el modelo debe soportarlo desde el inicio, aunque las pruebas se agreguen progresivamente—.

## 6. Simulador de compras

El simulador es una pieza central de la propuesta y todavía está pendiente. Debe responder:

> **Si compro algo de $1,500, ¿cómo quedo después de mis pagos?**

El usuario indicará:

- Monto.
- Medio de pago: efectivo, débito o una tarjeta específica.
- Fecha de la compra, utilizando hoy como valor predeterminado.

La simulación no registra la operación hasta que el usuario decida confirmarla.

### Resultado con efectivo o débito

Debe mostrar:

- Disponible Real actual.
- Disponible Real después de la compra.
- Pagos que continuarían cubiertos.
- Alertas de cuentas domiciliadas que quedarían sin fondos suficientes.

### Resultado con crédito

Debe mostrar dos momentos para que el crédito nunca parezca dinero gratuito:

- **Impacto hoy:** nueva deuda y gasto registrado, sin reducción inmediata de liquidez.
- **Impacto al pagar:** ciclo estimado, fecha límite, próximo pago y Disponible Real en el horizonte afectado.

Si el pago de la tarjeta queda fuera del horizonte actual, la aplicación debe decirlo expresamente y mostrar el compromiso futuro en lugar de presentar una mejora artificial del Disponible Real.

## 7. Uso en un día cualquiera

1. La persona abre Fynz y ve su Disponible Real junto con el horizonte utilizado.
2. Revisa los compromisos incluidos y la presión de pagos posteriores.
3. Registra ingresos y gastos conforme ocurren para mantener actualizados los saldos.
4. Cuando cubre una obligación, la marca como pagada y elige la cuenta de origen.
5. Antes de una compra importante, utiliza el simulador para comparar efectivo, débito o crédito.
6. Si una cuenta no tiene fondos suficientes para un cobro domiciliado, Fynz indica cuánto falta y cuándo se necesita.
7. La interfaz muestra cuándo se actualizaron por última vez los datos y recuerda discretamente verificarlos cuando llevan tiempo sin revisarse.

## 8. Identidad y experiencia

- **Logo:** monograma con forma de moneda y un destello, creado para Fynz.
- **Sensación:** calma, claridad y control.
- **Lenguaje:** directo, amigable y sin tecnicismos financieros innecesarios.
- **Prioridad visual:** primero la información necesaria para decidir; después el detalle y las gráficas.
- **Principio visual:** la deuda y el crédito nunca deben confundirse con riqueza.

La información principal debe comprenderse en pocos segundos. El color rojo se reserva para deuda, atraso, insuficiencia o una acción destructiva; no debe utilizarse para decorar ni castigar al usuario.

### Animaciones

Las animaciones deben explicar cambios de estado y reforzar la sensación de control:

- Entrada suave del símbolo.
- Transición progresiva de montos cuando cambia el Disponible Real.
- Confirmación visual al registrar un movimiento o pagar un compromiso.
- Movimiento discreto entre estados y pestañas.
- Aparición clara, no agresiva, de alertas.
- Dibujo progresivo de gráficas.

Ninguna animación debe retrasar el registro de una operación. Todas deben respetar `prefers-reduced-motion`, evitar reproducirse innecesariamente y conservar una alternativa instantánea.

## 9. Calidad, seguridad e integridad

### 9.1 Pruebas existentes

Las reglas principales ya cuentan con pruebas automatizadas mediante `bun test` y lógica pura en `lib/logica-financiera.test.ts`:

- Una transferencia entre cuentas líquidas no altera el Disponible Real.
- Un pago no se descuenta dos veces.
- Un pago mensual genera el siguiente periodo.
- Un compromiso pagado deja de aparecer como pendiente.
- Un pago atrasado conserva su estado.
- El crédito no se suma al dinero líquido.
- Una compra con crédito aumenta la deuda sin disminuir la liquidez.
- Las alertas de fondos insuficientes calculan cuánto falta.
- Un ajuste manual genera su movimiento en el historial.

### 9.2 Pruebas pendientes

Antes de producción deben cubrirse:

- Cálculo por horizonte y cambio de fecha seleccionada.
- Inclusión permanente de pagos atrasados.
- Compras antes, durante y después del día de corte.
- Meses con distinta duración y cambios de año.
- Pago total, parcial y repetido de tarjetas.
- Separación entre gasto y salida de efectivo.
- Edición, reversión y archivado de operaciones relacionadas.
- Operaciones concurrentes sobre una misma cuenta.
- Reintentos de red sin duplicar movimientos.
- Manejo consistente de centavos y redondeos.
- Fechas de calendario sin desplazamientos por zona horaria.

### 9.3 Seguridad para producción

La aplicación utiliza actualmente reglas simplificadas adecuadas para desarrollo. Antes de utilizar información financiera real deben formalizarse:

- Autorización por usuario para cuentas, movimientos, tarjetas, widgets y pagos.
- Validaciones completas en el servidor.
- Protección contra lectura o modificación de recursos de otras personas.
- Políticas de acceso a la base de datos.
- Manejo seguro de sesiones y credenciales.
- Recuperación de contraseña.
- Operaciones atómicas para saldos, deudas y pagos.
- Registro controlado de acciones críticas sin guardar montos, notas o datos sensibles innecesarios.
- Manejo de errores sin exponer detalles internos.
- Respaldo y recuperación de información.
- Estrategia para exportar o eliminar los datos de una cuenta.

Hasta completar esta etapa, Fynz debe considerarse un producto en desarrollo y no una aplicación preparada para manejar información financiera real en producción.

## 10. Analítica de producto y privacidad

Fynz puede incorporar analítica para mejorar la experiencia, pero no debe enviar montos, saldos, descripciones, nombres de cuentas ni notas personales a servicios externos.

Eventos útiles y no sensibles:

- Tiempo necesario para registrar un movimiento.
- Uso del simulador y medio de pago comparado.
- Porcentaje de usuarios que configura su siguiente ingreso.
- Widgets añadidos o eliminados.
- Errores y operaciones fallidas.
- Frecuencia con la que se actualizan saldos.
- Uso de alertas de fondos insuficientes.

Las métricas principales del producto deberían responder si Fynz está reduciendo fricción:

- Comprensión del Disponible Real en pocos segundos.
- Registro de un movimiento en menos de diez segundos.
- Uso recurrente antes de compras importantes.
- Disminución de compromisos vencidos sin fondos suficientes.
- Reducción de ajustes manuales causados por información desactualizada.

## 11. Frontera actual

### Pendientes prioritarios de producto

- Definir e implementar el horizonte del Disponible Real.
- Mostrar la fecha y calidad de actualización de los datos.
- Completar el historial consultable y la trazabilidad entre operaciones.
- Construir el simulador de compras.
- Completar el modelo de ciclos de tarjeta o conservar explícitamente el modo estimado.
- Incorporar categorías antes de crear analíticas por tipo de gasto.
- Resolver pagos anticipados en planes recurrentes.

### Pendientes prioritarios de ingeniería

- Usar centavos y fechas de calendario como reglas de dominio.
- Hacer atómicas e idempotentes las operaciones financieras.
- Archivar cuentas y planes sin romper el historial.
- Cubrir concurrencia, reintentos, reversión y ciclos de tarjetas con pruebas.
- Completar autorización, validación, recuperación y respaldos.

### Alcance fuera del MVP

Para proteger el enfoque inicial, no forman parte del MVP:

- Sincronización automática con bancos.
- Inversiones o portafolios.
- Contabilidad fiscal.
- Presupuestos familiares compartidos.
- Múltiples monedas y conversiones.
- Adelantos de efectivo desde tarjetas.
- Recompensas, puntos o cashback.
- Cálculo detallado de intereses y compras a meses, hasta estabilizar los ciclos básicos.

## 12. Orden recomendado de desarrollo

### Etapa 1 — Cerrar el núcleo financiero

1. Implementar el horizonte y mostrarlo junto al Disponible Real.
2. Formalizar las reglas de gasto, flujo de efectivo, deuda y compromisos.
3. Asegurar importes en centavos, fechas de calendario, operaciones atómicas e idempotencia.
4. Etiquetar el pago automático actual de tarjeta como estimación o implementar ciclos correctos.

### Etapa 2 — Completar la promesa del producto

1. Crear el historial completo con relaciones y filtros.
2. Construir el simulador para efectivo, débito y crédito.
3. Incorporar actualización y verificación rápida de saldos.
4. Agregar categorías y separar analítica de gastos de flujo de efectivo.

### Etapa 3 — Preparar producción

1. Completar autorización, validaciones y políticas de datos.
2. Añadir recuperación de cuenta, respaldos y manejo seguro de errores.
3. Completar las pruebas de concurrencia, reintentos, tarjetas y fechas.
4. Realizar pruebas con datos sintéticos y escenarios financieros límite.

### Etapa 4 — Refinar la experiencia

1. Evaluar la navegación y el nombre de la pestaña Datos.
2. Medir el uso de widgets antes de ampliar el catálogo.
3. Incorporar animaciones funcionales y accesibles.
4. Mejorar analíticas sin recopilar información financiera sensible.

## 13. Criterio para considerar Fynz listo

Fynz estará listo para manejar información real cuando:

- El Disponible Real siempre explique su horizonte.
- Las tarjetas asignen correctamente compras y pagos a sus ciclos, o se identifiquen claramente como estimaciones manuales.
- Ninguna compra, transferencia o pago pueda contabilizarse dos veces.
- Los saldos se mantengan consistentes ante reintentos y operaciones simultáneas.
- El historial permita entender y rastrear cada cambio.
- Todos los recursos estén protegidos por usuario y validados en el servidor.
- Existan recuperación, respaldo y eliminación segura de información.
- Las reglas críticas estén cubiertas por pruebas automatizadas.
- La interfaz comunique cuándo los datos pueden estar desactualizados.

Fynz debe seguir creciendo alrededor de una sola promesa:

> **Ayudarte a saber cuánto puedes gastar hoy sin descuidar lo que tendrás que pagar después.**
