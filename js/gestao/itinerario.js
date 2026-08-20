/* =========================================================
   ITINERÁRIO DO DIA DE JOGO (régua do dono, 20/08/2026)
   ---------------------------------------------------------
   O dia inteiro numa linha só, de baixo pra cima: cada parada
   é um ponto da viagem, e ao chegar nela pode aparecer o
   recado do lado — a nossa investida, o ataque que a gente
   sofre, ou nada.

   Aqui mora só a LÓGICA: quais paradas existem, a que horas,
   em que dia e o que acontece em cada uma. Quem desenha e
   quem abre as cenas é a tela, em main.js. Nada aqui conhece
   DOM, e nada aqui decide consequência: as cenas continuam
   sendo as mesmas do jogo, com o mesmo fecho.

   O PLANEJAMENTO NÃO MUDA (decisão do dono): quem decide o
   alvo, o ponto, as bombas e a rota continua sendo a tela de
   planejamento, antes do dia. O itinerário só LÊ o que foi
   decidido e mostra no ponto combinado.

   AS TRÊS DATAS: jogo fora ocupa três dias — véspera (a
   caravana pega a estrada), dia do jogo e dia seguinte (a
   volta). Não é invenção desta tela: é o que
   financeiro.diasDaViagem já tranca no calendário.
   ========================================================= */
window.TO = window.TO || {};

