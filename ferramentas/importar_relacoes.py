#!/usr/bin/env python3
"""
Importa torcidas_relacoes.json (extraido da era Unity) para os dados do jogo.

    python3 ferramentas/importar_relacoes.py

Gera:
  dados/torcidas.js   140 torcidas, agora com bairro-sede, cores em hex,
                      derivados (sede, distribuicao de cargos, saldo) e as
                      relacoes com todas as outras.
  dados/diplomacia.js regras de relacao e parametros de jogo do JSON.

Este arquivo substitui a aba Torcidas da planilha Book_3_1: e a mesma
informacao, mais completa. times.js e cidades.js continuam vindo de la.
"""
import json, pathlib, sys, unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / 'dados/fonte/torcidas_relacoes.json'
# A sigla da TORCIDA (GAVIOES, TJF, CMA) so existe na planilha do autor —
# o `sigla` do JSON da era Unity e a do CLUBE, e por isso as tres
# organizadas do Corinthians vinham as tres como "SCCP".
PLANILHA = RAIZ / 'dados/fonte/Book_3_1.xlsx'

# A cidade no JSON e o nome da praca; em cidades.js e o id do mapa.
# Onde os dois nomes divergem, o apelido resolve.
APELIDOS_CIDADE = {
    'cuiaba': 'mato-grosso',
    'meio-norte': 'maranhao',
    'sao-luis': 'maranhao',
    'teresina': 'maranhao',
    'salvador': 'bahia',
    'campinas': 'regiao-de-campinas',
    'florianopolis': 'litoral-catarinense',
    'interior-de-mg': 'interior-de-minas',
    'maceio': 'alagoas',
}


def sem_acento(t):
    return ''.join(c for c in unicodedata.normalize('NFD', str(t))
                   if unicodedata.category(c) != 'Mn')


def ident(t):
    s = sem_acento(t).strip().lower()
    s = ''.join(c if c.isalnum() else '-' for c in s)
    while '--' in s:
        s = s.replace('--', '-')
    return s.strip('-')


def id_cidade(nome):
    base = ident(nome)
    return APELIDOS_CIDADE.get(base, base)


def ano(data):
    """'20/05/2018' -> 2018"""
    try:
        return int(str(data).strip()[-4:])
    except ValueError:
        return 0


def chave(t):
    """Nome de torcida sem acento, sem caixa e sem separador nenhum.
    Nao da pra parear pelo id: o id do jogo usa underscore (mafia_azul) e
    ident() devolve hifen (mafia-azul), e so as torcidas de nome de uma
    palavra casavam — 15 de 140."""
    return ''.join(c for c in sem_acento(t).lower() if c.isalnum())


def fundacao_da_planilha():
    """{chave do nome: (ano, mes, dia)} da coluna "Data de fundacao".

    A planilha guarda a data COMPLETA — Gavioes em 01/07/1969 — e a
    importacao guardava so o ano, jogando dia e mes fora nas 140. Sem eles
    a festa de aniversario do aliado caia num dia sorteado por hash.

    O openpyxl ja devolve datetime quando a celula esta formatada como
    data; quando vem numero cru, e o serial do Excel, que conta dias desde
    1899-12-30. Celula vazia ou que nao vira data fica de fora, e quem
    ficar de fora continua caindo no hash — reserva, nao regra.
    """
    if not PLANILHA.exists():
        return {}
    try:
        import openpyxl, datetime
    except ImportError:
        return {}
    ws = openpyxl.load_workbook(PLANILHA, data_only=True)['Torcidas']
    cab = [str(c or '').strip().lower() for c in
           next(ws.iter_rows(max_row=1, values_only=True))]
    col = next((i for i, c in enumerate(cab) if 'funda' in c), None)
    cn = cab.index('torcida') if 'torcida' in cab else 0
    if col is None:
        print('  aba Torcidas sem coluna de fundacao: dia e mes ficam no hash')
        return {}
    fora, seriais = {}, []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r[cn]:
            continue
        v = r[col]
        d = None
        if isinstance(v, datetime.datetime):
            d = v.date()
        elif isinstance(v, datetime.date):
            d = v
        elif isinstance(v, (int, float)) and v > 0:
            seriais.append(v)
            # o serial 60 e o 29/02/1900 que nunca existiu; ele so afeta
            # datas anteriores a marco de 1900, e nenhuma torcida foi
            # fundada antes disso — a conferencia abaixo confirma
            d = (datetime.date(1899, 12, 30) +
                 datetime.timedelta(days=int(v)))
        if d:
            fora[chave(r[cn])] = (d.year, d.month, d.day)
    if seriais:
        baixos = [x for x in seriais if x < 61]
        print(f'  seriais crus: {len(seriais)}, abaixo de 61: {len(baixos)}')
    return fora


