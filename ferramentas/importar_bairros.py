#!/usr/bin/env python3
"""
Importa cidades_bairros.json e reescreve dados/cidades.js completo.

    python3 ferramentas/importar_bairros.py

Junta duas fontes:
  · cidades_bairros.json (Unity) — bairros com zona, classe social e
    multiplicador; estadios, rodovias, metro, times na cidade com
    percentual de torcedores.
  · Book_3_1.xlsx (planilha) — efetivo de rua: torcedores, guardas,
    PMs e tropa de choque no mapa.

Os nomes das cidades sao padronizados pelo nome da praca (Mato Grosso,
nao Cuiaba), porque o mapa representa a regiao inteira e nao so a
capital. A tabela de renomeacao esta logo abaixo.
"""
import json, pathlib, unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FONTE = RAIZ / 'dados/fonte/cidades_bairros.json'
PLANILHA = RAIZ / 'dados/fonte/Book_3_1.xlsx'

# id no JSON -> (id canonico, nome canonico). O canonico e o nome da
# praca, que e como a planilha e o resto do jogo ja chamam.
RENOMEAR = {
    'cuiaba':         ('mato-grosso',         'Mato Grosso'),
    'campinas':       ('regiao-de-campinas',  'Região de Campinas'),
    'florianopolis':  ('litoral-catarinense', 'Litoral Catarinense'),
    'maceio':         ('alagoas',             'Alagoas'),
    'salvador':       ('bahia',               'Bahia'),
    'meio-norte':     ('maranhao',            'Maranhão'),
    'interior-de-mg': ('interior-de-minas',   'Interior de Minas'),
}

# quarteiroes -> lado do mapa. O JSON usa 196/120/64, que e a fonte
# que manda. Bate com o GDD 19.1: medio 10x12 e pequeno 8x8.
GRADE = {196: (14, 14), 120: (10, 12), 64: (8, 8)}

ZONAS = ['Norte', 'Sul', 'Leste', 'Oeste']


def sem_acento(t):
    return ''.join(c for c in unicodedata.normalize('NFD', str(t))
                   if unicodedata.category(c) != 'Mn')


def ident(t):
    s = sem_acento(t).strip().lower().replace('_', '-')
    s = ''.join(c if c.isalnum() else '-' for c in s)
    while '--' in s:
        s = s.replace('--', '-')
    return s.strip('-')


def canonico(id_json, nome_json):
    base = ident(id_json)
    if base in RENOMEAR:
        return RENOMEAR[base]
    return base, nome_json


def ler_planilha():
    """efetivo de rua da planilha, por id de cidade"""
    try:
        import openpyxl
    except ImportError:
        return {}
    if not PLANILHA.exists():
        return {}
    wb = openpyxl.load_workbook(PLANILHA, data_only=True)
    fora = {}
    for r in list(wb['Níveis de cidades'].iter_rows(values_only=True))[1:]:
        if not r[0]:
            continue
        def i(v, p=0):
            try: return int(float(v))
            except (TypeError, ValueError): return p
        fora[ident(r[0])] = {
            'torcedores': i(r[1]), 'guardas': i(r[3]),
            'pms': i(r[4]), 'choque': i(r[5]),
            'quarteiroesPlanilha': i(r[7], 64),
        }
    return fora


