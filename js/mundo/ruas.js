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
  /* SEDE E BAR SE ACHAM PELO ID, não pelo nome. O casamento era
     `label.includes(nome)`, e 21 dos 140 nomes são subcadeia de outro —
     "Camisa 12" dentro de "Camisa 12 do Inter", "Garra" dentro de "Garra
     Alvinegra", "Gaviões" dentro de "Gaviões Alvinegros", "Independente"
     dentro de "Fúria Independente". `pontoDe` devolve o primeiro que
     casa, então a Camisa 12 podia sair da sede do Inter. O pino já
     carrega `torcida: o.id` desde que a sede virou escudo; é por ele. */
  const pontoDaSede = (mo, torcida) => pontoDe(mo, it =>
    it.tipo === 'sede' && it.torcida === (torcida.id || torcida));
  const pontoDoBar = (mo, torcida) => pontoDe(mo, it =>
    (it.tipo === 'bar' || it.tipo === 'bar-nosso') &&
    it.torcida === (torcida.id || torcida));

  /* OS DOIS PONTOS DE CHEGADA, marcados na arte pelo autor: a boca da
     avenida no alto e a ponta sudeste do bairro de baixo. São os dois
     lugares por onde o ônibus de fora entra na praça, e alternam — dois
     bondes novos não descem no mesmo meio-fio.

     Só valem pra quem NÃO tem sede aqui. Torcida da própria praça sai de
     casa mesmo quando o clube dela joga fora: num Atlético x Cruzeiro a
     Máfia Azul é visitante no jogo e moradora da cidade.

     Guardados em fração do lado do mapa, e não em pixel, porque as três
     praças com arte compartilham o mesmo esqueleto de ruas — conferido:
     nos três mapas os dois pontos caem em cima de asfalto. */
  const CHEGADAS = [[0.4947, 0.0677], [0.8551, 0.9474]];

  function entradaDaCidade(mo, k){
    const i = (k || 0) % CHEGADAS.length;
    if(mo.arte){
      const [fx, fy] = CHEGADAS[i];
      return {x: mo.tam*fx, y: mo.tam*fy, bairro:'chegada'};
    }
    const P = MP().PAD;
    const passo = (mo.tam - P*2) / 6;
    return {x: P + 6 + i*passo*1.8,
            y: mo.tam - P - 6 - i*passo*0.35, bairro:'chegada'};
  }

  /* =======================================================
     OS BONDES
     ======================================================= */
  /* Quatro vezes mais devagar que a primeira versão: a 26 o bonde cruzava
     a cidade antes de dar pra ler o mapa. A 6,5 a caminhada até o estádio
     leva as duas horas e meia que o relógio da tarde promete. */
  const VEL = 6.5;           // unidades do mapa por minuto de jogo

  /* =======================================================
     O RELÓGIO DO DIA

     O dia abria sempre às 08:00 e o apito de um jogo das 16:00 ficava a
     480 minutos dali — quatro minutos de tela, dos quais quase três não
     tinham nada acontecendo. A abertura passou a depender do que o dia
     tem pra mostrar:

       · tem caravana que dorme na sede de aliado -> abre 3h30 antes
       · não tem                                  -> abre 2h30 antes

     Três horas e meia é o que a manhã precisa pra caber a caminhada do
     ônibus até a casa do anfitrião e a espera curta até a saída. Sem
     hospedagem não há manhã nenhuma: o dia abre no minuto em que a praça
     começa a sair pro estádio.

     A janela de saída não mexeu — continua entre 2h30 e 2h antes do
     apito, escalonada, porque bonde não sai todo no mesmo minuto.

     `R.minuto` conta minutos desde a abertura, e a abertura de cada dia
     fica em `R.abertura`, resolvida uma vez em `montar()`. Duas contas
     independentes derivariam: quem lê a hora e quem calcula o apito têm
     de ler o mesmo número. */
  const ANTES  = 150;   // a janela abre 2h30 antes do apito...
  const JANELA = 30;    // ...e fecha 2h antes
  /* 4h antes do PRIMEIRO jogo do dia. Eram 3h30 antes do último, e a
     manhã sobrava 60 minutos — menos que a própria caminhada do ônibus
     até a casa do anfitrião, que tem mediana de 51 a 145 minutos
     conforme a praça. Contar do primeiro jogo e não do último é o que
     abre a manhã de verdade num dia de várias partidas: com jogos às
     16:00 e às 18:30 a saída continua marcada pelas 18:30, mas o dia
     começa às 12:00 em vez das 15:00. */
  const MANHA_COM_HOSPEDE = 240;
  const APITO_PADRAO = 16*60;      // usado só quando o dia não tem jogo
  /* DIA SEM JOGO NA PRAÇA. Não há apito pra medir nada a partir dele, e
     não faz sentido abrir a cidade às 13:30 porque um jogo imaginário
     seria às 16:00. O dia vale inteiro: das oito da manhã às dez da
     noite é quando dá pra tirar o bonde da sede e ir a algum lugar. */
  const DIA_VAZIO = [8*60, 22*60];

  /* 'HH:MM' -> minutos do dia; devolve null no que não for hora */
  function emMinutos(hhmm){
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm||'').trim());
    return m ? (+m[1])*60 + (+m[2]) : null;
  }

  /* O APITO É O DO ÚLTIMO JOGO DO DIA NESTA PRAÇA, e a hora vem da grade
     (`horaDoJogo`), não de constante: rodada de domingo tem jogo às 11h e
     às 20h30, e o relógio da rua tem de acompanhar o que a tabela marcou.
     Em minutos do dia. */
  const horasDoDia = E => jogosDaPraca(E).filter(j=>j.dia === E.data.dia)
    .map(j=>emMinutos(j.hora)).filter(h=>h != null);
  function ultimoApito(E){
    const horas = horasDoDia(E);
    return horas.length ? Math.max(...horas) : APITO_PADRAO;
  }
  function primeiroApito(E){
    const horas = horasDoDia(E);
    return horas.length ? Math.min(...horas) : APITO_PADRAO;
  }

  /* A abertura, em minutos do dia. Com hospedagem conta do PRIMEIRO jogo,
     porque é a manhã dele que a caravana tem de aproveitar; sem
     hospedagem não há manhã, e o dia abre quando a praça começa a sair —
     2h30 antes do último apito, que é quando a janela abre.
     Nunca antes da meia-noite: o piso só existe pra jogo de madrugada
     não virar dia negativo. */
  const aberturaDoDia = (E, temHospede) =>
      !horasDoDia(E).length ? DIA_VAZIO[0]
    : temHospede ? Math.max(0, primeiroApito(E) - MANHA_COM_HOSPEDE)
    : Math.max(0, ultimoApito(E) - ANTES);

  /* o apito em minutos DESDE A ABERTURA, que é o zero de R.minuto */
  function apitoDoDia(E){
    const R = estado(E);
    const abertura = R.abertura != null ? R.abertura : aberturaDoDia(E, false);
    /* sem jogo não há apito: o "fim" é o fim do expediente da rua */
    if(!horasDoDia(E).length) return DIA_VAZIO[1] - DIA_VAZIO[0];
    return Math.max(60, ultimoApito(E) - abertura);
  }

  /* 'minutos desde a abertura' -> 'HH:MM' */
  function relogio(m, E){
    const R = E ? estado(E) : null;
    const base = (R && R.abertura != null) ? R.abertura : 0;
    const t = Math.max(0, Math.round(base + m));
    return `${String(Math.floor(t/60)%24).padStart(2,'0')}:`+
           `${String(t%60).padStart(2,'0')}`;
  }

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
          fora.push({casa, vis, comp:comp.nome, dia: j.d || etapa.dia || 6,
                     hora: TO.competicoes.horaDoJogo(j)});
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
    /* A guarda era `R.bondes.length`, e isso bastava enquanto o mapa só
       vivia em dia de jogo: dia sem jogo não tinha bonde nenhum, então
       remontar de novo a cada redesenho não custava nada. Agora custa —
       num dia vazio o bonde comandado é o único que existe, e remontar
       zerava o relógio e o encontro dele a cada pintura da tela. */
    if(R.chave === chave && R.montado) return R;
    R.chave = chave; R.montado = true;
    R.bondes = []; R.minuto = 0; R.encontro = null;
    R.esfria = {}; R.arredores = []; R.selecionado = null;

    const doDia = jogosDaPraca(E).filter(j=>j.dia === E.data.dia);

    /* A ABERTURA DEPENDE DO QUE O DIA TEM, e tem de ser resolvida ANTES
       de qualquer coisa que leia hora: o apito é medido a partir dela.
       Saber se há hospedagem exige rodar `anfitriaoDe` pras visitantes
       sem sede, o que só aconteceria lá embaixo, dentro da montagem dos
       bondes — daí esta passada de detecção primeiro. Um `true` basta. */
    const temHospede = doDia.some(j=>
      M().torcidasDe(j.vis.id).some(o=>
        !pontoDaSede(mo, o) &&
        TO.planejamento.caravanaDe(o, (E.relacoes||{})[o.id]) >= 5 &&
        !!anfitriaoDe(E, mo, o)));
    R.abertura = aberturaDoDia(E, temHospede);
    R.comHospede = temHospede;
    R.apito = apitoDoDia(E);
    /* Dia sem jogo na praça não tem bonde automático — mas TEM dia. O
       estado da rua existe, o relógio corre e o nosso bonde pode entrar
       nela quando o jogador mandar. "Cidade tranquila" deixou de ser
       beco sem saída e virou o estado normal de um dia em que só sai
       quem o jogador mandar sair. */
    if(!doDia.length) return R;

    /* cada torcida da noite com a sua cor e a sua sigla, sem repetir */
    const elenco = elencoDaNoite(E, doDia);

    const apito = R.apito;

    let id = 0;
    /* A hora em que este bonde sai pro estádio: entre 2h30 e 2h antes do
       apito, nunca fora disso. Fixa por torcida — o hash é do id e da
       chave do dia, então o bonde não muda de horário a cada abertura da
       tela. */
    const saidaPraOEstadio = (torcida, tag) =>
      apito - ANTES + (MP().hash(`${torcida.id}|${tag}|${R.chave}`) % JANELA);

    /* De que JOGO é o bonde. A praça pode ter três partidas no mesmo dia,
       e sem isso a cena dos arredores juntava todo mundo que chegou —
       torcida de um clássico do outro lado da cidade aparecia na
       esplanada do nosso jogo. Guardado como o clube mandante, que é o
       que identifica a partida na praça.

       `pernas` é a viagem inteira: [{saiEm, ate}]. Quase todo bonde tem
       uma só (sede -> estádio). Quem vem de fora e tem aliado aqui tem
       duas: chega de manhã na sede dele e só de tarde os dois saem pro
       estádio. */
    const nasce = (torcida, origem, pernas, n, tag, jogo, extra)=>{
      if(!origem || !pernas.length || pernas.some(p=>!p.ate)) return;
      let de = origem;
      const etapas = pernas.map(p=>{
        const rota = caminho(mo, de, p.ate);
        de = p.ate;
        return {saiEm: p.saiEm, rota, tipo: p.tipo || 'estadio'};
      });
      R.bondes.push(Object.assign({
        id: ++id, torcida: torcida.id, nome: torcida.nome,
        cor: elenco.cor[torcida.id] || (torcida.cores && torcida.cores[0]) || '#999',
        nossa: torcida.id === E.torcida.id, n, tag, andou:0,
        sigla: elenco.sigla[torcida.id] || M().siglaTorcida(torcida),
        jogo: jogo && jogo.casa.id,
        etapas, etapa:0, saiEm: etapas[0].saiEm, rota: etapas[0].rota, i:0, t:0,
        x: origem.x, y: origem.y, chegou:false
      }, extra || {}));
    };

    /* Quantos bondes uma torcida põe na rua. O jogador decide no plano da
       semana; as outras se quebram pelo tamanho, que é o que acontece de
       verdade — torcida de 200 não sai toda junta de um ponto só. */
    const POR_BONDE = 60, MAX_BONDES = 4;
    const quantosBondes = n => U.limitar(Math.ceil(n / POR_BONDE), 1, MAX_BONDES);

    let chegada = 0;   // alterna os dois pontos de entrada da praça

    /* AS ESCOLTAS SE RESOLVEM ANTES DOS BONDES.
       Os membros da escolta saem do efetivo do anfitrião e passam pro
       bonde do aliado: não é gente nova, o total da noite não muda, muda
       de quem é. E o anfitrião pode ser torcida de outro jogo do mesmo
       dia — a gente pode escoltar um aliado numa partida em que o nosso
       clube nem entra em campo. Se as escoltas fossem calculadas dentro
       do laço dos jogos, o desconto chegaria depois de o bonde do
       anfitrião já ter saído com o efetivo cheio. */
    const escoltas = {};          // id do visitante -> {casa, n}
    const devidoDeEscolta = {};   // id do anfitrião -> quanto emprestou
    for(const jogo of doDia)
      for(const o of M().torcidasDe(jogo.vis.id)){
        if(pontoDaSede(mo, o)) continue;        // mora aqui, não é caravana
        if(TO.planejamento.caravanaDe(o, (E.relacoes||{})[o.id]) < 5) continue;
        const casa = anfitriaoDe(E, mo, o);
        if(!casa) continue;
        const n = escoltaDe(E, casa.torcida, o);
        if(!n) continue;
        escoltas[o.id] = {casa, n};
        devidoDeEscolta[casa.torcida.id] =
          (devidoDeEscolta[casa.torcida.id] || 0) + n;
      }
    /* quanto sobra pro anfitrião depois de mandar gente na escolta */
    const menosAEscolta = (o, efetivo) =>
      Math.max(4, efetivo - (devidoDeEscolta[o.id] || 0));

    /* Quem sai da própria casa: mandante, ou visitante que mora aqui. */
    const daPraca = (o, sede, est, jogo)=>{
      if(o.id === E.torcida.id){
        /* a nossa se divide entre a sede e as subsedes, como o plano manda */
        const bondes = Math.max(1, (TO.planejamento.plano(E).bondes)||1);
        const nosso = menosAEscolta(o, TO.planejamento.efetivoDaSaida(E));
        const porBonde = Math.max(4, Math.round(nosso/bondes));
        nasce(o, sede, [{saiEm:saidaPraOEstadio(o,'sede'), ate:est}],
              porBonde, 'sede', jogo);
        const subs = TO.financeiro.patrimonio(E).subsedes || [];
        for(let k=1; k<bondes; k++){
          const sub = subs[k-1]
            ? pontoDe(mo, (it,c)=>it.tipo==='subsede' && c.bairro.nome===subs[k-1].bairro)
            : null;
          const tag = sub ? 'subsede' : 'sede';
          nasce(o, sub || sede, [{saiEm:saidaPraOEstadio(o,tag+k), ate:est}],
                porBonde, tag, jogo);
        }
        return;
      }
      /* as outras também se quebram: a primeira sai da sede, as demais
         dos bares dela, que é onde a rapaziada se junta */
      const efetivo = menosAEscolta(o, Math.round(TO.acoes.efetivoDe(E, o) * 0.6));
      const q = quantosBondes(efetivo);
      const porBonde = Math.max(4, Math.round(efetivo/q));
      nasce(o, sede, [{saiEm:saidaPraOEstadio(o,'sede'), ate:est}],
            porBonde, 'sede', jogo);
      for(let k=1; k<q; k++){
        const bar = pontoDoBar(mo, o);
        const tag = bar ? 'bar' : 'sede';
        nasce(o, bar || sede, [{saiEm:saidaPraOEstadio(o,tag+k), ate:est}],
              porBonde, tag, jogo);
      }
    };

    /* Quem vem de fora. Se tem aliado com sede aqui, a primeira coisa
       que acontece no dia é ele descer do ônibus e ir pra casa do aliado;
       à tarde os dois saem juntos pro estádio, e o anfitrião que escolta
       manda gente junto. Sem aliado, desce na hora de ir pro jogo e vai
       direto — caravana não fica seis horas parada no meio-fio. */
    const deFora = (o, est, jogo)=>{
      /* a MESMA conta que a Gestão mostrou ao jogador na semana */
      const vem = TO.planejamento.caravanaDe(o, (E.relacoes||{})[o.id]);
      if(vem < 5) return;
      const q = quantosBondes(vem);
      const porBonde = Math.max(4, Math.round(vem/q));
      const casa = anfitriaoDe(E, mo, o);
      for(let j=0;j<q;j++){
        const entra = entradaDaCidade(mo, chegada++);
        const saida = saidaPraOEstadio(o, 'visitante'+j);
        if(!casa){
          /* sem aliado na praça, não fica a manhã inteira no meio-fio:
             desce já na janela de saída e vai direto pro estádio */
          nasce(o, entra, [{saiEm:saida, ate:est}], porBonde, 'visitante', jogo);
          continue;
        }
        /* só o primeiro bonde é hospedado: a escolta é uma, não uma por
           ônibus, e é o bonde principal que anda com o anfitrião */
        const escolta = j === 0 && escoltas[o.id] ? escoltas[o.id].n : 0;
        /* O ÔNIBUS DESCE NO MINUTO ZERO e já sai andando. Antes a
           descida era sorteada numa janela de 45 minutos, porque o dia
           abria seis horas antes do jogo e a caravana não podia ficar
           parada no meio-fio. Com a abertura em T-3h30 a premissa
           acabou: a manhã existe pra essa caminhada acontecer e ser
           vista, não pra ninguém esperar. O que dá variedade são os dois
           pontos de entrada alternados e as rotas até cada sede. */
        nasce(o, entra, [
          {saiEm: 0, ate: casa.sede, tipo:'aliado'},
          {saiEm: saida, ate: est}
        ], porBonde, 'visitante', jogo, escolta ? {
          escolta: {de: casa.torcida.id, nome: casa.torcida.nome,
                    sigla: elenco.sigla[casa.torcida.id] ||
                           M().siglaTorcida(casa.torcida),
                    cor: elenco.cor[casa.torcida.id] ||
                         (casa.torcida.cores && casa.torcida.cores[0]) || '#999',
                    n: escolta},
          /* escoltado pela nossa torcida é bonde nosso na hora da briga:
             o jogador comanda a soma dos dois */
          doJogador: casa.torcida.id === E.torcida.id
        } : {hospedadoPor: casa.torcida.id});
      }
    };

    for(const jogo of doDia){
      const est = pontoDoEstadioDoClube(mo, jogo.casa) || {x:mo.tam/2, y:mo.tam/2};
      for(const o of M().torcidasDe(jogo.casa.id)){
        const sede = pontoDaSede(mo, o);
        if(sede) daPraca(o, sede, est, jogo);
      }
      /* O VISITANTE PODE SER DAQUI. Num Atlético x Cruzeiro a Máfia Azul
         é visitante no jogo e moradora da cidade: ela tem sede, bar e
         rua, e sair da entrada da praça não faz sentido nenhum. Quem
         entra pela chegada é só quem não tem casa aqui. */
      for(const o of M().torcidasDe(jogo.vis.id)){
        const sede = pontoDaSede(mo, o);
        if(sede) daPraca(o, sede, est, jogo);
        else     deFora(o, est, jogo);
      }
    }
    return R;
  }

  /* =======================================================
     O ANFITRIÃO

     Torcida de fora que tem aliado com sede na praça dorme na casa dele.
     Pro jogador vale a relação corrente (o mesmo ≥ 20 que a tela de
     aliados na cidade usa); pras outras valem as listas de aliado e
     irmandade do dado. Irmandade na frente, e o hash desempata pra que a
     mesma dupla se repita em toda abertura.
     ======================================================= */
  function anfitriaoDe(E, mo, visitante){
    const daqui = M().torcidasEm(E.torcida.mapa)
      .filter(t=>t.id !== visitante.id && pontoDaSede(mo, t));
    const grau = t=>{
      if(t.id === E.torcida.id){
        const v = (E.relacoes||{})[visitante.id];
        if(v === undefined || v < TO.planejamento.RELACAO_ALIADO) return 0;
        return v >= 60 ? 2 : 1;
      }
      if((visitante.irmandade||[]).includes(t.id)) return 2;
      if((visitante.aliados||[]).includes(t.id))   return 1;
      return 0;
    };
    const bons = daqui.filter(t=>grau(t) > 0)
      .sort((a,b)=> grau(b) - grau(a) ||
        MP().hash(`${visitante.id}|${a.id}`) - MP().hash(`${visitante.id}|${b.id}`));
    if(!bons.length) return null;
    return {torcida: bons[0], sede: pontoDaSede(mo, bons[0])};
  }

  /* Quanta gente o anfitrião manda junto. GDD §11.1: acolher bem sobe a
     relação, e escoltar é acolher com bonde. São 5 a 10% do efetivo de
     quem recebe — a TUF, com 150, empresta de 8 a 15. Quem decide pelo
     jogador é Gestão > Aliados na nossa cidade; a IA que tem o aliado
     dormindo em casa escolta sempre. */
  function escoltaDe(E, anfitriao, visitante){
    if(anfitriao.id === E.torcida.id){
      const nivel = TO.planejamento.nivelDe(E, visitante.id);
      if(nivel !== 'escolta' && nivel !== 'churrasco') return 0;
    }
    const pct = 5 + (MP().hash(`escolta|${anfitriao.id}|${visitante.id}`) % 6);
    return Math.max(1, Math.round((anfitriao.membros || 20) * pct / 100));
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
    /* o nosso bonde manda; na falta dele, o aliado que a gente escoltou —
       dá pra estar na rua por causa de um jogo em que o nosso clube nem
       entra em campo */
    const meu = (R.bondes || []).find(b=>b.nossa)
             || (R.bondes || []).find(b=>b.doJogador);
    return meu ? meu.jogo : null;
  };
  function naEsplanada(R){
    const j = nossoJogo(R);
    if(j == null) return [];
    return (R.arredores || []).filter(a=>a.jogo === j && !a.entrou);
  }

  /* Quem entrou na cena não volta pra esplanada: acabou a briga, entrou
     pro estádio. É o que faz a hora de descer valer alguma coisa — dá pra
     brigar às 14h30 com três bondes ou esperar os seis das 15h10, e a
     escolha é uma só. */
  function marcarQueEntraram(R, lista){
    const ids = new Set((lista||[]).map(x=>x.id));
    for(const a of (R.arredores || [])) if(ids.has(a.id)) a.entrou = true;
  }

  /* =======================================================
     O RELÓGIO
     ======================================================= */
  function passo(E, mo, minutos){
    const R = estado(E);
    if(R.encontro) return R;                 // parado esperando a briga
    /* o dia acaba no apito do último jogo da praça, não quando o último
       bonde chega: quem saiu atrasado ainda está andando na rua quando a
       bola rola, e é isso que o relógio tem de mostrar */
    const fim = R.apito || apitoDoDia(E);
    if(R.minuto >= fim) return R;
    R.minuto = Math.min(fim, R.minuto + minutos);
    for(const b of R.bondes){
      if(b.chegou || R.minuto < b.saiEm) continue;
      if(b.parado) continue;              // bonde comandado esperando ordem
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
        const f = b.rota[b.rota.length-1];
        b.x = f.x; b.y = f.y;
        /* O BONDE COMANDADO NÃO VAI PRO ESTÁDIO: ele foi aonde o
           jogador mandou. Chegando num alvo fixo, avisa — quem abre a
           cena de investida é a tela. Chegando num ponto de rua, fica:
           tocaia é esperar, e quem termina a espera é `procurarEncontro`
           ou o jogador mandando outra coisa. */
        if(b.comandado){
          b.parado = true;
          if(b.alvoFixo && !b.entregue){ b.entregue = true; R.noAlvo = b; }
          continue;
        }
        const etapa = b.etapas[b.etapa];
        if(etapa && etapa.tipo === 'aliado'){
          /* Chegou na casa do aliado. Fica lá até a hora de sair pro
             estádio, e nessa hora leva a escolta junto — é aqui que o
             efetivo cresce, não na saída de casa. */
          if(!b.hospedado){
            b.hospedado = true;
            b.chegouNaSede = Math.round(R.minuto);
            if(b.escolta) b.n += b.escolta.n;
          }
          /* A ida ao estádio começa na hora sorteada OU no momento em
             que ele chegou aqui, o que for depois: bonde não sai de um
             lugar onde ainda não chegou. Se a caminhada estourou a hora,
             ele sai atrasado — e é isso que a medição mostra. */
          const proxima = b.etapas[b.etapa+1];
          if(proxima){
            const parte = Math.max(proxima.saiEm, b.chegouNaSede);
            if(R.minuto >= parte){
              b.etapa++; b.rota = proxima.rota; b.saiEm = parte;
              b.i = 0; b.t = 0;
            }
          }
          continue;
        }
        /* Chegou no quarteirão do estádio: sai do mapa da cidade e passa
           pros arredores, que é onde a noite continua (GDD §13). Daqui pra
           frente ele não anda mais na rua nem esbarra em ninguém aqui. */
        b.chegou = true;
        if(!b.nosArredores){
          b.nosArredores = true;
          b.entrouEm = Math.round(R.minuto);
          /* Bonde escoltado pela NOSSA torcida entra pelo nosso lado: ele
             veio com a gente. É o que mantém de pé tudo que a cena assume
             sobre 'mandante' ser o lado do jogador — pressão da PM, HUD,
             recuo por tecla. */
          const meu = !!(b.nossa || b.doJogador);
          const lado = meu ? 'mandante'
                     : b.tag === 'visitante' ? 'visitante' : 'mandante';
          const base = {id:b.id, torcida:b.torcida, nome:b.nome, cor:b.cor,
                        sigla:b.sigla, nossa:b.nossa, tag:b.tag, jogo:b.jogo,
                        doJogador: meu, lado, entrouEm:b.entrouEm};
          /* O BONDE COMBINADO ANDOU COMO UM DISCO SÓ, mas na esplanada
             são duas torcidas: cada uma com a própria cor e a própria
             sigla. Juntá-las numa cor só apagaria justamente o que a
             escolta tem de legível. */
          if(b.escolta){
            const doAliado = Math.max(1, b.n - b.escolta.n);
            R.arredores.push(Object.assign({}, base, {n:doAliado}));
            R.arredores.push(Object.assign({}, base, {
              id: b.id + 0.5, torcida: b.escolta.de, nome: b.escolta.nome,
              cor: b.escolta.cor, sigla: b.escolta.sigla,
              n: b.escolta.n, escoltando: b.torcida}));
          } else {
            R.arredores.push(Object.assign({}, base, {n:b.n}));
          }
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
     O BONDE COMANDADO

     Até aqui o mapa era um relógio com bondes automáticos: o jogador
     olhava. Agora ele tira a torcida da sede quando quiser — inclusive
     num dia em que ninguém joga na praça — e aponta pra onde ela vai.

     O projeto fechado antes do código está em docs (§8.5); em resumo:

     · quem escolhe o tipo de alvo é o DESTINO, não um menu. Pino de
       sede ou bar do rival é alvo fixo e cai na cena de investida que
       `acoes.js` já tem; ponto de rua é tocaia — o bonde vai até lá e
       fica, e `procurarEncontro` abre a cena pelo `localDe` do lugar
       quando um bonde hostil passar perto.
     · fora de dia de jogo o alvo é sempre fixo, porque sem jogo
       ninguém mais põe gente na rua e tocaia seria esperar por um
       bonde que não existe.
     · sair custa UMA AÇÃO da semana. Quem cobra é `acoes.js`; aqui só
       se monta o bonde.
     ======================================================= */
  function nossoBonde(E){
    const R = estado(E);
    return R.bondes.find(b => b.comandado && !b.chegou) || null;
  }

  /* Tira o bonde da sede. Devolve {ok, msg, bonde}. Não cobra ação
     nenhuma: o preço é do chamador, que é quem sabe do orçamento. */
  function sairDaSede(E, mo, n){
    const R = montar(E, mo);
    if(nossoBonde(E)) return {ok:false, msg:'Seu bonde já está na rua.'};
    const origem = pontoDaSede(mo, E.torcida) || pontoDoBar(mo, E.torcida);
    if(!origem) return {ok:false, msg:'Sua torcida não tem sede nesta praça.'};
    const b = {
      id: 1000 + (R.bondes.length),
      torcida: E.torcida.id, nome: E.torcida.nome,
      cor: (E.torcida.cores && E.torcida.cores[0]) || '#d9a441',
      sigla: M().siglaTorcida(E.torcida),
      nossa: true, comandado: true, n: Math.max(2, Math.round(n)),
      tag: 'comandado', andou: 0, jogo: null,
      etapas: [], etapa: 0, saiEm: R.minuto, rota: [origem, origem],
      i: 0, t: 0, x: origem.x, y: origem.y, chegou: false, parado: true
    };
    R.bondes.push(b);
    R.selecionado = b.id;
    return {ok:true, bonde:b,
            msg:`${b.n} saíram da sede. Clique num ponto do mapa pra mandar.`};
  }

  /* O destino por clique. Pino de rival = alvo fixo; qualquer outro
     ponto da rua = tocaia. Devolve {ok, tipo, msg}. */
  const RAIO_PINO = 22;         // o dedo em cima do pino
  function mandarPara(E, mo, x, y){
    const b = nossoBonde(E);
    if(!b) return {ok:false, msg:'Não tem bonde nosso na rua.'};
    /* O pino se acha direto em `mo.pinos`, e não em `alvoEm`: a lista de
       alvos de clique só existe depois de um desenho e só entra nela
       pino que o filtro está mostrando. Pino escondido pelo filtro
       continua sendo um endereço no mapa. */
    let it = null, md = RAIO_PINO*RAIO_PINO;
    for(const p of (mo.pinos || [])){
      if(p.tipo !== 'sede' && p.tipo !== 'bar') continue;
      if(!p.torcida || p.torcida === E.torcida.id) continue;
      const q = (p.x-x)*(p.x-x) + (p.y-y)*(p.y-y);
      if(q <= md){ md = q; it = p; }
    }
    const destino = it ? {x: it.x, y: it.y} : {x, y};
    b.rota = caminho(mo, {x:b.x, y:b.y}, destino);
    b.i = 0; b.t = 0; b.parado = false; b.dirigindo = false; b._indo = null;
    b.saiEm = Math.min(b.saiEm, estado(E).minuto);
    b.entregue = false;
    b.alvoFixo = it ? {tipo: it.tipo, nome: it.label || 'alvo deles',
                       torcidaId: it.torcida, x: it.x, y: it.y} : null;
    b.tocaia = it ? null : {x, y};
    return {ok:true, tipo: it ? 'fixo' : 'tocaia',
            msg: it ? `O bonde vai pra cima d${it.tipo==='sede'?'a sede':'o bar'} `+
                      `deles — ${it.bairro}.`
                    : 'O bonde vai esperar nesse ponto.'};
  }

  /* =======================================================
     DIRIGIR PELA MALHA (WASD)

     A tecla não empurra o disco em linha reta: ela escolhe, entre os
     vizinhos do nó em que o bonde está, o que estiver mais alinhado com
     a direção apertada. Sem vizinho naquela direção o bonde fica onde
     está — parede é parede aqui como é na cena de luta.

     Dirigir cancela a rota calculada; um clique novo devolve o comando
     a ela. Sem isso o jogador e o `caminho()` brigariam pelo mesmo
     disco.
     ======================================================= */
  function dirigir(E, mo, dx, dy, minutos){
    const b = nossoBonde(E);
    if(!b || !(dx || dy)) return null;
    b.dirigindo = true; b.parado = false;
    b.alvoFixo = null; b.tocaia = null;
    const m = Math.hypot(dx, dy) || 1;
    dx /= m; dy /= m;
    const {perto} = malha(mo);
    let resta = VEL * minutos;
    let voltas = 0;
    while(resta > 0 && voltas++ < 40){
      /* `_indo` é o nó pro qual ele está atravessando agora. Guardar
         isso entre quadros é o que mantém o bonde em cima da rua: sem
         ele, cada chamada parava no meio de uma quadra e a seguinte
         perguntava "qual o nó mais perto?" — que no meio da quadra tanto
         pode ser o de trás quanto o da frente. Medido: com o alvo
         guardado, o bonde dirigido fica fora do asfalto na mesma taxa
         dos bondes automáticos (o meio de uma aresta às vezes corta
         calçada); sem ele, cinco vezes mais. */
      if(!b._indo){
        const aqui = perto(b.x, b.y);
        if(!aqui) return b;
        /* o vizinho mais alinhado com a tecla, e só se estiver de fato
           naquele lado: sem vizinho na direção, o bonde fica onde está
           — parede é parede aqui como é na cena de luta */
        let melhor = null, score = 0.15;
        for(const {n:v} of aqui.viz){
          const vx = v.x - aqui.x, vy = v.y - aqui.y, d = Math.hypot(vx, vy) || 1;
          const cos = (vx/d)*dx + (vy/d)*dy;
          if(cos > score){ score = cos; melhor = v; }
        }
        if(!melhor) return b;
        b._indo = {x:melhor.x, y:melhor.y};
      }
      const ax = b._indo.x - b.x, ay = b._indo.y - b.y;
      const d = Math.hypot(ax, ay);
      if(d <= resta){
        b.x = b._indo.x; b.y = b._indo.y;
        b.andou += d; resta -= d; b._indo = null;
      } else {
        b.x += ax*(resta/d); b.y += ay*(resta/d);
        b.andou += resta; resta = 0;
      }
    }
    b.rota = [{x:b.x, y:b.y}, {x:b.x, y:b.y}]; b.i = 0; b.t = 0;
    return b;
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

    /* PRA ONDE O BONDE COMANDADO FOI MANDADO. Sem isto o jogador clica
       num ponto e o mapa não confirma nada — a ordem só apareceria dez
       segundos depois, quando o disco começasse a se aproximar. */
    const meu = nossoBonde(E);
    const dest = meu && (meu.alvoFixo || meu.tocaia);
    if(dest){
      ctx.save();
      ctx.strokeStyle = meu.alvoFixo ? '#e04b45' : '#d9a441';
      ctx.setLineDash([7,6]); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(meu.x, meu.y); ctx.lineTo(dest.x, dest.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(dest.x, dest.y, 9, 0, Math.PI*2);
      ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }

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
      /* o anel de selecionado: é dele que o WASD manda */
      if(b.comandado && R.selecionado === b.id){
        ctx.beginPath(); ctx.arc(b.x, b.y, r + 6, 0, Math.PI*2);
        ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 2; ctx.stroke();
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
          nossoJogo, naEsplanada, marcarQueEntraram,
          anfitriaoDe, escoltaDe,
          porOlheiro, visivel, desenhar, relogio,
          nossoBonde, sairDaSede, mandarPara, dirigir, DIA_VAZIO,
          VEL, ANTES, JANELA, MANHA_COM_HOSPEDE, apitoDoDia, aberturaDoDia,
          RAIO_ENCONTRO, RAIO_ARREDORES, RAIO_OLHEIRO};
})();
