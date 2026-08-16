/* =========================================================
   PRAÇA — a cidade como modelo, não como desenho (GDD §10 e §13)
   ---------------------------------------------------------
   Este arquivo é o que sobrou de `ruas.js` depois que o mapa
   da cidade foi descontinuado. O que morreu foi a SIMULAÇÃO:
   a malha de nós, as rotas, os bondes andando minuto a minuto,
   os andarilhos, a viatura correndo pro assalto. O que ficou
   foi o MODELO: os dados da praça continuam respondendo às
   três perguntas que o jogo faz e nunca deixou de fazer —

   · em que BAIRRO uma briga cai, e portanto qual cena de rua
     abre (Favela e Classe Baixa abrem a rua de periferia,
     Classe Média a dela, Nobre a dela);
   · onde ficam SEDE, SUBSEDE, BAR e ESTÁDIO de cada torcida;
   · que ESTÁDIO recebe cada jogo da semana.

   E no lugar da simulação entrou a RESOLUÇÃO: `resolverIda`
   calcula, de uma vez, o que aconteceu no caminho do estádio
   e devolve um dos três desfechos — a briga que a gente
   planejou, a chegada em paz, ou a surpresa.
   ========================================================= */
window.TO = window.TO || {};

TO.praca = (function(){
  const U = TO.util;
  const MP = () => TO.mapa;
  const M  = () => TO.mundo;
  const PL = () => TO.planejamento;

  /* =======================================================
     A. O CALENDÁRIO DA PRAÇA
     ======================================================= */
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
     B. AS CONSULTAS AO MODELO

     São as mesmas de `ruas.js`, palavra por palavra: quem lê o
     modelo não sabia que existia um canvas do outro lado, e é
     por isso que elas atravessaram o corte inteiras.
     ======================================================= */
  function pontoDe(mo, filtro){
    if(!mo) return null;
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

  /* O ESTÁDIO DO MANDANTE, não o primeiro da lista. Casa pelo clube:
     primeiro por `mandantes`, que é o que a tabela de estádios diz; se
     não achar, pelo nome que o próprio clube declara; e só então cai em
     qualquer campo. */
  function pontoDoEstadioDoClube(mo, clube){
    if(!clube) return pontoDoEstadio(mo, null);
    return pontoDe(mo, it => it.tipo === 'estadio'
                          && (it.mandantes||[]).includes(clube.id))
        || (clube.estadio && pontoDe(mo, it => it.tipo === 'estadio'
                          && (it.nomeEstadio||'') === clube.estadio))
        || pontoDoEstadio(mo, null);
  }

  /* todos os campos da praça, pra saber se uma briga caiu em algum deles */
  function camposDaPraca(mo){
    if(!mo || !mo.arte) return [];
    return (mo.pinos||[]).filter(p=>p.tipo === 'estadio');
  }
  /* SEDE E BAR SE ACHAM PELO ID, não pelo nome: 21 dos 140 nomes são
     subcadeia de outro, e por nome a Camisa 12 saía da sede do Inter. */
  const pontoDaSede = (mo, torcida) => pontoDe(mo, it =>
    it.tipo === 'sede' && it.torcida === (torcida.id || torcida));
  const pontoDoBar = (mo, torcida) => pontoDe(mo, it =>
    (it.tipo === 'bar' || it.tipo === 'bar-nosso') &&
    it.torcida === (torcida.id || torcida));

  /* =======================================================
     ONDE A BRIGA CAI

     A cena da briga não é genérica: esbarrão no Pirambu não abre a
     mesma tela do esbarrão na Aldeota. É a máscara de ruas e a lista
     de bairros — os mesmos 35 KB que desenhavam a cidade — que
     decidem, e é por isso que eles não foram jogados fora com o
     canvas.
     ======================================================= */
  const RUA_DA_CLASSE = {
    'Favela':'rua', 'Classe Baixa':'rua',
    'Classe Média':'rua-media', 'Nobre':'rua-nobre', 'Classe Alta':'rua-nobre'
  };
  const ruaDaClasse = classe => RUA_DA_CLASSE[classe] || 'rua';

  /* QUÃO LARGO É O LUGAR. A conta é a de sempre: quantas células da
     máscara são andáveis numa janela de 5×5 em volta do ponto. Vinte e
     três de vinte e cinco é largo demais pra ser rua — é praça. O
     número atravessou o corte porque a máscara atravessou: o que sumiu
     foi o grafo de nós que se costurava por cima dela. */
  const LARGO = 23;
  function larguraEm(mo, x, y){
    const m = mo && mo.malha;
    if(!m || !m.andavel) return 0;
    const c0 = Math.floor(x/m.passo), r0 = Math.floor(y/m.passo);
    let n = 0;
    for(let r=r0-2; r<=r0+2; r++)
      for(let c=c0-2; c<=c0+2; c++){
        if(c<0 || r<0 || c>=m.n || r>=m.n) continue;
        if(m.andavel[r*m.n+c]) n++;
      }
    return n;
  }

  /* Onde a briga cai muda a cena: colado no estádio são os arredores,
     num largo de verdade é praça, no resto é a rua do bairro. */
  function localDe(mo, x, y){
    if(!mo) return 'rua';
    /* arredores é a beira de QUALQUER campo da praça, não a do primeiro */
    if(camposDaPraca(mo).some(c=>Math.hypot(c.x-x, c.y-y) < 70)) return 'arredores';
    const b = MP().bairroEm ? MP().bairroEm(mo, x, y) : null;
    if(larguraEm(mo, x, y) >= LARGO) return 'praca';
    return ruaDaClasse(b && b.classe);
  }

  /* O BAIRRO EM PÉ, não o ponto. Quando o encontro é sorteado entre
     bairros — e não posto num pixel —, o que se tem é a região; o ponto
     de dentro dela é achado aqui, na máscara, pra a pergunta "isto é
     praça ou é rua?" continuar sendo respondida do mesmo jeito. */
  function pontoNoBairro(mo, bairro, chave){
    if(!mo || !bairro) return null;
    const H = MP().hash;
    const passo = (mo.malha && mo.malha.passo) || 10;
    /* espiral curta em volta do centro do bairro: o primeiro lugar
       andável serve, e o hash faz a mesma briga cair sempre no mesmo
       canto do mesmo bairro */
    for(let k=0; k<24; k++){
      const ang = ((H(`${chave}|a${k}`) % 3600)/3600) * Math.PI * 2;
      const rai = (k/24) * passo * 14;
      const x = bairro.x + Math.cos(ang)*rai, y = bairro.y + Math.sin(ang)*rai;
      if(!MP().bairroEm || (MP().bairroEm(mo, x, y)||{}).nome !== bairro.nome) continue;
      if(MP().andavelEm && !MP().andavelEm(mo, x, y)) continue;
      return {x, y};
    }
    return {x:bairro.x, y:bairro.y};
  }

  /* =======================================================
     C. UMA COR POR TORCIDA NA NOITE

     A cor do disco era sempre `cores[0]`, e como a paleta é a do CLUBE,
     as organizadas do mesmo time saíam iguais: num Corinthians em casa,
     Gaviões e Pavilhão 9 pretos e Camisa 12 branca. O miolo separa
     antes: das 140 torcidas saem só 11 primárias distintas, mas a
     secundária desempata 1.448 dos 2.052 pares que dividem a primária.
     Sobram 604 em que as DUAS batem, e só esses recebem um passo de tom.

     Sem mapa isso continua valendo: quem lê estas cores agora é a CENA
     DE BRIGA, e lá o problema é o mesmo — dois bondes da mesma cor são
     um bonde só na tela.
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
     mapa: Esquadrão Atleticano e Esquadrão Alvinegro são as duas "EA". A
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
       fixa, então a mesma noite pinta igual toda vez. */
    const posto = o => o.id === E.torcida.id ? 0 : visitante.has(o.id) ? 1 : 2;
    cast.sort((a,b)=> posto(a) - posto(b)
                   || (b.membros||0) - (a.membros||0)
                   || (a.id < b.id ? -1 : 1));

    const siglado = new Set(), cor = {}, cor2 = {}, sigla = {};
    for(const o of cast){
      const s = siglaUnica(o, siglado);
      siglado.add(s); sigla[o.id] = s;
      const c = M().coresDaTorcida(o);
      cor[o.id]  = c.cor || '#999999';
      cor2[o.id] = c.cor2;
    }

    /* NINGUÉM TROCA DE COR. Cada uma usa a própria primária, sempre; só
       quando as duas cores batem é que o mandante fica com a cor cheia e
       cada seguinte recebe um passo de tom. */
    const chave = o => `${cor[o.id]}|${cor2[o.id] || '-'}`;
    const grupos = {};
    for(const o of cast) (grupos[chave(o)] = grupos[chave(o)] || []).push(o);
    for(const iguais of Object.values(grupos)){
      if(iguais.length < 2) continue;
      const ordem = iguais.slice().sort((a,b)=>
        (visitante.has(a.id)?1:0) - (visitante.has(b.id)?1:0) ||
        cast.indexOf(a) - cast.indexOf(b));
      ordem.forEach((o,i)=>{ if(i) cor[o.id] = tomVizinho(cor[o.id], i); });
    }
    return {cor, cor2, sigla};
  }

  /* Um tom que se distinga da base, na direção que dá contraste.
     O sinal não pode ser fixo: branco tem de escurecer, porque branco
     mais claro não existe, e vermelho tem de clarear. */
  function tomVizinho(hex, passo){
    const [r,g,b] = hexParaRgb(hex);
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    const sinal = lum > 0.6 ? -1 : 1;
    const f = sinal * Math.min(0.82, 0.26 + 0.20*(passo-1));
    return tonalizar(hex, f).toUpperCase();
  }

  /* =======================================================
     D. QUEM PISA NA RUA HOJE

     Antes isto era `montar`: bondes com origem, rota, hora de saída e
     posição. Sem deslocamento, sobra a única coisa que a resolução
     precisa saber — QUAL torcida está na rua e COM QUANTA GENTE.

     A conta do efetivo é a mesma de antes, inclusive a escolta: o que
     morreu foi a caminhada do visitante até a sede do aliado, não o
     efeito dela. Quem hospeda continua emprestando de 5 a 10% do
     próprio efetivo, e continua saindo com esse tanto a menos.
     ======================================================= */
  function anfitriaoDe(E, mo, visitante){
    mo = mo || MP().modelo(E);
    if(!mo) return null;
    const daqui = M().torcidasEm(E.torcida.mapa)
      .filter(t=>t.id !== visitante.id && pontoDaSede(mo, t));
    const grau = t=>{
      if(t.id === E.torcida.id){
        const v = (E.relacoes||{})[visitante.id];
        if(v === undefined || v < PL().RELACAO_ALIADO) return 0;
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
    return {torcida: bons[0], sede: pontoDaSede(mo, bons[0]),
            /* o objeto responde como torcida também: o olheiro no feed
               lê `anf.nome` e não tem por que saber do ponto */
            id: bons[0].id, nome: bons[0].nome};
  }

  /* Quanta gente o anfitrião manda junto. GDD §11.1: acolher bem sobe a
     relação, e escoltar é acolher com bonde. São 5 a 10% do efetivo de
     quem recebe — a TUF, com 150, empresta de 8 a 15. */
  function escoltaDe(E, anfitriao, visitante){
    if(anfitriao.id === E.torcida.id){
      const nivel = PL().nivelDe(E, visitante.id);
      if(nivel !== 'escolta' && nivel !== 'churrasco') return 0;
    }
    const pct = 5 + (MP().hash(`escolta|${anfitriao.id}|${visitante.id}`) % 6);
    return Math.max(1, Math.round((anfitriao.membros || 20) * pct / 100));
  }

  /* TORCIDA BANIDA NÃO PISA NA RUA. Polícia zerada tira a organizada de
     circulação por quatro semanas — a mesma punição que a gente sofre. */
  const podeSair = (E, o) =>
    !(TO.tensao && TO.tensao.banida && TO.tensao.banida(E, o.id));

  /* A RUA DE UM DIA QUALQUER, e não só a de hoje: o assistente de
     ataque pergunta na véspera quem vai estar na rua no dia do jogo, e
     a resposta tem de ser a mesma lista que a briga vai usar. */
  const naRuaHoje = E => naRuaEm(E, E.data.dia);

  function naRuaEm(E, dia){
    const mo = MP().modelo(E);
    const doDia = jogosDaPraca(E).filter(j=>j.dia === dia);
    if(!doDia.length) return [];
    const elenco = elencoDaNoite(E, doDia);

    /* AS ESCOLTAS SE RESOLVEM ANTES: os membros saem do efetivo do
       anfitrião e passam pro do aliado. Não é gente nova, o total da
       praça não muda — muda de quem é. */
    const escoltas = {}, devido = {};
    for(const jogo of doDia)
      for(const o of M().torcidasDe(jogo.vis.id)){
        if(pontoDaSede(mo, o)) continue;         // mora aqui, não é caravana
        if(PL().caravanaDe(o, (E.relacoes||{})[o.id]) < 5) continue;
        const casa = anfitriaoDe(E, mo, o);
        if(!casa) continue;
        const n = escoltaDe(E, casa.torcida, o);
        if(!n) continue;
        escoltas[o.id] = {casa, n};
        devido[casa.torcida.id] = (devido[casa.torcida.id] || 0) + n;
      }
    const menosAEscolta = (o, efetivo) =>
      Math.max(4, efetivo - (devido[o.id] || 0));

    const fora = [], vistos = {};
    const põe = (o, n, jogo, extra)=>{
      if(n <= 0) return;
      if(vistos[o.id]){ vistos[o.id].n += n; return; }
      const b = Object.assign({
        id:o.id, torcida:o, nome:o.nome, n,
        nossa: o.id === E.torcida.id,
        cor:  elenco.cor[o.id]  || (o.cores && o.cores[0]) || '#999',
        cor2: elenco.cor2[o.id] || M().coresDaTorcida(o).cor2,
        sigla: elenco.sigla[o.id] || M().siglaTorcida(o),
        jogo: jogo && jogo.casa.id, partida: jogo
      }, extra || {});
      vistos[o.id] = b; fora.push(b);
    };

    for(const jogo of doDia){
      for(const o of M().torcidasDe(jogo.casa.id)){
        if(!podeSair(E, o) || !pontoDaSede(mo, o)) continue;
        põe(o, o.id === E.torcida.id
               ? menosAEscolta(o, PL().efetivoDaSaida(E))
               : menosAEscolta(o, Math.round(TO.acoes.efetivoDe(E, o) * 0.6)),
            jogo, {deFora:false});
      }
      for(const o of M().torcidasDe(jogo.vis.id)){
        if(!podeSair(E, o)) continue;
        /* O VISITANTE PODE SER DAQUI: num Atlético × Cruzeiro a Máfia
           Azul é visitante no jogo e moradora da cidade. */
        if(pontoDaSede(mo, o)){
          põe(o, o.id === E.torcida.id
                 ? menosAEscolta(o, PL().efetivoDaSaida(E))
                 : menosAEscolta(o, Math.round(TO.acoes.efetivoDe(E, o) * 0.6)),
              jogo, {deFora:false});
          continue;
        }
        const vem = PL().caravanaDe(o, (E.relacoes||{})[o.id]);
        if(vem < 5) continue;
        const esc = escoltas[o.id];
        põe(o, vem + (esc ? esc.n : 0), jogo, {
          deFora:true,
          escolta: esc ? {de: esc.casa.torcida.id, nome: esc.casa.torcida.nome,
                          n: esc.n} : null,
          /* escoltado pela nossa torcida é bonde nosso na hora da briga */
          doJogador: !!(esc && esc.casa.torcida.id === E.torcida.id)
        });
      }
    }
    return fora;
  }

  /* =======================================================
     E. A RESOLUÇÃO DA IDA

     Sem posições no mapa, "encostou" perde o sentido. O encontro sai de
     três coisas que o jogo já tem, e nenhuma delas é espacial:

     · INTENÇÃO NOSSA — se planejamos atacar aquela torcida, o encontro
       é certo. A gente foi atrás; não há sorteio a fazer.
     · INTENÇÃO DELES — a IA decide pela mesma conta que já usava nos
       arredores, `3 + tensão × 0,85` por cento (combate.js:253), e quem
       decidiu procurar ENCONTRA. Sem malha não há mais como errar o
       alvo por dois quarteirões.
     · ACASO — dois hostis na rua no mesmo dia, nenhum dos dois
       procurando. Sobe com a tensão, mas devagar: é o que garante que
       o dia de jogo comum termine em paz.
     ======================================================= */
  /* hostil é rival de fato, ou tensão alta o bastante pra sair faísca */
  function hostis(E, ida, idb){
    const meu = E.torcida.id;
    if(ida === meu || idb === meu){
      const outro = ida === meu ? idb : ida;
      const rel = (E.relacoes||{})[outro];
      const ten = TO.tensao ? TO.tensao.nivel(E, outro) : 0;
      return (rel !== undefined && rel <= -15) || ten >= 45;
    }
    const t = M().relacaoBase(ida, idb);
    return t === 'Rival' || t === 'Maior Rival';
  }

  /* =======================================================
     A RIVALIDADE É O MOTIVO; A TENSÃO É O AGRAVANTE

     Isto era `3 + tensão × 0,85`, a mesma conta que `combate.js` usa
     pra decidir o humor de um bonde DENTRO da cena. E era errado aqui
     por um motivo que só a medição mostra: numa temporada inteira de
     jogador que vai em paz, a tensão fica em ZERO o tempo todo — ela
     sobe com investida, com ataque sofrido e com briga, e decai
     sozinha. Um laço fechado em zero: quem não ataca nunca é atacado,
     e a tensão nunca sobe porque nada acontece. O maior rival vinha à
     nossa cidade e tinha 3% de chance de nos procurar.

     Maior rival não precisa de motivo — a rivalidade É o motivo. Então
     a base vem da RELAÇÃO, e a tensão soma por cima.

     A PARIDADE É PORTÃO, NÃO DESCONTO, e por isso multiplica tudo em
     vez de somar à parte. Bonde deles muito menor que o nosso não
     procura briga: não é covardia programada, é o mesmo raciocínio da
     fuga por inferioridade que a cena já tem. Se a tensão entrasse
     fora do fator, trinta caras com ódio viriam pra cima de duzentos,
     que é exatamente o que não acontece na rua.
     ======================================================= */
  const BASE_PROCURA = {maior:88, rival:72, hostil:20};
  const K_TENSAO     = 0.5;      // agravante, não âncora

  /* A PARIDADE COMPARA TORCIDAS, NÃO BONDES, e o motivo é medido.

     Em jogo em casa a NOSSA torcida bota 149 dos 150 na rua —
     `efetivoDaSaida` é `aptosParaOEstadio`, quase o elenco inteiro —,
     enquanto toda torcida da IA bota 60% do efetivo dela, e a que vem
     de outra cidade bota uma caravana, que é menos ainda. Numa
     temporada, a razão MEDIANA entre o bonde hostil e o nosso foi de
     0,09, e o maior bonde rival que apareceu foi o dos Leões da TUF —
     torcida do MESMO tamanho da nossa — com 66 contra 149, razão 0,44.

     Comparar bonde com bonde, então, não compara coisas comparáveis: o
     nosso número é o elenco e o deles é uma fração dele. Com o piso em
     0,45 sobre os bondes, ninguém nunca vem — medido, 32 bondes hostis
     na rua e 1 veio. E "rival de tamanho equivalente", que é como a
     meta foi escrita, é uma frase sobre a TORCIDA, não sobre quantos
     ela conseguiu botar na rua naquele sábado.

     Então o portão é o efetivo das duas torcidas, que é simétrico. Uma
     rival do nosso tamanho vem pra cima mesmo com 66 contra 149: quem
     decide isso é o orgulho dela, não a aritmética do dia.

     Fica anotado que a assimetria do `efetivoDaSaida` existe e é do
     autor: ou o nosso passa a ser uma fração como o deles, ou fica como
     está. Não mexi nele por conta própria — não foi pedido. */
  const PISO_PARIDADE = 0.45;    // abaixo disto eles não vêm
  const PAR_PARIDADE  = 0.80;    // aqui a base vale inteira

  /* o grau vem da tabela do mundo primeiro, e do número da relação
     depois: torcida com quem nunca interagimos não tem `E.relacoes`, e
     é justamente o maior rival do primeiro ano */
  function grauDeRivalidade(E, outro){
    const t = M().relacaoBase(E.torcida.id, outro);
    if(t === 'Maior Rival') return 'maior';
    if(t === 'Rival')       return 'rival';
    const rel = (E.relacoes||{})[outro];
    if(rel !== undefined && rel <= -60) return 'maior';
    if(rel !== undefined && rel <= -30) return 'rival';
    return 'hostil';
  }

  /* 0 abaixo do piso, sobe linear até a paridade da rua, e passa de 1
     quando eles são mais que a gente — com teto, porque bonde maior vem
     com mais vontade, não com certeza */
  const efetivoDe = (E, id) => id === E.torcida.id ? E.membros.length
    : (((TO.tensao && TO.tensao.mundo(E)[id]) || M().torcida(id) || {}).membros || 20);

  function fatorParidade(nossos, deles){
    const r = deles / Math.max(1, nossos);
    if(r < PISO_PARIDADE) return 0;
    if(r >= PAR_PARIDADE)
      return Math.min(1.3, 1 + (r - PAR_PARIDADE)*0.4/PAR_PARIDADE);
    return (r - PISO_PARIDADE) / (PAR_PARIDADE - PISO_PARIDADE);
  }

  const chanceDeProcurar = (E, outro, tensao) =>
    U.limitar((BASE_PROCURA[grauDeRivalidade(E, outro)] + tensao*K_TENSAO)
              * fatorParidade(efetivoDe(E, E.torcida.id), efetivoDe(E, outro)),
              0, 95);

  /* O ACASO É MUITO MENOR QUE A INTENÇÃO, e tem de ser: dois bondes que
     não estão se procurando só se pegam se derem de cara um com o
     outro, e a cidade é grande.

     SÓ A TENSÃO NÃO BASTA, e isso é medido. Numa temporada inteira de
     jogador que não briga, a tensão fica em ZERO o tempo todo — ela
     sobe com investida, com ataque sofrido e com briga, e decai
     sozinha. Com o acaso preso só nela, o desfecho (c) não acontecia
     nunca: 31 pares hostis na rua na temporada, nenhuma surpresa.

     Então o acaso tem duas parcelas, e a segunda é o ÓDIO. Não é o
     mesmo acaso: dois que estão em −85 passam o ano se procurando de
     olho, e o "sem querer" entre eles é outra coisa que o de dois que
     só não se gostam. A −85 dá 7,1%, a −20 dá 1,7%, e no piso da
     hostilidade (−15) dá 1,25%. Somado à intenção, é uma surpresa a
     cada dez pares hostis — três ou quatro na temporada, e a esmagadora
     maioria dos dias sem plano em paz, que é o que o prompt pede. */
  const chanceDeAcaso = (tensao, relacao) => Math.min(12,
    tensao * 0.10 + Math.max(0, -(relacao || 0)) / 12);

  /* OS BAIRROS QUE LIGAM DUAS PONTAS. Não há rota pra percorrer, mas há
     geometria: o bairro que fica ao longo da reta entre a sede e o
     estádio é o bairro por onde o bonde passaria. É o modelo do mapa
     respondendo à pergunta que a malha respondia. */
  const CORREDOR = 190;        // quanto um bairro pode estar fora da reta
  function distanciaAoSegmento(px, py, ax, ay, bx, by){
    const dx = bx-ax, dy = by-ay;
    const L = dx*dx + dy*dy;
    const t = L ? U.limitar(((px-ax)*dx + (py-ay)*dy) / L, 0, 1) : 0;
    return Math.hypot(px - (ax+dx*t), py - (ay+dy*t));
  }
  function corredor(mo, de, ate){
    if(!mo || !de || !ate) return [];
    return (mo.regioes || []).filter(b =>
      distanciaAoSegmento(b.x, b.y, de.x, de.y, ate.x, ate.y) < CORREDOR);
  }

  /* Onde a surpresa cai: um bairro sorteado entre os que ligam as duas
     sedes ao estádio. Cai no quarteirão do estádio, é arredores. */
  function lugarDoEncontro(E, mo, deles, chave){
    const H = MP().hash;
    const est = pontoDoEstadioDoClube(mo, (deles.partida||{}).casa);
    const nossa = pontoDaSede(mo, E.torcida);
    const sedeDeles = deles.deFora ? null : pontoDaSede(mo, deles.torcida);
    let bairros = corredor(mo, nossa, est);
    if(sedeDeles) bairros = bairros.concat(corredor(mo, sedeDeles, est));
    /* caravana de fora não tem sede aqui: o corredor dela é o nosso, que
       é o único trecho em que os dois podem estar na mesma rua */
    if(!bairros.length && est){
      const b = MP().bairroEm && MP().bairroEm(mo, est.x, est.y);
      if(b) bairros = [b];
    }
    if(!bairros.length) return {local:'rua', bairro:null};
    const b = bairros[H(chave+'|b') % bairros.length];
    const p = pontoNoBairro(mo, b, chave);
    return {local: p ? localDe(mo, p.x, p.y) : ruaDaClasse(b.classe),
            bairro: b.nome, classe: b.classe};
  }

  /* O lugar que o jogador escolheu na Gestão. `PONTOS` já carrega um
     bairro de verdade da praça desde `pontosDeAtaque`, e é dele que sai
     a cena — o ponto diz o tipo de lugar, o bairro diz a classe. */
  function lugarPlanejado(E, mo, p){
    const alvo = (PL().pontosDeAtaque(E) || [])
      .find(x => x.id === (p.alvo || 'arredores')) || {};
    if(alvo.id === 'arredores') return {local:'arredores', bairro:alvo.bairro,
                                        ponto:alvo};
    if(alvo.id === 'bar')       return {local:'bar', bairro:alvo.bairro,
                                        ponto:alvo};
    if(alvo.id === 'praca')     return {local:'praca', bairro:alvo.bairro,
                                        ponto:alvo};
    /* terminal, avenida e viaduto não têm cena própria: são rua, e a
       classe do bairro em que o ponto mora decide qual delas */
    const b = (mo && (mo.regioes||[]).find(x=>x.nome === alvo.bairro)) || null;
    return {local: ruaDaClasse(b && b.classe), bairro: alvo.bairro, ponto:alvo};
  }

  /* =======================================================
     RESOLVER A IDA

     Devolve sempre um objeto, nunca null quando há jogo:
       {desfecho:'paz'}                        — ninguém cruzou com ninguém
       {desfecho:'planejada'|'surpresa', enc}  — a cena abre
     `enc` tem a forma que `abrirConfronto` já espera: dois bondes com
     efetivo real e distinto, cor, sigla e nome, mais o local.
     ======================================================= */
  function resolverIda(E){
    const mo = MP().modelo(E);
    const rua = naRuaHoje(E);
    const nosso = rua.find(b => b.nossa) || rua.find(b => b.doJogador);
    if(!nosso) return {desfecho:'paz', semNos:true};
    const p = PL().plano(E);
    const outros = rua.filter(b => b !== nosso && b.id !== nosso.id);

    /* a) INTENÇÃO NOSSA: quem planejou atacar, encontra */
    if(p.intencao !== 'paz' && p.alvoTorcida){
      const alvo = outros.find(b => b.id === p.alvoTorcida);
      if(alvo){
        const onde = lugarPlanejado(E, mo, p);
        return {desfecho:'planejada', onde,
                enc: montarEncontro(nosso, alvo, onde)};
      }
    }

    /* b) INTENÇÃO DELES e c) ACASO, na ordem do efetivo: quem tem mais
       gente na rua é quem tem mais chance de estar no nosso caminho */
    const inimigos = outros
      .filter(b => hostis(E, nosso.id, b.id))
      .sort((a,b)=> b.n - a.n);
    for(const b of inimigos){
      const ten = TO.tensao ? TO.tensao.nivel(E, b.id) : 0;
      const rel = (E.relacoes||{})[b.id];
      const procurou = U.rng()*100 <
        chanceDeProcurar(E, b.id, ten);
      const esbarrou = !procurou && U.rng()*100 < chanceDeAcaso(ten, rel);
      if(!procurou && !esbarrou) continue;
      const onde = lugarDoEncontro(E, mo, b,
        `enc|${E.data.ano}|${E.data.semana}|${E.data.dia}|${b.id}`);
      return {desfecho:'surpresa', porQue: procurou ? 'procuraram' : 'acaso',
              onde, enc: montarEncontro(nosso, b, onde)};
    }
    return {desfecho:'paz', jogo: nosso.partida || null};
  }

  /* O EFETIVO É O REAL DOS DOIS LADOS, e eles são diferentes. Este é o
     mesmo cuidado da cena: nada é reequilibrado na abertura — se saímos
     com 80 e eles com 100, a cena é de 80 contra 100. */
  const montarEncontro = (nosso, deles, onde) => ({
    a: {torcida:nosso.id, nome:nosso.nome, sigla:nosso.sigla, n:nosso.n,
        cor:nosso.cor, cor2:nosso.cor2, nossa:true},
    b: {torcida:deles.id, nome:deles.nome, sigla:deles.sigla, n:deles.n,
        cor:deles.cor, cor2:deles.cor2, nossa:false},
    local: onde.local, bairro: onde.bairro, nossa:true
  });

  /* =======================================================
     F. OS ASSALTOS DO MÊS

     Dois ou três por mês na praça inteira. Agendados PELO CALENDÁRIO e
     não sorteados quando a tela abre: o mesmo dia reaberto mostra o
     mesmo assalto, e o mês fecha em dois ou três.

     O QUE MUDOU COM O MAPA: a viatura era uma CORRIDA — ela saía de um
     posto, andava pela rua e chegava (ou não) antes de o sujeito
     terminar o serviço. Sem rua não há corrida, e a pergunta espacial
     vira risco: o campo `seguranca` da tabela `COMERCIO` é a chance de
     dar errado. Mercadinho 2, roupas e posto 3, joalheria 6, banco 8.
     ======================================================= */
  /* o que o sujeito leva é uma FRAÇÃO DO PISO da faixa: isto é um cara
     levando a gaveta e saindo andando, não bonde invadindo com cena */
  const FRACAO_GAVETA = 0.12;
  const PENA = {joalheria:60, banco:60, roupas:30, posto:30, mercadinho:30};

  /* DE SEGURANÇA PRA CHANCE DE DAR ERRADO.
     O fator é 5, e é medido, não escolhido de véspera: a gaveta vale de
     R$ 60 (mercadinho) a R$ 504 (joalheria) e a prisão custa 30 a 60
     dias, mais o tombo de `policia` pelo calor do alvo. Com fator 10 o
     banco seria preso em 8 de 10 e voltaria a ser a armadilha que a
     corrida da viatura tinha criado — "preso em 7 de 7, sem render um
     centavo nunca". Com o número cru (2% a 8%) ninguém seria preso em
     uma temporada inteira e o alvo grande sairia de graça. Em 5 a
     escada aparece e o banco continua sendo aposta: mercadinho 10%,
     roupas e posto 15%, joalheria 30%, banco 40%. */
  const RISCO_POR_SEGURANCA = 5;
  const chanceDeDarErrado = tipo => {
    const C = TO.acoes.COMERCIO[tipo];
    return C ? U.limitar(C.seguranca * RISCO_POR_SEGURANCA, 0, 90) : 0;
  };

  /* AS ORGANIZADAS DA PRAÇA COM O EFETIVO DE AGORA.
     O sorteio do autor é por PESO DE EFETIVO: torcida de 250 aparece na
     rua mais que torcida de 20, porque tem mais gente pra aparecer. */
  function organizadasComEfetivo(E){
    const fora = [];
    for(const o of M().torcidasEm(E.torcida.mapa)){
      const n = o.id === E.torcida.id ? E.membros.length
              : ((TO.tensao && TO.tensao.mundo(E)[o.id]) || {}).membros
                || o.membros || 0;
      if(n > 0) fora.push({torcida:o, n, nossa:o.id === E.torcida.id});
    }
    return fora;
  }
  /* sorteio por peso com número já sorteado em [0,1) — determinístico
     quando o número vem de hash, que é o que o calendário precisa */
  function porPeso(lista, r){
    const soma = lista.reduce((a,x)=>a+x.n, 0) || 1;
    let acc = 0, alvo = r * soma;
    for(const x of lista){ acc += x.n; if(alvo < acc) return x; }
    return lista[lista.length-1];
  }

  const blocoDe = E => Math.floor((E.data.semana - 1) / 4);

  /* Os assaltos deste bloco de quatro semanas, sempre os mesmos pro
     mesmo bloco. Devolve [{semana, dia, tipo, torcidaId}]. */
  function assaltosDoBloco(E){
    const H = MP().hash;
    const bloco = blocoDe(E);
    const chave = `${E.data.ano}|bloco${bloco}`;
    const quantos = 2 + (H(`${chave}|quantos`) % 2);      // 2 ou 3
    const donos = organizadasComEfetivo(E);
    if(!donos.length) return [];
    const tipos = Object.keys(TO.acoes.COMERCIO);
    const fora = [], usados = new Set();
    for(let i=0;i<quantos;i++){
      const s = k => (H(`${chave}|a${i}|${k}`) % 10000) / 10000;
      /* espalhados pelos 28 dias do bloco, sem dois no mesmo dia */
      let d = Math.floor(s('dia') * 28);
      while(usados.has(d)) d = (d + 9) % 28;
      usados.add(d);
      fora.push({
        semana: bloco*4 + 1 + Math.floor(d/7),
        dia: (d % 7) + 1,
        tipo: tipos[Math.floor(s('alvo') * tipos.length)],
        torcidaId: porPeso(donos, s('quem')).torcida.id
      });
    }
    return fora;
  }

  const assaltoDeHoje = E => assaltosDoBloco(E).find(
    a => a.semana === E.data.semana && a.dia === E.data.dia) || null;

  const diaAbsoluto = E => (E.data.ano*40 + E.data.semana)*7 + E.data.dia;
  /* A BAIXA FICA ANOTADA. Membro que some da lista sem explicação é o
     tipo de coisa que faz o jogador achar que o jogo quebrou. */
  function marcarBaixa(E, nome, txt, tipo){
    (E.baixasDeRua = E.baixasDeRua || [])
      .push({nome, txt, tipo:tipo||'ruim', quando:diaAbsoluto(E)});
    if(E.baixasDeRua.length > 12) E.baixasDeRua.shift();
  }

  /* O assalto de hoje, resolvido de uma vez. Devolve o registro do que
     aconteceu, ou null quando não houve. */
  function resolverAssalto(E){
    const plano = assaltoDeHoje(E);
    if(!plano) return null;
    const C = TO.acoes.COMERCIO[plano.tipo];
    const o = M().torcida(plano.torcidaId);
    if(!C || !o) return null;
    const mo = MP().modelo(E);
    const H = MP().hash;
    const chave = `${E.data.ano}|${E.data.semana}|${E.data.dia}|assalto`;
    /* ONDE: um dos pinos daquele tipo na praça. O bairro entra no aviso
       porque é o que faz o assalto ser um lugar e não uma estatística. */
    const alvos = ((mo && mo.pinos) || []).filter(p=>p.tipo === plano.tipo);
    const p = alvos.length ? alvos[H(`${chave}|onde`) % alvos.length] : null;
    const bairro = p ? p.bairro : '';
    const nossa = plano.torcidaId === E.torcida.id;

    /* o membro sai dos DISPONÍVEIS: quem já está ferido ou preso não sai
       assaltando */
    let membro = null;
    if(nossa){
      const aptos = E.membros.filter(TO.membros.disponivel);
      if(!aptos.length) return null;              // ninguém de pé, não houve
      membro = aptos[H(`${chave}|quem`) % aptos.length];
    }
    const preso = U.rng()*100 < chanceDeDarErrado(plano.tipo);
    const levou = Math.round(C.rende[0] * FRACAO_GAVETA);
    const pena  = PENA[plano.tipo] || 30;
    /* O ARTIGO DO BAIRRO NÃO SE ADIVINHA. Era `d${vogal?'':'o '}` e
       saía "Joalheria dAldeota": bairro que começa com vogal perdia o
       artigo inteiro, e "do" está errado na metade dos que começam com
       consoante ("do Aldeota", "do Messejana"). Nome de bairro tem
       gênero e não está nos dados. "no bairro X" está certo sempre. */
    const onde  = `${C.nome}${bairro ? ` no bairro ${bairro}` : ''}`;

    /* TODA TENTATIVA VIRA AVISO, seja de quem for: é por ela que o
       jogador sente que a praça tem outras torcidas vivendo nela. Isto é
       recado, não decisão — não para o tempo. */
    TO.estado.anotar(E, `${o.nome} tentou ${onde}: `+
      (preso ? 'a PM pegou na porta.' : `saiu com ${U.dinheiro(levou)}.`),
      nossa ? (preso ? 'ruim' : 'boa') : '',
      nossa ? {cat:4} : {cat:5, local:true});

    if(preso){
      if(nossa && membro){
        TO.membros.prender(E, membro, pena, `Preso assaltando ${onde}`);
        const I = E.indicadores;
        I.policia   = U.limitar(I.policia - C.calor, 0, 20);
        I.prestigio = U.limitar(I.prestigio - 1, 0, 20);
        TO.estado.anotar(E,
          `${TO.membros.nomeDe(membro)} foi preso assaltando ${onde} — `+
          `${pena} dias.`, 'ruim', {cat:4});
        marcarBaixa(E, TO.membros.nomeDe(membro),
          `preso assaltando ${onde} — ${pena} dias de pena`);
      }else if(!nossa && TO.tensao){
        /* pras 138 da IA a prisão é o mesmo tombo de polícia que a gente
           leva: indicador que se move num lado e não no outro é
           decoração (§8.20) */
        TO.tensao.mover(E, plano.torcidaId, 'policia', -C.calor);
      }
    }else{
      if(nossa){
        TO.estado.lancar(E, `Assalto — ${onde}`, levou);
        /* o artigo do comércio, esse, está na tabela: `COMERCIO` traz
           `artigo` justamente pra isto */
        if(membro) TO.estado.anotar(E,
          `${TO.membros.nomeDe(membro)} limpou a gaveta d${C.artigo} `+
          `${C.nome} e sumiu: ${U.dinheiro(levou)}.`, 'boa', {cat:4});
      }else if(TO.tensao){
        const t = TO.tensao.mundo(E)[plano.torcidaId];
        if(t) t.caixa += levou;
      }
    }
    return {tipo:plano.tipo, torcida:plano.torcidaId, nossa, preso, levou,
            pena, bairro, onde};
  }

  /* =======================================================
     O DIA DA PRAÇA

     O que sobrou do laço que rodava minuto a minuto: um dia é uma
     chamada, e ela resolve o assalto do calendário. A ida ao estádio
     não entra aqui — ela é resposta a um botão do feed, e o jogador
     tem de estar olhando quando ela acontece.
     ======================================================= */
  function passarDia(E){
    return {assalto: resolverAssalto(E)};
  }

  return {jogosDaPraca,
          pontoDe, pontoDoEstadio, pontoDoEstadioDoClube, camposDaPraca,
          pontoDaSede, pontoDoBar,
          RUA_DA_CLASSE, ruaDaClasse, localDe, larguraEm, pontoNoBairro, LARGO,
          hexParaRgb, tonalizar, tomVizinho, siglaUnica, elencoDaNoite,
          anfitriaoDe, escoltaDe, naRuaHoje, naRuaEm,
          hostis, chanceDeProcurar, chanceDeAcaso, corredor,
          grauDeRivalidade, fatorParidade, BASE_PROCURA, PISO_PARIDADE,
          efetivoDeTorcida:efetivoDe,
          lugarPlanejado, lugarDoEncontro, resolverIda,
          organizadasComEfetivo, porPeso, assaltosDoBloco, assaltoDeHoje,
          resolverAssalto, chanceDeDarErrado, RISCO_POR_SEGURANCA,
          FRACAO_GAVETA, PENA, marcarBaixa, passarDia};
})();
