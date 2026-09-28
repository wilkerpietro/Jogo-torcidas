/* =========================================================
   OS RECADOS EM BALÃO (o jogo 3D, 28/09/2026)

   O dono: "Exclua a exposição do feed na tela. As mensagens sempre vão
   ser via balões de alguém falando com o jogador."

   O feed saiu da tela do jogo 3D (o main.js não monta o rolo com
   `TO.semFeed`). A história das mensagens continua em `E.feed`, igual,
   e cada uma que cai chega ao jogador na boca de alguém:
   - NA SEDE: quem traz o recado senta na cadeira da frente da mesa do
     presidente (vida3d.js: o diretor, o olheiro, o repórter, o enviado
     de outra torcida) e o balão fica em cima da cabeça dele;
   - NO DIA DE JOGO (dia3d.js): o líder do nosso bonde, na rua ou na
     arquibancada — e o balão mostra a linha do dia (a parada de agora,
     os recados da parada com os botões, a partida);
   - sem quem fala na tela (a câmera noutro canto, a praça sem sede, a
     cidade montando), o balão encosta no alto, com o botão que leva a
     câmera até quem fala.
   UMA DE CADA VEZ, NENHUMA PERDIDA: as mensagens entram numa fila, na
   ordem em que caíram. A notícia fica o tempo de ler (pelo tamanho do
   texto; o mouse em cima segura, e um clique dentro prende até fechar) e
   sai sozinha; o × e o "Próximo" passam na hora. A decisão fica até ser
   respondida, sem ×. O relógio do jogo espera quem está falando (`espera`,
   pelo ritmo do jogo 3D): a mensagem seguinte só cai quando o balão
   acaba, então a fila não cresce sem fim. Painel, mapa, cena, reunião e
   modal escondem o balão e seguram a fila; fechou, ele volta de onde
   estava. A notícia de treta segue fora, como no feed (Notícias →
   Tretas). O que já foi ouvido fica no save (`E.ouvido3d`, a mais nova
   ouvida): carregar o jogo não repete recado, e decisão em aberto volta
   sempre.
   OS RECADOS DE OUTRAS TORCIDAS (Notícias → Mensagens: a provocação, o
   convite, o agradecimento, o pedido de casa, a trégua) também chegam
   assim: o enviado dela, com a camisa dela, senta na frente do
   presidente. O pedido de casa e a trégua vêm com os botões da resposta;
   sem resposta, eles seguem esperando em Notícias → Mensagens (não param
   o tempo, como no feed). O que foi entregue fica lido. Eles esperam a
   vez: as mensagens da nossa torcida passam na frente.
   ========================================================= */
import { areaLivre } from './vida3d.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* entre um recado e o próximo: quem falou levanta, o outro chega (s) */
const FOLGA = 0.45;
/* a decisão respondida fica no ar com a resposta (s) */
const RESPONDIDA = 2.5;
/* a partida que acabou fica com a linha do dia fechada (s) */
const FIM_DO_DIA = 5;

/* `api`: o do jogo 3D (cenario, M); `vida`: a vida da praça (vida3d.js,
   quem senta na frente do presidente); `dia3d`: o dia de jogo (quem fala
   é o líder do nosso bonde) */
