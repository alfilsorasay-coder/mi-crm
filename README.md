# Nexo CRM — landing

Landing page de presentación del CRM con tienda digital y marketing del programa
Vibe Coder Next (Módulo 1, misión 1.14).

Una sola página, sin frameworks ni dependencias: HTML con CSS embebido y un servidor
Node mínimo para publicarla.

## Estructura

| Archivo | Para qué |
|---|---|
| `index.html` | La landing completa (HTML + CSS + iconos SVG en línea) |
| `server.js` | Servidor estático de ~70 líneas, sin dependencias |
| `package.json` | Arranque con `npm start` (lo que usa Railway) |

## Ejecutar en local

```powershell
cd "Mi CRM"
npm start
# abrir http://localhost:3000
```

También funciona abriendo `index.html` directamente en el navegador.

## Desplegar

```powershell
railway init
railway up
railway domain
```

Railway detecta el `package.json`, ejecuta `npm start` y expone el puerto de `PORT`.

## Decisiones de diseño

- **Sin dependencias**: nada que actualizar ni que rompa el build; el deploy tarda segundos.
- **Sin recursos externos**: tipografías del sistema e iconos SVG en línea, así no hay
  peticiones a terceros ni parpadeos de fuentes.
- **Accesible**: un solo `h1`, landmarks semánticos, foco visible, enlace de salto,
  contraste alto y `prefers-reduced-motion`.
- **Responsive real**: una columna en móvil y tres en escritorio, con tipografía fluida
  mediante `clamp()`.
