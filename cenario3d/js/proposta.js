/* =========================================================
   A PROPOSTA DE EXPANSÃO (3ª versão)
   ---------------------------------------------------------
   A grade continua a da cidade: a mesma rua de 118,8 (6,1 m), a mesma
   quadra de 691 × 346 (35,6 × 17,8 m), as colunas de 810 em 810 e as
   linhas de 464,4 em 464,4 (a linha 2, a do estádio, é a alta: 960).

   A 2ª versão trouxe a borda em escada (12 quadras a oeste, 10 ao
   norte), o atacarejo na estrada norte, o Estádio Municipal a sudoeste,
   os três condomínios e as duas entradas com pórtico. A 3ª, com o que o
   dono circulou no mapa:
   - as duas favelas saem da cópia torta e nascem de novo nas manchas
     que ele desenhou (noroeste e sudoeste), com o mesmo jeito da favela
     do jogo (quadra miúda, casa encostada na casa, beco estreito), mas
     na grade da cidade: beco de norte a sul ou de leste a oeste. E
     encostam na cidade: a faixa de mato entre a mancha e a rua entra
     na favela, e a casa que bate na rua é aparada até a guia;
   - as duas avenidas transversais do oeste (a oeste e a noroeste2)
     saem: as quadras que elas cortavam voltam a ser quadra inteira, e a
     1,4 de hoje, que a avenida oeste rasgava, é refeita;
   - as quadras altas −3,2, −1,2 e 0,2 ganham uma rua no meio, de norte
     a sul (o quintal enorme some);
   - 0,7 e 1,7, −2,3 e −1,3, 0,−1 e 1,−1 viram uma quadra só cada par,
     por cima da rua que as separava.

   Depois disso a favela do sudoeste foi dividida em três: fica o pedaço
   colado no Estádio Municipal, e os outros dois vão pro sul da 2,10 (a
   Favela do Sul) e pro norte da 3,−2 (a Favela do Norte).

   E depois cada favela ficou com METADE DA ÁREA (o dono pediu, pra
   ganhar triângulo): fica a metade colada na cidade, e quando as duas
   metades encostam nela, a mais perto do estádio. O corte cai numa viela
   da grade quando a viela dá perto da metade (de 46 a 53% da área); se
   não, no ponto exato da metade, no meio do quarteirão — a `caixa` para
   a casa ali, e a viela e o beco só ficam onde tem casa do lado. `corte`
   guarda onde foi.

   E depois as AVENIDAS FICARAM RETAS (o dono pediu): saem as diagonais
   da cidade de hoje — a do sudoeste e a do noroeste, que eram as duas
   entradas, e as duas saídas pro oeste — e a estrada norte; fica só a da
   beira (a da praia ou da lagoa), que segue a costa. A ENTRADA da cidade
   passa a ser uma AVENIDA DUPLICADA, reta, de ponta a ponta do mapa, na
   rua entre a coluna 1 e a 2 de quadras: a pista do leste é a rua de
   hoje, e o canteiro e a pista do oeste saem da coluna 1, que estreita
   8,6 m. As quadras de hoje que as diagonais cortavam, e as da coluna 1,
   são refeitas inteiras (o prédio que tinha nelas fica, e a casa nova
   não pisa nele); o pórtico de BEM-VINDO fica nas duas pontas dela, na
   borda da cidade, e o Atacadex vai pra beira dela, ao norte.

   Os lotes saem com a mesma conta do `lotear()` da planta, só que com
   hash da posição no lugar do sorteio, e a favela com a mesma conta da
   favela da planta, com um sorteio próprio de semente fixa: a proposta
   é a mesma toda vez que a página abre.
   ========================================================= */
export const RUA = 118.8;
const PASSO_Y = 464.4;

const TIPOS = {
  casa:    { alt: [66, 80],   cor: ['#e8dcc0', '#d9c9a3', '#e2b9a6', '#cfd8c9', '#e6e2d6', '#d8c8b0', '#e9d3b3'] },
  sobrado: { alt: [112, 136], cor: ['#e3d3b2', '#c9b48a', '#d4a48f', '#b7c4c2', '#ded9cd'] },
  predio:  { alt: [160, 240], cor: ['#cfcac0', '#b9b4aa', '#d5d0c4', '#a9b0b6', '#e0dcd2'] },
  muro:    { alt: [38, 48],   cor: ['#b0a794', '#a59a86', '#bdb3a0', '#9d9585'] },
  galpao:  { alt: [96, 128],  cor: ['#9fa4a6', '#8f948f', '#a8a39a'] }
};
const COMERCIO = [
  'BAR DO ZÉ', 'BOTECO DA ESQUINA', 'BAR E MERCEARIA', 'PONTO DO CHOPE', 'BAR DO NEGUINHO', 'BOTEQUIM DA VILA',
  'LANCHONETE TRÊS IRMÃOS', 'MERCADINHO SÃO JOÃO', 'PADARIA PÃO QUENTE', 'AÇOUGUE BOI GORDO', 'SALÃO DA DONA MARIA',
  'BARBEARIA DO TIÃO', 'BORRACHARIA 24H', 'OFICINA DO GORDO', 'LOTÉRICA SORTE GRANDE', 'FARMÁCIA POPULAR',
  'MATERIAIS DE CONSTRUÇÃO', 'SORVETERIA GELADÃO', 'PASTEL DA FEIRA', 'LAN HOUSE CYBER', 'DEPÓSITO DE BEBIDAS',
  'CASA DE CARNES', 'ELETRÔNICA DO ZÉ', 'CHAVEIRO 24 HORAS', 'BAZAR PREÇO BOM', 'AUTO PEÇAS IRMÃOS',
  'MÓVEIS POPULARES', 'GÁS E ÁGUA', 'SALGADOS DA VÓ', 'ESPETINHO DO MINEIRO', 'MERCEARIA DOIS IRMÃOS',
  'COSTURA E CONSERTOS', 'VIDRAÇARIA CENTRAL', 'PEIXARIA MARÉ ALTA'
];
const RECADOS = [
  'VENDE-SE', 'ALUGA-SE', 'PINTA-SE CASAS', 'PRECISA-SE DE AJUDANTE', 'É PROIBIDO JOGAR LIXO', 'NÃO ESTACIONE',
  'ENTRADA DE VEÍCULOS', 'TE AMO MARIA', 'SAUDADES ETERNAS', 'DEUS É FIEL', 'PROIBIDO COLAR CARTAZ',
  'CUIDADO COM O CÃO', 'TEM ÁGUA', 'LAVA-SE ROUPA', 'CONSERTA-SE GELADEIRA'
];
/* a casa de muro precisa desse tanto de frente e de fundo (em metros) */
const MIN_MURO = { m1: [4.6, 4.6], m2: [4.8, 4.6], m3: [4.2, 4.3], m4: [3.6, 4.0] };

/* as quadras novas: coluna → [primeira linha, última linha] (dá mais de
   um intervalo por coluna). A coluna 1 nas linhas 1 a 3 é o lugar da
   favela de hoje. */
const GRADE_GRANDE = {
  '-5': [[6, 8]],
  '-4': [[2, 8]],
  '-3': [[1, 8]],
  '-2': [[-1, 10]],
  '-1': [[-2, 10]],
  '0':  [[-2, 10]],
  '1':  [[-3, 0], [1, 3]],
  '2':  [[-3, 0]],
  '3':  [[-2, 0]],
  '4':  [[-2, 0]],
  '5':  [[-2, 0]]
};
/* AS VAGAS DE ESTÁDIO: TODOS os estádios da praça — o principal (o do
   jogo de hoje, que era no meio da cidade antiga) é o primeiro — ficam nas
   pontas do mapa, no mato que estava vazio: colados na grade (a rua em
   volta do estádio emenda na da borda da cidade) e longe das duas
   entradas (o visitante que chega atravessa a cidade até o estádio dele).
   Cada vaga é o quarteirão do estádio de hoje (a cópia dele) no meio de
   seis células da grade (`i`, `j`: duas colunas, três linhas) ou de uma
   caixa (`area`), onde a grade não encaixa. O quarteirão do estádio de
   hoje vira quatro quadras de casa; a vaga que a praça não usa fica mato.
   Na ordem em que a praça as ocupa: primeiro as mais longe das entradas
   (a distância no comentário é a pela grade, do pórtico mais perto até a
   quadra do estádio). As dos cantos de cima ficam a pouco mais de 120 m
   da entrada norte: é o limite do mapa (o leste é a costa, e o oeste já
   tem as outras), então elas são as últimas a entrar. */
/* `fora`: pra que lado da cidade o estádio de verdade sai da vaga (o
   portão 1 fica de frente pro lado contrário, o da cidade) */
const ESTADIOS_GRANDE = [
  { i: [-6, -5], j: [3, 5],   nome: 'Estádio do Oeste', fora: 'o' },           // o principal: a ponta oeste (395 m da entrada sul)
  { i: [-6, -5], j: [9, 11],  nome: 'Estádio do Sudoeste', fora: 's' },        // no canto sudoeste (257 m)
  { i: [-3, -2], j: [-5, -3], nome: 'Estádio do Noroeste', fora: 'n' },        // acima do bairro do noroeste (132 m da norte)
  { area: { x0: 3300, x1: 4610, y0: -2576, y1: -1301 }, nome: 'Estádio do Nordeste', fora: 'n' }   // entre a favela do norte e a praia (129 m)
];
const ESTADIOS_MEDIO = [
  { i: [-4, -3], j: [3, 5],   nome: 'Estádio do Oeste', fora: 'o' },           // 312 m da entrada sul
  { area: { x0: 3300, x1: 4610, y0: -2111, y1: -837 }, nome: 'Estádio do Nordeste', fora: 'n' },   // 133 m da norte
  { i: [-3, -2], j: [-4, -2], nome: 'Estádio do Noroeste', fora: 'n' }         // acima da favela do noroeste (124 m da norte)
];
const ESTADIOS_PEQUENO = [
  { area: { x0: -1240, x1: 70, y0: 2439, y1: 3713 }, nome: 'Estádio do Oeste', fora: 'o' },     // entre as duas favelas do oeste (147 m da sul)
  { area: { x0: 2690, x1: 4000, y0: -1183, y1: 92 }, nome: 'Estádio do Nordeste', fora: 'n' }    // acima da cidade de hoje (101 m da norte)
];

/* o que vira equipamento, e não casa */
const EQUIP_GRANDE = {
  '1,1':  { tipo: 'praca',  nome: 'Praça da Vila', cor: '#5f9a4c',
            nota: 'No meio de onde era a favela: o bairro novo ganha a praça dele.' },
  '-2,4': { tipo: 'shopping', nome: 'Shopping Poente', cor: '#8fa3ad', frente: 's',
            nota: 'O segundo shopping da cidade, no lugar do campo de várzea: fachada de vidro, a ponta redonda e o totem, a duas quadras do metrô.' },
  '-1,6': { tipo: 'delegacia', nome: '2º Distrito Policial', cor: '#d8cfb6', frente: 'n',
            nota: 'A delegacia do oeste, no lugar do posto de saúde: de frente pra entrada do metrô Poente, do outro lado da rua.' },
  '2,-1': { tipo: 'igreja', nome: 'Paróquia São Judas Tadeu', cor: '#d8cfb8', frente: 'o',
            nota: 'A igreja do bairro novo do norte, de frente pra avenida de entrada: a nave amarela de telhado de telha, o frontão com a cruz, a torre sineira do lado e o adro de pedra portuguesa.' }
};
/* O METRÔ: a Linha 1, com duas estações subterrâneas. A entrada toma a
   ponta da quadra (o lote da ponta de cada fileira, de ponta a ponta do
   fundo); a estação fica embaixo da quadra, com o salão da plataforma
   ao longo dela, e o túnel liga a ponta de uma à ponta da outra.
   `entra`: de que rua o povo desce (a escada começa nesse lado). */
const METRO_GRANDE = {
  nome: 'Linha 1 – Azul', cor: '#1f5aa8',
  estacoes: [
    { id: '-2,6', nome: 'Poente', ponta: 'l', entra: 'n', onde: 'no oeste, entre o Shopping Poente e a delegacia' },
    { id: '3,-1', nome: 'Norte',  ponta: 'o', entra: 's', onde: 'no bairro novo do norte, do lado da igreja' }
  ],
  LARG_ENTRADA: 124,          // 6,4 m de frente pra rua do lado
  PROF_PLATAFORMA: 10.0,      // o piso da plataforma, em metros abaixo da rua
  PROF_MEZANINO: 5.2,         // o piso do mezanino (as catracas)
  LARG_SALAO: 11.0,           // o salão da plataforma, de parede a parede
  SOBRA_SALAO: 3.0            // quanto o salão passa da quadra, debaixo da rua do lado
};

/* os condomínios: a quadra alta (linha 2) e a folha de cor de cada um */
const CONDOMINIOS = [
  { id: '1,2',  folha: 'torres_v1', t1: 'Edifício Horizonte', t2: 'Residencial Porto Belo',
    cores: 'concreto areia, vidro verde e tijolo vinho' },
  { id: '-2,2', folha: 'torres_v2', t1: 'Edifício Atlântico', t2: 'Residencial Monte Verde',
    cores: 'concreto branco, vidro fumê e pastilha grafite' },
  { id: '-4,2', folha: 'torres_v3', t1: 'Edifício Solar', t2: 'Residencial Ipê Amarelo',
    cores: 'concreto terracota, vidro bronze e tijolo mostarda' }
];

/* OS TERRENOS PRA SEDE, espalhados pela cidade. Cada um é a fatia que a
   sede de nível 3 do jogo pede (a conta do `areaDaSede` da planta: 72% da
   frente da quadra, pelo menos 420, e o fundo inteiro), na ponta oeste da
   quadra; o resto da quadra continua casa. A sede de nível 1 usa só um
   canto dela. A lista é por ordem de preferência, com reserva: o terreno
   que cai a menos de LONGE_DO_ESTADIO de um estádio da praça não entra, e
   o mapa pega os primeiros que sobram até dar os `nEspacos` de sede dele
   (os terrenos e as sedes de hoje que ficam): a sede da torcida não fica
   colada em estádio */
const TERRENOS_GRANDE = [
  { id: '5,0',   frente: 'n', onde: 'no nordeste, em cima da cidade de hoje' },
  { id: '2,-3',  frente: 's', onde: 'no bairro novo do norte' },
  { id: '-1,-2', frente: 's', onde: 'no noroeste, perto da favela' },
  { id: '-4,4',  frente: 'n', onde: 'na ponta oeste' },
  { id: '0,4',   frente: 'n', onde: 'no meio do oeste' },
  { id: '-3,6',  frente: 's', onde: 'no oeste, perto da favela do sudoeste' },
  { id: '0,9',   frente: 's', onde: 'no sul, perto da entrada sul' },
  { id: '5,-2',  frente: 's', onde: 'no nordeste, na beira norte da cidade' },
  { id: '4,7',   frente: 'n', hoje: true, onde: 'no sudeste, na cidade de hoje' },
  { id: '2,7',   frente: 's', onde: 'no sul, entre a avenida e a cidade de hoje' },
  { id: '-2,5',  frente: 'n', onde: 'no oeste, entre o shopping e o metrô' },
  { id: '2,5',   frente: 'n', onde: 'no meio, perto da avenida de entrada' },
  { id: '2,0',   frente: 's', onde: 'no norte, de frente pra cidade de hoje' },
  { id: '-1,4',  frente: 'n', onde: 'no oeste' },
  { id: '3,-2',  frente: 's', onde: 'no norte' },
  { id: '1,3',   frente: 'n', onde: 'no meio da cidade nova' }
];
/* a sede não fica a menos disto de um estádio (da quadra dele); o bar da torcida também não */
export const LONGE_DO_ESTADIO_M = 50;
/* A RUA DE VERANEIO (m): os lotes do lado de cá (20 × 30, sete, a casa da
   festa no do meio), a rua de areia, os do outro lado (16 × 20) e a folga
   nas pontas — as mesmas medidas de js/diajogo/veraneio3d.js */
export const VERANEIO_M = { lote: 20, fundo: 30, loteSul: 16, fundoSul: 20, rua: 8, n: 7, margem: 4 };
/* O ENTORNO DO ESTÁDIO (o dono, 01/10/2026: "adicione casas, comércios
   (como espetinho, hamburgueria, pizzaria, barzinho, ambulantes na porta
   do estádio) e outras coisas que fazem sentido com o arredor dos
   estádios pra não ficar um visual tão vazio, e adicione pequenos
   terrenos de estacionamentos também, típicos de arredores de estádio").
   Do outro lado da rua que cerca o estádio, onde era mato, os
   quarteirões do entorno: duas fileiras de lote de costas (a da frente
   olha pro estádio), ou uma só quando não cabe, de uns 34 m de comprido,
   com a rua entre um e outro. Na fileira da frente, o comércio de dia de
   jogo e o estacionamento de terreno de chão batido, que vão de rua a
   rua. Medidas em metros. */
export const ENTORNO_M = { comprido: 34, fileira: 5.8, fileiraSo: 8.6, minimo: 16, comercio: [7.6, 11], estacionamento: [15, 20] };
export const TIPOS_COMERCIO_ENTORNO = ['espetinho', 'hamburgueria', 'pizzaria', 'barzinho'];
export const NOMES_COMERCIO_ENTORNO = {
  espetinho: ['ESPETINHO DO GORDO', 'CHURRASQUINHO DA TIA', 'ESPETO DO TORCEDOR', 'ESPETINHO DA ARENA', 'ESPETINHO 2 IRMÃOS'],
  hamburgueria: ['HAMBÚRGUER DO ESTÁDIO', 'X-TUDO DO CARECA', 'LANCHE DO GOL', 'BURGUER DA TORCIDA', 'SMASH DA ARQUIBANCADA'],
  pizzaria: ['PIZZARIA BELLA NAPOLI', 'PIZZARIA DO ESTÁDIO', 'PIZZA DA VILA', 'PIZZARIA FORNO A LENHA', 'PIZZARIA DOM GIOVANNI'],
  barzinho: ['BAR DO JOGO', 'BOTECO DO TORCEDOR', 'BAR DA ARQUIBANCADA', 'BAR PÉ DE CANA', 'BAR DO PRORROGAÇÃO']
};
/* o letreiro de cada comércio (o fundo e a letra) */
const CORES_LETREIRO_ENTORNO = { espetinho: ['#b5322a', '#fbf3e4'], hamburgueria: ['#1d1d1d', '#f2c230'], pizzaria: ['#2e7d32', '#ffffff'], barzinho: ['#f2c230', '#7a1e14'] };
/* o preço do estacionamento de dia de jogo, na placa da porta */
export const PRECOS_ESTACIONAMENTO = [20, 25, 30, 40];
/* as quadras altas que ganham rua no meio (um corte de norte a sul) */
const PARTIDAS = ['-3,2', '-1,2', '0,2'];
/* os pares que viram uma quadra só, por cima da rua (de oeste pra leste) */
const JUNTAS = [['0,-1', '1,-1'], ['-2,3', '-1,3'], ['0,7', '1,7']];
/* AS AVENIDAS QUE SAEM: toda avenida torta da cidade de hoje (a do
   sudoeste e a do noroeste, que eram as entradas, e as duas saídas pro
   oeste) e a estrada norte. Fica a da beira, que segue a costa; a entrada
   é a avenida duplicada (`AVENIDA_ENTRADA`) */
const SEM_AVENIDA = ['oeste', 'noroeste2', 'sudoeste', 'noroeste', 'norte'];
/* A AVENIDA DE ENTRADA, duplicada: duas pistas da largura da rua da cidade
   (118,8 = 6,1 m) com o canteiro de 2,5 m no meio, na rua entre a coluna
   1 e a 2 de quadras. A pista do leste é a própria rua de hoje; o canteiro
   e a pista do oeste tomam 8,6 m da coluna 1 */
export const AVENIDA_ENTRADA = { coluna: 1, canteiro: 48 };

/* AS FAVELAS: as manchas que o dono circulou, em coordenada de planta,
   cada uma cortada pela metade (a metade colada na cidade) */
const FAVELAS_GRANDE = [
  /* a metade de leste, a que encosta nas quadras −3 e −2 e no estádio:
     o corte na viela x = −3920 (46% da mancha) */
  { id: 'noroeste', nome: 'Favela do Noroeste', semente: 913247,
    poly: [[-3920, -569], [-3290, -745], [-2745, -745], [-2450, -475], [-2375, -105], [-2595, -65], [-3040, -30],
           [-3170, 20], [-3170, 430], [-3735, 410], [-3920, 500]],
    caixa: { x0: -3920, x1: 1e5, y0: -1e5, y1: 1e5 }, corte: 'x ≥ −3920 (viela)' },
  /* A do sudoeste foi dividida em três (o dono pediu): o que fica é o
     pedaço colado no Estádio Municipal — a coluna −3 do lado oeste dele
     (fileiras 9 a 11) e as duas fileiras de baixo (11 e 12) —, com o
     traço do dono do lado do estádio e da estrada sul, cortado na viela
     a oeste da coluna −3 e na viela de baixo da fileira 11 (da 12, só
     embaixo do estádio). Os outros dois pedaços foram pro sul da 2,10 e
     pro norte da 3,−2. `caixa`: onde a favela pode pôr casa (a viela da
     borda), pra ela não vazar pela regra do GAP pro quarteirão vizinho.
     Pela metade: fica a coluna −3, colada no lado oeste do estádio, da
     fileira 9 até a 12 (corte na viela x = −2300, 44% da mancha). Cortada
     na horizontal, pra ficar com o pedaço de baixo do estádio também,
     sobrava uma fileira só de casa embaixo dele — lia como fileira, não
     como favela. */
  { id: 'sudoeste', nome: 'Favela do Sudoeste', semente: 481523,
    poly: [[-3140, 4571], [-3140, 5880], [-2300, 5880], [-2300, 4631]],
    caixa: { x0: -3110, x1: -2300, y0: 4300, y1: 6345 }, corte: 'x ≤ −2300 (viela)' },
  /* o pedaço do sul: abaixo da 2,10 (o campo), da 1,10 e da 3,10, entre a
     estrada sul e a praia — as fileiras 11 e 12 das colunas 1 a 3. Pela
     metade: fica a de leste, a mais perto do estádio (x ≥ 1375) */
  { id: 'sul', nome: 'Favela do Sul', semente: 275183,
    poly: [[1375, 5430], [2560, 5430], [2560, 5870], [2470, 6150], [2230, 6340], [1640, 6390], [1375, 6381]],
    caixa: { x0: 1375, x1: 2557, y0: 5400, y1: 6345 }, corte: 'x ≥ 1375 (meio do quarteirão)' },
  /* o pedaço do norte: acima da 3,−2 e da sede da 2,−3, até a estrada do
     norte — as fileiras −3 a −5 das colunas 2 a 4 (a 4 só do lado de cá
     da estrada, longe do pórtico). Pela metade: fica a de leste (x ≥ 2181) */
  { id: 'norte', nome: 'Favela do Norte', semente: 639127,
    poly: [[2181, -2650], [3130, -2650], [3130, -1290], [2181, -1290]],
    caixa: { x0: 2181, x1: 3150, y0: -2660, y1: -1250 }, corte: 'x ≥ 2181 (meio do quarteirão)' },
  /* a quinta, pra praça grande que tem cinco bairros de favela (Fortaleza):
     no alto do norte, acima da −1,−2 e da 0,−2, longe das outras (o leste
     não tem lugar: é o Atacadex e a praia). Pela metade: fica a de leste,
     na viela x = −680 */
  { id: 'alto', nome: 'Favela do Alto', semente: 824613,
    poly: [[-680, -2175], [130, -2175], [130, -1250], [-680, -1250]],
    caixa: { x0: -680, x1: 130, y0: -2190, y1: -1250 }, corte: 'x ≥ −680 (viela)' }
];
/* as cores da favela do jogo */
const CORES_FAVELA = {
  tijolo:  ['#a4664a', '#9a5f45', '#ae6f52', '#95614a', '#b07354', '#8f5a42'],
  reboco:  ['#b0aca2', '#a39e93', '#bab5aa', '#9c968c', '#c2bcb0'],
  pintada: ['#d97b9c', '#4a9d97', '#d7a23c', '#6f8fb0', '#b5643f', '#7f9c5c', '#a83f3c', '#e8dcc0', '#c98b3f', '#dd8a4a', '#5f8fa8', '#c7d0c2']
};
const TELHAS_FAVELA = ['#b0603c', '#a85a38', '#bd6f45', '#9c5334', '#c07a52', '#ab6340'];
const LAJES_FAVELA = ['#9a958c', '#8f8a80', '#a6a096'];
const GRAFITE_FAVELA = RECADOS.concat(['RUA SEM MEDO', 'FAVELA VIVA', 'LUZ NO BECO', 'CRIA DA VILA', 'SOMOS DAQUI', 'FÉ NÃO FALHA',
  'MC ZINHO', 'DJ BEIJA-FLOR', 'RESPEITA QUEM SUBIU O MORRO', 'BONDE DO BECO', 'TUDO NOSSO', 'ISSO AQUI É NOSSO']);
const TINTAS_PIXO = ['#2a2a28', '#1c2a44', '#3a1f1f', '#23331f', '#b02a22', '#22439a'];
/* as casas grandes da favela do jogo: largura e fundo em metros, quantas,
   e a distância mínima entre duas iguais. Com a favela pela metade, a
   conta de cada uma também caiu pela metade (uma de cada, duas da f1 e
   da f2): 10 por favela em vez de 19, a mesma proporção de antes */
const CASAS_GRANDES = [
  { modelo: 'bar',     w: [5.0, 7.8], d: 4.3, n: 1, longe: 30, tipo: 'sobrado', alt: 6.0, parede: 'tijolo', esquina: true },
  { modelo: 'f2',      w: [5.6, 8.6], d: 4.4, n: 2, longe: 18, tipo: 'casa',    alt: 3.4, parede: 'pintada' },
  { modelo: 'lanche',  w: [5.0, 7.4], d: 4.3, n: 1, longe: 22, tipo: 'sobrado', alt: 6.2, parede: 'pintada' },
  { modelo: 'f1',      w: [5.0, 7.6], d: 4.4, n: 2, longe: 15, tipo: 'sobrado', alt: 8.2, parede: 'tijolo' },
  { modelo: 'escada',  w: [6.4, 8.6], d: 4.3, n: 1, longe: 15, perto: 5, tipo: 'sobrado', alt: 6.1, parede: 'reboco', esquina: true },
  { modelo: 'varal',   w: [5.0, 7.0], d: 4.3, n: 1, longe: 15, perto: 5, tipo: 'sobrado', alt: 6.2, parede: 'tijolo' },
  { modelo: 'garagem', w: [6.2, 8.2], d: 4.3, n: 1, longe: 15, perto: 5, tipo: 'sobrado', alt: 5.6, parede: 'tijolo' },
  { modelo: 'base',    w: [6.0, 8.2], d: 4.3, n: 1, longe: 15, perto: 5, tipo: 'sobrado', alt: 6.5, parede: 'tijolo' }
];
const dentroPol = (x, y, pol) => {
  let d = false;
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const [xi, yi] = pol[i], [xj, yj] = pol[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d;
  }
  return d;
};

/* =========================================================
   OS TRÊS MAPAS: o pequeno, o médio e o grande
   ---------------------------------------------------------
   O mapa de hoje é o das cidades pequenas, a proposta de expansão é o
   das grandes, e o médio fica no meio. Cada um tem o que a praça mais
   exigente do porte pede (a planilha do dono, dados/cidades.js):

     pequeno — 2 estádios, 5 espaços de sede, 8 bares, 3 favelas
     médio   — 3 estádios, 7 espaços de sede, 12 bares, 4 favelas, metrô
     grande  — 4 estádios, 9 espaços de sede, 18 bares, 5 favelas, metrô

   O bar é o bar pequeno da torcida, a sede é a do modelo novo, a favela é
   a da grade da cidade, com as casas grandes, e cada estádio é a cópia do
   quarteirão do estádio do jogo, numa ponta da cidade (`ESTADIOS_*`; o do
   meio da cidade vira casa). A praça escolhida decide o resto (`opc` do
   gerador): quantos estádios ela tem (a vaga que sobra fica mato) e se tem
   metrô. A praia é só do desenho: a página pinta mato no lugar dela. */
const GRADE_MEDIO = {
  '-2': [[-1, 10]],
  '-1': [[-1, 10]],
  '0':  [[-1, 10]],
  '1':  [[-1, 0], [1, 3]],
  '2':  [[-1, 0]],
  '3':  [[-1, 0]],
  '4':  [[-1, 0]],
  '5':  [[-1, 0]]
};
const TERRENOS_MEDIO = [
  { id: '5,0',  frente: 'n', onde: 'no nordeste, em cima da cidade de hoje' },
  { id: '2,0',  frente: 's', onde: 'no norte, de frente pra cidade de hoje' },
  { id: '0,4',  frente: 'n', onde: 'no meio do oeste' },
  { id: '-2,5', frente: 'n', onde: 'no oeste, entre o shopping e o metrô' },
  { id: '0,9',  frente: 's', onde: 'no sul, perto da entrada sul' },
  { id: '4,7',  frente: 'n', hoje: true, onde: 'no sudeste, na cidade de hoje' },
  { id: '2,7',  frente: 's', onde: 'no sul, entre a avenida e a cidade de hoje' },
  { id: '2,5',  frente: 'n', onde: 'no meio, perto da avenida de entrada' },
  { id: '-1,4', frente: 'n', onde: 'no oeste' },
  { id: '1,3',  frente: 'n', onde: 'no meio da cidade nova' }
];
/* no médio a cidade para na coluna −2 e na linha −1: a favela do noroeste
   encosta na rua oeste dela (a coluna −3 das fileiras −1 a 4, e a −4 no
   alto), e a do norte desce até a linha −1. Pela metade: a do noroeste
   fica com a de cima, colada no estádio (a viela y = 617), e a do norte
   com a de leste (x ≥ 2054) */
const FAVELA_NOROESTE_MEDIO = { id: 'noroeste', nome: 'Favela do Noroeste', semente: 913247,
  poly: [[-3560, -760], [-2360, -760], [-2360, 617], [-3577, 617], [-3700, 0]],
  caixa: { x0: -3760, x1: -2360, y0: -780, y1: 617 }, corte: 'y ≤ 617 (viela)' };
const FAVELA_NORTE_MEDIO = { id: 'norte', nome: 'Favela do Norte', semente: 639127,
  poly: [[2054, -2190], [3130, -2190], [3130, -830], [2054, -830]],
  caixa: { x0: 2054, x1: 3150, y0: -2200, y1: -790 }, corte: 'x ≥ 2054 (meio do quarteirão)' };
/* o pequeno é a cidade de hoje: os dois estádios nas pontas (o principal a
   oeste, entre a favela do noroeste e a do oeste, e o outro no nordeste, em
   cima da cidade de hoje); as três favelas são da grade da cidade — a do
   noroeste no lugar da favela de hoje (que era torta, com a casa girada
   junto da estrada), a do oeste entre o estádio e a estrada sul e a do
   norte acima da 2,1 e da 3,1; os terrenos saem de quadras de hoje, na
   ponta sem casa de avenida (a 1,6 e a 1,4 ficam a menos de 50 m do
   estádio do oeste e saem da conta) */
