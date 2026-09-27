#!/bin/sh
# Monta a pasta da planta em HTML (a página que vira artefato): a página,
# a proposta de expansão, o cenário 3D (cenario.js; passo.js, onde o
# corpo do boneco bate na rua, e subsolo.js, onde ele pisa no metrô; a
# pasta do GitHub Pages sai de montar_pages.sh, por cima desta) e o que
# ela usa do jogo —
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
cp "$R/ferramentas/planta_html/proposta.js" "$R/ferramentas/planta_html/cenario.js" "$R/ferramentas/planta_html/passo.js" "$R/ferramentas/planta_html/subsolo.js" "$R/ferramentas/planta_html/dia_de_jogo.js" "$R/ferramentas/planta_html/vida3d.js" "$A/js/"
# as rotas de dentro dos estádios do dia de jogo (GERADO por rotas_estadios.mjs)
cp "$R/js/diajogo/rotas_estadios.js" "$A/js/"
cp "$R/dados/torcidas.js" "$R/dados/times.js" "$R/dados/cidades.js" "$R/dados/estadios.js" "$R/dados/escudos.js" "$A/dados/"
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
# apontando pro three.js do CDN, e o modelo em base64 num .js — os dois
# níveis afinados (img/boneco_perto.glb e boneco_longe.glb, de
# ferramentas/afinar_boneco.mjs); o carregador do jogo lê dali sem pedir
# arquivo, e o cenário só puxa esse .js (~0,6 MB) quando alguém entra a pé
sed -e "s#'../../vendor/three/three.module.min.js'#'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'#" \
    -e "s#'../../vendor/three/GLTFLoader.js'#'./GLTFLoader.js'#" \
    -e "s#'../../img/boneco#'../img/boneco#" \
  "$R/js/diajogo/bonecos3.js" > "$A/js/bonecos3.js"
sed "s#'./three.module.min.js'#'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'#" \
  "$R/vendor/three/GLTFLoader.js" > "$A/js/GLTFLoader.js"
# OS ESTÁDIOS DO JOGO (estadios3d.js): o módulo, o exportador de .glb que
# ele carrega quando alguém baixa (vendor/three/GLTFExporter.js, com o
# TextureUtils.js do lado), tudo apontando pro three.js do CDN, e as
# fotos de referência (a do protótipo e a dos setores do dono)
sed -e "s#'../../vendor/three/three.module.min.js'#'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'#" \
    -e "s#'../../vendor/three/GLTFExporter.js'#'./GLTFExporter.js'#" \
  "$R/js/diajogo/estadios3d.js" > "$A/js/estadios3d.js"
for f in GLTFExporter TextureUtils; do
  sed "s#'./three.module.min.js'#'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'#" \
    "$R/vendor/three/$f.js" > "$A/js/$f.js"
done
mkdir -p "$A/img/referencias"
cp "$R/ferramentas/planta_html/referencias/"estadio_*.webp "$A/img/referencias/"
python3 - "$R/img/boneco_perto.glb" "$R/img/boneco_longe.glb" "$A/dados/boneco_glb.js" <<'PY'
import base64, sys
with open(sys.argv[3], 'w', encoding='ascii') as s:
    s.write('/* o boneco do jogo, os dois niveis afinados (img/boneco_perto.glb e boneco_longe.glb) em base64 (montar.sh) */\n')
    s.write('window.TO = window.TO || { dados: {} }; TO.dados = TO.dados || {};\n')
    for chave, arq in (('bonecoPertoGLB', sys.argv[1]), ('bonecoLongeGLB', sys.argv[2])):
        b = open(arq, 'rb').read()
        s.write("TO.dados.%s = 'data:model/gltf-binary;base64,%s';\n" % (chave, base64.b64encode(b).decode('ascii')))
PY
for f in casas.jpg grades.png predio.jpg igreja.jpg loja.jpg adm.jpg casa.jpg atacadex.jpg torres.jpg props.jpg metro.jpg equip.jpg praia.jpg; do
  cp "$R/img/texturas/modelos/$f" "$A/img/texturas/modelos/"
