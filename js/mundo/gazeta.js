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

  const nome    = id => (M().time(id)||{}).nome || id;
  const estadio = id => (M().time(id)||{}).estadio || '';
  const mapaDe  = id => (M().time(id)||{}).mapa;
  const saldo   = j => Math.abs(j.gc - j.gf);
  const gols    = j => j.gc + j.gf;
  const vencedor = j => j.gc > j.gf ? j.c : j.gf > j.gc ? j.f : null;
  const perdedor = j => j.gc > j.gf ? j.f : j.gf > j.gc ? j.c : null;
  /* "do Mineiro" mas "da Copa do Nordeste": o artigo segue o nome */
  const dArt = n => !n ? 'a rodada' : (/^(Copa|Taça|Série)/i.test(n) ? `a ${n}` : `o ${n}`);

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
      comEstadio:['{gA} a {gB} no {est}, o placar mais largo desta rodada d{comp}.'],
      semEstadio:['{gA} a {gB}, o placar mais largo desta rodada d{comp}.'],
      diaCheio:['{gA} a {gB} no {est}, num dia de {N} jogos e {G} gols.'],
      empate:['Ficou no {gA} a {gB} no {est}, pela {rod}ª rodada d{comp}.'],
      mata:['{gA} a {gB} no {est}, n{fase} d{comp}.']
    },
    /* 4 · na nossa praça */
    praca:{
      um:['O {A} recebeu o {B} e o placar fechou em {gA} × {gB} no {est}.',
          'No {est}, {A} e {B} fecharam em {gA} × {gB}.'],
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

    /* ---- a manchete: maior saldo, depois mais gols, depois o
            nosso campeonato ---- */
    const meuComp = (d.nosso || {}).comp || '';
    const topo = jogos.slice().sort((a,b)=>
      saldo(b) - saldo(a) || gols(b) - gols(a) ||
      ((b.comp===meuComp) - (a.comp===meuComp)))[0];

    const nosso = d.nosso || null;
    const praca = jogos.filter(j => mapaDe(j.c) === E.torcida.mapa &&
                                    !(nosso && j.c===nosso.c && j.f===nosso.f));
    const ehClassico = praca.some(j => mapaDe(j.c) === mapaDe(j.f));

    /* ---- chapéu ---- */
    const C = MOLDES.chapeu;
    const chapeu = topo.fase ? C.decisao[0]
                 : saldo(topo) >= 3 ? C.goleada[0]
                 : ehClassico ? C.classico[0]
                 : (dia >= 1 && dia <= 5) ? C.semana[0]
                 : C.padrao[0];

    /* ---- manchete ---- */
    const A = vencedor(topo), B = perdedor(topo);
    const vTopo = {A: A?nome(A):'', B: B?nome(B):'',
                   c: nome(topo.c), f: nome(topo.f),
                   gA: Math.max(topo.gc, topo.gf), gB: Math.min(topo.gc, topo.gf),
                   G: gols(topo), fase: topo.fase ? dArt(topo.fase) : '',
                   comp: dArt(topo.comp), rod: topo.rod,
                   est: estadio(topo.c), N: jogos.length};
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
      const molde = estadio(j.c) ? proxima(P.um, 'praca') : P.um[1].replace(' no {est}','');
      textoPraca = encher(estadio(j.c) ? molde : P.um[0].replace(' no {est}',''),
        {A:nome(j.c), B:nome(j.f), gA:j.gc, gB:j.gf, est:estadio(j.c)});
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
    for(const j of sobra.slice().sort((a,b)=> saldo(b)-saldo(a) || gols(b)-gols(a))){
      const c = condDe(j);
      (porCond[c] = porCond[c] || []).push(j);
    }
    const conds = Object.keys(porCond)
      .sort((a,b)=> saldo(porCond[b][0]) - saldo(porCond[a][0]));
    const escolhidos = [];
    for(let volta = 0; escolhidos.length < 4 && volta < 6; volta++)
      for(const c of conds){
        if(escolhidos.length >= 4) break;
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
      resto: corte.resto
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
      const t = TO.competicoes.tabela(comp);
      const i = t.findIndex(x=>x.id === meu);
      if(i < 0 || !t[i].j) return null;
      return `${comp.nome} · <b>${i+1}º</b> lugar · <b>${t[i].p}</b> `+
             `${t[i].p===1?'ponto':'pontos'} em ${t[i].j} ${t[i].j===1?'jogo':'jogos'}`;
    }catch(x){ return null; }
  }

  return {montar, MOLDES, encher, LINHAS};
})();