const TERRENOS_PEQUENO = [
  { id: '1,6', frente: 'n', hoje: true, onde: 'no oeste, perto do Atacadex' },
  { id: '2,1', frente: 's', hoje: true, onde: 'no norte, entre as duas favelas' },
  { id: '3,4', frente: 'n', hoje: true, ponta: 'l', onde: 'no meio da cidade' },
  { id: '1,4', frente: 'n', hoje: true, onde: 'no oeste, na frente da favela' },
  { id: '2,7', frente: 's', hoje: true, onde: 'no sul da cidade' },
  { id: '1,9', frente: 's', hoje: true, onde: 'no sudoeste' }
];
const FAVELAS_PEQUENO = [
  /* a coluna 1 das fileiras 0 a 3, e um pedaço da 0: o mesmo lugar da
     favela de hoje. Pela metade, como a de hoje: fica a de baixo da
     estrada noroeste2 (y ≥ 1085), colada nas quadras da coluna 2 */
  { id: 'noroeste', nome: 'Favela do Noroeste', semente: 527193,
    poly: [[-150, 1085], [880, 1085], [880, 2110], [-150, 2110]],
    caixa: { x0: -150, x1: 900, y0: 1085, y1: 2120 }, corte: 'y ≥ 1085 (meio do quarteirão)' },
  /* pela metade: a de leste, colada nas quadras da coluna 1 (a viela x = −680) */
  { id: 'oeste', nome: 'Favela do Oeste', semente: 358291,
    poly: [[-680, 4030], [110, 4030], [110, 5420], [-680, 5420]],
    caixa: { x0: -680, x1: 130, y0: 4000, y1: 5420 }, corte: 'x ≥ −680 (viela)' },
  /* pela metade: a de leste, a mais perto do estádio (a viela x = 1750) */
  { id: 'norte', nome: 'Favela do Norte', semente: 639127,
    poly: [[1750, -760], [2540, -760], [2540, 150], [1750, 150]],
    caixa: { x0: 1750, x1: 2557, y0: -780, y1: 150 }, corte: 'x ≥ 1750 (viela)' }
];
export const MAPAS = {
  pequeno: {
    id: 'pequeno', nome: 'Mapa pequeno', porte: 'Pequeno',
    grade: {}, estadios: ESTADIOS_PEQUENO,
    equip: {}, metro: null, condominios: [], terrenos: TERRENOS_PEQUENO, nEspacos: 5,
    partidas: [], juntas: [], semAvenida: SEM_AVENIDA, favelas: FAVELAS_PEQUENO, favelaDeHoje: false,
    nBares: 8, atacadexNoNorte: true, norteJ: 1, norteAte: null, beiramarJ: null, mundoY0: null
  },
  medio: {
    id: 'medio', nome: 'Mapa médio', porte: 'Médio',
    grade: GRADE_MEDIO, estadios: ESTADIOS_MEDIO,
    equip: EQUIP_GRANDE, metro: METRO_GRANDE, condominios: CONDOMINIOS, terrenos: TERRENOS_MEDIO, nEspacos: 7,
    partidas: PARTIDAS, juntas: JUNTAS, semAvenida: SEM_AVENIDA,
    favelas: [FAVELA_NOROESTE_MEDIO].concat(FAVELAS_GRANDE.filter(f => f.id === 'sudoeste' || f.id === 'sul'), [FAVELA_NORTE_MEDIO]), favelaDeHoje: false,
    nBares: 12, atacadexNoNorte: true, norteJ: -1, norteAte: -2750, beiramarJ: null, mundoY0: -2750
  },
  grande: {
    id: 'grande', nome: 'Mapa grande', porte: 'Grande',
    grade: GRADE_GRANDE, estadios: ESTADIOS_GRANDE,
    equip: EQUIP_GRANDE, metro: METRO_GRANDE, condominios: CONDOMINIOS, terrenos: TERRENOS_GRANDE, nEspacos: 9,
    partidas: PARTIDAS, juntas: JUNTAS, semAvenida: SEM_AVENIDA, favelas: FAVELAS_GRANDE, favelaDeHoje: false,
    nBares: 18, atacadexNoNorte: true, norteJ: -2, norteAte: -2750, beiramarJ: -2, mundoY0: -2750
  }
};
/* o mapa de cada porte da planilha */
export const MAPA_DO_PORTE = { Pequeno: 'pequeno', 'Médio': 'medio', Grande: 'grande' };

/* =========================================================
   AS CIDADES DA PRAÇA (o dono, 01/10/2026: "Deixe as cidades com a
   metade da proximidade proposta, pra dar uma impressão maior de
   conurbação. Vamos caso a caso … Agora as sedes das torcidas e os
   estádios tem que ficar obrigatoriamente na sua cidade")
   ---------------------------------------------------------
   A praça composta (o Interior do RS, a Paraíba, o Subúrbio Carioca…)
   tem bairros de mais de uma cidade (o `cidade` de cada bairro, em
   dados/cidades.js). O mapa dela é o mapa do porte, CORTADO EM CIDADES:
   cada cidade fica com um pedaço do tamanho dos bairros dela (o estádio
   de cada uma vai junto), a cidade do `centro` fica onde está, e as
   outras saem pro lado de verdade (`rumo`, a partir da cidade `de`), a
   uns 50 m (`VAO_CIDADES_M`) da vizinha — o dobro na `longe` e o triplo
   do outro lado da `baia` —, com a estrada curta ligando as duas, o
   pórtico de BEM-VINDO na entrada de cada uma e a placa com a distância
   de verdade (`km`: a linha reta vezes 1,2, pra chegar perto da da
   estrada). A `costa` fica na beira do mar, com a avenida da beira
   seguindo até ela. Cada ligação: [cidade, de, rumo, km, opções]. A
   praça que não está aqui fica inteira (Goiânia: o dono pediu, "mantenha
   da forma que está atualmente"; a sede e o estádio de Anápolis ficam no
   bairro de Anápolis) */
export const VAO_CIDADES_M = 50;
export const CISOES = {
  'bahia': { centro: 'Salvador', ligacoes: [['Feira de Santana', 'Salvador', 'no', 110]] },
  'belem': { centro: 'Belém', ligacoes: [['Marabá', 'Belém', 's', 530]] },
  'regiao-de-campinas': { centro: 'Campinas', ligacoes: [['Jundiaí', 'Campinas', 's', 45], ['Bragança Paulista', 'Campinas', 'l', 65]] },
  'rio-grande-do-norte': { centro: 'Natal', ligacoes: [['Mossoró', 'Natal', 'o', 295]] },
  'alagoas': { centro: 'Maceió', ligacoes: [['Arapiraca', 'Maceió', 'o', 120], ['Palmeira dos Índios', 'Arapiraca', 'n', 45]] },
  'sergipe': { centro: 'Aracaju', ligacoes: [['Itabaiana', 'Aracaju', 'o', 55], ['Lagarto', 'Itabaiana', 'so', 40]] },
  /* o sertão em fila pela estrada, como a BR-230 */
  'paraiba': { centro: 'João Pessoa', ligacoes: [['Campina Grande', 'João Pessoa', 'o', 135], ['Patos', 'Campina Grande', 'o', 185],
                                                 ['Sousa', 'Patos', 'o', 130], ['Cajazeiras', 'Sousa', 'o', 45]] },
  /* São Luís na ilha, ao norte; o mar é o leste do mapa: Parnaíba desce pela
     costa, Teresina fica pra dentro, e Imperatriz, longe, a sudoeste */
  'maranhao': { centro: 'São Luís', ligacoes: [['Parnaíba', 'São Luís', 's', 340, { costa: true }], ['Teresina', 'Parnaíba', 'so', 320],
                                              ['Imperatriz', 'São Luís', 'so', 580, { longe: true }]] },
  /* o Rio e a Baixada juntos; Niterói, São Gonçalo e Itaboraí do outro lado
     da baía, ligados pela ponte */
  'suburbio-carioca': { centro: 'Rio de Janeiro', ligacoes: [['Niterói', 'Rio de Janeiro', 'l', 15, { baia: true }], ['Volta Redonda', 'Rio de Janeiro', 'o', 105],
                                                            ['Campos dos Goytacazes', 'Niterói', 'ne', 260, { longe: true }]] },
  'mato-grosso': { centro: 'Cuiabá', ligacoes: [['Rondonópolis', 'Cuiabá', 'se', 220]] },
  'litoral-catarinense': { centro: 'Florianópolis', ligacoes: [['Balneário Camboriú', 'Florianópolis', 'n', 80, { costa: true }]] },
  /* os interiores: a árvore das estradas mais curtas de verdade, a partir
     da cidade do meio */
  'interior-do-rs': { centro: 'Caxias do Sul', ligacoes: [['Passo Fundo', 'Caxias do Sul', 'no', 190], ['Erechim', 'Passo Fundo', 'n', 85],
                                                          ['Pelotas', 'Caxias do Sul', 's', 370], ['Bagé', 'Pelotas', 'o', 210], ['Uruguaiana', 'Bagé', 'no', 400]] },
  'interior-de-sc': { centro: 'Brusque', ligacoes: [['Itajaí', 'Brusque', 'ne', 40], ['Joinville', 'Itajaí', 'n', 85], ['Criciúma', 'Brusque', 's', 215],
                                                   ['Joaçaba', 'Brusque', 'o', 305], ['Chapecó', 'Joaçaba', 'o', 130]] },
  'interior-do-ce': { centro: 'Limoeiro do Norte', ligacoes: [['Maranguape', 'Limoeiro do Norte', 'no', 185], ['Itapipoca', 'Maranguape', 'no', 130],
                                                              ['Sobral', 'Itapipoca', 'o', 105], ['Iguatu', 'Limoeiro do Norte', 'so', 225], ['Juazeiro do Norte', 'Iguatu', 's', 115]] },
  'interior-de-pe': { centro: 'Salgueiro', ligacoes: [['Petrolina', 'Salgueiro', 'so', 255], ['Santa Cruz do Capibaribe', 'Salgueiro', 'l', 385],
                                                     ['Caruaru', 'Santa Cruz do Capibaribe', 'se', 50]] },
  'interior-de-minas': { centro: 'Patos de Minas', ligacoes: [['Uberlândia', 'Patos de Minas', 'o', 225], ['São João del-Rei', 'Patos de Minas', 'se', 445],
                                                             ['Ipatinga', 'São João del-Rei', 'ne', 310], ['Teófilo Otoni', 'Ipatinga', 'ne', 250]] },
  'interior-do-pr': { centro: 'Londrina', ligacoes: [['Maringá', 'Londrina', 'o', 95], ['Ponta Grossa', 'Londrina', 'se', 265], ['Paranaguá', 'Ponta Grossa', 'l', 205],
                                                    ['Cascavel', 'Maringá', 'so', 275]] },
  'interior-de-sp': { centro: 'Araraquara', ligacoes: [['Ribeirão Preto', 'Araraquara', 'ne', 95], ['Bauru', 'Araraquara', 'so', 130], ['Novo Horizonte', 'Bauru', 'n', 115],
                                                      ['Mirassol', 'Novo Horizonte', 'no', 95], ['Limeira', 'Araraquara', 'se', 140], ['Piracicaba', 'Limeira', 'so', 40],
                                                      ['Itu', 'Piracicaba', 'se', 85], ['Presidente Prudente', 'Novo Horizonte', 'o', 280]] }
};
/* "BEM-VINDO A …": a cidade com artigo leva "AO" */
export const PREPOSICAO_CIDADE = { 'Rio de Janeiro': 'AO' };
/* as cidades da praça como o gerador recebe (`opc.cisao`): a tabela de
   cima e, de cada cidade, quantos bairros ela tem (e quantos são favela)
   e os bairros dela (o id, o nome, a classe e quantas sedes ele tem:
   `sedesPorBairro`, o que o jogo diz depois de espalhar as sedes
   repetidas, ou a lista dos dados); `estadios`: a cidade de cada estádio
   da praça, na ordem dela, e `estadiosBairro`, o bairro dele. `modelo`:
   na praça de três cidades ou mais, 'todas' (cada cidade é desenhada do
   zero, ver AS CIDADES-MODELO no gerador); na de duas, 'pequenas' (a
   grande fica com o mapa do porte inteiro e a pequena é desenhada) */
export function cisaoDaPraca(id, bairros, cidadeDoEstadio, bairroDoEstadio = null, sedesPorBairro = null) {
  const T = CISOES[id];
  if (!T || !bairros || !bairros.length) return null;
  const conta = new Map();
  for (const b of bairros) {
    const c = b.cidade || T.centro, x = conta.get(c) || { n: 0, favelas: 0, bairros: [] };
    x.n++; if (b.classe === 'Favela') x.favelas++;
    const s = sedesPorBairro && sedesPorBairro[b.id] != null ? sedesPorBairro[b.id] : (b.sedes || []).length;
    x.bairros.push({ id: b.id, nome: b.nome, classe: b.classe, sedes: s });
    conta.set(c, x);
  }
  const lig = new Map(T.ligacoes.map(([c, de, rumo, km, o]) => [c, { de, rumo, km, ...(o || {}) }]));
  if (!conta.has(T.centro) || [...conta.keys()].some(c => c !== T.centro && !lig.has(c))) return null;
  const cidades = [...conta.entries()].map(([nome, x]) => ({ nome, n: x.n, favelas: x.favelas, bairros: x.bairros, ...(lig.get(nome) || {}) }));
  return { id, centro: T.centro, cidades, estadios: (cidadeDoEstadio || []).map(c => c || T.centro),
           estadiosBairro: (cidadeDoEstadio || []).map((_, k) => (bairroDoEstadio && bairroDoEstadio[k]) || null),
           modelo: cidades.length >= 3 ? 'todas' : 'pequenas' };
}
/* A CIDADE-MODELO DE n BAIRROS: [colunas, linhas] de blocos de 3 × 2
   quadras (ver AS CIDADES-MODELO no gerador) — até 4 bairros, uma coluna
   de blocos (o bloco é largo: 119 × 42 m, e a pilha fica quase quadrada);
   de 5 em diante, duas */
export const ARRANJO_MODELO = { 1: [1, 1], 2: [1, 2], 3: [1, 3], 4: [1, 4], 5: [2, 3], 6: [2, 3], 7: [2, 4], 8: [2, 4], 9: [2, 5], 10: [2, 5] };
export const arranjoModelo = n => ARRANJO_MODELO[n] || [2, Math.ceil(n / 2)];

