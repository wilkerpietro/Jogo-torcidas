# Conferência de qualidade com o TypeSafe

Duas coisas que a gente vinha checando **no olho** a cada mudança, e que
passaram a ter ferramenta:

1. **Texto gerado.** O jogo monta centenas de frases por template, encaixando
   nome de torcida, de clube, de competição e de fase. Erro aqui não quebra
   nada — só sai escrito errado. Já passaram por aqui `o bar da eles`,
   `A Galoucura inaugurou a ampliação da loja` e `na Oitavas do Copa do Brasil`.
2. **Dica × consequência.** Todo botão promete um efeito antes do clique
   (`dica`) e escreve o que houve depois (`consequencia`). O `colher.js` mede o
   efeito **real**, clicando e comparando o indicador antes e depois. As três
   coisas têm de bater; quando não batem, o jogo mente pro jogador na hora em
   que ele decide.
3. **Gênero de nome próprio.** `dados/genero.js` é a tabela que decide entre
   "do Mineiro" e "da Copa do Nordeste". Ela é fechada, então o jogo faz
   consulta exata e nunca adivinha — mas quando alguém acrescenta um estádio
   ou uma divisão, o nome entra sem gênero. O `genero.py` varre os dados, vê
   quem ficou de fora e propõe a linha.

## Isto não entra no jogo

O `torcida-organizada.html` continua sendo um arquivo só, sem rede e sem
segredo. Esta pasta roda **fora** do bundle, aqui na máquina, com a chave no
ambiente. Nada daqui é empacotado.

Motivo de não dar pra usar em runtime, pra não se perder: o jogo não tem
servidor onde guardar credencial, roda offline, e o feed depende de
determinismo (a entrevista sorteia igual no mesmo mês pra repintar não trocar
a pergunta no meio do clique). Julgamento probabilístico em runtime derruba
as três coisas.

## O que é preciso ter

1. **O SDK.** `pip install typesafe-sdk` — é `typesafe-sdk` mesmo; o pacote
   `typesafe-ai` no PyPI é só um atalho que aponta pra ele.
2. **Uma chave**, em `TYPESAFE_API_KEY`. Sai da conta em typesafe.ai.
3. **Rede até `api.typesafe.ai`.** É aqui que trava no ambiente do agente: o
   proxy de saída recusa o CONNECT (`connect_rejected`, política da
   organização) e a chamada morre com `TypeSafeAPIConnectionError: 403
   Forbidden`. Numa máquina com saída normal não tem esse problema. **Não
   contornar desligando verificação de TLS nem tirando o `HTTPS_PROXY`** — o
   que se ganha não vale o que se abre.

Pra conferir que está de pé antes de gastar chamada:

```sh
python3 -c "
from typesafe_sdk import TypeSafeClient, Noul
with TypeSafeClient() as c:
    r = c.system_one(state={'nome':'Joia da Princesa'},
                     questions={'fem': Noul(
                        instructions='O nome em \`nome\` é feminino em português?',
                        criteria={'true':'É feminino.','false':'É masculino.'})})
    print(r.nouls['fem'].noul)
"
```

Perto de 1 e sem exceção: está funcionando.

## Como rodar

```sh
pip install typesafe-sdk
export TYPESAFE_API_KEY=...

# A. gênero de nome novo — a varredura roda SEM rede e sem chave:
#    ela sozinha já diz se falta alguma coisa.
python3 ferramentas/qualidade/genero.py            # só o que falta
python3 ferramentas/qualidade/genero.py --tudo     # confere a tabela toda
python3 ferramentas/qualidade/genero.py --tipo estadio

# B. texto gerado e dica × consequência
#    1. colhe do jogo rodando (precisa do servidor local na 8765)
python3 -m http.server 8765 &
node ferramentas/qualidade/colher.js "Mancha Verde"
#    2. julga a colheita
python3 ferramentas/qualidade/conferir.py
python3 ferramentas/qualidade/conferir.py --so pares --limite 20
```

Sai 1 quando acha alguma coisa, 0 quando não acha — dá pra pendurar em CI.

O que o `genero.py` imprime é **proposta**: revisar e colar em
`dados/genero.js` à mão. O que entra no bundle é sempre o arquivo revisado,
nunca uma chamada em tempo de jogo. Ele marca sozinho as linhas que merecem
olho — confiança baixa, ou nome cujo artigo só se resolve sabendo o que a
palavra quer dizer ("Joia da Princesa" é feminino pela joia, não pela forma).

## Os cortes são chute inicial

`CORTE_DEFEITO = 0.60` e `CORTE_OK = 0.40` não vieram de cookbook: o próprio
SKILL manda avaliar limiar nos dados do projeto. Começam frouxos de propósito
— é mais barato olhar um texto bom do que deixar passar um ruim. Depois de uma
rodada com olho humano em cima, apertar.
