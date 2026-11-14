/* =========================================================
   O JOGO EM 2D, COM IMAGENS (13/11/2026)

   O dono: "Remova de vez os gráficos 3d, as cenas vão ser todas nas
   imagens." A página do jogo (jogo.html) não monta mais cidade nenhuma:
   carrega a casca, o jogo (jogo.js), o portal (portal.js) e o boneco das
   cenas de imagem (bonecos3_global.js), e mais nada.

   - entre os jogos, a tela é o portal (o próximo jogo, a agenda, a
     tabela, as finanças) com o menu do lado e a barra de cima;
   - o dia de jogo é o itinerário: a linha do dia no cartão da partida,
     com o mapa da caravana, as paradas e os cartões (o aviso de ataque
     é um cartão na linha, com "Pra cima deles / Simular / Recuar");
   - as brigas e as cenas abrem nas imagens, com os bonecos por cima.

   O que este arquivo guarda do jogo antigo é só o que não era cidade: o
   cartão da partida cai perto da hora da bola e nada do que conta o
   placar passa na frente dele.
   ========================================================= */
import { CASCA } from './jogo_casca.js?v=afa70b0ece';

const carregarScript = src => new Promise((ok, erro) => {
  const s = document.createElement('script');
  s.src = src; s.charset = 'utf-8'; s.onload = ok; s.onerror = () => erro(new Error(src));
  document.head.appendChild(s);
});

async function montarJogo() {
  /* a casca entra antes do jogo: ele procura os ids na hora que carrega */
  const caixa = document.createElement('div');
  caixa.innerHTML = CASCA;
  while (caixa.firstChild) document.body.appendChild(caixa.firstChild);
  /* os escudos, as fotos das praças e as bandeiras embutidos (o `IMG()` do jogo procura aqui antes do caminho) */
  await carregarScript('dados/imagens_jogo.js?v=afa70b0ece').catch(() => {});
  /* os estádios low-poly das cenas (ferramentas/estadios/assar.js): antes do jogo, que monta as cenas quando carrega */
  await carregarScript('dados/estadios_cenas.js?v=afa70b0ece').catch(() => {});
  /* sem o rolo do feed: a tela entre os jogos é o portal */
  window.TO = window.TO || {};
  TO.semFeed = true;
  await carregarScript('js/jogo.js?v=afa70b0ece');
  await carregarScript('js/portal.js?v=afa70b0ece').catch(err => console.error('o portal não carregou:', err));
  /* o boneco das cenas de imagem (os dois níveis afinados, em base64) */
  if (!TO.dados.bonecoPertoGLB) await carregarScript('dados/boneco_glb.js?v=afa70b0ece').catch(() => {});
  await import('./bonecos3_global.js?v=afa70b0ece').catch(err => console.error('o boneco das cenas não carregou:', err));
  ligar();
}

function ligar() {
  const E = () => TO.estado && TO.estado.E;
  const jogo = document.getElementById('jogo');
  const minutoDe = h => { const m = /^(\d\d?):(\d\d)/.exec(String(h || '')); return m ? +m[1] * 60 + +m[2] : null; };
  const hhmmDe = min => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(Math.round(min) % 60).padStart(2, '0');
  /* A PARTIDA CAI PERTO DA HORA DO JOGO, SEM SPOILER (28/09 e 06/10/2026):
     o cartão "Hoje tem…, Iniciar partida" cai 75 minutos antes da bola, e o
     que entrou na fila depois dele (a matéria da rodada com o placar, o
     almanaque do campeão) segue atrás — o cartão é decisão, e segura a fila
     até o apito */
  function horaDaPartida(e) {
    try {
      const fila = e.feedFila || [], hoje = (e.data && e.data.absoluto) || 0, j = e.proximoJogo;
      const m = fila.find(x => x && x.kind === 'partida' && x.quando && x.quando.abs === hoje);
      const bola = j && j.dia === e.data.dia ? minutoDe(j.hora) : null;
      if (!m || bola == null) return;
      const hora = Math.max(8 * 60, bola - 75);
      m.hora = hhmmDe(hora);
      for (const x of fila.slice(fila.indexOf(m) + 1))
        if (x && x.quando && x.quando.abs === hoje && (minutoDe(x.hora) || 0) < hora) x.hora = m.hora;
      const doDia = fila.filter(x => x.quando && x.quando.abs === hoje), resto = fila.filter(x => !(x.quando && x.quando.abs === hoje));
      doDia.sort((a, b) => (minutoDe(a.hora) || 0) - (minutoDe(b.hora) || 0));
      fila.length = 0; fila.push(...doDia, ...resto);
    } catch (err) { console.error('a hora da partida:', err); }
  }
  /* o que o relógio do jogo pergunta a cada dia que vira (jogo.js, `ritmoDoDia`) */
  TO.ritmoDoDia = { virouDia: horaDaPartida };
  /* dentro da partida (a casca do jogo à mostra) ou no menu: é o que as folhas de estilo olham */
  const conferirTela = () => {
    const emJogo = !!jogo && !jogo.classList.contains('oculto');
    document.body.classList.toggle('j3d-em-jogo', emJogo);
    document.body.classList.toggle('j3d-entre-jogos', emJogo);
  };
  if (jogo) new MutationObserver(conferirTela).observe(jogo, { attributes: true, attributeFilter: ['class'] });
  conferirTela();
}

montarJogo().catch(err => console.error('o jogo não montou:', err));