export function gerarProposta(P, cfg = MAPAS.grande, opc = {}) {
  const K = P.CIDADE, CALC = K.CALC, M = P.METRO;
  /* (os nomes de dentro escondem os de fora, que são os do mapa grande;
     na praça de cidades-modelo, o que é do mapa do porte sai: ver AS
     CIDADES-MODELO) */
  let GRADE = cfg.grade, EQUIP = cfg.equip, CONDOMINIOS = cfg.condominios, TERRENOS_SEDE = cfg.terrenos,
      PARTIDAS = cfg.partidas, JUNTAS = cfg.juntas, FAVELAS = cfg.favelas;
  const SEM_AVENIDA = cfg.semAvenida;
  /* o metrô só na praça que tem */
  let METRO = opc.metro === false ? null : cfg.metro;
  /* as vagas de estádio que a praça ocupa, na ordem do mapa (a primeira é
     a do estádio principal; `opc.estadios` é quantos a praça tem) */
  const nVagas = Math.max(1, Math.min(cfg.estadios.length, opc.estadios ?? cfg.estadios.length));
  /* (na praça cortada em cidades, a vaga de cada estádio sai do lado da
     cidade dele: ver `escolherVagas`) */
  let VAGAS = cfg.estadios.slice(0, nVagas);
  /* AS CIDADES DA PRAÇA (`opc.cisao`, de `cisaoDaPraca`): sem ela, uma cidade só */
  const CIS = opc.cisao && opc.cisao.cidades && opc.cisao.cidades.length > 1 ? opc.cisao : null;
  const CENTRO = CIS ? CIS.centro : null;
  /* AS CIDADES-MODELO (ver mais abaixo): 'todas' (a praça de três cidades
     ou mais: nada do mapa do porte nem da cidade de hoje entra) ou
     'pequenas' (a de duas: a grande fica com o mapa do porte inteiro, sem
     corte, e só a pequena é desenhada); sem cisão, nulo */
  const MODELO = CIS && (CIS.modelo === 'todas' || CIS.modelo === 'pequenas') ? CIS.modelo : null;
  const TODAS = MODELO === 'todas';
  /* (a cidade desenhada do zero: na 'todas', todas; na 'pequenas', a de fora) */
  const ehModelo = nome => !!MODELO && !!nome && (TODAS || nome !== CENTRO);
  if (TODAS) { GRADE = {}; EQUIP = {}; CONDOMINIOS = []; TERRENOS_SEDE = []; PARTIDAS = []; JUNTAS = []; FAVELAS = []; METRO = null; }
  const RUMO = { n: [0, -1], s: [0, 1], l: [1, 0], o: [-1, 0], ne: [Math.SQRT1_2, -Math.SQRT1_2], no: [-Math.SQRT1_2, -Math.SQRT1_2],
                 se: [Math.SQRT1_2, Math.SQRT1_2], so: [-Math.SQRT1_2, Math.SQRT1_2] };
  const cidadeP = new Map(CIS ? CIS.cidades.map(c => [c.nome, c]) : []);
  /* o rumo de uma cidade a partir do centro: a soma dos rumos do caminho até ela */
  const rumoDe = nome => {
    let x = 0, y = 0;
    for (let c = cidadeP.get(nome), n = 0; c && c.de && n < 20; c = cidadeP.get(c.de), n++) { const d = RUMO[c.rumo] || [0, 0]; x += d[0]; y += d[1]; }
    const L = Math.hypot(x, y);
    return L ? [x / L, y / L] : [0, 0];
  };
  const outraCidade = c => !!CIS && !!c && c !== CENTRO;
  /* o que a cisão não conseguiu fazer direito (vai no PROP.cisao, pra página mostrar) */
  const avisos = [];
  const par8 = v => Math.round(v / 8) * 8;
  const hash = (...n) => {
    let h = 2166136261;
    for (const v of n) { h = Math.imul(h ^ Math.round(v * 7 + 3), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; }
    return h >>> 0;
  };
  const sorte = (...n) => hash(...n) / 4294967296;
  const entre = (a, b, ...n) => a + sorte(...n) * (b - a);
  const cruza = (a, b, m) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;
  const MARGEM = RUA / 2 + 4;
  const E_M = ENTORNO_M;

  /* ---- a avenida de entrada: a banda dela (as duas pistas e o canteiro) ---- */
  const cE = AVENIDA_ENTRADA.coluna, xE = K.COLUNAS[cE].c, CANTEIRO = AVENIDA_ENTRADA.canteiro;
  const ENTRADA = { pista: RUA, canteiro: CANTEIRO, x1: xE + RUA / 2, x0: xE + RUA / 2 - 2 * RUA - CANTEIRO };
  ENTRADA.xc = (ENTRADA.x0 + ENTRADA.x1) / 2; ENTRADA.l = ENTRADA.x1 - ENTRADA.x0;
  /* ---- a grade: as colunas e as linhas de hoje, e as novas no mesmo passo
     (a coluna da avenida de entrada acaba na pista do oeste dela) ---- */
  const cx0 = K.COLUNAS[0].c, passoX = K.COLUNAS[1].c - K.COLUNAS[0].c;
  const ly0 = K.LINHAS[0].c;
  const colX = i => i === cE ? [i >= 1 ? K.bordasX[2 * i] : cx0 + (i - 1) * passoX + RUA / 2, ENTRADA.x0]
                  : i >= 1 ? [K.bordasX[2 * i], K.bordasX[2 * i + 1]]
                           : [cx0 + (i - 1) * passoX + RUA / 2, cx0 + i * passoX - RUA / 2];
  const linY = j => j >= 1 ? [K.bordasY[2 * j], K.bordasY[2 * j + 1]]
                           : [ly0 + (j - 1) * PASSO_Y + RUA / 2, ly0 + j * PASSO_Y - RUA / 2];
  /* a grade estendida: as linhas depois da 10 seguem no mesmo passo */
  const linYx = j => {
    if (j <= 10) return linY(j);
    const y0 = linY(10)[1] + RUA + (j - 11) * PASSO_Y;
    return [y0, y0 + PASSO_Y - RUA];
  };
  /* A RUA EM VOLTA DE UMA QUADRA, NA LARGURA DE VERDADE: até a borda da
     coluna (ou da linha) do lado. É 118,8 quase sempre, e 128 em volta
     da linha do estádio e da coluna dele. Do lado de dentro da quadra
     partida (onde não há linha da grade perto), é a rua do meio. É essa
     faixa que a página pinta de asfalto e que a favela não pisa: com as
     duas iguais, a casa encosta na guia sem cair em cima da rua. */
  const bordasCol = [], bordasLin = [];
  for (let i = -12; i <= 6; i++) { const [a, b] = colX(i); if (b > a) bordasCol.push([a, b]); }
  for (let j = -8; j <= 16; j++) { const [a, b] = linYx(j); if (b > a) bordasLin.push([a, b]); }
  const ruaDe = r => {
    const esq = Math.max(...bordasCol.map(c => c[1]).filter(v => v <= r.x0 - 20));
    const dir = Math.min(...bordasCol.map(c => c[0]).filter(v => v >= r.x1 + 20));
    const cima = Math.max(...bordasLin.map(c => c[1]).filter(v => v <= r.y0 - 20));
    const baixo = Math.min(...bordasLin.map(c => c[0]).filter(v => v >= r.y1 + 20));
    const faixa = d => d > 140 ? RUA : d;
    return { x0: r.x0 - faixa(r.x0 - esq), x1: r.x1 + faixa(dir - r.x1), y0: r.y0 - faixa(r.y0 - cima), y1: r.y1 + faixa(baixo - r.y1) };
  };

  /* ---- AS CIDADES-MODELO (o dono, 01/10/2026: "acredito que o melhor é
     redesenhar por cidade o mapa, considerando a sua quantidade de bairros,
     sem se importar com o modelo antigo pra essas cidades. se o bairro é
     favela, é uma favela. se é classe baixa ou média, é quarteirão normal,
     se é classe alta, vai ter casarão e prédios altos. o formato das
     cidades pode ser quadrado se for mais fácil, e o importante é que as
     cidades não sejam tão distantes umas das outras pra não ficar demorada
     a gameplay ... essas praças com mais de 2 cidades não vão ter mais
     zonas pra facilitar a criação do design do mapa"). Na praça de três
     cidades ou mais (`TODAS`) o mapa do porte e a cidade de hoje não
     entram: cada cidade é desenhada do zero, numa grade só dela, no passo
     da cidade de hoje (a quadra de 35,6 × 17,8 m e a rua de 6,1 m). Na de
     duas, a grande fica com o mapa do porte inteiro e só a pequena é
     desenhada assim (o dono: "Grande fica, pequena vira modelo").
     · CADA BAIRRO É UM BLOCO DE 3 × 2 QUADRAS (o dono: "3x2, mas um bairro
       com estádio é 3x2+estádio. A favela também tem área parecida com
       bairro 3x2 (115x42, não precisa ser exato)"): 119 × 42 m com as ruas
       de dentro. O bairro de classe Favela é uma favela do tamanho do bloco
       (as ruas de dentro viram viela, como na favela de sempre); o Nobre é
       de quadras, e a planta põe nele as torres e os casarões.
     · A CIDADE é uma grade de blocos (`arranjoModelo`): uma coluna de
       blocos até 4 bairros, duas a partir de 5 — quase quadrada. O bloco
       que sobra (5, 7, 9 bairros) é o da ponta de fora.
     · DE QUE LADO FICA O QUÊ: a cidade dá as costas pras vizinhas (`fora`:
       o contrário da soma dos rumos delas). O bairro do estádio pega o
       bloco mais pra fora, depois a favela, depois os de classe baixa e
       média; o Nobre fica do lado das vizinhas, onde chega a estrada.
     · O ESTÁDIO sai do lado de fora do bloco do bairro dele (o bairro do
       estádio nos dados; sem ele, o primeiro bairro de quadras da cidade),
       no lado da borda da cidade que mais dá pra `fora`; o terreno de
       verdade, o acesso e o entorno são os de sempre.
     · O TERRENO DE SEDE: um por sede que o bairro tem (o jogo diz, com as
       repetidas já espalhadas), na quadra dele mais longe dos estádios; na
       favela com sede, a quadra da quina dela mais longe dos estádios é
       quadra comum, com o terreno. A sede que o jogo põe depois num bairro
       sem terreno fica numa reserva da planta (a ponta de uma quadra dele).
     · O BAR: uma esquina em cada bairro de quadras (a favela tem o boteco).
     Cada cidade nasce longe das outras (a do centro, na praça `TODAS`, no
     lugar da cidade de hoje) e `afastarCidades` põe ela no lugar, a 50 m
     da vizinha, com a estrada, o pórtico e a placa. */
  const QW = passoX - RUA, QH = PASSO_Y - RUA;                   // a quadra da grade
  const modelos = [];
  if (MODELO) {
    const unit = v => { const L = Math.hypot(v[0], v[1]); return L > 1e-6 ? [v[0] / L, v[1] / L] : null; };
    const K0 = [K.VX0 + K.VW / 2, K.VY0 + K.VH / 2];
    const NORMAL = { o: [-1, 0], l: [1, 0], n: [0, -1], s: [0, 1] };
    let longe = 0;
    CIS.cidades.forEach((c, kc) => {
      if (!ehModelo(c.nome)) return;
      const bs = (c.bairros || []).slice();
      if (!bs.length) return;
      /* as costas da cidade: o rumo dela (pra longe da vizinha de onde
         ela sai) menos o rumo das que saem dela; na fila (a vizinha de
         cada lado), o lado de baixo da fila */
      let fora = c.nome === CENTRO ? [0, 0] : (RUMO[c.rumo] || [0, 0]).slice();
      for (const f of CIS.cidades) if (f.de === c.nome && f.nome !== c.nome) { const d = RUMO[f.rumo] || [0, 0]; fora[0] -= d[0]; fora[1] -= d[1]; }
      fora = unit(fora);
      if (!fora) {
        const r = RUMO[c.rumo] || [0, 1];
        fora = [-r[1], r[0]];
        if (fora[1] < 0 || (fora[1] === 0 && fora[0] < 0)) fora = [-fora[0], -fora[1]];
      }
      const n = bs.length, [SC, SR] = arranjoModelo(n), C = 3 * SC, L = 2 * SR;
      const Wc = C * passoX - RUA, Hc = L * PASSO_Y - RUA;
      /* onde ela nasce: a do centro (na praça toda de modelo) no lugar da cidade de hoje; as outras longe, a oeste */
      const X0 = Math.round(c.nome === CENTRO ? K0[0] - Wc / 2 : -60000 - 40000 * longe), Y0 = Math.round(K0[1] - Hc / 2);
      if (c.nome !== CENTRO) longe++;
      const ib = 1000 * (kc + 1), jb = 1000;                     // os ids da grade dela (longe dos da grade de hoje)
      const G = { i0: ib - 1, i1: ib + C, j0: jb - 1, j1: jb + L,
                  colX: i => { const x = X0 + (i - ib) * passoX; return [x, x + QW]; },
                  linY: j => { const y = Y0 + (j - jb) * PASSO_Y; return [y, y + QH]; } };
      const cxC = X0 + Wc / 2, cyC = Y0 + Hc / 2;
      const blocos = [];
      for (let r = 0; r < SR; r++) for (let cc = 0; cc < SC; cc++) {
        const x0 = X0 + 3 * cc * passoX, y0 = Y0 + 2 * r * PASSO_Y;
        const b = { c: cc, r, x0, x1: x0 + 2 * passoX + QW, y0, y1: y0 + PASSO_Y + QH };
        b.nota = ((b.x0 + b.x1) / 2 - cxC) * fora[0] + ((b.y0 + b.y1) / 2 - cyC) * fora[1];
        blocos.push(b);
      }
      blocos.sort((a, b) => b.nota - a.nota || a.r - b.r || a.c - b.c);
      const usados = blocos.slice(blocos.length - n);           // (o que sobra é o mais pra fora)
      /* os estádios da cidade e o bairro de cada um */
      const ests = [];
      (CIS.estadios || []).forEach((cid, k) => {
        if (k >= nVagas || (cid || CENTRO) !== c.nome) return;
        const bid = (CIS.estadiosBairro || [])[k];
        const b = bs.find(x => x.id === bid) || bs.find(x => x.classe !== 'Favela') || bs[0];
        ests.push({ k, b });
      });
      const nEst = b => ests.filter(e => e.b === b).length;
      const grupo = b => nEst(b) ? 0 : b.classe === 'Favela' ? 1 : b.classe === 'Nobre' ? 3 : 2;
      const ordem = bs.map((b, k) => ({ b, k })).sort((x, y) => grupo(x.b) - grupo(y.b) || nEst(y.b) - nEst(x.b) || x.k - y.k).map(x => x.b);
      const ocupa = new Map();
      ordem.forEach((b, k) => ocupa.set(b, usados[k]));
      const temBloco = (cc, r) => usados.some(u => u.c === cc && u.r === r);
      const M0 = { nome: c.nome, X0, Y0, SC, SR, C, L, G, fora, cels: [], favelas: [], vagas: [], bairros: [] };
      /* A VAGA DE CADA ESTÁDIO: do lado de fora do bloco do bairro dele, no lado da borda que mais dá pra `fora` */
      const ladosUsados = new Map();
      for (const { k, b } of ests) {
        const u = ocupa.get(b), ja = ladosUsados.get(u) || [];
        const lados = [['o', !temBloco(u.c - 1, u.r)], ['l', !temBloco(u.c + 1, u.r)], ['n', !temBloco(u.c, u.r - 1)], ['s', !temBloco(u.c, u.r + 1)]]
          .filter(([f, livre]) => livre && !ja.includes(f)).map(([f]) => f)
          /* (a ponta do bloco antes do lado comprido: o bloco tem 42 m de fundo, e com o estádio no
             lado comprido o bairro inteiro ficava a menos de 50 m dele — sem sede e sem bar) */
          .sort((f, g) => (NORMAL[g][0] * fora[0] + NORMAL[g][1] * fora[1] + (g === 'o' || g === 'l' ? 2 : 0))
                        - (NORMAL[f][0] * fora[0] + NORMAL[f][1] * fora[1] + (f === 'o' || f === 'l' ? 2 : 0)));
        const f = lados[0] || 'o';
        ja.push(f); ladosUsados.set(u, ja);
        const area = f === 'o' ? { x0: u.x0 - 10, x1: u.x0, y0: u.y0, y1: u.y1 } : f === 'l' ? { x0: u.x1, x1: u.x1 + 10, y0: u.y0, y1: u.y1 }
          : f === 'n' ? { x0: u.x0, x1: u.x1, y0: u.y0 - 10, y1: u.y0 } : { x0: u.x0, x1: u.x1, y0: u.y1, y1: u.y1 + 10 };
        M0.vagas.push({ k, v: { area, nome: 'Estádio ' + (k + 1), fora: f, deModelo: true, cidade: c.nome, bairro: b.id, ci: ib + 500 + k, cj: jb + 500 } });
      }
      for (const b of bs) {
        const u = ocupa.get(b);
        const ci0 = ib + 3 * u.c, cj0 = jb + 2 * u.r;
        const cels = [];
        for (let a = 0; a < 3; a++) for (let d = 0; d < 2; d++) {
          const [x0, x1] = G.colX(ci0 + a), [y0, y1] = G.linY(cj0 + d);
          cels.push({ i: ci0 + a, j: cj0 + d, x0, x1, y0, y1, a, d });
        }
        const B = { id: b.id, nome: b.nome, classe: b.classe, sedes: b.sedes || 0, bloco: u, favela: b.classe === 'Favela', cels: [] };
        M0.bairros.push(B);
        if (B.favela) {
          /* a favela do tamanho do bloco; com sede, a quadra da ponta de dentro (a quina mais longe do lado de fora) é quadra comum */
          B.todas = cels;
          /* (a quina mais longe dos estádios da cidade — o terreno de sede fica a 50 m deles ou mais —, depois a de dentro) */
          const longeDosEstadios = q => Math.min(Infinity, ...M0.vagas.map(({ v }) => Math.hypot((q.x0 + q.x1) / 2 - (v.area.x0 + v.area.x1) / 2, (q.y0 + q.y1) / 2 - (v.area.y0 + v.area.y1) / 2)));
          const dentro = q => (q.x0 + q.x1) / 2 * fora[0] + (q.y0 + q.y1) / 2 * fora[1];
          const quinas = cels.filter(q => q.a !== 1).sort((p, q) => (longeDosEstadios(q) - longeDosEstadios(p)) || (dentro(p) - dentro(q)));
          const deSede = B.sedes > 0 ? quinas.slice(0, Math.min(2, B.sedes)) : [];
          B.deSede = deSede.length;
          for (const q of deSede) { B.cels.push(q); M0.cels.push({ ...q, cidade: c.nome, bairro: b.id, naFavela: true }); }
          let semente = 2166136261;
          for (const ch of c.nome + '|' + b.id) semente = Math.imul(semente ^ ch.charCodeAt(0), 16777619) >>> 0;
          /* (a `caixa`: a favela não passa do bloco dela, até o meio da rua de fora) */
          M0.favelas.push({ id: 'favela-' + b.id, nome: b.nome, semente, cidade: c.nome, bairro: b.id, grade: G,
                            poly: [[u.x0, u.y0], [u.x1, u.y0], [u.x1, u.y1], [u.x0, u.y1]],
                            caixa: { x0: u.x0 - RUA / 2, x1: u.x1 + RUA / 2, y0: u.y0 - RUA / 2, y1: u.y1 + RUA / 2 } });
        } else for (const q of cels) { B.cels.push(q); M0.cels.push({ ...q, cidade: c.nome, bairro: b.id }); }
      }
      /* A CIDADE SÓ DE FAVELA (Santa Cruz do Capibaribe, Ipatinga, Teófilo
         Otoni, Palmeira dos Índios): sem quadra nenhuma, a estrada não tinha
         rua onde chegar. A quina da favela do lado de cada vizinha (a de onde
         ela sai e as que saem dela) vira quadra comum, do bairro da favela: a
         entrada da cidade, onde a estrada chega e a favela encosta */
      if (bs.every(b => b.classe === 'Favela')) {
        const viz = [];
        if (c.de && c.nome !== CENTRO) { const r = RUMO[c.rumo] || [0, 0]; viz.push([-r[0], -r[1]]); }
        for (const f of CIS.cidades) if (f.de === c.nome && f.nome !== c.nome) viz.push(RUMO[f.rumo] || [0, 0]);
        for (const v of viz) {
          let melhor = null, nota = -Infinity;
          for (const B of M0.bairros) for (const q of B.todas || []) {
            if (q.a === 1) continue;
            const s = ((q.x0 + q.x1) / 2 - cxC) * v[0] + ((q.y0 + q.y1) / 2 - cyC) * v[1];
            if (s > nota + 1e-6) { nota = s; melhor = { B, q }; }
          }
          if (melhor && !melhor.B.cels.includes(melhor.q)) {
            melhor.B.cels.push(melhor.q);
            M0.cels.push({ ...melhor.q, cidade: c.nome, bairro: melhor.B.id, naFavela: true, entrada: true });
          }
        }
      }
      /* TODA FAVELA CHEGA NA RUA (01/10/2026: em São Luís, a Cidade
         Operária ficou na quina da cidade, com o mato em volta e a outra
         favela embaixo — a viela dela não chegava em rua nenhuma, e o
         boneco não entrava no bar dela). A rua da cidade-modelo é a faixa em
         volta de cada quadra: a de uma quadra encosta na da vizinha, até na
         diagonal; a favela anda pela viela até a rua que passa num lado
         dela (a da quadra do bloco do lado, ou a da quina de favela que
         virou quadra). A favela que não chega no resto da cidade ganha a
         quina mais perto dele como quadra comum, do bairro dela (a entrada
         da favela, como na cidade só de favela), a que encosta numa quadra
         antes da que encosta em outra favela */
      {
        const chave = (i, j) => i + ',' + j;
        const favs = M0.bairros.filter(B => B.favela && B.todas);
        const celsFav = new Map();                               // célula → a favela dela
        for (const B of favs) for (const q of B.todas) celsFav.set(chave(q.i, q.j), B);
        const viz4 = (a, b) => Math.abs(a.i - b.i) + Math.abs(a.j - b.j) === 1;
        const viz8 = (a, b) => Math.max(Math.abs(a.i - b.i), Math.abs(a.j - b.j)) === 1;
        for (let volta = 0; volta < 12; volta++) {
          /* os pedaços: as quadras (a rua de uma encosta na da outra) e as favelas que uma quadra toca pelo lado */
          const ruas = M0.cels;
          const pai = new Map(), raiz = k => { while (pai.get(k) !== k) k = pai.get(k); return k; };
          const une = (a, b) => { const x = raiz(a), y = raiz(b); if (x !== y) pai.set(x < y ? y : x, x < y ? x : y); };
          for (const q of ruas) pai.set('q' + chave(q.i, q.j), 'q' + chave(q.i, q.j));
          for (const B of favs) pai.set('f' + B.id, 'f' + B.id);
          for (let a = 0; a < ruas.length; a++) for (let b = a + 1; b < ruas.length; b++) if (viz8(ruas[a], ruas[b])) une('q' + chave(ruas[a].i, ruas[a].j), 'q' + chave(ruas[b].i, ruas[b].j));
          for (const B of favs) for (const q of ruas)
            if (B.todas.some(f => (f.i === q.i && f.j === q.j) || viz4(f, q))) une('f' + B.id, 'q' + chave(q.i, q.j));
          /* o pedaço principal: o de mais quadras */
          const tam = new Map();
          for (const q of ruas) { const r = raiz('q' + chave(q.i, q.j)); tam.set(r, (tam.get(r) || 0) + 1); }
          const principal = [...tam].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))[0];
          if (!principal) break;
          const soltas = favs.filter(B => raiz('f' + B.id) !== principal[0]);
          if (!soltas.length) break;
          const ruasP = ruas.filter(q => raiz('q' + chave(q.i, q.j)) === principal[0]);
          const celsP = favs.filter(B => raiz('f' + B.id) === principal[0]).flatMap(B => B.todas);
          /* a quina de cada favela solta: encosta numa quadra do principal (0), numa favela dele (1), ou não (fica de fora) */
          let melhor = null, nota = Infinity;
          for (const B of soltas) for (const q of B.todas) {
            if (q.a === 1 || B.cels.includes(q)) continue;
            const n = ruasP.some(r => viz8(r, q)) ? 0 : celsP.some(f => viz4(f, q)) ? 1 : Infinity;
            const dentro = ((q.x0 + q.x1) / 2 - cxC) * fora[0] + ((q.y0 + q.y1) / 2 - cyC) * fora[1];
            const s = n * 1e7 + dentro;
            if (n < Infinity && s < nota - 1e-6) { nota = s; melhor = { B, q }; }
          }
          if (!melhor) { avisos.push(`${c.nome}: a favela ${soltas.map(B => B.nome).join(', ')} não chega na rua`); break; }
          melhor.B.cels.push(melhor.q);
          M0.cels.push({ ...melhor.q, cidade: c.nome, bairro: melhor.B.id, naFavela: true, entrada: true });
        }
      }
      modelos.push(M0);
    });
    /* AS VAGAS: as do centro (na praça de duas cidades) no mapa do porte, na
       ordem dele; as das cidades-modelo, do lado do bairro de cada estádio */
    const doModelo = new Map(modelos.flatMap(m => m.vagas.map(x => [x.k, x.v])));
    const base = cfg.estadios.slice();
    VAGAS = Array.from({ length: nVagas }, (_, k) => doModelo.get(k) || base.shift());
    /* as favelas: as do mapa do porte (na de duas cidades) e as dos bairros de favela */
    FAVELAS = FAVELAS.concat(modelos.flatMap(m => m.favelas));
  }

  /* ---- as avenidas da proposta ---- */
  const av = id => K.AVENIDAS.find(a => a.id === id);
  /* (na praça toda de modelo, nenhuma avenida da cidade de hoje fica: a página esconde todas) */
  const avenidas = [], avenidasTiradas = K.AVENIDAS.filter(a => TODAS || SEM_AVENIDA.includes(a.id));
  /* a borda do mundo: as favelas mandam no oeste e no sul */
  const polys = FAVELAS.flatMap(f => f.poly);
  /* (e as vagas de estádio ocupadas: a caixa de cada uma, a das seis
     células da grade ou a `area` dela) */
  const areaDaVaga = v => v.area ? { ...v.area } : { x0: colX(v.i[0])[0], x1: colX(v.i[1])[1], y0: linYx(v.j[0])[0], y1: linYx(v.j[1])[1] };
  /* ---- AS CIDADES DA PRAÇA: A COLUNA DA AVENIDA DE ENTRADA ----
     A coluna da avenida de entrada só estreita no centro: a avenida é
     dele (a cidade de fora usa a coluna sem o estreito). */
  const colXBase = i => i >= 1 ? [K.bordasX[2 * i], K.bordasX[2 * i + 1]] : [cx0 + (i - 1) * passoX + RUA / 2, cx0 + i * passoX - RUA / 2];
  const colXDe = (i, cid) => outraCidade(cid) ? colXBase(i) : colX(i);
  const ehRetPoli = p => !!p && p.length === 4 && p.every((a, i) => { const b = p[(i + 1) % 4]; return Math.abs(a[0] - b[0]) < 1e-6 || Math.abs(a[1] - b[1]) < 1e-6; });
  let corte = null;
  /* (nas cidades-modelo não tem corte: a cidade de cada célula, de cada
     favela e de cada vaga já vem dada; na praça toda de modelo, a cidade
     de hoje inteira sai — `kFora` é ela toda) */
  if (MODELO) {
    const cidadeDe = new Map();
    for (const m of modelos) for (const q of m.cels) cidadeDe.set(q.i + ',' + q.j, m.nome);
    corte = { cidadeDe, kFora: new Set(TODAS ? K.QUADRAS.map(q => q.i + ',' + q.j) : []), somem: new Set(),
              favelas: FAVELAS.map(F => F.cidade || CENTRO), areas: {}, alvos: {}, estadioDeHoje: CENTRO };
  }
  const cidadeDaCelula = id => corte ? (corte.cidadeDe.get(id) || CENTRO) : null;
  const mundoY1 =Math.max(6100, ...polys.map(p => p[1]), ...VAGAS.map(v => areaDaVaga(v).y1)) + 300;
  for (const a of K.AVENIDAS) {
    if (TODAS || SEM_AVENIDA.includes(a.id)) continue;
    const p = a.pontos.map(q => q.slice());
    const n = p.length;
    if (a.id === 'norte') { if (cfg.norteAte != null) p[1] = [p[1][0], cfg.norteAte]; }  // a estrada de entrada do norte
    else if (a.id === 'noroeste' && cfg.norteAte != null) {
      /* o último trecho segue até encontrar a estrada norte: vira um
         entroncamento (no mapa pequeno a estrada norte é a de hoje, e a
         noroeste também) */
      const [xa, ya] = p[n - 2], [xb, yb] = p[n - 1];
      const xn = av('norte').pontos[0][0], s = (xn - xa) / (xb - xa);
      p[n - 1] = [xn, ya + (yb - ya) * s];
    } else if (a.id === 'sudoeste') {
      /* a estrada de entrada do sul: o primeiro ponto desce até a borda nova */
      const [xa, ya] = p[1], [xb, yb] = p[0], yN = mundoY1;
      p[0] = [xb + (xb - xa) * (yN - yb) / (yb - ya), yN];
    } else if (a.id === 'beiramar') {
      /* a beira-mar termina nas duas pontas da orla, com retorno (no
         grande ela sobe até a linha −2; nos outros começa onde começa hoje) */
      const yS = linY(10)[1] + RUA;
      const [xa, ya] = p[n - 2], [xb, yb] = p[n - 1];
      const s = (yS - ya) / (yb - ya);
      p[n - 1] = [xa + (xb - xa) * s, yS];
      if (cfg.beiramarJ != null) p.unshift([p[0][0], linY(cfg.beiramarJ)[0] - RUA / 2]);
    }
    avenidas.push({ id: a.id, l: a.l, pontos: p });
  }
  /* A AVENIDA DE ENTRADA: reta de norte a sul, de ponta a ponta do mapa
     (a ponta do norte acompanha o que o mapa tiver lá em cima: o Atacadex) */
  const avEntrada = { id: 'entrada', l: ENTRADA.l, reta: true, dupla: { pista: RUA, canteiro: CANTEIRO, x0: ENTRADA.x0, x1: ENTRADA.x1 },
                      pontos: [[ENTRADA.xc, (cfg.mundoY0 ?? K.VY0) - 200], [ENTRADA.xc, mundoY1 + 200]] };
  /* (na praça toda de modelo não tem avenida de entrada: cada cidade é ligada à vizinha pela estrada) */
  if (!TODAS) avenidas.push(avEntrada);
  const distSeg = (x, y, [ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
  };
  const distAvenida = (x, y, a) => { let d = Infinity; for (let k = 1; k < a.pontos.length; k++) d = Math.min(d, distSeg(x, y, a.pontos[k - 1], a.pontos[k])); return d; };
  /* `soTortas`: só as que cortam quadra (a de entrada corre na beira dela) */
  const naAvenida = (x, y, m = 0, soTortas = false) => avenidas.some(a => !(soTortas && a.reta) && distAvenida(x, y, a) < a.l / 2 + m);

  const cantos = l => K.cantosDoLote(l).slice(0, 4);
  const bbOf = pts => ({ x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])),
                         y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) });
  const FAV = K.BEIRA.filter(l => l.favela);
  const favBB = bbOf(FAV.flatMap(cantos));

  /* ---- o atacarejo, na estrada norte: de frente pra estrada, antes do pórtico ---- */
  const A0 = K.ATACADEX;
  let atacadex = null;
  if (A0 && cfg.atacadexNoNorte && !TODAS) {
    /* NA AVENIDA DE ENTRADA, ao norte da cidade, do lado do leste e de
       frente pra ela: o estacionamento dá na calçada da avenida. Sobe até
       não encostar em favela nem na cidade */
    const zP = 20;                                                        // o estacionamento: 20 m até a guia
    const W = A0.W, D = A0.D;
    const xa = ENTRADA.x1 + CALC + 30 + zP * M;
    const bbF = FAVELAS.map(F => bbOf(F.poly));
    const naGrade = (x0, x1, y0, y1) => {
      for (const [ci, faixas] of Object.entries(GRADE)) for (const [ja, jb] of faixas) for (let j = ja; j <= jb; j++) {
        const [qx0, qx1] = colX(+ci), [qy0, qy1] = linY(j);
        if (x0 < qx1 + RUA && x1 > qx0 - RUA && y0 < qy1 + RUA && y1 > qy0 - RUA) return true;
      }
      return K.QUADRAS.some(q => x0 < q.x1 + RUA && x1 > q.x0 - RUA && y0 < q.y1 + RUA && y1 > q.y0 - RUA);
    };
    let y1A = Math.min(...K.QUADRAS.map(q => q.y0)) - RUA - 150;
    for (let volta = 0; volta < 60; volta++) {
      const x0 = xa - zP * M - 60, x1 = xa + D * M + 60, y0 = y1A - W * M - 60, y1 = y1A + 60;
      if (!naGrade(x0, x1, y0, y1) && !bbF.some(b => x0 < b.x1 && x1 > b.x0 && y0 < b.y1 && y1 > b.y0)) break;
      y1A -= 100;
    }
    const f = { x0: xa, y0: y1A - W * M };
    f.x1 = f.x0 + D * M; f.y1 = f.y0 + W * M;
    /* a borda do estacionamento agora é reta: as vagas, o totem e os
       postes da guia são refeitos com a mesma conta da planta */
    const m0 = A0.massa;
    const massa = { ...m0, norte: [[0, zP], [W, zP]], zNorte: () => zP };
    massa.vagas = [];
    for (const [z0, z1] of [[2.2, 7.2], [13.0, 18.0]])
      for (let x = m0.E0 + 0.4; x + 2.5 <= m0.E1 - 0.4 + 1e-6; x += 2.5) {
        if (x < m0.faixa.x1 && x + 2.5 > m0.faixa.x0) continue;
        if (zP < z1 + 0.6) continue;
        massa.vagas.push({ x0: x, x1: x + 2.5, z0, z1 });
      }
    massa.totem = { ...m0.totem, z: zP - 1.3 };
    massa.postes = m0.postes.map(p => ({ x: p.x, z: zP - 0.6 }));
    const tt = massa.totem;
    massa.volumes = m0.volumes.slice(0, -1).concat([{ x0: tt.x - tt.larg / 2, x1: tt.x + tt.larg / 2, z0: tt.z - tt.esp / 2, z1: tt.z + tt.esp / 2, alt: tt.alt }]);
    const noMundo = (lx, lz) => [f.x0 - lz * M, f.y0 + lx * M];         // o referencial do marco, frente pro oeste
    const volumes = massa.volumes.map(v => {
      const [ax, ay] = noMundo(v.x0, v.z0), [bx, by] = noMundo(v.x1, v.z1);
      return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: Math.min(ay, by), y1: Math.max(ay, by), alt: v.alt * M, base: (v.base || 0) * M };
    });
    const area = [[f.x0 - zP * M, f.y0], [f.x1, f.y0], [f.x1, f.y1], [f.x0 - zP * M, f.y1]];
    atacadex = { pc: { ...A0, frente: 'o', fatia: f, massa, area, volumes }, area, volumes, bb: bbOf(area) };
  }

  /* ---- os pórticos: onde a estrada cruza a borda da cidade ---- */
  /* (a ponta do norte da avenida passa do Atacadex) */
  if (atacadex) avEntrada.pontos[0][1] = Math.min(avEntrada.pontos[0][1], atacadex.bb.y0 - 400);
  const porticos = [];
  /* (na praça toda de modelo, os pórticos são os das estradas: `afastarCidades`) */
  if (!TODAS) {
    /* nas duas pontas da cidade, na avenida de entrada: a quadra mais ao
       norte e a mais ao sul das duas colunas dela (a da vaga de estádio
       conta), com a rua em volta */
    const cols = [cE, cE + 1], ys0 = [], ys1 = [];
    for (const c of cols) for (const [ja, jb] of GRADE[String(c)] || []) { ys0.push(linY(ja)[0]); ys1.push(linYx(jb)[1]); }
    for (const q of K.QUADRAS) if (cols.includes(q.i)) { ys0.push(q.y0); ys1.push(q.y1); }
    for (const v of VAGAS) { const a = areaDaVaga(v); if (a.x0 < colX(cE + 1)[1] && a.x1 > colX(cE)[0]) { ys0.push(a.y0); ys1.push(a.y1); } }
    const xP = ENTRADA.xc, meiaVao = ENTRADA.l / 2 / M + 1.0;
    porticos.push({ id: 'norte', nome: 'Pórtico da entrada norte', x: xP, y: Math.min(...ys0) - RUA - 88, dir: [0, 1], l: ENTRADA.l, xp: meiaVao, dupla: true });
    porticos.push({ id: 'sul', nome: 'Pórtico da entrada sul', x: xP, y: Math.max(...ys1) + RUA + 88, dir: [0, -1], l: ENTRADA.l, xp: meiaVao, dupla: true });
  }

  /* ---- as células ---- */
  const celulas = [];
  /* (na praça cortada, cada célula sabe a cidade dela) */
  const nova = (i, j, x0, x1, y0, y1, parte, extra) => celulas.push({ i, j, x0, x1, y0, y1, parte: parte || '', ...(corte ? { cidade: cidadeDaCelula(i + ',' + j) } : {}), ...extra });
  const avN = avenidas.find(a => a.id === 'norte'), xn = avN ? avN.pontos[0][0] : -1e9, ln = avN ? avN.l : 0;
  /* a célula que cai na vaga (a da caixa: a que entra nela) não vira quadra */
  const naVaga = (v, i, j) => v.area ? cruza({ x0: colX(i)[0], x1: colX(i)[1], y0: linYx(j)[0], y1: linYx(j)[1] }, v.area, -1)
                                     : i >= v.i[0] && i <= v.i[1] && j >= v.j[0] && j <= v.j[1];
  const noEstadio2 = (i, j) => VAGAS.some(v => naVaga(v, i, j));
  const deHoje = id => K.QUADRAS.find(q => q.i + ',' + q.j === id);
  /* as quadras de hoje que a proposta refaz: a que a avenida tirada
     rasgava (sem a avenida, o rasgo ficaria vazio) e a que se junta
     com uma nova */
  const cortada = q => {
    for (let a = 0; a <= 8; a++) for (let b = 0; b <= 8; b++) {
      const x = q.x0 + (q.x1 - q.x0) * a / 8, y = q.y0 + (q.y1 - q.y0) * b / 8;
      if (avenidasTiradas.some(av => { let d = Infinity; for (let k = 1; k < av.pontos.length; k++) d = Math.min(d, distSeg(x, y, av.pontos[k - 1], av.pontos[k])); return d < av.l / 2 + CALC; })) return true;
    }
    return false;
  };
  /* (e as da coluna da avenida de entrada, que estreita) */
  const substitui = new Set(K.QUADRAS.filter(q => cortada(q) || q.i === cE).map(q => q.i + ',' + q.j));
  /* (e, na praça cortada em cidades, a de hoje que foi pra outra cidade: ela
     é refeita inteira, sem o prédio que tinha — a recortada pela costa
     também —, e vai embora com a cidade dela) */
  if (corte) for (const id of corte.kFora) substitui.add(id);
  /* O QUE A QUADRA REFEITA GUARDA: o prédio que ela tinha (o marco, o
     equipamento), com a casa nova fora dele; a quadra que era toda ele
     (o terreno baldio do lado do estádio) não ganha casa nenhuma */
  const mantemDe = id => {
    if (corte && corte.kFora.has(id)) return null;
    const q = deHoje(id);
    if (!q || !q.equip) return null;
    const e = q.equip;
    const areas = e.tipo === 'marco' ? e.pecas.filter(p => p.k === 'modelo').map(p => p.fatia) : [e.area];
    return { equip: e, areas: areas.filter(Boolean), semCasa: !q.lotes.length };
  };
  for (const par of JUNTAS) for (const id of par) if (deHoje(id)) substitui.add(id);
  const ids = [];
  for (const [ci, faixas] of Object.entries(GRADE)) for (const [ja, jb] of faixas) for (let j = ja; j <= jb; j++) ids.push([+ci, j]);
  /* (na praça toda de modelo, a quadra de hoje sai e não é refeita) */
  if (!TODAS) for (const id of substitui) { const [i, j] = id.split(',').map(Number); if (!ids.some(([a, b]) => a === i && b === j)) ids.push([i, j]); }
  const juntaDe = new Map();
  for (const par of JUNTAS) for (const id of par) juntaDe.set(id, par);
  const feitas = new Set();
  for (const [i, j] of ids) {
    const id = i + ',' + j;
    if (noEstadio2(i, j) || feitas.has(id)) continue;
    const par = juntaDe.get(id);
    if (par) {
      /* as duas viram uma, por cima da rua que as separava */
      const rs = par.map(k => { const [a, b] = k.split(',').map(Number); return [colXDe(a, cidadeDaCelula(par[0])), linY(b)]; });
      const [a0, b0] = par[0].split(',').map(Number);
      nova(a0, b0, Math.min(...rs.map(r => r[0][0])), Math.max(...rs.map(r => r[0][1])),
           Math.min(...rs.map(r => r[1][0])), Math.max(...rs.map(r => r[1][1])), '',
           { id: par.join('+'), rotulo: par[0].split(',')[0] + '+' + par[1].split(',')[0] + ',' + par[0].split(',')[1] +
               (par[0].split(',')[1] !== par[1].split(',')[1] ? '+' + par[1].split(',')[1] : ''),
             juntas: par.slice(), substitui: par.filter(k => deHoje(k)), sal: 3 });
      for (const k of par) feitas.add(k);
      continue;
    }
    feitas.add(id);
    const [x0, x1] = colXDe(i, cidadeDaCelula(id)), [y0, y1] = linY(j);
    if (PARTIDAS.includes(id)) {
      /* a quadra alta com a rua no meio, de norte a sul */
      const xm = (x0 + x1) / 2;
      nova(i, j, x0, xm - RUA / 2, y0, y1, 'o', { sal: 1, partida: true });
      nova(i, j, xm + RUA / 2, x1, y0, y1, 'l', { sal: 2, partida: true });
    } else if (xn > x0 && xn < x1) {
      /* a avenida norte sobe reta pelo meio da coluna do estádio e parte a quadra em duas */
      nova(i, j, x0, xn - ln / 2, y0, y1, 'o', { sal: 1 }); nova(i, j, xn + ln / 2, x1, y0, y1, 'l', { sal: 2 });
    } else if (substitui.has(id) && y1 - y0 > 700 && !mantemDe(id)) {
      /* a quadra alta de hoje refeita: a rua no meio, como as partidas */
      const xm = (x0 + x1) / 2;
      nova(i, j, x0, xm - RUA / 2, y0, y1, 'o', { sal: 1, partida: true, substitui: [id], refeita: true });
      nova(i, j, xm + RUA / 2, x1, y0, y1, 'l', { sal: 2, partida: true, substitui: [id], refeita: true });
    } else nova(i, j, x0, x1, y0, y1, '', substitui.has(id) ? { substitui: [id], refeita: true, mantem: mantemDe(id) } : {});
  }
  /* as quadras das cidades-modelo: a cidade e o bairro de cada uma já vêm dados */
  for (const m of modelos) for (const q of m.cels)
    nova(q.i, q.j, q.x0, q.x1, q.y0, q.y1, '', { cidade: q.cidade, bairro: q.bairro, deModelo: true, ...(q.naFavela ? { naFavela: true } : {}) });
  /* OS ESTÁDIOS, um por vaga ocupada: o quarteirão do estádio de hoje (o
     estádio e a esplanada), deslocado pro meio da vaga. A vaga da caixa
     guarda as células da grade que ela pega (`i`, `j`), pra favela não
     entrar nelas */
  const celulasDe = a => {
    const is = [], js = [];
    for (let i = -12; i <= 6; i++) { const [x0, x1] = colX(i); if (x1 > x0 && x0 < a.x1 - 1 && x1 > a.x0 + 1) is.push(i); }
    for (let j = -8; j <= 16; j++) { const [y0, y1] = linYx(j); if (y1 > y0 && y0 < a.y1 - 1 && y1 > a.y0 + 1) js.push(j); }
    return { i: [Math.min(...is), Math.max(...is)], j: [Math.min(...js), Math.max(...js)] };
  };
  const copias = VAGAS.map((v, k) => {
    const area = areaDaVaga(v), cel = v.deModelo ? { i: [v.ci, v.ci], j: [v.cj, v.cj] } : v.area ? celulasDe(area) : { i: v.i, j: v.j };
    const dx = (area.x0 + area.x1) / 2 - (P.QEST_X0 + P.QEST_X1) / 2, dy = (area.y0 + area.y1) / 2 - (P.QEST_Y0 + P.QEST_Y1) / 2;
    return { id: 'estadio' + (k + 1), vaga: k + 1, nome: v.nome, dx, dy, area, i: cel.i, j: cel.j, principal: k === 0, naGrade: !v.area,
             qest: { x0: P.QEST_X0 + dx, x1: P.QEST_X1 + dx, y0: P.QEST_Y0 + dy, y1: P.QEST_Y1 + dy }, ...(CIS ? { cidade: CIS.estadios[k] || CENTRO } : {}),
             ...(v.deModelo ? { cidade: v.cidade, bairro: v.bairro, deModelo: true } : {}) };
  });
  /* O QUARTEIRÃO DO ESTÁDIO DE HOJE VIRA CASA: quatro quadras, com uma rua
     de norte a sul e uma de leste a oeste no meio (na mesma largura das
     outras). Ficam de 27 × 22 m, perto da quadra comum (35,6 × 17,8) */
  const estadioDeHoje = (() => {
    const X0 = P.QEST_X0, X1 = P.QEST_X1, Y0 = P.QEST_Y0, Y1 = P.QEST_Y1, xm = (X0 + X1) / 2, ym = (Y0 + Y1) / 2, h = RUA / 2;
    /* (na praça toda de modelo a cidade de hoje sai inteira: o quarteirão do estádio dela também) */
    if (TODAS) return { i: null, j: null, x0: X0, x1: X1, y0: Y0, y1: Y1, ruas: [], saiu: true };
    const c0 = K.celulaEm(P.CX, P.CY), ie = c0 && c0.i != null ? c0.i : 4, je = c0 && c0.j != null ? c0.j : 2;
    const partes = [['a', X0, xm - h, Y0, ym - h], ['b', xm + h, X1, Y0, ym - h], ['c', X0, xm - h, ym + h, Y1], ['d', xm + h, X1, ym + h, Y1]];
    partes.forEach(([parte, x0, x1, y0, y1], k) => nova(ie, je, x0, x1, y0, y1, parte, { sal: 4 + k, noEstadioDeHoje: true }));
    /* as duas ruas novas, de guia a guia (a página tira delas o carro parado na boca) */
    return { i: ie, j: je, x0: X0, x1: X1, y0: Y0, y1: Y1,
             ruas: [{ x0: xm - h, x1: xm + h, y0: Y0 - RUA, y1: Y1 + RUA }, { x0: X0 - RUA, x1: X1 + RUA, y0: ym - h, y1: ym + h }] };
  })();
  /* O TERRENO DE VERDADE DE CADA ESTÁDIO. Com `opc.terrenos` (um por
     estádio, na ordem: o terreno do modelo 3D da lotação dele, em metros,
     com o portão 1 no +x — {x0, x1, z0, z1, p1: o z do portão 1}), o
     estádio não é mais a cópia do quarteirão de hoje: é o modelo de
     verdade (js/diajogo/estadios3d.js), que não cabe na vaga (a vaga tem
     77 × 66 m; o de 40 mil pede 284 × 236). Ele sai da vaga pro lado de
     FORA da cidade (`fora`), girado com o PORTÃO 1 DE FRENTE PRA CIDADE,
     no lugar livre mais perto: a rua em volta dele (RUA) pode ser a mesma
     da cidade, mas nada dele pisa em quadra, favela, Atacadex, avenida de
     entrada, na avenida da beira (a praia e a lagoa ficam do outro lado
     dela) nem em outro estádio, e a reta do portão 1 chega numa rua da
     cidade. Procura empurrando pra fora (`d`) e escorregando de lado
     (`b`, que conta a metade); se a vaga dele não tem lugar (ou só muito
     mais longe que a de outro), ele vai pra vaga que tiver. Do portão 1
     sai o ACESSO: a rua reta, de duas pistas, até a primeira rua da
     cidade (quando a rua dele já não é a da cidade). */
  const acessos = [];
  let veraneio = null;
  /* A RUA DE VERANEIO num terreno r virado pra f (o lado de fora; o acesso
     sai da ponta da rua de areia pro lado contrário, o da cidade): as
     medidas, a ponta do acesso e os lotes */
  const VER = VERANEIO_M, LV_VER = (VER.n * VER.lote + 2 * VER.margem) * M, PV_VER = (VER.fundo + VER.rua + VER.fundoSul + 4) * M;
  const MEIO_VER = (2 + VER.fundo + VER.rua / 2) * M;
  const peVeraneio = (r, f) => f === 'o' ? [r.x1, r.y0 + MEIO_VER] : f === 'l' ? [r.x0, r.y0 + MEIO_VER] : f === 'n' ? [r.x0 + MEIO_VER, r.y1] : [r.x0 + MEIO_VER, r.y0];
  const lotesDoVeraneio = (r, f) => {
    const V = VER, hz = f === 'o' || f === 'l', lotes = [];
    let rua;
    if (hz) {
      /* a rua de oeste a leste: os lotes grandes em cima (a frente pro sul), os pequenos embaixo */
      const yN0 = r.y0 + 2 * M, yR0 = yN0 + V.fundo * M, yS0 = yR0 + V.rua * M, x0 = r.x0 + V.margem * M;
      for (let k = 0; k < V.n; k++) lotes.push({ x0: x0 + k * V.lote * M, x1: x0 + (k + 1) * V.lote * M, y0: yN0, y1: yR0, frente: 's', veraneio: k === (V.n >> 1) ? 'festa' : 'norte', k });
      const nS = Math.floor((r.x1 - r.x0 - 2 * V.margem * M) / (V.loteSul * M)), xs0 = (r.x0 + r.x1) / 2 - nS * V.loteSul * M / 2;
      for (let k = 0; k < nS; k++) lotes.push({ x0: xs0 + k * V.loteSul * M, x1: xs0 + (k + 1) * V.loteSul * M, y0: yS0, y1: yS0 + V.fundoSul * M, frente: 'n', veraneio: 'sul', k });
      rua = { x0: r.x0, x1: r.x1, y0: yR0, y1: yS0 };
    } else {
      /* a rua de norte a sul: os lotes grandes no oeste (a frente pro leste), os pequenos no leste */
      const xW0 = r.x0 + 2 * M, xR0 = xW0 + V.fundo * M, xE0 = xR0 + V.rua * M, y0 = r.y0 + V.margem * M;
      for (let k = 0; k < V.n; k++) lotes.push({ x0: xW0, x1: xR0, y0: y0 + k * V.lote * M, y1: y0 + (k + 1) * V.lote * M, frente: 'l', veraneio: k === (V.n >> 1) ? 'festa' : 'norte', k });
      const nS = Math.floor((r.y1 - r.y0 - 2 * V.margem * M) / (V.loteSul * M)), ys0 = (r.y0 + r.y1) / 2 - nS * V.loteSul * M / 2;
      for (let k = 0; k < nS; k++) lotes.push({ x0: xE0, x1: xE0 + V.fundoSul * M, y0: ys0 + k * V.loteSul * M, y1: ys0 + (k + 1) * V.loteSul * M, frente: 'o', veraneio: 'sul', k });
      rua = { x0: xR0, x1: xE0, y0: r.y0, y1: r.y1 };
    }
    return { lotes, rua };
  };
  const entornoBlocos = [];
  if (opc.terrenos) {
    const u = K.pxm(1, 0)[0] - K.pxm(0, 0)[0], y00 = K.pxm(0, 0)[1];
    const bm = avenidas.find(a => a.id === 'beiramar'), lBeira = bm ? bm.l : 76;
    /* a guia oeste da avenida da beira na altura y (pra lá das pontas dela, a mesma distância da costa) */
    const guiaDaBeira = y => K.pxm(K.xCosta((y - y00) / u), 0)[0] - K.PRAIA * u - lBeira;
    const lesteMax = (ya, yb) => { if (!opc.costa || TODAS) return Infinity; let m = Infinity; for (let k = 0; k <= 24; k++) m = Math.min(m, guiaDaBeira(ya + (yb - ya) * k / 24)); return m - CALC; };
    /* (na praça cortada em cidades, cada obstáculo sabe a cidade dele: a reta
       do acesso de um estádio só chega numa rua da cidade do estádio) */
    const obst = celulas.map(c => ({ x0: c.x0, x1: c.x1, y0: c.y0, y1: c.y1, cidade: c.cidade }))
      .concat(K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j)).map(q => ({ x0: q.x0, x1: q.x1, y0: q.y0, y1: q.y1, cidade: CENTRO })))
      .concat(TODAS ? [] : K.BEIRA.filter(l => !l.favela).map(l => ({ ...bbOf(cantos(l)), cidade: CENTRO, ...(CIS ? { barra: true } : {}) })))
      .concat(FAVELAS.map(F => ({ ...bbOf(F.poly), barra: true })))
      .concat(atacadex ? [{ ...atacadex.bb, barra: true }] : []);
    const faixaEntrada = { x0: ENTRADA.x0 - CALC, x1: ENTRADA.x1 + CALC };
    const postos = [];
    /* o terreno r (com a calçada) cabe? a rua dele (RUA) encosta, mas não passa */
    const livre = r => {
      if (!TODAS && r.x0 < faixaEntrada.x1 + RUA && r.x1 > faixaEntrada.x0 - RUA) return false;
      if (r.x1 + RUA > lesteMax(r.y0 - RUA, r.y1 + RUA)) return false;
      for (const o of obst) if (cruza(r, o, RUA - 0.5)) return false;
      for (const o of postos) if (cruza(r, o, RUA - 0.5)) return false;
      return true;
    };
    const ACESSO_MAX = 2600, ACESSO_LADO_MAX = 6000, LONGE_DO_P1 = 25;
    const DIR = { o: [1, 0], l: [-1, 0], n: [0, 1], s: [0, -1] };
    /* (pra cada linha reta — o lado de fora e a coordenada de lado —, os
       trechos do eixo que são alvo ou barra, em ordem: a conta de cada
       portão vira uma busca na lista; a lista muda quando entra estádio) */
    let linhas = new Map();
    /* `cid`: a cidade de quem procura (o que é de outra cidade vira barra; a
       avenida de entrada é do centro) */
    const linha = (f, lat, cid) => {
      const ch = f + lat + '|' + (cid || '');
      if (linhas.has(ch)) return linhas.get(ch);
      const hz = f === 'o' || f === 'l', tr = [];
      const poe = (o, m, tipo) => { const a0 = hz ? o.y0 - m : o.x0 - m, a1 = hz ? o.y1 + m : o.x1 + m; if (lat > a0 && lat < a1) tr.push(hz ? [o.x0 - m, o.x1 + m, tipo, o] : [o.y0 - m, o.y1 + m, tipo, o]); };
      const tipoDe = o => o.barra || (cid && o.cidade && o.cidade !== cid) ? 'barra' : 'alvo';
      for (const o of obst) poe(o, o.barra ? 0 : RUA, tipoDe(o));
      for (const o of postos) poe(o, RUA, tipoDe(o));
      const avenida = !cid || !outraCidade(cid) ? 'alvo' : 'barra', AV = { cidade: CENTRO, avenida: true };
      /* (a praça toda de modelo não tem avenida de entrada) */
      if (TODAS) { /* nada */ }
      else if (!hz) tr.push([-1e7, 1e7, lat > ENTRADA.x0 && lat < ENTRADA.x1 ? avenida : 'nada', AV]);
      else tr.push([ENTRADA.x0, ENTRADA.x1, avenida, AV]);
      const l = tr.filter(t => t[2] !== 'nada');
      linhas.set(ch, l);
      return l;
    };
    /* A RETA DO ACESSO: do portão 1 (na beira do terreno), passando a rua do
       estádio, até a rua da primeira quadra da cidade, a avenida de entrada
       ou a rua de outro estádio; se antes bate em favela ou no Atacadex, ou
       se passa de ACESSO_MAX, o portão 1 não dá pra cidade */
    const reta = (pe, f, max = ACESSO_MAX, cid = null) => {
      const d = DIR[f], hz = f === 'o' || f === 'l', lat = Math.round(hz ? pe[1] : pe[0]);
      const a0 = (hz ? pe[0] : pe[1]) + (hz ? d[0] : d[1]) * RUA, sg = hz ? d[0] : d[1];
      /* o primeiro trecho que a reta encontra, andando no sentido sg a partir de a0 */
      let melhor = null;
      for (const [b0, b1, tipo, o] of linha(f, lat, cid)) {
        const s = sg > 0 ? (b1 <= a0 ? null : Math.max(0, b0 - a0)) : (b0 >= a0 ? null : Math.max(0, a0 - b1));
        if (s === null) continue;
        if (!melhor || s < melhor.s || (s === melhor.s && tipo === 'barra')) melhor = { s, tipo, o };
      }
      if (!melhor || melhor.tipo === 'barra' || melhor.s > max) return null;
      return { ini: hz ? [a0, pe[1]] : [pe[0], a0], s: melhor.s, alvo: melhor.o };
    };
    const PASSO = 40, D_MAX = 7000, B_MAX = 7000, OUTRA_VAGA = 3000;
    /* o terreno de W × H em volta da vaga v: `d` pra fora da beira dela do
       lado da cidade, `b` de lado (a partir do meio dela); `pe(r)`: o portão 1 */
    const procurar = (v, W, H, pe, cid = null) => {
      const a = areaDaVaga(v), f = v.fora, hz = f === 'o' || f === 'l';
      const c = hz ? (a.y0 + a.y1) / 2 : (a.x0 + a.x1) / 2;
      const ret = (d, b) => f === 'o' ? { x0: a.x1 - d - W, x1: a.x1 - d, y0: c + b - H / 2, y1: c + b + H / 2 }
        : f === 'l' ? { x0: a.x0 + d, x1: a.x0 + d + W, y0: c + b - H / 2, y1: c + b + H / 2 }
        : f === 'n' ? { x0: c + b - W / 2, x1: c + b + W / 2, y0: a.y1 - d - H, y1: a.y1 - d }
        : { x0: c + b - W / 2, x1: c + b + W / 2, y0: a.y0 + d, y1: a.y0 + d + H };
      const serve = r => livre(r) && !!reta(pe(r, f), f, ACESSO_MAX, cid);
      let melhor = null;
      for (let d = 0; d <= D_MAX && !(melhor && d >= melhor.custo); d += PASSO)
        for (let k = 0; k * PASSO <= B_MAX; k++) {
          const custo = d + 0.5 * k * PASSO;
          if (melhor && custo >= melhor.custo) break;
          const b = [k * PASSO, -k * PASSO].find(bb => serve(ret(d, bb)));
          if (b !== undefined) { melhor = { r: ret(d, b), d, b, custo, fora: f }; break; }
        }
      return melhor;
    };
    const GIRO = { o: 0, n: 90, s: -90, l: 180 };
    copias.forEach((e, k) => {
      const T = opc.terrenos[k];
      if (!T) return;
      const fundo = (T.x1 - T.x0) * M, frente = (T.z1 - T.z0) * M, p1 = T.p1 || 0;
      /* o portão 1 na beira do terreno r (que tem a calçada em volta), pra cada lado de fora */
      const pe = (r, f) => f === 'o' ? [r.x1, r.y0 + CALC + (p1 - T.z0) * M] : f === 'l' ? [r.x0, r.y0 + CALC + (T.z1 - p1) * M]
        : f === 'n' ? [r.x0 + CALC + (T.z1 - p1) * M, r.y1] : [r.x0 + CALC + (p1 - T.z0) * M, r.y0];
      /* a vaga dele primeiro; a de outro estádio só se a dele não tem lugar
         perto (na praça cortada em cidades, só a de outro estádio da cidade
         dele, e o acesso só chega numa rua da cidade dele; sem lugar assim,
         vale qualquer rua — e fica o aviso) */
      let melhor = null, cid = e.cidade || null;
      for (let volta = 0; volta < 2 && !melhor; volta++, cid = null) {
        for (const j of [k, ...VAGAS.map((_, j) => j).filter(j => j !== k && (!cid || (copias[j].cidade || null) === cid))]) {
          const v = VAGAS[j], hz = v.fora === 'o' || v.fora === 'l';
          const r = procurar(v, (hz ? fundo : frente) + 2 * CALC, (hz ? frente : fundo) + 2 * CALC, pe, cid);
          if (r) r.custo += j === k ? 0 : OUTRA_VAGA;
          if (r && (!melhor || r.custo < melhor.custo)) melhor = { ...r, vaga: j, cid };
        }
        if (!melhor && cid) avisos.push(`o estádio ${e.nome} (${e.cidade}) não achou lugar com o acesso só na cidade dele`);
      }
      if (!melhor) throw new Error(`o estádio ${k + 1} (${fundo / M} × ${frente / M} m) não coube em vaga nenhuma`);
      cid = melhor.cid;
      const q = melhor.r, t = { x0: q.x0 + CALC, x1: q.x1 - CALC, y0: q.y0 + CALC, y1: q.y1 - CALC }, g = GIRO[melhor.fora];
      /* onde fica o (0, 0) do modelo no mundo, com o giro */
      const centro = g === 0 ? [t.x0 - T.x0 * M, t.y0 - T.z0 * M] : g === 90 ? [t.x0 + T.z1 * M, t.y0 - T.x0 * M]
        : g === -90 ? [t.x0 - T.z0 * M, t.y0 + T.x1 * M] : [t.x0 + T.x1 * M, t.y0 + T.z1 * M];
      /* o acesso: a rua de duas pistas do portão 1 até a primeira rua */
      const p = pe(q, melhor.fora), d = DIR[melhor.fora], rt = reta(p, melhor.fora, ACESSO_MAX, cid);
      let acesso = null;
      if (rt && rt.s > 0) {
        acesso = { id: 'acesso' + (k + 1), l: 2 * RUA, reta: true, acesso: true, estadio: e.id,
                   pontos: [[rt.ini[0] - d[0] * RUA / 2, rt.ini[1] - d[1] * RUA / 2], [rt.ini[0] + d[0] * (rt.s + RUA / 2), rt.ini[1] + d[1] * (rt.s + RUA / 2)]] };
        acessos.push(acesso);
      }
      /* OS ACESSOS DE LADO (o dono pediu, 27/09/2026: "Crie mais uma ou duas
         ruas que acessam o estádio pra ajudar a resolver essa logística"):
         de cada lado do estádio — primeiro o do portão 3, do visitante
         (`T.vis`, o lado do z do modelo) —, uma rua reta pra cidade,
         paralela ao acesso do portão 1. Ela sai da rua em volta do estádio,
         na frente, o mais perto da quina daquele lado que der, e a
         LONGE_DO_P1 m ou mais do eixo do portão 1: a torcida do portão 3 (e a
         do 2, do outro lado) chega no dela sem passar na frente do 1. Se a
         rua em volta do estádio já encosta na cidade ali, não precisa */
      const extras = [], hz = melhor.fora === 'o' || melhor.fora === 'l', eixo1 = hz ? p[1] : p[0], vis = T.vis || -1;
      for (const s of [vis, -vis]) {
        /* o lado s (do z do modelo) no mundo, com o giro */
        const L = g === 0 ? [0, s] : g === 90 ? [-s, 0] : g === -90 ? [s, 0] : [0, -s], l = hz ? L[1] : L[0];
        const quina = hz ? (l > 0 ? q.y1 + RUA / 2 : q.y0 - RUA / 2) : (l > 0 ? q.x1 + RUA / 2 : q.x0 - RUA / 2);
        for (let lat = quina; l * (lat - eixo1) >= LONGE_DO_P1 * M; lat -= l * 4 * M) {
          const rt2 = reta(hz ? [p[0], lat] : [lat, p[1]], melhor.fora, ACESSO_LADO_MAX, cid);
          if (!rt2) continue;
          if (rt2.s > 0) extras.push({ id: 'acesso' + (k + 1) + (s === vis ? 'v' : 'm'), l: RUA, reta: true, acesso: true, lateral: true, estadio: e.id,
                                        pontos: [[rt2.ini[0] - d[0] * RUA / 2, rt2.ini[1] - d[1] * RUA / 2], [rt2.ini[0] + d[0] * (rt2.s + RUA / 2), rt2.ini[1] + d[1] * (rt2.s + RUA / 2)]] });
          break;
        }
      }
      acessos.push(...extras);
      const cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2;
      Object.assign(e, { area: q, terreno: t, qest: t, giro: g, centro, fora: melhor.fora, vagaUsada: melhor.vaga + 1, empurrado: melhor.d, deLado: melhor.b,
                         dx: cx - P.CX, dy: cy - P.CY, naGrade: false, modelo: T.modelo, portao1: p, acesso, acessosDeLado: extras });
      if (e.cidade) q.cidade = e.cidade;
      postos.push(q); linhas = new Map();
    });
    /* A RUA DE VERANEIO (o jogo 3D, 27/09/2026): "crie uma rua de casas de
       veraneio em pontas do mapa pra criar a cena de ataque à festa na
       casa com piscina". Uma rua de areia com as casas de muro dos dois
       lados (js/diajogo/veraneio3d.js: do lado de cá os lotes de 20 × 30 m,
       e no meio deles a casa da festa; do outro, os de 16 × 20), numa ponta
       do mapa: a vaga de estádio que a praça não usa (mato) ou, se todas
       estão ocupadas, em volta de uma delas — o mesmo lugar livre que o
       estádio procura, com a rua reta de acesso da ponta dela até a
       primeira rua da cidade */
    {
      const LV = LV_VER, PV = PV_VER, pe = peVeraneio;
      /* (na praça toda de modelo, a vaga vazia do mapa do porte fica no meio do nada: só as dos estádios) */
      const candidatas = (TODAS ? [] : cfg.estadios.filter(v => !VAGAS.includes(v)).map(v => ({ v, vazia: true }))).concat(VAGAS.map(v => ({ v, vazia: false })));
      let melhor = null;
      for (const { v, vazia } of candidatas) {
        const hz = v.fora === 'o' || v.fora === 'l';
        const r = procurar(v, hz ? LV : PV, hz ? PV : LV, pe);
        if (r) { r.custo += vazia ? 0 : 3000; if (!melhor || r.custo < melhor.custo) melhor = r; }
      }
      if (melhor) {
        const r = melhor.r, f = melhor.fora, { lotes, rua: ruaV } = lotesDoVeraneio(r, f);
        /* o acesso: a rua reta, de uma pista pra cada lado, da ponta da rua de areia até a cidade */
        const p0 = pe(r, f), d = DIR[f], rt = reta(p0, f);
        let acesso = null;
        if (rt) {
          acesso = { id: 'acessoVeraneio', l: RUA, reta: true, acesso: true, veraneio: true,
                     pontos: [[p0[0] - d[0] * RUA / 2, p0[1] - d[1] * RUA / 2], [rt.ini[0] + d[0] * (rt.s + RUA / 2), rt.ini[1] + d[1] * (rt.s + RUA / 2)]] };
          acessos.push(acesso);
        }
        veraneio = { area: r, rua: ruaV, lotes, fora: f, acesso, festa: lotes.find(l => l.veraneio === 'festa'), nome: 'Rua de veraneio' };
        /* (na praça cortada, a rua de veraneio é da cidade aonde o acesso dela chega) */
        if (CIS) { veraneio.cidade = (rt && rt.alvo && rt.alvo.cidade) || CENTRO; r.cidade = veraneio.cidade; }
        postos.push(r); linhas = new Map();
      }
    }
    /* O ENTORNO DO ESTÁDIO (veja ENTORNO_M): de cada lado do estádio, a
       faixa do outro lado da rua dele, partida em quarteirões. Os do oeste
       e do leste vão de ponta a ponta (pegam as quinas); os do norte e do
       sul, só o comprido do estádio. Cada quarteirão tem a rua dele em
       volta (a da frente é a do estádio); ele não pisa no que o estádio
       também não pisa (`livre`: a cidade, a favela, o Atacadex, a avenida
       de entrada, a da beira, os outros estádios e o que já foi posto) nem
       nos acessos; o que não cabe inteiro encolhe até ENTORNO_M.minimo, e
       com duas fileiras não cabendo, tenta uma */
    {
      const E = ENTORNO_M, RUA_E = RUA;
      const F2 = 2 * CALC + 2 * E.fileira * M, F1 = 2 * CALC + E.fileiraSo * M;
      const retDaReta = a => {
        const [[ax, ay], [bx, by]] = [a.pontos[0], a.pontos[a.pontos.length - 1]], h = a.l / 2;
        return Math.abs(ax - bx) < 1 ? { x0: ax - h, x1: ax + h, y0: Math.min(ay, by), y1: Math.max(ay, by) }
                                     : { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: ay - h, y1: ay + h };
      };
      const retAcessos = () => acessos.map(retDaReta);
      /* a guia da avenida da beira vale pra toda praça: a de praia tem a
         areia do outro lado; a sem praia, o mato que a planta pinta por cima */
      const lesteDaBeira = (ya, yb) => { if (TODAS) return Infinity; let m = Infinity; for (let k = 0; k <= 24; k++) m = Math.min(m, guiaDaBeira(ya + (yb - ya) * k / 24)); return m - CALC; };
      const semAvenida = r => {
        for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++)
          if (naAvenida(r.x0 + (r.x1 - r.x0) * i / 6, r.y0 + (r.y1 - r.y0) * j / 6, CALC)) return false;
        return true;
      };
      const cabe = r => livre(r) && r.x1 + RUA_E <= lesteDaBeira(r.y0 - RUA_E, r.y1 + RUA_E) && !retAcessos().some(a => cruza(r, a, 0.5)) && semAvenida(r);
      const FRENTE = { o: 'l', l: 'o', n: 's', s: 'n' };
      copias.forEach((e, ke) => {
        if (!e.area) return;
        const q = e.area;
        for (const lado of ['o', 'l', 'n', 's']) {
          const hz = lado === 'n' || lado === 's';          // o quarteirão corre de oeste a leste
          /* o comprido da faixa (no eixo dela) e o fundo (do lado do estádio pra fora) */
          const a0 = hz ? q.x0 : q.y0 - RUA_E - F2, a1 = hz ? q.x1 : q.y1 + RUA_E + F2;
          const n = Math.max(1, Math.round((a1 - a0 + RUA_E) / (E.comprido * M + RUA_E)));
          const L = (a1 - a0 - (n - 1) * RUA_E) / n;
          for (let b = 0; b < n; b++) {
            const c0 = a0 + b * (L + RUA_E), c1 = c0 + L;
            const ret = (F, x0, x1) => lado === 'o' ? { x0: q.x0 - RUA_E - F, x1: q.x0 - RUA_E, y0: x0, y1: x1 }
              : lado === 'l' ? { x0: q.x1 + RUA_E, x1: q.x1 + RUA_E + F, y0: x0, y1: x1 }
              : lado === 'n' ? { x0: x0, x1: x1, y0: q.y0 - RUA_E - F, y1: q.y0 - RUA_E }
              : { x0: x0, x1: x1, y0: q.y1 + RUA_E, y1: q.y1 + RUA_E + F };
            /* o maior pedaço que cabe: inteiro, depois encolhendo por uma
               ponta, pela outra e pelas duas, de 4 em 4 m */
            let achou = null;
            for (const [F, fileiras] of [[F2, 2], [F1, 1]]) {
              for (let corte = 0; !achou && c1 - c0 - corte >= E.minimo * M; corte += 4 * M)
                for (const [d0, d1] of [[0, corte], [corte, 0], [corte / 2, corte / 2]]) {
                  const r = ret(F, c0 + d0, c1 - d1);
                  if (cabe(r)) { achou = { r, fileiras }; break; }
                  if (!corte) break;
                }
              if (achou) break;
            }
            if (!achou) continue;
            const r = achou.r, id = 'entorno' + (ke + 1) + lado + (b + 1);
            if (e.cidade) r.cidade = e.cidade;
            if (e.bairro) r.bairro = e.bairro;
            entornoBlocos.push({ id, i: 60 + ke, j: 60 + ['o', 'l', 'n', 's'].indexOf(lado) * 10 + b, parte: '', ...r,
                                 entorno: { estadio: e.id, nEstadio: ke, lado, frente: FRENTE[lado], fileiras: achou.fileiras, k: b } });
            postos.push(r);
          }
        }
      });
      linhas = new Map();
      /* O ESTACIONAMENTO DE TERRENO: um em cada dois quarteirões, no
         máximo três por estádio e pelo menos um (o primeiro de cada lado
         que tem, pela sorte); só no quarteirão de 24 m ou mais */
      const porEstadio = new Map();
      for (const bl of entornoBlocos) { const k = bl.entorno.nEstadio; if (!porEstadio.has(k)) porEstadio.set(k, []); porEstadio.get(k).push(bl); }
      for (const lista of porEstadio.values()) {
        const comprido = bl => Math.max(bl.x1 - bl.x0, bl.y1 - bl.y0) >= 24 * M;
        const ordem = lista.filter(comprido).sort((a, b) => sorte(a.i, a.j, 31) - sorte(b.i, b.j, 31));
        ordem.slice(0, Math.min(3, Math.max(1, Math.round(ordem.length / 2)))).forEach(bl => { bl.entorno.estacionamento = true; });
      }
    }
    avenidas.push(...acessos);
  }
  /* LONGE DO ESTÁDIO: a quadra de cada estádio da praça; a sede e o bar da
     torcida ficam a LONGE_DO_ESTADIO_M dela ou mais (a distância é de
     caixa a caixa) */
  const estadiosAqui = copias.map(e => e.qest);
  const distDoEstadio = b => Math.min(...estadiosAqui.map(e => Math.hypot(Math.max(e.x0 - b.x1, 0, b.x0 - e.x1), Math.max(e.y0 - b.y1, 0, b.y0 - e.y1))));
  const pertoDeEstadio = b => distDoEstadio(b) < LONGE_DO_ESTADIO_M * M;

  const quadras = [], fora = [];
  for (const c of celulas) {
    const id = c.id || c.i + ',' + c.j + c.parte;
    /* nada de quadra debaixo do atacarejo */
    if (atacadex && cruza(c, atacadex.bb, MARGEM)) { fora.push({ ...c, id, motivo: 'atacadex' }); continue; }
    c.id = id;
    c.ix0 = c.x0 + CALC; c.ix1 = c.x1 - CALC; c.iy0 = c.y0 + CALC; c.iy1 = c.y1 - CALC;
    c.equip = EQUIP[c.i + ',' + c.j] && !c.parte && !c.juntas ? { ...EQUIP[c.i + ',' + c.j] } : null;
    c.lotes = [];
    quadras.push(c);
  }
  for (const e of copias)
    quadras.push({ i: e.i[0], j: e.j[0], parte: '', id: e.id, ...e.area, ...(e.cidade ? { cidade: e.cidade } : {}), ...(e.bairro ? { bairro: e.bairro } : {}), ix0: e.area.x0 + CALC, ix1: e.area.x1 - CALC, iy0: e.area.y0 + CALC, iy1: e.area.y1 - CALC,
                   lotes: [], estadio: e, equip: { tipo: 'estadio', nome: e.nome, cor: '#9d9a90',
                                                   nota: e.principal ? 'O estádio principal da praça: o quarteirão do estádio do jogo, com a esplanada em volta, na ponta da cidade e longe das entradas.'
                                                                     : 'Cópia do quarteirão do estádio, com a esplanada em volta: o estádio de outro clube da cidade, na ponta da cidade.' } });
  for (const b of entornoBlocos)
    quadras.push({ ...b, ix0: b.x0 + CALC, ix1: b.x1 - CALC, iy0: b.y0 + CALC, iy1: b.y1 - CALC, lotes: [], equip: null });

  /* ---- os condomínios: o par de prédios na ponta oeste da quadra alta ---- */
  const baldio = K.QUADRAS.find(q => q.equip && q.equip.pecas.some(p => p.k === 'modelo' && p.modelo === 'torre1'));
  const torres0 = baldio ? baldio.equip.pecas.filter(p => p.k === 'modelo' && /^torre/.test(p.modelo)) : [];
  const volumesDaFatia = (vs, f) => (vs || []).filter(v => v.x0 >= f.x0 - 1 && v.x1 <= f.x1 + 1 && v.y0 >= f.y0 - 1 && v.y1 <= f.y1 + 1);
  const condominios = [];
  for (const cd of CONDOMINIOS) {
    const q = quadras.find(q => q.id === cd.id);
    if (!q || torres0.length < 2) continue;
    const L = 380, meio = q.iy0 + (q.iy1 - q.iy0) / 2;
    const torres = torres0.map(pc => {
      const f = { x0: q.ix0, x1: q.ix0 + L, y0: pc.modelo === 'torre1' ? q.iy0 : meio, y1: pc.modelo === 'torre1' ? meio : q.iy1 };
      const dx = f.x0 - pc.fatia.x0, dy = f.y0 - pc.fatia.y0;
      const volumes = volumesDaFatia(baldio.equip.volumes, pc.fatia).map(v => ({ ...v, x0: v.x0 + dx, x1: v.x1 + dx, y0: v.y0 + dy, y1: v.y1 + dy }));
      return { ...pc, fatia: f, folha: cd.folha, nome: pc.modelo === 'torre1' ? cd.t1 : cd.t2, volumes, condominio: cd.id };
    });
    q.equip = { tipo: 'condominio', nome: 'Condomínio ' + cd.t1.replace('Edifício ', ''), cor: '#b5afa0', torres, cores: cd.cores,
                nota: `${cd.t1} e ${cd.t2}: os mesmos dois prédios do baldio, em ${cd.cores}.` };
    /* a fileira de casas do outro lado, se couber (na coluna da avenida
       de entrada a quadra estreitou: fica só o jardim) */
    const cabeFileira = q.ix1 - q.ix0 - L >= 112 + 40;
    q.faixaLotes = cabeFileira ? { x0: q.ix1 - 112, x1: q.ix1, y0: q.iy0, y1: q.iy1 } : null;
    q.jardim = { x0: q.ix0 + L, x1: cabeFileira ? q.ix1 - 112 : q.ix1, y0: q.iy0, y1: q.iy1 };
    condominios.push({ q, torres, ...cd });
  }

  /* ---- os lotes: a conta do `lotear()`, com hash no lugar do sorteio ---- */
  const tocaAvenida = l => {
    const xs = [l.x0, (l.x0 + l.x1) / 2, l.x1], ys = [l.y0, (l.y0 + l.y1) / 2, l.y1];
    for (const x of xs) for (const y of ys) if (naAvenida(x, y, CALC + 4, true)) return true;
    return false;
  };
  const noEstadio = l => copias.some(e => cruza(l, e.qest, 0));
  const perto = q => q.j <= 0 && q.i >= 3;                      // o norte perto do estádio: mais denso
  const LISTA_NORTE = ['casa', 'sobrado', 'sobrado', 'predio', 'galpao', 'casa', 'sobrado', 'muro'];
  const LISTA_OESTE = ['casa', 'casa', 'casa', 'casa', 'sobrado', 'sobrado', 'muro', 'galpao'];
  const lotear = (q, frentes) => {
    /* as duas metades da quadra partida (e a quadra juntada) têm o
       mesmo i,j: o sal separa o sorteio de uma do da outra */
    const si = q.i, sj = q.j + (q.sal || 0) * 1000;
    frentes.forEach((fr, fi) => {
      const hz = fr.f === 'n' || fr.f === 's';
      const a0 = hz ? fr.x0 : fr.y0, a1 = hz ? fr.x1 : fr.y1;
      if (a1 - a0 < 40) return;
      let a = a0, k = 0;
      while (a < a1 - 24) {
        let larg = par8(entre(72, 144, si, sj, fi, k, 2));
        if (a + larg > a1 - 36) larg = a1 - a;
        const lista = perto(q) ? LISTA_NORTE : LISTA_OESTE;
        const tipo = lista[Math.floor(sorte(si, sj, fi, k, 3) * lista.length)];
        const T = TIPOS[tipo];
        const l = { frente: fr.f, tipo, proposta: true,
                    x0: hz ? a : fr.x0, x1: hz ? a + larg : fr.x1,
                    y0: hz ? fr.y0 : a, y1: hz ? fr.y1 : a + larg,
                    alt: par8(entre(T.alt[0], T.alt[1], si, sj, fi, k, 4)) || T.alt[0],
                    cor: T.cor[hash(si, sj, fi, k, 5) % T.cor.length],
                    quadra: { i: q.i, j: q.j, proposta: true, ix0: q.ix0, ix1: q.ix1, iy0: q.iy0, iy1: q.iy1 } };
        a += larg; k++;
        /* (a quadra de outra cidade vai embora: a avenida daqui não corta ela) */
        if ((!outraCidade(q.cidade) && tocaAvenida(l)) || noEstadio(l)) continue;
        /* o comércio e o recado na parede, na mesma proporção da cidade */
        if (tipo !== 'muro') {
          const r = sorte(si, sj, fi, k, 6);
          if (r < 0.26) l.placa = COMERCIO[hash(si, sj, fi, k, 7) % COMERCIO.length];
          else if (r < 0.46) l.pixacao = RECADOS[hash(si, sj, fi, k, 8) % RECADOS.length];
        } else if (sorte(si, sj, fi, k, 9) < 0.5) l.pixacao = RECADOS[hash(si, sj, fi, k, 8) % RECADOS.length];
        /* uma casa em oito vira casa de muro, se couber o modelo */
        if (tipo === 'casa' && !l.placa && sorte(si, sj, fi, k, 10) < 0.125) {
          const nS = l.frente === 'n' || l.frente === 's';
          const w = (nS ? l.x1 - l.x0 : l.y1 - l.y0) / M, d = (nS ? l.y1 - l.y0 : l.x1 - l.x0) / M;
          const m = ['m1', 'm2', 'm3', 'm4'][hash(si, sj, fi, k, 11) % 4];
          if (w >= MIN_MURO[m][0] && d >= MIN_MURO[m][1]) l.muro = m;
        }
        q.lotes.push(l);
      }
    });
  };
  /* O LOTEAMENTO DO ENTORNO DO ESTÁDIO: a fileira da frente olha pro
     estádio; nela o comércio de dia de jogo (o espetinho, a hamburgueria,
     a pizzaria e o barzinho, um de cada antes de repetir, em cada estádio)
     e o estacionamento de terreno, os dois de rua a rua; o resto é casa,
     de costas pra casa da fileira de trás (a que olha pra rua dos fundos) */
  const vezDoComercio = new Map(), nomeDoComercio = new Map();
  const CASAS_ENTORNO = ['casa', 'casa', 'sobrado', 'casa', 'sobrado', 'casa', 'muro', 'casa'];
  const lotearEntorno = q => {
    const EN = q.entorno, f = EN.frente, hz = f === 'n' || f === 's';
    const a0 = hz ? q.ix0 : q.iy0, a1 = hz ? q.ix1 : q.iy1, b0 = hz ? q.iy0 : q.ix0, b1 = hz ? q.iy1 : q.ix1;
    const naPonta = f === 's' || f === 'l';                  // a frente fica no b1
    const duas = EN.fileiras === 2, bm = (b0 + b1) / 2;
    const FR = naPonta ? [duas ? bm : b0, b1] : [b0, duas ? bm : b1];
    const TR = duas ? (naPonta ? [b0, bm] : [bm, b1]) : null;
    const atras = { n: 's', s: 'n', o: 'l', l: 'o' }[f];
    const si = q.i, sj = q.j;
    const quadra = { i: q.i, j: q.j, proposta: true, entorno: true, ix0: q.ix0, ix1: q.ix1, iy0: q.iy0, iy1: q.iy1 };
    const lote = (a, larg, [c0, c1], frente, extra) => Object.assign({ frente, proposta: true, entorno: true,
      x0: hz ? a : c0, x1: hz ? a + larg : c1, y0: hz ? c0 : a, y1: hz ? c1 : a + larg, quadra }, extra);
    const casa = (a, larg, faixa, frente, k, fi) => {
      const tipo = CASAS_ENTORNO[Math.floor(sorte(si, sj, fi, k, 3) * CASAS_ENTORNO.length)], T = TIPOS[tipo];
      const l = lote(a, larg, faixa, frente, { tipo, alt: par8(entre(T.alt[0], T.alt[1], si, sj, fi, k, 4)) || T.alt[0],
                                                cor: T.cor[hash(si, sj, fi, k, 5) % T.cor.length] });
      const r = sorte(si, sj, fi, k, 6);
      if (tipo !== 'muro' && fi === 0 && r < 0.12) l.placa = COMERCIO[hash(si, sj, fi, k, 7) % COMERCIO.length];
      else if (r < 0.3) l.pixacao = RECADOS[hash(si, sj, fi, k, 8) % RECADOS.length];
      q.lotes.push(l);
    };
    const inteiro = [b0, b1];
    const ocupado = [];                                        // os trechos de rua a rua (comércio, estacionamento)
    /* o estacionamento: num ponto sorteado da frente, se o quarteirão tem */
    let estac = null;
    if (EN.estacionamento) {
      const larg = Math.min(par8(entre(E_M.estacionamento[0], E_M.estacionamento[1], si, sj, 41) * M), a1 - a0 - 2 * 72);
      if (larg >= 12 * M) {
        const ini = a0 + 72 + sorte(si, sj, 42) * Math.max(0, a1 - a0 - 144 - larg);
        estac = [par8(ini), par8(ini) + larg];
      }
    }
    /* a fileira da frente */
    let a = a0, k = 0, nCom = 0;
    while (a < a1 - 24) {
      if (estac && a >= estac[0] - 36) {
        const larg = estac[1] - a;
        const preco = PRECOS_ESTACIONAMENTO[hash(si, sj, 43) % PRECOS_ESTACIONAMENTO.length];
        q.lotes.push(lote(a, larg, inteiro, f, { tipo: 'estacionamento', modelo: 'estacionamento', alt: par8(2.2 * M), cor: '#8d8676',
                                                 placa: 'ESTACIONAMENTO R$ ' + preco, preco, portao: sorte(si, sj, 44) < 0.5 ? 'esq' : 'dir',
                                                 placaFundo: '#f2f1ec', placaTinta: '#1f4e8c' }));
        ocupado.push([a, a + larg]);
        a += larg; k++; estac = null;
        continue;
      }
      const querComercio = nCom < 3 && a1 - a >= E_M.comercio[0] * M && (k === 0 ? sorte(si, sj, k, 51) < 0.55 : sorte(si, sj, k, 52) < 0.34);
      if (querComercio && !(estac && a + E_M.comercio[1] * M > estac[0] - 36)) {
        let larg = par8(entre(E_M.comercio[0], E_M.comercio[1], si, sj, k, 53) * M);
        if (a + larg > a1 - 36) larg = a1 - a;
        const ve = vezDoComercio.get(EN.nEstadio) ?? (hash(EN.nEstadio, 71) % TIPOS_COMERCIO_ENTORNO.length);
        vezDoComercio.set(EN.nEstadio, ve + 1);
        const tipoC = TIPOS_COMERCIO_ENTORNO[ve % TIPOS_COMERCIO_ENTORNO.length], nomes = NOMES_COMERCIO_ENTORNO[tipoC];
        /* o nome: o próximo da lista daquele comércio, no estádio (o mesmo nome não repete perto) */
        const chaveNome = EN.nEstadio + '|' + tipoC, vn = nomeDoComercio.get(chaveNome) ?? (hash(EN.nEstadio, tipoC.length, 72) % nomes.length);
        nomeDoComercio.set(chaveNome, vn + 1);
        const dois = tipoC !== 'espetinho' && sorte(si, sj, k, 54) < 0.45;
        const [placaFundo, placaTinta] = CORES_LETREIRO_ENTORNO[tipoC];
        q.lotes.push(lote(a, larg, inteiro, f, { tipo: 'comercio', comercio: tipoC, modelo: 'com_' + tipoC, placaFundo, placaTinta,
                                                 placa: nomes[vn % nomes.length],
                                                 alt: par8((dois ? 6.2 : 3.9) * M), cor: '#e3c9a0' }));
        ocupado.push([a, a + larg]);
        a += larg; k++; nCom++;
        continue;
      }
      let larg = par8(entre(72, 144, si, sj, 0, k, 2));
      if (estac && a + larg > estac[0] - 36) larg = Math.max(48, estac[0] - a);
      if (a + larg > a1 - 36) larg = a1 - a;
      casa(a, larg, duas ? FR : inteiro, f, k, 0);
      a += larg; k++;
    }
    /* a fileira de trás: casa, fora dos trechos de rua a rua */
    if (TR) {
      const livres = [];
      let p0 = a0;
      for (const [o0, o1] of ocupado.sort((x, y) => x[0] - y[0])) { if (o0 - p0 >= 48) livres.push([p0, o0]); p0 = Math.max(p0, o1); }
      if (a1 - p0 >= 48) livres.push([p0, a1]);
      let kt = 0;
      for (const [l0, l1] of livres) {
        let b = l0;
        while (b < l1 - 24) {
          let larg = par8(entre(72, 144, si, sj, 1, kt, 2));
          if (b + larg > l1 - 36) larg = l1 - b;
          casa(b, larg, TR, atras, kt, 1);
          b += larg; kt++;
        }
      }
    }
  };
  /* as frentes de lote da quadra de casas comum: duas fileiras de costas
     (a do norte e a do sul) e as pontas, com o quintal no meio; a quadra
     rasa, uma fileira só */
  const frentesDaQuadra = q => {
    const largI = q.ix1 - q.ix0, altI = q.iy1 - q.iy0;
    let prof = par8(entre(88, 112, q.i, q.j + (q.sal || 0) * 1000, 1));
    const raso = altI < 2 * prof + 24 || largI < 2 * prof + 24;
    if (raso) prof = Math.min(altI, largI);
    /* a metade da quadra alta partida é estreita e comprida: duas
       fileiras de costas, uma pra cada rua do lado, sem quintal */
    const xm = q.ix0 + largI / 2, ym = q.iy0 + altI / 2;
    const frentes = raso && altI > largI && largI >= 150
      ? [{ f: 'o', x0: q.ix0, x1: xm, y0: q.iy0, y1: q.iy1 }, { f: 'l', x0: xm, x1: q.ix1, y0: q.iy0, y1: q.iy1 }]
      : raso && largI > altI && altI >= 150
      ? [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: ym }, { f: 's', x0: q.ix0, x1: q.ix1, y0: ym, y1: q.iy1 }]
      : raso
      ? (largI >= altI ? [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 }]
                       : [{ f: 'o', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 }])
      : [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy0 + prof },
         { f: 's', x0: q.ix0, x1: q.ix1, y0: q.iy1 - prof, y1: q.iy1 },
         { f: 'o', x0: q.ix0, x1: q.ix0 + prof, y0: q.iy0 + prof, y1: q.iy1 - prof },
         { f: 'l', x0: q.ix1 - prof, x1: q.ix1, y0: q.iy0 + prof, y1: q.iy1 - prof }];
    return { frentes, raso, prof };
  };
  for (const q of quadras) {
    if (q.entorno) { lotearEntorno(q); continue; }
    if (q.equip && q.equip.tipo === 'condominio') {
      const r = q.faixaLotes;
      if (r) lotear(q, [{ f: 'l', x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 }]);
      /* A VERSÃO DE CASAS (o dono, 01/10/2026: "os prédios ficam somente
         em bairros de classe alta"): o terreno das torres e o jardim
         loteados como uma quadra comum — a planta mostra essas casas, e
         não as torres, quando o condomínio não cai num bairro Nobre da
         praça. A fileira do condomínio (a do leste) fica nas duas versões:
         ela é a ponta leste da quadra de casas. O sal separa o sorteio */
      const xF = r ? r.x0 : q.ix1;
      const qc = { i: q.i, j: q.j, sal: (q.sal || 0) + 3, ix0: q.ix0, ix1: xF, iy0: q.iy0, iy1: q.iy1, lotes: [] };
      const { frentes, raso, prof } = frentesDaQuadra(qc);
      lotear(qc, r ? frentes.filter(fr => fr.f !== 'l') : frentes);
      q.casas = { lotes: qc.lotes, quintal: raso ? null : { x0: q.ix0 + prof, x1: r ? xF : xF - prof, y0: q.iy0 + prof, y1: q.iy1 - prof } };
      continue;
    }
    if (q.equip) continue;
    /* a quadra de hoje que era toda o prédio dela (o terreno baldio) */
    if (q.mantem && q.mantem.semCasa) {
      /* AS CASAS NO LUGAR DAS DUAS TORRES DO BALDIO (o dono, 01/10/2026:
         "os prédios ficam somente em bairros de classe alta"): o terreno
         murado delas loteado como uma quadra comum, numa lista à parte —
         a planta mostra essas casas, e não as torres, quando elas não caem
         num bairro Nobre da praça. O lado que dá pro resto do baldio (o dos
         bares) não tem frente */
      const Mr = q.mantem.equip.murado, A = q.mantem.equip.area;
      if (Mr && A) {
        const qc = { i: q.i, j: q.j, sal: (q.sal || 0) + 5, ix0: Mr.x0, ix1: Mr.x1, iy0: Mr.y0, iy1: Mr.y1, lotes: [] };
        const { frentes, raso, prof } = frentesDaQuadra(qc);
        const semFrente = new Set();
        if (Mr.x1 < A.x1 - 10) semFrente.add('l');
        if (Mr.x0 > A.x0 + 10) semFrente.add('o');
        lotear(qc, frentes.filter(fr => !semFrente.has(fr.f)));
        q.casasDoBaldio = { lotes: qc.lotes, area: { ...Mr },
                            quintal: raso ? null : { x0: Mr.x0 + (semFrente.has('o') ? 0 : prof), x1: Mr.x1 - (semFrente.has('l') ? 0 : prof), y0: Mr.y0 + prof, y1: Mr.y1 - prof } };
      }
      continue;
    }
    const largI = q.ix1 - q.ix0, altI = q.iy1 - q.iy0;
    if (largI < 40 || altI < 40) continue;
    const { frentes, raso, prof } = frentesDaQuadra(q);
    lotear(q, frentes);
    if (!raso) q.quintal = { x0: q.ix0 + prof, x1: q.ix1 - prof, y0: q.iy0 + prof, y1: q.iy1 - prof };
    /* a casa nova não pisa no prédio que a quadra refeita guardou */
    if (q.mantem) {
      const pisa = l => q.mantem.areas.some(a => l.x0 < a.x1 + 8 && l.x1 > a.x0 - 8 && l.y0 < a.y1 + 8 && l.y1 > a.y0 - 8);
      q.lotes = q.lotes.filter(l => !pisa(l));
      if (q.quintal && pisa(q.quintal)) q.quintal = null;
      continue;
    }
    /* a avenida que atravessa a quadra na diagonal pode não deixar lote
       nenhum: a sobra vira praça, como já é no centro */
    if (q.lotes.length < 3) {
      q.lotes = []; q.quintal = null;
      q.equip = { tipo: 'praca', nome: 'Praça', cor: '#5f9a4c', nota: 'A avenida corta a quadra na diagonal e não sobra lote: a sobra vira praça.' };
    }
  }

  /* ---- os terrenos pra sede: a fatia sai da quadra (com as casas que
     caíam nela), e o quintal encolhe até a divisa dela. Na quadra de
     hoje (o mapa pequeno) a fatia é a da sede de nível 3 (430), na ponta
     oeste ou leste: o lote de hoje que cai nela sai, e o que só encosta
     é aparado até a divisa ---- */
  const terrenos = [];
  const lotesExtra = [], lotesTirados = new Set();
  const bbLote = l => l.ang ? bbOf(cantos(l)) : l;
  /* a sede de hoje colada num estádio da praça sai (vira casa, mais
     abaixo): no lugar dela, um terreno a mais */
  const sedesDeHoje = K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j) && q.equip && q.equip.tipo === 'sede');
  const sedesHojeSaem = sedesDeHoje.filter(q => pertoDeEstadio(q.equip.area)).map(q => q.i + ',' + q.j);
  const nTerrenos = (cfg.nEspacos ?? TERRENOS_SEDE.length + sedesDeHoje.length) - (sedesDeHoje.length - sedesHojeSaem.length);
  TERRENOS_SEDE.forEach(t => {
    if (terrenos.length >= nTerrenos) return;
    /* o terreno numa quadra de hoje que foi refeita vai pra quadra nova */
    const hoje = !!t.hoje && !substitui.has(t.id);
    const q = hoje ? deHoje(t.id) : quadras.find(q => q.id === t.id);
    if (!q || q.equip || q.mantem) return;
    const Lx = q.ix1 - q.ix0, Ly = q.iy1 - q.iy0;
    const w = hoje ? Math.min(Lx, 430) : Math.min(Lx, Math.max(420, Lx * 0.72));
    if (w < 340 || Ly < 190) return;
    const leste = t.ponta === 'l';
    const area = { x0: leste ? q.ix1 - w : q.ix0, x1: leste ? q.ix1 : q.ix0 + w, y0: q.iy0, y1: q.iy1 };
    /* colado num estádio da praça, não: fica o próximo da lista */
    if (pertoDeEstadio(area)) return;
    if (hoje) {
      for (const l of q.lotes) {
        const b = bbLote(l);
        if (b.x1 <= area.x0 + 0.5 || b.x0 >= area.x1 - 0.5 || b.y1 <= area.y0 + 0.5 || b.y0 >= area.y1 - 0.5) continue;
        lotesTirados.add(l);
        /* o lote reto que passa da divisa fica com o pedaço de fora, se der casa */
        if (l.ang || l.modelo) continue;
        const resto = leste ? { ...l, x1: Math.min(l.x1, area.x0) } : { ...l, x0: Math.max(l.x0, area.x1) };
        if (resto.x1 - resto.x0 < 56) continue;
        delete resto._plano; if (resto.muro) delete resto.muro;
        resto.proposta = true; resto.aparado = true; resto.quadra = { i: q.i, j: q.j, hoje: true };
        lotesExtra.push(resto);
      }
    } else {
      q.lotes = q.lotes.filter(l => l.x1 <= area.x0 + 0.5 || l.x0 >= area.x1 - 0.5 || l.y1 <= area.y0 + 0.5 || l.y0 >= area.y1 - 0.5);
      if (q.quintal) { q.quintal = { ...q.quintal, x0: Math.max(q.quintal.x0, area.x1) }; if (q.quintal.x1 - q.quintal.x0 < 20) q.quintal = null; }
    }
    const n = terrenos.length + 1;
    const T = { n, nome: 'Terreno para sede ' + n, frente: t.frente, onde: t.onde, area, quadra: hoje ? t.id : q.id, emQuadraDeHoje: hoje,
                longeDoEstadio: distDoEstadio(area) / M };
    if (!hoje) q.terreno = T;                 // (a quadra de hoje é da planta, a mesma pros três mapas: não se mexe nela)
    terrenos.push(T);
  });
  /* OS TERRENOS DAS CIDADES-MODELO: um por sede do bairro, na quadra dele
     mais longe dos estádios, na ponta dela mais longe; na favela com sede,
     na quadra comum da quina dela */
  for (const m of modelos) for (const B of m.bairros) {
    const quer = B.favela ? B.deSede : B.sedes;
    if (!quer) continue;
    const cand = [];
    for (const q of quadras) {
      if (q.bairro !== B.id || !q.deModelo || q.equip || q.terreno || !q.lotes.length) continue;
      const Lx = q.ix1 - q.ix0, Ly = q.iy1 - q.iy0, w = Math.min(Lx, Math.max(420, Lx * 0.72));
      if (w < 340 || Ly < 190) continue;
      for (const leste of [false, true]) {
        const area = { x0: leste ? q.ix1 - w : q.ix0, x1: leste ? q.ix1 : q.ix0 + w, y0: q.iy0, y1: q.iy1 };
        if (!pertoDeEstadio(area)) cand.push({ q, area, leste, d: distDoEstadio(area) });
      }
    }
    cand.sort((a, b) => b.d - a.d || a.q.i - b.q.i || a.q.j - b.q.j || a.leste - b.leste);
    let n = 0;
    for (const c of cand) {
      if (n >= quer) break;
      const { q, area, leste } = c;
      if (q.terreno) continue;
      q.lotes = q.lotes.filter(l => l.x1 <= area.x0 + 0.5 || l.x0 >= area.x1 - 0.5 || l.y1 <= area.y0 + 0.5 || l.y0 >= area.y1 - 0.5);
      if (q.quintal) {
        q.quintal = leste ? { ...q.quintal, x1: Math.min(q.quintal.x1, area.x0) } : { ...q.quintal, x0: Math.max(q.quintal.x0, area.x1) };
        if (q.quintal.x1 - q.quintal.x0 < 20) q.quintal = null;
      }
      const k = terrenos.length + 1;
      const T = { n: k, nome: 'Terreno para sede ' + k, frente: (q.j % 2) ? 's' : 'n', onde: B.nome, area, quadra: q.id, emQuadraDeHoje: false,
                  longeDoEstadio: distDoEstadio(area) / M, bairro: B.id, cidade: m.nome };
      q.terreno = T; terrenos.push(T); n++;
    }
    if (n < quer) avisos.push(`${m.nome}: o bairro ${B.nome} ficou com ${n} de ${quer} terreno(s) de sede`);
  }

  /* ---- OS BARES DA TORCIDA: dezoito, espalhados pela cidade toda ----
     O bar grande de hoje (13,9 × 8,8 m, o salão inteiro numa fatia da
     quadra) sai das quadras 2,8 e 5,1: a fatia dele vira casa, com a
     mesma conta do lote novo, e o resto da quadra fica como está. No
     lugar, dezoito bares pequenos de esquina — o bar da torcida
     embaixo do apartamento, 7,4 m de frente e o fundo da fileira, do
     tamanho do bar da favela. Os dois primeiros ficam nas quadras dos
     bares de hoje; os outros, um a um, na esquina que fica mais longe
     de todo bar já posto (dá um a cada três quadras, mais ou menos).
     Quem ocupa cada um a página é que diz, pela cidade escolhida: bar
     que nenhuma torcida usa fica neutro, de porta fechada. */
  const BARES_HOJE = ['2,8', '5,1'], N_BARES = cfg.nBares, LARG_BAR = 144;
  const deHojeSem = K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j));
  /* a fatia do bar grande: as fileiras da conta do lotear, no fundo das
     que já existem na quadra, só onde não tem lote (`so`: só dentro dessa
     caixa — a sede de hoje que sai vira casa só no lugar dela) */
  const viraCasa = (q, sal, marca, so = null, destino = lotesExtra) => {
    const fundos = q.lotes.filter(l => !l.ang && (l.frente === 'n' || l.frente === 's')).map(l => l.y1 - l.y0);
    const prof = Math.max(88, ...fundos);
    const ocup = q.lotes.map(bbLote);
    let fileiras = [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy0 + prof }, { f: 's', x0: q.ix0, x1: q.ix1, y0: q.iy1 - prof, y1: q.iy1 },
                    { f: 'o', x0: q.ix0, x1: q.ix0 + prof, y0: q.iy0 + prof, y1: q.iy1 - prof }, { f: 'l', x0: q.ix1 - prof, x1: q.ix1, y0: q.iy0 + prof, y1: q.iy1 - prof }];
    if (so) fileiras = fileiras.map(fr => ({ ...fr, x0: Math.max(fr.x0, so.x0), x1: Math.min(fr.x1, so.x1), y0: Math.max(fr.y0, so.y0), y1: Math.min(fr.y1, so.y1) }))
                               .filter(fr => fr.x1 - fr.x0 > 40 && fr.y1 - fr.y0 > 40);
    const livres = [];
    for (const fr of fileiras) {
      const hz = fr.f === 'n' || fr.f === 's';
      const tomados = ocup.filter(b => cruza(b, fr, -2)).map(b => hz ? [b.x0, b.x1] : [b.y0, b.y1]).sort((a, b) => a[0] - b[0]);
      let a = hz ? fr.x0 : fr.y0;
      const fim = hz ? fr.x1 : fr.y1;
      for (const [t0, t1] of tomados.concat([[fim, fim]])) {
        if (t0 - a >= 60) livres.push(hz ? { ...fr, x0: a, x1: t0 } : { ...fr, y0: a, y1: t0 });
        a = Math.max(a, t1);
      }
    }
    const qx = { i: q.i, j: q.j, sal, lotes: [] };
    lotear(qx, livres);
    for (const l of qx.lotes) { l.quadra = { i: q.i, j: q.j, hoje: true }; l[marca] = true; destino.push(l); }
  };
  for (const id of BARES_HOJE) {
    const q = deHojeSem.find(q => q.i + ',' + q.j === id);
    if (!q || !q.equip || q.equip.tipo !== 'bar') continue;
    viraCasa(q, 7, 'fatiaDoBar');
  }
  /* a sede de hoje que saiu (colada num estádio) vira casa no lugar dela */
  for (const q of deHojeSem) if (sedesHojeSaem.includes(q.i + ',' + q.j)) viraCasa(q, 8, 'fatiaDaSede', q.equip.area);
  /* AS CASAS NO LUGAR DO PRÉDIO ALTO DO CENTRO (o dono, 01/10/2026: "os
     prédios ficam somente em bairros de classe alta"): a fatia dele
     loteada como a da sede de hoje que sai, numa lista à parte — a planta
     mostra essas casas, e não o prédio, quando ele não cai num bairro
     Nobre da praça */
  const lotesDoPredio = [];
  for (const q of deHojeSem) if (q.equip && q.equip.tipo === 'marco' && q.equip.modelo === 'predio') viraCasa(q, 9, 'casaDoPredio', q.equip.area, lotesDoPredio);
  /* (e o terreno murado das duas torres do baldio, quando a quadra dele
     fica como era; a quadra refeita tem as dela em `casasDoBaldio`) */
  const lotesDoBaldio = [];
  for (const q of deHojeSem) if (q.equip && q.equip.tipo === 'baldio' && q.equip.murado) viraCasa(q, 10, 'casaDoBaldio', q.equip.murado, lotesDoBaldio);
  /* as esquinas: o lote da ponta da fileira norte ou sul, rente à quina
     da quadra, com fundo de casa (não de lote de avenida) */
  const esquinas = [];
  const fileiraDe = (lista, q, fr) => lista.filter(l => !l.ang && l.frente === fr && !l.modelo &&
    (fr === 'n' ? Math.abs(l.y0 - q.iy0) < 2 : Math.abs(l.y1 - q.iy1) < 2)).sort((a, b) => a.x0 - b.x0);
  const juntar = (q, hoje, lista) => {
    for (const fr of ['n', 's']) {
      const fila = fileiraDe(lista, q, fr);
      if (!fila.length) continue;
      for (const lado of ['o', 'l']) {
        const pta = lado === 'o' ? fila[0] : fila[fila.length - 1];
        if (lado === 'o' ? Math.abs(pta.x0 - q.ix0) > 2 : Math.abs(pta.x1 - q.ix1) > 2) continue;
        /* fundo de fileira de casa: nem o lote raso de avenida, nem a
           quadra rasa de uma fileira só, que daria um salão de 12 m */
        if (pta.y1 - pta.y0 < 84 || pta.y1 - pta.y0 > 130) continue;
        /* a fileira tem de dar o bar e um lote de sobra */
        if (fila[fila.length - 1].x1 - fila[0].x0 < LARG_BAR + 60) continue;
        esquinas.push({ q, hoje, fr, lado, fila, lista, x: lado === 'o' ? q.ix0 : q.ix1, y: fr === 'n' ? q.iy0 : q.iy1,
                        id: q.id || (q.i + ',' + q.j) });
      }
    }
  };
  for (const q of quadras) if (!q.equip && q.lotes.length) juntar(q, false, q.lotes);
  for (const q of deHojeSem) {
    const id = q.i + ',' + q.j, extra = lotesExtra.filter(l => l.quadra.i === q.i && l.quadra.j === q.j);
    if (q.equip && !BARES_HOJE.includes(id)) continue;
    const deHojeFica = q.lotes.filter(l => !lotesTirados.has(l));                  // sem os que o terreno tirou
    if (deHojeFica.length + extra.length) juntar(q, true, deHojeFica.concat(extra));
  }
  /* o bar da torcida também não fica colado em estádio: a esquina (a caixa
     do bar, a partir da quina) perto de um estádio da praça sai da conta */
  const caixaDoBar = e => ({ x0: e.lado === 'o' ? e.x : e.x - LARG_BAR, x1: e.lado === 'o' ? e.x + LARG_BAR : e.x,
                             y0: e.fr === 'n' ? e.y : e.y - 110, y1: e.fr === 'n' ? e.y + 110 : e.y });
  for (let k = esquinas.length - 1; k >= 0; k--) if (pertoDeEstadio(caixaDoBar(esquinas[k]))) esquinas.splice(k, 1);
  /* a escolha: os dois das quadras dos bares de hoje (a esquina mais
     perto da fatia do bar grande) e depois a mais longe de todos */
  const escolhidas = [];
  for (const id of BARES_HOJE) {
    const q = deHojeSem.find(q => q.i + ',' + q.j === id);
    const cand = esquinas.filter(e => e.hoje && e.id === id);
    if (!q || !q.equip || !cand.length) continue;
    const a = q.equip.area, cx = (a.x0 + a.x1) / 2, cy = (a.y0 + a.y1) / 2;
    escolhidas.push(cand.sort((e, f) => Math.hypot(e.x - cx, e.y - cy) - Math.hypot(f.x - cx, f.y - cy))[0]);
  }
  /* NAS CIDADES-MODELO, uma esquina em cada bairro de quadras: a mais perto
     do meio do bloco dele (o resto, quando falta, a página faz das casas) */
  let nModelo = 0;
  if (MODELO) for (const m of modelos) for (const B of m.bairros) {
    if (B.favela) continue;
    const u = B.bloco, cx = (u.x0 + u.x1) / 2, cy = (u.y0 + u.y1) / 2;
    const cand = esquinas.filter(e => e.q.bairro === B.id && e.q.deModelo && !escolhidas.some(o => o.q === e.q))
      .sort((e, f) => Math.hypot(e.x - cx, e.y - cy) - Math.hypot(f.x - cx, f.y - cy) || e.x - f.x || e.y - f.y);
    if (cand.length) { escolhidas.push(cand[0]); nModelo++; }
  }
  /* (os do mapa do porte: na praça toda de modelo, nenhum) */
  while (escolhidas.length < (TODAS ? 0 : N_BARES) + nModelo) {
    let melhor = null, md = -1;
    for (const e of esquinas) {
      if (MODELO && e.q.deModelo) continue;
      if (escolhidas.some(o => o.q === e.q)) continue;
      const d = Math.min(...escolhidas.map(o => Math.hypot(o.x - e.x, o.y - e.y)));
      if (d > md + 1e-6) { md = d; melhor = e; }
    }
    if (!melhor) break;
    escolhidas.push(melhor);
  }
  /* o corte: o bar pega a ponta da fileira; o lote que fica no meio do
     caminho é aparado. Se a sobra dele dá menos de 56 (2,9 m), o bar
     fica com ele inteiro (até 9 m de frente) ou encolhe até sobrar 56 */
  const bares = [];
  escolhidas.forEach((e, k) => {
    const oeste = e.lado === 'o', fila = oeste ? e.fila.slice() : e.fila.slice().reverse();
    const larg = l => l.x1 - l.x0;
    let acc = 0, n = 0;
    while (n < fila.length && acc < LARG_BAR) acc += larg(fila[n++]);
    const ultimo = fila[n - 1];
    const w = acc - LARG_BAR >= 56 ? LARG_BAR : acc <= 176 ? acc : acc - 56;
    const x0 = oeste ? e.q.ix0 : e.q.ix1 - w, x1 = oeste ? e.q.ix0 + w : e.q.ix1;
    const { y0, y1 } = fila[0];
    const tira = l => {
      if (e.hoje && !l.proposta) lotesTirados.add(l);
      else { const lista = e.hoje ? lotesExtra : e.q.lotes; const i = lista.indexOf(l); if (i >= 0) lista.splice(i, 1); }
    };
    for (let i = 0; i < n; i++) tira(fila[i]);
    if (acc > w) {
      /* o lote aparado: o de hoje sai e entra a cópia dele, mais estreita */
      const resto = { ...ultimo, x0: oeste ? x1 : ultimo.x0, x1: oeste ? ultimo.x1 : x0, proposta: true, aparado: true };
      delete resto._plano;
      if (resto.muro) delete resto.muro;
      (e.hoje ? lotesExtra : e.q.lotes).push(resto);
      if (e.hoje && !resto.quadra) resto.quadra = { i: e.q.i, j: e.q.j, hoje: true };
    }
    /* a esquina na mão de quem olha a fachada: de frente pro norte, o
       oeste fica à direita */
    const esquina = (e.fr === 'n') === oeste ? 'dir' : 'esq';
    const bar = { tipo: 'sobrado', modelo: 'bartorcida', frente: e.fr, esquina, x0, x1, y0, y1, alt: par8(6.7 * M),
                  cor: '#b9ae98', proposta: true, bar: k + 1, quadra: { i: e.q.i, j: e.q.j, hoje: e.hoje || undefined } };
    (e.hoje ? lotesExtra : e.q.lotes).push(bar);
    bares.push({ n: k + 1, lote: bar, quadra: e.id, hoje: e.hoje, x: (x0 + x1) / 2, y: (y0 + y1) / 2,
                 nome: 'Bar ' + (k + 1), noLugarDoBarGrande: BARES_HOJE.includes(e.id) });
  });

  /* ---- O METRÔ: a entrada na ponta da quadra, a estação embaixo dela
     e o túnel de uma à outra ----
     A ENTRADA é o terreno da ponta da quadra, de uma rua à outra: sai o
     lote da ponta de cada fileira (e o do meio, quando tem); o vizinho
     que fica com menos de 56 (2,9 m) entra no terreno, o que sobra mais
     que isso é aparado até a divisa. O quintal encolhe junto.
     A ESTAÇÃO é o salão da plataforma embaixo da quadra, de ponta a
     ponta e passando 3 m debaixo das ruas do lado; o trilho corre do
     lado da rua de onde o povo desce. O TÚNEL sai da ponta da estação e chega na
     ponta da outra, em curva (uma Bézier que sai e chega no rumo do
     trilho). */
  const metroEstacoes = [];
  (METRO ? METRO.estacoes : []).forEach((E, k) => {
    const q = quadras.find(q => q.id === E.id);
    if (!q || q.equip || !q.lotes.length) return;
    const leste = E.ponta === 'l';
    if (E.entra !== (leste ? 'n' : 's')) throw new Error('metrô: a entrada da ponta ' + E.ponta + ' desce de ' + (leste ? 'n' : 's'));
    let W = METRO.LARG_ENTRADA;
    const faixa = () => leste ? { x0: q.ix1 - W, x1: q.ix1 } : { x0: q.ix0, x1: q.ix0 + W };
    for (let volta = 0; volta < 6; volta++) {
      const f = faixa();
      let cresceu = false;
      for (const l of q.lotes) {
        if (l.x1 <= f.x0 + 0.5 || l.x0 >= f.x1 - 0.5) continue;
        const sobra = leste ? f.x0 - l.x0 : l.x1 - f.x1;
        if (sobra > 0.5 && sobra < 56) { W += sobra; cresceu = true; }
      }
      if (!cresceu) break;
    }
    const f = faixa(), entrada = { x0: f.x0, x1: f.x1, y0: q.iy0, y1: q.iy1 };
    const lotes = [];
    for (const l of q.lotes) {
      if (l.x1 <= f.x0 + 0.5 || l.x0 >= f.x1 - 0.5) { lotes.push(l); continue; }
      const sobra = leste ? f.x0 - l.x0 : l.x1 - f.x1;
      if (sobra < 0.5) continue;                              // cai inteiro no terreno
      const resto = { ...l, x0: leste ? l.x0 : f.x1, x1: leste ? f.x0 : l.x1, aparado: true };
      delete resto._plano;
      if (resto.muro) delete resto.muro;
      lotes.push(resto);
    }
    q.lotes = lotes;
    if (q.quintal) {
      q.quintal = leste ? { ...q.quintal, x1: Math.min(q.quintal.x1, f.x0) } : { ...q.quintal, x0: Math.max(q.quintal.x0, f.x1) };
      if (q.quintal.x1 - q.quintal.x0 < 20) q.quintal = null;
    }
    const ym = (q.y0 + q.y1) / 2, larg = METRO.LARG_SALAO * M, sobra = METRO.SOBRA_SALAO * M;
    const salao = { x0: q.x0 - sobra, x1: q.x1 + sobra, y0: ym - larg / 2, y1: ym + larg / 2 };
    /* a estação da ponta oeste é a da ponta leste girada 180°: o trilho
       fica do lado de onde o povo desce (a plataforma e o mezanino, do
       outro), e o túnel sai sempre pela ponta da entrada */
    const giro = !leste;
    const trilhoY = giro ? salao.y1 - (0.4 + 2.3) * M : salao.y0 + (0.4 + 2.3) * M;
    const est = { n: k + 1, nome: E.nome, completo: 'Estação ' + E.nome, quadra: q.id, ponta: E.ponta, entra: E.entra, onde: E.onde,
                  entrada, salao, trilhoY, giro, parada: { x: (salao.x0 + salao.x1) / 2, y: trilhoY },
                  profundidade: METRO.PROF_PLATAFORMA, mezanino: METRO.PROF_MEZANINO };
    q.estacao = est;
    metroEstacoes.push(est);
  });
  /* o caminho do trem: a plataforma de uma, o túnel e a plataforma da
     outra, em pontos (x, y) de mundo, de 20 em 20 */
  let metro = null;
  if (metroEstacoes.length === 2) {
    const [A, B] = metroEstacoes[0].parada.x < metroEstacoes[1].parada.x ? metroEstacoes : metroEstacoes.slice().reverse();
    const P0 = [A.salao.x1, A.trilhoY], P3 = [B.salao.x0, B.trilhoY];
    const d = Math.hypot(P3[0] - P0[0], P3[1] - P0[1]), kk = d * 0.42;
    const P1 = [P0[0] + kk, P0[1]], P2 = [P3[0] - kk, P3[1]];
    const bez = t => { const u = 1 - t; return [0, 1].map(i => u * u * u * P0[i] + 3 * u * u * t * P1[i] + 3 * u * t * t * P2[i] + t * t * t * P3[i]); };
    const caminho = [[A.salao.x0 + 1.5 * M, A.trilhoY]];
    for (let x = A.salao.x0 + 1.5 * M + 20; x < P0[0]; x += 20) caminho.push([x, A.trilhoY]);
    for (let i = 0; i <= 160; i++) caminho.push(bez(i / 160));
    for (let x = P3[0] + 20; x < B.salao.x1 - 1.5 * M; x += 20) caminho.push([x, B.trilhoY]);
    caminho.push([B.salao.x1 - 1.5 * M, B.trilhoY]);
    const acum = [0];
    for (let i = 1; i < caminho.length; i++) acum.push(acum[i - 1] + Math.hypot(caminho[i][0] - caminho[i - 1][0], caminho[i][1] - caminho[i - 1][1]));
    /* onde o trem para em cada uma: o meio do salão */
    const total = acum[acum.length - 1];
    A.km = A.parada.x - caminho[0][0];                        // a plataforma é reta: a distância é a do x
    B.km = total - (caminho[caminho.length - 1][0] - B.parada.x);
    metro = { nome: METRO.nome, cor: METRO.cor, estacoes: [A, B], caminho, acum, comprimento: total,
              tunel: Math.hypot(P3[0] - P0[0], P3[1] - P0[1]) };
  }

  /* ---- AS LOJAS DO ASSALTO (o dono, 30/09/2026: "o assalto ser
     executado pelo jogador com todos os ambientes sendo entráveis"): o
     banco, a joalheria, o supermercado e o posto no terreno da PONTA de
     uma quadra, do fundo inteiro (de rua a rua: a frente numa rua, a
     porta do lado na rua da ponta, o fundo na de trás); o mercadinho e a
     loja de roupas na fileira da esquina, como o bar. Uma por quadra, e
     cada tipo numa distância do meio da cidade (o banco e a joalheria no
     centro, o posto na beira), longe de estádio e umas das outras. O
     modelo e a planta de cada uma: js/diajogo/lojas3d.js ---- */
  /* (as largas primeiro: no mapa pequeno, quadra larga é pouca) */
  const LOJAS = [
    { tipo: 'supermercado', larg: 16.4, inteiro: true, alvo: 0.45 }, { tipo: 'posto', larg: 16.4, inteiro: true, alvo: 0.8 },
    { tipo: 'banco', larg: 14.2, inteiro: true, alvo: 0.05 }, { tipo: 'joalheria', larg: 8.6, inteiro: true, alvo: 0.2 },
    { tipo: 'roupas', larg: 8.2, inteiro: false, alvo: 0.32 }, { tipo: 'mercadinho', larg: 7.4, inteiro: false, alvo: 0.62 }
  ];
  const NOMES_LOJA = {
    banco: ['BANCO POPULAR', 'BANCO DO POVO', 'BANCO CENTRAL DA VILA'], joalheria: ['JOALHERIA OURO FINO', 'JOIAS BRILHANTE', 'JOALHERIA IMPERIAL'],
    supermercado: ['SUPERMERCADO BOM PREÇO', 'SUPERMERCADO ECONOMIA', 'SUPERMERCADO DA VILA'], posto: ['AUTO POSTO ESTRELA', 'POSTO CAMINHO', 'AUTO POSTO AVENIDA'],
    mercadinho: ['MERCADINHO SÃO JORGE', 'MERCEARIA DO ZÉ', 'MERCADINHO BOA VISTA'], roupas: ['MODAS & CIA', 'BOUTIQUE ESTILO', 'LOJA DA MODA']
  };
  const FUNDO_LOJA = { banco: '#1f4e8c', joalheria: '#2b2b2e', supermercado: '#c62828', posto: '#2e7d32', mercadinho: '#2f7a46', roupas: '#8e3a7a' };
  const lojas = [];
  {
    /* o meio da cidade: o meio das quadras (na praça toda de modelo, o de
       cada cidade; na de duas, as lojas ficam na grande) */
    const semLoja = q => MODELO && !TODAS && q.deModelo;
    const grupoLoja = q => TODAS ? (q.cidade || CENTRO) : '';
    const meios = new Map();
    for (const q of quadras.concat(deHojeSem)) {
      if (semLoja(q)) continue;
      const g = grupoLoja(q);
      if (!meios.has(g)) meios.set(g, []);
      meios.get(g).push(q);
    }
    for (const [g, todas] of meios) {
      const cxM = todas.reduce((a, q) => a + (q.x0 + q.x1) / 2, 0) / todas.length, cyM = todas.reduce((a, q) => a + (q.y0 + q.y1) / 2, 0) / todas.length;
      meios.set(g, { cxM, cyM, raioM: Math.max(1, ...todas.map(q => Math.hypot((q.x0 + q.x1) / 2 - cxM, (q.y0 + q.y1) / 2 - cyM))) });
    }
    const usadas = new Set();
    /* as pontas candidatas: quadra de fileiras (o quintal no meio), sem equipamento, terreno, estação ou bar */
    const pontas = [];
    const lotesDe = (q, hoje) => hoje ? q.lotes.filter(l => !lotesTirados.has(l)).concat(lotesExtra.filter(l => l.quadra && l.quadra.i === q.i && l.quadra.j === q.j)) : q.lotes;
    for (const [lista, hoje] of [[quadras, false], [deHojeSem, true]]) for (const q of lista) {
      if (q.equip || q.mantem || q.terreno || q.estacao || q.parte || semLoja(q)) continue;
      const ls = lotesDe(q, hoje);
      if (!ls.length || ls.some(l => l.ang)) continue;
      const Ly = q.iy1 - q.iy0, Lx = q.ix1 - q.ix0;
      if (Ly < 190 || Ly > 300 || Lx < 400) continue;
      if (ls.some(l => l.modelo === 'bartorcida')) continue;
      for (const ponta of ['o', 'l']) pontas.push({ q, hoje, ponta, id: q.id || (q.i + ',' + q.j), ls });
    }
    const sorteLoja = (t, k) => { let h = 2166136261 >>> 0; const s2 = t + '|' + k + '|' + (cfg.id || ''); for (let i = 0; i < s2.length; i++) { h ^= s2.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
    LOJAS.forEach((Lj, n) => {
      const w = Math.round(Lj.larg * M);
      let melhor = null, nota = Infinity;
      for (const P of pontas) {
        if (usadas.has(P.id)) continue;
        const { q, ponta } = P, leste = ponta === 'l';
        if (q.ix1 - q.ix0 < w + 100) continue;
        /* a fileira da esquina: a do norte ou a do sul (a do fundo raso, como a do bar) */
        const prof = Math.max(88, ...P.ls.filter(l => !l.ang && (l.frente === 'n' || l.frente === 's')).map(l => l.y1 - l.y0));
        const fr = (sorteLoja(Lj.tipo, P.id) % 2) ? 'n' : 's';
        const area = { x0: leste ? q.ix1 - w : q.ix0, x1: leste ? q.ix1 : q.ix0 + w,
                       y0: Lj.inteiro || fr === 'n' ? q.iy0 : q.iy1 - prof, y1: Lj.inteiro || fr === 's' ? q.iy1 : q.iy0 + prof };
        if (pertoDeEstadio(area)) continue;
        /* nada de lote especial no terreno (a casa grande da favela, o bar, a sede) */
        if (P.ls.some(l => l.modelo && cruza(bbLote(l), area, -2))) continue;
        const { cxM, cyM, raioM } = meios.get(grupoLoja(q));
        const cx = (area.x0 + area.x1) / 2, cy = (area.y0 + area.y1) / 2, d = Math.hypot(cx - cxM, cy - cyM) / raioM;
        /* longe das outras lojas: menos de 180 m pesa muito */
        const perto = lojas.reduce((a, o) => a + Math.max(0, 180 * M - Math.hypot(o.x - cx, o.y - cy)) / (180 * M), 0);
        const v = Math.abs(d - Lj.alvo) + perto * 2 + (P.hoje ? 0.08 : 0) + (sorteLoja(Lj.tipo, P.id + ponta) % 1000) / 1e5;
        if (v < nota) { nota = v; melhor = { P, area, fr }; }
      }
      if (!melhor) return;
      const { P, area, fr } = melhor, { q, hoje, ponta } = P, leste = ponta === 'l';
      const { cxM, cyM, raioM } = meios.get(grupoLoja(q));
      usadas.add(P.id);
      /* o corte: o lote que cai no terreno sai; o que só encosta é aparado (se sobra casa) */
      const tira = l => {
        if (hoje && !l.proposta) lotesTirados.add(l);
        else { const lst = hoje ? lotesExtra : q.lotes; const i = lst.indexOf(l); if (i >= 0) lst.splice(i, 1); }
      };
      for (const l of P.ls.slice()) {
        const b = bbLote(l);
        if (!cruza(b, area, -0.5)) continue;
        tira(l);
        if (l.ang || l.modelo) continue;
        /* a sobra do lado de dentro da quadra */
        const resto = leste ? { ...l, x1: Math.min(l.x1, area.x0) } : { ...l, x0: Math.max(l.x0, area.x1) };
        if (resto.x1 - resto.x0 < 56 || resto.y1 - resto.y0 < 56) continue;
        delete resto._plano; if (resto.muro) delete resto.muro;
        resto.proposta = true; resto.aparado = true;
        if (hoje) { resto.quadra = { i: q.i, j: q.j, hoje: true }; lotesExtra.push(resto); } else q.lotes.push(resto);
      }
      if (Lj.inteiro && !hoje && q.quintal) {
        q.quintal = leste ? { ...q.quintal, x1: Math.min(q.quintal.x1, area.x0) } : { ...q.quintal, x0: Math.max(q.quintal.x0, area.x1) };
        if (q.quintal.x1 - q.quintal.x0 < 20) q.quintal = null;
      }
      /* a esquina na mão de quem olha a fachada (a conta do bar) */
      const esquina = (fr === 'n') === !leste ? 'dir' : 'esq';
      const nomes = NOMES_LOJA[Lj.tipo], nome = nomes[sorteLoja(Lj.tipo, 'nome') % nomes.length];
      const lote = { tipo: 'loja', modelo: 'loja_' + Lj.tipo, frente: fr, esquina, ...area, alt: par8(4.4 * M), cor: '#d9d6cf', proposta: true,
                     placa: nome, placaFundo: FUNDO_LOJA[Lj.tipo], placaTinta: '#ffffff',
                     loja: { tipo: Lj.tipo, n: n + 1, nome }, quadra: { i: q.i, j: q.j, hoje: hoje || undefined } };
      (hoje ? lotesExtra : q.lotes).push(lote);
      lojas.push({ tipo: Lj.tipo, n: n + 1, nome, lote, quadra: P.id, hoje, x: (area.x0 + area.x1) / 2, y: (area.y0 + area.y1) / 2,
                   inteiro: Lj.inteiro, noCentro: +(Math.hypot((area.x0 + area.x1) / 2 - cxM, (area.y0 + area.y1) / 2 - cyM) / raioM).toFixed(2) });
    });
  }

  /* ---- OS ESPAÇOS DE SEDE: os sete terrenos e as duas sedes de hoje
     (a 2,9 é a fatia de nível 3; a 5,2, a de nível 1 — ali só cabe a
     sede pequena). A página é que diz quem mora em cada um. ---- */
  const espacosSede = terrenos.map(t => ({ id: 'terreno' + t.n, nome: t.nome, area: t.area, frente: t.frente, cabe: 5, hoje: false, quadra: t.quadra, terreno: t,
                                          emQuadraDeHoje: !!t.emQuadraDeHoje }));
  for (const q of deHojeSem) if (q.equip && q.equip.tipo === 'sede' && !sedesHojeSaem.includes(q.i + ',' + q.j))
    espacosSede.push({ id: 'sede' + q.i + ',' + q.j, nome: 'Sede da quadra ' + q.i + ',' + q.j, area: { ...q.equip.area }, frente: q.equip.frente,
                       cabe: q.equip.nivel === 1 ? 1 : 5, hoje: true, quadra: q.i + ',' + q.j, equip: q.equip });

  /* ---- AS FAVELAS: primeiro a grade de ruas, casando com a da cidade;
     depois as casas nos quarteirões que ela deixa ----
     A grade da favela É a da cidade. Cada rua da cidade segue dentro da
     favela na mesma linha, só que estreita: a viela de 48 (2,5 m) no
     meio da faixa da rua. Onde a favela encosta numa quadra da cidade,
     a rua da cidade é a borda dela, e a casa dá direto pra rua. Cada
     quarteirão da grade que cai na favela vira miolo de favela, com a
     conta da favela da planta:
     - faixas de 86 a 124 de fundo separadas por beco de 32 a 42;
     - um ou dois becos de norte a sul (que às vezes não cortam a faixa);
     - em cada faixa, duas fileiras de costas, casa encostada na casa
       (42 a 66 de frente), cada uma virada pro seu beco.
     A mancha que o dono desenhou recorta as casas do lado do mato. */
  /* (o terreno do estádio de verdade tem a rua dele inteira em volta: ele não é da grade) */
  /* (a quadra da cidade-modelo também: a grade dela é toda no mesmo passo, e a da cidade de hoje não vale pra ela) */
  for (const q of quadras) q.rua = (q.estadio && q.estadio.modelo) || q.entorno || q.deModelo ? { x0: q.x0 - RUA, x1: q.x1 + RUA, y0: q.y0 - RUA, y1: q.y1 + RUA } : ruaDe(q);
  const barra = quadras.map(q => q.rua)
    .concat(K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j)).map(q => ruaDe(q)))
    .concat((TODAS ? [] : K.BEIRA).filter(l => !l.favela).map(l => bbOf(cantos(l))).filter(b => {
      /* a casa de beira que a proposta tira (debaixo da grade nova, ou
         longe de toda estrada que sobrou) não segura a favela */
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      const coberta = quadras.some(q => cx > q.x0 - RUA && cx < q.x1 + RUA && cy > q.y0 - RUA && cy < q.y1 + RUA);
      return !coberta && avenidas.some(a => distAvenida(cx, cy, a) <= a.l / 2 + 260);
    }).map(b => ({ x0: b.x0 - 30, x1: b.x1 + 30, y0: b.y0 - 30, y1: b.y1 + 30 })))
    .concat(atacadex ? [{ x0: atacadex.bb.x0 - 60, x1: atacadex.bb.x1 + 60, y0: atacadex.bb.y0 - 60, y1: atacadex.bb.y1 + 60 }] : [])
    /* no mapa pequeno o atacarejo e a favela de hoje ficam: a favela nova não pisa neles */
    .concat(!atacadex && A0 ? [(b => ({ x0: b.x0 - 60, x1: b.x1 + 60, y0: b.y0 - 60, y1: b.y1 + 60 }))(bbOf(A0.area))] : [])
    .concat(cfg.favelaDeHoje ? FAV.map(l => bbOf(cantos(l))).map(b => ({ x0: b.x0 - 20, x1: b.x1 + 20, y0: b.y0 - 20, y1: b.y1 + 20 })) : []);
  const ruasDoEntorno = new Set(quadras.filter(q => q.entorno).map(q => q.rua));
  const livre = (x, y) => !barra.some(r => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) && !naAvenida(x, y, CALC + 10) &&
                          !porticos.some(p => Math.hypot(p.x - x, p.y - y) < 280);
  const faixaX = i => [colX(i)[1], colX(i + 1)[0]];                   // a faixa da rua entre a coluna i e a i+1
  const faixaY = j => [linYx(j)[1], linYx(j + 1)[0]];
  const meioX = i => (faixaX(i)[0] + faixaX(i)[1]) / 2, meioY = j => (faixaY(j)[0] + faixaY(j)[1]) / 2;
  /* onde a grade já é cidade: quadra nova, quadra de hoje, estádio, campo */
  const ocupadas = new Set();
  for (const q of quadras) {
    /* (a vaga da caixa não bate com a grade: a célula que ela pega só em
       parte continua da favela, e a rua em volta do estádio, que está na
       `barra`, segura a casa) */
    if (q.estadio) { if (q.estadio.naGrade) for (let i = q.estadio.i[0]; i <= q.estadio.i[1]; i++) for (let j = q.estadio.j[0]; j <= q.estadio.j[1]; j++) ocupadas.add(i + ',' + j); }
    else if (q.entorno) { /* (fora da grade) */ }
    else if (q.juntas) for (const id of q.juntas) ocupadas.add(id);
    else ocupadas.add(q.i + ',' + q.j);
  }
  for (const q of K.QUADRAS) if (!substitui.has(q.i + ',' + q.j)) ocupadas.add(q.i + ',' + q.j);
  /* (na praça toda de modelo, o campo e o estádio de hoje saíram com a cidade de hoje) */
  if (!TODAS) for (let i = 0; i < K.grade.length; i++) for (let j = 0; j < (K.grade[i] || []).length; j++) {
    const c = K.grade[i][j];
    if (!c || (c.tipo !== 'estadio' && c.tipo !== 'campo')) continue;
    ocupadas.add(i + ',' + j);
    /* a rua em volta do campo (e do estádio) também é cidade: sem isso a
       árvore da favela do sul caía no asfalto de baixo do campo da 2,10 */
    const [x0, x1] = colX(i), [y0, y1] = linY(j);
    barra.push(ruaDe({ x0, x1, y0, y1 }));
  }
  const cidade = (i, j) => ocupadas.has(i + ',' + j);
  const VIELA = 48;
  const tomadas = new Set();                                            // a célula é de uma favela só
  /* a grade da favela: a da cidade de hoje e das quadras novas, ou (a favela
     do bairro de uma cidade-modelo) a da cidade dela */
  const GRADE_FAVELA = { colX, linYx, meioX, meioY, i0: -10, i1: 5, j0: -6, j1: 16 };
  const gradeDaFavela = G => {
    const meio = (f, k) => (f(k)[1] + f(k + 1)[0]) / 2;
    return { colX: G.colX, linYx: G.linY, meioX: i => meio(G.colX, i), meioY: j => meio(G.linY, j), i0: G.i0, i1: G.i1, j0: G.j0, j1: G.j1 };
  };
  const favelas = FAVELAS.map(F => gerarFavela(F));
  function gerarFavela(F) {
    const { colX, linYx, meioX, meioY, i0: I0, i1: I1, j0: J0, j1: J1 } = F.grade ? gradeDaFavela(F.grade) : GRADE_FAVELA;
    let est = F.semente >>> 0;
    const rnd = () => {                                                  // mulberry32: sorteio próprio, semente fixa
      est = (est + 0x6D2B79F5) >>> 0; let t = est;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const ent = (a, b) => a + rnd() * (b - a), esc = l => l[Math.floor(rnd() * l.length)];
    /* A MANCHA: o traço do dono e, junto, a faixa estreita entre ele e a
       cidade (o ponto de fora cuja distância até a mancha mais a
       distância até a rua não passa de GAP), pra não sobrar mato entre
       a favela e a rua */
    const GAP = 340;
    const distPoly = (x, y) => { let d = Infinity; for (let i = 0, j = F.poly.length - 1; i < F.poly.length; j = i++) d = Math.min(d, distSeg(x, y, F.poly[j], F.poly[i])); return d; };
    /* (a rua do entorno do estádio segura a casa, mas não puxa a favela:
       sem isso ela crescia até a rua nova e mudava de tamanho) */
    const distBarra = (x, y) => { let d = Infinity; for (const r of barra) { if (ruasDoEntorno.has(r)) continue; const dx = Math.max(r.x0 - x, 0, x - r.x1), dy = Math.max(r.y0 - y, 0, y - r.y1); d = Math.min(d, Math.hypot(dx, dy)); } return d; };
    const naArea = (x, y) => dentroPol(x, y, F.poly) || distPoly(x, y) + distBarra(x, y) <= GAP;
    const bb0 = bbOf(F.poly), bb = { x0: bb0.x0 - GAP, x1: bb0.x1 + GAP, y0: bb0.y0 - GAP, y1: bb0.y1 + GAP };
    const C = F.caixa, naCaixa = (x, y) => !C || (x >= C.x0 && x <= C.x1 && y >= C.y0 && y <= C.y1);
    const dentro = (x, y) => naCaixa(x, y) && naArea(x, y) && livre(x, y);
    const cabe = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [(x0 + x1) / 2, (y0 + y1) / 2]].every(([x, y]) => dentro(x, y));
    /* a casa que bate na rua da cidade é aparada até a guia */
    const encaixar = (x0, x1, y0, y1) => {
      for (let it = 0; it < 4; it++) {
        const r = barra.find(r => x0 < r.x1 && x1 > r.x0 && y0 < r.y1 && y1 > r.y0);
        if (!r) break;
        const ops = [];
        if (r.x0 > x0) ops.push([x0, r.x0, y0, y1]);
        if (r.x1 < x1) ops.push([r.x1, x1, y0, y1]);
        if (r.y0 > y0) ops.push([x0, x1, y0, r.y0]);
        if (r.y1 < y1) ops.push([x0, x1, r.y1, y1]);
        const ok = ops.filter(([a, b, c, d]) => b - a >= 32 && d - c >= 36)
                      .sort((p, q) => (q[1] - q[0]) * (q[3] - q[2]) - (p[1] - p[0]) * (p[3] - p[2]));
        if (!ok.length) return null;
        [x0, x1, y0, y1] = ok[0];
      }
      return [x0, x1, y0, y1];
    };

    /* 1. OS QUARTEIRÕES: as células da grade que caem na mancha e não são
       cidade nem de outra favela */
    const cels = [];
    for (let i = I0; i <= I1; i++) for (let j = J0; j <= J1; j++) {
      if (cidade(i, j) || tomadas.has(i + ',' + j)) continue;
      const [x0, x1] = colX(i), [y0, y1] = linYx(j);
      if (x1 < bb.x0 || x0 > bb.x1 || y1 < bb.y0 || y0 > bb.y1) continue;
      let alguma = false;
      for (let a = 0; a <= 6 && !alguma; a++) for (let b = 0; b <= 6 && !alguma; b++)
        if (dentro(x0 + (x1 - x0) * a / 6, y0 + (y1 - y0) * b / 6)) alguma = true;
      if (alguma) cels.push({ i, j, x0, x1, y0, y1 });
    }
    for (const c of cels) tomadas.add(c.i + ',' + c.j);
    /* a borda de cada quarteirão: rua da cidade do lado de lá → a borda é
       a guia (a casa dá pra rua); senão, a viela corre no meio da faixa
       e o quarteirão avança até ela */
    for (const c of cels) {
      c.sb = { x0: cidade(c.i - 1, c.j) ? c.x0 : meioX(c.i - 1) + VIELA / 2, x1: cidade(c.i + 1, c.j) ? c.x1 : meioX(c.i) - VIELA / 2,
               y0: cidade(c.i, c.j - 1) ? c.y0 : meioY(c.j - 1) + VIELA / 2, y1: cidade(c.i, c.j + 1) ? c.y1 : meioY(c.j) - VIELA / 2 };
    }

    /* 2. AS VIELAS DA GRADE: a continuação das ruas da cidade, de cruzamento a cruzamento */
    const vielas = new Map();
    for (const c of cels) {
      const { i, j } = c;
      if (!cidade(i - 1, j)) vielas.set('v' + (i - 1) + ',' + j, [[meioX(i - 1), meioY(j - 1)], [meioX(i - 1), meioY(j)]]);
      if (!cidade(i + 1, j)) vielas.set('v' + i + ',' + j, [[meioX(i), meioY(j - 1)], [meioX(i), meioY(j)]]);
      if (!cidade(i, j - 1)) vielas.set('h' + i + ',' + (j - 1), [[meioX(i - 1), meioY(j - 1)], [meioX(i), meioY(j - 1)]]);
      if (!cidade(i, j + 1)) vielas.set('h' + i + ',' + j, [[meioX(i - 1), meioY(j)], [meioX(i), meioY(j)]]);
    }

    /* 3. O MIOLO: cada quarteirão em faixas, com os becos */
    const blocos = [], becosMiolo = [];
    for (const c of cels) {
      const sb = c.sb, H = sb.y1 - sb.y0, W = sb.x1 - sb.x0;
      if (H < 60 || W < 60) continue;
      const n = Math.max(1, Math.round((H + 37) / (112 + 37)));
      const gs = Array.from({ length: n - 1 }, () => Math.round(ent(32, 42)));
      const b = (H - gs.reduce((a, v) => a + v, 0)) / n;
      const nv = W > 560 ? (rnd() < 0.5 ? 1 : 2) : W > 330 ? 1 : 0;
      const xs = [];
      for (let k = 1; k <= nv; k++) xs.push(par8(sb.x0 + W * k / (nv + 1) + ent(-36, 36)));
      const gv = xs.map(() => Math.round(ent(32, 42)));
      let y = sb.y0;
      for (let k = 0; k < n; k++) {
        const v0 = y, v1 = y + b;
        const ext0 = k ? gs[k - 1] / 2 : 14, ext1 = k < n - 1 ? gs[k] / 2 : 14;
        let u = sb.x0;
        xs.forEach((x, m) => {
          if (rnd() > 0.82) return;                                        // o beco que não corta esta faixa
          blocos.push({ v0, v1, u0: u, u1: x - gv[m] / 2, c });
          becosMiolo.push({ pts: [[x, v0 - ext0], [x, v1 + ext1]], w: gv[m] });
          u = x + gv[m] / 2;
        });
        blocos.push({ v0, v1, u0: u, u1: sb.x1, c });
        if (k < n - 1) { becosMiolo.push({ pts: [[sb.x0 - 14, v1 + gs[k] / 2], [sb.x1 + 14, v1 + gs[k] / 2]], w: gs[k] }); y = v1 + gs[k]; }
      }
    }

    /* o campinho de terra, no quarteirão mais perto do meio da mancha que o comporte */
    let campinho = null;
    {
      const cx = F.poly.reduce((a, p) => a + p[0], 0) / F.poly.length, cy = F.poly.reduce((a, p) => a + p[1], 0) / F.poly.length;
      let melhor = Infinity;
      for (const c of cels) {
        const sb = c.sb, r = { x0: sb.x0 + 24, x1: sb.x0 + 24 + 360, y0: sb.y0 + 12, y1: sb.y0 + 12 + 200 };
        if (r.x1 > sb.x1 - 24 || r.y1 > sb.y1 - 12) continue;
        const d = Math.hypot((r.x0 + r.x1) / 2 - cx, (r.y0 + r.y1) / 2 - cy);
        if (d < melhor && cabe(r.x0 - 20, r.x1 + 20, r.y0 - 20, r.y1 + 20)) { melhor = d; campinho = r; }
      }
    }
    const noCampinho = (x0, x1, y0, y1) => !!campinho && x0 < campinho.x1 + 18 && x1 > campinho.x0 - 18 && y0 < campinho.y1 + 18 && y1 > campinho.y0 - 18;

    /* 4. AS CASAS GRANDES da favela: guardam o pedaço delas (a faixa inteira, de beco a beco) */
    const reservas = [], lotes = [];
    const conta = new Map();
    for (let rodada = 0; rodada < 8; rodada++) for (const md of CASAS_GRANDES) {
      if ((conta.get(md) || 0) >= md.n || !blocos.length) continue;
      for (let t = 0; t < 60; t++) {
        const bl = blocos[Math.floor(rnd() * blocos.length)];
        if ((bl.v1 - bl.v0) / M < md.d) continue;
        const w = par8(ent(md.w[0], md.w[1]) * M);
        const ponta = md.esquina ? (rnd() < 0.5 ? 'oeste' : 'leste') : null;
        const u0 = ponta === 'oeste' ? bl.u0 : ponta === 'leste' ? bl.u1 - w : par8(ent(bl.u0 + 60, bl.u1 - 60 - w));
        const u1 = u0 + w;
        if (u0 < bl.u0 || u1 > bl.u1 || !cabe(u0, u1, bl.v0, bl.v1) || noCampinho(u0, u1, bl.v0, bl.v1)) continue;
        if (reservas.some(r => r.bl === bl && u0 < r.u1 + 8 && u1 > r.u0 - 8)) continue;
        const cx = (u0 + u1) / 2, cy = (bl.v0 + bl.v1) / 2;
        if (reservas.some(r => Math.hypot(r.cx - cx, r.cy - cy) < (r.md === md ? md.longe : (md.perto || 8)) * M)) continue;
        reservas.push({ bl, u0, u1, md, ponta, cx, cy });
        conta.set(md, (conta.get(md) || 0) + 1);
        break;
      }
    }

    /* 5. AS CASAS, nos pedaços que sobram */
    const casa = (x0, x1, y0, y1, fr) => {
      if (!cabe(x0, x1, y0, y1)) {
        const e = encaixar(x0, x1, y0, y1);
        if (!e || !cabe(...e)) return;
        [x0, x1, y0, y1] = e;
      }
      if (noCampinho(x0, x1, y0, y1)) return;
      /* a mesma altura, cobertura e parede da favela da planta */
      let alt = par8(ent(52, 74));
      if (rnd() < 0.34) alt += par8(ent(28, 46));
      if (rnd() < 0.10) alt += par8(ent(26, 40));
      const r = rnd(), tipo = r < 0.68 ? 'casa' : r < 0.88 ? 'barraco' : 'galpao';
      const telha = tipo === 'casa' ? esc(TELHAS_FAVELA) : tipo === 'barraco' ? esc(LAJES_FAVELA) : '#9aa0a2';
      const p = rnd(), parede = p < 0.44 ? 'tijolo' : p < 0.68 ? 'reboco' : 'pintada';
      const l = { tipo, frente: fr, x0, x1, y0, y1, alt, cor: esc(CORES_FAVELA[parede]), telha, parede, favela: true, proposta: true };
      if (rnd() < 0.42) { l.pixacao = esc(GRAFITE_FAVELA); l.pixoTinta = esc(TINTAS_PIXO); }
      lotes.push(l);
    };
    const fileira = (u0, u1, y0, y1, fr) => {
      let u = u0;
      while (u < u1 - 32) {
        let w = Math.min(par8(ent(42, 66)), u1 - u);
        if (u1 - u - w < 32) w = u1 - u;
        if (w < 32) break;
        casa(u, u + w, y0, y1, fr);
        /* o vão entre duas casas é ou nada ou viela */
        u += w + (rnd() < 0.08 ? par8(ent(40, 56)) : ent(-1, 3));
      }
    };
    for (const bl of blocos) {
      const BV = bl.v1 - bl.v0;
      const dA = par8(BV * ent(0.42, 0.58));
      const linhas = BV < 88 ? [[bl.v0, bl.v1, rnd() < 0.5 ? 'n' : 's']] : [[bl.v0, bl.v0 + dA, 'n'], [bl.v0 + dA, bl.v1, 's']];
      const rs = reservas.filter(r => r.bl === bl).sort((p, q) => p.u0 - q.u0);
      const trechos = [];
      let u = bl.u0;
      for (const r of rs) { if (r.u0 - u > 32) trechos.push([u, r.u0]); u = r.u1; }
      if (bl.u1 - u > 32) trechos.push([u, bl.u1]);
      for (const [a0, a1] of trechos) for (const [y0, y1, fr] of linhas) fileira(a0, a1, y0, y1, fr);
    }
    for (const r of reservas) {
      const fr = rnd() < 0.5 ? 'n' : 's', md = r.md;
      const l = { tipo: md.tipo, frente: fr, x0: r.u0, x1: r.u1, y0: r.bl.v0, y1: r.bl.v1, alt: Math.round(md.alt * M),
                  cor: esc(CORES_FAVELA[md.parede]), telha: esc(TELHAS_FAVELA), parede: md.parede, favela: true, proposta: true, modelo: md.modelo };
      /* o lado da esquina, na mão de quem olha a fachada */
      if (r.ponta) l.esquina = (r.ponta === 'oeste') === (fr === 's') ? 'esq' : 'dir';
      if (rnd() < 0.42) { l.pixacao = esc(GRAFITE_FAVELA); l.pixoTinta = esc(TINTAS_PIXO); }
      lotes.push(l);
    }

    /* 6. O CHÃO DAS RUAS: a viela e o beco só onde tem casa do lado */
    const balde = new Map(), B = 120;
    for (const l of lotes) for (let a = Math.floor(l.x0 / B); a <= Math.floor(l.x1 / B); a++) for (let b = Math.floor(l.y0 / B); b <= Math.floor(l.y1 / B); b++) {
      const k = a + ',' + b; if (!balde.has(k)) balde.set(k, []); balde.get(k).push(l);
    }
    const temCasaPerto = (x, y, r) => {
      for (let a = Math.floor((x - r) / B); a <= Math.floor((x + r) / B); a++) for (let b = Math.floor((y - r) / B); b <= Math.floor((y + r) / B); b++)
        for (const l of balde.get(a + ',' + b) || []) if (x > l.x0 - r && x < l.x1 + r && y > l.y0 - r && y < l.y1 + r) return true;
      return false;
    };
    const becos = [];
    const recortar = (pts, w) => {
      const [[ax, ay], [bx, by]] = pts, L = Math.hypot(bx - ax, by - ay), N = Math.max(1, Math.ceil(L / 16));
      let atual = null;
      for (let k = 0; k <= N; k++) {
        const x = ax + (bx - ax) * k / N, y = ay + (by - ay) * k / N;
        const vale = temCasaPerto(x, y, w / 2 + 30) && !noCampinho(x, x, y, y);
        if (vale) { if (!atual) { atual = []; atual.w = w; becos.push(atual); } atual.push([x, y]); }
        else atual = null;
      }
    };
    for (const pts of vielas.values()) recortar(pts, VIELA);
    for (const bc of becosMiolo) recortar(bc.pts, bc.w);
    for (let k = becos.length - 1; k >= 0; k--) if (becos[k].length < 2) becos.splice(k, 1);

    /* umas árvores no que sobra: longe da casa e do beco */
    const arvores = [];
    const noBeco = (x, y) => becos.some(b => distSeg(x, y, b[0], b[b.length - 1]) < b.w / 2 + 12);
    for (let t = 0; t < 800 && arvores.length < 12; t++) {
      const x = ent(bb.x0, bb.x1), y = ent(bb.y0, bb.y1), r = ent(12, 19);
      if (!dentro(x, y) || noBeco(x, y) || noCampinho(x - r, x + r, y - r, y + r) || temCasaPerto(x, y, r + 6)) continue;
      arvores.push({ x, y, r });
    }
    const bbL = lotes.length ? bbOf(lotes.flatMap(l => [[l.x0, l.y0], [l.x1, l.y1]])) : bb0;
    return { id: F.id, nome: F.nome, poly: F.poly, lotes, becos, arvores, moitas: [], campinho, bb: bbL, ...(F.bairro ? { bairro: F.bairro } : {}),
             grandes: reservas.length, quarteiroes: cels.length };
  }

  /* ---- o que a proposta cobre (pra esconder o mato, a beira e a favela de hoje) ---- */
  const coberto = (x, y, folga = RUA / 2) => quadras.some(q => x > q.x0 - folga && x < q.x1 + folga && y > q.y0 - folga && y < q.y1 + folga);
  const naFavelaNova = (x, y) => favelas.some(f => dentroPol(x, y, f.poly));

  /* ---- A CISÃO, 2: AS CIDADES AFASTADAS, AS ESTRADAS E OS PÓRTICOS ----
     Com tudo gerado no lugar de antes, cada cidade de fora vai pro lado
     dela: sai do meio da vizinha (`de`) e anda no `rumo` até ficar a
     VAO_CIDADES_M (o dobro na `longe`, o triplo na `baia`) de tudo que já
     está posto — a `costa` encosta na beira do mar, e na praça de praia ou
     de lagoa ninguém passa da avenida da beira. Na de leste e oeste, a
     cidade escorrega até uma rua dela ficar em frente a uma rua da vizinha
     (a estrada sai reta). Tudo dela vai junto: as quadras com os lotes, os
     estádios com o acesso e o entorno, as favelas, a rua de veraneio, os
     bares, as lojas, os terrenos e os espaços de sede. Depois: a avenida de
     entrada e a da beira ficam só no centro (a da beira segue até a cidade
     da costa), a ESTRADA liga cada cidade à vizinha (reta, ou em L), com o
     PÓRTICO de BEM-VINDO na entrada de cada uma e a PLACA da distância. */
  let cisao = null;
  if (CIS) cisao = afastarCidades();
  function afastarCidades() {
    const G = VAO_CIDADES_M * M, nomes = CIS.cidades.map(c => c.nome);
    const quadraPorId = new Map(quadras.map(q => [q.id, q]));
    /* 1 · a cidade de cada coisa */
    for (const q of quadras) if (!q.cidade) q.cidade = CENTRO;
    favelas.forEach((f, i) => { f.cidade = (corte && corte.favelas[i]) || CENTRO; });
    const daQuadra = (id, hoje) => hoje ? CENTRO : ((quadraPorId.get(id) || {}).cidade || CENTRO);
    for (const b of bares) b.cidade = b.lote.favela ? null : daQuadra(b.quadra, b.hoje);
    for (const lj of lojas) lj.cidade = daQuadra(lj.quadra, lj.hoje);
    for (const T of terrenos) T.cidade = daQuadra(T.quadra, T.emQuadraDeHoje);
    for (const e of espacosSede) e.cidade = e.terreno ? e.terreno.cidade : CENTRO;
    for (const e of copias) if (!e.cidade) e.cidade = CENTRO;
    if (veraneio && !veraneio.cidade) veraneio.cidade = CENTRO;
    const cidadeDoAcesso = a => a.veraneio ? veraneio.cidade : ((copias.find(e => e.id === a.estadio) || {}).cidade || CENTRO);

    /* 2 · A PEGADA de cada cidade: a quadra com a rua em volta, a favela, o
       estádio com a rua dele, a rua de veraneio, os acessos; no centro, as
       quadras de hoje que ficam e o Atacadex */
    const pegada = new Map(nomes.map(n => [n, []]));
    const caixa = (r, m = 0) => ({ x0: r.x0 - m, x1: r.x1 + m, y0: r.y0 - m, y1: r.y1 + m });
    const poeP = (c, r, m = 0) => (pegada.get(c) || pegada.get(CENTRO)).push(caixa(r, m));
    const retSeg = a => { const [[ax, ay], [bx, by]] = [a.pontos[0], a.pontos[a.pontos.length - 1]], h = a.l / 2;
      return { x0: Math.min(ax, bx) - h, x1: Math.max(ax, bx) + h, y0: Math.min(ay, by) - h, y1: Math.max(ay, by) + h }; };
    for (const q of quadras) poeP(q.cidade, q.rua || q, q.rua ? 0 : RUA);
    for (const f of favelas) { poeP(f.cidade, f.bb, VIELA); poeP(f.cidade, bbOf(f.poly)); }
    for (const e of copias) if (e.area) poeP(e.cidade, e.area, RUA);
    /* (a rua de veraneio não entra: ela é posta de novo depois, ver `recolocarVeraneio`) */
    for (const a of acessos) if (!a.veraneio) poeP(cidadeDoAcesso(a), retSeg(a));
    for (const q of K.QUADRAS) if (!substitui.has(q.i + ',' + q.j)) poeP(CENTRO, q.pol && q.pol.length >= 3 ? bbOf(q.pol) : q, RUA);
    if (atacadex) poeP(CENTRO, atacadex.bb, 60);
    const bbDe = rs => rs.length ? { x0: Math.min(...rs.map(r => r.x0)), x1: Math.max(...rs.map(r => r.x1)), y0: Math.min(...rs.map(r => r.y0)), y1: Math.max(...rs.map(r => r.y1)) } : null;
    /* A AVENIDA DE ENTRADA É DO CENTRO: de ponta a ponta das quadras dele
       que dão nela (e até o Atacadex, que fica na beira dela, ao norte) */
    const kFicam = K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j));
    /* (a praça toda de modelo não tem avenida de entrada) */
    const faixaAv = TODAS ? null : (() => {
      const xa = colX(cE)[0], xb = colX(cE + 1)[1], ys0 = [], ys1 = [];
      for (const q of quadras) if (q.cidade === CENTRO && !q.entorno && !q.estadio && q.x0 < xb && q.x1 > xa) { ys0.push(q.y0); ys1.push(q.y1); }
      for (const q of kFicam) if (q.x0 < xb && q.x1 > xa) { ys0.push(q.y0); ys1.push(q.y1); }
      return ys0.length ? { y0: Math.min(...ys0), y1: Math.max(...ys1) } : null;
    })();
    if (faixaAv) pegada.get(CENTRO).push({ x0: ENTRADA.x0 - CALC, x1: ENTRADA.x1 + CALC, avenida: true,
                                           y0: Math.min(faixaAv.y0 - RUA - 400, atacadex ? atacadex.bb.y0 - 200 : Infinity), y1: faixaAv.y1 + RUA + 400 });
    else if (!TODAS) avisos.push('o centro não tem quadra na avenida de entrada');

    /* A COSTA (na praça de praia ou de lagoa): a guia oeste da avenida da
       beira na altura y — ninguém passa dela; a cidade da `costa` encosta */
    const bmK = avenidas.find(a => a.id === 'beiramar'), lBeira = bmK ? bmK.l : 76;
    const uC = K.pxm(1, 0)[0] - K.pxm(0, 0)[0], y00C = K.pxm(0, 0)[1];
    const guia = y => K.pxm(K.xCosta((y - y00C) / uC), 0)[0] - K.PRAIA * uC - lBeira;
    const temCosta = !!opc.costa && !TODAS;
    /* A AVENIDA DA BEIRA fica só onde o centro encosta nela: as quadras de
       hoje recortadas pela costa que ficaram (e, depois, a cidade da costa) */
    const recortadas = kFicam.filter(q => q.pol && q.pol.length >= 3 && !ehRetPoli(q.pol));
    const xDaBeira = y => {
      const p = bmK.pontos;
      for (let k = 1; k < p.length; k++) {
        const [ax, ay] = p[k - 1], [bx, by] = p[k];
        if ((y - ay) * (y - by) <= 0 && ay !== by) return ax + (bx - ax) * (y - ay) / (by - ay);
      }
      return guia(y) + lBeira / 2;
    };
    const y0Beira = bmK ? Math.min(...bmK.pontos.map(p => p[1])) : 0, y1Beira = bmK ? Math.max(...bmK.pontos.map(p => p[1])) : 0;
    /* a linha da beira entre ya e yb: a de antes onde tem (com os vértices dela), a da guia pra lá das pontas */
    const linhaDaBeira = (ya, yb) => {
      const pts = [];
      const xEm = y => y >= y0Beira && y <= y1Beira ? xDaBeira(y) : guia(y) + lBeira / 2;
      for (let y = ya; y < yb; y += 200) pts.push([xEm(y), y]);
      pts.push([xEm(yb), yb]);
      const juntos = pts.concat(bmK.pontos.filter(p => p[1] > ya && p[1] < yb).map(p => p.slice())).sort((a, b) => a[1] - b[1]);
      return juntos.filter((p, k) => !k || Math.abs(p[1] - juntos[k - 1][1]) > 1);
    };
    let beiraY = null;
    if (bmK) {
      if (recortadas.length) {
        beiraY = [Math.min(...recortadas.map(q => q.y0)) - RUA, Math.max(...recortadas.map(q => q.y1)) + RUA];
        bmK.pontos = linhaDaBeira(beiraY[0], beiraY[1]);
        for (let k = 1; k < bmK.pontos.length; k++) {
          const [ax, ay] = bmK.pontos[k - 1], [bx, by] = bmK.pontos[k], h = lBeira / 2 + CALC;
          pegada.get(CENTRO).push({ x0: Math.min(ax, bx) - h, x1: Math.max(ax, bx) + h, y0: Math.min(ay, by) - h, y1: Math.max(ay, by) + h, beira: true });
        }
      } else avenidas.splice(avenidas.indexOf(bmK), 1);
    }
    /* quanto a cidade (os retângulos R deslocados de tx, ty) pode andar pro leste sem passar da guia (a quadra encosta nela) */
    const folgaLeste = (R, tx, ty) => {
      let m = Infinity;
      for (const r of R) for (let k = 0; k <= 4; k++) {
        const y = r.y0 + ty + (r.y1 - r.y0) * k / 4;
        m = Math.min(m, guia(y) - (r.x1 + tx - (r.avenida ? 0 : RUA)));
      }
      return m;
    };

    /* 3 · ONDE CADA CIDADE FICA: da vizinha, no rumo, até ter o vão */
    const filhos = new Map(nomes.map(n => [n, []]));
    for (const c of CIS.cidades) if (c.de && filhos.has(c.de) && c.nome !== CENTRO) filhos.get(c.de).push(c);
    const ordem = [], fila = [CENTRO], vistas = new Set([CENTRO]);
    while (fila.length) { const n = fila.shift(); for (const c of filhos.get(n)) if (!vistas.has(c.nome)) { vistas.add(c.nome); ordem.push(c); fila.push(c.nome); } }
    for (const c of CIS.cidades) if (!vistas.has(c.nome)) { ordem.push({ ...c, de: CENTRO, rumo: c.rumo || 'o' }); vistas.add(c.nome); }
    const desl = new Map([[CENTRO, [0, 0]]]);
    const postas = [];                                     // { c, r } já no lugar
    for (const r of pegada.get(CENTRO)) postas.push({ c: CENTRO, r });
    const distR = (a, b) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
    const mov = (r, tx, ty) => ({ x0: r.x0 + tx, x1: r.x1 + tx, y0: r.y0 + ty, y1: r.y1 + ty });
    const bbPostas = n => bbDe(postas.filter(p => p.c === n).map(p => p.r));
    for (const c of ordem) {
      const R = pegada.get(c.nome);
      if (!R || !R.length) { desl.set(c.nome, [0, 0]); continue; }
      /* (nas cidades-modelo, todas a 50 m: o dono, 01/10/2026, "o importante é que as cidades não sejam tão distantes umas das outras") */
      const d = RUMO[c.rumo] || [-1, 0], gap = MODELO ? G : G * (c.longe ? 2 : 1) * (c.baia ? 3 : 1);
      const bbC = bbDe(R), bbP = bbPostas(c.de) || bbPostas(CENTRO);
      const t0 = [(bbP.x0 + bbP.x1) / 2 - (bbC.x0 + bbC.x1) / 2, (bbP.y0 + bbP.y1) / 2 - (bbC.y0 + bbC.y1) / 2];
      /* (a cidade da costa encosta na guia; as outras só não passam dela) */
      const naCosta = (tx, ty) => { if (!temCosta) return tx; const f = folgaLeste(R, tx, ty); return c.costa ? tx + f : tx + Math.min(0, f); };
      const livre = (tx, ty) => {
        const b = mov(bbC, tx, ty);
        for (const p of postas) {
          if (distR(b, p.r) >= gap) continue;
          for (const r of R) if (distR(mov(r, tx, ty), p.r) < gap - 0.5) return false;
        }
        return true;
      };
      /* a cidade anda no rumo `dd` a partir do meio da vizinha até ficar livre */
      const andar = dd => {
        let s = 0, t = null;
        for (let k = 0; k < 4000 && !t; k++, s += 60) {
          const ty = t0[1] + dd[1] * s, tx = naCosta(t0[0] + dd[0] * s, ty);
          if (livre(tx, ty)) t = [tx, ty, s];
        }
        if (!t) return null;
        /* o vão certo: volta de 60 pra trás até o primeiro ponto livre */
        for (let a = t[2] - 60, b = t[2], k = 0; k < 8 && a >= 0; k++) {
          const m = (a + b) / 2, ty = t0[1] + dd[1] * m, tx = naCosta(t0[0] + dd[0] * m, ty);
          if (livre(tx, ty)) { b = m; t = [tx, ty, m]; } else a = m;
        }
        return t;
      };
      /* O RUMO QUE DEIXA A ESTRADA CURTA (as cidades-modelo: o dono quer as
         cidades perto umas das outras): no rumo de verdade a cidade às vezes
         bate em outra e vai parar longe da vizinha (no Interior de SP, Novo
         Horizonte ficava a 300 m de Bauru); o rumo torto de 45° ou 90° entra
         quando a estrada até a vizinha encurta mais que o desvio custa (17 m
         a cada 45°: com 37, Parnaíba ia 130 m pro sul de São Luís em vez de
         ficar a 56 m dela, a oeste) */
      /* A ESTRADA QUE O LUGAR DÁ: a conta é de rua a rua — a faixa em volta
         de cada quadra da cidade e da vizinha, a do entorno do estádio
         também (no centro de duas cidades, também a quadra de hoje inteira
         e a avenida de entrada) —, como na escolha da estrada; reta
         quando as duas ruas se olham, em L quando não. Contar só a
         distância até a vizinha enganava no lado torto do mapa do porte:
         no Mato Grosso, Rondonópolis ficava a 50 m da quina cortada de
         Cuiabá, onde não tem rua, e a estrada subia 191 m ao lado dela */
      const ruasViz = (() => {
        const [vx, vy] = desl.get(c.de) || [0, 0], rs = [];
        for (const q of quadras) if (q.cidade === c.de) rs.push(mov(q.rua || caixa(q, RUA), vx, vy));
        if (c.de === CENTRO) {
          for (const q of kFicam) if (!(q.pol && q.pol.length >= 3 && !ehRetPoli(q.pol))) rs.push(caixa(q, RUA));
          if (faixaAv) rs.push({ x0: ENTRADA.x0, x1: ENTRADA.x1, y0: faixaAv.y0 - RUA - 400, y1: faixaAv.y1 + RUA + 400 });
        }
        return rs;
      })();
      const minhasRuas = quadras.filter(q => q.cidade === c.nome).map(q => q.rua || caixa(q, RUA));
      const estrada = t => {
        let m = Infinity;
        for (const r of minhasRuas) {
          const b = mov(r, t[0], t[1]);
          for (const a of ruasViz) {
            const gx = Math.max(a.x0 - b.x1, b.x0 - a.x1), gy = Math.max(a.y0 - b.y1, b.y0 - a.y1);
            const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0), ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
            /* (a em L custa como na escolha da estrada: 600 a mais) */
            const v = oy >= RUA && gx >= 0 ? gx : ox >= RUA && gy >= 0 ? gy : Math.max(0, gx) + Math.max(0, gy) + 600;
            if (v < m) m = v;
          }
        }
        return m;
      };
      const girar = (v, g) => { const a = g * Math.PI / 180; return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)]; };
      const rumos = MODELO ? [[d, 0], [girar(d, 45), 1], [girar(d, -45), 1], [girar(d, 90), 2], [girar(d, -90), 2]] : [[d, 0]];
      let t = null, dEsc = d;
      for (const [dd, desvio] of rumos) {
        const tt = andar(dd);
        if (!tt) continue;
        const custo = (MODELO && minhasRuas.length && ruasViz.length ? estrada(tt) : 0) + desvio * 0.35 * G;
        if (!t || custo < t.custo - 1e-6) { t = tt; t.custo = custo; dEsc = dd; }
      }
      if (!t) { avisos.push(`${c.nome}: sem lugar`); t = [t0[0] + d[0] * 240000, t0[1] + d[1] * 240000, 240000]; }
      /* A RUA EM FRENTE À RUA: na de leste e oeste, a cidade escorrega na
         vertical (até meia quadra) até uma rua de leste a oeste dela ficar
         na linha de uma da vizinha; na de norte e sul, na horizontal */
      const cardinal = Math.abs(dEsc[0]) < 1e-6 || Math.abs(dEsc[1]) < 1e-6;
      if (cardinal) {
        const hz = Math.abs(dEsc[1]) < 1e-6;
        const ruasDe = (n, t2) => quadras.filter(q => q.cidade === n && !q.entorno && !q.estadio)
          .flatMap(q => hz ? [q.y0 - RUA / 2 + t2[1], q.y1 + RUA / 2 + t2[1]] : [q.x0 - RUA / 2 + t2[0], q.x1 + RUA / 2 + t2[0]]);
        const deles = ruasDe(c.de, desl.get(c.de) || [0, 0]).concat(c.de === CENTRO ? K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j))
          .flatMap(q => hz ? [q.y0 - RUA / 2, q.y1 + RUA / 2] : [q.x0 - RUA / 2, q.x1 + RUA / 2]) : []);
        const minhas = ruasDe(c.nome, [t[0], t[1]]);
        const ajustes = [];
        for (const a of minhas) for (const b of deles) if (Math.abs(b - a) <= PASSO_Y / 2) ajustes.push(b - a);
        ajustes.sort((a, b) => Math.abs(a) - Math.abs(b));
        for (const aj of ajustes.slice(0, 40)) {
          const tx = hz ? t[0] : naCosta(t[0] + aj, t[1]), ty = hz ? t[1] + aj : t[1];
          const tx2 = hz ? naCosta(tx, ty) : tx;
          if (livre(tx2, ty)) { t = [tx2, ty, t[2]]; break; }
        }
      }
      desl.set(c.nome, [t[0], t[1]]);
      for (const r of R) postas.push({ c: c.nome, r: mov(r, t[0], t[1]) });
    }

    /* 4 · TUDO DE CADA CIDADE VAI JUNTO (cada coisa uma vez só) */
    const movidos = new WeakSet();
    const uma = o => { if (!o || movidos.has(o)) return false; movidos.add(o); return true; };
    const mR = (r, dx, dy) => { if (!uma(r)) return; r.x0 += dx; r.x1 += dx; r.y0 += dy; r.y1 += dy; };
    const mPt = (p, dx, dy) => { if (!uma(p)) return; p[0] += dx; p[1] += dy; };
    const mXY = (o, dx, dy) => { if (!uma(o)) return; o.x += dx; o.y += dy; };
    const mLote = (l, dx, dy) => {
      if (!uma(l)) return;
      l.x0 += dx; l.x1 += dx; l.y0 += dy; l.y1 += dy;
      if (l.cx != null) { l.cx += dx; l.cy += dy; }
      const qd = l.quadra;
      if (qd && qd.ix0 != null && uma(qd)) { qd.ix0 += dx; qd.ix1 += dx; qd.iy0 += dy; qd.iy1 += dy; }
    };
    const mSeg = (a, dx, dy) => { if (a && uma(a)) for (const p of a.pontos) mPt(p, dx, dy); };
    for (const q of quadras) {
      const [dx, dy] = desl.get(q.cidade) || [0, 0];
      if ((!dx && !dy) || !uma(q)) continue;
      q.x0 += dx; q.x1 += dx; q.y0 += dy; q.y1 += dy;
      if (q.ix0 != null) { q.ix0 += dx; q.ix1 += dx; q.iy0 += dy; q.iy1 += dy; }
      for (const k of ['rua', 'quintal', 'faixaLotes', 'jardim']) if (q[k]) mR(q[k], dx, dy);
      for (const l of q.lotes) mLote(l, dx, dy);
      if (q.casas) { for (const l of q.casas.lotes) mLote(l, dx, dy); if (q.casas.quintal) mR(q.casas.quintal, dx, dy); }
      if (q.casasDoBaldio) { for (const l of q.casasDoBaldio.lotes) mLote(l, dx, dy); for (const k of ['area', 'quintal']) if (q.casasDoBaldio[k]) mR(q.casasDoBaldio[k], dx, dy); }
      if (q.terreno) mR(q.terreno.area, dx, dy);
      if (q.equip && q.equip.torres) for (const t of q.equip.torres) { mR(t.fatia, dx, dy); for (const v of t.volumes || []) mR(v, dx, dy); }
    }
    for (const e of copias) {
      const [dx, dy] = desl.get(e.cidade) || [0, 0];
      if (!dx && !dy) continue;
      for (const k of ['area', 'terreno', 'qest']) if (e[k]) mR(e[k], dx, dy);
      for (const k of ['centro', 'portao1']) if (e[k]) mPt(e[k], dx, dy);
      e.dx += dx; e.dy += dy;
      mSeg(e.acesso, dx, dy);
      for (const a of e.acessosDeLado || []) mSeg(a, dx, dy);
    }

    for (const f of favelas) {
      const [dx, dy] = desl.get(f.cidade) || [0, 0];
      if (!dx && !dy) continue;
      f.poly = f.poly.map(([x, y]) => [x + dx, y + dy]);
      for (const l of f.lotes) mLote(l, dx, dy);
      for (const b of f.becos) for (const p of b) mPt(p, dx, dy);
      for (const a of f.arvores) mXY(a, dx, dy);
      for (const a of f.moitas) mXY(a, dx, dy);
      if (f.campinho) mR(f.campinho, dx, dy);
      mR(f.bb, dx, dy);
    }
    for (const T of terrenos) { const [dx, dy] = desl.get(T.cidade) || [0, 0]; if (dx || dy) mR(T.area, dx, dy); }
    for (const e of espacosSede) { const [dx, dy] = desl.get(e.cidade) || [0, 0]; if (dx || dy) mR(e.area, dx, dy); }
    for (const b of bares) {
      const c = b.cidade || (favelas.find(f => f.lotes.includes(b.lote)) || {}).cidade;
      b.cidade = c || CENTRO;
      const [dx, dy] = desl.get(b.cidade) || [0, 0];
      if (dx || dy) { mXY(b, dx, dy); mLote(b.lote, dx, dy); }
    }
    for (const lj of lojas) { const [dx, dy] = desl.get(lj.cidade) || [0, 0]; if (dx || dy) { mXY(lj, dx, dy); mLote(lj.lote, dx, dy); } }

    /* 5 · AS AVENIDAS DO CENTRO. A de entrada: entre os pórticos do centro,
       e de cada ponta segue até a borda do mundo ou até a primeira cidade
       que estiver no caminho (aí ela vira a estrada dela) */
    const ondeC = postas.filter(p => p.c === CENTRO && !p.r.avenida).map(p => p.r);
    const tudo = postas.map(p => p.r);
    const mundoC = bbDe(tudo);
    const chegaPelaAvenida = new Map();                   // a cidade de fora aonde a avenida de entrada chega: a ponta dela
    {
      porticos.length = 0;
      if (!faixaAv) { if (avenidas.includes(avEntrada)) avenidas.splice(avenidas.indexOf(avEntrada), 1); }
      else {
        const meiaVao = ENTRADA.l / 2 / M + 1.0, xP = ENTRADA.xc, yN = faixaAv.y0 - RUA - 88, yS = faixaAv.y1 + RUA + 88;
        porticos.push({ id: 'norte', nome: 'Pórtico da entrada norte', x: xP, y: yN, dir: [0, 1], l: ENTRADA.l, xp: meiaVao, dupla: true, cidade: CENTRO });
        porticos.push({ id: 'sul', nome: 'Pórtico da entrada sul', x: xP, y: yS, dir: [0, -1], l: ENTRADA.l, xp: meiaVao, dupla: true, cidade: CENTRO });
        /* até onde ela vai: a borda do mundo (o Atacadex fica na beira dela) ou a cidade no caminho */
        const banda = { x0: ENTRADA.x0 - CALC, x1: ENTRADA.x1 + CALC };
        let topo = Math.min(mundoC.y0 - 400, atacadex ? atacadex.bb.y0 - 400 : Infinity), fundo = mundoC.y1 + 400, cTopo = null, cFundo = null;
        for (const p of postas) {
          if (p.c === CENTRO || p.r.x0 >= banda.x1 || p.r.x1 <= banda.x0) continue;
          if (p.r.y1 <= yN && p.r.y1 - RUA / 2 > topo) { topo = p.r.y1 - RUA / 2; cTopo = p.c; }
          if (p.r.y0 >= yS && p.r.y0 + RUA / 2 < fundo) { fundo = p.r.y0 + RUA / 2; cFundo = p.c; }
        }
        avEntrada.pontos[0][1] = topo; avEntrada.pontos[1][1] = fundo;
        if (cTopo) chegaPelaAvenida.set(cTopo, { x: xP, y: topo + RUA / 2, dir: [0, -1], l: ENTRADA.l, xp: meiaVao, dupla: true });
        if (cFundo) chegaPelaAvenida.set(cFundo, { x: xP, y: fundo - RUA / 2, dir: [0, 1], l: ENTRADA.l, xp: meiaVao, dupla: true });
      }
    }
    /* o x da avenida da beira na altura y, já com o trecho novo */
    const xDaBeiraNova = y => {
      const p = bmK ? bmK.pontos : [];
      for (let k = 1; k < p.length; k++) { const [ax, ay] = p[k - 1], [bx, by] = p[k]; if ((y - ay) * (y - by) <= 0 && ay !== by) return ax + (bx - ax) * (y - ay) / (by - ay); }
      return guia(y) + lBeira / 2;
    };
    /* a da beira segue até a cidade da costa (a estrada dela é a própria beira) */
    if (bmK && beiraY && avenidas.includes(bmK)) {
      let [ya, yb] = beiraY;
      for (const c of CIS.cidades) if (c.costa) {
        const b = bbDe(postas.filter(p => p.c === c.nome).map(p => p.r));
        if (b) { ya = Math.min(ya, b.y0); yb = Math.max(yb, b.y1); }
      }
      if (ya < beiraY[0] || yb > beiraY[1]) bmK.pontos = linhaDaBeira(ya, yb);
    }

    /* 6 · AS ESTRADAS: de cada cidade até a vizinha (`de`). A estrada sai
       da rua da borda de uma e chega na rua da borda da outra: reta quando
       as duas se olham, em L quando estão na diagonal. Nada no meio do
       caminho (outra cidade, outra estrada) */
    const ruasDaCidade = n => {
      const rs = [];
      for (const q of quadras) if (q.cidade === n) rs.push({ r: q.rua || caixa(q, RUA), q });
      if (n === CENTRO) {
        for (const q of kFicam) { const b = q.pol && q.pol.length >= 3 ? bbOf(q.pol) : q; rs.push({ r: caixa(b, RUA), q: b }); }
        /* (a avenida de entrada e a da beira também são rua do centro: a estrada pode sair delas) */
        for (const a of [avEntrada, bmK]) if (a && avenidas.includes(a)) for (let k = 1; k < a.pontos.length; k++) {
          const [ax, ay] = a.pontos[k - 1], [bx, by] = a.pontos[k], h = a.l / 2;
          rs.push({ r: { x0: Math.min(ax, bx) - h, x1: Math.max(ax, bx) + h, y0: Math.min(ay, by) - h, y1: Math.max(ay, by) + h }, q: {}, avenida: true });
        }
      }
      return rs;
    };
    /* O CHÃO DE VERDADE da cidade `n` em (x, y): a quadra com a rua em
       volta; no centro, também a quadra de hoje — a recortada pela costa
       vale pelo polígono, não pela caixa — e as avenidas de entrada e da
       beira, pelo traçado (a caixa de um trecho torto é maior que ele) */
    const chaoDe = (n, x, y) => {
      const em = r => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;
      for (const q of quadras) if (q.cidade === n && em(q.rua || caixa(q, RUA))) return true;
      if (n !== CENTRO) return false;
      for (const q of kFicam) {
        if (q.pol && q.pol.length >= 3 && !ehRetPoli(q.pol)) { if (dentroPol(x, y, q.pol)) return true; }
        else if (em(caixa(q.pol && q.pol.length >= 3 ? bbOf(q.pol) : q, RUA))) return true;
      }
      return [avEntrada, bmK].some(a => a && avenidas.includes(a) && distAvenida(x, y, a) < a.l / 2);
    };
    /* A PONTA NO CHÃO DA CIDADE: a ponta da estrada sai da caixa da rua
       (`pontaH`/`pontaV`); onde a caixa é maior que a cidade — a quadra
       recortada pela costa, a avenida da beira torta —, entre a ponta e a
       rua sobrava mato, e no cenário 3D ninguém passava (Cuiabá, Campinas
       e o Rio, na ponte de Niterói). A ponta entra na cidade até encostar
       no chão dela, mais um pouco por cima */
    const encostar = (seg, k, n) => {
      const P = seg[k], Q = seg[1 - k], L = Math.hypot(P[0] - Q[0], P[1] - Q[1]) || 1, ux = (P[0] - Q[0]) / L, uy = (P[1] - Q[1]) / L;
      for (let t = 0; t <= 40 * M; t += 10) {
        if (!chaoDe(n, P[0] + ux * t, P[1] + uy * t)) continue;
        if (t > 0) { P[0] += ux * (t + 20); P[1] += uy * (t + 20); }
        return true;
      }
      avisos.push(`a estrada de ${n} não encosta na rua dela`);
      return false;
    };
    const estradas = [], placas = [], porticosC = [];
    const bloqueia = postas.slice();                   // o que a estrada não atravessa: as pegadas ({ c, r }) e as estradas já postas
    /* o trecho bate em alguma coisa? A ponta da cidade `ini` (e a da `fim`)
       entra meia rua na rua dela: perto dessa ponta a cidade dela não conta;
       o resto do caminho não encosta em nada */
    const corta = (seg, ini, fim) => {
      const [[ax, ay], [bx, by]] = seg, L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L;
      const parte = (t0, t1) => {
        if (t1 - t0 < 1) return null;
        const a = [ax + ux * t0, ay + uy * t0], b = [ax + ux * t1, ay + uy * t1], h = RUA / 2 - 2;
        return { x0: Math.min(a[0], b[0]) - h, x1: Math.max(a[0], b[0]) + h, y0: Math.min(a[1], b[1]) - h, y1: Math.max(a[1], b[1]) + h };
      };
      const tudo = parte(0.95 * RUA, L - 0.95 * RUA), rIni = parte(1.6 * RUA, L - 0.95 * RUA), rFim = parte(0.95 * RUA, L - 1.6 * RUA);
      return bloqueia.some(({ c, r }) => {
        const t = c === ini ? rIni : c === fim ? rFim : tudo;
        return !!t && r.x0 < t.x1 && r.x1 > t.x0 && r.y0 < t.y1 && r.y1 > t.y0;
      });
    };
    /* o pórtico na entrada de uma cidade: de frente pra quem chega */
    const porticoEm = (aqui, la, x, y, dir, l, extra = {}) => porticosC.push({ id: 'cidade:' + aqui + ':' + la, nome: 'Pórtico de ' + aqui, x, y, dir, l,
                                                                             xp: l / 2 / M + 1.2, cidade: aqui, outra: la, estrada: true, ...extra });
    /* a ponta da cidade na linha y (o lado `sg` = +1 leste, −1 oeste), só a rua: o x da beira de fora */
    /* (a rua inteira da estrada, RUA de largura, cabe na faixa de rua da cidade) */
    const pontaH = (rs, y, sg) => { let v = null; for (const { r } of rs) if (y - RUA / 2 >= r.y0 - 1 && y + RUA / 2 <= r.y1 + 1) v = v === null ? (sg > 0 ? r.x1 : r.x0) : sg > 0 ? Math.max(v, r.x1) : Math.min(v, r.x0); return v; };
    const pontaV = (rs, x, sg) => { let v = null; for (const { r } of rs) if (x - RUA / 2 >= r.x0 - 1 && x + RUA / 2 <= r.x1 + 1) v = v === null ? (sg > 0 ? r.y1 : r.y0) : sg > 0 ? Math.max(v, r.y1) : Math.min(v, r.y0); return v; };
    /* (a ponta numa quadra é melhor; na avenida, só se não tiver quadra ali) */
    const soQuadras = rs => rs.filter(o => !o.avenida);
    for (const c of ordem) {
      /* A AVENIDA QUE JÁ LIGA AS DUAS: a de entrada que chega na cidade de
         fora, ou a da beira que segue até a da costa — o pórtico vai nela */
      const pelaAv = chegaPelaAvenida.get(c.nome);
      if (pelaAv) {
        const p = pelaAv;
        porticoEm(c.nome, CENTRO, p.x, p.y - p.dir[1] * 88, p.dir, p.l, { dupla: true, xp: p.xp });
        if (c.de === CENTRO) continue;
      }
      if (c.costa && bmK && avenidas.includes(bmK) && (c.de === CENTRO || cidadeP.get(c.de).costa)) {
        const b = bbDe(postas.filter(p => p.c === c.nome).map(p => p.r)), bP = bbDe(postas.filter(p => p.c === c.de && !p.r.avenida).map(p => p.r));
        if (b && bP) {
          const sul = (b.y0 + b.y1) / 2 > (bP.y0 + bP.y1) / 2, y = sul ? b.y0 - 88 : b.y1 + 88;
          porticoEm(c.nome, c.de, xDaBeiraNova(y), y, [0, sul ? 1 : -1], lBeira);
          const yP = sul ? bP.y1 + 88 : bP.y0 - 88;
          porticoEm(c.de, c.nome, xDaBeiraNova(yP), yP, [0, sul ? -1 : 1], lBeira);
          continue;
        }
      }
      const A = ruasDaCidade(c.de), B = ruasDaCidade(c.nome);
      if (!A.length || !B.length) continue;
      const bA = bbDe(soQuadras(A).map(o => o.r)) || bbDe(A.map(o => o.r)), bB = bbDe(B.map(o => o.r));
      const linhasH = rs => [...new Set(rs.filter(o => o.q.y0 != null).flatMap(o => [o.q.y0 - RUA / 2, o.q.y1 + RUA / 2]).map(Math.round))];
      const linhasV = rs => [...new Set(rs.filter(o => o.q.x0 != null).flatMap(o => [o.q.x0 - RUA / 2, o.q.x1 + RUA / 2]).map(Math.round))];
      const opcoes = [];
      /* reta de leste a oeste */
      const sgH = (bB.x0 + bB.x1) / 2 < (bA.x0 + bA.x1) / 2 ? -1 : 1;
      const ysA = linhasH(A), ysB = linhasH(B);
      for (const y of ysB.concat(ysA)) {
        const xq = pontaH(soQuadras(A), y, sgH), xa = xq !== null ? xq : pontaH(A, y, sgH), xb = pontaH(B, y, -sgH);
        if (xa === null || xb === null || (xb - xa) * sgH <= 0) continue;
        const seg = [[xa - sgH * RUA / 2, y], [xb + sgH * RUA / 2, y]];
        if (corta(seg, c.de, c.nome)) continue;
        const reta = ysA.some(v => Math.abs(v - y) < 12) && ysB.some(v => Math.abs(v - y) < 12);
        opcoes.push({ segs: [seg], custo: Math.abs(xb - xa) + (reta ? 0 : 400) + (xq === null ? 500 : 0) });
      }
      /* reta de norte a sul */
      const sgV = (bB.y0 + bB.y1) / 2 < (bA.y0 + bA.y1) / 2 ? -1 : 1;
      const xsA = linhasV(A), xsB = linhasV(B);
      for (const x of xsB.concat(xsA)) {
        const yq = pontaV(soQuadras(A), x, sgV), ya = yq !== null ? yq : pontaV(A, x, sgV), yb = pontaV(B, x, -sgV);
        if (ya === null || yb === null || (yb - ya) * sgV <= 0) continue;
        const seg = [[x, ya - sgV * RUA / 2], [x, yb + sgV * RUA / 2]];
        if (corta(seg, c.de, c.nome)) continue;
        const reta = xsA.some(v => Math.abs(v - x) < 12) && xsB.some(v => Math.abs(v - x) < 12);
        opcoes.push({ segs: [seg], custo: Math.abs(yb - ya) + (reta ? 0 : 400) + (yq === null ? 500 : 0) });
      }
      /* em L: sai de uma na horizontal e entra na outra na vertical (e o
         contrário). Nas cidades-modelo ela entra na conta mesmo com a reta
         (a 600 a mais): a reta às vezes corre ao lado da cidade até achar
         rua — no Mato Grosso, 191 m ao lado do lado torto de Cuiabá */
      if (!opcoes.length || MODELO) for (const [P, Q, ysP, xsQ, inv] of [[A, B, ysA, xsB, false], [B, A, ysB, xsA, true]]) {
        const bP = bbDe(soQuadras(P).map(o => o.r)) || bbDe(P.map(o => o.r)), bQ = bbDe(soQuadras(Q).map(o => o.r)) || bbDe(Q.map(o => o.r));
        const sh = (bQ.x0 + bQ.x1) / 2 < (bP.x0 + bP.x1) / 2 ? -1 : 1, sv = (bP.y0 + bP.y1) / 2 < (bQ.y0 + bQ.y1) / 2 ? -1 : 1;
        for (const y of ysP) for (const x of xsQ) {
          const xp = pontaH(P, y, sh), yq = pontaV(Q, x, sv);
          if (xp === null || yq === null || (x - xp) * sh <= RUA || (y - yq) * sv <= RUA) continue;
          const s1 = [[xp - sh * RUA / 2, y], [x + sh * RUA / 2, y]], s2 = [[x, y + sv * RUA / 2], [x, yq - sv * RUA / 2]];
          if (corta(s1, inv ? c.nome : c.de, null) || corta(s2, null, inv ? c.de : c.nome)) continue;
          opcoes.push({ segs: inv ? [s2.slice().reverse(), s1.slice().reverse()] : [s1, s2], custo: Math.abs(x - xp) + Math.abs(y - yq) + 600 });
        }
      }
      if (!opcoes.length) { avisos.push(`sem estrada entre ${c.de} e ${c.nome}`); continue; }
      opcoes.sort((a, b) => a.custo - b.custo);
      const esc = opcoes[0];
      encostar(esc.segs[0], 0, c.de);
      encostar(esc.segs[esc.segs.length - 1], 1, c.nome);
      esc.segs.forEach((seg, k) => {
        const a = { id: 'estrada:' + c.nome + ':' + k, l: RUA, reta: true, estrada: true, de: c.de, para: c.nome, ponte: !!c.baia && !MODELO, pontos: seg.map(p => p.slice()) };
        estradas.push(a); avenidas.push(a);
        bloqueia.push({ c: 'estrada', r: retSeg(a) });
      });
      /* o pórtico na entrada de cada uma, de frente pra quem chega, e a
         placa de quem sai, com a distância até a outra */
      const pontas = [[esc.segs[0][0], esc.segs[0][1], c.de, c.nome], [esc.segs[esc.segs.length - 1][1], esc.segs[esc.segs.length - 1][0], c.nome, c.de]];
      for (const [P0, P1, aqui, la] of pontas) {
        const L = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]) || 1, ux = (P1[0] - P0[0]) / L, uy = (P1[1] - P0[1]) / L;
        const fora = RUA / 2 + 88;
        if (L < fora + 2 * M) continue;
        porticoEm(aqui, la, P0[0] + ux * fora, P0[1] + uy * fora, [-ux, -uy], RUA);
        /* a placa: do lado direito de quem sai, 7 m depois do pórtico */
        const dd = fora + 7 * M;
        if (L > dd + 2 * M) placas.push({ x: P0[0] + ux * dd - uy * (RUA / 2 + 1.4 * M), y: P0[1] + uy * dd + ux * (RUA / 2 + 1.4 * M), dir: [ux, uy],
                                          cidade: aqui, linhas: [[la.toUpperCase(), (c.km || '') + (c.km ? ' km' : '')]] });
      }
    }
    porticos.push(...porticosC);

    /* 7 · A BAÍA (Niterói): a água entre as duas margens, com a ponte por cima da estrada */
    let baia = null;
    /* (nas cidades-modelo não tem baía: a cidade do outro lado chega pela estrada, como as outras) */
    const cb = MODELO ? null : ordem.find(c => c.baia);
    if (cb) {
      const A = postas.filter(p => p.c === cb.de && !p.r.avenida).map(p => p.r), B = postas.filter(p => p.c === cb.nome).map(p => p.r);
      const bA = bbDe(A), bB = bbDe(B), leste = (bB.x0 + bB.x1) / 2 > (bA.x0 + bA.x1) / 2;
      const margem = 0.22 * G, ya = Math.min(bA.y0, bB.y0) - 1.2 * G, yb = Math.max(bA.y1, bB.y1) + 1.2 * G;
      const borda = (rs, y, sg, def) => { let v = null; for (const r of rs) if (y >= r.y0 - 150 && y <= r.y1 + 150) v = v === null ? (sg > 0 ? r.x1 : r.x0) : sg > 0 ? Math.max(v, r.x1) : Math.min(v, r.x0); return v === null ? def : v; };
      const oeste = [], lesteP = [];
      for (let y = ya, k = 0; y <= yb + 1; y += 160, k++) {
        const onda = Math.sin(k * 0.9) * 0.05 * G + Math.sin(k * 0.37 + 1) * 0.08 * G;
        const xw = leste ? borda(A, y, 1, bA.x1) + margem : borda(B, y, 1, bB.x1) + margem;
        const xe = leste ? borda(B, y, -1, bB.x0) - margem : borda(A, y, -1, bA.x0) - margem;
        oeste.push([xw + Math.max(0, onda), y]); lesteP.push([xe + Math.min(0, onda), y]);
      }
      const agua = oeste.concat(lesteP.reverse());
      /* o tabuleiro da ponte: o trecho da estrada por cima da água e da
         margem (a estrada reta: um retângulo, a pista e 1,3 m de cada lado) */
      const pontes = [];
      for (const a of estradas.filter(a => a.ponte)) {
        const [[ax, ay], [bx, by]] = a.pontos, L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L;
        let t0 = null, t1 = null;
        for (let t = 0; t <= L; t += 8) if (dentroPol(ax + ux * t, ay + uy * t, agua)) { if (t0 === null) t0 = t; t1 = t; }
        if (t0 === null) continue;
        t0 = Math.max(0, t0 - 110); t1 = Math.min(L, t1 + 110);
        const h = a.l / 2 + 1.3 * M, p = [ax + ux * t0, ay + uy * t0], q = [ax + ux * t1, ay + uy * t1];
        pontes.push({ x0: Math.min(p[0], q[0]) - Math.abs(uy) * h, x1: Math.max(p[0], q[0]) + Math.abs(uy) * h,
                      y0: Math.min(p[1], q[1]) - Math.abs(ux) * h, y1: Math.max(p[1], q[1]) + Math.abs(ux) * h, dir: [ux, uy], l: a.l });
      }
      baia = { agua, nome: 'Baía de Guanabara', pontes, ponte: estradas.filter(a => a.ponte).map(a => a.pontos.map(p => p.slice())) };
    }

    const baiaBB = () => baia ? bbOf(baia.agua) : null;

    /* 8 · A RUA DE VERANEIO DE NOVO: com as cidades no lugar, ela vai pra
       beira da cidade dela, pro lado que estiver livre — o terreno e a rua
       de acesso reta até a rua da cidade sem encostar em nada (nem em outra
       cidade, nem em estrada) —, o mais perto que der; sem lugar, ela vai
       junto com a cidade, como as outras coisas dela */
    if (veraneio) {
      const Xn = veraneio.cidade, rs = ruasDaCidade(Xn), DIRV = { o: [1, 0], l: [-1, 0], n: [0, 1], s: [0, -1] };
      const ys = [...new Set(rs.filter(o => o.q.y0 != null).flatMap(o => [o.q.y0 - RUA / 2, o.q.y1 + RUA / 2]).map(Math.round))];
      const xs = [...new Set(rs.filter(o => o.q.x0 != null).flatMap(o => [o.q.x0 - RUA / 2, o.q.x1 + RUA / 2]).map(Math.round))];
      const agua = baiaBB();
      /* (nem por cima de avenida: a de entrada vai até a borda do mundo, e em Ponta Grossa a rua de veraneio
         caía atravessada nela — a grade da avenida partia a rua ao meio, e metade ficava fora de alcance) */
      const naAvenidaR = r => avenidas.some(a => a !== veraneio.acesso && a.pontos.some((p, k) => k > 0 && cruza(r, retSeg({ pontos: [a.pontos[k - 1], p], l: a.l }), RUA)));
      const ocupa = r => bloqueia.some(({ r: o }) => cruza(r, o, RUA)) || (agua && cruza(r, agua, RUA)) || naAvenidaR(r) ||
                         porticos.concat(porticosC).some(p => p.x > r.x0 - 12 * M && p.x < r.x1 + 12 * M && p.y > r.y0 - 12 * M && p.y < r.y1 + 12 * M);
      let melhor = null;
      for (const f of ['o', 'l', 'n', 's']) {
        const hz = f === 'o' || f === 'l', W = hz ? LV_VER : PV_VER, H = hz ? PV_VER : LV_VER, d = DIRV[f];
        for (const a of hz ? ys : xs) {
          const borda = hz ? pontaH(soQuadras(rs), a, -d[0]) : pontaV(soQuadras(rs), a, -d[1]);
          if (borda === null) continue;
          for (let dd = 2 * RUA; dd <= 1.6 * G; dd += 60) {
            if (melhor && dd >= melhor.dd) break;
            const pe = hz ? [borda - d[0] * dd, a] : [a, borda - d[1] * dd];
            const r = f === 'o' ? { x0: pe[0] - W, x1: pe[0], y0: pe[1] - MEIO_VER, y1: pe[1] - MEIO_VER + H }
              : f === 'l' ? { x0: pe[0], x1: pe[0] + W, y0: pe[1] - MEIO_VER, y1: pe[1] - MEIO_VER + H }
              : f === 'n' ? { x0: pe[0] - MEIO_VER, x1: pe[0] - MEIO_VER + W, y0: pe[1] - H, y1: pe[1] }
              : { x0: pe[0] - MEIO_VER, x1: pe[0] - MEIO_VER + W, y0: pe[1], y1: pe[1] + H };
            if (ocupa(r)) continue;
            const fim = hz ? [borda + d[0] * RUA / 2, a] : [a, borda + d[1] * RUA / 2];
            const seg = [[pe[0] - d[0] * RUA / 2, pe[1] - d[1] * RUA / 2], fim];
            if (corta(seg, null, Xn) || (agua && cruza(retSeg({ pontos: seg, l: RUA }), agua, 0))) continue;
            melhor = { f, r, seg, dd };
            break;
          }
        }
      }
      if (melhor) {
        const { f, r, seg } = melhor, { lotes, rua } = lotesDoVeraneio(r, f);
        encostar(seg, 1, Xn);
        Object.assign(veraneio, { area: r, rua, lotes, fora: f, festa: lotes.find(l => l.veraneio === 'festa') });
        if (veraneio.acesso) veraneio.acesso.pontos = seg.map(p => p.slice());
        else { veraneio.acesso = { id: 'acessoVeraneio', l: RUA, reta: true, acesso: true, veraneio: true, pontos: seg.map(p => p.slice()) }; acessos.push(veraneio.acesso); avenidas.push(veraneio.acesso); }
        r.cidade = Xn;
      } else {
        avisos.push('a rua de veraneio não achou lugar novo: foi junto com a cidade dela');
        const [dx, dy] = desl.get(Xn) || [0, 0];
        if (dx || dy) { mR(veraneio.area, dx, dy); mR(veraneio.rua, dx, dy); for (const l of veraneio.lotes) mLote(l, dx, dy); mSeg(veraneio.acesso, dx, dy); }
      }
      postas.push({ c: Xn, r: caixa(veraneio.area, RUA) });
      if (veraneio.acesso) postas.push({ c: Xn, r: retSeg(veraneio.acesso) });
      bloqueia.push(...postas.slice(-2));
    }

    /* 8b · A FAVELA SOLTA: a favela que, com a praça cortada, não encosta
       em rua nenhuma da cidade dela (a quadra vizinha foi pra outra cidade,
       ou virou a baía) ganha um beco até a rua mais perto: a continuação
       de um beco dela, reta ou com uma dobra, sem passar por quadra, casa,
       outra favela nem água (01/10/2026: a de Erechim ficava no mato, a
       9 m da rua, e o boneco não chegava nela) */
    const cruzaR = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
    const lo = (r, A) => A ? r.y0 : r.x0, hi = (r, A) => A ? r.y1 : r.x1;
    for (const f of favelas) {
      const X = f.cidade || CENTRO, bb = f.bb;
      /* (a rua da cidade: a faixa em volta de cada quadra dela e, no centro, as avenidas — `entra`: até onde o beco vai dentro dela) */
      const ruas = quadras.filter(q => q.cidade === X).map(q => ({ ...(q.rua || caixa(q, RUA)), entra: RUA / 2 }))
        .concat(X === CENTRO ? K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j)).map(q => ({ ...caixa(q, RUA), entra: RUA / 2 })) : [])
        .concat(X === CENTRO ? avenidas.filter(a => !a.estrada && !a.acesso && a.pontos.length === 2).map(a => ({ ...retSeg(a), entra: Math.min(a.l / 2, 3 * M) })) : []);
      /* (encosta: a ponta de um beco dela chega na rua — o contorno desenhado
         pode chegar perto da rua com o mato no meio, como em Erechim) */
      const naRua = ([x, y]) => ruas.some(r => x > r.x0 - 20 && x < r.x1 + 20 && y > r.y0 - 20 && y < r.y1 + 20);
      if (!ruas.length || f.becos.some(b => naRua(b[0]) || naRua(b[b.length - 1]))) continue;
      const kFicam = K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j));
      /* o trecho de p a q (de largura w) passa livre? (a ponta que entra na rua pode encostar na quadra dela) */
      const livre = (p, q, w) => {
        const h = w / 2, r = { x0: Math.min(p[0], q[0]) - h + 1, x1: Math.max(p[0], q[0]) + h - 1, y0: Math.min(p[1], q[1]) - h + 1, y1: Math.max(p[1], q[1]) + h - 1 };
        if (quadras.some(o => cruzaR(o, r)) || kFicam.some(o => cruzaR(o, r)) || favelas.some(g => g !== f && cruzaR(g.bb, r))) return false;
        if (f.lotes.some(l => cruzaR(l, r))) return false;
        if (baia) { const L = Math.hypot(q[0] - p[0], q[1] - p[1]), N = Math.max(1, Math.ceil(L / 20)); for (let k = 0; k <= N; k++) if (dentroPol(p[0] + (q[0] - p[0]) * k / N, p[1] + (q[1] - p[1]) * k / N, baia.agua)) return false; }
        return true;
      };
      let melhor = null;
      for (const b of f.becos) for (const [a, c] of [[b[0], b[1]], [b[b.length - 1], b[b.length - 2]]]) {
        if (!a || !c) continue;
        const Lb = Math.hypot(a[0] - c[0], a[1] - c[1]) || 1, ux = Math.round((a[0] - c[0]) / Lb), uy = Math.round((a[1] - c[1]) / Lb);
        if (Math.abs(ux) + Math.abs(uy) !== 1) continue;
        const A = ux ? 0 : 1, B = 1 - A, sU = ux || uy, h = b.w / 2;
        for (const r of ruas) {
          /* reto: o beco segue até a rua */
          if (a[B] >= lo(r, B) + h && a[B] <= hi(r, B) - h) {
            const t = sU > 0 ? lo(r, A) - a[A] : a[A] - hi(r, A);
            if (t >= -1 && t <= 60 * M) {
              const fimP = a.slice(); fimP[A] += sU * (t + r.entra);
              if ((!melhor || t + r.entra < melhor.L) && livre(a, fimP, b.w)) melhor = { L: t + r.entra, pts: [a.slice(), fimP], w: b.w };
            }
            continue;
          }
          /* com uma dobra: segue até ficar na frente da rua e vira pra ela */
          const cA = Math.min(hi(r, A) - h, Math.max(lo(r, A) + h, a[A] + sU * (h + 12)));
          const s1 = (cA - a[A]) * sU;
          if (s1 < h + 10) continue;
          const sV = (lo(r, B) + hi(r, B)) / 2 > a[B] ? 1 : -1, t2 = sV > 0 ? lo(r, B) - a[B] : a[B] - hi(r, B);
          if (t2 < -1) continue;
          const Ltot = s1 + t2 + r.entra;
          if (Ltot > 60 * M || (melhor && Ltot >= melhor.L)) continue;
          const p1 = a.slice(); p1[A] = cA;
          const p2 = p1.slice(); p2[B] += sV * (t2 + r.entra);
          if (livre(a, p1, b.w) && livre(p1, p2, b.w)) melhor = { L: Ltot, pts: [a.slice(), p1, p2], w: b.w };
        }
      }
      if (!melhor) { avisos.push(`a favela ${f.id} (${X}) ficou sem rua`); continue; }
      /* (cada trecho vira um beco, com ponto de 16 em 16 como os outros) */
      for (let k = 1; k < melhor.pts.length; k++) {
        const p = melhor.pts[k - 1], q = melhor.pts[k], L = Math.hypot(q[0] - p[0], q[1] - p[1]), N = Math.max(1, Math.ceil(L / 16)), nb = [];
        for (let i = 0; i <= N; i++) nb.push([p[0] + (q[0] - p[0]) * i / N, p[1] + (q[1] - p[1]) * i / N]);
        nb.w = melhor.w; nb.liga = true;
        f.becos.push(nb);
      }
    }

    /* 9 · o que a página precisa: o que saiu do mapa de hoje (pra esconder o que era dele) e onde está cada cidade */
    const kFora = corte ? corte.kFora : new Set();
    const vazios = K.QUADRAS.filter(q => kFora.has(q.i + ',' + q.j)).map(q => caixa(q, RUA * 1.1));
    const restos = K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j)).map(q => caixa(q, RUA * 1.05))
      .concat(quadras.filter(q => q.cidade === CENTRO).map(q => q.rua || caixa(q, RUA)));
    const indice = rs => {
      const T = 800, B = new Map();
      rs.forEach((r, n) => { for (let i = Math.floor(r.x0 / T); i <= Math.floor(r.x1 / T); i++) for (let j = Math.floor(r.y0 / T); j <= Math.floor(r.y1 / T); j++) {
        const k = i * 100003 + j; let l = B.get(k); if (!l) B.set(k, l = []); l.push(n); } });
      return (x, y) => B.get(Math.floor(x / T) * 100003 + Math.floor(y / T)) || [];
    };
    const dentroR = (r, x, y) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;
    const iV = indice(vazios), iR = indice(restos);
    /* (na praça toda de modelo, toda cidade é "de fora": nada da cidade de hoje fica, e o chão de cada cidade é dela) */
    const lista = postas.filter(p => TODAS || p.c !== CENTRO), iO = indice(lista.map(p => p.r));
    const todas = postas, iT = indice(todas.map(p => p.r));
    const saiu = (x, y) => iV(x, y).some(n => dentroR(vazios[n], x, y)) && !iR(x, y).some(n => dentroR(restos[n], x, y));
    const naOutra = (x, y) => iO(x, y).some(n => dentroR(lista[n].r, x, y));
    const cidadeEm = (x, y) => { for (const n of iT(x, y)) if (dentroR(todas[n].r, x, y)) return todas[n].c; return null; };
    const cidades = CIS.cidades.map(c => {
      const [dx, dy] = desl.get(c.nome) || [0, 0], bb = bbDe(postas.filter(p => p.c === c.nome && !p.r.avenida).map(p => p.r));
      return { nome: c.nome, n: c.n, favelas: c.favelas || 0, de: c.de || null, rumo: c.rumo || null, km: c.km || null, longe: !!c.longe, costa: !!c.costa, baia: !!c.baia,
               centro: c.nome === CENTRO, dx, dy, bb, area: corte ? corte.areas[c.nome] || 0 : 0, alvo: corte ? corte.alvos[c.nome] : 0,
               prep: PREPOSICAO_CIDADE[c.nome] || 'A', modelo: ehModelo(c.nome) };
    });
    return { centro: CENTRO, cidades, kFora, somem: corte ? corte.somem : new Set(), vazios, restos, saiu, naOutra, cidadeEm,
             /* (na praça toda de modelo, tudo da cidade de hoje some) */
             kSome: TODAS ? () => true : (x, y) => saiu(x, y) || naOutra(x, y), modelo: MODELO,
             /* (o mundo é tudo o que ficou posto — a rua de veraneio, recolocada no passo 8, também: com a caixa
                de antes dela, o cenário 3D cortava a rua de veraneio fora da área dele) */
             estradas, placas, baia, avisos, mundo: bbDe([mundoC, bbDe(postas.map(p => p.r))].concat(baia ? [bbOf(baia.agua)] : [])), praca: CIS.id || null };
  }

  /* ---- O CANTEIRO DA AVENIDA DE ENTRADA: corre ao lado das quadras dela
     e abre nas ruas que a cruzam (o carro atravessa ali); fora da cidade,
     do começo da avenida até a rua da ponta dela, é contínuo ---- */
  /* (a praça toda de modelo não tem avenida de entrada: nem canteiro) */
  if (TODAS) { ENTRADA.canteiros = []; ENTRADA.cruzamentos = []; ENTRADA.cidade = null; }
  else {
    const lados = [];
    /* (na praça cortada, só as quadras do centro: a avenida é dele) */
    for (const q of quadras.filter(q => !CIS || q.cidade === CENTRO).concat(K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j))))
      if (Math.abs(q.x1 - ENTRADA.x0) < 2 || Math.abs(q.x0 - ENTRADA.x1) < 2) lados.push([q.y0, q.y1]);
    lados.sort((a, b) => a[0] - b[0]);
    const U = [];
    for (const [a, b] of lados) { if (U.length && a <= U[U.length - 1][1] + 1) U[U.length - 1][1] = Math.max(U[U.length - 1][1], b); else U.push([a, b]); }
    const [yN, yS] = [avEntrada.pontos[0][1], avEntrada.pontos[1][1]];
    ENTRADA.canteiros = U.length ? [[yN, U[0][0] - RUA]].concat(U, [[U[U.length - 1][1] + RUA, yS]]) : [[yN, yS]];
    /* as ruas que cruzam a avenida, dentro da cidade (a faixa de pedestre vai nelas) */
    ENTRADA.cruzamentos = [];
    for (let k = 1; k < U.length; k++) ENTRADA.cruzamentos.push([U[k - 1][1], U[k][0]]);
    ENTRADA.cidade = U.length ? [U[0][0] - RUA, U[U.length - 1][1] + RUA] : null;
  }
  const noAtacadex = (x, y, m = 0) => !!atacadex && x > atacadex.bb.x0 - m && x < atacadex.bb.x1 + m && y > atacadex.bb.y0 - m && y < atacadex.bb.y1 + m;

  /* a avenida de entrada vai de ponta a ponta do mundo (que cresceu com os estádios de verdade) */
  const deVerdade = copias.filter(e => e.terreno);
  /* (na praça cortada, `afastarCidades` já pôs as pontas dela) */
  if (!cisao) {
    avEntrada.pontos[0][1] = Math.min(avEntrada.pontos[0][1], ...deVerdade.map(e => e.area.y0 - RUA - 500));
    avEntrada.pontos[1][1] = Math.max(avEntrada.pontos[1][1], ...deVerdade.map(e => e.area.y1 + RUA + 500));
  }
  const residenciais = quadras.filter(q => !q.equip);
  const lotesNovos = quadras.reduce((n, q) => n + q.lotes.length, 0);
  /* o limite do mapa: o de tudo e o da cidade sem o entorno dos estádios
     (é por ele que a planta divide as zonas: o entorno não mexe nelas) */
  const limiteDe = (lista, favs = favelas) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const q of lista) { x0 = Math.min(x0, q.x0); y0 = Math.min(y0, q.y0); x1 = Math.max(x1, q.x1); y1 = Math.max(y1, q.y1); }
    for (const f of favs) for (const [px, py] of f.poly) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
    return { x0, y0, x1, y1 };
  };
  /* (na praça cortada: o limite de tudo, com as cidades de fora, sem as quadras de hoje que foram embora; o
     sem o entorno é só o do centro — é nele que a planta divide as zonas) */
  const kFica = cisao ? K.QUADRAS.filter(q => !cisao.kFora.has(q.i + ',' + q.j)) : K.QUADRAS;
  const { x0, y0, x1, y1 } = limiteDe(quadras.concat(kFica)),
        semEntorno = cisao ? limiteDe(quadras.filter(q => !q.entorno && q.cidade === CENTRO).concat(kFica), favelas.filter(f => f.cidade === CENTRO))
                           : limiteDe(quadras.filter(q => !q.entorno).concat(K.QUADRAS));
  const conta = {};
  for (const q of quadras) if (q.equip) conta[q.equip.tipo] = (conta[q.equip.tipo] || 0) + 1;
  return {
    mapa: { id: cfg.id, nome: cfg.nome, porte: cfg.porte, vagas: cfg.estadios.length, metro: !!cfg.metro && !TODAS, ...(MODELO ? { modelo: MODELO } : {}) },
    ficaFavelaDeHoje: !!cfg.favelaDeHoje && !TODAS,
    /* os estádios, na ordem das vagas (o 1º é o principal); o quarteirão do
       estádio de hoje, que virou casa */
    estadios: copias, estadioDeHoje,
    quadras, fora, avenidas, avenidasTiradas, favelas, atacadex, porticos, condominios, substitui, terrenos, veraneio,
    bares, baresHoje: BARES_HOJE, sedesHojeSaem, estadiosAqui, lotesExtra, lotesTirados, espacosSede, metro, lojas, lotesDoPredio, lotesDoBaldio,
    /* o entorno de cada estádio: os quarteirões (com os lotes deles em `quadras`) */
    entorno: quadras.filter(q => q.entorno),
    coberto, naFavelaNova, noAtacadex, naAvenida, distAvenida, favelaDeHoje: favBB, colX, linY: linYx,
    contagem: { quadras: quadras.length, residenciais: residenciais.length, equipamentos: quadras.length - residenciais.length,
                porTipo: conta, lotesNovos, lotesExtra: lotesExtra.length, lotesTirados: lotesTirados.size,
                casasFavela: favelas.map(f => f.lotes.length), casasFavelaHoje: FAV.length,
                quadrasTrocadas: substitui.size,
                quadrasHoje: K.QUADRAS.length, lotesHoje: K.QUADRAS.reduce((n, q) => n + q.lotes.length, 0) },
    limite: { x0: x0 - RUA, y0: y0 - RUA, x1, y1 },
    limiteSemEntorno: { x0: semEntorno.x0 - RUA, y0: semEntorno.y0 - RUA, x1: semEntorno.x1, y1: semEntorno.y1 },
    /* (a praça toda de modelo é só as cidades dela: a cidade de hoje saiu) */
    mundo: TODAS ? { x0: Math.min(x0, cisao.mundo.x0) - 400, y0: Math.min(y0, cisao.mundo.y0) - 400, x1: Math.max(x1, cisao.mundo.x1) + 400, y1: Math.max(y1, cisao.mundo.y1) + 400 }
         : cisao ? { x0: Math.min(x0 - 400, cisao.mundo.x0 - 400), y0: Math.min(cfg.mundoY0 ?? K.VY0, cisao.mundo.y0 - 400, atacadex ? atacadex.bb.y0 - 300 : Infinity),
                     x1: Math.max(K.VX0 + K.VW, cisao.mundo.x1 + 400), y1: Math.max(mundoY1, cisao.mundo.y1 + 400) }
         : { x0: x0 - 400, y0: Math.min(cfg.mundoY0 ?? K.VY0, atacadex ? atacadex.bb.y0 - 300 : Infinity, ...deVerdade.map(e => e.area.y0 - RUA - 300)),
             x1: Math.max(K.VX0 + K.VW, ...deVerdade.map(e => e.area.x1 + RUA + 400)), y1: Math.max(mundoY1, ...deVerdade.map(e => e.area.y1 + RUA + 300)) },
    /* AS CIDADES DA PRAÇA (nulo na praça de uma cidade só): onde cada uma
       ficou, as estradas, as placas, a baía, e o que saiu do mapa de hoje */
    cisao,
    /* a avenida de entrada: a banda dela (as duas pistas e o canteiro) */
    entrada: { ...ENTRADA }
  };
}
