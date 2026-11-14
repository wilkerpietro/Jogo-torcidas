#!/usr/bin/env python3
"""
Cola no dados/cenas_editadas.js o remendo que o editor (F2) exportou.

O editor devolve um bloco assim, ja com a chave da cena:

    'rua-media': {
      mascara:"192;192;...",
      spawns:[ ... ], entradas:[ ... ], pmPostos:[ ... ], grades:[ ... ]
    },

Colar na unha funciona, mas tem tres armadilhas que ja morderam: a
entrada anterior fica sem virgula e o arquivo inteiro deixa de carregar;
quem cola duas vezes fica com a mesma cena duas vezes no objeto e a
segunda ganha calada; e a mascara vem numa linha de 3 KB, que faz o diff
da revisao inteira virar uma linha so. Esta ferramenta troca a entrada
no lugar (mantendo o comentario que estiver em cima), reescreve no
formato da casa e poe a pontuacao certa.

    python3 ferramentas/colar_remendo.py remendo.txt
    pbpaste | python3 ferramentas/colar_remendo.py

Depois rode ferramentas/prova_mascara.py pra ver, por cima da foto, a
malha que ficou valendo.
"""
import json, pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ALVO = RAIZ / 'dados' / 'cenas_editadas.js'
LISTAS = ('spawns', 'entradas', 'pmPostos', 'grades')
OBJETOS = ('gatilho',)
COLUNA = 78            # onde a mascara quebra de linha


def fecha(txt, i, abre='{', fim='}'):
    """Do abre em txt[i] ate o par que fecha. Pula o que estiver em string."""
    nivel, aspas, j = 0, None, i
    while j < len(txt):
        c = txt[j]
        if aspas:
            if c == '\\': j += 2; continue
            if c == aspas: aspas = None
        elif c in '"\'': aspas = c
        elif c == abre: nivel += 1
        elif c == fim:
            nivel -= 1
            if nivel == 0: return j + 1
        j += 1
    raise SystemExit('bloco sem fechamento')


def ler(entrada):
    """O bloco exportado vira dicionario. Nao e JSON: tem comentario,
    aspas simples e string quebrada em pedacos somados."""
    t = re.sub(r'/\*.*?\*/', '', entrada, flags=re.S)
    dados = {}
    m = re.search(r"mascara\s*:\s*", t)
    if m:
        s = t[m.end():]
        pedacos = re.findall(r'"([^"]*)"|\'([^\']*)\'', s[:s.index('\n')] if '\n' in s else s)
        # a mascara pode vir somada em varias linhas
        fim = re.search(r'[,\n]\s*(spawns|entradas|pmPostos|grades|poligonos)\s*:', s)
        trecho = s[:fim.start()] if fim else s
        dados['mascara'] = ''.join(a or b for a, b in re.findall(r'"([^"]*)"|\'([^\']*)\'', trecho))
    def limpar(bruto):
        bruto = re.sub(r',(\s*[}\]])', r'\1', bruto)
        bruto = re.sub(r"'([^'\\]*)'", r'"\1"', bruto)
        return re.sub(r'([{,])\s*([A-Za-z_]\w*)\s*:', r'\1"\2":', bruto)
    for campo in LISTAS:
        m = re.search(campo + r'\s*:\s*\[', t)
        if not m:
            continue
        i = t.index('[', m.start())
        dados[campo] = json.loads(limpar(t[i:fecha(t, i, '[', ']')]))
    for campo in OBJETOS:
        m = re.search(campo + r'\s*:\s*\{', t)
        if not m:
            continue
        i = t.index('{', m.start())
        dados[campo] = json.loads(limpar(t[i:fecha(t, i)]))
    return dados


def escrever(chave, d):
    """No formato da casa: mascara quebrada, um marcador por linha."""
    j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    linhas = [f"  '{chave}': {{"]

    if 'mascara' in d:
        pedacos, atual = [], ''
        for l in d['mascara'].split(';'):
            if len(atual) + len(l) + 1 > COLUNA:
                pedacos.append(atual); atual = l + ';'
            else:
                atual += l + ';'
        if atual: pedacos.append(atual)
        pedacos[-1] = pedacos[-1].rstrip(';')
        linhas.append('    mascara:')
        for i, p in enumerate(pedacos):
            linhas.append(f"      '{p}'" + (' +' if i < len(pedacos) - 1 else ','))

    for campo in LISTAS:
        v = d.get(campo)
        if v is None or (campo == 'grades' and not v):
            continue                     # grade vazia e o padrao: nao suja o arquivo
        if len(linhas) > 1: linhas.append('')
        linhas.append(f'    {campo}:[')
        linhas.append(',\n'.join('      ' + j(o) for o in v))
        linhas.append('    ],')
    for campo in OBJETOS:
        if d.get(campo) is None:
            continue
        if len(linhas) > 1: linhas.append('')
        linhas.append(f'    {campo}:{j(d[campo])},')
    linhas[-1] = linhas[-1].rstrip(',')   # o ultimo campo fecha sem virgula
    linhas.append('  }')
    return '\n'.join(linhas)


def achar(txt, chave):
    m = re.search(r"^[ \t]*'%s'\s*:\s*\{" % re.escape(chave), txt, re.M)
    if not m:
        return None
    fim = fecha(txt, txt.index('{', m.start()))
    return m.start(), fim + (1 if txt[fim:fim + 1] == ',' else 0)


def main():
    bruto = (pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
             if len(sys.argv) > 1 else sys.stdin.read())

    m = re.search(r"'([\w-]+)'\s*:\s*\{", bruto)
    if not m:
        raise SystemExit('nao achei a chave da cena no remendo — ele comeca com "\'rua\': {"')
    chave = m.group(1)
    i = bruto.index('{', m.start())
    d = ler(bruto[i:fecha(bruto, i)])
    # o remendo pode ser so de malha ou so de marcador: os dois casos
    # existem — repintar sem mexer em ninguem, e remarcar sem repintar
    if not any(c in d for c in ('mascara',) + LISTAS + OBJETOS):
        raise SystemExit('remendo vazio — exportou a cena certa?')
    if 'mascara' in d and len(d['mascara'].split(';')) != 128:
        raise SystemExit(f"mascara com {len(d['mascara'].split(';'))} linhas, esperava 128")

    txt = ALVO.read_text(encoding='utf-8')
    onde = achar(txt, chave)
    if onde:
        a, b = onde
        # remendo troca o que trouxe e MANTEM o resto: quem repinta a
        # malha nao quer perder a marcacao que ja estava certa
        antigo = ler(txt[txt.index('{', a):fecha(txt, txt.index('{', a))])
        antigo.update(d); d = antigo
        entrada = escrever(chave, d)
        txt = txt[:a] + entrada + ',' + txt[b:]   # o comentario de cima fica
        print(f"'{chave}': trocado no lugar ({', '.join(sorted(d))})")
    else:
        entrada = escrever(chave, d)
        i = txt.rindex('\n};')
        cabeca = txt[:i].rstrip()
        txt = cabeca + (',' if cabeca.endswith('}') else '') + '\n\n' + entrada + '\n' + txt[i:]
        print(f"'{chave}': entrada nova")
    txt = re.sub(r'\},(\s*)\n\};', r'}\1\n};', txt)   # a ultima nao leva virgula
    ALVO.write_text(txt, encoding='utf-8')
    print(f'{ALVO.relative_to(RAIZ)} — {len(txt)//1024} KB')


if __name__ == '__main__':
    main()
