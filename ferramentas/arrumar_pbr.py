#!/usr/bin/env python3
"""Normaliza os pacotes PBR soltos em `img/texturas/pbr/<material>/`.

   O que ele resolve: cada site entrega com um nome e num tamanho. O
   Poly Haven manda `aerial_beach_01_nor_gl_4k.jpg`, o ambientCG manda
   `Asphalt010_4K_NormalGL.jpg`, e os dois mandam em 4K — que é 16 vezes
   mais pixel do que a cena usa e não cabe no upload do GitHub.

   Aqui o pacote vira sempre a MESMA coisa, com o MESMO nome e no MESMO
   tamanho, pro carregador do jogo não ter de adivinhar nada em tempo de
   execução:

       cor.jpg          1024x1024  a cor (albedo)
       normal.jpg       1024x1024  o relevo, convenção OpenGL
       rugosidade.jpg   1024x1024  cinza, 1 canal
       ao.jpg           1024x1024  cinza, 1 canal (opcional)

   Por que 1024 e não 4096: o ladrilho cobre uns 4 m de mundo, então
   1024 px dão 256 px/m — que é a densidade da referência. 4096 daria
   1024 px/m, invisível a olho nu e 16x a memória de vídeo.

   POR QUE `nor_gl` E NUNCA `nor_dx`: o three.js lê o canal verde como
   +Y (convenção OpenGL). Com o arquivo DX o relevo sai invertido —
   buraco vira bolha — e o erro parece "ficou feio", não "está errado".
   Este script ignora o DX de propósito, mesmo quando ele está na pasta.

   Rodar:
       python3 ferramentas/arrumar_pbr.py            # todos
       python3 ferramentas/arrumar_pbr.py areia      # só um

   Ele apaga o zip e os originais depois de converter: o que o jogo usa
   são os quatro arquivos acima, e 15 MB de pacote parado no repositório
   só confunde quem vem depois.
"""
import os, re, sys, zipfile, shutil

try:
    from PIL import Image
except ImportError:
    sys.exit('falta o Pillow: pip install Pillow')

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PBR = os.path.join(RAIZ, 'img', 'texturas', 'pbr')
LADO = 1024
QUALIDADE = 88

# a ordem importa: o primeiro padrão que casar ganha. `nor_dx` aparece
# ANTES de `nor` na lista de recusa justamente pra ser descartado antes
# de o `nor` genérico pegá-lo.
RECUSA = (r'nor[_-]?dx', r'normaldx', r'_disp', r'displacement', r'opacity',
          r'preview', r'\.usd', r'\.mtlx', r'\.mtl')
PADROES = [
    ('normal',     (r'nor[_-]?gl', r'normalgl', r'_nor_', r'normal')),
    ('rugosidade', (r'_rough', r'roughness', r'rugosidade')),
    ('ao',         (r'ambientocclusion', r'_ao[_.]', r'^ao\.')),
    ('cor',        (r'_diff', r'_col', r'color', r'albedo', r'basecolor', r'^cor\.')),
]


def recusado(nome):
    n = nome.lower()
    return any(re.search(p, n) for p in RECUSA)


def classificar(nome):
    n = nome.lower()
    for papel, padroes in PADROES:
        if any(re.search(p, n) for p in padroes):
            return papel
    return None


def abrir_zips(pasta):
    """explode todo zip da pasta e joga os arquivos na raiz dela"""
    for arq in sorted(os.listdir(pasta)):
        if not arq.lower().endswith('.zip'):
            continue
        caminho = os.path.join(pasta, arq)
        print(f'    abrindo {arq}')
        with zipfile.ZipFile(caminho) as z:
            for membro in z.namelist():
                if membro.endswith('/'):
                    continue
                base = os.path.basename(membro)
                if not base:
                    continue
                with z.open(membro) as origem, open(os.path.join(pasta, base), 'wb') as destino:
                    shutil.copyfileobj(origem, destino)
        os.remove(caminho)


def converter(origem, destino, cinza):
    im = Image.open(origem)
    if im.size != (LADO, LADO):
        # LANCZOS é o que preserva grão fino ao reduzir; BILINEAR lava a
        # textura e é justamente o grão que a gente está indo buscar
        im = im.resize((LADO, LADO), Image.LANCZOS)
    im = im.convert('L' if cinza else 'RGB')
    im.save(destino, 'JPEG', quality=QUALIDADE, optimize=True)
    return os.path.getsize(destino)


def arrumar(material):
    pasta = os.path.join(PBR, material)
    if not os.path.isdir(pasta):
        print(f'  {material}: pasta não existe'); return
    abrir_zips(pasta)

    prontos = {'cor', 'normal', 'rugosidade', 'ao'}
    achados, lixo = {}, []
    for arq in sorted(os.listdir(pasta)):
        caminho = os.path.join(pasta, arq)
        if arq == '.gitkeep' or not os.path.isfile(caminho):
            continue
        raiz, ext = os.path.splitext(arq)
        # já normalizado numa passada anterior: não mexe
        if raiz in prontos and ext.lower() == '.jpg' and Image.open(caminho).size == (LADO, LADO):
            achados[raiz] = caminho
            continue
        if recusado(arq) or ext.lower() not in ('.jpg', '.jpeg', '.png', '.tif', '.tiff'):
            lixo.append(caminho); continue
        papel = classificar(arq)
        if not papel:
            lixo.append(caminho); continue
        achados.setdefault(papel, caminho)

    if not achados:
        print(f'  {material}: nada ainda'); return

    print(f'  {material}:')
    saidas = {}
    for papel in ('cor', 'normal', 'rugosidade', 'ao'):
        origem = achados.get(papel)
        if not origem:
            continue
        destino = os.path.join(pasta, papel + '.jpg')
        tam = converter(origem, destino + '.tmp', cinza=papel in ('rugosidade', 'ao'))
        os.replace(destino + '.tmp', destino)
        saidas[papel] = destino
        print(f'    {papel:11s} {tam/1024:7.0f} KB')
        if os.path.abspath(origem) != os.path.abspath(destino):
            lixo.append(origem)

    for caminho in lixo:
        if os.path.isfile(caminho) and os.path.abspath(caminho) not in map(os.path.abspath, saidas.values()):
            os.remove(caminho)

    if 'cor' not in saidas:
        print('    AVISO: sem mapa de cor — o carregador vai ignorar este material')


def manifesto():
    """diz ao jogo o que existe de verdade nesta pasta.

       Sem isto o carregador teria de PEDIR os quatro arquivos de cada
       material e deixar o 404 responder — seis erros vermelhos no
       console a cada carga, num projeto que mantém "erros: nenhum" como
       regra. Com o manifesto ele só pede o que está aqui."""
    import json
    dados = {}
    for d in sorted(os.listdir(PBR)):
        pasta = os.path.join(PBR, d)
        if not os.path.isdir(pasta):
            continue
        tem = [p for p in ('cor', 'normal', 'rugosidade', 'ao')
               if os.path.isfile(os.path.join(pasta, p + '.jpg'))]
        if tem:
            dados[d] = tem
    caminho = os.path.join(PBR, 'manifesto.json')
    with open(caminho, 'w') as f:
        json.dump(dados, f, indent=1, sort_keys=True)
        f.write('\n')
    print('manifesto:', json.dumps(dados, sort_keys=True))


def main():
    alvos = sys.argv[1:] or sorted(d for d in os.listdir(PBR)
                                   if os.path.isdir(os.path.join(PBR, d)))
    print('arrumando texturas PBR:')
    for m in alvos:
        arrumar(m)
    manifesto()


if __name__ == '__main__':
    main()
