/* =========================================================
   OS SINAIS QUE O COMBATE NÃO ESCREVE
   ---------------------------------------------------------
   `bonecos3.js` veio da Vitrine, e a Vitrine foi escrita
   contra um combate que guarda mais coisa do que o daqui:
   `ataque` com tipo e instante do impacto, `apanhou`,
   `derrubado`, `defendendo`, `esquivou`, `segurando`,
   `seguradoPor`, `linha`, `inimigoPerto`. O `combate.js`
   deste repositório guarda outra lista, mais curta:

     d.golpe      0,12 e caindo — acertei alguém neste quadro
     d.tremor     até 6, caindo a 9/s — levei pancada agora
     d.hostil     até 4 s — estou em briga, mesmo sem contato
     d.atordoado  cassetete da PM, 0,7 s
     d.agarrado   mão em cima, 1,2 s até ir ao chão
     d.correEm    quebrou e ainda não virou as costas
     d.fugindo    virou as costas
     d._cacando   corre atrás de quem fugiu
     d.ang        pra onde o corpo está virado
     p.cooldown   salta pra 1,9 no quadro em que o PM acerta

   Havia dois caminhos. Mexer no combate pra ele escrever o
   resto — e aí a briga muda, o balanceamento muda, e o que
   era pra ser uma cena nova vira um jogo novo. Ou traduzir.
   Este arquivo traduz: lê o que o combate guarda e escreve o
   que o boneco espera, sem tocar numa linha de simulação.

   O QUE NÃO DÁ PRA INVENTAR fica em repouso, e é honesto que
   fique: `derrubado`, `defendendo`, `esquivou`, `chamou`,
   `socorrendo` e `fugaBomba` ficam zerados, porque o combate
   daqui não tem esses estados — e desenhar um sujeito
   esquivando quando a simulação não esquivou é a tela
   mentindo sobre a regra. No dia que o combate ganhar esses
   campos, o tradutor encolhe; ele é uma ponte, não um lugar.

   O QUE DÁ, dá bem:
     golpe subindo   → `ataque` com tipo, duração e impacto
     tremor subindo  → `apanhou` (o tranco é evento, não nível)
     projétil novo   → `arremesso` (a origem volta por x − vx·t)
     agarrado        → `seguradoPor`, e quem bate em cima é o
                       `segurando`
     parado e sem briga na arquibancada → `linha:'retaguarda'`,
                       que é o boneco TORCENDO. Numa cena de rua
                       isso seria enfeite; num estádio é o que a
                       arquibancada faz quando não está brigando.
   ========================================================= */

/* o que o boneco espera ver e o combate daqui não produz */
const REPOUSO = {
  derrubado: 0, derrubadoDur: 0, defendendo: 0, esquivou: 0,
  chamou: -9, socorrendo: null, fugaBomba: false
};

/* soco 0,36 s com impacto aos 0,15; chute 0,58/0,28 — os mesmos
   números que a Vitrine usou pra casar pose com dano */
const TEMPOS = {
  soco:     { dur: 0.36, impacto: 0.15 },
  chute:    { dur: 0.58, impacto: 0.28 },
  joelhada: { dur: 0.55, impacto: 0.20 },
  agarrar:  { dur: 0.50, impacto: 0.22 }
};

