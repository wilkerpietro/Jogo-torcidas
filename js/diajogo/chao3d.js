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

   - O detalhe entra MULTIPLICANDO, e só pela LUMINÂNCIA. A cor de
     cada ponto da cidade continua sendo a que a planta pintou; o que
     a textura traz é a variação. Deixar a cor entrar faria o bege da
     areia tingir o asfalto — trocaria um problema por outro. E a
     luminância é normalizada pela média da própria textura, pra a
     cidade não clarear nem escurecer no conjunto.

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

/* a luminância média de uma imagem, pra o detalhe multiplicativo ser
   neutro — sem isso, uma textura escura escurece a cidade inteira */
function mediaDaImagem(fonte) {
  const L = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = L;
  const c = cv.getContext('2d', { willReadFrequently: true });
  try { c.drawImage(fonte, 0, 0, L, L); } catch (e) { return 0.5; }
  const d = c.getImageData(0, 0, L, L).data;
  let s = 0;
  for (let i = 0; i < d.length; i += 4)
    s += (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
  return s / (L * L);
}

/* =======================================================
   OS QUATRO CANAIS DA MÁSCARA
   -------------------------------------------------------
   Quatro porque a máscara é uma textura RGBA e cada canal carrega o
   peso de um material. `paleta` são as chaves de cor do
   `estadio_pintura.js` que caem nele — é por essa lista que a pintura
   vira máscara, sem precisar repintar nada.
   ======================================================= */
const CANAIS = [
  { chave: 'asfalto', pasta: 'asfalto', ladrilho: 3.4, rugosidade: 0.93,
    paleta: ['rua', 'beco', 'pista', 'eixo', 'faixaPed', 'linha'],
    grao: { base: '#b0b0ae', claro: '#e8e6de', escuro: '#4e4a42', camadas: [
      { n: 18, r: [22, 48], a: [0.10, 0.20] },
      { n: 150, r: [5, 13], a: [0.14, 0.28] },
      { n: 620, r: [1.1, 2.8], a: [0.20, 0.40] }] } },

  { chave: 'concreto', pasta: 'concreto', ladrilho: 2.8, rugosidade: 0.88,
    paleta: ['calcada', 'calcadaEst', 'piso', 'patio', 'laje', 'degrau',
             'degrauAlt', 'arcada', 'meioFio', 'cerca'],
    grao: { base: '#b4b4b0', claro: '#efeee8', escuro: '#6e6a60', camadas: [
      { n: 26, r: [30, 62], a: [0.08, 0.16] },
      { n: 110, r: [7, 18], a: [0.10, 0.20] },
      { n: 380, r: [1.4, 3.4], a: [0.14, 0.28] }] } },

  /* terra e areia dividem o canal enquanto só uma das duas pastas tem
     textura: as duas são granulado, e como só a LUMINÂNCIA entra, a
     cor de cada uma continua sendo a que a planta pintou */
  { chave: 'granulado', pasta: 'areia', ladrilho: 4.0, rugosidade: 0.96,
    paleta: ['lote', 'terreno', 'mato', 'matoEscuro', 'trilha',
             'areia', 'areiaMolhada'],
    grao: { base: '#b4b2ac', claro: '#efe9d8', escuro: '#6b6152', camadas: [
      { n: 22, r: [26, 56], a: [0.10, 0.20] },
      { n: 130, r: [6, 16], a: [0.14, 0.26] },
      { n: 520, r: [1.2, 3.0], a: [0.18, 0.36] }] } },

  { chave: 'grama', pasta: 'grama', ladrilho: 2.2, rugosidade: 0.97,
    paleta: ['gramadoA', 'gramadoB', 'grama', 'gramaB', 'gramaPraca', 'moita'],
    grao: { base: '#b0b2ac', claro: '#e6ecd8', escuro: '#5e6a4e', camadas: [
      { n: 30, r: [18, 40], a: [0.10, 0.20] },
      { n: 260, r: [4, 11], a: [0.16, 0.30] },
      { n: 700, r: [1.0, 2.6], a: [0.20, 0.40] }] } }
];
/* o que NÃO recebe grão nenhum: água é água */
const SEM_GRAO = ['mar', 'marFundo', 'onda'];

/* =======================================================
   A MÁSCARA, tirada da própria pintura
   ======================================================= */
function montarMascara(cvPintado, COR, lado) {
  const alt = Math.max(1, Math.round(lado * cvPintado.height / cvPintado.width));
  const tmp = document.createElement('canvas');
  tmp.width = lado; tmp.height = alt;
  const tc = tmp.getContext('2d', { willReadFrequently: true });
  tc.drawImage(cvPintado, 0, 0, lado, alt);
  const src = tc.getImageData(0, 0, lado, alt).data;

  const alvos = [];
  const por = (hex, canal) => {
    if (!hex) return;
    const n = parseInt(String(hex).slice(1), 16);
    alvos.push([n >> 16 & 255, n >> 8 & 255, n & 255, canal]);
  };
  CANAIS.forEach((c, i) => c.paleta.forEach(k => por(COR[k], i)));
  SEM_GRAO.forEach(k => por(COR[k], -1));

  /* COMPARAR CADA PIXEL COM AS TRINTA CORES DA PALETA seria 24 milhões
     de contas e um engasgo visível na carga. Como a pintura só usa umas
     poucas dezenas de cores, um cache por cor quantizada em 5 bits
     resolve: a segunda vez que a mesma cor aparece já sai de tabela. */
  const cache = new Int8Array(32768).fill(-2);
  const saida = new Uint8ClampedArray(lado * alt * 4);
  for (let p = 0, q = 0; p < lado * alt; p++, q += 4) {
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
      canal = cache[k] = melhor;
    }
    if (canal >= 0) {
      /* A LINHA VAI INVERTIDA de propósito. `texChao` é uma CanvasTexture
         (flipY = true: a primeira linha do canvas vira v=1), e a máscara
         é uma DataTexture (flipY = false: a primeira linha vira v=0).
         Escrevendo já invertido, as duas casam no mesmo `vMapUv`. */
      const linha = alt - 1 - ((p / lado) | 0);
      saida[(linha * lado + (p % lado)) * 4 + canal] = 255;
    }
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
uniform vec4 splatRugosidade;
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
float splatDetalhe() {
  return gPeso.r * splatLum( texture2D( splatCorA, gUV / splatLadrilho.x ).rgb ) / max( splatMedia.x, 0.02 )
       + gPeso.g * splatLum( texture2D( splatCorB, gUV / splatLadrilho.y ).rgb ) / max( splatMedia.y, 0.02 )
       + gPeso.b * splatLum( texture2D( splatCorC, gUV / splatLadrilho.z ).rgb ) / max( splatMedia.z, 0.02 )
       + gPeso.a * splatLum( texture2D( splatCorD, gUV / splatLadrilho.w ).rgb ) / max( splatMedia.w, 0.02 );
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
    splatArea:      { value: new THREE.Vector2(area.w, area.h) },
    splatForcaCor:  { value: opc.forcaCor !== undefined ? opc.forcaCor : 0.55 },
    splatCorA: { value: null }, splatCorB: { value: null },
    splatCorC: { value: null }, splatCorD: { value: null },
    splatNorA: { value: null }, splatNorB: { value: null },
    splatNorC: { value: null }, splatNorD: { value: null }
  };
  const CHAVE_COR = ['splatCorA', 'splatCorB', 'splatCorC', 'splatCorD'];
  const CHAVE_NOR = ['splatNorA', 'splatNorB', 'splatNorC', 'splatNorD'];
  const METRO = opc.METRO || 19.43;

  /* ---- por canal: tenta a textura de verdade, cai no grão gerado ---- */
  const carregador = new THREE.TextureLoader();
  const relatorio = [];
  CANAIS.forEach((canal, i) => {
    uniformes.splatLadrilho.value.setComponent(i, canal.ladrilho * METRO);
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
    uniformes.splatMedia.value.setComponent(i, mediaDaImagem(cvAltura));

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
          uniformes.splatMedia.value.setComponent(i, mediaDaImagem(tex.image));
          relatorio.push(canal.chave + ':cor');
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
  diffuseColor.rgb *= mix( 1.0, splatDetalhe(), splatForcaCor * gTotal );`)
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
