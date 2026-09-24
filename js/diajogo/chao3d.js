/* =========================================================
   O CHÃO EM PBR — máscara de pintura + material ladrilhado
   ---------------------------------------------------------
   O problema, medido: a pintura da cidade (`texChao`) tem 4096 px
   esticados sobre 450 m de mundo, ou seja **9,1 pixels por metro**.
   A referência que a gente persegue tem 256 a 512. Pintar o mundo
   nessa densidade daria uma imagem de 115.200 × 86.784 px — dez
   gigapixels, não existe.

   A saída é a de qualquer motor: a pintura PARA DE SER A APARÊNCIA e
   VIRA A MÁSCARA. Ela continua dizendo onde é rua, calçada, areia e
   grama — com a paleta que o `estadio_pintura.js` já usa —, e quem dá
   o grão é um punhado de texturas pequenas, ladrilhadas a cada 2–4 m.
   1024 px a cada 4 m são 256 px/m: a conta fecha.

   DUAS DECISÕES QUE VALE ENTENDER:

   - O GRÃO entra multiplicando, pela LUMINÂNCIA normalizada pela
     média da própria textura (a cidade não clareia nem escurece no
     conjunto). A COR da textura entra à parte e por canal (`tinta`),
     no lugar da cor-base do canal e mantendo a diferença que a planta
     pintou em cima dela — ver a conta no `map_fragment`. Canal a
     canal porque a areia não pode tingir o asfalto.

   - O UV ladrilhado sai do MESMO `vMapUv` da pintura, multiplicado
     pelo tamanho do mundo. Não é firula: o three.js monta a base
     tangente (TBN) a partir desse UV, e se o relevo fosse amostrado
     num UV de outra orientação, ele sairia espelhado num dos eixos —
     buraco virando bolha só no sentido norte-sul.

   Cada canal que não tiver textura de verdade na pasta cai num grão
   GERADO aqui, com a mesma conta de normal map de sempre. Assim a
   cena nunca fica pior do que estava, e cada pacote que chega em
   `img/texturas/pbr/` melhora um pedaço sem mexer em código.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';

const PASTA = 'img/texturas/pbr/';
const TAM_GRAO = 512;

/* =======================================================
   O GRÃO GERADO — a reserva de quem ainda não tem textura
   ======================================================= */
function sementeGrao(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* a mancha, desenhada TAMBÉM nas cópias espelhadas quando cai perto da
   borda — é o que faz o ladrilho repetir sem costura */
function manchaSemCosto(c, x, y, r, tom, alfa) {
  c.globalAlpha = alfa; c.fillStyle = tom;
  const xs = x < r ? [0, TAM_GRAO] : x > TAM_GRAO - r ? [0, -TAM_GRAO] : [0];
  const ys = y < r ? [0, TAM_GRAO] : y > TAM_GRAO - r ? [0, -TAM_GRAO] : [0];
  for (const dx of xs) for (const dy of ys) {
    c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill();
  }
}
function criarAltura(receita, semente) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = TAM_GRAO;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = receita.base || '#b4b4b0';
  c.fillRect(0, 0, TAM_GRAO, TAM_GRAO);
  const rng = sementeGrao(semente);
  const entre = (a, b) => a + rng() * (b - a);
  for (const cam of receita.camadas) for (let i = 0; i < cam.n; i++) {
    const claro = rng() < (cam.claro !== undefined ? cam.claro : 0.5);
    manchaSemCosto(c, rng() * TAM_GRAO, rng() * TAM_GRAO, entre(cam.r[0], cam.r[1]),
                   claro ? (receita.claro || '#f2f0e8') : (receita.escuro || '#5c584c'),
                   entre(cam.a[0], cam.a[1]));
  }
  c.globalAlpha = 1;
  return cv;
}
/* ALTURA VIRA RELEVO: lê o cinza como altura e tira a inclinação pros
   vizinhos — a mesma conta de um filtro de normal map de editor de
   imagem. Os vizinhos são lidos com ENVOLTÓRIO (`% n`), senão o
   ladrilho ganha uma costura a cada repetição. */