TO.itinerario = (function(){
  const U  = TO.util;
  const M  = ()=>TO.mundo;
  const PL = ()=>TO.planejamento;

  /* ---------------------------------------------------------
     O RELÓGIO DO DIA
     A hora do jogo vem da grade da competição (proximoJogo.hora),
     e todo o resto se pendura nela. Os arredores caem três horas
     antes porque é a hora que o relógio da cena marca (18:00 pra
     um jogo às 21:00) — a tela e a cena contam a mesma noite.
     --------------------------------------------------------- */
  const ANTES = {concentracao:-300, pista:-240, arredores:-180};
  const DEPOIS = {arredores:125, pista:170};
  /* estrada: cada trecho da rota, e a folga entre chegar na praça
     deles e a concentração começar */
  const TRECHO = 450;          // 7h30 por trecho de rodovia
  const CHEGADA = -630;        // desce do ônibus 10h30 antes do jogo
  const SAIDA_VOLTA = 270;     // pega a estrada de volta 4h30 depois

  const hhmm = min =>{
    const m = ((min % 1440) + 1440) % 1440;
    return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  };
  const emMinutos = txt =>{
    const [h,m] = String(txt||'21:00').split(':').map(Number);
    return (h||21)*60 + (m||0);
  };
  /* de que dia é este minuto, em relação ao dia do jogo */
  const diaDe = min => Math.floor(min/1440);

  /* ---------------------------------------------------------
     AS EMBOSCADAS DA ROTA
     Cada praça por onde a caravana passa pode ter a sua — de uma
     torcida DAQUELA cidade (régua do dono, 20/08/2026). Na volta
     a chance é metade: a estrada de madrugada é mais calma, mas
     não é segura.
     --------------------------------------------------------- */
  function emboscadaEm(E, cidadeId, ida){
    const P = PL();
    if(!P.emboscadaNaPraca) return null;
    return P.emboscadaNaPraca(E, cidadeId, ida);
  }

  /* ---------------------------------------------------------
     A MONTAGEM
     --------------------------------------------------------- */
  function montar(E){
    const j = E && E.proximoJogo;
    if(!j) return null;
    const hora = emMinutos(j.hora);
    const p = PL().plano(E);
    const paradas = [];

    /* o que o planejamento decidiu: em que ponto a gente cai em cima
       deles. `ondeDoPlano` já traduz intenção + olheiro em um dos três
       lugares — a tela de planejamento continua mandando nisso. */
    const atacando = p.intencao !== 'paz' && p.alvoTorcida && !p.guerraJogada;
    /* DE ONDE SAI O PONTO: do MESMO campo que a cena lê (`p.alvo`, que
       praca.js usa em lugarPlanejado). Ler de outro lugar era pedir
       pra a parada dizer "na concentração" e a cena abrir a esplanada.
       Terminal, avenida e viaduto são a pista: é a rua a caminho. */
    const PONTO_DE_ALVO = {praca:'concentracao', avenida:'pista',
                           terminal:'pista', viaduto:'pista',
                           arredores:'arredores'};
    const ondeAtaque = atacando
      ? (PONTO_DE_ALVO[p.alvo] || 'arredores') : null;
    const alvo = atacando ? M().torcida(p.alvoTorcida) : null;

    /* o que a gente sofre hoje: a concentração e a pista vêm do
       calendário de ataques-surpresa (relacoes.ALVOS) */
    const atq = E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
                E.ataqueMarcado.ano === E.data.ano &&
                E.ataqueMarcado.semana === E.data.semana &&
                (E.ataqueMarcado.alvo === 'concentracao' ||
                 E.ataqueMarcado.alvo === 'pista') ? E.ataqueMarcado : null;

    const põe = (o)=>{ paradas.push(o); return o; };
    const pontoDoDia = (id, nome, lugar, min)=>{
      const o = {id, nome, lugar, min, hora:hhmm(min), dia:diaDe(min), eventos:[]};
      /* o que a gente sofre vem primeiro: apanhar na porta é mais
         urgente que descer em cima de alguém */
      if(atq && atq.alvo === id)
        o.eventos.push({tipo:'sofrido', torcida:atq.torcida, nome:atq.nome,
                        ponto:id, abrir:{tela:'defesa', atq}});
      /* e a investida que o planejamento marcou, no ponto combinado */
      if(ondeAtaque === id && alvo)
        o.eventos.push({tipo:'investida', torcida:p.alvoTorcida, nome:alvo.nome,
                        ponto:id,
                        abrir:{tela:'guerra', args:{tipo: j.casa ? 'casa' : 'fora'}}});
      return põe(o);
    };

    const casa = !!j.casa;
    const rota = (!casa && PL().rotaEscolhida) ? PL().rotaEscolhida(E) : null;
    const viaja = !!(rota && rota.cidades && rota.cidades.length > 1 &&
                     rota.id !== 'ar');

    /* ---- a ida pela estrada, na véspera ---- */
    if(viaja){
      const cid = rota.cidades;
      const chegada = hora + CHEGADA;
      /* de trás pra frente: a chegada na praça deles é a última perna */
      const saida = chegada - TRECHO*(cid.length-1);
      cid.forEach((c, k)=>{
        const min = saida + TRECHO*k;
        const nome = (M().cidade(c) || {}).nome || c;
        const o = {id:'praca:'+c, cidade:c, nome, min, hora:hhmm(min),
                   dia:diaDe(min), estrada:k>0,
                   lugar: k===0 ? 'Sede · a caravana pega a estrada'
                        : k===cid.length-1 ? 'Chegada na praça deles'
                        : 'Praça de passagem'};
        if(k>0){
          const emb = emboscadaEm(E, c, true);
          if(emb) o.eventos = [{tipo:'emboscada', torcida:emb.torcida, nome:emb.nome,
                                ponto:'emboscada',
                                abrir:{tela:'defesa', atq:{
                                  torcida:emb.torcida, nome:emb.nome,
                                  alvo:'emboscada', cena:emb.cena}}}];
        }
        põe(o);
      });
    }

    /* ---- o bloco do estádio, igual em casa e fora ---- */
    pontoDoDia('concentracao', 'Concentração',
      casa ? 'Praça da concentração' : 'Praça deles · ponto do rival',
      hora + ANTES.concentracao);
    pontoDoDia('pista', 'Pista', 'Avenida de acesso · a caminho',
      hora + ANTES.pista);
    pontoDoDia('arredores', 'Arredores',
      (casa ? 'Esplanada do ' : 'Estádio deles · ') + (j.estadio || 'estádio'),
      hora + ANTES.arredores);

    põe({id:'jogo', nome:'O jogo', jogo:true, min:hora, hora:hhmm(hora), dia:0,
         lugar:`${j.estadio || 'Estádio'} · em tempo real`});

    põe({id:'arredores-volta', nome:'Arredores', lugar:'Saída dos portões',
         min:hora+DEPOIS.arredores, hora:hhmm(hora+DEPOIS.arredores),
         dia:diaDe(hora+DEPOIS.arredores)});
    põe({id:'pista-volta', nome:'Pista', lugar:'Avenida de acesso · volta',
         min:hora+DEPOIS.pista, hora:hhmm(hora+DEPOIS.pista),
         dia:diaDe(hora+DEPOIS.pista)});

    /* ---- a volta pela estrada, no dia seguinte ---- */
    if(viaja){
      const cid = rota.cidades.slice().reverse();   // destino → casa
      const saida = hora + SAIDA_VOLTA;
      cid.forEach((c, k)=>{
        const min = saida + TRECHO*k;
        const nome = (M().cidade(c) || {}).nome || c;
        const o = {id:'volta:'+c, cidade:c, nome, min, hora:hhmm(min),
                   dia:diaDe(min), estrada:k>0,
                   lugar: k===0 ? 'Saída da praça deles'
                        : k===cid.length-1 ? 'Sede · fim da caravana'
                        : 'Praça de passagem'};
        if(k < cid.length-1){
          const emb = emboscadaEm(E, c, false);
          if(emb) o.eventos = [{tipo:'emboscada', torcida:emb.torcida, nome:emb.nome,
                                ponto:'emboscada',
                                abrir:{tela:'defesa', atq:{
                                  torcida:emb.torcida, nome:emb.nome,
                                  alvo:'emboscada', cena:emb.cena}}}];
        }
        põe(o);
      });
    }

    /* ---- os marcos de virada de dia ---- */
    const dias = {};
    for(const o of paradas) dias[o.dia] = true;
    const rotDia = d => {
      const t = TO.estado.dataTextoEm ? TO.estado.dataTextoEm(E, d) : null;
      const quando = t ? `${t.semana} ${t.curta.slice(0,5)}` : '';
      return quando + (d === 0 ? ' · dia do jogo'
                     : d < 0 ? ' · véspera, dia de caravana'
                             : ' · volta, dia de caravana');
    };
    let anterior = null;
    for(const o of paradas){
      if(o.dia !== anterior){ o.abreDia = rotDia(o.dia); anterior = o.dia; }
    }

    return {
      casa, viaja,
      hora: j.hora || '21:00',
      titulo: `${j.mandante.nome} × ${j.visitante.nome}`,
      cidade: casa ? '' : (j.cidadeAdv || ''),
      dias: Object.keys(dias).length,
      paradas
    };
  }

  /* quantas paradas têm recado — pro texto da mensagem que abre o dia */
  const comRecado = it => (it && it.paradas || [])
    .filter(o=>(o.eventos||[]).length).length;

  return {montar, comRecado, hhmm};
})();
