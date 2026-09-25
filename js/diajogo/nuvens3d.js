/* =========================================================
   O CÉU COM NUVEM, E A SOMBRA DELA NO BAIRRO
   ---------------------------------------------------------
   Duas coisas que têm de ser A MESMA COISA, senão a sombra
   lê como "a tela escureceu" em vez de "passou uma nuvem":

   1. a NUVEM QUE SE VÊ, num lençol alto sobre a cidade;
   2. a SOMBRA QUE ELA FAZ, descontada da luz do sol.

   As duas saem da mesma textura, na mesma escala de mundo e
   com o mesmo vento — e a função que lê a nuvem (`nuvemEm`)
   é literalmente o mesmo pedaço de GLSL nos dois lugares.

   O QUE FAZ A SOMBRA SER FIEL é o deslocamento: nuvem não
   faz sombra embaixo de si, faz sombra do lado oposto ao
   sol. Uma nuvem a `H` de altura, com o sol na direção `L`,
   joga a sombra a `H/L.y * L.xz` de distância dela. Com o
   sol baixo a sombra corre longe; com o sol a pino ela cai
   quase embaixo. É uma conta de três linhas e é ela que faz
   o olho aceitar as duas como a mesma nuvem.

   A sombra desconta só a luz DIRETA (o sol). A hemisférica
   é o céu, e o céu continua lá quando a nuvem passa — por
   isso embaixo da nuvem fica mais azulado e mais chapado,
   não preto. É o que acontece na rua.
   ========================================================= */
import * as THREE from '../../vendor/three/three.module.min.js';

const TAM = 512;

/* ---- A TEXTURA DA NUVEM ----
   Manchas moles de vários tamanhos, somadas, com as cópias
   espelhadas nas bordas pra ladrilhar sem costura — o mesmo
   truque do grão do chão. O contraste final vem do shader
   (`nuvemCobertura`), não daqui: assim dá pra abrir e fechar
   o tempo sem repintar textura nenhuma. */