function alturaParaNormal(cvAltura, forca) {
  const n = cvAltura.width;
  const dados = cvAltura.getContext('2d', { willReadFrequently: true })
                        .getImageData(0, 0, n, n).data;
  const alt = (x, y) => {
    const px = ((x % n) + n) % n, py = ((y % n) + n) % n;
    return dados[(py * n + px) * 4] / 255;
  };
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const c = cv.getContext('2d');
  const img = c.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (alt(x + 1, y) - alt(x - 1, y)) * forca;
    const dy = (alt(x, y + 1) - alt(x, y - 1)) * forca;
    const len = Math.hypot(dx, dy, 1);
    const i = (y * n + x) * 4;
    img.data[i]     = (-dx / len * 0.5 + 0.5) * 255;
    img.data[i + 1] = (-dy / len * 0.5 + 0.5) * 255;
    img.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
    img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return cv;
}

/* MEDE A IMAGEM: média e desvio da luminância.

   A média serve pra o detalhe multiplicativo ser neutro — sem ela uma
   textura escura escureceria a cidade inteira.

   O DESVIO serve pra igualar texturas desiguais. Cada pacote tem um
   contraste próprio: o concreto que chegou aqui tem desvio de 11 em
   255 (±4%, um piso lisíssimo) e a areia tem quase o triplo. Com um
   ganho único pra todos, a areia fica ótima e o concreto some — foi
   exatamente o que aconteceu, e de fora parece que o material "não
   entrou". Normalizando pelo desvio, cada canal entrega a MESMA
   variação visível, e a próxima textura que cair na pasta já nasce
   calibrada sem ninguém mexer em número nenhum. */
function medirImagem(fonte) {
  const L = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = L;
  const c = cv.getContext('2d', { willReadFrequently: true });
  try { c.drawImage(fonte, 0, 0, L, L); } catch (e) { return { media: 0.5, desvio: 0.1 }; }
  const d = c.getImageData(0, 0, L, L).data;
  let s = 0, s2 = 0;
  const n = L * L;
  for (let i = 0; i < d.length; i += 4) {
    const v = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
    s += v; s2 += v * v;
  }
  const media = s / n;
  return { media, desvio: Math.sqrt(Math.max(0, s2 / n - media * media)) };
}
/* o quanto de variação se quer ver, em luminância. Quem tiver menos
   que isso é amplificado; quem tiver mais é contido. */
const DESVIO_ALVO = 0.085;
const ganhoDoDesvio = d => Math.max(0.7, Math.min(3.2, DESVIO_ALVO / Math.max(d, 0.012)));

/* =======================================================
   OS QUATRO CANAIS DA MÁSCARA
   -------------------------------------------------------
   Quatro porque a máscara é uma textura RGBA e cada canal carrega o
   peso de um material. `paleta` são as chaves de cor do
   `estadio_pintura.js` que caem nele — é por essa lista que a pintura
   vira máscara, sem precisar repintar nada.
   ======================================================= */
