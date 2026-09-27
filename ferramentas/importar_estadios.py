#!/usr/bin/env python3
"""
Importa os estadios do prototipo antigo para dados/estadios.js.

A planilha que gera dados/times.js traz o nome do estadio e a capacidade,
mas nao diz em que bairro ele fica — e sem isso nao da pra desenhar o mapa
da cidade nem dizer por onde o bonde passa. O prototipo antigo
(legado/unity/data.js) tem os 76 estadios com bairro e mandantes, entao ele
vira a fonte desse arquivo e de mais nada.

Os ids de cidade divergem entre os dois lados (o antigo chama 'salvador' o
que aqui e 'bahia'), mas a lista de bairros e identica nos trinta mapas.
E por ela que as pracas sao pareadas: conjunto de bairros igual, mesma
cidade. Nome nao serve — 'Campinas' virou 'Regiao de Campinas'.

    python3 ferramentas/importar_estadios.py
"""
import json, pathlib, re, sys, unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FONTE = RAIZ / 'legado' / 'unity' / 'data.js'
SAIDA = RAIZ / 'dados' / 'estadios.js'

# O mesmo estadio com dois nomes. O legado escreve um, a planilha de times
# escreve o outro, e sem esta tabela o jogo desenha dois pinos pro mesmo
# gramado: o Rio ficava com quatro estadios pra tres campos, e Recife
# tambem. Nao e caso de acento (isso o identificador resolve) — sao nomes
# de verdade diferentes pra mesma praca de jogo.
APELIDOS = {
    'engenhao': ['Nilton Santos'],            # Botafogo
    'estadio-dos-aflitos': ['Aflitos'],       # Nautico
}


# A lotacao de verdade de estadio que nenhum clube da planilha aponta, e
# que o legado traz com numero de preenchimento. So entra aqui o que se
# sabe: o Serra Dourada (Goiania) tem uns 50 mil, e o legado diz 35.
CAPACIDADE = {
    'serra-dourada': 50049,
}


def identificador(txt):
    """mesma regra dos outros importadores: 'Arena Castelão' -> 'arena-castelao'"""
    txt = unicodedata.normalize('NFD', str(txt or ''))
    txt = ''.join(c for c in txt if unicodedata.category(c) != 'Mn')
    txt = re.sub(r'[^a-z0-9]+', '-', txt.lower())
    return txt.strip('-')


def bloco(fonte, nome):
    marca = f'DATA.{nome} = ['
    i = fonte.index(marca)
    j = fonte.index('\n];', i)
    return json.loads(fonte[i + len(marca) - 1:j + 2])


def carregar_nossas_cidades():
    txt = (RAIZ / 'dados' / 'cidades.js').read_text(encoding='utf-8')
    i, j = txt.index('['), txt.rindex(']')
    return json.loads(txt[i:j + 1])


