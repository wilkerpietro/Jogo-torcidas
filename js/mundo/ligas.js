/* =========================================================
   LIGAS SUL-AMERICANAS (régua do dono, 23/08/2026)

   Os nove países da expansão jogam o FORMATO REAL de 2026 —
   Apertura e Clausura com campeão próprio, quadrangular
   semifinal, hexagonal, tabela anual, promedios e final entre
   campeões. Os formatos estão em docs/FORMATOS_SULAMERICANOS.md,
   pesquisados e aprovados um por um.

   O QUE ESTE ARQUIVO GUARDA, E O QUE ELE JOGA FORA
   (decisão do dono, opção 1): a liga do jogador — o Brasil —
   continua com a tabela de jogos inteira, no motor de sempre.
   As de fora rodam o formato real mas guardam só o que a tela
   mostra: a CLASSIFICAÇÃO e o mata-mata. As rodadas da fase
   regular são sorteadas, resolvidas e descartadas.

   O motivo é medido: deixando o motor detalhado montar tudo, a
   temporada vai a 20.714 jogos e o save passa de 2,3 MB antes
   de fechar o primeiro ano. Guardando só a tabela, o mundo
   inteiro cabe em dezenas de KB — uma linha de 60 bytes por
   clube, 248 clubes.
   ========================================================= */
window.TO = window.TO || {};