const CANAIS = [
  /* `tinta` baixa no asfalto de propósito: o asphalt_04 do Poly Haven é
     um asfalto PÁLIDO (cinza médio 134), e emprestar 62% da cor dele
     subia a rua de 58 pra ~105 — clareava tanto que rua e calçada
     ficavam do mesmo tom e a cidade perdia a leitura. Com 0,35 a rua
     ficaria em ~85 — mas de longe, onde o mipmap reduz a textura à
     própria média, isso vira um cinza chapado e a rua encosta no tom da
     calçada; a cidade perde a leitura à distância, que é justamente
     onde ela mais precisa dela.

     A saída é separar os dois pesos: o GRÃO (`splatForcaCor`) traz a
     textura sem mexer no tom, e a COR (`tinta`) decide o quanto a rua
     puxa pro cinza do asfalto real.

     ESTE 0,45 É ESCOLHA DE DIREÇÃO DE ARTE, não de engenharia — foi o
     que se escolheu entre três renderizações da mesma avenida. É o mais
     fotográfico dos três e o mais perto das fotos de referência; em
     troca, rua e calçada ficam em tons próximos. Baixar pra 0,22 ou pra
     0 devolve o contraste estilizado, e é uma linha. */
  { chave: 'asfalto', pasta: 'asfalto', ladrilho: 3.4, rugosidade: 0.93, tinta: 0.45,
    paleta: ['rua', 'beco', 'pista', 'eixo', 'faixaPed'],
    grao: { base: '#b0b0ae', claro: '#e8e6de', escuro: '#4e4a42', camadas: [
      { n: 18, r: [22, 48], a: [0.10, 0.20] },
      { n: 150, r: [5, 13], a: [0.14, 0.28] },
      { n: 620, r: [1.1, 2.8], a: [0.20, 0.40] }] } },

  /* ladrilho maior que o do asfalto de propósito: o que esta textura
     tem de característico são as JUNTAS das placas, e junta é linha
     fina — a primeira coisa que o mipmap apaga. Placas maiores
     sobrevivem à redução e ainda ficam no tamanho de placa de calçada. */
  /* `tinta: 1` — a textura manda inteira na cor da calçada. Com 0,58 a
     cor pintada (#8d897d) entrava com 42% e, sendo quase igual à da
     textura (128,116,102), o que se via era a antiga lavando a nova:
     de fora parecia que o material "não tinha entrado". A variação que
     a pintura carrega (meio-fio, degrau, laje) não se perde mesmo
     assim — ela entra pela razão, no shader. */
  { chave: 'concreto', pasta: 'concreto', ladrilho: 4.2, rugosidade: 0.88, tinta: 1.0,
    paleta: ['calcada', 'calcadaEst', 'piso', 'patio', 'laje', 'degrau',
             'degrauAlt', 'arcada', 'meioFio', 'cerca'],
    grao: { base: '#b4b4b0', claro: '#efeee8', escuro: '#6e6a60', camadas: [
      { n: 26, r: [30, 62], a: [0.08, 0.16] },
      { n: 110, r: [7, 18], a: [0.10, 0.20] },
      { n: 380, r: [1.4, 3.4], a: [0.14, 0.28] }] } },

  /* terra e areia dividem o canal enquanto só uma das duas pastas tem
     textura: as duas são granulado, e como só a LUMINÂNCIA entra, a
     cor de cada uma continua sendo a que a planta pintou.
     `base: 'areia'` porque a foto é de AREIA: é a pintura de areia que
     tem de virar a textura pura. Com a base no lote (#7d7668), a areia
     pintada ficaria "mais clara que a base" e ganharia a diferença
     inteira somada por cima — praia estourada. */
  { chave: 'granulado', pasta: 'areia', ladrilho: 4.0, rugosidade: 0.96, tinta: 0.16, base: 'areia',
    paleta: ['lote', 'terreno', 'mato', 'matoEscuro', 'trilha',
             'areia', 'areiaMolhada'],
    grao: { base: '#b4b2ac', claro: '#efe9d8', escuro: '#6b6152', camadas: [
      { n: 22, r: [26, 56], a: [0.10, 0.20] },
      { n: 130, r: [6, 16], a: [0.14, 0.26] },
      { n: 520, r: [1.2, 3.0], a: [0.18, 0.36] }] } },

  { chave: 'grama', pasta: 'grama', ladrilho: 2.2, rugosidade: 0.97, tinta: 0.45,
    paleta: ['gramadoA', 'gramadoB', 'grama', 'gramaB', 'gramaPraca', 'moita', 'linha'],
    grao: { base: '#b0b2ac', claro: '#e6ecd8', escuro: '#5e6a4e', camadas: [
      { n: 30, r: [18, 40], a: [0.10, 0.20] },
      { n: 260, r: [4, 11], a: [0.16, 0.30] },
      { n: 700, r: [1.0, 2.6], a: [0.20, 0.40] }] } }
];
/* O QUE NÃO RECEBE GRÃO NENHUM: só a água.
   A SINALIZAÇÃO (eixo, faixa de pedestre, linha do campo) já esteve
   aqui e saiu. Fora de canal, ela abria um buraco na máscara — e a
   máscara tem 1024 px pra 450 m de mundo, quase meio metro por pixel,
   bem mais que a largura de um tracejado. A filtragem espalhava o
   buraco pro asfalto em volta, que perdia a cor da textura e voltava
   ao cinza-escuro pintado: cada tracejado ficava dentro de um
   retângulo escuro. Faixa é tinta SOBRE o asfalto, então ela fica no
   canal dele (relevo e grão de asfalto, como na rua de verdade), e
   quem preserva o amarelo é o shader, pixel a pixel na pintura de
   alta resolução — ver a conta da cor, no `map_fragment`. */
const SEM_GRAO = ['mar', 'marFundo', 'onda'];

/* TINTA SOBRE PISO: [tinta, piso onde ela é pintada].
   A pintura da planta tem 11 cm por pixel, e o tracejado do eixo tem
   uns 2 px de largura, desenhado com antisserrilhado. Resultado: nenhum
   pixel dele é o amarelo da paleta. Medido na avenida, o tracejado é
   `#827a51` (50% amarelo sobre a rua) e `#5e5a45` (25%) — e essas cores
   caíam no `lote` e na `moita`: terra e grama no meio da rua. A cor
   mais próxima da paleta não serve pra isto; o que serve é perguntar
   se o pixel está NA RETA entre a tinta e o piso dela. Se está, é tinta
   borrada sobre aquele piso, e vai pro canal do piso. */
