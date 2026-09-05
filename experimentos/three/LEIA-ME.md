# experimentos/three

Testes de three.js fora do jogo. Nada aqui é importado por `index.html`:
é bancada, na mesma ideia das provas em `ferramentas/prova_*.py`.

## prova_multidao.html

Responde a uma pergunta só: **quantos discos a GPU aguenta** com a rua do
jogo em volta. A multidão inteira sai numa chamada de desenho — corpo e
cabeça costurados numa geometria e repetidos por `InstancedMesh`. O
cenário usa as cores que já estão em `js/diajogo/cenario.js`.

Pra abrir:

```
python3 -m http.server 8000
# http://localhost:8000/experimentos/three/prova_multidao.html
```

## Onde isso encostaria no jogo

`js/diajogo/combate.js` já separa `passo` (simulação) de `desenhar`
(pintura). A simulação trabalha em coordenadas de mundo e não sabe o que
é canvas. Trocar o renderizador da cena de dia de jogo é, no papel,
escrever um `desenhar` novo que come o mesmo estado `J` — sem tocar em
`passo`, na malha de caminhabilidade nem na IA.

O que **não** encosta: todos os painéis de gestão (feed, financeiro,
diplomacia, calendário) são HTML e CSS e continuariam iguais. three.js
não muda uma linha deles.

## Custo real, sem enfeite

- A cena dos arredores é **foto com máscara** (`dados/cenas_foto.js`).
  Isso não migra: ou a rua vira geometria de verdade, ou o 3D não serve
  pra nada ali.
- `cenario.js` + o `desenhar` do combate são ~2.000 linhas de pintura 2D
  que hoje funcionam.
- Sombra em multidão grande é o primeiro gargalo em celular. Na prova,
  sombra da multidão desliga acima de 2.400 discos de propósito.
