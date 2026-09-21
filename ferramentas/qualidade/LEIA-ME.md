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

## Isto não entra no jogo

O `torcida-organizada.html` continua sendo um arquivo só, sem rede e sem
segredo. Esta pasta roda **fora** do bundle, aqui na máquina, com a chave no
ambiente. Nada daqui é empacotado.

Motivo de não dar pra usar em runtime, pra não se perder: o jogo não tem
servidor onde guardar credencial, roda offline, e o feed depende de
determinismo (a entrevista sorteia igual no mesmo mês pra repintar não trocar
a pergunta no meio do clique). Julgamento probabilístico em runtime derruba
as três coisas.

## Como rodar

```sh
pip install typesafe-sdk
export TYPESAFE_API_KEY=...

# 1. colhe do jogo rodando (precisa do servidor local na 8765)
python3 -m http.server 8765 &
node ferramentas/qualidade/colher.js "Mancha Verde"

# 2. julga a colheita
python3 ferramentas/qualidade/conferir.py
python3 ferramentas/qualidade/conferir.py --so pares --limite 20
```

Sai 1 quando acha alguma coisa, 0 quando não acha — dá pra pendurar em CI.

## Os cortes são chute inicial

`CORTE_DEFEITO = 0.60` e `CORTE_OK = 0.40` não vieram de cookbook: o próprio
SKILL manda avaliar limiar nos dados do projeto. Começam frouxos de propósito
— é mais barato olhar um texto bom do que deixar passar um ruim. Depois de uma
rodada com olho humano em cima, apertar.
