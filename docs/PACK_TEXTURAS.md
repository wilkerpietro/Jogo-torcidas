# Pack de 40 texturas — o que pedir e por quê

Este arquivo é o pedido, não o resultado. Ele existe pra que o pack que
vier de fora entre no jogo sem retrabalho: o formato, a vista, a luz e o
tamanho real de cada peça estão fixados aqui porque cada um deles já
quebrou alguma coisa antes.

## As três regras que não são gosto, são engenharia

**1. Luz assada briga com a luz do jogo.** A cena tem sol, sombra
projetada e `MeshLambertMaterial`. Se a imagem já vier com sombra e
volume pintados, a peça ganha duas luzes vindas de direções diferentes e
lê como adesivo. Por isso: luz difusa, chapada, sem sombra projetada,
sem brilho especular, sem profundidade de campo.

**2. A cor vem do vértice, não da textura.** As texturas ladrilháveis
entram com `map` **e** `vertexColors` ao mesmo tempo — o Lambert
multiplica os dois. A cor de cada casa está no vértice; a textura só dá
o GRÃO. Se a textura vier saturada, ela tinge tudo e as 23 cores de
parede da favela viram uma cor só. Por isso o ladrilho tem de ser quase
dessaturado e de luminância média (nem preto, nem branco estourado).

**3. Resolução é onde a peça aparece, não onde ela é gerada.** O chão do
mapa é um canvas de 4096 px cobrindo 8748 unidades de mundo: 0,47 px por
unidade. Um buraco de asfalto de 1,5 m pintado ali teria 15 px — não
adianta gerar 2K. Por isso o decalque de chão NÃO vai no canvas do chão:
vai como placa própria no 3D, a mesma máquina do decalque de parede que
já roda (`placa()` + `alphaTest`), e aí os 256 px valem.

## Formato

| | decalque (chão e parede) | ladrilho |
|---|---|---|
| tamanho | 256 × 256 | 512 × 512 |
| fundo | **transparente (PNG-32)**; se a ferramenta não fizer alfa, **magenta puro `#FF00FF`** | opaco, preenche tudo |
| borda | a arte NÃO encosta na borda: 8 px de folga em volta | a arte ATRAVESSA a borda (é o que ladrilha) |
| ladrilha? | não | sim, sem costura nos quatro lados |

Magenta como fundo, e não preto, porque metade destes decalques é
ESCURA — mancha de óleo, poça, remendo de asfalto. Recortar preto come a
arte escura junto; magenta não existe em nenhuma delas.

## O prompt-mestre

> Textura para jogo 3D, vista **ortogonal de cima (90°, zenital)**, sem
> perspectiva e sem inclinação. Iluminação **difusa e uniforme, sem
> sombra projetada, sem brilho especular, sem reflexo**. Paleta
> **dessaturada e de contraste baixo**, luminância média, aspecto de
> material real porém simples — nada de foto HDR, nada de cartoon, nada
> de contorno preto, nada de estilo pintura digital. Sem texto, sem
> números, sem logotipo, sem marca d'água, sem moldura, sem borda, sem
> assinatura. Um único assunto isolado, sem cenário em volta, sem chão
> visível atrás, sem objeto de escala (nada de pessoa, carro, moeda ou
> régua). Referência geral: periferia brasileira, material gasto,
> envelhecido pelo sol e pela chuva.
>
> **Se for DECALQUE:** 256 × 256, assunto isolado no centro com folga de
> 8 px até a borda, fundo **transparente**; se a ferramenta não gerar
> transparência, fundo **magenta puro #FF00FF chapado**, sem gradiente e
> sem sombra caindo sobre ele.
>
> **Se for LADRILHO:** 512 × 512, **sem costura (seamless/tileable)**
> nos quatro lados, padrão uniforme sem um elemento grande e único que
> denuncie a repetição, sem vinheta e sem escurecimento nas bordas.

Cola o prompt-mestre, depois uma linha da lista abaixo. Uma imagem por
linha — contact sheet não serve: a grade que o gerador entrega nunca
cai exatamente nos 256, e recortar no olho desalinha os 40.

## Os 40

### Decalque de chão — 18 (256 × 256, alfa)

O "tamanho real" é quanto a peça mede no mundo; é ele que vira o tamanho
da placa no 3D. A unidade do jogo é 4,5 cm.

| arquivo | o que pedir | tamanho real |
|---|---|---|
| `chao_buraco_fundo.png` | buraco fundo no asfalto, base de brita exposta, borda esfarelada | 1,4 m |
| `chao_buraco_raso.png` | panela rasa no asfalto, fundo liso, borda lascada | 0,9 m |
| `chao_remendo_retangular.png` | remendo retangular de asfalto novo sobre asfalto velho, junta de piche em volta | 2,2 m |
| `chao_remendo_irregular.png` | remendo de asfalto de contorno irregular, tom diferente do entorno | 1,8 m |
| `chao_trinca_teia.png` | trinca em teia (couro de jacaré) no asfalto | 2,0 m |
| `chao_trinca_linha.png` | trinca longitudinal única, comprida e fina, com ramificações curtas | 3,0 m |
| `chao_mancha_oleo.png` | mancha de óleo escura no asfalto, contorno difuso | 1,0 m |
| `chao_poca.png` | poça de água parada no asfalto, borda molhada mais escura | 1,6 m |
| `chao_poca_lama.png` | poça de lama em chão de terra, barro remexido na borda | 1,8 m |
| `chao_bueiro_grelha.png` | grelha de boca de lobo em ferro, suja, vista de cima | 0,8 m |
| `chao_tampa_bueiro.png` | tampa de bueiro redonda de ferro, gasta, sem texto | 0,7 m |
| `chao_folhas_arvore.png` | tapete circular de folhas secas caídas sob uma árvore, mais denso no centro | 2,6 m |
| `chao_folhas_espalhadas.png` | folhas secas soltas e espalhadas, poucas | 1,6 m |
| `chao_terra_pelada.png` | mancha de terra pelada aberta no meio do capim | 2,4 m |
| `chao_entulho.png` | monte baixo de entulho e caliça, restos de argamassa | 1,5 m |
| `chao_tijolo_quebrado.png` | pilha baixa de tijolo quebrado | 1,2 m |
| `chao_lixo.png` | lixo espalhado: saco plástico rasgado, papelão, garrafa | 1,4 m |
| `chao_capim_tufo.png` | tufo de capim alto nascendo, visto de cima | 0,8 m |

