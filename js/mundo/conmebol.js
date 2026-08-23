/* =========================================================
   CONMEBOL — LIBERTADORES, SUL-AMERICANA E AS COPAS NACIONAIS
   (pedido do dono, 23/08/2026)

   Formato e vagas da temporada 2026, como na vida real.

   LIBERTADORES — 47 clubes de dez países. Brasil 7, Argentina 6,
   os outros oito 4 cada, mais o campeão da Libertadores e o da
   Sul-Americana do ano anterior. Vinte e oito entram direto na
   fase de grupos e quatro chegam pelas fases prévias. Oito grupos
   de quatro, seis fechas, e os DOIS primeiros de cada grupo vão
   às oitavas. Oitavas, quartas e semi em ida e volta; final em
   jogo único.

   SUL-AMERICANA — 44 clubes. Brasil 6, Argentina 6, os outros
   quatro cada. Trinta e dois na fase de grupos: vinte e oito
   diretos e quatro que caíram da Fase 3 da Libertadores. Oito
   grupos de quatro. O PRIMEIRO de cada grupo vai direto às
   oitavas; o SEGUNDO cai no playoff contra os oito TERCEIROS dos
   grupos da Libertadores, e nesse playoff quem vem da Libertadores
   joga a ida em casa.

   COPAS NACIONAIS — uma por país, mata-mata com todas as divisões
   daquele país. É a porta pela qual o clube pequeno encosta no
   grande, e ela existe em todo lugar menos no Brasil, que já tem
   a Copa do Brasil no motor de sempre.
   ========================================================= */
window.TO = window.TO || {};

