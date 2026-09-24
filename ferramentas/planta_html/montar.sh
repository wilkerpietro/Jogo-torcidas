#!/bin/sh
# Monta a pasta da planta em HTML (a página que vira artefato): a página,
# a proposta de expansão e o que ela usa do jogo — a planta (sem a cena),
# as torcidas, os módulos 3D (com o three.js do CDN) e as folhas.
#
#   sh ferramentas/planta_html/montar.sh [pasta]      (padrão: /tmp/planta_html)
#
# index.html vai sem esqueleto (o artefato embrulha); pra abrir aqui,
# `python3 -m http.server -d <pasta>` e abra local.html, que é a mesma
# página com o <head> em utf-8.
set -e
R=$(cd "$(dirname "$0")/../.." && pwd)
A=${1:-/tmp/planta_html}
mkdir -p "$A/dados" "$A/js" "$A/img/texturas/modelos"
cp "$R/ferramentas/planta_html/index.html" "$A/"
cp "$R/ferramentas/planta_html/proposta.js" "$A/js/"
cp "$R/dados/torcidas.js" "$A/dados/"
n=$(grep -n '^TO.dados.cenaEstadio = (function(){' "$R/dados/cena_estadio.js" | cut -d: -f1)
head -n $((n - 1)) "$R/dados/cena_estadio.js" > "$A/dados/cena_estadio.js"
for f in construtor3d casas3d modelos3d props3d modelos_atlas; do
  sed "s#'../../vendor/three/three.module.min.js'#'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'#" \
    "$R/js/diajogo/$f.js" > "$A/js/$f.js"
done
for f in casas.jpg grades.png predio.jpg igreja.jpg loja.jpg adm.jpg casa.jpg atacadex.jpg torres.jpg props.jpg; do
  cp "$R/img/texturas/modelos/$f" "$A/img/texturas/modelos/"
done
{ printf '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n'
  cat "$A/index.html"; printf '</body></html>\n'; } > "$A/local.html"
du -sh "$A"
