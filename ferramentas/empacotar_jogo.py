#!/usr/bin/env python3
"""Empacota o jogo inteiro num único arquivo HTML.

O artifact do dono é um arquivo só: sem servidor, sem pasta ao lado.
Este empacotador lê o `index.html` e devolve a mesma página com tudo
dentro dela —

  * cada `<link rel=stylesheet>` vira um `<style>`;
  * cada `<script src>` vira um `<script>` com o código;
  * as fotos das cenas, que os arquivos de `dados/` citam pelo caminho
    (`img/cenas/praca.webp`), têm o caminho TROCADO no próprio texto do
    arquivo por um `data:` — é a substituição literal, e por isso elas
    contam como "embutidas";
  * escudos, bandeiras e fotos de cidade são pedidos em tempo de
    execução, com o id montado na hora (`img/escudos/clube-<id>.png`).
    Esses não dá pra trocar no texto: vão pro dicionário
    `window.__EMBUTIDOS`, que é onde o `IMG()` do jogo procura antes de
    usar o caminho cru.

Uso:  python3 ferramentas/empacotar_jogo.py [saída.html]
"""

import base64
import io
import json
import mimetypes
import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:              # sem Pillow o pacote sai cru (e grande)
    Image = None

RAIZ = Path(__file__).resolve().parent.parent
PADRAO = RAIZ / 'torcida-organizada.html'
LIMITE_MB = 16.5          # o artifact recusa acima disto

TIPOS = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
         '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif'}

# as pastas cujas imagens o jogo monta em tempo de execução
DINAMICAS = ['img/escudos', 'img/bandeiras', 'img/cidades']

# A ARTE CABE NO ARQUIVO (empacotamento, 16/09/2026)
# As fotos originais somam 12,5 MB depois do base64 e o artifact para em
# 16 — com os 7,8 MB de código não sobrava espaço. Aqui elas são
# reencodadas em webp SÓ PRA DENTRO DO PACOTE: os arquivos de `img/`
# continuam intactos, é a cópia embutida que encolhe. Largura máxima e
# qualidade por pasta, que foto de cena e escudo de 60px não pedem a
# mesma coisa.
RECEITA = [('img/cenas',     1280, 72),
           ('img/cidades',    900, 72),
           ('img/escudos',    256, 82)]


def receita_de(rel: str):
    for pasta, larg, qual in RECEITA:
        if rel.startswith(pasta + '/'):
            return larg, qual
    return None


def tipo_de(p: Path) -> str:
    return (TIPOS.get(p.suffix.lower())
            or mimetypes.guess_type(p.name)[0]
            or 'application/octet-stream')


def como_dados(p: Path, rel: str = '') -> str:
    dados, tipo = p.read_bytes(), tipo_de(p)
    receita = receita_de(rel or str(p.relative_to(RAIZ)).replace('\\', '/'))
    if Image and receita and tipo != 'image/svg+xml':
        larg, qual = receita
        try:
            im = Image.open(io.BytesIO(dados))
            im.load()
            if im.width > larg:
                im = im.resize((larg, round(im.height * larg / im.width)),
                               Image.LANCZOS)
            if im.mode not in ('RGB', 'RGBA'):
                im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
            buf = io.BytesIO()
            im.save(buf, 'WEBP', quality=qual, method=6)
            if buf.tell() < len(dados):
                dados, tipo = buf.getvalue(), 'image/webp'
        except Exception as err:                     # imagem estranha fica crua
            print('  (sem comprimir %s: %s)' % (rel or p.name, err))
    return 'data:%s;base64,%s' % (tipo, base64.b64encode(dados).decode('ascii'))


def ler(rel: str) -> str:
    return (RAIZ / rel).read_text(encoding='utf-8')


def embutir_imagens_do_texto(txt: str, contador: set) -> str:
    """Troca todo caminho de imagem citado literalmente por um data:."""
    def troca(m):
        caminho = m.group(0)
        arq = RAIZ / caminho
        if not arq.is_file():
            return caminho
        contador.add(caminho)
        return como_dados(arq, caminho)
    return re.sub(r'img/[A-Za-z0-9_\-/]+\.(?:png|jpe?g|webp|svg|gif)', troca, txt)


def dicionario_dinamico(faltando: list) -> tuple:
    itens = []
    for pasta in DINAMICAS:
        d = RAIZ / pasta
        if not d.is_dir():
            faltando.append(pasta)
            continue
        for arq in sorted(d.iterdir()):
            if arq.suffix.lower() not in TIPOS:
                continue
            itens.append('%s:%s' % (
                json.dumps('%s/%s' % (pasta, arq.name)),
                json.dumps(como_dados(arq, '%s/%s' % (pasta, arq.name)))))
    js = 'window.__EMBUTIDOS={%s};' % ','.join(itens)
    return js, len(itens)


def main():
    saida = Path(sys.argv[1]) if len(sys.argv) > 1 else PADRAO
    html = ler('index.html')
    embutidas, faltando = set(), []

    def um_style(m):
        rel = m.group(1)
        if not (RAIZ / rel).is_file():
            faltando.append(rel)
            return m.group(0)
        return '<style>\n%s\n</style>' % embutir_imagens_do_texto(ler(rel), embutidas)

    def um_script(m):
        rel = m.group(1)
        if not (RAIZ / rel).is_file():
            faltando.append(rel)
            return m.group(0)
        corpo = embutir_imagens_do_texto(ler(rel), embutidas)
        # `</script>` dentro de string quebraria a tag que envolve o código
        corpo = corpo.replace('</script>', '<\\/script>')
        return '<script>\n%s\n</script>' % corpo

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', um_style, html)
    html = re.sub(r'<script src="([^"]+)"></script>', um_script, html)

    dic, quantos = dicionario_dinamico(faltando)
    # o dicionário tem de existir antes de qualquer script que o consulte
    html = html.replace('<script>', '<script>%s</script>\n<script>' % dic, 1)

    if re.search(r'<script src=|<link rel="stylesheet"', html):
        sobrou = re.findall(r'(?:src|href)="([^"]+)"', html)
        print('AVISO: sobrou referência externa:', sobrou[:5])

    saida.write_text(html, encoding='utf-8')
    mb = saida.stat().st_size / 1024 / 1024
    print('%s %.2f MB · %d imagens embutidas · %d no dicionário dinâmico · '
          'faltando: %s' % ('ok' if mb <= LIMITE_MB else 'GRANDE DEMAIS',
                            mb, len(embutidas), quantos,
                            ', '.join(faltando) if faltando else 'nenhuma'))
    return 0 if mb <= LIMITE_MB else 1


if __name__ == '__main__':
    sys.exit(main())
