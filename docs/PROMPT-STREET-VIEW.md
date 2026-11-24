# Prompt para a sessão com Google Maps / Street View

Copie tudo abaixo da linha e cole na outra sessão (a que abre o Google Maps e o Street View no navegador).

---

Você vai me ajudar a levantar, pelo Google Maps e pelo Street View, como são de verdade as ruas em volta de um estádio de futebol. O levantamento vai virar o cenário de um jogo (uma cena vista de cima, em low-poly, onde torcidas organizadas chegam ao estádio). Outra sessão do Claude, que monta o cenário, vai ler o seu relatório. Ela não tem acesso ao Street View: tudo o que ela souber da rua vem de você.

## Regras

- **Descreva só o que você vê.** Quando não der para ver (a câmera não passa, a imagem está borrada, a árvore tapa), escreva "não visto". Não complete com o que é comum em estádios brasileiros.
- **Diga a data da imagem** do Street View em cada ponto (aparece no canto da tela). Se houver imagens de datas diferentes, use a mais recente e avise se algo mudou muito.
- **Meça o que der com a régua do Google Maps** (clique direito → "Medir distância"): larguras de rua e de calçada, comprimento de muro, distância entre árvores.
- **Tire prints de cada ponto e junte tudo num arquivo .zip** (veja "Os prints" abaixo). Os prints são a referência principal de quem monta o cenário: na dúvida, tire mais um. O dono do jogo vai me mandar o .zip junto com o seu relatório. Não publique os prints em lugar nenhum.
- **Use as coordenadas abaixo para ir a cada ponto.** Em cada um, gire a câmera 360° e descreva os quatro lados: norte, leste, sul e oeste, ou "para o estádio" e "de costas para o estádio".

## O estádio: Couto Pereira (Coritiba, Curitiba)

- Meio do campo: -25.421098, -49.259550
- A cena vai de -25.424170, -49.259530 a -25.419004, -49.260163 (os dois cantos opostos). As ruas principais são a Amâncio Moro, a Mauá, a Ubaldino do Amaral, a Agostinho Leão Júnior, a Floriano Essenfelder e a Barão de Guaraúna.

### Os pontos

| Ponto | O que é | Coordenadas |
|---|---|---|
| P01 | Portão do 1º escalão da casa (Rua Amâncio Moro) | -25.420487, -49.260515 |
| P02 | Portão do 2º e 3º escalões da casa (Rua Mauá, na ponta da curva) | -25.420901, -49.258599 |
| P03 | Portão da visitante (alto da curva, pela rua de serviço do clube) | -25.422023, -49.259398 |
| P04 | Chegada do 1º escalão da casa (Av. Agostinho Leão Júnior) | -25.421603, -49.262004 |
| P05 | Chegada do 2º e 3º escalões da casa (Rua Barão de Guaraúna) | -25.419454, -49.259792 |
| P06 | Chegada da visitante (Rua Ubaldino do Amaral / Floriano Essenfelder) | -25.423378, -49.260362 |
| P07 | O caminho da visitante: da chegada (P06) até o portão dela (P03), seguindo a rua | — |
| P08 | A volta inteira do estádio pela calçada: o muro, as grades e os portões, um a um | — |

### O que descrever em cada ponto

1. **A rua**: quantas faixas e em que mão; se tem canteiro central (e o que tem nele); a largura do leito e de cada calçada; o piso (asfalto, paralelepípedo, petit-pavé, concreto); se tem faixa de pedestre, lombada, semáforo, ponto de ônibus, ciclovia, carros estacionados de um lado ou dos dois, e se a rua é plana ou em ladeira (para que lado sobe).
2. **As calçadas**: árvores (quantas, de que porte, a que distância uma da outra, se fazem sombra na rua); postes e de que tipo; lixeiras, bancos, bancas de jornal, orelhões, hidrantes.
3. **O que está de frente para a rua, de cada lado**: casa térrea, sobrado, prédio (quantos andares), comércio (bar, lanchonete, farmácia, posto, loja — com o nome, se der para ler), muro de terreno, terreno vazio, praça, igreja, escola, hospital. Diga a cor da fachada e do telhado quando der para ver, se tem grade ou muro na frente e a altura do muro.
4. **O estádio visto da rua**: o muro ou a fachada (material, cor, altura); as grades; os portões (quantos, numerados ou com nome, cor, se têm catraca e cobertura); as bilheterias; escudos, letreiros e pinturas; por onde a torcida entraria.
5. **O dia de jogo, se alguma imagem for de dia de jogo**: ambulantes, barracas de churrasquinho, gradis de polícia, cordão de isolamento, viaturas, onde a torcida se junta.
6. **Pichações e murais** de torcida organizada: onde estão e o que dizem.

### Os prints

Em cada ponto da tabela:

- **Os quatro lados**: um print para cada lado, com a câmera na altura normal do Street View e o horizonte no meio da tela (`P01-norte.png`, `P01-leste.png`, `P01-sul.png`, `P01-oeste.png`). Se o ponto fica de frente para o estádio, troque por `P01-estadio.png` e `P01-costas.png`, mais os dois lados da rua (`P01-esquerda.png` e `P01-direita.png`).
- **De perto**: o portão, a bilheteria, o muro, um mural, a fachada de um bar, o que chamar a atenção (`P01-perto-portao.png`, `P01-perto-mural.png` e assim por diante).
- **No P07 e no P08**, que são caminhos: um print a cada 30 m mais ou menos, na ordem do caminho (`P07-01.png`, `P07-02.png`…), sempre olhando pra frente. Quando passar por um portão do estádio, tire também um print virado para ele.
- **Por cima**: dois prints do Google Maps em modo satélite com o 3D ligado, do estádio inteiro com as ruas em volta, um olhando do norte e um do sul (`VISTA-3D-norte.png`, `VISTA-3D-sul.png`), e um print do mapa comum, sem satélite, mostrando os nomes das ruas (`VISTA-mapa.png`).

Junte todos num arquivo só, `couto-pereira-street-view.zip`, com um índice dentro (`indice.md`): uma linha por print, com o nome do arquivo, o ponto, para onde a câmera olha, as coordenadas de onde a câmera estava e a data da imagem.

### Como entregar

Duas coisas: o arquivo `couto-pereira-street-view.zip` com os prints e o índice, e um relatório em Markdown, com uma seção por ponto (P01 a P08), na ordem da tabela. Em cada seção:

- **Data da imagem**: …
- **Prints**: os nomes dos arquivos dentro do .zip
- **Rua**: …
- **Calçadas**: …
- **Lado de cá / lado de lá** (ou norte, leste, sul e oeste): …
- **Estádio** (quando aparecer): …
- **Medidas**: cada uma com o que foi medido e quanto deu

No fim, uma lista curta do que mais chama a atenção nesse entorno, o que alguém que conhece o lugar reconheceria logo, e do que você não conseguiu ver.

Depois do Couto Pereira, se o dono pedir, faça o mesmo para os outros estádios: os pontos de cada um serão mandados do mesmo jeito, e cada estádio tem o seu .zip (`<nome-do-estadio>-street-view.zip`).
