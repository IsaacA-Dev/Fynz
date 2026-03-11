---
description: Compilar el frontend de Fynz para producción
---

# Build — Fynz Frontend

## Pasos

// turbo-all

1. Instalar dependencias:
```bash
cd /Users/isaacabdiel/Isaac/fynz/fynz && npm install
```

2. Limpiar build anterior (si existe):
```bash
rm -rf /Users/isaacabdiel/Isaac/fynz/fynz/dist
```

3. Compilar para producción:
```bash
cd /Users/isaacabdiel/Isaac/fynz/fynz && npm run build
```

4. (Opcional) Previsualizar el build:
```bash
cd /Users/isaacabdiel/Isaac/fynz/fynz && npm run preview
```

El preview estará en `http://localhost:4173`.

## Output
El build genera la carpeta `dist/` con:
- `index.html` — Punto de entrada
- `assets/` — JS y CSS optimizados y minificados