export function criarRecados(api, vida, dia3d) {
  const M = api.M;
  const C = () => api.cenario;
  const E = () => TO.estado && TO.estado.E;
  const vel = () => (TO.diaJogo && TO.diaJogo.ponte && TO.diaJogo.ponte.velocidade) || 1;

  /* a fila: as mensagens esperando (os objetos de E.feed e de E.mensagens,
     os recados de outras torcidas), a mais velha primeiro. Os dois nascem
     do mesmo contador (`feedSeq`): o id não se repete entre eles */
  let eVisto = null, topo = null, topoCaixa = null, fila = [], naFila = new Set();
  const daCaixa = new WeakSet();
  const ehCaixa = m => daCaixa.has(m);
  const pedeResposta = m => !!(TO.tela && TO.tela.recadoPedeResposta && TO.tela.recadoPedeResposta(m));
  /* o recado no ar: a mensagem, a chave do cartão desenhado, quanto já foi
     lido e quanto ele fica (Infinity: até responder, ou até a linha do dia fechar) */
  let atual = null, chave = null, lido = 0, lim = Infinity, fixo = false, preso = false, voltarFechando = false, sumiu = false, mexeuEm = 0, confirmando = false;
  let folga = 0, tDecisao = 0, tSentar = 0, ancorado = 0, cAncora = null, desligarAncora = null;
  const mostrados = [];
  let balao = null, corpo = null, pe = null, maisEl = null, proxBt = null, xBt = null, irBt = null, tempoEl = null, tempoBar = null;

  function montar() {
    if (balao) return;
    balao = document.createElement('div');
    balao.className = 'j3d-balao'; balao.hidden = true;
    balao.setAttribute('role', 'dialog'); balao.setAttribute('aria-live', 'polite');
    balao.innerHTML = '<button class="j3d-balao-x" title="Fechar o recado" aria-label="Fechar o recado">×</button>' +
      '<div class="j3d-balao-corpo"></div>' +
      '<i class="j3d-balao-tempo"><b></b></i>' +
      '<div class="j3d-balao-pe" hidden><span class="j3d-balao-mais"></span><button class="j3d-balao-prox">Próximo ▸</button></div>' +
      '<button class="j3d-balao-ir" hidden>Ir pra sala do presidente</button>';
    document.body.appendChild(balao);
    corpo = balao.querySelector('.j3d-balao-corpo');
    pe = balao.querySelector('.j3d-balao-pe');
    maisEl = balao.querySelector('.j3d-balao-mais');
    proxBt = balao.querySelector('.j3d-balao-prox');
    xBt = balao.querySelector('.j3d-balao-x');
    irBt = balao.querySelector('.j3d-balao-ir');
    tempoEl = balao.querySelector('.j3d-balao-tempo');
    tempoBar = tempoEl.querySelector('b');
    xBt.onclick = () => { if (atual && !fixo) fechar(); };
    proxBt.onclick = () => { if (atual && !fixo) fechar(); };
    irBt.onclick = () => { if (dia3d.ativo) dia3d.verNossa(); else vida.irPraSala(); };
    /* quem clica dentro está lendo (abriu o jornal, a aba do plano): o
       recado fica até fechar */
    balao.addEventListener('pointerdown', ev => {
      if (ev.target.closest('.j3d-balao-x, .j3d-balao-prox, .j3d-balao-ir')) return;
      if (atual && !fixo) preso = true;
    });
    /* O MOUSE EM CIMA SEGURA A LEITURA — mas só o mouse que se mexe em
       cima do balão (4 s parado, a leitura volta a correr): o balão que
       nasce debaixo de um cursor parado (o do "Começar partida", no meio da
       tela) e o que acabou de ser respondido com o mouse em cima (o cursor
       fica no botão) ficavam presos pra sempre */
    balao.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse') mexeuEm = performance.now(); });
    balao.addEventListener('pointerleave', () => { mexeuEm = 0; });
  }

  /* ======================================================
     A FILA
     ====================================================== */
  const pendente = m => !ehCaixa(m) && m.peso === 'decisao' && !m.respondido;
  const pairando = () => !!mexeuEm && performance.now() - mexeuEm < 4000;
  /* o tempo de ler uma notícia: pelo tamanho do texto, e mais um tanto
     se ela traz tabela (o olheiro, a presença, a página do jornal) */
  function leitura(m) {
    const txt = String(m.texto || '').replace(/<[^>]+>/g, '');
    const d = m.dados || {};
    const tabela = !ehCaixa(m) && ((d.tabela && d.tabela.length) || (d.presenca && d.presenca.length) || d.pagina || m.kind === 'rodada' || m.kind === 'semana');
    /* (o pedido de casa e a trégua, com os botões: mais um tanto) */
    return (clamp(3 + txt.length / 30 + (tabela ? 3 : 0), 4, 11) + (pedeResposta(m) ? 4 : 0)) / (vel() > 1 ? 1.4 : 1);
  }
  function por(m, frente) {
    /* a notícia de treta não passa pelo feed (vai pra Notícias → Tretas) */
    if (!m || m.kind === 'confronto' || naFila.has(m.id)) return;
    naFila.add(m.id);
    if (frente) fila.unshift(m); else fila.push(m);
  }
  /* o recado de outra torcida que chegou (a caixa também recebe por cima) */
  function olharCaixa(e) {
    const cx = e.mensagens || [];
    if (!cx.length || cx[0] === topoCaixa) return;
    const novos = [];
    for (const m of cx) { if (m === topoCaixa || novos.length > 60) break; if (!m.lida) novos.push(m); }
    topoCaixa = cx[0];
    for (let k = novos.length - 1; k >= 0; k--) { daCaixa.add(novos[k]); por(novos[k]); }
  }
  /* o que caiu desde a última olhada: tudo o que está acima do topo de
     antes (a mensagem nova entra sempre por cima, em `E.feed`) */
  function olhar(e) {
    const feed = e.feed || [];
    if (!feed.length || feed[0] === topo) return;
    const novos = [];
    for (const m of feed) { if (m === topo || novos.length > 400) break; novos.push(m); }
    topo = feed[0];
    for (let k = novos.length - 1; k >= 0; k--) por(novos[k]);
  }
  /* a decisão em aberto segura o relógio: se ela não está na fila (um save
     antigo, uma que escapou), entra na frente */
  function conferirDecisoes(e) {
    for (const m of e.feed || []) if (pendente(m) && !naFila.has(m.id)) por(m, true);
  }
  /* o save novo (jogo novo, carregado): a fila recomeça do que não foi
     ouvido — acima da marca do save; sem marca (jogo novo, save de antes
     dos balões), as de hoje — e das decisões em aberto */
  function iniciar(e) {
    largar();
    eVisto = e; fila = []; naFila = new Set(); folga = 0;
    const feed = e.feed || [], cx = e.mensagens || [], hoje = (e.data && e.data.absoluto) || 0;
    topo = feed[0] || null; topoCaixa = cx[0] || null;
    const i = e.ouvido3d != null ? feed.findIndex(m => m.id === e.ouvido3d) : -1;
    let novos = [];
    if (i >= 0) novos = feed.slice(0, i);
    else for (const m of feed) { if (!m.quando || m.quando.abs !== hoje) break; novos.push(m); }
    /* os recados de outras torcidas de hoje que ninguém leu */
    for (const m of cx) { if (!m.quando || m.quando.abs !== hoje) break; if (!m.lida) { daCaixa.add(m); novos.push(m); } }
    novos.sort((a, b) => (+a.id || 0) - (+b.id || 0));
    for (const m of novos) por(m);
    conferirDecisoes(e);
  }
  /* a marca do save: a mais nova ouvida (quanto mais perto do topo, mais nova) */
  function ouvido(m) {
    const e = E();
    if (!e) return;
    /* o recado de outra torcida entregue fica lido (o que pede resposta e
       ficou sem ela segue esperando em Notícias → Mensagens) */
    if (ehCaixa(m)) {
      if (!pedeResposta(m) && !m.lida) { m.lida = true; if (TO.tela.atualizarBadges) TO.tela.atualizarBadges(); }
      return;
    }
    if (!e.feed) return;
    const i = e.feed.indexOf(m);
    if (i < 0) return;
    const j = e.ouvido3d != null ? e.feed.findIndex(x => x.id === e.ouvido3d) : -1;
    if (j < 0 || i < j) e.ouvido3d = m.id;
  }

  /* ======================================================
     O RECADO NO AR
     ====================================================== */
  /* o balão só aparece com a cidade à vista: sem painel, mapa, cena,
     reunião, modal ou a pergunta de onde a caravana desce */
  function podeMostrar() {
    const b = document.body.classList;
    if (!b.contains('j3d-em-jogo') || b.contains('em-cena') || b.contains('palco-briga') || b.contains('palco3d') ||
        b.contains('com-painel') || b.contains('j3d-mapa-aberto') || vida.reuniao) return false;
    if (document.querySelector('.j3d-dia-modal, .tela-cheia:not(.oculto):not(#telaMenu)')) return false;
    return true;
  }
  const estadoSeguro = (e, m) => { try { return TO.tela && TO.tela.estadoDaMsg ? TO.tela.estadoDaMsg(e, m) : ''; } catch (err) { return 'erro'; } };
  const chaveDe = (e, m) => ehCaixa(m) ? 'cx|' + (m.resposta || '') + '|' + (m.lida ? 'l' : '')
    : estadoSeguro(e, m) + '|' + (m.respondido ? 'r' : '');
  function mostrar(m) {
    montar();
    atual = m; chave = null; lido = 0; lim = Infinity; fixo = false; preso = false; voltarFechando = false; sumiu = false; confirmando = false; tSentar = 0;
    mostrados.push({ id: m.id, kind: ehCaixa(m) ? 'recado-' + (m.tipo || 'torcida') : m.kind, peso: m.peso || 'info' });
    if (mostrados.length > 300) mostrados.shift();
    sentar();
  }
  /* quem traz: na sede, alguém senta na frente do presidente (no dia de
     jogo quem fala é o líder do bonde, que já está na rua) */
  function sentar() {
    if (!atual || dia3d.ativo || !vida.ligada || vida.reuniao) return;
    const r = vida.recado;
    if (r && r.msg === atual.id) return;
    /* o recado de outra torcida: o enviado dela, com a camisa dela */
    vida.sentarRecado(ehCaixa(atual) ? { id: atual.id, voz: 'torcida', kind: 'recado-torcida', dados: { de: atual.de } } : atual);
  }
  /* o cartão: o mesmo do feed, com os botões que respondem; com a linha
     do dia andando, só a linha (a parada, os recados dela, a partida) */
  /* O CARTÃO QUE NÃO SE DESENHA NÃO TRAVA A FILA: um erro ao montar o
     cartão (um save antigo, um anexo que falta) vira um cartão simples —
     o texto e, na decisão, os botões dela, que respondem pelo mesmo caminho
     do clique —, e o erro vai pro console com a chave da mensagem */
  function cartaoSimples(e, m, err) {
    console.error('os recados: o cartão não montou', m && (m.kind || m.tipo), m && (m.chave || m.id), err);
    const art = document.createElement('article');
    art.className = 'msg';
    art.innerHTML = `<div class="msg-cab"><span class="msg-voz">${esc(ehCaixa(m) ? (m.nome || 'Recado') : 'Recado')}</span></div><p class="msg-txt">${esc(String(m.texto || '').replace(/<[^>]+>/g, ''))}</p>`;
    if (!ehCaixa(m) && pendente(m) && (m.botoes || []).length) {
      const bs = document.createElement('div');
      bs.className = 'msg-bts';
      for (const b of m.botoes) {
        const bt = document.createElement('button');
        bt.className = 'bt'; bt.textContent = b.rot || b.id;
        bt.onclick = () => { try { TO.tela.responderMensagem(m.id, b.id); } catch (e2) { console.error(e2); } };
        bs.appendChild(bt);
      }
      art.appendChild(bs);
    }
    return art;
  }
  function pintar(e, k) {
    try { pintar0(e, k); }
    catch (err) {
      corpo.innerHTML = '';
      corpo.appendChild(cartaoSimples(e, atual, err));
      fixo = pendente(atual); xBt.hidden = fixo;
      if (fixo) lim = Infinity; else if (lim === Infinity) { lido = 0; lim = leitura(atual); }
    }
  }
  function pintar0(e, k) {
    const m = atual, primeira = chave === null, eraFixo = fixo;
    chave = k; sumiu = false;
    corpo.innerHTML = '';
    const linha = !ehCaixa(m) && k.startsWith('itn|') && TO.tela.linhaDoDia ? TO.tela.linhaDoDia(m) : null;
    if (ehCaixa(m)) {
      corpo.appendChild(TO.tela.cartaoRecadoDeTorcida(e, m));
    } else if (linha) {
      corpo.insertAdjacentHTML('beforeend', `<div class="j3d-balao-quem">${esc(dia3d.ativo ? 'O nosso bonde · o dia de jogo' : 'O dia de jogo')}</div>`);
      corpo.appendChild(linha);
    } else {
      if (m.hora) corpo.insertAdjacentHTML('beforeend', `<div class="j3d-balao-hora">${esc(m.hora)}</div>`);
      corpo.appendChild(TO.tela.cartaoMensagem(e, m));
    }
    fixo = pendente(m) || !!linha;
    balao.classList.toggle('decisao', pendente(m));
    balao.classList.toggle('linha', !!linha);
    xBt.hidden = fixo;
    if (fixo) lim = Infinity;
    else if (ehCaixa(m)) {
      /* respondido agora (o pedido de casa, a trégua): fica um pouco com a resposta */
      if (primeira) { lido = 0; lim = leitura(m); confirmando = false; }
      else if (m.resposta && k.split('|')[1]) { lido = 0; preso = false; lim = RESPONDIDA; confirmando = true; }
    }
    else if (primeira || lim === Infinity) {
      /* respondida agora (ou a linha do dia fechou): fica um pouco com a resposta */
      lido = 0; preso = false;
      confirmando = !primeira && eraFixo;
      lim = primeira ? leitura(m) : eraFixo ? (m.kind === 'partida' ? FIM_DO_DIA : RESPONDIDA) : leitura(m);
    }
  }
  function exibir() {
    if (!balao.hidden) return;
    balao.hidden = false;
    registrarAncora();
    ancorar();
  }
  function esconder() {
    if (balao && !balao.hidden) balao.hidden = true;
    if (desligarAncora) { desligarAncora(); desligarAncora = null; cAncora = null; }
  }
  /* tira o recado do ar (sem marcar ouvido) */
  function largar() {
    if (atual) naFila.delete(atual.id);
    const tinha = !!atual;
    atual = null; chave = null; lido = 0; lim = Infinity; fixo = false; preso = false; voltarFechando = false; sumiu = false; confirmando = false;
    esconder();
    if (tinha) vida.soltarRecado();
  }
  /* o recado acabou: ouvido, quem falou vai embora, e o relógio refaz a
     conta de quanto esperar (a leitura pode ter sido mais curta que o previsto) */
  function fechar() {
    if (atual) ouvido(atual);
    largar();
    folga = FOLGA;
    cutucarRelogio();
  }
  function cutucarRelogio() {
    const T = TO.tela;
    if (!T || !T.pausarTempo || !T.retomarTempo) return;
    try { T.pausarTempo('recado'); T.retomarTempo('recado'); } catch (err) { console.error('os recados, o relógio:', err); }
  }

  /* ======================================================
     ONDE O BALÃO FICA: em cima de quem fala, ou no alto
     ====================================================== */
  const PQ = {}, PP = {};
  function registrarAncora() {
    const Cn = C();
    if (desligarAncora && cAncora === Cn) return;
    if (desligarAncora) desligarAncora();
    cAncora = Cn; desligarAncora = Cn && Cn.vida && Cn.vida.aCadaQuadro ? Cn.vida.aCadaQuadro(ancorar) : null;
  }
  function ancorar() {
    if (!balao || balao.hidden || !atual) return;
    ancorado = performance.now();
    const Cn = C(), A = areaLivre(), larg = balao.offsetWidth || 340, alto = balao.offsetHeight || 140;
    let alvo = null, volta = null, x = null, y = null;
    if (dia3d.ativo) { alvo = dia3d.falante; volta = 'Ver a nossa torcida'; }
    else if (vida.ligada) {
      const r = vida.recado;
      if (r && r.msg === atual.id) alvo = { x: r.d.x, y: (r.d.alt || 0) + 1.45 * M, z: r.d.y };
      if (vida.sede) volta = 'Ir pra sala do presidente';
    }
    if (alvo && Cn && Cn.vida) {
      const q = Cn.vida.projetar(alvo.x, alvo.y, alvo.z, PQ);
      if (q.frente && q.x > A.x0 + 10 && q.x < A.x1 - 10 && q.y > 70 && q.y < innerHeight - 20) { x = q.x; y = q.y; }
    }
    if (x == null) {
      /* quem fala fora da tela: o balão encosta no alto, com o botão que leva a câmera até ele */
      balao.classList.add('solto');
      irBt.hidden = !volta;
      if (volta && irBt.textContent !== volta) irBt.textContent = volta;
      balao.style.left = Math.round(clamp(A.meio - larg / 2, A.x0 + 8, Math.max(A.x0 + 8, A.x1 - larg - 8))) + 'px';
      balao.style.top = '92px';
      return;
    }
    balao.classList.remove('solto'); irBt.hidden = true;
    /* O PRESIDENTE À VISTA: o balão abre pro lado contrário ao dele (o rabo
       fica na cabeça de quem fala, perto da ponta do balão) */
    let meio = x;
    const pres = !dia3d.ativo && vida.ligada ? vida.presidente : null;
    if (pres && Cn) {
      const qp = Cn.vida.projetar(pres.x, (pres.alt || 0) + 1.2 * M, pres.y, PP);
      if (qp.frente && Math.abs(qp.x - x) < larg * 0.6 && qp.y < y + 40) meio = qp.x >= x ? x - larg / 2 + 34 : x + larg / 2 - 34;
    }
    const left = clamp(meio - larg / 2, A.x0 + 8, Math.max(A.x0 + 8, A.x1 - larg - 8));
    const top = Math.max(70, y - alto - 14);
    balao.style.left = Math.round(left) + 'px'; balao.style.top = Math.round(top) + 'px';
    balao.style.setProperty('--rabo', Math.round(clamp(x - left, 16, larg - 16)) + 'px');
  }
  /* o pé: quantos esperam, o "Próximo" e a régua do tempo de leitura */
  function pintarPe() {
    const n = fila.length;
    const txt = n ? `+${n} ${n > 1 ? 'recados esperando' : 'recado esperando'}` : '';
    if (maisEl.textContent !== txt) maisEl.textContent = txt;
    const prox = !fixo && n > 0;
    if (proxBt.hidden === prox) proxBt.hidden = !prox;
    if (pe.hidden === !!n) pe.hidden = !n;
    const corre = lim !== Infinity;
    if (tempoEl.hidden === corre) tempoEl.hidden = !corre;
    if (corre) tempoBar.style.transform = `scaleX(${clamp(1 - lido / lim, 0, 1).toFixed(3)})`;
    balao.classList.toggle('preso', preso);
  }

  /* ======================================================
     O QUADRO (o laço do jogo 3D, a cada quadro da tela)
     ====================================================== */
  function quadro(dt) {
    const e = E();
    if (!e || !TO.tela || !TO.tela.cartaoMensagem) { esconder(); return; }
    montar();
    if (e !== eVisto) iniciar(e);
    olhar(e);
    olharCaixa(e);
    tDecisao += dt;
    if (tDecisao > 0.5) { tDecisao = 0; conferirDecisoes(e); }
    const pode = podeMostrar();
    /* A LINHA DO DIA DE JOGO PASSA NA FRENTE: com ela andando (os recados
       das brigas do dia, a partida), o que estava no balão volta pra fila
       — sem contar como ouvido — e ela entra */
    const ml = TO.tela.msgDaLinha ? TO.tela.msgDaLinha() : null;
    if (ml && ml !== atual) {
      const antes = atual;
      if (antes) { largar(); naFila.add(antes.id); fila.unshift(antes); }
      const i = fila.indexOf(ml);
      if (i >= 0) fila.splice(i, 1);
      naFila.add(ml.id);
      mostrar(ml);
    }
    if (!atual) {
      /* o recado de outra torcida que o jogador já leu em Notícias → Mensagens não vem mais */
      while (fila.length && ehCaixa(fila[0]) && fila[0].lida) naFila.delete(fila.shift().id);
      if (folga > 0) folga -= dt;
      else if (fila.length && pode) {
        /* A DECISÃO EM ABERTO VEM PRIMEIRO (ela segura o relógio: esperar
           atrás de notícia é o jogo parado sem nada pra responder); depois o
           que é da nossa torcida (as mensagens do jogo); o recado de outra
           torcida espera a vez dele */
        let i = fila.findIndex(pendente);
        if (i < 0) i = fila.findIndex(m => !ehCaixa(m));
        mostrar(fila.splice(i >= 0 ? i : 0, 1)[0]);
      }
    }
    if (!atual) { esconder(); return; }
    const k = chaveDe(e, atual);
    if (!pode) {
      /* (o recado de outra torcida lido no painel de Mensagens não volta) */
      if (chave !== null && ehCaixa(atual) && atual.lida) voltarFechando = true;
      if (chave !== null) sumiu = true;
      esconder();
      return;
    }
    /* respondida por trás (a reunião encerrada, a tela do ataque
       confirmada): quando a cidade volta, ela já saiu */
    if (!voltarFechando && sumiu && k !== chave && fixo && !pendente(atual) && !k.startsWith('itn|')) voltarFechando = true;
    if (voltarFechando) { fechar(); return; }
    if (k !== chave) pintar(e, k);
    exibir();
    /* quem traz o recado senta (a praça pode ter acabado de montar) */
    tSentar += dt;
    if (tSentar > 1) { tSentar = 0; sentar(); }
    /* com uma decisão esperando na fila, a notícia no ar sai logo (mais um
       segundo e meio de leitura, no máximo) — a decisão é que segura o jogo */
    if (!fixo && lim !== Infinity && !preso && fila.some(pendente)) lim = Math.min(lim, lido + 1.5);
    if (lim !== Infinity) {
      if (confirmando || (!preso && !pairando())) lido += dt;
      if (lido >= lim) { fechar(); return; }
    }
    pintarPe();
    /* com a cidade parada (montando a praça) o quadro dela não ancora */
    if (performance.now() - ancorado > 80) ancorar();
  }

  /* QUANTO O RELÓGIO ESPERA (ms a 1×; o relógio divide pela velocidade):
     o que falta do recado no ar e o tempo de ler cada um da fila. Lendo
     preso (o mouse em cima, o clique dentro), a espera é longa — ao
     fechar, o relógio é cutucado e refaz a conta */
  function espera() {
    try {
      if (!atual && !fila.length) return 0;
      if (!confirmando && (preso || pairando())) return 60000;
      let s = Math.max(0, folga);
      if (atual && lim !== Infinity) s += Math.max(0, lim - lido);
      for (const m of fila) s += (pendente(m) ? 0 : leitura(m)) + FOLGA;
      return Math.min(60000, s * 1000 * vel());
    } catch (err) { return 0; }
  }
  /* a mensagem que acabou de cair (o ritmo do jogo 3D avisa): entra na
     fila na hora, pra `espera` já contar com ela */
  function chegou(e) {
    if (e && e === eVisto) { olhar(e); olharCaixa(e); }
  }

  /* A DECISÃO EM ABERTO NA TELA, JÁ (o ≫ com o tempo parado chama): a
     notícia no ar volta pra fila e a decisão entra; devolve o que impede o
     balão de aparecer, se houver */
  function trazerDecisao() {
    const e = E();
    if (!e || !e.feed) return 'sem jogo';
    const d = e.feed.find(pendente);
    if (!d) return 'nada em aberto';
    if (e !== eVisto) iniciar(e);
    if (atual !== d) {
      const antes = atual;
      if (antes) { largar(); if (!ouvidoJa(antes)) { naFila.add(antes.id); fila.unshift(antes); } }
      const i = fila.indexOf(d);
      if (i >= 0) fila.splice(i, 1);
      naFila.add(d.id);
      folga = 0;
      mostrar(d);
    }
    if (!podeMostrar()) {
      const b = document.body.classList;
      return b.contains('com-painel') ? 'painel aberto' : b.contains('em-cena') || b.contains('palco-briga') ? 'cena aberta' : b.contains('palco3d') ? 'reunião' : 'tela por cima';
    }
    return '';
  }
  const ouvidoJa = m => ehCaixa(m) && m.lida;

  return {
    quadro, espera, chegou, trazerDecisao,
    /* pro teste */
    get estado() {
      return { atual: atual && { id: atual.id, kind: ehCaixa(atual) ? 'recado-' + (atual.tipo || 'torcida') : atual.kind, peso: atual.peso || 'info', caixa: ehCaixa(atual) }, fila: fila.map(m => m.id), visivel: !!(balao && !balao.hidden),
               solto: !!(balao && balao.classList.contains('solto')), fixo, preso, lido: +lido.toFixed(2), lim: lim === Infinity ? null : +lim.toFixed(2),
               ouvido: E() ? E().ouvido3d : null, mostrados: mostrados.slice(-60), quemFala: dia3d.ativo ? 'bonde' : vida.recado ? 'sede' : null };
    },
    get balao() { return balao; }
  };
}
