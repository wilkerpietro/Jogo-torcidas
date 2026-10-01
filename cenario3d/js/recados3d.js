/* =========================================================
   OS RECADOS NO JOGO 3D: A DECISÃO EM BALÃO, O RESTO EM AVISO (28/09/2026)

   O dono, primeiro: "Exclua a exposição do feed na tela. As mensagens
   sempre vão ser via balões de alguém falando com o jogador." Depois,
   jogando: "os recados não devem aparecer na tela, devem ficar somente
   no notícias>mensagens e as mensagens que não geram botões de decisão
   se tornam avisos do lado direito, na ideia do que era o feed
   anteriormente, mas somem rapidamente."

   O feed saiu da tela do jogo 3D (o main.js não monta o rolo com
   `TO.semFeed`). A história das mensagens continua em `E.feed`, igual
   (Notícias → Arquivo do feed mostra tudo), e cada uma que cai chega ao
   jogador assim:
   - A DECISÃO (a mensagem com botões que pedem resposta): no balão, na
     boca de alguém — na sede, quem traz o recado senta na cadeira da
     frente da mesa do presidente (vida3d.js: o diretor, o olheiro, o
     repórter) e o balão fica em cima da cabeça dele; sem quem fala na
     tela (a câmera noutro canto, a praça sem sede), o balão encosta no
     alto, com o botão que leva a câmera até ele. A decisão fica até ser
     respondida (o relógio do jogo espera por ela, como no feed);
   - A MANCHETE DE JORNAL (29/09/2026; o dono: "As mensagens de jornal que
     devem aparecer no canto direito são as do Gazeta dos sports e futebol
     e porrada, com o layout de manchete de jornal, com aquele padrão que
     existia no feed"): um AVISO no lado direito da tela, o recorte do
     feed em versão compacta — o nome do jornal, o chapéu, a manchete, o
     olho e, na Gazeta, o placar —, só da Gazeta dos Sports (a rodada) e do
     Futebol e Porrada (a treta nossa, a LNT, a obra). Some sozinho em uns
     oito segundos (o mouse em cima segura; um toque abre o cartão inteiro,
     com a tabela, o jornal completo e os links, e ele fica até o ×). Só
     dois de cada vez: numa rajada ficam a treta nossa, depois a Gazeta,
     depois o resto. O relógio NÃO espera aviso: as horas correm até a
     próxima decisão. O resto do que não pede decisão (status, dica,
     aniversário, o olheiro...) não aparece: fica em Notícias, no arquivo
     do feed;
   - OS RECADOS DE OUTRAS TORCIDAS (a provocação, o convite, o pedido de
     casa, a trégua): não aparecem na tela. Ficam em Notícias → Mensagens,
     com o número vermelho no ícone (main.js), e os que pedem resposta
     esperam lá, sem parar o tempo, como no feed;
   - O DIA DE JOGO (dia3d.js): a linha do dia não ocupa mais a tela — o
     placar de TV e a faixa das fases (dia3d.js) contam o dia —, e o
     balão só aparece com uma decisão da linha (o ataque que a gente
     sofre, a investida, a invasão, onde a caravana desce), no alto,
     embaixo do placar; respondida, o saldo fica uns segundos e ele sai.
   UMA DECISÃO DE CADA VEZ: elas entram numa fila, na ordem em que caíram.
   Painel, mapa, cena, reunião e modal escondem o balão e seguram a fila;
   fechou, ele volta de onde estava. A treta nossa sai no recorte do Futebol
   e Porrada (e segue em Notícias → Tretas). O que já foi ouvido fica no save
   (`E.ouvido3d`, a mais nova ouvida): carregar o jogo não repete recado,
   e decisão em aberto volta sempre.
   ========================================================= */
import { areaLivre } from './vida3d.js?v=7abc65768a';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* entre uma decisão e a próxima: quem falou levanta, o outro chega (s) */
const FOLGA = 0.45;
/* a decisão respondida fica no ar com a resposta (s) */
const RESPONDIDA = 2.5;
/* o aviso: quanto fica na tela (s, a 1×) e quantos cabem na pilha */
const AVISO_S = 4.2, AVISOS_MAX = 4;
/* o recorte de jornal pede mais leitura que o aviso (s, a 1×) e só cabem
   dois de cada vez: o dia da praça passa em 3,6 s, e vêm rajadas */
const RECORTE_S = 7.5, RECORTES_MAX = 2;
/* o aviso pago do olheiro (é o que o expediente de Inteligência compra):
   fica mais que o aviso comum — é o ataque que vem, e ele é pago (s, a 1×) */
const OLHEIRO_S = 10;
/* o saldo de um recado da linha do dia (a briga que passou) fica esse tanto (s) */
const SALDO_S = 3.2;