### Decalque de parede — 12 (256 × 256, alfa)

| arquivo | o que pedir | tamanho real |
|---|---|---|
| `parede_mofo_rodape.png` | mofo e umidade subindo do rodapé, verde-escuro acinzentado, mais forte embaixo | 1,2 m |
| `parede_chuva_beiral.png` | rastro vertical de chuva escorrendo do beiral, sujeira arrastada | 1,4 m |
| `parede_barro_rodape.png` | respingo de barro seco no rodapé da parede | 1,0 m |
| `parede_reboco_caido_a.png` | reboco descascado mostrando o tijolo por baixo, lábio de reboco na borda | 1,0 m |
| `parede_reboco_caido_b.png` | outra falha de reboco, formato diferente da anterior | 1,3 m |
| `parede_fuligem.png` | mancha de fuligem escura subindo na parede | 0,9 m |
| `parede_pichacao.png` | pichação a spray preto, traço reto e anguloso, **letras ilegíveis / rabisco abstrato** | 1,8 m |
| `parede_grafite_colorido.png` | grafite colorido, formas arredondadas, **sem palavra legível** | 2,2 m |
| `parede_cartaz_rasgado.png` | restos de cartaz colado e rasgado, papel descascando, **sem texto legível** | 0,7 m |
| `parede_quadro_luz.png` | caixa de medidor de luz com eletroduto aparente, na parede | 0,5 m |
| `parede_mancha_agua.png` | mancha de infiltração de água, halo mais escuro na borda | 1,1 m |
| `parede_maresia.png` | parede comida de maresia, tinta esfarelando, salitre esbranquiçado | 1,2 m |

### Ladrilho — 10 (512 × 512, sem costura, sem alfa)

| arquivo | o que pedir | um ladrilho cobre |
|---|---|---|
| `lad_asfalto.png` | asfalto liso e gasto, granulado fino | 4 m |
| `lad_asfalto_remendado.png` | asfalto velho costurado de remendos e juntas de piche | 6 m |
| `lad_calcada_concreto.png` | calçada de concreto com juntas de dilatação e manchas | 4 m |
| `lad_terra_batida.png` | terra batida, pisada, com pedrisco | 3 m |
| `lad_areia.png` | areia de praia seca, ondulação rasa | 3 m |
| `lad_grama_rasteira.png` | grama rasteira ralinha, tom seco, vista de cima | 2 m |
| `lad_telha_ceramica.png` | telha colonial vista de cima, **8 canaletas na largura do ladrilho** | 1,5 m |
| `lad_reboco.png` | reboco chapiscado fino de parede | 2 m |
| `lad_tijolo_baiano.png` | tijolo cerâmico de oito furos aparente, amarração corrida, argamassa | 2 m |
| `lad_cimento_queimado.png` | laje de cimento queimado, manchada | 3 m |

O `lad_telha_ceramica` pede **8 canaletas por ladrilho** porque a escala
da telha no jogo é medida em ladrilhos: com 8 canaletas o telhado da
favela sai com canaleta de 19 cm, que é a medida real. Outro número de
canaletas desregula essa conta.

## O que eu faço quando elas chegarem

1. `ferramentas/importar_texturas.py`: recorta o magenta (ou aproveita o
   alfa), tira a franja colorida da borda, normaliza tamanho, e nos
   ladrilhos testa a costura (desloca meio ladrilho e mede o degrau na
   emenda) — o que não fechar volta pra lista, porque gerador de imagem
   é ruim de seamless e não adianta fingir que fechou.
2. Decalque de chão: placa no 3D com `alphaTest`, espalhada com a mesma
   semente da planta (buraco e remendo só no asfalto; folha só sob
   árvore; poça na parte baixa). **Nenhum deles bloqueia** — são chão.
3. Decalque de parede: entra no mecanismo que o `tijolo.png` já usa.
4. Ladrilho: substitui ou soma aos três procedurais de hoje.

## O aviso

O jogo é *flat-shaded*, caixa e Lambert. Textura fotorrealista de 2K ao
lado de uma casa que é um paralelepípedo de seis faces não deixa o jogo
mais real — deixa a casa mais falsa, porque o olho passa a comparar as
duas. Por isso o prompt-mestre insiste em contraste baixo e detalhe
médio. Se o pack vier fotográfico demais, o caminho é dessaturar e
borrar na importação, e é melhor já pedir assim.
