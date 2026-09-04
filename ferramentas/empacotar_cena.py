#!/usr/bin/env python3
"""
Empacota a cena dos arredores num HTML unico e autocontido.

Serve para dois casos:
  - mandar a cena por link, sem servidor e sem repositorio
  - publicar no itch.io um arquivo so

Tudo entra embutido: CSS, JS, a foto em data URI e as fontes em
@font-face data URI. Fonte por CDN nao serve — em pagina com CSP
restrito ela falha calada e a tipografia inteira troca sem aviso.

    python3 ferramentas/empacotar_cena.py            # gera dist/arredores_unico.html
    python3 ferramentas/empacotar_cena.py --jogo     # o jogo inteiro
    python3 ferramentas/empacotar_cena.py --3d       # a cena 3D
    python3 ferramentas/empacotar_cena.py --parcial  # sem <title>, pra publicar como artifact
"""
import base64, pathlib, re, sys, urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}

CSS = ['css/base.css', 'css/paineis.css', 'css/cenas.css', 'css/mobile.css']

# dois alvos: a cena solta (pra calibrar) e o jogo inteiro (pra jogar)
ALVOS = {
    'cena': {
        'pagina': 'arredores.html',
        'js': ['js/nucleo.js', 'dados/nomes.js', 'dados/cena_arredores.js',
               'dados/cenas_foto.js', 'dados/cenas_editadas.js',
               'dados/cenas.js', 'js/diajogo/cenario.js',
               'js/diajogo/arredores.js', 'js/diajogo/combate.js', 'js/diajogo/ponte.js',
               'js/diajogo/bancada.js'],
        'inicio': 'TO.diaJogo.bancada.montar();',
    },
    'jogo': {
        'pagina': 'index.html',
        'js': ['js/nucleo.js',
               'dados/nomes.js', 'dados/cidades.js', 'dados/times.js',
               'dados/torcidas.js', 'dados/estadios.js', 'dados/cidade_mapa.js',
               'dados/cidade_mapa_sao_paulo.js',
               'dados/cidade_mapa_belo_horizonte.js',
               'dados/diplomacia.js',
               'dados/cena_arredores.js', 'dados/cenas_foto.js',
               'dados/cenas_editadas.js', 'dados/cenas.js',
               'js/mundo/mundo.js', 'js/mundo/competicoes.js', 'js/mundo/tensao.js',
               'js/mundo/mapa.js', 'js/mundo/mapa_gerado.js', 'js/mundo/praca.js',
               'js/gestao/membros.js', 'js/gestao/torcedores.js',
               'js/gestao/financeiro.js', 'js/gestao/patrimonio.js',
               'js/gestao/acoes.js',
               'js/gestao/planejamento.js', 'js/estado.js', 'js/mundo/feed.js',
               'js/diajogo/cenario.js', 'js/diajogo/arredores.js',
               'js/diajogo/combate.js', 'js/diajogo/ponte.js',
               'js/ui/icones.js', 'js/main.js'],
        'inicio': '',
    },
    # a cena 3D: mesmo conteudo da bancada, com o three.js embutido e
    # o desenhista 3D no lugar da ponte 2D
    'cena3d': {
        'pagina': 'arredores3d.html',
        'js': ['js/nucleo.js', 'dados/nomes.js', 'dados/cena_arredores.js',
               'dados/cenas_foto.js', 'dados/cenas_editadas.js',
               'dados/cenas.js', 'js/diajogo/cenario.js',
               'js/diajogo/arredores.js', 'js/diajogo/combate.js',
               'js/diajogo/bancada.js'],
        'inicio': '',
        'modulo': True,
    },
}


def three_como_objeto():
    """O three.js e modulo ES e termina em `export{a as Vector3,...}`.
    Aqui esse export vira um `const THREE={Vector3:a,...}` devolvido
    por uma IIFE — assim a pagina inteira cabe num
    <script type="module"> so, sem CDN, sem import map e sem depender
    do build UMD, que a propria three ja marcou como deprecado.

    A IIFE nao e capricho: empacotado, tudo divide o mesmo escopo, e
    o three minificado declara nomes de uma letra (`A`, `W`, `B`) que
    batem de frente com os do `cena3d.js`. Cada parte no seu bloco."""
    src = (RAIZ / 'vendor/three/three.module.min.js').read_text(encoding='utf-8')
    m = re.search(r'export\{([^}]*)\};?\s*$', src)
    assert m, 'nao achei o export do three.module.min.js'
    pares = []
    for item in m.group(1).split(','):
        item = item.strip()
        if not item:
            continue
        if ' as ' in item:
            local, publico = [q.strip() for q in item.split(' as ')]
        else:
            local = publico = item
        pares.append(f'{publico}:{local}')
    print(f'  three.js: {len(src)//1024} KB, {len(pares)} nomes exportados')
    return ('const THREE=(function(){\n' + src[:m.start()] +
            '\nreturn{' + ','.join(pares) + '};\n})();\n')