/* `api`: o do jogo 3D (cenario, M); `vida`: a vida da praça (vida3d.js,
   quem senta na frente do presidente); `dia3d`: o dia de jogo */
export function criarRecados(api, vida, dia3d) {
  const M = api.M;
  const C = () => api.cenario;
  const E = () => TO.estado && TO.estado.E;
  const vel = () => (TO.diaJogo && TO.diaJogo.ponte && TO.diaJogo.ponte.velocidade) || 1;

  /* a fila: as decisões esperando a vez do balão, a mais velha primeiro */
  let eVisto = null, topo = null, fila = [], naFila = new Set();
  /* o recado no ar: a mensagem, a chave do cartão desenhado, quanto já foi
     lido e quanto ele fica (Infinity: até responder, ou até a linha do dia fechar) */
  let atual = null, chave = null, lido = 0, lim = Infinity, fixo = false, preso = false, voltarFechando = false, sumiu = false, mexeuEm = 0, confirmando = false, eraLinha = false;
  let folga = 0, tDecisao = 0, tSentar = 0, ancorado = 0, cAncora = null, desligarAncora = null;
  const mostrados = [];
  let balao = null, corpo = null, pe = null, maisEl = null, proxBt = null, xBt = null, irBt = null, tempoEl = null, tempoBar = null;
  /* os avisos do lado direito */
  let pilha = null, tAviso = 0;
  const avisos = [], avisados = [];
  /* quando o saldo de cada cartão da linha do dia apareceu */
  const saldoVisto = new WeakMap();

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
    /* quem clica dentro está lendo: o recado fica até fechar */
    balao.addEventListener('pointerdown', ev => {
      if (ev.target.closest('.j3d-balao-x, .j3d-balao-prox, .j3d-balao-ir')) return;
      if (atual && !fixo) preso = true;
    });
    /* o mouse que se mexe em cima segura a leitura (4 s parado, ela volta a correr) */
    balao.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse') mexeuEm = performance.now(); });
    balao.addEventListener('pointerleave', () => { mexeuEm = 0; });
    pilha = document.createElement('div');
    pilha.className = 'j3d-avisos';
    pilha.setAttribute('aria-live', 'polite');
    document.body.appendChild(pilha);
  }

  /* ======================================================
     A FILA DAS DECISÕES
     ====================================================== */
  const pendente = m => !!m && m.peso === 'decisao' && !m.respondido;
  const pairando = () => !!mexeuEm && performance.now() - mexeuEm < 4000;
  /* o tempo de ler o que não pede resposta no balão (a decisão que já veio respondida) */
  const leitura = m => clamp(3 + String(m.texto || '').replace(/<[^>]+>/g, '').length / 30, 4, 9) / (vel() > 1 ? 1.4 : 1);
  function por(m, frente) {
    if (!m || naFila.has(m.id)) return;
    naFila.add(m.id);
    if (frente) fila.unshift(m); else fila.push(m);
  }
  /* o que caiu desde a última olhada (a mensagem nova entra sempre por cima,
     em `E.feed`): a decisão vai pra fila do balão, a manchete de jornal
     vira recorte no canto (a treta nossa também: `dropar`, feed.js, põe
     ela em `E.feed` como as outras, só o rolo do feed é que a esconde) */
  function olhar(e) {
    const feed = e.feed || [];
    if (!feed.length || feed[0] === topo) return;
    const novos = [];
    for (const m of feed) { if (m === topo || novos.length > 400) break; novos.push(m); }
    topo = feed[0];
    /* (uma rajada, a de um dia inteiro que caiu de uma vez: só os recortes mais importantes viram aviso; no empate, os mais novos) */
    const cabem = novos.filter(m => ehJornal(m) && !pendente(m)).sort((a, b) => pesoDoJornal(a) - pesoDoJornal(b)).slice(0, RECORTES_MAX);
    for (let k = novos.length - 1; k >= 0; k--) chegouUma(e, novos[k], cabem.includes(novos[k]) || ehOlheiro(novos[k]));
  }
  function chegouUma(e, m, avisa) {
    if (!m) return;
    if (pendente(m)) { por(m); return; }
    if (avisa) avisar(e, m);
    ouvido(m);
  }
  /* a decisão em aberto segura o relógio: se ela não está na fila (um save
     antigo, uma que escapou), entra na frente */
  function conferirDecisoes(e) {
    for (const m of e.feed || []) if (pendente(m) && !naFila.has(m.id)) por(m, true);
  }
  /* o save novo (jogo novo, carregado): a fila recomeça das decisões em
     aberto; as notícias já estão no arquivo (Notícias → Arquivo do feed) */
  function iniciar(e) {
    largar();
    for (const a of avisos.slice()) tirarAviso(a, true);
    eVisto = e; fila = []; naFila = new Set(); folga = 0;
    topo = (e.feed || [])[0] || null;
    conferirDecisoes(e);
  }
  /* a marca do save: a mais nova ouvida (quanto mais perto do topo, mais nova) */
  function ouvido(m) {
    const e = E();
    if (!e || !e.feed) return;
    const i = e.feed.indexOf(m);
    if (i < 0) return;
    const j = e.ouvido3d != null ? e.feed.findIndex(x => x.id === e.ouvido3d) : -1;
    if (j < 0 || i < j) e.ouvido3d = m.id;
  }

  /* ======================================================
     O AVISO DO LADO DIREITO
     ====================================================== */
  const TITULO = { rodada: 'A Gazeta dos Sports da rodada saiu.', semana: 'O planejamento da semana está na mesa.' };
  function textoDoAviso(m) {
    const t = String(m.texto || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return t || TITULO[m.kind] || '';
  }
  /* O CANTO É DE JORNAL (o dono, 29/09/2026: "As mensagens de jornal que
     devem aparecer no canto direito são as do Gazeta dos sports e futebol
     e porrada"): só a manchete de jornal vira aviso. Qual jornal imprime
     cada tipo de mensagem (o almanaque diz o dele na própria página) e
     quais jornais o canto mostra: pra ampliar, é acrescentar o tipo ou o
     jornal aqui. Todo almanaque hoje sai em "O Almanaque", então nenhum
     aparece; um que saísse na Gazeta ou no Futebol e Porrada apareceria */
  const JORNAL_DO_TIPO = { rodada: 'Gazeta dos Sports', confronto: 'Futebol e Porrada', 'lnt-fundacao': 'Futebol e Porrada', 'lnt-fim': 'Futebol e Porrada', obra: 'Futebol e Porrada' };
  const JORNAIS_DO_CANTO = new Set(['Gazeta dos Sports', 'Futebol e Porrada']);
  const jornalDe = m => m.kind === 'almanaque' ? m.dados && m.dados.pagina && m.dados.pagina.jornal : JORNAL_DO_TIPO[m.kind];
  const ehJornal = m => !!m && JORNAIS_DO_CANTO.has(jornalDe(m));
  /* A EXCEÇÃO DO OLHEIRO (a varredura 2D × 3D, 29/09/2026): o aviso da
     campana (feed.js, `avisoDoOlheiro`: "me passaram a fita de que os
     caras da X vão atacar...") é o que a diária de Inteligência paga — R$
     100 ou R$ 400 por dia —, e só no arquivo de Notícias ninguém via a
     tempo. Ele vira aviso no canto, com a cara de recado do olheiro, e fica
     mais que o aviso comum; o resto que não é jornal segue só no arquivo */
  const ehOlheiro = m => !!m && m.kind === 'campana' && !pendente(m);
  /* a importância do recorte numa rajada: a treta nossa (todo `confronto`
     é nosso), a Gazeta do nosso clube (a edição só sai em dia de jogo
     dele), o resto */
  const pesoDoJornal = m => m.kind === 'confronto' ? 0 : m.kind === 'rodada' ? 1 : 2;
  /* o recorte compacto da mensagem (main.js); null sem a página (save antigo) */
  function recorteDe(e, m) {
    try { return TO.tela && TO.tela.recorteDeJornal ? TO.tela.recorteDeJornal(e, m) : null; }
    catch (err) { console.error('o aviso: o recorte não montou', err); return null; }
  }
  /* só dois recortes na pilha: com ela cheia, o novo entra se for mais
     importante que o pior dela (no empate, o mais novo), e o pior sai; quem
     está sendo lido (o mouse em cima) e o cartão aberto ficam */
  function abrirVaga(m) {
    const vivos = avisos.filter(x => x.peso != null && !x.fixo && !x.saindo);
    if (vivos.length < RECORTES_MAX) return true;
    let pior = null;
    for (const x of vivos) if (!x.pairando && (!pior || x.peso > pior.peso)) pior = x;
    if (!pior || pesoDoJornal(m) > pior.peso) return false;
    tirarAviso(pior);
    return true;
  }
  /* `m`: a mensagem do feed (o toque abre o cartão dela), ou null com
     `o` = { voz, texto, hora, classe, botao: { rot, fn } } (o dia de jogo:
     o gol, o jogo da cidade começando). A mensagem de jornal sai em
     RECORTE, o do feed em versão compacta (main.js, `recorteDeJornal`); sem
     a página dele (save antigo), cai no cartão escuro de texto */
  function avisar(e, m, o = null) {
    montar();
    const rec = m && ehJornal(m) ? recorteDe(e, m) : null;
    const txt = rec ? String((rec.querySelector('h2') || rec).textContent).trim() : (o && o.texto) || (m ? textoDoAviso(m) : '');
    if (!txt) return null;
    if (rec && !abrirVaga(m)) return null;
    const voz = rec ? String((rec.querySelector('.nome-jornal') || {}).textContent || '') : (o && o.voz) || (m && TO.tela && TO.tela.vozDaMsg ? TO.tela.vozDaMsg(m) : '');
    const hora = (o && o.hora) || (m && m.hora) || '';
    const olheiro = !rec && ehOlheiro(m);
    const n = document.createElement('div');
    n.className = 'j3d-aviso' + (m && m.tipo ? ' ' + m.tipo : '') + (o && o.classe ? ' ' + o.classe : '') + (rec ? ' recorte jornal' : '') + (olheiro ? ' olheiro' : '') + (m ? ' abre' : '');
    if (rec) n.appendChild(rec);
    else n.innerHTML = `<div class="j3d-aviso-cab"><b>${esc(voz)}${olheiro ? ' · Inteligência' : ''}</b>${hora ? `<time>${esc(hora)}</time>` : ''}</div><p>${esc(txt)}</p>` +
      (o && o.botao ? `<button class="j3d-aviso-bt">${esc(o.botao.rot)}</button>` : '');
    const a = { n, m, o, olheiro, peso: rec ? pesoDoJornal(m) : null, resta: (rec ? RECORTE_S : olheiro ? OLHEIRO_S : AVISO_S) / (vel() > 1 ? 1.3 : 1), fixo: false, pairando: false, saindo: false };
    n.addEventListener('pointerenter', ev => { if (ev.pointerType === 'mouse') a.pairando = true; });
    n.addEventListener('pointerleave', () => { a.pairando = false; });
    n.addEventListener('click', ev => {
      if (ev.target.closest('.j3d-aviso-x')) { tirarAviso(a); return; }
      if (ev.target.closest('.j3d-aviso-bt')) { try { o.botao.fn(); } catch (err) { console.error('o aviso:', err); } tirarAviso(a); return; }
      if (!a.fixo && a.m) abrirAviso(a);
    });
    pilha.appendChild(n);
    avisos.push(a);
    avisados.push({ id: m ? m.id : null, kind: m ? m.kind : (o && o.classe) || 'aviso', voz, texto: txt.slice(0, 100) });
    if (avisados.length > 120) avisados.shift();
    /* a pilha é curta: o mais velho que não está aberto sai (o do olheiro por último) */
    const soltos = avisos.filter(x => !x.fixo && !x.saindo);
    while (soltos.length > AVISOS_MAX) { const k = soltos.findIndex(x => !x.olheiro); tirarAviso(soltos.splice(k >= 0 ? k : 0, 1)[0]); }
    return a;
  }
  /* o toque abre o cartão inteiro da mensagem (a tabela, o jornal, os links), até o × */
  function abrirAviso(a) {
    const e = E();
    a.fixo = true;
    a.n.classList.add('aberto');
    /* (o recorte deixa de ser o papel solto: o cartão aberto é o escuro, com o jornal dentro) */
    a.n.classList.remove('recorte');
    a.n.innerHTML = '<button class="j3d-aviso-x" title="Fechar" aria-label="Fechar">×</button>';
    try { a.n.appendChild(TO.tela.cartaoMensagem(e, a.m)); }
    catch (err) { console.error('o aviso: o cartão não montou', err); a.n.insertAdjacentHTML('beforeend', `<p>${esc(textoDoAviso(a.m))}</p>`); }
  }
  function tirarAviso(a, ja = false) {
    if (a.saindo) return;
    a.saindo = true;
    const fora = () => { a.n.remove(); const i = avisos.indexOf(a); if (i >= 0) avisos.splice(i, 1); };
    if (ja) { fora(); return; }
    a.n.classList.add('saindo');
    setTimeout(fora, 260);
  }
  /* sem jogo na tela, numa cena, num painel ou no mapa, os avisos esperam (e não correm) */
  function podeAvisar() {
    const b = document.body.classList;
    return b.contains('j3d-em-jogo') && !b.contains('em-cena') && !b.contains('palco-briga') && !b.contains('com-painel') && !b.contains('j3d-mapa-aberto');
  }
  /* O BALÃO DA DECISÃO MANDA NO CANTO: o recorte de jornal é alto, e no
     celular o balão (largo) e a pilha (à direita) dividem o alto da tela — o
     jornal ficava por cima dos botões da decisão, que o relógio espera. Com
     o balão encostando num recorte, os recortes esperam escondidos, sem
     correr, até ele sair (o cartão aberto fica: foi o jogador que abriu). No
     PC o balão fica longe da pilha e os dois aparecem juntos */
  function cedeAoBalao() {
    if (!balao || balao.hidden) return false;
    const b = balao.getBoundingClientRect();
    return avisos.some(a => {
      if (a.peso == null || a.fixo || a.saindo) return false;
      const r = a.n.getBoundingClientRect();
      return r.right > b.left && r.left < b.right && r.bottom > b.top && r.top < b.bottom;
    });
  }
  /* o aviso conta o tempo da parede (no máximo 1 s por quadro) e não o do
     quadro do jogo (no máximo 0,25 s): na máquina lenta, a de 1 a 3 quadros
     por segundo, o recorte de 7,5 s ficava no ar de 10 a 30 s */
  function quadroAvisos(dt) {
    const agora = performance.now(), passo = Math.max(dt, tAviso ? Math.min(1, (agora - tAviso) / 1000) : 0);
    tAviso = agora;
    const pode = podeAvisar();
    if (!pode) return;
    /* a pilha embaixo da barra do jogo (e do placar, no dia de jogo) e em
       cima do painel do dia de jogo, se ele está na tela: o cartão aberto
       cresce até onde a tela deixa */
    const y = Math.round(topoLivre());
    if (pilha.style.top !== y + 'px') pilha.style.top = y + 'px';
    const painel = document.querySelector('.j3d-dia'), baixo = (painel && !painel.hidden ? Math.round(innerHeight - painel.getBoundingClientRect().top + 8) : 12) + 'px';
    if (pilha.style.bottom !== baixo) pilha.style.bottom = baixo;
    const cede = cedeAoBalao();
    for (const a of avisos.slice()) {
      if (a.peso != null && !a.fixo) a.n.classList.toggle('cede', cede);
      if (!a.fixo && !a.saindo && !a.pairando && !(cede && a.peso != null)) { a.resta -= passo; if (a.resta <= 0) tirarAviso(a); }
    }
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
  const chaveDe = (e, m) => estadoSeguro(e, m) + '|' + (m.respondido ? 'r' : '');
  function mostrar(m) {
    montar();
    atual = m; chave = null; lido = 0; lim = Infinity; fixo = false; preso = false; voltarFechando = false; sumiu = false; confirmando = false; eraLinha = false; tSentar = 0;
    mostrados.push({ id: m.id, kind: m.kind, peso: m.peso || 'info' });
    if (mostrados.length > 300) mostrados.shift();
    sentar();
  }
  /* quem traz: na sede, alguém senta na frente do presidente (no dia de
     jogo a decisão é da linha do dia, e ela fica no alto) */
  function sentar() {
    if (!atual || dia3d.ativo || !vida.ligada || vida.reuniao) return;
    const r = vida.recado;
    if (r && r.msg === atual.id) return;
    vida.sentarRecado(atual);
  }
  /* O CARTÃO QUE NÃO SE DESENHA NÃO TRAVA A FILA: um erro ao montar o
     cartão (um save antigo, um anexo que falta) vira um cartão simples —
     o texto e os botões da decisão, que respondem pelo mesmo caminho do
     clique —, e o erro vai pro console com a chave da mensagem */
  function cartaoSimples(e, m, err) {
    console.error('os recados: o cartão não montou', m && m.kind, m && (m.chave || m.id), err);
    const art = document.createElement('article');
    art.className = 'msg';
    art.innerHTML = `<div class="msg-cab"><span class="msg-voz">Recado</span></div><p class="msg-txt">${esc(String(m.texto || '').replace(/<[^>]+>/g, ''))}</p>`;
    if (pendente(m) && (m.botoes || []).length) {
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
    /* (o cartão novo se mede e se ancora no mesmo quadro: sem um quadro do cartão novo no jeito do velho) */
    chave = k; sumiu = false; ajuste = null; ancorado = 0;
    corpo.innerHTML = '';
    /* a linha do dia de jogo: o nó inteiro vai pro balão (a partida roda
       dentro dele), mas só o cartão que pede resposta aparece */
    const linha = k.startsWith('itn|') && TO.tela.linhaDoDia ? TO.tela.linhaDoDia(m) : null;
    if (linha) {
      corpo.appendChild(linha);
      eraLinha = true;
    } else {
      if (m.hora) corpo.insertAdjacentHTML('beforeend', `<div class="j3d-balao-hora">${esc(m.hora)}</div>`);
      corpo.appendChild(TO.tela.cartaoMensagem(e, m));
    }
    fixo = pendente(m) || !!linha;
    balao.classList.toggle('decisao', fixo);
    balao.classList.toggle('linha', !!linha);
    xBt.hidden = fixo;
    if (fixo) lim = Infinity;
    else if (primeira || lim === Infinity) {
      /* respondida agora: fica um pouco com a resposta */
      lido = 0; preso = false;
      confirmando = !primeira && eraFixo;
      lim = primeira ? leitura(m) : RESPONDIDA;
    }
  }
  /* A LINHA DO DIA NO BALÃO: só o cartão que pede resposta (ou o saldo da
     briga que acabou de passar, uns segundos) fica à vista; sem nenhum, o
     balão some — a linha continua nele, escondida, com a partida rodando */
  function cartoesDaLinha() {
    const agora = performance.now();
    let n = 0;
    for (const c of corpo.querySelectorAll('.itn-cartao')) {
      let vivo = !!c.querySelector('button');
      if (!vivo && c.querySelector('.saldo')) {
        if (!saldoVisto.has(c)) saldoVisto.set(c, agora);
        vivo = agora - saldoVisto.get(c) < SALDO_S * 1000;
      }
      if (c.classList.contains('vivo') !== vivo) c.classList.toggle('vivo', vivo);
      if (vivo) n++;
    }
    return n;
  }
  function exibir() {
    if (!balao.hidden) return;
    balao.hidden = false;
    registrarAncora();
    ancorar();
  }
  function esconder() {
    ajuste = null;
    if (balao && !balao.hidden) balao.hidden = true;
    if (desligarAncora) { desligarAncora(); desligarAncora = null; cAncora = null; }
  }
  /* tira o recado do ar (sem marcar ouvido) */
  function largar() {
    if (atual) naFila.delete(atual.id);
    const tinha = !!atual;
    atual = null; chave = null; lido = 0; lim = Infinity; fixo = false; preso = false; voltarFechando = false; sumiu = false; confirmando = false; eraLinha = false;
    esconder();
    if (tinha) vida.soltarRecado();
  }
  /* o recado acabou: ouvido, quem falou vai embora, e o relógio refaz a conta */
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
  /* o alto livre da tela: embaixo da barra do jogo, da fita das manchetes
     e do placar do dia de jogo */
  function topoLivre() {
    let y = 62;
    for (const s of ['.feed-barra', '.feed-ticker', '.j3d-placar']) {
      const el = document.querySelector(s);
      if (!el || el.hidden) continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.bottom < innerHeight * 0.5) y = Math.max(y, r.bottom);
    }
    return y + 8;
  }
  /* ATÉ ONDE O BALÃO DESCE: a borda de baixo da tela, ou o painel do dia
     de jogo (que fica por cima dele) */
  function baixoLivre(yTopo) {
    let y = innerHeight - 10;
    const d = document.querySelector('.j3d-dia:not([hidden])');
    if (d) { const r = d.getBoundingClientRect(); if (r.height > 0 && r.top > yTopo + 80) y = Math.min(y, r.top - 8); }
    return y;
  }

  /* ======================================================
     O BALÃO CABE, SEM ROLAGEM (o dono, 29/09/2026: "Não gosto muito de
     scrollbar nas mensagens de decisão, principalmente os verticais. Tente
     ajustar pra evitar ao máximo o scrollbar."): o corpo do balão tinha um
     teto de 46% da tela e rolava por dentro — a decisão mais comprida (a
     entrevista, a tabela do olheiro) deixava os botões pra baixo da dobra.
     Agora ele cresce até o que a tela deixa livre; desenhado o cartão, o
     balão mede e escolhe o jeito que cabe, do que menos mexe pro que mais
     mexe:
     1) a largura: a mais estreita que deixa o balão dentro do conforto
        (o teto de antes, 46% da tela, e nunca menos de 300 px) — até uns
        520 px, e mais na tela baixa, a do celular deitado;
     2) a compactação, em três níveis (jogo3d.css: c1 os espaços, c2 a
        letra, c3 a hora, os botões e a tabela), medindo de novo a cada um,
        até caber na tela;
     3) só se nada disso couber, o corpo rola — fino, no tom do balão, e
        nunca de lado
     ====================================================== */
  const DEGRAUS = [440, 520, 600, 680];
  let ajuste = null;
  /* as larguras que o balão pode ter: a da folha (null) e cada degrau mais largo, até o teto */
  function larguras(cabe) {
    balao.style.width = '';
    const base = balao.offsetWidth, teto = Math.min(cabe, innerHeight < 560 ? 680 : 520), ls = [null];
    for (const w of DEGRAUS) if (w > base + 30 && w <= teto) ls.push(w);
    if (teto > base + 30 && ls[ls.length - 1] !== teto) ls.push(teto);
    return ls;
  }
  function aplicar(larg, nivel) {
    balao.style.width = larg ? larg + 'px' : '';
    for (let n = 1; n <= 3; n++) balao.classList.toggle('c' + n, nivel >= n);
  }
  function ajustar(cabe, yTopo, yBaixo) {
    /* (o balão escondido por um painel ou uma cena, sem ter saído do ar: nada a medir) */
    if (!balao.offsetWidth) return;
    const livre = Math.floor(yBaixo - yTopo), lim = cabe + '|' + livre;
    const assin = () => balao.offsetWidth + 'x' + balao.offsetHeight + '|' + corpo.scrollHeight;
    /* (o cartão e a tela iguais: o jeito de antes serve) */
    if (ajuste && ajuste.lim === lim && ajuste.assin === assin()) return;
    balao.style.setProperty('--corpo-max', 'none');
    const ls = larguras(cabe), conforto = Math.min(livre, Math.max(Math.round(innerHeight * 0.46), 300), 420), alto = () => balao.offsetHeight;
    let coube = false;
    for (const l of ls) { aplicar(l, 0); if (alto() <= conforto) { coube = true; break; } }
    /* (nenhuma largura leva ao conforto: fica a mais larga, se cabe na tela) */
    coube = coube || alto() <= livre;
    for (let n = 1; !coube && n <= 3; n++) { aplicar(ls[ls.length - 1], n); coube = alto() <= livre; }
    /* o teto do corpo, só se nada coube: o que sobra da tela, fora o resto do balão (o pé, o botão) */
    if (!coube) balao.style.setProperty('--corpo-max', Math.max(80, livre - (alto() - corpo.offsetHeight)) + 'px');
    ajuste = { lim, assin: assin() };
  }
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
    const Cn = C(), A = areaLivre();
    /* (o balão nunca é mais largo que a parte livre da tela: no celular em pé, a coluna de ícones come a esquerda e ele passava da borda da direita) */
    const cabe = Math.max(220, Math.floor(A.x1 - A.x0 - 16));
    if (balao.style.maxWidth !== cabe + 'px') balao.style.maxWidth = cabe + 'px';
    let alvo = null, volta = null, x = null, y = null;
    /* (no dia de jogo a decisão fica sempre no alto, embaixo do placar: em
       cima do líder ela tampava justamente o lado de onde a rival vinha) */
    if (!dia3d.ativo && vida.ligada) {
      const r = vida.recado;
      if (r && r.msg === atual.id) alvo = { x: r.d.x, y: (r.d.alt || 0) + 1.45 * M, z: r.d.y };
      if (vida.sede) volta = 'Ir pra sala do presidente';
    }
    if (alvo && Cn && Cn.vida) {
      const q = Cn.vida.projetar(alvo.x, alvo.y, alvo.z, PQ);
      if (q.frente && q.x > A.x0 + 10 && q.x < A.x1 - 10 && q.y > 70 && q.y < innerHeight - 20) { x = q.x; y = q.y; }
    }
    /* (o botão que leva a câmera até quem fala conta na altura do balão: ele entra antes da medida) */
    irBt.hidden = x != null || !volta;
    if (x == null && volta && irBt.textContent !== volta) irBt.textContent = volta;
    const yTopo = topoLivre();
    ajustar(cabe, yTopo, baixoLivre(yTopo));
    const larg = balao.offsetWidth || 340, alto = balao.offsetHeight || 140;
    if (x == null) {
      /* quem fala fora da tela: o balão encosta no alto, com o botão que leva a câmera até ele */
      balao.classList.add('solto'); balao.classList.remove('sobre');
      balao.style.left = Math.round(clamp(A.meio - larg / 2, A.x0 + 8, Math.max(A.x0 + 8, A.x1 - larg - 8))) + 'px';
      balao.style.top = Math.round(yTopo) + 'px';
      return;
    }
    balao.classList.remove('solto');
    /* O PRESIDENTE À VISTA: o balão abre pro lado contrário ao dele (o rabo
       fica na cabeça de quem fala, perto da ponta do balão) */
    let meio = x;
    const pres = vida.ligada ? vida.presidente : null;
    if (pres && Cn) {
      const qp = Cn.vida.projetar(pres.x, (pres.alt || 0) + 1.2 * M, pres.y, PP);
      if (qp.frente && Math.abs(qp.x - x) < larg * 0.6 && qp.y < y + 40) meio = qp.x >= x ? x - larg / 2 + 34 : x + larg / 2 - 34;
    }
    const left = clamp(meio - larg / 2, A.x0 + 8, Math.max(A.x0 + 8, A.x1 - larg - 8));
    const top = Math.max(yTopo, y - alto - 14);
    /* (cobrindo quem fala, o rabo não aponta pra ninguém) */
    balao.classList.toggle('sobre', top + alto > y - 10);
    balao.style.left = Math.round(left) + 'px'; balao.style.top = Math.round(top) + 'px';
    balao.style.setProperty('--rabo', Math.round(clamp(x - left, 16, larg - 16)) + 'px');
  }
  /* o pé: quantas decisões esperam e a régua do tempo da resposta */
  function pintarPe() {
    const n = fila.length;
    const txt = n ? `+${n} ${n > 1 ? 'decisões esperando' : 'decisão esperando'}` : '';
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
    quadroAvisos(dt);
    tDecisao += dt;
    if (tDecisao > 0.5) { tDecisao = 0; conferirDecisoes(e); }
    const pode = podeMostrar();
    /* A LINHA DO DIA DE JOGO PASSA NA FRENTE: com ela andando, o que estava
       no balão volta pra fila — sem contar como ouvido — e ela entra */
    const ml = TO.tela.msgDaLinha ? TO.tela.msgDaLinha() : null;
    if (ml && ml !== atual) {
      const antes = atual;
      if (antes) { largar(); if (pendente(antes)) { naFila.add(antes.id); fila.unshift(antes); } }
      const i = fila.indexOf(ml);
      if (i >= 0) fila.splice(i, 1);
      naFila.add(ml.id);
      mostrar(ml);
    }
    /* a linha do dia acabou: o balão sai na hora (o placar da TV já contou o dia) */
    if (atual && eraLinha && !ml) { fechar(); return; }
    if (!atual) {
      /* (a decisão respondida por fora, antes da vez dela, sai da fila) */
      for (let k = fila.length - 1; k >= 0; k--) if (!pendente(fila[k])) naFila.delete(fila.splice(k, 1)[0].id);
      if (folga > 0) folga -= dt;
      else if (fila.length && pode) mostrar(fila.shift());
    }
    if (!atual) { esconder(); return; }
    const k = chaveDe(e, atual);
    if (!pode) {
      if (chave !== null) sumiu = true;
      esconder();
      return;
    }
    /* respondida por trás (a reunião encerrada, a tela do ataque
       confirmada): quando a cidade volta, ela já saiu */
    if (!voltarFechando && sumiu && k !== chave && fixo && !pendente(atual) && !k.startsWith('itn|')) voltarFechando = true;
    if (voltarFechando) { fechar(); return; }
    if (k !== chave) pintar(e, k);
    /* a linha do dia: o balão só com a decisão da hora */
    if (eraLinha && !cartoesDaLinha()) { esconder(); return; }
    exibir();
    /* quem traz o recado senta (a praça pode ter acabado de montar) */
    tSentar += dt;
    if (tSentar > 1) { tSentar = 0; sentar(); }
    if (lim !== Infinity) {
      if (confirmando || (!preso && !pairando())) lido += dt;
      if (lido >= lim) { fechar(); return; }
    }
    pintarPe();
    /* com a cidade parada (montando a praça) o quadro dela não ancora */
    if (performance.now() - ancorado > 80) ancorar();
  }

  /* QUANTO O RELÓGIO ESPERA (ms a 1×; o relógio divide pela velocidade):
     só o que falta da resposta no ar — aviso não segura as horas, e a
     decisão em aberto já para o relógio sozinha */
  function espera() {
    try {
      if (!atual) return Math.max(0, folga) * 1000 * vel();
      if (!confirmando && (preso || pairando())) return 60000;
      let s = Math.max(0, folga);
      if (lim !== Infinity) s += Math.max(0, lim - lido);
      return Math.min(60000, s * 1000 * vel());
    } catch (err) { return 0; }
  }
  /* a mensagem que acabou de cair (o ritmo do jogo 3D avisa): a decisão
     entra na fila e a notícia vira aviso na hora */
  function chegou(e) {
    if (e && e === eVisto) olhar(e);
  }

  /* A DECISÃO EM ABERTO NA TELA, JÁ (o ≫ com o tempo parado chama): o que
     estava no balão volta pra fila e a decisão entra; devolve o que impede o
     balão de aparecer, se houver */
  function trazerDecisao() {
    const e = E();
    if (!e || !e.feed) return 'sem jogo';
    const d = e.feed.find(pendente);
    if (!d) return 'nada em aberto';
    if (e !== eVisto) iniciar(e);
    if (atual !== d) {
      const antes = atual;
      if (antes) { largar(); if (pendente(antes)) { naFila.add(antes.id); fila.unshift(antes); } }
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

  return {
    quadro, espera, chegou, trazerDecisao,
    /* um aviso que não é mensagem do feed (o dia de jogo: o gol, o jogo da cidade) */
    avisar: o => avisar(E(), null, o),
    /* pro teste */
    get estado() {
      return { atual: atual && { id: atual.id, kind: atual.kind, peso: atual.peso || 'info' }, fila: fila.map(m => m.id), visivel: !!(balao && !balao.hidden),
               solto: !!(balao && balao.classList.contains('solto')), linha: eraLinha, fixo, preso, lido: +lido.toFixed(2), lim: lim === Infinity ? null : +lim.toFixed(2),
               ouvido: E() ? E().ouvido3d : null, mostrados: mostrados.slice(-60), quemFala: dia3d.ativo ? 'linha' : vida.recado ? 'sede' : null,
               avisos: avisos.filter(a => !a.saindo).map(a => ({ kind: a.m ? a.m.kind : 'aviso', aberto: a.fixo, recorte: a.peso != null, resta: +a.resta.toFixed(2), texto: a.n.textContent.slice(0, 80) })),
               avisados: avisados.slice(-60) };
    },
    get balao() { return balao; }
  };
}