const MISTURAS = [['eixo', 'rua'], ['faixaPed', 'rua'],
                  ['linha', 'gramadoA'], ['linha', 'gramadoB']];

/* =======================================================
   A MÁSCARA, tirada da própria pintura
   ======================================================= */
/* CLASSIFICA NA RESOLUÇÃO CHEIA E SÓ DEPOIS REDUZ — nessa ordem.
   A primeira versão encolhia a pintura (4096 → 1024, com suavização)
   e classificava o resultado. Parece igual e não é: encolher MISTURA
   AS CORES, e a mistura cai perto de uma terceira cor da paleta. Um
   texel 35% tracejado amarelo e 65% asfalto dá um cinza-oliva cuja cor
   mais próxima é o `meioFio`, do canal do CONCRETO; a 60% vira `lote`,
   do granulado. Cada tracejado da avenida ganhava um anel de concreto
   e de terra em volta — o retângulo escuro que aparecia na rua.
   Classificando pixel a pixel na pintura cheia (onde a cor é quase
   sempre exatamente a da paleta) e fazendo a MÉDIA DOS PESOS, o texel
   da borda sai "35% asfalto-faixa, 65% asfalto": 100% asfalto, que é
   o que ele é. */
function montarMascara(cvPintado, COR, lado) {
  const W = cvPintado.width, H = cvPintado.height;
  const alt = Math.max(1, Math.round(lado * H / W));
  /* LÊ DIRETO DA PINTURA, e ela tem de ter sido criada com
     `willReadFrequently: true` (o `estadio3d.js` cria assim). Sem isso
     o navegador guarda o canvas na GPU e cada leitura é uma cópia de
     volta de 50 MB: medido na carga, 3,8 s só pra máscara — inclusive
     na versão antiga, que encolhia com `drawImage` e pagava a mesma
     cópia sem aparecer. Com o canvas na memória, 0,36 s. */
  const ctx = cvPintado.getContext('2d', { willReadFrequently: true });

  const alvos = [];
  const por = (hex, canal) => {
    if (!hex) return;
    const n = parseInt(String(hex).slice(1), 16);
    alvos.push([n >> 16 & 255, n >> 8 & 255, n & 255, canal]);
  };
  CANAIS.forEach((c, i) => c.paleta.forEach(k => por(COR[k], i)));
  SEM_GRAO.forEach(k => por(COR[k], -1));
  const rgb = hex => { const n = parseInt(String(hex).slice(1), 16);
                       return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const retas = [];
  for (const [tinta, piso] of MISTURAS) {
    const canal = CANAIS.findIndex(c => c.paleta.includes(piso));
    if (canal < 0 || !COR[tinta] || !COR[piso]) continue;
    const a = rgb(COR[piso]), b = rgb(COR[tinta]);
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    retas.push({ a, ab, ab2: ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2], canal });
  }

  /* COMPARAR CADA PIXEL COM AS TRINTA CORES DA PALETA seriam 400
     milhões de contas e um engasgo visível na carga. Como a pintura só
     usa umas poucas dezenas de cores, um cache por cor quantizada em 5
     bits resolve: a segunda vez que a mesma cor aparece já sai de
     tabela. */
  const cache = new Int8Array(32768).fill(-2);
  const acum = new Uint16Array(lado * alt * 4);
  const total = new Uint16Array(lado * alt);
  const colDe = new Int32Array(W);
  for (let x = 0; x < W; x++) colDe[x] = Math.min(lado - 1, (x * lado / W) | 0);
  /* UMA LEITURA SÓ, do canvas inteiro; os 50 MB duram o tempo desta
     função. */
  const src = ctx.getImageData(0, 0, W, H).data;
  for (let y = 0; y < H; y++) {
    /* A LINHA VAI INVERTIDA de propósito. `texChao` é uma CanvasTexture
       (flipY = true: a primeira linha do canvas vira v=1), e a máscara
       é uma DataTexture (flipY = false: a primeira linha vira v=0).
       Escrevendo já invertido, as duas casam no mesmo `vMapUv`. */
    const linha = alt - 1 - Math.min(alt - 1, (y * alt / H) | 0);
    const baseLinha = linha * lado;
    for (let x = 0, q = y * W * 4; x < W; x++, q += 4) {
      const r = src[q], g = src[q + 1], b = src[q + 2];
      const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      let canal = cache[k];
      if (canal === -2) {
        let melhor = -1, dist = Infinity;
        for (let i = 0; i < alvos.length; i++) {
          const a = alvos[i];
          const d = (r - a[0]) * (r - a[0]) + (g - a[1]) * (g - a[1]) + (b - a[2]) * (b - a[2]);
          if (d < dist) { dist = d; melhor = a[3]; }
        }
        for (const t of retas) {
          const f = Math.max(0, Math.min(1, ((r - t.a[0]) * t.ab[0] + (g - t.a[1]) * t.ab[1]
                                             + (b - t.a[2]) * t.ab[2]) / t.ab2));
          const dr = r - t.a[0] - f * t.ab[0], dg = g - t.a[1] - f * t.ab[1],
                db = b - t.a[2] - f * t.ab[2];
          const d = dr * dr + dg * dg + db * db;
          if (d < dist) { dist = d; melhor = t.canal; }
        }
        canal = cache[k] = melhor;
      }
      const m = baseLinha + colDe[x];
      total[m]++;
      if (canal >= 0) acum[m * 4 + canal]++;
    }
  }
  const saida = new Uint8ClampedArray(lado * alt * 4);
  for (let m = 0; m < lado * alt; m++) {
    const t = total[m];
    if (!t) continue;
    for (let c = 0; c < 4; c++) saida[m * 4 + c] = Math.round(255 * acum[m * 4 + c] / t);
  }
  return saida;
}

