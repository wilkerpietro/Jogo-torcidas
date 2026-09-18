# Os escudos

Aqui entram os PNG dos escudos. Quem os usa hoje é a **cena 3D do
estádio** (`estadio3d.html`), que os põe nas paredes da sede.

## Onde vai cada arquivo

| o quê | caminho | exemplo |
|---|---|---|
| escudo da torcida | `img/escudos/torcida/<id>.png` | `img/escudos/torcida/jovem_fla.png` |
| escudo do clube | `img/escudos/clube/<id>.png` | `img/escudos/clube/flamengo.png` |

O `<id>` é o mesmo do banco de dados, sem inventar nada:

- o da torcida é o campo `id` de `dados/torcidas.js` (`jovem_fla`,
  `gavioes`, `mancha_verde`, …);
- o do clube é o campo `clubeId` da torcida, que é o `id` de
  `dados/times.js` (`flamengo`, `corinthians`, `gremio`, …).

## Como o arquivo aparece na cena

A cena monta primeiro o escudo **gerado** — as mesmas regras que o jogo
já usa em `index.html`: o do clube é a divisão em 135° das duas cores
dele com a sigla por cima (`escudo()` em `js/main.js`), e o da torcida é
a bola na cor principal com a `siglaTorcida` no meio, na cor que lê
sobre aquele fundo (`corQueLeSobre` em `js/mundo/mapa.js`).

Depois disso ela tenta carregar o PNG. Se o arquivo existir, ele é
pintado por cima da célula do atlas e aparece sozinho, sem recarregar
nada; se não existir, o `onerror` não faz nada e continua valendo o
gerado. **Não há escudo inventado em lugar nenhum**: ou é o PNG de
verdade, ou é a regra que o próprio jogo já usava.

## O que o PNG precisa ter

- fundo **transparente** (o escudo entra em cima de uma parede pintada);
- proporção livre — a cena encaixa mantendo a proporção, centrado, num
  quadrado;
- 128 × 128 basta: na cena ele tem uns 36 unidades (1,6 m) de lado, e o
  atlas o reduz pra 64 × 64.
