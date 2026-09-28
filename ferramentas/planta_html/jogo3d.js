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
    caiu(e, m) { recados.chegou(e, m); if (vida.ligada) vida.ritmo.caiu(e, m); },
    virouDia(e) { if (vida.ligada) vida.ritmo.virouDia(e); }
  };
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
    vida, mapa, dia: dia3d, recados
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
    const t = dia3d.hora != null ? horaTxt(dia3d.hora / 60) : horaTxt(vida.relogio.minuto);
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
  const nomeDaPraca = mapa => {
    const c = (TO.dados.cidades || []).find(x => x.id === mapa);
    return c && api.nomes.includes(c.nome) ? c.nome : null;
  };
  const irPraSede = () => {
    const e = E(), C = api.cenario;
    if (!e || !C) return;
    const porta = api.sedeDe(e.torcida.id);
    if (porta) C.voarPara(porta.x, porta.y, 70 * api.M, 0.78, Math.atan2(porta.fx, porta.fy) + Math.PI);
  };
  /* A PRAÇA DO JOGO COM VIDA: os bonecos carregados, a vida ligada na
     torcida do jogador e a câmera na sala do presidente (sem sede na
     praça, na calçada da porta) */
  const ligarVida = async () => {
    const e = E(), C = api.cenario;
    if (!e || !C || !C.vida) return;
    try { await C.vida.chamarPovo(); } catch (err) { console.error('jogo 3D: os bonecos não carregaram', err); }
    if (!vida.ligar(e.torcida.id)) { irPraSede(); return; }
    /* a porta da sede, dali até a sala: a primeira vista é a sede de fora */
    if (vida.sede) {
      const c = vida.sede.caixa, porta = api.sedeDe(e.torcida.id);
      const az = porta ? Math.atan2(porta.fx, porta.fy) : C.orb.az;
      C.olhar((c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2, 40 * api.M, 0.9, az);
      setTimeout(() => vida.irPraSala(), 400);
    } else irPraSede();
  };
  const conferirPraca = () => {
    const e = E();
    if (!e || !e.torcida || pracaTravada) return;
    const nome = nomeDaPraca(e.torcida.mapa);
    /* a sede da torcida do jogador é a do save (o nível dela), não a da tabela */
    const mudouNivel = api.nivelDoJogo ? api.nivelDoJogo(e.torcida.id, e.torcida.sedeNivel) : false;
    if (!nome || (nome === pracaDoJogo && !mudouNivel)) return;
    pracaDoJogo = nome;
    const C = api.cenario;
    const vez = pedida = Symbol();
    vida.desligar();
    const ir = C && C.praca === nome && !mudouNivel ? Promise.resolve() : api.abrirPraca(nome, mudouNivel);
    Promise.resolve(ir).then(() => { if (vez === pedida) { pintarLetreiro(); ligarVida(); } }, () => {});
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
  const conferirCobertura = () => {
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
