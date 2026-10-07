/* =========================================================
   OS BONECOS — o corpo, o rosto e o repertório de movimento
   ---------------------------------------------------------
   Veio inteiro do artefato "Torcida Organizada" (12/09/2026),
   que é o jogo em pé e a versão mais nova deste módulo. Não é
   arte nova: é a MESMA gente que já está no jogo, trazida pra
   dentro do repositório pra a cena do estádio não inventar um
   segundo boneco.

   O QUE ELE É. Modelo humano feito no Blender — desde 06/10/2026 o
   do jogo 2D refeito sobre humanos de verdade: corpo anatômico, rosto
   do MakeHuman, olhos e nove tons de pele (`ferramentas/boneco_base.py`
   → `img/boneco.glb` e `img/boneco_leve.glb`; os dois níveis do jogo 3D
   saem do leve, `ferramentas/afinar_boneco.mjs`) —, clonado
   com esqueleto por figura, com cabelo, boné, bandana, barba,
   óculos, cordão, relógio, camisa da torcida com listras,
   bermuda ou calça e tênis — tudo sorteado por uma semente que é
   do sujeito, então o mesmo cara é sempre o mesmo cara. Enquanto
   o GLB não chega (e onde ele não existir), fica o corpo de
   cápsulas, que é a mesma hierarquia de juntas com peças
   primitivas.

   O REPERTÓRIO. Vinte e poucos movimentos escritos como
   pose-alvo, e a pose atual perseguindo a alvo com velocidade
   por estado: parado, andar, correr, socar (jab, direto,
   cruzado, gancho), chutar, joelhada, contragolpe, guarda,
   bloquear, esquivar, provocar, apanhar, cambalear, arremessar,
   fugir, cobrir da bomba, cair, ser derrubado, levantar,
   segurar, ser segurado, chamar, socorrer, sentar preso e
   torcer. Cada um com TRÊS variações sorteadas por figura, pra a
   multidão não repetir ninguém.

   A CONTA DE PLACA JÁ VEM RESOLVIDA, e é por isso que a versão
   do jogo é a que entra e não a da vitrine: a malha é afinada na
   chegada — o GLB "leve" tem 23 mil triângulos por boneco e sai
   com uma fração disso, e é ISSO que deixa a cabeça simples em
   vez de cheia de particularidade —, as catorze peças viram uma
   chamada de desenho, quem está fora da tela não é animado nem
   desenhado, a resolução desce sozinha quando o quadro aperta e
   o movimento de quem está longe é leve. Medido lá, antes de
   tudo isso: 12 bonecos 49 fps, 52 bonecos 4 fps.

   O QUE MUDOU AO ENTRAR NO REPOSITÓRIO — seis coisas, e nenhuma
   delas é de pose ou de desenho:

   1. VIROU MÓDULO ES. O artefato era script solto com `THREE`
      global (r147); aqui o three é o r160 de módulo que já estava
      vendido, e o GLTFLoader e o SkeletonUtils entraram como
      `vendor/three/GLTFLoader.js`.

   2. O GLB VEM DE ARQUIVO. Ver `carregarGLB`.

   3. O LUGAR NÃO É MAIS O LUGAR. `opc.pos(x, y)` traduz a
      posição do tabuleiro num ponto de TRÊS dimensões. Na cena
      plana ela devolve (x, 0, y) e nada muda. No estádio ela
      DOBRA: duas faixas distantes do tabuleiro caem no mesmo
      ponto do mundo em alturas diferentes, e é assim que o
      corredor fica embaixo da arquibancada. O boneco não sabe de
      nada disso — a passada, o soco, a queda e o agarrão
      continuam escritos num mundo de chão zero.

      A VELOCIDADE PASSOU A SER MEDIDA NO MUNDO, e não no
      tabuleiro. Tinha de ser: subindo o vomitório, o sujeito
      anda 148 no tabuleiro e 76 no mundo, e se a passada
      continuasse saindo do tabuleiro o pé patinaria a escada
      inteira.

   4. O CORTE FORA DA TELA ACEITA OUTRO TESTE. A cena de cima
      corta por retângulo do tabuleiro; a câmera de ombro do
      estádio não tem retângulo, então quem tem a câmera passa o
      teste.

   5. `entrarEm(cena)`. No jogo este módulo é dono do
      renderizador, da câmera e da luz. No estádio quem é dono é
      `estadio3d.js`, e aqui só entra a gente.

   6. `d.passada` (o boneco que anda no cenário 3D da planta,
      25/09/2026). O ciclo do passo sai da velocidade medida, e a
      corrida daqui é de briga, curta: a 6 m/s — a de quem
      atravessa o mapa correndo — o boneco dava sete passos por
      segundo. O disco pode trazer `passada` (sem ela, 1): o ciclo
      anda na velocidade dividida por ela, e o passo sai mais longo
      e mais lento sem o boneco andar menos. No jogo ninguém manda
      `passada`, e nada muda.

   7. O DIA DE JOGO do cenário 3D (27/09/2026) põe a torcida inteira
      e a PM na rua e na arquibancada. Três campos opcionais: `pos`
      recebe o disco (`pos(x, y, d)`: lá cada um traz a altura do pé,
      `d.alt`, que sobe a escada e a fileira), o teste de quem está na
      tela também (`noQuadro(x, z, d)`), e o PM parado vira pro `rumo`
      dele, com o escudo em pé se tiver `escudo` (o cordão). Sem
      eles, nada muda.

   8. O JEITO DO DIA DE JOGO (27/09/2026). O disco pode trazer `jeito`:
      'festa' (a rodinha na porta da sede), 'bonde' (torcer andando pra
      o estádio, ou em pé quando o bonde para), 'fila' (a catraca) e
      'revista' (na boca da raia, as mãos pro alto) — ver
      `gestoDoJeito`. Os gestos andam no relógio de verdade (`tAnim`),
      não no do jogo, que no dia de jogo corre a 30×; o PM parado
      também. E duas correções que valem pra todo mundo: a multidão leve
      guarda o tempo dos quadros pulados (antes o ciclo do passo dela
      andava a um terço e o pé patinava), e o passo de cada um começa
      numa fase sorteada (quem sai junto não sai no mesmo pé).
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { GLTFLoader, SkeletonUtils } from './GLTFLoader.js?v=75671cb934';

/* onde o modelo mora, quando não vem embutido em base64: o detalhado
   (o do Blender) e os dois níveis afinados dele (ferramentas/afinar_boneco.mjs) */
const URL_GLB = new URL('../img/boneco.glb', import.meta.url).href;
const URL_PERTO = new URL('../img/boneco_perto.glb', import.meta.url).href;
const URL_LONGE = new URL('../img/boneco_longe.glb', import.meta.url).href;
/* onde, no mundo, fica a posição (x, y) do tabuleiro. A cena
   plana devolve (x, 0, y); o estádio devolve a dobra. */
const PLANO = { x:0, y:0, z:0 };
let pos = (x, y) => { PLANO.x = x; PLANO.y = 0; PLANO.z = y; return PLANO; };
/* quem está de fora e tem sol e mapa de sombra na cena */
let sombraDeLuz = false;
/* o teste de "cabe na tela" de quem tem a câmera */
let noQuadroExterno = null;
/* o rumo de cada disco: o dele, ou o que quem é dono da cena diz (o jogo
   3D senta a diretoria nas cadeiras da sala da sede, cada uma virada pra
   mesa: o rumo da cadeira da cena 2D não serve lá) */
let rumoDe = d => d.rumo;
/* um rumo do tabuleiro (vx, vy) no mundo: igual, a não ser que quem é dono
   da cena tenha o tabuleiro girado no mundo (a briga na cidade, no jogo 3D) */
