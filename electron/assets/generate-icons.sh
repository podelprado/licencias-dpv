#!/bin/bash
# Genera assets/icon.png y assets/icon.ico
# Requiere: imagemagick (convert)
# En Windows usar: https://icoconvert.com

ASSETS_DIR="$(dirname "$0")/../assets"

# SVG base del ícono
cat > /tmp/icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#1d4ed8"/>
  <rect x="48" y="80" width="160" height="140" rx="12" fill="white" opacity="0.15"/>
  <rect x="48" y="80" width="160" height="140" rx="12" fill="none" stroke="white" stroke-width="8"/>
  <line x1="48" y1="116" x2="208" y2="116" stroke="white" stroke-width="8"/>
  <rect x="88" y="56" width="16" height="40" rx="8" fill="white"/>
  <rect x="152" y="56" width="16" height="40" rx="8" fill="white"/>
  <rect x="72" y="136" width="24" height="24" rx="4" fill="white" opacity="0.9"/>
  <rect x="116" y="136" width="24" height="24" rx="4" fill="#60a5fa"/>
  <rect x="160" y="136" width="24" height="24" rx="4" fill="white" opacity="0.9"/>
  <rect x="72" y="172" width="24" height="24" rx="4" fill="#34d399"/>
  <rect x="116" y="172" width="24" height="24" rx="4" fill="white" opacity="0.9"/>
  <rect x="160" y="172" width="24" height="24" rx="4" fill="white" opacity="0.9"/>
</svg>
EOF

if command -v convert &> /dev/null; then
  convert -background none /tmp/icon.svg -resize 256x256 "$ASSETS_DIR/icon.png"
  convert "$ASSETS_DIR/icon.png" -define icon:auto-resize=256,128,64,48,32,16 "$ASSETS_DIR/icon.ico"
  echo "Íconos generados en $ASSETS_DIR"
else
  echo "ImageMagick no disponible. Copiá manualmente icon.png e icon.ico a electron/assets/"
  # Copiar el SVG como fallback
  cp /tmp/icon.svg "$ASSETS_DIR/icon.svg"
fi
