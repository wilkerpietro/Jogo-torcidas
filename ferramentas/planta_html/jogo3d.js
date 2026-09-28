/* =========================================================
   O JOGO EM 3D (27/09/2026)

   O dono: "Comece a importar os detalhes de movimento dos bonecos e
   motor de briga pra dentro do jogo, assim como toda a rotina do html
   Torcida Organizada. Traga toda a hud pro jogo, como o menu lateral,
   as informações superiores, o menu inicial, e os dias passando."

   A página do cenário (a planta, com ?jogo) monta a praça em 3D e
   chama `montarJogo`. Daqui pra frente o jogo é o mesmo jogo de feed —
   o mesmo main.js, o mesmo relógio, os mesmos painéis, as mesmas cenas
   de briga —, carregado por cima da cidade:
   - a casca (o HTML do index.html do jogo, sem os scripts) vem de
     jogo_casca.js, que o montar.sh gera do index.html da raiz;
   - os scripts do jogo vêm num arquivo só (js/jogo.js, na mesma ordem
     do index.html), e o CSS também (css/jogo.css); jogo3d.css muda
     onde fica cada pedaço (a barra em cima, os ícones na esquerda);
   - O FEED NÃO APARECE (28/09/2026, o dono: "Exclua a exposição do feed
     na tela. As mensagens sempre vão ser via balões de alguém falando
     com o jogador"): cada mensagem chega num balão, na boca de quem a
     traz (recados3d.js);
   - o boneco das cenas é o do cenário (bonecos3_global.js);
   - o que é da cidade: quando a partida começa (ou carrega), a praça
     vira a da torcida do jogador e a câmera voa até a porta da sede.
   ========================================================= */
import { CASCA } from './jogo_casca.js';
import { criarVida, horaTxt } from './vida3d.js';
import { criarMapaDaCidade } from './mapa3d.js';
import { criarDia3d } from './dia3d.js';
import { criarRecados } from './recados3d.js';

const carregarScript = src => new Promise((ok, erro) => {
  const s = document.createElement('script');
  s.src = src; s.charset = 'utf-8'; s.onload = ok; s.onerror = () => erro(new Error(src));
  document.head.appendChild(s);
});
const carregarCss = href => new Promise(ok => {
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href; l.onload = ok; l.onerror = ok;
  document.head.appendChild(l);
});

export async function montarJogo(api) {
  document.body.classList.add('jogo3d');
  await Promise.all([carregarCss('css/jogo.css'), carregarCss('css/jogo3d.css')]);
  /* a casca entra antes do main.js: ele procura os ids na hora que carrega */
  const caixa = document.createElement('div');
  caixa.innerHTML = CASCA;
  while (caixa.firstChild) document.body.appendChild(caixa.firstChild);
  /* os escudos de todos os clubes, as fotos das praças e as bandeiras,
     embutidos (o `IMG()` do jogo procura aqui antes do caminho) */
  await carregarScript('dados/imagens_jogo.js').catch(() => {});
  /* sem o rolo do feed: quem entrega as mensagens é o balão (recados3d.js) */
  window.TO = window.TO || {};
  TO.semFeed = true;
  await carregarScript('js/jogo.js');
  /* o boneco das cenas: os dois níveis afinados em base64 (o cenário só
     puxa esse .js quando alguém entra a pé; o jogo precisa dele nas cenas) */
  if (!TO.dados.bonecoPertoGLB) await carregarScript('dados/boneco_glb.js').catch(() => {});
  await import('./bonecos3_global.js');
  ligar(api);
  return TO.tela;
}