def main():
    d = json.loads(FONTE.read_text(encoding='utf-8'))
    rua = ler_planilha()

    cidades, avisos, divergentes = [], [], []
    for c in d['cidades']:
        cid, nome = canonico(c['id'], c['nome'])
        m = c.get('mapa', {})
        quart = m.get('quarteiroes', 64)
        lado = GRADE.get(quart, (8, 8))
        extra = rua.get(cid, {})

        bairros = []
        for b in c.get('bairros', []):
            bairros.append({
                'id': ident(b['id']), 'nome': b['nome'],
                'zona': b.get('zona', ''),
                'classe': b.get('classeSocial', ''),
                'mult': b.get('multiplicadorFaturamento', 1.0),
                'sedes': b.get('torcidasComSede', []),
            })

        times = []
        for t in c.get('timesNaCidade', []):
            times.append({
                'clube': t.get('clube', ''), 'clubeId': ident(t.get('clube', '')),
                'sigla': t.get('sigla', ''),
                'perc': t.get('percentualTorcedores', 0),
                'torcedores': t.get('torcedoresEstimados', 0),
                'estadioProprio': bool(t.get('temEstadioProprio')),
                'local': bool(t.get('ehLocal')),
            })

        cidades.append({
            'id': cid, 'nome': nome,
            'uf': c.get('uf', ''), 'regiao': c.get('regiao', ''),
            'nivel': m.get('nivel', 3), 'tamanho': m.get('tamanho', ''),
            'quarteiroes': quart, 'grade': list(lado),
            'populacao': c.get('populacao', 0),
            'temMetro': bool(c.get('temMetro')),
            'estadios': c.get('estadios', []),
            'rodovias': c.get('rodovias', []),
            'multMedio': c.get('multiplicadorFaturamentoMedio', 1.0),
            # efetivo de rua vem da planilha
            'torcedores': extra.get('torcedores', c.get('populacao', 0)),
            'guardas': extra.get('guardas', 1),
            'pms': extra.get('pms', 3),
            'choque': extra.get('choque', 0),
            'bairros': bairros,
            'times': times,
        })

        # ---- conferencias por cidade ----
        esperados = m.get('bairrosEsperados', len(bairros))
        if len(bairros) != esperados:
            avisos.append(f'{nome}: {len(bairros)} bairros, esperado {esperados}')
        porz = {}
        for b in bairros:
            porz[b['zona']] = porz.get(b['zona'], 0) + 1
        alvo = m.get('bairrosPorZonaEsperado')
        if alvo:
            ruins = [f'{z}={porz.get(z,0)}' for z in ZONAS if porz.get(z, 0) != alvo]
            if ruins:
                avisos.append(f'{nome}: por zona {" ".join(ruins)}, esperado {alvo}')
        # A planilha tem outro numero de quarteiroes. O JSON manda:
        # e nele que os bairros estao amarrados ao nivel do mapa, e os
        # tamanhos batem com o GDD 19.1 (medio 10x12, pequeno 8x8).
        if quart != extra.get('quarteiroesPlanilha', quart):
            divergentes.append(nome)

    linhas = ',\n'.join('  ' + json.dumps(c, ensure_ascii=False) for c in cidades)
    saida = RAIZ / 'dados/cidades.js'
    saida.write_text(
        f'/* CIDADES — {len(cidades)} pracas, '
        f'{sum(len(c["bairros"]) for c in cidades)} bairros\n'
        f'   GERADO por ferramentas/importar_bairros.py — nao editar a mao. */\n'
        f'TO.dados.cidades = [\n{linhas}\n];\n', encoding='utf-8')
    print(f'  dados/cidades.js: {saida.stat().st_size/1024:.0f} KB, '
          f'{len(cidades)} cidades, '
          f'{sum(len(c["bairros"]) for c in cidades)} bairros')

    # ---------------- conferencia geral ----------------
    print('\nconferencia:')
    porgrade = {}
    for c in cidades:
        k = f"{c['grade'][0]}x{c['grade'][1]}"
        porgrade[k] = porgrade.get(k, 0) + 1
    print('  mapas por grade: ' + ', '.join(f'{k}={v}' for k, v in sorted(porgrade.items())))

    # bairro-sede das torcidas resolve?
    tj = RAIZ / 'dados/torcidas.js'
    if tj.exists():
        torc = [json.loads(l.strip().rstrip(','))
                for l in tj.read_text(encoding='utf-8').splitlines()
                if l.strip().startswith('{')]
        porcidade = {c['id']: c for c in cidades}
        nao_acha, sem_bairro = [], []
        for t in torc:
            if t.get('incompleta'):
                continue
            c = porcidade.get(t['mapa'])
            if not c:
                nao_acha.append(f"{t['nome']} (cidade {t['mapa']})")
                continue
            alvo = ident(t.get('bairroSede', ''))
            if not alvo:
                sem_bairro.append(t['nome'])
            elif not any(ident(b['nome']) == alvo or b['id'] == alvo
                         for b in c['bairros']):
                nao_acha.append(f"{t['nome']}: bairro '{t['bairroSede']}' "
                                f"nao existe em {c['nome']}")
        print(f'  torcidas sem bairro-sede: {len(sem_bairro)}')
        print(f'  bairro-sede que nao resolve: {len(nao_acha)}')
        for x in nao_acha[:8]:
            print(f'     {x}')

    if divergentes:
        print(f'  quarteiroes diferentes da planilha em {len(divergentes)} cidades '
              f'— o JSON prevalece, por decisao do autor')
    if avisos:
        print(f'\n  {len(avisos)} avisos de estrutura:')
        for a in avisos[:14]:
            print(f'     {a}')
    else:
        print('  estrutura de bairros bate com o esperado em todas')


if __name__ == '__main__':
    main()
