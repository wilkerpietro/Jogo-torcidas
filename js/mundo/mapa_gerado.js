/* =========================================================
   MAPA GERADO — a cidade que não tem arte
   ---------------------------------------------------------
   Três praças têm foto: Fortaleza, São Paulo e Belo Horizonte.
   Cada `dados/cidade_mapa*.js` traz a máscara de rua, os
   bairros por k-means, os lotes com frente pra rua e os
   gramados, tudo tirado da imagem. As outras 27 não têm, e o
   mapa quebrava nelas — o desenho foi reescrito pra camada de
   pinos da arte e a via procedural antiga ficou sem `pinos`
   nem `regioes`.

   Este módulo devolve, pra qualquer cidade, um objeto com a
   MESMA forma da arte. Quem consome — pinos, filtros, briga
   de rua, contorno de bairro — não sabe a diferença.

   A planta é a cruz do GDD §19.3: Norte em cima, Sul embaixo,
   Oeste e Leste nos flancos, e o miolo é o centro. Cada bairro
   vira um retângulo com avenida em volta, ruas internas
   cortando em quarteirões, e lote é toda célula construída que
   encosta numa rua. O sorteio é por hash do nome, então a
   mesma cidade sai igual em toda partida.
   ========================================================= */
window.TO = window.TO || {};

