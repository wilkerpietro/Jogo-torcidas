#!/usr/bin/env python3
"""Confere, com o TypeSafe, as duas coisas que a gente vinha checando no olho.

   1. TEXTO GERADO. O jogo monta centenas de frases por template, encaixando
      nome de torcida, de clube, de competição e de fase. Erro aqui não quebra
      nada — só sai escrito errado, e só se vê lendo. Já passaram por aqui
      "o bar da eles", "A Galoucura inaugurou a ampliação da loja" e
      "na Oitavas do Copa do Brasil".

   2. DICA × CONSEQUÊNCIA. Todo botão promete um efeito antes do clique
      (`dica`) e escreve o que houve depois (`consequencia`). O harness mede o
      efeito REAL. As três coisas têm de bater; quando não batem, o jogo mente
      pro jogador na hora de decidir.

   Isto NÃO entra no jogo. Roda aqui, offline do bundle, com a chave no
   ambiente — o jogo continua sendo um arquivo HTML sem rede e sem segredo.

   Uso:
     pip install typesafe-sdk
     export TYPESAFE_API_KEY=...
     python3 ferramentas/qualidade/conferir.py            # amostra.json
     python3 ferramentas/qualidade/conferir.py --limite 40
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import sys

try:
    from typesafe_sdk import Choice, Noul, TypeSafeClient
    from typesafe_sdk import TypeSafeError
except ImportError:  # pragma: no cover
    sys.exit("falta o SDK: pip install typesafe-sdk")

AQUI = pathlib.Path(__file__).resolve().parent
AMOSTRA = AQUI / "amostra.json"

# A régua de quando chamar a atenção. O SKILL manda avaliar isto nos dados do
# projeto em vez de herdar número de cookbook, então começa frouxo de
# propósito: é melhor olhar um texto bom do que deixar passar um ruim.
CORTE_DEFEITO = 0.60   # Noul de defeito acima disto vira achado
CORTE_OK = 0.40        # Noul de "está certo" abaixo disto vira achado


# ---------------------------------------------------------------- caso 1
def perguntas_do_texto() -> dict:
    """Quatro julgamentos independentes sobre a MESMA linha.

    Um Noul por defeito, porque mais de um pode valer na mesma frase — é o
    que o SKILL recomenda quando os rótulos não são exclusivos. Todos vão
    juntos num request só: são independentes e não precisam se ver.
    """
    return {
        "natural": Noul(
            instructions=(
                "A linha em `linha` foi gerada por template e vai aparecer no feed de um "
                "jogo de gestão de torcida organizada de futebol brasileiro. Ela soa como "
                "português brasileiro escrito por uma pessoa?"
            ),
            criteria={
                "true": (
                    "Lê como frase natural. Gíria de arquibancada, tom seco e registro "
                    "informal são esperados e contam como natural."
                ),
                "false": (
                    "Soa como texto montado por máquina: encaixe truncado, palavra "
                    "sobrando ou faltando, ordem estranha."
                ),
            },
        ),
        "concordancia": Noul(
            instructions=(
                "Em `linha`, a concordância de gênero e número e as contrações de "
                "preposição com artigo (do/da, no/na, pro/pra, ao/à) estão todas corretas?"
            ),
            criteria={
                "true": "Toda concordância e contração está correta.",
                "false": (
                    "Há erro de gênero, número ou contração. Exemplos de erro: "
                    "'do Copa do Brasil' (Copa é feminino), 'na Oitavas' (Oitavas é "
                    "plural), 'o bar da eles'."
                ),
            },
        ),
        "encaixe": Noul(
            instructions=(
                "Os nomes próprios encaixados em `linha` — torcida, clube, competição, "
                "fase, cidade, bairro — entraram na frase de forma gramatical e "
                "completa?"
            ),
            criteria={
                "true": "Todo nome encaixado cai bem na frase.",
                "false": (
                    "Algum encaixe falhou: pronome no lugar do nome, identificador cru "
                    "em vez do nome próprio, artigo errado antes do nome, nome cortado, "
                    "ou um rótulo interno vazando ('ampliar:bar', 'sao-paulo')."
                ),
            },
        ),
        "repete": Noul(
            instructions=(
                "A linha em `linha` diz a mesma coisa duas vezes, repetindo a mesma "
                "informação com outras palavras dentro da própria frase?"
            ),
            criteria={
                "true": "Sim, há repetição redundante dentro da linha.",
                "false": "Não há repetição: cada parte acrescenta informação.",
            },
        ),
    }


def achados_do_texto(nome: str, item: dict, r) -> list[str]:
    n = r.nouls
    fora = []
    if n["natural"].noul < CORTE_OK:
        fora.append(f"não soa natural ({n['natural'].noul:.2f})")
    if n["concordancia"].noul < CORTE_OK:
        fora.append(f"concordância/contração ({n['concordancia'].noul:.2f})")
    if n["encaixe"].noul < CORTE_OK:
        fora.append(f"encaixe de nome ({n['encaixe'].noul:.2f})")
    if n["repete"].noul > CORTE_DEFEITO:
        fora.append(f"repete a informação ({n['repete'].noul:.2f})")
    return fora


# ---------------------------------------------------------------- caso 2
def perguntas_do_par() -> dict:
    """A promessa, o que foi escrito depois, e o que de fato aconteceu.

    `medido` é a verdade — veio do harness, medindo indicador antes e depois
    do clique. As duas Nouls conferem a dica e a consequência contra ela; a
    Choice só serve pra classificar a divergência e sai com confiança, pra
    separar o que é erro de número do que é erro de redação.
    """
    return {
        "dica_bate": Noul(
            instructions=(
                "Em `caso`, o campo `dica` é o que o botão PROMETE antes do clique e "
                "`medido` é o efeito real medido depois do clique. A dica descreve "
                "fielmente o que `medido` entregou?"
            ),
            criteria={
                "true": (
                    "Cada efeito prometido aparece em `medido` com o mesmo sinal e o "
                    "mesmo valor. 'sem efeito' com tudo zerado também é fiel. Efeito "
                    "medido igual a zero num campo que a dica não menciona não é "
                    "problema."
                ),
                "false": (
                    "A dica promete um número que não bate, troca o sinal, promete um "
                    "efeito que não veio, ou omite um efeito que veio."
                ),
            },
        ),
        "conseq_bate": Noul(
            instructions=(
                "Em `caso`, `consequencia` é a frase que o jogo escreve DEPOIS do "
                "clique. Ela descreve fielmente o efeito real em `medido`?"
            ),
            criteria={
                "true": (
                    "A frase bate com `medido`. Ela pode resumir ou omitir um efeito "
                    "pequeno sem mentir."
                ),
                "false": (
                    "A frase afirma número ou sinal que `medido` não mostra, ou conta "
                    "um efeito que não aconteceu."
                ),
            },
        ),
        "divergencia": Choice(
            instructions=(
                "Comparando `dica`, `consequencia` e `medido` em `caso`, qual é a "
                "natureza do problema?"
            ),
            criteria={
                "nenhuma": "Os três contam a mesma história.",
                "valor": (
                    "O sentido está certo mas o número não: a dica ou a consequência "
                    "diz um valor diferente do medido, inclusive por arredondamento."
                ),
                "sinal": "Algo prometido como ganho veio como perda, ou o contrário.",
                "faltando": "Um efeito que aconteceu não é mencionado em lugar nenhum.",
                "inventado": "Um efeito anunciado simplesmente não aconteceu.",
                "redacao": (
                    "Os números batem, mas a frase está escrita de um jeito que induz "
                    "a erro."
                ),
            },
        ),
    }


def achados_do_par(caso: dict, r) -> list[str]:
    fora = []
    if r.nouls["dica_bate"].noul < CORTE_OK:
        fora.append(f"dica não bate com o medido ({r.nouls['dica_bate'].noul:.2f})")
    if r.nouls["conseq_bate"].noul < CORTE_OK:
        fora.append(f"consequência não bate ({r.nouls['conseq_bate'].noul:.2f})")
    d = r.choices["divergencia"]
    if d.choice != "nenhuma":
        fora.append(f"divergência: {d.choice} (confiança {d.confidence:.2f})")
    return fora


# ---------------------------------------------------------------- execução
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--amostra", default=str(AMOSTRA))
    ap.add_argument("--limite", type=int, default=0, help="0 = tudo")
    ap.add_argument("--so", choices=["texto", "pares"], help="roda só um dos dois")
    args = ap.parse_args()

    if not os.environ.get("TYPESAFE_API_KEY"):
        return erro("falta TYPESAFE_API_KEY no ambiente.")

    dados = json.loads(pathlib.Path(args.amostra).read_text(encoding="utf-8"))
    textos = dados.get("textos", [])
    pares = dados.get("pares", [])
    if args.limite:
        textos, pares = textos[: args.limite], pares[: args.limite]

    achados = 0
    with TypeSafeClient() as cli:
        if args.so != "pares":
            print(f"== TEXTO GERADO ({len(textos)} linhas) ==")
            for t in textos:
                try:
                    r = cli.system_one(
                        state={"linha": t["texto"], "onde": t.get("kind", ""),
                               "papel_da_linha": t.get("tipo", "")},
                        questions=perguntas_do_texto(),
                    )
                except TypeSafeError as e:
                    return erro(f"chamada falhou: {e}")
                fora = achados_do_texto(t.get("kind", ""), t, r)
                if fora:
                    achados += 1
                    print(f"  [{t.get('kind','?')}/{t.get('tipo','?')}] {t['texto']}")
                    for f in fora:
                        print(f"      ! {f}")

        if args.so != "texto":
            print(f"\n== DICA × CONSEQUÊNCIA ({len(pares)} pares) ==")
            for p in pares:
                caso = {
                    "pergunta": p.get("pergunta", ""),
                    "rotulo_do_botao": p.get("rotulo_botao", ""),
                    "dica": p.get("dica", ""),
                    "consequencia": p.get("consequencia", ""),
                    "medido": p.get("medido", {}),
                    "legenda_do_medido": (
                        "Variação do indicador entre antes e depois do clique, na "
                        "mesma escala que a tela mostra. null = não se aplica."
                    ),
                }
                try:
                    r = cli.system_one(state={"caso": caso}, questions=perguntas_do_par())
                except TypeSafeError as e:
                    return erro(f"chamada falhou: {e}")
                fora = achados_do_par(caso, r)
                if fora:
                    achados += 1
                    print(f"  [{p.get('fonte','?')}] {p.get('rotulo_botao','')}")
                    print(f"      dica   : {p.get('dica','')}")
                    print(f"      conseq : {p.get('consequencia','')}")
                    print(f"      medido : {json.dumps(p.get('medido', {}), ensure_ascii=False)}")
                    for f in fora:
                        print(f"      ! {f}")

    print(f"\n{achados} achado(s).")
    return 1 if achados else 0


def erro(msg: str) -> int:
    print(f"erro: {msg}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