TO.ligas = (function(){
  const U = TO.util;
  const M = ()=>TO.mundo;
  const C = ()=>TO.competicoes;

  /* =======================================================
     OS FORMATOS, PAÍS POR PAÍS

     fases: a sequência que decide o campeão do torneio.
       {t:'regular',      fechas, zonas, interzonais}
       {t:'quadrangular', grupos, porGrupo, fechas}   (vem dos `passam`)
       {t:'hexagonal',    porGrupo, fechas}
       {t:'mata',         de, jogoUnico, finalNeutra} (de = quantos entram)
       {t:'final2'}                                    (final ida e volta)
     ======================================================= */
  const FORMATOS = {
    'Argentina Primera': {
      torneios:['Apertura','Clausura'], inicio:[6, 30],
      fases:[{t:'regular', fechas:16, zonas:2, interzonais:2},
             {t:'mata', de:16, jogoUnico:true, finalNeutra:true}],
      passam:8,                       // por zona
      anual:true, promedios:3, caem:2, campeaoDeLiga:true
    },
    'Argentina Primera Nacional': {
      torneios:['Primera Nacional'], inicio:[8],
      fases:[{t:'regular', fechas:19, zonas:2, interzonais:0},
             {t:'mata', de:16, jogoUnico:true}],
      passam:8, anual:true, sobem:2, caem:4, aproximado:true
    },
    'Argentina Primera B': {
      torneios:['Primera B'], inicio:[8],
      fases:[{t:'regular', fechas:19, zonas:1, interzonais:0},
             {t:'mata', de:8, jogoUnico:true}],
      passam:8, sobem:2, aproximado:true
    },
    'Bolívia Primera': {
      torneios:['Liga','Copa da División'], inicio:[6, 32],
      fases:[{t:'regular', fechas:30, zonas:1, interzonais:0}],
      /* a Copa da División é o segundo torneio: 4 grupos de 4 e chave */
      porTorneio:{'Copa da División':
        {fases:[{t:'quadrangular', grupos:4, porGrupo:4, fechas:6},
                {t:'mata', de:4, jogoUnico:false}], passam:16}},
      caem:2
    },
    'Chile Primera': {
      torneios:['Liga de Primera'], inicio:[10],
      fases:[{t:'regular', fechas:30, zonas:1, interzonais:0}],
      caem:2
    },
    'Chile Primera B': {
      torneios:['Liga de Ascenso'], inicio:[10],
      fases:[{t:'regular', fechas:30, zonas:1, interzonais:0},
             {t:'mata', de:4, jogoUnico:false}],
      passam:4, sobem:2, aproximado:true
    },
    'Colômbia Primera A': {
      torneios:['Apertura','Finalización'], inicio:[4, 30],
      fases:[{t:'regular', fechas:19, zonas:1, interzonais:0},
             {t:'quadrangular', grupos:2, porGrupo:4, fechas:6},
             {t:'final2'}],
      passam:8, anual:true, caem:2
    },
    'Colômbia Primera B': {
      torneios:['Apertura B','Finalización B'], inicio:[4, 30],
      fases:[{t:'regular', fechas:15, zonas:1, interzonais:0},
             {t:'quadrangular', grupos:2, porGrupo:4, fechas:6},
             {t:'final2'}],
      passam:8, sobem:2, aproximado:true
    },
    'Equador Serie A': {
      torneios:['LigaPro'], inicio:[8],
      fases:[{t:'regular', fechas:30, zonas:1, interzonais:0},
             {t:'hexagonal', porGrupo:6, fechas:10}],
      passam:6, caem:2
    },
    'Paraguai Primera': {
      torneios:['Apertura','Clausura'], inicio:[5, 30],
      fases:[{t:'regular', fechas:22, zonas:1, interzonais:0}],
      anual:true, caem:1
    },
    'Peru Liga 1': {
      torneios:['Apertura','Clausura'], inicio:[6, 30],
      fases:[{t:'regular', fechas:17, zonas:1, interzonais:0}],
      anual:true, playoffTitulo:4, caem:2
    },
    'Uruguai Primera': {
      torneios:['Apertura','Intermedio','Clausura'], inicio:[6, 24, 32],
      fases:[{t:'regular', fechas:15, zonas:1, interzonais:0}],
      porTorneio:{'Intermedio':
        {fases:[{t:'quadrangular', grupos:2, porGrupo:8, fechas:7},
                {t:'mata', de:2, jogoUnico:true}], passam:16}},
      anual:true, finalDosCampeoes:true, caem:2
    },
    'Venezuela Primera': {
      torneios:['Apertura','Clausura'], inicio:[6, 30],
      fases:[{t:'regular', fechas:13, zonas:1, interzonais:0},
             {t:'quadrangular', grupos:2, porGrupo:4, fechas:6},
             {t:'final2'}],
      passam:8, anual:true, serieFinal:true, caem:2
    }
  };

  /* O BRASIL NO MOTOR DE RESUMO. Só serve quando o jogador é de fora:
     aí o Brasil vira mais um dos dez, com tabela e sobe-e-desce, sem
     jogo guardado. O formato é o mesmo que `competicoes.js` monta —
     turno e returno nas três primeiras séries, quatro grupos e playoff
     na D —, porque é a mesma competição vista de longe. */
  const FORMATOS_BR = {
    'Brasileirão Série A': {
      torneios:['Brasileirão'], inicio:[16],
      fases:[{t:'regular', fechas:38, zonas:1}],
      anual:true, caem:4, campeaoDeLiga:true},
    'Brasileirão Série B': {
      torneios:['Série B'], inicio:[16],
      fases:[{t:'regular', fechas:38, zonas:1}],
      anual:true, sobem:4, caem:4},
    'Brasileirão Série C': {
      torneios:['Série C'], inicio:[16],
      fases:[{t:'regular', fechas:38, zonas:1}],
      anual:true, sobem:4, caem:4},
    'Brasileirão Série D': {
      torneios:['Série D'], inicio:[16],
      fases:[{t:'regular', fechas:11, zonas:4},
             {t:'mata', de:16, jogoUnico:false}],
      passam:4, sobem:4},
  };
  Object.assign(FORMATOS, FORMATOS_BR);

  const NOME_FASE = {2:'Final', 4:'Semifinal', 8:'Quartas',
                     16:'Oitavas', 32:'16-avos'};
  /* O TIQUE FECHOU A SEMANA (23/08/2026): era quinta, e virou domingo
     porque a fecha do país do jogador é jogada no fim de semana — o
     tique tem que vir DEPOIS dela pra ler o placar, não antes. */
  const DIA = 7;
  const PASSO = 1;                     // uma semana entre um tique e outro
  const FIM_DO_ANO = 51;               // a última semana em que se joga

  /* QUANTAS FECHAS CABEM NUMA SEMANA (correção medida em 23/08/2026):
     o Finalización colombiano começa na semana 30 e pede 19 fechas mais
     o quadrangular de 6 — dá 55, e o ano tem 52. O torneio simplesmente
     não terminava, e sem terminar ninguém caía: a Primera A foi de 20
     pra 26 clubes em três anos enquanto a B minguava.

     O conserto é o que o futebol de verdade faz quando o calendário
     aperta: rodada no meio de semana. Aqui isso vira mais de uma fecha
     por tique, calculado do total que falta contra as semanas que
     sobram. */
  function fechasPorTique(T){
    const total = T.fases.reduce((s,f)=>s + (f.fechas || 1), 0);
    const espaco = Math.max(1, FIM_DO_ANO - T.inicio);
    return Math.max(1, Math.ceil(total / espaco));
  }

  /* =======================================================
     O JOGO — mesma régua do Brasil, resultado descartado
     ======================================================= */
  function placar(a, b){ return C().simular(a, b, 0); }

  function linha(id){ return {id, j:0, v:0, e:0, d:0, gp:0, gc:0, p:0}; }

  function anotar(tab, a, b, ga, gb){
    const la = tab[a] || (tab[a] = linha(a));
    const lb = tab[b] || (tab[b] = linha(b));
    la.j++; lb.j++;
    la.gp += ga; la.gc += gb; lb.gp += gb; lb.gc += ga;
    if(ga > gb){ la.v++; la.p += 3; lb.d++; }
    else if(gb > ga){ lb.v++; lb.p += 3; la.d++; }
    else { la.e++; lb.e++; la.p++; lb.p++; }
  }

  const ordenar = (tab, ids) => (ids || Object.keys(tab))
    .map(id => tab[id] || linha(id))
    .sort((x,y)=> (y.p - x.p) || ((y.gp-y.gc) - (x.gp-x.gc)) ||
                  (y.gp - x.gp) || (x.id < y.id ? -1 : 1));

  /* turno da rodada `r` num grupo, pelo método do círculo. Não se
     guarda a tabela de jogos: ela é recalculada quando a fecha chega. */
  function jogosDaFecha(grupo, r, voltas){
    const t = grupo.slice();
    if(t.length % 2) t.push(null);
    const n = t.length, porTurno = n - 1;
    const turno = Math.floor(r / porTurno) % Math.max(1, voltas);
    const passo = r % porTurno;
    const giro = t.slice(1);
    for(let k=0;k<passo;k++) giro.unshift(giro.pop());
    const ordem = [t[0]].concat(giro);
    const fora = [];
    for(let k=0;k<n/2;k++){
      const a = ordem[k], b = ordem[n-1-k];
      if(!a || !b) continue;
      /* o returno inverte o mando */
      fora.push(turno % 2 ? [b, a] : [a, b]);
    }
    return fora;
  }

  /* =======================================================
     O PAÍS DO JOGADOR JOGA DE VERDADE
     (régua do dono, 23/08/2026)

     "O país cuja torcida que o jogador selecionar deve gerar os jogos
     e as demais geram somente as tabelas."

     Este motor sempre soube QUEM joga contra quem — o método do círculo
     é determinístico — mas jogava tudo no mesmo instante e guardava só
     a classificação. Era isso que deixava quem escolhia uma barra sem
     dia de jogo nenhum: o dia de jogo nasce de `E.temporada`, e lá fora
     não havia temporada.

     Agora, e só pro país da nossa torcida, cada fase é AGENDADA assim
     que os pares dela são conhecidos: uma competição-sombra entra em
     `E.temporada` no formato que `competicoes.js` usa, e o `jogarDia`
     dele é que roda os jogos. Na hora da fecha, este motor lê o placar
     de volta em vez de sortear. Um só lugar decide os pares, um só
     lugar simula, e a tabela continua sendo a daqui.

     Os outros nove países seguem como estavam — resumo, sem jogo
     guardado —, que é o que mantém o mundo inteiro em 64 KB de save.
     ======================================================= */
  /* a grade do país do jogador: fecha no fim de semana, mata-mata com
     ida no meio e volta no domingo, como se joga lá */
  const GRADE_FORA = [{d:6, h:'17:00'}, {d:6, h:'19:30'}, {d:7, h:'16:00'},
                      {d:7, h:'18:30'}, {d:7, h:'20:00'}];
  const MATA_IDA   = {d:4, h:'21:30'};
  const MATA_VOLTA = {d:7, h:'18:00'};

  function nossoPais(E){
    return C().paisDoJogador ? C().paisDoJogador(E) : 'Brasil';
  }

  function agendaDe(E, T){
    const S = E.temporada;
    if(!S || !S.competicoes) return null;
    let c = S.competicoes.find(x=>x.id === T.compId);
    if(!c){
      const cl = (T.clubesDoTorneio || []).slice();
      c = {id:T.compId, nome:T.nomeCheio, tipo:'liga-de-fora', deFora:true,
           clubes:cl, grupos:[cl], passam:0, voltas:1,
           pontosCorridos:true, idaEVolta:false,
           rodadas:[], mata:[], dia:GRADE_FORA[2].d,
           campeao:null, vice:null};
      S.competicoes.push(c);
    }
    return c;
  }

  function agendar(E, T, semana, pares, slot, rot){
    if(semana > FIM_DO_ANO + 1) return;
    const c = agendaDe(E, T);
    if(!c || !pares.length) return;
    const tag = slot ? `${semana}|${slot.d}` : `${semana}|fecha`;
    let r = c.rodadas.find(x=>x.tag === tag);
    if(!r){
      r = {semana, tag, dia:(slot || GRADE_FORA[0]).d, jogos:[]};
      if(rot) r.rot = rot;
      c.rodadas.push(r);
      c.rodadas.sort((x,y)=> x.semana - y.semana || x.dia - y.dia);
    }
    pares.forEach(([a,b], k)=>{
      if(r.jogos.some(j=>j.c === a && j.f === b)) return;
      const g = slot || GRADE_FORA[k % GRADE_FORA.length];
      r.jogos.push({c:a, f:b, d:g.d, h:g.h, g:0});
    });
  }

  function resultadoAgendado(E, T, a, b){
    const S = E.temporada;
    const c = S && S.competicoes && S.competicoes.find(x=>x.id === T.compId);
    if(!c) return null;
    for(const r of c.rodadas)
      for(const j of r.jogos)
        if(j.c === a && j.f === b && j.gc != null) return [j.gc, j.gf];
    return null;
  }

  /* o placar do país do jogador vem do jogo que já aconteceu; o do
     resto do mundo continua sendo sorteado na hora */
  function placarDe(E, T, a, b){
    if(T && T.comJogos){
      const r = resultadoAgendado(E, T, a, b);
      if(r) return r;
    }
    return placar(a, b);
  }

  function agendarRegular(E, T, fase){
    const n = T.porTique || 1;
    for(let f = 0; f < fase.fechas; f++)
      agendar(E, T, T.inicio + Math.floor(f / n) * PASSO,
              paresRegular(T, fase, f));
  }

  function agendarGrupo(E, T, fase, semana0){
    const n = T.porTique || 1;
    for(let f = 0; f < fase.fechas; f++)
      agendar(E, T, semana0 + Math.floor(f / n) * PASSO,
              paresGrupo(T, fase, f).map(x=>[x[1], x[2]]));
  }

  const paresDaChave = T => {
    const vivos = T.vivos || [], fora = [];
    for(let k = 0; k < vivos.length / 2; k++)
      fora.push([vivos[k], vivos[vivos.length - 1 - k]]);
    return fora;
  };

  /* a chave do país do jogador sai uma semana antes, que é o tempo que
     a véspera, o itinerário e a caravana precisam pra existir */
  function agendarChave(E, T, fase){
    const idaEVolta = fase.t === 'final2' || fase.jogoUnico === false;
    const vivos = (T.vivos || []).length;
    const rot = fase.t === 'final2' ? 'Final'
              : (NOME_FASE[vivos] || `${vivos} clubes`);
    for(const [a,b] of paresDaChave(T)){
      if(idaEVolta){
        agendar(E, T, T.semanaFase, [[b,a]], MATA_IDA, rot + ' · ida');
        agendar(E, T, T.semanaFase, [[a,b]], MATA_VOLTA, rot + ' · volta');
      } else {
        agendar(E, T, T.semanaFase, [[a,b]], MATA_VOLTA, rot);
      }
    }
  }
  /* =======================================================
     A EDIÇÃO DO ANO
     ======================================================= */
  const divisoesDe = pais => Object.keys(FORMATOS).filter(d =>
    (M().todosTimes.find(t=>t.divisao === d) || {}).pais === pais);

  /* O BRASIL SÓ ENTRA AQUI QUANDO O JOGADOR É DE FORA. Com jogador
     brasileiro quem manda no Brasil é `competicoes.js`, que tem
     estadual e Copa do Brasil; rodar os dois motores no mesmo país
     daria duas tabelas divergentes pro mesmo Brasileirão. */
  function paises(E){
    const nosso = nossoPais(E);
    const s = new Set();
    for(const t of M().todosTimes){
      const p = C().paisDe(t);
      if(p === 'Brasil' && nosso === 'Brasil') continue;
      if(FORMATOS[t.divisao]) s.add(p);
    }
    return [...s].sort();
  }

  const clubesDa = (E, div) => M().todosTimes
    .filter(t => ((E.divisoesLiga||{})[t.id] || t.divisao) === div)
    .map(t => t.id);

  /* ANTES DE REMONTAR, GUARDA (correção de 23/08/2026): a virada do
     ano refaz `E.ligas` do zero, e sem este arquivo o campeão de cada
     país sumia junto — a tela e o jornal ficariam sem nada pra contar
     de dezembro. Guarda só o resumo: campeão, vice, quem subiu e quem
     caiu. As tabelas ficam para trás de propósito. */
  function arquivar(E){
    if(!E.ligas || !E.ligas.paises) return;
    const ano = E.ligas.ano;
    E.ligasHistorico = E.ligasHistorico || [];
    if(E.ligasHistorico.some(h=>h.ano === ano)) return;
    const paises = {};
    for(const pais of Object.keys(E.ligas.paises)){
      const P = E.ligas.paises[pais];
      paises[pais] = Object.keys(P.divisoes).map(div=>{
        const D = P.divisoes[div];
        return {div, campeao:D.campeao, vice:D.vice,
                campeaoDeLiga:D.campeaoDeLiga || null,
                como:D.comoFechou || '',
                torneios:D.torneios.map(t=>({nome:t.nome, campeao:t.campeao,
                                             vice:t.vice})),
                sobem:(D.sobem||[]).slice(), caem:(D.caem||[]).slice()};
      });
    }
    E.ligasHistorico.unshift({ano, paises});
    /* o Histórico por competição lê daqui (dono, 25/08/2026): 12 anos
       apagavam a história cedo demais — agora cabem 80 */
    E.ligasHistorico = E.ligasHistorico.slice(0, 80);
  }

  /* SOBE E DESCE: o que a temporada decidiu vira a divisão do ano que
     vem. Mora em `E.divisoesLiga`, do mesmo jeito que o Brasil guarda
     a dele em `E.divisoes`. */
  function aplicarSobeDesce(E){
    if(!E.ligas) return;
    E.divisoesLiga = E.divisoesLiga || {};
    for(const pais of Object.keys(E.ligas.paises)){
      const P = E.ligas.paises[pais];
      const ordem = Object.keys(P.divisoes);
      for(let k=0;k<ordem.length-1;k++){
        const cima = P.divisoes[ordem[k]], baixo = P.divisoes[ordem[k+1]];
        if(!cima || !baixo) continue;
        /* SÓ TROCA SE OS DOIS LADOS DECIDIRAM (correção de 23/08/2026):
           quando uma divisão não terminava, ela não rebaixava ninguém
           mas continuava recebendo quem subia — a Primera A colombiana
           chegou a 26 clubes e a B a 10 em três anos. */
        const caem = cima.caem || [], sobem = baixo.sobem || [];
        if(!caem.length || !sobem.length) continue;
        const n = Math.min(caem.length, sobem.length);
        for(const id of caem.slice(0, n))  E.divisoesLiga[id] = ordem[k+1];
        for(const id of sobem.slice(0, n)) E.divisoesLiga[id] = ordem[k];
      }
    }
  }

  function montar(E){
    arquivar(E);
    aplicarSobeDesce(E);
    U.usarSemente((E.semente || 1) + (E.data.ano||2026) * 7);
    const L = {ano: E.data.ano, paises: {}};
    const nosso = nossoPais(E);
    for(const pais of paises(E)){
      const P = {divisoes: {}};
      for(const div of divisoesDe(pais)){
        const f = FORMATOS[div];
        const clubes = U.embaralhar(clubesDa(E, div));
        if(clubes.length < 4) continue;
        const D = {nome: div, clubes, torneios: [], anual: {},
                   campeao: null, sobem: [], caem: []};
        f.torneios.forEach((nome, k)=>{
          const esp = (f.porTorneio || {})[nome];
          const T = {
            nome, id: U.identificador(`${div}-${nome}`),
            fases: (esp && esp.fases) || f.fases,
            passam: (esp && esp.passam) || f.passam || 0,
            inicio: f.inicio[k] || (6 + k*26),
            faseAtual: 0, fecha: 0,
            /* torneio que abre em fase de grupos (o Intermedio uruguaio)
               precisa da semana marcada já na montagem: sem ela `andar`
               comparava com `undefined` e o torneio nunca começava */
            semanaFase: f.inicio[k] || (6 + k*26),
            zonas: null, tabela: {}, grupos: null, tabelaGrupo: null,
            mata: [], campeao: null, vice: null, fim: false
          };
          T.porTique = fechasPorTique(T);
          if(T.fases[0] && T.fases[0].t !== 'regular'){
            /* abre já na fase de grupos: monta o grupo na primeira semana */
            T.abreEmGrupo = true;
          }
          /* O CALENDÁRIO DO NOSSO PAÍS NASCE NA MONTAGEM, não na semana
             de estreia: fecha 1 tem que estar marcada antes do dia dela
             chegar, senão a estreia era a única fecha sem dia de jogo. */
          if(pais === nosso){
            T.comJogos = true;
            T.compId = 'fora-' + T.id;
            T.nomeCheio = f.torneios.length > 1 ? `${div} · ${nome}` : div;
            T.clubesDoTorneio = clubes.slice();
            const f0 = T.fases[0];
            if(f0 && f0.t === 'regular'){
              T.zonas = repartir(D.clubes, f0.zonas || 1);
              agendarRegular(E, T, f0);
            } else if(T.abreEmGrupo && f0){
              abrirGrupoDaFase(T, f0, D);
              agendarGrupo(E, T, f0, T.semanaFase);
            }
          }
          D.torneios.push(T);
        });
        P.divisoes[div] = D;
      }
      L.paises[pais] = P;
    }
    E.ligas = L;
    return L;
  }

  /* =======================================================
     O DIA
     ======================================================= */
  function rodar(E){
    if(!E.ligas || E.ligas.ano !== E.data.ano) montar(E);
    if(E.data.dia !== DIA) return null;
    const feitos = [];
    for(const pais of Object.keys(E.ligas.paises)){
      const P = E.ligas.paises[pais];
      for(const div of Object.keys(P.divisoes)){
        const D = P.divisoes[div];
        for(const T of D.torneios){
          if(T.fim) continue;
          const passo = andar(E, D, T);
          if(passo) feitos.push({pais, div, torneio:T.nome, passo});
        }
      }
      fecharPais(E, pais, P);
    }
    return feitos.length ? feitos : null;
  }

  /* uma semana do torneio, se hoje for a semana dele */
  function andar(E, D, T){
    const fase = T.fases[T.faseAtual];
    if(!fase) { T.fim = true; return null; }

    const n = T.porTique || 1;

    if(fase.t === 'regular'){
      if(E.data.semana < T.inicio) return null;
      if(T.fecha >= fase.fechas){ return proximaFase(E, D, T); }
      if(E.data.semana < T.inicio + Math.floor(T.fecha / n) * PASSO) return null;
      if(!T.zonas) T.zonas = repartir(D.clubes, fase.zonas || 1);
      for(let k=0;k<n && T.fecha < fase.fechas;k++){
        rodarFechaRegular(E, T, fase);
        T.fecha++;
      }
      if(T.fecha >= fase.fechas) return proximaFase(E, D, T);
      return {fase:'regular', fecha:T.fecha, de:fase.fechas};
    }

    if(fase.t === 'quadrangular' || fase.t === 'hexagonal'){
      if(E.data.semana < T.semanaFase) return null;
      if(!T.grupos) abrirGrupoDaFase(T, fase, D);
      if(T.fecha >= fase.fechas) return proximaFase(E, D, T);
      for(let k=0;k<n && T.fecha < fase.fechas;k++){
        rodarFechaGrupo(E, T, fase);
        T.fecha++;
      }
      if(T.fecha >= fase.fechas) return proximaFase(E, D, T);
      return {fase:fase.t, fecha:T.fecha, de:fase.fechas};
    }

    if(fase.t === 'mata' || fase.t === 'final2'){
      if(E.data.semana !== T.semanaFase) return null;
      return rodarMata(E, D, T, fase);
    }
    return null;
  }

  function repartir(clubes, quantas){
    if(quantas <= 1) return [clubes.slice()];
    const z = Array.from({length:quantas}, ()=>[]);
    clubes.forEach((id, k)=> z[k % quantas].push(id));
    return z;
  }

  /* QUEM JOGA CONTRA QUEM, SEM JOGAR AINDA. Isto era o miolo do
     `rodarFecha*`; virou função à parte porque a agenda do país do
     jogador precisa saber os pares de uma fecha ANTES da semana dela
     chegar — é assim que o jogo do nosso clube vira dia de jogo. */
  function paresRegular(T, fase, fecha){
    const zonas = T.zonas || [];
    const intra = fase.fechas - (fase.interzonais || 0);
    const fora = [];
    if(fecha < intra){
      for(const z of zonas){
        const voltas = Math.max(1, Math.ceil(intra / Math.max(1, z.length-1)));
        for(const par of jogosDaFecha(z, fecha, voltas)) fora.push(par);
      }
    } else {
      /* fecha interzonal: cada clube de uma zona pega o par da outra */
      const [A, B] = [zonas[0] || [], zonas[1] || []];
      const desloca = fecha - intra;
      for(let k=0;k<Math.min(A.length, B.length);k++)
        fora.push([A[k], B[(k + desloca) % B.length]]);
    }
    return fora;
  }

  /* [indice do grupo, mandante, visitante] */
  function paresGrupo(T, fase, fecha){
    const fora = [];
    (T.grupos || []).forEach((g, ig)=>{
      const voltas = fase.fechas > (g.length-1) ? 2 : 1;
      for(const [a,b] of jogosDaFecha(g, fecha, voltas)) fora.push([ig, a, b]);
    });
    return fora;
  }

  function rodarFechaRegular(E, T, fase){
    for(const [a,b] of paresRegular(T, fase, T.fecha)){
      const [ga,gb] = placarDe(E, T, a, b);
      anotar(T.tabela, a, b, ga, gb);
    }
  }

  function rodarFechaGrupo(E, T, fase){
    for(const [ig, a, b] of paresGrupo(T, fase, T.fecha)){
      const [ga,gb] = placarDe(E, T, a, b);
      anotar(T.tabelaGrupo[ig], a, b, ga, gb);
    }
  }

  /* fecha a fase corrente e abre a seguinte */
  function proximaFase(E, D, T){
    T.faseAtual++;
    T.fecha = 0;
    const fase = T.fases[T.faseAtual];
    T.semanaFase = E.data.semana + PASSO;
    if(!fase){ coroar(T); return {fase:'fim', campeao:T.campeao}; }

    if(fase.t === 'quadrangular' || fase.t === 'hexagonal'){
      abrirGrupoDaFase(T, fase, D);
      if(T.comJogos) agendarGrupo(E, T, fase, T.semanaFase);
      return {fase:'abre-'+fase.t, grupos:T.grupos.map(g=>g.length)};
    }
    if(fase.t === 'mata' || fase.t === 'final2') return abrirMata(E, T, fase);
    return null;
  }

  /* monta os grupos da fase: os classificados da fase regular, ou o
     elenco inteiro quando o torneio JÁ COMEÇA em grupo (o Intermedio) */
  function abrirGrupoDaFase(T, fase, D){
    const fonte = Object.keys(T.tabela).length
      ? classificados(T, T.passam || fase.porGrupo)
      : (D ? D.clubes.slice() : []);
    const quantos = fase.grupos || 1;
    T.grupos = Array.from({length:quantos}, ()=>[]);
    T.tabelaGrupo = Array.from({length:quantos}, ()=>({}));
    /* serpentina: o 1º e o último na mesma chave, como a Dimayor semeia */
    fonte.forEach((id, k)=>{
      const volta = Math.floor(k / quantos);
      const pos = volta % 2 ? quantos - 1 - (k % quantos) : k % quantos;
      T.grupos[pos].push(id);
    });
  }

  const classificados = (T, quantos) => {
    if(T.zonas && T.zonas.length > 1)
      return T.zonas.flatMap(z => ordenar(T.tabela, z).slice(0, quantos).map(l=>l.id));
    return ordenar(T.tabela, T.clubes || null).slice(0, quantos).map(l=>l.id);
  };

  function abrirMata(E, T, fase){
    let vivos;
    if(fase.t === 'final2'){
      /* os líderes de cada quadrangular fazem a final */
      vivos = (T.tabelaGrupo || []).map((tab, ig)=>
        ordenar(tab, T.grupos[ig])[0].id);
    } else if(T.tabelaGrupo){
      vivos = (T.tabelaGrupo || []).flatMap((tab, ig)=>
        ordenar(tab, T.grupos[ig]).slice(0, Math.max(1, (fase.de||2)/T.grupos.length)).map(l=>l.id));
    } else {
      vivos = classificados(T, Math.ceil((fase.de || 8) /
        Math.max(1, (T.zonas||[1]).length)));
    }
    T.vivos = vivos;
    /* no país do jogador a chave é AGENDADA pra semana marcada em vez
       de resolvida agora: é o `jogarDia` que joga, e ele precisa do
       jogo no calendário antes do dia chegar */
    if(T.comJogos){
      agendarChave(E, T, fase);
      return {fase:'abre-mata', seguem:vivos.length};
    }
    return jogarChave(E, T, fase);
  }

  /* a chave inteira roda de uma vez por semana, fase a fase */
  function jogarChave(E, T, fase){
    let vivos = T.vivos || [];
    if(vivos.length < 2){ T.campeao = vivos[0] || null; coroar(T); return {fase:'fim'}; }
    const nome = fase.t === 'final2' ? 'Final'
               : (NOME_FASE[vivos.length] || `${vivos.length} clubes`);
    /* cruzamento olímpico: 1×n, 2×n-1 */
    const jogos = [];
    for(let k=0;k<vivos.length/2;k++){
      const a = vivos[k], b = vivos[vivos.length-1-k];
      const idaEVolta = fase.t === 'final2' || fase.jogoUnico === false;
      let ga, gb, venceu;
      if(idaEVolta){
        const [x1,y1] = placarDe(E, T, b, a);   // ida na casa do pior
        const [x2,y2] = placarDe(E, T, a, b);   // volta na casa do melhor
        const sa = y1 + x2, sb = x1 + y2;
        venceu = sa > sb ? a : sb > sa ? b : (C().disputaDePenaltis(a,b).venceu);
        ga = sa; gb = sb;
      } else {
        [ga, gb] = placarDe(E, T, a, b);
        venceu = ga > gb ? a : gb > ga ? b : C().disputaDePenaltis(a,b).venceu;
      }
      jogos.push({c:a, f:b, gc:ga, gf:gb, venceu});
    }
    T.mata.push({fase:nome, semana:E.data.semana, jogos,
                 neutro: !!(fase.finalNeutra && nome === 'Final')});
    T.vivos = jogos.map(j=>j.venceu);
    if(T.vivos.length === 1){
      T.campeao = T.vivos[0];
      const f = jogos[0];
      T.vice = f.venceu === f.c ? f.f : f.c;
      coroar(T);
      return {fase:nome, campeao:T.campeao};
    }
    T.semanaFase = E.data.semana + PASSO;
    if(T.comJogos) agendarChave(E, T, fase);
    return {fase:nome, seguem:T.vivos.length};
  }

  function coroar(T){
    if(!T.campeao){
      const t = ordenar(T.tabela, T.clubes || null);
      T.campeao = t[0] && t[0].id;
      T.vice    = t[1] && t[1].id;
    }
    T.fim = true;
  }

  /* a chave continua na semana seguinte */
  function rodarMata(E, D, T, fase){
    if(T.vivos && T.vivos.length >= 2) return jogarChave(E, T, fase);
    return proximaFase(E, D, T);
  }

  /* =======================================================
     O FIM DO ANO DE CADA PAÍS
     tabela anual, promedios, campeão nacional e sobe-e-desce
     ======================================================= */
  function fecharPais(E, pais, P){
    for(const div of Object.keys(P.divisoes)){
      const D = P.divisoes[div];
      if(D.campeao || !D.torneios.every(t=>t.fim)) continue;
      const f = FORMATOS[div];

      /* a anual soma o que cada torneio somou */
      D.anual = {};
      for(const T of D.torneios)
        for(const id of Object.keys(T.tabela)){
          const l = T.tabela[id], a = D.anual[id] || (D.anual[id] = linha(id));
          a.j+=l.j; a.v+=l.v; a.e+=l.e; a.d+=l.d;
          a.gp+=l.gp; a.gc+=l.gc; a.p+=l.p;
        }

      const campeoes = D.torneios.map(t=>t.campeao).filter(Boolean);
      const unicos = [...new Set(campeoes)];

      if(f.serieFinal || f.finalDosCampeoes || f.playoffTitulo){
        if(unicos.length === 1){
          D.campeao = unicos[0];              // ganhou tudo: campeão direto
          D.comoFechou = 'campeão dos dois torneios';
        } else {
          let chave = unicos.slice();
          if(f.playoffTitulo){
            /* Peru: os dois campeões mais os dois melhores da acumulada */
            const extra = ordenar(D.anual, D.clubes)
              .map(l=>l.id).filter(id=>!chave.includes(id))
              .slice(0, Math.max(0, f.playoffTitulo - chave.length));
            chave = chave.concat(extra);
          }
          if(f.finalDosCampeoes){
            /* Uruguai: o vencedor da anual entra na final */
            const anual = ordenar(D.anual, D.clubes)[0];
            if(anual && !chave.includes(anual.id)) chave.push(anual.id);
          }
          D.decisao = decidirEntre(E, chave);
          D.campeao = D.decisao.campeao;
          D.vice = D.decisao.vice;
          D.comoFechou = f.playoffTitulo ? 'playoff do título'
                       : f.serieFinal ? 'Série Final' : 'final do campeonato';
        }
      } else if(f.campeaoDeLiga){
        /* Argentina: o Campeão de Liga é quem somou mais na anual */
        const t = ordenar(D.anual, D.clubes);
        D.campeaoDeLiga = t[0] && t[0].id;
        D.campeao = D.torneios[D.torneios.length-1].campeao || D.campeaoDeLiga;
        D.comoFechou = 'campeão do Clausura · Campeão de Liga pela anual';
      } else {
        D.campeao = D.torneios[D.torneios.length-1].campeao;
        D.vice    = D.torneios[D.torneios.length-1].vice;
        D.comoFechou = 'campeão do torneio';
      }

      /* PROMEDIOS: média de pontos das últimas N temporadas. Save novo
         não tem três anos de história, então a média corre com o que
         houver — é assim que a AFA faz com clube recém-promovido. */
      E.promedios = E.promedios || {};
      const hist = (E.promedios[div] = E.promedios[div] || {});
      for(const id of Object.keys(D.anual)){
        const h = hist[id] || (hist[id] = []);
        h.push({ano:E.data.ano, p:D.anual[id].p, j:D.anual[id].j});
        if(h.length > (f.promedios || 1)) h.shift();
      }

      const anual = ordenar(D.anual, D.clubes);
      D.tabelaAnual = anual.map(l=>l.id);
      if(f.caem){
        const caem = new Set();
        if(f.promedios){
          /* um cai pelo promedio e um pela anual */
          const med = D.clubes.map(id=>{
            const h = hist[id] || [];
            const jj = h.reduce((s,x)=>s+x.j,0), pp = h.reduce((s,x)=>s+x.p,0);
            return {id, m: jj ? pp/jj : 0};
          }).sort((a,b)=>a.m - b.m);
          if(med[0]) caem.add(med[0].id);
          for(let k=anual.length-1; k>=0 && caem.size < f.caem; k--)
            caem.add(anual[k].id);
        } else {
          for(let k=anual.length-1; k>=0 && caem.size < f.caem; k--)
            caem.add(anual[k].id);
        }
        D.caem = [...caem];
      }
      if(f.sobem) D.sobem = anual.slice(0, f.sobem).map(l=>l.id);
    }
  }

  /* mata-mata curto entre 2 ou 4 clubes, pra decidir o título */
  function decidirEntre(E, ids){
    const jogos = [];
    let vivos = ids.slice();
    while(vivos.length > 1){
      const rodada = [];
      for(let k=0;k<vivos.length/2;k++){
        const a = vivos[k], b = vivos[vivos.length-1-k];
        const [x1,y1] = placar(b,a), [x2,y2] = placar(a,b);
        const sa = y1+x2, sb = x1+y2;
        const venceu = sa>sb ? a : sb>sa ? b : C().disputaDePenaltis(a,b).venceu;
        rodada.push({c:a, f:b, gc:sa, gf:sb, venceu});
      }
      jogos.push({fase: vivos.length === 2 ? 'Final' : 'Semifinal',
                  jogos: rodada});
      vivos = rodada.map(j=>j.venceu);
    }
    const ult = jogos[jogos.length-1].jogos[0];
    return {campeao: vivos[0],
            vice: ult.venceu === ult.c ? ult.f : ult.c, fases: jogos};
  }

  /* =======================================================
     O QUE A TELA E A CONMEBOL LEEM DAQUI
     ======================================================= */
  const nomeDe = id => (M().time(id)||{}).nome || id;

  function tabelaDe(E, div, torneio){
    const D = divisao(E, div);
    if(!D) return [];
    const T = torneio ? D.torneios.find(t=>t.nome===torneio) : D.torneios[0];
    if(!T) return [];
    return ordenar(T.tabela, D.clubes);
  }

  function divisao(E, div){
    for(const pais of Object.keys((E.ligas||{}).paises || {})){
      const D = E.ligas.paises[pais].divisoes[div];
      if(D) return D;
    }
    return null;
  }

  /* a ordem de mérito de um país no fim do ano — é ela que dá as vagas
     da Libertadores e da Sul-Americana */
  function ordemDoPais(E, pais){
    const P = (E.ligas||{}).paises && E.ligas.paises[pais];
    if(!P) return [];
    const primeira = Object.keys(P.divisoes)
      .find(d=>!/Nacional|Primera B|Ascenso|Primera B$/.test(d)) ||
      Object.keys(P.divisoes)[0];
    const D = P.divisoes[primeira];
    if(!D) return [];
    const fora = [];
    for(const T of D.torneios) if(T.campeao && !fora.includes(T.campeao))
      fora.push(T.campeao);
    /* o campeão do ano abre a fila, mesmo quando quem ganhou o torneio
       foi outro: numa liga com tabela anual dá pra ser campeão do país
       sem ter ganho o Clausura, e a primeira vaga é dele */
    if(D.campeao){
      const i = fora.indexOf(D.campeao);
      if(i >= 0) fora.splice(i, 1);
      fora.unshift(D.campeao);
    }
    for(const id of (D.tabelaAnual || [])) if(!fora.includes(id)) fora.push(id);

    /* A ORDEM VALE O ANO INTEIRO (correção de 23/08/2026): a tabela
       anual só nasce no fechamento do país, então no meio da temporada
       isto devolvia uma lista de um nome — o campeão do Apertura — e a
       tela de vagas mostrava uma vaga de Libertadores e nenhuma de
       Sul-Americana. Agora, faltando gente, entra a anual em construção,
       depois a tabela do torneio que está correndo, e por último o que
       sobrar, pela força do elenco. Quem já está na lista não repete. */
    const juntar = tab => {
      if(!tab) return;
      for(const l of ordenar(tab, D.clubes))
        if(!fora.includes(l.id)) fora.push(l.id);
    };
    if(fora.length < D.clubes.length && D.anual && Object.keys(D.anual).length)
      juntar(D.anual);
    for(let k = D.torneios.length - 1; k >= 0 && fora.length < D.clubes.length; k--)
      juntar(D.torneios[k].tabela);
    if(fora.length < D.clubes.length){
      const resto = D.clubes.filter(id=>!fora.includes(id))
        .sort((a,b)=>(C().forca(b)||0) - (C().forca(a)||0));
      for(const id of resto) fora.push(id);
    }
    return fora;
  }

  return {FORMATOS, montar, rodar, tabelaDe, divisao, ordemDoPais,
          arquivar, aplicarSobeDesce,
          paises, divisoesDe, ordenar, linha, jogosDaFecha, nomeDe,
          DIA, decidirEntre, clubesDa};
})();
