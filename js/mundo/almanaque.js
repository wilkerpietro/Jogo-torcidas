/* =========================================================
   O ALMANAQUE (pedido do dono, 21/08/2026)

   As notícias de virada de ano e de título, no mesmo layout
   de jornal da Gazeta e do Futebol e Porrada: cabeçalho,
   tarja, chapéu, manchete, olho e um quadro ao lado.

   São seis edições:
     · CAMPEÃO ......... uma por competição que o NOSSO clube
                         jogou, na hora em que o campeão sai
     · SOBE E DESCE .... quem subiu e quem caiu, na virada
     · TORCIDA DO ANO .. a 1ª do ranking no fechamento do ano
     · REI DA PISTA .... o maior saldo de brigas do ano
     · A JANELA ........ quem se reforçou, pela evolução de
                         força de um ano pro outro
     · O PATRIMÔNIO .... quem mais comprou prédio no ano

   NADA É ESCRITO NA HORA. Toda frase sai de um molde
   submetido ao crivo do dono, preenchido com o que o ano já
   sabe. A FOTO DO ANO é tirada no primeiro dia de cada ano
   (`E.almanaque`) e é contra ela que a virada compara.
   ========================================================= */
window.TO = window.TO || {};

TO.almanaque = (function(){
  const M = ()=>TO.mundo;
  const C = ()=>TO.competicoes;

  /* quantos nomes cabem em cada quadro */
  const LINHAS = 6;

  /* =======================================================
     OS MOLDES (submetidos ao crivo do dono, 21/08/2026)
     ======================================================= */
  const MOLDES = {
    campeao:{
      chapeu:{
        nosso:  ['É NOSSO'],
        rival:  ['A taça ficou com eles'],
        outros: ['Deu campeão']
      },
      manchete:{
        nosso:  ['{A} é campeão e a festa é nossa',
                 'Acabou: o título é do {A}',
                 '{A} levanta a taça {comp}'],
        rival:  ['{A} levanta a taça e a gente engole',
                 'Deu {A}, e não dá pra fingir que não doeu'],
        outros: ['{A} fatura {compO}',
                 '{A} é o campeão {comp}',
                 'A taça {comp} é do {A}']
      },
      olho:{
        comVice:['{A} terminou {compO} na frente de todo mundo; '+
                 'o {B} ficou com o vice.'],
        semVice:['{A} terminou {compO} na frente de todo mundo.']
      }
    },

    sobeDesce:{
      chapeu:{
        nosso:  ['O nosso clube se mexeu'],
        padrao: ['Sobe e desce']
      },
      manchete:{
        subimosNos: ['Subimos! O {A} está de volta',
                     'Acesso do {A}: a divisão é outra'],
        caimosNos:  ['O {A} caiu, e o ano que vem é embaixo',
                     'Rebaixado: o {A} desce de divisão'],
        padrao:     ['{N} clubes trocam de divisão na virada',
                     'A virada mexeu com {N} clubes']
      },
      olho:{
        comNosso:['{S} subiram e {D} desceram no país. '+
                  'O nosso clube está no meio.'],
        padrao:  ['{S} subiram e {D} desceram no país.'],
        vazio:   ['Nenhuma divisão trocou de dono na virada.']
      }
    },

    /* 6 · A TRETA DO ANO — a briga que mais derrubou rival
       (pedido do dono, 23/08/2026) */
    tretaDoAno:{
      chapeu:{
        nossa:  ['Foi a nossa noite'],
        contra: ['A noite que a gente prefere esquecer'],
        padrao: ['A treta do ano']
      },
      manchete:{
        nossa:  ['A {A} passou o rodo na {B} e fechou o ano no topo da rua',
                 'Ninguém esquece o que a {A} fez com a {B} em {ano}'],
        contra: ['A {B} pegou a gente de jeito, e {ano} tem essa marca',
                 'O ano guarda a noite em que a {B} passou por cima da {A}'],
        padrao: ['A {A} deixou {N} da {B} no chão: a treta do ano',
                 'Foi na {onde} que {ano} teve a sua maior treta'],
        vazio:  ['{ano} passou sem uma treta pra contar']
      },
      olho:{
        cheio:['{F} feridos e {P} presos numa noite só, {onde}, '+
               'na {sem}ª semana do ano.'],
        semPreso:['{F} feridos numa noite só, {onde}, '+
                  'na {sem}ª semana do ano. Ninguém foi pro camburão.'],
        vazio:['Nenhuma briga do ano deixou baixa que valesse manchete.']
      }
    },

    torcidaDoAno:{
      chapeu:{
        nossa:  ['A coroa é nossa'],
        padrao: ['Torcida do ano']
      },
      manchete:{
        nossa:  ['A {A} fecha o ano em primeiro',
                 'Ninguém segurou a {A} em {ano}'],
        padrao: ['A {A} é a torcida do ano',
                 '{ano} foi da {A}',
                 'A {A} fecha {ano} no topo do ranking']
      },
      olho:{
        comSegunda:['Fechou o ano com {P} pontos, {D} à frente da {B}.'],
        sozinha:   ['Fechou o ano com {P} pontos no ranking.']
      }
    },

    reiDaPista:{
      chapeu:{
        nossa:  ['A pista é nossa'],
        padrao: ['Rei da pista']
      },
      manchete:{
        nossa:  ['Ninguém correu com a gente em {ano}',
                 'A {A} é o rei da pista e não teve pra ninguém'],
        padrao: ['A {A} é o rei da pista de {ano}',
                 'Quem mandou na rua em {ano} foi a {A}'],
        vazio:  ['{ano} passou sem ninguém dominar a rua']
      },
      olho:{
        cheio:['{V} brigas ganhas contra {Dr} perdidas: saldo de {S} no ano.'],
        vazio:['Nenhuma torcida fechou o ano com saldo de brigas.']
      }
    },

    janela:{
      chapeu:{padrao:['A janela fechou']},
      manchete:{
        cheia:['{A} foi quem mais se reforçou',
               'O {A} montou time pra brigar lá em cima',
               '{A} chega {ano} com outro elenco'],
        magra:['A janela passou em branco pelo país']
      },
      olho:{
        cheia:['Ganhou {G} de força de um ano pro outro; '+
               'quem mais perdeu foi o {B}, com {P}.'],
        soGanho:['Ganhou {G} de força de um ano pro outro.'],
        magra:['Nenhum elenco mudou o suficiente pra virar notícia.']
      }
    },

    abertura:{
      chapeu:{
        titulo: ['Começa a disputa'],
        acesso: ['Vale o acesso'],
        queda:  ['Tem gente pra cair'],
        copa:   ['Mata-mata']
      },
      manchete:[
        'Vem aí {compO}',
        '{compO} começa semana que vem',
        'Daqui a uma semana rola a bola {comp}'
      ],
      /* A COPA TEM MOLDE PRÓPRIO (pedido do dono, 21/08/2026): não tem
         tabela, não tem acesso e não tem queda — tem eliminação. */
      mancheteCopa:[
        'Vem aí {compO}: erro não tem volta',
        '{compO} começa semana que vem, e é jogo único',
        'Daqui a uma semana abre {compO}, no tudo ou nada'
      ],
      olho:{
        /* {F} favoritos ao título · {S} favoritos ao acesso ·
           {Q} ameaçados de queda · {N} clubes na disputa */
        tudo:  ['{N} clubes na disputa. Favoritos ao título: {F}. '+
                'Brigam pelo acesso: {S}. Ameaçados de queda: {Q}.'],
        titAcesso:['{N} clubes na disputa. Favoritos ao título: {F}. '+
                   'Brigam pelo acesso: {S}.'],
        titQueda:['{N} clubes na disputa. Favoritos ao título: {F}. '+
                  'Ameaçados de queda: {Q}.'],
        soTitulo:['{N} clubes na disputa. Favoritos ao título: {F}.'],
        copa:['{N} clubes e um caminho só: quem tropeçar uma vez está '+
              'fora. Favoritos à taça: {F}.']
      },
      /* A BRECHA DO NOSSO CLUBE (pedido do dono, 21/08/2026): quando
         ele não está nem entre os favoritos nem na zona de risco, a
         notícia abre espaço pra dizer o que se espera dele. Nunca com
         número: expectativa é palavra, não força. */
      nos:{
        alto:  ['O {A} entra brigando lá em cima.'],
        meio:  ['Do {A} se espera meio de tabela.'],
        baixo: ['O {A} entra como azarão.'],
        risco: ['O {A} entra com a corda no pescoço.'],
        copaAlto: ['O {A} entra como um dos que podem ir longe.'],
        copaMeio: ['O {A} entra sem favoritismo, mas com chance.'],
        copaBaixo:['O {A} entra pra dar trabalho a quem for maior.']
      }
    },

    patrimonio:{
      chapeu:{
        nossa:  ['A obra foi nossa'],
        padrao: ['O ano da obra']
      },
      manchete:{
        cheia:['A {A} foi quem mais construiu em {ano}',
               '{ano} foi de obra na {A}',
               'A {A} abriu mais porta que ninguém'],
        magra:['Ninguém levantou tijolo em {ano}']
      },
      olho:{
        cheia:['Abriu {N} {porta} no ano e fechou com {T} no total.'],
        magra:['Nenhuma torcida do país abriu prédio novo no ano.']
      }
    }
  };

  /* ---- o motor de moldes: o mesmo da Gazeta ---- */
  function encher(molde, v){
    return String(molde||'').replace(/\{(\w+)\}/g, (t,k)=>
      v[k] === undefined || v[k] === null ? '' : String(v[k]));
  }
  const daFila = (lista, semente) =>
    (!lista || !lista.length) ? '' : lista[Math.abs(semente) % lista.length];

  const nomeTime    = id => (M().time(id)||{}).nome || id;
  const nomeTorcida = id => (M().torcida(id)||{}).nome || id;

  /* O ALMANAQUE É UM JORNAL NACIONAL (correção do dono, 23/08/2026).
     Com as barras dentro do jogo, o ranking passou a somar 388
     torcidas de dez países, e a Torcida do Ano de uma partida
     brasileira saía a Comando SVR, de Lima. Prêmio de ano é do país
     de quem joga: a lista é filtrada pelo país da nossa torcida. */
  function paisDaNossa(E){
    const meu = E && E.torcida && E.torcida.clubeId;
    const t = meu ? M().time(meu) : null;
    return (t && t.pais) || 'Brasil';
  }
  function doNossoPais(E, id){
    const o = M().torcida(id);
    const t = o && M().time(o.clubeId);
    return ((t && t.pais) || 'Brasil') === paisDaNossa(E);
  }
  const soDaqui = (E, lista) => (lista || [])
    .filter(x => x && x.id && doNossoPais(E, x.id));
  /* DOIS ARTIGOS, DOIS LUGARES. "a taça DO Brasileirão" e "a taça DA
     Copa" pedem a forma com de; "faturou O Brasileirão" e "terminou A
     Copa" pedem a forma sem. Um molde só dava "terminou do
     Brasileirão", que não é português. */
  const dArt = n => TO.genero.d('competicao', n, 'do campeonato');
  const oArt = n => TO.genero.o('competicao', n, 'o campeonato');

  /* =======================================================
     A FOTO DO ANO
     Tirada no primeiro dia de cada ano. É contra ela que a
     virada compara — sem foto não há "no ano passado".
     ======================================================= */
  function tirarFoto(E){
    if(!E) return null;
    const predios = {}, forcas = {};
    for(const o of M().jogaveis()){
      if(o.incompleta) continue;
      predios[o.id] = prediosDe(E, o.id);
    }
    for(const id of Object.keys(E.forcas || {})) forcas[id] = E.forcas[id];
    E.almanaque = {ano:E.data.ano, predios, forcas};
    return E.almanaque;
  }

  /* prédios de uma torcida: a sede conta 1, e somam bar, loja e
     subsede — a mesma conta da coluna do ranking */
  function prediosDe(E, id){
    if(E.torcida && id === E.torcida.id){
      const pat = TO.financeiro.patrimonio(E);
      return 1 + (pat.bares||[]).length + (pat.lojas||[]).length +
                 (pat.subsedes||[]).length;
    }
    const t = (E.mundoTorcidas || {})[id];
    if(!t) return 0;
    const n = x => Array.isArray(x) ? x.length : (x ? Math.round(x) : 0);
    return 1 + n(t.bares) + n(t.lojas) + n(t.subsedes);
  }

  /* =======================================================
     AS SEIS EDIÇÕES
     Cada uma devolve o modelo da página, ou null quando não
     há notícia — e página sem notícia não sai.
     ======================================================= */

  /* 1 · CAMPEÃO — só as competições que o NOSSO clube jogou */
  function campeao(E, comp){
    if(!comp || !comp.campeao) return null;
    const meu = E.torcida.clubeId;
    /* a Copa do Brasil não tem rodada: o nosso jogo dela mora em
       `mata` (correção de 17/09/2026 — a edição nunca saía pra copa) */
    const jogou = (comp.rodadas||[]).concat(comp.mata||[]).some(r =>
      r.jogos.some(j => j.c === meu || j.f === meu));
    if(!jogou) return null;

    const ano = E.data.ano;
    const A = comp.campeao, B = comp.vice;
    const nosso = A === meu;
    const rival = !nosso && B === meu;
    const cond = nosso ? 'nosso' : rival ? 'rival' : 'outros';
    const sem = (E.data.ano||0) + comp.nome.length;
    const v = {A:nomeTime(A), B: B ? nomeTime(B) : '',
               comp:dArt(comp.nome), compO:oArt(comp.nome), ano};
    const CM = MOLDES.campeao;
    return {
      ano, tipo:'campeao', tom: nosso ? 'boa' : rival ? 'ruim' : '',
      jornal:'O Almanaque', edicao:'Edição de campeão',
      chapeu: CM.chapeu[cond][0],
      manchete: encher(daFila(CM.manchete[cond], sem), v),
      olho: encher(B ? CM.olho.comVice[0] : CM.olho.semVice[0], v),
      tarja:[comp.nome, `<b>${E.data.ano}</b>`],
      quadro:{
        titulo:'O pódio',
        linhas:[{rot:'Campeão', valor:nomeTime(A), forte:true, nossa:nosso}]
          .concat(B ? [{rot:'Vice', valor:nomeTime(B), nossa: B === meu}] : [])
      }
    };
  }

  /* 2 · SOBE E DESCE — na virada do ano */
  function sobeDesce(E, mov, ano){
    /* O ANUÁRIO NÃO TEM PÁGINA FALTANDO (régua do dono, 23/08/2026):
       ano sem sobe-e-desce entregava `null`, e o fim de ano vinha com
       quatro páginas em vez de cinco. Agora ele diz que não houve. */
    if(!mov || !mov.length){
      const SDv = MOLDES.sobeDesce;
      return {
        ano, tipo:'sobeDesce', tom:'',
        jornal:'O Almanaque', edicao:'Edição da virada',
        chapeu: SDv.chapeu.padrao[0],
        manchete: encher(SDv.manchete.padrao[0], {N:0}),
        olho: SDv.olho.vazio[0],
        tarja:[`virada de <b>${ano}</b>`],
        quadro:{titulo:'Sobe e desce', linhas:[]}
      };
    }
    const meu = E.torcida.clubeId;
    const sobem = mov.filter(m => C().subiu(m.de, m.para));
    const caem  = mov.filter(m => !C().subiu(m.de, m.para));
    const nosso = mov.find(m => m.id === meu);
    const cond = !nosso ? 'padrao'
               : C().subiu(nosso.de, nosso.para) ? 'subimosNos' : 'caimosNos';
    const SD = MOLDES.sobeDesce;
    const v = {A: nomeTime(meu), N: mov.length,
               S: sobem.length, D: caem.length, ano};
    const linha = (m, sobe) => ({
      rot: sobe ? 'sobe' : 'cai', valor: nomeTime(m.id),
      nota: m.para, sobe, nossa: m.id === meu});
    return {
      ano, tipo:'sobeDesce', tom: !nosso ? '' :
        C().subiu(nosso.de, nosso.para) ? 'boa' : 'ruim',
      jornal:'O Almanaque', edicao:'Edição da virada',
      chapeu: nosso ? SD.chapeu.nosso[0] : SD.chapeu.padrao[0],
      manchete: encher(daFila(SD.manchete[cond], ano), v),
      olho: encher(nosso ? SD.olho.comNosso[0] : SD.olho.padrao[0], v),
      tarja:[`<b>${sobem.length}</b> subiram`, `<b>${caem.length}</b> desceram`,
             `temporada de <b>${ano}</b>`],
      quadro:{
        titulo:'Quem trocou de divisão',
        linhas:[...sobem.slice(0, LINHAS).map(m=>linha(m,true)),
                ...caem.slice(0, LINHAS).map(m=>linha(m,false))],
        resto: Math.max(0, mov.length - Math.min(sobem.length, LINHAS)
                                      - Math.min(caem.length, LINHAS))
      }
    };
  }

  /* 3 · TORCIDA DO ANO — a 1ª do ranking no fechamento */
  function torcidaDoAno(E, lista, ano, premios){
    lista = soDaqui(E, lista);
    if(!lista || !lista.length) return null;
    premios = premios || [];
    const primeira = lista[0], segunda = lista[1];
    const nossa = primeira.id === E.torcida.id;
    const TA = MOLDES.torcidaDoAno;
    const v = {A: primeira.nome || nomeTorcida(primeira.id), ano,
               P: Math.round(primeira.pontos),
               B: segunda ? (segunda.nome || nomeTorcida(segunda.id)) : '',
               D: segunda ? Math.round(primeira.pontos - segunda.pontos) : 0};
    return {
      ano, tipo:'torcidaDoAno', tom: nossa ? 'boa' : '',
      jornal:'O Almanaque', edicao:'Prêmio do ano',
      chapeu: nossa ? TA.chapeu.nossa[0] : TA.chapeu.padrao[0],
      manchete: encher(daFila(TA.manchete[nossa?'nossa':'padrao'], ano), v),
      olho: encher(segunda ? TA.olho.comSegunda[0] : TA.olho.sozinha[0], v) +
            (premios[0] ? ` Leva ${reais(premios[0].valor)} de prêmio.` : ''),
      tarja:[`fechamento de <b>31/12/${ano}</b>`, 'ranking geral'],
      premios,
      quadro:{
        titulo:'O pódio do ranking',
        linhas: lista.slice(0, LINHAS).map((x,i)=>({
          rot:`${i+1}º`, valor: x.nome || nomeTorcida(x.id),
          nota: `${Math.round(x.pontos)} pt`,
          forte: i === 0, nossa: x.id === E.torcida.id}))
      }
    };
  }

  /* 4 · REI DA PISTA — maior saldo de brigas do ano */
  function reiDaPista(E, placar, ano, premios){
    const RP = MOLDES.reiDaPista;
    premios = premios || [];
    const lista = soDaqui(E, placar).filter(x => x.saldo > 0)
                              .sort((a,b)=> b.saldo - a.saldo || b.v - a.v);
    if(!lista.length) return {
      ano, tipo:'reiDaPista', tom:'',
      jornal:'O Almanaque', edicao:'Prêmio do ano',
      chapeu: RP.chapeu.padrao[0],
      manchete: encher(RP.manchete.vazio[0], {ano}),
      olho: RP.olho.vazio[0],
      tarja:[`temporada de <b>${ano}</b>`],
      quadro:{titulo:'A rua em ' + ano, linhas:[]}
    };
    const rei = lista[0];
    const nossa = rei.id === E.torcida.id;
    const v = {A: rei.nome, ano, V: rei.v, Dr: rei.d, S: `+${rei.saldo}`};
    return {
      ano, tipo:'reiDaPista', tom: nossa ? 'boa' : '',
      jornal:'O Almanaque', edicao:'Prêmio do ano',
      chapeu: nossa ? RP.chapeu.nossa[0] : RP.chapeu.padrao[0],
      manchete: encher(daFila(RP.manchete[nossa?'nossa':'padrao'], ano), v),
      olho: encher(RP.olho.cheio[0], v) +
            (premios[0] ? ` Leva ${reais(premios[0].valor)} de prêmio.` : ''),
      tarja:[`<b>${rei.v}</b> ganhas`, `<b>${rei.d}</b> perdidas`,
             `saldo <b>+${rei.saldo}</b>`],
      premios,
      quadro:{
        titulo:'O saldo do ano',
        linhas: lista.slice(0, LINHAS).map((x,i)=>({
          rot:`${i+1}º`, valor:x.nome, nota:`${x.v}–${x.d} · +${x.saldo}`,
          forte: i === 0, nossa: x.id === E.torcida.id}))
      }
    };
  }

  /* 5 · A JANELA — quem se reforçou, pela evolução de força */
  function janela(E, movForca, ano){
    const JN = MOLDES.janela;
    const lista = (movForca||[]).map(m=>({id:m.id, nome:nomeTime(m.id),
                                          d: m.para - m.de, para:m.para}))
                                .filter(x=>x.d !== 0);
    const subiram = lista.filter(x=>x.d > 0).sort((a,b)=> b.d - a.d);
    const cairam  = lista.filter(x=>x.d < 0).sort((a,b)=> a.d - b.d);
    if(!subiram.length) return {
      ano, tipo:'janela', tom:'',
      jornal:'O Almanaque', edicao:'Edição da janela',
      chapeu: JN.chapeu.padrao[0],
      manchete: JN.manchete.magra[0],
      olho: JN.olho.magra[0],
      tarja:[`janela de <b>${ano}</b>`],
      quadro:{titulo:'Os elencos', linhas:[]}
    };
    const top = subiram[0], pior = cairam[0];
    const v = {A: top.nome, ano, G:`+${top.d}`,
               B: pior ? pior.nome : '', P: pior ? String(pior.d) : ''};
    return {
      ano, tipo:'janela', tom: top.id === E.torcida.clubeId ? 'boa' : '',
      jornal:'O Almanaque', edicao:'Edição da janela',
      chapeu: JN.chapeu.padrao[0],
      manchete: encher(daFila(JN.manchete.cheia, ano), v),
      olho: encher(pior ? JN.olho.cheia[0] : JN.olho.soGanho[0], v),
      tarja:[`<b>${subiram.length}</b> se reforçaram`,
             `<b>${cairam.length}</b> perderam elenco`,
             `janela de <b>${ano}</b>`],
      quadro:{
        titulo:'Quem mais mexeu no elenco',
        /* SEM NÚMERO DE FORÇA (régua do dono, 21/08/2026): o que a
           notícia conta é o QUANTO mudou, não o nível de ninguém */
        /* `num` É O NÚMERO, `rot` É O RÓTULO (conserto de 21/09/2026).
           A barra do gráfico media o tamanho com `parseInt(l.rot)` —
           quer dizer, lia de volta o número do texto que esta mesma
           linha acabou de montar. Bastava um rótulo que não começasse
           por dígito, ou o menos tipográfico "−" que o resto do jogo
           usa, pra dar NaN e a barra sumir. O valor vai junto agora. */
        linhas:[...subiram.slice(0, LINHAS).map((x,i)=>({
                  rot:`+${x.d}`, num:x.d, valor:x.nome,
                  sobe:true, forte: i === 0,
                  nossa: x.id === E.torcida.clubeId})),
                ...cairam.slice(0, 2).map(x=>({
                  rot:`${x.d}`, num:x.d, valor:x.nome,
                  sobe:false, nossa: x.id === E.torcida.clubeId}))]
      }
    };
  }

  /* 6 · O PATRIMÔNIO — quem mais comprou prédio no ano */
  function patrimonio(E, ano){
    const PT = MOLDES.patrimonio;
    const antes = (E.almanaque && E.almanaque.predios) || {};
    const lista = [];
    for(const o of M().jogaveis()){
      if(o.incompleta || !doNossoPais(E, o.id)) continue;
      const hoje = prediosDe(E, o.id);
      const d = hoje - (antes[o.id] != null ? antes[o.id] : hoje);
      if(d > 0) lista.push({id:o.id, nome:o.nome, d, total:hoje});
    }
    lista.sort((a,b)=> b.d - a.d || b.total - a.total);
    if(!lista.length) return {
      ano, tipo:'patrimonio', tom:'',
      jornal:'O Almanaque', edicao:'Edição do balanço',
      chapeu: PT.chapeu.padrao[0],
      manchete: encher(PT.manchete.magra[0], {ano}),
      olho: PT.olho.magra[0],
      tarja:[`balanço de <b>${ano}</b>`],
      quadro:{titulo:'As obras do ano', linhas:[]}
    };
    const top = lista[0];
    const nossa = top.id === E.torcida.id;
    const v = {A: top.nome, ano, N: top.d, T: top.total,
               porta: top.d === 1 ? 'porta' : 'portas'};
    return {
      ano, tipo:'patrimonio', tom: nossa ? 'boa' : '',
      jornal:'O Almanaque', edicao:'Edição do balanço',
      chapeu: nossa ? PT.chapeu.nossa[0] : PT.chapeu.padrao[0],
      manchete: encher(daFila(PT.manchete.cheia, ano), v),
      olho: encher(PT.olho.cheia[0], v),
      tarja:[`<b>${lista.length}</b> torcidas construíram`,
             `balanço de <b>${ano}</b>`],
      quadro:{
        titulo:'Quem mais construiu',
        linhas: lista.slice(0, LINHAS).map((x,i)=>({
          rot:`+${x.d}`, valor:x.nome, nota:`${x.total} no total`,
          sobe:true, forte: i === 0, nossa: x.id === E.torcida.id}))
      }
    };
  }

  /* 7 · ABERTURA — uma semana antes de a bola rolar
     Só nas competições em que o NOSSO clube está. Quem é
     favorito sai da FORÇA: os primeiros da fila brigam pelo
     título e pelo acesso, os últimos brigam pra não cair. */
  const FAVORITOS = 3;
  function abertura(E, comp){
    if(!comp) return null;
    const meu = E.torcida.clubeId;
    const fila = C().porForca(E, comp);
    if(fila.length < 2 || !fila.some(x=>x.id === meu)) return null;

    const copa = !!comp.copa;
    const {sobem, caem} = copa ? {sobem:0, caem:0} : C().emJogo(comp);
    const nomes = lista => lista.map(x=>nomeTime(x.id)).join(', ');
    const nTit = Math.min(FAVORITOS, fila.length);
    const topo = fila.slice(0, nTit);
    /* quem briga pelo ACESSO não é quem briga pelo TÍTULO: a janela do
       acesso começa depois dos favoritos, senão a frase repetiria os
       mesmos nomes duas vezes */
    const doAcesso = sobem ? fila.slice(nTit, nTit + Math.min(FAVORITOS, sobem)) : [];
    const daQueda  = caem ? fila.slice(-Math.min(FAVORITOS, caem)).reverse() : [];

    const AB = MOLDES.abertura;
    const nossaPos = fila.findIndex(x=>x.id === meu);
    const fatia = fila.length > 1 ? nossaPos / (fila.length - 1) : 0;

    /* A BRECHA DO NOSSO CLUBE: quando ele já aparece na lista de
       favoritos ou na de risco, a notícia já falou dele — repetir
       seria encher linguiça. Fora dessas duas, entra a expectativa. */
    const jaCitado = topo.some(x=>x.id === meu) ||
                     doAcesso.some(x=>x.id === meu) ||
                     daQueda.some(x=>x.id === meu);
    const faixaNossa = copa ? (fatia < .25 ? 'copaAlto'
                             : fatia < .7  ? 'copaMeio' : 'copaBaixo')
                     : (caem && fatia > .85) ? 'risco'
                     : fatia < .3  ? 'alto'
                     : fatia < .7  ? 'meio' : 'baixo';
    const nossaLinha = jaCitado ? '' :
      encher(AB.nos[faixaNossa][0], {A:nomeTime(meu)});

    const cond = copa ? 'copa'
               : doAcesso.length && daQueda.length ? 'tudo'
               : doAcesso.length ? 'titAcesso'
               : daQueda.length ? 'titQueda' : 'soTitulo';
    const v = {comp:dArt(comp.nome), compO:oArt(comp.nome),
               N:fila.length, F:nomes(topo),
               S:nomes(doAcesso), Q:nomes(daQueda)};
    const ano = E.data.ano;
    /* SEM NÚMERO DE FORÇA NA NOTÍCIA (régua do dono, 21/08/2026): o
       quadro diz o papel de cada um — favorito, risco, o nosso —, e a
       força fica onde sempre esteve, na tela de Competições. */
    const linha = (x, rot, cls) => ({
      rot, valor:nomeTime(x.id), sobe: cls, nossa: x.id === meu});
    return {
      ano, tipo:'abertura', tom:'',
      jornal:'O Almanaque', edicao:'Edição de véspera',
      /* O CHAPÉU FALA DA NOSSA SITUAÇÃO, não da competição: numa Série
         B com acesso e queda, quem está em terceiro lê "vale o acesso"
         e quem está em décimo oitavo lê "tem gente pra cair". Dizer
         sempre a mesma coisa pros dois era desperdiçar a manchete. */
      chapeu: copa ? AB.chapeu.copa[0]
            : (caem && nossaPos >= fila.length - Math.ceil(fila.length/3))
                ? AB.chapeu.queda[0]
            : (sobem && nossaPos < Math.ceil(fila.length/3))
                ? AB.chapeu.acesso[0]
            : AB.chapeu.titulo[0],
      manchete: encher(daFila(copa ? AB.mancheteCopa : AB.manchete,
                              ano + comp.nome.length), v),
      olho: encher(AB.olho[cond][0], v) + (nossaLinha ? ' ' + nossaLinha : ''),
      tarja:[comp.nome, `<b>${fila.length}</b> clubes`,
             copa ? 'jogo único' : '',
             sobem ? `<b>${sobem}</b> sobem` : '',
             caem ? `<b>${caem}</b> caem` : ''].filter(Boolean),
      quadro:{
        titulo:'Como chegam',
        linhas:[...topo.map((x,i)=>linha(x, i === 0 ? 'favorito' : `${i+1}º`, true)),
                ...daQueda.map(x=>linha(x, 'risco', false)),
                /* e a linha do nosso clube, quando ele não está em
                   nenhuma das duas pontas */
                ...(jaCitado ? [] : [{rot:'o nosso', valor:nomeTime(meu),
                                      nossa:true}])]
      }
    };
  }

  /* =======================================================
     A VIRADA DO ANO
     Chamada de dentro do fecho da temporada, ANTES do ano
     virar de verdade: `placarDoAno` zera na virada, e o
     ranking do fechamento é o do último dia. Devolve as
     páginas na ordem em que devem cair no feed.
     ======================================================= */
  /* =======================================================
     6 · A TRETA DO ANO (pedido do dono, 23/08/2026)
     "Uma lembrança no fim do ano da briga que a torcida mais
     feriu/prendeu rivais."

     A conta é dos DERRUBADOS: feridos mais presos que o
     vencedor deixou do outro lado numa noite só. Fica guardada
     em `E.tretaDoAno`, atualizada a cada briga fechada — nossa
     ou entre duas IAs —, porque o feed larga o anexo das
     notícias velhas depois de 90 dias e uma varredura de fim de
     ano não acharia mais a briga de janeiro.
     ======================================================= */
  function anotarTreta(E, reg){
    if(!E || !reg || !reg.a || !reg.b) return null;
    const ano = E.data.ano;
    const venceuA = !!reg.ganhouA;
    const alvo = venceuA ? reg.b : reg.a, dono = venceuA ? reg.a : reg.b;
    const derrubados = (alvo.feridos || 0) + (alvo.presos || 0);
    if(!derrubados) return null;
    /* o anuário é nacional: treta entre duas barras argentinas não é
       manchete do almanaque de quem joga no Brasil */
    if(!doNossoPais(E, dono.id) && !doNossoPais(E, alvo.id)) return null;
    const guardada = E.tretaDoAno;
    if(guardada && guardada.ano === ano && guardada.derrubados >= derrubados)
      return guardada;
    E.tretaDoAno = {
      ano, derrubados,
      semana: reg.semana || E.data.semana, dia: reg.dia || E.data.dia,
      onde: reg.cidade || reg.onde || '',
      nossa: dono.id === E.torcida.id,
      contra: alvo.id === E.torcida.id,
      a:{id:dono.id, nome:dono.nome, n:dono.n || 0,
         feridos:dono.feridos || 0, presos:dono.presos || 0},
      b:{id:alvo.id, nome:alvo.nome, n:alvo.n || 0,
         feridos:alvo.feridos || 0, presos:alvo.presos || 0}
    };
    return E.tretaDoAno;
  }

  function tretaDoAno(E, ano){
    const TA = MOLDES.tretaDoAno;
    const t = E.tretaDoAno;
    if(!t || t.ano !== ano) return {
      ano, tipo:'tretaDoAno', tom:'',
      jornal:'O Almanaque', edicao:'Edição da rua',
      chapeu: TA.chapeu.padrao[0],
      manchete: encher(TA.manchete.vazio[0], {ano}),
      olho: TA.olho.vazio[0],
      tarja:[`a rua em <b>${ano}</b>`],
      quadro:{titulo:'A treta do ano', linhas:[]}
    };
    const onde = t.onde || 'na rua';
    const cond = t.nossa ? 'nossa' : t.contra ? 'contra' : 'padrao';
    const v = {A:t.a.nome, B:t.b.nome, ano, onde,
               N:t.derrubados, F:t.b.feridos, P:t.b.presos,
               sem:t.semana};
    return {
      ano, tipo:'tretaDoAno',
      tom: t.nossa ? 'boa' : t.contra ? 'ruim' : '',
      jornal:'O Almanaque', edicao:'Edição da rua',
      chapeu: TA.chapeu[cond][0],
      manchete: encher(daFila(TA.manchete[cond], ano), v),
      olho: encher(t.b.presos ? TA.olho.cheio[0] : TA.olho.semPreso[0], v),
      tarja:[`<b>${t.derrubados}</b> derrubados`,
             `<b>${t.b.feridos}</b> feridos`,
             `<b>${t.b.presos}</b> presos`, onde],
      quadro:{
        titulo:'A noite, lado a lado',
        linhas:[
          {rot:'levou a melhor', valor:t.a.nome, nota:`${t.a.n} na rua`,
           forte:true, nossa:t.a.id === E.torcida.id},
          {rot:'ficou no chão',  valor:t.b.nome,
           nota:`${t.b.feridos} feridos · ${t.b.presos} presos`,
           nossa:t.b.id === E.torcida.id},
          {rot:'baixa do vencedor', valor:`${t.a.feridos} feridos`,
           nota:`${t.a.presos} presos`}
        ]
      }
    };
  }

  /* =======================================================
     OS PRÊMIOS DA VIRADA (pedido do dono, 09/09/2026)
     A Torcida do Ano leva R$ 300 mil; a 2ª, 150; a 3ª, 100; a 4ª,
     70; a 5ª, 50. As cinco de maior saldo positivo de pista levam
     a mesma tabela. Paga na virada, pra quem joga e pras IAs, e a
     retrospectiva de 01/01 mostra quem levou o quê.
     ======================================================= */
  const PREMIOS = [300000, 150000, 100000, 70000, 50000];
  function pagarPremio(E, id, rot, valor){
    if(!id || !valor) return;
    if(E.torcida && id === E.torcida.id){
      if(TO.estado && TO.estado.lancar) TO.estado.lancar(E, rot, valor);
      return;
    }
    const t = (E.mundoTorcidas || {})[id];
    if(!t) return;
    t.caixa = (t.caixa || 0) + valor;
    if(TO.relacoes && TO.relacoes.lancarIA) TO.relacoes.lancarIA(E, id, rot, valor);
  }
  function premiar(E, ctx){
    const ano = (ctx && ctx.ano) || E.data.ano;
    const nossa = id => !!(E.torcida && id === E.torcida.id);
    const ranking = soDaqui(E, (ctx && ctx.ranking) || []).slice(0, PREMIOS.length)
      .map((x, i) => ({id:x.id, nome:x.nome || nomeTorcida(x.id), pos:i+1,
                       valor:PREMIOS[i], nossa:nossa(x.id), pontos:Math.round(x.pontos)}));
    const pista = soDaqui(E, (ctx && ctx.placar) || []).filter(x => x.saldo > 0)
      .sort((a,b)=> b.saldo - a.saldo || b.v - a.v).slice(0, PREMIOS.length)
      .map((x, i) => ({id:x.id, nome:x.nome || nomeTorcida(x.id), pos:i+1,
                       valor:PREMIOS[i], nossa:nossa(x.id), v:x.v, d:x.d, saldo:x.saldo}));
    for(const r of ranking) pagarPremio(E, r.id, `Prêmio Torcida do Ano ${ano} — ${r.pos}º lugar`, r.valor);
    for(const r of pista)   pagarPremio(E, r.id, `Prêmio Rei da Pista ${ano} — ${r.pos}º lugar`, r.valor);
    return {ranking, pista};
  }
  const reais = v => 'R$ ' + (v >= 1000 && v % 1000 === 0 ? `${v/1000} mil` : String(v));

  function fecharAno(E, ctx){
    const ano = (ctx && ctx.ano) || E.data.ano;
    const pr = (ctx && ctx.premios) || {};
    return [
      sobeDesce(E, (ctx && ctx.sobeDesce) || [], ano),
      torcidaDoAno(E, (ctx && ctx.ranking) || [], ano, pr.ranking),
      reiDaPista(E, (ctx && ctx.placar) || [], ano, pr.pista),
      janela(E, (ctx && ctx.forca) || [], ano + 1),
      patrimonio(E, ano),
      tretaDoAno(E, ano)
    ].filter(Boolean);
  }

  /* O SALDO DE BRIGAS DO ANO QUE FECHA. O ano vem por fora de
     propósito: quando a virada chama isto, `E.data.ano` já é o ano
     novo, e o placar guardado ainda é o do ano velho. */
  function placarDoAnoTodo(E, ano){
    const alvo = ano != null ? ano : E.data.ano;
    const fora = [];
    const conta = (id, nome, p)=>{
      if(!p || p.ano !== alvo) return;
      if(!p.v && !p.d) return;
      fora.push({id, nome, v:p.v, d:p.d, saldo:p.v - p.d});
    };
    conta(E.torcida.id, E.torcida.nome, E.brigasAno);
    for(const [id, t] of Object.entries(E.mundoTorcidas || {}))
      conta(id, nomeTorcida(id), t.brigasAno);
    return fora;
  }

  return {MOLDES, encher, tirarFoto, prediosDe, LINHAS, abertura,
          fecharAno, placarDoAnoTodo, anotarTreta, PREMIOS, premiar,
          campeao, sobeDesce, torcidaDoAno, reiDaPista, janela, patrimonio,
          tretaDoAno};
})();
