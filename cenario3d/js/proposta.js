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
  '-4': [[2, 5]],
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
/* AS VAGAS DE ESTÁDIO: seis quadras juntas (duas colunas, três linhas),
   sem as ruas do meio, com a cópia do quarteirão do estádio. O estádio
   de hoje é a primeira vaga de todo mapa; estas são as outras, na ordem
   em que a praça as ocupa. A vaga que a praça não usa volta a ser quadra
   de casa (se cai na grade) ou mato (se está fora dela). */
const ESTADIOS_GRANDE = [
  { i: [-2, -1], j: [8, 10], nome: 'Estádio Municipal' },          // no sudoeste
  { i: [-2, -1], j: [-1, 1], nome: 'Estádio do Noroeste' },        // no noroeste, no lugar de seis quadras
  { i: [-5, -4], j: [6, 8],  nome: 'Estádio do Oeste' }            // no oeste, onde era a favela
];

/* o que vira equipamento, e não casa */
const EQUIP_GRANDE = {
  '1,1':  { tipo: 'praca',  nome: 'Praça da Vila', cor: '#5f9a4c',
            nota: 'No meio de onde era a favela: o bairro novo ganha a praça dele.' },
  '-2,4': { tipo: 'shopping', nome: 'Shopping Poente', cor: '#8fa3ad', frente: 's',
            nota: 'O segundo shopping da cidade, no lugar do campo de várzea: fachada de vidro, a ponta redonda e o totem, a duas quadras do metrô.' },
  '-1,6': { tipo: 'delegacia', nome: '2º Distrito Policial', cor: '#d8cfb6', frente: 'n',
            nota: 'A delegacia do oeste, no lugar do posto de saúde: de frente pra entrada do metrô Poente, do outro lado da rua.' },
  '2,-1': { tipo: 'igreja', nome: 'Igreja', cor: '#d8cfb8',
            nota: 'A igreja do bairro novo do norte.' }
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

/* OS TERRENOS PRA SEDE: sete, espalhados pela cidade nova. Cada um é a
   fatia que a sede de nível 3 do jogo pede (a conta do `areaDaSede` da
   planta: 72% da frente da quadra, pelo menos 420, e o fundo inteiro),
   na ponta oeste da quadra; o resto da quadra continua casa. A sede de
   nível 1 usa só um canto dela. */
const TERRENOS_GRANDE = [
  { id: '5,0',   frente: 'n', onde: 'a duas quadras do estádio, no nordeste' },
  { id: '2,-3',  frente: 's', onde: 'no bairro novo do norte' },
  { id: '-1,-2', frente: 's', onde: 'no noroeste, perto da favela' },
  { id: '-4,4',  frente: 'n', onde: 'na ponta oeste' },
  { id: '0,4',   frente: 'n', onde: 'no meio do oeste' },
  { id: '-3,6',  frente: 's', onde: 'no oeste, perto da favela do sudoeste' },
  { id: '0,9',   frente: 's', onde: 'no sul, perto da entrada sul' }
];
/* as quadras altas que ganham rua no meio (um corte de norte a sul) */
const PARTIDAS = ['-3,2', '-1,2', '0,2'];
/* os pares que viram uma quadra só, por cima da rua (de oeste pra leste) */
const JUNTAS = [['0,-1', '1,-1'], ['-2,3', '-1,3'], ['0,7', '1,7']];
/* as avenidas transversais que saem da proposta */
const SEM_AVENIDA = ['oeste', 'noroeste2'];

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
   a da grade da cidade, com as casas grandes, e a cópia do estádio é a
   do Estádio Municipal. A praça escolhida decide o resto (`opc` do
   gerador): quantos estádios ela tem (a vaga que sobra vira quadra de
   casa, ou mato se está fora da grade) e se tem metrô. A praia é só do
   desenho: a página pinta mato no lugar dela. */
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
  { id: '5,0',  frente: 'n', onde: 'a duas quadras do estádio, no nordeste' },
  { id: '2,0',  frente: 's', onde: 'no norte, de frente pra cidade de hoje' },
  { id: '0,4',  frente: 'n', onde: 'no meio do oeste' },
  { id: '-2,5', frente: 'n', onde: 'no oeste, entre o shopping e o metrô' },
  { id: '0,9',  frente: 's', onde: 'no sul, perto da entrada sul' }
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
/* o pequeno é a cidade de hoje: a cópia do estádio vai pro sul, abaixo
   da 1,10 e do campo; as três favelas são da grade da cidade — a do
   noroeste no lugar da favela de hoje (que era torta, com a casa girada
   junto da estrada), a do oeste entre o Atacadex e a estrada sul e a do
   norte acima da 2,1 e da 3,1; os três terrenos saem de quadras de hoje,
   na ponta sem casa de avenida */
const TERRENOS_PEQUENO = [
  { id: '1,6', frente: 'n', hoje: true, onde: 'no oeste, perto do Atacadex' },
  { id: '2,1', frente: 's', hoje: true, onde: 'no norte, entre as duas favelas' },
  { id: '3,4', frente: 'n', hoje: true, ponta: 'l', onde: 'no meio da cidade' }
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
    grade: {}, estadios: [{ i: [1, 2], j: [11, 13], nome: 'Estádio Municipal' }],
    equip: {}, metro: null, condominios: [], terrenos: TERRENOS_PEQUENO,
    partidas: [], juntas: [], semAvenida: [], favelas: FAVELAS_PEQUENO, favelaDeHoje: false,
    nBares: 8, atacadexNoNorte: false, norteJ: 1, norteAte: null, beiramarJ: null, mundoY0: null
  },
  medio: {
    id: 'medio', nome: 'Mapa médio', porte: 'Médio',
    grade: GRADE_MEDIO, estadios: ESTADIOS_GRANDE.slice(0, 2),
    equip: EQUIP_GRANDE, metro: METRO_GRANDE, condominios: CONDOMINIOS, terrenos: TERRENOS_MEDIO,
    partidas: PARTIDAS, juntas: JUNTAS, semAvenida: SEM_AVENIDA,
    favelas: [FAVELA_NOROESTE_MEDIO].concat(FAVELAS_GRANDE.filter(f => f.id === 'sudoeste' || f.id === 'sul'), [FAVELA_NORTE_MEDIO]), favelaDeHoje: false,
    nBares: 12, atacadexNoNorte: true, norteJ: -1, norteAte: -2750, beiramarJ: null, mundoY0: -2750
  },
  grande: {
    id: 'grande', nome: 'Mapa grande', porte: 'Grande',
    grade: GRADE_GRANDE, estadios: ESTADIOS_GRANDE,
    equip: EQUIP_GRANDE, metro: METRO_GRANDE, condominios: CONDOMINIOS, terrenos: TERRENOS_GRANDE,
    partidas: PARTIDAS, juntas: JUNTAS, semAvenida: SEM_AVENIDA, favelas: FAVELAS_GRANDE, favelaDeHoje: false,
    nBares: 18, atacadexNoNorte: true, norteJ: -2, norteAte: -2750, beiramarJ: -2, mundoY0: -2750
  }
};
/* o mapa de cada porte da planilha */
export const MAPA_DO_PORTE = { Pequeno: 'pequeno', 'Médio': 'medio', Grande: 'grande' };

