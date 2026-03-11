---
description: Desplegar Fynz Frontend en GitHub Pages
---

# Deploy — Fynz Frontend en GitHub Pages

## Cómo funciona
El deploy usa **GitHub Actions** (`.github/workflows/deploy.yaml`).
Cada push a `main` ejecuta automáticamente:
1. `npm ci` (instalar dependencias)
2. `npm run build` (compilar con Vite)
3. Subir `dist/` a GitHub Pages

## Configuración inicial (solo una vez)

### 1. Activar GitHub Pages
1. Ve a **Settings** → **Pages** en el repo `Fynz`
2. En **Source**, selecciona **GitHub Actions**

### 2. Configurar variable de entorno
1. Ve a **Settings** → **Variables** → **Actions**
2. Crea una **Repository variable** (no secret):

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://fynz-api.onrender.com/api` |

### 3. Push y deploy
```bash
cd /Users/isaacabdiel/Isaac/fynz
git add -A
git commit -m "ci: agregar GitHub Actions para deploy"
git push origin main
```

El Action se ejecuta automáticamente. Ve el progreso en la pestaña **Actions** del repo.

## URL del sitio
`https://isaaca-dev.github.io/Fynz/`

## SPA Routing
GitHub Pages no soporta SPA routing nativamente.
Se usa un hack con `public/404.html` que redirige rutas a `index.html`.

## Troubleshooting
- **404 en rutas**: Verificar que `404.html` existe en `public/`
- **Assets no cargan**: Verificar que `base: '/Fynz/'` está en `vite.config.js`
- **API errors**: Verificar la variable `VITE_API_URL` en GitHub Settings
