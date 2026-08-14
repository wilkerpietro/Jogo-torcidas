/* =========================================================
   RUAS — a cidade em movimento (GDD §10 e §13)
   ---------------------------------------------------------
   O mapa deixa de ser planta e vira cidade: em dia de jogo os
   bondes saem da sede e da subsede, a torcida visitante entra
   pela rodovia e todo mundo anda pelas ruas até o estádio.

   A malha não é só avenida. Cada bairro tem as ruas internas
   entre os quarteirões e o beco no meio de cada quarteirão,
   entre as duas fileiras de lotes — é por ali que o bonde
   corta caminho e é ali que a emboscada acontece.

   Quando dois bondes hostis se encostam, o relógio para. O
   resto é com a cena de briga.
   ========================================================= */
window.TO = window.TO || {};

TO.ruas = (function(){
  const U = TO.util;
  const MP = () => TO.mapa;
  const M  = () => TO.mundo;

  /* =======================================================
     A MALHA
     Construída da própria geometria do mapa, então rua e
     desenho nunca saem de sincronia.
     ======================================================= */
  const TOL = 0.6;          // dois nós na mesma linha
  const VIZINHO = 26;       // alcance pra costurar nós vizinhos

  function malha(mo){
    if(mo._malha) return mo._malha;
    /* cidade desenhada: a malha já veio dos pixels da arte, uma célula por
       pedaço de rua. Só falta amarrar os vizinhos. */
    if(mo.arte) return (mo._malha = malhaDaArte(mo));
    const nos = [];
    const chave = new Map();
    const põe = (x, y, tipo)=>{
      const k = `${Math.round(x*2)}|${Math.round(y*2)}`;
      let n = chave.get(k);
      if(n){ if(tipo === 'beco') n.beco = true; return n; }
      n = {i:nos.length, x, y, viz:[], beco: tipo === 'beco'};
      nos.push(n); chave.set(k, n);
      return n;
    };
    const liga = (a, b)=>{
      if(a === b) return;
      const d = Math.hypot(b.x-a.x, b.y-a.y);
      if(!a.viz.some(v=>v.n === b)) a.viz.push({n:b, d});
      if(!b.viz.some(v=>v.n === a)) b.viz.push({n:a, d});
    };

    const P = MP().PAD, AV = MP().AVENIDA;
    for(const cel of mo.celulas){
      const pad = 5, g = 5;
      const iX = cel.x + pad, iY = cel.y + pad;
      const bw = (cel.w - pad*2 - g*2)/3, bh = (cel.h - pad*2 - g*3)/4;

      /* ruas verticais: as duas bordas do bairro e as duas internas */
      const vx = [cel.x, iX + (bw+g) - g/2, iX + 2*(bw+g) - g/2, cel.x + cel.w];
      /* ruas horizontais: bordas e as três internas */
      const hy = [cel.y, iY + (bh+g) - g/2, iY + 2*(bh+g) - g/2,
                         iY + 3*(bh+g) - g/2, cel.y + cel.h];

      const grade = vx.map(x => hy.map(y => põe(x, y, 'rua')));
      for(let a=0; a<vx.length; a++)
        for(let b=0; b<hy.length; b++){
          if(b+1 < hy.length) liga(grade[a][b], grade[a][b+1]);
          if(a+1 < vx.length) liga(grade[a][b], grade[a+1][b]);
        }

      /* o beco de cada quarteirão: passa no meio, entre as duas
         fileiras de lotes, e conecta as duas ruas verticais que o cercam */
      for(let q=0; q<MP().QUARTEIROES; q++){
        if(q === cel.escondido) continue;
        const col = q % 3, row = Math.floor(q/3);
        const qx = iX + col*(bw+g), qy = iY + row*(bh+g);
        const meio = qy + bh/2;
        const e = põe(vx[col],   meio, 'beco');
        const d = põe(vx[col+1], meio, 'beco');
        liga(e, d);
        /* o beco desemboca nas ruas de cima e de baixo */
        liga(e, grade[col][row]);   liga(e, grade[col][row+1]);
        liga(d, grade[col+1][row]); liga(d, grade[col+1][row+1]);
      }
    }

    /* costura entre bairros: nós alinhados e perto viram avenida */
    const porX = new Map(), porY = new Map();
    const guarda = (mapa, k, n)=>{
      let l = mapa.get(k);
      if(!l){ l = []; mapa.set(k, l); }
      l.push(n);
    };
    for(const n of nos){
      guarda(porX, Math.round(n.x*2), n);
      guarda(porY, Math.round(n.y*2), n);
    }
    const costura = (mapa, eixo)=>{
      for(const lista of mapa.values()){
        lista.sort((a,b)=>a[eixo]-b[eixo]);
        for(let i=0;i+1<lista.length;i++){
          const d = lista[i+1][eixo] - lista[i][eixo];
          if(d > 0.01 && d <= VIZINHO) liga(lista[i], lista[i+1]);
        }
      }
    };
    costura(porX, 'y');
    costura(porY, 'x');

    mo._malha = {nos, perto};
    return mo._malha;

    function perto(x, y){
      let melhor = null, md = Infinity;
      for(const n of nos){
        const d = (n.x-x)*(n.x-x) + (n.y-y)*(n.y-y);
        if(d < md){ md = d; melhor = n; }
      }
      return melhor;
    }
  }

  /* A malha da arte: célula andável vira nó, vizinho ortogonal vira aresta,
     e a diagonal só entra quando os dois ortogonais também são rua — senão o
     bonde corta a quina do quarteirão. */
  function malhaDaArte(mo){
    const src = mo.malha;              // o raster que veio da arte
    const n = src.n, P = src.passo, A = src.andavel;
    const idx = new Int32Array(n*n).fill(-1);
    const nos = [];
    for(let r=0;r<n;r++) for(let c=0;c<n;c++){
      if(!A[r*n+c]) continue;
      idx[r*n+c] = nos.length;
      nos.push({i:nos.length, x:(c+0.5)*P, y:(r+0.5)*P, viz:[], c, r,
                beco:false});
    }
    const liga = (a,b,d)=>{ a.viz.push({n:b, d}); b.viz.push({n:a, d}); };
    for(let r=0;r<n;r++) for(let c=0;c<n;c++){
      const i = idx[r*n+c];
      if(i < 0) continue;
      const a = nos[i];
      if(c+1<n && idx[r*n+c+1]>=0) liga(a, nos[idx[r*n+c+1]], P);
      if(r+1<n && idx[(r+1)*n+c]>=0) liga(a, nos[idx[(r+1)*n+c]], P);
      /* diagonais, só em cruzamento aberto */
      for(const [dc,dr] of [[1,1],[-1,1]]){
        const c2=c+dc, r2=r+1;
        if(c2<0||c2>=n||r2>=n) continue;
        if(idx[r2*n+c2]<0) continue;
        if(!A[r*n+c2] || !A[r2*n+c]) continue;
        liga(a, nos[idx[r2*n+c2]], P*1.4142);
      }
    }
    /* beco é rua estreita: nó com poucos vizinhos ortogonais */
    for(const nd of nos) nd.beco = nd.viz.length <= 3;

    /* Largura do lugar: quantas células andáveis cabem numa janela 5×5 em
       volta. Rua de quarteirão fica na casa dos 10; largo, rotatória e
       pátio passam dos 20. É o que separa briga de rua de briga de praça. */
    for(const nd of nos){
      let q = 0;
      for(let dr=-2; dr<=2; dr++) for(let dc=-2; dc<=2; dc++){
        const r2 = nd.r+dr, c2 = nd.c+dc;
        if(r2<0||c2<0||r2>=n||c2>=n) continue;
        if(A[r2*n+c2]) q++;
      }
      nd.largura = q;
    }

    const perto = (x,y)=>{
      const c0 = U.limitar(Math.floor(x/P), 0, n-1);
      const r0 = U.limitar(Math.floor(y/P), 0, n-1);
      for(let raio=0; raio<n; raio++){
        let achou = null, md = Infinity;
        for(let r=r0-raio; r<=r0+raio; r++)
          for(let c=c0-raio; c<=c0+raio; c++){
            if(r<0||c<0||r>=n||c>=n) continue;
            if(Math.max(Math.abs(r-r0), Math.abs(c-c0)) !== raio) continue;
            const i = idx[r*n+c];
            if(i<0) continue;
            const d = (nos[i].x-x)**2 + (nos[i].y-y)**2;
            if(d<md){ md=d; achou=nos[i]; }
          }
        if(achou) return achou;
      }
      return nos[0];
    };
    return {nos, perto};
  }

  /* Dijkstra com heap simples: a malha tem ~800 nós, e o caminho de cada
     bonde é calculado uma vez só, quando ele nasce. */
  function caminho(mo, origem, destino){
    const {nos, perto} = malha(mo);
    const a = perto(origem.x, origem.y), b = perto(destino.x, destino.y);
    if(!a || !b) return [origem, destino];
    const dist = new Float64Array(nos.length).fill(Infinity);
    const de = new Int32Array(nos.length).fill(-1);
    const visto = new Uint8Array(nos.length);
    dist[a.i] = 0;
    /* heap binário: com a malha da arte são 5.478 nós, e varrer a fila em
       linha custava caro demais pra fazer isso por bonde */
    const h = [a];
    const sobe = k=>{ while(k>0){ const p=(k-1)>>1;
      if(dist[h[p].i] <= dist[h[k].i]) break;
      [h[p],h[k]]=[h[k],h[p]]; k=p; } };
    const desce = k=>{ for(;;){ const e=2*k+1, d=e+1; let m=k;
      if(e<h.length && dist[h[e].i] < dist[h[m].i]) m=e;
      if(d<h.length && dist[h[d].i] < dist[h[m].i]) m=d;
      if(m===k) break; [h[m],h[k]]=[h[k],h[m]]; k=m; } };
    while(h.length){
      const n = h[0];
      h[0] = h[h.length-1]; h.pop(); if(h.length) desce(0);
      if(visto[n.i]) continue;
      visto[n.i] = 1;
      if(n === b) break;
      for(const {n:v, d} of n.viz){
        if(visto[v.i]) continue;
        const nd = dist[n.i] + d;
        if(nd < dist[v.i]){ dist[v.i]=nd; de[v.i]=n.i; h.push(v); sobe(h.length-1); }
      }
    }
    if(dist[b.i] === Infinity) return [origem, destino];
    const rota = [];
    for(let i = b.i; i >= 0; i = de[i]) rota.unshift({x:nos[i].x, y:nos[i].y});
    rota.unshift({x:origem.x, y:origem.y});
    rota.push({x:destino.x, y:destino.y});
    return rota;
  }

  /* =======================================================
     ONDE FICA CADA COISA, EM COORDENADAS DO MAPA
     ======================================================= */
  function pontoDe(mo, filtro){
    /* cidade desenhada: os pinos já têm coordenada de verdade */
    if(mo.arte){
      for(const p of mo.pinos)
        if(filtro(p, {bairro:{nome:p.bairro}}))
          return {x:p.x, y:p.y, bairro:p.bairro, item:p};
      return null;
    }
    for(const cel of mo.celulas){
      const pad = 5, g = 5;
      const iX = cel.x + pad, iY = cel.y + pad;
      const bw = (cel.w - pad*2 - g*2)/3, bh = (cel.h - pad*2 - g*3)/4;
      for(const [q, item] of Object.entries(cel.especiais)){
        if(!filtro(item, cel)) continue;
        const col = (+q) % 3, row = Math.floor((+q)/3);
        return {x: iX + col*(bw+g) + bw/2, y: iY + row*(bh+g) + bh/2,
                bairro: cel.bairro.nome, item};
      }
    }
    return null;
  }
  const pontoDoEstadio = (mo, nome) => pontoDe(mo, it =>
    it.tipo === 'estadio' && (!nome || it.label.includes(nome)));

  /* O ESTÁDIO DO MANDANTE, não o primeiro da lista.
     `montar` pedia `pontoDoEstadio(mo, null)` e recebia o primeiro pino de
     estádio da praça — em São Paulo, com quatro, a torcida do Corinthians
     marchava pro Morumbi. Agora casa pelo clube: primeiro por `mandantes`,
     que é o que a tabela de estádios diz; se não achar, pelo nome que o
     próprio clube declara; e só então cai em qualquer campo. */
  function pontoDoEstadioDoClube(mo, clube){
    if(!clube) return pontoDoEstadio(mo, null);
    return pontoDe(mo, it => it.tipo === 'estadio'
                          && (it.mandantes||[]).includes(clube.id))
        || (clube.estadio && pontoDe(mo, it => it.tipo === 'estadio'
                          && (it.nomeEstadio||'') === clube.estadio))
        || pontoDoEstadio(mo, null);
  }

  /* todos os campos da praça, pra saber se um esbarrão caiu em algum deles */
  function camposDaPraca(mo){
    if(!mo.arte) return [];
    return (mo.pinos||[]).filter(p=>p.tipo === 'estadio');
  }
  const pontoDaSede = (mo, nomeTorcida) => pontoDe(mo, it =>
    it.tipo === 'sede' && it.label.includes(nomeTorcida));

  /* A torcida de fora entra pela borda — rodovia a sudoeste, como o mapa
     desenha. Cada uma desce num ponto diferente da orla da cidade: três
     ônibus não param no mesmo meio-fio. */
  function entradaDaCidade(mo, k){
    const i = k || 0;
    if(mo.arte){
      /* na arte a rodovia entra pelo sudoeste: pega os nós de rua mais
         perto daquela quina e espalha os ônibus entre eles */
      const {nos} = malha(mo);
      const alvo = {x: mo.tam*0.16, y: mo.tam*0.80};
      const perto = nos.slice()
        .sort((a,b)=>((a.x-alvo.x)**2+(a.y-alvo.y)**2)-((b.x-alvo.x)**2+(b.y-alvo.y)**2))
        .slice(0, 40);
      const n = perto[(i*13) % perto.length];
      return {x:n.x, y:n.y, bairro:'chegada'};
    }
    const P = MP().PAD;
    const passo = (mo.tam - P*2) / 6;
    return {x: P + 6 + Math.min(3, i)*passo*0.6,
            y: mo.tam - P - 6 - (i%2)*passo*0.35, bairro:'chegada'};
  }

  /* =======================================================
     OS BONDES
     ======================================================= */
  /* Quatro vezes mais devagar que a primeira versão: a 26 o bonde cruzava
     a cidade antes de dar pra ler o mapa. A 6,5 a caminhada até o estádio
     leva as duas horas e meia que o relógio da tarde promete. */
  const VEL = 6.5;           // unidades do mapa por minuto de jogo
  const ANTES = 150;         // os bondes saem duas horas e meia antes do apito
  /* Com VEL a 6,5 a travessia da cidade leva perto de duas horas, então a
     janela de saída aperta: espalhar em 40 minutos deixaria o último bonde
     chegando depois do apito. 18 minutos mantém todo mundo dentro da tarde. */
  /* Esbarrão na rua. Foi 16 e a briga de rua praticamente não existia:
     medido em 12 dias de jogo, dois bondes hostis chegavam a menos de 16
     uma vez só — todo confronto acontecia no cordão do estádio. É que
     todos vão pro mesmo destino, então as rotas só convergem no fim. A
     45 (umas quatro células de rua, o que se lê como "mesma esquina") a
     rua ganha uma a duas brigas por dia de jogo, que é o que o GDD §14
     descreve. */
  const RAIO_ENCONTRO  = 45;   // esbarrão na rua
  const RAIO_ARREDORES = 52;   // no cordão do estádio a multidão se toca
  const LARGO = 23;            // células andáveis numa janela 5×5 = é praça

  function estado(E){
    if(!E.ruas) E.ruas = {chave:null, bondes:[], minuto:0, rodando:false,
                          olheiro:null, encontro:null, esfria:{}, arredores:[]};
    if(!E.ruas.esfria) E.ruas.esfria = {};
    if(!E.ruas.arredores) E.ruas.arredores = [];
    return E.ruas;
  }

  /* o dia de jogo da praça: todo jogo desta semana com mando aqui */
  function jogosDaPraca(E){
    const nossa = E.torcida.mapa;
    const fora = [];
    if(!E.temporada) return fora;
    for(const comp of E.temporada.competicoes)
      for(const etapa of [...comp.rodadas, ...comp.mata]){
        if(etapa.semana !== E.data.semana) continue;
        for(const j of etapa.jogos){
          if(!j.f) continue;
          const casa = M().time(j.c), vis = M().time(j.f);
          if(!casa || !vis || casa.mapa !== nossa) continue;
          fora.push({casa, vis, comp:comp.nome, dia: j.d || etapa.dia || 6});
        }
      }
    return fora;
  }

  /* =======================================================
     UMA COR POR TORCIDA NA NOITE

     A cor do disco era sempre `cores[0]`, e como a paleta é a do CLUBE,
     as organizadas do mesmo time saíam iguais: num Corinthians em casa,
     Gaviões e Pavilhão 9 pretos e Camisa 12 branca — o jogador olhava a
     rua e via duas torcidas onde havia três. Pior: em São Paulo quatro
     torcidas de clubes diferentes eram todas brancas, porque branco é a
     primeira cor de meia dúzia de paletas.

     Aqui cada torcida do dia escolhe, na ordem da PRÓPRIA paleta
     (cores[0], cores[1], detalhe), a primeira que ninguém pegou. Escolhe
     primeiro a nossa — a cor do jogador nunca se mexe — e depois as
     maiores, que são as que o jogador reconhece de longe. Quem chega e
     não acha nada livre ganha um tom claro ou escuro da sua primeira
     cor, alternando, pra pelo menos não se confundir com a irmã.
     ======================================================= */
  function hexParaRgb(h){
    const s = String(h||'').replace('#','');
    const t = s.length === 3 ? s.split('').map(c=>c+c).join('') : s;
    const v = parseInt(t, 16);
    return isNaN(v) ? [153,153,153]
                    : [(v>>16)&255, (v>>8)&255, v&255];
  }
  const rgbParaHex = c =>
    '#' + c.map(v=>U.limitar(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
  /* clareia com fator positivo, escurece com negativo */
  const tonalizar = (hex, f) => {
    const c = hexParaRgb(hex);
    return rgbParaHex(f >= 0 ? c.map(v=>v + (255-v)*f) : c.map(v=>v*(1+f)));
  };

  /* Duas torcidas com a mesma sigla na mesma noite. Dentro de uma praça
     isso não acontece — conferido nas 140 —, mas a visitante vem de outro
     mapa: Esquadrão Atleticano e Esquadrão Alvinegro são as duas "EA", e
     se cruzam quando o Atlético recebe um time do interior de Minas. A
     segunda cresce pela última palavra do nome: EA vira EAL. */
  function siglaUnica(o, usadas){
    const base = M().siglaTorcida(o);
    if(!usadas.has(base)) return base;
    const ultima = (o.nome||'').split(/[\s/\-]+/).filter(Boolean).pop() || '';
    for(let k=2; k<=ultima.length; k++){
      const tenta = (base + ultima.slice(1, k)).toUpperCase();
      if(!usadas.has(tenta)) return tenta;
    }
    for(let k=2; k<40; k++) if(!usadas.has(base+k)) return base+k;
    return base;
  }

  function elencoDaNoite(E, doDia){
    /* o elenco da noite: as organizadas dos clubes que jogam */
    const cast = [];
    const visto = new Set(), visitante = new Set();
    for(const j of doDia)
      for(const clube of [j.casa, j.vis])
        for(const o of M().torcidasDe(clube.id)){
          if(clube === j.vis) visitante.add(o.id);
          if(visto.has(o.id)) continue;
          visto.add(o.id); cast.push(o);
        }
    /* A ordem de escolha: a nossa, depois as visitantes, depois as de
       casa — em cada grupo da maior pra menor, e o id desempata. É ordem
       fixa, então a mesma noite pinta igual toda vez que a tela reabre.
       Visitante escolhe antes da vizinhança porque é quem o jogador
       precisa achar no mapa: vem pela rodovia e vem pra briga. */
    const posto = o => o.id === E.torcida.id ? 0 : visitante.has(o.id) ? 1 : 2;
    cast.sort((a,b)=> posto(a) - posto(b)
                   || (b.membros||0) - (a.membros||0)
                   || (a.id < b.id ? -1 : 1));

    const usadas = new Set(), siglado = new Set(), cor = {}, sigla = {};
    for(const o of cast){
      const s = siglaUnica(o, siglado);
      siglado.add(s); sigla[o.id] = s;

      const paleta = [...(o.cores||[]), o.detalhe].filter(Boolean)
                       .map(c=>String(c).toUpperCase());
      let tom = paleta.find(c=>!usadas.has(c));
      /* Paleta inteira tomada. Acontece de verdade num clássico de clube
         preto e branco: as três organizadas do Corinthians têm as mesmas
         duas cores, porque na arquibancada elas vestem as mesmas duas
         cores. Aí o tom muda pra pelo menos não virar um borrão só — e
         quem separa mesmo é a sigla em cima do disco. */
      if(!tom){
        const base = paleta[0] || '#999999';
        for(let k=1; k<=4 && !tom; k++)
          for(const f of [0.36*k, -0.32*k]){
            const t = tonalizar(base, f).toUpperCase();
            if(!usadas.has(t)){ tom = t; break; }
          }
        tom = tom || base;
      }
      usadas.add(tom); cor[o.id] = tom;
    }
    return {cor, sigla};
  }

  /* Monta os bondes do dia: os daqui saem da sede (e da subsede, quando é
     a nossa torcida); os de fora entram pela rodovia. Todos vão ao
     estádio do mandante. */
  function montar(E, mo){
    const R = estado(E);
    const chave = `${E.data.ano}|${E.data.semana}|${E.data.dia}`;
    if(R.chave === chave && R.bondes.length) return R;
    R.chave = chave; R.bondes = []; R.minuto = 0; R.encontro = null;
    R.esfria = {}; R.arredores = [];

    const doDia = jogosDaPraca(E).filter(j=>j.dia === E.data.dia);
    if(!doDia.length) return R;

    /* cada torcida da noite com a sua cor e a sua sigla, sem repetir */
    const elenco = elencoDaNoite(E, doDia);

    let id = 0;
    /* De que JOGO é o bonde. A praça pode ter três partidas no mesmo dia,
       e sem isso a cena dos arredores juntava todo mundo que chegou —
       torcida de um clássico do outro lado da cidade aparecia na
       esplanada do nosso jogo. Guardado como o clube mandante, que é o
       que identifica a partida na praça. */
    const nasce = (torcida, origem, destino, n, tag, jogo)=>{
      if(!origem || !destino) return;
      /* ninguém sai no mesmo minuto: a saída se espalha pela tarde, com
         hora fixa por torcida — bonde não muda de horário a cada abertura */
      const saiEm = (MP().hash(`${torcida.id}|${tag}|${R.chave}`) % 18);
      R.bondes.push({
        id: ++id, torcida: torcida.id, nome: torcida.nome,
        cor: elenco.cor[torcida.id] || (torcida.cores && torcida.cores[0]) || '#999',
        nossa: torcida.id === E.torcida.id, n, tag, saiEm, andou:0,
        sigla: elenco.sigla[torcida.id] || M().siglaTorcida(torcida),
        jogo: jogo && jogo.casa.id,
        rota: caminho(mo, origem, destino), i:0, t:0,
        x: origem.x, y: origem.y, chegou:false
      });
    };

    /* Quantos bondes uma torcida põe na rua. O jogador decide no plano da
       semana; as outras se quebram pelo tamanho, que é o que acontece de
       verdade — torcida de 200 não sai toda junta de um ponto só. */
    const POR_BONDE = 60, MAX_BONDES = 4;
    const quantosBondes = n => U.limitar(Math.ceil(n / POR_BONDE), 1, MAX_BONDES);

    for(const jogo of doDia){
      const est = pontoDoEstadioDoClube(mo, jogo.casa) || {x:mo.tam/2, y:mo.tam/2};
      /* mandante: as organizadas dele saem de casa */
      for(const o of M().torcidasDe(jogo.casa.id)){
        const sede = pontoDaSede(mo, o.nome);
        if(!sede) continue;
        if(o.id === E.torcida.id){
          /* a nossa se divide entre a sede e as subsedes, como o plano manda */
          const bondes = Math.max(1, (TO.planejamento.plano(E).bondes)||1);
          const porBonde = Math.max(4, Math.round(TO.planejamento.efetivoDaSaida(E)/bondes));
          nasce(o, sede, est, porBonde, 'sede', jogo);
          const subs = TO.financeiro.patrimonio(E).subsedes || [];
          for(let k=1; k<bondes; k++){
            const sub = subs[k-1]
              ? pontoDe(mo, (it,c)=>it.tipo==='subsede' && c.bairro.nome===subs[k-1].bairro)
              : null;
            nasce(o, sub || sede, est, porBonde, sub ? 'subsede' : 'sede', jogo);
          }
        }else{
          /* as de casa também se quebram: a primeira sai da sede, as
             outras dos bares dela, que é onde a rapaziada se junta */
          const efetivo = Math.round((TO.acoes.efetivoDe(E, o)) * 0.6);
          const q = quantosBondes(efetivo);
          const porBonde = Math.max(4, Math.round(efetivo/q));
          nasce(o, sede, est, porBonde, 'sede', jogo);
          for(let k=1; k<q; k++){
            const bar = pontoDe(mo, (it)=>it.tipo === 'bar' &&
              (it.label||'').includes(o.nome));
            nasce(o, bar || sede, est, porBonde, bar ? 'bar' : 'sede', jogo);
          }
        }
      }
      /* visitante: entra pela rodovia e vai direto. Vários bondes entram
         por bocas diferentes — caravana grande não chega por uma porta só */
      let k = 0;
      for(const o of M().torcidasDe(jogo.vis.id)){
        const vem = Math.round(TO.acoes.efetivoDe(E, o) * 0.25);
        if(vem < 5) continue;
        const q = quantosBondes(vem);
        const porBonde = Math.max(4, Math.round(vem/q));
        for(let j=0;j<q;j++)
          nasce(o, entradaDaCidade(mo, k++), est, porBonde, 'visitante', jogo);
      }
    }
    return R;
  }

  /* =======================================================
     A ESPLANADA É DO NOSSO JOGO, NÃO DA CIDADE

     A praça pode ter três partidas no mesmo dia, e cada estádio tem a
     sua esplanada. Juntando todas, a cena abria com torcida de um
     clássico do outro lado da cidade parada no nosso portão — e o mapa
     dos arredores prometia uma briga que não existe. Nosso jogo é o do
     nosso bonde: se não temos bonde na rua, nosso clube não joga aqui
     hoje e não há esplanada nossa.
     ======================================================= */
  const nossoJogo = R => {
    const meu = (R.bondes || []).find(b=>b.nossa);
    return meu ? meu.jogo : null;
  };
  function naEsplanada(R){
    const j = nossoJogo(R);
    if(j == null) return [];
    return (R.arredores || []).filter(a=>a.jogo === j);
  }

  /* =======================================================
     O RELÓGIO
     ======================================================= */
  function passo(E, mo, minutos){
    const R = estado(E);
    if(R.encontro) return R;                 // parado esperando a briga
    R.minuto += minutos;
    for(const b of R.bondes){
      if(b.chegou || R.minuto < b.saiEm) continue;
      let resta = VEL * minutos;
      b.andou += resta;
      while(resta > 0 && b.i < b.rota.length-1){
        const a = b.rota[b.i], c = b.rota[b.i+1];
        const seg = Math.hypot(c.x-a.x, c.y-a.y) || 0.001;
        const falta = seg*(1-b.t);
        if(resta < falta){ b.t += resta/seg; resta = 0; }
        else { resta -= falta; b.i++; b.t = 0; }
      }
      if(b.i >= b.rota.length-1){
        /* Chegou no quarteirão do estádio: sai do mapa da cidade e passa
           pros arredores, que é onde a noite continua (GDD §13). Daqui pra
           frente ele não anda mais na rua nem esbarra em ninguém aqui. */
        b.chegou = true;
        const f = b.rota[b.rota.length-1];
        b.x = f.x; b.y = f.y;
        if(!b.nosArredores){
          b.nosArredores = true;
          b.entrouEm = Math.round(R.minuto);
          R.arredores.push({id:b.id, torcida:b.torcida, nome:b.nome, cor:b.cor,
                            n:b.n, nossa:b.nossa, tag:b.tag, jogo:b.jogo,
                            lado: b.tag === 'visitante' ? 'visitante' : 'mandante',
                            entrouEm:b.entrouEm});
        }
      }else{
        const a = b.rota[b.i], c = b.rota[b.i+1];
        b.x = a.x + (c.x-a.x)*b.t; b.y = a.y + (c.y-a.y)*b.t;
      }
    }
    R._mo = mo;
    const e = procurarEncontro(E, R);
    if(e){ R.encontro = e; R.rodando = false; }
    return R;
  }

  /* dois bondes hostis colados param o relógio */
  /* pra esbarrão valer, os dois já têm de estar na rua de fato: quem
     acabou de descer do ônibus no mesmo meio-fio não "se encontrou" */
  const NA_RUA = 40;

  function procurarEncontro(E, R){
    if(!R._mo) return null;
    const vivos = R.bondes.filter(b=>!b.chegou && !b.nosArredores
                                     && R.minuto >= b.saiEm && b.andou >= NA_RUA);
    for(let i=0;i<vivos.length;i++)
      for(let k=i+1;k<vivos.length;k++){
        const a = vivos[i], b = vivos[k];
        if(a.torcida === b.torcida) continue;
        /* A chave é do par de BONDES, não de torcidas: dois bondes da
           mesma torcida têm cada um a sua noite, e o mesmo par pode se
           pegar de novo mais adiante — brigou, se separou, se reencontrou
           duas ruas depois. O que impede o laço infinito é o esfriamento,
           não um bloqueio definitivo. */
        const par = [a.id, b.id].sort((p,q)=>p-q).join('|');
        if((R.esfria[par] || 0) > R.minuto) continue;
        /* nos arredores do estádio todo mundo se esbarra: o cordão
           aperta a multidão num quarteirão só (GDD §12) */
        const campos = camposDaPraca(R._mo);
        const perto = (p, q)=>Math.hypot(p.x-q.x, p.y-q.y) < 90;
        const noEstadio = campos.some(c=>perto(a, c) && perto(b, c));
        const raio = noEstadio ? RAIO_ARREDORES : RAIO_ENCONTRO;
        if(Math.hypot(a.x-b.x, a.y-b.y) > raio) continue;
        if(!hostis(E, a.torcida, b.torcida)) continue;
        const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
        return {a, b, par, x:mx, y:my, local: localDe(R._mo, mx, my),
                nossa: a.nossa || b.nossa};
      }
    return null;
  }

  /* hostil é rival de fato, ou tensão alta o bastante pra sair faísca */
  function hostis(E, ida, idb){
    const meu = E.torcida.id;
    if(ida === meu || idb === meu){
      const outro = ida === meu ? idb : ida;
      const rel = (E.relacoes||{})[outro];
      const ten = TO.tensao ? TO.tensao.nivel(E, outro) : 0;
      return (rel !== undefined && rel <= -15) || ten >= 45;
    }
    /* entre duas de fora, vale o grafo da fonte */
    const t = M().relacaoBase(ida, idb);
    return t === 'Rival' || t === 'Maior Rival';
  }

  /* A rua da cena é a do bairro onde a briga caiu: esbarrão no Pirambu
     não abre a mesma tela do esbarrão na Aldeota. A planta das três é a
     mesma; muda o que está construído em volta. */
  const RUA_DA_CLASSE = {
    'Favela':'rua', 'Classe Baixa':'rua',
    'Classe Média':'rua-media', 'Nobre':'rua-nobre'
  };
  function ruaDoBairro(mo, x, y){
    const b = MP().bairroEm ? MP().bairroEm(mo, x, y) : null;
    return (b && RUA_DA_CLASSE[b.classe]) || 'rua';
  }

  /* Onde a briga cai muda a cena: colado no estádio são os arredores,
     num largo de verdade é praça, no resto é a rua do bairro. */
  function localDe(mo, x, y){
    if(!mo) return 'rua';
    /* arredores é a beira de QUALQUER campo da praça, não a do primeiro */
    if(camposDaPraca(mo).some(c=>Math.hypot(c.x-x, c.y-y) < 70)) return 'arredores';
    const naRua = () => ruaDoBairro(mo, x, y);
    const m = malha(mo).perto(x, y);
    if(!m || m.beco) return naRua();
    /* praça é lugar largo de verdade — cruzamento de rua continua rua */
    if(m.largura != null) return m.largura >= LARGO ? 'praca' : naRua();
    return m.viz.length >= 4 ? 'praca' : naRua();
  }

  /* Depois da briga os dois seguem viagem, e só voltam a se enxergar
     quando já se separaram — senão o mesmo esbarrão reabriria a cena no
     quadro seguinte, com os discos ainda em cima um do outro. */
  const ESFRIAMENTO = 15;      // minutos de jogo
  function resolver(E, quem){
    const R = estado(E);
    if(!R.encontro) return;
    R.esfria[R.encontro.par] = R.minuto + ESFRIAMENTO;
    /* quem apanhou anda menos: o bonde derrotado perde gente e ritmo */
    if(quem && quem.perdeu){
      const b = R.bondes.find(x=>x.id === quem.perdeu);
      if(b){ b.n = Math.max(2, Math.round(b.n*0.75)); b.apanhou = (b.apanhou||0)+1; }
    }
    R.encontro = null;
  }

  /* =======================================================
     O OLHEIRO NO MAPA
     ======================================================= */
  const RAIO_OLHEIRO = 150;
  function porOlheiro(E, x, y){
    const R = estado(E);
    R.olheiro = (x == null) ? null : {x, y, raio:RAIO_OLHEIRO};
    return R.olheiro;
  }
  const visivel = (R, b) =>
    b.nossa || !R.olheiro ? true
      : Math.hypot(b.x-R.olheiro.x, b.y-R.olheiro.y) <= R.olheiro.raio;

  /* =======================================================
     DESENHO POR CIMA DO MAPA
     ======================================================= */
  function desenhar(E, mo, ctx){
    const R = estado(E);
    if(!R.bondes.length) return;

    if(R.olheiro){
      ctx.save();
      ctx.beginPath();
      ctx.arc(R.olheiro.x, R.olheiro.y, R.olheiro.raio, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(217,164,65,.07)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(217,164,65,.55)';
      ctx.setLineDash([6,5]); ctx.lineWidth = 1.4; ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(R.olheiro.x, R.olheiro.y, 4, 0, Math.PI*2);
      ctx.fillStyle = '#d9a441'; ctx.fill();
      ctx.restore();
    }

    for(const b of R.bondes){
      if(b.nosArredores) continue;      // saiu do mapa, está nos arredores
      if(!visivel(R, b)) continue;
      /* o caminho que falta, fininho */
      if(!b.chegou){
        ctx.save();
        ctx.strokeStyle = b.nossa ? 'rgba(126,194,160,.55)' : 'rgba(213,58,49,.42)';
        ctx.lineWidth = 1.8; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(b.x, b.y);
        for(let i=b.i+1; i<b.rota.length; i++) ctx.lineTo(b.rota[i].x, b.rota[i].y);
        ctx.stroke(); ctx.restore();
      }
      /* o disco: tamanho pelo efetivo */
      const r = U.limitar(4.5 + Math.sqrt(b.n)*0.75, 5, 15);
      ctx.save();
      /* halo escuro pra o disco não sumir em cima do telhado */
      ctx.beginPath(); ctx.arc(b.x, b.y, r+2.5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill();
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI*2);
      ctx.fillStyle = b.chegou ? 'rgba(60,60,60,.75)' : b.cor;
      ctx.fill();
      ctx.lineWidth = b.nossa ? 2 : 1.2;
      ctx.strokeStyle = b.nossa ? '#fff' : 'rgba(0,0,0,.7)';
      ctx.stroke();
      /* o efetivo dentro do disco, quando cabe */
      if(r >= 7){
        ctx.fillStyle = '#fff';
        ctx.font = `900 ${Math.round(r*0.95)}px Arial, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(b.n), b.x, b.y+0.5);
      }
      /* e a sigla da torcida logo acima, que é o que diz de quem é o
         bonde sem precisar passar o mouse. Sigla de torcida de nome
         curto é o nome inteiro (GAVIÕES, INDEPENDENTE), então a letra
         encolhe quando o rótulo é comprido — melhor pequeno e inteiro
         que grande e cortado. */
      if(b.sigla){
        const y = b.y - r - 5;
        const px = b.sigla.length > 8 ? 8 : b.sigla.length > 5 ? 9.5 : 11;
        ctx.font = `700 ${px}px Arial, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.85)';
        ctx.strokeText(b.sigla, b.x, y);
        ctx.fillStyle = b.nossa ? '#ffffff' : '#e6e2d8';
        ctx.fillText(b.sigla, b.x, y);
      }
      ctx.restore();
    }

    if(R.encontro){
      const e = R.encontro;
      ctx.save();
      ctx.beginPath(); ctx.arc(e.x, e.y, 22, 0, Math.PI*2);
      ctx.strokeStyle = '#e04b45'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(e.x, e.y, 30, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(224,75,69,.4)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
  }

  return {malha, caminho, localDe, ruaDoBairro, RUA_DA_CLASSE, ESFRIAMENTO,
          pontoDe, pontoDoEstadio, pontoDoEstadioDoClube, camposDaPraca,
          pontoDaSede, entradaDaCidade,
          estado, jogosDaPraca, montar, passo, resolver, hostis,
          nossoJogo, naEsplanada,
          porOlheiro, visivel, desenhar,
          VEL, ANTES, RAIO_ENCONTRO, RAIO_ARREDORES, RAIO_OLHEIRO};
})();