let rumoDoTabuleiro = (vx, vy) => Math.atan2(vx, vy);
/* unidades do mundo por px do tabuleiro (quem desenha a cena noutra escala: a caravana do cenário 3D) */
let escalaDoTabuleiro = () => 1;

  /* o util do jogo (nucleo.js) pode chegar depois deste módulo — no
     jogo 3D o cenário importa o boneco antes de o jogo carregar —, então
     ele é lido na hora de usar, não na de carregar */
  const U = { limitar: (v, a, b) => TO.util.limitar(v, a, b) };
  const A = () => TO.diaJogo.arredores;

  let cv=null, renderer=null, scene=null, cam=null, ativo=false;
  let escalaDeCima = 1.25;
  const CISALHA = 0.42;         // quanto a altura sobe na tela (0 = de cima exato)
  const ALTURA_CAM = 1000;

  /* ---------- paletas ---------- */
  /* OS NOVE TONS DE PELE (a grade do dono, 06/10/2026): do claro rosado ao
     marrom escuro. Entram multiplicando o mapa de detalhe da pele (lábio,
     olho, barba rala — img/pele_detalhe_leve.png), igual no rosto e no corpo. */
  const PELE   = ['#e6c3ae','#d9b393','#d0a888','#cba383','#b98f6e','#ad8463','#a17656','#825f46','#6b4a36'];
  const CALCA  = ['#2b2f3a','#1e2a44','#3a3a3a','#4a3b2a','#23262b','#565a63','#2f4a6b','#1a1a1a'];
  const CABELO = ['#111111','#2a1a10','#3b2a1a','#000000','#4a3626','#1a1a1a','#5c4030'];
  const TENIS  = ['#f0f0f0','#111111','#e8e8e8','#2b2b2b','#d8d0c0'];
  const PRETO='#101010', BRANCO='#f4f4f4';

  /* ---------- semente por figura ---------- */
  function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  const frac = s => (hash(s)%10007)/10007;
  const dado = (s,n) => hash(s)%n;

  /* ---------- materiais e geometrias compartilhados ---------- */
  /* O REMENDO DO DONO DA CENA (`cfg.remendo`: o cenário da planta põe
     nele a luz da noite, 30/09/2026): cada material de figura passa por
     ele uma vez (e compila de novo, se já tinha compilado) */
  const remendados = new WeakSet();
  function remendar(m){
    if(m && cfg.remendo && !remendados.has(m)){ remendados.add(m); cfg.remendo(m); m.needsUpdate = true; }
    return m;
  }
  const mats = new Map();
  function mat(hex, opc){
    const k = hex + (opc?JSON.stringify(opc):'');
    let m = mats.get(k);
    if(!m){ m = remendar(new THREE.MeshLambertMaterial(Object.assign({color:new THREE.Color(hex)}, opc||{}))); mats.set(k,m); }
    return m;
  }
  const geo = {};
  function G(){
    if(geo.pronto) return geo;
    geo.caixa   = new THREE.BoxGeometry(1,1,1);
    geo.esfera  = new THREE.SphereGeometry(1, 14, 10);
    geo.capsula = new THREE.CapsuleGeometry(0.5, 1, 4, 10);   // raio .5, comprimento 1 → escala dá o osso
    geo.cil     = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
    geo.cone    = new THREE.ConeGeometry(0.5, 1, 12);
    geo.disco   = new THREE.CircleGeometry(1, 20);
    geo.anel    = new THREE.RingGeometry(0.9, 1, 40);
    geo.pedra   = new THREE.DodecahedronGeometry(1, 0);
    geo.toro    = new THREE.TorusGeometry(1, 0.18, 8, 20);
    geo.pronto = true;
    return geo;
  }

  const capsulas = new Map();
  function capsula(comp, raio){
    const k = comp.toFixed(2)+'|'+raio.toFixed(2);
    let c = capsulas.get(k);
    if(!c){ c = new THREE.CapsuleGeometry(raio, Math.max(0.01, comp - raio*2), 4, 10); capsulas.set(k, c); }
    return c;
  }
  function junta(pai, x, y, z){
    const j = new THREE.Group(); j.position.set(x, y, z); pai.add(j); return j;
  }

  /* O ACUMULADOR: as peças fixas de um osso (cabeça + olho + nariz +
     boné…) viram UMA malha com cor por vértice. Sem isto cada figura
     eram 27 chamadas de desenho; com isto são 15 — o que separa é só
     o que se mexe sozinho (cada junta). */
  const matVertices = new THREE.MeshLambertMaterial({vertexColors:true});
  const matVerticesTransp = new THREE.MeshLambertMaterial({vertexColors:true, transparent:true, opacity:0.75});
  class Acumulador{
    constructor(){ this.pos=[]; this.nor=[]; this.cor=[]; }
    add(g, hex, sx, sy, sz, x, y, z, rx, ry, rz){
      const src = g.index ? g.toNonIndexed() : g;
      const m = new THREE.Matrix4().compose(new THREE.Vector3(x||0,y||0,z||0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0, ry||0, rz||0)), new THREE.Vector3(sx,sy,sz));
      const nm = new THREE.Matrix3().getNormalMatrix(m);
      const P = src.attributes.position, N = src.attributes.normal;
      const c = new THREE.Color(hex);
      const v = new THREE.Vector3();
      for(let i=0;i<P.count;i++){
        v.fromBufferAttribute(P, i).applyMatrix4(m); this.pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); this.nor.push(v.x, v.y, v.z);
        this.cor.push(c.r, c.g, c.b);
      }
      return this;
    }
    capsula(comp, raio, hex, x, y, z, rx, ry, rz){ return this.add(capsula(comp, raio), hex, 1,1,1, x, y, z, rx, ry, rz); }
    mesh(pai, transp){
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.cor, 3));
      const m = new THREE.Mesh(g, transp ? matVerticesTransp : matVertices);
      if(pai) pai.add(m);
      return m;
    }
  }

  /* =======================================================
     A FICHA VISUAL: o que é fixo em cada figura
     ======================================================= */
  function corLado(lado, claro){
    if(lado==='visitante') return claro?'#e8e8e8':'#2a5fa8';
    return claro?'#e8e4dc':'#c0392b';
  }
  function fichaDe(d, i){
    if(d._b3) return d._b3;
    const s = (d.nome||'')+'|'+(d.spawn||'')+'|'+i;
    const camisa = d.cor || corLado(d.lado,false);
    const faixa  = d.cor2 || corLado(d.lado,true);
    /* cabeça: o que tem em cima dela */
    const CABECAS = ['curto','curto','raspado','raspado','degrade','degrade','black','cacheado','topete','franja',
                     'entradas','moicano','comprido','rabo','coque','bone','bone','bone-tras','bandana','careca'];
    const tipoCabeca = d.cabecaForcada || (d.lider ? 'bandana' : CABECAS[dado(s+'cab', CABECAS.length)]);
    const rBarba = frac(s+'bb');
    d._b3 = {
      sem:s, fase:frac(s+'f')*6.28, yaw:frac(s+'y')*6.28,
      pele:PELE[dado(s+'p',PELE.length)],
      calca: d.calca || calcaoDe(TO.diaJogo.J, d, CALCA[dado(s+'c',CALCA.length)]),
      cabelo:CABELO[dado(s+'h',CABELO.length)],
      tenis:TENIS[dado(s+'t',TENIS.length)],
      bermuda: frac(s+'bm') < 0.5,
      regata: frac(s+'rg') < 0.12,
      listras: dado(s+'ls', 5),           // 0 lisa, 1 duas faixas, 2 três faixas, 3 vertical, 4 faixa atravessada
      tipoCabeca,
      corBone: estudo.boneCor2 && d.cor2 ? d.cor2
             : frac(s+'bc') < 0.55 ? camisa : (frac(s+'bc2') < 0.5 ? PRETO : '#e8e2d0'),
      desenho: desenhoDaTorcida(d, TO.diaJogo.J), cor3: d.cor3 || null,
      barba: rBarba < 0.55 ? 0 : rBarba < 0.72 ? 1 : rBarba < 0.86 ? 2 : 3,   // 0 nada, 1 cavanhaque, 2 cheia, 3 bigode
      oculos: frac(s+'oc') < 0.80 ? 0 : frac(s+'oc2') < 0.5 ? 1 : 2,       // 0 nada, 1 de grau, 2 escuros
      brinco: frac(s+'br') < 0.18,
      relogio: frac(s+'rl') < 0.35,
      pulseira: frac(s+'pu') < 0.25,
      corrente: frac(s+'co') < 0.15,
      cordao: frac(s+'cg') < 0.22,          // o cordão de ouro grosso com medalha
      anel: frac(s+'an') < 0.25,
      cachecol: frac(s+'ca') < 0.14,
      meia: frac(s+'me') < 0.45,
      tatuagem: frac(s+'ta') < 0.18,
      sobrancelha: 0.10 + frac(s+'sb')*0.28,   // inclinação (zangado)
      cabecaX: 0.92 + frac(s+'cx')*0.16,
      queixo: 0.85 + frac(s+'qx')*0.3,
      barriga: frac(s+'bg') < 0.25 ? 1.15 + frac(s+'bg2')*0.2 : 1,
      camisa, faixa,
      escala: (d.lider ? 1.1 : 0.93 + frac(s+'e')*0.12),
      largo: 0.9 + frac(s+'lg')*0.24,
      /* O ESTILO: o que faz dois bonecos no mesmo estado não se
         mexerem igual (pedido do dono, 05/09/2026) */
      estilo: estiloDe(s, d.lider),
      /* memória da animação */
      ladoSoco:dado(s+'ls2',2), ataque:null, pausa:0.2+frac(s+'pa')*0.4, combo:0,
      impacto:null, cobre: frac(s+'cb') < 0.6,
      olhaTras:0, tGesto:0, gesto:0,
      queda:null, caiDeFrente: frac(s+'q') < 0.55, jazido:0, quedaVar:0, derrubadoRef:null, esquiva:null, arrRef:null, arrVar:0,
      varianteForcada: d.varianteForcada!=null ? d.varianteForcada : null,
      /* (o passo de cada um começa numa fase dele: quem sai junto não sai no mesmo pé) */
      px:null, pz:null, vx:0, vz:0, ciclo: frac(s+'ci')*6.28,
      pose:null
    };
    return d._b3;
  }

  /* cada um anda, guarda e bate do seu jeito; tudo sorteado da semente */
  function estiloDe(s, lider){
    const GUARDAS = ['fechada','fechada','alta','baixa','aberta'];
    const REP = ['misto','misto','tecnico','brigao','chutador'];
    const rc = frac(s+'cv');
    return {
      passada: 0.85 + frac(s+'e1')*0.3,     // tamanho do passo
      cadencia: 0.9 + frac(s+'e2')*0.2,     // frequência do passo
      balanco: 0.7 + frac(s+'e3')*0.6,      // braço balançando
      curvado: rc < 0.3 ? 0.05 + rc*0.3 : 0, // postura curvada
      gingado: 0.5 + frac(s+'e5')*1.0,      // balanço lateral
      pesado: frac(s+'e6') < 0.25,          // pisa pesado, quadril baixo
      inquieto: 0.4 + frac(s+'e7')*1.2,     // olha em volta, se mexe parado
      guarda: lider ? 'alta' : GUARDAS[dado(s+'e8', GUARDAS.length)],
      canhoto: frac(s+'e9') < 0.15,
      repertorio: lider ? 'brigao' : REP[dado(s+'e10', REP.length)],
      ritmo: 0.85 + frac(s+'e11')*0.3,      // velocidade dos golpes
      folego: 2 + dado(s+'e12', 4),         // golpes por sequência
      duro: 0.6 + frac(s+'e13')*0.7,        // quanto sente a pancada (menor = mais duro)
      finta: 0.06 + frac(s+'e14')*0.14,     // chance de fintar
      olhaTras: 0.5 + frac(s+'e15')*1.0,
      gestoFav: dado(s+'e16', 5),
      provocaFav: dado(s+'e17', 3),        // qual dos três "vem" ele prefere
      provocador: 0.3 + frac(s+'e18')*0.7    // vontade de provocar
    };
  }
  /* um ruído lento e particular de cada figura: produto de dois senos
     com frequências que não batem, deslocado pela fase */
  const ruido = (f, t, a, b) => Math.sin(t*a + f.fase) * Math.sin(t*b*0.73 + f.fase*1.7);

  /* =======================================================
     O CORPO: construção
     Medidas em px de cena, na escala 1: 30 de altura, 13 de ombro.
     Tudo pendurado em `raiz` (no chão, virada pro +z local).
     ======================================================= */
  function construirCorpo(f, pm){
    const g = G();
    const raiz = new THREE.Group();
    const L = f.largo, B = f.barriga||1, CX = f.cabecaX||1, QX = f.queixo||1;
    const pele=f.pele, camisa=f.camisa, faixa=f.faixa, calca=f.calca, tenis=f.tenis, cabelo=f.cabelo;
    const OURO = '#d8b04a';

    /* pélvis (a raiz do tronco, a 16,5 do chão) */
    const pelvis = junta(raiz, 0, 16.5, 0);
    const pv = new Acumulador().add(g.caixa, calca, 6.4*L*B, 3.2, 4.2*B, 0, 0.4, 0);
    if(!f.bermuda || pm) pv.add(g.caixa, '#2a2420', 6.6*L*B, 0.7, 4.4*B, 0, 1.6, 0);   // cinto
    pv.mesh(pelvis);
    /* tronco: barriga e peito numa malha só, com a camisa da torcida */
    const tronco = junta(pelvis, 0, 1.6, 0);
    const tr = new Acumulador()
      .add(g.caixa, camisa, 6.2*L*B, 4.2, 4.0*B, 0, 2.1, 0)             // barriga
      .add(g.caixa, camisa, 7.2*L, 4.6, 4.4, 0, 6.5, 0);              // peito
    if(!pm){
      if(f.listras===1 || f.listras===2){
        tr.add(g.caixa, faixa, 7.3*L, 1.1, 4.5, 0, 6.5, 0);
        if(f.listras===2) tr.add(g.caixa, faixa, 6.3*L*B, 1.0, 4.1*B, 0, 2.1, 0);
      } else if(f.listras===3){
        for(const sx of [-1,1]) tr.add(g.caixa, faixa, 1.3, 4.7, 4.5, sx*1.9*L, 6.5, 0);
      } else if(f.listras===4){
        tr.add(g.caixa, faixa, 1.6, 9.2, 4.6, 0, 4.6, 0, 0, 0, 0.55);   // faixa atravessada
      }
      tr.add(g.caixa, faixa, 7.3*L, 0.6, 4.5, 0, 8.6, 0);              // gola
      if(f.corrente) tr.add(g.toro, OURO, 2.2, 2.2, 2.2, 0, 8.4, 1.2, 1.2, 0, 0);
      if(f.cachecol) tr.add(g.toro, faixa, 2.8, 2.8, 2.8, 0, 8.9, 0.4, 1.35, 0, 0).add(g.caixa, faixa, 1.6, 4.5, 0.8, 1.6, 6.2, 2.4);
    } else {
      tr.add(g.caixa, '#1b2a22', 7.4*L, 4.7, 4.6, 0, 6.5, 0).add(g.caixa, '#c9d64a', 7.5*L, 0.7, 4.7, 0, 6.8, 0)
        .add(g.caixa, '#c9d64a', 7.5*L, 0.5, 4.7, 0, 5.4, 0);
    }
    tr.add(g.cil, pele, 1.9, 1.5, 1.9, 0, 9.5, 0);                    // pescoço
    tr.mesh(tronco);
    const peito = junta(tronco, 0, 4.2, 0);
    const pescoco = junta(peito, 0, 4.6, 0);

    /* CABEÇA: crânio, mandíbula e queixo (não é uma bola), rosto,
       cabelo ou chapéu, óculos, barba, brinco — numa malha só */
    const cabeca = junta(pescoco, 0, 1.4, 0);
    /* A cabeça (refeita a pedido do dono, 05/09/2026: a mandíbula em
       caixa ficou feia). Agora é tudo arredondado: o crânio é um
       elipsoide; o rosto de baixo é outro, um pouco mais estreito e
       mais fundo, deslocado pra frente e pra baixo, que faz a
       bochecha e a linha do queixo; o queixo é uma esfera pequena
       na ponta. Sem aresta nenhuma. */
    const cb = new Acumulador()
      .add(g.esfera, pele, 3.2*CX, 3.15, 3.1, 0, 3.7, -0.1)                   // crânio
      .add(g.esfera, pele, 2.85*CX, 2.5*QX, 2.9, 0, 2.15, 0.55)                // rosto de baixo (bochecha, mandíbula)
      .add(g.esfera, pele, 1.5*CX, 1.15, 1.4, 0, 1.05, 1.55);                  // queixo
    for(const sx of [-1,1]){
      cb.add(g.esfera, BRANCO, 0.66, 0.5, 0.36, sx*1.15*CX, 3.55, 2.8)
        .add(g.esfera, '#2a1a10', 0.34, 0.34, 0.26, sx*1.15*CX, 3.55, 3.1)
        .add(g.esfera, PRETO, 0.16, 0.16, 0.16, sx*1.15*CX, 3.55, 3.3)
        .add(g.caixa, pele, 1.4, 0.35, 0.5, sx*1.15*CX, 3.95, 2.85)             // pálpebra
        .add(g.caixa, cabelo, 1.3, 0.28, 0.35, sx*1.15*CX, 4.25, 2.9, 0, 0, sx*f.sobrancelha)
        .add(g.esfera, pele, 0.5, 0.8, 0.45, sx*3.1*CX, 3.2, 0.2);            // orelha
    }
    cb.add(g.caixa, pele, 0.9, 1.6, 0.9, 0, 2.85, 2.9)                        // nariz
      .add(g.caixa, pele, 0.6, 1.2, 0.8, 0, 3.6, 2.75)                        // dorso do nariz
      .add(g.caixa, '#5a2a24', 1.4, 0.3, 0.3, 0, 1.85, 2.75);                 // boca
    if(f.brinco) cb.add(g.esfera, OURO, 0.28, 0.28, 0.28, -3.35*CX, 2.75, 0.4);
    /* barba: cavanhaque, cheia ou bigode */
    if(f.barba===1) cb.add(g.esfera, cabelo, 1.35*CX, 1.1, 1.2, 0, 0.95, 1.9);
    else if(f.barba===2) cb.add(g.esfera, cabelo, 3.0*CX, 2.55*QX, 3.0, 0, 1.95, 0.6).add(g.esfera, cabelo, 1.6*CX, 1.25, 1.5, 0, 0.9, 1.6);
    else if(f.barba===3) cb.add(g.caixa, cabelo, 2.2, 0.42, 0.5, 0, 2.35, 2.9);
    /* óculos: de grau (lente à parte, transparente) ou escuros */
    if(f.oculos){
      const arm = f.oculos===2 ? PRETO : '#3a3a3a';
      for(const sx of [-1,1]){
        cb.add(g.caixa, arm, 1.9, 1.4, 0.18, sx*1.15*CX, 3.55, 3.32);
        cb.add(g.caixa, arm, 0.16, 0.16, 3.4, sx*2.2*CX, 3.7, 1.6);            // haste
      }
      cb.add(g.caixa, arm, 0.7, 0.18, 0.18, 0, 3.75, 3.35);                    // ponte
      if(f.oculos===1){
        const lente = new Acumulador();
        for(const sx of [-1,1]) lente.add(g.caixa, '#9ec6e8', 1.6, 1.15, 0.12, sx*1.15*CX, 3.55, 3.4);
        lente.mesh(cabeca, true);
      }
    }
    /* cabelo ou chapéu */
    if(pm){
      cb.add(g.cil, '#1c2a22', 3.5, 1.6, 3.5, 0, 5.6, 0).add(g.caixa, '#1c2a22', 3.3, 0.3, 2.3, 0, 5.1, 3.1)
        .add(g.caixa, OURO, 0.9, 0.6, 0.2, 0, 5.6, 3.4);
    } else if(f.tipoCabeca==='curto'){
      cb.add(g.esfera, cabelo, 3.35*CX, 2.9, 3.25, 0, 4.2, -0.35).add(g.caixa, cabelo, 6.0*CX, 1.0, 1.4, 0, 5.3, 1.0);
    } else if(f.tipoCabeca==='raspado'){
      cb.add(g.esfera, cabelo, 3.22*CX, 2.7, 3.1, 0, 4.15, -0.3);
    } else if(f.tipoCabeca==='black'){
      cb.add(g.esfera, cabelo, 4.4*CX, 4.0, 4.3, 0, 4.9, -0.2);
    } else if(f.tipoCabeca==='moicano'){
      cb.add(g.esfera, cabelo, 3.22*CX, 2.6, 3.1, 0, 4.1, -0.3).add(g.caixa, cabelo, 1.5, 2.4, 5.6, 0, 6.4, -0.3);
    } else if(f.tipoCabeca==='comprido'){
      cb.add(g.esfera, cabelo, 3.4*CX, 3.0, 3.35, 0, 4.2, -0.35).add(g.caixa, cabelo, 5.2*CX, 4.6, 2.2, 0, 1.6, -2.5)
        .add(g.caixa, cabelo, 6.1*CX, 1.0, 1.4, 0, 5.3, 1.0);
    } else if(f.tipoCabeca==='bone' || f.tipoCabeca==='bone-tras'){
      const tras = f.tipoCabeca==='bone-tras';
      cb.add(g.esfera, f.corBone, 3.4*CX, 2.3, 3.3, 0, 5.0, 0).add(g.toro, f.corBone, 3.1*CX, 3.1, 3.1, 0, 4.45, 0, 1.57, 0, 0)
        .add(g.caixa, f.corBone, 3.6, 0.35, 2.8, 0, 4.9, tras ? -3.5 : 3.5)
        .add(g.caixa, cabelo, 6.1*CX, 0.9, 5.6, 0, 3.9, -0.4);
      if(!tras) cb.add(g.caixa, faixa, 1.4, 0.8, 0.2, 0, 5.4, 3.35);          // escudo do boné
    } else if(f.tipoCabeca==='bandana'){
      cb.add(g.cil, faixa, 6.7*CX, 1.2, 6.5, 0, 4.7, 0).add(g.caixa, faixa, 1.0, 2.4, 0.4, 1.7, 3.7, -3.1)
        .add(g.esfera, cabelo, 3.2*CX, 2.3, 3.1, 0, 5.0, -0.3);
    } else {
      cb.add(g.caixa, cabelo, 5.2*CX, 0.5, 3.5, 0, 3.3, -1.4);                 // careca: só a nuca
    }
    cb.mesh(cabeca);

    /* braços: ombro no topo do peito; manga + braço, antebraço (com
       relógio, pulseira ou tatuagem), mão */
    const bracos = [], antebracos = [], maos = [];
    for(const [k, sx] of [[0,-1],[1,1]]){
      const ombro = junta(peito, sx*(3.9*L+0.4), 4.0, 0);
      const br = new Acumulador().capsula(6.0, 1.1, pele, 0, -3.0, 0);
      if(!f.regata || pm) br.capsula(3.4, 1.35, pm ? '#233a2c' : camisa, 0, -1.5, 0);
      br.mesh(ombro);
      const cotovelo = junta(ombro, 0, -6.0, 0);
      const ab = new Acumulador().capsula(5.6, 0.98, pele, 0, -2.8, 0);
      if(k===1 && f.tatuagem && !pm) ab.capsula(2.6, 1.02, '#4a3a34', 0, -2.6, 0);
      if(k===0 && f.relogio && !pm) ab.add(g.cil, '#222', 2.4, 0.7, 2.4, 0, -5.0, 0).add(g.caixa, '#cfd3d8', 1.3, 0.75, 0.5, 0, -5.0, 1.05);
      if(k===1 && f.pulseira && !pm) ab.add(g.cil, faixa, 2.35, 0.8, 2.35, 0, -5.0, 0);
      if(pm) ab.add(g.cil, '#111', 2.5, 0.9, 2.5, 0, -5.0, 0);               // luva
      ab.mesh(cotovelo);
      const mao = junta(cotovelo, 0, -5.6, 0);
      const punho = new Acumulador().add(g.esfera, pm ? '#111' : pele, 1.25, 1.4, 1.15, 0, -0.9, 0).mesh(mao);
      bracos.push(ombro); antebracos.push(cotovelo); maos.push({j:mao, punho});
    }

    /* pernas: quadril pendurado na pélvis; coxa, canela (com meia), pé */
    const coxas = [], joelhos = [], pes = [];
    for(const sx of [-1,1]){
      const quadril = junta(pelvis, sx*2.0*L, -0.6, 0);
      const cx = new Acumulador().capsula(7.6, 1.55, calca, 0, -3.8, 0);
      if(f.bermuda && !pm) cx.capsula(3.2, 1.3, pele, 0, -6.6, 0);
      cx.mesh(quadril);
      const joelho = junta(quadril, 0, -7.6, 0);
      const cn = new Acumulador().capsula(7.0, 1.22, (f.bermuda && !pm) ? pele : calca, 0, -3.5, 0);
      if(f.bermuda && f.meia && !pm) cn.add(g.cil, frac(f.sem+'mc')<0.7 ? BRANCO : PRETO, 2.6, 1.6, 2.6, 0, -6.0, 0);
      if(pm) cn.add(g.cil, '#111', 2.8, 3.2, 2.8, 0, -5.4, 0);               // coturno
      cn.mesh(joelho);
      const pe = junta(joelho, 0, -7.0, 0);
      new Acumulador().add(g.caixa, pm ? '#111' : tenis, 2.7, 1.7, 4.4, 0, -0.6, 0.9)
        .add(g.caixa, '#333', 2.8, 0.5, 4.5, 0, -1.25, 0.9)
        .add(g.caixa, tenis===BRANCO||tenis==='#f0f0f0'||tenis==='#e8e8e8' ? '#c0392b' : BRANCO, 2.85, 0.35, 1.6, 0, -0.7, 0.4).mesh(pe);
      coxas.push(quadril); joelhos.push(joelho); pes.push(pe);
    }

    /* PM: cassetete na mão direita, escudo na esquerda (só na carga) */
    let cassetete=null, escudo=null;
    if(pm){
      cassetete = new Acumulador().add(g.cil, '#1a1a1a', 0.8, 11, 0.8, 0, -2.0, 4.5, Math.PI/2, 0, 0).mesh(maos[1].j);
      escudo = new Acumulador().add(g.caixa, '#cfd8e0', 9, 14, 0.6, 0, 3, 3.5).mesh(maos[0].j, true);
      escudo.visible = false;
    }

    /* sombra: um disco escuro no chão, mais barato que sombra de luz */
    const sombra = new THREE.Mesh(g.disco, mat(PRETO, {transparent:true, opacity:0.34, depthWrite:false}));
    sombra.rotation.x = -Math.PI/2; sombra.position.y = 0.3; sombra.scale.set(8.5, 6.5, 1);
    raiz.add(sombra);
    const {anel, anelFundo} = anelNoChao(raiz);

    return {raiz, pelvis, tronco, peito, pescoco, cabeca, bracos, antebracos, maos, coxas, joelhos, pes,
            sombra, anel, anelFundo, cassetete, escudo};
  }

  /* =======================================================
     O BONECO DO BLENDER (ferramentas/boneco_base.py → img/boneco.glb,
     embutido em dados/boneco_glb.js). Quando o GLB e o GLTFLoader estão
     carregados, cada figura é um clone do modelo com esqueleto
     (SkeletonUtils.clone); as variantes (cabelo, boné, barba, óculos,
     brinco, relógio, corrente) são ligadas por nome a partir da ficha,
     e os materiais recoloridos por nome (pele, camisa, faixa, calça,
     tênis, cabelo, boné). Enquanto o GLB não chegou — ou onde ele não
     existe — fica o corpo de caixas.

     A POSE NOS OSSOS. A animação escreve ângulos por junta no meu
     referencial (junta com o filho pendurado em −Y, frente em +Z, e
     todas as juntas alinhadas com a raiz no repouso). O osso do Blender
     tem outro referencial (o Y dele aponta ao longo do osso). A
     conversão: a rotação R que eu quero, expressa no espaço do PAI do
     osso, é Cp⁻¹·R·Cp, onde Cp é a rotação de repouso do pai em relação
     à raiz do modelo; a rotação local nova é isso vezes a local de
     repouso. Guardo Cp e a local de repouso de cada osso no clone.
     ======================================================= */
  let modeloGLB = null, carregandoGLB = false, estatMalha = null;
  const ALTURA_GLB = 1.75;          // metros, no Blender

  /* =======================================================
     AFINAR A MALHA — agrupamento de vértices por célula
     Divide a caixa da peça numa grade (cfg.afinarCelulas células na
     maior dimensão); todo vértice que cai na mesma célula vira um só,
     na média das posições, com os outros atributos (uv, ossos, pesos)
     do primeiro que chegou. Triângulo que ficou com dois cantos na
     mesma célula some. As normais são recalculadas. Pra um boneco de
     30 px na tela a diferença não se vê; pra placa é 10× menos
     triângulo. A geometria de entrada não é alterada.
     ======================================================= */
  function triangulosDe(g){
    const idx = g.getIndex();
    return Math.floor((idx ? idx.count : g.getAttribute('position').count) / 3);
  }
  function afinarMalha(g, celulas){
    const pos = g.getAttribute('position');
    if(!pos || pos.count < 300) return null;        // peça miúda: não vale
    const idx = g.getIndex();
    const nTri = triangulosDe(g);
    g.computeBoundingBox();
    const bb = g.boundingBox, tam = new THREE.Vector3(); bb.getSize(tam);
    /* a célula é fixa em metros do modelo — a altura do boneco dividida
       em `celulas` —, e não relativa à caixa da peça: a cabeça tem 27 cm
       e 10 mil triângulos, e uma grade relativa a ela não afinava nada */
    const cel = ALTURA_GLB / (celulas || 48);
    const nx = Math.max(1, Math.ceil(tam.x/cel)+1), ny = Math.max(1, Math.ceil(tam.y/cel)+1);
    const chaveDe = i => {
      const cx = Math.floor((pos.getX(i) - bb.min.x)/cel);
      const cy = Math.floor((pos.getY(i) - bb.min.y)/cel);
      const cz = Math.floor((pos.getZ(i) - bb.min.z)/cel);
      return (cz*ny + cy)*nx + cx;
    };
    /* célula → índice novo; soma das posições pra tirar a média */
    const novoDe = new Int32Array(pos.count).fill(-1);
    const celulaIdx = new Map();
    const repr = [];                 // vértice representante (o primeiro)
    const soma = [], conta = [];
    for(let i=0;i<pos.count;i++){
      const k = chaveDe(i);
      let n = celulaIdx.get(k);
      if(n === undefined){ n = repr.length; celulaIdx.set(k, n); repr.push(i); soma.push([0,0,0]); conta.push(0); }
      novoDe[i] = n;
      soma[n][0] += pos.getX(i); soma[n][1] += pos.getY(i); soma[n][2] += pos.getZ(i); conta[n]++;
    }
    const nNovo = repr.length;
    if(nNovo > pos.count * 0.8) return null;         // já era magra
    /* os triângulos que sobrevivem */
    const tri = [];
    const lerIdx = idx ? (t => idx.getX(t)) : (t => t);
    for(let t=0; t<nTri; t++){
      const a = novoDe[lerIdx(t*3)], b = novoDe[lerIdx(t*3+1)], c = novoDe[lerIdx(t*3+2)];
      if(a===b || b===c || a===c) continue;
      tri.push(a, b, c);
    }
    if(!tri.length) return null;
    const out = new THREE.BufferGeometry();
    for(const nome of Object.keys(g.attributes)){
      const at = g.attributes[nome];
      const dim = at.itemSize;
      const Ctor = at.array.constructor;
      const arr = new Ctor(nNovo * dim);
      for(let n=0; n<nNovo; n++){
        const i = repr[n];
        if(nome === 'position'){
          arr[n*3] = soma[n][0]/conta[n]; arr[n*3+1] = soma[n][1]/conta[n]; arr[n*3+2] = soma[n][2]/conta[n];
        } else for(let k=0;k<dim;k++) arr[n*dim+k] = at.array[i*dim+k];
      }
      out.setAttribute(nome, new THREE.BufferAttribute(arr, dim, at.normalized));
    }
    out.setIndex(tri);
    out.computeVertexNormals();
    out.computeBoundingBox(); out.computeBoundingSphere();
    for(const gr of (g.groups||[])) out.addGroup(0, tri.length, gr.materialIndex||0);
    if(g.groups && g.groups.length > 1) out.clearGroups();   // vários materiais: fica um só (não é o caso do boneco)
    return out;
  }
  const ALTURA_CAIXAS = 34;         // a altura do corpo de caixas, na escala 1
  /* OS DOIS NÍVEIS (pedido do dono, 27/09/2026: "cena de 300 bonecos").
     O modelo do Blender tem ~22 mil triângulos por boneco; a cabeça (10
     mil) e o cabelo (8 mil) são quase tudo. Afinar na chegada pela grade
     dava 2,2 mil, mas levava o rosto junto — a cabeça virava uma bolota.
     Agora o afinado sai pronto de `ferramentas/afinar_boneco.mjs`, com o
     simplificador do meshoptimizer, em dois níveis: o de PERTO (~2,4 a
     3,3 mil, com o rosto, as mãos e o cabelo) e o de LONGE (~0,9 a 1,3
     mil) pra quem sai pequeno na tela (ver `trocarNivel`). O GLB afinado
     diz `asset.extras.afinado` e não passa pela grade de novo. Sem ele (a
     página que não leva os arquivos novos), vale o de antes: o detalhado,
     afinado na chegada. A vitrine com o detalhado não troca de nível. */
  let modeloLonge = null;
  const detalhado = () => window.MODELO_BONECO === 'detalhado';
  function carregarGLB(){
    if(modeloGLB || carregandoGLB) return;
    if(typeof GLTFLoader !== 'function') return;
    carregandoGLB = true;
    const D = TO.dados || {};
    const falhou = err=>{
      console.warn('boneco.glb: '+(err && (err.message||err))+' — fica o corpo de cápsulas');
      carregandoGLB = false;
    };
    const longe = ()=>{
      if(detalhado()) return;
      lerGLB(D.bonecoLongeGLB, URL_LONGE, gltf=>{ modeloLonge = prepararModelo(gltf.scene); },
        err=>console.warn('boneco_longe.glb: '+(err && (err.message||err))+' — todo mundo no nível de perto'));
    };
    /* o detalhado (a vitrine, ou quando o de perto não veio) */
    const doDetalhado = ()=> lerGLB(D.bonecoGLB, URL_GLB, gltf=>{ pronto(gltf); longe(); }, falhou);
    if(detalhado()) doDetalhado();
    else lerGLB(D.bonecoPertoGLB, URL_PERTO, gltf=>{ pronto(gltf); longe(); },
      err=>{ console.warn('boneco_perto.glb: '+(err && (err.message||err))+' — vai o detalhado, afinado na chegada'); doDetalhado(); });
  }
  /* o Lambert (mais barato que o Standard, e a cena não tem PBR), com o nome do material */
  function prepararModelo(m){
    m.updateMatrixWorld(true);
    m.traverse(o=>{
      if(o.isMesh){
        const mt = o.material;
        const novo = new THREE.MeshLambertMaterial({color: mt.color ? mt.color.clone() : new THREE.Color('#ccc'),
          map: mt.map || null, transparent: !!mt.transparent, opacity: mt.opacity!==undefined ? mt.opacity : 1});
        novo.name = mt.name; o.material = remendar(novo);
        if(mt.name === 'pele' && mt.map){
          /* O ROSTO NA MESMA COR DO CORPO (o dono, 06/10/2026, no jogo 2D: "a
             cor do rosto do boneco deve ser a mesma do corpo"): a textura da
             pele (o mapa de detalhe do MakeHuman: lábio, olho, sobrancelha)
             é lida como linear — o branco dela é a pele exata da cor do
             vértice, nos nove tons. Marcada, a junção leva a UV dela. */
          mt.map.colorSpace = THREE.LinearSRGBColorSpace; mt.map.needsUpdate = true;
          mt.map.userData.pele = true;
          if(!texRosto) texRosto = mt.map;
        }
        o.frustumCulled = false;
      }
    });
    return m;
  }
  function pronto(gltf){
    modeloGLB = gltf.scene;
    modeloGLB.updateMatrixWorld(true);
    /* A MALHA É AFINADA NA CHEGADA (fps do dono, 08/09/2026) quando o
       modelo é o detalhado: ~23 mil triângulos por boneco; com 52
       bonecos na tela eram 1,26 milhão de triângulos por quadro pra
       figuras de 30 px — era isso, e não a resolução nem a luz, que
       derrubava o fps (medido: 12 bonecos, 49 fps; 52, 4 fps). Cada
       peça passa uma vez por `afinarMalha` e todo boneco nasce da malha
       afinada. O de perto já vem afinado; a vitrine, de propósito, não. */
    const jaAfinado = !!(gltf.asset && gltf.asset.extras && gltf.asset.extras.afinado);
    if(cfg.afinarMalha && !jaAfinado && !detalhado()){
      let antes = 0, depois = 0;
      modeloGLB.traverse(o=>{
        if(!o.isMesh || !o.geometry) return;
        /* O CORPO E A CABEÇA NÃO SE AFINAM NA GRADE (jogo 2D, 06/10/2026):
           o corpo do MakeHuman juntava vértice de pele com o de camisa (as
           pontas da camisa, a cintura fina) e a UV do rosto desmanchava; os
           acessórios seguem afinados */
        if(/^corpo/.test(o.name) || (o.parent && /^corpo/.test(o.parent.name))) return;
        if(/^(cabeca|cabelo_|bone_|bandana|barba_|rosto_)/.test(o.name) || (o.parent && /^(cabeca|cabelo_|rosto_)/.test(o.parent.name))) return;
        antes += triangulosDe(o.geometry);
        const g = afinarMalha(o.geometry, cfg.afinarCelulas);
        if(g){ o.geometry.dispose(); o.geometry = g; }
        depois += triangulosDe(o.geometry);
      });
      estatMalha = {antes, depois};
    }
    nomesGLB = new Set(); modeloGLB.traverse(o=>{ if(o.isMesh) nomesGLB.add(o.name); });
    prepararModelo(modeloGLB);
    /* troca as figuras já feitas de caixa pelo modelo */
    for(const [d,fg] of figuras){ scene.remove(fg.corpo.raiz); figuras.delete(d); }
    carregandoGLB = false;
  }
  /* LER UM GLB: do base64 em `dados` (a página empacotada num HTML só),
     ou do arquivo em `url` */
  function lerGLB(dados, url, ok, erro){
    /* O ARQUIVO, E NÃO O BASE64.
       No artefato o GLB vinha embutido e era decodificado à mão porque
       o sandbox barra requisição — até de data-URI. No repositório não
       há esse muro: a página 3D já roda por servidor local (módulo ES
       não carrega em file://), então o modelo é o arquivo em `img/` e
       quem busca é o próprio GLTFLoader. O base64 continua valendo
       quando alguém o carrega: é o caminho de quem empacota a página
       inteira num HTML só. */
    let bin = null;
    if(dados){
      const b64 = dados.indexOf(',') >= 0 ? dados.slice(dados.indexOf(',')+1) : dados;
      try{
        const txt = atob(b64); bin = new Uint8Array(txt.length);
        for(let i=0;i<txt.length;i++) bin[i] = txt.charCodeAt(i);
      }catch(err){ console.warn('boneco: base64 inválido — vai buscar o arquivo'); bin = null; }
    }
    /* A TEXTURA DO ROSTO SEM BLOB: o GLTFLoader tira a imagem do GLB e
       carrega por `blob:` — com ImageBitmapLoader, que usa fetch —, e o
       sandbox do artifact bloqueia. Aqui o PNG é achado no próprio GLB
       (o primeiro image com bufferView), vira data-URI, e um
       modificador de URL troca qualquer `blob:` por ele; o carregador
       de imagem passa a ser o de <img>, que aceita data-URI. */
    let dataPng = null;
    try{
      if(!bin) throw 0;                       // sem binário em mão: o loader resolve
      const dv = new DataView(bin.buffer);
      const lenJson = dv.getUint32(12, true);
      const json = JSON.parse(new TextDecoder().decode(new Uint8Array(bin.buffer, 20, lenJson)));
      const img = (json.images||[]).find(i=>i.bufferView!==undefined);
      if(img){
        const bv = json.bufferViews[img.bufferView];
        const ini = 20 + lenJson + 8 + (bv.byteOffset||0);
        const bytes = new Uint8Array(bin.buffer, ini, bv.byteLength);
        let str=''; for(let i=0;i<bytes.length;i+=8192) str += String.fromCharCode.apply(null, bytes.subarray(i, i+8192));
        dataPng = 'data:'+(img.mimeType||'image/png')+';base64,'+btoa(str);
      }
    }catch(err){ if(err) console.warn('boneco: sem textura ('+err.message+')'); }
    const gerente = new THREE.LoadingManager();
    if(dataPng) gerente.setURLModifier(u => (typeof u==='string' && u.indexOf('blob:')===0) ? dataPng : u);
    const carregador = new GLTFLoader(gerente);
    /* o parser escolhe ImageBitmapLoader (fetch) quando `createImageBitmap`
       existe; escondendo a função durante o `parse` ele cai no
       TextureLoader, que carrega por <img> e aceita a data-URI */
    const cib = window.createImageBitmap;
    try{ window.createImageBitmap = undefined; }catch(_){}
    if(bin) carregador.parse(bin.buffer, '', ok, erro);
    else carregador.load(url, ok, undefined, erro);
    try{ window.createImageBitmap = cib; }catch(_){}
  }

  /* que peças da ficha ficam ligadas */
  let nomesGLB = new Set();   // as malhas que o modelo carregado tem
  function variantesDe(f, pm){
    const on = new Set();
    if(pm){ on.add('cabelo_raspado'); return on; }
    let tc = f.tipoCabeca;
    /* o modelo leve não tem boné nem bandana: cai num penteado */
    if((tc==='bone' || tc==='bone-tras') && !nomesGLB.has('bone_copa')) tc = 'degrade';
    if(tc==='bandana' && !nomesGLB.has('bandana')) tc = 'raspado';
    if(tc==='curto') on.add('cabelo_curto');
    else if(tc==='raspado') on.add('cabelo_raspado');
    else if(tc==='black') on.add('cabelo_black');
    else if(tc==='moicano'){ on.add('cabelo_moicano'); on.add('cabelo_moicano_crista'); }
    else if(tc==='comprido'){ on.add('cabelo_comprido'); on.add('cabelo_comprido_nuca'); }
    else if(tc==='cacheado') on.add('cabelo_cacheado');
    else if(tc==='degrade') on.add('cabelo_degrade');
    else if(tc==='topete') on.add('cabelo_topete');
    else if(tc==='franja') on.add('cabelo_franja');
    else if(tc==='entradas') on.add('cabelo_entradas');
    else if(tc==='rabo'){ on.add('cabelo_rabo'); on.add('cabelo_rabo_elastico'); on.add('cabelo_rabo_ponta'); }
    else if(tc==='coque'){ on.add('cabelo_coque'); on.add('cabelo_coque_bola'); }
    else if(tc==='bone'){ on.add('bone_copa'); on.add('bone_aba'); on.add('cabelo_raspado'); }
    else if(tc==='bone-tras'){ on.add('bone_copa'); on.add('bone_aba_tras'); on.add('cabelo_raspado'); }
    else if(tc==='bandana'){ on.add('bandana'); on.add('bandana_ponta'); on.add('cabelo_raspado'); }
    if(f.barba===1) on.add('barba_cavanhaque'); else if(f.barba===2) on.add('barba_cheia'); else if(f.barba===3) on.add('barba_bigode');
    if(f.oculos===1) for(const n of ['oculos_grau_aro-1','oculos_grau_aro1','oculos_grau_lente-1','oculos_grau_lente1','oculos_grau_haste-1','oculos_grau_haste1','oculos_grau_ponte']) on.add(n);
    if(f.oculos===2) for(const n of ['oculos_escuros_lente-1','oculos_escuros_lente1','oculos_escuros_haste-1','oculos_escuros_haste1','oculos_escuros_ponte']) on.add(n);
    if(f.brinco) on.add('brinco');
    if(f.corrente) on.add('corrente');
    if(f.cordao){ on.add('cordao_grosso'); on.add('cordao_medalha'); }
    if(f.anel) on.add('anel');
    if(f.relogio){ on.add('relogio_pulseira'); on.add('relogio_mostrador'); }
    if(f.pulseira) on.add('pulseira');
    return on;
  }
  const VARIANTE = /^(cabelo_|bone_|bandana|barba_|oculos_|brinco|corrente|cordao_|anel|relogio_|pulseira)/;

  /* =======================================================
     ESTUDO (06/09/2026): QUEM É QUEM QUANDO A CAMISA É DA MESMA COR
     Um quinto das rivalidades de praça tem a mesma cor primária (139
     de 697 pares) e uma em catorze tem primária E secundária iguais
     (Gaviões × Pavilhão 9, Aliança × Falange Coral). Vista de cima,
     o que se enxerga do boneco é cabeça, ombros e o chão em volta —
     é aí que a torcida tem de se dizer. Três recursos, cada um com a
     sua chave em `estudo`, pro dono comparar na bancada:
       · desenho — a camisa tem um DESENHO fixo por torcida (lisa,
         ombros na 2ª cor, listras verticais, metade a metade, faixa
         no peito), pintado por vértice na malha do GLB. Duas torcidas
         da mesma cena com as mesmas cores nunca ficam com o mesmo
         desenho: o registro da cena desempata.
       · boneCor2 — todo boné e bandana na 2ª cor da torcida.
       · sombra — uma sombra colorida no chão, por baixo dos pés, na
         2ª cor (desenhada pela camada 2D, em combate.desenharRotulo).
     ======================================================= */
  /* DECISÃO DO DONO (06/09/2026), depois do estudo:
       · calção sempre na 1ª cor da torcida; quando OUTRA torcida da cena
         tem a mesma primária, a que chegou depois (a nossa é sempre a
         primeira) sai com o calção na 2ª cor;
       · anel no chão, na 2ª cor, ligado só na cena em que há torcidas
         de primária igual.
     `calcao` e `anel` em 'auto' aplicam a regra; os outros valores
     seguem existindo pra bancada. `desenho` e `boneCor2` continuam
     desligados até o dono escolher as variações de camisa. */
  const estudo = {desenho:'auto', boneCor2:false, anel:'auto', calcao:'auto'};

  /* A PALETA DA CENA: por torcida, a cor do calção e a do anel, e se
     a cena tem primária repetida. Lê os bondes da configuração
     (a nossa primeiro) e, sem bondes, o que os discos trazem. */
  let paletaJ = null, paleta = null, paletaN = -1;
  function paletaDaCena(J){
    if(J && J === paletaJ && paleta && J.discos.length === paletaN) return paleta;
    paletaJ = J; paleta = {torcidas:{}, colisao:false}; paletaN = J ? J.discos.length : -1;
    if(!J) return paleta;
    const M = TO.mundo;
    const parecidas = (a,b)=> !!(a && b) && (M && M.coresParecidas
      ? M.coresParecidas(String(a).toUpperCase(), String(b).toUpperCase())
      : String(a).toLowerCase() === String(b).toLowerCase());
    /* TODA TORCIDA DA CENA, venha por onde vier (correção do dono,
       06/09/2026: o bar abria sem anel). Nas cenas de ação — bar,
       comércio, CT, recepção na praça — o rival não é bonde: ele chega
       por `cfg.rival` (J.rivalInfo) e os defensores nascem soltos pelos
       pontos da cena. E nos arredores chegam bondes no meio da noite
       (`reforcar`). Então a lista junta os bondes da configuração, o
       rival informado e o que os discos trazem; a nossa vai primeiro. */
    const lista = [], porNome = new Map();
    const juntar = (nome, cor, cor2, cor3, nossa)=>{
      if(!nome) return;
      const k = String(nome);
      if(porNome.has(k)){ if(nossa) porNome.get(k).nossa = true; return; }
      const t = {nome:k, cor:cor||null, cor2:cor2||null, cor3:cor3||null, nossa:!!nossa};
      porNome.set(k, t); lista.push(t);
    };
    for(const b of (J.bondes_||[])) juntar(b.nome||b.lado, b.cor, b.cor2, b.cor3, b.nossa);
    if(J.rivalInfo) juntar(J.rivalInfo.nome, J.rivalInfo.cor, J.rivalInfo.cor2, J.rivalInfo.cor3, false);
    for(const d of J.discos) juntar(d.torcida || d.lado, d.cor, d.cor2, d.cor3, d.doJogador && !(d.torcida && porNome.has(d.torcida) && !porNome.get(d.torcida).nossa && J.bondes_));
    lista.sort((a,b)=>(b.nossa?1:0)-(a.nossa?1:0));
    /* QUEM REPETE DESEMPATA CONTRA QUEM VEIO ANTES (correção do dono,
       06/09/2026, Imbatíveis × Aliança: as duas branco e preto, e o anel
       saía preto nas duas). O calção e o anel de quem repete a primária
       são a primeira cor da paleta dela que não se parece com a que as
       anteriores de mesma primária já usam — cai na 2ª, depois na 3ª,
       e no anel até na própria 1ª (Aliança: anel branco contra o preto
       dos Imbatíveis). */
    const escolher = (cands, evitar) =>
      cands.find(c => c && !evitar.some(e => parecidas(e, c))) || cands.find(Boolean) || null;
    const vistas = [];
    for(const t of lista){
      if(paleta.torcidas[t.nome]) continue;
      const iguais = vistas.filter(v=>parecidas(v.cor, t.cor)).map(v=>paleta.torcidas[v.nome]);
      const repete = !!t.cor && iguais.length > 0;
      if(repete) paleta.colisao = true;
      paleta.torcidas[t.nome] = repete
        ? {repete, calcao: escolher([t.cor2, t.cor3, '#202020', '#e8e2d0'], iguais.map(i=>i.calcao)),
                   /* o anel NUNCA repete o de quem veio antes (ordem do dono):
                      esgotada a paleta, entra uma cor de reserva */
                   anel:   escolher([t.cor2, t.cor3, t.cor, '#FFFFFF', '#000000', '#E8C020', '#1B4F9C'], iguais.map(i=>i.anel))}
        : {repete, calcao: t.cor || null, anel: t.cor2 || t.cor3 || null};
      vistas.push(t);
    }
    return paleta;
  }
  function calcaoDe(J, d, sorteio){
    const m = estudo.calcao;
    if(m === false) return sorteio;
    if(m === 'primaria') return d.cor || sorteio;
    if(m === 'segunda') return d.cor2 || d.cor3 || sorteio;
    const t = paletaDaCena(J).torcidas[d.torcida || d.lado];
    return (t && t.calcao) || d.cor || sorteio;
  }
  /* a cor do anel do disco, 'lado' pra cor do lado, ou null sem anel */
  function anelDe(J, d){
    const m = estudo.anel;
    if(!m) return null;
    /* a vida da praça (o jogo 3D) não tem lado: ninguém leva anel */
    if(J && J.semAnel) return null;
    if(m === 'lado') return 'lado';
    const p = paletaDaCena(J);
    if(m === 'auto' && !p.colisao) return null;
    const t = p.torcidas[d.torcida || d.lado];
    return (t && t.anel) || d.cor2 || d.cor3 || 'lado';
  }
  /* VISTO DE CIMA o que aparece da camisa é o alto dos ombros e as
     mangas — faixa no peito e metade a metade somem na projeção
     (medido nas fotos do estudo). Os desenhos são os que se leem de
     cima: ombros na 2ª cor, mangas na 2ª cor, listras verticais. */
  /* as PROPOSTAS de camisa (06/09/2026), todas pintadas por vértice na
     malha do GLB; o dono escolhe quais ficam. A 3ª cor entra na
     'tricolor' e na 'ombros' quando existe. */
  const DESENHOS = ['lisa','ombros','mangas','listras','faixa-central','diagonal','gola','tricolor','listras-largas','gola-dupla'];
  /* A CAMISA DA TORCIDA (decisão do dono, 06/09/2026, sobre as nove
     propostas): torcida de TRÊS cores veste gola e punho duplo — a gola
     na 2ª cor, o punho com uma faixa na 2ª e outra na 3ª; torcida de
     DUAS cores é metade lisa, metade gola e punhos na 2ª cor, sorteada
     pelo nome — fixa em todo save, como o elenco. Sem desempate na
     cena: a camisa é identidade da torcida, não muda conforme o rival
     (quem separa paleta igual é o calção e o anel). */
  function desenhoDaTorcida(d, J){
    if(estudo.desenho !== 'auto') return estudo.desenho === 'lisa' ? 0 : Math.max(0, DESENHOS.indexOf(estudo.desenho));
    if(d.cor3) return DESENHOS.indexOf('gola-dupla');
    const chave = d.torcida || d.lado || '';
    return (Math.abs(hash32(chave)) % 2) ? DESENHOS.indexOf('gola') : 0;
  }
  function hash32(txt){
    let h = 2166136261; const s = String(txt);
    for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h | 0;
  }
  /* a malha da camisa pintada por vértice, uma por (desenho, cores) */
  const geomCamisa = new Map();
  const matCamisaVC = new THREE.MeshLambertMaterial({vertexColors:true, color:0xffffff});
  matCamisaVC.name = 'camisa';
  function geometriaCamisa(base, idx, c1, c2, c3, nivel){
    /* (o nível entra na chave: a camisa do boneco de longe é mais magra) */
    const chave = idx+'|'+c1+'|'+c2+'|'+c3+'|'+(nivel||'');
    let g = geomCamisa.get(chave);
    if(g) return g;
    g = base.clone();
    const pos = g.getAttribute('position'); const n = pos.count;
    const cor = new Float32Array(n*3);
    const A = new THREE.Color(c1), B = new THREE.Color(c2 || c3 || '#202020'), C3 = new THREE.Color(c3 || c2 || '#202020');
    let xmin=1e9,xmax=-1e9,ymin=1e9,ymax=-1e9;
    for(let i=0;i<n;i++){ const x=pos.getX(i), y=pos.getY(i); if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }
    const desenho = DESENHOS[idx] || 'lisa';
    for(let i=0;i<n;i++){
      const x=pos.getX(i), y=pos.getY(i);
      const fx=(x-xmin)/(xmax-xmin||1), fy=(y-ymin)/(ymax-ymin||1);
      let segunda = false, terceira = false;
      if(desenho==='ombros')       segunda = fy > 0.80;                     // o alto dos ombros e a gola
      else if(desenho==='mangas')  segunda = Math.abs(x) > 0.21;            // as mangas
      else if(desenho==='listras') segunda = Math.floor(fx*5) % 2 === 1;    // cinco listras verticais
      else if(desenho==='listras-largas') segunda = Math.floor(fx*3) === 1; // uma faixa larga no meio
      else if(desenho==='faixa-central') segunda = Math.abs(x) < 0.075;    // uma listra fina no meio
      else if(desenho==='diagonal') segunda = Math.abs(x - 1.1*(y-1.20)) < 0.08;   // a faixa a tiracolo
      else if(desenho==='gola'){ segunda = (fy > 0.92 && Math.abs(x) < 0.16) || Math.abs(x) >= 0.25; } // gola e punhos
      else if(desenho==='gola-dupla'){                                       // gola na 2ª; punho duplo: 2ª e, na ponta, 3ª
        const ax = Math.abs(x);
        segunda = (fy > 0.92 && ax < 0.16) || (ax >= 0.236 && ax < 0.268);
        terceira = ax >= 0.268;
      }
      else if(desenho==='tricolor'){ segunda = fy > 0.80; terceira = !segunda && Math.abs(x) > 0.21; }  // ombros na 2ª, mangas na 3ª
      const c = terceira ? C3 : segunda ? B : A;
      cor[i*3]=c.r; cor[i*3+1]=c.g; cor[i*3+2]=c.b;
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
    geomCamisa.set(chave, g);
    return g;
  }

  /* O ANEL NO CHÃO (decisão do dono, 06/09/2026), na camada 3D e não
     no canvas 2D: assim ele nasce onde o pé está — a raiz da figura,
     com a mesma projeção cisalhada da sombra — e não no meio do
     desenho. Um anel escuro por baixo, pra ler em qualquer chão. */
  const geoAnel = new THREE.RingGeometry(0.80, 1.0, 40);
  const geoAnelFundo = new THREE.RingGeometry(0.70, 1.10, 40);
  function anelNoChao(raiz){
    const anelFundo = new THREE.Mesh(geoAnelFundo, new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.55, depthWrite:false}));
    anelFundo.rotation.x = -Math.PI/2; anelFundo.position.y = 0.32; anelFundo.scale.set(10.2, 7.6, 1); anelFundo.visible = false;
    const anel = new THREE.Mesh(geoAnel, new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.95, depthWrite:false}));
    anel.rotation.x = -Math.PI/2; anel.position.y = 0.34; anel.scale.set(10.2, 7.6, 1); anel.visible = false;
    anelFundo.material._propria = true; anel.material._propria = true;
    raiz.add(anelFundo); raiz.add(anel);
    return {anel, anelFundo};
  }
  /* =======================================================
     UMA MALHA SÓ POR BONECO (pedido do dono, 08/09/2026)
     O clone do GLB tem sete peças esqueletizadas (pele, camisa, faixa,
     calça, tênis, sola, meia), a cabeça e o cabelo pendurados no osso
     da cabeça e os adereços em outros ossos — catorze chamadas de
     desenho por boneco. Aqui tudo vira UM SkinnedMesh com cor por
     vértice: as peças esqueletizadas entram como estão (mesmos ossos,
     pesos remapeados pelo nome do osso), as penduradas em osso entram
     com o vértice levado ao espaço do corpo e peso 1 no osso de que
     pendem — o resultado é o mesmo de serem filhas dele. O material é
     um Lambert com vertexColors, sem a textura da pele (invisível a
     30 px). A geometria juntada é guardada por (variantes, cores,
     desenho): boneco da mesma torcida com o mesmo visual compartilha.
     ======================================================= */
  const geomJuntas = new Map();
  const matJunto = new THREE.MeshLambertMaterial({vertexColors:true, color:0xffffff});
  matJunto.name = 'junto';
  /* O ROSTO NA MALHA JUNTADA (06/10/2026): a junção jogava fora a UV e a
     textura — o boneco do jogo não tinha olho, boca nem sobrancelha. A
     malha juntada agora leva a UV da cabeça (as outras peças apontam pra
     um texel branco da nuca) e este material lê a textura do rosto. O
     alfa da textura diz como ela entra: 255 multiplica a cor do vértice
     (a pele), 128 é cor própria — o branco do olho e a íris não
     escurecem em pele escura (ferramentas/boneco_base.py). */
  let texRosto = null, matJuntoRosto = null;   // a textura da pele (a do primeiro nível que chegou)
  function materialJunto(){
    if(!texRosto) return matJunto;
    if(matJuntoRosto) return matJuntoRosto;
    matJuntoRosto = new THREE.MeshLambertMaterial({vertexColors:true, color:0xffffff, map:texRosto});
    matJuntoRosto.name = 'junto';
    /* (no 3D o `#include <color_fragment>` fica: a noite do cenário,
       `comNoite`, se pendura nele. A conta do alfa vem depois e devolve a
       cor própria — divide o vértice de volta — onde o alfa é 128; a pele
       de hoje é JPEG, alfa cheio, e ali nada muda) */
    matJuntoRosto.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\n#ifdef USE_COLOR\n  float kPele = clamp((diffuseColor.a - 0.5) * 2.0, 0.0, 1.0);\n' +
        '  diffuseColor.rgb = mix(diffuseColor.rgb / max(vColor, vec3(0.0001)), diffuseColor.rgb, kPele);\n  diffuseColor.a = 1.0;\n#endif');
    };
    /* (a noite do cenário encadeia o dela depois deste) */
    return remendar(matJuntoRosto);
  }
  const UV_BRANCO = [0.02, 0.5];      // a nuca: branco, alfa cheio
  const geomJuntasLonge = new Map();
  const guardar = (cache, chave, geo) => {
    cache.set(chave, geo);
    if(cache.size > 400){ const k0 = cache.keys().next().value; cache.get(k0).dispose(); cache.delete(k0); }
  };
  /* o corpo esqueletizado e as peças que aparecem */
  function pecasDe(modelo){
    const base = (()=>{ let b=null; modelo.traverse(o=>{ if(!b && o.isSkinnedMesh) b=o; }); return b; })();
    if(!base) return {base:null, pecas:[]};
    modelo.updateMatrixWorld(true);
    const pecas = [];
    modelo.traverse(o=>{ if(o.isMesh && o.visible && o.geometry && o.geometry.getAttribute('position')) pecas.push(o); });
    return {base, pecas};
  }
  function juntarPecas(modelo, chave){
    const {base, pecas} = pecasDe(modelo);
    if(!base) return null;
    let geo = geomJuntas.get(chave);
    if(!geo){ geo = geometriaJunta(base, pecas); guardar(geomJuntas, chave, geo); }
    const junto = new THREE.SkinnedMesh(geo, materialJunto());
    junto.name = 'junto';
    junto.frustumCulled = false;
    junto.bind(base.skeleton, base.bindMatrix);
    base.parent.add(junto);
    junto.position.copy(base.position); junto.quaternion.copy(base.quaternion); junto.scale.copy(base.scale);
    for(const o of pecas) o.parent.remove(o);
    /* as peças escondidas (variantes desligadas) também saem: são só peso */
    const sobras = []; modelo.traverse(o=>{ if(o.isMesh && o !== junto) sobras.push(o); });
    for(const o of sobras) o.parent.remove(o);
    return junto;
  }
  /* A GEOMETRIA JUNTA: as peças numa malha só, com os ossos do corpo. Os
     dois níveis do boneco têm o mesmo esqueleto (os mesmos ossos, na mesma
     ordem), e a geometria de um serve no esqueleto do outro. */
  function geometriaJunta(base, pecas){
    const idxOsso = new Map(base.skeleton.bones.map((b,i)=>[b.name, i]));
    let geo;
    {
      const P=[], N=[], C=[], SI=[], SW=[], IDX=[], UV=[];
      const invBase = new THREE.Matrix4().copy(base.matrixWorld).invert();
      const m4 = new THREE.Matrix4(), m3 = new THREE.Matrix3(), v = new THREE.Vector3(), n = new THREE.Vector3();
      const cor = new THREE.Color();
      let deslocamento = 0;
      for(const o of pecas){
        const g = o.geometry, pos = g.getAttribute('position'), nor = g.getAttribute('normal');
        const col = g.getAttribute('color'), si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
        /* (a pele dos dois níveis: cada GLB traz a sua textura, marcada em `prepararModelo`) */
        const uvA = (texRosto && o.material && o.material.map && o.material.map.userData.pele) ? g.getAttribute('uv') : null;
        const idx = g.getIndex();
        const nV = pos.count;
        /* transformação: peça pendurada em osso vai pro espaço do corpo */
        const pendurada = !o.isSkinnedMesh;
        let osso = -1;
        if(pendurada){
          m4.copy(invBase).multiply(o.matrixWorld);
          m3.getNormalMatrix(m4);
          let x = o.parent; while(x && !x.isBone) x = x.parent;
          osso = x ? (idxOsso.has(x.name) ? idxOsso.get(x.name) : -1) : -1;
        }
        /* remapeia os índices de osso de peças com esqueleto próprio pelo nome */
        let remap = null;
        if(o.isSkinnedMesh && o.skeleton !== base.skeleton){
          remap = o.skeleton.bones.map(b => idxOsso.has(b.name) ? idxOsso.get(b.name) : 0);
        }
        if(o.material && o.material.color) cor.copy(o.material.color); else cor.set('#cccccc');
        for(let i=0;i<nV;i++){
          v.fromBufferAttribute(pos, i); if(pendurada) v.applyMatrix4(m4);
          P.push(v.x, v.y, v.z);
          if(nor){ n.fromBufferAttribute(nor, i); if(pendurada) n.applyMatrix3(m3).normalize(); N.push(n.x, n.y, n.z); }
          else N.push(0, 1, 0);
          if(col) C.push(col.getX(i), col.getY(i), col.getZ(i)); else C.push(cor.r, cor.g, cor.b);
          if(uvA) UV.push(uvA.getX(i), uvA.getY(i)); else UV.push(UV_BRANCO[0], UV_BRANCO[1]);
          if(pendurada){ SI.push(Math.max(0, osso), 0, 0, 0); SW.push(1, 0, 0, 0); }
          else {
            const a = si.getX(i), b = si.getY(i), c = si.getZ(i), d = si.getW(i);
            SI.push(remap ? remap[a] : a, remap ? remap[b] : b, remap ? remap[c] : c, remap ? remap[d] : d);
            SW.push(sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i));
          }
        }
        const nT = idx ? idx.count : nV;
        for(let t=0;t<nT;t++) IDX.push(deslocamento + (idx ? idx.getX(t) : t));
        deslocamento += nV;
      }
      geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      if(texRosto) geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4));
      geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
      geo.setIndex(IDX);
      geo.computeBoundingSphere();
    }
    return geo;
  }

  /* VESTIR: as variantes da ficha ligadas, a cor de cada peça e o desenho
     da camisa — o mesmo nos dois níveis do boneco */
  const comGolaDe = (f, pm) => { const des = DESENHOS[f.desenho] || 'lisa'; return !pm && (des === 'gola' || des === 'gola-dupla'); };
  function coresDe(f, pm){
  /* A GOLA E O PUNHO SÃO MATERIAIS DO MODELO (06/10/2026): gola careca
     pequena em volta do pescoço e punho na boca da manga. Camisa de
     'gola' pinta os dois na 2ª cor; 'gola-dupla', o punho em duas
     faixas, a da boca na 3ª; lisa, tudo na cor da camisa.
     A FAIXA DO PEITO EM DUAS LISTRAS (pedido do dono, 06/10/2026: "as
     torcidas com 3 cores sejam representadas agora com a terceira cor
     também na camisa"): a de cima ('faixa') na 2ª cor, a de baixo
     ('faixa2') na 3ª; quem tem só duas cores pinta as duas na 2ª. */
  const des = DESENHOS[f.desenho] || 'lisa';
  const comGola = !pm && (des === 'gola' || des === 'gola-dupla');
  const camisaCor = pm ? '#233a2c' : f.camisa;
  return {pele:f.pele, camisa: camisaCor, faixa: pm ? '#c9d64a' : f.faixa,
              faixa2: pm ? '#c9d64a' : (f.cor3 || f.faixa),
              gola: comGola ? f.faixa : camisaCor, punho: comGola ? f.faixa : camisaCor,
              punho2: des === 'gola-dupla' ? (f.cor3 || f.faixa) : comGola ? f.faixa : camisaCor,
              calca: pm ? '#1b2620' : f.calca, tenis: pm ? '#111' : f.tenis, cabelo:f.cabelo,
              bone: f.corBone, sola:'#2a2a2a'};
  }
  function vestir(modelo, f, pm, on, cores, nivel){
    const comGola = comGolaDe(f, pm);
    const matsFig = new Map();
    modelo.traverse(o=>{
      if(!o.isMesh) return;
      if(VARIANTE.test(o.name)) o.visible = on.has(o.name);
      const nome = o.material.name;
      /* o desenho da camisa (estudo): cor por vértice na malha */
      if(nome === 'camisa' && !pm && f.desenho > 0 && !comGola && o.geometry.getAttribute('position')){
        o.geometry = geometriaCamisa(o.geometry, f.desenho, f.camisa, f.faixa, f.cor3, nivel);
        o.material = matCamisaVC;
        return;
      }
      if(cores[nome]){
        let m = matsFig.get(nome);
        if(!m){ m = remendar(o.material.clone()); m.color.set(cores[nome]); m._propria = true; matsFig.set(nome, m); }
        o.material = m;
      }
    });
  }
  function construirCorpoGLB(f, pm){
    const g = G();
    const raiz = new THREE.Group();
    const modelo = SkeletonUtils.clone(modeloGLB);
    const on = variantesDe(f, pm);
    const cores = coresDe(f, pm);
    vestir(modelo, f, pm, on, cores);
    /* uma malha só (cfg.juntarPecas): catorze chamadas viram uma */
    let junto = null, chave = null;
    if(cfg.juntarPecas){
      chave = [pm?'pm':'', [...on].sort().join(','), f.desenho||0,
               cores.pele, cores.camisa, cores.faixa, cores.calca, cores.tenis, cores.cabelo, cores.bone, f.cor3||''].join('|');
      try{ junto = juntarPecas(modelo, chave); }catch(err){ console.warn('juntarPecas: '+(err && err.message)); junto = null; }
    }
    /* escala: o GLB tem 1,75 m; o corpo de caixas tinha 34 na escala 1 */
    modelo.scale.setScalar(ALTURA_CAIXAS/ALTURA_GLB);
    raiz.add(modelo);
    raiz.updateMatrixWorld(true);
    /* ossos: a local de repouso e a rotação de repouso do pai */
    const osso = n => { const b = modelo.getObjectByName(n); if(!b) console.warn('sem osso '+n); return b; };
    const prep = b => {
      if(!b) return null;
      const Lrest = b.quaternion.clone();
      const Cp = new THREE.Quaternion(); b.parent.getWorldQuaternion(Cp);
      const Rq = raiz.getWorldQuaternion(new THREE.Quaternion()).invert();
      Cp.premultiply(Rq);                       // relativo à raiz da figura
      return {b, Lrest, Cp, CpInv: Cp.clone().invert()};
    };
    const J = {
      pelvis: prep(osso('pelvis')), tronco: prep(osso('tronco')), pescoco: prep(osso('pescoco')), cabeca: prep(osso('cabeca')),
      ombro: [prep(osso('ombroD')), prep(osso('ombroE'))],
      cotovelo: [prep(osso('cotoveloD')), prep(osso('cotoveloE'))],
      mao: [prep(osso('maoD')), prep(osso('maoE'))],
      quadril: [prep(osso('quadrilD')), prep(osso('quadrilE'))],
      joelho: [prep(osso('joelhoD')), prep(osso('joelhoE'))],
      pe: [prep(osso('peD')), prep(osso('peE'))]
    };
    /* PM (dono, 06/09/2026: a mesma fisionomia dos bonecos): cassetete
       na mão direita, escudo na esquerda. Um grupo pendurado no osso da
       mão com a rotação inversa à de repouso do osso fica com os eixos
       do MODELO (frente +Z, cima +Y) — as peças se colocam em metros
       nesse referencial e giram junto com a mão. */
    let escudo = null, cassetete = null;
    if(pm){
      const noOsso = j => { const gr = new THREE.Group(); gr.quaternion.copy(j.Cp).multiply(j.Lrest).invert(); j.b.add(gr); return gr; };
      if(J.mao[1]){
        const gr = noOsso(J.mao[1]);
        cassetete = new THREE.Mesh(g.cil, mat('#1a1a1a')); cassetete.scale.set(0.034, 0.56, 0.034);
        cassetete.rotation.x = Math.PI/2; cassetete.position.set(0, -0.07, 0.17); gr.add(cassetete);
        const cabo = new THREE.Mesh(g.cil, mat('#3a3a3a')); cabo.scale.set(0.042, 0.12, 0.042);
        cabo.rotation.x = Math.PI/2; cabo.position.set(0, -0.07, -0.02); gr.add(cabo);
      }
      /* calça comprida: o modelo leve só tem bermuda na malha, então a
         canela do PM ganha um cano escuro pendurado no osso do joelho */
      for(let k=0;k<2;k++) if(J.joelho[k]){
        const gr = noOsso(J.joelho[k]);
        const cano = new THREE.Mesh(g.cil, mat('#1b2620')); cano.scale.set(0.145, 0.62, 0.145); cano.position.set(0, -0.10, 0.004); gr.add(cano);
      }
      if(J.mao[0]){
        const gr = noOsso(J.mao[0]);
        escudo = new THREE.Mesh(g.caixa, mat('#cfd8e0', {transparent:true, opacity:0.75})); escudo.scale.set(0.46, 0.72, 0.02);
        escudo.position.set(0, 0.12, 0.16); gr.add(escudo);
        const faixaE = new THREE.Mesh(g.caixa, mat('#1f2f26')); faixaE.scale.set(0.46, 0.09, 0.022); faixaE.position.set(0, 0.36, 0.16); gr.add(faixaE);
        escudo.visible = false; faixaE.visible = false; escudo.faixa = faixaE;
      }
    }
    const sombra = new THREE.Mesh(g.disco, mat(PRETO, {transparent:true, opacity:0.34, depthWrite:false}));
    sombra.rotation.x = -Math.PI/2; sombra.position.y = 0.3; sombra.scale.set(8.5, 6.5, 1);
    raiz.add(sombra);
    const {anel, anelFundo} = anelNoChao(raiz);
    /* os dois níveis: a geometria de perto é a do `junto`; a de longe sai na
       primeira vez que o boneco fica pequeno na tela (`trocarNivel`) */
    return {raiz, modelo, J, sombra, anel, anelFundo, glb:true, escudo, cassetete, junto,
            nivel: {chave, f, pm, perto: junto ? junto.geometry : null, longe: undefined, eLonge: false}};
  }
  /* A GEOMETRIA DE LONGE de uma figura: o modelo de longe vestido igual e
     juntado igual, guardada pela mesma chave (quem tem o mesmo visual
     divide). Só clona o modelo de longe quando a chave é nova. */
  function geometriaDeLonge(nv){
    if(nv.longe !== undefined) return nv.longe;
    if(!modeloLonge || !nv.chave) return null;          // ainda não chegou: fica o de perto, e tenta de novo
    let geo = geomJuntasLonge.get(nv.chave);
    if(!geo){
      try{
        const m = SkeletonUtils.clone(modeloLonge);
        vestir(m, nv.f, nv.pm, variantesDe(nv.f, nv.pm), coresDe(nv.f, nv.pm), 'longe');
        const {base, pecas} = pecasDe(m);
        geo = base ? geometriaJunta(base, pecas) : null;
        if(geo) guardar(geomJuntasLonge, nv.chave, geo);
      }catch(err){ console.warn('nível de longe: '+(err && err.message)); geo = null; }
    }
    nv.longe = geo;
    return geo;
  }
  /* O NÍVEL PELO TAMANHO NA TELA: quantos pixels (CSS) a altura do boneco
     ocupa na câmera de quem desenha, pela distância (a profundidade do
     meio do corpo) e não pela altura projetada — vista de cima, a altura
     de quem está em pé encolhe, e o boneco grande na tela ia pro nível de
     longe. Abaixo de NIVEL_LONGE vai o de longe; só volta pro de perto
     acima de NIVEL_PERTO (pra não ficar trocando na divisa). O líder (o
     boneco de quem joga, um só) fica sempre no de perto. Sem câmera
     conhecida (a vitrine; quem entra na cena sem dizer a câmera), fica o
     de perto. */
  const NIVEL_LONGE = 110, NIVEL_PERTO = 135;
  let camNivel = null, alturaNivel = 0;
  const _pa = new THREE.Vector3();
  function trocarNivel(c, lider){
    const nv = c.nivel, junto = c.junto;
    if(!nv || !junto || !nv.perto) return;
    let longe = false;
    /* OS BONECOS LEVES dos gráficos do cenário (30/09/2026, o dono joga sem
       placa de vídeo): todo mundo no nível de longe, menos o líder */
    if(cfg.nivelLeve && !lider) longe = true;
    else if(camNivel && alturaNivel > 0 && !lider){
      const h = ALTURA_CAIXAS * c.raiz.scale.y;
      /* projectionMatrix[5]: 1/tan(meio campo) na perspectiva (com o zoom),
         2/altura da vista na ortográfica */
      const e5 = camNivel.projectionMatrix.elements[5];
      _pa.copy(c.raiz.position); _pa.y += h / 2; _pa.applyMatrix4(camNivel.matrixWorldInverse);
      const prof = camNivel.isOrthographicCamera ? 1 : -_pa.z;
      /* atrás da câmera: tanto faz (não aparece) */
      if(prof <= 0) longe = nv.eLonge;
      else {
        const px = h * e5 / prof * alturaNivel / 2;
        longe = nv.eLonge ? px < NIVEL_PERTO : px < NIVEL_LONGE;
      }
    }
    const geo = longe ? geometriaDeLonge(nv) : nv.perto;
    if(!geo){ if(junto.geometry !== nv.perto) junto.geometry = nv.perto; nv.eLonge = false; return; }
    if(junto.geometry !== geo) junto.geometry = geo;
    nv.eLonge = longe;
  }

  const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3();
  function girarOsso(j, x, y, z){
    if(!j) return;
    _q.setFromEuler(_e.set(x||0, y||0, z||0, 'XYZ'));
    j.b.quaternion.copy(j.CpInv).multiply(_q).multiply(j.Cp).multiply(j.Lrest);
  }
  function aplicarPoseGLB(c, p, escala){
    c.raiz.scale.setScalar(escala);
    /* o corpo de caixas gira pela raiz no chão com a pélvis a 16,5+y
       dela; o GLB tem a origem nos pés, então o deslocamento `y` vai
       girado junto — deitado, y=−13,3 põe a pélvis no chão em vez de
       enterrar o corpo */
    c.modelo.rotation.set(p.rotRaiz, 0, p.rolo);
    _v.set(0, p.y + (p.peito-1)*8, 0).applyEuler(c.modelo.rotation);
    c.modelo.position.copy(_v);
    const J = c.J;
    girarOsso(J.pelvis, 0, 0, 0);
    girarOsso(J.tronco, p.inclina, p.gira, p.tomba);
    girarOsso(J.cabeca, p.olhaX, p.olhaY, 0);
    for(let k=0;k<2;k++){
      girarOsso(J.quadril[k], p.coxa[k], 0, 0);
      girarOsso(J.joelho[k], p.joelho[k], 0, 0);
      girarOsso(J.pe[k], p.pe[k], 0, 0);
      girarOsso(J.ombro[k], p.ombro[k], 0, (k===0?1:-1)*p.ombroZ[k]);
      girarOsso(J.cotovelo[k], p.cotovelo[k], 0, (k===0?1:-1)*p.maoZ[k]);
      girarOsso(J.mao[k], p.pulso[k], 0, 0);
    }
    if(c.escudo){ c.escudo.visible = !!p.escudo; if(c.escudo.faixa) c.escudo.faixa.visible = !!p.escudo; }
  }

  /* =======================================================
     A POSE: ângulos por junta
     coxa[k]  : rotação x do quadril (+ perna pra trás)
     joelho[k]: rotação x (+ dobra natural)
     pe[k]    : rotação x do pé
     ombro[k] : rotação x (− braço pra frente), ombroZ (+ abre pro lado)
     cotovelo : rotação x (− dobra natural)
     tronco   : inclina (x), gira (y), tomba (z)
     cabeca   : olhaX (x), olhaY (y)
     y        : altura extra do corpo; rotRaiz (x): deita; rolo (z)
     ======================================================= */
  function poseNeutra(){
    return {coxa:[0,0], joelho:[0,0], pe:[0,0], ombro:[0.06,0.06], ombroZ:[0.10,0.10], cotovelo:[-0.28,-0.28],
            maoZ:[0,0], punho:[0,0], pulso:[0,0], inclina:0, gira:0, tomba:0, olhaX:0, olhaY:0, y:0, rotRaiz:0, rolo:0,
            peito:1, escudo:false};
  }
  function copiar(p){ return JSON.parse(JSON.stringify(p)); }
  function misturarPose(atual, alvo, k){
    for(const c in alvo){
      const v = alvo[c];
      if(Array.isArray(v)){ for(let i=0;i<v.length;i++) atual[c][i] += (v[i]-atual[c][i])*k; }
      else if(typeof v === 'number') atual[c] += (v-atual[c])*k;
      else atual[c] = v;
    }
  }
  function aplicarPose(c, p, escala){
    if(c.glb){ aplicarPoseGLB(c, p, escala); return; }
    c.raiz.scale.setScalar(escala);
    c.raiz.rotation.x = p.rotRaiz; c.raiz.rotation.z = p.rolo;
    c.pelvis.position.y = 16.5 + p.y;
    c.tronco.rotation.set(p.inclina, p.gira, p.tomba);
    c.pelvis.position.y = 16.5 + p.y + (p.peito-1)*8;
    c.cabeca.rotation.set(p.olhaX, p.olhaY, 0);
    for(let k=0;k<2;k++){
      c.coxas[k].rotation.x = p.coxa[k];
      c.joelhos[k].rotation.x = p.joelho[k];
      c.pes[k].rotation.x = p.pe[k];
      c.bracos[k].rotation.set(p.ombro[k], 0, (k===0?1:-1)*p.ombroZ[k]);
      c.antebracos[k].rotation.x = p.cotovelo[k];
      c.antebracos[k].rotation.z = (k===0?1:-1)*p.maoZ[k];
      const s = 1 + p.punho[k]*0.25;
      c.maos[k].punho.scale.setScalar(s);
      c.maos[k].j.rotation.x = p.pulso[k];
    }
    if(c.escudo) c.escudo.visible = !!p.escudo;
  }

  const suave = k => k<=0 ? 0 : k>=1 ? 1 : k*k*(3-2*k);
  /* A VARIAÇÃO (pedido do dono, 06/09/2026): cada movimento tem três
     jeitos de sair. A figura escolhe pelo próprio número e troca de
     tempos em tempos, deslocada pela fase — na aglomeração o vizinho
     cai em outro jeito e ninguém repete ninguém. `varianteForcada` é
     a vitrine pedindo uma certa. */
  function variante(f, nome, t, periodo){
    if(f.varianteForcada!=null) return f.varianteForcada;
    return dado(f.sem+'|'+nome+'|'+Math.floor((t + f.fase*1.3)/(periodo||4)), 3);
  }
  const mistura = (a,b,k) => a + (b-a)*k;
  function girar(atual, alvo, k){
    let d = alvo - atual;
    while(d > Math.PI) d -= Math.PI*2;
    while(d < -Math.PI) d += Math.PI*2;
    return atual + d*k;
  }

  /* =======================================================
     OS MOVIMENTOS: cada um escreve na pose-alvo `p`
     ======================================================= */
  /* A MÃO NA CINTURA DO CORPO NOVO (06/10/2026): os ângulos antigos eram do
     boneco de caixas e do primeiro GLB — no corpo do MakeHuman a mão subia
     pro peito, o braço abria e levantava e o ombro estufava. Aqui o braço
     cai aberto e um pouco pra trás, o cotovelo aponta pro lado e a mão
     assenta na crista do quadril. Os números saíram de uma varredura medindo
     a mão no esqueleto — e mostraram que NESTE esqueleto `ombroZ` positivo
     FECHA o braço; abrir é negativo. */
  const MAO_NA_CINTURA = {ombro:0.05, ombroZ:-0.6, cotovelo:-1.8, maoZ:1.2};
  /* parado: respira, pesa numa perna, olha em volta de vez em quando */
  /* parado: respira, pesa numa perna, olha em volta — cada um no seu
     tempo e na sua postura */
  function parado(p, f, t){
    const e = f.estilo;
    const r = Math.sin(t*1.7 + f.fase);
    p.peito = 1 + 0.02*r;
    p.inclina = 0.02 + 0.012*r + e.curvado;
    p.tomba = 0.03*e.gingado*Math.sin(t*0.6 + f.fase) + 0.02*ruido(f, t, 0.9, 1.3);
    p.gira = 0.05*e.inquieto*ruido(f, t, 0.5, 0.8);
    /* O PESO TROCA DE PERNA (pente fino, 06/10/2026): ninguém fica parado
       sempre na mesma perna — de tempos em tempos o corpo passa o peso pro
       outro lado, devagar, e o quadril e o ombro acompanham */
    const lado = Math.max(-1, Math.min(1, 2.5*Math.sin(t*0.11 + f.fase*3)));
    p.coxa = [0.06*lado, -0.04*lado]; p.joelho = [0.08 + 0.05*Math.max(0, -lado), 0.08 + 0.05*Math.max(0, lado)];
    p.tomba += 0.025*lado;
    if(e.pesado){ p.joelho = [0.16, 0.12]; p.y = -0.6; }
    const olha = Math.sin(t*0.13+f.fase) > (0.6 - e.inquieto*0.3) ? 1 : 0.2;
    p.olhaY = 0.35*e.inquieto*Math.sin(t*0.45 + f.fase*2)*olha;
    p.olhaX = 0.05*Math.sin(t*0.8+f.fase) + e.curvado*0.5;
    const v = variante(f, 'parado', t, 6);
    const C = MAO_NA_CINTURA;
    if(v===1){            // mãos na cintura
      p.ombro = [C.ombro, C.ombro]; p.ombroZ = [C.ombroZ, C.ombroZ]; p.cotovelo = [C.cotovelo, C.cotovelo]; p.maoZ = [C.maoZ, C.maoZ]; p.punho = [0, 0];
      p.inclina -= 0.04; p.peito += 0.02;
    } else if(v===2){     // uma mão na cintura, peso numa perna só
      p.ombro = [C.ombro, 0.08 - 0.03*ruido(f,t,0.8,1.2)]; p.ombroZ = [C.ombroZ, 0.12]; p.cotovelo = [C.cotovelo, -0.35]; p.maoZ = [C.maoZ, 0]; p.punho = [0, 0];
      p.tomba += 0.06*lado; p.coxa = [0.12*lado, -0.1*lado]; p.joelho = [0.04, 0.22]; p.y -= 0.4;
    } else {              // solto, braços caídos
      p.ombro = [0.08 + 0.03*ruido(f,t,1.1,0.7), 0.08 - 0.03*ruido(f,t,0.8,1.2)];
      p.cotovelo = [-0.3, -0.35]; p.ombroZ = [0.10+0.02*e.gingado, 0.10+0.02*e.gingado];
    }
  }

  /* andar e correr: ciclo pela velocidade medida, na passada, cadência
     e balanço de cada um */
  function passo(p, f, vel, dt, corre, minimo){
    /* abaixo do mínimo é empurra-empurra da separação, não passo: quem
       está na troca de socos não fica marchando no lugar */
    if(vel < (minimo||6)){ f.ciclo += dt*0.6; return false; }
    const e = f.estilo;
    /* três andares e três corridas: solto, gingado, duro / normal,
       braço aberto, curvado */
    const v = variante(f, corre ? 'corre' : 'anda', f.ciclo*0.1, 5);
    const gingado = (!corre && v===1) ? 1.9 : 1, duro = (!corre && v===2);
    const freq = (corre ? 0.085 : 0.075) * e.cadencia * (duro ? 1.12 : 1) / e.passada;
    f.ciclo += vel*freq*dt*6.28*0.36;
    const c = f.ciclo, s = Math.sin(c), s2 = Math.sin(c+Math.PI);
    const amp = (corre ? 0.95 : 0.55) * e.passada * (duro ? 0.9 : 1);
    const lev = (corre ? 1.25 : 0.72) * e.passada;
    p.coxa = [s*amp, s2*amp];
    /* O JOELHO DE GENTE (pente fino, 06/10/2026): ele dobra mais na
       PASSAGEM — a perna de balanço passando por baixo do corpo (coxa
       indo pra frente, cos < 0) —, chega quase reta no calcanhar e
       dobra de leve no apoio, amortecendo o peso. Antes dobrava mais com
       a perna já esticada à frente, o que é o contrário. */
    const base = e.pesado ? 0.14 : 0.06;
    const joe = (fase) => {
      const balanco = Math.max(0, -Math.cos(fase)), apoio = Math.max(0, Math.cos(fase))*Math.max(0, -Math.sin(fase));
      return base + lev*Math.pow(balanco, 1.6) + (corre ? 0.35 : 0.14)*apoio;
    };
    p.joelho = [joe(c), joe(c + Math.PI)];
    /* o pé: ponta empurra quando a perna está atrás, calcanhar pisa (ponta
       pra cima) quando a perna chega à frente */
    /* e no balanço a ponta sobe, pra não arrastar no chão */
    const ponta = fa => { const fs = Math.sin(fa); return Math.pow(Math.max(0, fs), 2)*0.24 - Math.max(0, -fs)*0.14 - 0.45*Math.pow(Math.max(0, -Math.cos(fa)), 1.6); };
    p.pe = [ponta(c), ponta(c + Math.PI)];
    /* o braço balança contra a perna, um tico atrasado, e o cotovelo
       dobra mais quando o braço vem pra frente */
    const cb = c - 0.25, sb = Math.sin(cb), sb2 = Math.sin(cb + Math.PI);
    const bs = (corre ? 0.9 : 0.55) * e.balanco * (duro ? 0.35 : v===1 && !corre ? 0.75 : 1);
    p.ombro = [sb2*bs - (corre?0.4:0.05), sb*bs - (corre?0.4:0.05)];
    p.cotovelo = corre ? [-1.5 - 0.15*Math.max(0, -sb2), -1.5 - 0.15*Math.max(0, -sb)] : duro ? [-0.25, -0.25]
               : [-0.32 - Math.max(0, -sb2)*0.45*e.balanco, -0.32 - Math.max(0, -sb)*0.45*e.balanco];
    p.ombroZ = [0.12, 0.12];
    p.gira = -s*(corre?0.22:0.10)*e.balanco*(gingado>1 ? 1.4 : duro ? 0.5 : 1);          // ombros contra o quadril
    p.tomba = Math.sin(c)*(corre?0.05:0.035)*e.gingado*(duro ? 0.4 : gingado);
    p.inclina = (corre ? 0.30 : 0.07) + e.curvado + (duro ? 0.03 : 0);
    /* o sobe-e-desce: andando, o corpo é mais alto com as pernas juntas
       (no apoio) e mais baixo com elas abertas; correndo é o contrário —
       o alto é o voo, com as pernas abertas */
    p.y = (corre ? Math.abs(Math.sin(c))*1.4 - 0.6 : (0.5 + 0.5*Math.cos(2*c))*0.7 - 0.35)
          *e.passada*(gingado>1 ? 1.4 : 1) - (e.pesado?0.8:0);
    p.olhaX = (corre ? -0.1 : 0.02) + e.curvado*0.4;
    /* a cabeça segura o olhar pra frente: gira contra o tronco */
    p.olhaY = 0.06*ruido(f, c*0.3, 1, 1.4) - p.gira*0.7;
    if(corre && v===1){ p.ombroZ = [0.45, 0.45]; p.cotovelo = [-1.15, -1.15]; p.ombro[0] -= 0.2; p.ombro[1] -= 0.2; }
    if(corre && v===2){ p.inclina += 0.16; p.olhaX += 0.22; p.cotovelo = [-1.8, -1.8]; p.ombroZ = [0.05, 0.05]; }
    return true;
  }

  const GOLPES = {
    jab:{dur:0.30, forca:0.5}, direto:{dur:0.40, forca:0.85}, gancho:{dur:0.46, forca:1.1},
    uppercut:{dur:0.44, forca:1.0}, empurrao:{dur:0.52, forca:0.7},
    chute:{dur:0.62, forca:1.3}, chuteBaixo:{dur:0.6, forca:1.2}, joelhada:{dur:0.55, forca:1.2}, agarrar:{dur:0.5, forca:0.4}
  };
  const REPERTORIO = {
    misto:   {jab:.38, direto:.30, gancho:.17, uppercut:.09, empurrao:.06},
    tecnico: {jab:.45, direto:.35, gancho:.10, uppercut:.05, empurrao:.05},
    brigao:  {jab:.15, direto:.22, gancho:.36, uppercut:.16, empurrao:.11},
    chutador:{jab:.30, direto:.28, gancho:.22, uppercut:.08, empurrao:.12}
  };
  const CHUTES = ['chute','chuteBaixo','joelhada'];
  /* O GOLPE É DO COMBATE (`d.ataque`: soco 0,36 s com impacto aos
     0,15; chute 0,58 s com impacto aos 0,28 — `ataque.tipo` diz qual).
     Aqui só se escolhe COMO ele sai — jab, direto, gancho… pelo
     repertório de cada um; frontal, baixo ou joelhada quando é chute —
     e cada saída ainda tem três jeitos (`var`): o de sempre, mais de
     baixo com o corpo todo, mais de cima e aberto. */
  function escolherGolpe(f, ref){
    const e = f.estilo;
    const vr = f.varianteForcada!=null ? f.varianteForcada : Math.floor(Math.random()*3);
    let tipo;
    if(ref.tipo==='chute') tipo = CHUTES[vr];
    else if(ref.tipo==='joelhada') tipo = 'joelhada';
    else if(ref.tipo==='agarrar') tipo = 'agarrar';
    else if(ref.tipo==='contra') tipo = vr===2 ? 'gancho' : 'direto';
    else {
      const pesos = REPERTORIO[e.repertorio] || REPERTORIO.misto;
      let r = Math.random(); tipo = 'jab';
      for(const k in pesos){ r -= pesos[k]; if(r <= 0){ tipo = k; break; } }
    }
    const frente = e.canhoto ? 1 : 0;
    const lado = tipo==='jab' ? frente : tipo==='direto' ? 1-frente : (f.ladoSoco = 1 - f.ladoSoco);
    f.ataque = {tipo, lado, ref, amp: (0.88 + Math.random()*0.24)*(ref.tipo==='contra' ? 1.25 : 1), avisou:false, var: vr};
  }

  function lutar(p, f, d, dt, t){
    guarda(p, f, t);
    const at = d.ataque;
    if(!at){ f.ataque = null; return; }
    if(!f.ataque || f.ataque.ref !== at) escolherGolpe(f, at);
    const a = f.ataque;
    const k = Math.min(1, at.t/at.dur);
    /* o impacto é do combate; aqui só se avisa o desenho do alvo — e
       se ele esquivou, é a esquiva que aparece, não a pancada */
    if(!a.avisou && at.bateu){
      a.avisou = true;
      const alvo = at.alvo;
      if(alvo && alvo._b3 && alvo.vivo && !(alvo.esquivou > 0)){
        const dx = alvo.x-d.x, dz = alvo.y-d.y;
        const lado = Math.sign(Math.sin(alvo._b3.yaw)*dz - Math.cos(alvo._b3.yaw)*dx) || 1;
        alvo._b3.impacto = {t:0, dur: a.tipo==='jab'?0.26:0.36, forca:GOLPES[a.tipo].forca, lado, tipo:a.tipo};
      }
    }
    const chute = at.tipo==='chute';
    /* o impacto do combate cai no pico da extensão: `ataque.impacto`
       sobre `ataque.dur` (0,15/0,36 no soco, 0,28/0,58 no chute, 0,10/0,28
       no contragolpe, 0,22/0,5 no agarrão) */
    const pico = Math.min(0.6, Math.max(0.3, (at.impacto!==undefined ? at.impacto : 0.15)/at.dur + 0.06));
    const ida = suave(k/pico), volta = suave((k-pico-0.12)/Math.max(0.2, 1-pico-0.12));
    const ext = ida*(1-volta)*(a.amp||1);
    const b = a.lado, o = 1-b, sg = b===1 ? 1 : -1;
    /* o quadril vai antes do ombro: a rotação do tronco arma um pouco antes */
    const arma = suave(k/(pico*0.7));
    const vr = a.var||0;
    switch(a.tipo){
      case 'jab':
        p.ombro[b] = mistura(-1.25, -1.62, ext); p.ombroZ[b] = mistura(0.25, 0.05, ext);
        p.cotovelo[b] = mistura(-2.3, -0.1, ext); p.maoZ[b] = 0;
        p.gira = sg*mistura(0.05, -0.18, ext); p.inclina = 0.2 + ext*0.06;
        p.y = -1.5 - ext*0.3; break;
      case 'direto':
        p.ombro[b] = mistura(-1.1, -1.65, ext); p.ombroZ[b] = mistura(0.35, 0.02, ext);
        p.cotovelo[b] = mistura(-2.35, -0.08, ext);
        p.gira = sg*mistura(mistura(0.15, 0.4, arma), -0.5, ext); p.inclina = 0.2 + ext*0.22;
        p.coxa = [b===0?-0.4:0.3, b===1?-0.4:0.3]; p.joelho = [0.4, 0.3]; p.pe[o] = ext*0.5;
        p.y = -1.6 - ext*0.7; p.olhaY = -sg*ext*0.12; break;
      case 'gancho':
        p.ombro[b] = mistura(-0.9, -1.55, ext); p.ombroZ[b] = mistura(1.35, 0.35, ext);
        p.cotovelo[b] = mistura(-1.7, -1.5, ext); p.maoZ[b] = mistura(0.2, 0.8, ext);
        p.gira = sg*mistura(mistura(0.2, 0.5, arma), -0.65, ext); p.inclina = 0.22;
        p.coxa = [b===0?-0.3:0.25, b===1?-0.3:0.25]; p.joelho = [0.4, 0.4];
        p.y = -1.8 - ext*0.4; break;
      case 'uppercut':
        p.ombro[b] = mistura(0.25, -1.35, ext); p.ombroZ[b] = mistura(0.35, 0.15, ext);
        p.cotovelo[b] = mistura(-1.1, -2.35, ext); p.maoZ[b] = 0.3;
        p.gira = sg*mistura(0.35, -0.3, ext); p.inclina = mistura(0.35, -0.05, ext);
        p.joelho = [mistura(0.7, 0.2, ext), mistura(0.7, 0.2, ext)];
        p.y = mistura(-3.0, -0.4, ext); p.olhaX = mistura(0.25, -0.15, ext); break;
      case 'chute':      // frontal: arma o joelho alto e empurra com a sola
        p.coxa[b] = mistura(mistura(0.15, -1.0, arma), -1.5, ext); p.joelho[b] = mistura(mistura(0.3, 1.9, arma), 0.15, ext); p.pe[b] = mistura(0.4, -0.35, ext);
        p.coxa[o] = 0.18; p.joelho[o] = 0.28; p.pe[o] = 0.1;
        p.ombro = [-0.75, -0.75]; p.ombroZ = [0.7, 0.7]; p.cotovelo = [-1.35, -1.35]; p.punho = [1, 1];
        p.inclina = mistura(0.15, -0.32, ext); p.gira = sg*mistura(0.2, -0.25, ext);
        p.y = -1.2 - ext*0.7; p.olhaX = 0.15; break;
      case 'chuteBaixo': // de perna esticada, por fora, na coxa: o corpo tomba pro lado
        p.coxa[b] = mistura(mistura(0.2, 0.75, arma), -0.85, ext); p.joelho[b] = mistura(0.55, 0.3, ext); p.pe[b] = mistura(0.3, -0.25, ext);
        p.coxa[o] = 0.1; p.joelho[o] = mistura(0.35, 0.6, ext);
        p.ombro = [b===0 ? -1.2 : 0.3, b===1 ? -1.2 : 0.3]; p.ombroZ = [0.75, 0.75]; p.cotovelo = [-1.4, -1.4];
        p.rolo = sg*mistura(-0.05, 0.28, ext); p.gira = sg*mistura(0.35, -0.7, ext); p.inclina = mistura(0.2, 0.05, ext);
        p.y = -1.6 - ext*1.2; break;
      case 'joelhada':   // puxa com as duas mãos e sobe o joelho
        p.coxa[b] = mistura(mistura(0.2, -0.4, arma), -1.75, ext); p.joelho[b] = mistura(0.5, 2.35, ext); p.pe[b] = 0.5;
        p.coxa[o] = 0.25; p.joelho[o] = 0.3;
        p.ombro = [mistura(-1.5, -0.55, ext), mistura(-1.5, -0.55, ext)]; p.ombroZ = [0.3, 0.3]; p.cotovelo = [mistura(-1.2, -1.9, ext), mistura(-1.2, -1.9, ext)]; p.punho = [1, 1];
        p.inclina = mistura(0.1, 0.42, ext); p.gira = sg*0.1; p.olhaX = 0.35;
        p.y = -1.0 - ext*1.4; break;
      case 'agarrar':    // os dois braços vão à frente, as mãos abertas fecham na gola
        p.ombro = [mistura(-0.9, -1.45, ext), mistura(-0.9, -1.45, ext)]; p.ombroZ = [0.4, 0.4];
        p.cotovelo = [mistura(-1.6, -0.35, ext), mistura(-1.6, -0.35, ext)]; p.maoZ = [0.25*ext, 0.25*ext]; p.punho = [ext, ext];
        p.inclina = 0.2 + ext*0.25; p.coxa = [-0.45, 0.3]; p.joelho = [0.45, 0.3]; p.olhaX = 0.2;
        p.y = -1.6 - ext*0.8; break;
      case 'empurrao':
        p.ombro = [mistura(-0.8, -1.5, ext), mistura(-0.8, -1.5, ext)]; p.ombroZ = [0.35, 0.35];
        p.cotovelo = [mistura(-2.2, -0.15, ext), mistura(-2.2, -0.15, ext)]; p.punho = [0, 0];
        p.inclina = 0.15 + ext*0.3; p.coxa = [-0.5, 0.35]; p.joelho = [0.45, 0.25]; p.pe[1] = ext*0.5;
        p.y = -1.4 - ext*0.6; break;
    }
    /* os três jeitos de cada soco: de baixo com o corpo todo (mais
       agachado, mais giro), de cima e aberto (braço mais alto, ombro
       aberto), ou o de sempre */
    if(!chute && vr===1){ p.y -= 1.0; p.gira *= 1.35; p.inclina += 0.1; p.joelho[0] += 0.2; p.joelho[1] += 0.2; }
    if(!chute && vr===2){ p.ombro[b] -= 0.22*ext; p.ombroZ[b] += 0.2; p.inclina -= 0.05; p.tomba = -sg*0.08*ext; }
  }

  function guarda(p, f, t){
    const e = f.estilo;
    const w = t*(5.0 + e.gingado*0.8) + f.fase;
    const q = Math.abs(Math.sin(w));
    switch(e.guarda){
      case 'alta':   p.ombro = [-1.55, -1.5]; p.cotovelo = [-2.55, -2.5]; p.ombroZ = [0.35, 0.4]; p.maoZ = [0.3, 0.3]; p.olhaX = 0.3; break;
      case 'baixa':  p.ombro = [-0.7, -0.6]; p.cotovelo = [-1.7, -1.6]; p.ombroZ = [0.2, 0.25]; p.maoZ = [0.1, 0.1]; p.olhaX = -0.08; break;
      case 'aberta': p.ombro = [-1.05, -1.0]; p.cotovelo = [-1.3, -1.25]; p.ombroZ = [0.95, 1.0]; p.maoZ = [0, 0]; p.olhaX = 0.12; break;
      default:       p.ombro = [-1.3, -1.2]; p.cotovelo = [-2.35, -2.3]; p.ombroZ = [0.22, 0.28]; p.maoZ = [0.15, 0.15]; p.olhaX = 0.18;
    }
    p.punho = [1, 1];
    p.inclina = (e.guarda==='aberta' ? 0.3 : e.guarda==='baixa' ? 0.08 : 0.2) + 0.03*Math.sin(w*0.5) + e.curvado*0.5;
    p.coxa = [-0.3, 0.3]; p.joelho = [0.42, 0.38];
    if(e.pesado){ p.joelho = [0.5, 0.46]; }
    p.y = -1.6 + q*0.9*e.gingado - (e.pesado?0.5:0);
    p.gira = 0.12*e.gingado*Math.sin(t*2.2+f.fase) + 0.04*ruido(f,t,1.4,0.9);
    p.tomba = 0.06*e.gingado*Math.sin(t*1.7+f.fase*2);
    p.olhaY = 0.08*Math.sin(t*1.3+f.fase) + 0.05*ruido(f,t,0.7,1.1);
    /* três jeitos de esperar em guarda: plantado, quicando na ponta
       do pé, ou rolando os ombros e trocando o peso de perna */
    const v = variante(f, 'guarda', t, 3);
    if(v===1){ const s = Math.max(0, Math.sin(w*0.9)); p.y += s*1.6; p.joelho = [0.3 + s*0.25, 0.28 + s*0.25]; p.pe = [s*0.4, s*0.4]; }
    else if(v===2){
      const s = Math.sin(t*2.6+f.fase);
      p.tomba += 0.12*s; p.gira += 0.18*s; p.coxa = [-0.3 + 0.12*s, 0.3 - 0.12*s];
      p.ombro[0] += 0.15*Math.max(0,s); p.ombro[1] += 0.15*Math.max(0,-s); p.ombroZ[0] += 0.1*Math.max(0,s); p.ombroZ[1] += 0.1*Math.max(0,-s);
    }
  }

  /* TORCER (retaguarda, longe da briga): braço no alto bombando,
     palmas baixas, palmas altas, pulando, apontando. As palmas foram
     pedido do dono (06/09/2026) — o "braços abertos" saiu. */
  function torcer(p, f, t, dt){
    f.tGesto -= dt;
    if(f.tGesto <= 0){
      f.gesto = f.varianteForcada!=null ? [1, 2, 0][f.varianteForcada] : Math.random() < 0.4 ? f.estilo.gestoFav : dado(f.sem+'|g'+Math.floor(t/2.3), 5);
      f.tGesto = 1.6 + Math.random()*1.8;
    }
    parado(p, f, t);
    const w = t*7 + f.fase;
    const bate = Math.abs(Math.sin(t*(4.6 + f.estilo.gingado*0.6) + f.fase));   // 0 = mãos juntas, 1 = abertas
    if(f.gesto===0){           // braço no alto, bombando
      p.ombro[1] = -2.9 + 0.25*Math.sin(w); p.cotovelo[1] = -0.5; p.ombroZ[1] = 0.3; p.punho[1]=1;
      p.olhaX = -0.25;
    } else if(f.gesto===1){    // palmas baixas, na altura do peito
      p.ombro = [-0.75, -0.75]; p.cotovelo = [-1.15, -1.15]; p.maoZ = [0.5, 0.5]; p.punho = [0, 0];
      p.ombroZ = [0.12 + 0.4*bate, 0.12 + 0.4*bate]; p.pulso = [-0.2, -0.2];
      p.inclina = 0.08; p.olhaX = 0.02; p.y -= 0.2*(1-bate);
    } else if(f.gesto===2){    // palmas altas, acima da cabeça
      p.ombro = [-2.75, -2.75]; p.cotovelo = [-0.45, -0.45]; p.maoZ = [0.2, 0.2]; p.punho = [0, 0];
      p.ombroZ = [0.2 + 0.5*bate, 0.2 + 0.5*bate];
      p.olhaX = -0.3; p.inclina = -0.06; p.y += 0.5*(1-bate);
    } else if(f.gesto===3){    // pulando
      const s = Math.max(0, Math.sin(w*0.8));
      p.y = s*3.5; p.joelho = [0.5 - s*0.4, 0.5 - s*0.4]; p.coxa = [-0.2, -0.2];
      p.ombro = [-2.6, -2.6]; p.cotovelo = [-0.3, -0.3]; p.ombroZ = [0.5, 0.5];
    } else {                   // apontando pra frente e gritando
      p.ombro[0] = -1.5; p.cotovelo[0] = -0.1; p.ombroZ[0] = 0.15;
      p.inclina = 0.2; p.olhaX = 0.05; p.gira = -0.2;
    }
  }

  /* =======================================================
     O JEITO DO DIA DE JOGO (`d.jeito`, pedido do dono, 27/09/2026):
     "Deixe os bonecos mais espalhados em frente à sede como se
     estivessem à vontade confraternizando. Crie um movimento de
     torcer andando, que vai ser como eles vão se comportar enquanto
     estiverem caminhando na rua em direção ao estádio. Também evite
     fazer um movimento padronizado caminhando."
     - 'festa': parado na porta da sede, na rodinha — conversa com a
       mão, escuta de braço cruzado, bebe, ri, olha o celular, puxa um
       canto, aponta;
     - 'bonde': andando pra o estádio, torce ANDANDO — as pernas são as
       do passo (a passada, a cadência e o balanço de cada um) e em
       cima vai o gesto: o braço no alto bombando, palmas em cima da
       cabeça, palmas no peito, os dois braços pra cima balançando, o
       soco no ar no tempo do canto, conversa virado pro lado, ou só
       anda. Parado (a revista), torce em pé;
     - 'fila': na fila da catraca, mais calmo.
     Cada um troca de gesto quando quer (3 a 9 s, o favorito dele pesa
     mais), no ritmo dele (o tempo da palma é de cada um) e fora de fase
     com o vizinho: ninguém faz o mesmo que o do lado na mesma hora.
     O relógio é o de verdade (`tAnim`), não o do jogo: o dia de jogo
     corre a 30× e a palma não pode.
     ======================================================= */
  const GESTOS = {
    /* [gesto, peso]: 0 nada (o braço do passo ou o do parado) */
    festa:     [['conversa', 26], ['escuta', 18], ['bebe', 14], ['ri', 10], ['celular', 10], ['canta', 12], ['aponta', 5], [0, 5]],
    bondeAnda: [[0, 26], ['braco', 15], ['palmaAlta', 12], ['palmaPeito', 13], ['festa', 8], ['soco', 12], ['conversaAnda', 14]],
    bonde:     [[0, 18], ['braco', 18], ['palmaAlta', 16], ['palmaPeito', 16], ['festa', 10], ['pula', 8], ['soco', 14]],
    fila:      [[0, 40], ['palmaPeito', 14], ['braco', 10], ['celular', 14], ['conversa', 14], ['escuta', 8]],
    /* A VIDA DA PRAÇA (jogo 3D, 27/09/2026): sentado na sede (à mesa, no
       banco, no balcão), trabalhando na mesa, em pé de conversa na sede,
       na porta do bar e andando na calçada */
    sentado:   [['conversa', 26], ['escuta', 30], ['bebe', 14], ['ri', 10], ['celular', 16]],
    trabalho:  [['digita', 70], ['escuta', 18], ['celular', 12]],
    sede:      [['conversa', 26], ['escuta', 22], ['bebe', 12], ['ri', 12], ['celular', 12], ['aponta', 4], [0, 12]],
    bar:       [['bebe', 30], ['conversa', 24], ['ri', 14], ['escuta', 16], ['canta', 6], ['celular', 6], [0, 4]],
    rua:       [[0, 62], ['celular', 20], ['conversaAnda', 18]],
    /* A ARQUIBANCADA VIVA (o dia de jogo, 28/09/2026): a torcida no lugar
       canta junto — palma em cima, braço bombando, pulando, os dois braços
       balançando —, no tempo que a bateria dá (`d.gestoParam`: o ritmo e a
       fase da torcida inteira; sem ele, cada um no seu); e o PUXADOR, de
       costas pro jogo e de frente pra ela, regendo o canto */
    arquibancada: [[0, 8], ['palmaAlta', 22], ['braco', 18], ['festa', 14], ['pula', 14], ['soco', 10], ['palmaPeito', 14]],
    puxador:   [['reger', 34], ['palmaAlta', 18], ['braco', 18], ['festa', 14], ['pula', 10], ['aponta', 6]]
  };
  function escolherGesto(f, lista){
    let tot = 0; for(const [,w] of lista) tot += w;
    /* o favorito de cada um (gestoFav: 0 a 4) pesa o dobro */
    const fav = lista[1 + (f.estilo.gestoFav % (lista.length - 1))][0];
    let r = Math.random()*(tot + 12);
    if(r >= tot) return fav;
    for(const [g,w] of lista){ r -= w; if(r <= 0) return g; }
    return 0;
  }
  /* NA REVISTA (a boca da raia do portão, o dono, 27/09/2026): parado,
     as mãos pro alto, abertas, em V, a cabeça reta — o PM passa a mão.
     (Os braços abertos pro lado seriam o gesto mais comum, mas neste GLB
     o ombroZ negativo, que abre o braço, arrasta a camisa junto e ela
     abre em saia: medido de 0,8 a 1,5; pra cima, pelo ombro, não) */
  function gestoDoJeito(p, f, t, dt, jeito, andando){
    if(jeito === 'revista'){
      p.ombro = [-2.75, -2.75]; p.ombroZ = [0.18, 0.18]; p.cotovelo = [-0.15, -0.15]; p.maoZ = [0, 0]; p.punho = [0, 0];
      p.olhaX = 0.05; p.olhaY = 0;
      return;
    }
    const chave = jeito === 'bonde' ? (andando ? 'bondeAnda' : 'bonde') : jeito;
    const lista = GESTOS[chave] || GESTOS.fila;
    f.jgT = (f.jgT == null ? Math.random()*4 : f.jgT) - dt;
    if(f.jgT <= 0 || f.jgChave !== chave || (f.gestoForcado != null && f.jg !== f.gestoForcado)){
      f.jg = f.gestoForcado != null ? f.gestoForcado : escolherGesto(f, lista); f.jgChave = chave;
      f.jgT = 3 + Math.random()*6;
      /* o tempo da palma (1,5 a 2,1 por segundo) e a fase: de cada um */
      if(f.jgRitmo == null){ f.jgRitmo = 4.7 + frac(f.sem+'rt')*1.9; f.jgFase = frac(f.sem+'rf')*6.28; }
    }
    const g = f.jg, e = f.estilo;
    if(!g) return;
    /* o tempo do canto: o da torcida inteira quando ela canta junta (`gestoParam`) */
    const gp = f.gestoParam, ritmo = gp && gp.ritmo ? gp.ritmo : f.jgRitmo, faseR = gp && gp.fase != null ? gp.fase : f.jgFase;
    const w = t*ritmo + faseR, bate = Math.abs(Math.sin(w)), pulso = Math.max(0, Math.sin(w*0.5));
    const lado = e.canhoto ? 0 : 1, o = 1 - lado;
    switch(g){
      /* ---- na porta da sede ---- */
      case 'conversa': {       // falando: uma mão desenha no ar, a cabeça acompanha
        const a = Math.sin(t*2.3 + f.fase), b = Math.sin(t*3.1 + f.fase*1.7);
        p.ombro[lado] = -0.6 + 0.22*a; p.cotovelo[lado] = -1.55 + 0.35*b; p.ombroZ[lado] = 0.18 + 0.1*b; p.maoZ[lado] = 0.2 + 0.2*a; p.punho[lado] = 0;
        p.olhaX += 0.05*Math.sin(t*4.2 + f.fase); p.olhaY = 0.12*a; p.gira += 0.05*b;
        break;
      }
      case 'escuta':           // braço cruzado, pesa numa perna, balança a cabeça de vez em quando
        p.ombro = [-0.28, -0.28]; p.cotovelo = [-1.95, -1.95]; p.ombroZ = [0.22, 0.22]; p.maoZ = [0.95, 0.95]; p.punho = [0, 0];
        p.olhaX = 0.04 + 0.05*Math.max(0, Math.sin(t*1.1 + f.fase)); p.olhaY = 0.08*Math.sin(t*0.5 + f.fase);
        break;
      case 'bebe': {           // a lata na boca de tempos em tempos: sobe, gole, desce
        const c = (t*0.22 + f.fase) % 1, sobe = suave(c/0.15)*(1 - suave((c - 0.45)/0.15));
        p.ombro[lado] = mistura(-0.45, -1.25, sobe); p.cotovelo[lado] = mistura(-1.5, -2.35, sobe); p.ombroZ[lado] = mistura(0.12, 0.3, sobe);
        p.maoZ[lado] = mistura(0.15, 0.55, sobe); p.punho[lado] = 1;
        p.olhaX = mistura(p.olhaX, -0.3, sobe); p.inclina -= 0.05*sobe;
        break;
      }
      case 'ri': {             // gargalhada: o tronco sacode, a cabeça vai pra trás, mão na barriga
        const s = Math.abs(Math.sin(t*9 + f.fase))*(0.5 + 0.5*Math.max(0, Math.sin(t*0.9 + f.fase)));
        p.inclina = 0.08 + 0.14*s; p.olhaX = -0.18 + 0.12*s; p.peito += 0.03*s; p.y -= 0.4*s;
        p.ombro[o] = -0.35; p.cotovelo[o] = -1.75; p.maoZ[o] = 0.85; p.ombroZ[o] = 0.2;
        p.ombro[lado] = -0.5 + 0.2*s; p.cotovelo[lado] = -1.2; p.ombroZ[lado] = 0.35;
        break;
      }
      case 'celular':          // a cabeça baixa, as duas mãos juntas na frente
        p.ombro = [-0.55, -0.55]; p.cotovelo = [-1.8, -1.8]; p.ombroZ = [0.16, 0.16]; p.maoZ = [0.5, 0.5]; p.punho = [0, 0];
        p.olhaX = 0.42; p.olhaY = 0; p.inclina += 0.04;
        break;
      case 'canta':            // puxando o canto parado: o braço bombando no tempo
        p.ombro[lado] = -2.75 + 0.25*Math.sin(w); p.cotovelo[lado] = -0.35; p.ombroZ[lado] = 0.05; p.punho[lado] = 1;
        p.olhaX = -0.22; p.peito += 0.03*bate;
        break;
      case 'aponta':           // mostrando alguma coisa lá longe
        p.ombro[lado] = -1.5; p.cotovelo[lado] = -0.12; p.ombroZ[lado] = 0.2; p.punho[lado] = 0.5;
        p.gira += 0.15*(lado ? -1 : 1); p.olhaY = 0.2*(lado ? -1 : 1);
        break;
      /* ---- andando pro estádio (as pernas são as do passo) ---- */
      case 'braco':            // o braço no alto, bombando no tempo do canto
        p.ombro[lado] = -2.75 + 0.3*Math.sin(w); p.cotovelo[lado] = -0.2 - 0.25*pulso; p.ombroZ[lado] = 0.05; p.punho[lado] = 1;
        p.olhaX = Math.min(p.olhaX, -0.12) - 0.08; p.inclina -= 0.03;
        break;
      case 'palmaAlta':        // palmas em cima da cabeça
        /* (com o braço erguido, o ombroZ do GLB fecha: 0,5 junta as mãos em cima da cabeça, 0,2 abre em V, 0,7 cruza os braços) */
        p.ombro = [-2.6, -2.6]; p.cotovelo = [-0.5, -0.5]; p.maoZ = [0.2, 0.2]; p.punho = [0, 0];
        p.ombroZ = [0.5 - 0.28*bate, 0.5 - 0.28*bate];
        p.olhaX = -0.25; p.inclina -= 0.05;
        break;
      case 'palmaPeito':       // palmas na altura do peito
        p.ombro = [-0.8, -0.8]; p.cotovelo = [-1.2, -1.2]; p.maoZ = [0.5, 0.5]; p.punho = [0, 0]; p.pulso = [-0.2, -0.2];
        p.ombroZ = [0.12 + 0.38*bate, 0.12 + 0.38*bate];
        break;
      case 'festa': {          // os dois braços pra cima, balançando de um lado pro outro
        const s = Math.sin(t*2.2 + f.jgFase);
        /* (braço erguido: o ombroZ pequeno abre em V; ver as palmas altas) */
        p.ombro = [-2.6 + 0.12*s, -2.6 - 0.12*s]; p.cotovelo = [-0.35, -0.35]; p.maoZ = [0.1, 0.1]; p.punho = [0, 0];
        p.ombroZ = [0.08 + 0.1*s, 0.08 - 0.1*s]; p.tomba += 0.08*s; p.olhaX = -0.2;
        if(!andando) p.y += 0.6*Math.max(0, Math.sin(t*4.4 + f.jgFase));
        break;
      }
      case 'soco':             // o soco no ar, pra frente e pra cima, a cada batida do canto
        p.ombro[lado] = -1.85 - 0.55*pulso; p.cotovelo[lado] = -1.5 + 1.25*pulso; p.ombroZ[lado] = 0.22; p.punho[lado] = 1;
        p.olhaX = -0.12; p.inclina += 0.03*pulso;
        break;
      case 'conversaAnda': {   // andando e conversando com o do lado
        const vira = (frac(f.sem+'cv'+Math.floor(t/7)) < 0.5 ? -1 : 1);
        p.olhaY = 0.45*vira; p.gira += 0.08*vira;
        p.ombro[lado] = -0.7 + 0.2*Math.sin(t*2.6 + f.fase); p.cotovelo[lado] = -1.45 + 0.3*Math.sin(t*3.3 + f.fase); p.maoZ[lado] = 0.25; p.punho[lado] = 0;
        break;
      }
      case 'pula': {           // pulando no lugar (parado)
        const s = Math.max(0, Math.sin(w*0.8));
        p.y = s*3.2; p.joelho = [0.5 - s*0.4, 0.5 - s*0.4]; p.coxa = [-0.2, -0.2];
        p.ombro = [-2.6, -2.6]; p.cotovelo = [-0.3, -0.3]; p.ombroZ = [0.2, 0.2];
        break;
      }
      /* ---- a sede com vida (jogo 3D) ---- */
      case 'digita': {         // sentado no computador: os antebraços na mesa, os dedos batendo
        const a = Math.sin(t*11 + f.fase), b = Math.sin(t*13.7 + f.fase*1.3);
        p.ombro = [-0.5, -0.5]; p.ombroZ = [0.2, 0.2]; p.cotovelo = [-1.2 + 0.06*a, -1.2 + 0.06*b];
        p.maoZ = [0.32, 0.32]; p.punho = [0, 0];
        p.olhaX = 0.16 + 0.04*Math.sin(t*0.6 + f.fase); p.olhaY = 0.06*Math.sin(t*0.4 + f.fase); p.inclina += 0.1;
        break;
      }
      case 'sinuca': {         // debruçado na mesa, o taco na mão de trás; de tempos em tempos, a tacada
        const c = (t*0.28 + f.fase) % 1, puxa = c < 0.7 ? Math.sin(c/0.7*Math.PI*3)*0.35 : -0.5*Math.sin((c - 0.7)/0.3*Math.PI);
        p.inclina = 0.62; p.olhaX = -0.4;
        p.ombro[o] = -1.35; p.cotovelo[o] = -0.25; p.ombroZ[o] = 0.3; p.maoZ[o] = 0.1; p.punho[o] = 0;
        p.ombro[lado] = -0.35 + 0.25*puxa; p.cotovelo[lado] = -1.55 - 0.4*puxa; p.ombroZ[lado] = 0.12; p.punho[lado] = 1;
        p.coxa = [-0.18, 0.12]; p.joelho = [0.25, 0.1];
        break;
      }
      case 'pebolim': {        // as duas mãos nas varetas, girando rápido
        const a = Math.sin(t*9 + f.fase), b = Math.sin(t*7.3 + f.fase*2);
        p.inclina = 0.22; p.olhaX = 0.3;
        p.ombro = [-0.75 + 0.08*a, -0.75 + 0.08*b]; p.cotovelo = [-0.95, -0.95]; p.ombroZ = [0.28, 0.28];
        p.maoZ = [0.15, 0.15]; p.punho = [1, 1]; p.gira += 0.05*Math.sin(t*5 + f.fase);
        break;
      }
      case 'surdo': {          // a baqueta na mão forte, a outra abafando a pele
        p.inclina = 0.12; p.olhaX = 0.22;
        p.ombro[lado] = -0.85 - 0.55*bate; p.cotovelo[lado] = -1.5 + 0.7*bate; p.ombroZ[lado] = 0.2; p.punho[lado] = 1;
        p.ombro[o] = -0.55; p.cotovelo[o] = -1.0; p.ombroZ[o] = 0.25; p.maoZ[o] = 0.2; p.punho[o] = 0;
        break;
      }
      /* ---- a bateria da torcida (o dia de jogo, 28/09/2026) ---- */
      case 'caixa': {          // as duas baquetas na caixa da cintura, uma de cada vez, no dobro do tempo
        const a1 = Math.sin(w*2), a2 = Math.sin(w*2 + Math.PI);
        p.inclina = 0.1; p.olhaX = 0.18;
        p.ombro = [-0.62 - 0.16*Math.max(0, a1), -0.62 - 0.16*Math.max(0, a2)]; p.cotovelo = [-1.55 + 0.35*Math.max(0, a1), -1.55 + 0.35*Math.max(0, a2)];
        p.ombroZ = [0.24, 0.24]; p.maoZ = [0.35, 0.35]; p.punho = [1, 1];
        p.y += 0.25*bate;
        break;
      }
      case 'repique': {        // o repique no quadril: a baqueta na mão forte, a outra mão batendo na pele
        p.inclina = 0.08; p.olhaX = 0.12; p.gira += 0.12*(lado ? -1 : 1);
        p.ombro[lado] = -0.9 - 0.45*bate; p.cotovelo[lado] = -1.35 + 0.55*bate; p.ombroZ[lado] = 0.22; p.punho[lado] = 1;
        p.ombro[o] = -0.75 - 0.3*pulso; p.cotovelo[o] = -1.3 + 0.35*pulso; p.ombroZ[o] = 0.3; p.maoZ[o] = 0.3; p.punho[o] = 0;
        break;
      }
      /* ---- o bandeirão de bambu: as duas mãos no mastro, o corpo no balanço dele ---- */
      case 'mastro': {
        /* `gestoParam.a`: o quanto o mastro deita pro lado agora (rad, + pra
           direita de quem segura); quem desenha o pano manda o mesmo, e as
           mãos vão junto */
        const th = gp && gp.a != null ? gp.a : 0.8*Math.sin(t*2.6 + f.fase);
        p.ombro = [-1.95 + 0.15*th, -1.75 - 0.15*th]; p.cotovelo = [-0.75, -1.05]; p.maoZ = [0.2, 0.2]; p.punho = [1, 1];
        p.ombroZ = [0.42 + 0.22*th, 0.42 - 0.22*th];
        p.gira += 0.3*th; p.tomba += -0.14*th; p.inclina += 0.06; p.olhaX = -0.32; p.olhaY = 0.25*th;
        p.coxa = [-0.05, 0.1]; p.joelho = [0.18, 0.14];
        break;
      }
      /* ---- o puxador, de frente pra torcida ---- */
      case 'reger': {          // os dois braços no alto, um sobe quando o outro desce, no tempo do canto
        const s1 = Math.sin(w);
        p.ombro = [-2.45 + 0.45*s1, -2.45 - 0.45*s1]; p.cotovelo = [-0.35, -0.35]; p.ombroZ = [0.14, 0.14]; p.punho = [1, 1];
        p.olhaX = -0.08; p.inclina -= 0.04; p.y += 0.5*bate;
        break;
      }
      /* ---- a grade: empurrando, sacudindo ---- */
      case 'empurra': {        // as duas mãos na grade na altura do peito, o corpo vai e volta
        const s1 = Math.sin(t*7 + f.fase), s2 = Math.max(0, Math.sin(t*3.5 + f.fase));
        p.ombro = [-1.45 + 0.1*s1, -1.4 - 0.1*s1]; p.cotovelo = [-0.55 - 0.35*s2, -0.6 - 0.35*s2]; p.ombroZ = [0.2, 0.2]; p.maoZ = [0.2, 0.2]; p.punho = [0, 0];
        p.inclina = 0.32 + 0.1*s2; p.coxa = [-0.35, 0.25]; p.joelho = [0.45, 0.2]; p.olhaX = -0.1;
        break;
      }
      /* ---- a faixa: as duas mãos em cima, segurando a borda do pano ---- */
      case 'estende': {
        p.ombro = [-2.25, -2.25]; p.cotovelo = [-0.8, -0.8]; p.ombroZ = [0.32, 0.32]; p.maoZ = [0.1, 0.1]; p.punho = [1, 1];
        p.olhaX = -0.2;
        break;
      }
      case 'churrasco': {      // virando a carne na grelha, olhando pra ela
        const a = Math.sin(t*1.9 + f.fase);
        p.inclina = 0.14; p.olhaX = 0.36;
        p.ombro[lado] = -0.85 + 0.1*a; p.cotovelo[lado] = -1.1 + 0.25*a; p.ombroZ[lado] = 0.2; p.punho[lado] = 1;
        p.ombro[o] = -0.3; p.cotovelo[o] = -1.4; p.ombroZ[o] = 0.15; p.maoZ[o] = 0.4;
        break;
      }
      case 'arruma': {         // mexendo na prateleira, um braço de cada vez
        const a = Math.sin(t*1.3 + f.fase), b = Math.sin(t*1.3 + f.fase + 2.2);
        p.olhaX = -0.18 - 0.1*Math.max(0, a);
        p.ombro[lado] = -1.8 - 0.25*a; p.cotovelo[lado] = -0.7 - 0.3*a; p.ombroZ[lado] = 0.2; p.punho[lado] = 0;
        p.ombro[o] = -1.2 - 0.3*b; p.cotovelo[o] = -1.1; p.ombroZ[o] = 0.2; p.punho[o] = 0;
        break;
      }
      case 'balcao': {         // o garçom passando o pano no balcão, em roda
        const a = Math.sin(t*3 + f.fase), b = Math.cos(t*3 + f.fase);
        p.inclina = 0.14; p.olhaX = 0.22;
        p.ombro[lado] = -0.8 + 0.12*a; p.cotovelo[lado] = -0.95 + 0.2*b; p.ombroZ[lado] = 0.22 + 0.08*b; p.maoZ[lado] = 0.25; p.punho[lado] = 0;
        p.ombro[o] = -0.5; p.cotovelo[o] = -1.2; p.ombroZ[o] = 0.25; p.maoZ[o] = 0.4;
        break;
      }
      /* ---- a academia da sede (os níveis 4 e 5, 30/09/2026) ---- */
      case 'saco': {           // no saco de pancada: a guarda alta e, no tempo dele, um jab e um direto
        const c = (t*1.35 + f.fase) % 1, b = c < 0.5 ? lado : o, k = (c % 0.5)/0.5;
        const ext = k < 0.35 ? Math.sin(k/0.35*Math.PI) : 0;
        p.ombro = [-1.3, -1.2]; p.cotovelo = [-2.35, -2.3]; p.ombroZ = [0.22, 0.28]; p.maoZ = [0.15, 0.15]; p.punho = [1, 1];
        p.ombro[b] = -1.3 - 0.35*ext; p.cotovelo[b] = -2.35 + 2.2*ext; p.ombroZ[b] = 0.22 - 0.17*ext;
        p.gira += (b === lado ? -0.2 : 0.2)*ext; p.inclina = 0.18 + 0.06*ext; p.olhaX = 0.18;
        p.coxa = [-0.25, 0.2]; p.joelho = [0.35, 0.25]; p.y += 0.25*Math.abs(Math.sin(t*5 + f.fase));
        break;
      }
      case 'halter': {         // a rosca com o halter: um braço sobe enquanto o outro desce
        const a = Math.sin(t*1.9 + f.fase), b1 = 0.5 + 0.5*a, b2 = 0.5 - 0.5*a;
        p.ombro = [-0.15, -0.15]; p.ombroZ = [0.12, 0.12]; p.maoZ = [0.1, 0.1]; p.punho = [1, 1];
        p.cotovelo = [-0.2 - 2.1*b1, -0.2 - 2.1*b2];
        p.olhaX = 0.1; p.inclina -= 0.03;
        break;
      }
      case 'guarda': {         // no ringue: a guarda, o gingado e o jab de vez em quando
        const w2 = t*(5.0 + (e.gingado || 0)*0.8) + f.fase, q = Math.abs(Math.sin(w2));
        const c = (t*0.55 + f.fase*0.3) % 1, ext = c < 0.12 ? Math.sin(c/0.12*Math.PI) : 0;
        p.ombro = [-1.3, -1.2]; p.cotovelo = [-2.35, -2.3]; p.ombroZ = [0.22, 0.28]; p.maoZ = [0.15, 0.15]; p.punho = [1, 1];
        p.ombro[o] = -1.3 - 0.32*ext; p.cotovelo[o] = -2.35 + 2.25*ext;
        p.inclina = 0.2; p.olhaX = 0.2; p.gira += 0.12*Math.sin(w2*0.5);
        p.coxa = [-0.3, 0.25]; p.joelho = [0.4, 0.3]; p.y += 0.5*q - 0.8;
        break;
      }
      /* ---- o setor criativo (o nível 5) ---- */
      case 'pinta': {          // debruçado na faixa estendida, o pincel indo e vindo
        const a = Math.sin(t*2.6 + f.fase);
        p.inclina = 0.5; p.olhaX = 0.45;
        p.ombro[lado] = -1.05 + 0.12*a; p.cotovelo[lado] = -0.7 + 0.35*a; p.ombroZ[lado] = 0.3 + 0.15*a; p.punho[lado] = 1;
        p.ombro[o] = -0.8; p.cotovelo[o] = -0.6; p.ombroZ[o] = 0.35; p.maoZ[o] = 0.2; p.punho[o] = 0;
        p.coxa = [-0.2, 0.1]; p.joelho = [0.25, 0.15];
        break;
      }
      case 'costura': {        // na máquina: as duas mãos guiando o pano, a cabeça baixa
        const a = Math.sin(t*1.4 + f.fase);
        p.ombro = [-0.6, -0.6]; p.ombroZ = [0.28, 0.28]; p.cotovelo = [-1.05 + 0.08*a, -1.05 - 0.08*a]; p.maoZ = [0.3, 0.3]; p.punho = [0, 0];
        p.olhaX = 0.42; p.inclina += 0.14;
        break;
      }
      /* ---- o pagode do bar (a festa na sede) ---- */
      case 'cavaco': {         // o cavaquinho no peito: a mão forte palhetando, a outra no braço dele, aberta pro lado
        const a = Math.sin(t*14 + f.fase);
        p.ombro[lado] = -0.55 + 0.05*a; p.cotovelo[lado] = -1.55 + 0.12*a; p.ombroZ[lado] = 0.3; p.maoZ[lado] = 0.45; p.punho[lado] = 0;
        p.ombro[o] = -0.95; p.cotovelo[o] = -1.0; p.ombroZ[o] = 0.55; p.maoZ[o] = 0.1; p.punho[o] = 0.6;
        p.olhaX = 0.2; p.olhaY = 0.15*(lado ? 1 : -1); p.gira += 0.05*Math.sin(t*2.2 + f.fase);
        break;
      }
      case 'pandeiro': {       // o pandeiro erguido numa mão, a outra batendo no tempo
        p.ombro[o] = -1.35; p.cotovelo[o] = -1.35; p.ombroZ[o] = 0.35; p.maoZ[o] = 0.3; p.punho[o] = 0.7;
        p.ombro[lado] = -1.05 - 0.2*bate; p.cotovelo[lado] = -1.55 + 0.35*bate; p.ombroZ[lado] = 0.35; p.maoZ[lado] = 0.35; p.punho[lado] = 0;
        p.olhaX = 0.05; p.gira += 0.06*Math.sin(w*0.5);
        break;
      }
      case 'tanta': {          // o tantã no colo: as duas mãos batendo, uma de cada vez
        const a1 = Math.max(0, Math.sin(w)), a2 = Math.max(0, Math.sin(w + Math.PI));
        p.ombro = [-0.55 - 0.18*a1, -0.55 - 0.18*a2]; p.cotovelo = [-1.25 + 0.3*a1, -1.25 + 0.3*a2];
        p.ombroZ = [0.3, 0.3]; p.maoZ = [0.3, 0.3]; p.punho = [0, 0];
        p.inclina += 0.1; p.olhaX = 0.25;
        break;
      }
    }
  }
  /* levar pancada: cabeça vai, tronco vai atrás, um passo pra trás */
  /* quem está apanhando sem revidar se cobre: braços em volta da
     cabeça, queixo enterrado, meio de lado, encolhido */
  function cobrirSe(p, f, t){
    const w = t*6 + f.fase;
    const v = variante(f, 'cobre', t, 2);
    if(v===1){              // de costas meio viradas, um braço em cima
      p.ombro = [-2.5, -0.9]; p.cotovelo = [-2.4, -2.2]; p.ombroZ = [0.6, 0.3]; p.maoZ = [0.5, 0.4];
      p.gira = -0.75; p.tomba = 0.2; p.inclina = 0.45 + 0.03*Math.sin(w); p.olhaX = 0.5; p.olhaY = -0.6;
      p.coxa = [-0.35, 0.4]; p.joelho = [0.7, 0.55]; p.y = -3.4;
    } else if(v===2){       // agachado, as duas mãos na frente do rosto
      p.ombro = [-1.9, -1.85]; p.cotovelo = [-2.55, -2.55]; p.ombroZ = [0.25, 0.25]; p.maoZ = [0.5, 0.5];
      p.inclina = 0.55 + 0.03*Math.sin(w); p.gira = -0.1; p.olhaX = 0.55;
      p.coxa = [-0.7, -0.6]; p.joelho = [1.0, 0.95]; p.y = -5.0;
    } else {
      if(f.cobre){ p.ombro = [-2.4, -2.5]; p.cotovelo = [-2.5, -2.5]; p.ombroZ = [0.5, 0.45]; p.maoZ = [0.5, 0.5]; }
      else { p.ombro = [-1.5, -1.4]; p.cotovelo = [-2.4, -2.4]; p.ombroZ = [0.3, 0.3]; }
      p.inclina = 0.4 + 0.03*Math.sin(w); p.gira = -0.35; p.tomba = 0.12;
      p.olhaX = 0.5; p.olhaY = -0.3;
      p.coxa = [-0.2, 0.3]; p.joelho = [0.55, 0.5];
      p.y = -2.6;
    }
    p.punho = [1, 1];
  }
  /* DEFENDER (E segurado / decisão da IA): antebraços na frente do
     rosto, queixo enterrado, meio de lado, pé de trás firme */
  function bloquear(p, f, t){
    const w = t*4 + f.fase;
    const v = variante(f, 'bloqueia', t, 2);
    p.punho = [1, 1];
    if(v===1){              // antebraços cruzados na frente
      p.ombro = [-1.6, -1.55]; p.cotovelo = [-2.5, -2.45]; p.ombroZ = [0.15, 0.12]; p.maoZ = [0.95, 0.9];
      p.inclina = 0.3 + 0.02*Math.sin(w); p.gira = -0.1; p.olhaX = 0.4;
      p.coxa = [-0.2, 0.3]; p.joelho = [0.5, 0.45]; p.y = -2.6;
    } else if(v===2){       // de ombro: meio virado, o braço da frente cobre o rosto, o outro o fígado
      p.ombro = [-2.0, -0.9]; p.cotovelo = [-2.6, -2.3]; p.ombroZ = [0.5, 0.25]; p.maoZ = [0.5, 0.6];
      p.inclina = 0.28; p.gira = -0.6; p.tomba = 0.14; p.olhaX = 0.35; p.olhaY = -0.4;
      p.coxa = [-0.4, 0.4]; p.joelho = [0.55, 0.5]; p.y = -2.8;
    } else {
      p.ombro = [-1.75, -1.7]; p.cotovelo = [-2.6, -2.55]; p.ombroZ = [0.42, 0.38]; p.maoZ = [0.4, 0.4];
      p.inclina = 0.32 + 0.02*Math.sin(w); p.gira = -0.28; p.tomba = 0.08;
      p.olhaX = 0.42; p.olhaY = -0.15;
      p.coxa = [-0.25, 0.35]; p.joelho = [0.5, 0.45];
      p.y = -2.4;
    }
  }
  /* ESQUIVOU: o golpe passou — o corpo vai pra trás e pro lado, o
     queixo foge, e volta em 0,4 s */
  function esquivar(p, f, d){
    const k = 1 - d.esquivou/0.4;
    if(k < 0.08 || f.esquiva==null) f.esquiva = f.varianteForcada!=null ? f.varianteForcada : Math.floor(Math.random()*3);
    const r = Math.sin(Math.min(1, k*1.5)*Math.PI);
    const lado = Math.sin(f.fase*2) > 0 ? 1 : -1;
    if(f.esquiva===1){        // escorrega pro lado
      p.tomba += lado*0.42*r; p.gira += lado*0.45*r; p.inclina += 0.1*r;
      p.olhaY += lado*0.5*r; p.coxa[lado>0?0:1] += 0.35*r; p.joelho[0] += 0.3*r; p.joelho[1] += 0.3*r; p.y -= 1.6*r;
    } else if(f.esquiva===2){ // abaixa
      p.inclina += 0.5*r; p.olhaX += 0.25*r; p.gira += lado*0.15*r;
      p.joelho[0] += 0.75*r; p.joelho[1] += 0.7*r; p.coxa[0] -= 0.4*r; p.coxa[1] -= 0.35*r; p.y -= 4.5*r;
    } else {                  // vai pra trás, o queixo foge
      p.inclina -= 0.45*r; p.tomba += lado*0.28*r; p.gira += lado*0.2*r;
      p.olhaX -= 0.3*r; p.olhaY += lado*0.35*r;
      p.coxa[0] += 0.3*r; p.joelho[0] += 0.25*r; p.joelho[1] += 0.2*r;
      p.y -= 1.2*r;
    }
  }
  /* PROVOCAR (pedido do dono, 05/09/2026): inimigo perto mas fora do
     alcance, sem golpe no ar — de vez em quando, em vez de ficar só
     em guarda, cutuca: "vem" com as duas mãos, bate no peito, aponta
     e ri, mão na orelha ("não ouvi"), aplauso de deboche, ou joga os
     braços pra cima. Cada um tem o seu favorito. */
  /* PROVOCAR (pedido do dono, 05 e 06/09/2026): inimigo perto mas
     fora do alcance, sem golpe no ar — de vez em quando cutuca. O
     gesto principal é CHAMAR PRA VIR: braço estendido, mão aberta com
     a palma pra cima, o punho dobrando e os dedos recolhendo, "vem".
     Três jeitos (0–2): uma mão na altura do peito com a outra na
     cintura; as duas mãos baixas, o corpo indo pra frente; a mão alta
     do lado da cabeça, com a cabeça tombada. Os outros (3–7) saem
     menos: bate no peito, aponta e ri, mão na orelha, aplauso de
     deboche, braços pra cima. */
  function provocar(p, f, t, dt){
    const pv = f.provoca;
    const k = pv.t/pv.dur, w = t*7 + f.fase;
    const sobe = suave(k/0.2), desce = suave((k-0.8)/0.2), r = sobe*(1-desce);
    parado(p, f, t);
    /* o "vem": punho dobra pra dentro e volta, três vezes por segundo */
    const chama = 0.5 + 0.5*Math.sin(t*(17 + f.estilo.gingado*3) + f.fase);
    switch(pv.tipo){
      case 0:   // uma mão, na altura do peito; a outra na cintura
        p.ombro[1] = -1.5*r; p.ombroZ[1] = 0.1; p.cotovelo[1] = mistura(-0.2, -0.6, chama)*r; p.maoZ[1] = 0.1*r;
        p.pulso[1] = mistura(-0.6, 0.85, chama)*r; p.punho[1] = 0;
        p.ombro[0] = MAO_NA_CINTURA.ombro*r; p.ombroZ[0] = MAO_NA_CINTURA.ombroZ*r; p.cotovelo[0] = MAO_NA_CINTURA.cotovelo*r; p.maoZ[0] = MAO_NA_CINTURA.maoZ*r; p.punho[0] = 0;
        p.inclina = 0.18*r; p.olhaX = -0.1*r; p.tomba = -0.08*r; p.gira = 0.15*r; break;
      case 1:   // as duas mãos baixas, corpo pra frente, queixo pra cima
        p.ombro = [-0.95*r, -0.95*r]; p.ombroZ = [0.4*r, 0.4*r]; p.cotovelo = [mistura(-0.15, -0.55, chama)*r, mistura(-0.15, -0.55, 1-chama)*r];
        p.pulso = [mistura(-0.6, 0.85, chama)*r, mistura(-0.6, 0.85, 1-chama)*r]; p.punho = [0, 0]; p.maoZ = [0.05, 0.05];
        p.inclina = 0.3*r; p.olhaX = -0.25*r; p.coxa = [-0.25*r, 0.2*r]; p.joelho = [0.35*r, 0.3*r]; p.y = -1.2*r; break;
      case 2:   // a mão alta do lado da cabeça, cabeça tombada
        p.ombro[1] = -2.1*r; p.ombroZ[1] = 0.5*r; p.cotovelo[1] = mistura(-0.7, -1.15, chama)*r; p.maoZ[1] = 0.3*r;
        p.pulso[1] = mistura(-0.5, 0.7, chama)*r; p.punho[1] = 0;
        p.tomba = 0.14*r; p.olhaY = 0.2*r; p.olhaX = -0.12*r; p.inclina = 0.05*r; p.gira = -0.12*r; break;
      case 3:   // bate no peito
        p.ombro[1] = -1.3*r; p.cotovelo[1] = -2.5*r; p.ombroZ[1] = 0.3; p.maoZ[1] = 0.9*r;
        p.inclina = (-0.15 + 0.06*Math.sin(w*1.3))*r; p.olhaX = -0.25*r; p.punho[1] = 1;
        p.y = -0.3*Math.abs(Math.sin(w*1.3))*r; break;
      case 4:   // aponta e ri
        p.ombro[1] = -1.55*r; p.cotovelo[1] = -0.1; p.ombroZ[1] = 0.1; p.punho[1] = 0;
        p.inclina = 0.15*r; p.gira = -0.2*r; p.olhaX = 0.1*r; p.tomba = 0.08*Math.sin(w)*r;
        p.peito = 1 + 0.04*Math.abs(Math.sin(w))*r; break;
      case 5:   // mão na orelha: "não ouvi"
        p.ombro[0] = -2.3*r; p.cotovelo[0] = -2.55*r; p.ombroZ[0] = 0.8*r; p.maoZ[0] = 0.6*r;
        p.olhaY = 0.5*r; p.olhaX = -0.1*r; p.inclina = 0.1*r; p.gira = 0.25*r; break;
      case 6:   // aplauso de deboche, lento
        p.ombro = [-1.2*r, -1.2*r]; p.cotovelo = [-2.0*r, -2.0*r];
        p.ombroZ = [(0.35 + 0.25*Math.max(0,Math.sin(w*0.6)))*r, (0.35 + 0.25*Math.max(0,Math.sin(w*0.6)))*r];
        p.punho = [0, 0]; p.olhaX = -0.12*r; p.inclina = -0.08*r; break;
      default:  // braços pra cima, "e aí?"
        p.ombro = [-2.4*r, -2.4*r]; p.ombroZ = [1.0*r, 1.0*r]; p.cotovelo = [-0.7*r, -0.7*r];
        p.inclina = -0.12*r; p.olhaX = -0.2*r; p.gira = 0.1*Math.sin(w*0.8)*r;
    }
  }

  /* O IMPACTO: avisado por quem bateu (`lutar`), ou pela pedra/bomba
     (`tremor` alto). Vai por cima da pose que estiver valendo: a cabeça
     vai pro lado de onde veio, o tronco atrás, um passo pra trás; forte
     e com pouca vida, cambaleia. */
  function flinch(p, f, d, dt){
    const im = f.impacto; if(!im) return;
    im.t += dt;
    if(im.t >= im.dur){ f.impacto = null; return; }
    const k = im.t/im.dur;
    const r = Math.sin(Math.min(1, k*1.6)*Math.PI/2) * (1 - suave((k-0.4)/0.6));   // sobe rápido, desce devagar
    const F = im.forca * f.estilo.duro, L = im.lado;
    p.olhaX -= 0.55*F*r; p.olhaY += L*0.45*F*r;
    p.inclina -= 0.28*F*r; p.tomba += L*0.14*F*r; p.gira += L*0.18*F*r;
    p.y -= 0.6*F*r;
    p.ombro[0] += 0.5*F*r; p.ombro[1] += 0.4*F*r; p.ombroZ[0] += 0.35*F*r; p.ombroZ[1] += 0.3*F*r;
    const fraco = d.hpMax ? d.hp/d.hpMax < 0.35 : false;
    if(F >= 1 || fraco){ p.coxa[0] += 0.45*r; p.joelho[0] += 0.3*r; p.joelho[1] += 0.25*r; p.inclina -= 0.15*r; }
  }

  function cambalear(p, f, t){
    const w = t*(2.6 + f.estilo.gingado*0.8) + f.fase;
    const g = 0.7 + f.estilo.duro*0.5;
    const v = variante(f, 'camb', t, 2);
    p.tomba = 0.25*g*Math.sin(w); p.inclina = 0.12 + 0.12*g*Math.sin(w*0.7);
    p.gira = 0.2*Math.sin(w*0.5);
    p.olhaX = -0.15 + 0.2*Math.sin(w*1.3); p.olhaY = 0.45*Math.sin(w*0.9);
    p.coxa = [0.15*Math.sin(w), -0.15*Math.sin(w)]; p.joelho = [0.5, 0.45];
    if(v===1){          // a mão na cabeça, o outro braço procurando apoio
      p.ombro = [0.4, -2.5]; p.ombroZ = [0.7, 0.6]; p.cotovelo = [-0.4, -2.4]; p.maoZ = [0, 0.5];
      p.inclina -= 0.1; p.olhaX -= 0.2;
    } else if(v===2){   // dobrado, as mãos nos joelhos
      p.ombro = [-0.9, -0.9]; p.ombroZ = [0.35, 0.35]; p.cotovelo = [-0.2, -0.2]; p.punho = [0, 0];
      p.inclina = 0.75 + 0.06*Math.sin(w); p.olhaX = -0.3; p.joelho = [0.6, 0.55]; p.coxa = [-0.35, -0.3];
    } else {
      p.ombro = [0.3, 0.2]; p.ombroZ = [0.55, 0.5]; p.cotovelo = [-0.6, -0.5];
    }
    p.y = -2.2 - (v===2 ? 1.2 : 0);
  }
  /* arremesso: arma atrás, peso na perna de trás; solta com o corpo todo */
  /* arremesso: por cima (arma atrás, solta com o corpo todo), de lado
     (o braço varre na horizontal) ou por baixo (a pedra sai da altura
     do quadril) — o jeito se escolhe quando o braço arma */
  function arremessar(p, f, arr){
    const k = 1 - arr.t/0.55;                 // 0 no início, 1 no fim
    if(f.arrRef !== arr){ f.arrRef = arr; f.arrVar = f.varianteForcada!=null ? f.varianteForcada : Math.floor(Math.random()*3); }
    const arma = suave(k/0.45), solta = suave((k-0.45)/0.4);
    const b = 1, v = f.arrVar||0;
    if(v===1){
      p.ombro[b] = mistura(mistura(-0.6, 0.9, arma), -1.5, solta);
      p.ombroZ[b] = mistura(mistura(0.3, 1.5, arma), 1.2, solta);
      p.cotovelo[b] = mistura(mistura(-0.4, -1.3, arma), -0.1, solta);
      p.gira = mistura(mistura(0, 1.0, arma), -0.8, solta); p.tomba = mistura(0, -0.12, solta);
      p.inclina = mistura(0.05, 0.25, solta);
    } else if(v===2){
      p.ombro[b] = mistura(mistura(0.2, 1.4, arma), -1.1, solta);
      p.ombroZ[b] = mistura(0.25, 0.4, solta);
      p.cotovelo[b] = mistura(mistura(-0.2, -0.5, arma), -0.05, solta);
      p.gira = mistura(mistura(0, 0.45, arma), -0.35, solta);
      p.inclina = mistura(mistura(0.1, 0.35, arma), 0.15, solta); p.y = -1.6;
      p.joelho = [0.6, 0.5];
    } else {
      p.ombro[b] = mistura(mistura(-0.2, 2.6, arma), -1.7, solta);
      p.cotovelo[b] = mistura(mistura(-0.3, -1.8, arma), -0.15, solta);
      p.ombroZ[b] = mistura(mistura(0.1, 0.9, arma), 0.2, solta);
      p.gira = mistura(mistura(0, 0.75, arma), -0.55, solta);
      p.inclina = mistura(mistura(0.05, -0.2, arma), 0.42, solta);
    }
    p.ombro[0] = mistura(-0.9, -0.2, solta); p.ombroZ[0] = 0.5; p.cotovelo[0] = -0.5;
    p.coxa = [mistura(0.15, -0.5, solta), mistura(-0.3, 0.35, solta)];
    if(v!==2) p.joelho = [0.45, 0.3];
    p.pe = [0, mistura(0, 0.5, solta)];
    if(v!==2) p.y = -1 - solta*0.8;
    p.olhaX = mistura(-0.2, 0.15, solta);
    p.punho[b] = 1;
  }
  /* fugir: corre e olha pra trás de vez em quando */
  function fugir(p, f, t, dt){
    f.olhaTras -= dt;
    if(f.olhaTras <= -1.5/f.estilo.olhaTras) f.olhaTras = (0.7 + Math.random()*1.2)/f.estilo.olhaTras;
    if(f.olhaTras > 0){ p.olhaY = 1.3*(Math.sin(f.fase)>0?1:-1); p.gira += 0.3*(Math.sin(f.fase)>0?1:-1); }
    p.inclina += 0.12;
    const v = variante(f, 'foge', t, 4);
    if(v===1){ p.ombro[0] -= 0.5; p.ombro[1] -= 0.5; p.cotovelo = [-1.9, -1.9]; p.inclina += 0.08; }          // braço bombando alto
    else if(v===2){ p.ombro[1] = -2.6; p.cotovelo[1] = -2.3; p.ombroZ[1] = 0.55; p.olhaX += 0.3; p.inclina += 0.1; }   // a mão na nuca
  }
  /* correr da bomba: corre com o braço cobrindo a cabeça */
  function cobrir(p){
    p.ombro[1] = -2.7; p.cotovelo[1] = -2.4; p.ombroZ[1] = 0.6;
    p.olhaX = 0.35; p.inclina += 0.15;
  }
  /* cair: gira até o chão, quica, fica */
  /* cair de vez: de frente, de costas ou de lado — gira até o chão,
     quica, fica. Quem já estava DERRUBADO e apanhou não cai de novo:
     fica deitado como estava (`f.jazido`). */
  function cair(p, f, dt){
    if(!f.queda) f.queda = {t: f.jazido ? 1 : 0, var: f.jazido ? f.jazido : (f.varianteForcada!=null ? f.varianteForcada : dado(f.sem+'qv', 3)),
                            lado: f.jazido ? (f.jazidoLado||1) : (frac(f.sem+'ql') < 0.5 ? 1 : -1)};
    f.queda.t += dt;
    const k = Math.min(1, f.queda.t/0.55);
    const q = suave(k);
    const v = f.queda.var;
    const quique = k<1 ? 0 : Math.abs(Math.sin(Math.min(1,(f.queda.t-0.55)/0.35)*Math.PI))*0.8;
    if(v===2){               // de lado: pernas encolhidas, o braço de baixo esticado
      p.rolo = (f.queda.lado||1)*(Math.PI/2)*q; p.rotRaiz = 0.15*q;
      p.y = -16.5*q + 3.2 + quique;
      p.coxa = [-0.9*q, -0.5*q]; p.joelho = [1.2*q, 0.8*q];
      p.ombro = [-1.7*q, -0.5*q]; p.ombroZ = [0.3*q, 0.9*q]; p.cotovelo = [-0.4*q, -1.5*q];
      p.olhaX = 0.3*q; p.olhaY = -0.4*q; p.inclina = 0.35*q;
    } else {
      const frente = v===0;
      p.rotRaiz = (frente ? 1 : -1) * (Math.PI/2) * q;
      p.y = -16.5*q + 3.2 + quique;
      p.coxa = frente ? [0.08*q, -0.18*q] : [0.55*q, -0.25*q]; p.joelho = frente ? [0.3*q, 0.15*q] : [0.6*q, 0.35*q];
      p.ombro = frente ? [-2.2*q, -1.6*q] : [1.1*q, 0.7*q];
      p.ombroZ = [0.9*q, 0.6*q]; p.cotovelo = frente ? [-1.4*q, -0.6*q] : [-0.5*q, -0.9*q];
      p.olhaX = frente ? -0.6*q : 0.4*q; p.olhaY = 0.7*q;
      p.tomba = 0.15*q; p.gira = 0.2*q;
    }
    /* um tremor de vez em quando, deitado */
    if(k>=1 && Math.sin(f.queda.t*2.1+f.fase) > 0.93){ p.joelho[0] += 0.2; p.ombro[0] += 0.1; }
  }
  /* DERRUBADO pelo chute (pedido do dono, 06/09/2026): vai ao chão de
     costas ou de lado, fica uns instantes (a mão na cabeça, as pernas
     encolhendo), e levanta — rola pro lado, apoia a mão, sobe pelo
     joelho. `d.derrubado` é o que falta; `d.derrubadoDur` o total. */
  function derrubado(p, f, d, dt){
    const dur = d.derrubadoDur || 2, k = d.noChao ? 0.45 : 1 - Math.max(0, d.derrubado)/dur;
    if(f.derrubadoRef !== d.derrubadoDur || k < 0.02){
      f.derrubadoRef = d.derrubadoDur;
      f.quedaVar = f.varianteForcada!=null ? f.varianteForcada : Math.floor(Math.random()*3);
    }
    const v = f.quedaVar||0;                       // 0 de costas, 1 de lado esq., 2 de lado dir.
    const cai = suave(k/0.16), levanta = suave((k-0.62)/0.38);
    const deitado = cai*(1-levanta);
    const lado = v===0 ? 0 : (v===1 ? 1 : -1);
    const w = k*dur*3.5 + f.fase;
    /* a queda e o levantar: deitado (rotRaiz −90° ou rolo ±90°) → de
       joelho (rotRaiz 0, y −7) → de pé */
    const meio = suave((k-0.62)/0.22), fim = suave((k-0.84)/0.16);
    p.rotRaiz = (v===0 ? -Math.PI/2 : -0.2)*cai*(1-meio);
    p.rolo = lado*(Math.PI/2)*cai*(1-meio);
    p.y = mistura(mistura(-16.5*cai + 2.2*Math.max(0, 1-k*8), -8.5, meio), 0, fim);
    p.olhaX = mistura(0.3, 0.45, meio)*(1-fim) + (v===0 ? 0.25*deitado : 0);
    p.olhaY = lado*0.3*deitado + 0.4*Math.sin(w)*deitado*(v===0?1:0.3);
    /* deitado: a mão na cabeça, os joelhos subindo aos poucos */
    const enc = deitado*(0.3 + 0.5*suave((k-0.2)/0.3));
    p.coxa = [mistura(-1.1*enc, -1.35, meio)*(1-fim), mistura(-0.7*enc, -0.5, meio)*(1-fim)];
    p.joelho = [mistura(1.3*enc, 1.6, meio)*(1-fim) + 0.15*(1-fim), mistura(0.9*enc, 1.4, meio)*(1-fim) + 0.1*(1-fim)];
    p.pe = [0.3*(1-fim), 0.3*(1-fim)];
    p.ombro = [mistura(-2.3*deitado, 0.9, meio)*(1-fim), mistura((v===0 ? 0.6 : -0.9)*deitado, -1.1, meio)*(1-fim)];
    p.cotovelo = [mistura(-2.3*deitado, -0.25, meio)*(1-fim), mistura(-1.2*deitado, -1.4, meio)*(1-fim)];
    p.ombroZ = [mistura(0.6*deitado, 0.5, meio)*(1-fim), mistura(0.5*deitado, 0.3, meio)*(1-fim)];
    p.maoZ = [0.5*deitado, 0.2*deitado];
    p.inclina = mistura(0.2*deitado, 0.6, meio)*(1-fim) + 0.05;
    p.gira = lado*0.25*deitado + 0.3*meio*(1-fim);
    p.tomba = lado*0.1*deitado;
    /* um tranco na hora que bate no chão */
    if(k < 0.2){ const b = Math.sin(Math.min(1, (k-0.16)/0.04)*Math.PI); if(k>0.16) p.y += 1.2*b; }
  }
  /* preso: sentado, mãos atrás das costas, cabeça baixa */
  /* SEGURANDO alguém: os dois braços à frente na gola dele, o corpo
     travado pra trás e o peso nas pernas; puxa e empurra no compasso */
  function segurarPose(p, f, t){
    const w = t*4.5 + f.fase, puxa = 0.5 + 0.5*Math.sin(w);
    p.ombro = [-1.35 + 0.15*puxa, -1.3 + 0.15*puxa]; p.ombroZ = [0.35, 0.35]; p.cotovelo = [-0.55 - 0.35*puxa, -0.5 - 0.35*puxa];
    p.maoZ = [0.3, 0.3]; p.punho = [1, 1];
    p.inclina = 0.15 + 0.12*puxa; p.gira = 0.08*Math.sin(w*0.7); p.olhaX = 0.2;
    p.coxa = [-0.5, 0.4]; p.joelho = [0.55, 0.4]; p.y = -2.4;
  }
  /* SEGURADO: se debate — as mãos nos braços de quem segura, o tronco
     torcendo, um pé arrastando */
  function seguradoPose(p, f, t){
    const w = t*5.5 + f.fase, s = Math.sin(w);
    p.ombro = [-1.1 + 0.2*s, -1.05 - 0.2*s]; p.ombroZ = [0.55, 0.5]; p.cotovelo = [-1.2 - 0.3*s, -1.25 + 0.3*s];
    p.maoZ = [0.4, 0.4]; p.punho = [1, 1];
    p.inclina = -0.12 + 0.08*s; p.gira = 0.35*s; p.tomba = 0.12*Math.sin(w*0.6);
    p.olhaX = -0.2; p.olhaY = 0.3*s;
    p.coxa = [-0.2 + 0.25*s, 0.2 - 0.25*s]; p.joelho = [0.5, 0.45]; p.y = -2.0;
  }
  /* CHAMAR: o braço no alto girando pra frente ("vem todo mundo"),
     o corpo virado meio pra trás, gritando — 1,3 s */
  function chamarPose(p, f, t, k){
    const w = t*9 + f.fase, sobe = suave(k/0.15), desce = suave((k-0.8)/0.2), r = sobe*(1-desce);
    const roda = 0.5 + 0.5*Math.sin(w);
    p.ombro[1] = mistura(-2.2, -3.0, roda)*r; p.ombroZ[1] = 0.45*r; p.cotovelo[1] = mistura(-1.1, -0.3, roda)*r; p.punho[1] = 0;
    p.ombro[0] = -0.4*r; p.ombroZ[0] = 0.5*r; p.cotovelo[0] = -0.9*r; p.punho[0] = 1;
    p.gira = -0.45*r; p.inclina = -0.1*r; p.olhaY = -0.5*r; p.olhaX = -0.3*r; p.peito = 1 + 0.05*r;
    p.coxa = [-0.35*r, 0.3*r]; p.joelho = [0.35*r, 0.3*r]; p.y = -1.0*r;
  }
  /* SOCORRER: agachado em cima do companheiro caído, os dois braços
     pra baixo puxando, e o corpo fazendo força pra trás no compasso */
  function socorrerPose(p, f, t){
    const w = t*3.2 + f.fase, puxa = 0.5 + 0.5*Math.sin(w);
    p.coxa = [-0.9, -0.5]; p.joelho = [1.2, 0.8]; p.pe = [0.2, 0.1]; p.y = -5.5 + 1.2*puxa;
    p.inclina = 0.7 - 0.25*puxa; p.olhaX = 0.15;
    p.ombro = [-1.15 + 0.3*puxa, -1.1 + 0.3*puxa]; p.ombroZ = [0.25, 0.25]; p.cotovelo = [-0.3 - 0.5*puxa, -0.3 - 0.5*puxa]; p.punho = [1, 1];
  }
  /* preso: sentado no chão mesmo, as nádegas encostadas (pedido do
     dono, 06/09/2026) — o quadril fica a 2 px do chão, o tronco cai
     pra frente. Mãos atrás das costas, cabeça baixa. Três jeitos: os
     joelhos pra cima e a testa quase neles; as pernas esticadas; uma
     perna dobrada e a outra esticada. */
  function sentar(p, f, t){
    const v = f.varianteForcada!=null ? f.varianteForcada : dado(f.sem+'sv', 3);
    p.y = -14.3;
    if(v===1){ p.coxa = [-1.5, -1.45]; p.joelho = [0.2, 0.25]; p.pe = [0.55, 0.5]; p.inclina = 0.34; }
    else if(v===2){ p.coxa = [-1.5, -1.25]; p.joelho = [0.2, 1.75]; p.pe = [0.55, 0.3]; p.inclina = 0.4; p.gira = 0.12; p.tomba = 0.06; }
    else { p.coxa = [-1.4, -1.3]; p.joelho = [1.85, 1.9]; p.pe = [0.35, 0.35]; p.inclina = 0.55; }
    p.ombro = [0.75, 0.75]; p.ombroZ = [0.35, 0.35]; p.cotovelo = [-1.6, -1.6]; p.maoZ = [0.6, 0.6];
    p.olhaX = 0.45 + 0.05*Math.sin(t*1.5+f.fase);
  }

  /* SENTADO NA CADEIRA (a reunião da diretoria, do jogo de feed,
     22/09/2026): a diretoria na roda. Diferente do preso, que senta no
     chão: o quadril na altura do assento, as coxas na horizontal, as
     canelas caindo, o tronco ereto. Três jeitos pela figura: as mãos nas
     coxas; os braços cruzados; inclinado com os cotovelos nos joelhos.
     Respira, e vira a cabeça pra quem fala. */
  const ASSENTO = 8.9;                 // canela + pé: a altura do quadril sentado
  function sentadoCadeira(p, f, t, d, J){
    const v = f.varianteForcada!=null ? f.varianteForcada : dado(f.sem+'sc', 3);
    const r = Math.sin(t*1.5 + f.fase);
    p.y = ASSENTO - 16.5;
    p.coxa = [-1.45, -1.42]; p.joelho = [1.5, 1.5]; p.pe = [0.05, 0.05];
    p.peito = 1 + 0.02*r;
    p.inclina = 0.06 + 0.01*r;
    p.tomba = 0.015*ruido(f, t, 0.5, 1.1);
    p.olhaY = 0.25*ruido(f, t, 0.25, 0.7);
    p.olhaX = 0.04*Math.sin(t*0.7 + f.fase);
    if(v===1){            // braços cruzados
      p.ombro = [0.95, 0.95]; p.ombroZ = [0.05, 0.05]; p.cotovelo = [-2.15, -2.15]; p.maoZ = [0.95, 0.95];
      p.inclina -= 0.04;
    } else if(v===2){     // pra frente, cotovelos nos joelhos
      p.inclina = 0.5 + 0.01*r; p.olhaX = -0.3;
      p.ombro = [1.05, 1.05]; p.ombroZ = [0.25, 0.25]; p.cotovelo = [-1.35, -1.35]; p.maoZ = [0.3, 0.3];
    } else {              // as mãos nas coxas
      p.ombro = [0.55, 0.55]; p.ombroZ = [0.15, 0.15]; p.cotovelo = [-0.75, -0.75]; p.maoZ = [0.2, 0.2];
    }
    if(d && J && J.falante && J.falante !== d) olharPara(p, f, d, J.falante, t);
  }

  /* OLHAR PRA QUEM FALA: a cabeça vira pro alvo, até uns 65° pra cada
     lado. Aqui o ângulo sai do MUNDO (o `pos` da cena), não do tabuleiro:
     num tabuleiro dobrado (o estádio) as duas réguas não batem. */
  const PESCOCO = 1.15;
  function olharPara(p, f, d, alvo, t){
    /* `pos` devolve sempre o mesmo objeto: guarda o primeiro antes de pedir o segundo */
    const qd = pos(d.x, d.y, d), x0 = qd.x, z0 = qd.z, qa = pos(alvo.x, alvo.y, alvo);
    let rel = Math.atan2(qa.x - x0, qa.z - z0) - f.yaw;
    while(rel > Math.PI) rel -= Math.PI*2;
    while(rel < -Math.PI) rel += Math.PI*2;
    p.olhaY = Math.max(-PESCOCO, Math.min(PESCOCO, rel)) + 0.03*ruido(f, t, 0.3, 0.9);
    p.olhaX = Math.min(p.olhaX, 0.05) + 0.02*Math.sin(t*0.9 + f.fase);
  }

  /* FALAR SENTADO: o diretor que traz a pauta. O tronco um pouco pra
     frente, a cabeça sobe, e as mãos explicam — ritmo de conversa, não
     de briga. */
  function falarSentado(p, f, t, d, J){
    sentadoCadeira(p, f, t, null, null);
    const w = t*2.6 + f.fase;
    const a = 0.5 + 0.5*Math.sin(w), b = 0.5 + 0.5*Math.sin(w*1.37 + 1.1);
    p.inclina = 0.16 + 0.03*Math.sin(w*0.5);
    p.olhaX = -0.12 + 0.05*Math.sin(w*0.8);
    p.olhaY = 0.12*Math.sin(w*0.33 + f.fase);
    p.gira = 0.06*Math.sin(w*0.45);
    p.ombro = [0.45 + 0.15*b, -0.55 - 0.45*a]; p.ombroZ = [0.25 + 0.2*b, 0.55 + 0.25*a];
    p.cotovelo = [-1.0 - 0.3*b, -1.65 + 0.55*a]; p.maoZ = [0.35, 0.3 + 0.4*a]; p.punho = [0.4, 0];
    /* e o presidente, se estiver na roda, é pra quem se fala (ou quem o
       disco diz: `olhaPara`) */
    if(d && J){ const pres = d.olhaPara || J.discos.find(x=>x.lider && x.vivo); if(pres && pres !== d) olharPara(p, f, d, pres, t); }
  }
  /* FALAR EM PÉ: o presidente com a palavra, de frente pra roda — o peso
     numa perna, uma mão na cintura, a outra abrindo pros diretores. */
  function falarEmPe(p, f, t){
    parado(p, f, t);
    const w = t*2.4 + f.fase;
    const a = 0.5 + 0.5*Math.sin(w), b = 0.5 + 0.5*Math.sin(w*0.61 + 2.0);
    p.inclina += 0.05; p.olhaX = -0.06 + 0.04*Math.sin(w*0.7); p.olhaY = 0.25*Math.sin(w*0.29 + f.fase);
    const C = MAO_NA_CINTURA;
    p.ombro = [C.ombro, -0.75 - 0.55*a]; p.ombroZ = [C.ombroZ, 0.45 + 0.3*b];
    p.cotovelo = [C.cotovelo, -1.35 + 0.5*a]; p.maoZ = [C.maoZ, 0.2 + 0.35*a]; p.punho = [0, 0];
  }

  /* QUEM CAIU FICA A 50% (pedido do dono, 06/09/2026): os materiais
     da figura viram cópias transparentes na primeira vez (o corpo de
     caixas compartilha um material por vértice entre todos; o GLB
     compartilha os que não são recoloridos) e a opacidade vai descendo
     com a queda. Opacidade 1 devolve o corpo sólido. */
  function esmaecer(c, opac){
    if(c.opac === opac) return;
    if(!c.matsProprios){
      c.matsProprios = [];
      const vistos = new Map();
      c.raiz.traverse(o=>{
        if(!o.isMesh || o === c.sombra || o === c.anel || o === c.anelFundo) return;
        let m = vistos.get(o.material);
        if(!m){ m = remendar(o.material.clone()); m._propria = true; vistos.set(o.material, m); c.matsProprios.push(m); }
        o.material = m;
      });
    }
    for(const m of c.matsProprios){ m.transparent = opac < 1; m.opacity = opac; }
    c.opac = opac;
  }

  /* =======================================================
     A VELOCIDADE MEDIDA (o líder anda sem escrever vx)
     ======================================================= */
  function medirVelocidade(f, x, z, dt){
    if(f.px!==null && dt>0){
      const vx=(x-f.px)/dt, vz=(z-f.pz)/dt;
      const k=Math.min(1, dt*14);
      f.vx += (vx-f.vx)*k; f.vz += (vz-f.vz)*k;
      if(Math.hypot(vx,vz) > 400){ f.vx=0; f.vz=0; }
    }
    f.px=x; f.pz=z;
    return Math.hypot(f.vx, f.vz);
  }

  /* =======================================================
     UMA FIGURA POR QUADRO: do sinal do combate à pose
     ======================================================= */
  const figuras = new Map();     // disco/PM → {corpo, f}
  function figuraDe(d, i, pm){
    let fg = figuras.get(d);
    if(fg) return fg;
    const f = pm ? fichaPM(d, i) : fichaDe(d, i);
    const corpo = modeloGLB ? construirCorpoGLB(f, pm) : construirCorpo(f, pm);
    f.pose = poseNeutra();
    /* A SOMBRA DE DISCO E A SOMBRA DE LUZ NÃO CONVIVEM.
       Na cena de cima não havia sol nenhum, então cada figura carregava
       um disco preto no chão — mais barato e, de cima, suficiente. O
       estádio tem sol e mapa de sombra: ali o disco vira uma mancha
       chapada no meio da sombra de verdade, e a sombra de verdade ainda
       mostra o degrau e a escada. */
    if(sombraDeLuz){
      if(corpo.sombra) corpo.sombra.visible = false;
      corpo.raiz.traverse(o=>{ if(o.isMesh && o !== corpo.sombra) o.castShadow = true; });
    }
    scene.add(corpo.raiz);
    fg = {corpo, f, pm, mudou:true};
    /* MOVIMENTO LEVE (pedido do dono, 09/09/2026): o esqueleto só recalcula
       e sobe as matrizes dos ossos pra placa quando o boneco mudou de pose
       ou de lugar neste quadro. Quem está parado na retaguarda, quieto,
       não custa nada. */
    const skel = corpo.junto && corpo.junto.skeleton;
    if(skel && !skel._leve){
      skel._leve = true;
      const orig = THREE.Skeleton.prototype.update;
      skel.update = function(){ if(!cfg.movimentoLeve || fg.mudou !== false) orig.call(this); };
    }
    figuras.set(d, fg);
    return fg;
  }
  function fichaPM(pm, i){
    if(pm._b3) return pm._b3;
    const s = 'pm|'+i;
    pm._b3 = {sem:s, fase:frac(s+'f')*6.28, yaw:frac(s+'y')*6.28,
      pele:PELE[dado(s+'p',PELE.length)], calca:'#1b2620', cabelo:'#111', tenis:'#111',
      bermuda:false, listras:0, tipoCabeca:'bone', corBone:'#1c2a22', barba:frac(s+'bb')<0.3,
      camisa:'#233a2c', faixa:'#2d4a38', escala:1.06, largo:1.08, corBone:'#1c2a22', varianteForcada:null,
      estilo: estiloDe(s, false),
      ladoSoco:1, ataque:null, pausa:0.3, combo:0, impacto:null, olhaTras:0, tGesto:0, gesto:0,
      sobrancelha:0.3, cabecaX:1, queixo:1.1, barriga:1, oculos:0, barba:frac(s+'bb')<0.3?2:0,
      queda:null, caiDeFrente:frac(s+'q')<0.5, cobre:true, px:null, pz:null, vx:0, vz:0, ciclo:0, pose:null};
    return pm._b3;
  }

  function animarDisco(d, i, J, dt){
    const fg = figuraDe(d, i, false), f = fg.f, c = fg.corpo;
    const t = J.t;
    /* MOVIMENTO LEVE (pedido do dono, 09/09/2026): a gama de movimento
       da multidão encolhe. Quem não é o líder e não está no meio de
       nada — não caiu, não bate, não apanha, não corre — só tem a pose
       recalculada a cada três quadros (as vinte poses por segundo que
       o olho não separa das sessenta), sem balanço de repouso, sem
       provocação, sem torcida na retaguarda: para quieto. Nos quadros
       pulados só a posição do disco é copiada; se nem ela mudou, o
       esqueleto não sobe pra placa (ver figuraDe). O líder e quem está
       brigando continuam em sessenta, com tudo. */
    const leve = cfg.movimentoLeve && !d.lider;
    const agitado = !d.vivo || d.derrubado > 0 || !!d.ataque || d.golpe > 0 || d.apanhou > 0 ||
      d.atordoado > 0 || !!d.arremesso || !!d.segurando || !!d.seguradoPor || d.esquivou > 0 ||
      d.tremor >= 4.5 || !!f.impacto || !!f.queda || !!d.fugindo || !!d.fugaBomba || (d.chamou > t - 1.3) ||
      (J.falante === d) || (!!d.comemorando && !!f.provoca);
    fg.mudou = true;
    if(leve && !agitado && ((quadroN + i) % 3)){
      /* o tempo do quadro pulado fica guardado: no quadro que conta, o
         passo, a velocidade e a pose andam com ele (sem isso o ciclo do
         passo da multidão andava a um terço e o pé patinava) */
      f.dtLeve = (f.dtLeve || 0) + dt;
      const moveu = f.bx == null || Math.abs(d.x - f.bx) > 0.05 || Math.abs(d.y - f.bz) > 0.05 || (d.alt != null && Math.abs(d.alt - f.balt) > 0.05);
      if(moveu){ const q = pos(d.x, d.y, d); c.raiz.position.set(q.x, q.y, q.z); f.bx = d.x; f.bz = d.y; f.balt = d.alt; }
      else fg.mudou = false;
      c.raiz.visible = true;
      return;
    }
    if(f.dtLeve){ dt += f.dtLeve; f.dtLeve = 0; }
    /* o relógio do repouso: congelado pra multidão, vivo pro líder */
    const ti = leve ? f.fase * 10 : t;
    const p = poseNeutra();
    let rapidez = 10;                     // quão rápido a pose atual persegue a alvo

    if(!d.vivo){
      if(d.preso){ sentar(p, f, t); f.queda = null; rapidez = 6; esmaecer(c, 1); }
      else {
        cair(p, f, dt); rapidez = 14;
        /* O CAÍDO FICA QUASE TRANSPARENTE (régua do dono, 06/09/2026):
           70% de transparência, ou seja, 30% de opacidade — nos dois
           lados. Some do bolo sem sumir da conta. */
        const piso = 0.3;
        let opac = Math.max(piso, 1 - (1-piso)*suave((f.queda.t-0.4)/0.5));
        /* e depois de CAIDO_FICA s no chão, esvanece até sumir */
        const C = TO.diaJogo.combate, FICA = (C && C.CAIDO_FICA) || 3.0, SOME = (C && C.CAIDO_SOME) || 1.5;
        const noChaoHa = t - (d.caiuEm != null ? d.caiuEm : t);
        if(noChaoHa > FICA) opac = Math.min(opac, piso * Math.max(0, 1 - (noChaoHa - FICA)/SOME));
        esmaecer(c, +opac.toFixed(2));
      }
      f.impacto = null; f.ataque = null; f.provoca = null;
    } else if(d.derrubado > 0){
      derrubado(p, f, d, dt); rapidez = 18;
      f.impacto = null; f.ataque = null; f.provoca = null; f.queda = null;
      /* se apanhar aqui, cai de vez do jeito que está deitado */
      f.jazido = (f.quedaVar||0)===0 ? 1 : 2; f.jazidoLado = (f.quedaVar||0)===1 ? 1 : -1;
      esmaecer(c, 1);
    } else if(d.sentado){
      /* a roda da reunião: sentado na cadeira, olhando pro meio; com a
         palavra, gesticula; sem ela, escuta olhando pra quem fala */
      f.queda = null; f.jazido = 0; esmaecer(c, 1);
      const q0 = pos(d.x, d.y, d);
      f.px = q0.x; f.pz = q0.z; f.vx = 0; f.vz = 0;
      { const r = rumoDe(d); if(typeof r === 'number') f.yaw = girar(f.yaw, r, Math.min(1, dt*14)); }
      /* (`d.falando` e `d.olhaPara`: a conversa de dois, sem a roda — o
         recado na cadeira da frente e o presidente, no jogo 3D) */
      if(J.falante === d || d.falando){ falarSentado(p, f, t, d, J); rapidez = 9; }
      else {
        sentadoCadeira(p, f, ti, d, J); rapidez = 8;
        /* A SEDE COM VIDA (jogo 3D, 27/09/2026): sentado e fazendo alguma
           coisa — digita, bebe, mexe no celular, conversa —, as pernas da
           cadeira e as mãos do gesto */
        f.gestoForcado = d.gestoForcado; f.gestoParam = d.gestoParam;
        if(d.olhaPara) olharPara(p, f, d, d.olhaPara, t);
        else if(d.jeito && !J.falante) gestoDoJeito(p, f, tAnim, dt, d.jeito, false);
      }
      f.impacto = null; f.ataque = null; f.provoca = null;
    } else {
      f.queda = null; f.jazido = 0;
      esmaecer(c, 1);
      const q0 = pos(d.x, d.y, d);
      const vel = medirVelocidade(f, q0.x, q0.z, dt);
      const corre = !!(d.fugindo || d._cacando || d.fugaBomba);
      const emBriga = d.golpe > 0 || d.apanhou > 0 || d.hostil > 0;
      const rumo = rumoDe(d);
      if(typeof rumo === 'number') f.yaw = girar(f.yaw, rumo, Math.min(1, dt*14));
      else if(vel > 4) f.yaw = girar(f.yaw, Math.atan2(f.vx, f.vz), Math.min(1, dt*10));
      if(d.arremesso && d.arremesso.t > 0.4){
        const pr = J.projeteis.find(q=>!q.morto && q.t < 0.2 && Math.hypot(q.x-d.x, q.y-d.y) < 60);
        if(pr) f.yaw = girar(f.yaw, rumoDoTabuleiro(pr.vx, pr.vy), Math.min(1, dt*18));
      }

      /* pedra ou bomba: o combate sobe `tremor` de uma vez; vira um impacto */
      if(d.tremor >= 4.5 && !f.impacto && d.golpe <= 0)
        f.impacto = {t:0, dur:0.4, forca:1.1, lado: Math.sin(f.fase)>0?1:-1, tipo:'pedra'};

      const andando = passo(p, f, vel / (d.passada || 1), dt, corre, emBriga ? 20 : 6);
      /* o jeito do dia de jogo (a festa na sede, o bonde, a fila): no relógio de verdade, mesmo na multidão leve */
      const jeito = d.jeito;
      if(!andando) parado(p, f, jeito ? tAnim : ti);
      /* (`d.gestoForcado`: a vitrine e o teste pedindo um gesto certo; e o
         que o dia de jogo manda num gesto: o ritmo da torcida, o mastro) */
      f.gestoForcado = d.gestoForcado; f.gestoParam = d.gestoParam;
      if(jeito && !emBriga && !corre) gestoDoJeito(p, f, tAnim, dt, jeito, andando);
      if(corre && d.fugindo) fugir(p, f, t, dt);
      if(d.fugaBomba) cobrir(p);

      /* a provocação: inimigo a 24–90 px, sem golpe, sem defesa, parado */
      /* GANHOU, PROVOCA (pedido do dono, 06/10/2026): sem rival de pé, o
         lado que sobrou fica parado provocando — não precisa de inimigo
         perto, e provoca quase sem pausa, um gesto atrás do outro */
      const comemora = !!d.comemorando && !andando && !d.ataque && d.atordoado<=0;
      const podeProvocar = (!leve || comemora) && !andando && !d.ataque && d.defendendo<=0 && d.atordoado<=0 && !d.arremesso &&
        (comemora || (d.inimigoPerto > 24 && d.inimigoPerto < 90 && (d.hostil > 0 || d.linha==='frente')));
      if(f.provoca){
        f.provoca.t += dt;
        if(f.provoca.t >= f.provoca.dur || d.ataque || d.defendendo>0 || d.atordoado>0 || andando) f.provoca = null;
      } else if(podeProvocar){
        f.tProvoca = (f.tProvoca||0) - dt;
        if(f.tProvoca <= 0){
          f.tProvoca = comemora ? 0.15 + Math.random()*0.6 : 1.5 + Math.random()*3;
          if(comemora || Math.random() < f.estilo.provocador*0.6)
            f.provoca = {t:0, dur:1.4 + Math.random()*1.2,
              tipo: f.varianteForcada!=null ? f.varianteForcada
                  : Math.random() < 0.72 ? (Math.random()<0.5 ? f.estilo.provocaFav : Math.floor(Math.random()*3))
                  : 3 + Math.floor(Math.random()*5)};
        }
      }

      if(d.atordoado > 0){ cambalear(p, f, t); rapidez = 7; f.ataque = null; }
      else if(d.arremesso){ arremessar(p, f, d.arremesso); rapidez = 26; f.ataque = null; }
      else if(d.ataque){ lutar(p, f, d, dt, t); rapidez = 30; }
      else if(d.segurando){ segurarPose(p, f, t); rapidez = 14; f.ataque = null; f.provoca = null; }
      else if(d.seguradoPor){ seguradoPose(p, f, t); rapidez = 14; f.ataque = null; f.provoca = null; }
      else if(d.chamou > t - 1.3){ chamarPose(p, f, t, (t - d.chamou)/1.3); rapidez = 16; f.ataque = null; f.provoca = null; }
      /* a reunião: o presidente com a palavra explica; sem ela, escuta
         de frente pra quem fala (o corpo fica; a cabeça vira) */
      else if(J.reuniao && !andando && J.falante === d){ falarEmPe(p, f, t); rapidez = 9; f.ataque = null; f.provoca = null; }
      else if(J.reuniao && !andando && J.falante){ olharPara(p, f, d, J.falante, t); rapidez = 8; f.ataque = null; f.provoca = null; }
      else if(d.defendendo > 0 && !andando){ bloquear(p, f, ti); rapidez = 20; f.ataque = null; }
      else if(d.socorrendo && d.socorrendo.noChao && !andando){ socorrerPose(p, f, t); rapidez = 12; f.ataque = null; f.provoca = null; }
      else if(d.tirando && !andando){ socorrerPose(p, f, t); rapidez = 12; f.ataque = null; f.provoca = null; }
      else if(f.provoca){ provocar(p, f, t, dt); rapidez = 10; f.ataque = null; }
      else if(d.apanhou > 0 && !andando){ cobrirSe(p, f, t); rapidez = 16; f.ataque = null; }
      else if(d.hostil > 0 && !andando && !corre){ guarda(p, f, ti); rapidez = 12; f.ataque = null; }
      else if(!andando && d.linha==='retaguarda' && !J.paz && !leve){ torcer(p, f, t, dt); rapidez = 9; f.ataque = null; }
      else { f.ataque = null; rapidez = andando ? 14 : jeito ? 8 : 5; }
      if(d.esquivou > 0) esquivar(p, f, d);
      else flinch(p, f, d, dt);
    }

    misturarPose(f.pose, p, Math.min(1, dt*rapidez));
    /* sem deslocamento aleatório: o disco fica onde o combate o pôs.
       A pancada aparece no corpo (`flinch`), não no chão. */
    const qd = pos(d.x, d.y, d);
    c.raiz.position.set(qd.x, qd.y, qd.z);
    f.bx = d.x; f.bz = d.y; f.balt = d.alt;
    c.raiz.rotation.y = f.yaw;
    aplicarPose(c, f.pose, f.escala*escalaDeCima*0.86);
    if(c.anel){
      const cor = anelDe(J, d);
      const hex = cor === 'lado' ? corLado(d.lado, false) : cor;
      /* anel só em quem está de pé: caído e preso não têm anel, e isso
         também diz quem está de pé no bolo */
      c.anel.visible = c.anelFundo.visible = !!hex && !!d.vivo;
      if(hex && c.anelCor !== hex){ c.anel.material.color.set(hex); c.anelCor = hex; }
      /* o anel não gira com o corpo: fica deitado no chão, alinhado à tela */
      c.anel.rotation.z = c.anelFundo.rotation.z = -f.yaw;
    }
    const chao = !d.vivo || d.derrubado > 0;
    c.sombra.scale.set(8.5*(chao?1.6:1), 6.5*(chao?1.3:1), 1);
    c.raiz.visible = true;
  }

  function animarPM(pm, i, J, dt){
    const fg = figuraDe(pm, i, true), f = fg.f, c = fg.corpo;
    const p = poseNeutra();
    let rapidez = 10;
    if(!pm.vivo){ cair(p, f, dt); rapidez = 14; esmaecer(c, +Math.max(0.5, 1 - 0.5*suave((f.queda.t-0.4)/0.5)).toFixed(2)); }
    else {
      f.queda = null; esmaecer(c, 1);
      const qp = pos(pm.x, pm.y, pm);
      const vel = medirVelocidade(f, qp.x, qp.z, dt);
      if(vel > 4) f.yaw = girar(f.yaw, Math.atan2(f.vx, f.vz), Math.min(1, dt*8));
      /* parado, vira pra onde o disco manda (o PM do cordão do dia de jogo, de frente pra torcida) */
      else if(typeof pm.rumo === 'number') f.yaw = girar(f.yaw, pm.mundo ? pm.rumo : rumoDoTabuleiro(Math.sin(pm.rumo), Math.cos(pm.rumo)), Math.min(1, dt*6));
      const andando = passo(p, f, vel / (pm.passada || 1), dt, false, 6);
      /* (o relógio de verdade: o do dia de jogo corre acelerado, e o PM parado respirava a 30×) */
      if(!andando) parado(p, f, tAnim);
      /* cassetete na mão: braço direito meio dobrado */
      p.ombro[1] = Math.min(p.ombro[1], -0.5); p.cotovelo[1] = -1.6;
      if(pm.carga){ p.escudo = true; p.ombro[0] = -1.2; p.cotovelo[0] = -1.4; p.ombroZ[0] = 0.1; p.inclina += 0.14; }
      /* o escudo em pé, na frente do corpo (o cordão de isolamento) */
      else if(pm.escudo){ p.escudo = true; p.ombro[0] = -0.9; p.cotovelo[0] = -1.2; p.ombroZ[0] = 0.12; }
      if(pm.golpe > 0){
        const k = 1 - pm.golpe/0.3, desce = suave(k/0.6);
        p.ombro[1] = mistura(-2.8, -0.9, desce); p.cotovelo[1] = mistura(-0.9, -0.3, desce); p.ombroZ[1] = 0.25;
        p.inclina = mistura(-0.1, 0.32, desce); p.gira = mistura(0.35, -0.2, desce);
        p.coxa = [0.3, -0.3]; p.joelho = [0.3, 0.35]; p.y = -1; rapidez = 28;
      } else if(pm.cooldown > 1.2 && !pm.carga){ p.ombro[1] = -0.7; p.cotovelo[1] = -1.9; }
    }
    misturarPose(f.pose, p, Math.min(1, dt*rapidez));
    const qm = pos(pm.x, pm.y, pm);
    c.raiz.position.set(qm.x, qm.y, qm.z); c.raiz.rotation.y = f.yaw;
    aplicarPose(c, f.pose, f.escala*escalaDeCima*0.86);
    c.raiz.visible = true;
  }

  /* =======================================================
     PEDRA, BOMBA, EXPLOSÃO, FUMAÇA
     ======================================================= */
  const projMeshes = new Map();   // projétil → {grupo, ...}
  const particulas = [];
  function soltar(x, y, z, o){
    const g = G();
    const m = new THREE.Mesh(o.plano ? g.disco : g.esfera,
      new THREE.MeshBasicMaterial({color:new THREE.Color(o.cor||'#888'), transparent:true, opacity:o.alfa||0.8, depthWrite:false}));
    if(o.plano){ m.rotation.x = -Math.PI/2; }
    m.position.set(x, y, z); scene.add(m);
    particulas.push({m, vx:o.vx||0, vy:o.vy||0, vz:o.vz||0, vida:o.dur, dur:o.dur, tam:o.tam||2, cresce:o.cresce||0, grav:o.grav||0, alfa:o.alfa||0.8});
  }
  function fumo(x, y, z, forte){
    soltar(x, y, z, {vy:9+Math.random()*6, vx:(Math.random()-0.5)*8, vz:(Math.random()-0.5)*8, dur:0.5+Math.random()*0.4*(forte?2:1),
      tam:forte?4:2.2, cresce:forte?14:8, cor:forte?'#6a6a6a':'#8a8a8a', alfa:0.55});
  }
  /* (x, z) no mundo e `y0`, o chão ali: quem desenha a cena num canto
     da cidade (o jogo 3D) leva o tabuleiro pro lugar dele com o `pos` */
  function explodir(x, z, y0 = 0){
    /* clarão, anel no chão, estilhaços e fumaça */
    soltar(x, y0+6, z, {dur:0.22, tam:14, cresce:70, cor:'#ffd35a', alfa:0.9});
    soltar(x, y0+4, z, {dur:0.35, tam:8, cresce:40, cor:'#ff7a2a', alfa:0.7});
    for(let i=0;i<14;i++){
      const a = Math.random()*6.28, v = 60+Math.random()*120;
      soltar(x, y0+5, z, {vx:Math.cos(a)*v, vz:Math.sin(a)*v, vy:40+Math.random()*80, grav:220, dur:0.5+Math.random()*0.4, tam:1.2, cor:'#3a2a1a', alfa:0.9});
    }
    for(let i=0;i<10;i++) fumo(x+(Math.random()-0.5)*20, y0+6, z+(Math.random()-0.5)*20, true);
  }
  function poeira(x, z, y0 = 0){
    for(let i=0;i<5;i++) soltar(x+(Math.random()-0.5)*8, y0+1.5, z+(Math.random()-0.5)*8, {vy:6, dur:0.4, tam:1.8, cresce:6, cor:'#b9a98c', alfa:0.6});
  }
  function atualizarParticulas(dt){
    for(let i=particulas.length-1;i>=0;i--){
      const q = particulas[i];
      q.vida -= dt;
      if(q.vida <= 0){ scene.remove(q.m); q.m.material.dispose(); particulas.splice(i,1); continue; }
      q.vy -= q.grav*dt;
      q.m.position.x += q.vx*dt; q.m.position.y += q.vy*dt; q.m.position.z += q.vz*dt;
      if(q.m.position.y < 0.5 && q.grav){ q.m.position.y = 0.5; q.vy = -q.vy*0.3; q.vx *= 0.6; q.vz *= 0.6; }
      const k = q.vida/q.dur;
      const tam = q.tam + q.cresce*(1-k);
      q.m.scale.setScalar(tam);
      q.m.material.opacity = q.alfa*k;
    }
  }
  function projeteis(J){
    const g = G();
    const agora = new Set();
    const raioBomba = (TO.diaJogo.combate && TO.diaJogo.combate.RAIO_BOMBA) || 92;
    for(const p of J.projeteis){
      agora.add(p);
      let v = projMeshes.get(p);
      if(!v){
        const grupo = new THREE.Group();
        let corpo;
        if(p.tipo==='pedra'){ corpo = new THREE.Mesh(g.pedra, mat('#8d8880')); corpo.scale.setScalar(3.4); }
        else {
          corpo = new THREE.Mesh(g.esfera, mat('#3a2a26')); corpo.scale.setScalar(4.6);
          const pavio = new THREE.Mesh(g.cil, mat('#d8c8a0')); pavio.scale.set(0.6, 3.5, 0.6); pavio.position.set(1.5, 5.2, 0); pavio.rotation.z = -0.5; grupo.add(pavio);
          const faisca = new THREE.Mesh(g.esfera, new THREE.MeshBasicMaterial({color:'#ffd35a'})); faisca.scale.setScalar(1.4); faisca.position.set(2.4, 6.6, 0); grupo.add(faisca);
          const rotulo = new THREE.Mesh(g.caixa, mat('#c8562f')); rotulo.scale.set(9.4, 2.2, 1.2); rotulo.position.set(0, 0, 4.2); grupo.add(rotulo);
          v = {faisca};
          const zona = new THREE.Mesh(g.anel, new THREE.MeshBasicMaterial({color:'#e25028', transparent:true, opacity:0.4, depthWrite:false, side:THREE.DoubleSide}));
          zona.rotation.x = -Math.PI/2; zona.scale.setScalar(raioBomba); zona.visible = false; scene.add(zona);
          v.zona = zona;
        }
        grupo.add(corpo);
        const sombra = new THREE.Mesh(g.disco, mat(PRETO, {transparent:true, opacity:0.28, depthWrite:false}));
        sombra.rotation.x = -Math.PI/2; sombra.position.y = 0.4; sombra.scale.set(5, 3.6, 1); scene.add(sombra);
        scene.add(grupo);
        v = Object.assign(v||{}, {grupo, corpo, sombra, tipo:p.tipo, ultimoFumo:0, explodiu:false, x:p.x, y:p.y, t:0});
        projMeshes.set(p, v);
      }
      v.x = p.x; v.y = p.y; v.t = p.t;
      const qs = pos(p.x, p.y);
      v.sombra.position.set(qs.x, qs.y + 0.4, qs.z);
      if(p.noChao){
        const k = 1 - (p.explodeEm - p.t)/(p.pavio||1);
        v.grupo.position.set(qs.x, qs.y + 4.6, qs.z); v.grupo.rotation.set(0, 0, 0);
        v.faisca.visible = Math.sin(p.t*(30+k*70)) > 0;
        v.zona.visible = true; v.zona.position.set(qs.x, qs.y + 0.6, qs.z); v.zona.scale.setScalar(raioBomba * escalaDoTabuleiro());
        v.zona.material.opacity = 0.25 + 0.45*k;
        if(p.t - v.ultimoFumo > 0.07){ v.ultimoFumo = p.t; fumo(qs.x+2.4, qs.y+8, qs.z, false); }
        continue;
      }
      if(!p.morto){
        const alt = Math.sin((p.t/p.dur)*Math.PI)*36 + 8;
        v.grupo.position.set(qs.x, qs.y + alt, qs.z);
        v.grupo.rotation.set(p.t*7, p.t*9, 0);
        if(p.tipo==='bomba' && p.t - v.ultimoFumo > 0.05){ v.ultimoFumo = p.t; fumo(qs.x, qs.y+alt, qs.z, false); }
        continue;
      }
      /* morto: explodiu (bomba) — a cena some com ele quando `explosao` passa */
      v.grupo.visible = false; v.sombra.visible = false;
      if(v.zona) v.zona.visible = false;
      if(p.explosao!==undefined && !v.explodiu){ v.explodiu = true; explodir(qs.x, qs.z, qs.y); }
    }
    for(const [p,v] of projMeshes) if(!agora.has(p)){
      projMeshes.delete(p);
      scene.remove(v.grupo); scene.remove(v.sombra); if(v.zona) scene.remove(v.zona);
      if(v.tipo==='pedra' && v.t > 0.07){ const q = pos(v.x, v.y); poeira(q.x, q.z, q.y); }
    }
  }

  /* =======================================================
     AS GRADES DE FERRO
     ======================================================= */
  const gradeMeshes = new Map();
  function gradesDeFerro(mods){
    const g = G();
    const agora = new Set();
    for(const m of mods || []){
      agora.add(m);
      let v = gradeMeshes.get(m);
      if(!v){
        const mesh = new THREE.Mesh(g.caixa, mat('#e8b53c'));
        scene.add(mesh); v = {mesh, hp:null}; gradeMeshes.set(m, v);
      }
      const ang = Math.atan2(m.ux, m.uy);
      const qg = pos(m.x, m.y);
      const mesh = v.mesh;
      mesh.rotation.y = ang;
      if(m.tipo==='fila'){ mesh.scale.set(m.esp*2, 30, m.meia*2); mesh.position.set(qg.x, qg.y+15, qg.z); mesh.material = mat('#9aa0a6'); continue; }
      if(m.hp<=0){ mesh.scale.set(m.esp*2+6, 3, m.meia*2); mesh.position.set(qg.x, qg.y+1.5, qg.z); mesh.material = mat('#6a5a30'); continue; }
      const p = m.hp/m.hpMax;
      mesh.material = mat(p>0.6 ? '#e8b53c' : p>0.3 ? '#c08a2a' : '#8a5f22');
      mesh.scale.set(m.esp*2, 30, m.meia*2); mesh.position.set(qg.x, qg.y+15, qg.z);
    }
    for(const [m,v] of gradeMeshes) if(!agora.has(m)){ gradeMeshes.delete(m); scene.remove(v.mesh); }
  }

  /* =======================================================
     A CÂMERA DE CIMA, casada com o 2D
     ======================================================= */
  /* O QUE A CÂMERA VÊ, em coordenadas da cena (x, e z = y do disco).
     Serve pro corte de quem está fora da tela (ver atualizarCena). */
  const vista = {x0:-Infinity, x1:Infinity, z0:-Infinity, z1:Infinity};
  function ajustarCamera(e, cw, ch){
    const x0 = -e.ox/e.s, x1 = (cw-e.ox)/e.s;
    const z0 = -e.oy/e.s, z1 = (ch-e.oy)/e.s;
    vista.x0 = x0; vista.x1 = x1; vista.z0 = z0; vista.z1 = z1;
    cam.left = x0; cam.right = x1; cam.top = -z0; cam.bottom = -z1;
    cam.near = 1; cam.far = ALTURA_CAM*2;
    cam.updateProjectionMatrix();
    /* cisalhamento: a altura (z local da câmera + ALTURA) sobe a tela */
    const el = cam.projectionMatrix.elements;   // por coluna: índice = coluna*4 + linha
    const a = 2/(cam.top-cam.bottom);
    el[9]  = a*CISALHA;              // linha 1 (y de tela), coluna 2 (z local = altura − ALTURA)
    el[13] += a*CISALHA*ALTURA_CAM;  // compensa a câmera estar a ALTURA do chão
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }

  /* O TAMANHO VEM DA CAIXA CSS, NUNCA DO BUFFER (crash do celular,
     07/09/2026). Fechada a cena, o palco fica com display:none e o
     canvas com clientWidth 0; a versão anterior caía então em
     `cv.width`, e como no celular o dpr é 1,5 o buffer era
     multiplicado por 1,5 A CADA QUADRO — em dois segundos passava de
     um bilhão de pixels de largura, o WebKit do iPhone estourava a
     memória e o artifact mostrava "Algo deu errado". Sem caixa não se
     redimensiona nem se desenha: devolve false e a ponte pula o
     quadro. */
  /* RESOLUÇÃO QUE SE AJUSTA AO QUADRO (fps do dono, 08/09/2026): a
     camada dos bonecos nasce a 1,5× de densidade e desce pra 1× e
     0,75× quando a média do quadro passa de 1/28 s; volta a subir
     quando sobra folga (média abaixo de 1/55 s) por uns segundos. Um
     boneco de 30 px não sente a diferença; a placa do celular sente
     — 1,5× é 2,25 vezes mais pixel que 1×. */
  const DPR_NIVEIS = [1.5, 1.0, 0.75];
  const cfg = {cortarForaDaTela:true, resolucaoAdaptativa:true, afinarMalha:true, afinarCelulas:48, juntarPecas:true, movimentoLeve:true, nivelLeve:false};
  let quadroN = 0;
  /* o relógio de verdade das figuras (o do jogo, J.t, pode correr acelerado: o dia de jogo) */
  let tAnim = 0;
  let dprNivel = 0, mediaDt = 1/60, tempoNoNivel = 0;
  const dprAtual = () => Math.min(cfg.resolucaoAdaptativa ? DPR_NIVEIS[dprNivel] : 1.5,
                                  window.devicePixelRatio||1);
  /* o relógio é de tempo, não de quadros: a 4 fps, 45 quadros são 11 s
     de tela travada antes de reagir. Desce depois de 1,2 s ruins, sobe
     depois de 4 s folgados. */
  function ajustarResolucao(dt){
    if(!cfg.resolucaoAdaptativa) return;
    const d = Math.min(0.25, Math.max(0.001, dt));
    mediaDt = mediaDt*0.85 + d*0.15;
    tempoNoNivel += d;
    if(tempoNoNivel > 1.2 && mediaDt > 1/28 && dprNivel < DPR_NIVEIS.length-1){
      dprNivel++; tempoNoNivel = 0; mediaDt = 1/40;
    } else if(tempoNoNivel > 4 && mediaDt < 1/55 && dprNivel > 0){
      dprNivel--; tempoNoNivel = 0; mediaDt = 1/45;
    }
  }
  function ajustarTamanho(){
    const dpr = dprAtual();
    const cw = cv.clientWidth, ch = cv.clientHeight;
    if(!cw || !ch) return false;
    const w = Math.max(320, Math.round(cw*dpr));
    const h = Math.max(200, Math.round(ch*dpr));
    if(cv.width!==w || cv.height!==h){ renderer.setSize(w, h, false); }
    return true;
  }

  /* AS FOTOS NÃO DERRUBAM OS BONECOS (o dono, 02/10/2026: "algumas cenas
     de briga estão surgindo com os discos em vez do boneco"). Cada foto
     de briga do jornal (cartaz.js) e do troféu abria um WebGLRenderer
     novo, e `dispose()` não fecha o contexto: o Chrome aguenta uns 16 e
     derruba o MAIS ANTIGO — o dos bonecos da cena —, que não volta; dali
     em diante toda briga abria com disco. Agora as fotos dividem UM
     renderizador, num canvas só dele, no tamanho pedido. */
  let fotoR = null;
  function rendererDaFoto(cvB){
    if(fotoR && fotoR.getContext().isContextLost()){ try{ fotoR.dispose(); }catch(_){ } fotoR = null; }
    if(!fotoR){
      fotoR = new THREE.WebGLRenderer({canvas:document.createElement('canvas'), antialias:true, alpha:true,
                                       premultipliedAlpha:true, preserveDrawingBuffer:true});
    }
    fotoR.setPixelRatio(1);
    fotoR.setSize(cvB.width, cvB.height, false);
    return fotoR;
  }
  /* depois da foto, as listas do quadro saem (o renderizador fica) */
  function soltarFoto(r){
    try{ r.renderLists.dispose(); }catch(_){ }
  }

  function montar(canvas){
    if(typeof THREE === 'undefined') return false;
    if(renderer && cv === canvas && ativo) return true;
    /* contexto perdido e ainda não devolvido pelo navegador: a cena
       abre com disco. Quando a placa devolve (`webglcontextrestored`),
       o Three reconstrói o estado sozinho e `ativo` volta a true — a
       cena seguinte já abre com boneco de novo. */
    if(renderer && cv === canvas && !ativo) return false;
    cv = canvas;
    try{
      /* SEM ANTIALIAS: o MSAA quadruplica o preenchimento de um canvas
         de 1140×820 e é o que menos se vê num boneco de 30 px. Com 140
         bonecos numa emboscada a diferença é entre a placa integrada
         aguentar ou perder o contexto. `high-performance` pede a GPU
         dedicada em notebook com duas. */
      renderer = new THREE.WebGLRenderer({canvas:cv, antialias:false, alpha:true, premultipliedAlpha:true,
                                          powerPreference:'high-performance'});
    }catch(err){ console.error('bonecos3: '+err.message); renderer=null; return false; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(1);
    /* A PLACA PODE DESISTIR. Com muita gente em cena (140 bonecos numa
       emboscada) a GPU fraca — ou o iframe do artifact — perde o
       contexto WebGL; sem tratar, o Three lança no quadro seguinte e o
       laço da cena morre com o canvas em branco. Aqui a perda vira
       `ativo=false`, que a ponte lê e troca o boneco pelo disco. */
    cv.addEventListener('webglcontextlost', ev=>{
      ev.preventDefault();
      console.warn('bonecos3: contexto WebGL perdido');
      ativo = false;
    }, false);
    cv.addEventListener('webglcontextrestored', ()=>{
      console.warn('bonecos3: contexto WebGL de volta');
      ativo = true;
    }, false);
    scene = new THREE.Scene();
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, ALTURA_CAM*2);
    cam.position.set(0, ALTURA_CAM, 0);
    cam.up.set(0, 0, -1);
    cam.lookAt(0, 0, 0);
    scene.add(cam);
    /* luz: céu por cima, sol de noroeste, um pouco de contraluz */
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a48, 0.85));
    const sol = new THREE.DirectionalLight(0xffffff, 0.75); sol.position.set(-0.5, 1, -0.6); scene.add(sol);
    const contra = new THREE.DirectionalLight(0xa0c0ff, 0.25); contra.position.set(0.6, 0.5, 0.8); scene.add(contra);
    figuras.clear(); projMeshes.clear(); gradeMeshes.clear();
    ativo = true;
    carregarGLB();
    return true;
  }

  /* QUEM ESTÁ FORA DA TELA NÃO É ANIMADO NEM DESENHADO (fps do dono,
     08/09/2026). Com a câmera a 3,4× no celular a tela mostra uma dúzia
     de bonecos, e mesmo assim os 52 (ou 140 numa emboscada) eram
     posados osso a osso e mandados pra placa todo quadro — o
     `frustumCulled=false` das peças do GLB era pra evitar sumiço por
     caixa errada, e deixava a placa desenhar tudo. Aqui o corte é
     pela posição do disco contra a vista da câmera, com margem de um
     boneco e meio. A figura fica na lista (não é liberada), só não
     entra no quadro; quando o disco volta pra tela, volta a animar. */
  const MARGEM_VISTA = 60;
  /* A CÂMERA DE OMBRO NÃO TEM RETÂNGULO. Na cena de cima a vista é um
     retângulo do tabuleiro e o corte sai dele. Numa câmera em
     perspectiva não sai: quem sabe o que cabe na tela é o dono da
     câmera, e é ele que passa o teste em `entrarEm`. Sem teste, vale o
     retângulo de sempre. */
  const naVista = (x, z, d) => noQuadroExterno
    ? noQuadroExterno(x, z, d)
    : (x >= vista.x0 - MARGEM_VISTA && x <= vista.x1 + MARGEM_VISTA &&
       z >= vista.z0 - MARGEM_VISTA && z <= vista.z1 + MARGEM_VISTA);
  const conta = {vistos:0, cortados:0};
  function atualizarCena(J, dt){
    quadroN++; tAnim += dt;
    for(const fg of figuras.values()){ fg.corpo.raiz.visible = false; fg.viva = false; }
    const C = TO.diaJogo.combate;
    const FICA = (C && C.CAIDO_FICA) || 3.0, SOME = (C && C.CAIDO_SOME) || 1.5;
    const cortar = cfg.cortarForaDaTela;
    conta.vistos = 0; conta.cortados = 0;
    const animar = (d, i, pm) => {
      if(cortar && !naVista(d.x, d.y, d)){
        const fg = figuras.get(d);
        if(fg) fg.viva = true;            // fica na lista, fora do quadro
        conta.cortados++;
        return;
      }
      if(pm) animarPM(d, i, J, dt); else animarDisco(d, i, J, dt);
      const fg = figuras.get(d);
      if(fg){ fg.viva = true; trocarNivel(fg.corpo, !pm && d.lider); }
      conta.vistos++;
    };
    J.discos.forEach((d,i)=>{
      if(d.entrou || d.sumiu) return;
      /* o ferido some depois do prazo: não anima, e a limpeza abaixo
         tira a figura da cena */
      if(d.caido && J.t - (d.caiuEm||0) >= FICA + SOME) return;
      animar(d, i, false);
    });
    (J.policiais||[]).forEach((p,i)=>animar(p, i, true));
    /* figuras que saíram da cena: some da lista, não só da tela */
    for(const [d,fg] of figuras) if(!fg.viva){ scene.remove(fg.corpo.raiz); liberar(fg); figuras.delete(d); }
    projeteis(J);
    atualizarParticulas(dt);
    gradesDeFerro(J.grades);
  }

  /* O QUE É SÓ DA FIGURA SAI DA PLACA COM ELA: os materiais clonados
     por boneco (cores da roupa, o esmaecido do caído, os dois anéis)
     ficam marcados `_propria` e são liberados aqui; geometria e
     material compartilhados (a camisa por desenho, o cache `mats`)
     ficam, porque a próxima cena usa de novo. Sem isto cada briga
     deixava uns 400 materiais na GPU do celular.
     A TEXTURA DOS OSSOS TAMBÉM (o dono, 29/09/2026: "quase todas as vezes
     que preciso abrir outro mapa devido a caravanas o jogo buga e recarrega
     automaticamente"): cada esqueleto cria a sua no primeiro quadro e o
     three.js só a devolve pra placa no `dispose` dele. Medido no dia de
     jogo fora: ~240 texturas de osso ficavam na placa por viagem (uma por
     boneco que passou pela cidade), e a conta só crescia com a viagem
     seguinte. */
  function liberar(fg){
    fg.corpo.raiz.traverse(o=>{
      const m = o.material;
      if(m && m._propria) m.dispose();
      if(o.isSkinnedMesh && o.skeleton) o.skeleton.dispose();
    });
  }

  function desenharDeCima(J, opc){
    if(!renderer || !J) return;
    ajustarResolucao(opc.dt || 0.016);
    if(!ajustarTamanho()) return;
    const dt = Math.min(0.05, opc.dt || 0.016);
    ajustarCamera(opc.escala, opc.cw, opc.ch);
    cam.updateMatrixWorld(); camNivel = cam; alturaNivel = cv.clientHeight || opc.ch || 0;
    atualizarCena(J, dt);
    renderer.render(scene, cam);
  }

  /* A VITRINE (bonecos.html): a mesma cena vista por uma câmera em
     perspectiva que gira em volta, com um chão, pra olhar o boneco de
     perto em cada estado da animação. */
  let camV=null, chaoV=null;
  function desenharVitrine(J, opc){
    if(!renderer || !J) return;
    if(!ajustarTamanho()) return;
    const dt = Math.min(0.05, opc.dt || 0.016);
    if(!camV){
      camV = new THREE.PerspectiveCamera(32, 1, 1, 4000);
      const g = G();
      chaoV = new THREE.Mesh(g.disco, mat('#4a4a46'));
      chaoV.rotation.x = -Math.PI/2; chaoV.scale.setScalar(900); chaoV.position.y = -0.2;
      scene.add(chaoV);
      const grade = new THREE.GridHelper(1800, 60, 0x6a6a64, 0x5a5a56); grade.position.y = 0.1; scene.add(grade);
      scene.background = new THREE.Color('#1c1c1a');
    }
    camV.aspect = cv.width/cv.height; camV.updateProjectionMatrix();
    const a = opc.angulo||0, dist = opc.dist||150, alvo = opc.alvo||{x:0,z:0};
    camV.position.set(alvo.x+Math.sin(a)*dist, opc.altura||55, alvo.z+Math.cos(a)*dist);
    camV.lookAt(alvo.x, opc.mira!==undefined?opc.mira:15, alvo.z);
    camNivel = null;                     // a vitrine é pra olhar de perto
    atualizarCena(J, dt);
    renderer.render(scene, camV);
  }

  function limparDeCima(){
    if(!renderer) return;
    renderer.clear();
  }

  /* =======================================================
     A FOTO DO TROFÉU (pedido do dono, 10/09/2026; refeita no mesmo
     dia depois de ver a primeira: "vamos alterar essa imagem pra ser
     uma tela vista dentro da cena que ocorreu a briga — se a TUF
     tomou a faixa no bar, os 4 membros estão dentro do bar com a
     faixa estendida, com a visão de longe, idêntica à visão do
     jogador".)
     Então a foto é a CENA: o mesmo fundo aéreo que a briga usou, a
     mesma câmera de cima (ortogonal com o cisalhamento de sempre),
     e quatro dos nossos em fila segurando o pano tomado, estendido
     na frente deles. Nada disso encosta na cena viva: o fundo sai
     num canvas 2D próprio e os bonecos num renderizador só desta
     foto, jogado fora no fim.
     `opc`: {pano, tipo:'faixa'|'bandeira', torcida:{...}, nomes:[],
             cena:'bar'|'praca'|'estadio-20'…, lado:'mandante'|…,
             largura, altura, vista}
     ======================================================= */
  function fotoDoTrofeu(opc){
    if(typeof THREE === 'undefined') return Promise.resolve(null);
    carregarGLB();
    const A = TO.diaJogo.arredores;
    const trocou = opc.cena && A && A.D && A.D.id !== opc.cena && A.usarCena;
    if(trocou) A.usarCena(opc.cena);
    /* espera o GLB e, quando a cena teve de ser trocada, a foto aérea
       dela — desenhar antes dá um fundo de malha cinza */
    const espera = ()=> new Promise(res=>{
      const t0 = Date.now();
      (function v(){
        if(modeloGLB && (!trocou || Date.now()-t0 > 900)) return res(!!modeloGLB);
        if(Date.now()-t0 > 6000) return res(!!modeloGLB);
        setTimeout(v, 120);
      })();
    });
    return espera().then(ok=>{
      if(!ok) return null;
      try{ return renderizarTrofeu(opc); }catch(err){ console.warn('foto do troféu: '+err.message); return null; }
    });
  }

  /* ONDE OS QUATRO POSAM: no meio da ação, e sempre EM FILA
     HORIZONTAL, com o pano estendido logo abaixo — é assim que uma
     foto de faixa se lê vista de cima. Procura em volta do centro da
     cena um lugar onde a fila inteira e o pano pisam chão livre; sem
     achar, encosta na parede em que a torcida estende faixa. */
  let POSE_PASSO = 30;
  const POSE_N = 4;
  /* ONDE POSAR. A foto é tirada onde o pano foi tomado, e não no meio
     geométrico dos postos de saída — no bar, essa média cai na rua ao
     lado do salão. A ordem de preferência é: a parede em que o pano do
     lado perdedor estava pendurado, depois o quartel desse lado, e só
     então o meio da briga. */
  function centrosDaPose(A, lado){
    const D = A.D, W = A.W || 1536, H = A.H || 1024, sp = D.spawns || [];
    const outro = lado === 'mandante' ? 'visitante' : 'mandante';
    const media = a => a.length
      ? {x: a.reduce((s,p)=>s+p.x,0)/a.length, y: a.reduce((s,p)=>s+p.y,0)/a.length}
      : null;
    const cs = [];
    const F = D.faixas || {};
    for(const k of Object.keys(F)){
      if(k.indexOf(outro) !== 0) continue;
      const p = F[k]; if(!p) continue;
      const d = (p.dir && (p.dir[0] || p.dir[1])) ? p.dir : [0,1];
      const n = Math.hypot(d[0], d[1]) || 1;
      cs.push({x: p.x - d[0]/n*72, y: p.y - d[1]/n*72, raio: 150});
    }
    const mo = media(sp.filter(s=>s.lado === outro));
    if(mo) cs.push({x: mo.x, y: mo.y, raio: 220});
    const mt = media(sp);
    if(mt) cs.push({x: mt.x, y: mt.y, raio: 340});
    cs.push({x: W/2, y: H/2, raio: 420});
    return cs;
  }

  function pontoDaPose(A, lado){
    const D = A.D, W = A.W || 1536, H = A.H || 1024;
    /* O SALÃO DO BAR É APERTADO: entre as mesas não cabe uma fila de
       quatro com folga. Tenta o passo cheio e a folga cheia primeiro;
       depois aperta a fila e a folga, nesta ordem, sem sair do lugar
       onde o pano estava. */
    const TENTATIVAS = [[30,9,7], [26,8,6], [22,7,5], [18,6,4]];
    for(const c of centrosDaPose(A, lado)){
      for(const [passo, rb, rp] of TENTATIVAS){
        const meia = (POSE_N-1)/2 * passo + 14;
        const cabe = (x, y) => {
          if(!A.cabe) return true;
          for(let k=0;k<POSE_N;k++){
            const ox = (k - (POSE_N-1)/2) * passo;
            if(!A.cabe(x+ox, y, rb)) return false;        // o boneco
            if(!A.cabe(x+ox, y+30, rp)) return false;     // o pano na frente
          }
          return A.cabe(x-meia, y, 5) && A.cabe(x+meia, y, 5);
        };
        for(let r=0; r<=c.raio; r+=14){
          for(let a=0; a<360; a+=12){
            const x = c.x + Math.cos(a*Math.PI/180)*r, y = c.y + Math.sin(a*Math.PI/180)*r;
            if(x < meia+10 || x > W-meia-10 || y < 60 || y > H-70) continue;
            if(!cabe(x, y)) continue;
            POSE_PASSO = passo;
            return {x, y, dir:[0,-1], t:[1,0]};
          }
        }
      }
    }
    /* nem uma fila cabe: vale a parede da faixa, como a cena manda */
    const F = D.faixas || {}, sp = D.spawns || [];
    let p = F[lado] || F[lado+'1'] || F[lado+'2'] || sp.find(x=>x.lado===lado) || sp[0] || {x:W/2, y:H/2};
    let dir = p.dir;
    if(!dir || (!dir[0] && !dir[1])){
      const dx = W/2 - p.x, dy = H/2 - p.y, n = Math.hypot(dx,dy) || 1;
      dir = [-dx/n, -dy/n];
    }
    const n = Math.hypot(dir[0], dir[1]) || 1, d = [dir[0]/n, dir[1]/n];
    let x = p.x - d[0]*46, y = p.y - d[1]*46;
    if(A.cabe && !A.cabe(x, y, 12) && A.pontoLivreMaisProximo){
      const q = A.pontoLivreMaisProximo(x, y, 12);
      if(q){ x = q.x; y = q.y; }
    }
    return {x, y, dir:d, t:[-d[1], d[0]]};
  }

  function renderizarTrofeu(opc){
    const A = TO.diaJogo.arredores;
    const W = opc.largura || 720, H = opc.altura || 405;
    const lado = opc.lado === 'visitante' ? 'visitante' : 'mandante';
    const pose = pontoDaPose(A, lado);
    const bandeira = opc.tipo === 'bandeira';
    /* a vista: quanto da cena cabe no quadro. 470 unidades é a "visão
       de longe" — o boneco sai com uns 50 px, o pano com 190 */
    const VW = opc.vista || 400, VH = VW * H / W;
    const cx = U.limitar(pose.x, VW/2, (A.W||1536) - VW/2);
    const cy = U.limitar(pose.y + 18, VH/2, (A.H||1024) - VH/2);
    const x0 = cx - VW/2, y0 = cy - VH/2, s = W/VW;

    const cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H;
    const x = cv2.getContext('2d');
    /* 1. o fundo da cena, na escala do recorte */
    x.save(); x.setTransform(s, 0, 0, s, -x0*s, -y0*s);
    A.desenharFundo(x);
    x.restore();

    /* 2. os bonecos, na MESMA câmera de cima da briga */
    const cvB = {width:W, height:H};   // o tamanho; o canvas é o do renderizador das fotos
    let r = null, maosCena = null;
    try{
      r = rendererDaFoto(cvB);
      r.setPixelRatio(1); r.setClearColor(0x000000, 0);
      const sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a48, 0.85));
      const sol = new THREE.DirectionalLight(0xffffff, 0.75); sol.position.set(-0.5, 1, -0.6); sc.add(sol);
      const contra = new THREE.DirectionalLight(0xa0c0ff, 0.25); contra.position.set(0.6, 0.5, 0.8); sc.add(contra);
      const camF = new THREE.OrthographicCamera(x0, x0+VW, -y0, -(y0+VH), 1, ALTURA_CAM*2);
      camF.position.set(0, ALTURA_CAM, 0); camF.up.set(0, 0, -1); camF.lookAt(0, 0, 0);
      camF.updateProjectionMatrix();
      /* o mesmo cisalhamento de `ajustarCamera`: a altura sobe na tela */
      const el = camF.projectionMatrix.elements, a = 2/(camF.top - camF.bottom);
      el[9] += a*CISALHA; el[13] += a*CISALHA*ALTURA_CAM;
      camF.projectionMatrixInverse.copy(camF.projectionMatrix).invert();
      sc.add(camF);

      const t = opc.torcida || {};
      const nomes = (opc.nomes && opc.nomes.length ? opc.nomes : ['Tico','Rafinha','Bidu','Neguinho']).slice(0,4);
      const passo = POSE_PASSO, virado = Math.atan2(pose.dir[0], pose.dir[1]);
      const ossos = [];
      nomes.forEach((nome, i)=>{
        const d = {nome:nome+'|trofeu', lado, torcida:t.id, cor:t.cor, cor2:t.cor2, cor3:t.cor3||null};
        const f = fichaDe(d, i); f.escala = 1;
        const c = construirCorpoGLB(f, false);
        if(c.anel) c.anel.visible = false;
        if(c.anelFundo) c.anelFundo.visible = false;
        const p = poseNeutra();
        /* braços BAIXOS e um pouco à frente, abertos de lado. Com o
           braço na altura do peito a mão projeta 20 unidades ACIMA dos
           pés — quase na cabeça — e o pano pendurado nela tapava o
           boneco inteiro. Baixo, a mão cai logo à frente do pé e o pano
           se estende no chão, com a torcida inteira à vista atrás. */
        p.ombro = [0.95, 0.95]; p.ombroZ = [0.55, 0.55]; p.cotovelo = [0.15, 0.15];
        p.coxa = [0.10, -0.10]; p.olhaX = -0.05;
        aplicarPoseGLB(c, p, f.escala * escalaDeCima * 0.86);
        const off = (i - (nomes.length-1)/2) * passo;
        c.raiz.position.set(pose.x + pose.t[0]*off, 0, pose.y + pose.t[1]*off);
        c.raiz.rotation.y = virado;              // de frente pro pano
        sc.add(c.raiz);
        if(c.J && c.J.mao) for(const j of c.J.mao) if(j && j.b) ossos.push(j.b);
      });
      sc.updateMatrixWorld(true);
      /* ONDE ESTÃO AS MÃOS. O pano não pode ser posto "a tantas unidades
         dos pés": o cisalhamento da câmera levanta o corpo na tela e o
         vão aparece. Projeta-se cada osso da mão pela própria câmera e
         volta-se ao espaço da cena, que é o que o desenho 2D usa. */
      if(ossos.length){
        const v = new THREE.Vector3(), ps = [];
        for(const b of ossos){
          b.getWorldPosition(v); v.project(camF);
          ps.push({x: x0 + (v.x*0.5 + 0.5)*VW, y: y0 + (-v.y*0.5 + 0.5)*VH});
        }
        let ex = 1e9, dx = -1e9, sy = 0;
        for(const q of ps){ if(q.x < ex) ex = q.x; if(q.x > dx) dx = q.x; sy += q.y; }
        maosCena = {esq: ex, dir: dx, y: sy/ps.length};
      }
      r.render(sc, camF);
      x.drawImage(r.domElement, 0, 0);
    }catch(err){ console.warn('foto do troféu (bonecos): '+err.message); }
    finally{ if(r) soltarFoto(r); }

    /* 3. O PANO NAS MÃOS, DE CABEÇA PRA BAIXO. Faixa tomada se mostra
       invertida — é assim que se exibe o troféu. Ele vai de uma mão da
       ponta à outra e pendura da linha das mãos pra baixo. */
    if(opc.pano){
      const m = maosCena;
      const comp = bandeira ? 46
                 : m ? Math.max(m.dir - m.esq + 8, 40)
                 : passoDoPano(POSE_N);
      const alt = bandeira ? 46 : comp/6*1.24;
      const cxp = m ? (m.esq + m.dir)/2 : pose.x - pose.dir[0]*16;
      const cyp = m ? m.y + alt/2       : pose.y - pose.dir[1]*16;
      x.save(); x.setTransform(s, 0, 0, s, -x0*s, -y0*s);
      x.translate(cxp, cyp);
      x.rotate(Math.atan2(pose.t[1], pose.t[0]));
      x.fillStyle = 'rgba(0,0,0,.42)';
      x.fillRect(-comp/2 + 1.5, -alt/2 + 3, comp, alt);
      x.rotate(Math.PI);                       // o troféu vai invertido
      x.drawImage(opc.pano, -comp/2, -alt/2, comp, alt);
      x.restore();
    }
    try{ return cv2.toDataURL('image/jpeg', 0.88); }catch(_){ return null; }
  }
  /* o pano acompanha a fila: quatro a 30 de distância, e uma sobra de
     cada lado pra mão segurar */
  function passoDoPano(n){ return (n-1)*POSE_PASSO + 34; }

  /* =======================================================
     A FOTO DA BRIGA (pedido do dono, 01/10/2026): a imagem do post do
     Futebol e Porrada — "bonecos da torcida vencedora batendo em
     bonecos da torcida perdedora", no lugar em que a briga foi. É a
     mesma receita da foto do troféu: o fundo aéreo da cena num canvas
     2D, os bonecos num renderizador só desta foto, a mesma câmera de
     cima. Os vencedores à esquerda, de frente pros perdedores, no pico
     do golpe (soco ou chute, pelo repertório de cada um); os perdedores
     à direita, um no chão, um se cobrindo, um cambaleando.
     A cena no ar é trocada só pra desenhar e volta logo depois; com
     uma briga rodando, nada é feito (a cena viva não pode mudar).
     `opc`: {cena, vencedor:{id,cor,cor2,cor3}, perdedor:{…}, pares,
             largura, altura, vista, semente}
     ======================================================= */
  function fotoDaBriga(opc){
    if(typeof THREE === 'undefined') return Promise.resolve(null);
    const P = TO.diaJogo.ponte;
    if(P && P.rodando) return Promise.resolve(null);
    carregarGLB();
    const A = TO.diaJogo.arredores;
    if(!A || !A.usarCena) return Promise.resolve(null);
    const espera = ()=> new Promise(res=>{
      const t0 = Date.now();
      (function v(){
        if(modeloGLB) return res(true);
        if(Date.now()-t0 > 6000) return res(false);
        setTimeout(v, 120);
      })();
    });
    return espera().then(ok=>{
      if(!ok || (P && P.rodando)) return null;
      const antes = A.D && A.D.id;
      const trocou = opc.cena && A.D && A.D.id !== opc.cena;
      if(trocou) A.usarCena(opc.cena);
      /* a foto aérea da cena nova ainda pode estar chegando */
      const fundo = ()=> new Promise(res=>{
        const t0 = Date.now();
        (function v(){
          if(A.imagemOk || !A.D.imagem || Date.now()-t0 > 2500) return res();
          setTimeout(v, 80);
        })();
      });
      return fundo().then(()=>{
        let url = null;
        try{ url = renderizarBriga(opc); }catch(err){ console.warn('foto da briga: '+err.message); }
        if(trocou && !(P && P.rodando)) A.usarCena(antes || 'arredores');
        return url;
      });
    });
  }

  /* o lugar da foto: perto do meio da briga, onde os pares cabem em pé */
  /* os pares lado a lado, na largura do quadro 2:1: o meio da foto
     é o que sobra entre a manchete de cima e os números de baixo */
  const PAR_DX = 74;
  const parOffset = (i, pares) => ({dx:(i - (pares-1)/2) * PAR_DX, dy:(i%2 ? 7 : -5)});
  function pontoDaBriga(A, pares){
    const W = A.W || 1536, H = A.H || 1024;
    const cabe = (x, y)=>{
      if(!A.cabe) return true;
      for(let i=0;i<pares;i++){
        const o = parOffset(i, pares);
        if(!A.cabe(x+o.dx-18, y+o.dy, 8) || !A.cabe(x+o.dx+16, y+o.dy, 8) || !A.cabe(x+o.dx+30, y+o.dy, 6)) return false;
      }
      return true;
    };
    for(const c of centrosDaPose(A, 'mandante')){
      for(let r=0; r<=c.raio; r+=14){
        for(let a=0; a<360; a+=15){
          const x = c.x + Math.cos(a*Math.PI/180)*r, y = c.y + Math.sin(a*Math.PI/180)*r;
          if(x < 80 || x > W-80 || y < 80 || y > H-80) continue;
          if(cabe(x, y)) return {x, y};
        }
      }
    }
    return {x:W/2, y:H/2};
  }

  function renderizarBriga(opc){
    const A = TO.diaJogo.arredores;
    const W = opc.largura || 800, H = opc.altura || 400;
    const pares = Math.max(1, Math.min(4, opc.pares || 3));
    const c0 = pontoDaBriga(A, pares);
    const VW = opc.vista || (pares * PAR_DX + 70), VH = VW * H / W;
    /* o grupo na faixa livre do cartaz — abaixo das torcidas, acima da
       manchete e dos números —, um pouco acima do meio do quadro */
    const cx = U.limitar(c0.x + 4, VW/2, (A.W||1536) - VW/2);
    const cy = U.limitar(c0.y + VH*0.07, VH/2, (A.H||1024) - VH/2);
    const x0 = cx - VW/2, y0 = cy - VH/2, s = W/VW;

    const cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H;
    const x = cv2.getContext('2d');
    x.save(); x.setTransform(s, 0, 0, s, -x0*s, -y0*s);
    A.desenharFundo(x);
    x.restore();

    const cvB = {width:W, height:H};   // o tamanho; o canvas é o do renderizador das fotos
    let r = null;
    try{
      r = rendererDaFoto(cvB);
      r.setPixelRatio(1); r.setClearColor(0x000000, 0);
      const sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a48, 0.85));
      const sol = new THREE.DirectionalLight(0xffffff, 0.75); sol.position.set(-0.5, 1, -0.6); sc.add(sol);
      const contra = new THREE.DirectionalLight(0xa0c0ff, 0.25); contra.position.set(0.6, 0.5, 0.8); sc.add(contra);
      const camF = new THREE.OrthographicCamera(x0, x0+VW, -y0, -(y0+VH), 1, ALTURA_CAM*2);
      camF.position.set(0, ALTURA_CAM, 0); camF.up.set(0, 0, -1); camF.lookAt(0, 0, 0);
      camF.updateProjectionMatrix();
      const el = camF.projectionMatrix.elements, a = 2/(camF.top - camF.bottom);
      el[9] += a*CISALHA; el[13] += a*CISALHA*ALTURA_CAM;
      camF.projectionMatrixInverse.copy(camF.projectionMatrix).invert();
      sc.add(camF);

      const sem = String(opc.semente || '');
      const boneco = (t, lado, i, papel)=>{
        const d = {nome:`${sem}|${papel}|${i}`, lado, torcida:t.id, cor:t.cor, cor2:t.cor2, cor3:t.cor3||null};
        const f = fichaDe(d, i); f.escala = 1;
        f.varianteForcada = dado(`${sem}|${papel}|var|${i}`, 3);
        const c = construirCorpoGLB(f, false);
        if(c.anel) c.anel.visible = false;
        if(c.anelFundo) c.anelFundo.visible = false;
        return {f, c};
      };
      for(let i=0;i<pares;i++){
        const o = parOffset(i, pares), ox = o.dx, oy = o.dy;
        /* o vencedor, no pico do golpe */
        const v = boneco(opc.vencedor || {}, 'mandante', i, 'v');
        const pv = poseNeutra();
        const chute = i === 1 && pares > 1;
        const at = chute ? {tipo:'chute', dur:0.58, impacto:0.28} : {tipo:'soco', dur:0.36, impacto:0.15};
        const pico = Math.min(0.6, Math.max(0.3, at.impacto/at.dur + 0.06));
        at.t = pico * at.dur; at.bateu = false;
        lutar(pv, v.f, {ataque:at}, 0, 0.4 + i*0.37);
        aplicarPoseGLB(v.c, pv, v.f.escala * escalaDeCima * 0.86);
        v.c.raiz.position.set(c0.x + ox - 16, 0, c0.y + oy);
        v.c.raiz.rotation.y = Math.PI/2;           // de frente pra direita
        sc.add(v.c.raiz);
        /* o perdedor: no chão, se cobrindo ou cambaleando */
        const d = boneco(opc.perdedor || {}, 'visitante', i, 'p');
        const pd = poseNeutra();
        const jeito = i % 3;
        if(jeito === 0){ d.f.jazido = 0; cair(pd, d.f, 2); }
        else if(jeito === 1) cobrirSe(pd, d.f, 0.6 + i);
        else cambalear(pd, d.f, 0.9 + i);
        aplicarPoseGLB(d.c, pd, d.f.escala * escalaDeCima * 0.86);
        d.c.raiz.position.set(c0.x + ox + (jeito === 0 ? 24 : 15), 0, c0.y + oy);
        d.c.raiz.rotation.y = -Math.PI/2 + (jeito === 1 ? 0.5 : 0);   // de frente pro vencedor
        sc.add(d.c.raiz);
      }
      sc.updateMatrixWorld(true);
      r.render(sc, camF);
      x.drawImage(r.domElement, 0, 0);
    }catch(err){ console.warn('foto da briga (bonecos): '+err.message); }
    finally{ if(r) soltarFoto(r); }
    try{ return cv2.toDataURL('image/jpeg', 0.86); }catch(_){ return null; }
  }

  /* =======================================================
     A FOTO DO POST (pedido do dono, 04/10/2026: "imagens de ações dos
     bonecos da torcida no fundo condizentes com o sentido da postagem…
     no post da resenha, os membros no fundo na casa com piscina. Na
     treta vencida, os membros rivais caídos. Crie também da
     faixa/bandeira tomada com os membros estendendo a faixa de cabeça
     pra baixo"). O mesmo fotógrafo da briga (`fotoDaBriga`): a cena de
     cima, o chão da cena e os bonecos GLB numa pose parada. O que muda
     é o roteiro — `opc.grupos`, cada um com a torcida (cores), quantos
     e o JEITO:
       festa    · torcendo, em duas fileiras (jogo, vitória, caravana)
       resenha  · numa roda, uns sentados no chão, uns de pé conversando
       gaba     · de pé, provocando (quem venceu a treta)
       caido    · no chão, na frente de quem venceu
       protesto · braços pra cima e apontando (cobrança, protesto)
       bonde    · chamando pra briga (o recado da treta)
       faixa    · em fila, os braços pra frente, segurando o pano
     `opc.faixa` (um canvas) vai estendido na frente de quem segura, DE
     CABEÇA PRA BAIXO, na altura do peito. Retrato 4:5 por padrão.
     ======================================================= */
  const JEITOS = {
    festa:   n => Array.from({length:n}, (_, i) => i < 4
               ? {dx:(i - 1.5)*21, dy:6} : {dx:(i - 4 - (Math.min(n, 7) - 5)/2)*21, dy:-10}),
    resenha: n => Array.from({length:n}, (_, i) => { const a = i/n*Math.PI*2 + 0.4;
               return {dx:Math.cos(a)*30, dy:Math.sin(a)*14, olha:-a + Math.PI/2}; }),
    gaba:    n => Array.from({length:n}, (_, i) => ({dx:(i - (n-1)/2)*26, dy:-8})),
    caido:   n => Array.from({length:n}, (_, i) => ({dx:(i - (n-1)/2)*26 + 9, dy:0})),
    protesto:n => Array.from({length:n}, (_, i) => ({dx:((i%3) - 1)*22 + (i >= 3 ? 11 : 0), dy:i >= 3 ? -10 : 6})),
    bonde:   n => Array.from({length:n}, (_, i) => ({dx:(i - (n-1)/2)*21, dy:(i%2 ? -7 : 4)})),
    faixa:   n => Array.from({length:n}, (_, i) => ({dx:(i - (n-1)/2)*19, dy:0}))
  };
  function poseDoJeito(jeito, f, i, sem){
    const p = poseNeutra(), t = 1.3 + i*0.71;
    if(jeito === 'festa'){
      f.varianteForcada = i % 3; f.tGesto = 9;
      f.gesto = [2, 0, 1, 4, 2, 0, 1][i % 7];
      torcer(p, f, t, 0);
    } else if(jeito === 'resenha'){
      if(i % 3 === 0){ f.varianteForcada = i % 2 ? 1 : 2; sentar(p, f, t); p.ombro = [0.2, -0.6]; p.cotovelo = [-0.4, -1.4]; }
      else if(i % 3 === 1) falarEmPe(p, f, t);
      else { f.tGesto = 9; f.gesto = 1; torcer(p, f, t, 0); }
    } else if(jeito === 'gaba' || jeito === 'bonde'){
      f.provoca = {t:0.5, dur:1, tipo: jeito === 'bonde' ? [0, 1, 7][i % 3] : [4, 6, 3, 7, 2][i % 5]};
      provocar(p, f, t, 0);
    } else if(jeito === 'caido'){
      f.jazido = [0, 2, 1][i % 3]; f.jazidoLado = i % 2 ? 1 : -1; f.queda = null;
      cair(p, f, 2);
    } else if(jeito === 'protesto'){
      if(i % 2){ f.provoca = {t:0.5, dur:1, tipo:7}; provocar(p, f, t, 0); }
      else { f.tGesto = 9; f.gesto = 4; torcer(p, f, t, 0); }
    } else if(jeito === 'faixa'){
      parado(p, f, t);
      p.ombro = [-1.25, -1.25]; p.ombroZ = [0.18, 0.18]; p.cotovelo = [-0.35, -0.35]; p.maoZ = [0.2, 0.2]; p.punho = [1, 1];
      p.inclina = -0.04; p.olhaX = -0.1;
    } else parado(p, f, t);
    return p;
  }
  function pontoDoGrupo(A, offs){
    const W = A.W || 1536, H = A.H || 1024;
    const cabe = (x, y) => !A.cabe || offs.every(o => A.cabe(x + o.dx, y + o.dy, 7));
    for(const c of centrosDaPose(A, 'mandante')){
      for(let r = 0; r <= c.raio; r += 14)
        for(let a = 0; a < 360; a += 20){
          const x = c.x + Math.cos(a*Math.PI/180)*r, y = c.y + Math.sin(a*Math.PI/180)*r;
          if(x < 120 || x > W-120 || y < 120 || y > H-120) continue;
          if(cabe(x, y)) return {x, y};
        }
    }
    return {x:W/2, y:H/2};
  }
  function renderizarCena(opc){
    const A = TO.diaJogo.arredores;
    const W = opc.largura || 640, H = opc.altura || 800;
    /* os grupos, um atrás do outro: cada um com o deslocamento dele */
    const pos = [];
    let base = 0;
    for(const g of (opc.grupos || [])){
      const offs = (JEITOS[g.jeito] || JEITOS.festa)(Math.max(1, Math.min(8, g.n || 4)));
      for(let i = 0; i < offs.length; i++) pos.push({g, i, dx:offs[i].dx + (g.dx || 0), dy:offs[i].dy + (g.dy || 0), olha:offs[i].olha});
      base++;
    }
    if(!pos.length) return null;
    const c0 = pontoDoGrupo(A, pos);
    const minX = Math.min(...pos.map(p => p.dx)), maxX = Math.max(...pos.map(p => p.dx));
    const VW = opc.vista || Math.max(94, (maxX - minX) + 46), VH = VW * H / W;
    /* a foto do post vê mais de lado que a da briga: o corpo inteiro, não
       só a cabeça de cima */
    const CIS = opc.cisalha || 0.95;
    /* o grupo um pouco abaixo do meio do quadro: em cima vai o título */
    const cx = U.limitar(c0.x + (minX + maxX)/2, VW/2, (A.W||1536) - VW/2);
    const cy = U.limitar(c0.y - VH*(opc.subir != null ? opc.subir : 0.25), VH/2, (A.H||1024) - VH/2);
    const x0 = cx - VW/2, y0 = cy - VH/2, s = W/VW;

    const cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H;
    const x = cv2.getContext('2d');
    x.save(); x.setTransform(s, 0, 0, s, -x0*s, -y0*s);
    A.desenharFundo(x);
    x.restore();

    const cvB = {width:W, height:H};
    let r = null;
    try{
      r = rendererDaFoto(cvB);
      r.setPixelRatio(1); r.setClearColor(0x000000, 0);
      const sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a48, 0.85));
      const sol = new THREE.DirectionalLight(0xffffff, 0.75); sol.position.set(-0.5, 1, -0.6); sc.add(sol);
      const contra = new THREE.DirectionalLight(0xa0c0ff, 0.25); contra.position.set(0.6, 0.5, 0.8); sc.add(contra);
      const camF = new THREE.OrthographicCamera(x0, x0+VW, -y0, -(y0+VH), 1, ALTURA_CAM*2);
      camF.position.set(0, ALTURA_CAM, 0); camF.up.set(0, 0, -1); camF.lookAt(0, 0, 0);
      camF.updateProjectionMatrix();
      const el = camF.projectionMatrix.elements, a = 2/(camF.top - camF.bottom);
      el[9] += a*CIS; el[13] += a*CIS*ALTURA_CAM;
      camF.projectionMatrixInverse.copy(camF.projectionMatrix).invert();
      sc.add(camF);
      const sem = String(opc.semente || '');
      /* de trás pra frente na tela: quem está mais embaixo cobre quem está em cima */
      for(const q of pos.slice().sort((a2, b2) => a2.dy - b2.dy)){
        const t = q.g.t || {};
        const d = {nome:`${sem}|${q.g.jeito}|${t.id}|${q.i}`, lado:'mandante', torcida:t.id, cor:t.cor, cor2:t.cor2, cor3:t.cor3||null};
        const f = fichaDe(d, q.i); f.escala = 1;
        f.varianteForcada = dado(`${sem}|${q.g.jeito}|var|${q.i}`, 3);
        const c = construirCorpoGLB(f, false);
        if(c.anel) c.anel.visible = false;
        if(c.anelFundo) c.anelFundo.visible = false;
        /* a sombra de pé vista de lado vira um disco escuro no chão: miúda
           e clara, e nenhuma em quem está deitado */
        if(c.sombra){
          if(q.g.jeito === 'caido') c.sombra.visible = false;
          else { c.sombra.scale.set(5, 3, 1); c.sombra.material.opacity = 0.16; }
        }
        const p = poseDoJeito(q.g.jeito, f, q.i, sem);
        aplicarPoseGLB(c, p, f.escala * escalaDeCima * 0.86);
        c.raiz.position.set(c0.x + q.dx, 0, c0.y + q.dy);
        /* de frente pra câmera (que olha de baixo pra cima da tela), com
           um giro de cada um; na roda, pro meio; caído, de lado */
        c.raiz.rotation.y = q.olha != null ? q.olha
          : q.g.jeito === 'caido' ? (q.i % 2 ? 1.2 : -1.9)
          : (dado(`${sem}|gira|${q.i}`, 7) - 3) * 0.12 + (q.g.vira || 0);
        sc.add(c.raiz);
      }
      sc.updateMatrixWorld(true);
      r.render(sc, camF);
      x.drawImage(r.domElement, 0, 0);
      /* a faixa tomada: na frente de quem segura, de cabeça pra baixo */
      const fx = opc.faixa;
      const quem = pos.filter(q => q.g.jeito === 'faixa');
      if(fx && fx.width && quem.length){
        const tela = (wx, wz) => [(wx - x0)*s, (wz - y0)*s];
        const xs = quem.map(q => c0.x + q.dx), zz = c0.y + quem[0].dy;
        const [ax, ay] = tela(Math.min(...xs) - 10, zz), [bx] = tela(Math.max(...xs) + 10, zz);
        /* a altura de um boneco na tela: o corpo sobe com a cisalha */
        const alt = 31 * CIS * s * escalaDeCima;
        const larg = bx - ax;
        const prop = fx.width / fx.height;
        let fw = larg, fh = larg / prop;
        if(fh > alt*0.62){ fh = alt*0.62; fw = fh*prop; }
        const fxc = (ax + bx)/2, fyc = ay - alt*0.42;
        x.save();
        x.translate(fxc, fyc); x.rotate(Math.PI + (dado(`${sem}|tor`, 5) - 2)*0.012);
        x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 8*s/3; x.shadowOffsetY = -3;
        x.drawImage(fx, -fw/2, -fh/2, fw, fh);
        x.restore();
      }
    }catch(err){ console.warn('foto do post (bonecos): '+err.message); }
    finally{ if(r) soltarFoto(r); }
    try{ return cv2.toDataURL('image/jpeg', 0.84); }catch(_){ return null; }
  }
  function fotoDaCena(opc){
    if(typeof THREE === 'undefined') return Promise.resolve(null);
    const P = TO.diaJogo.ponte;
    if(P && P.rodando) return Promise.resolve(null);
    carregarGLB();
    const A = TO.diaJogo.arredores;
    if(!A || !A.usarCena) return Promise.resolve(null);
    const espera = ()=> new Promise(res=>{
      const t0 = Date.now();
      (function v(){
        if(modeloGLB) return res(true);
        if(Date.now()-t0 > 6000) return res(false);
        setTimeout(v, 120);
      })();
    });
    return espera().then(ok=>{
      if(!ok || (P && P.rodando)) return null;
      const antes = A.D && A.D.id;
      const trocou = opc.cena && A.D && A.D.id !== opc.cena;
      if(trocou) A.usarCena(opc.cena);
      const fundo = ()=> new Promise(res=>{
        const t0 = Date.now();
        (function v(){
          if(A.imagemOk || !A.D.imagem || Date.now()-t0 > 2500) return res();
          setTimeout(v, 80);
        })();
      });
      return fundo().then(()=>{
        let url = null;
        try{ url = renderizarCena(opc); }catch(err){ console.warn('foto do post: '+err.message); }
        if(trocou && !(P && P.rodando)) A.usarCena(antes || 'arredores');
        return url;
      });
    });
  }


  /* =======================================================
     MODO CONVIDADO — a cena é de outro desenhista

     No jogo este módulo é dono de tudo: renderizador, câmera, luz
     e cena, desenhando num canvas transparente por cima do 2D. No
     estádio o dono é `estadio3d.js`, que tem sol, mapa de sombra,
     arquibancada e câmera de ombro. Então aqui só se entra na cena
     que já existe e se devolve o atualizador — nenhuma luz,
     nenhuma câmera, nenhum `render`.
     ======================================================= */
  function entrarEm(cenaDoDono, opc){
    opc = opc || {};
    scene = cenaDoDono;
    if(opc.pos) pos = opc.pos;
    if(opc.escala) escalaDeCima = opc.escala;
    sombraDeLuz = !!opc.sombra;
    noQuadroExterno = opc.noQuadro || null;
    rumoDe = opc.rumo || (d => d.rumo);
    rumoDoTabuleiro = opc.rumoDoTabuleiro || ((vx, vy) => Math.atan2(vx, vy));
    escalaDoTabuleiro = opc.escalaDoTabuleiro || (() => 1);
    /* a resolução adaptativa é do canvas de quem é dono do
       renderizador; aqui ela não tem o que ajustar */
    cfg.resolucaoAdaptativa = false;
    for(const m of [matVertices, matVerticesTransp, matCamisaVC, matJunto, matJuntoRosto, ...mats.values()]) remendar(m);
    if(modeloGLB) modeloGLB.traverse(o => { if(o.isMesh) remendar(o.material); });
    if(modeloLonge) modeloLonge.traverse(o => { if(o.isMesh) remendar(o.material); });
    figuras.clear(); projMeshes.clear(); gradeMeshes.clear();
    ativo = true;
    carregarGLB();
    /* o nível de cada boneco sai da câmera de quem é dono dela: `opc.camera`
       e `opc.alturaTela()` (a altura da tela em pixels CSS); sem elas, todo
       mundo no nível de perto */
    const camDono = opc.camera || null, alturaDono = opc.alturaTela || (() => window.innerHeight);
    return {
      atualizar: (J, dt) => {
        camNivel = camDono; alturaNivel = camDono ? alturaDono() : 0;
        if(camDono) camDono.updateMatrixWorld();
        return atualizarCena(J, Math.min(0.05, dt || 0.016));
      },
      /* trocar de cena joga fora as figuras: sem isso o primeiro
         quadro da cena nova acha que todo mundo andou quinhentos
         pixels e a multidão inteira nasce em pose de corrida */
      limpar(){
        for(const [d,fg] of figuras){ scene.remove(fg.corpo.raiz); liberar(fg); figuras.delete(d); }
      },
      get comModelo(){ return !!modeloGLB; },
      get quantas(){ return figuras.size; },
      get conta(){ return conta; },
      get estatMalha(){ return estatMalha; },
      get niveis(){ return niveis(); }
    };
  }
  /* quantos bonecos estão em cada nível, e os triângulos deles */
  function niveis(){
    const r = {perto:0, longe:0, triangulos:0, comLonge: !!modeloLonge};
    for(const fg of figuras.values()){
      const j = fg.corpo.junto;
      if(!j || !fg.corpo.raiz.visible) continue;
      if(fg.corpo.nivel && fg.corpo.nivel.eLonge) r.longe++; else r.perto++;
      r.triangulos += triangulosDe(j.geometry);
    }
    return r;
  }

  /* o contexto deste canvas caiu e não voltou: quem monta troca o canvas (main.js, 02/10/2026) */
  function perdeu(canvas){ return !!(renderer && cv === canvas && !ativo); }

export { montar, desenharDeCima, desenharVitrine, limparDeCima, entrarEm, fotoDoTrofeu, fotoDaBriga, fotoDaCena, perdeu,
         paletaDaCena, anelDe, desenhoDaTorcida, DESENHOS, estudo, cfg };
export const bonecos = {
  get escala(){ return escalaDeCima; }, set escala(v){ escalaDeCima = v; },
  get ativo(){ return ativo; },
  get comModelo(){ return !!modeloGLB; },
  get estatMalha(){ return estatMalha; },
  get niveis(){ return niveis(); },
  get _dbg(){ return {scene, cam, camV, renderer, figuras, modeloGLB}; }
};