function ligar(api) {
  const E = () => TO.estado && TO.estado.E;
  const jogo = document.getElementById('jogo');
  /* A VIDA DA PRAÇA (27/09/2026, vida3d.js): a sede com gente, o
     presidente e o recado em balão, a reunião na sala, o povo na rua, os
     bares e o dia passando. O relógio do jogo pergunta a ela quanto
     esperar (`TO.jogo3d.ritmo`), e a reunião abre na sala da sede
     (`TO.jogo3d.palcoDe`) */
  const vida = criarVida(api);
  /* O MAPA DA CIDADE (mapa3d.js): o item "Mapa da cidade" da coluna de
     ícones (main.js) chama `abrirMapa` */
  const mapa = criarMapaDaCidade(api);
  /* O DIA DE JOGO EM 3D (28/09/2026, dia3d.js): a linha do dia de jogo
     abre a cidade do jogo (a nossa, ou a deles) com os bondes, a PM, a
     arquibancada e a invasão; enquanto ele está no ar a praça não troca
     sozinha, e no fim ela volta pra do jogador */
  let pracaTravada = false;
  const dia3d = criarDia3d(api, vida, {
    travarPraca(v) {
      pracaTravada = !!v;
      if (!v) { pracaDoJogo = null; conferirPraca(); }
    }
  });
  /* OS RECADOS EM BALÃO (28/09/2026, recados3d.js): cada mensagem que cai
     chega na boca de alguém — quem senta na frente do presidente, na sede;
     o líder do nosso bonde, no dia de jogo */
  const recados = criarRecados(api, vida, dia3d);
  /* O RITMO: quanto a próxima mensagem espera. Com a vida da praça, até a
     hora dela no relógio do dia; e sempre, até quem está falando acabar
     (a fila de balões não cresce). O dia calado sem a vida passa no
     compasso de sempre do jogo de feed (120 ms) */
  const ritmo = {
    antesDaProxima: e => Math.max(vida.ligada ? vida.ritmo.antesDaProxima(e) || 0 : 0, recados.espera()),
    diaVazio: e => vida.ligada ? vida.ritmo.diaVazio(e) : 120,
    /* (o que falta pra tela chegar na hora: o jogo espera) */
    falta: e => vida.ligada && vida.ritmo.falta ? vida.ritmo.falta(e) : 0,
    caiu(e, m) {
      /* (a pergunta do olheiro que ficou na fila de um save de antes: responde sozinha, o jogo vai pro fundo) */
      if (m && m.kind === 'jogo-praca' && !m.respondido && TO.feed.marcarResposta) {
        TO.feed.marcarResposta(e, m.id, 'seguir', 'o jogo da cidade passa sozinho');
        agendarJogosDaCidade(e);
      }
      recados.chegou(e, m); if (vida.ligada) vida.ritmo.caiu(e, m);
    },
    /* (o jogo da cidade de ontem sai; o de hoje entra depois da virada do relógio, que apaga as janelas) */
    virouDia(e) { if (dia3d.jogoNoFundoHoje) dia3d.fechar(); if (vida.ligada) vida.ritmo.virouDia(e); horaDaPartida(e); agendarJogosDaCidade(e); }
  };

  /* OS JOGOS DA CIDADE (o jogo 3D, 28/09/2026). Primeiro o olheiro avisava e
     perguntava se o jogador queria ver o dia na cidade; o dono, jogando: "o
     jogo não pergunta se eu quero acompanhar o que acontece em dia de
     outros jogos na mesma cidade, o itinerário delas acontece de forma
     automática no jogo". Agora, no dia de um jogo de dois outros clubes na
     nossa praça (o calendário da praça: js/mundo/praca.js), o dia dele
     monta NO FUNDO da vida da praça (dia3d.js, `jogoNoFundo`): os bondes
     vão pro estádio enquanto as horas passam, a nossa torcida fica na sede
     (ou vai pra investida que o planejamento marcou). Dia de jogo nosso,
     não: a cidade é da nossa linha. E o mandante precisa de torcida com
     sede no mapa (sem ela o dia não monta). Um jogo por dia (o primeiro) */
  const minutoDe = h => { const m = /^(\d\d?):(\d\d)/.exec(String(h || '')); return m ? +m[1] * 60 + +m[2] : null; };
  const hhmmDe = min => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(Math.round(min) % 60).padStart(2, '0');
  /* A PARTIDA CAI PERTO DA HORA DO JOGO (o dono, 28/09/2026: "corrija a hora
     do itinerário pra bater com o 3D"): o recado "Hoje tem…, Iniciar
     partida" chegava numa hora qualquer do dia (feed.js, `horasEmOrdem`,
     espalha as do dia pela ordem da fila) — de manhã, pra um jogo à tarde —,
     e a cidade pulava da manhã pra concentração. Agora ele cai 75 minutos
     antes da bola, e a fila de hoje fica na ordem das horas */
  function horaDaPartida(e) {
    try {
      const fila = e.feedFila || [], hoje = (e.data && e.data.absoluto) || 0, j = e.proximoJogo;
      const m = fila.find(x => x && x.kind === 'partida' && x.quando && x.quando.abs === hoje);
      const bola = j && j.dia === e.data.dia ? minutoDe(j.hora) : null;
      if (!m || bola == null) return;
      m.hora = hhmmDe(Math.max(8 * 60, bola - 75));
      const doDia = fila.filter(x => x.quando && x.quando.abs === hoje), resto = fila.filter(x => !(x.quando && x.quando.abs === hoje));
      doDia.sort((a, b) => (minutoDe(a.hora) || 0) - (minutoDe(b.hora) || 0));
      fila.length = 0; fila.push(...doDia, ...resto);
    } catch (err) { console.error('jogo 3D, a hora da partida:', err); }
  }
  const jogamosHoje = e => {
    try {
      const ag = TO.competicoes && TO.competicoes.agendaDoClube ? TO.competicoes.agendaDoClube(e, e.torcida.clubeId) || [] : [];
      return ag.some(a => a.semana === e.data.semana && a.dia === e.data.dia);
    } catch (err) { return false; }
  };
  let jogoDaCidadeDe = null;
  function agendarJogosDaCidade(e) {
    try {
      if (!e || !e.torcida || !e.temporada || !TO.praca || !TO.praca.jogosDaPraca) return;
      /* (o recado com pergunta dos saves de antes: responde sozinho, o jogo vai pro fundo) */
      for (const m of e.feed || []) if (m && m.kind === 'jogo-praca' && !m.respondido && TO.feed.marcarResposta) TO.feed.marcarResposta(e, m.id, 'seguir', 'o jogo da cidade passa sozinho');
      const chave = `${e.data.ano}|${e.data.semana}|${e.data.dia}`;
      if (jogoDaCidadeDe === chave || jogamosHoje(e) || dia3d.ativo || dia3d.jogoNoFundoHoje) return;
      /* (a planta tem de estar na nossa praça, com a vida ligada: é dela que sai quem tem sede no mapa) */
      const nossa = nomeDaPraca(e.torcida.mapa);
      if (!nossa || !api.cenario || api.cenario.praca !== nossa || !vida.ligada) return;
      const meu = e.torcida.clubeId;
      const comSede = new Set((api.planta && api.planta.torcidas ? api.planta.torcidas() : []).filter(t => t.porta && t.clubeId).map(t => t.clubeId));
      const j = TO.praca.jogosDaPraca(e).filter(x => x.dia === e.data.dia && x.casa.id !== meu && x.vis.id !== meu && comSede.has(x.casa.id))[0];
      jogoDaCidadeDe = chave;
      if (j) dia3d.jogoNoFundo({ casa: j.casa, vis: j.vis, hora: j.hora || '16:00', comp: j.comp, estadio: j.casa.estadio || '' });
    } catch (err) { console.error('jogo 3D, os jogos da cidade:', err); }
  }
  /* o dia com jogo da cidade no fundo não é dia vazio (o relógio não pula ele) */
  vida.temJogoHoje = () => dia3d.jogoNoFundoHoje;
  TO.jogo3d = {
    get ritmo() { return ritmo; },
    palcoDe: (local, cfg) => vida.palcoDe(local, cfg),
    abrirMapa: () => mapa.alternar(),
    /* o primeiro item do menu lateral (no lugar do Feed): a câmera na sala
       do presidente, onde os recados chegam — no dia de jogo, no nosso bonde */
    irPraSala() {
      if (dia3d.ativo) { dia3d.verNossa(); return; }
      if (vida.ligada && vida.sede) vida.irPraSala(); else irPraSede();
    },
    vida, mapa, dia: dia3d, recados,
    /* (pro teste: a praça e a planta — os bares, as sedes) */
    get api() { return api; }
  };
  /* o relógio do dia na barra de cima, do lado da data */
  const relogio = document.createElement('div');
  relogio.id = 'j3dHora';
  relogio.title = 'A hora do dia na praça: o dia passa até acontecer alguma coisa';
  let horaVista = '';
  const pintarHora = () => {
    const quando = document.querySelector('.feed-barra .quando-txt');
    if (quando && relogio.parentElement !== quando.parentElement) quando.parentElement.insertBefore(relogio, quando);
    /* (com o dia de jogo no ar, a hora é a dele) */
    /* (o minuto cortado, como o painel do dia e a linha mostram) */
    const t = horaTxt(Math.floor((dia3d.hora != null ? dia3d.hora / 60 : vida.relogio.minuto) + 1e-6));
    if (t !== horaVista) { horaVista = t; relogio.textContent = t; }
  };

  /* o letreiro da praça atrás do menu */
  const letreiro = document.createElement('div');
  letreiro.id = 'j3dPraca';
  document.body.appendChild(letreiro);
  const pintarLetreiro = () => {
    const p = api.cenario && api.cenario.praca;
    letreiro.innerHTML = p ? `A praça de <b>${p.replace(/[&<>]/g, '')}</b>` : '';
  };
  api.pronta && api.pronta.then(pintarLetreiro, () => {});

  /* A PRAÇA É A DA TORCIDA: quando a partida abre (nova ou carregada), a
     cidade troca pra praça dela e a câmera voa até a porta da sede */
  let pracaDoJogo = null, pedida = null;
  /* o mapa do jogo ('sao-paulo') vira a praça da planta ('São Paulo') pelo slug (index.html, `pracaDe`) */
  const nomeDaPraca = mapa => {
    if (api.pracaDe) return api.pracaDe(mapa);
    const c = (TO.dados.cidades || []).find(x => x.id === mapa);
    return c && api.nomes.includes(c.nome) ? c.nome : null;
  };
  const irPraSede = () => {
    const e = E(), C = api.cenario;
    if (!e || !C) return;
    const porta = api.sedeDe(e.torcida.id);
    if (porta) C.voarPara(porta.x, porta.y, 70 * api.M, 0.78, Math.atan2(porta.fx, porta.fy) + Math.PI);
  };
  /* o aviso curto no canto (o mesmo das compras do jogo) */
  const avisar = txt => {
    const cx = document.getElementById('notificacoes');
    if (!cx) return;
    const n = document.createElement('div');
    const d = TO.estado && TO.estado.dataTexto ? TO.estado.dataTexto().curta : '';
    n.className = 'nota boa';
    n.innerHTML = (d ? `<small>${d}</small>` : '') + txt;
    cx.appendChild(n);
    setTimeout(() => n.remove(), 5200);
  };
  /* A PRAÇA DO JOGO COM VIDA: os bonecos carregados, a vida ligada na
     torcida do jogador e a câmera na sala do presidente (sem sede na
     praça, na calçada da porta). `barNovo`: o bar que a torcida acabou
     de abrir — a câmera passa na porta dele antes de ir pra sala */
  const ligarVida = async barNovo => {
    const e = E(), C = api.cenario;
    if (!e || !C || !C.vida) return;
    try { await C.vida.chamarPovo(); } catch (err) { console.error('jogo 3D: os bonecos não carregaram', err); }
    if (!vida.ligar(e.torcida.id)) { irPraSede(); return; }
    /* (o jogo que abriu no meio do dia: o jogo da cidade de hoje, no fundo) */
    agendarJogosDaCidade(e);
    if (barNovo && barNovo.porta) {
      /* a câmera na rua, de frente pra fachada (o letreiro "BAR DO ...") */
      const q = barNovo.porta;
      C.voarPara(q.x, q.y, 30 * api.M, 0.5, Math.atan2(q.fx, q.fy));
      avisar(`O bar novo da <b>${String(e.torcida.nome || '').replace(/[&<>]/g, '')}</b> abriu as portas.`);
      const este = barNovo;
      setTimeout(() => { if (este === barMostrado && vida.ligada && !pracaTravada && !dia3d.ativo) vida.irPraSala(); }, 5000);
      barMostrado = este;
      return;
    }
    /* a porta da sede, dali até a sala: a primeira vista é a sede de fora */
    if (vida.sede) {
      const c = vida.sede.caixa, porta = api.sedeDe(e.torcida.id);
      const az = porta ? Math.atan2(porta.fx, porta.fy) : C.orb.az;
      C.olhar((c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2, 40 * api.M, 0.9, az);
      setTimeout(() => vida.irPraSala(), 400);
    } else irPraSede();
  };
  /* OS BARES DO SAVE (conserto de 28/09/2026, o dono: "Eu comprei um bar
     no jogo e o mapa não atualizou com mais um bar pra minha torcida"):
     a praça punha um bar por torcida, o da tabela. Agora o número é o do
     jogo — o patrimônio do jogador e o mundo vivo da IA, que também
     compra. A praça remonta quando o do JOGADOR muda; o da IA entra na
     próxima montagem (remontar a cidade no meio do dia porque uma torcida
     da IA abriu um bar seria pesado, e sem motivo pra quem joga). Devolve
     se o do jogador mudou */
  const conferirBares = e => {
    if (!api.baresDoJogo) return false;
    const mundo = e.mundoTorcidas || {};
    for (const id in mundo) { const v = mundo[id]; if (v && Array.isArray(v.bares)) api.baresDoJogo(id, v.bares.length); }
    const p = TO.financeiro && TO.financeiro.patrimonio ? TO.financeiro.patrimonio(e) : e.patrimonio;
    return api.baresDoJogo(e.torcida.id, p && Array.isArray(p.bares) ? p.bares.length : 0, true);
  };
  const baresDoJogador = id => api.planta && api.planta.bares ? api.planta.bares().filter(b => b.dono === id) : [];
  let barMostrado = null;
  const conferirPraca = () => {
    const e = E();
    if (!e || !e.torcida || pracaTravada) return;
    /* com um painel aberto (a compra do bar, a obra da sede), a praça
       espera ele fechar: remontar escondida atrás dele, e a câmera passar
       no bar novo sem ninguém ver, não serve (o fechar chama de novo) */
    if (document.body.classList.contains('com-painel') && pracaDoJogo) return;
    const nome = nomeDaPraca(e.torcida.mapa);
    /* a sede da torcida do jogador é a do save (o nível dela), não a da tabela */
    const mudouNivel = api.nivelDoJogo ? api.nivelDoJogo(e.torcida.id, e.torcida.sedeNivel) : false;
    const mudouBares = conferirBares(e);
    const refazer = mudouNivel || mudouBares;
    if (!nome || (nome === pracaDoJogo && !refazer)) return;
    const C = api.cenario;
    /* os bares que ela tinha na praça: o que aparecer a mais é o novo */
    const tinha = mudouBares && C && C.praca === nome ? new Set(baresDoJogador(e.torcida.id).map(b => b.n)) : null;
    pracaDoJogo = nome;
    const vez = pedida = Symbol();
    vida.desligar();
    const ir = C && C.praca === nome && !refazer ? Promise.resolve() : api.abrirPraca(nome, refazer);
    /* (a montagem que outra cancelou no meio — o dia de jogo abrindo a
       praça de fora — não liga a vida: a praça na tela não é esta) */
    Promise.resolve(ir).then(() => {
      if (vez !== pedida || pracaTravada || !api.cenario || api.cenario.praca !== nome || api.cenario.montando) return;
      const novo = tinha ? baresDoJogador(e.torcida.id).find(b => !tinha.has(b.n)) : null;
      pintarLetreiro(); ligarVida(novo);
    }, () => {});
  };

  /* dentro da partida (a casca do jogo à mostra) ou no menu */
  const conferirTela = () => {
    const emJogo = !!jogo && !jogo.classList.contains('oculto');
    document.body.classList.toggle('j3d-em-jogo', emJogo);
    if (!emJogo && (dia3d.ativo || dia3d.montando)) dia3d.fechar();
    if (emJogo) conferirPraca();
    else if (vida.ligada) { vida.desligar(); pracaDoJogo = null; }
    if (!emJogo) mapa.fechar();
  };
  /* o quadro do jogo 3D: a hora da barra e os recados em balão */
  let tAntes = 0;
  const laco = t => {
    const dt = tAntes ? Math.min(0.25, Math.max(0, (t - tAntes) / 1000)) : 0.016;
    tAntes = t;
    if (vida.ligada || dia3d.hora != null) pintarHora();
    try { recados.quadro(dt); } catch (err) { console.error('jogo 3D, os recados:', err); }
    requestAnimationFrame(laco);
  };
  requestAnimationFrame(laco);
  if (jogo) new MutationObserver(conferirTela).observe(jogo, { attributes: true, attributeFilter: ['class'] });
  TO.estado.aoMudar(() => { conferirTela(); });
  /* A CIDADE PARA QUANDO ALGO A COBRE: um painel, uma cena de briga, o
     relatório, a escolha da torcida, um modal — o último quadro fica, e
     o processador fica com o jogo. No menu ela segue desenhando. */
  let tinhaPainel = false;
  const conferirCobertura = () => {
    /* o painel fechou: o que se comprou nele (um bar, a obra da sede) vai pra praça */
    const comPainel = document.body.classList.contains('com-painel');
    if (tinhaPainel && !comPainel) setTimeout(() => { if (!document.body.classList.contains('com-painel')) conferirPraca(); }, 0);
    tinhaPainel = comPainel;
    const C = api.cenario;
    if (!C || !C.pausar) return;
    /* a cena que roda na cidade (a reunião na sala da sede) não cobre nada:
       o palco dela é transparente */
    const palco = document.body.classList.contains('palco3d');
    const cobre = document.body.classList.contains('com-painel') || document.body.classList.contains('j3d-mapa-aberto') ||
      [...document.querySelectorAll('.tela-cheia:not(.oculto)')].some(el => el.id !== 'telaMenu' && !(palco && el.id === 'telaDiaJogo'));
    C.pausar(cobre);
  };
  new MutationObserver(conferirCobertura).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  conferirTela();
}