def main():
    if not FONTE.exists():
        sys.exit(f'fonte ausente: {FONTE}')
    legado = FONTE.read_text(encoding='utf-8')
    cid_legado = bloco(legado, 'cidades')
    estadios = bloco(legado, 'estadios')
    times_legado = bloco(legado, 'times')
    nossas = carregar_nossas_cidades()

    # pareia praca por conjunto de bairros: o mesmo conjunto, ou (a praca
    # que ganhou bairros depois, como o Interior de SP) a unica daqui que
    # tem todos os do legado
    por_bairros = {frozenset(b['nome'] for b in c['bairros']): c['id'] for c in nossas}
    de_para = {}
    for c in cid_legado:
        chave = frozenset(b['nome'] for b in c['bairros'])
        if chave in por_bairros:
            de_para[c['id']] = por_bairros[chave]
            continue
        contem = [cid for bs, cid in por_bairros.items() if chave and chave <= bs]
        if len(contem) == 1:
            de_para[c['id']] = contem[0]
    faltando = [c['id'] for c in cid_legado if c['id'] not in de_para]
    if faltando:
        print(f'  AVISO: {len(faltando)} pracas do legado sem par aqui: {faltando}')

    # O mandante quem diz e o nosso times.js: cada clube ja aponta o estadio
    # pelo nome. A lista do legado esta furada (metade vazia) e nao vale como
    # fonte pra isso.
    txt_times = (RAIZ / 'dados' / 'times.js').read_text(encoding='utf-8')
    nossos_times = json.loads(txt_times[txt_times.index('['):txt_times.rindex(']') + 1])
    # So vale o clube DA MESMA PRACA: o Treze (Campina Grande) aponta pro
    # "Presidente Vargas" dele, que tem o mesmo nome do de Fortaleza, e
    # sem isto virava mandante em Fortaleza.
    manda_em = {}
    for t in nossos_times:
        manda_em.setdefault(identificador(t.get('estadio')), []).append(t)

    saida = []
    for e in sorted(estadios, key=lambda x: x['nome']):
        mapa = de_para.get(e['cidadeId'])
        if not mapa:
            continue
        eid = identificador(e['nome'])
        apelidos = APELIDOS.get(eid, [])
        # o clube que aponta pro apelido manda aqui, nao num estadio novo
        clubes = [t for t in manda_em.get(eid, []) if t.get('mapa') == mapa]
        for ap in apelidos:
            for t in manda_em.get(identificador(ap), []):
                if t.get('mapa') == mapa and t not in clubes:
                    clubes.append(t)
        mandantes = [t['id'] for t in clubes]
        # A LOTACAO DE VERDADE: a da planilha (times.js), quando os clubes
        # da praca que mandam aqui dizem a mesma. A do legado e de
        # preenchimento em metade dos estadios (35 mil, 60 mil, 15 mil
        # redondos: o Presidente Vargas de Fortaleza tinha 60 mil, e tem
        # 20.268), e ela decide o modelo 3D (ate 15 mil, o de 10; de 15 a
        # 35 mil, o de 20; acima, o de 40). Sem planilha, a do legado, ou a
        # da tabela de correcao abaixo.
        caps = sorted({t.get('capacidade') for t in clubes if t.get('capacidade')})
        capacidade = caps[0] if len(caps) == 1 else (CAPACIDADE.get(eid) or e.get('capacidade') or 0)
        reg = {
            'id': eid,
            'nome': e['nome'],
            'mapa': mapa,
            'bairro': e.get('bairroEstadio') or '',
            'capacidade': capacidade,
            'mandantes': mandantes,
        }
        if apelidos:
            reg['apelidos'] = apelidos
        saida.append(reg)

    linhas = [
        '/* ESTADIOS — 76 pracas de jogo, com o bairro de cada uma',
        '   GERADO por ferramentas/importar_estadios.py — nao editar a mao.',
        '   Fonte: legado/unity/data.js (prototipo antigo). */',
        'TO.dados.estadios = [',
    ]
    for e in saida:
        linhas.append('  ' + json.dumps(e, ensure_ascii=False) + ',')
    if len(linhas) > 4:
        linhas[-1] = linhas[-1][:-1]
    linhas.append('];')
    SAIDA.write_text('\n'.join(linhas) + '\n', encoding='utf-8')

    com_bairro = sum(1 for e in saida if e['bairro'])
    ligados = {c for e in saida for c in e['mandantes']}
    orfaos = [t['nome'] for t in nossos_times if t['id'] not in ligados]
    print(f'  {len(saida)} estadios, {com_bairro} com bairro, '
          f'{len(ligados)} clubes com estadio mapeado')
    if orfaos:
        print(f'  AVISO: {len(orfaos)} clubes sem estadio no legado: '
              + ', '.join(orfaos[:6]) + ('...' if len(orfaos) > 6 else ''))
    print(f'\n{SAIDA.relative_to(RAIZ)}  —  {SAIDA.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
