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
     onde fica cada pedaço (a barra em cima, os ícones na esquerda, o
     feed numa coluna à direita que recolhe);
   - o boneco das cenas é o do cenário (bonecos3_global.js);
   - o que é da cidade: quando a partida começa (ou carrega), a praça
     vira a da torcida do jogador e a câmera voa até a porta da sede.
   ========================================================= */
import { CASCA } from './jogo_casca.js';
import { criarVida, horaTxt } from './vida3d.js';

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
  TO.jogo3d = {
    get ritmo() { return vida.ligada ? vida.ritmo : null; },
    palcoDe: (local, cfg) => vida.palcoDe(local, cfg),
    vida
  };
  /* o relógio do dia na barra de cima, do lado da data */
  const relogio = document.createElement('div');
  relogio.id = 'j3dHora';
  relogio.title = 'A hora do dia na praça: o dia passa até acontecer alguma coisa';
  let horaVista = '';
  const pintarHora = () => {
    const quando = document.querySelector('.feed-barra .quando-txt');
    if (quando && relogio.parentElement !== quando.parentElement) quando.parentElement.insertBefore(relogio, quando);
    const t = horaTxt(vida.relogio.minuto);
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

  /* o feed recolhe e abre pelo botão da borda; o número conta o que chegou
     enquanto ele estava fechado */
  const bt = document.createElement('button');
  bt.id = 'j3dFeed';
  bt.innerHTML = '<span class="seta"></span><span class="badge" hidden></span>';
  document.body.appendChild(bt);
  let fechado = false, vistos = 0;
  try { fechado = localStorage.getItem('jogo3d-feed') === 'fechado'; } catch (e) {}
  const contarFeed = () => { const e = E(); return e && e.feed ? e.feed.length : 0; };
  const pintarBotao = () => {
    document.body.classList.toggle('feed-fechado', fechado);
    bt.querySelector('.seta').textContent = fechado ? '◂' : '▸';
    bt.title = fechado ? 'Abrir o feed' : 'Recolher o feed (deixa só a cidade)';
    bt.setAttribute('aria-label', bt.title);
    const novos = fechado ? Math.max(0, contarFeed() - vistos) : 0;
    const b = bt.querySelector('.badge');
    b.hidden = !novos; b.textContent = novos > 99 ? '99+' : String(novos);
    if (!fechado) vistos = contarFeed();
  };
  bt.onclick = () => {
    fechado = !fechado;
    try { localStorage.setItem('jogo3d-feed', fechado ? 'fechado' : 'aberto'); } catch (e) {}
    pintarBotao();
  };
  pintarBotao();

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
    if (!e || !e.torcida) return;
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
    if (emJogo) conferirPraca();
    else if (vida.ligada) { vida.desligar(); pracaDoJogo = null; }
    pintarBotao();
  };
  /* o quadro do relógio (a hora da barra) */
  const laco = () => { if (vida.ligada) pintarHora(); requestAnimationFrame(laco); };
  requestAnimationFrame(laco);
  if (jogo) new MutationObserver(conferirTela).observe(jogo, { attributes: true, attributeFilter: ['class'] });
  TO.estado.aoMudar(() => { conferirTela(); });
  /* o feed que chega com o relógio (a fila que pinga) não passa pelo aoMudar */
  setInterval(pintarBotao, 1500);
  /* A CIDADE PARA QUANDO ALGO A COBRE: um painel, uma cena de briga, o
     relatório, a escolha da torcida, um modal — o último quadro fica, e
     o processador fica com o jogo. No menu ela segue desenhando. */
  const conferirCobertura = () => {
    const C = api.cenario;
    if (!C || !C.pausar) return;
    /* a cena que roda na cidade (a reunião na sala da sede) não cobre nada:
       o palco dela é transparente */
    const palco = document.body.classList.contains('palco3d');
    const cobre = document.body.classList.contains('com-painel') ||
      [...document.querySelectorAll('.tela-cheia:not(.oculto)')].some(el => el.id !== 'telaMenu' && !(palco && el.id === 'telaDiaJogo'));
    C.pausar(cobre);
  };
  new MutationObserver(conferirCobertura).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  conferirTela();
}