FONTES = [
    ('Barlow Condensed', 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700'),
    ('IBM Plex Mono',    'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600'),
]


def baixar_fontes():
    """Devolve @font-face com o woff2 latino embutido. Silencio se a rede faltar."""
    blocos = []
    for nome, url in FONTES:
        try:
            css = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25).read().decode()
        except Exception as e:
            print(f'  fonte {nome}: sem rede ({e}) — vai cair na pilha do sistema')
            continue
        for face in re.findall(r'@font-face\s*\{[^}]*\}', css):
            faixa = re.search(r'unicode-range:\s*([^;]+);', face)
            # so o subconjunto latino: o resto e peso morto num jogo em portugues
            if not faixa or 'U+0000-00FF' not in faixa.group(1):
                continue
            peso = re.search(r'font-weight:\s*(\d+)', face)
            src = re.search(r'url\((https://[^)]+\.woff2)\)', face)
            if not src:
                continue
            try:
                dados = urllib.request.urlopen(urllib.request.Request(src.group(1), headers=UA), timeout=25).read()
            except Exception:
                continue
            b64 = base64.b64encode(dados).decode()
            blocos.append(
                f"@font-face{{font-family:'{nome}';font-style:normal;"
                f"font-weight:{peso.group(1) if peso else 400};font-display:swap;"
                f"src:url(data:font/woff2;base64,{b64}) format('woff2')}}")
            print(f'  fonte {nome} peso {peso.group(1) if peso else "?"}: {len(dados)//1024} KB')
    return '\n'.join(blocos)


def main():
    parcial = '--parcial' in sys.argv
    alvo = ('cena3d' if '--3d' in sys.argv else
            'jogo' if '--jogo' in sys.argv else 'cena')
    cfg = ALVOS[alvo]
    JS = cfg['js']
    modulo = cfg.get('modulo', False)

    css = '\n'.join((RAIZ / c).read_text(encoding='utf-8') for c in CSS)
    # o @import de CDN nao sobrevive a CSP restrito; as fontes vao embutidas
    css = re.sub(r"@import url\([^)]*\);", '', css)

    js = '\n'.join(f'/* ===== {j} ===== */\n' + (RAIZ / j).read_text(encoding='utf-8') for j in JS)

    # toda imagem citada nos dados vira data URI: arquivo solto na pasta
    # nao existe pra quem abre o HTML sozinho. Pega as duas formas de
    # escrita — a mao (aspas simples) e a gerada por importador (JSON).
    def embutir(m):
        caminho = m.group(2)
        if caminho.startswith('data:'):
            return m.group(0)
        dados = (RAIZ / caminho).read_bytes()
        uri = 'data:image/webp;base64,' + base64.b64encode(dados).decode()
        print(f'  {caminho}: {len(dados)//1024} KB -> {len(uri)//1024} KB em base64')
        return f'{m.group(1)}{uri}{m.group(3)}'

    js, n1 = re.subn(r"(imagem:')([^']*)(')", embutir, js)
    js, n2 = re.subn(r'("imagem": ")([^"]*)(")', embutir, js)
    assert n1 + n2 >= 1, 'nao achei campo imagem nenhum nos dados'

    fontes = baixar_fontes()

    pagina = (RAIZ / cfg['pagina']).read_text(encoding='utf-8')
    # o <style> da propria pagina (layout do palco) tambem tem de ir
    for bloco in re.findall(r'<style>(.*?)</style>', pagina, re.S):
        css += '\n' + bloco
    corpo = pagina.split('<body>', 1)[1].split('</body>', 1)[0]
    # o glue da pagina 3D e um modulo inline: sai do corpo e entra no fim
    cola = ''
    for m in re.finditer(r'<script type="module">(.*?)</script>', corpo, re.S):
        cola += m.group(1)
    corpo = re.sub(r'<script type="module">.*?</script>\s*', '', corpo, flags=re.S)
    # tira as tags de script externas: tudo ja esta embutido
    corpo = re.sub(r'<script[^>]*src=[^>]*></script>\s*', '', corpo)
    corpo = re.sub(r'<script>[^<]*</script>\s*', '', corpo)

    if modulo:
        alvo3d = (RAIZ / 'js/diajogo/cena3d.js').read_text(encoding='utf-8')
        alvo3d = re.sub(r'^import .*$', '', alvo3d, flags=re.M)
        alvo3d = alvo3d.replace('export function criar(', 'function criar(')
        # mesmo motivo do three: `const A` do cena3d bate com o `A` do
        # glue da pagina. Cada um no seu bloco, e so `criar` sai.
        alvo3d = ('const criar=(function(){\n' + alvo3d + '\nreturn criar;\n})();\n')
        cola = re.sub(r'^import .*$', '', cola, flags=re.M)
        js = (three_como_objeto() +
              '\n/* ===== jogo ===== */\n' + js +
              '\n/* ===== js/diajogo/cena3d.js ===== */\n' + alvo3d +
              '\n/* ===== a pagina ===== */\n' + cola)

    nomes = {'cena': 'Arredores do estádio', 'jogo': 'Torcida Organizada',
             'cena3d': 'Arredores em 3D'}
    # o artifact ja recebe charset do envelope; o arquivo solto, nao —
    # e sem ele o acento vira mojibake ao abrir por file://
    titulo = '' if parcial else (
        '<meta charset="utf-8">\n'
        f'<title>{nomes[alvo]}</title>\n')
    tag = '<script type="module">' if modulo else '<script>'
    saida = (titulo +
             '<style>\n' + fontes + '\n' + css + '\n</style>\n' +
             corpo +
             '\n' + tag + '\n' + js + '\n' + cfg['inicio'] + '\n</script>\n')

    base = {'cena': 'arredores', 'jogo': 'jogo', 'cena3d': 'arredores3d'}[alvo]
    destino = RAIZ / 'dist' / (f'{base}_artifact.html' if parcial else f'{base}_unico.html')
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(saida, encoding='utf-8')
    print(f'\n{destino.relative_to(RAIZ)}  —  {len(saida.encode())/1024:.0f} KB')


if __name__ == '__main__':
    main()
