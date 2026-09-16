# carrerasAPP v17.2

PWA **offline-first** de finanzas personales y gestión de mototaxi, diseñada para Venezuela. Toda la app vive en un único `index.html` autocontenido: se instala como PWA, funciona sin conexión y sincroniza con la nube cuando hay internet.

## Características principales

- **Offline-first (zero-loss):** los datos viven en `localStorage` y se sincronizan con Firestore cuando vuelve la conexión (fusión inteligente local/nube).
- **Hora Venezuela (UTC-4):** fechas y cierres calculados con la zona horaria local.
- **Tasa USDT/BCV automática:** consulta la tasa cripto (Binance P2P vía DolarAPI) y convierte Bs ⇄ USDT en todos los reportes.
- **Clientes individual / compartido / transporte:** conteo de carreras por cliente, modo compartido (tú + compañero), deuda pendiente y recordatorios por WhatsApp.
- **San / Ahorro:** registro de cuotas de san, parada semanal y cobros, con equivalente en USDT.
- **Cierres semanales y mensuales:** resúmenes de ingresos, gastos, diezmo y neto real; calendario global con detalle por día.
- **Reportes PDF:** generación de comprobantes y reportes con jsPDF.
- **Bloqueo con PIN / huella:** pantalla de bloqueo con PIN y WebAuthn (huella/biometría).
- **Pago por capture (OCR):** escaneo de comprobantes de bancos venezolanos (BDV, Banesco, etc.) con Tesseract.js para extraer monto y fecha automáticamente.
- **Widget cripto Binance:** tasa USDT en vivo en la barra superior.
- **Firebase sync:** respaldo en la nube con Firestore (persistencia offline habilitada).

## Stack

- **HTML + JavaScript vanilla** (sin framework, un solo archivo)
- **Chart.js** — gráficos de rendimiento y gastos
- **Tesseract.js** — OCR de captures bancarios
- **Firebase 8** (Firestore) — sincronización nube
- **jsPDF** — generación de PDF
- **Capacitor** — empaquetado como app Android/iOS

## Seguridad

> **Importante:** las reglas de Firestore deben **restringir el acceso** a `hugg_store/master_data` (por ejemplo, limitando lectura/escritura al usuario autenticado o deshabilitando el acceso público). La configuración del proyecto Firebase está embebida en el cliente, por lo que las reglas del lado del servidor son la única barrera real de protección de los datos.

## Estructura

```
index.html        # App completa (UI + lógica + datos por defecto)
assets/icon.png   # Ícono de la app (1024×1024)
```
