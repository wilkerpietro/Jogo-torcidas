#!/bin/sh
# Monta a pasta da planta em HTML (a página que vira artefato): a página,
# a proposta de expansão, o cenário 3D (cenario.js, e passo.js, onde o
# corpo do boneco bate; a pasta do GitHub
# Pages sai de montar_pages.sh, por cima desta) e o que ela usa do jogo —
# a planta (sem a cena), o boneco do jogo (que anda a pé no cenário),
# as torcidas, os clubes e as praças (o porte decide o mapa), os escudos
# (embutidos), os módulos 3D (com o three.js do CDN) e as folhas.
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
cp "$R/ferramentas/planta_html/proposta.js" "$R/ferramentas/planta_html/cenario.js" "$R/ferramentas/planta_html/passo.js" "$A/js/"
cp "$R/dados/torcidas.js" "$R/dados/times.js" "$R/dados/cidades.js" "$R/dados/escudos.js" "$A/dados/"
# os escudos do jogo (img/escudos/, 278 PNG) não cabem como arquivo solto
# (o artefato tem teto de 255 arquivos): vão embutidos num arquivo só, no
# `window.__EMBUTIDOS` do jogo de arquivo único — só os das torcidas dos
# dados e os dos clubes delas, que são os que a sede usa
python3 - "$R" "$A" <<'PY'
import base64, json, os, sys
R, A = sys.argv[1], sys.argv[2]
ids = set()
for linha in open(os.path.join(R, 'dados/torcidas.js'), encoding='utf-8'):
    linha = linha.strip().rstrip(',')
    if not linha.startswith('{"id"'):
        continue
    t = json.loads(linha)
    ids.add('torcida-' + t['id'])
    if t.get('clubeId'):
        ids.add('clube-' + t['clubeId'])
emb = {}
for nome in sorted(ids):
    f = os.path.join(R, 'img/escudos', nome + '.png')
    if os.path.exists(f):
        emb['img/escudos/' + nome + '.png'] = 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode('ascii')
with open(os.path.join(A, 'dados/escudos_embutidos.js'), 'w', encoding='utf-8') as s:
    s.write('/* os PNG de img/escudos/ embutidos (montar.sh): %d escudos */\n' % len(emb))
    s.write('window.__EMBUTIDOS = Object.assign(window.__EMBUTIDOS || {}, ')
    json.dump(emb, s, separators=(',', ':'))
    s.write(');\n')
PY
n=$(grep -n '^TO.dados.cenaEstadio = (function(){' "$R/dados/cena_estadio.js" | cut -d: -f1)
head -n $((n - 1)) "$R/dados/cena_estadio.js" > "$A/dados/cena_estadio.js"
for f in construtor3d casas3d sede3d metro3d equip3d equip_antigo3d modelos3d props3d modelos_atlas arvores_lowpoly mato3d praia3d; do
  sed "s#'../../vendor/three/three.module.min.js'#'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'#" \
    "$R/js/diajogo/$f.js" > "$A/js/$f.js"
done
# O BONECO que anda a pé no cenário: o módulo do jogo (bonecos3.js), o
# carregador de GLB que ele usa (vendor/three/GLTFLoader.js), os dois
# apontando pro three.js do CDN, e o modelo em base64 num .js — o
# carregador do jogo lê dali sem pedir arquivo, e o cenário só puxa esse
# .js (3,6 MB) quando alguém entra a pé
sed -e "s#'../../vendor/three/three.module.min.js'#'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'#" \
    -e "s#'../../vendor/three/GLTFLoader.js'#'./GLTFLoader.js'#" \
    -e "s#'../../img/boneco.glb'#'../img/boneco.glb'#" \
  "$R/js/diajogo/bonecos3.js" > "$A/js/bonecos3.js"
sed "s#'./three.module.min.js'#'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'#" \
  "$R/vendor/three/GLTFLoader.js" > "$A/js/GLTFLoader.js"
python3 - "$R/img/boneco.glb" "$A/dados/boneco_glb.js" <<'PY'
import base64, sys
b = open(sys.argv[1], 'rb').read()
with open(sys.argv[2], 'w', encoding='ascii') as s:
    s.write('/* o boneco do jogo (img/boneco.glb, %d bytes) em base64 (montar.sh) */\n' % len(b))
    s.write('window.TO = window.TO || { dados: {} }; TO.dados = TO.dados || {};\n')
    s.write("TO.dados.bonecoGLB = 'data:model/gltf-binary;base64,%s';\n" % base64.b64encode(b).decode('ascii'))
PY
for f in casas.jpg grades.png predio.jpg igreja.jpg loja.jpg adm.jpg casa.jpg atacadex.jpg torres.jpg props.jpg metro.jpg equip.jpg praia.jpg; do
  cp "$R/img/texturas/modelos/$f" "$A/img/texturas/modelos/"
done
# as três variantes de cor da folha das torres (pintar_variantes.py)
cp "$R/ferramentas/planta_html/texturas/"torres_v*.jpg "$A/img/texturas/modelos/"
{ printf '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n'
  cat "$A/index.html"; printf '</body></html>\n'; } > "$A/local.html"
du -sh "$A"