done
# as três variantes de cor da folha das torres (pintar_variantes.py)
cp "$R/ferramentas/planta_html/texturas/"torres_v*.jpg "$A/img/texturas/modelos/"
# O JOGO EM 3D (?jogo; js/jogo3d.js): o jogo de feed (o index.html da raiz)
# por cima do cenário. A casca (o HTML sem os scripts) vira um módulo
# (js/jogo_casca.js); os scripts, na ordem do index.html, um arquivo só
# (js/jogo.js) — menos os do boneco clássico (o Three r147 e o GLB em
# base64): quem desenha o boneco das cenas é o do cenário, pendurado por
# bonecos3_global.js; o CSS, um arquivo só (css/jogo.css), e o jogo3d.css
# que põe cada pedaço no lugar; as fotos das cenas de briga (as .webp que
# os dados citam) e, embutidos num .js, os escudos de todos os clubes, as
# fotos das praças e as bandeiras (o IMG() do jogo lê de lá)
mkdir -p "$A/css" "$A/img/cenas"
cp "$R/ferramentas/planta_html/jogo3d.js" "$A/js/"
cp "$R/ferramentas/planta_html/jogo3d.css" "$A/css/"
# O BONECO DAS CENAS 2D DO JOGO é outra cópia do módulo (bonecos3_cena.js):
# o bonecos3.js guarda a cena e a câmera de quem o usa num estado só, e o
# cenário (a vida da praça, a reunião na sala da sede) já está nele — a
# cena de briga 2D, montando o dela, tomava a cidade (27/09/2026)
cp "$A/js/bonecos3.js" "$A/js/bonecos3_cena.js"
sed "s#from './bonecos3.js'#from './bonecos3_cena.js'#" "$R/js/diajogo/bonecos3_global.js" > "$A/js/bonecos3_global.js"
python3 - "$R" "$A" <<'PY'
import base64, json, os, re, sys
R, A = sys.argv[1], sys.argv[2]
html = open(os.path.join(R, 'index.html'), encoding='utf-8').read()
corpo = html[html.index('<body'):]
corpo = corpo[corpo.index('>') + 1:corpo.rindex('</body>')]
scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', corpo)
casca = re.sub(r'<script\b[^>]*>.*?</script>\s*', '', corpo, flags=re.S)
casca = re.sub(r'<!--.*?-->\s*', '', casca, flags=re.S).strip()
with open(os.path.join(A, 'js/jogo_casca.js'), 'w', encoding='utf-8') as s:
    s.write('/* a casca do jogo de feed: o <body> do index.html da raiz, sem os scripts (GERADO por montar.sh) */\n')
    s.write('export const CASCA = ' + json.dumps(casca, ensure_ascii=False) + ';\n')
fora = {'js/lib/three.min.js', 'js/lib/GLTFLoader.js', 'js/lib/SkeletonUtils.js', 'dados/boneco_leve_glb.js'}
with open(os.path.join(A, 'js/jogo.js'), 'w', encoding='utf-8') as s:
    s.write('/* O JOGO DE FEED (Torcida Organizada), os scripts do index.html da raiz\n   na mesma ordem, num arquivo só (GERADO por montar.sh) */\n')
    n = 0
    for src in scripts:
        if src in fora:
            continue
        s.write('\n/* ===== %s ===== */\n' % src)
        s.write(open(os.path.join(R, src), encoding='utf-8').read())
        s.write('\n;\n')
        n += 1
print('jogo.js: %d scripts' % n)
css = re.findall(r'<link\s+rel="stylesheet"\s+href="([^"]+)"', html)
with open(os.path.join(A, 'css/jogo.css'), 'w', encoding='utf-8') as s:
    for i, f in enumerate(css):
        t = open(os.path.join(R, f), encoding='utf-8').read()
        if i:
            t = re.sub(r'@import[^;]*;', '', t)
        s.write('/* ===== %s ===== */\n%s\n' % (f, t))
usadas = set()
for pasta in ('dados', 'js'):
    for raiz, _, arqs in os.walk(os.path.join(R, pasta)):
        for a in arqs:
            if a.endswith('.js'):
                usadas.update(re.findall(r'img/cenas/[A-Za-z0-9_.-]+\.(?:webp|png|jpe?g)', open(os.path.join(raiz, a), encoding='utf-8', errors='ignore').read()))
for f in sorted(usadas):
    if os.path.exists(os.path.join(R, f)):
        with open(os.path.join(R, f), 'rb') as e, open(os.path.join(A, f), 'wb') as d:
            d.write(e.read())
emb = {}
tipos = {'.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml'}
for pasta in ('img/escudos', 'img/cidades', 'img/bandeiras'):
    for a in sorted(os.listdir(os.path.join(R, pasta))):
        ext = os.path.splitext(a)[1]
        if ext in tipos:
            b = open(os.path.join(R, pasta, a), 'rb').read()
            emb[pasta + '/' + a] = 'data:%s;base64,%s' % (tipos[ext], base64.b64encode(b).decode('ascii'))
with open(os.path.join(A, 'dados/imagens_jogo.js'), 'w', encoding='utf-8') as s:
    s.write('/* os escudos, as fotos das praças e as bandeiras do jogo, embutidos (montar.sh): %d imagens */\n' % len(emb))
    s.write('window.__EMBUTIDOS = Object.assign(window.__EMBUTIDOS || {}, ')
    json.dump(emb, s, separators=(',', ':'))
    s.write(');\n')
print('cenas: %d fotos; embutidas: %d imagens' % (len(usadas), len(emb)))
PY
{ printf '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n'
  cat "$A/index.html"; printf '</body></html>\n'; } > "$A/local.html"
# o jogo em 3D numa página própria (o botão "Jogo 3D" do cenário abre ela):
# a mesma página, com o __JOGO
{ printf '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Torcida Organizada 3D</title><script>window.__JOGO = true;</script></head><body>\n'
  cat "$A/index.html"; printf '</body></html>\n'; } > "$A/jogo.html"
du -sh "$A"