export function gerarProposta(P, cfg = MAPAS.grande, opc = {}) {
  const K = P.CIDADE, CALC = K.CALC, M = P.METRO;
  /* (os nomes de dentro escondem os de fora, que são os do mapa grande) */
  const GRADE = cfg.grade, EQUIP = cfg.equip, CONDOMINIOS = cfg.condominios, TERRENOS_SEDE = cfg.terrenos,
        PARTIDAS = cfg.partidas, JUNTAS = cfg.juntas, SEM_AVENIDA = cfg.semAvenida, FAVELAS = cfg.favelas;
  /* o metrô só na praça que tem */
  const METRO = opc.metro === false ? null : cfg.metro;
  /* as vagas de estádio que a praça ocupa: a primeira é o estádio de hoje,
     as cópias vêm na ordem do mapa (`opc.estadios` é quantos a praça tem) */
  const nCopias = Math.max(0, Math.min(cfg.estadios.length, (opc.estadios ?? cfg.estadios.length + 1) - 1));
  const VAGAS = cfg.estadios.slice(0, nCopias);
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

  /* ---- a grade: as colunas e as linhas de hoje, e as novas no mesmo passo ---- */
  const cx0 = K.COLUNAS[0].c, passoX = K.COLUNAS[1].c - K.COLUNAS[0].c;
  const ly0 = K.LINHAS[0].c;
  const colX = i => i >= 1 ? [K.bordasX[2 * i], K.bordasX[2 * i + 1]]
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

  /* ---- as avenidas da proposta ---- */
  const av = id => K.AVENIDAS.find(a => a.id === id);
  const avenidas = [], avenidasTiradas = K.AVENIDAS.filter(a => SEM_AVENIDA.includes(a.id));
  /* a borda do mundo: as favelas mandam no oeste e no sul */
  const polys = FAVELAS.flatMap(f => f.poly);
  /* (e a vaga de estádio ocupada, que no mapa pequeno fica ao sul da cidade) */
  const mundoY1 = Math.max(6100, ...polys.map(p => p[1]), ...VAGAS.map(v => linYx(v.j[1])[1])) + 300;
  for (const a of K.AVENIDAS) {
    if (SEM_AVENIDA.includes(a.id)) continue;
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
  const distSeg = (x, y, [ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
  };
  const distAvenida = (x, y, a) => { let d = Infinity; for (let k = 1; k < a.pontos.length; k++) d = Math.min(d, distSeg(x, y, a.pontos[k - 1], a.pontos[k])); return d; };
  const naAvenida = (x, y, m = 0) => avenidas.some(a => distAvenida(x, y, a) < a.l / 2 + m);

  const cantos = l => K.cantosDoLote(l).slice(0, 4);
  const bbOf = pts => ({ x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])),
                         y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) });
  const FAV = K.BEIRA.filter(l => l.favela);
  const favBB = bbOf(FAV.flatMap(cantos));

  /* ---- o atacarejo, na estrada norte: de frente pra estrada, antes do pórtico ---- */
  const A0 = K.ATACADEX;
  let atacadex = null;
  if (A0 && cfg.atacadexNoNorte) {
    const norte = av('norte'), xN = norte.pontos[0][0];
    const zP = 20;                                                        // o estacionamento: 20 m até a guia
    const W = A0.W, D = A0.D;
    const f = { x0: xN + norte.l / 2 + CALC + 30 + zP * M, y0: -2560 };
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
  const porticos = [];
  {
    const n = av('norte'), xN = n.pontos[0][0];
    porticos.push({ id: 'norte', nome: 'Pórtico da entrada norte', x: xN, y: linY(cfg.norteJ)[0] - RUA - 88, dir: [0, 1], l: n.l });
    const s = avenidas.find(a => a.id === 'sudoeste').pontos, [ax, ay] = s[0], [bx, by] = s[1];
    const yP = linY(10)[1] + RUA + 84, t = (yP - ay) / (by - ay);
    const L = Math.hypot(bx - ax, by - ay);
    porticos.push({ id: 'sul', nome: 'Pórtico da entrada sul', x: ax + (bx - ax) * t, y: yP, dir: [(bx - ax) / L, (by - ay) / L], l: av('sudoeste').l });
  }

  /* ---- as células ---- */
  const celulas = [];
  const nova = (i, j, x0, x1, y0, y1, parte, extra) => celulas.push({ i, j, x0, x1, y0, y1, parte: parte || '', ...extra });
  const xn = av('norte').pontos[0][0], ln = av('norte').l;
  const naVaga = (v, i, j) => i >= v.i[0] && i <= v.i[1] && j >= v.j[0] && j <= v.j[1];
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
  const substitui = new Set(K.QUADRAS.filter(cortada).map(q => q.i + ',' + q.j));
  for (const par of JUNTAS) for (const id of par) if (deHoje(id)) substitui.add(id);
  const ids = [];
  for (const [ci, faixas] of Object.entries(GRADE)) for (const [ja, jb] of faixas) for (let j = ja; j <= jb; j++) ids.push([+ci, j]);
  for (const id of substitui) { const [i, j] = id.split(',').map(Number); if (!ids.some(([a, b]) => a === i && b === j)) ids.push([i, j]); }
  const juntaDe = new Map();
  for (const par of JUNTAS) for (const id of par) juntaDe.set(id, par);
  const feitas = new Set();
  for (const [i, j] of ids) {
    const id = i + ',' + j;
    if (noEstadio2(i, j) || feitas.has(id)) continue;
    const par = juntaDe.get(id);
    if (par) {
      /* as duas viram uma, por cima da rua que as separava */
      const rs = par.map(k => { const [a, b] = k.split(',').map(Number); return [colX(a), linY(b)]; });
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
    const [x0, x1] = colX(i), [y0, y1] = linY(j);
    if (PARTIDAS.includes(id)) {
      /* a quadra alta com a rua no meio, de norte a sul */
      const xm = (x0 + x1) / 2;
      nova(i, j, x0, xm - RUA / 2, y0, y1, 'o', { sal: 1, partida: true });
      nova(i, j, xm + RUA / 2, x1, y0, y1, 'l', { sal: 2, partida: true });
    } else if (xn > x0 && xn < x1) {
      /* a avenida norte sobe reta pelo meio da coluna do estádio e parte a quadra em duas */
      nova(i, j, x0, xn - ln / 2, y0, y1, 'o', { sal: 1 }); nova(i, j, xn + ln / 2, x1, y0, y1, 'l', { sal: 2 });
    } else nova(i, j, x0, x1, y0, y1, '', substitui.has(id) ? { substitui: [id], refeita: true } : {});
  }
  /* as cópias do estádio, uma por vaga ocupada: o quarteirão do estádio de
     hoje, deslocado pro meio da vaga */
  const copias = VAGAS.map((v, k) => {
    const area = { x0: colX(v.i[0])[0], x1: colX(v.i[1])[1], y0: linYx(v.j[0])[0], y1: linYx(v.j[1])[1] };
    const dx = (area.x0 + area.x1) / 2 - (P.QEST_X0 + P.QEST_X1) / 2, dy = (area.y0 + area.y1) / 2 - (P.QEST_Y0 + P.QEST_Y1) / 2;
    return { id: 'estadio' + (k + 2), vaga: k + 2, nome: v.nome, dx, dy, area, i: v.i, j: v.j,
             qest: { x0: P.QEST_X0 + dx, x1: P.QEST_X1 + dx, y0: P.QEST_Y0 + dy, y1: P.QEST_Y1 + dy } };
  });

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
    quadras.push({ i: e.i[0], j: e.j[0], parte: '', id: e.id, ...e.area, ix0: e.area.x0 + CALC, ix1: e.area.x1 - CALC, iy0: e.area.y0 + CALC, iy1: e.area.y1 - CALC,
                   lotes: [], estadio: e, equip: { tipo: 'estadio', nome: e.nome, cor: '#9d9a90',
                                                   nota: 'Cópia do quarteirão do estádio, com a esplanada em volta: o estádio de outro clube da cidade.' } });

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
    q.faixaLotes = { x0: q.ix1 - 112, x1: q.ix1, y0: q.iy0, y1: q.iy1 };  // a fileira de casas do outro lado
    q.jardim = { x0: q.ix0 + L, x1: q.ix1 - 112, y0: q.iy0, y1: q.iy1 };
    condominios.push({ q, torres, ...cd });
  }

  /* ---- os lotes: a conta do `lotear()`, com hash no lugar do sorteio ---- */
  const tocaAvenida = l => {
    const xs = [l.x0, (l.x0 + l.x1) / 2, l.x1], ys = [l.y0, (l.y0 + l.y1) / 2, l.y1];
    for (const x of xs) for (const y of ys) if (naAvenida(x, y, CALC + 4)) return true;
    return false;
  };
  const noEstadio = l => (l.x1 > P.QEST_X0 && l.x0 < P.QEST_X1 && l.y1 > P.QEST_Y0 && l.y0 < P.QEST_Y1) || copias.some(e => cruza(l, e.qest, 0));
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
        if (tocaAvenida(l) || noEstadio(l)) continue;
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
  for (const q of quadras) {
    if (q.equip && q.equip.tipo === 'condominio') {
      const r = q.faixaLotes;
      lotear(q, [{ f: 'l', x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 }]);
      continue;
    }
    if (q.equip) continue;
    const largI = q.ix1 - q.ix0, altI = q.iy1 - q.iy0;
    if (largI < 40 || altI < 40) continue;
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
    lotear(q, frentes);
    if (!raso) q.quintal = { x0: q.ix0 + prof, x1: q.ix1 - prof, y0: q.iy0 + prof, y1: q.iy1 - prof };
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
  TERRENOS_SEDE.forEach((t, k) => {
    const hoje = !!t.hoje;
    const q = hoje ? deHoje(t.id) : quadras.find(q => q.id === t.id);
    if (!q || q.equip || (hoje && substitui.has(t.id))) return;
    const Lx = q.ix1 - q.ix0, Ly = q.iy1 - q.iy0;
    const w = hoje ? Math.min(Lx, 430) : Math.min(Lx, Math.max(420, Lx * 0.72));
    if (w < 340 || Ly < 190) return;
    const leste = t.ponta === 'l';
    const area = { x0: leste ? q.ix1 - w : q.ix0, x1: leste ? q.ix1 : q.ix0 + w, y0: q.iy0, y1: q.iy1 };
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
    const T = { n: k + 1, nome: 'Terreno para sede ' + (k + 1), frente: t.frente, onde: t.onde, area, quadra: hoje ? t.id : q.id, emQuadraDeHoje: hoje };
    if (!hoje) q.terreno = T;                 // (a quadra de hoje é da planta, a mesma pros três mapas: não se mexe nela)
    terrenos.push(T);
  });

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
     que já existem na quadra, só onde não tem lote */
  for (const id of BARES_HOJE) {
    const q = deHojeSem.find(q => q.i + ',' + q.j === id);
    if (!q || !q.equip || q.equip.tipo !== 'bar') continue;
    const fundos = q.lotes.filter(l => !l.ang && (l.frente === 'n' || l.frente === 's')).map(l => l.y1 - l.y0);
    const prof = Math.max(88, ...fundos);
    const ocup = q.lotes.map(bbLote);
    const fileiras = [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy0 + prof }, { f: 's', x0: q.ix0, x1: q.ix1, y0: q.iy1 - prof, y1: q.iy1 },
                      { f: 'o', x0: q.ix0, x1: q.ix0 + prof, y0: q.iy0 + prof, y1: q.iy1 - prof }, { f: 'l', x0: q.ix1 - prof, x1: q.ix1, y0: q.iy0 + prof, y1: q.iy1 - prof }];
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
    const qx = { i: q.i, j: q.j, sal: 7, lotes: [] };
    lotear(qx, livres);
    for (const l of qx.lotes) { l.quadra = { i: q.i, j: q.j, hoje: true }; l.fatiaDoBar = true; lotesExtra.push(l); }
  }
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
  while (escolhidas.length < N_BARES) {
    let melhor = null, md = -1;
    for (const e of esquinas) {
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

  /* ---- OS ESPAÇOS DE SEDE: os sete terrenos e as duas sedes de hoje
     (a 2,9 é a fatia de nível 3; a 5,2, a de nível 1 — ali só cabe a
     sede pequena). A página é que diz quem mora em cada um. ---- */
  const espacosSede = terrenos.map(t => ({ id: 'terreno' + t.n, nome: t.nome, area: t.area, frente: t.frente, cabe: 5, hoje: false, quadra: t.quadra, terreno: t,
                                          emQuadraDeHoje: !!t.emQuadraDeHoje }));
  for (const q of deHojeSem) if (q.equip && q.equip.tipo === 'sede')
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
  for (const q of quadras) q.rua = ruaDe(q);
  const barra = quadras.map(q => q.rua)
    .concat(K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j)).map(q => ruaDe(q)))
    .concat(K.BEIRA.filter(l => !l.favela).map(l => bbOf(cantos(l))).filter(b => {
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
  const livre = (x, y) => !barra.some(r => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) && !naAvenida(x, y, CALC + 10) &&
                          !porticos.some(p => Math.hypot(p.x - x, p.y - y) < 280);
  const faixaX = i => [colX(i)[1], colX(i + 1)[0]];                   // a faixa da rua entre a coluna i e a i+1
  const faixaY = j => [linYx(j)[1], linYx(j + 1)[0]];
  const meioX = i => (faixaX(i)[0] + faixaX(i)[1]) / 2, meioY = j => (faixaY(j)[0] + faixaY(j)[1]) / 2;
  /* onde a grade já é cidade: quadra nova, quadra de hoje, estádio, campo */
  const ocupadas = new Set();
  for (const q of quadras) {
    if (q.estadio) { for (let i = q.estadio.i[0]; i <= q.estadio.i[1]; i++) for (let j = q.estadio.j[0]; j <= q.estadio.j[1]; j++) ocupadas.add(i + ',' + j); }
    else if (q.juntas) for (const id of q.juntas) ocupadas.add(id);
    else ocupadas.add(q.i + ',' + q.j);
  }
  for (const q of K.QUADRAS) if (!substitui.has(q.i + ',' + q.j)) ocupadas.add(q.i + ',' + q.j);
  for (let i = 0; i < K.grade.length; i++) for (let j = 0; j < (K.grade[i] || []).length; j++) {
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
  const favelas = FAVELAS.map(F => gerarFavela(F));
  function gerarFavela(F) {
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
    const distBarra = (x, y) => { let d = Infinity; for (const r of barra) { const dx = Math.max(r.x0 - x, 0, x - r.x1), dy = Math.max(r.y0 - y, 0, y - r.y1); d = Math.min(d, Math.hypot(dx, dy)); } return d; };
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
    for (let i = -10; i <= 5; i++) for (let j = -6; j <= 16; j++) {
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
    return { id: F.id, nome: F.nome, poly: F.poly, lotes, becos, arvores, moitas: [], campinho, bb: bbL,
             grandes: reservas.length, quarteiroes: cels.length };
  }

  /* ---- o que a proposta cobre (pra esconder o mato, a beira e a favela de hoje) ---- */
  const coberto = (x, y, folga = RUA / 2) => quadras.some(q => x > q.x0 - folga && x < q.x1 + folga && y > q.y0 - folga && y < q.y1 + folga);
  const naFavelaNova = (x, y) => favelas.some(f => dentroPol(x, y, f.poly));
  const noAtacadex = (x, y, m = 0) => !!atacadex && x > atacadex.bb.x0 - m && x < atacadex.bb.x1 + m && y > atacadex.bb.y0 - m && y < atacadex.bb.y1 + m;

  const residenciais = quadras.filter(q => !q.equip);
  const lotesNovos = quadras.reduce((n, q) => n + q.lotes.length, 0);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const q of quadras.concat(K.QUADRAS)) { x0 = Math.min(x0, q.x0); y0 = Math.min(y0, q.y0); x1 = Math.max(x1, q.x1); y1 = Math.max(y1, q.y1); }
  for (const f of favelas) for (const [px, py] of f.poly) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
  const conta = {};
  for (const q of quadras) if (q.equip) conta[q.equip.tipo] = (conta[q.equip.tipo] || 0) + 1;
  return {
    mapa: { id: cfg.id, nome: cfg.nome, porte: cfg.porte, vagas: cfg.estadios.length + 1, metro: !!cfg.metro },
    ficaFavelaDeHoje: !!cfg.favelaDeHoje,
    /* as cópias do estádio, na ordem das vagas (a 1ª é o estádio de hoje) */
    estadios: copias,
    quadras, fora, avenidas, avenidasTiradas, favelas, atacadex, porticos, condominios, substitui, terrenos,
    bares, baresHoje: BARES_HOJE, lotesExtra, lotesTirados, espacosSede, metro,
    coberto, naFavelaNova, noAtacadex, naAvenida, distAvenida, favelaDeHoje: favBB,
    contagem: { quadras: quadras.length, residenciais: residenciais.length, equipamentos: quadras.length - residenciais.length,
                porTipo: conta, lotesNovos, lotesExtra: lotesExtra.length, lotesTirados: lotesTirados.size,
                casasFavela: favelas.map(f => f.lotes.length), casasFavelaHoje: FAV.length,
                quadrasTrocadas: substitui.size,
                quadrasHoje: K.QUADRAS.length, lotesHoje: K.QUADRAS.reduce((n, q) => n + q.lotes.length, 0) },
    limite: { x0: x0 - RUA, y0: y0 - RUA, x1, y1 },
    mundo: { x0: x0 - 400, y0: cfg.mundoY0 ?? K.VY0, x1: K.VX0 + K.VW, y1: mundoY1 }
  };
}
