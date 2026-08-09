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
    python3 ferramentas/empacotar_cena.py --parcial  # sem <title>, pra publicar como artifact
"""
import base64, pathlib, re, sys, urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}

CSS = ['css/base.css', 'css/paineis.css', 'css/cenas.css']

# dois alvos: a cena solta (pra calibrar) e o jogo inteiro (pra jogar)
ALVOS = {
    'cena': {
        'pagina': 'arredores.html',
        'js': ['js/nucleo.js', 'dados/nomes.js', 'dados/cena_arredores.js',
               'js/diajogo/arredores.js', 'js/diajogo/combate.js', 'js/diajogo/ponte.js'],
        'inicio': 'TO.diaJogo.ponte.montar();',
    },
    'jogo': {
        'pagina': 'index.html',
        'js': ['js/nucleo.js',
               'dados/nomes.js', 'dados/cidades.js', 'dados/times.js',
               'dados/torcidas.js', 'dados/estadios.js', 'dados/diplomacia.js',
               'dados/cena_arredores.js', 'dados/cenas.js',
               'js/mundo/mundo.js', 'js/mundo/competicoes.js', 'js/mundo/tensao.js',
               'js/mundo/mapa.js', 'js/mundo/ruas.js',
               'js/gestao/membros.js', 'js/gestao/torcedores.js',
               'js/gestao/financeiro.js', 'js/gestao/acoes.js',
               'js/gestao/planejamento.js', 'js/estado.js',
               'js/diajogo/cenario.js', 'js/diajogo/arredores.js',
               'js/diajogo/combate.js', 'js/diajogo/ponte.js',
               'js/ui/icones.js', 'js/main.js'],
        'inicio': '',
    },
}

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
    alvo = 'jogo' if '--jogo' in sys.argv else 'cena'
    cfg = ALVOS[alvo]
    JS = cfg['js']

    css = '\n'.join((RAIZ / c).read_text(encoding='utf-8') for c in CSS)
    # o @import de CDN nao sobrevive a CSP restrito; as fontes vao embutidas
    css = re.sub(r"@import url\([^)]*\);", '', css)

    js = '\n'.join(f'/* ===== {j} ===== */\n' + (RAIZ / j).read_text(encoding='utf-8') for j in JS)

    # a foto vira data URI e o caminho no arquivo de dados aponta pra ela
    img = (RAIZ / 'img/cenas/arredores.webp').read_bytes()
    uri = 'data:image/webp;base64,' + base64.b64encode(img).decode()
    js, n = re.subn(r"imagem:'[^']*'", "imagem:'" + uri + "'", js, count=1)
    assert n == 1, 'nao achei o campo imagem em cena_arredores.js'
    print(f'  foto embutida: {len(img)//1024} KB -> {len(uri)//1024} KB em base64')

    fontes = baixar_fontes()

    corpo = (RAIZ / cfg['pagina']).read_text(encoding='utf-8')
    corpo = corpo.split('<body>', 1)[1].split('</body>', 1)[0]
    # tira as tags de script externas: tudo ja esta embutido
    corpo = re.sub(r'<script[^>]*src=[^>]*></script>\s*', '', corpo)
    corpo = re.sub(r'<script>[^<]*</script>\s*', '', corpo)

    nomes = {'cena': 'Arredores do estádio', 'jogo': 'Torcida Organizada'}
    titulo = '' if parcial else f'<title>{nomes[alvo]}</title>\n'
    saida = (titulo +
             '<style>\n' + fontes + '\n' + css + '\n</style>\n' +
             corpo +
             '\n<script>\n' + js + '\n' + cfg['inicio'] + '\n</script>\n')

    base = 'arredores' if alvo == 'cena' else 'jogo'
    destino = RAIZ / 'dist' / (f'{base}_artifact.html' if parcial else f'{base}_unico.html')
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(saida, encoding='utf-8')
    print(f'\n{destino.relative_to(RAIZ)}  —  {len(saida.encode())/1024:.0f} KB')


if __name__ == '__main__':
    main()