TO.conmebol = (function(){
  const U = TO.util;
  const M = ()=>TO.mundo;
  const C = ()=>TO.competicoes;
  const L = ()=>TO.ligas;

  /* =======================================================
     AS VAGAS, PAÍS POR PAÍS (régua real de 2026)
     ======================================================= */
  const VAGAS_LIB = {
    'Brasil':7, 'Argentina':6, 'Bolívia':4, 'Chile':4, 'Colômbia':4,
    'Equador':4, 'Paraguai':4, 'Peru':4, 'Uruguai':4, 'Venezuela':4
  };
  const VAGAS_SUL = {
    'Brasil':6, 'Argentina':6, 'Bolívia':4, 'Chile':4, 'Colômbia':4,
    'Equador':4, 'Paraguai':4, 'Peru':4, 'Uruguai':4, 'Venezuela':4
  };

  /* o calendário do ano: semana de cada fase */
  const CAL_LIB = {
    previa:[6, 9, 12],              // fases 1, 2 e 3
    grupos:[15, 17, 19, 21, 23, 25],
    oitavas:[32, 34], quartas:[38, 40], semi:[44, 46], final:[49]
  };
  const CAL_SUL = {
    previa:13,
    grupos:[16, 18, 20, 22, 24, 26],
    playoff:[30, 32], oitavas:[35, 37], quartas:[39, 41],
    semi:[43, 45], final:[48]
  };
  const DIA = 3;                     // quarta-feira

  const nome = id => (M().time(id)||{}).nome || id;
  const paisDe = id => C().paisDe(M().time(id) || {});

  /* =======================================================
     QUEM SE CLASSIFICA

     O ano 1 não tem temporada anterior pra ler, então a ordem
     de mérito sai da qualidade do elenco — é o mesmo que um
     jogo faz quando começa do zero, e a partir do ano 2 vale
     o que aconteceu em campo.
     ======================================================= */
  function ordemDoBrasil(E){
    const S = E.temporada;
    const serieA = S && S.competicoes.find(c=>c.nome === 'Brasileirão Série A');
    const fora = [];
    const copa = S && S.competicoes.find(c=>c.copa);
    if(copa && copa.campeao) fora.push(copa.campeao);
    if(serieA){
      const t = C().tabela(serieA, 0);
      for(const l of t) if(!fora.includes(l.id)) fora.push(l.id);
    }
    if(fora.length) return fora;
    /* jogador de fora: o Brasil não tem temporada, tem resumo — a vaga
       brasileira sai da tabela das ligas, igual à dos outros nove */
    const resumo = L().ordemDoPais(E, 'Brasil');
    if(resumo && resumo.length) return resumo;
    return M().todosTimes.filter(t=>C().paisDe(t)==='Brasil')
      .sort((a,b)=>(b.qualidade||0)-(a.qualidade||0)).map(t=>t.id);
  }

  function ordemDoPais(E, pais){
    if(pais === 'Brasil') return ordemDoBrasil(E);
    const dela = L().ordemDoPais(E, pais);
    if(dela && dela.length) return dela;
    return M().todosTimes.filter(t=>C().paisDe(t)===pais)
      .sort((a,b)=>(b.qualidade||0)-(a.qualidade||0)).map(t=>t.id);
  }

  function vagas(E, tabela, jaPegos){
    const fora = [];
    for(const pais of Object.keys(tabela)){
      const ordem = ordemDoPais(E, pais).filter(id=>!jaPegos.has(id));
      for(const id of ordem.slice(0, tabela[pais])){
        fora.push({id, pais});
        jaPegos.add(id);
      }
    }
    return fora;
  }

  /* =======================================================
     A MONTAGEM DO ANO
     ======================================================= */
  /* mesma razão do arquivo das ligas: a virada refaz as copas do zero,
     e o campeão do ano tem de sobreviver a isso */
  function arquivar(E){
    if(!E.conmebol) return;
    const ano = E.conmebol.ano;
    E.conmebolHistorico = E.conmebolHistorico || [];
    if(E.conmebolHistorico.some(h=>h.ano === ano)) return;
    const resumo = c => c ? {nome:c.nome, campeao:c.campeao, vice:c.vice} : null;
    E.conmebolHistorico.unshift({
      ano,
      libertadores: resumo(E.conmebol.libertadores),
      sulamericana: resumo(E.conmebol.sulamericana),
      copas: Object.values(E.conmebol.copas || {})
        .map(c=>({nome:c.nome, pais:c.pais, campeao:c.campeao, vice:c.vice}))
    });
    E.conmebolHistorico = E.conmebolHistorico.slice(0, 12);
  }

  function montar(E){
    arquivar(E);
    U.usarSemente((E.semente || 1) + (E.data.ano||2026) * 13);
    const pegos = new Set();
    const campeoes = E.conmebolCampeoes || {};

    /* os dois campeões do ano passado entram antes de tudo */
    const donos = [campeoes.libertadores, campeoes.sulamericana]
      .filter(id => id && M().time(id));
    for(const id of donos) pegos.add(id);

    const lib = vagas(E, VAGAS_LIB, pegos)
      .concat(donos.map(id=>({id, pais:paisDe(id), dono:true})));
    const sul = vagas(E, VAGAS_SUL, pegos);

    E.conmebol = {
      ano: E.data.ano,
      libertadores: criarLibertadores(E, lib),
      sulamericana: criarSulamericana(E, sul),
      copas: criarCopasNacionais(E)
    };
    return E.conmebol;
  }

  const chaveVazia = () => ({grupos:[], tabela:[], mata:[], campeao:null,
                             vice:null, fase:'previa'});

  function criarLibertadores(E, lista){
    const c = chaveVazia();
    c.nome = 'Copa Libertadores';
    c.clubes = lista.map(x=>x.id);
    /* 47 clubes: os 4 piores classificados de cada país brigam a prévia
       por 4 vagas, e 28 entram direto */
    /* A CONTA DA PRÉVIA (corrigida em 23/08/2026): a fase de grupos
       tem de fechar em 32 — 28 diretos e 4 que sobem da prévia. Como
       são 47 clubes, 19 vão pra prévia, e ela tem de afunilar 19 em 4
       exatamente como a Conmebol faz:
         Fase 1: os 6 mais fracos, 3 duelos → 3 passam
         Fase 2: esses 3 mais os 13 que esperavam, 16 clubes → 8 passam
         Fase 3: 8 clubes, 4 duelos → 4 vão aos grupos e 4 CAEM NA
                 SUL-AMERICANA, que é o que a vida real faz.
       A versão anterior só ia dividindo a lista ao meio e entregava 2,
       deixando a fase de grupos com 30 e dois grupos de três. */
    const ordem = lista.slice().sort((a,b)=>
      (C().forca(b.id)||0) - (C().forca(a.id)||0));
    c.diretos = ordem.slice(0, 28).map(x=>x.id);
    c.previa  = ordem.slice(28).map(x=>x.id);
    c.faseAtual = 'previa';
    c.previaFase = 0;
    /* os 6 mais fracos abrem; os outros 13 entram na Fase 2 */
    c.vivosPrevia = c.previa.slice(-6);
    c.esperamPrevia = c.previa.slice(0, Math.max(0, c.previa.length - 6));
    return c;
  }

  function criarSulamericana(E, lista){
    const c = chaveVazia();
    c.nome = 'Copa Sul-Americana';
    c.clubes = lista.map(x=>x.id);
    /* 44 clubes e 32 vagas de grupo, das quais 4 são da Libertadores.
       Então 12 entram direto, 32 disputam a Fase Preliminar em 16
       duelos, e os 16 vencedores completam a chave: 12 + 16 + 4 = 32. */
    const ordem = lista.slice().sort((a,b)=>
      (C().forca(b.id)||0) - (C().forca(a.id)||0)).map(x=>x.id);
    c.diretos = ordem.slice(0, 12);
    c.previa  = ordem.slice(12);
    c.esperandoLib = [];             // os 4 que caem da Fase 3 da Liberta
    c.faseAtual = 'previa';
    return c;
  }

  /* =======================================================
     AS COPAS NACIONAIS
     Mata-mata puro com todas as divisões do país. Sorteio
     livre, mando de quem tem a divisão mais alta.
     ======================================================= */
  const SEMANAS_COPA = [10, 14, 18, 24, 28, 34, 40, 46];

  /* A COPA DO PAÍS DO JOGADOR TAMBÉM É JOGADA (régua do dono,
     23/08/2026). Mesma ideia das ligas: a chave da rodada seguinte é
     agendada em `E.temporada` assim que se sabe quem sobrou, e aqui a
     gente lê o placar de volta em vez de sortear. Como a copa é de jogo
     único, quem decide empate é o `jogarDia` — o que dá ao jogador a
     disputa de pênaltis na tela, e não um vencedor sorteado por baixo. */
  const COPA_ID = 'copa-de-fora';
  const NOMES_COPA = {2:'Final', 4:'Semifinal', 8:'Quartas', 16:'Oitavas',
                      32:'16-avos', 64:'32-avos', 128:'Primeira fase'};
  const faseCopa = n => NOMES_COPA[n] || `${n} clubes`;

  function agendaCopa(E, copa){
    const S = E.temporada;
    if(!S || !S.competicoes) return null;
    let c = S.competicoes.find(x=>x.id === COPA_ID);
    if(!c){
      const cl = copa.clubes.slice();
      c = {id:COPA_ID, nome:copa.nome, tipo:'copa-de-fora', deFora:true,
           clubes:cl, grupos:[cl], passam:0, voltas:1,
           pontosCorridos:false, idaEVolta:false,
           rodadas:[], mata:[], campeao:null, vice:null, dia:DIA};
      S.competicoes.push(c);
    }
    return c;
  }

  /* o mando é de quem tem a divisão mais alta; empate de divisão, a força */
  function mandoDe(a, b){
    return (C().forca(b)||0) > (C().forca(a)||0) ? [b, a] : [a, b];
  }

  function agendarCopa(E, copa){
    const c = agendaCopa(E, copa);
    const sem = SEMANAS_COPA[copa.passo];
    if(!c || sem == null) return;
    const vivos = copa.vivos || [];
    if(vivos.length < 2) return;
    const fase = faseCopa(vivos.length);
    if(c.mata.some(m=>m.fase === fase && m.semana === sem)) return;
    const jogos = [];
    for(let k=0;k+1<vivos.length;k+=2){
      const [a, b] = mandoDe(vivos[k], vivos[k+1]);
      jogos.push({c:a, f:b, d:DIA, h:'21:30'});
    }
    c.mata.push({fase, semana:sem, dia:DIA, jogos});
  }

  function chaveAgendada(E, copa, fase, sem){
    const S = E.temporada;
    const c = S && S.competicoes && S.competicoes.find(x=>x.id === COPA_ID);
    if(!c) return null;
    return c.mata.find(m=>m.fase === fase && m.semana === sem) || null;
  }

  function criarCopasNacionais(E){
    const fora = {};
    for(const pais of L().paises(E)){
      const clubes = M().todosTimes.filter(t=>C().paisDe(t)===pais);
      if(clubes.length < 4) continue;
      const nomeCopa = (clubes.find(t=>t.copa)||{}).copa || `Copa ${pais}`;
      /* a chave começa numa potência de 2 que caiba o país inteiro */
      let n = 2;
      while(n * 2 <= clubes.length) n *= 2;
      const ordem = clubes.slice().sort((a,b)=>
        (C().forca(b.id)||0) - (C().forca(a.id)||0)).map(t=>t.id);
      /* os melhores entram já classificados pra primeira chave cheia */
      const dentro = ordem.slice(0, n);
      fora[pais] = {nome:nomeCopa, pais, clubes:ordem,
                    vivos:U.embaralhar(dentro), mata:[],
                    campeao:null, vice:null, passo:0,
                    comJogos: pais === C().paisDoJogador(E)};
      if(fora[pais].comJogos) agendarCopa(E, fora[pais]);
    }
    return fora;
  }

  /* =======================================================
     O DIA
     ======================================================= */
  function rodar(E){
    if(!E.conmebol || E.conmebol.ano !== E.data.ano) montar(E);
    if(E.data.dia !== DIA) return null;
    const feitos = [];
    const lib = andarLibertadores(E);
    if(lib) feitos.push({torneio:'Libertadores', passo:lib});
    const sul = andarSulamericana(E);
    if(sul) feitos.push({torneio:'Sul-Americana', passo:sul});
    for(const pais of Object.keys(E.conmebol.copas||{})){
      const p = andarCopaNacional(E, E.conmebol.copas[pais]);
      if(p) feitos.push({torneio:E.conmebol.copas[pais].nome, passo:p});
    }
    return feitos.length ? feitos : null;
  }

  /* ---- o duelo, com o resultado guardado: a Libertadores é
         notícia, e o clube do jogador pode estar nela ---- */
  function duelo(a, b){
    const [ga, gb] = C().simular(a, b, 0);
    return {c:a, f:b, gc:ga, gf:gb};
  }
  function agregado(a, b){
    const ida = duelo(b, a), volta = duelo(a, b);
    const sa = ida.gf + volta.gc, sb = ida.gc + volta.gf;
    const venceu = sa > sb ? a : sb > sa ? b
                 : C().disputaDePenaltis(a, b).venceu;
    return {ida, volta, sa, sb, venceu};
  }

  function andarLibertadores(E){
    const c = E.conmebol.libertadores;
    if(c.campeao) return null;
    const sem = E.data.semana;

    if(c.faseAtual === 'previa'){
      const q = CAL_LIB.previa[c.previaFase];
      if(sem !== q) return null;
      let vivos = c.vivosPrevia;
      if(c.previaFase === 1 && (c.esperamPrevia||[]).length){
        vivos = c.vivosPrevia = vivos.concat(c.esperamPrevia);
        c.esperamPrevia = [];
      }
      if(c.previaFase >= CAL_LIB.previa.length-1){
        /* Fase 3: quem perde cai na Sul-Americana, como na vida real */
        const pares = emPares(vivos);
        const caidos = [];
        const passa = [];
        for(const [a,b] of pares){
          const r = agregado(a,b);
          passa.push(r.venceu);
          caidos.push(r.venceu === a ? b : a);
        }
        c.mata.push({fase:'Fase 3', semana:sem, jogos:pares.map(([a,b],k)=>
          ({c:a, f:b, agregado:true}))});
        c.diretos = c.diretos.concat(passa.slice(0, 4));
        E.conmebol.sulamericana.esperandoLib = caidos.slice(0, 4);
        c.mata[c.mata.length-1].jogos = pares.slice(0,4).map(([a,b])=>({c:a,f:b}));
        abrirGrupos(E, c, CAL_LIB.grupos);
        return {fase:'grupos', clubes:c.diretos.length};
      }
      const pares = emPares(vivos);
      c.vivosPrevia = pares.map(([a,b])=>agregado(a,b).venceu);
      c.previaFase++;
      return {fase:`Fase ${c.previaFase}`, seguem:c.vivosPrevia.length};
    }

    if(c.faseAtual === 'grupos'){
      const i = CAL_LIB.grupos.indexOf(sem);
      if(i < 0) return null;
      rodarFechaDeGrupo(c, i);
      if(i === CAL_LIB.grupos.length - 1){
        /* passam os dois primeiros; os terceiros vão pro playoff da Sul */
        const segundos = [], primeiros = [], terceiros = [];
        c.grupos.forEach((g, ig)=>{
          const t = L().ordenar(c.tabela[ig], g);
          primeiros.push(t[0].id); segundos.push(t[1].id);
          if(t[2]) terceiros.push(t[2].id);
        });
        c.vivos = cruzar(primeiros, segundos);
        E.conmebol.sulamericana.terceirosLib = terceiros;
        c.faseAtual = 'mata';
        c.matasFeitas = 0;
      }
      return {fase:`grupos ${i+1}/6`};
    }

    if(c.faseAtual === 'mata'){
      const cal = [CAL_LIB.oitavas, CAL_LIB.quartas, CAL_LIB.semi, CAL_LIB.final];
      const passo = cal[c.matasFeitas];
      if(!passo || sem !== passo[0]) return null;
      return andarChave(E, c, ['Oitavas','Quartas','Semifinal','Final']);
    }
    return null;
  }

  function andarSulamericana(E){
    const c = E.conmebol.sulamericana;
    if(c.campeao) return null;
    const sem = E.data.semana;

    if(c.faseAtual === 'previa'){
      if(sem !== CAL_SUL.previa) return null;
      const pares = emPares(c.previa || []);
      const passa = pares.map(([a,b])=>agregado(a,b).venceu);
      c.mata.push({fase:'Fase Preliminar', semana:sem,
                   jogos:pares.map(([a,b])=>({c:a, f:b}))});
      c.diretos = c.diretos.concat(passa);
      c.faseAtual = 'espera';
      return {fase:'Fase Preliminar', seguem:passa.length};
    }

    if(c.faseAtual === 'espera'){
      if(sem < CAL_SUL.grupos[0]) return null;
      c.diretos = c.diretos.concat(c.esperandoLib || []);
      abrirGrupos(E, c, CAL_SUL.grupos);
      return {fase:'grupos', clubes:c.diretos.length};
    }

    if(c.faseAtual === 'grupos'){
      const i = CAL_SUL.grupos.indexOf(sem);
      if(i < 0) return null;
      rodarFechaDeGrupo(c, i);
      if(i === CAL_SUL.grupos.length - 1){
        const primeiros = [], segundos = [];
        c.grupos.forEach((g, ig)=>{
          const t = L().ordenar(c.tabela[ig], g);
          primeiros.push(t[0].id); segundos.push(t[1].id);
        });
        c.primeiros = primeiros; c.segundos = segundos;
        c.faseAtual = 'playoff';
      }
      return {fase:`grupos ${i+1}/6`};
    }

    if(c.faseAtual === 'playoff'){
      if(sem !== CAL_SUL.playoff[0]) return null;
      /* segundos da Sul contra terceiros da Libertadores; a ida é na
         casa de quem vem da Libertadores */
      const vindos = (c.terceirosLib || []).slice(0, c.segundos.length);
      const jogos = [];
      const passa = [];
      c.segundos.forEach((s, k)=>{
        const lib = vindos[k];
        if(!lib){ passa.push(s); return; }
        const r = agregado(s, lib);       // ida na casa do da Libertadores
        passa.push(r.venceu);
        jogos.push({c:s, f:lib, gc:r.sa, gf:r.sb, venceu:r.venceu});
      });
      c.mata.push({fase:'Playoff', semana:sem, jogos});
      c.vivos = cruzar(c.primeiros, passa);
      c.faseAtual = 'mata';
      c.matasFeitas = 0;
      return {fase:'Playoff', seguem:c.vivos.length};
    }

    if(c.faseAtual === 'mata'){
      const cal = [CAL_SUL.oitavas, CAL_SUL.quartas, CAL_SUL.semi, CAL_SUL.final];
      const passo = cal[c.matasFeitas];
      if(!passo || sem !== passo[0]) return null;
      return andarChave(E, c, ['Oitavas','Quartas','Semifinal','Final']);
    }
    return null;
  }

  /* ---- peças comuns ---- */
  const emPares = lista => {
    const fora = [];
    for(let k=0;k+1<lista.length;k+=2) fora.push([lista[k], lista[k+1]]);
    return fora;
  };
  /* o cruzamento das oitavas: 1º de um grupo contra 2º de outro */
  const cruzar = (primeiros, segundos) => {
    const fora = [];
    primeiros.forEach((p, k)=>{
      fora.push(p);
      fora.push(segundos[(k + 1) % segundos.length]);
    });
    return fora;
  };

  function abrirGrupos(E, c, cal){
    /* 32 é regra, não sugestão: faltando gente, os melhores de fora
       completam, que é melhor do que grupo de três */
    let dentro = c.diretos.slice(0, 32);
    if(dentro.length < 32){
      const sobra = (c.clubes||[]).filter(id=>!dentro.includes(id))
        .sort((a,b)=>(C().forca(b)||0)-(C().forca(a)||0));
      dentro = dentro.concat(sobra.slice(0, 32 - dentro.length));
    }
    const pote = U.embaralhar(dentro);
    c.grupos = Array.from({length:8}, ()=>[]);
    pote.forEach((id, k)=> c.grupos[k % 8].push(id));
    c.tabela = c.grupos.map(()=>({}));
    c.faseAtual = 'grupos';
    c.calGrupos = cal;
  }

  function rodarFechaDeGrupo(c, fecha){
    c.grupos.forEach((g, ig)=>{
      for(const [a,b] of L().jogosDaFecha(g, fecha, 2)){
        const j = duelo(a, b);
        const tab = c.tabela[ig];
        const la = tab[a] || (tab[a] = L().linha(a));
        const lb = tab[b] || (tab[b] = L().linha(b));
        la.j++; lb.j++;
        la.gp += j.gc; la.gc += j.gf; lb.gp += j.gf; lb.gc += j.gc;
        if(j.gc > j.gf){ la.v++; la.p += 3; lb.d++; }
        else if(j.gf > j.gc){ lb.v++; lb.p += 3; la.d++; }
        else { la.e++; lb.e++; la.p++; lb.p++; }
      }
    });
  }

  function andarChave(E, c, nomes){
    const vivos = c.vivos || [];
    if(vivos.length < 2){ c.campeao = vivos[0] || null; return {fase:'fim'}; }
    const rot = nomes[c.matasFeitas] || `${vivos.length} clubes`;
    const jogos = [], passa = [];
    const final = rot === 'Final';
    for(let k=0;k+1<vivos.length;k+=2){
      const a = vivos[k], b = vivos[k+1];
      if(final){
        const j = duelo(a, b);
        j.venceu = j.gc>j.gf ? a : j.gf>j.gc ? b
                 : C().disputaDePenaltis(a,b).venceu;
        j.neutro = true;
        jogos.push(j); passa.push(j.venceu);
      } else {
        const r = agregado(a, b);
        jogos.push({c:a, f:b, gc:r.sa, gf:r.sb, venceu:r.venceu});
        passa.push(r.venceu);
      }
    }
    c.mata.push({fase:rot, semana:E.data.semana, jogos});
    c.vivos = passa;
    c.matasFeitas++;
    if(passa.length === 1){
      c.campeao = passa[0];
      const f = jogos[0];
      c.vice = f.venceu === f.c ? f.f : f.c;
      E.conmebolCampeoes = E.conmebolCampeoes || {};
      E.conmebolCampeoes[c.nome === 'Copa Libertadores'
        ? 'libertadores' : 'sulamericana'] = c.campeao;
      return {fase:rot, campeao:c.campeao};
    }
    return {fase:rot, seguem:passa.length};
  }

  function andarCopaNacional(E, copa){
    if(!copa || copa.campeao) return null;
    const sem = SEMANAS_COPA[copa.passo];
    if(sem == null || E.data.semana !== sem) return null;
    const vivos = copa.vivos || [];
    if(vivos.length < 2){ copa.campeao = vivos[0] || null; return null; }
    const fase = faseCopa(vivos.length);
    const marcada = copa.comJogos ? chaveAgendada(E, copa, fase, sem) : null;
    const jogos = [], passa = [];
    for(let k=0;k+1<vivos.length;k+=2){
      const [a, b] = mandoDe(vivos[k], vivos[k+1]);
      const feito = marcada &&
        marcada.jogos.find(x=>x.c === a && x.f === b && x.gc != null);
      const j = feito ? {c:a, f:b, gc:feito.gc, gf:feito.gf,
                         venceu:feito.venceu, pen:feito.pen || null}
                      : duelo(a, b);
      if(!j.venceu)
        j.venceu = j.gc>j.gf ? a : j.gf>j.gc ? b : C().disputaDePenaltis(a,b).venceu;
      jogos.push(j); passa.push(j.venceu);
    }
    copa.mata.push({fase, semana:sem, jogos});
    copa.vivos = passa;
    copa.passo++;
    if(copa.comJogos) agendarCopa(E, copa);
    if(passa.length === 1){
      copa.campeao = passa[0];
      const f = jogos[0];
      copa.vice = f.venceu === f.c ? f.f : f.c;
      return {fase:'Final', campeao:copa.campeao};
    }
    return {fase:copa.mata[copa.mata.length-1].fase, seguem:passa.length};
  }

  return {VAGAS_LIB, VAGAS_SUL, CAL_LIB, CAL_SUL, DIA,
          montar, rodar, arquivar, ordemDoPais, ordemDoBrasil, nome};
})();
