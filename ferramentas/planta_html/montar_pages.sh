#!/bin/sh
# Monta a pasta do CENÁRIO 3D pro GitHub Pages: a mesma pasta da planta
# (montar.sh), com o index.html inteiro (o <head> em utf-8, o título e o
# viewport) abrindo direto no cenário — a lista das praças; escolhida a
# praça, o mapa do porte dela em 3D. O botão "Planta 2D" fecha o cenário e
# mostra a planta, que é a mesma página por baixo; planta.html abre só a
# planta; jogo.html abre o jogo em 3D (o jogo de feed por cima da praça).
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
# OS ARQUIVOS COM VERSÃO (conserto de 28/09/2026): o GitHub Pages manda o
# navegador guardar cada arquivo por 10 minutos, e recarregar logo depois
# de uma publicação misturava a página e a folha novas com módulos velhos
# guardados (no jogo 3D, a decisão ficou pendente sem balão nenhum). Cada
# módulo, script e folha que a página carrega leva um ?v= com o hash do
# que foi montado: a página nova só pede arquivo novo, e a velha, o velho.
python3 - "$A" <<'PY'
import hashlib, os, re, sys
A = sys.argv[1]
h = hashlib.sha1()
for pasta in ('js', 'css', 'dados'):
    for raiz, subs, arqs in os.walk(os.path.join(A, pasta)):
        subs.sort()
        for a in sorted(arqs):
            h.update(open(os.path.join(raiz, a), 'rb').read())
h.update(open(os.path.join(A, 'index.html'), 'rb').read())
V = h.hexdigest()[:10]
CAMINHOS = [
    r"(\bfrom\s*['\"])(\.{1,2}/[A-Za-z0-9_./-]+\.js)(['\"])",
    r"(\bimport\(\s*['\"])(\.{1,2}/[A-Za-z0-9_./-]+\.js)(['\"])",
    r"(\bcarregarScript\(\s*['\"])((?:\./)?(?:dados|js)/[A-Za-z0-9_./-]+\.js)(['\"])",
    r"(\bcarregarCss\(\s*['\"])((?:\./)?css/[A-Za-z0-9_./-]+\.css)(['\"])",
    r"(\bnew URL\(\s*['\"])(\.\./dados/[A-Za-z0-9_./-]+\.js)(['\"])",
]
total = 0
alvos = [os.path.join(A, 'index.html')] + sorted(os.path.join(A, 'js', a) for a in os.listdir(os.path.join(A, 'js')) if a.endswith('.js'))
for f in alvos:
    t = open(f, encoding='utf-8').read()
    n = 0
    for rx in CAMINHOS:
        t, k = re.subn(rx, lambda m: m.group(1) + m.group(2) + '?v=' + V + m.group(3), t)
        n += k
    if n:
        open(f, 'w', encoding='utf-8').write(t)
        total += n
print('versão %s: %d caminhos' % (V, total))
PY
cabeca() {
  printf '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'
  printf '<title>%s</title>\n<meta name="description" content="%s">\n' "$1" "$2"
}
{ cabeca 'Cenário 3D das praças' 'O mapa de cada praça do jogo em 3D, montado pela planta da cidade: as casas, as favelas, os bares e as sedes das torcidas, os estádios, o metrô, a praia ou a lagoa e o mato.'
  printf '<script>window.__CENARIO = true;</script>\n</head>\n<body>\n'
  cat "$A/index.html"; printf '</body>\n</html>\n'; } > "$A/index.tmp"
# O JOGO EM 3D (27/09/2026): a mesma página com o jogo de feed por cima
# da praça (js/jogo3d.js)
{ cabeca 'Torcida Organizada 3D' 'O jogo Torcida Organizada por cima da praça em 3D: o menu, a barra de cima, os painéis e os dias passando, com a cidade da torcida atrás e os recados chegando em balão, na boca de quem os traz.'
  printf '<script>window.__JOGO = true;</script>\n</head>\n<body>\n'
  cat "$A/index.html"; printf '</body>\n</html>\n'; } > "$A/jogo.html"
{ cabeca 'Planta da Cidade do Estádio' 'A planta dos três mapas da cidade do estádio, com o que se clica aberto em 3D.'
  printf '</head>\n<body>\n'
  cat "$A/index.html"; printf '</body>\n</html>\n'; } > "$A/planta.html"
mv "$A/index.tmp" "$A/index.html"
rm -f "$A/local.html"
du -sh "$A"