def siglas_da_planilha():
    """{chave do nome: sigla da torcida}. A aba Torcidas ganhou a coluna
    Sigla; sem a planilha (ou sem openpyxl) o jogo cai na sigla derivada do
    nome, entao isto e opcional de proposito."""
    if not PLANILHA.exists():
        print('  planilha ausente: siglas de torcida ficam derivadas do nome')
        return {}
    try:
        import openpyxl
    except ImportError:
        print('  sem openpyxl: siglas de torcida ficam derivadas do nome')
        return {}
    ws = openpyxl.load_workbook(PLANILHA, data_only=True)['Torcidas']
    cab = [str(c or '').strip().lower() for c in
           next(ws.iter_rows(max_row=1, values_only=True))]
    if 'sigla' not in cab:
        print('  aba Torcidas sem coluna Sigla: siglas ficam derivadas do nome')
        return {}
    cn, cs = cab.index('torcida'), cab.index('sigla')
    fora = {}
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r[cn]:
            continue
        s = str(r[cs] or '').strip()
        if s:
            fora[chave(r[cn])] = s
    return fora


def fundacao_completa(datas, t):
    """Dia e mes de fundacao, quando a planilha tem. O ANO continua vindo
    do JSON: e ele que as 140 tem, a planilha tem 138."""
    d = datas.get(chave(t['nome']))
    if not d:
        return {}
    fora = {'fundacaoMes': d[1], 'fundacaoDia': d[2]}
    # ano da planilha so entra quando o JSON nao tem
    if not ano(t.get('fundacao', '')):
        fora['fundacao'] = d[0]
    return fora


def escrever(caminho, cabecalho, corpo):
    (RAIZ / caminho).write_text(
        f'/* {cabecalho}\n'
        f'   GERADO por ferramentas/importar_relacoes.py — nao editar a mao. */\n'
        f'{corpo}\n', encoding='utf-8')
    kb = (RAIZ / caminho).stat().st_size / 1024
    print(f'  {caminho}: {kb:.0f} KB')


