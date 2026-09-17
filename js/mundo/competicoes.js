/* =========================================================
   COMPETIÇÕES — temporada, tabelas e calendário (GDD §18)
   ---------------------------------------------------------
   O ano tem duas fases, nessa ordem (GDD §18.1): primeiro os
   regionais e estaduais, depois o Brasileirão das séries A a
   D. Uma rodada por semana, o que faz o calendário do jogo e
   o do futebol serem a mesma coisa.

   Nada aqui vem de arquivo novo: os 108 clubes de times.js já
   trazem `divisao` e `regional`, e é dali que saem as onze
   competições regionais e as quatro nacionais.
   ========================================================= */
window.TO = window.TO || {};

TO.competicoes = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  const SEMANAS_ANO      = 52;
  const INICIO_REGIONAL  = 1;    // janeiro
  const INICIO_NACIONAL  = 14;   // abril, como no GDD §18.1
  const FINAL_REGIONAL   = INICIO_NACIONAL - 1;   // toda final na mesma semana

  const PONTOS = {v:3, e:1, d:0};

  /* =======================================================
     SORTEIO DE TABELA
     Método do círculo: com número ímpar entra um fantasma e
     quem cair contra ele folga na rodada.
     ======================================================= */
  function roundRobin(clubes, voltas){
    const t = [...clubes];
    if(t.length % 2) t.push(null);
    const n = t.length, meia = n/2;
    const rodadas = [];
    for(let r=0; r<n-1; r++){
      const jogos = [];
      for(let i=0;i<meia;i++){
        const a = t[i], b = t[n-1-i];
        if(!a || !b) continue;
        /* alterna o mando por rodada. Medido: com esta regra a pior
           sequência em casa é 2 e o total de mandos fica 8–10 em 19;
           alternar por posição estoura pra 18 seguidos. */
        jogos.push(r%2 ? {c:b, f:a} : {c:a, f:b});
      }
      rodadas.push(jogos);
      t.splice(1, 0, t.pop());     // gira, fixando o primeiro
    }
    if(voltas > 1){
      const ida = rodadas.map(j=>j.map(g=>({...g})));
      for(const jogos of ida)
        rodadas.push(jogos.map(g=>({c:g.f, f:g.c})));
    }
    return rodadas;
  }

  /* divide em grupos servindo em zigue-zague, pra não juntar
     os melhores todos no mesmo lado da chave */
  function dividirGrupos(clubes, quantos){
    const ordem = [...clubes].sort((a,b)=>forca(b)-forca(a));
    const g = Array.from({length:quantos}, ()=>[]);
    ordem.forEach((c,i)=>{
      const volta = Math.floor(i/quantos) % 2;
      const k = volta ? quantos-1-(i%quantos) : i%quantos;
      g[k].push(c);
    });
    return g;
  }

  /* A REGIONALIZAÇÃO (pedido do dono, 27/08/2026): grupo de divisão
     inferior é corte CONTÍGUO do mapa, como na Série D real — nada de
     Manaus caindo no grupo do Sul. A régua é a cadeia de UFs de norte
     a sul; dentro da UF ordena pela cidade, então times da mesma praça
     caem sempre juntos. O Grupo A é o mais ao norte, o último é o mais
     ao sul — e o playoff, que cruza grupos vizinhos (A×B, C×D), vira
     cruzamento de vizinhos de mapa. Clube sem cidade mapeada vai pro
     fim da fila, o que hoje não acontece: os 108 têm praça. */
  const CADEIA_UF = ['RR','AP','AM','PA','AC','RO','TO','MA','PI','CE',
                     'RN','PB','PE','AL','SE','BA','GO','DF','MT','MS',
                     'ES','MG','RJ','SP','PR','SC','RS'];
  function dividirGruposPorRegiao(clubes, quantos){
    const chave = id => {
      const t = M().time(id);
      const c = t && M().cidade(t.mapa);
      const i = CADEIA_UF.indexOf((c && c.uf) || '');
      return {uf: i < 0 ? 99 : i, cidade: (t && t.mapa) || '', id};
    };
    const ordem = [...clubes].map(chave).sort((a,b)=>
      a.uf - b.uf ||
      (a.cidade < b.cidade ? -1 : a.cidade > b.cidade ? 1 : 0) ||
      (a.id < b.id ? -1 : 1)).map(x=>x.id);
    const tam = Math.ceil(ordem.length / quantos);
    const g = [];
    for(let i=0; i<quantos; i++) g.push(ordem.slice(i*tam, (i+1)*tam));
    return g.filter(x=>x.length);
  }

  /* =======================================================
     FORÇA DOS CLUBES — teto 100, valores da fonte
     A planilha dá o ponto de partida e ele entra como está:
     os 108 clubes nascem entre 4 e 50, que é a força que o
     autor definiu pra cada um. O que mudou foi só o TETO —
     de 50 pra 100 —, então sobra metade da régua pra crescer,
     seja em campo, seja com dinheiro de torcida. O resto do
     decênio é consequência do que aconteceu no gramado: quem
     termina no G4 sobe de nível, quem briga contra o
     rebaixamento perde. A evolução vive no save (E.forcas),
     nunca em times.js — dado importado não se reescreve.
     ======================================================= */
  const FORCA_MIN = 1, FORCA_MAX = 100;

  let _forcas = null;                     // ponteiro pro save da vez
  let _investido = null;
  const usarSave = E => {
    _forcas    = (E && E.forcas) || null;
    _investido = (E && E.investimento) || null;
  };
  /* GDD §9.5: "força do elenco (base + investimento da torcida)". As duas
     parcelas vivem separadas de propósito: a base é o que o clube conquistou
     em campo e é ela que a evolução de fim de ano recentra por competição;
     o investimento é dinheiro de torcida e não pode entrar nessa média,
     senão comprar elenco derrubaria o dos outros na mesma divisão. */
  const invDe = (E, id) => ((E && E.investimento) || {})[id] || 0;
  const daFonte = id => (M().time(id)||{}).qualidade || 10;
  const crua = id => (_forcas && _forcas[id] != null) ? _forcas[id] : daFonte(id);
  const forca = id => U.limitar(
    crua(id) + ((_investido && _investido[id]) || 0), FORCA_MIN, FORCA_MAX);
  const forcaBase = (E, id) =>
    (E.forcas && E.forcas[id] != null) ? E.forcas[id] : daFonte(id);
  const forcaDe = (E, id) =>
    U.limitar(forcaBase(E, id) + invDe(E, id), FORCA_MIN, FORCA_MAX);

  /* =======================================================
     REFORÇAR O ELENCO (GDD V3 §19)
     Um ponto de força custa o preço da faixa em que o clube
     está — de R$ 20 mil no time pequeno a R$ 320 mil no
     gigante (40% da tabela original, decisão do dono em
     18/08/2026). É o maior ralo de dinheiro do jogo, e é de
     propósito: com bar, loja e subsede montados, é pra onde
     sobra. Fecha o laço da torcida com o gramado — elenco
     melhor ganha mais, ganhar sobe a satisfação, satisfação
     enche o recrutamento.
     ======================================================= */
  const TABELA_INVESTIMENTO = [
    {ate: 10, custo:  20000}, {ate: 20, custo:  32000},
    {ate: 30, custo:  56000}, {ate: 40, custo:  80000},
    {ate: 50, custo: 100000}, {ate: 60, custo: 120000},
    {ate: 70, custo: 140000}, {ate: 80, custo: 160000},
    {ate: 90, custo: 200000}, {ate:100, custo: 320000}
  ];
  function custoDoPonto(E, id){
    const f = forcaDe(E, id);
    return (TABELA_INVESTIMENTO.find(x=>f <= x.ate)
            || TABELA_INVESTIMENTO[TABELA_INVESTIMENTO.length-1]).custo;
  }

  function investir(E, id, pontos){
    pontos = Math.max(1, Math.round(pontos||1));
    E.investimento = E.investimento || {};
    let gasto = 0, feitos = 0;
    /* ponto a ponto, porque o segundo pode cair na faixa de cima e custar
       mais caro que o primeiro */
    for(let i=0;i<pontos;i++){
      if(forcaDe(E, id) >= FORCA_MAX) break;
      const c = custoDoPonto(E, id);
      if(E.dinheiro < gasto + c) break;
      E.investimento[id] = (E.investimento[id] || 0) + 1;
      gasto += c; feitos++;
      usarSave(E);
    }
    if(!feitos) return {ok:false, pontos:0, gasto:0,
      msg: forcaDe(E, id) >= FORCA_MAX
        ? 'O elenco já está no teto.' : 'Não dá: falta caixa.'};
    const time = (M().time(id)||{}).nome || id;
    TO.estado.lancar(E, `Reforço no elenco do ${time}`, -gasto);
    TO.estado.anotar(E, `A torcida reforçou o elenco do ${time}: `+
      `+${feitos} de força.`, 'boa', {cat:6, assunto:'elenco'});
    return {ok:true, pontos:feitos, gasto, msg:`${time}: +${feitos} de força`};
  }


  /* GDD §18: a escala é 1 a 100. O passo por temporada é pequeno de
     propósito — time grande não vira pequeno num ano, mas dez anos de
     Série C cobram o preço. Portado do protótipo antigo. */
  function evoluirForca(E){
    const S = E.temporada;
    if(!S) return [];
    E.forcas = E.forcas || {};

    /* 1. cada competição dá um delta bruto por posição */
    const bruto = {}, porComp = {};
    for(const comp of S.competicoes){
      const div = ESCADA.indexOf(comp.nome) + 1;   // 0 = não é Brasileirão
      const linhas = comp.grupos && comp.grupos.length > 1
        ? comp.grupos.flatMap((g,i)=>tabela(comp, i))
        : tabela(comp);
      linhas.forEach((l, i)=>{
        const pos = i + 1;
        let d;
        if(div === 1)      d = pos<=4 ? 5+U.inteiro(-5,5) : pos<=16 ? 2+U.inteiro(-5,5) : U.inteiro(-6,3);
        else if(div === 2) d = pos<=4 ? 3+U.inteiro(-2,5) : U.inteiro(-4,2);
        else if(div === 3) d = pos<=4 ? 2+U.inteiro(-1,4) : pos<=10 ? U.inteiro(-1,2)
                                      : pos<=16 ? U.inteiro(-2,2) : U.inteiro(-2,1);
        else if(div === 4) d = pos<=4 ? 2+U.inteiro(-1,2) : pos<=12 ? U.inteiro(-1,2) : U.inteiro(-1,1);
        /* o regional vale menos: é um torneio de dez jogos */
        else               d = (pos<=2 ? U.inteiro(0,2) : U.inteiro(-1,1)) * 0.5;
        bruto[l.id] = (bruto[l.id] || 0) + d;
        /* o clube pertence à competição de maior peso em que jogou:
           o nacional manda, o regional é tempero */
        if(div || !porComp[l.id]){
          (porComp[comp.nome] = porComp[comp.nome] || []).push(l.id);
        }
      });
    }

    const ids = Object.keys(bruto);
    if(!ids.length) return [];

    /* 2. cada divisão é soma zero DENTRO DE SI. Tirar só a média geral não
       basta: a tabela do protótipo é muito mais generosa na Série A (16 dos
       20 com média positiva) que na D (teto de +2), e em vinte anos isso
       vira uma aristocracia congelada — medido, 9 clubes da A no teto e 30
       da D no piso. Centrando por competição, quem sobe de nível sobe às
       custas de quem desceu na MESMA divisão, e o resto do movimento entre
       divisões fica por conta do acesso e do rebaixamento, que é onde ele
       deve estar. */
    for(const grupo of Object.values(porComp)){
      if(!grupo.length) continue;
      const m = grupo.reduce((s,id)=>s+bruto[id], 0) / grupo.length;
      for(const id of grupo) bruto[id] -= m;
    }

    /* 3. gravidade da divisão: todo ano o clube anda um pouco na direção do
       nível típico de onde está jogando. Gigante rebaixado perde elenco,
       clube pequeno que sobe recebe dinheiro. É isso que impede alguém de
       estacionar encostado no teto ou no piso. */
    const soma = {}, conta = {};
    for(const id of ids){
      const d = divisaoDe(E, M().time(id) || {});
      soma[d] = (soma[d]||0) + forcaBase(E, id);
      conta[d] = (conta[d]||0) + 1;
    }
    const GRAVIDADE = 0.12;

    /* 4. delta e força vivem na mesma escala de 1 a 100 */
    const mov = [];
    for(const id of ids){
      const antes = forcaBase(E, id);
      const d = divisaoDe(E, M().time(id) || {});
      const nivel = conta[d] ? soma[d]/conta[d] : antes;
      const puxao = (nivel - antes) * GRAVIDADE;
      const dep = U.limitar(Math.round(antes + bruto[id]/2 + puxao), FORCA_MIN, FORCA_MAX);
      if(dep !== antes){ E.forcas[id] = dep; mov.push({id, de:antes, para:dep}); }
    }
    usarSave(E);
    return mov;
  }

  /* =======================================================
     RESULTADO
     Poisson com o gol esperado saindo da força dos dois
     e do fator casa. Nada de sortear vencedor direto: placar
     de verdade dá empate, goleada e zebra na medida certa.
     ======================================================= */
  function poisson(lambda){
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= U.rng(); } while(p > L);
    return k-1;
  }

  /* GDD §9.5: o placar sai da forca dos dois elencos, do mando e de um
     bonus chamado Fator Torcida — o que a arquibancada faz no dia. O
     bonus vem de fora em pontos de força, positivo pro mandante.
     O divisor é 55 porque é a distância que separa o clube mais fraco
     do mais forte da fonte — subir o teto pra 100 não muda isso. */
  function simular(casa, fora, bonusCasa){
    const dif = (forca(casa) - forca(fora) + (bonusCasa||0)) / 55;
    const lc = U.limitar(1.30 + 0.30 + dif*1.5, 0.25, 5);
    const lf = U.limitar(1.30 - 0.20 - dif*1.5, 0.20, 5);
    return [poisson(lc), poisson(lf)];
  }

  /* =======================================================
     A DISPUTA DE PÊNALTIS (correção do dono, 21/08/2026)

     Antes o empate no mata-mata era uma moeda pesada pela
     força: `U.rng() < 0.5 + …` e pronto — o classificado saía
     de lugar nenhum e ninguém via como. Agora é disputa de
     verdade: cinco cobranças alternadas pra cada lado,
     morte súbita se persistir, e o roteiro fica guardado no
     jogo, cobrança a cobrança, pra tela poder mostrar.

     A conversão sai da força, mas de raspão: o melhor bate a
     78% e o pior a 73%, e nenhum passa disso. Pênalti é
     loteria — bater bem não é ser grande, é ter sangue frio.
     MEDIDO: com a faixa larga (68% a 82%) o gigante passava
     75% das vezes contra o menor clube do país, o que não é
     disputa de pênalti, é formalidade. Com esta, fica perto
     de 60%: vantagem, e não sentença.
     ======================================================= */
  /* A RÉGUA DO DONO (21/08/2026): o favorito passa **60/40** contra o
     pior clube do país. Pênalti é loteria; a força inclina a moeda,
     não decide por ela. Os dois batem em torno de 75% e a vantagem é
     uma fatia fina em cima disso — 0,032 aqui vira 60% lá na ponta,
     porque a diferença compõe ao longo das cinco cobranças. O valor
     saiu de varredura: 0,013 dava 54%, 0,045 dava 63%, 0,06 dava 68%. */
  const PEN_BASE = 0.755, PEN_VANTAGEM = 0.032;
  /* a trava contra série infinita é generosa de propósito: 50 rodadas
     não acontecem na vida real, e chegar nelas empatado seria pior que
     o remédio — disputa empatada não classifica ninguém */
  const PEN_SERIE = 5, PEN_MAX_RODADAS = 50;

  function chanceDePenalti(a, b){
    const p = forca(a) / (forca(a) + forca(b) || 1);   // 0 a 1
    return U.limitar(PEN_BASE + (p - 0.5) * 2 * PEN_VANTAGEM, 0.55, 0.95);
  }

  /* uma cobrança de resultado dado, pra fechar a trava */
  function cobrar2(cobrancas, gols, lado, n, marcou){
    if(marcou) gols[lado]++;
    cobrancas.push({lado, marcou, n});
  }

  /* =======================================================
     A SÉRIE, PELA REGRA DE VERDADE (conferida a pedido do
     dono, 21/08/2026)

     · REGULAMENTAR: cinco cobranças pra cada lado, alternadas.
       Para assim que uma das duas não puder mais ser
       alcançada — o 3×0 no quarto par não vai até o fim.
     · MORTE SÚBITA: dali em diante é PAR COMPLETO. Só decide
       quando os dois bateram na rodada e o placar diferiu.
       Nunca no meio de um par.
     ======================================================= */
  function disputaDePenaltis(a, b){
    const chance = {c: chanceDePenalti(a,b), f: chanceDePenalti(b,a)};
    const gols = {c:0, f:0};
    const cobrancas = [];
    const bateu = lado => cobrancas.filter(x=>x.lado === lado).length;

    const cobrar = (lado, n)=>{
      const marcou = U.rng() < chance[lado];
      if(marcou) gols[lado]++;
      cobrancas.push({lado, marcou, n});
    };

    /* ---- os cinco pares regulamentares ---- */
    let acabou = false;
    for(let r = 1; r <= PEN_SERIE && !acabou; r++){
      for(const lado of ['c','f']){
        cobrar(lado, r);
        /* quem ainda vai bater quantas vezes na regulamentar */
        const falta = {c: PEN_SERIE - bateu('c'), f: PEN_SERIE - bateu('f')};
        if(gols.c - gols.f > falta.f || gols.f - gols.c > falta.c){
          acabou = true; break;                 // decidida: não se bate mais
        }
      }
    }

    /* ---- morte súbita: par completo, e só ---- */
    let r = PEN_SERIE + 1;
    for(; !acabou && r <= PEN_MAX_RODADAS; r++){
      cobrar('c', r);
      cobrar('f', r);
      if(gols.c !== gols.f) acabou = true;
    }

    /* BATEU NA TRAVA AINDA EMPATADO (uma em quatro mil, medido): a
       série não pode terminar empatada, senão ninguém se classifica.
       Uma última rodada em que um converte e o outro não, sorteada
       pela mesma vantagem de força que vale o resto da disputa. */
    if(!acabou){
      const p = chance.c / (chance.c + chance.f || 1);
      const passaC = U.rng() < p;
      cobrar2(cobrancas, gols, 'c', r, passaC);
      cobrar2(cobrancas, gols, 'f', r, !passaC);
    }

    return {c:gols.c, f:gols.f, venceu: gols.c > gols.f ? a : b, cobrancas};
  }

  /* o vencedor da disputa, guardando o roteiro no próprio jogo. E se
     quem decidiu foi o NOSSO clube, deixa o recado pra tela abrir a
     disputa cobrança a cobrança em vez de mostrar o placar pronto. */
  function penaltisNoJogo(E, j, a, b, ctx){
    const d = disputaDePenaltis(a, b);
    j.pen = d;
    j.penaltis = true;
    const meu = E && E.torcida && E.torcida.clubeId;
    if(meu && (a === meu || b === meu)){
      E.penaltisPendente = {a, b, pen:d,
        comp:(ctx && ctx.comp) || '', fase:(ctx && ctx.fase) || ''};
    }
    return d.venceu;
  }

  /* compat: quem só quer saber quem passou */
  function penaltis(a, b){ return disputaDePenaltis(a, b).venceu; }

  /* =======================================================
     MONTAGEM DA TEMPORADA
     ======================================================= */
  /* =======================================================
     FORMATO DOS ESTADUAIS E REGIONAIS
     Um por competição, como o autor definiu. Quem não está na
     tabela cai na regra por tamanho, logo abaixo.
     ======================================================= */
  const FORMATO = {
    /* 6 clubes: todos contra todos ida e volta, top 4 → semi e final */
    'Catarinense': {grupos:1, passam:4, voltas:2},
    'Mineiro':     {grupos:1, passam:4, voltas:2},
    'Paranaense':  {grupos:1, passam:4, voltas:2},
    /* 10 clubes: turno único, top 4 → semi e final */
    'Paulistão':          {grupos:1, passam:4, voltas:1},
    'Paulistão A2':       {grupos:1, passam:4, voltas:1},
    'Cariocão':           {grupos:1, passam:4, voltas:1},
    'Copa Centro-Oeste':  {grupos:1, passam:4, voltas:1},
    /* 8 clubes: turno único, top 4 → semi e final */
    'Gauchão':     {grupos:1, passam:4, voltas:1},
    'Copa Norte':  {grupos:1, passam:4, voltas:1},
    /* dois grupos, turno único, top 4 de cada → quartas, semi, final */
    'Copa do Nordeste':   {grupos:2, passam:4, voltas:1, rebaixaPorGrupo:1},
    'Nordestão Série B':  {grupos:2, passam:4, voltas:1, sobemFinalistas:true}
  };

  /* GDD §18.3, pra competição que a tabela acima não cobrir */
  function formatoRegional(nome, n){
    if(FORMATO[nome]) return FORMATO[nome];
    if(n >= 16) return {grupos:2, passam:4, voltas:1};
    if(n >= 12) return {grupos:2, passam:2, voltas:1};
    if(n >= 7)  return {grupos:1, passam:4, voltas:1};
    return {grupos:1, passam:4, voltas:2};
  }

  /* quantas semanas o formato ocupa: grupos mais as chaves, descontando
     as rodadas de meio de semana, que não gastam semana própria */
  function semanasQuePrecisa(cfg, clubes, tipo){
    const g = cfg.grupos || 1;
    const maior = Math.ceil(clubes/g);
    const rodadas = (maior % 2 ? maior : maior-1) * (cfg.voltas || 1);
    const passam  = Math.max(2, (cfg.passam||2) * g);
    const meio = Math.min(MEIO_POR_TIPO[tipo || 'regional'] || 0, Math.max(0, rodadas-2));
    return rodadas - meio + Math.ceil(Math.log2(passam));
  }

  /* GDD §18.2: sobe e desce entre as séries no fim do ano.
     Série D tem 48 clubes e a C tem 20, então o fluxo entre elas não
     pode ser 4 por 4 — sobem 4 e caem 4, e a D absorve a diferença. */
  const ESCADA = ['Brasileirão Série A','Brasileirão Série B',
                  'Brasileirão Série C','Brasileirão Série D'];
  const TROCA = 4;

  /* Dia 1 é segunda, 6 é sábado, 7 é domingo. */
  const DIA_FDS  = 6;
  const DIA_MEIO = 3;

  /* Grade horária de cada competição: os jogos de uma rodada se
     espalham pelos horários na ordem em que a tabela os sorteou, do
     jeito que a TV divide o fim de semana. A Copa do Brasil fica no
     meio de semana pra caber junto com os pontos corridos. */
  const GRADE = {
    'Brasileirão Série A': [
      {d:6, h:'16:00'}, {d:6, h:'18:30'}, {d:6, h:'21:00'},
      {d:7, h:'11:00'}, {d:7, h:'16:00'}, {d:7, h:'18:30'}, {d:7, h:'20:30'}
    ],
    'Brasileirão Série B': [
      {d:6, h:'17:00'}, {d:6, h:'20:30'},
      {d:7, h:'16:00'}, {d:7, h:'18:00'}, {d:7, h:'20:00'}
    ],
    'Brasileirão Série C': [
      {d:6, h:'16:30'}, {d:6, h:'19:30'}, {d:7, h:'15:00'}, {d:7, h:'17:00'}
    ],
    'Brasileirão Série D': [
      {d:6, h:'15:00'}, {d:6, h:'17:00'},
      {d:7, h:'10:00'}, {d:7, h:'15:00'}, {d:7, h:'16:00'}
    ],
    regional: [
      {d:6, h:'16:00'}, {d:6, h:'18:30'},
      {d:7, h:'11:00'}, {d:7, h:'16:00'}, {d:7, h:'18:30'}
    ],
    copa:  [{d:3, h:'19:00'}, {d:3, h:'21:30'}],
    meio:  [{d:3, h:'19:00'}, {d:3, h:'19:30'}, {d:3, h:'21:30'}],
    final: [{d:7, h:'16:00'}]
  };
  const gradeDe = (nome, tipo) => GRADE[nome] || GRADE[tipo] || GRADE.regional;

  /* Rodadas do meio de semana. Elas dividem a semana com a rodada
     seguinte — quarta e depois fim de semana — e é o que faz a
     temporada fechar no fim de novembro em vez de virar o ano. */
  const MEIO_POR_TIPO = {regional:2, nacional:3};
  function rodadasDoMeio(total, quantas){
    const s = new Set();
    for(let i=1;i<=quantas;i++){
      let r = Math.round(total*i/(quantas+1));
      while(s.has(r)) r++;
      if(r > 0 && r < total) s.add(r);
    }
    return s;
  }

  function criarCompeticao(id, nome, tipo, clubes, cfg, semanaInicio, finalEm){
    const grupos = cfg.grupos > 1
      ? (cfg.regional ? dividirGruposPorRegiao(clubes, cfg.grupos)
                      : dividirGrupos(clubes, cfg.grupos))
      : [clubes];
    const porGrupo = grupos.map(g=>roundRobin(g, cfg.voltas));
    const maior = Math.max(...porGrupo.map(r=>r.length));

    const grade = gradeDe(nome, tipo);
    const meias = rodadasDoMeio(maior, MEIO_POR_TIPO[tipo] || 0);
    const rodadas = [];
    let semana = semanaInicio;
    for(let r=0; r<maior; r++){
      const jogos = [];
      porGrupo.forEach((rr, ig)=>{
        for(const j of (rr[r]||[])) jogos.push({...j, g:ig});
      });
      const g = meias.has(r) ? GRADE.meio : grade;
      jogos.forEach((j, k)=>{ const s = g[k % g.length]; j.d = s.d; j.h = s.h; });
      rodadas.push({semana, dia:g[0].d, meio:meias.has(r), fase:'grupos', jogos});
      /* rodada de quarta divide a semana com a próxima */
      if(!meias.has(r)) semana++;
    }
    return {
      id, nome, tipo,
      clubes, grupos: grupos.map(g=>[...g]),
      passam: cfg.passam, voltas: cfg.voltas, grade,
      semanaInicio, finalEm: finalEm || null, dia: grade[0].d,
      rodadas, mata:[], campeao:null, vice:null,
      /* série com pontos corridos não tem mata-mata: campeão é o líder */
      pontosCorridos: !!cfg.pontosCorridos,
      /* cada chave do mata-mata se decide em dois jogos */
      idaEVolta: !!cfg.idaEVolta
    };
  }

  /* A divisão e o estadual de um clube mudam com sobe-e-desce. times.js
     é fonte estática, então a mudança vive no save. */
  const divisaoDe  = (E, t) => (E.divisoes  || {})[t.id] || t.divisao;
  const regionalDe = (E, t) => (E.regionais || {})[t.id] || t.regional;
  const paisDe     = t => (t && t.pais) || 'Brasil';

  /* =======================================================
     O MUNDO DE FORA AINDA NÃO JOGA (medido em 23/08/2026)

     `dados/times.js` já traz os 248 clubes de nove países da América
     do Sul, mas a temporada só monta o Brasil. Não é esquecimento, é
     conta: deixando o motor de hoje montar tudo, a temporada vai a
     20.714 jogos e o campo `temporada` do save salta de 154 KB pra
     1.568 KB — o save passa de 2,3 MB ANTES de fechar o primeiro ano,
     que é mais do que uma partida brasileira de cinco anos ocupa. O
     dia também fica 21 ms mais lento, e o dia roda no relógio.

     Além disso o formato estaria errado: as ligas de lá são Apertura
     e Clausura, quadrangular, hexagonal, tabela anual e promedio, e
     nada disso cabe em `{grupos, passam, voltas}`.

     Então os clubes de fora ficam guardados e fora da temporada até o
     motor de formatos existir. Quem ligar isto antes tem de resolver
     o armazenamento junto. */
  /* O PAÍS DO JOGADOR É QUE JOGA (régua do dono, 23/08/2026).
     "O país cuja torcida que o jogador selecionar deve gerar os jogos e
     as demais geram somente as tabelas." Este motor sabe o formato
     brasileiro — estadual, quatro séries e Copa do Brasil —, então ele
     monta a temporada quando o jogador é do Brasil. Quando não é, quem
     monta é `ligas.js`, que sabe Apertura, Clausura, quadrangular,
     hexagonal e tabela anual; a temporada nasce vazia aqui e ele
     pendura as competições dele nela. O Brasil, nesse caso, cai pro
     resumo das ligas junto com os outros oito. */
  function paisDoJogador(E){
    const meu = E && E.torcida && E.torcida.clubeId;
    const t = meu ? M().time(meu) : null;
    return (t && t.pais) || 'Brasil';
  }

  function montarTemporada(E){
    U.usarSemente((E.semente || 1) + (E.data.ano||2026));
    const T = M().todosTimes;
    const comps = [];

    if(paisDoJogador(E) !== 'Brasil')
      return {ano:E.data.ano, competicoes:comps, deFora:true,
              titulos:(E.temporada && E.temporada.titulos) || []};

    /* ---- fase 1: regionais e estaduais (GDD §18.3 e §18.4) ---- */
    const porRegional = {};
    for(const t of T){
      if(paisDe(t) !== 'Brasil') continue;
      const r = regionalDe(E, t);
      if(!r) continue;
      (porRegional[r] = porRegional[r] || []).push(t.id);
    }
    const janela = FINAL_REGIONAL - INICIO_REGIONAL + 1;
    for(const nome of Object.keys(porRegional).sort()){
      const clubes = porRegional[nome];
      let cfg = formatoRegional(nome, clubes.length);
      /* se o clube mudou de estadual e o formato não cabe mais na
         janela de janeiro a março, o returno é o primeiro a cair */
      if(semanasQuePrecisa(cfg, clubes.length, 'regional') > janela && (cfg.voltas||1) > 1)
        cfg = Object.assign({}, cfg, {voltas:1});

      /* Toda final cai na mesma semana, a véspera do Brasileirão, e a
         fase de grupos termina na semana anterior à primeira partida do
         mata-mata. Quem tem chave mais longa começa antes; ninguém fica
         com buraco no meio da competição. */
      const chaves = Math.ceil(Math.log2(Math.max(2, (cfg.passam||2)*(cfg.grupos||1))));
      const primeiraChave = FINAL_REGIONAL - (chaves - 1);
      const rodadas = semanasQuePrecisa(cfg, clubes.length, 'regional') - chaves;
      const inicio = Math.max(INICIO_REGIONAL, primeiraChave - rodadas);

      comps.push(criarCompeticao(U.identificador(nome), nome, 'regional',
        clubes, cfg, inicio, FINAL_REGIONAL));
    }

    /* ---- fase 2: Brasileirão (GDD §18.2) ---- */
    const porDivisao = {};
    for(const t of T){
      if(paisDe(t) !== 'Brasil') continue;
      const d = divisaoDe(E, t);
      (porDivisao[d] = porDivisao[d] || []).push(t.id);
    }
    for(const nome of Object.keys(porDivisao).sort()){
      const clubes = porDivisao[nome];
      /* até 20 clubes é turno e returno; a D, com 48, vai em quatro
         grupos regionalizados com playoff, como manda o GDD */
      /* MATA-MATA DA D É IDA E VOLTA (pedido do dono, 21/08/2026): a
         D é a única série que sai dos grupos pro playoff, e playoff de
         acesso não se decide em jogo único. */
      /* os grupos da divisão inferior são REGIONALIZADOS (pedido do
         dono, 27/08/2026): corte contíguo do mapa, norte no A */
      const cfg = clubes.length <= 20
        ? {grupos:1, passam:0, voltas:2, pontosCorridos:true}
        : {grupos:4, passam:4, voltas:2, idaEVolta:true, regional:true};
      comps.push(criarCompeticao(U.identificador(nome), nome, 'nacional',
        clubes, cfg, INICIO_NACIONAL));
    }

    /* ---- mando de campo: rival direto e sequência em casa ---- */
    ajustarMandos(comps);

    /* ---- a Copa do Brasil corre por dentro, no meio de semana ---- */
    comps.push(criarCopa(E));

    return {
      ano: E.data.ano,
      competicoes: comps,
      /* histórico de campeões, pra tela de conquistas mais tarde */
      titulos: (E.temporada && E.temporada.titulos) || []
    };
  }

  /* =======================================================
     MANDO DE CAMPO
     Duas regras que a tabela sorteada não respeita sozinha:
     rival direto não joga em casa no mesmo fim de semana, e
     ninguém faz quatro jogos seguidos em casa na mesma
     competição.
     ======================================================= */

  /* O rival direto de um clube é UM só. O grafo de torcidas dá até cinco
     "maiores rivais" por clube, e com cinco arestas a regra "rival em
     casa, eu fora" vira impossível: numa rodada do Cariocão cinco dos
     dez cariocas mandam, e eles são rivais entre si. Então o rival
     direto é escolhido em pares exclusivos — o clássico de cada um —,
     priorizando mesma cidade e torcida grande. Fortaleza fica com o
     Ceará, Grêmio com o Inter, Athletico com o Coritiba. */
  let _rivais = null;
  function rivaisDiretos(){
    if(_rivais) return _rivais;
    const clubeDa = new Map(M().todasTorcidas.map(o=>[o.id, o.clubeId]));
    const membros = new Map();
    for(const o of M().todasTorcidas)
      membros.set(o.clubeId, Math.max(membros.get(o.clubeId)||0, o.membros||0));

    const cand = new Map();          // "a|b" -> peso
    for(const o of M().todasTorcidas){
      const a = o.clubeId;
      if(!M().time(a)) continue;
      for(const r of (o.maioresRivais||[])){
        const b = clubeDa.get(r);
        if(!b || b===a || !M().time(b)) continue;
        const k = [a,b].sort().join('|');
        const mesmaCidade = M().time(a).mapa === M().time(b).mapa;
        const peso = (mesmaCidade?1000:0)
                   + (membros.get(a)||0) + (membros.get(b)||0)
                   + (cand.get(k) ? 1 : 0);      // citado dos dois lados
        cand.set(k, Math.max(cand.get(k)||0, peso));
      }
    }
    /* casamento guloso: o clássico mais forte primeiro, e cada clube
       entra em um par só */
    _rivais = new Map();
    const tomado = new Set();
    for(const [k] of [...cand].sort((x,y)=>y[1]-x[1])){
      const [a,b] = k.split('|');
      if(tomado.has(a) || tomado.has(b)) continue;
      tomado.add(a); tomado.add(b);
      _rivais.set(a, new Set([b]));
      _rivais.set(b, new Set([a]));
    }
    return _rivais;
  }

  /* nem quatro jogos seguidos em casa nem quatro fora, por competição */
  const MAX_SEGUIDOS = 3;

  function ajustarMandos(comps){
    const riv = rivaisDiretos();

    /* A janela é o fim de semana ou o meio de semana: dois rivais podem
       mandar na mesma semana desde que em janelas diferentes. */
    const janelaDe = (semana, dia) => `${semana}${dia>=6?'F':'M'}`;
    const porJanela = new Map();     // chave -> jogos
    const daJanela  = new Map();     // jogo -> chave
    const irmao     = new Map();     // jogo -> jogo de volta
    const doComp    = new Map();     // jogo -> competição
    const agenda    = new Map();     // competição -> clube -> jogos em ordem

    for(const comp of comps){
      const porClube = new Map();
      agenda.set(comp, porClube);
      for(const r of comp.rodadas){
        for(const j of r.jogos){
          const k = janelaDe(r.semana, j.d || r.dia || DIA_FDS);
          if(!porJanela.has(k)) porJanela.set(k, []);
          porJanela.get(k).push(j);
          daJanela.set(j, k);
          doComp.set(j, comp);
          j._o = r.semana*10 + (j.d || DIA_FDS);      // ordem no calendário
          for(const cl of [j.c, j.f]){
            if(!porClube.has(cl)) porClube.set(cl, []);
            porClube.get(cl).push(j);
          }
        }
      }
      for(const l of porClube.values()) l.sort((a,b)=>a._o-b._o);
      if(comp.voltas > 1){
        const porPar = new Map();
        for(const r of comp.rodadas) for(const j of r.jogos){
          const chave = [j.c, j.f].sort().join('|');
          if(porPar.has(chave)){
            const outro = porPar.get(chave);
            irmao.set(j, outro); irmao.set(outro, j);
          }else porPar.set(chave, j);
        }
      }
    }

    /* Rival junto só conta como problema quando os dois mandam no MESMO
       DIA. Dividir o fim de semana — um sábado, outro domingo — é a
       saída quando o mando não pode ser trocado. */
    const conflitosNa = chave =>{
      const porDia = new Map();
      for(const j of (porJanela.get(chave)||[])){
        const d = j.d || DIA_FDS;
        if(!porDia.has(d)) porDia.set(d, new Set());
        porDia.get(d).add(j.c);
      }
      let n = 0;
      for(const casa of porDia.values())
        for(const a of casa)
          for(const r of (riv.get(a)||[])) if(casa.has(r) && a < r) n++;
      return n;
    };

    /* quantos jogos passam do teto de seguidos, dos dois lados: nem
       quatro em casa nem quatro fora */
    function excesso(comp, clube){
      const l = (agenda.get(comp)||new Map()).get(clube) || [];
      let casa = 0, fora = 0, exc = 0;
      for(const j of l){
        if(j.c === clube){ casa++; fora = 0; if(casa > MAX_SEGUIDOS) exc++; }
        else            { fora++; casa = 0; if(fora > MAX_SEGUIDOS) exc++; }
      }
      return exc;
    }

    /* trocar o mando; em turno e returno o jogo de volta vai junto */
    function inverter(j){
      const par = irmao.get(j);
      if(par){ const t=par.c; par.c=par.f; par.f=t; }
      const t = j.c; j.c = j.f; j.f = t;
    }

    /* Custo só do que a troca mexe: as janelas dos dois jogos e a
       sequência dos dois clubes. Rival vale dez porque é a regra dura;
       sequência longa é incômodo, não erro. */
    function custoLocal(j){
      const comp = doComp.get(j), par = irmao.get(j);
      const alvos = new Set([daJanela.get(j)]);
      if(par) alvos.add(daJanela.get(par));
      let c = 0;
      for(const k of alvos) c += conflitosNa(k) * 10;
      c += excesso(comp, j.c) + excesso(comp, j.f);
      return c;
    }
    function ganho(j){
      const antes = custoLocal(j);
      inverter(j);
      const depois = custoLocal(j);
      inverter(j);
      return antes - depois;
    }

    /* descida em ladeira sobre os jogos que estão em alguma violação */
    function candidatos(){
      const fora = new Set();
      for(const [chave, jogos] of porJanela)
        if(conflitosNa(chave)) for(const j of jogos) fora.add(j);
      for(const [comp, porClube] of agenda)
        for(const [clube, l] of porClube){
          if(!excesso(comp, clube)) continue;
          for(const j of l) fora.add(j);
        }
      return fora;
    }

    /* custo global, pra saber se o rumo é bom */
    const todos = [...doComp.keys()];
    function custoTotal(){
      let c = 0;
      for(const k of porJanela.keys()) c += conflitosNa(k)*10;
      for(const [comp, porClube] of agenda)
        for(const clube of porClube.keys()) c += excesso(comp, clube);
      return c;
    }
    const guardar = ()=> todos.map(j=>j.c);
    const repor = foto => todos.forEach((j,i)=>{
      if(j.c !== foto[i]){ const t=j.c; j.c=j.f; j.f=t; }
    });

    /* Último recurso, como o autor pediu: se os dois rivais têm de
       mandar no mesmo fim de semana, um joga sábado e o outro domingo. */
    const DIAS_ALTERNATIVOS = {F:[6,7], M:[3,2,4]};
    function separarPorDia(){
      for(const [chave, jogos] of porJanela){
        const dias = DIAS_ALTERNATIVOS[chave.slice(-1)] || [6,7];
        for(let tentativa=0; tentativa<8; tentativa++){
          const porDia = new Map();
          for(const j of jogos){
            const d = j.d || DIA_FDS;
            if(!porDia.has(d)) porDia.set(d, new Map());
            porDia.get(d).set(j.c, j);
          }
          let alvo = null;
          for(const casa of porDia.values()){
            for(const [clube, j] of casa)
              for(const r of (riv.get(clube)||[]))
                if(casa.has(r) && clube < r){ alvo = casa.get(r); break; }
            if(alvo) break;
          }
          if(!alvo) break;
          const comp  = doComp.get(alvo);
          const grade = comp.grade || GRADE.regional;
          const outro = dias.find(d=>d !== alvo.d);
          if(outro === undefined) break;
          const vaga = grade.find(x=>x.d === outro);
          alvo.d = outro;
          alvo.h = vaga ? vaga.h : (alvo.h || '19:30');
        }
      }
    }
    separarPorDia();

    /* Ladeira abaixo com passos de platô: prender no primeiro vale
       deixava 45 conflitos de pé, porque trocar o mando de um jogo
       arrasta o jogo de volta junto e o ganho imediato dá zero. Aceitar
       o movimento neutro destrava a cadeia; a melhor configuração vista
       fica guardada. */
    let melhorFoto = guardar(), melhorCusto = custoTotal();
    for(let passo=0; passo<1200; passo++){
      const cands = [...candidatos()];
      if(!cands.length) break;
      let alvo = null, melhor = 0;
      const neutros = [];
      for(const j of cands){
        const g = ganho(j);
        if(g > melhor){ melhor = g; alvo = j; }
        else if(g === 0) neutros.push(j);
      }
      if(alvo) inverter(alvo);
      else if(neutros.length) inverter(neutros[Math.floor(U.rng()*neutros.length)]);
      else break;
      const c = custoTotal();
      if(c < melhorCusto){ melhorCusto = c; melhorFoto = guardar(); }
    }
    repor(melhorFoto);


    /* Com os rivais separados, sobra espaço pra encurtar as sequências
       de mando. Mesma descida com passo de platô. */
    melhorFoto = guardar(); melhorCusto = custoTotal();
    for(let passo=0; passo<900; passo++){
      const cands = [...candidatos()];
      if(!cands.length) break;
      let alvo = null, melhor = 0;
      const neutros = [];
      for(const j of cands){
        const g = ganho(j);
        if(g > melhor){ melhor = g; alvo = j; }
        else if(g === 0) neutros.push(j);
      }
      if(alvo) inverter(alvo);
      else if(neutros.length) inverter(neutros[Math.floor(U.rng()*neutros.length)]);
      else break;
      const c = custoTotal();
      if(c < melhorCusto){ melhorCusto = c; melhorFoto = guardar(); }
    }
    repor(melhorFoto);
    separarPorDia();

    let conf = 0;
    for(const k of porJanela.keys()) conf += conflitosNa(k);
    for(const comp of comps) for(const r of comp.rodadas)
      for(const j of r.jogos) delete j._o;
    return {conflitosRestantes: conf};
  }

  /* pior sequência de jogos seguidos do mesmo lado, pra conferência */
  function piorSequencia(comps){
    let pior = 0;
    for(const comp of comps){
      const porClube = new Map();
      for(const r of comp.rodadas)
        for(const j of r.jogos)
          for(const [clube, casa] of [[j.c,true],[j.f,false]]){
            if(!porClube.has(clube)) porClube.set(clube, []);
            porClube.get(clube).push({s:r.semana*10+(j.d||6), casa});
          }
      for(const [, l] of porClube){
        l.sort((a,b)=>a.s-b.s);
        let c = 0, f = 0;
        for(const g of l){
          if(g.casa){ c++; f=0; } else { f++; c=0; }
          pior = Math.max(pior, c, f);
        }
      }
    }
    return pior;
  }
  const piorSequenciaEmCasa = piorSequencia;

  /* =======================================================
     COPA DO BRASIL
     Chave direta, sem grupos. Entra todo mundo menos a Série
     A, que só aparece na segunda fase. Jogo único até as
     oitavas; da oitava à semi, ida e volta; final em campo
     neutro.
     ======================================================= */
  /* Uma fase a cada três semanas, na quarta-feira; ida e volta em
     semanas seguidas. A final sai do meio de semana e vem depois da
     última rodada do Brasileirão (semana 48) e das finais da Conmebol
     (48 e 49).

     A FINAL NÃO FECHA O ANO (pedido do dono, 17/09/2026): ela ficava
     na semana 52, e o campeão saía no fechamento dessa semana — o
     mesmo instante em que o ano vira e a temporada nova apaga a
     antiga. O título ia pro histórico, mas ninguém noticiava, e a
     tela da copa já amanhecia com a chave do ano seguinte: pra quem
     jogava, a copa acabava sem campeão. Na 50 sobram duas semanas pro
     jornal contar e pra chave ficar de pé com o troféu. */
  const COPA_FINAL_SEMANA = 50;
  const COPA_FASES = [
    {fase:'Primeira fase', semanas:[22]},
    {fase:'Segunda fase',  semanas:[26], entram:'Brasileirão Série A'},
    {fase:'Terceira fase', semanas:[30]},
    {fase:'Oitavas',       semanas:[34,35]},
    {fase:'Quartas',       semanas:[39,40]},
    {fase:'Semifinal',     semanas:[44,45]},
    {fase:'Final',         semanas:[COPA_FINAL_SEMANA], neutro:true, grade:GRADE.final}
  ];
  const COPA_NOME = 'Copa do Brasil';
  /* DOIS POTES ATÉ AS OITAVAS (pedido do dono, 17/09/2026): nessas
     fases o sorteio separa os clubes em um pote de fortes e um de
     fracos, e cada jogo cruza um de cada. Das quartas em diante o
     sorteio é livre. */
  const FASES_COM_POTES = new Set(['Primeira fase', 'Segunda fase',
                                   'Terceira fase', 'Oitavas']);

  const forcaDivisao = (E, id)=>{
    const t = M().time(id);
    const i = ESCADA.indexOf(divisaoDe(E, t||{}));
    return i < 0 ? ESCADA.length : i;      // 0 = Série A, maior = pior
  };

  /* Quem manda no jogo único: o clube da divisão mais alta, como o
     autor definiu pra primeira fase (B e C recebem a D). Empate de
     divisão, decide a força. */
  function mandante(E, a, b){
    const fa = forcaDivisao(E,a), fb = forcaDivisao(E,b);
    if(fa !== fb) return fa < fb ? [a,b] : [b,a];
    return forca(a) >= forca(b) ? [a,b] : [b,a];
  }

  /* do mais forte pro mais fraco: divisão mais alta primeiro, e dentro
     da divisão a força do elenco */
  const ordemDeForca = (E, ids) => ids.slice().sort((a,b)=>
    forcaDivisao(E,a) - forcaDivisao(E,b) || forca(b) - forca(a));

  /* O SORTEIO EM DOIS POTES: a metade de cima é o pote 1, a de baixo o
     pote 2, cada pote embaralhado por si, e o k-ésimo de um pega o
     k-ésimo do outro. O mando segue a régua de sempre (divisão mais
     alta em casa). Com número ímpar, o último do pote 1 passa direto
     — em vez de sumir da chave, que era o que o laço antigo fazia. */
  function sortearPorPotes(E, ids){
    const ordem = ordemDeForca(E, ids);
    const meio  = Math.ceil(ordem.length / 2);
    const pote1 = U.embaralhar(ordem.slice(0, meio));
    const pote2 = U.embaralhar(ordem.slice(meio));
    return pote1.map((a, k)=> pote2[k] ? mandante(E, a, pote2[k]) : [a, null]);
  }

  /* sorteio livre: embaralha e emparelha; ímpar, o que sobra passa */
  function sortearLivre(E, ids){
    const sorteio = U.embaralhar(ids);
    const pares = [];
    for(let i=0;i+1<sorteio.length;i+=2)
      pares.push(mandante(E, sorteio[i], sorteio[i+1]));
    if(sorteio.length % 2) pares.push([sorteio[sorteio.length-1], null]);
    return pares;
  }

  function criarCopa(E){
    /* a Copa do Brasil é só de clube brasileiro: sem este filtro os
       248 de fora entram como "resto" e disputam a primeira fase */
    const T = M().todosTimes.filter(t=>paisDe(t) === 'Brasil');
    const daSerieA = T.filter(t=>divisaoDe(E,t)===ESCADA[0]).map(t=>t.id);
    const resto    = T.filter(t=>divisaoDe(E,t)!==ESCADA[0]).map(t=>t.id);

    /* Primeira fase em dois potes: B, C e o topo da D de um lado, o
       resto da D do outro. B e C seguem mandando em casa, que é a
       régua do mando. */
    const jogos = sortearPorPotes(E, resto).map(([c, f])=>({c, f}));

    const grade = GRADE.copa;
    jogos.forEach((j,k)=>{ const s = grade[k % grade.length]; j.d = s.d; j.h = s.h; });
    return {
      id:'copa-do-brasil', nome:COPA_NOME, tipo:'copa', copa:true,
      clubes:[...resto, ...daSerieA],
      grupos:[], passam:0, voltas:1, pontosCorridos:false, grade,
      semanaInicio: COPA_FASES[0].semanas[0], finalEm: null,
      dia: DIA_MEIO,
      rodadas:[],
      mata:[{fase:COPA_FASES[0].fase, semana:COPA_FASES[0].semanas[0],
             dia:DIA_MEIO, jogos, indice:0, perna:'unica'}],
      esperando: daSerieA,          // entram na segunda fase
      faseAtual:0, campeao:null, vice:null
    };
  }

  /* QUEM DECIDE NA PARTIDA (correção do dono, 16/09/2026)
     Nem toda linha guardada em `comp.mata` é mata-mata: a fase de
     grupos da Libertadores e da Sul-Americana do clube do jogador mora
     ali também, porque é de lá que sai a agenda dele. Sem esta trava,
     todo empate de fecha de grupo ia pra disputa de pênaltis — e
     empate em grupo é empate, vale um ponto pra cada. Ida e volta
     também não decide na partida: quem decide é o agregado. */
  const decideNaPartida = m =>
    !m.grupo && m.perna !== 'ida' && m.perna !== 'volta';

  /* soma dos dois jogos; empatou, pênaltis */
  function decidirAgregado(E, comp, volta){
    const ida = comp.mata.find(m=>m.indice===volta.indice && m.perna==='ida');
    for(const v of volta.jogos){
      /* DECIDE UMA VEZ SÓ: a volta é resolvida no dia em que ela é
         jogada (pra notícia daquele dia já contar a vaga) e o
         fechamento da semana passa por aqui de novo. Sem esta trava a
         disputa de pênaltis rodaria duas vezes, com resultados
         diferentes — a manchete diria um e a chave, outro. */
      if(v.venceu) continue;
      if(!v.f){ v.venceu = v.c; continue; }          // sem adversário, passa
      const i = (ida ? ida.jogos : []).find(x=>x.par===v.par);
      if(!i) { v.venceu = v.gc>v.gf ? v.c : v.f; continue; }
      const golsC = i.gc + v.gf;   // o mandante da ida é o visitante da volta
      const golsF = i.gf + v.gc;
      v.agregado = `${golsC} × ${golsF}`;
      /* A DISPUTA CORRE NA ORIENTAÇÃO DA VOLTA, e não na da ida: o
         roteiro fica guardado no jogo da volta, então `pen.c` tem de
         ser o mandante DELA. Rodando com os times da ida, o placar
         saía trocado em relação aos nomes — "ASA 4×2 Paulista" com o
         Paulista classificado. */
      v.venceu = golsC>golsF ? i.c : golsF>golsC ? i.f
               : penaltisNoJogo(E, v, v.c, v.f,
                                {comp:comp.nome, fase:volta.fase});
    }
    return volta.jogos.map(j=>j.venceu);
  }

  /* Estádio da final: o maior do país que não seja casa de nenhum dos
     dois. Filtra por nome de estádio, não por clube — dois clubes podem
     dividir o mesmo campo, e aí ele não é neutro pra nenhum deles. */
  function campoNeutro(a, b){
    const deles = new Set([a,b].map(id=>(M().time(id)||{}).estadio).filter(Boolean));
    const fora = M().todosTimes
      .filter(t=>t.estadio && !deles.has(t.estadio))
      .sort((x,y)=>(y.capacidade||0)-(x.capacidade||0))[0];
    return fora ? fora.estadio : 'campo neutro';
  }

  function avancarCopa(E, comp, semana){
    if(comp.campeao) return;
    const ult = comp.mata[comp.mata.length-1];
    if(!ult || ult.jogos.some(j=>j.f && !temJogo(j))) return;

    /* decide quem passou */
    let vivos;
    if(ult.perna === 'volta') vivos = decidirAgregado(E, comp, ult);
    else {
      for(const j of ult.jogos){
        if(!j.f){ j.venceu = j.c; continue; }          // sem adversário, passa direto
        j.venceu = j.gc>j.gf ? j.c : j.gf>j.gc ? j.f
                 : penaltisNoJogo(E, j, j.c, j.f,
                                  {comp:comp.nome, fase:ult.fase});
      }
      vivos = ult.jogos.map(j=>j.venceu);
    }
    if(ult.perna === 'ida') return;                    // espera a volta

    const passo = COPA_FASES[comp.faseAtual];
    if(passo.fase === 'Final'){
      comp.campeao = vivos[0];
      const f = ult.jogos[0];
      comp.vice = f.venceu===f.c ? f.f : f.c;
      return;
    }

    comp.faseAtual++;
    const prox = COPA_FASES[comp.faseAtual];
    if(!prox) return;

    /* os vinte da Série A entram na fase que a tabela mandar */
    let chave = [...vivos];
    if(prox.entram && comp.esperando && comp.esperando.length){
      chave = chave.concat(comp.esperando);
      comp.esperando = [];
    }
    if(chave.length < 2){ comp.campeao = chave[0] || null; return; }

    /* sorteio: em dois potes até as oitavas, livre dali em diante; o
       mando sai na hora */
    const pares = FASES_COM_POTES.has(prox.fase)
      ? sortearPorPotes(E, chave) : sortearLivre(E, chave);

    const grade = prox.grade || comp.grade || GRADE.copa;
    const horario = js => js.forEach((j,k)=>{
      const s = grade[k % grade.length]; j.d = s.d; j.h = s.h;
    });
    const dia = grade[0].d;
    const idaEVolta = prox.semanas.length > 1;
    if(idaEVolta){
      /* quem tem melhor campanha decide em casa, então joga a volta
         como mandante (GDD §18.5) */
      /* par sem adversário (chave ímpar): o clube fica como mandante
         das duas pernas, sem jogo, e passa direto */
      const ida   = pares.map(([a,b],k)=>({c:b || a, f:b ? a : null, par:k}));
      const volta = pares.map(([a,b],k)=>({c:a, f:b, par:k}));
      horario(ida); horario(volta);
      comp.mata.push({fase:`${prox.fase} · ida`, semana:prox.semanas[0], dia,
        indice:comp.faseAtual, perna:'ida', jogos:ida});
      comp.mata.push({fase:`${prox.fase} · volta`, semana:prox.semanas[1], dia,
        indice:comp.faseAtual, perna:'volta', jogos:volta});
    }else{
      const jogos = pares.map(([a,b],k)=>({c:a, f:b, par:k}));
      if(prox.neutro && jogos[0]) jogos[0].neutro = campoNeutro(jogos[0].c, jogos[0].f);
      horario(jogos);
      comp.mata.push({fase:prox.fase, semana:prox.semanas[0], dia,
        indice:comp.faseAtual, perna:'unica', jogos});
    }
  }

  /* =======================================================
     TABELA
     ======================================================= */
  function linhaVazia(id){
    return {id, j:0, v:0, e:0, d:0, gp:0, gc:0, sg:0, p:0};
  }

  /* `pular` (22/08/2026): uma rodada que NÃO deve contar. Serve pra
     tabela "antes do jogo de hoje" — ver `posicaoNaTabela`. */
  function tabela(comp, grupo, pular){
    const alvo = grupo===undefined ? null : grupo;
    const linhas = {};
    const lista = alvo===null ? comp.clubes : comp.grupos[alvo];
    for(const id of lista) linhas[id] = linhaVazia(id);

    for(const r of comp.rodadas){
      if(pular && pular(r, comp)) continue;
      for(const j of r.jogos){
        if(j.gc===undefined || j.gc===null) continue;
        if(alvo!==null && j.g!==alvo) continue;
        const a = linhas[j.c], b = linhas[j.f];
        if(!a || !b) continue;
        a.j++; b.j++;
        a.gp+=j.gc; a.gc+=j.gf; b.gp+=j.gf; b.gc+=j.gc;
        if(j.gc>j.gf){ a.v++; b.d++; a.p+=PONTOS.v; }
        else if(j.gc<j.gf){ b.v++; a.d++; b.p+=PONTOS.v; }
        else { a.e++; b.e++; a.p+=PONTOS.e; b.p+=PONTOS.e; }
      }
    }
    const fora = Object.values(linhas);
    for(const l of fora) l.sg = l.gp - l.gc;
    const nome = id => (M().time(id)||{}).nome || id;
    fora.sort((a,b)=>{
      const d = (b.p-a.p) || (b.v-a.v) || (b.sg-a.sg) || (b.gp-a.gp);
      if(d) return d;
      return nome(a.id) < nome(b.id) ? -1 : 1;   /* último critério: ordem alfabética */
    });
    return fora;
  }

  /* =======================================================
     A SEMANA
     ======================================================= */
  /* O PLACAR É PURO (decisão do autor): só a força dos clubes entra na
     simulação. O Fator Torcida saiu do jogo junto com a satisfação —
     e VOLTOU por uma porta só (pedido do dono, 24/08/2026): o Treino
     de bateria do expediente. Com a bateria ensaiada na última semana,
     o clube DO JOGADOR manda em casa com +20% da régua de força (11
     dos 55 pontos do divisor). O resto do mundo segue sem bônus. */
  function bonusTorcida(E, casaId){
    if(!E || !E.torcida || !E.torcida.clubeId) return 0;
    if(casaId !== E.torcida.clubeId) return 0;
    if(E.bateriaAbs == null) return 0;
    const abs = (E.data && E.data.absoluto) || 0;
    return abs - E.bateriaAbs <= 7 ? 55 * 0.20 : 0;
  }

  /* =======================================================
     O ÁRBITRO DA AGENDA (régua do dono, 17/09/2026)

     O calendário nasce em três lugares que não se olham — o nacional
     aqui, a Conmebol em conmebol.js e as fases de copa que vão sendo
     sorteadas — e cada um marca o seu dia sem perguntar aos outros. O
     resultado era Libertadores e Brasileirão na MESMA quarta-feira, e
     domingo com jogo de novo na terça. A régua do dono: NO MÁXIMO DOIS
     JOGOS POR SEMANA, e SEMPRE TRÊS DIAS entre um e outro.

     Este árbitro só cuida do clube do jogador (é a agenda que ele vê e
     vive; pros outros 300 clubes o dia da semana não muda nada) e só
     dos jogos que ainda vão acontecer. Ele roda todo dia, é barato e
     dá sempre a mesma resposta pra mesma agenda:

     1. Semana com três ou mais: adia o de menor peso pra semana mais
        próxima que tenha vaga. Peso, do mais fixo pro mais móvel:
        Conmebol (a Conmebol inteira anda na quarta, e o dia dela é a
        âncora), copa nacional, liga, regional.
     2. Dias: passa semana a semana escolhendo o dia de cada jogo pra
        ficar a três ou mais do anterior e do seguinte — a Conmebol não
        sai da quarta; o resto prefere o fim de semana (sábado, domingo)
        e depois a quarta, quinta, sexta.

     A mudança fica no próprio jogo (`j.d` = dia, `j.s` = semana), que é
     o que toda leitura já respeita pro dia e passa a respeitar pra
     semana. Jogo já jogado, ou de hoje, não se mexe.
     ======================================================= */
  const MAX_POR_SEMANA = 2, FOLGA_MIN = 3;
  const semanaMarcada = (j, r) => j.s || r.semana;
  const diaMarcado = (j, r, comp) => j.d || r.dia || comp.dia || DIA_FDS;
  const absDe = (s, d) => (s - 1) * 7 + d;

  function pesoDeFixar(comp, r, mata){
    if(comp.deFora || comp.tipo === 'copa-de-fora') return 3;
    if(mata || comp.copa) return 2;
    if(comp.tipo === 'regional') return 0;
    return 1;
  }

  function arrumarAgenda(E){
    const S = E && E.temporada;
    const meu = E && E.torcida && M().time(E.torcida.clubeId);
    if(!S || !meu || !S.competicoes) return 0;
    const hoje = absDe(E.data.semana, E.data.dia);
    const ultimaSemana = 52;
    let mexidas = 0;

    /* a lista viva: cada jogo futuro do clube com o objeto de verdade */
    const lista = [];
    let ultimoJogado = -99;
    for(const comp of S.competicoes){
      const junta = (r, mata)=>{
        for(const j of r.jogos){
          if(!j.f || (j.c !== meu.id && j.f !== meu.id)) continue;
          const s = semanaMarcada(j, r), d = diaMarcado(j, r, comp), abs = absDe(s, d);
          if(temJogo(j) || abs <= hoje){ ultimoJogado = Math.max(ultimoJogado, abs); continue; }
          lista.push({j, r, comp, peso:pesoDeFixar(comp, r, mata), s, d,
                      fixo: pesoDeFixar(comp, r, mata) === 3});
        }
      };
      comp.rodadas.forEach(r=>junta(r, false));
      comp.mata.forEach(m=>junta(m, true));
    }
    if(!lista.length) return 0;

    const porSemana = ()=>{
      const m = new Map();
      for(const x of lista) (m.get(x.s) || m.set(x.s, []).get(x.s)).push(x);
      return m;
    };

    /* ---- 1. semana cheia: adia o mais leve ---- */
    let mapa = porSemana();
    const semanas = [...mapa.keys()].sort((a,b)=>a-b);
    for(const s of semanas){
      const l = mapa.get(s);
      while(l.length > MAX_POR_SEMANA){
        /* o mais leve sai; empate, sai o de dia mais tarde */
        l.sort((a,b)=>a.peso - b.peso || b.d - a.d);
        const sai = l[0];
        if(sai.fixo) break;                       // três da Conmebol: não há o que fazer
        let destino = null;
        for(let k = 1; k <= 6 && !destino; k++){
          for(const cand of [s + k, s - k]){
            if(cand < 1 || cand > ultimaSemana) continue;
            if(absDe(cand, 7) <= hoje) continue;   // já passou
            if((mapa.get(cand) || []).length < MAX_POR_SEMANA){ destino = cand; break; }
          }
        }
        if(!destino) break;
        l.shift();
        sai.s = destino; sai.j.s = destino; mexidas++;
        (mapa.get(destino) || mapa.set(destino, []).get(destino)).push(sai);
      }
    }

    /* ---- 2. os dias: três de folga com o anterior e o seguinte ---- */
    mapa = porSemana();
    const ordem = [...mapa.keys()].sort((a,b)=>a-b);
    let anterior = ultimoJogado;                  // abs do último jogo marcado
    const PREFERIDOS = [DIA_FDS, 7, DIA_MEIO, 4, 5, 2, 1];
    for(let i = 0; i < ordem.length; i++){
      const s = ordem[i], l = mapa.get(s);
      /* o fixo da semana seguinte limita até onde esta pode ir */
      const prox = mapa.get(ordem[i + 1]) || [];
      const tetoFixo = prox.filter(x=>x.fixo).map(x=>absDe(x.s, x.d));
      const limite = tetoFixo.length ? Math.min(...tetoFixo) - FOLGA_MIN : Infinity;
      /* fixos primeiro, depois os móveis do dia mais cedo pro mais tarde */
      l.sort((a,b)=>(b.fixo?1:0) - (a.fixo?1:0) || a.d - b.d);
      const tomados = [];
      for(const x of l){
        const cabe = d => {
          const abs = absDe(s, d);
          if(abs <= hoje) return false;
          if(abs - anterior < FOLGA_MIN) return false;
          if(abs > limite) return false;
          return tomados.every(t => Math.abs(t - abs) >= FOLGA_MIN);
        };
        let dia = x.d;
        if(x.fixo){
          /* a Conmebol não sai do dia dela; se o anterior ficou perto
             demais, é o anterior que já deveria ter cedido */
        } else if(!cabe(dia)){
          const alt = [x.d, ...PREFERIDOS].find(cabe);
          if(alt !== undefined) dia = alt;
        }
        if(dia !== x.d){ x.d = dia; x.j.d = dia; mexidas++; }
        tomados.push(absDe(s, dia));
      }
      if(tomados.length) anterior = Math.max(...tomados);
    }
    return mexidas;
  }

  function jogarSemana(E, semana){
    arrumarAgenda(E);
    const S = E.temporada;
    if(!S) return [];
    const feitos = [];
    for(const comp of S.competicoes){
      for(const r of comp.rodadas){
        for(const j of r.jogos){
          if((j.s || r.semana) !== semana) continue;
          if(j.gc !== undefined && j.gc !== null) continue;
          const [a,b] = simular(j.c, j.f, bonusTorcida(E, j.c, j.f));
          j.gc = a; j.gf = b;
          feitos.push({comp:comp.id, ...j});
        }
      }
      for(const m of comp.mata){
        for(const j of m.jogos){
          if(!j.f) continue;                       // passou sem jogar
          if((j.s || m.semana) !== semana) continue;
          if(j.gc !== undefined && j.gc !== null) continue;
          const [a,b] = simular(j.c, j.f, bonusTorcida(E, j.c, j.f));
          j.gc = a; j.gf = b;
          /* em ida e volta quem decide é o agregado, não a partida */
          if(decideNaPartida(m)){
            j.venceu = a>b ? j.c : b>a ? j.f
                     : penaltisNoJogo(E, j, j.c, j.f,
                                      {comp:comp.nome, fase:m.fase});
          }
          feitos.push({comp:comp.id, compNome:comp.nome, fase:m.fase, ...j});
        }
      }
      if(comp.copa) avancarCopa(E, comp, semana);
      else avancarFase(E, comp, semana);
    }
    return costurarDecisao(E, feitos);
  }

  /* =======================================================
     A DECISÃO CHEGA DEPOIS DO PLACAR (correção do dono, 22/08/2026)

     `feitos` guarda uma CÓPIA de cada jogo, e em ida e volta a disputa
     de pênaltis só é resolvida no `avancarFase`, que roda depois do
     push: a cópia saía sem `pen` e sem `venceu`. A notícia então falava
     do empate e não da vaga — não porque faltasse texto, mas porque o
     dado não tinha chegado. Isto costura os dois de volta, no fim.
     ======================================================= */
  function costurarDecisao(E, feitos){
    const S = E.temporada;
    if(!S) return feitos;
    for(const f of feitos){
      if(f.pen || !f.fase) continue;
      const comp = S.competicoes.find(c=>c.id === f.comp);
      if(!comp) continue;
      for(const m of (comp.mata||[]))
        for(const j of m.jogos)
          if(j.c === f.c && j.f === f.f && j.gc === f.gc && j.gf === f.gf){
            if(j.pen) f.pen = j.pen;
            if(j.venceu) f.venceu = j.venceu;
            if(j.agregado) f.agregado = j.agregado;
          }
    }
    return feitos;
  }

  /* O DIA, NÃO A SEMANA: o feed conta o placar na noite do próprio
     jogo, então os jogos daquele dia são simulados na hora. O avanço
     de fase continua sendo trabalho do fechamento (`jogarSemana`), que
     também recolhe qualquer jogo que tenha ficado pra trás. */
  function jogarDia(E, semana, dia){
    const S = E.temporada;
    if(!S) return [];
    arrumarAgenda(E);
    const feitos = [];
    for(const comp of S.competicoes){
      for(const r of comp.rodadas){
        for(const j of r.jogos){
          if((j.s || r.semana) !== semana) continue;
          if((j.d || r.dia || comp.dia || DIA_FDS) !== dia) continue;
          if(j.gc !== undefined && j.gc !== null) continue;
          const [a,b] = simular(j.c, j.f, bonusTorcida(E, j.c));
          j.gc = a; j.gf = b;
          /* o número da rodada viaja com o jogo: a mensagem da nossa
             partida fala "pela 3ª rodada" (pedido do dono, 18/08/2026) */
          feitos.push({comp:comp.id, compNome:comp.nome,
                       rodada: comp.rodadas.indexOf(r)+1, ...j});
        }
      }
      for(const m of comp.mata){
        for(const j of m.jogos){
          if(!j.f) continue;
          if((j.s || m.semana) !== semana) continue;
          if((j.d || m.dia || DIA_FDS) !== dia) continue;
          if(j.gc !== undefined && j.gc !== null) continue;
          const [a,b] = simular(j.c, j.f, bonusTorcida(E, j.c));
          j.gc = a; j.gf = b;
          if(decideNaPartida(m)){
            j.venceu = a>b ? j.c : b>a ? j.f
                     : penaltisNoJogo(E, j, j.c, j.f,
                                      {comp:comp.nome, fase:m.fase});
          }
          feitos.push({comp:comp.id, compNome:comp.nome, fase:m.fase, ...j});
        }
        /* A VAGA SAI NO DIA DA VOLTA, e não no fechamento da semana: é
           hoje que a notícia conta quem passou. O `avancarFase` volta a
           passar por aqui no fim da semana e não muda nada, porque
           `decidirAgregado` só decide o que ainda não foi decidido. */
        if(m.perna === 'volta' && m.jogos.every(j=>!j.f || j.gc != null))
          decidirAgregado(E, comp, m);
      }
    }
    return costurarDecisao(E, feitos);
  }

  /* fecha grupos e gera a chave; depois vai encurtando até a final */
  function avancarFase(E, comp, semana){
    if(comp.campeao) return;

    const gruposAcabaram = comp.rodadas.every(r=>
      r.jogos.every(j=>j.gc!==undefined && j.gc!==null));
    if(!gruposAcabaram) return;

    if(comp.pontosCorridos){
      /* pontos corridos não tem final: o líder é o campeão */
      const t = tabela(comp, 0);
      comp.campeao = t[0] && t[0].id;
      comp.vice    = t[1] && t[1].id;
      return;
    }

    /* alguma chave ainda rodando? */
    const ultima = comp.mata[comp.mata.length-1];
    if(ultima && ultima.jogos.some(j=>j.gc===undefined || j.gc===null)) return;

    /* IDA JOGADA, FALTA A VOLTA (pedido do dono, 21/08/2026): a chave
       não anda até os dois jogos saírem. A volta inverte o mando, que
       é o que `decidirAgregado` espera pra somar certo. */
    if(ultima && ultima.perna === 'ida'){
      const grade = comp.grade || gradeDe(comp.nome, comp.tipo);
      const volta = ultima.jogos.map(j=>({c:j.f, f:j.c, par:j.par}));
      volta.forEach((j,k)=>{ const g = grade[k % grade.length]; j.d = g.d; j.h = g.h; });
      comp.mata.push({fase: ultima.fase, semana: ultima.semana + 1,
                      dia: grade[0].d, indice: ultima.indice,
                      perna:'volta', jogos: volta});
      return;
    }

    let vivos;
    const jogos = [];
    const par = (a,b)=>jogos.push({c:a, f:b});
    if(!ultima){
      /* CHAVEAMENTO OLÍMPICO (decisão do dono, 17/08/2026).
         Saindo dos grupos, o cruzamento é fixo pela classificação:
         · dois grupos (Copa do Nordeste, e a Série D par a par):
           jogo 1: 1ºA×4ºB · jogo 2: 2ºB×3ºA · jogo 3: 1ºB×4ºA ·
           jogo 4: 2ºA×3ºB — o mando é do mais bem classificado;
         · grupo único: 1º×4º e 2º×3º;
         · e dali em diante a chave anda sozinha: vencedor do jogo 1
           pega o do jogo 2, o do 3 pega o do 4, sem re-sorteio. */
      const porGrupo = comp.grupos.map((g, ig)=>
        tabela(comp, ig).slice(0, comp.passam).map(l=>l.id));
      vivos = porGrupo.flat();
      const G = porGrupo.length, P = comp.passam;
      if(G === 1 && P === 4){
        const [p1,p2,p3,p4] = porGrupo[0];
        par(p1,p4); par(p2,p3);
      } else if(G === 1 && P === 2){
        par(porGrupo[0][0], porGrupo[0][1]);
      } else if(G % 2 === 0 && P === 4){
        for(let k=0;k<G;k+=2){
          const A = porGrupo[k], B = porGrupo[k+1];
          par(A[0],B[3]); par(B[1],A[2]); par(B[0],A[3]); par(A[1],B[2]);
        }
      } else if(G % 2 === 0 && P === 2){
        for(let k=0;k<G;k+=2){
          const A = porGrupo[k], B = porGrupo[k+1];
          par(A[0],B[1]); par(B[0],A[1]);
        }
      } else {
        /* formato fora do catálogo: melhor contra pior, como era */
        const ordem = [...vivos].sort((a,b)=>forca(b)-forca(a));
        for(let i=0;i<ordem.length/2;i++)
          par(ordem[i], ordem[ordem.length-1-i]);
      }
    }else{
      vivos = ultima.perna === 'volta'
        ? decidirAgregado(E, comp, ultima)
        : ultima.jogos.map(j=>j.venceu);
      if(vivos.length === 1){
        comp.campeao = vivos[0];
        const f = ultima.jogos[0];
        comp.vice = f.venceu===f.c ? f.f : f.c;
        return;
      }
      if(vivos.length >= 2){
        /* a chave olímpica anda na ordem dos jogos: V1×V2, V3×V4…
           O mando fica com o clube mais forte, a régua de sempre. */
        for(let i=0;i+1<vivos.length;i+=2){
          const a = vivos[i], b = vivos[i+1];
          if(forca(a) >= forca(b)) par(a,b); else par(b,a);
        }
      }
    }
    if(vivos.length < 2) { comp.campeao = vivos[0] || null; return; }

    const NOMES = {2:'Final', 4:'Semifinal', 8:'Quartas', 16:'Oitavas', 32:'Primeira fase'};

    /* Com data de final marcada, a chave é contada de trás pra frente:
       a final na semana combinada, a semifinal na anterior e por aí.
       Sem data marcada (o playoff da Série D), emenda na semana seguinte. */
    const faltam = Math.ceil(Math.log2(vivos.length));   // rodadas até a final
    const quando = comp.finalEm
      ? Math.max(semana+1, comp.finalEm - (faltam-1))
      : semana+1;
    const grade = comp.grade || gradeDe(comp.nome, comp.tipo);
    jogos.forEach((j,k)=>{ const s = grade[k % grade.length]; j.d = s.d; j.h = s.h; });
    const indice = comp.mata.length;
    if(comp.idaEVolta) jogos.forEach((j,k)=>{ j.par = `${indice}-${k}`; });
    comp.mata.push(Object.assign(
      {fase: NOMES[vivos.length] || `${vivos.length} clubes`,
       semana: quando, dia: grade[0].d, jogos},
      comp.idaEVolta ? {perna:'ida', indice} : {}));
  }

  /* =======================================================
     CONSULTA
     ======================================================= */
  const temJogo = j => j && j.gc!==undefined && j.gc!==null;

  /* todos os compromissos de um clube no ano, em ordem de semana */
  function agendaDoClube(E, clubeId){
    const S = E.temporada;
    if(!S) return [];
    const fora = [];
    for(const comp of S.competicoes){
      const junta = (r, fase, mata)=>{
        for(const j of r.jogos){
          if(j.c!==clubeId && j.f!==clubeId) continue;
          if(!j.f) continue;                     /* passou sem adversário */
          const casa = j.c===clubeId;
          fora.push({semana:j.s || r.semana, dia:j.d || r.dia || comp.dia || DIA_FDS,
                     hora:j.h || '16:00',
                     comp:comp.nome, compId:comp.id,
                     tipo:comp.tipo, fase, mata:!!mata,
                     casa: j.neutro ? false : casa, neutro: j.neutro||null,
                     adversario: casa ? j.f : j.c,
                     gp: temJogo(j) ? (casa?j.gc:j.gf) : null,
                     gc: temJogo(j) ? (casa?j.gf:j.gc) : null,
                     jogado: temJogo(j), penaltis: !!j.penaltis,
                     /* o placar dos pênaltis anda junto com o do jogo:
                        toda tela que mostra um mostra o outro */
                     pen: j.pen ? (casa ? {c:j.pen.c, f:j.pen.f}
                                        : {c:j.pen.f, f:j.pen.c}) : null,
                     agregado: j.agregado || null, venceu: j.venceu});
        }
      };
      comp.rodadas.forEach((r, i)=> junta(r,
        comp.grupos.length > 1 ? `Grupos · ${i+1}ª rodada` : `${i+1}ª rodada`, false));
      for(const m of comp.mata) junta(m, m.fase, true);
    }
    return fora.sort((a,b)=>a.semana-b.semana || a.dia-b.dia);
  }

  const jogosDaSemana = (E, clubeId, semana) =>
    agendaDoClube(E, clubeId).filter(j=>j.semana===semana);

  /* a posição de um clube na tabela da competição — no grupo dele,
     quando a competição tem mais de um.

     `antesDe` = {semana, dia}: a rodada jogada nesse dia NÃO conta.
     É o que a mensagem da nossa partida precisa (correção do dono,
     22/08/2026): ela é escrita ANTES da bola rolar mas depois de o dia
     ter sido simulado, então "o Fortaleza está em 15º" já vinha com o
     resultado de hoje dentro — quem decorava a tabela sabia o placar
     antes do apito. */
  function posicaoNaTabela(E, compId, clubeId, antesDe){
    const comp = ((E.temporada && E.temporada.competicoes) || [])
      .find(c=>c.id === compId);
    if(!comp || comp.copa) return 0;
    const pular = antesDe ? (r, c)=>
      r.semana === antesDe.semana &&
      (r.dia || c.dia || DIA_FDS) === antesDe.dia : null;
    let t;
    if(comp.grupos.length > 1){
      const gi = comp.grupos.findIndex(g=>g.includes(clubeId));
      if(gi < 0) return 0;
      t = tabela(comp, gi, pular);
    } else {
      t = tabela(comp, undefined, pular);
    }
    const i = t.findIndex(l=>l.id === clubeId);
    return i < 0 ? 0 : i+1;
  }

  /* O jogo da semana pra torcida. Numa semana com rodada de pontos
     corridos e jogo de copa, o que vale é o mata-mata: é dele que o
     bairro fala a semana inteira. */
  function jogoDaSemana(E, clubeId, semana){
    const lista = jogosDaSemana(E, clubeId, semana);
    if(!lista.length) return null;
    const peso = j => (j.mata ? 2 : 0) + (j.dia===DIA_FDS ? 1 : 0);
    return lista.slice().sort((a,b)=>peso(b)-peso(a))[0];
  }

  /* competições rolando nesta semana, pra tela de calendário */
  function faseDaSemana(semana){
    return semana < INICIO_NACIONAL ? 'Regionais e estaduais' : 'Brasileirão';
  }

  /* =======================================================
     SOBE E DESCE (GDD §18.2 e as regras dos estaduais)
     Roda na virada do ano, antes de montar a temporada nova.
     ======================================================= */

  /* os melhores: em pontos corridos, o topo da tabela; em copa, quem
     chegou mais longe — campeão, vice e depois os semifinalistas */
  function melhores(comp, n){
    if(comp.pontosCorridos) return tabela(comp, 0).slice(0, n).map(l=>l.id);
    const fora = [];
    if(comp.campeao) fora.push(comp.campeao);
    if(comp.vice)    fora.push(comp.vice);
    for(let i=comp.mata.length-2; i>=0 && fora.length<n; i--){
      for(const j of comp.mata[i].jogos){
        const perdeu = j.venceu===j.c ? j.f : j.c;
        if(perdeu && !fora.includes(perdeu)) fora.push(perdeu);
      }
    }
    return fora.slice(0, n);
  }

  /* os piores: em grupo único, a lanterna; com grupos, o último de cada */
  function piores(comp, n){
    if(comp.grupos.length <= 1) return tabela(comp, 0).slice(-n).map(l=>l.id);
    const porGrupo = Math.max(1, Math.round(n/comp.grupos.length));
    const fora = [];
    comp.grupos.forEach((g, ig)=>
      fora.push(...tabela(comp, ig).slice(-porGrupo).map(l=>l.id)));
    return fora;
  }

  /* estaduais com acesso entre si */
  const ESCADA_REGIONAL = [
    {cima:'Paulistão',        baixo:'Paulistão A2',      troca:1},
    {cima:'Copa do Nordeste', baixo:'Nordestão Série B', troca:2}
  ];

  function aplicarSobeDesce(E){
    const S = E.temporada;
    if(!S) return [];
    const por = {};
    for(const c of S.competicoes) por[c.nome] = c;
    E.divisoes  = E.divisoes  || {};
    E.regionais = E.regionais || {};
    const mov = [];

    const mover = (mapa, ids, de, para)=>{
      for(const id of ids){
        if(!id) continue;
        mapa[id] = para;
        mov.push({ano:S.ano, id, de, para});
      }
    };

    /* Brasileirão: quatro sobem e quatro caem entre séries vizinhas.
       Da D ninguém cai — a Série E do GDD §18.2 não existe nos dados. */
    for(let i=0;i<ESCADA.length-1;i++){
      const cima = por[ESCADA[i]], baixo = por[ESCADA[i+1]];
      if(!cima || !baixo) continue;
      mover(E.divisoes, piores(cima, TROCA),   ESCADA[i],   ESCADA[i+1]);
      mover(E.divisoes, melhores(baixo, TROCA), ESCADA[i+1], ESCADA[i]);
    }

    for(const {cima, baixo, troca} of ESCADA_REGIONAL){
      const a = por[cima], b = por[baixo];
      if(!a || !b) continue;
      mover(E.regionais, piores(a, troca),   cima,  baixo);
      mover(E.regionais, melhores(b, troca), baixo, cima);
    }

    E.sobeDesce = (mov.concat(E.sobeDesce || [])).slice(0, 400);
    return mov;
  }

  /* =======================================================
     O QUE ESTÁ EM JOGO NUMA COMPETIÇÃO (pedido do dono,
     21/08/2026): quantos sobem e quantos caem. É o que o
     aviso de abertura precisa saber pra dizer quem são os
     favoritos ao acesso e quem briga contra a queda.
     ======================================================= */
  function emJogo(comp){
    const nome = (comp && comp.nome) || comp;
    let sobem = 0, caem = 0;
    const i = ESCADA.indexOf(nome);
    if(i >= 0){
      if(i > 0) sobem = TROCA;                    // a Série A não tem acesso
      if(i < ESCADA.length - 1) caem = TROCA;     // da D ninguém cai
    }
    for(const {cima, baixo, troca} of ESCADA_REGIONAL){
      if(nome === baixo) sobem = Math.max(sobem, troca);
      if(nome === cima)  caem  = Math.max(caem, troca);
    }
    const cfg = FORMATO[nome];
    if(cfg){
      if(cfg.rebaixaPorGrupo) caem = Math.max(caem, cfg.rebaixaPorGrupo * (cfg.grupos||1));
      if(cfg.sobemFinalistas) sobem = Math.max(sobem, 2);
    }
    return {sobem, caem};
  }

  /* os clubes de uma competição, do mais forte pro mais fraco.
     A COPA NÃO TEM RODADA: ela nasce só com o mata-mata e a lista de
     inscritos, então a lista é a fonte quando não há tabela. */
  function porForca(E, comp){
    const ids = new Set();
    for(const r of (comp.rodadas||[])) for(const j of r.jogos){ ids.add(j.c); ids.add(j.f); }
    if(!ids.size){
      for(const id of (comp.clubes||[])) if(id) ids.add(id);
      for(const m of (comp.mata||[])) for(const j of m.jogos){
        if(j.c) ids.add(j.c); if(j.f) ids.add(j.f);
      }
    }
    return [...ids].map(id=>({id, forca:forcaDe(E, id)}))
                   .sort((a,b)=> b.forca - a.forca);
  }

  /* quando a bola rola pela primeira vez: a rodada 1, ou a primeira
     fase do mata-mata pra quem não tem pontos corridos */
  function estreiaDe(comp){
    const r0 = (comp.rodadas||[])[0];
    if(r0) return {semana:r0.semana, dia:r0.dia || DIA_FDS};
    const m0 = (comp.mata||[])[0];
    return m0 ? {semana:m0.semana, dia:m0.dia || comp.dia || DIA_FDS} : null;
  }

  /* a competição `para` está acima de `de`? serve pro texto do aviso */
  function subiu(de, para){
    const ordem = ESCADA.concat(ESCADA_REGIONAL.flatMap(x=>[x.cima, x.baixo]));
    const a = ordem.indexOf(de), b = ordem.indexOf(para);
    return a >= 0 && b >= 0 && b < a;
  }

  /* =======================================================
     RODADAS PRA TELA
     A rodada e o mata-mata viram uma lista só, na ordem em
     que acontecem, que é como o jogador pensa: "rodada 4 de
     38", não "grupos" e "chave" em lugares diferentes.
     ======================================================= */
  function etapas(comp){
    const dia = comp.dia || DIA_FDS;
    /* a rodada pode trazer o próprio rótulo: a liga de fora chama a
       fecha de mata-mata de "Semifinal", não de "Rodada 18" */
    let n = 0;
    const fora = comp.rodadas.map(r=>({
      rot: r.rot || `Rodada ${++n}`, semana:r.semana, dia,
      jogos:r.jogos, mata:!!r.rot}));
    for(const m of comp.mata)
      fora.push({rot:m.fase, semana:m.semana, dia:m.dia||dia,
                 jogos:m.jogos, mata:true});
    return fora;
  }

  /* o dia de cada partida vive na própria partida (a rodada se espalha
     entre sábado e domingo), com a rodada como reserva */
  const diaDoJogo = (j, etapa) => (j && j.d) || (etapa && etapa.dia) || DIA_FDS;

  /* a primeira etapa que ainda não terminou; se acabou tudo, a última */
  function etapaAtual(comp){
    const es = etapas(comp);
    const i = es.findIndex(e=>e.jogos.some(j=>!temJogo(j)));
    return i < 0 ? es.length-1 : i;
  }

  /* O clube joga no dia 6 da semana — sábado no calendário do jogo, que
     é o dia que o GDD §3.1 reserva pro jogo. A hora varia por confronto
     só pra tabela não ficar com 38 linhas iguais. */
  const horaDoJogo = j => (j && j.h) || '16:00';

  return {montarTemporada, jogarSemana, jogarDia, tabela, agendaDoClube, jogoDaSemana, arrumarAgenda,
          bonusTorcida,
          forcaDe, forcaBase, evoluirForca, usarSave, forcaDivisao, ESCADA,
          paisDe, paisDoJogador, simular, forca,
          emJogo, porForca, estreiaDe, disputaDePenaltis,
          custoDoPonto, investir, invDe, TABELA_INVESTIMENTO,
          FORCA_MIN, FORCA_MAX,
          faseDaSemana, roundRobin, simular, etapas, etapaAtual, horaDoJogo,
          jogosDaSemana, posicaoNaTabela, COPA_FASES, COPA_NOME, DIA_FDS, DIA_MEIO,
          aplicarSobeDesce, subiu, divisaoDe, regionalDe, melhores, piores,
          rivaisDiretos, ajustarMandos, piorSequencia, piorSequenciaEmCasa, diaDoJogo,
          SEMANAS_ANO, INICIO_REGIONAL, INICIO_NACIONAL};
})();
