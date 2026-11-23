# As peças da festa de aniversário

A arena da festa (`js/festa3d.js`) monta cada peça com o kit do mapa 3D. Uma peça feita no Blender entra no lugar dela quando o arquivo está nesta pasta **e** o nome dele está em `pecas.json`.

## O padrão

- Arquivo `.glb`, uma peça por arquivo, com o nome da tabela abaixo.
- Medidas em metros, tamanho real. Eixo Y pra cima. A origem fica no chão, no centro da peça, e a frente olha pra +Z.
- Até uns 3 mil triângulos por peça (o palco pode ir a 10 mil). Uma textura de até 1024 px, ou só cores chapadas.
- As partes na cor da torcida usam os materiais `cor1`, `cor2` e `cor3`. O jogo pinta na hora.

## Os arquivos

| Arquivo | Peça | Tamanho no jogo (largura × profundidade) |
|---|---|---|
| `palco.glb` | palco com grid de treliça, painel de LED, caixas | 23,3 × 8,75 m (praticável de 1,8 m) |
| `telao.glb` | telão lateral numa torre de treliça | 5 × 4,2 m |
| `torre_som.glb` | torre de som (house mix) | 2,9 × 2,9 m |
| `tenda_bar.glb` | tenda de bar com balcão, freezer, geladeira | 5 × 6,25 m |
| `camarote.glb` | camarote elevado (deque a 3 m, guarda-corpo) | 21,7 × 12,1 m |
| `escada_camarote.glb` | escada do camarote (sobe 3 m) | 2,1 × 2,5 m |
| `mesa_alta.glb` | mesa alta com balde de gelo | 1,1 × 1,1 m |
| `mesa_plastico.glb` | mesa de plástico com 4 cadeiras | 1,25 × 1,25 m |
| `catraca.glb` | catraca da portaria | 1,2 × 1,5 m |
| `gradil.glb` | um módulo de gradil (repete no comprimento) | módulo de ~2 m |
| `portico.glb` | pórtico da entrada | 6,5 m de vão |
| `espetinho.glb` | carrinho de espetinho | 4 × 1,8 m |
| `banheiro_quimico.glb` | fila de banheiros químicos | 10,9 × 2,1 m |

O camarote é onde as aliadas ficam, e o boneco anda em cima do deque a 3 m. Se a peça do Blender mudar essa altura, a planta da cena (`alturas` na cena `festa`, jogo.js) muda junto.
