#!/usr/bin/env python3
"""Importa as FAIXAS DE VERDADE das torcidas (pedido do dono, 29/09/2026:
"atualize as faixas das torcidas pra ser conforme essas, vai ter uns times
faltando, esses que faltam vão ser genéricos ainda").

O dono manda as faixas numa pasta `clubs/`, uma subpasta por clube:

    clubs/corinthians/gaviões 1.png, gaviões 2.png, camisa 12 1.png ...
    clubs/avai/1.png, 2.png ...

O nome do arquivo é a torcida e o número da faixa; quando o arquivo é só o
número, a faixa é da torcida do clube (a tabela `MAPA` abaixo diz qual). A
ordem é a do número (e o nome, no empate): a faixa 1 é a primeira da
torcida — a que ela tem desde o começo.

Sai daqui, pra cada torcida com faixa:

  * `img/faixas/<id>.webp`: a TIRA — as faixas dela empilhadas, 128 px de
    altura cada, na largura dela (a proporção de cada uma é a da arte,
    sem esticar; a margem transparente em volta sai, e o que sobra de
    transparência dentro fica na cor média do pano);
  * `dados/faixas.js`: o manifesto — `TO.dados.faixasReais[id]` é a lista
    das larguras (px) de cada faixa, na ordem da tira.

A torcida que não está no manifesto continua com a faixa gerada (as cores
e o nome dela, `js/gestao/patrimonio.js`). Clube do dono sem torcida no
jogo fica de fora (a lista sai no fim): quando a torcida entrar em
`dados/torcidas.js`, é pôr a linha no `MAPA` e rodar de novo.

Uso:  python3 ferramentas/importar_faixas.py <pasta clubs/>
(os .rar do dono abrem com `pip install libarchive-c`, que lê RAR5)
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageStat

RAIZ = Path(__file__).resolve().parent.parent
ALT = 128              # px: a altura de cada faixa na tira
LARG_MAX = 1280        # px: a mais comprida (10:1) — ninguém passa disso
QUALIDADE = 82

# pasta do dono → {nome no arquivo → id da torcida}; '' é o arquivo que é
# só o número (a torcida do clube)
MAPA = {
    'abc': {'garra alvinegra': 'garra_alvinegra'},
    'america mineiro': {'': 'seita_verde'},
    'america rj': {'': 'sangue_americano'},
    'america rn': {'': 'mafia_vermelha'},
    'asa': {'': 'mancha_negra_do_asa'},
    'athletico': {'os fanáticos': 'os_fanaticos', 'ultras 92': 'ultras_92'},
    'atletico goianiense': {'': 'dragoes_atleticanos'},
    'atletico mineiro': {'': 'galoucura', 'esquadrão': 'esquadrao_atleticano'},
    'avai': {'': 'mancha_azul'},
    'bahia': {'': 'bamor', 'terror tricolor': 'terror_tricolor'},
    'bangu': {'': 'super_bangu'},
    'botafogo': {'furia jovem': 'furia_jovem_botafogo', 'furia jovem do botafogo': 'furia_jovem_botafogo',
                 'torcida jovem do botafogo': 'torcida_jovem_botafogo'},
    'botafogo pb': {'furia jovem pb': 'furia_do_botafogo_pb', 'tjb': 'jovem_do_botafogo_pb', 'tjb pb': 'jovem_do_botafogo_pb'},
    'botafogo sp': {'fiel força tricolor': 'fiel_forca_tricolor'},
    'bragantino': {'': 'guerreiros_do_leao'},
    'brasil pelotas': {'': 'comando_rubro_negro'},
    'brasiliense': {'': 'faccao_brasiliense'},
    'caxias': {'': 'falange_grena'},
    'ceara': {'cearamor': 'cearamor', 'ceararmor': 'cearamor', 'mofi': 'mofi'},
    'chapecoense': {'': 'jovem_chape'},
    'confiança': {'jovem confiança': 'jovem_confianca', 'trovão azul': 'trovao_azul'},
    'corinthians': {'camisa 12': 'camisa_12', 'gaviões': 'gavioes', 'pavilhão nove': 'pavilhao_9'},
    'coritiba': {'império alviverde': 'imperio_alviverde'},
    'crb': {'comando alvirrubro': 'comando_alvirrubro', 'garra': 'garra'},
    'criciuma': {'guerrilha jovem': 'guerrilha_jovem', 'os tigres': 'os_tigres'},
    'cruzeiro': {'máfia azul': 'mafia_azul', 'pavilhão independente': 'pavilhao_independente'},
    'csa': {'mancha azul do csa': 'mancha_azul_do_csa', 'sangue azul': 'sangue_azul'},
    'cuiaba': {'': 'raca_cuiabana'},
    'ferroviario': {'': 'falange_coral'},
    'figueirense': {'': 'gavioes_alvinegros'},
    'flamengo': {'jovem fla': 'jovem_fla', 'raça fla': 'raca_fla'},
    'fluminense': {'força flu': 'forca_flu', 'young flu': 'young_flu'},
    'fortaleza': {'leões da tuf': 'leoes_da_tuf'},
    'goias': {'': 'forca_jovem_goias'},
    'gremio': {'super raça gremista': 'super_raca_gremista', 'torcida jovem do gremio': 'torcida_jovem_do_gremio'},
    'guarani': {'': 'furia_independente_do_guarani'},
    'icasa': {'': 'furia_icasiana'},
    'imperatriz': {'': 'forca_jovem_cavalina'},
    'internacional': {'camisa 12 do inter': 'camisa_12_do_inter'},
    'ituano': {'': 'galoucura_do_ituano'},
    'joinville': {'': 'uniao_tricolor'},
    'juventude': {'': 'mancha_verde_juventude'},
    'londrina': {'': 'falange_azul'},
    'madureira': {'': 'ultras_madureira'},
    'manaus': {'': 'gavirmaos'},
    'moto': {'dragões da fiel': 'dragoes_da_fiel', 'motofolia': 'motofolia'},
    'nautico': {'fanáutico': 'fanautico'},
    'operariopr': {'': 'trem_fantasma'},
    'palmeiras': {'mancha verde': 'mancha_verde', 'tup': 'tup'},
    'parana': {'': 'furia_independente'},
    'paysandu': {'terror bicolor': 'terror_bicolor'},
    'pelotas': {'': 'forca_jovem_pelotas'},
    'ponte preta': {'': 'jovem_ponte'},
    'portuguesa': {'': 'leoes_da_fabulosa'},
    'remo': {'pavilhão 6': 'pavilhao_6', 'remista': 'remista'},
    'sampaio correa': {'': 'tubaroes_da_fiel'},
    'santa cruz': {'inferno coral': 'inferno_coral', 'raça coral': 'raca_coral'},
    'santos': {'sangue jovem': 'sangue_jovem', 'torcida jovem': 'torcida_jovem'},
    'sao jose': {'': 'os_farrapos'},
    'sport recife': {'gang da ilha': 'gang_da_ilha', 'jovem sport': 'jovem_sport'},
    'são caetano': {'': 'comando_azul'},
    'são paulo': {'dragões da real': 'dragoes_da_real', 'independente': 'independente'},
    'treze': {'': 'torcida_jovem_do_galo'},
    'tuna luso': {'': 'movimento_uniformizado_cruzmaltino'},
    'vasco': {'força jovem vasco': 'forca_jovem_vasco', 'ira jovem vasco': 'ira_jovem_do_vasco'},
    'vila nova': {'': 'esquadrao_vilanovense'},
    'vitoria': {'camisa 12 do vitória': 'camisa_12_do_vitoria', 'os imbatíveis': 'os_imbativeis'},
    'volta redonda': {'': 'jovem_do_voltaco'},
    'xv de piracicaba': {'': 'torcida_esquadrao'},
    'ypiranga rs': {'': 'mancha_do_ypiranga'},
}


def torcidas_do_jogo():
    ids = {}
    for linha in (RAIZ / 'dados/torcidas.js').read_text(encoding='utf-8').splitlines():
        linha = linha.strip().rstrip(',')
        if linha.startswith('{"id"'):
            t = json.loads(linha)
            ids[t['id']] = t
    return ids


def pano(caminho: Path) -> Image.Image:
    """A faixa lisa: sem a margem transparente, sem furo, 128 px de altura."""
    im = Image.open(caminho).convert('RGBA')
    alfa = im.getchannel('A')
    caixa = alfa.point(lambda v: 255 if v >= 128 else 0).getbbox()
    if caixa and caixa != (0, 0, im.width, im.height):
        im = im.crop(caixa)
        alfa = im.getchannel('A')
    # o que ainda é transparente (um vão entre dois panos, uma borda
    # serrilhada) vira a cor média do pano, pra não furar no 3D
    opaco = alfa.point(lambda v: 255 if v >= 128 else 0)
    cor = tuple(round(v) for v in ImageStat.Stat(im.convert('RGB'), mask=opaco if opaco.getbbox() else None).mean)
    fundo = Image.new('RGBA', im.size, cor + (255,))
    fundo.alpha_composite(im)
    lisa = fundo.convert('RGB')
    larg = min(LARG_MAX, max(ALT * 4, round(ALT * lisa.width / lisa.height)))
    return lisa.resize((larg, ALT), Image.LANCZOS)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    fonte = Path(sys.argv[1])
    ids = torcidas_do_jogo()
    por = {}
    fora, sem_mapa = [], []
    for pasta in sorted(p for p in fonte.iterdir() if p.is_dir()):
        tabela = MAPA.get(unicodedata.normalize('NFC', pasta.name))
        if tabela is None:
            fora.append(pasta.name)
            continue
        for arq in sorted(pasta.iterdir()):
            if arq.suffix.lower() != '.png':
                continue
            m = re.match(r'^(.*?)\s*(\d+)$', unicodedata.normalize('NFC', arq.stem))
            nome, num = (m.group(1).strip(), int(m.group(2))) if m else (arq.stem.strip(), 0)
            tid = tabela.get(nome)
            if tid is None:
                sem_mapa.append(str(arq.relative_to(fonte)))
                continue
            if tid not in ids:
                sys.exit('torcida %s (de %s) não está em dados/torcidas.js' % (tid, arq))
            por.setdefault(tid, []).append((num, nome, arq))
    destino = RAIZ / 'img/faixas'
    destino.mkdir(parents=True, exist_ok=True)
    for velho in destino.glob('*.webp'):
        velho.unlink()
    manifesto, total = {}, 0
    for tid in sorted(por):
        itens = sorted(por[tid], key=lambda x: (x[0], x[1]))
        panos = [pano(a) for _, _, a in itens]
        tira = Image.new('RGB', (max(p.width for p in panos), ALT * len(panos)), (0, 0, 0))
        for k, p in enumerate(panos):
            tira.paste(p, (0, ALT * k))
        saida = destino / (tid + '.webp')
        tira.save(saida, 'WEBP', quality=QUALIDADE, method=6)
        manifesto[tid] = [p.width for p in panos]
        total += saida.stat().st_size
        print('%-36s %d faixa(s)  %5.1f KB  %s' % (tid, len(panos), saida.stat().st_size / 1024,
                                                  ', '.join(a.parent.name + '/' + a.name for _, _, a in itens)))
    linhas = ',\n'.join('  %s: %s' % (json.dumps(k), json.dumps(v)) for k, v in sorted(manifesto.items()))
    (RAIZ / 'dados/faixas.js').write_text(
        '/* FAIXAS DE VERDADE — manifesto de img/faixas/<torcida>.webp\n'
        '   GERADO por ferramentas/importar_faixas.py — não editar à mão.\n'
        '   Cada torcida tem uma tira com as faixas dela empilhadas, %d px de\n'
        '   altura cada; a lista é a largura (px) de cada uma, na ordem da tira.\n'
        '   Torcida fora daqui usa a faixa gerada (as cores e o nome). */\n'
        'window.TO = window.TO || {};\n'
        'TO.dados = TO.dados || {};\n'
        'TO.dados.faixasReais = {\n%s\n};\n' % (ALT, linhas), encoding='utf-8')
    print('\n%d torcidas com faixa de verdade, %d faixas, %.2f MB' % (len(manifesto), sum(map(len, manifesto.values())), total / 1e6))
    sem = sorted(set(ids) - set(manifesto))
    print('torcidas do jogo sem faixa (seguem com a gerada): %d' % len(sem))
    print('  ' + ', '.join(sem))
    if fora:
        print('pastas sem torcida no jogo (ficaram de fora): ' + ', '.join(fora))
    if sem_mapa:
        print('arquivos com nome fora do MAPA: ' + ', '.join(sem_mapa))


if __name__ == '__main__':
    main()