TO.mapaGerado = (function(){

  const LARGURA = 1200;
  const PASSO   = 10;
  const N       = LARGURA / PASSO;   // 120 células de lado

  const AVENIDA   = 2;   // largura da via entre bairros, em células
  const RUA       = 1;   // via interna entre quarteirões
  const QUARTEIRAO = 5;  // lado do quarteirão, em células

  /* A mesma distribuição por zona que o mapa já usava: quantos bairros
     cabem em cada lado decide o formato da cruz. */
  function planta(porLado){
    if(porLado >= 4) return {cols:4, rows:6, onde:{
      Norte: i=>({r:Math.floor(i/2),   c:(i%2)+1}),
      Sul:   i=>({r:Math.floor(i/2)+4, c:(i%2)+1}),
      Oeste: i=>({r:Math.floor(i/2)+2, c:(i%2)===0?0:1}),
      Leste: i=>({r:Math.floor(i/2)+2, c:(i%2)===0?2:3})
    }};
    if(porLado === 3) return {cols:5, rows:5, onde:{
      Norte: i=>({r:0, c:i+1}), Sul: i=>({r:4, c:i+1}),
      Oeste: i=>({r:i+1, c:0}), Leste: i=>({r:i+1, c:4})
    }};
    return {cols:3, rows:4, onde:{
      Norte: i=>({r:0, c:i+1}), Sul: i=>({r:3, c:i+1}),
      Oeste: i=>({r:i+1, c:0}), Leste: i=>({r:i+1, c:2})
    }};
  }

  /* =======================================================
     A GERAÇÃO
     ======================================================= */
  const _cache = {};

  function arteDe(idCidade){
    if(_cache[idCidade] !== undefined) return _cache[idCidade];
    /* quem tem desenho próprio não empresta nem gera nada */
    const propria = (TO.dados.cidadeMapas || {})[idCidade];
    if(propria) return (_cache[idCidade] = propria);
    const cidade = TO.mundo.cidade(idCidade);
    if(!cidade || !(cidade.bairros||[]).length) return (_cache[idCidade] = null);
    /* praça Grande herda a foto de Fortaleza; o resto ganha planta */
    const foto = emprestada(cidade);
    return (_cache[idCidade] = foto || gerar(cidade));
  }

  /* =======================================================
     A FOTO EMPRESTADA
     A arte de Fortaleza é uma cidade brasileira de 16 bairros
     em quatro zonas — e as cinco praças Grandes do jogo têm
     exatamente isso: 16 bairros, 4 por zona. Então a mesma
     imagem serve pra todas, com os bairros trocados de nome.

     O que se empresta é a GEOMETRIA: a máscara de rua, os
     lotes com frente pra rua e os três gramados desenhados. O
     que é da cidade continua sendo dela: nome, classe social
     (que decide receita e cena de briga) e zona.

     Os estádios se reposicionam sozinhos. Cada gramado sabe em
     que região caiu, e `paresDeEstadio` casa o estádio da praça
     com o gramado por porte — o maior campo pro estádio de
     maior capacidade. O bairro do estádio passa a ser o do
     gramado, que é onde ele de fato está no desenho.
     ======================================================= */
  const ZONAS = ['Norte','Sul','Leste','Oeste'];

  function emprestada(cidade){
    const base = (TO.dados||{}).cidadeMapa;
    if(!base || cidade.tamanho !== TO.mundo.PRACA_JOGAVEL) return null;
    if(cidade.id === base.cidade) return null;          // a dona da foto
    if((cidade.bairros||[]).length !== base.bairros.length) return null;

    /* casa zona com zona, em ordem: a arte tem 4 por zona e a praça
       Grande também. Sem isso um bairro do Norte cairia no Sul do
       desenho e a cidade viraria outra coisa. */
    const daArte = {}, daPraca = {};
    for(const z of ZONAS){
      daArte[z]  = base.bairros.map((b,i)=>({b,i})).filter(x=>x.b.zona === z);
      daPraca[z] = cidade.bairros.filter(b=>b.zona === z);
      if(daArte[z].length !== daPraca[z].length) return null;
    }

    const bairros = new Array(base.bairros.length);
    for(const z of ZONAS)
      daArte[z].forEach(({b, i}, k)=>{
        const n = daPraca[z][k];
        bairros[i] = {nome:n.nome, id:n.id, zona:n.zona, classe:n.classe,
                      mult:n.mult, x:b.x, y:b.y, area:b.area, i};
      });

    /* em que região cada gramado caiu — é o que dá o bairro novo dele */
    const reg = regioesDe(base);
    const estadios = (base.estadios||[]).map(e=>{
      const k = reg(e.x, e.y);
      return Object.assign({}, e,
        {bairro: (bairros[k] || bairros[0]).nome});
    });

    /* a máscara, os lotes e a imagem vão por referência: são os mesmos
       bytes pras cinco praças, e clonar 35 KB cinco vezes não paga */
    return Object.assign({}, base, {cidade:cidade.id, emprestada:true,
                                    bairros, estadios});
  }

  /* lê o raster de regiões da arte sem depender do decodificador do
     mapa, que é privado dele */
  function regioesDe(a){
    const n = Math.floor(a.largura / a.passo);
    const linhas = a.regioes.split(';');
    return (x, y)=>{
      const c = Math.floor(x / a.passo), r = Math.floor(y / a.passo);
      if(c < 0 || r < 0 || r >= linhas.length || c >= linhas[r].length) return 0;
      return parseInt(linhas[r][c], 36) - 1;
    };
  }

  function gerar(cidade){
    const hash = TO.mapa.hash;
    const porZona = {Norte:[], Sul:[], Leste:[], Oeste:[]};
    for(const b of cidade.bairros) (porZona[b.zona] || porZona.Norte).push(b);
    const porLado = Math.max(1, ...Object.values(porZona).map(z=>z.length));
    const P = planta(porLado);

    /* o quadro da cruz fica centrado no raster quadrado; a sobra vira a
       borda da cidade, andável de ponta a ponta — é por ela que se
       contorna a praça sem passar pelo centro */
    const lado  = Math.floor(N / Math.max(P.cols, P.rows));
    const largo = lado * P.cols, alto = lado * P.rows;
    const ox = Math.floor((N - largo)/2), oy = Math.floor((N - alto)/2);

    const andavel = new Uint8Array(N*N);
    const regiao  = new Int8Array(N*N).fill(-1);
    const bairros = [], lotes = {};

    /* a moldura de fora é rua */
    const marcaRua = (c, r) => { if(c>=0 && c<N && r>=0 && r<N) andavel[r*N+c] = 1; };
    for(let c=0;c<N;c++) for(let k=0;k<AVENIDA;k++){
      marcaRua(c, oy-1-k); marcaRua(c, oy+alto+k);
    }
    for(let r=0;r<N;r++) for(let k=0;k<AVENIDA;k++){
      marcaRua(ox-1-k, r); marcaRua(ox+largo+k, r);
    }

    let idx = 0;
    for(const zona of ['Norte','Sul','Oeste','Leste']){
      porZona[zona].forEach((b, i)=>{
        const pos = P.onde[zona](i);
        if(pos.c < 0 || pos.c >= P.cols || pos.r < 0 || pos.r >= P.rows) return;
        const c0 = ox + pos.c*lado, r0 = oy + pos.r*lado;
        montarBairro({andavel, regiao, lotes, bairros, idx, b, c0, r0, lado, hash});
        idx++;
      });
    }

    /* Os estádios ficam no bairro que a tabela manda, ocupando um
       quarteirão inteiro — é o que o GDD §21.6 pede e o que faz o campo
       aparecer como área e não como pino solto. */
    const estadios = [];
    for(const e of (TO.mundo.estadiosEm(cidade.id) || [])){
      const k = bairros.findIndex(x=>x.nome === e.bairro);
      const b = bairros[k >= 0 ? k : hash(e.nome||'e') % bairros.length];
      if(!b) continue;
      const w = QUARTEIRAO*PASSO*1.6, h = QUARTEIRAO*PASSO*1.15;
      estadios.push({x:b.x, y:b.y, w, h, bairro:b.nome});
      /* o gramado engole os lotes que ficam embaixo dele */
      const lista = lotes[String(b.i)] || [];
      lotes[String(b.i)] = lista.filter(([c, r])=>{
        const x = (c+0.5)*PASSO, y = (r+0.5)*PASSO;
        return !(x > b.x-w/2 && x < b.x+w/2 && y > b.y-h/2 && y < b.y+h/2);
      });
    }

    return {
      cidade: cidade.id, sintetica: true,
      largura: LARGURA, altura: LARGURA, passo: PASSO,
      bairros, lotes, estadios,
      andavel: rle(andavel), regioes: base36(regiao)
    };
  }

  /* Um bairro: avenida na borda, quarteirões dentro separados por rua, e
     lote é a célula construída que encosta em rua — casa sem frente pra
     rua não é endereço de nada. */
  function montarBairro(o){
    const {andavel, regiao, lotes, bairros, idx, b, c0, r0, lado, hash} = o;
    const c1 = c0 + lado, r1 = r0 + lado;
    const dentro = (c, r) => c>=c0 && c<c1 && r>=r0 && r<r1;

    /* a região cobre o retângulo inteiro, rua inclusive: é o bairro */
    for(let r=r0;r<r1;r++) for(let c=c0;c<c1;c++)
      if(c<N && r<N) regiao[r*N+c] = idx;

    /* avenida em volta */
    for(let r=r0;r<r1;r++) for(let c=c0;c<c1;c++){
      const naBorda = c < c0+AVENIDA || c >= c1-AVENIDA
                   || r < r0+AVENIDA || r >= r1-AVENIDA;
      if(naBorda && c<N && r<N) andavel[r*N+c] = 1;
    }

    /* ruas internas, de QUARTEIRAO em QUARTEIRAO */
    const passoQ = QUARTEIRAO + RUA;
    for(let d = AVENIDA + QUARTEIRAO; d < lado - AVENIDA; d += passoQ){
      for(let k=0;k<RUA;k++){
        for(let c=c0;c<c1;c++) if(c<N && r0+d+k<N) andavel[(r0+d+k)*N+c] = 1;
        for(let r=r0;r<r1;r++) if(r<N && c0+d+k<N) andavel[r*N+c0+d+k] = 1;
      }
    }

    /* lote = construído que encosta em rua */
    const meus = [];
    for(let r=r0;r<r1;r++) for(let c=c0;c<c1;c++){
      if(c>=N || r>=N || andavel[r*N+c]) continue;
      const vizinhoDeRua =
        (c>0   && andavel[r*N+c-1]) || (c<N-1 && andavel[r*N+c+1]) ||
        (r>0   && andavel[(r-1)*N+c]) || (r<N-1 && andavel[(r+1)*N+c]);
      if(vizinhoDeRua) meus.push([c, r]);
    }
    /* ordem estável e embaralhada por hash: dois pinos vizinhos na lista
       não caem em lotes colados */
    meus.sort((p, q)=>hash(`${b.id}|${p[0]},${p[1]}`) - hash(`${b.id}|${q[0]},${q[1]}`));
    lotes[String(idx)] = meus;

    bairros.push({
      nome:b.nome, id:b.id, zona:b.zona, classe:b.classe,
      mult:b.mult, i:idx,
      x:(c0 + lado/2)*PASSO, y:(r0 + lado/2)*PASSO,
      area:(lado*lado)/(N*N)*100
    });
  }

  /* =======================================================
     CODIFICAÇÃO — o mesmo formato que decodificar() espera
     ======================================================= */
  function rle(m){
    const linhas = [];
    for(let r=0;r<N;r++){
      const runs = [];
      let v = 0, n = 0;
      for(let c=0;c<N;c++){
        const x = m[r*N+c];
        if(x === v) n++;
        else { runs.push(n); v = x; n = 1; }
      }
      runs.push(n);
      linhas.push(runs.join(','));
    }
    return linhas.join(';');
  }
  function base36(reg){
    const linhas = [];
    for(let r=0;r<N;r++){
      let s = '';
      for(let c=0;c<N;c++) s += (reg[r*N+c] + 1).toString(36);
      linhas.push(s);
    }
    return linhas.join(';');
  }

  return {arteDe, emprestada, LARGURA, PASSO, N};
})();
