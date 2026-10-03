#!/usr/bin/env python3
"""O QUE FALTA TRADUZIR (dono, 24/09/2026 — ver docs/I18N.md).

Dois relatórios:

  python3 ferramentas/i18n_faltando.py
      As chaves que o código pede em _t()/_tn() e que não têm tradução
      em es ou en nos dicionários (dados/i18n/*.js), e as chaves dos
      dicionários que ninguém pede mais (órfãs).

  python3 ferramentas/i18n_faltando.py suspeitos js/main.js [ini fim]
      Os textos em português ainda SOLTOS no arquivo (fora de _t), com
      o número da linha — a lista de trabalho de quem traduz. É um
      palpite: pega literal com cara de frase (acento, ou duas palavras)
      que não está dentro de _t( … ), e deixa de fora chave de objeto,
      id, classe, cor, caminho e comentário. Confira antes de trocar.
"""
import json, os, re, subprocess, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA_DIC = os.path.join(RAIZ, 'dados', 'i18n')
CODIGO = ['js', 'dados']
FORA = ('js/lib/', 'dados/i18n/', 'dados/cenas_foto.js', 'dados/boneco', 'dados/malha.js',
        'dados/cidade_mapa', 'dados/cena_arredores.js', 'dados/escudos.js', 'dados/capas.js')

LE_DIC = r"""
const fs=require('fs'), path=require('path'), vm=require('vm');
const pasta=process.argv[1]; const tudo={};
const TO={i18n:{registrar(t){ for(const k in t) tudo[k]=Object.assign(tudo[k]||{}, t[k]); }}};
for(const f of fs.readdirSync(pasta).filter(f=>f.endsWith('.js')).sort()){
  const ctx={TO, window:{}}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(pasta,f),'utf8'), ctx, {filename:f});
}
process.stdout.write(JSON.stringify(tudo));
"""

def dicionario():
    r = subprocess.run(['node', '-e', LE_DIC, PASTA_DIC], capture_output=True, text=True)
    if r.returncode:
        sys.exit('erro lendo os dicionários:\n' + r.stderr)
    return json.loads(r.stdout)

ESC = {'n': '\n', 't': '\t', "'": "'", '"': '"', '`': '`', '\\': '\\', '$': '$'}
def desescapar(s):
    return re.sub(r'\\(.)', lambda m: ESC.get(m.group(1), m.group(1)), s)

LIT = r"""(?:'((?:\\.|[^'\\\n])*)'|"((?:\\.|[^"\\\n])*)"|`((?:\\.|[^`\\])*)`)"""
RX_T = re.compile(r'\b_t\(\s*' + LIT)
RX_TN = re.compile(r'\b_tn\(\s*[^,()]+,\s*' + LIT + r'\s*,\s*' + LIT)

def arquivos():
    for base in CODIGO:
        for d, _, fs in os.walk(os.path.join(RAIZ, base)):
            for f in fs:
                if not f.endswith('.js'): continue
                p = os.path.relpath(os.path.join(d, f), RAIZ)
                if p.startswith(FORA): continue
                yield p

def sem_comentarios(s):
    """troca comentário por espaço, mantendo as quebras (as linhas batem)"""
    out, i, n = [], 0, len(s)
    while i < n:
        c = s[i]
        if c in '\'"`':
            j = i + 1
            while j < n and s[j] != c:
                j += 2 if s[j] == '\\' else 1
            out.append(s[i:j+1]); i = j + 1
        elif s.startswith('/*', i):
            j = s.find('*/', i + 2); j = n if j < 0 else j + 2
            out.append(re.sub(r'[^\n]', ' ', s[i:j])); i = j
        elif s.startswith('//', i) and (i == 0 or s[i-1] not in ':\\'):
            j = s.find('\n', i); j = n if j < 0 else j
            out.append(' ' * (j - i)); i = j
        else:
            out.append(c); i += 1
    return ''.join(out)

def chaves_do_codigo():
    usadas = {}
    for p in arquivos():
        s = sem_comentarios(open(os.path.join(RAIZ, p), encoding='utf-8').read())
        for m in RX_T.finditer(s):
            g = next(x for x in m.groups() if x is not None) if any(x is not None for x in m.groups()) else ''
            if m.group(3) is not None and '${' in m.group(3):
                continue            # template com ${}: não é chave fixa
            usadas.setdefault(desescapar(g), set()).add(p)
        for m in RX_TN.finditer(s):
            gs = m.groups()
            for par in (gs[0:3], gs[3:6]):
                g = next((x for x in par if x is not None), None)
                if g is not None: usadas.setdefault(desescapar(g), set()).add(p)
    return usadas