export function criarTradutor(opc) {
  opc = opc || {};
  /* de quanto em quanto o chute entra no lugar do soco. Não é
     enfeite: com soco só, uma briga de trinta vira trinta braços
     no mesmo compasso. */
  const CHANCE_CHUTE = opc.chanceChute !== undefined ? opc.chanceChute : 0.16;
  const mem = new WeakMap();
  const vistos = new WeakSet();

  function lembrar(o) {
    let m = mem.get(o);
    if (!m) { m = { golpeAnt: 0, tremAnt: 0, cdAnt: 0, ataque: null, apanhou: 0 }; mem.set(o, m); }
    return m;
  }

  /* ---------------------------------------------------------
     QUEM ESTÁ PERTO — o mesmo truque de balde que `combate.js`
     usa na separação: O(n) pra montar, nove baldes pra
     consultar. Sem ele, "quem é o meu inimigo mais perto" seria
     400 × 400 por quadro.
     --------------------------------------------------------- */
  const BALDE = 52;
  const baldes = new Map();
  const chaveDe = (x, y) => (Math.floor(x / BALDE) + 64) * 4096 + (Math.floor(y / BALDE) + 64);
  function indexar(J) {
    baldes.clear();
    const por = o => {
      const k = chaveDe(o.x, o.y);
      const l = baldes.get(k);
      if (l) l.push(o); else baldes.set(k, [o]);
    };
    for (const d of J.discos) if (d.vivo) por(d);
    for (const p of J.policiais) if (p.vivo) por(p);
  }
  /* o PM não tem `lado`, então ele é inimigo de todo disco e de
     mais nenhum PM — que é exatamente a regra da cena */
  function inimigoPerto(o, alcance) {
    const cx = Math.floor(o.x / BALDE), cy = Math.floor(o.y / BALDE);
    let md = alcance * alcance, alvo = null;
    for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) {
      const l = baldes.get((cx + c + 64) * 4096 + (cy + r + 64));
      if (!l) continue;
      for (const q of l) {
        if (q === o || q.lado === o.lado) continue;
        const dx = q.x - o.x, dy = q.y - o.y, dd = dx * dx + dy * dy;
        if (dd < md) { md = dd; alvo = q; }
      }
    }
    return alvo ? { alvo, d: Math.sqrt(md) } : null;
  }

  /* ---------------------------------------------------------
     QUEM JOGOU A PEDRA. A simulação não marca. Mas o projétil
     tem velocidade constante e guarda o tempo de voo, então a
     origem volta por `x − vx·t` — e quem está em cima dela é o
     braço.
     --------------------------------------------------------- */
  function acharArremesso(J) {
    for (const p of J.projeteis) {
      if (vistos.has(p)) continue;
      vistos.add(p);
      const ox = p.x - p.vx * p.t, oy = p.y - p.vy * p.t;
      let melhor = null, md = 20 * 20;
      for (const d of J.discos) {
        if (!d.vivo || d.lado !== p.lado) continue;
        const dx = d.x - ox, dy = d.y - oy, dd = dx * dx + dy * dy;
        if (dd < md) { md = dd; melhor = d; }
      }
      if (melhor) melhor.arremesso = { t: 0.55, tipo: p.tipo };
    }
  }

  return function traduzir(J, dt) {
    indexar(J);
    acharArremesso(J);

    for (const d of J.discos) {
      if (d.entrou || d.sumiu) continue;
      const m = lembrar(d);
      Object.assign(d, REPOUSO);

      /* PRA ONDE ENCARA. O combate mede o ângulo de x pra y; o
         mundo 3D mede de z pra x. A conversão é só de eixo — e
         é por isso que ela mora aqui e não no boneco. */
      if (d.ang !== undefined) d.rumo = Math.PI / 2 - d.ang;

      const perto = d.vivo ? inimigoPerto(d, 120) : null;
      d.inimigoPerto = perto ? perto.d : 999;

      /* ---- O GOLPE VIRA ATAQUE ----
         `golpe` é o rastro de um acerto que JÁ saiu (0,12 e
         caindo). O boneco quer o gesto inteiro, com começo, pico
         e volta. Então a subida de `golpe` abre um ataque e o
         ataque corre sozinho pelo relógio daqui. */
      if (m.ataque) {
        m.ataque.t += dt;
        if (m.ataque.t >= m.ataque.impacto && !m.ataque.bateu) m.ataque.bateu = true;
        if (m.ataque.t >= m.ataque.dur) m.ataque = null;
      }
      if (!m.ataque && d.golpe > m.golpeAnt + 0.01 && d.vivo) {
        /* agarrão primeiro: bater em quem já está com a mão em
           cima é joelhada, não jab */
        const segurando = perto && perto.alvo.agarrado > 0.05;
        const tipo = segurando ? (Math.random() < 0.5 ? 'joelhada' : 'agarrar')
                   : Math.random() < CHANCE_CHUTE ? 'chute' : 'soco';
        const T = TEMPOS[tipo];
        m.ataque = { t: 0, dur: T.dur, impacto: T.impacto, tipo,
                     alvo: perto ? perto.alvo : null, bateu: false };
      }
      m.golpeAnt = d.golpe;
      d.ataque = m.ataque;

      /* ---- O TRANCO É EVENTO, NÃO NÍVEL ----
         `tremor` satura em 6 e fica lá enquanto o contato durar,
         então ler o valor cru deixava o boneco encolhido a briga
         inteira. O que interessa é a SUBIDA. */
      if (d.tremor > m.tremAnt + 0.25) m.apanhou = 0.34;
      m.tremAnt = d.tremor;
      m.apanhou = Math.max(0, m.apanhou - dt);
      d.apanhou = m.apanhou;

      if (d.arremesso) {
        d.arremesso.t -= dt;
        if (d.arremesso.t <= 0) d.arremesso = null;
      }

      /* ---- QUEM ESTÁ SEGURANDO QUEM ----
         `contatos` marca quem apanha (`agarrado`) e não marca
         quem segura. Mas segurar é bater em quem foge estando em
         cima: se eu acerto neste quadro e o inimigo mais perto
         está com a mão em cima dele, a mão é a minha. */
      d.seguradoPor = (d.agarrado > 0.05 && perto) ? perto.alvo : null;
      d.segurando = (perto && perto.alvo.agarrado > 0.05 && d.golpe > 0) ? perto.alvo : null;

      /* ---- A ARQUIBANCADA QUE NÃO ESTÁ BRIGANDO, TORCE ----
         `linha:'retaguarda'` é o que acende o gesto de torcer no
         boneco. Quem está em briga, quem quebrou, quem foge e
         quem caça ficam na frente. */
      const naBriga = d.hostil > 0 || d.golpe > 0 || d.atordoado > 0 ||
                      d.fugindo || d._cacando || d.correEm != null || d.agarrado > 0;
      d.linha = naBriga ? 'frente' : 'retaguarda';
    }

    /* O PM não guarda golpe nem tremor. O que ele guarda é o
       `cooldown`, que salta pra 1,9 no quadro em que o cassetete
       acerta — a subida dele é a cacetada. */
    for (const p of J.policiais) {
      const m = lembrar(p);
      const bateu = p.vivo && p.cooldown > m.cdAnt + 0.01;
      m.cdAnt = p.cooldown;
      if (bateu) m.golpeAte = 0.3;
      m.golpeAte = Math.max(0, (m.golpeAte || 0) - dt);
      p.golpe = m.golpeAte;
    }
  };
}
