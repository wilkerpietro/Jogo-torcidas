#!/bin/sh
# Monta a pasta do CENÁRIO 3D pro GitHub Pages: a mesma pasta da planta
# (montar.sh), com o index.html inteiro (o <head> em utf-8, o título e o
# viewport) abrindo direto no cenário — a lista das praças; escolhida a
# praça, o mapa do porte dela em 3D. O botão "Planta 2D" fecha o cenário e
# mostra a planta, que é a mesma página por baixo; planta.html abre só a
# planta.
#
#   sh ferramentas/planta_html/montar_pages.sh [pasta]    (padrão: /tmp/cenario3d)
#
# A pasta vai inteira pra cenario3d/ na branch que o GitHub Pages publica.
# Pra abrir aqui: `python3 -m http.server -d <pasta>` e abra index.html.
set -e
R=$(cd "$(dirname "$0")/../.." && pwd)
A=${1:-/tmp/cenario3d}
rm -rf "$A"
sh "$R/ferramentas/planta_html/montar.sh" "$A" > /dev/null
cabeca() {
  printf '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'
  printf '<title>%s</title>\n<meta name="description" content="%s">\n' "$1" "$2"
}
{ cabeca 'Cenário 3D das praças' 'O mapa de cada praça do jogo em 3D, montado pela planta da cidade: as casas, as favelas, os bares e as sedes das torcidas, os estádios, o metrô, a praia ou a lagoa e o mato.'
  printf '<script>window.__CENARIO = true;</script>\n</head>\n<body>\n'
  cat "$A/index.html"; printf '</body>\n</html>\n'; } > "$A/index.tmp"
{ cabeca 'Planta da Cidade do Estádio' 'A planta dos três mapas da cidade do estádio, com o que se clica aberto em 3D.'
  printf '</head>\n<body>\n'
  cat "$A/index.html"; printf '</body>\n</html>\n'; } > "$A/planta.html"
mv "$A/index.tmp" "$A/index.html"
rm -f "$A/local.html"
du -sh "$A"
