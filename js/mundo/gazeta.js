/* =========================================================
   A GAZETA DOS SPORTS (régua do dono, 20/08/2026)

   A rodada deixou de ser uma linha corrida de placares e virou
   primeira página de jornal. Aqui mora só a LÓGICA: que molde de
   frase cada pedaço usa e o que vai pra cada pedaço. Quem desenha
   é main.js; quem guarda os jogos do dia é a própria mensagem, em
   `dados.jogos`.

   O JORNAL É DO NOSSO CLUBE (decisão do dono, 21/08/2026). A
   edição só sai em dia em que o clube da nossa torcida jogou, e
   a manchete é sempre o jogo DELE — não o do time de mais força
   da rodada. A página fecha no placar grande, com um recorte de
   três linhas da classificação ao lado: o time logo acima do
   nosso, o nosso e o logo abaixo.

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
  /* NoEst só é chamado pelos moldes guardados da praça; fica com eles */
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
    /* ---------------------------------------------------
       DAQUI PRA BAIXO: TEXTO APROVADO, SEÇÃO GUARDADA.
       A edição encolheu em 21/08/2026 e fecha no placar
       grande — praça, caixa do nosso jogo e "pelo país"
       saíram da página. Os moldes ficam porque passaram
       pelo crivo do dono: se alguma seção voltar, o texto
       dela já está escrito e aprovado.
       --------------------------------------------------- */
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
       A MANCHETE É O NOSSO JOGO (decisão do dono, 21/08/2026)

       A régua antiga escolhia a capa pela FORÇA dos times da
       rodada. Não escolhe mais: a capa é o jogo do clube da
       nossa torcida, e a edição nem sai em dia que ele não
       jogou — quem monta a mensagem já garante isso.
       ===================================================== */
    const nosso = d.nosso || null;
    if(!nosso) return null;
    const topo = nosso;

    /* clássico é o jogo entre dois times da MESMA praça */
    const ehClassico = mapaDe(topo.c) === mapaDe(topo.f);

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
      placar:{a:nome(topo.c), ga:topo.gc, gb:topo.gf, b:nome(topo.f),
              nossaCasa: topo.c === E.torcida.clubeId,
              nossaFora: topo.f === E.torcida.clubeId},
      tabela: recorteDaTabela(E)
    };
  }

  /* =======================================================
     O RECORTE DA CLASSIFICAÇÃO (pedido do dono, 21/08/2026)
     Ao lado da manchete, três linhas e nada mais: o time
     imediatamente acima do nosso, o NOSSO e o imediatamente
     abaixo. Nas pontas da tabela não há vizinho dos dois
     lados, então o recorte desliza pra manter as três linhas
     — líder mostra os dois de baixo, lanterna os dois de cima.

     A tabela é sempre a da divisão em que o nosso clube joga,
     e na Série D só o grupo dele. O NACIONAL COMEÇA NO MEIO DO
     ANO: até lá a divisão existe no papel mas não tem bola
     rolada, e o recorte mostra o campeonato que ele ESTÁ
     jogando — o estadual, o regional.
     ======================================================= */
  const RECORTE = 3;
  function recorteDaTabela(E){
    try{
      const meu = E.torcida.clubeId;
      const div = COMP().divisaoDe(E, M().time(meu) || {});
      const rodou = c => (c.rodadas||[]).some(r =>
        r.jogos.some(j => j.gc != null && (j.c===meu || j.f===meu)));
      const todas = E.temporada.competicoes || [];
      /* o desempate do fallback é a que ele está jogando AGORA, não a
         que tem mais rodadas no papel */
      const cumpriu = c => (c.rodadas||[]).reduce((n,r)=>
        n + (r.jogos.some(j=>j.gc!=null && (j.c===meu||j.f===meu)) ? 1 : 0), 0);
      const comp = (todas.find(c => c.nome === div && rodou(c)))
                || todas.filter(rodou).sort((a,b)=> cumpriu(b) - cumpriu(a))[0];
      if(!comp) return null;
      let grupo, rot = comp.nome;
      if(comp.grupos && comp.grupos.length > 1){
        grupo = comp.grupos.findIndex(g => g.indexOf(meu) >= 0);
        if(grupo < 0) grupo = undefined;
        else rot += ` · Grupo ${String.fromCharCode(65 + grupo)}`;
      }
      const t = COMP().tabela(comp, grupo);
      if(!t.length || !t.some(l => l.j)) return null;
      const eu = t.findIndex(l => l.id === meu);
      if(eu < 0) return null;
      /* a janela de três, empurrada pra dentro nas pontas */
      let ini = Math.max(0, Math.min(eu - 1, t.length - RECORTE));
      const linhas = t.slice(ini, ini + RECORTE).map((l, i)=>({
        pos: ini + i + 1, nome: nome(l.id), j:l.j, p:l.p, sg:l.sg,
        nossa: l.id === meu
      }));
      return {rot, linhas, total:t.length};
    }catch(x){ return null; }
  }

  return {montar, MOLDES, encher, recorteDaTabela, RECORTE};
})();
