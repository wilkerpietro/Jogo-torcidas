/* =========================================================
   A GAZETA DOS SPORTS (régua do dono, 20/08/2026)

   A rodada deixou de ser uma linha corrida de placares e virou
   primeira página de jornal. Aqui mora só a LÓGICA: qual jogo
   é a manchete, que molde de frase cada pedaço usa e o que vai
   pra cada coluna. Quem desenha é main.js; quem guarda os
   jogos do dia é a própria mensagem, em `dados.jogos`.

   NADA É ESCRITO NA HORA. Toda frase sai de um molde aprovado
   pelo dono, preenchido com o que o jogo já sabe. Onde há mais
   de um molde pra mesma condição, eles andam numa FILA: dentro
   da mesma edição nenhum se repete, e a escolha é determinada
   pelo dia — a mesma rodada dá sempre a mesma página, o que
   importa porque a mensagem sobrevive ao save.
   ========================================================= */
window.TO = window.TO || {};

TO.gazeta = (function(){
  const M = ()=>TO.mundo;

  const COMP = ()=>TO.competicoes;
  const nome    = id => (M().time(id)||{}).nome || id;
  const estadio = id => (M().time(id)||{}).estadio || '';
  const mapaDe  = id => (M().time(id)||{}).mapa;
  const saldo   = j => Math.abs(j.gc - j.gf);
  const gols    = j => j.gc + j.gf;
  const vencedor = j => j.gc > j.gf ? j.c : j.gf > j.gc ? j.f : null;
  const perdedor = j => j.gc > j.gf ? j.f : j.gf > j.gc ? j.c : null;
  /* "do Mineiro" mas "da Copa do Nordeste": o artigo segue o nome */
  const dArt = n => !n ? 'a rodada' : (/^(Copa|Taça|Série)/i.test(n) ? `a ${n}` : `o ${n}`);
  /* ESTÁDIO TEM GÊNERO: é "na Arena Castelão" e "no Maracanã". Arena e
     Vila são femininos; o resto do país é masculino. */
  const artEst = e => !e ? '' : (/^(Arena|Vila|Ilha)\b/i.test(e) ? 'na' : 'no');
  const noEst  = e => e ? `${artEst(e)} ${e}` : '';
  const NoEst  = e => e ? `N${artEst(e)} ${e}` : '';

  const MES = ['janeiro','fevereiro','março','abril','maio','junho','julho',
               'agosto','setembro','outubro','novembro','dezembro'];
  const DIA_SEM = ['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const ROMANO = n => ['','I','II','III','IV','V','VI','VII','VIII','IX','X',
                       'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][n] || n;

  /* =======================================================
     OS MOLDES (aprovados pelo dono, 20/08/2026)
     Cada lista é uma fila: dentro da edição a próxima frase da
     mesma condição é a de baixo, e no fim volta pro começo.
     ======================================================= */
  const MOLDES = {
    /* 1 · chapéu — condição única, não alterna */
    chapeu:{
      goleada:  ['A maior goleada do dia'],
      decisao:  ['Dia de decisão'],
      classico: ['Clássico na nossa praça'],
      semana:   ['Rodada do meio de semana'],
      padrao:   ['O jogo do dia']
    },
    /* 2 · manchete */
    manchete:{
      s5:['{A} passa o rodo no {B}',
          'Chuva de gols do {A} sobre o {B}',
          '{A} faz {gA} no {B} e não toma nenhum'],
      s4:['{A} atropela o {B}',
          '{A} passeia sobre o {B}'],
      s3:['{A} passa fácil pelo {B}',
          '{A} não dá chance ao {B}',
          '{A} resolve cedo contra o {B}'],
      s2:['{A} bate o {B} com autoridade',
          '{A} vence o {B} sem apuros'],
      s1fora:['{A} vence fora e leva os pontos do {B}',
              '{A} arranca a vitória na casa do {B}'],
      s1casa:['{A} bate o {B} no sufoco',
              '{A} leva a melhor num jogo de detalhe'],
      empate:['{c} e {f} empatam num jogo de {G} gols',
              '{c} e {f} dividem os pontos'],
      zero:['{c} e {f} ficam no zero',
            'Nem {c} nem {f}: o dia foi de zero a zero'],
      mata:['{A} elimina o {B} e está n{fase}'],
      penaltis:['{A} passa pelo {B} nos pênaltis']
    },
    /* 3 · olho da manchete */
    olho:{
      comEstadio:['{gA} a {gB} {noEst}, o placar mais largo desta rodada d{comp}.'],
      semEstadio:['{gA} a {gB}, o placar mais largo desta rodada d{comp}.'],
      diaCheio:['{gA} a {gB} {noEst}, num dia de {N} jogos e {Gdia} gols.'],
      empate:['Ficou no {gA} a {gB} {noEst}, pela {rod}ª rodada d{comp}.'],
      mata:['{gA} a {gB} {noEst}, n{fase} d{comp}.']
    },
    /* 4 · na nossa praça */
    praca:{
      um:['O {A} recebeu o {B} e o placar fechou em {gA} × {gB} {noEst}.',
          '{NoEst}, {A} e {B} fecharam em {gA} × {gB}.'],
      dois:['Dois jogos na cidade: {l1} e {l2}.'],
      nenhum:['Sem outro jogo na nossa praça nesta rodada.',
              'A cidade ficou quieta: nenhum outro jogo por aqui.']
    },
    /* 5 · a caixa do nosso jogo */
    nossa:{
      vitoriaFora:['Vitória fora de casa, pel{comp}.'],
      vitoriaCasa:['Vitória em casa, na {rod}ª rodada d{comp}.'],
      empate:['Empate na {rod}ª rodada d{comp}.'],
      derrota:['Derrota na {rod}ª rodada d{comp}.'],
      goleadaPro:['Goleada nossa, pel{comp}.'],
      goleadaContra:['Baile do {adv}, pel{comp}.'],
      naoJogou:['Não joga hoje']
    },
    /* 6 · pelo país */
    nota:{
      s4:['Goleada sem sustos.',
          'Passeio do {A} de ponta a ponta.',
          'O {B} não apareceu em campo.'],
      s3:['Resolvido antes do intervalo.',
          'Três de vantagem e nenhum susto no fim.'],
      s2:['Vitória tranquila do {A}.',
          'O {A} controlou o jogo sem apertar.'],
      s1fora:['O visitante levou os pontos de fora.',
              'O {A} calou a casa do {B}.'],
      s1casa:['Vitória em casa, no sufoco.',
              'O {A} segurou a vantagem até o apito.'],
      empate:['Os dois marcaram e nenhum levou.'],
      zero:['Empate travado, sem quem levasse a melhor.',
            'Zero a zero de jogo amarrado.']
    }
  };

  /* preenche as lacunas de um molde */
  function encher(molde, v){
    return String(molde).replace(/\{(\w+)\}/g, (t, k)=> v[k] != null ? v[k] : t);
  }

  /* =======================================================
     A FILA DOS MOLDES
     Um contador por condição, dentro da edição: a primeira nota
     de goleada usa o molde 0, a segunda o 1, a terceira o 2 e a
     quarta volta pro 0. O ponto de partida vem do dia, então a
     mesma rodada dá sempre a mesma página.
     ======================================================= */
  function filaDe(semente){
    const usados = {};
    return (lista, chave)=>{
      if(!lista || !lista.length) return '';
      const k = chave || lista[0];
      if(usados[k] === undefined) usados[k] = semente % lista.length;
      const i = usados[k] % lista.length;
      usados[k]++;
      return lista[i];
    };
  }

  /* =======================================================
     A MONTAGEM
     ======================================================= */
  function montar(E, m){
    const d = m && m.dados;
    if(!d || !(d.jogos||[]).length) return null;
    const jogos = d.jogos;
    const q = m.quando || {};
    const ano = q.ano || E.data.ano, sem = q.semana || 1, dia = q.dia || 1;
    const dt = TO.estado.dataDaSemana(ano, sem, dia);
    const proxima = filaDe((dt.getDate() + dt.getMonth()*31) || 1);

    const totalGols = jogos.reduce((s,j)=>s+gols(j), 0);
    const comps = [];
    for(const j of jogos) if(j.comp && !comps.includes(j.comp)) comps.push(j.comp);

    /* =====================================================
       A RÉGUA DA CAPA (régua do dono, 20/08/2026)

       Jornal não abre pelo placar mais largo: abre pelo jogo
       dos times de mais FORÇA. Um 4 a 0 na quarta divisão não
       tira a capa de um clássico de Série A.

       A EXCEÇÃO é o dono do jornal. Se o nosso clube joga numa
       divisão que não é a de cima, o leitor é dali: primeiro
       vêm os jogos da NOSSA divisão, e só depois a força
       manda. Com o clube na Série A as duas réguas dizem a
       mesma coisa, e a exceção não muda nada.
       ===================================================== */
    /* SEM try/catch AQUI. A primeira versão embrulhava as duas em
       try/catch "por segurança", e quando um `const C` local passou a
       sombrear o COMP() do módulo o erro sumiu calado: a força virou
       zero pra todo mundo e a capa voltou a sair pelo saldo, sem
       ninguém perceber. Se a API não existir, é pra quebrar alto. */
    const forca = id => COMP().forcaDe(E, id) || 0;
    const divDe = id => COMP().forcaDivisao(E, id);
    const meuDiv = divDe(E.torcida.clubeId);
    /* só vale a exceção quem não está na divisão de cima */
    const daNossaDiv = j => meuDiv > 0 &&
      (divDe(j.c) === meuDiv || divDe(j.f) === meuDiv) ? 0 : 1;
    const peso = j => Math.max(forca(j.c), forca(j.f));
    const pesoTotal = j => forca(j.c) + forca(j.f);
    const naCapa = (a,b) =>
      daNossaDiv(a) - daNossaDiv(b) ||
      peso(b) - peso(a) ||
      pesoTotal(b) - pesoTotal(a) ||
      saldo(b) - saldo(a) || gols(b) - gols(a);

    const topo = jogos.slice().sort(naCapa)[0];

    const nosso = d.nosso || null;
    const praca = jogos.filter(j => mapaDe(j.c) === E.torcida.mapa &&
                                    !(nosso && j.c===nosso.c && j.f===nosso.f));
    const ehClassico = praca.some(j => mapaDe(j.c) === mapaDe(j.f));

    /* ---- chapéu ---- */
    const CH = MOLDES.chapeu;
    const chapeu = topo.fase ? CH.decisao[0]
                 : saldo(topo) >= 3 ? CH.goleada[0]
                 : ehClassico ? CH.classico[0]
                 : (dia >= 1 && dia <= 5) ? CH.semana[0]
                 : CH.padrao[0];

    /* ---- manchete ---- */
    const A = vencedor(topo), B = perdedor(topo);
    const vTopo = {A: A?nome(A):'', B: B?nome(B):'',
                   c: nome(topo.c), f: nome(topo.f),
                   gA: Math.max(topo.gc, topo.gf), gB: Math.min(topo.gc, topo.gf),
                   G: gols(topo), fase: topo.fase ? dArt(topo.fase) : '',
                   comp: dArt(topo.comp), rod: topo.rod,
                   est: estadio(topo.c), noEst: noEst(estadio(topo.c)),
                   N: jogos.length, Gdia: totalGols};
    const H = MOLDES.manchete;
    const forceD = !A ? (gols(topo) ? 'empate' : 'zero')
      : topo.pen ? 'penaltis'
      : topo.fase ? 'mata'
      : saldo(topo) >= 5 ? 's5' : saldo(topo) === 4 ? 's4'
      : saldo(topo) === 3 ? 's3' : saldo(topo) === 2 ? 's2'
      : (A === topo.f ? 's1fora' : 's1casa');
    const manchete = encher(proxima(H[forceD], 'manchete'), vTopo);

    /* ---- olho ---- */
    const O = MOLDES.olho;
    const olho = encher(
      topo.fase ? O.mata[0]
      : !A ? O.empate[0]
      : !estadio(topo.c) ? O.semEstadio[0]
      : jogos.length >= 8 && saldo(topo) < 3 ? O.diaCheio[0]
      : O.comEstadio[0], vTopo);

    /* ---- na nossa praça ---- */
    const P = MOLDES.praca;
    let textoPraca;
    if(praca.length >= 2){
      const l = j => `${nome(j.c)} ${j.gc} × ${j.gf} ${nome(j.f)}`;
      textoPraca = encher(P.dois[0], {l1:l(praca[0]), l2:l(praca[1])});
    } else if(praca.length === 1){
      const j = praca[0];
      const est = estadio(j.c);
      const molde = est ? proxima(P.um, 'praca') : P.um[0].replace(' {noEst}','');
      textoPraca = encher(molde, {A:nome(j.c), B:nome(j.f), gA:j.gc, gB:j.gf,
                                  noEst:noEst(est), NoEst:NoEst(est)});
    } else {
      textoPraca = proxima(P.nenhum, 'pracaVazia');
    }

    /* ---- a caixa do nosso jogo ---- */
    const NS = MOLDES.nossa;
    let caixa = null;
    if(nosso){
      const meu = E.torcida.clubeId;
      const emCasa = nosso.c === meu;
      const meus = emCasa ? nosso.gc : nosso.gf;
      const deles = emCasa ? nosso.gf : nosso.gc;
      const adv = nome(emCasa ? nosso.f : nosso.c);
      const cond = meus - deles >= 3 ? 'goleadaPro'
                 : deles - meus >= 3 ? 'goleadaContra'
                 : meus > deles ? (emCasa ? 'vitoriaCasa' : 'vitoriaFora')
                 : meus < deles ? 'derrota' : 'empate';
      caixa = {
        placar: `${nome(nosso.c)} ${nosso.gc} × ${nosso.gf} ${nome(nosso.f)}`,
        sob: encher(NS[cond][0], {comp:dArt(nosso.comp), rod:nosso.rod, adv}),
        bom: meus > deles, ruim: meus < deles
      };
    } else {
      caixa = {placar: NS.naoJogou[0], sob:'', bom:false, ruim:false};
    }
    caixa.tabela = tabelaNossa(E, nosso);

    /* ---- pelo país: de duas a quatro notas ---- */
    const NT = MOLDES.nota;
    const sobra = jogos.filter(j => j !== topo &&
      !praca.includes(j) && !(nosso && j.c===nosso.c && j.f===nosso.f));
    const condDe = j =>{
      const a = vencedor(j);
      return !a ? (gols(j) ? 'empate' : 'zero')
        : saldo(j) >= 4 ? 's4' : saldo(j) === 3 ? 's3' : saldo(j) === 2 ? 's2'
        : (a === j.f ? 's1fora' : 's1casa');
    };
    /* ESCOLHE PELA VARIEDADE, não só pelo saldo: quatro jogos na mesma
       condição davam quatro notas do mesmo par de moldes, e a coluna
       saía repetindo. Primeiro um de cada condição, na ordem de saldo;
       só depois é que se repete condição pra completar as quatro. */
    const porCond = {};
    for(const j of sobra.slice().sort(naCapa)){   // a mesma régua da capa
      const c = condDe(j);
      (porCond[c] = porCond[c] || []).push(j);
    }
    const conds = Object.keys(porCond)
      .sort((a,b)=> naCapa(porCond[a][0], porCond[b][0]));
    /* e NENHUMA condição entra mais vezes do que tem molde: `empate`
       tem um só, então dois empates dariam a mesma frase duas vezes.
       Faltando nota pra fechar quatro, sai com três — o dono aprovou
       "de duas a quatro". */
    const escolhidos = [];
    for(let volta = 0; escolhidos.length < 4 && volta < 6; volta++)
      for(const c of conds){
        if(escolhidos.length >= 4) break;
        if(volta >= (NT[c] || []).length) continue;
        if(porCond[c][volta]) escolhidos.push(porCond[c][volta]);
      }
    const notas = escolhidos.map(j=>{
      const a = vencedor(j), b = perdedor(j), cond = condDe(j);
      return {placar:`${nome(j.c)} ${j.gc} × ${j.gf} ${nome(j.f)}`,
              frase: encher(proxima(NT[cond], 'nota-'+cond),
                {A: a?nome(a):'', B: b?nome(b):''})};
    });

    /* ---- o placar completo, com o CORTE (pedido do dono) ---- */
    const corte = placarCortado(E, jogos, nosso, topo);

    /* ---- e o cabeçalho ---- */
    return {
      cabeca:{
        ano: ROMANO(Math.max(1, ano - 2025)),
        edicao: (E.data.absoluto || 0) + 100,
        data: `${DIA_SEM[dia]}, ${dt.getDate()} de ${MES[dt.getMonth()]}`
      },
      tarja: [
        `<b>${jogos.length}</b> ${jogos.length===1?'jogo':'jogos'}`,
        `<b>${comps.length}</b> ${comps.length===1?'competição':'competições'}`,
        `<b>${totalGols}</b> ${totalGols===1?'gol':'gols'}`,
        ...comps.slice(0,2).map(c=>{
          const j = jogos.find(x=>x.comp===c);
          return j.fase ? `${c} · <b>${j.fase}</b>` : `${c} · <b>${j.rod}ª</b> rodada`;
        })
      ],
      chapeu, manchete, olho,
      placar:{a:nome(topo.c), ga:topo.gc, gb:topo.gf, b:nome(topo.f)},
      cidade: (M().cidade(E.torcida.mapa)||{}).nome || '',
      praca: textoPraca,
      nossa: caixa,
      notas,
      /* SEM COLUNA VAZIA (achado do teste com dados reais): quando não
         houve jogo na praça E o nosso clube não jogou, a primeira
         coluna fica com duas linhas e uma caixinha, e sobra um palmo
         de papel em branco. Nesse caso o jornal fecha em DUAS colunas
         e as notas do país sobem pra primeira. */
      magra: !praca.length && !nosso,
      placares: corte.grupos,
      resto: corte.resto,
      classificacao: classificacao(E)
    };
  }

  /* =======================================================
     O CORTE DO PLACAR COMPLETO (pedido do dono, 20/08/2026)
     A coluna não leva mais a rodada inteira: leva as
     competições que interessam — a nossa primeiro, depois as
     dos jogos em destaque — até encher a coluna. O que sobra
     vira a nota de pé e vai pro Ver Competições.
     ======================================================= */
  const LINHAS = 10;
  function placarCortado(E, jogos, nosso, topo){
    const ordem = [];
    const por = {};
    for(const j of jogos){
      const k = j.comp + (j.fase ? ' · '+j.fase : ' · '+j.rod+'ª rodada');
      if(!por[k]){ por[k] = []; ordem.push({k, comp:j.comp}); }
      por[k].push(j);
    }
    /* a prioridade: a competição do nosso jogo, depois a da manchete,
       depois as demais na ordem em que apareceram */
    const peso = g => (nosso && g.comp === nosso.comp) ? 0
                    : (g.comp === topo.comp) ? 1 : 2;
    ordem.sort((a,b)=> peso(a) - peso(b));

    const grupos = [];
    let cabem = LINHAS, fora = 0;
    for(const g of ordem){
      const lista = por[g.k];
      if(cabem <= 0){ fora += lista.length; continue; }
      const leva = lista.slice(0, cabem);
      fora += lista.length - leva.length;
      cabem -= leva.length;
      grupos.push({titulo:g.k, jogos:leva.map(j=>({
        casa:nome(j.c), fora:nome(j.f), gc:j.gc, gf:j.gf,
        nossa: !!(nosso && j.c===nosso.c && j.f===nosso.f),
        goleada: saldo(j) >= 3
      }))});
    }
    return {grupos, resto:fora};
  }

  /* =======================================================
     A CLASSIFICAÇÃO DA NOSSA DIVISÃO (pedido do dono, 20/08/2026)
     A faixa de baixo do jornal traz sempre a tabela da divisão
     em que o NOSSO clube joga — e, quando a competição tem
     grupos (a Série D tem), só o grupo em que ele está.

     Resumida: as oito primeiras linhas. Se o nosso clube não
     estiver entre elas, as seis primeiras mais a vizinhança
     dele, com um risco no meio pra marcar o salto.
     ======================================================= */
  const TOPO_TABELA = 8;
  function classificacao(E){
    try{
      const meu = E.torcida.clubeId;
      const div = COMP().divisaoDe(E, M().time(meu) || {});
      const rodou = c => (c.rodadas||[]).some(r =>
        r.jogos.some(j => j.gc != null && (j.c===meu || j.f===meu)));
      const todas = E.temporada.competicoes || [];
      /* O NACIONAL COMEÇA NO MEIO DO ANO: até lá a divisão do clube
         existe no papel mas não tem bola rolada, e a faixa ficaria
         vazia. Nesses meses ela mostra o campeonato que ele ESTÁ
         jogando — o estadual, o regional —, que é a classificação que
         interessa ao leitor naquele momento. */
      /* quantas rodadas o clube já cumpriu em cada competição: o
         desempate do fallback é a que ele está jogando AGORA, não a
         que tem mais rodadas no papel */
      const cumpriu = c => (c.rodadas||[]).reduce((n,r)=>
        n + (r.jogos.some(j=>j.gc!=null && (j.c===meu||j.f===meu)) ? 1 : 0), 0);
      const comp = (todas.find(c => c.nome === div && rodou(c)))
                || todas.filter(rodou).sort((a,b)=> cumpriu(b) - cumpriu(a))[0];
      if(!comp) return null;
      /* Série D joga em grupos: só o grupo dele interessa */
      let grupo, rot = comp.nome;
      if(comp.grupos && comp.grupos.length > 1){
        grupo = comp.grupos.findIndex(g => g.indexOf(meu) >= 0);
        if(grupo < 0) grupo = undefined;
        else rot += ` · Grupo ${String.fromCharCode(65 + grupo)}`;
      }
      const t = COMP().tabela(comp, grupo);
      if(!t.length || !t.some(l => l.j)) return null;
      const eu = t.findIndex(l => l.id === meu);
      const linha = (l, i) => ({pos:i+1, nome:nome(l.id), j:l.j, p:l.p,
                               sg:l.sg, nossa:l.id === meu});
      let linhas;
      if(eu < TOPO_TABELA){
        linhas = t.slice(0, TOPO_TABELA).map(linha);
      } else {
        linhas = t.slice(0, TOPO_TABELA - 2).map(linha);
        linhas.push({salto:true});
        for(let i = Math.max(0, eu-1); i <= Math.min(t.length-1, eu+1); i++)
          linhas.push(linha(t[i], i));
      }
      return {rot, linhas, total:t.length};
    }catch(x){ return null; }
  }

  /* a tabela é a do campeonato que o clube joga HOJE — pegar a
     primeira da temporada mostrava "0 pontos em 0 jogos" */
  function tabelaNossa(E, nosso){
    try{
      const meu = E.torcida.clubeId;
      const alvo = nosso && nosso.comp;
      const comp = (E.temporada.competicoes||[]).find(c=>
        (alvo ? c.nome === alvo : true) &&
        (c.rodadas||[]).some(r=>r.jogos.some(j=>j.c===meu || j.f===meu)));
      if(!comp) return null;
      const t = COMP().tabela(comp);
      const i = t.findIndex(x=>x.id === meu);
      if(i < 0 || !t[i].j) return null;
      return `${comp.nome} · <b>${i+1}º</b> lugar · <b>${t[i].p}</b> `+
             `${t[i].p===1?'ponto':'pontos'} em ${t[i].j} ${t[i].j===1?'jogo':'jogos'}`;
    }catch(x){ return null; }
  }

  return {montar, MOLDES, encher, LINHAS, classificacao, TOPO_TABELA};
})();