/* =======================================================
   O GLSL
   ======================================================= */
const GLSL_SPLAT = `
uniform sampler2D splatMascara;
uniform sampler2D splatCorA, splatCorB, splatCorC, splatCorD;
uniform sampler2D splatNorA, splatNorB, splatNorC, splatNorD;
uniform vec4 splatLadrilho;
uniform vec4 splatMedia;
uniform vec4 splatGrao;
uniform vec4 splatRugosidade;
uniform vec4 splatTinta;
uniform vec3 splatBaseA, splatBaseB, splatBaseC, splatBaseD;
uniform vec2 splatArea;
uniform float splatForcaCor;
vec4 gPeso; vec2 gUV; float gTotal;
float splatLum( vec3 c ) { return dot( c, vec3( 0.299, 0.587, 0.114 ) ); }
void splatPreparar() {
  vec4 p = texture2D( splatMascara, vMapUv );
  float s = p.r + p.g + p.b + p.a;
  gPeso = s > 0.004 ? p / s : vec4( 0.0 );
  gTotal = clamp( s, 0.0, 1.0 );
  gUV = vMapUv * splatArea;
}
/* devolve a COR ponderada em rgb e o GRÃO (luminância normalizada) em a.
   São as mesmas quatro amostras pros dois — só muda a conta em cima. */
vec4 splatDetalhe() {
  vec3 a = texture2D( splatCorA, gUV / splatLadrilho.x ).rgb;
  vec3 b = texture2D( splatCorB, gUV / splatLadrilho.y ).rgb;
  vec3 c = texture2D( splatCorC, gUV / splatLadrilho.z ).rgb;
  vec3 d = texture2D( splatCorD, gUV / splatLadrilho.w ).rgb;
  /* a razão pela média fica em torno de 1; o ganho afasta dela o quanto
     for preciso pra cada textura render a mesma variação.
     O GANHO É EXPOENTE, NÃO FATOR. A versão anterior fazia
     1 + (razão − 1) × ganho: com ganho 3 e um pixel escuro da textura
     (razão 0,3) a conta dava −1,1 — cor NEGATIVA. No cinza da rua isso
     só escurecia; na borda da faixa amarela, onde a pintura é amarela,
     o negativo comia o vermelho e o verde e sobrava azul: um halo roxo
     em volta de cada tracejado. Com potência a razão nunca passa de
     zero, continua 1 na média e o ganho estica os dois lados igual. */
  vec4 razao = vec4( splatLum( a ) / max( splatMedia.x, 0.02 ),
                     splatLum( b ) / max( splatMedia.y, 0.02 ),
                     splatLum( c ) / max( splatMedia.z, 0.02 ),
                     splatLum( d ) / max( splatMedia.w, 0.02 ) );
  razao = pow( max( razao, vec4( 0.02 ) ), splatGrao );
  float lum = clamp( dot( gPeso, razao ), 0.25, 2.5 );
  return vec4( a * gPeso.r + b * gPeso.g + c * gPeso.b + d * gPeso.a, lum );
}
vec3 splatNormal() {
  vec3 n = ( texture2D( splatNorA, gUV / splatLadrilho.x ).xyz * 2.0 - 1.0 ) * gPeso.r
         + ( texture2D( splatNorB, gUV / splatLadrilho.y ).xyz * 2.0 - 1.0 ) * gPeso.g
         + ( texture2D( splatNorC, gUV / splatLadrilho.z ).xyz * 2.0 - 1.0 ) * gPeso.b
         + ( texture2D( splatNorD, gUV / splatLadrilho.w ).xyz * 2.0 - 1.0 ) * gPeso.a;
  return normalize( mix( vec3( 0.0, 0.0, 1.0 ), n, gTotal ) );
}
`;

