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
  /* A cena dos arredores é a padrão; praça e rua entram por usarCena().
     Todas têm o mesmo tamanho de tela e a mesma célula, então a malha e
     todo o resto do combate não precisam saber qual está no ar. */
  let D = TO.dados.cenaArredores;

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
    construirMalhaCorpo();   // onde o corpo cabe, base das rotas
    limparCampos();          // a navegação depende da malha
    fugas = acharFugas();    // por onde se some, quando se corre
  }

  /* =======================================================
     POR ONDE SE SOME
     Quem debanda corre até sair da tela, e sair da tela é
     chegar numa boca de rua. Estas não se marcam à mão: são
     lidas da própria malha, e por isso caem sempre em cima de
     rua — chão que encosta na borda da área andável é boca de
     rua, por construção.

     A borda usada é a da MANCHA, não a da imagem: foto 16:9
     entra numa tela 3:2 com faixa de quintal em cima e embaixo,
     então a linha 0 nunca é chão e as transversais que sobem
     pro topo ficariam de fora.
     ======================================================= */
  let fugas = [];
  function acharFugas(){
    let c0 = COLS, c1 = -1, r0 = ROWS, r1 = -1;
    for(let r=0; r<ROWS; r++) for(let c=0; c<COLS; c++){
      if(malha[r*COLS+c] !== 1) continue;
      if(c<c0) c0=c; if(c>c1) c1=c;
      if(r<r0) r0=r; if(r>r1) r1=r;
    }
    if(c1<0) return [];

    /* corridas contínuas de chão em cada uma das quatro linhas de borda */
    const achados = [];
    const varrer = (n, pega, dentro)=>{
      let ini = -1;
      for(let i=0; i<=n; i++){
        const tem = i<n && pega(i);
        if(tem && ini<0) ini = i;
        else if(!tem && ini>=0){
          if(i-ini >= 3) achados.push(dentro((ini+i-1)/2));   // 24 px de vão
          ini = -1;
        }
      }
    };
    const livreEm = (c,r)=> malha[r*COLS+c] === 1;
    varrer(COLS, c=>livreEm(c,r0), c=>({x:(c+0.5)*CEL, y:(r0+1.5)*CEL}));
    varrer(COLS, c=>livreEm(c,r1), c=>({x:(c+0.5)*CEL, y:(r1-0.5)*CEL}));
    varrer(ROWS, r=>livreEm(c0,r), r=>({x:(c0+1.5)*CEL, y:(r+0.5)*CEL}));
    varrer(ROWS, r=>livreEm(c1,r), r=>({x:(c1-0.5)*CEL, y:(r+0.5)*CEL}));

    /* o ponto tem de ser pisável de verdade, não a beirada da célula */
    return achados.map(p=>{
      const q = cabe(p.x, p.y, 9) ? p : pontoLivreMaisProximo(p.x, p.y, 9);
      return {x:Math.round(q.x), y:Math.round(q.y), raio:34};
    });
  }
  /* a mais perto de quem está correndo */
  function fugaMaisPerto(x, y){
    let melhor=null, md=Infinity;
    for(const f of fugas){
      const d=(f.x-x)*(f.x-x)+(f.y-y)*(f.y-y);
      if(d<md){md=d; melhor=f;}
    }
    return melhor;
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
          if(r && !livrePara(px,py,Math.min(r,CEL*0.62))) continue;
          return {x:px,y:py};
        }
      }
    }
    return {x,y};
  }

  /* =======================================================
     COLISÃO

     O raio usado contra a malha é menor que o raio de desenho.
     Com o raio cheio, um disco encostado no meio-fio não encontra
     NENHUMA posição vizinha válida e trava parado na borda — que
     era o bug. Contra a malha ele é mais magro; entre discos, o
     raio cheio continua valendo (separar()).
     ======================================================= */
  const raioMalha = r => Math.min(r||7, CEL*0.62);

  function livrePara(x,y,r){
    if(!caminhavel(x,y)) return false;
    for(const [dx,dy] of BUSSOLA)
      if(!caminhavel(x+dx*r, y+dy*r)) return false;
    return true;
  }

  /* Tenta um deslocamento; devolve se andou. */
  function tentar(ent,dx,dy,r){
    const nx=ent.x+dx, ny=ent.y+dy;
    if(!livrePara(nx,ny,r)) return false;
    ent.x=nx; ent.y=ny; return true;
  }

  /* Escada de tentativas: reto, depois deslizando pelo eixo livre,
     depois em diagonal contornando a quina. Só desiste no fim. */
  const GIROS=[Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2];
  function mover(ent, dx, dy){
    if(!dx && !dy) return true;
    const r=raioMalha(ent.r);

    if(tentar(ent,dx,dy,r)) return true;
    // desliza pelo meio-fio: um eixo trava, o outro passa
    const soX = dx && tentar(ent,dx,0,r);
    const soY = !soX && dy && tentar(ent,0,dy,r);
    if(soX||soY) return true;
    // contorna a quina: mesma velocidade, direção girada
    const m=Math.hypot(dx,dy);
    if(m>0.01){
      for(const a of GIROS){
        const cs=Math.cos(a), sn=Math.sin(a);
        if(tentar(ent, dx*cs-dy*sn, dx*sn+dy*cs, r)) return true;
      }
    }
    // encurralado de verdade
    if(ent.vx!==undefined){ent.vx*=0.2; ent.vy*=0.2;}
    if(!livrePara(ent.x,ent.y,r)){
      const p=pontoLivreMaisProximo(ent.x,ent.y,r);
      ent.x=p.x; ent.y=p.y;
    }
    return false;
  }

  /* Empurrão de separação: só reto ou pelo eixo livre, nunca girando.
     Usar o mover completo aqui faz o disco encostado na parede deslizar
     de lado a cada empurrãozinho, e a aglomeração nunca assenta. */
  function empurrar(ent,dx,dy){
    const r=raioMalha(ent.r);
    if(tentar(ent,dx,dy,r)) return true;
    if(dx && tentar(ent,dx,0,r)) return true;
    if(dy && tentar(ent,0,dy,r)) return true;
    return false;
  }

  /* Um segmento cruza alguma grade em pé? Serve pra PM não
     tentar perseguir quem está do outro lado da barreira. */
  function atravessaGrade(x1,y1,x2,y2,mods){
    if(!mods) return false;
    const passos=Math.max(2,Math.ceil(U.dist(x1,y1,x2,y2)/6));
    for(const m of mods){
      if(m.hp<=0) continue;
      for(let i=0;i<=passos;i++){
        const t=i/passos, x=x1+(x2-x1)*t, y=y1+(y2-y1)*t;
        const ao=Math.abs((x-m.x)*m.ux + (y-m.y)*m.uy);
        const at=Math.abs((x-m.x)*(-m.uy) + (y-m.y)*m.ux);
        if(ao<=m.meia && at<=m.esp+2) return true;
      }
    }
    return false;
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

  /* Grade em pé é PAREDE no cálculo de rota, não caminho caro.
     Com custo, a volta longa às vezes sai mais cara que atravessar,
     o campo mandava passar por dentro, e o disco empacava encostado
     nela pra sempre. Como parede, ele dá a volta sempre que existir
     volta — e quando não existir, o campo devolve 'sem rota' e quem
     decide é o combate: aí sim vai pra cima da grade. */
  function celulasDeGrades(mods){
    const bloq=new Uint8Array(COLS*ROWS);
    if(!mods) return bloq;
    for(const m of mods){
      if(m.hp<=0) continue;
      const alcance=m.meia+m.esp+8;
      const c0=Math.max(0,Math.floor((m.x-alcance)/CEL));
      const c1=Math.min(COLS-1,Math.floor((m.x+alcance)/CEL));
      const r0=Math.max(0,Math.floor((m.y-alcance)/CEL));
      const r1=Math.min(ROWS-1,Math.floor((m.y+alcance)/CEL));
      for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){
        const x=(c+0.5)*CEL-m.x, y=(r+0.5)*CEL-m.y;
        const ao=Math.abs(x*m.ux + y*m.uy);
        const at=Math.abs(x*(-m.uy) + y*m.ux);
        if(ao<=m.meia+2 && at<=m.esp+4) bloq[r*COLS+c]=1;
      }
    }
    return bloq;
  }

  /* Células onde o CORPO cabe, não só onde o pé pisa.
     A rota tem que ser calculada sobre isto: se o campo aponta pra uma
     célula de asfalto onde o disco não cabe, ele fica a vida inteira
     empurrando o meio-fio, apontando pra uma direção impossível.
     Recalculada junto com a malha. */
  const malhaCorpo=new Uint8Array(COLS*ROWS);
  function construirMalhaCorpo(){
    const r=raioMalha(7);
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)
      malhaCorpo[y*COLS+x]=livrePara((x+0.5)*CEL,(y+0.5)*CEL,r)?1:0;
  }
  const cabeCorpo=(c,r)=>
    !(c<0||r<0||c>=COLS||r>=ROWS) && malhaCorpo[r*COLS+c]===1;

  function criarCampo(alvoX, alvoY, bloq){
    const dist=new Float32Array(COLS*ROWS).fill(Infinity);
    const passavel=(c,r)=>{
      if(!cabeCorpo(c,r)) return false;
      return !(bloq && bloq[r*COLS+c]);
    };
    /* O destino tem que nascer numa célula onde o corpo caiba. Um portão
       encostado no muro do estádio cai numa célula pisável mas apertada;
       semear ali fazia o campo nascer vazio e TODO mundo receber
       'sem rota' — e ir bater na grade em vez de entrar. */
    let c0=-1, r0=-1;
    {
      const ci=Math.floor(alvoX/CEL), ri=Math.floor(alvoY/CEL);
      let md=Infinity;
      for(let dr=-6;dr<=6;dr++)for(let dc=-6;dc<=6;dc++){
        const c=ci+dc, r=ri+dr;
        if(!passavel(c,r)) continue;
        const q=dc*dc+dr*dr;
        if(q<md){md=q; c0=c; r0=r;}
      }
    }
    const vazio={dist, alvo:{x:alvoX,y:alvoY},
                 passo:()=>({dx:0,dy:0,semRota:true})};
    if(c0<0) return vazio;

    dist[r0*COLS+c0]=0;
    let fila=[[c0,r0]];
    while(fila.length){
      const prox=[];
      for(const [c,r] of fila){
        const base=dist[r*COLS+c];
        for(const [dc,dr,peso] of VIZ8){
          const nc=c+dc, nr=r+dr;
          if(!passavel(nc,nr)) continue;
          // não corta quina na diagonal
          if(dc&&dr&&(!passavel(c+dc,r)||!passavel(c,r+dr))) continue;
          const i=nr*COLS+nc;
          const nd=base+peso;
          if(nd<dist[i]-0.001){ dist[i]=nd; prox.push([nc,nr]); }
        }
      }
      fila=prox;
    }

    return {
      dist, alvo:{x:alvoX,y:alvoY},
      /* direção a seguir. semRota:true = não há caminho daqui até o
         destino sem derrubar alguma coisa. */
      passo(x,y){
        const c=Math.floor(x/CEL), r=Math.floor(y/CEL);
        if(c<0||r<0||c>=COLS||r>=ROWS) return {dx:0,dy:0,semRota:true};
        let melhor=dist[r*COLS+c];

        // encostado na grade: procura a célula útil mais perto e vai nela
        if(melhor===undefined||melhor===Infinity){
          let alvo=null, md=Infinity;
          for(let dr=-3;dr<=3;dr++)for(let dc=-3;dc<=3;dc++){
            const nc=c+dc, nr=r+dr;
            if(nc<0||nr<0||nc>=COLS||nr>=ROWS) continue;
            const v=dist[nr*COLS+nc];
            if(v===Infinity) continue;
            const q=dc*dc+dr*dr;
            if(v+q*0.5<md){md=v+q*0.5; alvo=[dc,dr];}
          }
          if(!alvo) return {dx:0,dy:0,semRota:true};
          const d=Math.hypot(alvo[0],alvo[1])||1;
          return {dx:alvo[0]/d, dy:alvo[1]/d};
        }

        let melhorC=0, melhorR=0;
        for(const [dc,dr] of VIZ8){
          const nc=c+dc, nr=r+dr;
          if(!passavel(nc,nr)) continue;
          if(dc&&dr&&(!passavel(c+dc,r)||!passavel(c,r+dr))) continue;
          const v=dist[nr*COLS+nc];
          if(v<melhor){melhor=v;melhorC=dc;melhorR=dr;}
        }
        if(!melhorC&&!melhorR) return {dx:0,dy:0};
        const d=Math.hypot(melhorC,melhorR)||1;
        return {dx:melhorC/d, dy:melhorR/d};
      }
    };
  }

  /* Um campo por portão. Recalcula quando a malha muda (editor) ou
     quando uma grade cai — a rota barata passa a ser outra. */
  const campos={};
  let versaoGrades=-1, custoAtual=null;

  function campoDaEntrada(id, mods, versao){
    if(versao!==undefined && versao!==versaoGrades){
      versaoGrades=versao; custoAtual=celulasDeGrades(mods);
      for(const k of Object.keys(campos)) delete campos[k];
    }
    if(campos[id]) return campos[id];
    const e=D.entradas.find(x=>x.id===id) || D.entradas[0];
    campos[id]=criarCampo(e.x, e.y, custoAtual);
    return campos[id];
  }
  function limparCampos(){
    for(const k of Object.keys(campos)) delete campos[k];
    versaoGrades=-1; custoAtual=null;
  }

  /* =======================================================
     GRADES DE PROTEÇÃO — módulos quebráveis
     ======================================================= */
  function montarGrades(){
    const mods=[];

    /* grades de organizar fila: polilinha fatiada em módulos, sólidas
       e inquebráveis. Entram na mesma lista das outras porque colisão,
       rota e desenho já sabem lidar com módulo — muda só o tipo. */
    for(const f of D.filas||[]){
      const pts=f.pontos;
      for(let i=1;i<pts.length;i++){
        const ax=pts[i-1][0], ay=pts[i-1][1], bx=pts[i][0], by=pts[i][1];
        const vx=bx-ax, vy=by-ay, comp=Math.hypot(vx,vy)||1;
        const n=Math.max(1,Math.round(comp/22));
        const meia=(comp/n)/2;
        for(let k=0;k<n;k++){
          const t=(k+0.5)/n;
          mods.push({
            grade:f.id, tipo:'fila',
            x:ax+vx*t, y:ay+vy*t,
            ux:vx/comp, uy:vy/comp,
            meia, esp:(f.espessura||9)/2,
            hpMax:1, hp:1, tremor:0
          });
        }
      }
    }

    for(const g of D.grades){
      const n=g.modulos;
      const vx=g.ate.x-g.de.x, vy=g.ate.y-g.de.y;
      const comp=Math.hypot(vx,vy)||1;
      const meia=(comp/n)/2;
      for(let i=0;i<n;i++){
        const t=(i+0.5)/n;
        mods.push({
          grade:g.id, tipo:'cordao',
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
    if(!D.imagem) return;
    imagem=new Image();
    imagem.onload =()=>{imagemOk=true;};
    imagem.onerror=()=>{imagemErro=true;};
    imagem.src=D.imagem;
  }
  /* Troca a cena no ar. O combate chama isto antes de montar: encontro na
     rua abre a rua, encontro na praça abre a praça, e o resto do dia de
     jogo continua nos arredores. */
  function usarCena(id){
    const nova = (id && id !== 'arredores' && TO.dados.cenas)
      ? TO.dados.cenas[id] : TO.dados.cenaArredores;
    if(!nova || nova === D) { reconstruir(); return D; }
    D = nova;
    imagem = null; imagemOk = false; imagemErro = false;
    if(D.imagem) carregarImagem();
    reconstruir();
    return D;
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
    /* cena desenhada: praça e rua se pintam sozinhas */
    if(TO.diaJogo.cenario && TO.diaJogo.cenario.pintar(c, D, W, H)) return;

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
  const COR_RGB ={mandante:'192,57,43', visitante:'42,95,168'};

  /* Portão. Em jogo é só a barra no chão, atravessada no sentido de
     entrada — a foto já diz que ali é portão, o resto era enfeite.
     No editor ganha alcance, etiqueta e alça, que aí servem pra
     posicionar. */
  function desenharPortao(c,e,t,editor){
    const cor=COR_LADO[e.lado]||'#8a6a2a';
    const rgb=COR_RGB[e.lado]||'138,106,42';
    const d=e.dir||[0,-1];
    const larg=21;

    c.save();
    c.translate(e.x,e.y);

    if(editor){
      const pulso=(Math.sin(t*2.2)+1)/2;
      c.strokeStyle=`rgba(${rgb},${.18+pulso*.14})`;
      c.lineWidth=1.4; c.setLineDash([4,7]);
      c.beginPath(); c.arc(0,0,e.raio||34,0,7); c.stroke(); c.setLineDash([]);
    }

    c.rotate(Math.atan2(d[1],d[0]));
    c.fillStyle='rgba(0,0,0,.45)'; c.fillRect(-3,-larg+2,6,larg*2);
    c.fillStyle=cor;               c.fillRect(-4,-larg,7,larg*2);
    c.restore();

    if(editor) etiqueta(c, e.rot, e.x-d[0]*52, e.y-d[1]*52, cor);
  }

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

    /* ---- spawns: invisíveis em jogo. São ponto de partida, não
       informação que o jogador precise ver a noite toda. Só o editor
       mostra, porque lá é preciso enxergar pra arrastar. */
    if(opc.editor) for(const s of D.spawns){
      const cor=COR_LADO[s.lado]||'#8a6a2a';
      const rgb=COR_RGB[s.lado]||'138,106,42';
      const naBorda = s.x<60?'oeste' : s.x>W-60?'leste' : s.y>H-60?'sul':'norte';
      const vert = naBorda==='oeste'||naBorda==='leste';
      const x0 = vert ? s.x-7 : s.x-40, y0 = vert ? s.y-40 : s.y-7;
      const lg = vert ? 14 : 80,        al = vert ? 80 : 14;

      c.fillStyle=`rgba(${rgb},.20)`;  c.fillRect(x0,y0,lg,al);
      c.strokeStyle=`rgba(${rgb},.75)`; c.lineWidth=1.5;
      c.setLineDash([5,4]); c.strokeRect(x0+.5,y0+.5,lg-1,al-1); c.setLineDash([]);
      // ponta cheia encostada na borda, pra ler de onde vem
      c.fillStyle=`rgba(${rgb},.85)`;
      if(vert) c.fillRect(naBorda==='oeste'?x0:x0+lg-3, y0, 3, al);
      else     c.fillRect(x0, naBorda==='sul'?y0+al-3:y0, lg, 3);

      if(s.jogador){
        c.strokeStyle='rgba(224,176,64,.9)'; c.lineWidth=2;
        c.setLineDash([3,4]);
        c.beginPath(); c.arc(s.x,s.y,26,0,7); c.stroke(); c.setLineDash([]);
      }
      const ex = naBorda==='oeste'? s.x+80 : naBorda==='leste'? s.x-80 : s.x;
      const ey = naBorda==='sul'  ? s.y-32 : naBorda==='norte'? s.y+32 : s.y;
      etiqueta(c,s.rot,ex,ey,cor);
    }

    // ---- portões
    for(const e of D.entradas) desenharPortao(c,e,opc.t||0,opc.editor);

    // ---- grades
    for(const m of mods){
      const px=-m.uy, py=m.ux;
      const ax=m.x-m.ux*m.meia, ay=m.y-m.uy*m.meia;
      const bx=m.x+m.ux*m.meia, by=m.y+m.uy*m.meia;

      // grade de organizar fila: aço, sem barra de vida, não quebra
      if(m.tipo==='fila'){
        c.lineCap='round';
        c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=m.esp*2+3;
        c.beginPath(); c.moveTo(ax+2,ay+3); c.lineTo(bx+2,by+3); c.stroke();
        c.strokeStyle='#9aa0a6'; c.lineWidth=m.esp*2;
        c.beginPath(); c.moveTo(ax,ay); c.lineTo(bx,by); c.stroke();
        c.strokeStyle='rgba(235,240,245,.55)'; c.lineWidth=1.6;
        c.beginPath(); c.moveTo(ax,ay); c.lineTo(bx,by); c.stroke();
        c.lineCap='butt';
        continue;
      }

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
    get D(){return D;}, W, H, CEL, COLS, ROWS, malha, usarCena,
    reconstruir, construirMalhaDosPoligonos,
    codificarMascara, decodificarMascara,
    caminhavel, cabe, celulaLivre, cabeCorpo, pontoLivreMaisProximo,
    get fugas(){return fugas;}, fugaMaisPerto,
    mover, empurrar, livre, livrePara, raioMalha, atravessaGrade,
    criarCampo, campoDaEntrada, limparCampos, celulasDeGrades,
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
      construirMalhaCorpo();
    }
  };
})();
