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
            'sigla': t.get('sigla', ''),
            'cidade': t.get('cidade', ''),
            'mapa': id_cidade(t.get('cidade', '')),
            'uf': t.get('uf', ''),
            'regiao': t.get('regiao', ''),
            'estadio': t.get('estadio', ''),
            'divisaoClube': t.get('divisaoClube', 0),
            'bairroSede': t.get('bairroSede', ''),
            'fundacao': ano(t.get('fundacao', '')),
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