export function criarChaoPBR(opc) {
  const { pintura, canvasPintado, texChao, area, maxAniso } = opc;
  const aniso = Math.min(8, maxAniso || 1);

  /* ---- a máscara ----
     1024 de largura dá um texel a cada 8,5 unidades (44 cm) — fino o
     bastante pra a guia da calçada não virar escada, e barato.

     E É UMA `DataTexture`, NÃO UM CANVAS. Canvas guarda alfa
     PRÉ-MULTIPLICADO: um pixel com R=255 e A=0 (que é como fica o peso
     "100% asfalto") volta do `getImageData` como zero puro, e a máscara
     nasce 98% vazia — foi exatamente o que aconteceu na primeira
     versão. Escrevendo o array direto na textura, os quatro canais
     chegam à GPU como foram escritos. */
  const LADO_MASCARA = 1024;
  const altMascara = Math.max(1, Math.round(
    LADO_MASCARA * canvasPintado.height / canvasPintado.width));
  const mascara = new THREE.DataTexture(
    montarMascara(canvasPintado, pintura.COR, LADO_MASCARA),
    LADO_MASCARA, altMascara, THREE.RGBAFormat);
  mascara.colorSpace = THREE.NoColorSpace;      // é peso, não é cor
  mascara.wrapS = mascara.wrapT = THREE.ClampToEdgeWrapping;
  mascara.minFilter = THREE.LinearMipmapLinearFilter;
  mascara.magFilter = THREE.LinearFilter;
  mascara.generateMipmaps = true;
  mascara.anisotropy = aniso;
  mascara.needsUpdate = true;

  const uniformes = {
    splatMascara:   { value: mascara },
    splatLadrilho:  { value: new THREE.Vector4() },
    splatMedia:     { value: new THREE.Vector4(0.5, 0.5, 0.5, 0.5) },
    splatRugosidade:{ value: new THREE.Vector4() },
    /* quanto da cor real de cada canal entra. Nasce ZERO: o grão gerado
       não tem cor que preste (é cinza de altura), e só sobe pro valor
       do canal quando o `cor.jpg` de verdade termina de carregar. */
    splatTinta:     { value: new THREE.Vector4(0, 0, 0, 0) },
    /* ganho do grão por canal, tirado do desvio medido de cada textura:
       é ele que faz um piso liso e uma areia marcada renderem a mesma
       quantidade de variação visível */
    splatGrao:      { value: new THREE.Vector4(1, 1, 1, 1) },
    /* a cor-base de cada canal: a pintura que corresponde à textura
       PURA. É a primeira cor da paleta (rua, calçada, gramado), salvo
       quando o canal diz outra em `base` */
    splatBaseA: { value: new THREE.Color(1, 1, 1) },
    splatBaseB: { value: new THREE.Color(1, 1, 1) },
    splatBaseC: { value: new THREE.Color(1, 1, 1) },
    splatBaseD: { value: new THREE.Color(1, 1, 1) },
    splatArea:      { value: new THREE.Vector2(area.w, area.h) },
    splatForcaCor:  { value: opc.forcaCor !== undefined ? opc.forcaCor : 0.92 },
    splatCorA: { value: null }, splatCorB: { value: null },
    splatCorC: { value: null }, splatCorD: { value: null },
    splatNorA: { value: null }, splatNorB: { value: null },
    splatNorC: { value: null }, splatNorD: { value: null }
  };
  const CHAVE_COR = ['splatCorA', 'splatCorB', 'splatCorC', 'splatCorD'];
  const CHAVE_NOR = ['splatNorA', 'splatNorB', 'splatNorC', 'splatNorD'];
  const CHAVE_BASE = ['splatBaseA', 'splatBaseB', 'splatBaseC', 'splatBaseD'];
  const METRO = opc.METRO || 19.43;

  /* ---- por canal: tenta a textura de verdade, cai no grão gerado ---- */
  const carregador = new THREE.TextureLoader();
  const relatorio = [];
  CANAIS.forEach((canal, i) => {
    uniformes.splatLadrilho.value.setComponent(i, canal.ladrilho * METRO);
    /* `new THREE.Color(hex)` já converte de sRGB pro espaço linear em
       que o `diffuseColor` está nesse ponto do shader */
    const baseHex = pintura.COR[canal.base || canal.paleta[0]];
    if (baseHex) uniformes[CHAVE_BASE[i]].value.set(baseHex);
    uniformes.splatRugosidade.value.setComponent(i, canal.rugosidade);

    const cvAltura = criarAltura(canal.grao, 51703 + i * 977);
    const gerCor = new THREE.CanvasTexture(cvAltura);
    const gerNor = new THREE.CanvasTexture(alturaParaNormal(cvAltura, 5.2));
    for (const t of [gerCor, gerNor]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso;
    }
    gerCor.colorSpace = THREE.NoColorSpace;     // entra só como luminância
    uniformes[CHAVE_COR[i]].value = gerCor;
    uniformes[CHAVE_NOR[i]].value = gerNor;
    const medGer = medirImagem(cvAltura);
    uniformes.splatMedia.value.setComponent(i, medGer.media);
    uniformes.splatGrao.value.setComponent(i, ganhoDoDesvio(medGer.desvio));

    canal._i = i;
  });

  /* ---- O QUE EXISTE DE VERDADE NA PASTA ----
     Pelo MANIFESTO, não na tentativa e erro. Pedir os quatro arquivos
     de cada material e deixar o 404 responder custaria seis erros
     vermelhos no console a cada carga — e este projeto trata "erros:
     nenhum" como regra, não como meta. O manifesto é escrito pelo
     `ferramentas/arrumar_pbr.py` junto com a conversão. */
  fetch(PASTA + 'manifesto.json')
    .then(r => (r.ok ? r.json() : {}))
    .then(man => {
      CANAIS.forEach((canal, i) => {
        const tem = man[canal.pasta];
        if (!tem) return;
        const base = PASTA + canal.pasta + '/';
        if (tem.indexOf('cor') >= 0) carregador.load(base + 'cor.jpg', tex => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = aniso;
          uniformes[CHAVE_COR[i]].value = tex;
          const med = medirImagem(tex.image);
          uniformes.splatMedia.value.setComponent(i, med.media);
          uniformes.splatGrao.value.setComponent(i, ganhoDoDesvio(med.desvio));
          uniformes.splatTinta.value.setComponent(i, canal.tinta || 0);
          relatorio.push(canal.chave + ':cor(desvio ' + med.desvio.toFixed(3) +
                         ' ganho ' + ganhoDoDesvio(med.desvio).toFixed(2) + ')');
        });
        if (tem.indexOf('normal') >= 0) carregador.load(base + 'normal.jpg', tex => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.colorSpace = THREE.NoColorSpace;   // relevo é dado, não é cor
          tex.anisotropy = aniso;
          uniformes[CHAVE_NOR[i]].value = tex;
          relatorio.push(canal.chave + ':normal');
        });
      });
    })
    .catch(() => {});

  /* ---- o material ----
     `normalMap` fica apontando pro grão gerado mesmo quando o splat vai
     mandar em tudo: é ele que faz o three.js definir `USE_NORMALMAP` e
     montar a base tangente. A amostra em si é substituída lá embaixo. */
  const material = new THREE.MeshStandardMaterial({
    map: texChao,
    normalMap: uniformes.splatNorA.value,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughness: 0.94, metalness: 0
  });

  /* quando o `onBeforeCompile` roda, os `#include` AINDA NÃO foram
     expandidos — por isso os chunks que precisam de cirurgia por dentro
     são expandidos aqui, na mão */
  const ALVO_N = 'vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;';
  const CHUNK_N = THREE.ShaderChunk.normal_fragment_maps
                       .replace(ALVO_N, 'vec3 mapN = splatNormal();');
  if (CHUNK_N === THREE.ShaderChunk.normal_fragment_maps)
    console.warn('chao3d: não achei o ponto de injeção do normal map');

  const anterior = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    if (anterior) anterior(shader, renderer);
    Object.assign(shader.uniforms, uniformes);
    shader.fragmentShader = shader.fragmentShader
      /* ANTES DO `main`, não depois do `<common>`: o `vMapUv` que estas
         funções leem é declarado no `<map_pars_fragment>`, que vem
         DEPOIS do common. Injetando cedo demais o shader não compila
         com "vMapUv: undeclared identifier". */
      .replace('void main() {', GLSL_SPLAT + '\nvoid main() {')
      .replace('#include <map_fragment>', `#include <map_fragment>
  splatPreparar();
  {
    vec4 det = splatDetalhe();
    /* O GRÃO entra sempre, multiplicando: é variação, serve pra
       qualquer superfície, inclusive as que só têm o grão gerado.
       A COR DE VERDADE entra por cima, e só onde o canal tem textura
       própria (\`splatTinta\`). Foi ela que faltou na primeira versão:
       guardando só a luminância, uma rua pintada de #3a3a38 — quase
       preta — continuava quase preta, porque multiplicar escuro por
       ±10% não muda quase nada. Com a cor do asfalto de verdade
       entrando, a rua sobe pro cinza que asfalto tem no sol. */
    vec3 comGrao = diffuseColor.rgb * mix( 1.0, det.a, splatForcaCor * gTotal );
    /* A TEXTURA MANDA NA COR, MAS NÃO APAGA O QUE A PINTURA SABE.
       Trocar a cor pintada pela da textura, seco, apagaria tudo o que
       a planta diferencia dentro de um canal: o concreto cobre do
       meio-fio (#6a675f) ao degrau do estádio (#c6bfab), e o asfalto
       carrega o tracejado amarelo e a faixa de pedestre. Então a
       textura entra no lugar da COR-BASE do canal, e a diferença entre
       o que foi pintado ali e essa base é mantida:

         pintura MAIS CLARA que a base → textura + (pintura − base)
         pintura MAIS ESCURA           → textura × s + (pintura − base × s),
                                          com s = lum(pintura) / lum(base)

       Na superfície comum (pintura = base) as duas dão a textura pura.
       O tracejado amarelo vira amarelo sobre o grão do asfalto; o
       meio-fio escurece a textura na proporção certa, sem ir a zero.

       A CONTA TEM DE SER LINEAR NA PINTURA — e isto custou três
       tentativas. De longe, o mipmap mistura o amarelo da faixa com o
       cinza da rua em volta, e o pixel borrado é "30% faixa, 70% rua".
       Com uma conta linear o resultado dele é também 30% do resultado
       da faixa + 70% do da rua, e a borda some suave. As versões com
       trava (clamp) ou com um "isto é tinta ou é asfalto?" decidiam
       diferente pro pixel borrado e desenhavam um retângulo escuro em
       volta de cada tracejado; a primeira, razão canal a canal com o
       grão podendo ficar negativo, desenhava um halo roxo. */
    vec3 base = splatBaseA * gPeso.r + splatBaseB * gPeso.g
              + splatBaseC * gPeso.b + splatBaseD * gPeso.a;
    float s = min( splatLum( diffuseColor.rgb ) / max( splatLum( base ), 0.004 ), 1.0 );
    vec3 comTextura = max( det.rgb * s + diffuseColor.rgb - base * s, vec3( 0.0 ) );
    diffuseColor.rgb = mix( comGrao, comTextura, dot( gPeso, splatTinta ) * gTotal );
  }`)
      .replace('#include <roughnessmap_fragment>',
               'float roughnessFactor = mix( roughness, dot( gPeso, splatRugosidade ), gTotal );')
      .replace('#include <normal_fragment_maps>', CHUNK_N);
  };
  material.userData.__chave = (material.userData.__chave || '') + '|splat';
  material.customProgramCacheKey = () => material.userData.__chave;
  material.needsUpdate = true;

  return {
    material, mascara, uniformes,
    get carregadas() { return relatorio.slice(); },
    /* o nível de qualidade mexe na anisotropia, como já mexia na do chão */
    anisotropia(n) {
      const v = Math.min(n, maxAniso || 1);
      mascara.anisotropy = v;
      for (const k of CHAVE_COR.concat(CHAVE_NOR)) {
        const t = uniformes[k].value;
        if (t) { t.anisotropy = v; t.needsUpdate = true; }
      }
    }
  };
}
