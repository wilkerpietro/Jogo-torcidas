/* =========================================================
   ARREDORES — cena sobre a foto aérea
   ---------------------------------------------------------
   Responsabilidades:
     · carregar e desenhar a imagem de fundo
     · manter a malha de caminhabilidade (asfalto e calçada)
     · resolver colisão de qualquer coisa que anda na cena
     · desenhar as sobreposições (spawns, portões, grades)
     · editor visual (F2) para pintar a malha e mover marcadores

   Nada aqui conhece discos, moral ou briga. Isso é combate.js.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.arredores = (function(){
  const U = TO.util;
  const D = TO.dados.cenaArredores;

  const W = D.largura, H = D.altura, CEL = D.celula;
  const COLS = Math.ceil(W/CEL), ROWS = Math.ceil(H/CEL);

  /* 1 = dá pra pisar. 0 = prédio, muro, canteiro, terreno. */
  const malha = new Uint8Array(COLS*ROWS);

  let imagem=null, imagemOk=false, imagemErro=false;

  /* =======================================================
     MALHA
     ======================================================= */
  function construirMalhaDosPoligonos(){
    malha.fill(0);
    for(let r=0;r<ROWS;r++){
      const y=(r+0.5)*CEL;
      for(let c=0;c<COLS;c++){
        const x=(c+0.5)*CEL;
        let ok=false;
        for(const p of D.poligonos.caminhavel)
          if(U.pontoEmPoligono(x,y,p.pontos)){ok=true;break;}
        if(ok) for(const p of D.poligonos.bloqueio)
          if(U.pontoEmPoligono(x,y,p.pontos)){ok=false;break;}
        malha[r*COLS+c]=ok?1:0;
      }
    }
  }

  function codificarMascara(){
    const linhas=[];
    for(let r=0;r<ROWS;r++){
      const runs=[]; let atual=0, cont=0;
      for(let c=0;c<COLS;c++){
        const v=malha[r*COLS+c];
        if(v===atual) cont++;
        else {runs.push(cont); atual=v; cont=1;}
      }
      runs.push(cont);
      linhas.push(runs.join(','));
    }
    return linhas.join(';');
  }

  function decodificarMascara(txt){
    const linhas=txt.split(';');
    malha.fill(0);
    for(let r=0;r<Math.min(ROWS,linhas.length);r++){
      const runs=linhas[r].split(',').map(Number);
      let c=0, valor=0;
      for(const n of runs){
        for(let k=0;k<n && c<COLS;k++,c++) malha[r*COLS+c]=valor;
        valor = valor?0:1;
      }
    }
  }

  function reconstruir(){
    if(D.mascara) decodificarMascara(D.mascara);
    else construirMalhaDosPoligonos();
    limparCampos();   // a navegação depende da malha
  }

  /* =======================================================
     CONSULTA
     ======================================================= */
  function celulaLivre(c,r){
    if(c<0||r<0||c>=COLS||r>=ROWS) return false;
    return malha[r*COLS+c]===1;
  }
  function caminhavel(x,y){
    return celulaLivre(Math.floor(x/CEL), Math.floor(y/CEL));
  }
  /* o corpo inteiro cabe? amostra o centro e 8 pontos na borda */
  const BUSSOLA=[[1,0],[0.7,0.7],[0,1],[-0.7,0.7],[-1,0],[-0.7,-0.7],[0,-1],[0.7,-0.7]];
  function cabe(x,y,r){
    if(!caminhavel(x,y)) return false;
    for(const [dx,dy] of BUSSOLA)
      if(!caminhavel(x+dx*r, y+dy*r)) return false;
    return true;
  }

  /* célula caminhável mais próxima — usada para destravar quem
     ficou preso dentro de um prédio (spawn mal posto, empurrão) */
  function pontoLivreMaisProximo(x,y,r){
    const c0=Math.floor(x/CEL), r0=Math.floor(y/CEL);
    for(let anel=0; anel<60; anel++){
      for(let dr=-anel; dr<=anel; dr++){
        for(let dc=-anel; dc<=anel; dc++){
          if(Math.max(Math.abs(dr),Math.abs(dc))!==anel) continue;
          const c=c0+dc, rr=r0+dr;
          if(!celulaLivre(c,rr)) continue;
          const px=(c+0.5)*CEL, py=(rr+0.5)*CEL;
          if(r && !cabe(px,py,r)) continue;
          return {x:px,y:py};
        }
      }
    }
    return {x,y};
  }

  /* =======================================================
     COLISÃO
     Move eixo a eixo: bater na parede em X não trava o Y.
     É o que dá a sensação de deslizar pelo meio-fio.
     ======================================================= */
  function mover(ent, dx, dy){
    const r = ent.r||7;

    if(dx){
      const tx=ent.x+dx;
      if(cabe(tx,ent.y,r)) ent.x=tx;
      else if(ent.vx!==undefined) ent.vx*=-0.15;
    }
    if(dy){
      const ty=ent.y+dy;
      if(cabe(ent.x,ty,r)) ent.y=ty;
      else if(ent.vy!==undefined) ent.vy*=-0.15;
    }
    if(!cabe(ent.x,ent.y,r)){
      const p=pontoLivreMaisProximo(ent.x,ent.y,r);
      ent.x=p.x; ent.y=p.y;
      if(ent.vx!==undefined){ent.vx*=0.3; ent.vy*=0.3;}
    }
  }

  /* linha de visada: dois pontos se enxergam sem prédio no meio.
     Serve para mira de projétil e para escolher alvo. */
  function livre(x1,y1,x2,y2){
    const d=U.dist(x1,y1,x2,y2);
    const passos=Math.max(2, Math.ceil(d/(CEL*0.7)));
    for(let i=1;i<passos;i++){
      const t=i/passos;
      if(!caminhavel(x1+(x2-x1)*t, y1+(y2-y1)*t)) return false;
    }
    return true;
  }

  /* =======================================================
     CAMPO DE FLUXO
     BFS a partir de um destino sobre as células caminháveis.
     Cada disco só olha a célula vizinha de menor distância —
     contorna prédio sozinho, sem pathfinding por unidade.
     ======================================================= */
  const VIZ8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],
              [1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]];

  function criarCampo(alvoX, alvoY){
    const dist=new Float32Array(COLS*ROWS).fill(Infinity);
    const p=pontoLivreMaisProximo(alvoX,alvoY,0);
    const c0=Math.floor(p.x/CEL), r0=Math.floor(p.y/CEL);
    if(!celulaLivre(c0,r0)) return {dist, alvo:{x:alvoX,y:alvoY}, passo:()=>({dx:0,dy:0})};

    dist[r0*COLS+c0]=0;
    // fila circular simples; peso 1/1.41 aproximado por Dijkstra em bucket
    let fila=[[c0,r0]];
    while(fila.length){
      const prox=[];
      for(const [c,r] of fila){
        const base=dist[r*COLS+c];
        for(const [dc,dr,peso] of VIZ8){
          const nc=c+dc, nr=r+dr;
          if(!celulaLivre(nc,nr)) continue;
          // não corta quina na diagonal
          if(dc&&dr&&(!celulaLivre(c+dc,r)||!celulaLivre(c,r+dr))) continue;
          const nd=base+peso;
          if(nd<dist[nr*COLS+nc]-0.001){
            dist[nr*COLS+nc]=nd;
            prox.push([nc,nr]);
          }
        }
      }
      fila=prox;
    }

    return {
      dist, alvo:{x:alvoX,y:alvoY},
      /* direção normalizada a seguir a partir de (x,y) */
      passo(x,y){
        const c=Math.floor(x/CEL), r=Math.floor(y/CEL);
        let melhorC=0, melhorR=0, melhor=dist[r*COLS+c];
        if(melhor===undefined||melhor===Infinity){
          const q=pontoLivreMaisProximo(x,y,0);
          const dx=q.x-x, dy=q.y-y, d=Math.hypot(dx,dy)||1;
          return {dx:dx/d, dy:dy/d};
        }
        for(const [dc,dr] of VIZ8){
          const nc=c+dc, nr=r+dr;
          if(!celulaLivre(nc,nr)) continue;
          if(dc&&dr&&(!celulaLivre(c+dc,r)||!celulaLivre(c,r+dr))) continue;
          const v=dist[nr*COLS+nc];
          if(v<melhor){melhor=v;melhorC=dc;melhorR=dr;}
        }
        if(!melhorC&&!melhorR) return {dx:0,dy:0};
        const d=Math.hypot(melhorC,melhorR)||1;
        return {dx:melhorC/d, dy:melhorR/d};
      }
    };
  }

  /* um campo por portão, calculado uma vez */
  const campos={};
  function campoDaEntrada(id){
    if(campos[id]) return campos[id];
    const e=D.entradas.find(x=>x.id===id) || D.entradas[0];
    campos[id]=criarCampo(e.x,e.y);
    return campos[id];
  }
  function limparCampos(){ for(const k of Object.keys(campos)) delete campos[k]; }

  /* =======================================================
     GRADES DE PROTEÇÃO — módulos quebráveis
     ======================================================= */
  function montarGrades(){
    const mods=[];
    for(const g of D.grades){
      const n=g.modulos;
      const vx=g.ate.x-g.de.x, vy=g.ate.y-g.de.y;
      const comp=Math.hypot(vx,vy)||1;
      const meia=(comp/n)/2;
      for(let i=0;i<n;i++){
        const t=(i+0.5)/n;
        mods.push({
          grade:g.id,
          x:g.de.x+vx*t, y:g.de.y+vy*t,
          ux:vx/comp, uy:vy/comp,          // direção da grade
          meia, esp:(g.espessura||10)/2,
          hpMax:1, hp:1, tremor:0          // hp real vem de P.vidaMureta
        });
      }
    }
    return mods;
  }

  /* empurra um corpo para fora de um módulo de grade intacto.
     A grade é uma caixa girada: trabalha no frame local dela
     (ao longo × atravessado) e devolve o resultado pro mundo. */
  function barrarGrades(ent, mods){
    const r=ent.r||7;
    for(const m of mods){
      if(m.hp<=0) continue;

      const dx=ent.x-m.x, dy=ent.y-m.y;
      const ao = dx*m.ux   + dy*m.uy;        // eixo da grade
      const at = dx*(-m.uy)+ dy*m.ux;        // perpendicular

      const lo = U.limitar(ao, -m.meia, m.meia);
      const lt = U.limitar(at, -m.esp,  m.esp);
      const d  = Math.hypot(lo-ao, lt-at);
      if(d>=r) continue;

      if(d<0.01){
        // centro dentro da grade: sai pelo lado perpendicular mais perto
        const sinal = at>=0 ? 1 : -1;
        const fora  = m.esp + r;
        ent.x = m.x + m.ux*lo + (-m.uy)*fora*sinal;
        ent.y = m.y + m.uy*lo + ( m.ux)*fora*sinal;
      } else {
        // ponto mais próximo da caixa, no mundo
        const px = m.x + m.ux*lo + (-m.uy)*lt;
        const py = m.y + m.uy*lo + ( m.ux)*lt;
        const ox = ent.x-px, oy = ent.y-py;
        const od = Math.hypot(ox,oy)||1;
        ent.x = px + ox/od*r;
        ent.y = py + oy/od*r;
      }
      if(ent.vx!==undefined){ent.vx*=0.45; ent.vy*=0.45;}
    }
  }

  /* =======================================================
     DESENHO
     ======================================================= */
  function carregarImagem(){
    imagem=new Image();
    imagem.onload =()=>{imagemOk=true;};
    imagem.onerror=()=>{imagemErro=true;};
    imagem.src=D.imagem;
  }
  /* usada pelo editor quando você arrasta um arquivo na tela */
  function usarImagemLocal(arquivo){
    const url=URL.createObjectURL(arquivo);
    const nova=new Image();
    nova.onload=()=>{imagem=nova;imagemOk=true;imagemErro=false;};
    nova.src=url;
  }

  function desenharFundo(c){
    if(imagemOk){ c.drawImage(imagem,0,0,W,H); return; }

    // sem a foto: desenha a malha para dar pra trabalhar mesmo assim
    c.fillStyle='#14150f'; c.fillRect(0,0,W,H);
    c.fillStyle='#3f3e39';
    for(let r=0;r<ROWS;r++)for(let cx=0;cx<COLS;cx++)
      if(malha[r*COLS+cx]) c.fillRect(cx*CEL,r*CEL,CEL,CEL);
    c.font='600 15px "IBM Plex Mono",monospace';
    c.textAlign='center'; c.fillStyle='#e0b040';
    c.fillText(imagemErro? 'img/cenas/arredores.png não encontrada — usando a malha'
                         : 'carregando fundo…', W/2, 40);
  }

  const COR_LADO={mandante:'#c0392b', visitante:'#2a5fa8'};

  function etiqueta(c,txt,x,y,cor){
    c.font='600 10px "IBM Plex Mono",monospace';
    c.textAlign='center';
    const l=c.measureText(txt).width+10;
    c.fillStyle='#0c0c0bdd'; c.fillRect(x-l/2,y-8,l,15);
    c.strokeStyle=cor; c.lineWidth=1; c.strokeRect(x-l/2,y-8,l,15);
    c.fillStyle=cor; c.fillText(txt,x,y+3);
  }

  function desenharSobreposicoes(c, mods, opc){
    opc=opc||{};

    // ---- spawns
    for(const s of D.spawns){
      const cor=COR_LADO[s.lado]||'#8a6a2a';
      const naBorda = s.x<60?'oeste' : s.x>W-60?'leste' : s.y>H-60?'sul':'norte';
      const vert = naBorda==='oeste'||naBorda==='leste';
      c.fillStyle=cor;
      if(vert) c.fillRect(s.x-5,s.y-38,10,76);
      else     c.fillRect(s.x-38,s.y-5,76,10);
      c.fillStyle='rgba(0,0,0,.35)';
      if(vert) c.fillRect(s.x-5,s.y-38,3,76);
      else     c.fillRect(s.x-38,s.y-5,76,3);
      if(s.jogador){
        c.strokeStyle='#e0b040'; c.lineWidth=2.5;
        c.beginPath(); c.arc(s.x,s.y,24,0,7); c.stroke();
      }
      const ex = naBorda==='oeste'? s.x+78 : naBorda==='leste'? s.x-78 : s.x;
      const ey = naBorda==='sul'  ? s.y-30 : naBorda==='norte'? s.y+30 : s.y;
      etiqueta(c,s.rot,ex,ey,cor);
    }

    // ---- portões
    for(const e of D.entradas){
      c.fillStyle='rgba(70,190,90,.9)';
      c.beginPath(); c.ellipse(e.x,e.y,13,26,0,0,7); c.fill();
      c.strokeStyle='rgba(20,60,25,.8)'; c.lineWidth=2;
      c.beginPath(); c.ellipse(e.x,e.y,13,26,0,0,7); c.stroke();
      etiqueta(c,e.rot,e.x,e.y+46,'#5fd07a');
    }

    // ---- grades de proteção
    for(const m of mods){
      const px=-m.uy, py=m.ux;
      const ax=m.x-m.ux*m.meia, ay=m.y-m.uy*m.meia;
      const bx=m.x+m.ux*m.meia, by=m.y+m.uy*m.meia;
      if(m.hp<=0){
        c.strokeStyle='rgba(120,100,40,.35)'; c.lineWidth=3;
        c.setLineDash([4,6]);
        c.beginPath(); c.moveTo(ax,ay); c.lineTo(bx,by); c.stroke();
        c.setLineDash([]);
        continue;
      }
      const tx=m.tremor?(Math.random()-0.5)*m.tremor:0;
      const ty=m.tremor?(Math.random()-0.5)*m.tremor:0;
      const p=m.hp/m.hpMax;
      c.lineCap='round';
      c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=m.esp*2+3;
      c.beginPath(); c.moveTo(ax+tx+2,ay+ty+2); c.lineTo(bx+tx+2,by+ty+2); c.stroke();
      c.strokeStyle = p>0.6?'#e8b53c' : p>0.3?'#c08a2a' : '#8a5f22';
      c.lineWidth=m.esp*2;
      c.beginPath(); c.moveTo(ax+tx,ay+ty); c.lineTo(bx+tx,by+ty); c.stroke();
      c.lineCap='butt';
      // barrinha de vida do módulo
      c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=3;
      c.beginPath(); c.moveTo(ax+px*10,ay+py*10); c.lineTo(bx+px*10,by+py*10); c.stroke();
      c.strokeStyle = p>0.5?'#5fa87d' : p>0.25?'#c8a03c' : '#b6432f';
      c.beginPath(); c.moveTo(ax+px*10,ay+py*10);
      c.lineTo(ax+(bx-ax)*p+px*10, ay+(by-ay)*p+py*10); c.stroke();
    }

    // ---- malha por cima, só quando pedida
    if(opc.mostrarMalha){
      c.fillStyle='rgba(90,200,255,.20)';
      for(let r=0;r<ROWS;r++)for(let cx=0;cx<COLS;cx++)
        if(malha[r*COLS+cx]) c.fillRect(cx*CEL,r*CEL,CEL,CEL);
      c.fillStyle='rgba(220,60,50,.22)';
      for(let r=0;r<ROWS;r++)for(let cx=0;cx<COLS;cx++)
        if(!malha[r*COLS+cx]) c.fillRect(cx*CEL,r*CEL,CEL,CEL);
    }
    if(opc.mostrarPostos){
      for(const p of D.pmPostos){
        c.fillStyle='rgba(63,125,90,.85)';
        c.beginPath(); c.arc(p.x,p.y,9,0,7); c.fill();
        c.strokeStyle='#0c0c0b'; c.lineWidth=1.5;
        c.beginPath(); c.arc(p.x,p.y,9,0,7); c.stroke();
      }
    }
  }

  /* =======================================================
     API
     ======================================================= */
  reconstruir();
  carregarImagem();

  return {
    D, W, H, CEL, COLS, ROWS, malha,
    reconstruir, construirMalhaDosPoligonos,
    codificarMascara, decodificarMascara,
    caminhavel, cabe, celulaLivre, pontoLivreMaisProximo,
    mover, livre,
    criarCampo, campoDaEntrada, limparCampos,
    montarGrades, barrarGrades,
    desenharFundo, desenharSobreposicoes,
    usarImagemLocal,
    get imagemOk(){return imagemOk;},
    pintar(x,y,raio,valor){
      const c0=Math.floor(x/CEL), r0=Math.floor(y/CEL);
      const n=Math.max(0,Math.round(raio/CEL));
      for(let dr=-n;dr<=n;dr++)for(let dc=-n;dc<=n;dc++){
        if(dc*dc+dr*dr>n*n+n) continue;
        const c=c0+dc, r=r0+dr;
        if(c<0||r<0||c>=COLS||r>=ROWS) continue;
        malha[r*COLS+c]=valor?1:0;
      }
    }
  };
})();
