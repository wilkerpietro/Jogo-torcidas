/* =========================================================
   CENA 3D — renderizador alternativo da cena de dia de jogo
   ---------------------------------------------------------
   Entra no lugar de `combate.desenhar`, e só ali. Não simula
   nada, não decide nada, não guarda estado de jogo: recebe o
   mesmo `J` que o canvas 2D recebe e pinta com three.js.

   TRÊS DECISÕES QUE EXPLICAM O RESTO:

   1. O CHÃO CONTINUA SENDO O DESENHO QUE JÁ EXISTE. A textura
      do chão é `arredores.desenharFundo` assado num canvas
      fora da tela. Serve a foto aérea dos arredores e as cenas
      desenhadas (praça, rua) sem uma linha de arte nova, e sem
      tocar em cenario.js. Se o fundo mudar lá, muda aqui.

   2. A CÂMERA É ORTOGRÁFICA E OLHA DE CIMA. Com inclinação 0
      o enquadramento é o mesmo do canvas 2D, pixel por pixel:
      trocar de renderizador não mexe em nada que o jogador
      aprendeu. A inclinação é opcional e some quando não é
      usada.

   3. O DISCO VIRA GENTE, E É SÓ ISSO QUE MUDA DE VERDADE. Uma
      malha só (`InstancedMesh`) pinta a multidão inteira, com
      sombra no chão. É o que o 2D não dá: passa de umas
      centenas de `arc()` e o quadro cai.

   O QUE NÃO ESTÁ AQUI, de propósito: o editor (F2) e as
   sobreposições de spawn e portão continuam no 2D. Editor é
   ferramenta, não é jogo.

   Depende de `THREE` global. Sem three.js carregado,
   `disponivel()` devolve false e quem chamou fica no 2D.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.cena3d = (function(){
  const A = TO.diaJogo.arredores;
  const W = A.W, H = A.H;

  /* ---------------------------------------------------------
     ALTURA DAS COISAS
     O jogo é de cima: ninguém nunca precisou dizer quanto vale
     um pixel em metro. Se a gente resolvesse agora (14px de
     ombro ≈ 0,5 m, logo 1,75 m ≈ 49px), a multidão viraria uma
     floresta de palitos tampando o chão. Então é cheat mesmo:
     o corpo tem 3,2 raios de altura, que lê como gente vista de
     cima sem esconder a cena.
     --------------------------------------------------------- */
  const ALT_CORPO = 3.2;
  const ALT_GRADE = 26;

  /* altura dos blocos, quando a extrusão está ligada (`opc.blocos`).
     Fica desligada por padrão: de cima, o desenho do cenario.js já
     mostra o telhado, e a caixa por cima só tampa. Serve pra quando
     a câmera inclina. */
  const ALT_BLOCO = {
    poste:90, torre:200, predio:170, igreja:150, sobrado:130,
    'casa-media':110, casa:80, boteco:70, vestiario:70, vitrine:70,
    coreto:70, 'parede-bar':60, quiosque:55, carro:30, muro:26,
    'jardim-alto':26, lixeira:22, engradado:18, mesa:16, banco:14,
    lombada:5
  };

  /* mesmas cores de combate.js — o disco tem duas cores e as duas são
     da torcida. Aqui a primária é o corpo e a secundária é a cabeça,
     que é o que a camisa faz. */
  function corLado(l, claro){
    if(l==='visitante') return claro?'#e8e8e8':'#2a5fa8';
    return claro?'#e8e4dc':'#c0392b';
  }
  const corDisco = (d, claro) => claro ? (d.cor2 || corLado(d.lado, true))
                                       : (d.cor  || corLado(d.lado, false));

  let cv=null, sobre=null, ctxSobre=null, renderer=null, cena=null, camera=null;
  let chao=null, texChao=null, gChao=null, luzSol=null;
  let discos=null, cabecas=null, aneis=null, pms=null, giros=null;
  let pedras=null, blocos=null, grades=null, estouros=[];
  let capDiscos=0, capPM=0, capProj=0, capGrades=0;
  let cenaAssada=null, imagemAssada=false;
  let inclinacao=0, miraInclinacao=0, ultLarg=0, ultAlt=0;
  const d3 = new THREE.Object3D(), cor3 = new THREE.Color();
  const v3 = new THREE.Vector3();

  const disponivel = () => typeof THREE !== 'undefined';
  const ativo = () => !!renderer;

  /* ---------------------------------------------------------
     GEOMETRIA DE GENTE
     Corpo e cabeça costurados numa geometria só: a multidão
     inteira sai numa chamada de desenho.
     --------------------------------------------------------- */
  function costurar(a, b){
    const A1 = a.toNonIndexed(), B1 = b.toNonIndexed();
    const g = new THREE.BufferGeometry();
    for(const nome of ['position','normal']){
      const x = A1.attributes[nome].array, y = B1.attributes[nome].array;
      const j = new Float32Array(x.length + y.length);
      j.set(x,0); j.set(y,x.length);
      g.setAttribute(nome, new THREE.BufferAttribute(j,3));
    }
    return g;
  }

  function geometriaGente(){
    /* unidade: raio 1, altura ALT_CORPO. Quem escala é a instância. */
    const corpo = new THREE.CylinderGeometry(.82,1,ALT_CORPO*.72,7);
    corpo.translate(0, ALT_CORPO*.36, 0);
    const cabeca = new THREE.SphereGeometry(.62,7,5);
    cabeca.translate(0, ALT_CORPO*.85, 0);
    return costurar(corpo, cabeca);
  }

  /* ---------------------------------------------------------
     PARTIDA
     --------------------------------------------------------- */
  function iniciar(canvasGL, canvasSobre){
    if(!disponivel()) return false;
    cv = canvasGL;
    sobre = canvasSobre || null;
    ctxSobre = sobre ? sobre.getContext('2d') : null;

    renderer = new THREE.WebGLRenderer({canvas:cv, antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    cena = new THREE.Scene();
    cena.background = new THREE.Color(0x0e0e0d);

    camera = new THREE.OrthographicCamera(-W/2, W/2, H/2, -H/2, 1, 6000);

    /* Luz de noite de jogo: pouca ambiente, uma direcional forte pra
       cravar a sombra no chão. É a sombra que faz o disco virar gente
       em pé em cima da foto. */
    cena.add(new THREE.HemisphereLight(0x9fb4d0, 0x2b2620, .85));
    luzSol = new THREE.DirectionalLight(0xffe6c4, .95);
    luzSol.position.set(-520, 900, -420);
    luzSol.castShadow = true;
    luzSol.shadow.mapSize.set(2048,2048);
    const s = luzSol.shadow.camera;
    s.left=-W*.62; s.right=W*.62; s.top=H*.75; s.bottom=-H*.75;
    s.near=1; s.far=2600; s.updateProjectionMatrix();
    cena.add(luzSol);

    /* chão */
    gChao = document.createElement('canvas');
    gChao.width = W; gChao.height = H;
    texChao = new THREE.CanvasTexture(gChao);
    texChao.encoding = THREE.sRGBEncoding;
    chao = new THREE.Mesh(
      new THREE.PlaneGeometry(W,H),
      new THREE.MeshLambertMaterial({map:texChao}));
    chao.rotation.x = -Math.PI/2;
    chao.receiveShadow = true;
    cena.add(chao);

    assarChao(true);
    return true;
  }

  function parar(){
    if(!renderer) return;
    renderer.dispose(); renderer = null; cena = null; camera = null;
    chao = discos = pms = pedras = blocos = grades = aneis = giros = null;
    capDiscos = capPM = capProj = capGrades = 0;
    estouros = [];
  }

  /* ---------------------------------------------------------
     CHÃO — assa `desenharFundo` numa textura.
     A foto dos arredores carrega assíncrona: enquanto ela não
     chega, `desenharFundo` pinta a malha. Por isso se assa de
     novo quando a imagem entra.
     --------------------------------------------------------- */
  function assarChao(forcar){
    if(!gChao) return;
    const id = A.D && A.D.id || 'arredores';
    if(!forcar && id === cenaAssada && A.imagemOk === imagemAssada) return;
    const g = gChao.getContext('2d');
    g.setTransform(1,0,0,1,0,0);
    g.clearRect(0,0,W,H);
    A.desenharFundo(g);
    texChao.needsUpdate = true;
    cenaAssada = id; imagemAssada = A.imagemOk;
    montarBlocos();
  }

  /* ---------------------------------------------------------
     BLOCOS — extrusão dos retângulos da cena desenhada.
     Só existe pra cena que tem lista de blocos (praça e rua);
     nos arredores, que é foto, não há o que extrudar.
     --------------------------------------------------------- */
  function montarBlocos(){
    if(blocos){ cena.remove(blocos); blocos.dispose(); blocos = null; }
    const lista = (A.D && A.D.blocos) || [];
    if(!lista.length) return;
    blocos = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1,1,1),
      new THREE.MeshLambertMaterial(), lista.length);
    let i = 0;
    for(const b of lista){
      const alt = ALT_BLOCO[b.tipo] !== undefined ? ALT_BLOCO[b.tipo] : 40;
      d3.position.set(b.x + b.w/2 - W/2, alt/2, b.y + b.h/2 - H/2);
      d3.rotation.set(0,0,0);
      d3.scale.set(b.w, alt, b.h);
      d3.updateMatrix(); blocos.setMatrixAt(i, d3.matrix);
      /* tom de reboco puxado pro tipo — o telhado de verdade está na
         textura do chão, embaixo. Isto aqui é a parede. */
      const t = (b.tipo||'').length;
      blocos.setColorAt(i, cor3.setHSL(.09 + (t%5)*.012, .10, .34 + (t%3)*.05));
      i++;
    }
    blocos.castShadow = true; blocos.receiveShadow = true;
    blocos.frustumCulled = false;
    blocos.visible = false;      // ligado por opc.blocos
    cena.add(blocos);
  }

  /* ---------------------------------------------------------
     MALHAS QUE CRESCEM COM O ESTADO
     --------------------------------------------------------- */
  function garantirDiscos(n){
    if(discos && n <= capDiscos) return;
    if(discos){ cena.remove(discos, aneis); discos.dispose(); aneis.dispose(); }
    capDiscos = Math.max(64, 1 << Math.ceil(Math.log2(n+1)));
    discos = new THREE.InstancedMesh(geometriaGente(),
      new THREE.MeshLambertMaterial(), capDiscos);
    discos.castShadow = true;
    discos.frustumCulled = false;
    /* anel do líder: no 2D é um círculo dourado em volta. Aqui é um
       aro no chão, que é o que se vê de cima. */
    aneis = new THREE.InstancedMesh(
      new THREE.RingGeometry(.86, 1, 20).rotateX(-Math.PI/2),
      new THREE.MeshBasicMaterial({color:0xe0b040, transparent:true, opacity:.9}),
      64);
    aneis.frustumCulled = false;
    cena.add(discos, aneis);
  }

  function garantirPM(n){
    if(pms && n <= capPM) return;
    if(pms){ cena.remove(pms, giros); pms.dispose(); giros.dispose(); }
    capPM = Math.max(16, 1 << Math.ceil(Math.log2(n+1)));
    pms = new THREE.InstancedMesh(geometriaGente(),
      new THREE.MeshLambertMaterial(), capPM);
    pms.castShadow = true; pms.frustumCulled = false;
    giros = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1,1,1),
      new THREE.MeshBasicMaterial(), capPM);
    giros.frustumCulled = false;
    cena.add(pms, giros);
  }

  function garantirProjeteis(n){
    if(pedras && n <= capProj) return;
    if(pedras){ cena.remove(pedras); pedras.dispose(); }
    capProj = Math.max(32, 1 << Math.ceil(Math.log2(n+1)));
    pedras = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1,6,5),
      new THREE.MeshLambertMaterial(), capProj);
    pedras.castShadow = true; pedras.frustumCulled = false;
    cena.add(pedras);
  }

  function garantirGrades(n){
    if(grades && n <= capGrades) return;
    if(grades){ cena.remove(grades); grades.dispose(); }
    capGrades = Math.max(32, 1 << Math.ceil(Math.log2(n+1)));
    grades = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1,1,1),
      new THREE.MeshLambertMaterial(), capGrades);
    grades.castShadow = true; grades.receiveShadow = true;
    grades.frustumCulled = false;
    cena.add(grades);
  }

  const some = (malha, i) => {
    d3.position.set(0,-9999,0); d3.rotation.set(0,0,0); d3.scale.set(.001,.001,.001);
    d3.updateMatrix(); malha.setMatrixAt(i, d3.matrix);
  };

  /* ---------------------------------------------------------
     CÂMERA
     --------------------------------------------------------- */
  function ajustarCamera(){
    const larg = cv.clientWidth || cv.width, alt = cv.clientHeight || cv.height;
    if(larg !== ultLarg || alt !== ultAlt){
      renderer.setSize(larg, alt, false);
      ultLarg = larg; ultAlt = alt;
    }

    /* mesmo encaixe do canvas 2D (ponte.ajustar): a cena inteira cabe,
       centralizada, sem esticar */
    const s = Math.min(larg/W, alt/H);
    const meiaL = larg/(2*s), meiaA = alt/(2*s);
    inclinacao += (miraInclinacao - inclinacao) * .08;
    const inc = inclinacao * Math.PI/180;

    camera.left = -meiaL; camera.right = meiaL;
    /* inclinar já encurta a cena na vertical (ela projeta em cos da
       altura), então o frustum não precisa abrir: abrir só afastava a
       câmera à toa e deixava tarja preta em cima e embaixo. O preço da
       ortográfica inclinada é essa tarja mesmo — quem quiser preencher
       a tela inclinado vai precisar de câmera em perspectiva, e aí
       perde a paridade com o 2D. */
    camera.top = meiaA; camera.bottom = -meiaA;
    camera.updateProjectionMatrix();

    const dist = 2200;
    camera.position.set(0, Math.cos(inc)*dist, Math.sin(inc)*dist);
    camera.up.set(0,0,-1);
    camera.lookAt(0,0,0);
  }

  function inclinar(graus){ miraInclinacao = Math.max(0, Math.min(62, graus)); }
  const inclinacaoAtual = () => miraInclinacao;

  /* ---------------------------------------------------------
     O QUADRO
     Mesma assinatura de combate.desenhar, menos o contexto 2D:
     quem chama já sabe que o destino é outro.
     --------------------------------------------------------- */
  function desenhar(J, opc){
    if(!renderer || !J) return;
    opc = opc || {};
    assarChao(false);
    if(blocos) blocos.visible = !!opc.blocos;
    ajustarCamera();

    /* ---- discos ---- */
    garantirDiscos(J.discos.length);
    let iAnel = 0;
    for(let i=0;i<capDiscos;i++){
      const d = J.discos[i];
      if(!d || d.entrou || d.sumiu){ some(discos, i); continue; }
      const tx = d.tremor ? (Math.random()-.5)*d.tremor : 0;
      const ty = d.tremor ? (Math.random()-.5)*d.tremor : 0;
      const x = d.x + tx - W/2, z = d.y + ty - H/2;

      if(!d.vivo){
        /* caído ou preso: vira vulto no chão. No 2D é uma elipse vazada;
           aqui é o mesmo corpo achatado, que projeta a sombra certa. */
        d3.position.set(x, d.r*.22, z);
        d3.rotation.set(Math.PI/2 * .82, i*.7, 0);
        d3.scale.set(d.r*.95, d.r*.5, d.r*.95);
        d3.updateMatrix(); discos.setMatrixAt(i, d3.matrix);
        cor3.set(d.preso ? '#5fa87d' : corDisco(d,false)).multiplyScalar(.45);
        discos.setColorAt(i, cor3);
        continue;
      }

      const vel = Math.hypot(d.vx||0, d.vy||0);
      const k = vel > 1 ? Math.min(1, vel/90) : 0;
      d3.position.set(x, 0, z);
      /* inclina pra onde anda: é o que dá pressa a quem corre */
      d3.rotation.set((d.vy||0)/90*.16*k, 0, -(d.vx||0)/90*.16*k);
      d3.scale.set(d.r, d.r, d.r);
      d3.updateMatrix(); discos.setMatrixAt(i, d3.matrix);

      /* vida entra na cor: quanto mais apanhou, mais escuro. No 2D isso
         é a barrinha em cima — que continua, na camada de texto. */
      const p = d.hpMax ? Math.max(0, d.hp/d.hpMax) : 1;
      cor3.set(corDisco(d,false)).multiplyScalar(.55 + p*.45);
      if(d.golpe>0) cor3.lerp(new THREE.Color(0xfff0d0), Math.min(.7, d.golpe*5));
      if(d.atordoado>0) cor3.multiplyScalar(.7);
      discos.setColorAt(i, cor3);

      if(d.lider && iAnel < 64){
        d3.position.set(x, 1.5, z);
        d3.rotation.set(0,0,0);
        d3.scale.set(d.r+4, 1, d.r+4);
        d3.updateMatrix(); aneis.setMatrixAt(iAnel++, d3.matrix);
      }
    }
    for(let i=iAnel;i<64;i++) some(aneis, i);
    discos.instanceMatrix.needsUpdate = true;
    if(discos.instanceColor) discos.instanceColor.needsUpdate = true;
    aneis.instanceMatrix.needsUpdate = true;

    /* ---- polícia ---- */
    garantirPM(J.policiais.length);
    for(let i=0;i<capPM;i++){
      const p = J.policiais[i];
      if(!p){ some(pms,i); some(giros,i); continue; }
      const x = p.x - W/2, z = p.y - H/2;
      if(!p.vivo){
        d3.position.set(x, p.r*.2, z);
        d3.rotation.set(Math.PI/2*.82, 0, 0);
        d3.scale.set(p.r*.9, p.r*.45, p.r*.9);
        d3.updateMatrix(); pms.setMatrixAt(i, d3.matrix);
        pms.setColorAt(i, cor3.set(0x16281e));
        some(giros, i);
        continue;
      }
      d3.position.set(x, 0, z);
      d3.rotation.set(0,0,0);
      d3.scale.set(p.r, p.r, p.r);
      d3.updateMatrix(); pms.setMatrixAt(i, d3.matrix);
      pms.setColorAt(i, cor3.set(p.carga ? 0x2c5c44 : 0x1e3a2c));
      /* giroflex: pisca vermelho e azul, como no 2D */
      const b = (Math.sin(J.t*6 + p.giro)+1)/2;
      d3.position.set(x, ALT_CORPO*p.r*.98, z);
      d3.scale.set(p.r*1.5, p.r*.34, p.r*.8);
      d3.updateMatrix(); giros.setMatrixAt(i, d3.matrix);
      giros.setColorAt(i, cor3.set(b>.5 ? 0xdc4638 : 0x508ceb));
    }
    pms.instanceMatrix.needsUpdate = true; if(pms.instanceColor) pms.instanceColor.needsUpdate = true;
    giros.instanceMatrix.needsUpdate = true; if(giros.instanceColor) giros.instanceColor.needsUpdate = true;

    /* ---- grades ---- */
    garantirGrades(J.grades.length);
    for(let i=0;i<capGrades;i++){
      const m = J.grades[i];
      if(!m || m.hp<=0){ some(grades,i); continue; }
      const tr = m.tremor ? (Math.random()-.5)*m.tremor : 0;
      d3.position.set(m.x+tr - W/2, ALT_GRADE/2, m.y - H/2);
      /* a caixa deita no eixo da grade: +X local vira (ux, uy) do mundo */
      d3.rotation.set(0, Math.atan2(-m.uy, m.ux), 0);
      d3.scale.set(m.meia*2, ALT_GRADE, m.esp*2);
      d3.updateMatrix(); grades.setMatrixAt(i, d3.matrix);
      const p = m.hpMax ? Math.max(0, m.hp/m.hpMax) : 1;
      grades.setColorAt(i, cor3.set(m.tipo==='fila' ? 0x9aa2a8 : 0x6f7a80)
                                .multiplyScalar(.45 + p*.55));
    }
    grades.instanceMatrix.needsUpdate = true; if(grades.instanceColor) grades.instanceColor.needsUpdate = true;

    /* ---- projéteis: no 2D o arco é fingido com um deslocamento em y.
            aqui ele é altura de verdade. ---- */
    garantirProjeteis(J.projeteis.length);
    let iEstouro = 0;
    for(let i=0;i<capProj;i++){
      const p = J.projeteis[i];
      if(!p || p.morto){ some(pedras,i); continue; }
      const alt = Math.sin((p.t/p.dur)*Math.PI)*36;
      d3.position.set(p.x - W/2, 4 + alt, p.y - H/2);
      d3.rotation.set(0,0,0);
      const r = p.tipo==='pedra' ? 5 : 7;
      d3.scale.set(r,r,r);
      d3.updateMatrix(); pedras.setMatrixAt(i, d3.matrix);
      pedras.setColorAt(i, cor3.set(p.tipo==='pedra' ? 0x8d8880 : 0xc8562f));
    }
    pedras.instanceMatrix.needsUpdate = true; if(pedras.instanceColor) pedras.instanceColor.needsUpdate = true;

    /* estouro de bomba: anel no chão que abre e apaga */
    for(const p of J.projeteis){
      if(p.morto && p.explosao!==undefined && iEstouro < 8){
        const k = p.explosao/0.45;
        const m = pegarEstouro(iEstouro++);
        m.visible = true;
        m.position.set(p.x - W/2, 2, p.y - H/2);
        const raio = 20 + k*76;
        m.scale.set(raio, 1, raio);
        m.material.opacity = Math.max(0, 1-k);
      }
    }
    for(let i=iEstouro;i<estouros.length;i++) estouros[i].visible = false;

    renderer.render(cena, camera);
    if(ctxSobre) pintarSobre(J);
  }

  function pegarEstouro(i){
    if(!estouros[i]){
      const m = new THREE.Mesh(
        new THREE.RingGeometry(.86, 1, 28).rotateX(-Math.PI/2),
        new THREE.MeshBasicMaterial({color:0xe28c3c, transparent:true,
                                     opacity:.9, side:THREE.DoubleSide}));
      m.frustumCulled = false;
      estouros[i] = m; cena.add(m);
    }
    return estouros[i];
  }

  /* ---------------------------------------------------------
     CAMADA DE TEXTO
     Barra de vida e nome do líder não viram geometria: viram
     canvas 2D transparente por cima, projetado pela mesma
     câmera. É o que sobrevive a qualquer inclinação sem virar
     placa girando no meio da briga.
     --------------------------------------------------------- */
  function pintarSobre(J){
    const larg = sobre.clientWidth, alt = sobre.clientHeight;
    if(sobre.width !== larg || sobre.height !== alt){ sobre.width = larg; sobre.height = alt; }
    const c = ctxSobre;
    c.clearRect(0,0,larg,alt);
    c.textAlign = 'center';
    c.font = '600 10px "IBM Plex Mono",monospace';

    for(const d of J.discos){
      if(!d.vivo || d.entrou || d.sumiu) continue;
      const mostraVida = d.hp < d.hpMax;
      if(!mostraVida && !d.lider) continue;
      v3.set(d.x - W/2, ALT_CORPO*d.r, d.y - H/2).project(camera);
      if(v3.z > 1) continue;
      const sx = (v3.x*.5+.5)*larg, sy = (-v3.y*.5+.5)*alt;

      if(mostraVida){
        const p = Math.max(0, d.hp/d.hpMax), w = d.r*2;
        c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(sx-w/2, sy-6, w, 3);
        c.fillStyle = p>.5?'#6a9c4a' : p>.25?'#c8a03c' : '#b6432f';
        c.fillRect(sx-w/2, sy-6, w*p, 3);
      }
      if(d.lider){
        c.fillStyle = 'rgba(0,0,0,.75)'; c.fillText(d.nome, sx+1, sy-10);
        c.fillStyle = '#e0b040';         c.fillText(d.nome, sx, sy-11);
      }
    }
  }

  return {disponivel, ativo, iniciar, parar, desenhar,
          assarChao, inclinar, inclinacaoAtual,
          get renderer(){return renderer;},
          get camera(){return camera;}};
})();