function pintarNuvem(semente) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = TAM;
  const c = cv.getContext('2d', { willReadFrequently: false });
  c.fillStyle = '#000'; c.fillRect(0, 0, TAM, TAM);
  let s = semente >>> 0;
  const rnd = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  c.globalCompositeOperation = 'lighter';
  /* quatro oitavas: poucas manchas grandes dão a forma da nuvem,
     muitas pequenas dão a borda esfarrapada */
  const OITAVAS = [
    { n: 10, r: [110, 200], a: 0.30 },
    { n: 26, r: [56, 110], a: 0.22 },
    { n: 70, r: [24, 58], a: 0.15 },
    { n: 170, r: [8, 26], a: 0.10 }
  ];
  for (const o of OITAVAS) for (let i = 0; i < o.n; i++) {
    const x = rnd() * TAM, y = rnd() * TAM;
    const r = o.r[0] + rnd() * (o.r[1] - o.r[0]);
    const xs = x < r ? [0, TAM] : x > TAM - r ? [0, -TAM] : [0];
    const ys = y < r ? [0, TAM] : y > TAM - r ? [0, -TAM] : [0];
    for (const dx of xs) for (const dy of ys) {
      const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, `rgba(255,255,255,${o.a})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill();
    }
  }
  c.globalCompositeOperation = 'source-over';
  return cv;
}

/* ---- A LEITURA DA NUVEM, EM GLSL ----
   Vai inteiro tanto no céu quanto na sombra. Duas amostras em
   escalas diferentes: com uma só, o ladrilho de 2.600 unidades
   repetindo sobre 8.700 de mundo aparece como um xadrez óbvio no
   chão; a segunda, em escala quebrada, mata o padrão. */
const GLSL_NUVEM = `
uniform sampler2D nuvemMapa;
uniform vec2 nuvemVento;
uniform float nuvemEscala;
uniform float nuvemCobertura;
float nuvemEm( vec2 xz ) {
  vec2 uv = ( xz + nuvemVento ) / nuvemEscala;
  float n = texture2D( nuvemMapa, uv ).r * 0.62
          + texture2D( nuvemMapa, uv * 0.37 + vec2( 0.31, 0.17 ) ).r * 0.38;
  return smoothstep( nuvemCobertura, nuvemCobertura + 0.30, n );
}
`;

export function criarNuvens(opc) {
  const o = opc || {};
  const tex = new THREE.CanvasTexture(pintarNuvem(o.semente || 20931));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;          // é dado, não é cor

  /* UM objeto de uniformes só, compartilhado por TODOS os materiais que
     recebem sombra de nuvem e pelo céu. Mexer em `.value` aqui muda a
     cena inteira no mesmo quadro — é isso que mantém céu e chão na
     mesma nuvem. */
  const uniformes = {
    nuvemMapa:      { value: tex },
    nuvemVento:     { value: new THREE.Vector2(0, 0) },
    nuvemEscala:    { value: o.escala || 2600 },      // unidades por ladrilho
    nuvemCobertura: { value: o.cobertura !== undefined ? o.cobertura : 0.46 },
    nuvemForca:     { value: o.forca !== undefined ? o.forca : 0.72 },
    nuvemAltura:    { value: o.altura || 2200 },
    /* quanto a sombra anda no chão por unidade de altura da nuvem:
       é `sol.xz / sol.y`, e quem atualiza é `apontarSol` */
    nuvemDeriva:    { value: new THREE.Vector2(0, 0) }
  };

  const vento = new THREE.Vector2(o.ventoX !== undefined ? o.ventoX : 26,
                                  o.ventoZ !== undefined ? o.ventoZ : 11);

  /* ---- O LENÇOL DE NUVEM QUE SE VÊ ----
     Um plano enorme lá em cima. Ele NÃO usa material de luz: nuvem
     vista de baixo é céu, não superfície iluminada. E ele apaga com a
     distância — sem isso, rente ao horizonte o lençol vira um borrão
     esticado, que é o jeito clássico de estragar um céu assim. */
  const geo = new THREE.PlaneGeometry(1, 1);
  const matCeu = new THREE.ShaderMaterial({
    uniforms: Object.assign({
      corNuvem:  { value: new THREE.Color(o.corNuvem || '#f4f2ee') },
      camPos:    { value: new THREE.Vector3() },
      alcance:   { value: o.alcance || 9000 }
    }, uniformes),
    vertexShader: `
      varying vec3 vMundo;
      void main() {
        vMundo = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4( vMundo, 1.0 );
      }`,
    fragmentShader: GLSL_NUVEM + `
      uniform vec3 corNuvem;
      uniform vec3 camPos;
      uniform float alcance;
      uniform float nuvemForca;
      varying vec3 vMundo;
      void main() {
        float n = nuvemEm( vMundo.xz );
        /* APAGA POR ÂNGULO, não por distância. Distância parecia a conta
           óbvia e estava errada: de uma câmera rente ao chão, o lençol
           inteiro está longe, então o fade por distância apagava TODA a
           nuvem e o céu ficava vazio. O que precisa sumir é o que fica
           rasante — onde o raio quase tangencia o plano e a textura
           esticaria num borrão. */
        vec3 raio = normalize( vMundo - camPos );
        float rasante = smoothstep( 0.03, 0.24, abs( raio.y ) );
        float d = distance( vMundo.xz, camPos.xz );
        float longe = 1.0 - smoothstep( alcance * 0.7, alcance * 2.0, d );
        float a = n * rasante * longe * ( 0.34 + nuvemForca * 0.5 );
        if ( a < 0.004 ) discard;
        gl_FragColor = vec4( corNuvem, a );
      }`,
    transparent: true, depthWrite: false, fog: false,
    side: THREE.DoubleSide
  });
  const ceu = new THREE.Mesh(geo, matCeu);
  ceu.rotation.x = -Math.PI / 2;
  ceu.scale.set(o.alcance ? o.alcance * 2.4 : 22000, o.alcance ? o.alcance * 2.4 : 22000, 1);
  ceu.position.y = uniformes.nuvemAltura.value;
  ceu.frustumCulled = false;
  ceu.renderOrder = -1;
  ceu.matrixAutoUpdate = true;

  /* ---- A INJEÇÃO NOS MATERIAIS DA CIDADE ----
     Entra no `lights_fragment_begin`, logo depois que o three.js monta
     a luz direcional e ANTES de ela ser integrada: assim a nuvem
     desconta só o sol, e a sombra projetada (o shadow map dos prédios)
     continua funcionando por cima, sem uma atrapalhar a outra.

     ATENÇÃO AO MOMENTO: quando o `onBeforeCompile` roda, os `#include`
     AINDA NÃO FORAM EXPANDIDOS — o shader é o fonte cru, com as
     diretivas literais. Procurar por `getDirectionalLightInfo` ali não
     acha nada e a injeção vira um silencioso nada. Por isso o chunk é
     expandido aqui, na mão, a partir do `THREE.ShaderChunk`. */
  const ALVO_LUZ = 'getDirectionalLightInfo( directionalLight, directLight );';
  const CHUNK_LUZ = THREE.ShaderChunk.lights_fragment_begin.replace(ALVO_LUZ,
    ALVO_LUZ + `
        {
          /* a nuvem que sombreia ESTE ponto não é a que está em cima
             dele: é a que está na direção do sol, a uma distância que
             cresce quando o sol baixa */
          vec2 pn = vPosNuvem.xz + nuvemDeriva * max( nuvemAltura - vPosNuvem.y, 0.0 );
          directLight.color *= 1.0 - nuvemForca * nuvemEm( pn );
        }`);
  if (CHUNK_LUZ === THREE.ShaderChunk.lights_fragment_begin)
    console.warn('nuvens3d: não achei o ponto de injeção da luz direcional — sombra de nuvem desligada');

  const marcados = new WeakSet();
  function aplicarEm(material) {
    if (!material || marcados.has(material)) return material;
    marcados.add(material);
    const anterior = material.onBeforeCompile;
    material.onBeforeCompile = (shader, renderer) => {
      if (anterior) anterior(shader, renderer);
      Object.assign(shader.uniforms, uniformes);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vPosNuvem;')
        .replace('#include <project_vertex>',
                 '#include <project_vertex>\n\tvPosNuvem = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>',
                 '#include <common>\nvarying vec3 vPosNuvem;\nuniform float nuvemForca;\nuniform float nuvemAltura;\nuniform vec2 nuvemDeriva;\n' + GLSL_NUVEM)
        .replace('#include <lights_fragment_begin>', CHUNK_LUZ);
    };
    /* A CHAVE ACUMULA NUM MARCADOR, não encadeando funções: a chave
       padrão do three.js é `onBeforeCompile.toString()`, então encadear
       colava o fonte inteiro da função na chave — string de mil e
       poucos caracteres comparada a cada material, a cada quadro. */
    material.userData.__chave = (material.userData.__chave || '') + '|nuvem';
    material.customProgramCacheKey = () => material.userData.__chave;
    material.needsUpdate = true;
    return material;
  }

  /* o sol muda a deriva da sombra: `dir` é o vetor que aponta DA cena
     PRO sol, já normalizado */
  const _d = new THREE.Vector3();
  function apontarSol(luz) {
    _d.copy(luz.position).sub(luz.target.position).normalize();
    const y = Math.max(0.12, _d.y);          // sol raso não manda a sombra pro infinito
    uniformes.nuvemDeriva.value.set(_d.x / y, _d.z / y);
  }

  function avancar(dt, cam) {
    uniformes.nuvemVento.value.x += vento.x * dt;
    uniformes.nuvemVento.value.y += vento.y * dt;
    if (cam) {
      matCeu.uniforms.camPos.value.copy(cam.position);
      ceu.position.x = cam.position.x;
      ceu.position.z = cam.position.z;
    }
  }

  return {
    ceu, uniformes, aplicarEm, apontarSol, avancar,
    get cobertura() { return uniformes.nuvemCobertura.value; },
    set cobertura(v) { uniformes.nuvemCobertura.value = v; },
    get forca() { return uniformes.nuvemForca.value; },
    set forca(v) { uniformes.nuvemForca.value = v; }
  };
}
