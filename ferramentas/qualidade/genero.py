#!/usr/bin/env python3
"""Propõe as linhas que faltam em dados/genero.js.

   A tabela de gênero é FECHADA e vive no repositório justamente pra
   que o jogo não precise adivinhar nem chamar ninguém: é consulta
   exata dentro de um HTML offline. Esta ferramenta é a manutenção
   dela. Quando alguém acrescenta um estádio em dados/estadios.js, uma
   divisão em dados/times.js ou uma fase nova no mata-mata, o nome
   entra sem gênero, `TO.genero` cai no palpite e avisa no console.
   Aqui a gente varre os dados, vê quem ficou de fora e pede ao
   TypeSafe o julgamento — que é semântico, não aritmético: "Joia da
   Princesa é feminino, Passo d'Areia é masculino" não é regra que se
   escreva em regex, como quatro regexes diferentes já provaram.

   O que sai daqui é PROPOSTA. Revisar e colar na tabela à mão: o que
   entra no jogo é o arquivo revisado, nunca uma chamada em tempo de
   jogo.

   Uso:
     pip install typesafe-sdk
     export TYPESAFE_API_KEY=...
     python3 ferramentas/qualidade/genero.py           # só o que falta
     python3 ferramentas/qualidade/genero.py --tudo    # confere a tabela toda
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import sys
import unicodedata

try:
    from typesafe_sdk import Choice, Noul, TypeSafeClient, TypeSafeError
except ImportError:  # pragma: no cover
    sys.exit("falta o SDK: pip install typesafe-sdk")

RAIZ = pathlib.Path(__file__).resolve().parents[2]

# a régua: abaixo disto a proposta sai marcada pra olho humano
CORTE_CONFIANCA = 0.75


# ------------------------------------------------------- de onde vêm os nomes
def nomes_do_jogo() -> dict[str, list[str]]:
    """Lê os dados do jogo, não a tabela. É a lista que a tabela tem de cobrir."""
    times = (RAIZ / "dados" / "times.js").read_text(encoding="utf-8")
    estadios = (RAIZ / "dados" / "estadios.js").read_text(encoding="utf-8")
    comps = "\n".join((RAIZ / "js" / "mundo" / f).read_text(encoding="utf-8")
                      for f in ("competicoes.js", "conmebol.js", "ligas.js"))

    tirar = lambda txt, campo: sorted({
        m.group(1) for m in re.finditer(r'"%s"\s*:\s*"([^"]+)"' % campo, txt)})

    competicao = set(tirar(times, "regional")) | set(tirar(times, "divisao"))
    # nomes soltos que o código cria: Copa do Brasil, Libertadores e cia
    competicao |= {m.group(1) for m in re.finditer(
        r"'((?:Copa|Taça|Recopa|Supercopa|Copinha)[^']*|Libertadores|Sul-Americana)'",
        comps)}

    fases = {m.group(1) for m in re.finditer(r"fase\s*:\s*'([^']+)'",
             "\n".join((RAIZ / "js" / "mundo" / f).read_text(encoding="utf-8")
                       for f in ("competicoes.js", "conmebol.js")))}
    fases = {f for f in fases if f and not f.startswith("abre-")
             and f not in ("fim", "grupos", "regular", " · ")}

    # o nome que o texto usa é o campo `estadio` de times.js (343
    # nomes, o continente todo); estadios.js só tem as 76 praças do
    # Brasil, e é subconjunto por coincidência, não por regra
    return {"competicao": sorted(competicao),
            "estadio": sorted(set(tirar(times, "estadio")) |
                              set(tirar(estadios, "nome"))),
            "fase": sorted(fases)}


def tabela_atual() -> dict[str, dict[str, str]]:
    """Lê dados/genero.js sem executar JS: as listas são literais."""
    txt = (RAIZ / "dados" / "genero.js").read_text(encoding="utf-8")
    # fora os comentários: eles citam nomes entre aspas e entrariam
    # na tabela como se fossem entradas ("Fecha 1" … "Fecha 13")
    txt = re.sub(r"/\*.*?\*/", "", txt, flags=re.S)
    fora = {}
    for tipo in ("competicao", "estadio", "fase"):
        bloco = re.search(r"\b%s\s*:\s*\{(.*?)\n  \}" % tipo, txt, re.S)
        m = {}
        if bloco:
            for g, lista in re.findall(r"\b(f|fp|m)\s*:\s*\[(.*?)\]",
                                       bloco.group(1), re.S):
                for a, b in re.findall(r"'([^']*)'|\"([^\"]*)\"", lista):
                    m[a or b] = g
        fora[tipo] = m
    return fora


# ------------------------------------------------------- o julgamento
SENTIDO = {
    "competicao": ("uma competição de futebol (campeonato, liga ou copa) "
                   "como o jogo a escreve no feed"),
    "estadio": "um estádio de futebol brasileiro",
    "fase": "uma fase de mata-mata de um torneio de futebol",
}
EXEMPLO = {
    "competicao": ('"a Copa do Brasil" e "a Argentina Primera" (Copa e Primera '
                   'são femininos), "o Mineiro" e "o Brasileirão Série A"'),
    "estadio": ('"na Arena Castelão", "na Vila Belmiro" e "na Joia da Princesa"; '
                '"no Maracanã", "no Beira-Rio" e "no Passo d\'Areia"'),
    "fase": ('"na final", "na semifinal"; "nas oitavas", "nas quartas" '
             '(plural); "no playoff" (masculino)'),
}


def perguntas(tipo: str) -> dict:
    """Uma Choice pro gênero e uma Noul pro caso que o palpite antigo errava.

    As duas olham o MESMO estado e não dependem uma da outra, então vão
    no mesmo request. A Noul não decide nada sozinha: ela separa o nome
    que qualquer regex acerta do nome que só se resolve sabendo o que a
    palavra quer dizer, e é esse segundo grupo que merece revisão
    humana mesmo com confiança alta.
    """
    return {
        "genero": Choice(
            instructions=(
                f"`nome` é o nome próprio de {SENTIDO[tipo]}, em português do "
                "Brasil. Que artigo definido o nome pede numa frase como "
                f"\"o jogo foi ___ {'{nome}'}\"? Exemplos: {EXEMPLO[tipo]}."
            ),
            criteria={
                "f": "Feminino singular: pede a/da/na/pela.",
                "fp": "Feminino plural: pede as/das/nas/pelas.",
                "m": "Masculino singular: pede o/do/no/pelo.",
                "mp": "Masculino plural: pede os/dos/nos/pelos.",
            },
        ),
        "so_com_sentido": Noul(
            instructions=(
                "Pra acertar o artigo de `nome` é preciso saber o que a "
                "palavra significa, em vez de olhar só a forma dela (a "
                "terminação, a primeira palavra, o plural em -s)?"
            ),
            criteria={
                "true": (
                    "O artigo depende do sentido ou do substantivo implícito. "
                    "Ex.: 'Joia da Princesa' é feminino pela joia, não pela "
                    "forma; 'Playoff' é estrangeirismo masculino."
                ),
                "false": (
                    "A forma do nome já entrega o artigo — termina em -a "
                    "feminino, em -o ou -ão masculino, e por aí."
                ),
            },
        ),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tudo", action="store_true",
                    help="confere também o que já está na tabela")
    ap.add_argument("--tipo", choices=["competicao", "estadio", "fase"])
    args = ap.parse_args()

    do_jogo, tabela = nomes_do_jogo(), tabela_atual()
    tipos = [args.tipo] if args.tipo else ["competicao", "estadio", "fase"]

    # a consulta em TO.genero ignora acento e caixa; a conferência aqui
    # tem de ignorar também, senão "previa" e "Prévia" viram dois nomes
    crua = lambda s: unicodedata.normalize("NFD", s.strip().lower()) \
        .encode("ascii", "ignore").decode()
    tem = {t: {crua(n) for n in tabela[t]} for t in tipos}
    pendente = {t: [n for n in do_jogo[t] if args.tudo or crua(n) not in tem[t]]
                for t in tipos}
    total = sum(len(v) for v in pendente.values())
    vistos = {t: {crua(n) for n in do_jogo[t]} for t in tipos}
    sobrando = {t: sorted(n for n in tabela[t] if crua(n) not in vistos[t])
                for t in tipos}

    for t in tipos:
        if sobrando[t]:
            print(f"# {t}: na tabela e fora dos dados — {', '.join(sobrando[t])}")
    if not total:
        print("nada a propor: a tabela cobre todos os nomes dos dados.")
        return 0
    if not os.environ.get("TYPESAFE_API_KEY"):
        print(f"\n{total} nome(s) sem gênero:", file=sys.stderr)
        for t in tipos:
            for n in pendente[t]:
                print(f"  {t}: {n}", file=sys.stderr)
        print("\nerro: falta TYPESAFE_API_KEY pra propor o gênero.", file=sys.stderr)
        return 2

    proposta, duvida = {t: {"f": [], "fp": [], "m": [], "mp": []} for t in tipos}, []
    with TypeSafeClient() as cli:
        for t in tipos:
            for n in pendente[t]:
                try:
                    r = cli.system_one(state={"nome": n, "tipo": SENTIDO[t]},
                                       questions=perguntas(t))
                except TypeSafeError as e:
                    print(f"erro: chamada falhou em {n}: {e}", file=sys.stderr)
                    return 2
                g = r.choices["genero"]
                proposta[t][g.choice].append(n)
                if g.confidence < CORTE_CONFIANCA or r.nouls["so_com_sentido"].noul > 0.5:
                    duvida.append((t, n, g.choice, g.confidence,
                                   r.nouls["so_com_sentido"].noul))

    print("\n=== proposta pra colar em dados/genero.js ===")
    for t in tipos:
        if not any(proposta[t].values()):
            continue
        print(f"\n  {t}: {{")
        for g in ("f", "fp", "m", "mp"):
            if proposta[t][g]:
                print(f"    {g}: {json.dumps(proposta[t][g], ensure_ascii=False)},")
        print("  },")

    if duvida:
        print("\n=== olhar no olho antes de colar ===")
        for t, n, g, conf, sem in duvida:
            print(f"  [{t}] {n} → {g}  (confiança {conf:.2f}, "
                  f"depende do sentido {sem:.2f})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
