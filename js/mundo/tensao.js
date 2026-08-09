/* =========================================================
   TENSÃO — o termômetro que a relação não mede
   ---------------------------------------------------------
   Relação é o que se pensa do outro; tensão é o que está
   prestes a acontecer. Atacar um rival dispara a tensão e
   arrasta a relação junto; semana sem hostilidade esfria as
   duas, e a relação volta devagar pro que ela era.

   Tensão alta é ameaça concreta: sede, bar, emboscada na
   rodovia ou nos arredores. E não é só com a gente — as
   outras torcidas têm caixa, tomam decisão e brigam entre
   si, e é isso que enche o noticiário.
   ========================================================= */
window.TO = window.TO || {};

TO.tensao = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  const MAX = 100;
  /* GDD §12 usa quatro faixas em tudo; aqui também */
  const FAIXAS = [
    {ate:19,  nome:'Calmaria',  cor:'#7fc2a0'},
    {ate:44,  nome:'Atrito',    cor:'#c8a03c'},
    {ate:74,  nome:'Fervendo',  cor:'#d9705f'},
    {ate:100, nome:'Guerra',    cor:'#e04b45'}
  ];
  const faixa = v => FAIXAS.find(f=>v<=f.ate) || FAIXAS[3];

  const nivel = (E, id) => (E.tensao||{})[id] || 0;

  /* Mexer na tensão mexe na relação junto: hostilidade afasta, paz
     aproxima. A relação anda menos que a tensão — mágoa demora. */
  function somar(E, id, quanto, motivo){
    E.tensao = E.tensao || {};
    const antes = E.tensao[id] || 0;
    E.tensao[id] = U.limitar(antes + quanto, 0, MAX);
    if(E.relacoes && E.relacoes[id] !== undefined)
      E.relacoes[id] = U.limitar(E.relacoes[id] - quanto*0.35, -100, 100);
    if(motivo && Math.abs(quanto) >= 8){
      E.focos = E.focos || [];
      E.focos.unshift({semana:E.data.semana, id, quanto:Math.round(quanto), motivo});
      if(E.focos.length > 40) E.focos.pop();
    }
    return E.tensao[id];
  }

  /* =======================================================
     A SEMANA DAS OUTRAS TORCIDAS
     Cada uma tem caixa, efetivo e vontade própria. É conta
     grossa de propósito: 139 torcidas não podem custar caro.
     ======================================================= */
  function mundo(E){
    if(E.mundoTorcidas) return E.mundoTorcidas;
    E.mundoTorcidas = {};
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id) continue;
      E.mundoTorcidas[o.id] = {
        membros: o.membros || 20,
        caixa: (o.saldo || 200) * 4,
        moral: 12,
        /* torcida grande e de clube grande é mais ousada */
        ousadia: U.limitar((o.poder || 60)/260 + U.entre(-0.15, 0.15), 0.05, 1)
      };
    }
    return E.mundoTorcidas;
  }

  const MENSALIDADE = 46;      // média por cabeça, por mês
  const CUSTEIO     = 22;      // sede, material e estrada

  function economiaDelas(E){
    const m = mundo(E);
    for(const id of Object.keys(m)){
      const t = m[id];
      t.caixa += Math.round((t.membros*(MENSALIDADE-CUSTEIO))/4);
      /* torcida quebrada perde gente; torcida cheia de caixa cresce */
      if(t.caixa < 0 && U.rng() < 0.35){
        t.membros = Math.max(8, t.membros - U.inteiro(1,3));
        t.moral = U.limitar(t.moral - 0.4, 0, 20);
      }else if(t.caixa > t.membros*120 && U.rng() < 0.18){
        t.membros += U.inteiro(1,2);
        t.caixa -= 400;
      }
    }
  }

  /* =======================================================
     O QUE ELAS FAZEM ENTRE SI
     Um par por semana, escolhido entre quem já se odeia. O
     resultado vira notícia e mexe no clima da cidade.
     ======================================================= */
  const HOSTIS = [
    {id:'sede',      txt:'atacou a sede da', tensao:16, prest:4},
    {id:'bar',       txt:'depredou o bar da', tensao:12, prest:3},
    {id:'emboscada', txt:'emboscou o bonde da', tensao:20, prest:5},
    {id:'arredores', txt:'brigou nos arredores com a', tensao:14, prest:4},
    {id:'pichacao',  txt:'pichou o muro da', tensao:7,  prest:2}
  ];
  const PACIFICAS = [
    {id:'tregua',  txt:'fechou trégua com a',        tensao:-14},
    {id:'visita',  txt:'foi recebida na sede da',    tensao:-10},
    {id:'apoio',   txt:'apoiou no estádio a',        tensao:-8}
  ];

  function paresPossiveis(E){
    const fora = [];
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id) continue;
      for(const r of (o.maioresRivais||[]).concat(o.rivais||[]))
        if(r > o.id) fora.push([o.id, r]);
      for(const a of (o.aliados||[]))
        if(a > o.id) fora.push([o.id, a]);
    }
    return fora;
  }

  let _pares = null;
  function diplomaciaDelas(E){
    if(!_pares) _pares = paresPossiveis(E);
    if(!_pares.length) return [];
    const m = mundo(E);
    const noticias = [];
    /* três episódios por semana no país inteiro: o bastante pra o
       ticker ter o que dizer sem virar ruído */
    for(let k=0;k<3;k++){
      const [a,b] = U.escolher(_pares);
      const ta = M().torcida(a), tb = M().torcida(b);
      if(!ta || !tb || !m[a] || !m[b]) continue;
      const rivais = (ta.maioresRivais||[]).includes(b) || (ta.rivais||[]).includes(b);
      const ousadia = (m[a].ousadia + m[b].ousadia)/2;
      if(rivais && U.rng() < 0.35 + ousadia*0.4){
        const ev = U.escolher(HOSTIS);
        m[a].caixa -= 300; m[b].caixa -= 900;
        m[b].membros = Math.max(8, m[b].membros - U.inteiro(0,2));
        E.tensoesDelas = E.tensoesDelas || {};
        const ch = a+'|'+b;
        E.tensoesDelas[ch] = U.limitar((E.tensoesDelas[ch]||0) + ev.tensao, 0, MAX);
        noticias.push({txt:`${ta.nome} ${ev.txt} ${tb.nome}`, tipo:'briga',
                       torcidas:[a,b]});
      }else if(!rivais && U.rng() < 0.25){
        const ev = U.escolher(PACIFICAS);
        noticias.push({txt:`${ta.nome} ${ev.txt} ${tb.nome}`, tipo:'paz',
                       torcidas:[a,b]});
      }
    }
    return noticias;
  }

  /* =======================================================
     O QUE ELAS FAZEM CONOSCO
     Tensão alta é convite: quanto mais quente, maior a chance
     de a semana trazer um ataque.
     ======================================================= */
  const ALVOS = [
    {id:'sede', peso:2,
     conta:(E,o)=>({txt:`Bando da ${o.nome} apedrejou a sede`,
                    dinheiro:-U.inteiro(400,1400), feridos:U.inteiro(1,3),
                    moral:-1.2, prestigio:-2})},
    {id:'bar', peso:2,
     conta:(E,o)=>({txt:`${o.nome} quebrou nosso bar`,
                    dinheiro:-U.inteiro(600,2000), feridos:U.inteiro(0,2),
                    moral:-0.8, prestigio:-1})},
    {id:'emboscada', peso:3,
     conta:(E,o)=>({txt:`Emboscada da ${o.nome} na estrada`,
                    dinheiro:-U.inteiro(200,700), feridos:U.inteiro(2,5),
                    moral:-1.6, prestigio:-3})},
    {id:'arredores', peso:2,
     conta:(E,o)=>({txt:`${o.nome} caiu em cima nos arredores`,
                    dinheiro:0, feridos:U.inteiro(2,4),
                    moral:-1, prestigio:-2})}
  ];

  function ataquesContraNos(E){
    const fora = [];
    for(const [id, t] of Object.entries(E.tensao||{})){
      if(t < 45) continue;
      /* de 45 pra cima a chance cresce rápido; em guerra é quase certo */
      const chance = ((t-45)/55) * 0.28;
      if(U.rng() > chance) continue;
      const o = M().torcida(id);
      if(!o) continue;
      /* emboscada na estrada só quando a torcida está viajando */
      const podeEstrada = TO.financeiro.precisaCaravana(E);
      const alvos = ALVOS.filter(a=>a.id!=='emboscada' || podeEstrada);
      const sorteio = [];
      for(const a of alvos) for(let i=0;i<a.peso;i++) sorteio.push(a);
      const ev = U.escolher(sorteio).conta(E, o);

      if(ev.dinheiro) TO.estado.lancar(E, ev.txt, ev.dinheiro);
      const aptos = E.membros.filter(TO.membros.disponivel);
      for(let i=0;i<Math.min(ev.feridos, aptos.length);i++)
        TO.membros.ferir(E, U.escolher(aptos), 12 + U.inteiro(0,14));
      E.indicadores.moral = U.limitar(E.indicadores.moral + ev.moral, 0, 20);
      E.indicadores.prestigio = U.limitar(E.indicadores.prestigio + ev.prestigio/3, 0, 20);
      /* apanhar esquenta ainda mais */
      somar(E, id, 6, 'fomos atacados');
      fora.push(Object.assign({id, torcida:o.nome}, ev));
    }
    return fora;
  }

  /* =======================================================
     ESFRIAMENTO
     Semana sem hostilidade baixa a tensão, e a relação anda de
     volta pro que ela é por natureza.
     ======================================================= */
  function esfriar(E, houveHostilidade){
    E.tensao = E.tensao || {};
    for(const id of Object.keys(E.tensao)){
      if(houveHostilidade[id]) continue;
      const t = E.tensao[id];
      if(t <= 0){ delete E.tensao[id]; continue; }
      E.tensao[id] = Math.max(0, t - (t > 60 ? 4 : 3));
    }

    /* Com o tempo a relação volta pro que ela é por natureza: mágoa de
       briga passa, e favor feito também. Quanto mais quente o clima,
       menos ela se move — tensão alta mantém tudo aflorado. */
    for(const id of Object.keys(E.relacoes||{})){
      const base = M().valorInicial(M().relacaoBase(E.torcida.id, id));
      const atual = E.relacoes[id];
      if(Math.abs(base - atual) < 2) continue;
      const puxao = 0.05 * (1 - (E.tensao[id]||0)/MAX);
      E.relacoes[id] = U.limitar(atual + (base - atual)*puxao, -100, 100);
    }
    for(const ch of Object.keys(E.tensoesDelas||{})){
      const v = E.tensoesDelas[ch] - 3;
      if(v <= 0) delete E.tensoesDelas[ch]; else E.tensoesDelas[ch] = v;
    }
  }

  /* =======================================================
     AS NOSSAS INVESTIDAS
     O que o jogador marcou nos outros jogos da cidade: cair em
     cima de torcida de passagem ou emboscar um rival. Resolve
     no fechamento, com baixa dos dois lados.
     ======================================================= */
  function resolverInvestidas(E){
    const feitas = [];
    for(const inv of (E.investidas||[])){
      if(inv.semana !== E.data.semana) continue;
      const o = M().torcida(inv.alvo);
      if(!o) continue;
      const nossos = E.membros.filter(TO.membros.disponivel);
      if(nossos.length < 4) continue;

      /* quem tem mais gente e mais moral leva a melhor */
      const nossa = nossos.length * (0.6 + E.indicadores.moral/40);
      const deles = (o.membros||20) * U.entre(0.5, 1.1);
      const ganhamos = nossa >= deles;

      const feridos = U.inteiro(1, ganhamos ? 3 : 6);
      for(let i=0;i<Math.min(feridos, nossos.length);i++)
        TO.membros.ferir(E, U.escolher(nossos), 10 + U.inteiro(0,16));
      if(U.rng() < 0.3){
        const azar = nossos.filter(TO.membros.disponivel);
        if(azar.length) TO.membros.prender(E, U.escolher(azar));
      }
      const prest = ganhamos ? U.inteiro(2,5) : -U.inteiro(1,3);
      E.indicadores.prestigio = U.limitar(E.indicadores.prestigio + prest/3, 0, 20);
      E.indicadores.policia   = U.limitar(E.indicadores.policia - 1, 0, 20);
      somar(E, inv.alvo, 22, 'nós atacamos');

      feitas.push({alvo:o.nome, ganhamos, feridos, prest,
        txt: ganhamos ? `Caímos em cima da ${o.nome} e dominamos`
                      : `Investida contra a ${o.nome} deu errado`});
    }
    E.investidas = (E.investidas||[]).filter(i=>i.semana !== E.data.semana);
    return feitas;
  }

  /* =======================================================
     A SEMANA INTEIRA, NUMA CHAMADA SÓ
     ======================================================= */
  function passarSemana(E){
    mundo(E);
    const quentes = {};
    for(const f of (E.focos||[])) if(f.semana === E.data.semana) quentes[f.id] = true;

    const investidas = resolverInvestidas(E);
    for(const i of investidas) quentes[i.alvo] = true;
    const ataques  = ataquesContraNos(E);
    for(const a of ataques) quentes[a.id] = true;
    esfriar(E, quentes);
    economiaDelas(E);
    const noticias = diplomaciaDelas(E);

    return {ataques, noticias, investidas};
  }

  /* rótulo pra tela: com quem estamos prestes a nos pegar */
  function panorama(E){
    return Object.entries(E.tensao||{})
      .filter(([,v])=>v > 0)
      .map(([id, v])=>{
        const o = M().torcida(id);
        return {id, nome:o?o.nome:id, cores:o?o.cores:['#666'],
                tensao:Math.round(v), faixa:faixa(v),
                relacao: Math.round((E.relacoes||{})[id] || 0)};
      })
      .sort((a,b)=>b.tensao-a.tensao);
  }

  return {MAX, FAIXAS, faixa, nivel, somar, passarSemana, panorama,
          resolverInvestidas,
          mundo, ataquesContraNos, HOSTIS, PACIFICAS};
})();