def relatorio():
    dic = dicionario()
    usadas = chaves_do_codigo()
    falta = {l: sorted(k for k in usadas if l not in dic.get(k, {})) for l in ('es', 'en')}
    orfas = sorted(k for k in dic if k not in usadas)
    print(f'chaves no código: {len(usadas)} · no dicionário: {len(dic)}')
    for l in ('es', 'en'):
        print(f'\nsem tradução em {l}: {len(falta[l])}')
        for k in falta[l][:60]:
            print(f'  {k!r}  ← {", ".join(sorted(usadas[k]))[:80]}')
    print(f'\nórfãs (no dicionário, ninguém pede): {len(orfas)}')
    for k in orfas[:30]: print(f'  {k!r}')
    return 1 if (falta['es'] or falta['en']) else 0

PORTUGUES = re.compile(r'[ãõçáéíóúâêôà]|\b(não|você|pra|com|uma?|dos?|das?|de|em|no|na|nos|nas|que|mais|sem|pelo|pela|está|são|foi|tem|vai|agora|hoje)\b', re.I)
EXIBIDO = re.compile(r'(\b(texto|rot|nome|titulo|título|nota|motivo|msg|sub|html|placeholder|title|rotulo|consequencia|resumo|dica|aviso|perto|longe|feito|espera)\s*:\s*$|(textContent|innerHTML|innerText|title|placeholder|value)\s*=\s*$|\b(aviso|alert|confirm|logar|modal)\(\s*(J\s*,\s*)?$)')
IGNORAR_CONTEXTO = re.compile(r'(\b(id|acao|tipo|kind|class|classe|cena|chave|local|ic|icone|lado|linha|cargo|ramo|estado|voz|peso|tom|zona|botao|chaveSemana)\s*:\s*$|\[\s*$|===?\s*$|!==?\s*$|case\s+$|getElementById\(\s*$|\$\(\s*$|querySelector(All)?\(\s*$|classList\.\w+\(\s*$|localStorage\.\w+\(\s*$|require\(\s*$|console\.\w+\(\s*$)')

def sem_interpolacao(txt):
    """tira os ${...} de um template, com chaves aninhadas dentro"""
    out, i, n = [], 0, len(txt)
    while i < n:
        if txt.startswith('${', i):
            prof, j = 1, i + 2
            while j < n and prof:
                if txt[j] == '{': prof += 1
                elif txt[j] == '}': prof -= 1
                j += 1
            i = j
        else:
            out.append(txt[i]); i += 1
    return ''.join(out)

def suspeitos(caminho, ini=1, fim=10**9):
    s = open(os.path.join(RAIZ, caminho), encoding='utf-8').read()
    limpo = sem_comentarios(s)
    rx = re.compile(LIT)
    achados = 0
    for m in rx.finditer(limpo):
        linha = limpo.count('\n', 0, m.start()) + 1
        if linha < ini or linha > fim: continue
        txt = next((x for x in m.groups() if x is not None), '')
        cru = sem_interpolacao(txt)
        cru = re.sub(r'<[^>]+>', ' ', cru)
        if not re.search(r'[A-Za-zÀ-ú]{2,}', cru): continue
        antes = limpo[max(0, m.start()-60):m.start()]
        exibido = bool(EXIBIDO.search(antes)) and re.search(r'[A-Za-zÀ-ú]{3,}', cru)
        if not (exibido or PORTUGUES.search(cru) or re.search(r'[A-Za-zÀ-ú]{3,}\s+[A-Za-zÀ-ú]{3,}', cru)): continue
        if re.search(r'\b_tn?\(\s*(?:[^,()]+,\s*)?$', antes): continue
        if IGNORAR_CONTEXTO.search(antes): continue
        if re.fullmatch(r'[\w\-./#:%]+', cru.strip()): continue   # id, classe, caminho
        achados += 1
        print(f'{caminho}:{linha}: {txt[:110]!r}')
    print(f'-- {achados} suspeitos')

if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == 'suspeitos':
        a = sys.argv[2:]
        suspeitos(a[0], int(a[1]) if len(a) > 1 else 1, int(a[2]) if len(a) > 2 else 10**9)
    else:
        sys.exit(relatorio())