def main():
    origem = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ORIGEM
    d = json.loads(origem.read_text(encoding='utf-8'))
    siglas = siglas_da_planilha()
    datas = fundacao_da_planilha()

    torcidas = []
    for t in d['torcidas']:
        r = t.get('relacoes', {}) or {}
        dv = t.get('derivados', {}) or {}
        c = t.get('cores', {}) or {}
        torcidas.append({
            'id': t['id'],
            'nome': t['nome'],
            'clube': t.get('clube', ''),
            'clubeId': ident(t.get('clube', '')),
            'sigla': t.get('sigla', ''),                    # a do CLUBE
            'siglaTorcida': siglas.get(chave(t['nome']), ''),   # a da TORCIDA
            'cidade': t.get('cidade', ''),
            'mapa': id_cidade(t.get('cidade', '')),
            'uf': t.get('uf', ''),
            'regiao': t.get('regiao', ''),
            'estadio': t.get('estadio', ''),
            'divisaoClube': t.get('divisaoClube', 0),
            'bairroSede': t.get('bairroSede', ''),
            'fundacao': ano(t.get('fundacao', '')),
            **fundacao_completa(datas, t),
            'cores': [c.get('camisa', '#8a8a8a'), c.get('calcao', '#8a8a8a')],
            'detalhe': c.get('detalhe', '#8a8a8a'),
            'membros': dv.get('membros', t.get('quantidadeNPCs', 20)),
            'sedeNivel': dv.get('sedeNivel', 1),
            'moral': dv.get('moral', 60),
            'prestigio': dv.get('prestigio', 15),
            'saldo': dv.get('saldo', 200),
            'poder': dv.get('poderEstimado', 0),
            'cargos': {
                'povao': dv.get('povao', 0), 'componentes': dv.get('componentes', 0),
                'frente': dv.get('linhaDeFrente', 0), 'diretoria': dv.get('diretoria', 0),
            },
            # o grafo, por torcida: e a forma compacta da mesma informacao
            'aliados': r.get('aliados', []),
            'irmandade': r.get('irmandade', []),
            'rivais': r.get('rivais', []),
            'maioresRivais': r.get('maioresRivais', r.get('maiores_rivais', [])),
        })
        # asset sem clube nem cidade: fica no arquivo, mas marcado, pra nao
        # aparecer na selecao e nao sumir sem ninguem notar
        if not t.get('clube') or not t.get('cidade'):
            torcidas[-1]['incompleta'] = True

    # Relacao e mao dupla. Onde a fonte so registrou um lado, o outro
    # e completado aqui — senao a mesma dupla se ve diferente conforme
    # de quem se olha, e o jogador ve incoerencia.
    por = {t['id']: t for t in torcidas}
    simetrizadas = 0
    for t in torcidas:
        for campo in ('aliados', 'irmandade', 'rivais', 'maioresRivais'):
            for alvo in list(t[campo]):
                o = por.get(alvo)
                if not o:
                    continue
                if t['id'] not in (o['aliados'] + o['irmandade'] +
                                   o['rivais'] + o['maioresRivais']):
                    o[campo].append(t['id'])
                    simetrizadas += 1

    linhas = ',\n'.join('  ' + json.dumps(t, ensure_ascii=False) for t in torcidas)
    escrever('dados/torcidas.js',
             f'TORCIDAS ORGANIZADAS — {len(torcidas)} registros, com relacoes',
             f'TO.dados.torcidas = [\n{linhas}\n];')

    escrever('dados/diplomacia.js', 'DIPLOMACIA — regras de relacao e parametros',
             'TO.dados.diplomacia = ' +
             json.dumps({'regras': d['regras'], 'parametros': d['parametros']},
                        ensure_ascii=False, indent=1) + ';')

    # ---------------- conferencia ----------------
    print('\nconferencia:')
    ids = {t['id'] for t in torcidas}
    quebradas = {}
    for t in torcidas:
        for campo in ('aliados', 'irmandade', 'rivais', 'maioresRivais'):
            for alvo in t[campo]:
                if alvo not in ids:
                    quebradas.setdefault(alvo, 0)
                    quebradas[alvo] += 1
    total = sum(len(t[c]) for t in torcidas
                for c in ('aliados', 'irmandade', 'rivais', 'maioresRivais'))
    print(f'  relacoes direcionais: {total}')
    print(f'  apontando pra torcida inexistente: {sum(quebradas.values())}'
          + (f' {sorted(quebradas)[:6]}' if quebradas else ''))
    comData = sum(1 for t in torcidas if t.get('fundacaoDia'))
    print(f'  com dia e mes de fundacao: {comData} de {len(torcidas)}'
          f' · no hash por falta de dado: {len(torcidas)-comData}')
    g = next((t for t in torcidas if t['id'] == 'gavioes'), None)
    if g:
        print(f"  Gavioes: {g.get('fundacaoDia','?'):02}/"
              f"{g.get('fundacaoMes','?'):02}/{g['fundacao']}")

    # simetria: se A diz que B e rival, B diz o mesmo de A?
    por_id = {t['id']: t for t in torcidas}
    assimetricas = 0
    for t in torcidas:
        for campo in ('aliados', 'irmandade', 'rivais', 'maioresRivais'):
            for alvo in t[campo]:
                o = por_id.get(alvo)
                if not o:
                    continue
                if t['id'] not in (o['aliados'] + o['irmandade'] +
                                   o['rivais'] + o['maioresRivais']):
                    assimetricas += 1
    print(f'  relacoes sem volta que foram completadas: {simetrizadas}')
    print(f'  ainda assimetricas depois de completar: {assimetricas}')
    incompletas = [t['nome'] for t in torcidas if t.get('incompleta')]
    print(f'  registros incompletos (sem clube ou cidade): {incompletas or "nenhum"}')

    # cruzamento com times.js
    tj = RAIZ / 'dados/times.js'
    if tj.exists():
        txt = tj.read_text(encoding='utf-8')
        conhecidos = {json.loads(l.strip().rstrip(','))['id']
                      for l in txt.splitlines() if l.strip().startswith('{')}
        orfaos = sorted({t['clubeId'] for t in torcidas
                         if t['clubeId'] and t['clubeId'] not in conhecidos})
        print(f'  clubes fora de times.js: {orfaos or "nenhum"}')

    # cruzamento com cidades.js
    cid_js = (RAIZ / 'dados/cidades.js')
    if cid_js.exists():
        txt = cid_js.read_text(encoding='utf-8')
        conhecidas = {json.loads(l.strip().rstrip(','))['id']
                      for l in txt.splitlines() if l.strip().startswith('{')}
        orfas = sorted({t['mapa'] for t in torcidas if t['mapa'] not in conhecidas})
        print(f'  torcidas em cidade fora de cidades.js: {orfas or "nenhuma"}')

    sem_rel = [t['nome'] for t in torcidas
               if not (t['aliados'] or t['irmandade'] or t['rivais'])]
    print(f'  torcidas sem relacao nenhuma: {sem_rel or "nenhuma"}')


if __name__ == '__main__':
    main()
