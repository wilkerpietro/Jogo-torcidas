/* =========================================================
   O DIA DE JOGO — o clássico da praça, no cenário 3D
   ---------------------------------------------------------
   O dono pediu (27/09/2026): "Comece a iniciar rotas de entrada no
   estádio das torcidas pra chegar ao seu local exato na arquibancada,
   através da sua respectiva entrada, partindo da sua sede. Crie um jogo
   fictício de dois times da mesma cidade pras respectivas torcidas se
   locomoverem até lá. A polícia vai fazer cordões de isolamento ao redor
   do estádio pra evitar que haja encontro entre elas, e as torcidas vão
   fazer rotas no intuito de não se chocarem."

   O JOGO (fictício): os dois clubes da praça (dados/cidades.js, na ordem
   de lá) que têm torcida com sede no mapa; o primeiro manda, no estádio
   dele (dados/estadios.js: `mandantes`), domingo às 16h. Ou o mandante
   da praça contra um clube DE FORA (o dono, 27/09/2026: "jogo Ceará x
   CSA em Fortaleza"). Cada torcida do
   clube vai pro setor do ESCALÃO dela (a de mais poder no 1º, a seguinte
   no 2º…): o mandante pelos portões 1 e 2, o visitante pelo 3 — o portão
   de cada setor é o de caminho mais curto até ele (rotas_estadios.js).

   QUEM VAI PRA RUA (as contas do jogo mais novo, o "Torcida Organizada"
   do GitHub Pages: `naRuaEm` de js/mundo/praca.js e `caravanaDe` de
   js/gestao/planejamento.js; o dono, 27/09/2026: "a quantidade de gente
   que vai pra rua tá desatualizada"): a torcida da praça bota TODO MUNDO
   DE PÉ na rua (as `disponiveisIA`: o efetivo menos ferido, preso e quem
   está em subsede; os 60% de antes caíram no jogo em 31/08/2026), menos
   a escolta que ela empresta a um visitante; a de outra cidade vem em
   caravana: a régua da caravana do jogador com 2 trechos e risco zero,
   vezes 0,6 (o redutor do visitante) — com a moral 12 com que toda IA
   nasce, uns 47% das de pé, e no mínimo CARAVANA_MIN (com menos de pé
   que isso, não vem). UM BONECO É UM TORCEDOR (o dono, 28/09/2026: "se
   eu tenho mais de 100 aptos com a TUF e o jogo só coloca 40 na rota do
   estádio até a arquibancada. Tem que ser os 100 aptos, tanto pra mim
   como pras torcidas IA"): era um boneco por dois, e no máximo 40 por
   torcida. Agora quem vai pra rua vai inteiro, até o que o setor dela
   tem de lugar com caminho (rotas_estadios.js: 400 por setor, menos nos
   setores pequenos do visitante — 168 no de 10 mil, 211 num do de 40)
   e até MAX_BONDE, a trava de segurança.

   O VISITANTE DE OUTRA CIDADE (o dono, 27/09/2026): "As torcidas
   visitantes que tem aliado iniciam sua rota ao estádio na sede do
   aliado, caso o aliado tenha optado por hospedá-lo. Caso tenha optado
   por hospedar e escoltar, 10 membros do aliado que recebeu vão com eles
   pro estádio." O aliado é o do jogo (`anfitriaoDe`): uma torcida da
   praça com sede que está na irmandade do visitante (antes) ou nos
   aliados dele; no empate, a de menor hash do par. Ele decide (sorteado,
   HOSPEDA: a irmandade escolta mais) entre não receber, hospedar e
   hospedar e escoltar; com a escolta, de 5 a 10% do efetivo dele andam
   no bonde até o setor (a conta do jogo, `escoltaDe`: a TUF, de 150,
   empresta de 8 a 15; o dono, 27/09/2026: "volte a aplicar a regra de 8
   a 15"). Se ele é do clube mandante, só hospeda: "Em jogo Fortaleza x
   CSA, o aliado só hospeda a TOMA, e ela sai da sede sozinha pro
   estádio". Sem aliado que receba, a caravana desce na ENTRADA da cidade
   (o pórtico da estrada; a PM escolhe a de caminho mais curto até o
   portão do visitante) e vai a pé de lá.

   A TORCIDA IA ESCOLHE (o dono, 27/09/2026): ir em paz — a rota do plano
   da PM, que é o que o resto deste arquivo desenha — ou ATACAR uma
   rival do outro clube, "e isso tem mais chances de acontecer caso seja
   um jogo contra uma torcida que tenha pontuação alta de rivalidade". A
   chance é a conta do jogo (`chanceDeProcurar`, js/mundo/praca.js): a
   base pela relação dela com o alvo (maior rival 55%, rival 25% — o dono
   baixou de 88 e 72, 27/09/2026), vezes a paridade das duas torcidas
   (abaixo de 45% do tamanho do alvo, não vai; maior que ele, vai com
   mais vontade, até 1,3 vez), no máximo 95% (o jogo ainda soma a mágoa
   — 0,3 por ponto de relação abaixo de −45 — e para em 57%; aqui não,
   porque a base foi o dono quem deu). O bonde com a escolta da
   PM também pode atacar (o dono: "o bonde escoltado pode atacar sim").
   Quem decide
   atacar vai DE ENCONTRO ao bonde do alvo em vez de ir direto pro
   estádio: um ponto da rota dele na cidade (fora dos arredores, onde a
   PM está), o que deixa o caminho do atacante (sede → ponto → portão)
   mais curto; espera escondido ESCONDIDO m antes e cai em cima quando o
   bonde passa. A PM não sabe: o plano dela (o corredor, os cordões, as
   travessias) é o da paz. A BRIGA dura BRIGA s e sai da conta das brigas
   entre IAs do jogo (`brigaIA`, js/mundo/relacoes.js, e a mesma tabela de
   js/diajogo/simular.js): a força de cada lado é a gente × a ficha média
   da torcida (a pirâmide de cargos), o favorito vence 70% das vezes, e
   as baixas são dos DOIS lados (o dono, 27/09/2026: "deve registrar os
   dois lados"): quem perde deixa de 25 a 40% no chão e de 5 a 12% presos;
   quem ganha, de 8 a 16% e de 1 a 4%. Os feridos ficam no chão; os
   presos ficam rendidos no lugar, de mãos pra cima, esperando a viatura
   (a PM não estava lá; o jogo manda eles pro camburão); "depois de ela ir de encontro à
   torcida rival, independente do que aconteça, ela vai pro estádio com
   aqueles que ficaram aptos" — e o alvo também, depois de juntar os
   dele (REAGRUPA s). Cada torcida entra em uma briga, no máximo.

   A BRIGA MANDADA PELO JOGO (o ataque que o jogador sofre, a investida
   dele) cai onde o jogo diz, e do jeito que se vê na rua (o dono,
   28/09/2026: "se for na pista, minha torcida vai normalmente fazer sua
   rota e em alguma esquina vai ser abordada pelo adversário, gerando a
   mensagem de aviso. Se for na concentração eles vem atacar em frente a
   sede, antes da torcida partir"):
   - NA PISTA, numa ESQUINA da rota do alvo: o ponto em que ela cruza
     outra rua (saem de lá pelo menos três ruas de ESQUINA m ou mais, nos
     quatro rumos da grade do mapa); quem ataca espera na transversal,
     escondido, e sai correndo quando a cabeça do bonde chega na esquina.
     Sem esquina que sirva, o ponto é o de antes (o mais curto pra quem
     ataca);
   - NA CONCENTRAÇÃO, NA PORTA DA SEDE, ANTES DE SAIR: o ponto é a frente
     da porta, onde a torcida está nas rodinhas; quem ataca vem da sede
     dele, dobra a última esquina (espera só ESPERA_PORTA s) e cai em
     cima da concentração; a briga acaba e a torcida ainda junta os dela
     (REAGRUPA_PORTA s) antes da hora de sair, e sai com quem ficou de pé.
     Na porta, cada um de quem ataca vai no do alvo mais perto de onde ele
     vem (o `parear` do plano, refeito quando as rodinhas estão postas), e
     quem é atacado briga no lugar da rodinha dele.

   O PLANO DA PM, nos ARREDORES (o que se anda até ARREDOR m dos portões):
   - o CORREDOR DO VISITANTE: a PM traça primeiro a rota da torcida
     visitante até o portão 3, pagando caro pra passar perto dos portões
     do mandante; a ZONA DO VISITANTE é o pedaço dos arredores que fica
     mais perto do portão 3 (andando) mais o corredor, o que se anda até
     CORREDOR m da rota (a rua inteira, de parede a parede, e a boca das
     transversais); o resto dos arredores é a ZONA DO MANDANTE. (Dividir só
     pelo portão mais perto não serve: no de 40 mil o portão 3 fica num
     bolsão que só se alcança passando pela zona do mandante);
   - o CORDÃO DIVISÓRIO onde uma zona encosta na outra: a grade de
     contenção e a fila de PMs de escudo, de um lado ao outro da rua;
   - as BOCAS, onde a rua sai dos arredores: a boca por onde entra a rota
     de uma torcida fica aberta; as outras bocas da zona do visitante
     ficam FECHADAS (a grade atravessada e 2 PMs); as do mandante, abertas;
   - a REVISTA é NA ENTRADA do estádio (o dono, 27/09/2026: "a revista é
     interessante que seja na hora da entrada, pois o jogador vai poder
     optar por fazer outra rota com sua torcida"): na boca de cada raia
     do portão, antes da catraca. Cada PM da revista cuida de um grupo de
     raias vizinhas e revista um de cada vez (REVISTA s cada um); o
     portão tem um PM da revista pra cada REVISTA_POR_PM bonecos que
     passam por ele (no máximo um por raia, e pelo menos um);
   - a ESCOLTA: até 4 PMs andam com o bonde do 1º escalão visitante, da
     sede até o portão.
   O EFETIVO é proporcional à gente do jogo, sempre (o dono, 27/09/2026):
   um PM pra cada 4 torcedores (PM_POR_TORCEDOR). A revista sai primeiro
   (ela é por onde todo mundo passa); o resto se divide entre os outros
   postos pela ordem de importância (ver `montar`); a grade fica inteira,
   o que muda é quanto PM tem na frente dela.

   AS ROTAS da sede à boca do portão saem da GRADE DA ROTA, de 1 m, feita
   da grade do passo do cenário (o que o corpo alcança, fora do estádio),
   com a FOLGA de cada lugar (a distância até a parede, o carro, o poste):
   o meio da rua custa 1, a beira custa até 4. Nos arredores, só a zona
   do lado da torcida, e nunca o cordão. Fora deles, AS TORCIDAS SE
   EVITAM: primeiro saem as rotas do visitante (o corredor), depois as do
   mandante pagando caro perto delas, depois as do visitante de novo,
   pagando perto das do mandante; e todas pagam perto da sede rival. O
   custo de cada lado é uma tabela (uma conta por célula, antes da
   busca), e a busca é o A* na grade de 1 m. Depois, o
   HORÁRIO: cada bonde sai pra chegar na boca na hora dele (o visitante
   antes: a PM traz ele cedo); se ainda assim dois bondes rivais passam a
   menos de ENCONTRO m um do outro na cidade, a saída do visitante
   adianta de 3 em 3 minutos.

   DENTRO DO ESTÁDIO a rota é a de rotas_estadios.js (da boca do portão
   até o centro do setor, pela fila, a catraca, o corredor e o vomitório,
   e dali até a vaga de cada um), girada e posta no mapa.

   O BONDE é uma massa solta (o dono, 27/09/2026, com a foto de um bonde
   na rua: "evite fazer um movimento padronizado caminhando, deixando
   eles mais espalhados"): cada um num lugar sorteado dele, a PERTO m ou
   mais dos outros, numa faixa de LARGURA m (que aperta onde a rua
   aperta e perto do cordão) com AREA m² por
   pessoa; o desenho respira devagar (uma onda que passa pelo bonde) e
   cada um balança pro lado no tempo dele. Parado (a emboscada, a briga),
   o bonde encolhe: quem vem atrás anda até APERTA do comprimento, e na
   saída o da frente vai primeiro. Antes de sair, a torcida fica em
   RODINHAS na frente da sede (ou de onde sai), confraternizando, e cada
   um sai da rodinha a tempo de pegar o lugar dele no bonde.
   NO PORTÃO, AS RAIAS (rotas_estadios.js): cada um vai pra raia do lado
   dele no bonde; na boca da raia, a revista (na vez dele, no PM que
   cuida daquela raia); depois anda até a parada na frente da catraca —
   CATRACA s cada um, e cada raia tem a sua; na fila, NA_FILA m um do
   outro. Passou, volta pro caminho da vaga dele.

   Unidades: as de mundo da planta (1 m = M), x pro leste, z (o y da
   planta) pro sul. O relógio do jogo em segundos do dia.
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { ROTAS_ESTADIOS } from './rotas_estadios.js';
import { planejarArquibancada, criarArquibancada } from './arquibancada.js';

const ARREDOR = 110;        // m de rua a partir dos portões: os arredores (encolhe se uma sede fica perto)
const CORREDOR = 8;         // m de rua (andando, sem atravessar parede) em volta da rota do visitante: o corredor dele nos arredores
const FOLGA_BOA = 2.5;      // m até a parede: daí pra mais, o passo custa 1
const FOLGA_MIN = 0.7;      // m: com menos, o bonde não passa
const MARCHA = 1.25;        // m/s, o bonde na rua (e na raia do portão)
const DENTRO = 1.05;        // m/s, depois da catraca: na escada, no corredor
const AREA = 1.9;           // m² de rua por pessoa no bonde andando (a massa solta da foto, não a fileira)
const LARGURA = 4.4;        // m: a largura do bonde, onde a rua deixa
const PERTO = 0.95;         // m: o mínimo entre dois no desenho do bonde
const APERTA = 0.5;         // parado (a emboscada, a briga), o bonde encolhe até esta fração do comprimento
const CATRACA = 2.0;        // s de cada um na catraca (cada raia tem a sua)
const NA_FILA = 0.65;       // m entre um e o da frente, na fila da raia
const REVISTA = 5;          // s de revista por pessoa, na boca da raia (um PM revista um de cada vez)
const REVISTA_POR_PM = 10;  // bonecos que passam num portão pra cada PM da revista dele (no máximo um por raia)
const PM_POR_TORCEDOR = 0.25; // a PM do jogo: um PM pra cada 4 torcedores das torcidas do jogo (em bonecos, os dois)
const MORAL_IA = 12;        // a moral com que toda torcida da IA nasce no jogo (`mundo()`, js/mundo/relacoes.js), de 0 a 20
const CARAVANA_MIN = 5;     // a caravana mínima (`MINIMO` de js/gestao/planejamento.js); com menos de pé que isso, não vem
/* a briga entre duas IAs (`brigaIA`, js/mundo/relacoes.js; a tabela de js/diajogo/simular.js) */
const CHANCE_FAVORITO = 0.70;
const BAIXAS = { perdeu: { ferido: [0.25, 0.40], preso: [0.05, 0.12] }, venceu: { ferido: [0.08, 0.16], preso: [0.01, 0.04] } };
/* a ficha de cada cargo sem o mundo vivo (`mediaDeFichaGerada`): a base dele + 1,5 (abaixo do teto) */
const FICHA_DO_CARGO = { diretoria: 15.5, frente: 11.5, componente: 6.5, novato: 2.5 };
/* o que o aliado decide, em %: [não recebe, hospeda, hospeda e escolta] — a irmandade (2) e o aliado (1) */
const HOSPEDA = { 2: [10, 30, 60], 1: [35, 45, 20] };
/* a chance de procurar a rival (`chanceDeProcurar`, js/mundo/praca.js): a base pela relação, a paridade */
const BASE_PROCURA = { 'Maior Rival': 55, 'Rival': 25 };   // o dono, 27/09/2026 (o jogo tinha 88 e 72)
const PISO_PARIDADE = 0.45, PAR_PARIDADE = 0.8;
const BRIGA = 45;           // s de briga
const EMBOSCADA = 150;      // s: quem ataca chega no ponto esse tanto antes do alvo
const ESCONDIDO = 14;       // m: e espera esse tanto antes do ponto, na rua dele
const REAGRUPA = 120;       // s: depois da briga, o alvo junta os dele antes de seguir
const ESQUINA = 18;         // m: a rua que sai de um ponto, nos quatro rumos, pra ele ser esquina (a briga na pista)
const PRIVADO = 8;          // quanto custa a mais andar fora da rua e da calçada (o lote, o terreno baldio, o quintal, a praça)
const ESPERA_PORTA = 6;     // s: na concentração, quem ataca dobra a última esquina e quase não espera
const REAGRUPA_PORTA = 90;  // s: na concentração, entre o fim da briga e a hora de o bonde sair
const CORRE = 3.2;          // m/s: quem ataca, na hora de cair em cima
const ENCONTRO = 60;        // m: rivais mais perto que isso na cidade é encontro
const TRAVESSIA = 15;       // m: as rotas de dois rivais mais perto que isso na cidade é um cruzamento (a PM fecha)
const MARGEM = 300;         // s: num cruzamento, o primeiro passa (o rabo) pelo menos isso antes de o segundo chegar
const LONGE_DO_PORTAO = 12; // m: a rota que traça o corredor do visitante não passa mais perto que isso da boca de um portão do mandante (quando o mapa deixa)
const PERTO_DO_VISITANTE = 15; // m: quando o corredor abre pro mandante, ele ainda não chega mais perto que isso do portão do visitante
const LONGE_DO_LADO = 6;    // o quanto custa a mais, por fora dos arredores, andar rente ao pedaço do lado rival (cai pela metade a cada 17 m)
const BOLA = 16 * 3600;     // a bola rola às 16h
const FATOR_GENTE = 1;      // um boneco por torcedor na rua (era um por dois)
const MAX_BONDE = 400;      // bonecos por torcida, no máximo (a trava: o setor com caminho tem até 400 lugares)
const VEZES = [1, 10, 30, 60];

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const hora = s => { const m = Math.floor(s / 60 + 1e-6); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const luz = hex => { const n = parseInt(String(hex).slice(1), 16); return 0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255); };
/* a cor que se vê em cima do chão: a primeira da torcida, ou a segunda se a primeira é branca, preta ou cinza */
const corDaFita = t => { const cs = [t.cor, t.cor2, t.cor3].filter(Boolean); const viva = cs.find(c => { const l = luz(c), n = parseInt(c.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; return l > 40 && l < 225 && Math.max(r, g, b) - Math.min(r, g, b) > 40; }); return viva || (luz(cs[0] || '#888') > 128 ? '#f2f2f2' : '#1c1c1c'); };

/* ======================================================
   O MONTE (fila de prioridade) de números: a chave em Float64, o valor em Int32
   ====================================================== */
class Monte {
  constructor(cap = 1 << 16) { this.k = new Float64Array(cap); this.v = new Int32Array(cap); this.n = 0; }
  push(v, k) {
    if (this.n === this.k.length) { const k2 = new Float64Array(this.n * 2), v2 = new Int32Array(this.n * 2); k2.set(this.k); v2.set(this.v); this.k = k2; this.v = v2; }
    let i = this.n++;
    while (i > 0) { const p = (i - 1) >> 1; if (this.k[p] <= k) break; this.k[i] = this.k[p]; this.v[i] = this.v[p]; i = p; }
    this.k[i] = k; this.v[i] = v;
  }
  pop() {
    const topo = this.v[0], ultK = this.k[--this.n], ultV = this.v[this.n];
    let i = 0;
    for (;;) {
      let f = 2 * i + 1;
      if (f >= this.n) break;
      if (f + 1 < this.n && this.k[f + 1] < this.k[f]) f++;
      if (this.k[f] >= ultK) break;
      this.k[i] = this.k[f]; this.v[i] = this.v[f]; i = f;
    }
    this.k[i] = ultK; this.v[i] = ultV;
    return topo;
  }
  get chave() { return this.k[0]; }
}

/* ======================================================
   A GRADE DA ROTA: 1 m por célula, da grade do passo (0,5 m)
   ====================================================== */
function GradeDaRota(crua, M, foraDoEstadio) {
  const { g, nx, nz, ox, oz, c, ALCANCE } = crua;
  /* a FOLGA na grade fina: a distância até o que não se anda (chanfro 3-4) */
  const d = new Uint16Array(nx * nz);
  for (let k = 0; k < d.length; k++) d[k] = g[k] & ALCANCE ? 65000 : 0;
  /* o estádio (da fachada pra dentro) não é rua: dentro dele a rota é a de rotas_estadios.js */
  foraDoEstadio((i0, i1, j0, j1, dentro) => {
    for (let j = Math.max(0, j0); j <= Math.min(nz - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(nx - 1, i1); i++)
      if (d[j * nx + i] && dentro(ox + (i + 0.5) * c, oz + (j + 0.5) * c)) d[j * nx + i] = 0;
  }, { nx, nz, ox, oz, c });
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i; let v = d[k]; if (!v) continue;
    if (i > 0) v = Math.min(v, d[k - 1] + 3);
    if (j > 0) { v = Math.min(v, d[k - nx] + 3); if (i > 0) v = Math.min(v, d[k - nx - 1] + 4); if (i < nx - 1) v = Math.min(v, d[k - nx + 1] + 4); }
    d[k] = v;
  }
  for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) {
    const k = j * nx + i; let v = d[k]; if (!v) continue;
    if (i < nx - 1) v = Math.min(v, d[k + 1] + 3);
    if (j < nz - 1) { v = Math.min(v, d[k + nx] + 3); if (i < nx - 1) v = Math.min(v, d[k + nx + 1] + 4); if (i > 0) v = Math.min(v, d[k + nx - 1] + 4); }
    d[k] = v;
  }
  /* a grade grossa: 2 × 2 células finas, com a maior folga delas (em metros) */
  const CX = Math.ceil(nx / 2), CZ = Math.ceil(nz / 2), N = CX * CZ;
  const folga = new Float32Array(N), anda = new Uint8Array(N), mult = new Float32Array(N);
  for (let J = 0; J < CZ; J++) for (let I = 0; I < CX; I++) {
    let m = 0;
    for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) { const i = 2 * I + a, j = 2 * J + b; if (i < nx && j < nz) m = Math.max(m, d[j * nx + i]); }
    const f = m / 3 * 0.5, K = J * CX + I;
    folga[K] = f;
    anda[K] = f >= FOLGA_MIN ? 1 : 0;
    mult[K] = 1 + 3 * Math.max(0, (FOLGA_BOA - f) / FOLGA_BOA);
  }
  const L = 2 * c;                               // o lado da célula grossa, em unidades de mundo
  const centro = K => [ox + ((K % CX) + 0.5) * L, oz + (Math.floor(K / CX) + 0.5) * L];
  const celula = (x, z) => { const I = Math.floor((x - ox) / L), J = Math.floor((z - oz) / L); return I < 0 || J < 0 || I >= CX || J >= CZ ? -1 : J * CX + I; };
  /* a célula andável mais perto de (x, z), até `raio` m */
  function perto(x, z, raio = 25, ok = K => anda[K]) {
    const I0 = Math.floor((x - ox) / L), J0 = Math.floor((z - oz) / L);
    for (let r = 0; r <= raio; r++) {
      let melhor = -1, md = Infinity;
      for (let J = J0 - r; J <= J0 + r; J++) for (let I = I0 - r; I <= I0 + r; I++) {
        if (Math.max(Math.abs(I - I0), Math.abs(J - J0)) !== r || I < 0 || J < 0 || I >= CX || J >= CZ) continue;
        const K = J * CX + I;
        if (!ok(K)) continue;
        const [cx, cz] = centro(K), dd = (cx - x) ** 2 + (cz - z) ** 2;
        if (dd < md) { md = dd; melhor = K; }
      }
      if (melhor >= 0) return melhor;
    }
    return -1;
  }
  /* a folga (m) em (x, z) */
  const folgaEm = (x, z) => { const K = celula(x, z); return K < 0 ? 0 : folga[K]; };
  return { CX, CZ, N, folga, anda, mult, L, M, centro, celula, perto, folgaEm };
}

/* O CAMINHO de menor custo (A*): `custo[K]` é o multiplicador da célula
   (Infinity: não passa); o passo de a pra b custa o comprimento × a média
   dos dois. Sem `fim`, é o Dijkstra de todas as `fontes` até `limite` (m) */
function Buscador(R) {
  /* a distância em 64 bits: em 32, o número guardado arredonda pra cima e
     o mesmo caminho parece "melhor" de novo toda vez — cada vizinho volta
     pro monte, sem fim (na Bahia invertida, a memória acabava) */
  const dist = new Float64Array(R.N).fill(Infinity), pai = new Int32Array(R.N).fill(-1);
  let tocados = new Int32Array(1 << 16), nToc = 0;
  const toca = K => { if (nToc === tocados.length) { const t2 = new Int32Array(nToc * 2); t2.set(tocados); tocados = t2; } tocados[nToc++] = K; };
  function limpar() { for (let i = 0; i < nToc; i++) { const K = tocados[i]; dist[K] = Infinity; pai[K] = -1; } nToc = 0; }
  const DI = [1, -1, 0, 0, 1, 1, -1, -1], DJ = [0, 0, 1, -1, 1, -1, 1, -1], DL = [1, 1, 1, 1, Math.SQRT2, Math.SQRT2, Math.SQRT2, Math.SQRT2];
  function buscar(fontes, custo, fim = -1, limite = Infinity) {
    limpar();
    const monte = new Monte(1 << 14), CX = R.CX, CZ = R.CZ;
    const fx = fim >= 0 ? fim % CX : 0, fz = fim >= 0 ? (fim - fim % CX) / CX : 0, R2 = Math.SQRT2 - 1;
    const h = fim < 0 ? () => 0 : K => { const I = K % CX, dx = Math.abs(I - fx), dz = Math.abs((K - I) / CX - fz); return dx > dz ? dx + R2 * dz : dz + R2 * dx; };
    for (const K of fontes) { if (K < 0 || custo[K] === Infinity) continue; dist[K] = 0; toca(K); monte.push(K, h(K)); }
    while (monte.n) {
      const chave = monte.chave, K = monte.pop();
      if (chave - h(K) > dist[K] + 1e-3) continue;
      if (K === fim) break;
      const I = K % CX, J = (K - I) / CX, cK = custo[K], dK = dist[K];
      for (let v = 0; v < 8; v++) {
        const a = I + DI[v], b = J + DJ[v];
        if (a < 0 || b < 0 || a >= CX || b >= CZ) continue;
        const K2 = b * CX + a, c2 = custo[K2];
        if (c2 === Infinity) continue;
        /* na diagonal, as duas do lado têm de passar (não corta a quina) */
        if (v >= 4 && (custo[J * CX + a] === Infinity || custo[b * CX + I] === Infinity)) continue;
        const nd = dK + DL[v] * (cK + c2) * 0.5;
        /* (escrito assim, um custo que não é número não entra: senão a busca não acaba) */
        if (!(nd < dist[K2]) || nd > limite) continue;
        if (dist[K2] === Infinity) toca(K2);
        dist[K2] = nd; pai[K2] = K;
        monte.push(K2, nd + h(K2));
      }
    }
    if (fim < 0 || dist[fim] === Infinity) return null;
    const cam = [];
    for (let K = fim; K >= 0; K = pai[K]) cam.push(K);
    return cam.reverse();
  }
  return { buscar, dist, pai };
}

/* O CAMINHO DE QUEM NÃO VAI PRO ESTÁDIO (o jogo 3D, dia3d.js: o nosso
   bonde indo pra investida num jogo de outros clubes, e voltando pra
   sede): de (x0, z0) a (x1, z1) pela grade do plano, a rua e a calçada
   primeiro (o lote e a casa custam PRIVADO vezes mais: `R.mult`). Devolve
   a trilha ({ pts, acc, L, ponto(s) }, unidade de mundo), ou null */
export function caminhoNaRua(plano, x0, z0, x1, z1) {
  const R = plano && plano.R;
  if (!R) return null;
  const ok = K => R.anda[K] && (!R.publico || R.publico[K]);
  const K0 = R.perto(x0, z0, 30, ok), K1 = R.perto(x1, z1, 30, ok);
  if (K0 < 0 || K1 < 0) return null;
  if (!R.custoLivre) { const c = new Float32Array(R.N); for (let K = 0; K < R.N; K++) c[K] = R.anda[K] ? R.mult[K] : Infinity; R.custoLivre = c; }
  const cam = Buscador(R).buscar([K0], R.custoLivre, K1);
  if (!cam) return null;
  /* (de três em três células: a trilha anda reta entre elas) */
  const pts = [[x0, 0, z0]];
  for (let i = 0; i < cam.length; i += 3) { const [x, z] = R.centro(cam[i]); pts.push([x, 0, z]); }
  const [xf, zf] = R.centro(cam[cam.length - 1]);
  pts.push([xf, 0, zf]);
  return Trilha(pts);
}

/* distância (m, chanfro) na grade grossa até as células marcadas em `fonte` */
function distanciaAte(R, fonte) {
  const { CX, CZ, N } = R, d = new Float32Array(N);
  for (let K = 0; K < N; K++) d[K] = fonte[K] ? 0 : 1e9;
  const a = 1, b = Math.SQRT2;
  for (let J = 0; J < CZ; J++) for (let I = 0; I < CX; I++) {
    const K = J * CX + I; let v = d[K];
    if (I > 0) v = Math.min(v, d[K - 1] + a);
    if (J > 0) { v = Math.min(v, d[K - CX] + a); if (I > 0) v = Math.min(v, d[K - CX - 1] + b); if (I < CX - 1) v = Math.min(v, d[K - CX + 1] + b); }
    d[K] = v;
  }
  for (let J = CZ - 1; J >= 0; J--) for (let I = CX - 1; I >= 0; I--) {
    const K = J * CX + I; let v = d[K];
    if (I < CX - 1) v = Math.min(v, d[K + 1] + a);
    if (J < CZ - 1) { v = Math.min(v, d[K + CX] + a); if (I < CX - 1) v = Math.min(v, d[K + CX + 1] + b); if (I > 0) v = Math.min(v, d[K + CX - 1] + b); }
    d[K] = v;
  }
  return d;
}

/* os grupos de células marcadas (vizinhas de 8 lados) */
function grupos(R, marca) {
  const { CX, CZ, N } = R, visto = new Uint8Array(N), out = [];
  for (let K0 = 0; K0 < N; K0++) {
    if (!marca[K0] || visto[K0]) continue;
    const g = [K0]; visto[K0] = 1;
    for (let q = 0; q < g.length; q++) {
      const K = g[q], I = K % CX, J = (K - I) / CX;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const a = I + di, b = J + dj;
        if (a < 0 || b < 0 || a >= CX || b >= CZ) continue;
        const K2 = b * CX + a;
        if (marca[K2] && !visto[K2]) { visto[K2] = 1; g.push(K2); }
      }
    }
    out.push(g);
  }
  return out;
}
/* a reta que atravessa um grupo de células (o eixo maior dele): {a, b, meio, dir} em mundo */
function retaDoGrupo(R, g) {
  let sx = 0, sz = 0;
  const pts = g.map(K => R.centro(K));
  for (const [x, z] of pts) { sx += x; sz += z; }
  const mx = sx / pts.length, mz = sz / pts.length;
  let xx = 0, zz = 0, xz = 0;
  for (const [x, z] of pts) { xx += (x - mx) ** 2; zz += (z - mz) ** 2; xz += (x - mx) * (z - mz); }
  const ang = 0.5 * Math.atan2(2 * xz, xx - zz), ux = Math.cos(ang), uz = Math.sin(ang);
  let t0 = Infinity, t1 = -Infinity;
  for (const [x, z] of pts) { const t = (x - mx) * ux + (z - mz) * uz; t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
  const meiaCel = R.L / 2;
  return { a: [mx + ux * (t0 - meiaCel), mz + uz * (t0 - meiaCel)], b: [mx + ux * (t1 + meiaCel), mz + uz * (t1 + meiaCel)], meio: [mx, mz], dir: [ux, uz], n: g.length };
}

/* ======================================================
   A TRILHA: uma linha de pontos [x, y?, z] com o comprimento acumulado
   ====================================================== */
function Trilha(pts) {
  const n = pts.length, acc = new Float64Array(n);
  for (let i = 1; i < n; i++) acc[i] = acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]);
  const L = n ? acc[n - 1] : 0;
  let ult = 0;
  /* o ponto na distância s: x, y, z e a direção (tx, tz) */
  function ponto(s, o = {}) {
    s = clamp(s, 0, L);
    if (n < 2) { o.x = pts[0][0]; o.y = pts[0][1]; o.z = pts[0][2]; o.tx = 0; o.tz = 1; return o; }
    let i = ult;
    if (i >= n - 1 || acc[i] > s) i = 0;
    while (i < n - 2 && acc[i + 1] < s) i++;
    ult = i;
    const a = pts[i], b = pts[i + 1], l = acc[i + 1] - acc[i] || 1, t = (s - acc[i]) / l;
    o.x = a[0] + (b[0] - a[0]) * t; o.y = a[1] + (b[1] - a[1]) * t; o.z = a[2] + (b[2] - a[2]) * t;
    o.tx = (b[0] - a[0]) / l; o.tz = (b[2] - a[2]) / l;
    return o;
  }
  return { pts, acc, L, ponto };
}

/* ======================================================
   O BONDE SOLTO: o sorteio, o desenho e as contas de linha
   ====================================================== */
/* um sorteio que se repete (a mesma torcida, o mesmo desenho) */
function semente(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) h = Math.imul(h ^ txt.charCodeAt(i), 16777619);
  return () => { h = h + 0x6D2B79F5 | 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const liso = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
/* o hash do jogo (FNV-1a, `hash` de js/mundo/mapa.js): as contas fixas do jogo saem iguais aqui */
function hashDoJogo(txt) {
  let h = 2166136261;
  const s = String(txt);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
/* O DESENHO DO BONDE: cada um num lugar solto dentro de uma faixa de
   LARGURA m, com o comprimento pra AREA m² por pessoa, a PERTO m ou
   mais dos outros (sorteado até caber; se não cabe, o mínimo afrouxa);
   o primeiro na frente, no meio. Em metros: `o` atrás da cabeça, `l` pro
   lado. E o que é de cada um: a fase e o tempo do balanço pro lado, o
   tamanho do passo e a demora pra sair da rodinha */
function desenhoDoBonde(n, rnd) {
  const comp = Math.max(1.5, n * AREA / LARGURA), pts = [{ o: 0, l: 0 }];
  let dmin = PERTO, falhas = 0;
  while (pts.length < n) {
    const o = rnd() * comp, l = (rnd() - 0.5) * LARGURA;
    if (pts.every(q => (q.o - o) ** 2 + (q.l - l) ** 2 >= dmin * dmin)) { pts.push({ o, l }); falhas = 0; }
    else if (++falhas > 300) { dmin *= 0.95; falhas = 0; }
  }
  pts.sort((a, b) => a.o - b.o);
  for (const q of pts) { q.fl = rnd() * 6.28; q.wl = 2 * Math.PI / (5 + rnd() * 4); q.passo = 0.95 + rnd() * 0.3; q.reage = rnd() * 5; }
  return pts;
}
/* o ponto da linha V ([x, y, z] em fila) onde ela passa s* (a primeira vez), pela conta `sDe`; e o índice do ponto seguinte */
function depoisDe(V, sDe, sAlvo) {
  for (let i = 1; i < V.length; i++) {
    const s0 = sDe(V[i - 1]), s1 = sDe(V[i]);
    if (s1 < sAlvo) continue;
    if (s0 >= sAlvo) return { p: V[i - 1], i };
    const k = (sAlvo - s0) / (s1 - s0);
    return { p: [V[i - 1][0] + (V[i][0] - V[i - 1][0]) * k, V[i - 1][1] + (V[i][1] - V[i - 1][1]) * k, V[i - 1][2] + (V[i][2] - V[i - 1][2]) * k], i };
  }
  return null;
}
/* o ponto a `d` do começo da linha V (o comprimento em x, z) */
function naLinha(V, d) {
  for (let i = 1; i < V.length; i++) {
    const l = Math.hypot(V[i][0] - V[i - 1][0], V[i][2] - V[i - 1][2]);
    if (l >= d) { const k = l ? d / l : 0; return { p: [V[i - 1][0] + (V[i][0] - V[i - 1][0]) * k, V[i - 1][1] + (V[i][1] - V[i - 1][1]) * k, V[i - 1][2] + (V[i][2] - V[i - 1][2]) * k], i }; }
    d -= l;
  }
  return { p: V[V.length - 1], i: V.length - 1 };
}

/* ======================================================
   O PLANO: o jogo, as zonas, a PM, as rotas e o horário
   ====================================================== */
export function planejar(ctx, escolha = {}) {
  const { M, P } = ctx;
  const t0 = performance.now(), tempos = {};
  const marca = k => { tempos[k] = Math.round(performance.now() - t0); };
  const torcidas = P.torcidas().filter(t => t.clubeId);
  /* O JOGO DE VERDADE (o jogo 3D, 28/09/2026; o dono: "Vamos ligar o dia
     de jogo com arquibancada e invasão no cenário 3d"): quem joga (o
     mandante e o visitante da partida), a hora da bola, QUEM FOI (a
     presença da partida: a torcida e quantos dela, a mesma linha do
     cartão do jogo) e o BONDE DO JOGADOR (`nosso`: quantos, e — no jogo
     fora — se a caravana desce na entrada da cidade ou na sede do
     aliado que a hospeda, o que o jogador escolhe) */
  const doJogo = !!escolha.jogo;
  const bola = Number.isFinite(escolha.bola) ? escolha.bola : BOLA;
  const presenca = Array.isArray(escolha.presenca) ? new Map(escolha.presenca.filter(x => x && x.id && x.n > 0).map(x => [x.id, x])) : null;
  const nosso = escolha.nosso || null;
  const foi = t => !presenca || presenca.has(t.id) || (nosso && nosso.id === t.id);
  const clubes = P.clubes(), estadios = P.estadios();
  const rel = (a, b) => P.relacao ? P.relacao(a, b) : 'Neutro';
  /* OS JOGOS POSSÍVEIS: dois clubes da praça com torcida com sede; os
     daqui primeiro (a ordem de dados/cidades.js). E os DE FORA: os clubes
     de outra cidade com torcida que venha (a caravana) */
  const comSede = id => torcidas.filter(t => t.clubeId === id && t.porta);
  const lista = clubes.filter(c => comSede(c.id).length);
  const pares = [];
  for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
    const a = lista[i], b = lista[j];
    if (a.local && b.local) pares.push([a, b]);
  }
  if (!pares.length) for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) pares.push([lista[i], lista[j]]);
  /* AS DE PÉ (`disponiveisIA`): sem o jogo rodando, ninguém está ferido,
     preso ou em subsede — o efetivo inteiro. Com o jogo, ele responde. */
  const dePe = t => P.disponiveis ? P.disponiveis(t.id) : (t.membros || 20);
  /* A FICHA MÉDIA de quem briga (`mediaDeFichaGerada`, sem o mundo vivo):
     a pirâmide de cargos da torcida (`planoDeCargos`: a sobra do efetivo
     entra como novato; sem cargos na fonte, 5% de diretoria, 15% de frente
     e 30% de componentes), cada cargo com a ficha dele */
  const fichaMedia = t => {
    if (P.fichaMedia) return P.fichaMedia(t.id);
    const tot = Math.max(1, t.membros || 20), c = t.cargos;
    let plano;
    if (c && Object.keys(c).length) {
      plano = { diretoria: c.diretoria || 0, frente: c.frente || 0, componente: c.componentes || c.componente || 0, novato: c.povao || c.novato || 0 };
      const soma = plano.diretoria + plano.frente + plano.componente + plano.novato;
      if (tot > soma) plano.novato += tot - soma;
    } else {
      const d = Math.max(2, Math.round(tot * 0.05)), f = Math.round(tot * 0.15), k = Math.round(tot * 0.30);
      plano = { diretoria: d, frente: f, componente: k, novato: Math.max(0, tot - d - f - k) };
    }
    let soma = 0, n = 0;
    for (const cargo in plano) { soma += plano[cargo] * FICHA_DO_CARGO[cargo]; n += plano[cargo]; }
    return n ? soma / n : 1;
  };
  /* A CARAVANA (`caravanaDe`): vontade = 0,72 − 2 trechos × 0,09 + 0,4 × a
     moral, vezes o redutor de 0,6 do visitante; no mínimo CARAVANA_MIN */
  const caravana = t => {
    const v = dePe(t);
    if (v <= 0) return 0;
    const moral = (P.moralIA ? P.moralIA(t.id) : MORAL_IA) / 20;
    const vontade = clamp(0.72 - 2 * 0.09 + moral * 0.4, 0.08, 0.95);
    return Math.min(v, Math.max(CARAVANA_MIN, Math.round(v * vontade * 0.6)));
  };
  const quemVem = id => (P.torcidasDoClube ? P.torcidasDoClube(id) : []).filter(t => presenca ? foi(t) : caravana(t) >= CARAVANA_MIN);
  const deFora = (P.clubesDeFora ? P.clubesDeFora() : []).filter(c => quemVem(c.id).length).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  if (!lista.length) return { erro: 'Nesta praça nenhum clube tem torcida com sede no mapa: não dá pra montar o jogo.' };
  /* o de fora que vem quando não se escolhe (a praça de um clube só): o de
     torcida mais rival das do mandante — o clássico da região */
  const rixa = (casaId, foraId) => {
    let s = 0;
    for (const a of comSede(casaId)) for (const t of quemVem(foraId)) {
      const r = [rel(a.id, t.id), rel(t.id, a.id)];
      s += r.includes('Maior Rival') ? 3 : r.includes('Rival') ? 1 : 0;
    }
    return s;
  };
  let casa = null, fora = null;
  if (escolha.casa && lista.some(c => c.id === escolha.casa)) {
    casa = lista.find(c => c.id === escolha.casa);
    fora = lista.find(c => c.id === escolha.fora && c.id !== casa.id) || deFora.find(c => c.id === escolha.fora) || null;
  } else if (pares.length) {
    const par = pares[clamp(escolha.par || 0, 0, pares.length - 1)];
    [casa, fora] = escolha.inverter ? [par[1], par[0]] : par;
  } else casa = lista[0];
  /* (o jogo de verdade não troca de adversário: sem o mandante com sede aqui, ou sem o visitante, o dia não monta) */
  if (doJogo && (!casa || casa.id !== escolha.casa)) return { erro: 'O mandante do jogo não tem torcida com sede nesta praça: o dia de jogo não monta em 3D.' };
  if (doJogo && (!fora || fora.id !== escolha.fora)) return { erro: 'O visitante do jogo não tem torcida que venha: o dia de jogo não monta em 3D.' };
  if (!fora) fora = lista.find(c => c.id !== casa.id) || deFora.slice().sort((a, b) => rixa(casa.id, b.id) - rixa(casa.id, a.id))[0] || null;
  if (!fora) return { erro: 'Não achei adversário pro ' + casa.nome + ': nenhum clube de fora tem torcida que venha.' };
  const foraDaqui = lista.includes(fora);
  /* O ESTÁDIO: o do mandante no mapa; sem ele, o principal */
  const est = estadios.find(e => e.modelo && e.mandantes.includes(casa.id)) || estadios.find(e => e.modelo && e.principal) || estadios.find(e => e.modelo);
  if (!est) return { erro: 'O mapa desta praça não tem estádio do jogo.' };
  const rotas = ROTAS_ESTADIOS[est.modelo];
  if (!rotas) return { erro: 'Não tem rota de dentro do ' + est.modelo + ' (rode ferramentas/planta_html/rotas_estadios.mjs).' };
  /* o estádio mudou depois das rotas de dentro? (a marca do modelo, estadios3d.js) */
  const rotaVelha = !!(est.marca && rotas.marca && est.marca !== rotas.marca);
  /* o modelo no mundo: girado (o giro em graus) e na escala do mapa, 2 cm acima do chão */
  const th = -est.giro * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const mundo = (x, y, z) => [est.centro[0] + M * (x * cs + z * sn), 0.02 * M + M * y, est.centro[1] + M * (-x * sn + z * cs)];
  const centroEst = mundo(0, 0, 0);

  /* AS TORCIDAS DO JOGO: as dos dois clubes (do de fora, as que vêm),
     cada uma no setor do escalão dela (o que o modelo tem: o 3º visitante
     do de 10 divide o 2º), com a gente que vai pra rua e de onde sai */
  const sorte = txt => semente(txt + '|' + (escolha.sorteio || 0));
  const gente = escolha.gente || 1;
  const bonecos = (x, min) => Math.min(MAX_BONDE, Math.max(min, Math.round(x * FATOR_GENTE * gente)));
  /* O ALIADO QUE HOSPEDA quem vem de fora (`anfitriaoDe` do jogo): uma
     torcida da praça com sede — a irmandade dele antes do aliado; no
     empate, a do sorteio fixo do par —, e o que ela decide (HOSPEDA, ou
     o que o painel mandou). Se ela é do clube mandante, só hospeda (o
     dono, 27/09/2026: "Em jogo Fortaleza x CSA, o aliado só hospeda a
     TOMA, e ela sai da sede sozinha pro estádio"): no dia ela torce
     contra, e não anda com o visitante */
  function anfitriao(v) {
    /* O ANFITRIÃO QUE O JOGO DIZ (o jogo 3D, 28/09/2026; o dono: "Quando o
       jogador opta por hospedar na sede um aliado, eles aparecem na sede
       no dia do jogo e partem da sede pro estádio"): com o jogo rodando,
       quem recebe quem e o que decide vêm dele (`escolha.hospedes`, por
       visitante: a recepção que o jogador escolheu, quando a casa é a
       dele; o sorteio fixo do jogo, quando é da IA) — o sorteio daqui
       não inventa outro, e ninguém hospeda por conta a torcida do jogador */
    if (escolha.hospedes) {
      const dado = escolha.hospedes[v.id];
      const h = dado && dado.anfitriao ? torcidas.find(x => x.id === dado.anfitriao && x.porta && x.id !== v.id) : null;
      if (!h) return null;
      const doMandante = h.clubeId === casa.id;
      let decisao = dado.decisao === 'churrasco' ? 'escolta' : dado.decisao === 'escolta' || dado.decisao === 'hospedar' ? dado.decisao : 'nada';
      if (doMandante && decisao === 'escolta') decisao = 'hospedar';
      return { t: h, grau: dado.grau || 1, pct: null, tirou: 0, forcada: true, doMandante, doJogo: true, doJogador: !!dado.doJogador, decisao,
               escoltaMembros: Math.max(1, Math.round(dado.escolta || 1)) };
    }
    const grau = h => (v.irmandade || []).includes(h.id) ? 2 : (v.aliados || []).includes(h.id) ? 1 : 0;
    const bons = torcidas.filter(h => h.porta && h.id !== v.id && grau(h) > 0)
      .map(h => ({ h, g: grau(h), k: hashDoJogo(v.id + '|' + h.id) })).sort((a, b) => b.g - a.g || a.k - b.k);
    if (!bons.length) return null;
    const { h, g } = bons[0], pct = HOSPEDA[g], x = sorte('hospeda|' + v.id + '|' + h.id)() * 100;
    const forcada = escolha.anfitriao && escolha.anfitriao !== 'sorteio' ? escolha.anfitriao : null;
    const doMandante = h.clubeId === casa.id;
    let decisao = forcada || (x < pct[0] ? 'nada' : x < pct[0] + pct[1] ? 'hospedar' : 'escolta');
    if (doMandante && decisao === 'escolta') decisao = 'hospedar';
    return { t: h, grau: g, pct, tirou: Math.floor(x), forcada: !!forcada, doMandante, decisao,
             /* quantos ele manda junto (`escoltaDe` do jogo): de 5 a 10% do efetivo dele, pelo hash do par */
             escoltaMembros: Math.max(1, Math.round((h.membros || 20) * (5 + hashDoJogo('escolta|' + h.id + '|' + v.id) % 6) / 100)) };
  }
  const setoresDoLado = l => Object.keys(rotas.setores).filter(s => s[0] === l).sort();
  const lados = [{ lado: 'mandante', clube: casa, l: 'm' }, { lado: 'visitante', clube: fora, l: 'v' }];
  const vagasUsadas = {};
  const bondes = [];
  /* O ANFITRIÃO DO JOGADOR (o jogo 3D, 28/09/2026; o dono: "com o jogador
     sendo visitante podendo iniciar a rota ou na entrada ou na casa do
     aliado"): não é sorteio — é a ajuda que ele pediu no planejamento (a
     aliada que respondeu que recebe: hospedar, ou hospedar e escoltar) e
     a escolha dele na chegada (descer na entrada da cidade ou na sede
     dela). Da aliada do clube mandante, só a casa */
  function anfitriaoDoJogador() {
    if (!nosso || nosso.inicio !== 'aliado' || !nosso.aliado) return null;
    const h = torcidas.find(x => x.id === nosso.aliado && x.porta);
    if (!h) return null;
    const doMandante = h.clubeId === casa.id;
    const escolta = !doMandante && nosso.nivel !== 'hospedar' && (nosso.escolta || 0) > 0;
    return { t: h, grau: 2, pct: null, tirou: 0, forcada: true, doMandante, doJogador: true, decisao: escolta ? 'escolta' : 'hospedar',
             escoltaMembros: Math.max(1, Math.round(nosso.escolta || 10)) };
  }
  /* AS ESCOLTAS SE RESOLVEM ANTES (`naRuaEm`): quem escolta sai do
     efetivo de quem empresta e anda no bonde do visitante */
  const hospDe = {}, devido = {};
  for (const L of lados) {
    if (lista.includes(L.clube)) continue;
    for (const t of quemVem(L.clube.id)) {
      const h = hospDe[t.id] = nosso && t.id === nosso.id ? anfitriaoDoJogador() : anfitriao(t);
      if (h && h.decisao === 'escolta') devido[h.t.id] = (devido[h.t.id] || 0) + h.escoltaMembros;
    }
  }
  const ehNosso = t => !!nosso && t.id === nosso.id;
  for (const L of lados) {
    const daqui = lista.includes(L.clube);
    const ts = daqui ? comSede(L.clube.id).filter(foi) : quemVem(L.clube.id);
    /* (a torcida do jogador sem sede no mapa — o nível 0 — sai da entrada da cidade) */
    if (daqui && nosso && !ts.some(ehNosso)) { const t = torcidas.find(x => ehNosso(x) && x.clubeId === L.clube.id); if (t) ts.push(t); }
    ts.sort((a, b) => (b.poder || 0) - (a.poder || 0) || (b.membros || 0) - (a.membros || 0));
    const disponiveis = setoresDoLado(L.l);
    ts.forEach((t, r) => {
      const setor = disponiveis[Math.min(r, disponiveis.length - 1)], S = rotas.setores[setor];
      const jaUsadas = vagasUsadas[setor] || 0;
      /* quem vai: todo mundo de pé menos a escolta emprestada (a da praça) ou a caravana (a de fora);
         no jogo de verdade, a presença da partida (e o bonde do jogador, o que sobrou da linha do dia) */
      const pres = presenca && presenca.get(t.id);
      const naRua = ehNosso(t) && nosso.n > 0 ? Math.round(nosso.n)
                  : pres ? Math.max(1, Math.round(pres.n) - (daqui ? (devido[t.id] || 0) : 0))
                  : daqui ? Math.max(4, dePe(t) - (devido[t.id] || 0)) : caravana(t);
      const hosp = daqui ? null : hospDe[t.id], recebe = !!hosp && hosp.decisao !== 'nada';
      const nEsc = hosp && hosp.decisao === 'escolta' ? bonecos(hosp.escoltaMembros, 1) : 0;
      /* (a torcida inteira, um boneco por torcedor, até os lugares do setor) */
      const n = Math.min(bonecos(naRua, 2) + nEsc, S.vagas.length - jaUsadas);
      if (n <= 1) return;
      vagasUsadas[setor] = jaUsadas + n;
      bondes.push({ t, lado: L.lado, clube: L.clube, escalao: r + 1, setor, S, portao: rotas.portoes[S.portao], nPortao: S.portao, vaga0: jaUsadas, n, cor: corDaFita(t),
                    naRua, deFora: !daqui, anfitriao: hosp, nossa: ehNosso(t),
                    inicio: daqui && t.porta ? { tipo: 'sede', porta: t.porta } : recebe ? { tipo: 'aliado', porta: hosp.t.porta, t: hosp.t } : { tipo: 'entrada', porta: null },
                    escolta: nEsc ? { t: hosp.t, membros: hosp.escoltaMembros, n: Math.min(nEsc, n - 1) } : null });
    });
  }
  if (!bondes.some(b => b.lado === 'mandante') || !bondes.some(b => b.lado === 'visitante')) return { erro: 'Falta torcida de um dos dois clubes.' };
  /* o desenho de cada bonde (o lugar solto de cada um) e o comprimento
     dele (a cauda, m); a escolta do aliado anda na frente, pelos lados */
  for (const b of bondes) {
    const rnd = semente(b.t.id + '|' + b.n);
    b.povo = desenhoDoBonde(b.n, rnd);
    b.cauda = b.povo[b.n - 1].o;
    b.onda = [rnd() * 6.28, rnd() * 6.28];
    b.daEscolta = new Uint8Array(b.n);
    if (b.escolta) {
      const frente = b.povo.map((q, m) => ({ q, m })).slice(1, Math.max(b.escolta.n + 1, Math.ceil(b.n / 2)))
        .sort((p, q) => Math.abs(q.q.l) - Math.abs(p.q.l));
      for (const { m } of frente.slice(0, b.escolta.n)) b.daEscolta[m] = 1;
    }
  }
  marca('jogo');

  /* A GRADE DA ROTA (o alcance da grade do passo só é feito na primeira vez que alguém precisa) */
  ctx.grade.alcancar();
  const crua = ctx.grade.crua();
  const R = GradeDaRota(crua, M, (marcar, G) => {
    for (const e of estadios) {
      if (!e.terreno || !ctx.noEstadio) continue;
      const t = e.terreno;
      marcar(Math.floor((t.x0 - G.ox) / G.c), Math.ceil((t.x1 - G.ox) / G.c), Math.floor((t.y0 - G.oz) / G.c), Math.ceil((t.y1 - G.oz) / G.c), ctx.noEstadio);
    }
  });
  /* O CHÃO DA RUA (o dono, 28/09/2026: "alguns membros das torcidas estão
     dentro de terrenos baldios e casas, organize pra eles ficarem somente
     nas calçadas e ruas, porque senão eles ficam presos aí dentro"): o
     asfalto e a calçada (a planta, `naRuaOuCalcada`) e o terreno do estádio
     (a esplanada, os portões). O resto que o corpo alcança — o lote, o
     terreno baldio, o quintal, a sede por dentro, a praça, a viela — custa
     PRIVADO vezes mais pra andar: a rota só passa por lá se não tem outro
     jeito. A rodinha da concentração e a faixa do bonde ficam só nele
     (`R.publico`) */
  {
    const publico = R.publico = new Uint8Array(R.N);
    const naRua = P.naRuaOuCalcada ? (x, z) => P.naRuaOuCalcada(x, z) : () => true;
    const terrenos = estadios.filter(e => e.terreno).map(e => e.terreno);
    for (let K = 0; K < R.N; K++) {
      if (!R.anda[K]) continue;
      const [x, z] = R.centro(K);
      if (naRua(x, z) || terrenos.some(t => x >= t.x0 && x <= t.x1 && z >= t.y0 && z <= t.y1)) publico[K] = 1;
      else R.mult[K] *= PRIVADO;
    }
  }
  const B = Buscador(R);
  marca('grade');

  /* OS PORTÕES no mundo: a boca (onde a rua encosta) de cada um, na grade */
  const portoes = rotas.portoes.map((p, i) => {
    const w = mundo(p.boca[0], 0, p.boca[2]), K = R.perto(w[0], w[2], 20);
    return { ...p, i, mundo: w, K, lado: p.lado };
  });
  if (portoes.some(p => p.K < 0)) return { erro: 'A boca de um portão do ' + est.nome + ' não dá na rua.' };
  const N = R.N, CX = R.CX, CZ = R.CZ, dm = R.L / M, iV = portoes.findIndex(p => p.lado === 'visitante');

  /* OS ARREDORES: o que se anda até `raio` m de algum portão; o PORTÃO
     MAIS PERTO de cada pedaço (`dono`) e o lado dele (`perto`: 0, um do
     mandante; 1, o do visitante) */
  const livre = new Float32Array(N);
  for (let K = 0; K < N; K++) livre[K] = R.anda[K] ? 1 : Infinity;
  const perto = new Int8Array(N).fill(-1), dono = new Int8Array(N).fill(-1), dPortao = new Float32Array(N).fill(Infinity);
  /* a distância andando até cada portão (em células) */
  const dG = portoes.map((p, i) => {
    B.buscar([p.K], livre, -1, 900);
    const dd = new Float32Array(N);
    for (let K = 0; K < N; K++) { const d = dd[K] = B.dist[K]; if (d < dPortao[K]) { dPortao[K] = d; dono[K] = i; perto[K] = p.lado === 'mandante' ? 0 : 1; } }
    return dd;
  });
  /* A ENTRADA DA CIDADE de quem vem de fora e não tem quem o receba: o
     pórtico de caminho mais curto até o portão do visitante; a caravana
     desce 12 m pra dentro dele e vai a pé */
  const semCasa = bondes.filter(b => b.inicio.tipo === 'entrada');
  if (semCasa.length) {
    let melhor = null;
    for (const e of (P.entradas ? P.entradas() : [])) {
      const K = R.perto(e.x + e.dir[0] * 12 * M, e.y + e.dir[1] * 12 * M, 60);
      if (K < 0) continue;
      const cam = B.buscar([K], livre, portoes[iV].K);
      if (!cam) continue;
      const [x, z] = R.centro(K);
      if (!melhor || cam.length < melhor.n) melhor = { e, n: cam.length, porta: { x, y: z, fx: e.dir[0], fy: e.dir[1] } };
    }
    for (const b of semCasa) if (melhor) { b.inicio.porta = melhor.porta; b.inicio.entrada = melhor.e; }
  }
  const deOnde = b => b.inicio.tipo === 'entrada' ? 'a entrada da cidade' : b.inicio.tipo === 'aliado' ? 'a sede do aliado' : 'a sede';
  /* o raio: ARREDOR, ou menos se uma sede do jogo fica perto (ela tem de sair de fora deles) */
  let raio = ARREDOR;
  for (const b of bondes) {
    b.porta = b.inicio.porta;
    const K = b.porta ? R.perto(b.porta.x, b.porta.y, 25) : -1;
    b.K0 = K;
    if (K >= 0 && dPortao[K] < Infinity) raio = Math.min(raio, 0.7 * dPortao[K] * dm);
  }
  raio = Math.max(45, raio);
  const noArredor = new Uint8Array(N);
  for (let K = 0; K < N; K++) if (R.anda[K] && dPortao[K] * dm <= raio) noArredor[K] = 1;
  marca('arredores');

  /* O CUSTO DE ANDAR de cada lado, numa tabela: o meio da rua mais barato
     que a beira; fora dos arredores, caro perto da sede rival e da rota
     rival (quando já tem); dentro, só a zona do lado (quando já tem) — e,
     antes das zonas, o visitante paga pra passar perto dos portões do
     mandante */
  const campo = Ks => { const f = new Uint8Array(N); for (const K of Ks) if (K >= 0) f[K] = 1; return distanciaAte(R, f); };
  const dSedes = { mandante: campo(bondes.filter(b => b.lado === 'mandante').map(b => b.K0)), visitante: campo(bondes.filter(b => b.lado === 'visitante').map(b => b.K0)) };
  const dRotas = { mandante: null, visitante: null };
  let zonaV = null, divisa = null, dCorredor = null;
  const outro = l => l === 'mandante' ? 'visitante' : 'mandante';
  /* a distância (reta) até o pedaço dos arredores de cada lado: por fora
     deles, a rota de um passa longe do pedaço do outro (senão o visitante
     contorna a zona do mandante rente à borda, e passa na boca por onde o
     mandante entra). Antes das zonas, o lado do portão mais perto */
  let dLado = null, proibidoV = null;
  function medirLados(doVisitante) {
    const fm = new Uint8Array(N), fv = new Uint8Array(N);
    for (let K = 0; K < N; K++) if (noArredor[K]) (doVisitante(K) ? fv : fm)[K] = 1;
    dLado = { mandante: distanciaAte(R, fm), visitante: distanciaAte(R, fv) };
  }
  medirLados(K => perto[K] === 1);
  function custoDo(lado, peloCorredor = false) {
    const c = new Float32Array(N), dS = dSedes[outro(lado)], dR = dRotas[outro(lado)], dL = dLado[outro(lado)];
    for (let K = 0; K < N; K++) {
      if (!R.anda[K]) { c[K] = Infinity; continue; }
      let v = R.mult[K];
      if (noArredor[K]) {
        /* o proibido só vale pra traçar o corredor; depois, o visitante anda na zona dele inteira */
        if (lado === 'visitante' && proibidoV && proibidoV[K] && !zonaV) { c[K] = Infinity; continue; }
        if (zonaV && peloCorredor) {
          /* o mandante do portão ilhado: anda no corredor do visitante depois
             que ele abre (o cordão sai), mas nunca perto do portão do visitante */
          if (dG[iV][K] * dm <= PERTO_DO_VISITANTE) { c[K] = Infinity; continue; }
          if (divisa[K] || zonaV[K] === 1) v += 3;
        } else if (zonaV) {
          if (divisa[K] || (zonaV[K] === 1) !== (lado === 'visitante')) { c[K] = Infinity; continue; }
          /* o mandante evita a rua do corredor do visitante (do outro lado do cordão) */
          if (lado === 'mandante') v += 8 * Math.exp(-dCorredor[K] * dm / 12);
        }
        else if (lado === 'visitante' && perto[K] === 0) v += 8;
      } else {
        v += 6 * Math.exp(-dS[K] * dm / 45);
        v += LONGE_DO_LADO * Math.exp(-dL[K] * dm / 25);
        if (dR) v += 10 * Math.exp(-dR[K] * dm / 30);
      }
      c[K] = v;
    }
    return c;
  }
  function rotasDo(lado, peloCorredor = false, so = null) {
    const c = custoDo(lado, peloCorredor);
    for (const b of bondes) if (b.lado === lado && (!so || so(b))) {
      if (b.K0 < 0) { b.erro = deOnde(b) + ' não dá na rua'; b.cels = null; continue; }
      b.cels = B.buscar([b.K0], c, portoes[b.nPortao].K);
      b.erro = b.cels ? null : 'não achei caminho d' + deOnde(b) + ' ao ' + b.portao.nome.toLowerCase();
    }
    const f = new Uint8Array(N);
    for (const b of bondes) if (b.lado === lado && b.cels) for (const K of b.cels) if (!noArredor[K]) f[K] = 1;
    dRotas[lado] = distanciaAte(R, f);
  }
  /* a BOCA dos arredores: onde a rua sai deles */
  const boca = new Uint8Array(N);
  for (let K = 0; K < N; K++) {
    if (!noArredor[K]) continue;
    const I = K % CX, J = (K - I) / CX;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = I + di, b2 = J + dj;
      if (a < 0 || b2 < 0 || a >= CX || b2 >= CZ) continue;
      const K2 = b2 * CX + a;
      if (!noArredor[K2] && R.anda[K2]) boca[K] = 1;
    }
  }
  /* 1. O CORREDOR DO VISITANTE: a PM traça primeiro a rota dele, da sede
     ao portão 3, longe dos portões do mandante (e fora do `proibidoV`);
     2. AS ZONAS: a do visitante é o pedaço dos arredores do lado do portão
     dele mais o corredor (CORREDOR m pra cada lado da rota); o resto é do
     mandante. A boca dos portões do mandante é sempre do mandante. E a
     DIVISA, onde a zona de um lado encosta na do outro: o cordão.
     Devolve quantos visitantes têm rota */
  function zonear() {
    zonaV = null; divisa = null;
    rotasDo('visitante');
    zonaV = new Uint8Array(N);
    /* o corredor: o que se anda até CORREDOR m da rota (a rua inteira, de
       parede a parede, e a boca das transversais); e a distância reta até
       a rota, pro mandante evitar a rua dela */
    const f = new Uint8Array(N), fontes = [];
    for (const b of bondes) if (b.lado === 'visitante' && b.cels) for (const K of b.cels) if (noArredor[K]) { f[K] = 1; fontes.push(K); }
    dCorredor = distanciaAte(R, f);
    B.buscar(fontes, livre, -1, CORREDOR / dm);
    for (let K = 0; K < N; K++) if (noArredor[K] && (perto[K] === 1 || B.dist[K] * dm <= CORREDOR)) zonaV[K] = 1;
    const r = Math.ceil(6 / dm);
    for (const p of portoes) if (p.lado === 'mandante') {
      const I0 = p.K % CX, J0 = (p.K - I0) / CX;
      for (let J = J0 - r; J <= J0 + r; J++) for (let I = I0 - r; I <= I0 + r; I++) if (I >= 0 && J >= 0 && I < CX && J < CZ) zonaV[J * CX + I] = 0;
    }
    /* mas o caminho do corredor (e a célula de cada lado) é sempre do
       visitante, mesmo na frente de um portão do mandante: ele passa antes,
       e a torcida daquele portão espera na sede a PM abrir o corredor */
    for (const K of fontes) {
      const I = K % CX, J = (K - I) / CX;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = I + di, b2 = J + dj; if (a >= 0 && b2 >= 0 && a < CX && b2 < CZ && noArredor[b2 * CX + a]) zonaV[b2 * CX + a] = 1; }
    }
    divisa = new Uint8Array(N);
    for (let K = 0; K < N; K++) {
      if (!noArredor[K]) continue;
      const I = K % CX, J = (K - I) / CX;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = I + di, b2 = J + dj;
        if (a < 0 || b2 < 0 || a >= CX || b2 >= CZ) continue;
        const K2 = b2 * CX + a;
        if (noArredor[K2] && zonaV[K2] !== zonaV[K]) divisa[K] = 1;
      }
    }
    /* quantos visitantes têm rota (nenhum, se o portão deles não dá na rua pela zona deles) */
    return daNaRua(portoes[iV].K, K => !divisa[K] && zonaV[K] === 1) ? bondes.filter(b => b.lado === 'visitante' && b.cels).length : 0;
  }
  /* o portão dá na rua (fora dos arredores) andando só por onde `ok` deixa? */
  function daNaRua(K0, ok) {
    const visto = new Uint8Array(N), fila = [K0];
    visto[K0] = 1;
    for (let q = 0; q < fila.length; q++) {
      const K = fila[q];
      if (!noArredor[K]) return true;
      const I = K % CX, J = (K - I) / CX;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = I + di, b2 = J + dj;
        if (a < 0 || b2 < 0 || a >= CX || b2 >= CZ) continue;
        const K2 = b2 * CX + a;
        if (!visto[K2] && R.anda[K2] && (!noArredor[K2] || ok(K2))) { visto[K2] = 1; fila.push(K2); }
      }
    }
    return false;
  }
  /* A CONFERÊNCIA: todo portão do mandante que uma torcida dele usa tem de
     dar na rua pela zona do mandante. Se o corredor cortou um (passou na
     rua dele e o deixou ilhado), a PM traça o corredor de novo mais longe
     daquele portão (16, 24, 36, 54 m andando) — enquanto o visitante ainda
     chegar no portão dele */
  const usados = [...new Set(bondes.filter(b => b.lado === 'mandante' && b.K0 >= 0).map(b => b.nPortao))];
  /* o corredor não passa na frente de um portão do mandante (a boca dele
     é sempre do mandante, e cortaria o corredor), quando o mapa deixa */
  const naFrente = new Uint8Array(N);
  const doMandante = portoes.map((p, i) => i).filter(i => portoes[i].lado === 'mandante');
  for (let K = 0; K < N; K++) if (noArredor[K] && doMandante.some(i => dG[i][K] * dm <= LONGE_DO_PORTAO)) naFrente[K] = 1;
  const nVisSede = bondes.filter(b => b.lado === 'visitante' && b.K0 >= 0).length;
  proibidoV = naFrente;
  let nVis = zonear();
  if (nVis < nVisSede) {
    const com = nVis;
    proibidoV = null; nVis = zonear();
    if (nVis <= com) { proibidoV = naFrente; nVis = zonear(); }
  }
  const longeDe = [], ilhadosAgora = () => usados.filter(i => !daNaRua(portoes[i].K, K => !divisa[K] && !zonaV[K]));
  let ilhados = ilhadosAgora();
  const tentativas = [{ D: 0, nVis, ilhados: ilhados.map(i => portoes[i].nome) }];
  for (const D of [16, 24, 36, 54]) {
    if (!ilhados.length) break;
    const antes = proibidoV;
    proibidoV = antes ? antes.slice() : new Uint8Array(N);
    for (let K = 0; K < N; K++) if (noArredor[K] && ilhados.some(i => dG[i][K] * dm <= D)) proibidoV[K] = 1;
    const n = zonear();
    tentativas.push({ D, nVis: n, ilhados: ilhadosAgora().map(i => portoes[i].nome) });
    if (n < nVis) { proibidoV = antes; zonear(); break; }
    for (const i of ilhados) if (!longeDe.includes(portoes[i].nome)) longeDe.push(portoes[i].nome);
    ilhados = ilhadosAgora();
  }
  /* 3. O MANDANTE, pela zona dele, longe das rotas do visitante; 4. O
     VISITANTE DE NOVO, no corredor, longe das do mandante */
  medirLados(K => zonaV[K] === 1);
  rotasDo('mandante');
  /* O CORREDOR QUE ABRE: se ainda sobrou portão do mandante ilhado (o mapa
     obriga o corredor a passar na frente dele), a torcida desse portão
     espera: a PM segura o corredor até o último visitante passar a catraca
     e só então abre (o cordão sai) pro mandante andar nele */
  const peloCorredor = b => b.lado === 'mandante' && !b.cels && ilhados.includes(b.nPortao);
  if (bondes.some(peloCorredor)) {
    const quem = bondes.filter(peloCorredor);
    rotasDo('mandante', true, peloCorredor);
    for (const b of quem) if (b.cels) b.peloCorredor = true;
  }
  for (const b of bondes) if (b.lado === 'mandante' && !b.cels && ilhados.includes(b.nPortao)) b.erro = 'o ' + b.portao.nome.toLowerCase() + ' ficou ilhado na zona do visitante (o corredor dele passa na rua do portão, e o mapa não deixa outro)';
  rotasDo('visitante');
  /* quem ficou sem rota: é o mapa (a sede não chega no portão nem sem PM
     nenhuma) ou é a zona? */
  for (const b of bondes) if (!b.cels && b.K0 >= 0) {
    b.semMapa = !B.buscar([b.K0], livre, portoes[b.nPortao].K);
    if (b.semMapa) b.erro = deOnde(b) + ' não chega no ' + b.portao.nome.toLowerCase() + ' nem sem a PM: o mapa não liga as duas';
  }
  marca('rotas');
  const naRotaQueAbre = new Uint8Array(N);
  for (const b of bondes) if (b.peloCorredor) for (const K of b.cels) {
    const I = K % CX, J = (K - I) / CX;
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const a = I + di, b2 = J + dj; if (a >= 0 && b2 >= 0 && a < CX && b2 < CZ) naRotaQueAbre[b2 * CX + a] = 1; }
  }
  const cordoes = grupos(R, divisa).filter(g => g.length >= 2).map(g => ({ ...retaDoGrupo(R, g), cels: g, abre: g.some(K => naRotaQueAbre[K]) }));
  const bocas = grupos(R, boca).map(g => {
    let m = 0; for (const K of g) m += zonaV[K] ? -1 : 1;
    return { ...retaDoGrupo(R, g), cels: g, lado: m >= 0 ? 'mandante' : 'visitante', usada: [], abre: g.some(K => naRotaQueAbre[K]) };
  });
  const bocaDe = new Int32Array(N).fill(-1);
  bocas.forEach((q, i) => { for (const K of q.cels) bocaDe[K] = i; });
  /* a zona de cada pedaço dos arredores (0: mandante, 1: visitante; -1: fora deles) */
  const zona = new Int8Array(N).fill(-1);
  for (let K = 0; K < N; K++) if (noArredor[K]) zona[K] = zonaV[K];
  marca('zonas');

  /* A RUA de cada bonde em pontos de mundo, enxuta (reta onde a folga
     deixa), e a boca dos arredores por onde ela entra (fica aberta) */
  const pode = { mandante: new Uint8Array(N), visitante: new Uint8Array(N) };
  for (let K = 0; K < N; K++) {
    if (!R.anda[K] || R.folga[K] < 1.0) continue;
    /* (a reta que enxuga a rota não corta caminho pelo lote nem pelo terreno baldio) */
    if (R.publico && !R.publico[K]) continue;
    if (!noArredor[K]) { pode.mandante[K] = pode.visitante[K] = 1; continue; }
    if (divisa[K]) continue;
    if (zonaV[K]) pode.visitante[K] = 1; else pode.mandante[K] = 1;
  }
  const podeReta = (Ka, Kb, ok) => {
    const [xa, za] = R.centro(Ka), [xb, zb] = R.centro(Kb), n = Math.ceil(Math.hypot(xb - xa, zb - za) / (R.L * 0.5));
    for (let s = 0; s <= n; s++) {
      const K = R.celula(xa + (xb - xa) * s / n, za + (zb - za) * s / n);
      if (K < 0 || !ok[K]) return false;
    }
    return true;
  };
  /* os pontos: a porta (ou de onde sai), os da rota enxuta e a boca do
     portão; `fixo`, o índice de uma célula que não sai (o esconderijo da
     emboscada) — devolve o s (na rua) dela */
  function fazerRua(b, c, ok, fixo = -1) {
    const keep = [0];
    let i = 0;
    while (i < c.length - 1) {
      let j = Math.min(c.length - 1, i + 60);
      if (fixo > i && j > fixo) j = fixo;
      while (j > i + 1 && !podeReta(c[i], c[j], ok)) j--;
      keep.push(j); i = j;
    }
    const pts = [[b.porta.x, 0, b.porta.y]];
    let iFixo = -1;
    for (const k of keep) { const [x, z] = R.centro(c[k]); if (k === fixo) iFixo = pts.length; pts.push([x, 0, z]); }
    const pb = portoes[b.nPortao].mundo;
    pts.push([pb[0], 0, pb[2]]);
    for (const p of pts) p[1] = ctx.chaoDaRua(p[0], p[2]);
    b.rua = Trilha(pts);
    b.comprimento = b.rua.L / M;
    return iFixo >= 0 ? b.rua.acc[iFixo] : -1;
  }
  for (const b of bondes) {
    if (!b.cels) continue;
    const c = b.cels;
    let kB = c.findIndex(K => noArredor[K]);
    if (kB < 0) kB = c.length - 1;
    let bi = bocaDe[c[kB]];
    if (bi < 0) { let md = Infinity; const [x, z] = R.centro(c[kB]); bocas.forEach((q, qi) => { const d = Math.hypot(x - q.meio[0], z - q.meio[1]); if (d < md) { md = d; bi = qi; } }); }
    if (bi >= 0) bocas[bi].usada.push(b);
    b.boca = bi;
    fazerRua(b, c, pode[b.lado]);
  }
  marca('enxugar');

  /* O HORÁRIO: cada um chega na boca do portão na hora dele (o visitante
     antes), e a saída do visitante adianta enquanto um bonde rival passa
     perto de outro na cidade, ou chega num CRUZAMENTO das rotas sem
     MARGEM de tempo do outro */
  const alvo = b => bola - (b.lado === 'visitante' ? 55 : 40) * 60 + (b.escalao - 1) * 5 * 60;
  const vivos = bondes.filter(b => b.rua);
  for (const b of vivos) { b.paradas = []; b.sai = alvo(b) - b.rua.L / M / MARCHA; }
  /* A CABEÇA DO BONDE: anda a MARCHA desde a saída; em cada parada
     ({s, ate}: a emboscada, a briga) fica até a hora `ate`. Onde ela está
     (s na rua) na hora t */
  const cabeca = (b, t) => {
    let ta = b.sai, sa = 0;
    if (t <= ta) return 0;
    for (const p of b.paradas) {
      const t1 = ta + (p.s - sa) / M / MARCHA;
      if (t < t1) return sa + (t - ta) * MARCHA * M;
      const t2 = Math.max(t1, p.ate);
      if (t < t2) return p.s;
      ta = t2; sa = p.s;
    }
    return Math.min(b.rua.L, sa + (t - ta) * MARCHA * M);
  };
  /* a hora em que a cabeça chega no ponto s da rua; e o rabo (o bonde tem `cauda` m) */
  const quando = (b, s) => {
    let ta = b.sai, sa = 0;
    for (const p of b.paradas) {
      if (s <= p.s) break;
      ta = Math.max(ta + (p.s - sa) / M / MARCHA, p.ate); sa = p.s;
    }
    return ta + (s - sa) / M / MARCHA;
  };
  const quandoRabo = (b, s) => quando(b, s) + b.cauda / MARCHA;
  const durRua = b => quando(b, b.rua.L) - b.sai;
  const Q = {};
  const naCidade = (b, s) => { const p = b.rua.ponto(s, Q), K = R.celula(p.x, p.z); return K < 0 || !noArredor[K]; };
  /* a menor distância entre dois bondes rivais na cidade (fora dos arredores): a cabeça e o rabo de cada um */
  function encontro(a, b) {
    const t0 = Math.min(a.sai, b.sai), t1 = Math.max(a.sai + durRua(a), b.sai + durRua(b));
    let melhor = { d: Infinity, t: 0, x: 0, z: 0 };
    const pa = {}, pb = {};
    for (let t = t0; t <= t1; t += 10) {
      const sa = cabeca(a, t), sb = cabeca(b, t);
      if (t < a.sai || t < b.sai) continue;
      if (sa >= a.rua.L - 1 || sb >= b.rua.L - 1) continue;
      for (const oa of [0, a.cauda * M]) for (const ob of [0, b.cauda * M]) {
        const s1 = Math.max(0, sa - oa), s2 = Math.max(0, sb - ob);
        if (!naCidade(a, s1) || !naCidade(b, s2)) continue;
        a.rua.ponto(s1, pa); b.rua.ponto(s2, pb);
        const d = Math.hypot(pa.x - pb.x, pa.z - pb.z) / M;
        if (d < melhor.d) melhor = { d, t, x: (pa.x + pb.x) / 2, z: (pa.z + pb.z) / 2 };
      }
    }
    return melhor;
  }
  const rivaisDe = b => vivos.filter(o => o.lado !== b.lado);
  /* OS CRUZAMENTOS: cada trecho em que a rota de um mandante passa a menos
     de TRAVESSIA m da de um visitante, na cidade (nos arredores, quem
     separa é o cordão), e o ponto mais perto dele. Quando dá, as rotas se
     evitam (o custo); quando o mapa obriga (o visitante mora do lado do
     mandante e o portão dele fica do outro), elas se cruzam, e quem separa
     é o horário */
  const cruzamentos = [];
  {
    const pa = {}, pb = {}, passo = 2 * M;
    for (const a of vivos) if (a.lado === 'mandante') for (const o of rivaisDe(a)) {
      let trecho = null;
      const fecha = () => { if (trecho) cruzamentos.push(trecho); trecho = null; };
      for (let sa = 0; sa <= a.rua.L; sa += passo) {
        if (!naCidade(a, sa)) { fecha(); continue; }
        a.rua.ponto(sa, pa);
        let md = Infinity, sb = 0;
        for (let s = 0; s <= o.rua.L; s += passo) { o.rua.ponto(s, pb); const d = (pa.x - pb.x) ** 2 + (pa.z - pb.z) ** 2; if (d < md) { md = d; sb = s; } }
        md = Math.sqrt(md) / M;
        if (md > TRAVESSIA || !naCidade(o, sb)) { fecha(); continue; }
        if (!trecho || md < trecho.d) { o.rua.ponto(sb, pb); trecho = { a, o, sa, sb, d: md, x: (pa.x + pb.x) / 2, z: (pa.z + pb.z) / 2 }; }
      }
      fecha();
    }
  }
  /* a folga de tempo num cruzamento (s): quanto antes de o segundo chegar (a cabeça) o primeiro já passou (o rabo) */
  const folgaNo = c => Math.max(quando(c.a, c.sa) - quandoRabo(c.o, c.sb), quando(c.o, c.sb) - quandoRabo(c.a, c.sa));
  /* a nota do horário de um visitante: 1 quando nenhum rival chega a ENCONTRO m dele na rua e ele passa cada cruzamento com MARGEM */
  const notaDo = b => {
    let e = { d: Infinity };
    for (const o of rivaisDe(b)) { const x = encontro(b, o); if (x.d < e.d) e = x; }
    let n = Math.min(1, e.d / ENCONTRO);
    for (const c of cruzamentos) if (c.o === b) n = Math.min(n, folgaNo(c) / MARGEM);
    return n;
  };
  for (const b of vivos.filter(b => b.lado === 'visitante').sort((a, c) => a.escalao - c.escalao)) {
    const base = b.sai;
    let melhor = { adianta: 0, n: notaDo(b) };
    for (let k = 1; k <= 10 && melhor.n < 1; k++) {
      b.sai = base - k * 180;
      const n = notaDo(b);
      if (n > melhor.n) melhor = { adianta: k * 3, n };
    }
    b.sai = base - melhor.adianta * 60;
    b.adiantou = melhor.adianta;
  }
  /* A FAIXA DE CADA RUA: quanto se anda pra cada lado da rota (m), a cada
     metro dela — até onde a rua acaba (a folga de 0,7 m da parede, do
     carro, do poste) ou até o cordão —; no pior de 2 m pra frente e pra
     trás, e alisada (o bonde não pula de largura de uma célula pra outra).
     A rota às vezes corre rente a uma parede: o bonde vai pro lado da rua */
  const alisar = w => {
    const n = w.length, mn = new Float32Array(n), out = new Float32Array(n);
    for (let i = 0; i < n; i++) { let v = Infinity; for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) v = Math.min(v, w[j]); mn[i] = v; }
    for (let i = 0; i < n; i++) { let sm = 0, c = 0; for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) { sm += mn[j]; c++; } out[i] = Math.min(sm / c, w[i] + 0.15); }
    return out;
  };
  /* a faixa do bonde no ponto s da rota: o meio dela (m pro lado da rota)
     e a meia largura — LARGURA onde cabe, centrada na rota, e empurrada
     pro lado que tem rua quando a rota corre rente a uma parede */
  const faixaEm = (b, s) => {
    const n = b.lados[0].length, i = Math.min(n - 1, Math.max(0, s / M)), i0 = Math.floor(i), i1 = Math.min(n - 1, i0 + 1), k = i - i0;
    const wl = b.lados[0][i0] + (b.lados[0][i1] - b.lados[0][i0]) * k, wr = b.lados[1][i0] + (b.lados[1][i1] - b.lados[1][i0]) * k;
    const livre = Math.max(0, wl + wr - 0.3);
    if (livre <= LARGURA) return { c: (wr - wl) / 2, h: livre / 2 };
    return { c: clamp(0, -wl + 0.15 + LARGURA / 2, wr - 0.15 - LARGURA / 2), h: LARGURA / 2 };
  };
  function prepararFaixa(b) {
    const n = Math.ceil(b.rua.L / M) + 1, lados = [new Float32Array(n), new Float32Array(n)];
    for (let i = 0; i < n; i++) {
      b.rua.ponto(i * M, Q);
      const nx = Q.tz, nz = -Q.tx;
      for (const [j, sg] of [[0, -1], [1, 1]]) {
        let d = 0;
        for (let k = 1; k <= 12; k++) {
          const K = R.celula(Q.x + nx * sg * k * 0.5 * M, Q.z + nz * sg * k * 0.5 * M);
          /* (o bonde se espalha na rua e na calçada, não pro lote do lado) */
          if (K < 0 || !R.anda[K] || divisa[K] || (R.publico && !R.publico[K])) break;
          d = k * 0.5;
        }
        lados[j][i] = d;
      }
    }
    b.lados = lados.map(alisar);
    /* onde o bonde se forma na saída: o primeiro ponto da rota com 2,4 m de faixa (de 3 a 12 m da porta) */
    let i0 = 3;
    while (i0 < 12 && i0 * M < b.rua.L * 0.5 && faixaEm(b, i0 * M).h < 1.2) i0++;
    b.s0 = Math.min(i0 * M, b.rua.L * 0.5);
  }
  for (const b of vivos) prepararFaixa(b);
  /* o lado (m) de quem está na fração u (−1 a 1) da faixa no ponto s */
  const ladoEm = (b, s, u) => { const f = faixaEm(b, s); return f.c + clamp(u, -1, 1) * f.h; };
  /* A CHEGADA NO PORTÃO (rotas_estadios.js): a raia de cada um, o caminho
     dele (a raia: a boca, onde é a revista, e a parada na frente da
     catraca; dali, a catraca e o caminho da vaga dele) */
  function prepararRaias(b) {
    const RP = rotas.portoes[b.nPortao], S = b.S, eixo = RP.eixo;
    const sDe = p => (p[0] - eixo.P0[0]) * eixo.w[0] + (p[2] - eixo.P0[1]) * eixo.w[1];
    const cam = [];
    for (let i = 0; i < S.caminho.length; i += 3) cam.push([S.caminho[i], S.caminho[i + 1], S.caminho[i + 2]]);
    const mascaras = S.raias || [];
    /* o fim da rua (a boca) e o lado de quem chega nela */
    const L = b.rua.L, E = b.rua.pts[b.rua.pts.length - 1];
    b.rua.ponto(Math.max(0, L - 0.5 * M), Q);
    const nx = Q.tz, nz = -Q.tx;
    const raias = !eixo ? [] : (RP.raias || []).map((r, k) => {
      const P = [];
      for (let i = 0; i < r.pts.length; i += 3) P.push([r.pts[i], r.pts[i + 1], r.pts[i + 2]]);
      return { k, P, para: r.para };
    });
    b.raias = raias;
    /* onde cada um chega no fim da rua: no lugar dele no bonde (o lado dele, na largura de lá) */
    const fins = b.povo.map(q => { const lat = ladoEm(b, L, q.l / (LARGURA / 2)); return [E[0] + nx * lat * M, E[2] + nz * lat * M]; });
    /* cada um na raia mais perto de onde ele chega, entre as que servem pra
       vaga dele, e as raias com a mesma gente (o mais perto primeiro) */
    const cap = Math.ceil(b.n / Math.max(1, raias.length)), cheia = new Int32Array(raias.length), pares = [];
    const entrada = raias.map(r => mundo(...r.P[0]));
    b.povo.forEach((q, m) => raias.forEach((r, k) => { if ((mascaras[b.vaga0 + m] || 0) >> r.k & 1) pares.push([Math.hypot(entrada[k][0] - fins[m][0], entrada[k][2] - fins[m][1]), m, k]); }));
    pares.sort((a, c) => a[0] - c[0]);
    b.pessoas = b.povo.map((q, m) => ({ m, raia: -1, b }));
    for (const [, m, k] of pares) if (b.pessoas[m].raia < 0 && cheia[k] < cap) { b.pessoas[m].raia = k; cheia[k]++; }
    /* (quem sobrou sem raia livre: a que serve pra ele mais perto, mesmo cheia) */
    for (const [, m, k] of pares) if (b.pessoas[m].raia < 0) b.pessoas[m].raia = k;
    for (const g of b.pessoas) {
      const vg = S.vagas[b.vaga0 + g.m], V = cam.slice(0, vg[0] + 1);
      for (let i = 1; i < vg.length; i += 3) V.push([vg[i], vg[i + 1], vg[i + 2]]);
      const r = raias[g.raia];
      let antes, depois;
      const x = r && depoisDe(V, sDe, sDe(r.P[r.P.length - 1]) + 0.5);
      if (x) { antes = r.P.slice(0, r.para + 1); depois = r.P.slice(r.para).concat([x.p], V.slice(x.i)); }
      else {
        /* sem raia (a rota de dentro é de antes das raias): o caminho da vaga, com a parada 7 m depois da boca */
        g.raia = -1;
        const y = naLinha(V, 7);
        antes = V.slice(1, y.i).concat([y.p]); depois = [y.p].concat(V.slice(y.i));
      }
      const [ex, ez] = fins[g.m];
      g.fila = Trilha([[ex, ctx.chaoDaRua(ex, ez), ez], ...antes.map(p => mundo(...p))]);
      g.dentro = Trilha(depois.map(p => mundo(...p)));
      g.Lf = g.fila.L / M;
      /* a boca da raia (a revista): o primeiro ponto dela; sem raia, a própria parada */
      g.Lm = x && g.fila.pts.length > 2 ? g.fila.acc[1] / M : g.Lf;
    }
  }
  for (const b of vivos) prepararRaias(b);

  /* A REVISTA NA ENTRADA: um PM pra cada REVISTA_POR_PM bonecos que passam
     no portão (no máximo um por raia, pelo menos um), tirados do efetivo
     do jogo antes dos outros postos — se não dá pra todos, um em cada
     portão primeiro (o de mais gente antes) e o resto onde tem mais gente
     por PM */
  const torcedores = vivos.reduce((s, b) => s + b.n, 0);
  const efetivo = Math.max(1, Math.round(torcedores * PM_POR_TORCEDOR));
  const revistaDo = {};
  {
    const us = [...new Set(vivos.map(b => b.nPortao))].map(i => {
      const bs = vivos.filter(b => b.nPortao === i), n = bs.reduce((s, b) => s + b.n, 0), raias = Math.max(1, ...bs.map(b => b.raias.length));
      return { i, n, quer: Math.min(raias, Math.max(1, Math.ceil(n / REVISTA_POR_PM))), r: 0 };
    }).sort((a, c) => c.n - a.n);
    let resta = efetivo;
    for (const u of us) if (resta > 0) { u.r = 1; resta--; }
    for (let mais = true; mais && resta > 0;) {
      mais = false;
      for (const u of us.slice().sort((a, c) => c.n / Math.max(1, c.r) - a.n / Math.max(1, a.r))) if (resta > 0 && u.r < u.quer) { u.r++; resta--; mais = true; }
    }
    for (const u of us) revistaDo[u.i] = u.r;
  }
  /* A ENTRADA DE CADA PORTÃO, com todo mundo que entra por ele: cada um
     chega na boca da raia dele no passo do bonde; a revista é por ordem
     de chegada, no PM que cuida daquela raia (os PMs dividem as raias em
     grupos vizinhos), REVISTA s cada um; dali ele anda até a parada e
     passa a catraca da raia (CATRACA s, por ordem). Quem ficou ferido na
     briga não entra */
  const ultimo = b => { let m = -Infinity; for (const v of b.passa) if (v < Infinity && v > m) m = v; return m; };
  function entradaDo(iP) {
    const bs = vivos.filter(b => b.nPortao === iP);
    const nR = Math.max(1, ...bs.map(b => b.raias.length)), r = revistaDo[iP] || 0;
    const grupoDe = k => r ? Math.min(r - 1, Math.floor(Math.max(0, k) * r / nR)) : -1;
    const gs = [];
    for (const b of bs) {
      b.chega = quando(b, b.rua.L);
      b.passa = new Float64Array(b.n).fill(Infinity);
      for (const g of b.pessoas) {
        g.fora = !!(b.ferido && b.ferido[g.m]);
        g.passa = Infinity; g.rev0 = g.rev1 = Infinity; g.pmRev = -1;
        g.tBoca = b.chega + (g.Lm + b.povo[g.m].o) / MARCHA;
        if (!g.fora) gs.push(g);
      }
    }
    gs.sort((a, c) => a.tBoca - c.tBoca);
    const livreAte = new Float64Array(Math.max(1, r)).fill(-Infinity);
    for (const g of gs) {
      const j = grupoDe(g.raia);
      if (j < 0) g.rev0 = g.rev1 = g.tBoca;
      else { g.rev0 = Math.max(g.tBoca, livreAte[j]); g.rev1 = g.rev0 + REVISTA; livreAte[j] = g.rev1; g.pmRev = j; }
      g.tParada = g.rev1 + (g.Lf - g.Lm) / MARCHA;
    }
    const porRaia = new Map();
    for (const g of gs) { if (!porRaia.has(g.raia)) porRaia.set(g.raia, []); porRaia.get(g.raia).push(g); }
    for (const l of porRaia.values()) {
      l.sort((a, c) => a.rev1 - c.rev1);
      let ant = -Infinity;
      l.forEach((g, j) => { g.j = j; g.mesmaRaia = l; ant = Math.max(g.tParada, ant) + CATRACA; g.passa = ant; g.b.passa[g.m] = ant; });
    }
    for (const b of bs) { let f = b.chega; for (const g of b.pessoas) if (!g.fora) f = Math.max(f, g.passa + g.dentro.L / M / DENTRO); b.fim = f; }
  }
  const portoesDo = lado => [...new Set(vivos.filter(b => b.lado === lado).map(b => b.nPortao))];
  for (const i of portoesDo('visitante')) entradaDo(i);

  /* o corredor abre um minuto depois do último visitante passar a catraca;
     o mandante que anda nele sai mais tarde, se precisar, pra entrar nele
     depois disso */
  let tAbre = null;
  const entraNoCorredor = b => {
    const k = b.cels.findIndex(K => noArredor[K] && (zonaV[K] === 1 || divisa[K]));
    if (k < 0) return null;
    const [x, z] = R.centro(b.cels[k]);
    /* o ponto da rua dele mais perto dessa célula */
    let sEntra = 0, md = Infinity;
    for (let s = 0; s <= b.rua.L; s += M) { b.rua.ponto(s, Q); const d = (Q.x - x) ** 2 + (Q.z - z) ** 2; if (d < md) { md = d; sEntra = s; } }
    return sEntra;
  };
  if (vivos.some(b => b.peloCorredor)) {
    tAbre = Math.max(...vivos.filter(b => b.lado === 'visitante').map(ultimo)) + 60;
    for (const b of vivos) if (b.peloCorredor) {
      const sEntra = entraNoCorredor(b);
      if (sEntra == null) continue;
      const atraso = tAbre + 30 - quando(b, sEntra);
      if (atraso > 0) { b.sai += atraso; b.esperou = Math.ceil(atraso / 60); }
    }
  }
  for (const i of portoesDo('mandante')) entradaDo(i);
  /* QUANTO CADA UM ESTÁ ATRÁS DA CABEÇA (m) na hora t: o `o` dele, menos
     o que o bonde encolheu parado (a emboscada, a briga) — quem vem atrás
     anda até ficar a APERTA do lugar dele; na saída, a cabeça anda e cada
     um só sai quando o espaço dele abre de novo */
  const atras = (b, o, t) => {
    let ta = b.sai, sa = 0, oo = o;
    for (const p of b.paradas) {
      const t1 = ta + (p.s - sa) / M / MARCHA, t2 = Math.max(t1, p.ate);
      if (t <= t1) break;
      const oParado = Math.max(o * APERTA, o - MARCHA * (Math.min(t, t2) - t1));
      oo = t <= t2 ? oParado : Math.min(o, oParado + MARCHA * (t - t2));
      ta = t2; sa = p.s;
    }
    return oo;
  };
  /* a parada em que o bonde está (ou a última que passou) na hora t: {t1, t2} */
  const paradaEm = (b, t) => {
    let ta = b.sai, sa = 0, ult = null;
    for (const p of b.paradas) {
      const t1 = ta + (p.s - sa) / M / MARCHA, t2 = Math.max(t1, p.ate);
      if (t + 5 < t1) break;
      ult = { t1, t2, s: p.s };
      ta = t2; sa = p.s;
    }
    return ult;
  };
  let menor = { d: Infinity };
  for (const a of vivos) for (const o of rivaisDe(a)) if (a.lado === 'mandante') { const e = encontro(a, o); if (e.d < menor.d) menor = { ...e, a, b: o }; }
  /* AS TRAVESSIAS: os cruzamentos (os de 25 m um do outro viram um só).
     A PM fecha a rua de quem passa DEPOIS dos dois lados da rota de quem
     passa ANTES, e libera um minuto depois do último deste passar */
  const travessias = [];
  for (const c of cruzamentos.slice().sort((p, q) => p.d - q.d)) {
    const oAntes = quando(c.o, c.sb) <= quando(c.a, c.sa);
    const antes = oAntes ? c.o : c.a, depois = oAntes ? c.a : c.o, sAntes = oAntes ? c.sb : c.sa, sDepois = oAntes ? c.sa : c.sb;
    const libera = quandoRabo(antes, sAntes) + 60, chega = quando(depois, sDepois);
    const junto = travessias.find(v => Math.hypot(v.x - c.x, v.z - c.z) < 25 * M);
    if (junto) {
      junto.libera = Math.max(junto.libera, libera); junto.chega = Math.min(junto.chega, chega);
      if (!junto.antes.includes(antes)) junto.antes.push(antes);
      if (!junto.depois.includes(depois)) junto.depois.push(depois);
      continue;
    }
    travessias.push({ x: c.x, z: c.z, d: c.d, antes: [antes], depois: [depois], sAntes, sDepois, libera, chega });
  }
  for (const v of travessias) v.folga = v.chega - v.libera + 60;
  marca('horario');

  /* ======================================================
     A TORCIDA IA ESCOLHE: em paz (o plano acima) ou atacar (ver o começo)
     ====================================================== */
  const modoIA = escolha.ia || 'sorteio';
  const paridade = (alvoN, eleN) => {
    const r = eleN / Math.max(1, alvoN);
    if (r < PISO_PARIDADE) return 0;
    if (r >= PAR_PARIDADE) return Math.min(1.3, 1 + (r - PAR_PARIDADE) * 0.4 / PAR_PARIDADE);
    return (r - PISO_PARIDADE) / (PAR_PARIDADE - PISO_PARIDADE);
  };
  const chanceDe = (a, v) => {
    if (P.irmas && P.irmas(a.t.id, v.t.id)) return 0;
    return clamp(Math.round((BASE_PROCURA[rel(a.t.id, v.t.id)] || 0) * paridade(v.t.membros || 20, a.t.membros || 20)), 0, 95);
  };
  /* o bonde com a escolta da PM (o 1º escalão do visitante): ela anda com ele, mas não segura ninguém —
     o bonde escoltado pode atacar (o dono, 27/09/2026) */
  const comEscoltaPM = vivos.filter(b => b.lado === 'visitante').sort((a, c) => a.escalao - c.escalao)[0] || null;
  /* as bocas fechadas (a grade da PM): ninguém passa */
  const fechadaCel = new Uint8Array(N);
  for (const q of bocas) if (!q.usada.length && q.lado === 'visitante') for (const K of q.cels) fechadaCel[K] = 1;
  /* ONDE ATACAR: um ponto da rota do alvo na cidade (de 30 m da saída dele
     até 20 m antes dos arredores), o que deixa o caminho de quem ataca
     mais curto (da saída dele ao ponto, só pela cidade, fugindo da rua do
     alvo — senão ele chegaria pelo caminho do alvo e esperaria no meio
     dele —, e do ponto ao portão dele, pelo lado dele nos arredores). O
     esconderijo fica ESCONDIDO m antes do ponto, no caminho de quem ataca,
     a 10 m ou mais da rua do alvo (na transversal: quem vem não vê; só
     se não tem, a 5 m), e a volta sai de lá sem passar no ponto (onde o
     alvo se junta). Duas brigas não caem no mesmo lugar (40 m) */
  const pontosDeBriga = [];
  /* `concentracao`: a briga cai na concentração do alvo (a porta de onde
     ele sai, onde a torcida junta antes de andar: de 8 a 45 m da saída),
     e não no meio do caminho — a cena de praça do jogo de feed */
  function planejarBriga(a, v, concentracao = false) {
    const rotaV = new Uint8Array(N);
    for (const K of v.cels) if (!noArredor[K]) rotaV[K] = 1;
    const dRotaV = distanciaAte(R, rotaV);
    const ida = new Float32Array(N);
    for (let K = 0; K < N; K++) ida[K] = R.anda[K] && !noArredor[K] ? R.mult[K] + 12 * Math.exp(-dRotaV[K] * dm / 8) : Infinity;
    const volta = custoDo(a.lado, !!a.peloCorredor);
    for (let K = 0; K < N; K++) if (fechadaCel[K]) volta[K] = Infinity;
    B.buscar([a.K0], ida, -1);
    const dIda = Float64Array.from(B.dist);
    B.buscar([portoes[a.nPortao].K], volta, -1);
    const dVolta = B.dist;
    let sBoca = v.rua.L;
    for (let s = 0; s <= v.rua.L; s += M) { v.rua.ponto(s, Q); const K = R.celula(Q.x, Q.z); if (K >= 0 && noArredor[K]) { sBoca = s; break; } }
    const cands = [];
    /* NA CONCENTRAÇÃO, a frente da porta (é lá que a torcida junta, nas
       rodinhas, antes de sair); NA PISTA, do meio da rua pra frente */
    const [s0, s1] = concentracao ? [2 * M, Math.min(14 * M, sBoca - 5 * M)] : [30 * M, sBoca - 20 * M];
    for (let s = s0; s <= s1; s += 2 * M) {
      v.rua.ponto(s, Q);
      const K = R.celula(Q.x, Q.z);
      if (K < 0 || !R.anda[K] || !(dIda[K] < Infinity) || !(dVolta[K] < Infinity)) continue;
      if (pontosDeBriga.some(([x, z]) => Math.hypot(Q.x - x, Q.z - z) < 40 * M)) continue;
      /* na concentração, o mais perto da porta que dá */
      cands.push({ s, K, esq: !concentracao && ehEsquina(Q.x, Q.z), nota: dIda[K] + dVolta[K] + (concentracao ? s / M * 30 : 0) });
    }
    /* na pista, AS ESQUINAS primeiro (o dono: "em alguma esquina vai ser
       abordada pelo adversário"); sem esquina que sirva, o resto */
    cands.sort((p, q) => (q.esq - p.esq) || p.nota - q.nota);
    const falha = { pontos: cands.length, esquinas: cands.filter(c => c.esq).length, cidade: Math.round((sBoca - 50 * M) / M), caminho: 0, esconderijo: 0, volta: 0 };
    const rP = Math.ceil(10 / dm), passos = Math.round(ESCONDIDO / dm);
    for (const [c, longe] of cands.slice(0, 40).map(c => [c, 10]).concat(cands.slice(0, 12).map(c => [c, 5]))) {
      const cam1 = B.buscar([a.K0], ida, c.K);
      if (!cam1 || cam1.length < passos + 3) { falha.caminho++; continue; }
      const kQ = cam1.length - 1 - passos, KQ = cam1[kQ];
      if (dRotaV[KQ] * dm < longe) { falha.esconderijo++; continue; }
      const volta2 = volta.slice(), I0 = c.K % CX, J0 = (c.K - I0) / CX;
      for (let J = J0 - rP; J <= J0 + rP; J++) for (let I = I0 - rP; I <= I0 + rP; I++) if (I >= 0 && J >= 0 && I < CX && J < CZ && (I - I0) ** 2 + (J - J0) ** 2 <= rP * rP) volta2[J * CX + I] = Infinity;
      volta2[KQ] = volta[KQ];
      const cam2 = B.buscar([KQ], volta2, portoes[a.nPortao].K);
      if (!cam2) { falha.volta++; continue; }
      const [px, pz] = R.centro(c.K);
      pontosDeBriga.push([px, pz]);
      return { a, v, sV: c.s, P: [px, pz], cels: cam1.slice(0, kQ + 1).concat(cam2.slice(1)), kQ, naPorta: !!concentracao, esquina: !!c.esq };
    }
    a.naoAchou = falha;
    return null;
  }
  /* A ESQUINA: de (x, z) saem pelo menos três ruas de ESQUINA m (nos
     quatro rumos da grade do mapa: no meio de um quarteirão só saem duas,
     a rua pra frente e pra trás) */
  function ruaQueSai(x, z, dx, dz) {
    let n = 0;
    for (let k = 1; k <= ESQUINA; k++) { const K = R.celula(x + dx * k * M, z + dz * k * M); if (K < 0 || !R.anda[K]) break; n = k; }
    return n;
  }
  function ehEsquina(x, z) {
    let n = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (ruaQueSai(x, z, dx, dz) >= ESQUINA) n++;
    return n >= 3;
  }
  const brigas = [], emBriga = new Set();
  /* A BRIGA MANDADA (o jogo 3D, 28/09/2026; o dono: "A cena de ataque em
     praça ou rua agora vão ser os ataques de alguma torcida em outra nos
     dias de caminhada ao estádio"): quem ataca e quem é atacado vêm do
     jogo de feed (a investida do jogador, ou o ataque que ele sofre), e
     o lugar também — a praça é a concentração do alvo, a rua é o meio
     do caminho dele. A IA não decide mais nada: as outras vão em paz */
  const mandada = escolha.briga || null;
  if (mandada) {
    const a = vivos.find(b => b.t.id === mandada.a), v = vivos.find(b => b.t.id === mandada.v);
    for (const b of vivos) b.decisao = { alvo: null, chance: 0, tirou: 0, ataca: false, porque: 'paz' };
    if (a && v && a !== v) {
      a.decisao = { alvo: v, chance: 100, tirou: 0, ataca: true, porque: 'mandada' };
      const br = planejarBriga(a, v, mandada.onde === 'praca');
      if (br) { brigas.push(br); emBriga.add(a); emBriga.add(v); }
      else { a.decisao.ataca = false; a.decisao.porque = 'não achou'; }
    }
  } else for (const a of vivos.slice().sort((p, q) => (q.t.poder || 0) - (p.t.poder || 0) || q.n - p.n)) {
    const opcoes = vivos.filter(v => v.lado !== a.lado).map(v => ({ v, c: chanceDe(a, v) })).filter(x => x.c > 0).sort((p, q) => q.c - p.c || q.v.n - p.v.n);
    const livres = opcoes.filter(x => !emBriga.has(x.v));
    const dec = a.decisao = { alvo: null, chance: 0, tirou: Math.floor(sorte('ataca|' + a.t.id)() * 100), ataca: false, porque: '' };
    if (emBriga.has(a)) { dec.porque = 'atacada'; continue; }
    if (!opcoes.length) { dec.porque = vivos.some(v => v.lado !== a.lado && BASE_PROCURA[rel(a.t.id, v.t.id)] && !(P.irmas && P.irmas(a.t.id, v.t.id))) ? 'pequena' : 'sem rival'; continue; }
    if (!livres.length) { dec.porque = 'rivais ocupadas'; continue; }
    dec.alvo = livres[0].v; dec.chance = livres[0].c;
    dec.ataca = modoIA === 'ataque' || (modoIA === 'sorteio' && dec.tirou < dec.chance);
    if (!dec.ataca) { dec.porque = modoIA === 'paz' ? 'paz' : 'sorteio'; continue; }
    const br = planejarBriga(a, dec.alvo);
    if (!br) { dec.ataca = false; dec.porque = 'não achou'; continue; }
    brigas.push(br); emBriga.add(a); emBriga.add(dec.alvo);
  }
  /* A BRIGA: a rota nova de quem ataca, o horário dos dois, quem ganha e
     quem fica no chão */
  for (const br of brigas) {
    const { a, v } = br;
    a.ruaPaz = a.rua; a.saiPaz = a.sai; a.cels = br.cels;
    br.sQ = fazerRua(a, br.cels, pode[a.lado], br.kQ);
    if (br.naPorta) {
      /* NA PORTA, ANTES DE SAIR: a briga acaba e a torcida ainda junta os
         dela antes da hora de o bonde sair (ele não para na rua); quem
         ataca dobra a última esquina e quase não espera */
      br.tIni = v.sai - REAGRUPA_PORTA - BRIGA;
      br.tFim = br.tIni + BRIGA;
      v.paradas = [];
      a.paradas = [{ s: br.sQ, ate: br.tFim }];
      a.sai = br.tIni - ESPERA_PORTA - br.sQ / M / MARCHA;
    } else {
      br.tIni = quando(v, br.sV);
      br.tFim = br.tIni + BRIGA;
      v.paradas = [{ s: br.sV, ate: br.tFim + REAGRUPA }];
      a.paradas = [{ s: br.sQ, ate: br.tFim }];
      a.sai = br.tIni - EMBOSCADA - br.sQ / M / MARCHA;
    }
    a.adiantou = 0; a.esperou = 0;
    prepararFaixa(a); prepararRaias(a);
    a.brigou = v.brigou = br;
    /* A BRIGA DAS DUAS IAs (`brigaIA`, js/mundo/relacoes.js): a força de
       cada lado é a gente × a ficha média da torcida (a escolta com a
       ficha dela); o favorito vence 70% — três em cada dez o menor sai
       por cima —, e as baixas são dos dois lados (BAIXAS) */
    const rnd = sorte('briga|' + a.t.id + '|' + v.t.id);
    const escV = v.escolta ? v.escolta.membros : 0, nA = a.naRua, nV = v.naRua + escV;
    br.fA = nA * fichaMedia(a.t);
    br.fV = v.naRua * fichaMedia(v.t) + (escV ? escV * fichaMedia(v.escolta.t) : 0);
    br.favoritoA = br.fA === br.fV ? rnd() < 0.5 : br.fA > br.fV;
    br.venceA = rnd() < CHANCE_FAVORITO ? br.favoritoA : !br.favoritoA;
    const conta = (n, [x, y]) => Math.round(n * (x + rnd() * (y - x)));
    const baixas = (n, perdeu) => {
      const tab = perdeu ? BAIXAS.perdeu : BAIXAS.venceu;
      const presos = Math.min(n - 1, conta(n, tab.preso));
      return { presos, feridos: Math.min(n - 1 - presos, conta(n, tab.ferido)) };
    };
    const bxA = baixas(nA, !br.venceA), bxV = baixas(nV, br.venceA);
    br.ferA = bxA.feridos; br.presA = bxA.presos;
    br.ferV = bxV.feridos; br.presV = bxV.presos;
    br.nA = nA; br.nV = nV;
    /* QUEM BRIGA COM QUEM: os de quem ataca, cada um num do alvo (os da
       frente primeiro; até 3 no mesmo); quem sobra fica na guarda, atrás.
       Na porta, a ordem dos alvos é a de quem está mais perto de onde
       quem ataca vem (a montagem refaz, com as rodinhas postas) */
    br.parear = vitimas => {
      const nPar = Math.min(a.n, 3 * v.n);
      br.alvoDe = new Int32Array(a.n).fill(-1);
      br.quantosEm = new Int32Array(v.n);
      br.ordem = new Int32Array(a.n);
      br.primeiro = new Int32Array(v.n).fill(-1);
      for (let i = 0; i < nPar; i++) { const w = vitimas[i % v.n]; br.alvoDe[i] = w; br.ordem[i] = br.quantosEm[w]++; if (br.primeiro[w] < 0) br.primeiro[w] = i; }
    };
    br.parear(v.povo.map((q, m) => m).sort((p, q) => v.povo[p].o - v.povo[q].o));
    /* os bonecos no chão, na conta (um boneco é o que ele vale no bonde
       dele), entre os que brigam de fato; o primeiro, não (o rótulo e a
       câmera vão nele) */
    const caem = (b, fer, pres, n, briga) => {
      const k = fer ? clamp(Math.round(fer * b.n / n), 1, b.n - 1) : 0;
      const kp = pres ? clamp(Math.round(pres * b.n / n), 1, Math.max(0, b.n - 1 - k)) : 0;
      let idx = b.povo.map((q, m) => m).filter(m => m > 0 && briga(m));
      if (idx.length < k + kp) idx = b.povo.map((q, m) => m).filter(m => m > 0);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      b.ferido = new Uint8Array(b.n);
      b.tCai = new Float64Array(b.n).fill(Infinity);
      for (const m of idx.slice(0, k)) { b.ferido[m] = 1; b.tCai[m] = br.tIni + 8 + rnd() * (BRIGA - 14); }
      /* o preso se rende no fim da briga, onde estava */
      for (const m of idx.slice(k, k + kp)) { b.ferido[m] = 2; b.tCai[m] = br.tFim - 4 - rnd() * 6; }
      return [k, kp];
    };
    /* quem cai e quem é preso, entre os que brigam (a montagem refaz, quando refaz os pares) */
    br.sortearQuedas = () => {
      [br.caemV, br.rendemV] = caem(v, br.ferV, br.presV, nV, m => br.quantosEm[m] > 0);
      [br.caemA, br.rendemA] = caem(a, br.ferA, br.presA, nA, m => br.alvoDe[m] >= 0);
      a.feridos = br.ferA; v.feridos = br.ferV;
      a.presos = br.presA; v.presos = br.presV;
    };
    br.sortearQuedas();
    br.rnd = rnd;
    /* O RESULTADO DE FORA (o jogo 3D, dia3d.js: a briga jogada no combate,
       a simulada ou a que ninguém desceu): quem ganhou e quantos caíram e
       foram presos de cada lado, em torcedores — refaz quem fica no chão */
    br.aplicar = o => {
      if (o.venceA != null) br.venceA = !!o.venceA;
      const lim = (x, n) => clamp(Math.round(x || 0), 0, Math.max(0, n - 1));
      br.ferA = lim(o.ferA, nA); br.presA = lim(o.presA, nA - br.ferA);
      br.ferV = lim(o.ferV, nV); br.presV = lim(o.presV, nV - br.ferV);
      br.sortearQuedas();
      br.aplicado = true;
    };
  }
  if (brigas.length) {
    for (const i of new Set(brigas.flatMap(x => [x.a.nPortao, x.v.nPortao]))) entradaDo(i);
    /* o corredor que abre espera o último visitante (a briga pode ter atrasado) */
    if (tAbre != null) {
      const t2 = Math.max(...vivos.filter(b => b.lado === 'visitante').map(ultimo)) + 60;
      if (t2 > tAbre) {
        const d = t2 - tAbre;
        tAbre = t2;
        for (const b of vivos) if (b.peloCorredor && !b.brigou) { b.sai += d; b.esperou = (b.esperou || 0) + Math.ceil(d / 60); }
        for (const i of portoesDo('mandante')) entradaDo(i);
      }
    }
  }
  marca('ia');

  /* (o caminho de dentro de cada um, da catraca até a vaga, pro teste e pra câmera) */
  for (const b of vivos) b.dentro = b.pessoas.map(g => g.dentro);

  /* A PM: o cordão divisório, as bocas fechadas (as da zona do visitante
     que nenhuma rota usa; as outras ficam abertas) e a revista na entrada
     de cada portão */
  const pm = { cordoes: [], fechadas: [], abertas: [], revistas: [] };
  for (const c of cordoes) pm.cordoes.push(c);
  for (const q of bocas) (!q.usada.length && q.lado === 'visitante' ? pm.fechadas : pm.abertas).push(q);
  for (const i of Object.keys(revistaDo)) pm.revistas.push({ i: +i, portao: portoes[i], n: revistaDo[i], raias: rotas.portoes[i].raias || [] });
  marca('pm');
  const plano = {
    casa, fora, foraDaqui, pares: pares.map(p => p[0].nome + ' × ' + p[1].nome), par: escolha.par || 0, lista, deFora,
    estadio: est, centroEst, mundo, portoes, bondes, vivos, R, zona, noArredor, divisa, raio, bocas, cordoes, pm, menor, travessias, cabeca, atras, paradaEm, ladoEm, M, rotaVelha, longeDe, tentativas, tAbre, portoesQueAbrem: [...new Set(vivos.filter(b => b.peloCorredor).map(b => b.portao.nome))],
    brigas, revistaDo, torcedores, efetivo, comEscoltaPM, modoIA, bola, doJogo, doJogador: vivos.find(b => b.nossa) || null,
    inicio: Math.min(...vivos.map(b => b.sai)) - 120, fimTudo: Math.max(...vivos.map(b => b.fim), ...brigas.map(x => x.tFim + REAGRUPA)), tempos
  };
  /* A ARQUIBANCADA VIVA E A BRIGA NO ESTÁDIO (arquibancada.js): os papéis
     de cada um no lugar, os guardas do isolamento e a invasão; o dia vai
     até a bola rolar (e até a invasão acabar) */
  try {
    plano.arq = planejarArquibancada(plano, { M, BOLA: bola, DENTRO, FATOR: 1 / FATOR_GENTE, sorte, fichaMedia, chanceDe, escolha, efetivo,
      revistas: Object.values(revistaDo).reduce((s, n) => s + n, 0), BAIXAS, CHANCE_FAVORITO, brigas });
  } catch (e) { console.error('dia de jogo, arquibancada:', e); plano.arq = null; }
  if (plano.arq) plano.fimTudo = Math.max(plano.fimTudo, plano.arq.fim);
  marca('arquibancada');
  return plano;
}

/* ======================================================
   A CENA DO DIA DE JOGO: os bonecos, a PM, a grade, as fitas, as zonas
   ====================================================== */
export function criarDiaDeJogo(ctx) {
  const { M, raiz } = ctx;
  const $ = s => raiz.querySelector(s);
  const ESTILO = `
.cen-jogo { position: absolute; right: 12px; top: calc(var(--topo-alt, 60px) + 18px); width: min(380px, calc(100% - 24px)); max-height: calc(100% - var(--topo-alt, 60px) - 90px);
  overflow: auto; padding: 12px 14px; border-radius: 10px; background: color-mix(in srgb, var(--folha) 94%, transparent); border: 1px solid var(--linha);
  box-shadow: 0 2px 14px rgba(0,0,0,.16); font-size: 13px; }
.cen-jogo[hidden] { display: none; }
.cen-jogo .cj-sobre { margin: 0; font: 600 11px/1.2 var(--f-ui); letter-spacing: .06em; text-transform: uppercase; color: var(--tinta-2); }
.cen-jogo h2 { margin: 3px 0 2px; font: 700 19px/1.15 var(--f-ui); padding-right: 30px; }
.cen-jogo .cj-onde { margin: 0 0 8px; color: var(--tinta-2); }
.cen-jogo .cj-rel { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 6px 0 8px; }
.cen-jogo .cj-rel b { font: 700 22px/1 var(--f-dado); font-variant-numeric: tabular-nums; min-width: 64px; }
.cen-jogo .cj-rel .cen-bt { padding: 6px 10px; }
.cen-jogo .cj-vezes { display: inline-flex; border: 1px solid var(--linha); border-radius: 8px; padding: 2px; background: var(--papel); }
.cen-jogo .cj-vezes button { font: 600 12px/1 var(--f-ui); color: var(--tinta-2); background: none; border: 0; border-radius: 6px; padding: 6px 8px; cursor: pointer; }
.cen-jogo .cj-vezes button[aria-pressed="true"] { background: var(--acento); color: var(--folha); }
.cen-jogo input[type=range] { width: 100%; margin: 0 0 6px; }
.cen-jogo ul { list-style: none; margin: 6px 0; padding: 0; display: grid; gap: 6px; }
.cen-jogo li { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 4px 8px; align-items: start; padding: 6px 8px; border-radius: 8px; background: var(--papel); border: 1px solid var(--linha); }
.cen-jogo li i { width: 14px; height: 14px; border-radius: 3px; margin-top: 2px; box-shadow: inset 0 0 0 1px rgba(0,0,0,.25); }
.cen-jogo li b { font: 700 13.5px/1.2 var(--f-ui); }
.cen-jogo li small { display: block; color: var(--tinta-2); font-size: 12px; line-height: 1.35; }
.cen-jogo li .cj-estado { color: var(--tinta); font-weight: 600; }
.cen-jogo .cj-lado { margin: 10px 0 0; font: 700 12px/1.2 var(--f-ui); letter-spacing: .05em; text-transform: uppercase; color: var(--tinta-2); }
.cen-jogo .cj-pm, .cen-jogo .cj-aviso { margin: 8px 0 0; font-size: 12.5px; color: var(--tinta-2); }
.cen-jogo .cj-aviso.ruim { color: #b3261e; font-weight: 600; }
.cen-jogo .cj-ctrl { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; align-items: center; }
.cen-jogo .cj-ctrl select { font: 600 13px/1.2 var(--f-ui); color: var(--tinta); background: var(--papel); border: 1px solid var(--linha); border-radius: 8px; padding: 6px 6px; max-width: 100%; }
.cen-jogo .cj-ctrl label { display: inline-flex; gap: 5px; align-items: center; font: 600 12.5px/1 var(--f-ui); color: var(--tinta-2); }
@media (max-width: 760px) { .cen-jogo { left: 8px; right: 8px; width: auto; top: auto; bottom: 8px; max-height: 46vh; } }`;
  const estilo = document.createElement('style'); estilo.textContent = ESTILO; document.head.appendChild(estilo);
  const painel = document.createElement('aside');
  painel.className = 'cen-jogo'; painel.hidden = true; painel.setAttribute('aria-label', 'Dia de jogo');
  raiz.appendChild(painel);

  let plano = null, escolha = { par: 0, inverter: false, gente: 1 }, t = 0, rodando = false, vezes = 30, lenta = null, seguir = null, verRotas = true;
  /* O DIA DO JOGO DE VERDADE (o jogo 3D, dia3d.js): o plano vem do jogo
     (`jogo(escolha)`), o painel da planta fica fechado e quem anda o
     relógio é o itinerário do dia */
  let modoJogo = false;
  /* na partida, só os rótulos das torcidas (os da revista, dos cordões e das brigas saem) */
  let soTorcidas = false;
  let grupo = null, discos = [], policiais = [], arq = null;
  const J = { discos: [], policiais: [], projeteis: [], grades: [], paz: true, t: 0 };
  const Q = {}, Q2 = {};

  /* ---- a grade de contenção (a de ferro, 2 m × 1,1 m), uma malha por instância ---- */
  const geoGrade = (() => {
    const partes = [];
    const caixa = (x0, x1, y0, y1, z0, z1) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); partes.push(g); };
    const w = 1.0, h = 1.1;
    caixa(-w, -w + 0.04, 0.08, h, -0.02, 0.02); caixa(w - 0.04, w, 0.08, h, -0.02, 0.02);
    caixa(-w, w, h - 0.04, h, -0.02, 0.02); caixa(-w, w, 0.22, 0.26, -0.02, 0.02);
    for (let k = 1; k < 12; k++) { const x = -w + k * 2 * w / 12; caixa(x - 0.008, x + 0.008, 0.26, h - 0.04, -0.008, 0.008); }
    for (const x of [-w + 0.1, w - 0.1]) caixa(x - 0.03, x + 0.03, 0, 0.08, -0.3, 0.3);
    let n = 0; for (const g of partes) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = [];
    let o = 0;
    for (const g of partes) {
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      for (let k = 0; k < g.index.count; k++) idx.push(g.index.getX(k) + o);
      o += g.attributes.position.count; g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(idx);
    geo.scale(M, M, M);
    return geo;
  })();
  const matGrade = new THREE.MeshLambertMaterial({ color: '#9aa3a8' });

  /* ---- um rótulo (sprite) com texto ---- */
  function rotulo(texto, fundo, tinta = '#fff', alto = 2.2) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), f = 44;
    c.font = `700 ${f}px system-ui, sans-serif`;
    const w = Math.ceil(c.measureText(texto).width) + 28;
    cv.width = w; cv.height = f + 22;
    c.font = `700 ${f}px system-ui, sans-serif`;
    c.fillStyle = fundo; c.beginPath(); c.roundRect(0, 0, w, f + 22, 12); c.fill();
    c.fillStyle = tinta; c.textBaseline = 'middle'; c.fillText(texto, 14, (f + 22) / 2 + 2);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false, transparent: true }));
    sp.renderOrder = 20;
    sp.scale.set(alto * M * w / (f + 22), alto * M, 1);
    sp.userData.alto = alto;
    return sp;
  }

  /* ---- a fita de uma rota no chão ---- */
  function fita(pts, cor, larg = 0.9, alto = 0.14) {
    const pos = [], idx = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const nx = -dz * larg * M / 2, nz = dx * larg * M / 2, y = pts[i][1] + alto * M;
      pos.push(pts[i][0] + nx, y, pts[i][2] + nz, pts[i][0] - nx, y, pts[i][2] - nz);
      if (i) { const k = 2 * i; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide }));
    m.renderOrder = 5;
    return m;
  }

  /* ---- as zonas dos arredores pintadas no chão (uma textura, 1 px por metro) ---- */
  function chaoDasZonas(p) {
    const R = p.R;
    let I0 = Infinity, I1 = -1, J0 = Infinity, J1 = -1;
    for (let K = 0; K < R.N; K++) if (p.noArredor[K]) { const I = K % R.CX, J = (K - I) / R.CX; I0 = Math.min(I0, I); I1 = Math.max(I1, I); J0 = Math.min(J0, J); J1 = Math.max(J1, J); }
    if (I1 < 0) return null;
    const w = I1 - I0 + 1, h = J1 - J0 + 1, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d'), img = c.createImageData(w, h);
    const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
    const cm = rgb('#2e7d32'), cvz = rgb('#c62828'), cd = rgb('#1f3f9a');
    for (let J = J0; J <= J1; J++) for (let I = I0; I <= I1; I++) {
      const K = J * R.CX + I, o = ((J - J0) * w + (I - I0)) * 4;
      if (!p.noArredor[K]) continue;
      const cc = p.divisa[K] ? cd : p.zona[K] === 0 ? cm : cvz;
      img.data[o] = cc[0]; img.data[o + 1] = cc[1]; img.data[o + 2] = cc[2]; img.data[o + 3] = p.divisa[K] ? 150 : 70;
    }
    c.putImageData(img, 0, 0);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = THREE.NearestFilter;
    const [x0, z0] = R.centro(J0 * R.CX + I0);
    const geo = new THREE.PlaneGeometry(w * R.L, h * R.L); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
    m.position.set(x0 - R.L / 2 + w * R.L / 2, 0.1 * M, z0 - R.L / 2 + h * R.L / 2);
    m.renderOrder = 4;
    return m;
  }

  /* ---- a PM parada: {x, y (o z do mundo), alt, rumo, escudo} ---- */
  function poePM(x, z, rumo, escudo = true) {
    const p = { x, y: z, alt: ctx.chaoDaRua(x, z), rumo, vivo: true, escudo, cooldown: 0, golpe: 0, carga: false };
    policiais.push(p);
    return p;
  }
  /* a grade de contenção de a a b (em mundo), em pedaços de 2 m */
  function poeGrades(a, b, lista) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) / M, n = Math.max(1, Math.round(L / 2.05));
    const ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
    for (let k = 0; k < n; k++) {
      const t0 = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * t0, z = a[1] + (b[1] - a[1]) * t0;
      lista.push({ x, z, ang, esc: Math.min(1, L / n / 2.05) });
    }
  }

  /* uma lista de grades ({x, z, ang, esc}) numa malha de instâncias */
  function malhaDeGrades(lista) {
    if (!lista.length) return null;
    const im = new THREE.InstancedMesh(geoGrade, matGrade, lista.length), mt = new THREE.Matrix4(), q4 = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), eixo = new THREE.Vector3(0, 1, 0);
    lista.forEach((g, i) => { q4.setFromAxisAngle(eixo, g.ang); sc.set(g.esc, 1, 1); ps.set(g.x, ctx.chaoDaRua(g.x, g.z), g.z); mt.compose(ps, q4, sc); im.setMatrixAt(i, mt); });
    return im;
  }

  /* AS RODINHAS na frente da sede (o dono, 27/09/2026: "Deixe os bonecos
     mais espalhados em frente à sede como se estivessem à vontade
     confraternizando"): a torcida em grupos de 1 a 6 (mais de 3 e 4),
     cada grupo em roda, virado pro meio dela, numa faixa de uns 16 m ao
     longo da fachada e até uns 10 m pra fora (a calçada e a rua); a roda
     (0,54 m de raio a dois, 1 m a seis) fica onde tem 0,45 m de folga em
     volta dela, a 1,8 m ou mais das outras (se não acha, vai abrindo a
     faixa). Um lugar por pessoa,
     sorteado: o bonde não sai na ordem das rodinhas. É na frente de onde o
     bonde sai (a sede dele, a do aliado que o hospeda, ou a entrada da
     cidade, onde a caravana desceu); `rodas`, as que já estão lá (dois
     bondes na mesma porta não se sobrepõem).
     A TORCIDA INTEIRA NA PORTA (28/09/2026: um boneco por torcedor, 150 na
     porta da TUF): a roda só fica onde se chega andando da porta sem volta
     grande (a calçada, a rua, a praça da frente — o terreno atrás do muro e
     o quintal do vizinho, não), a faixa abre primeiro ao longo da fachada
     (a rua) e só um tanto pra fora, e a torcida grande junta mais: a roda a
     1 m da outra (a 1,8 m até 40 pessoas) e rodas de até 8 */
  const VIZ8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  function alcanceDaPorta(R, x, z, lim) {
    const d = new Map(), K0 = R.perto(x, z, 10, K => R.anda[K] && (!R.publico || R.publico[K]));
    if (K0 < 0) return d;
    const dm = R.L / M, fila = [K0];
    d.set(K0, 0);
    for (let i = 0; i < fila.length; i++) {
      const K = fila[i], I = K % R.CX, J = (K - I) / R.CX, dk = d.get(K);
      for (const [di, dj, c] of VIZ8) {
        const a = I + di, bb = J + dj;
        if (a < 0 || bb < 0 || a >= R.CX || bb >= R.CZ) continue;
        const K2 = bb * R.CX + a;
        if (!R.anda[K2] || (R.publico && !R.publico[K2])) continue;
        const nd = dk + c * dm;
        if (nd > lim) continue;
        const velho = d.get(K2);
        if (velho == null || nd < velho - 1e-6) { d.set(K2, nd); fila.push(K2); }
      }
    }
    return d;
  }
  function rodinhas(b, R, rnd, rodas = []) {
    const P0 = b.porta, fx = P0.fx, fz = P0.fy, ux = fz, uz = -fx;
    const alcance = alcanceDaPorta(R, P0.x, P0.y, 70);
    const chega = (x, z) => { const K = R.celula(x, z); if (K < 0) return false; const d = alcance.get(K); return d != null && d <= Math.hypot(x - P0.x, z - P0.y) / M * 1.35 + 4; };
    /* a roda inteira no chão da rua: o meio e a volta dela (o terreno do lado, não) */
    const naRua = (x, z, r) => {
      if (!R.publico) return true;
      for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const K = R.celula(x + dx * (r + 0.35) * M, z + dz * (r + 0.35) * M); if (K < 0 || !R.publico[K]) return false; }
      return true;
    };
    const folgaEntre = b.n <= 40 ? 1.8 : b.n >= 150 ? 1.0 : 1.8 - 0.8 * (b.n - 40) / 110;
    const TAM = b.n <= 60 ? [1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6] : [2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8];
    const tamanhos = [];
    for (let n = b.n; n > 0;) { const k = Math.min(n, TAM[Math.floor(rnd() * 12)]); tamanhos.push(k); n -= k; }
    const lugares = [];
    for (const k of tamanhos) {
      const r = k === 1 ? 0 : 0.3 + 0.12 * k;
      let ok = null;
      for (let tent = 0; tent < 600 && !ok; tent++) {
        const alc = 1 + tent / 120, v = 1.3 + rnd() * 8.5 * Math.min(alc, 2), u = (rnd() - 0.5) * 16 * alc;
        const cx = P0.x + (fx * v + ux * u) * M, cz = P0.y + (fz * v + uz * u) * M;
        if (R.folgaEm(cx, cz) < r + 0.45) continue;
        if (!chega(cx, cz) || !naRua(cx, cz, r)) continue;
        if (rodas.some(c => Math.hypot(c.x - cx, c.z - cz) < (c.r + r + folgaEntre) * M)) continue;
        ok = { x: cx, z: cz, r };
      }
      /* (não coube à vontade: o primeiro lugar de rua livre na frente da
         porta, abrindo pros dois lados da fachada e pra fora, com a roda
         mais junta; só sem nenhum, fica na porta, um atrás do outro) */
      for (let k2 = 0; k2 < 240 && !ok; k2++) {
        const u = (k2 % 2 ? 1 : -1) * Math.ceil((k2 % 40) / 2) * 1.1, v = 1.4 + Math.floor(k2 / 40) * 1.6;
        const cx = P0.x + (fx * v + ux * u) * M, cz = P0.y + (fz * v + uz * u) * M;
        if (R.folgaEm(cx, cz) < r + 0.3 || !naRua(cx, cz, r)) continue;
        if (rodas.some(c => Math.hypot(c.x - cx, c.z - cz) < (c.r + r + 0.4) * M)) continue;
        ok = { x: cx, z: cz, r };
      }
      if (!ok) ok = { x: P0.x + fx * (1.2 + rodas.length * 0.6) * M, z: P0.y + fz * (1.2 + rodas.length * 0.6) * M, r: 0 };
      rodas.push(ok);
      const a0 = rnd() * 6.28;
      for (let i = 0; i < k; i++) {
        const a = a0 + 6.28 * i / k + (rnd() - 0.5) * 0.4, rr = ok.r ? ok.r + (rnd() - 0.5) * 0.1 : 0;
        let x = ok.x + Math.cos(a) * rr * M, z = ok.z + Math.sin(a) * rr * M;
        /* (o da roda que cai fora da calçada — a beira dela com o lote — vem pro meio da roda) */
        if (R.publico) {
          const fora = (px, pz) => { const K = R.celula(px, pz); return K < 0 || !R.publico[K]; };
          if (fora(x, z)) { x = ok.x + Math.cos(a) * 0.35 * M; z = ok.z + Math.sin(a) * 0.35 * M; }
          if (fora(x, z)) { x = ok.x; z = ok.z; }
        }
        const rumo = k === 1 || !ok.r ? Math.atan2(fx, fz) + (rnd() - 0.5) * 2.4 : Math.atan2(ok.x - x, ok.z - z) + (rnd() - 0.5) * 0.4;
        lugares.push({ x, z, rumo });
      }
    }
    for (let i = lugares.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [lugares[i], lugares[j]] = [lugares[j], lugares[i]]; }
    return lugares;
  }

  /* ======================================================
     MONTAR: o plano, a PM, as fitas e os bonecos na porta da sede
     ====================================================== */
  function montar() {
    desmontar();
    plano = planejar(ctx, escolha);
    if (plano.erro) {
      if (modoJogo) return false;
      painel.innerHTML = cabecalho() + `<p class="cj-aviso ruim">${esc(plano.erro)}</p><div class="cj-ctrl"><button class="cen-bt" data-jogo="padrao">Voltar pro jogo da praça</button></div>`; ligarPainel(); return false;
    }
    grupo = new THREE.Group(); grupo.name = 'dia-de-jogo';
    ctx.doMapa().add(grupo);
    const p = plano, R = p.R, grades = [];
    /* o que sai numa hora marcada: a grade (numa malha à parte) e os PMs
       que vão pra calçada — a travessia, e o corredor que abre pro mandante */
    p.pmsQueSaem = []; p.gradesQueSaem = []; p.nGradesQueSaem = 0;
    const gradesAbre = [], abreCorredor = p.tAbre != null;
    /* os PMs de uma fila de a a b (em mundo) que, na hora de abrir, se
       espremem nas duas pontas (a calçada), 0,7 m um do outro */
    const abrirFila = (lista, a, b) => {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      let na = 0, nb = 0;
      for (const q of lista) {
        const t0 = ((q.pm.x - a[0]) * ux + (q.pm.y - a[1]) * uz) / L, d = (0.4 + 0.7 * (t0 < 0.5 ? na++ : nb++)) * M;
        const [px, pz] = t0 < 0.5 ? [a[0] + ux * d, a[1] + uz * d] : [b[0] - ux * d, b[1] - uz * d];
        const ox = q.pm.x - (a[0] + ux * t0 * L), oz = q.pm.y - (a[1] + uz * t0 * L);
        p.pmsQueSaem.push({ pm: q.pm, fecha: [q.pm.x, q.pm.y], abre: [px + ox, pz + oz], libera: p.tAbre, rumoFecha: q.pm.rumo, rumoAbre: q.pm.rumo });
      }
    };
    /* OS POSTOS DA PM: primeiro a grade de cada um e quantos PMs ele pede
       no máximo; os PMs vêm depois, do efetivo do jogo */
    const postos = [];
    /* O CORDÃO DIVISÓRIO: a grade na divisa; os PMs de escudo virados pro
       visitante, 1,2 m pro lado dele, um a cada 1,4 m no máximo (a 2ª fila
       a 2,4 m, se sobrar gente) */
    for (const c of p.cordoes) {
      const abre = abreCorredor && c.abre;
      poeGrades(c.a, c.b, abre ? gradesAbre : grades);
      const L = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]) / M, max = Math.max(2, Math.round(L / 1.4));
      /* o lado do visitante: a célula do visitante mais perto do meio */
      const nx = -c.dir[1], nz = c.dir[0];
      const Kv = R.celula(c.meio[0] + nx * 2 * M, c.meio[1] + nz * 2 * M), s = Kv >= 0 && p.zona[Kv] === 1 ? 1 : -1;
      postos.push({ tipo: 'cordao', max, max1: max, n: 0, c, abre, s, nx, nz });
      const r = rotulo(abre ? 'Cordão da PM · abre às ' + hora(p.tAbre) : 'Cordão da PM', '#1f3f9a'); r.position.set(c.meio[0], 5 * M, c.meio[1]); r.userData.prio = 2 + 1 / (1 + c.n); grupo.add(r);
    }
    /* AS BOCAS FECHADAS (as da zona do visitante que nenhuma rota usa): a
       grade atravessada e até dois PMs; as outras ficam abertas */
    for (const q of p.pm.fechadas) {
      const nx = -q.dir[1], nz = q.dir[0];
      /* pra fora: o lado sem arredor */
      const Kf = R.celula(q.meio[0] + nx * 2 * M, q.meio[1] + nz * 2 * M), s = Kf >= 0 && !p.noArredor[Kf] ? 1 : -1;
      const abre = abreCorredor && q.abre;
      poeGrades(q.a, q.b, abre ? gradesAbre : grades);
      postos.push({ tipo: 'fechada', max: 2, n: 0, q, abre, s, nx, nz });
    }
    /* AS TRAVESSIAS: na rua de quem passa depois, dos dois lados da rota
       de quem passa antes, a grade de parede a parede e até 3 PMs do lado
       do cruzamento, virados pra fora dele; na hora de liberar, a grade sai
       e os PMs vão pra calçada */
    for (const v of p.travessias) {
      const rota = v.depois[0].ruaPaz || v.depois[0].rua, outra = v.antes[0].ruaPaz || v.antes[0].rua, gradesV = [];
      /* a distância (m) do ponto até a rota de quem passa antes, perto do cruzamento */
      const ateOutra = (x, z) => { let md = Infinity; for (let s = Math.max(0, v.sAntes - 60 * M); s <= Math.min(outra.L, v.sAntes + 60 * M); s += M) { outra.ponto(s, Q2); md = Math.min(md, Math.hypot(Q2.x - x, Q2.z - z)); } return md / M; };
      for (const lado of [-1, 1]) {
        let ali = null;
        for (let k = 6; k <= 30 && !ali; k++) {
          const s = v.sDepois + lado * k * M;
          if (s < 0 || s > rota.L) break;
          rota.ponto(s, Q);
          if (ateOutra(Q.x, Q.z) >= 6) ali = { x: Q.x, z: Q.z, tx: Q.tx, tz: Q.tz };
        }
        if (!ali) continue;
        const meia = Math.max(0.6, R.folgaEm(ali.x, ali.z) - 0.3), nx = ali.tz, nz = -ali.tx;
        poeGrades([ali.x - nx * meia * M, ali.z - nz * meia * M], [ali.x + nx * meia * M, ali.z + nz * meia * M], gradesV);
        postos.push({ tipo: 'travessia', max: 3, n: 0, v, lado, ali, meia, nx, nz });
      }
      const mg = malhaDeGrades(gradesV);
      if (mg) { mg.name = 'grades-da-travessia'; grupo.add(mg); p.gradesQueSaem.push({ malha: mg, libera: v.libera }); p.nGradesQueSaem += gradesV.length; }
      const r = rotulo('Travessia · PM fecha até ' + hora(v.libera), '#1f3f9a'); r.position.set(v.x, 4.5 * M, v.z); r.userData.prio = 1; grupo.add(r);
    }
    /* A ESCOLTA: até 4 PMs com o bonde do 1º escalão visitante */
    const escoltado = p.comEscoltaPM;
    if (escoltado) postos.push({ tipo: 'escolta', max: 4, n: 0, b: escoltado });

    /* O EFETIVO (o dono, 27/09/2026: "Coloque a PM proporcional à
       quantidade de torcedores envolvidos no jogo, sempre"): um PM pra cada
       1/PM_POR_TORCEDOR torcedores do jogo. A revista na entrada já saiu
       dele (o plano: `revistaDo`). Do resto: primeiro dois na escolta, um
       de cada lado de cada travessia, um em cada cordão (o maior primeiro)
       e um em cada rua fechada; o resto se divide pelo que cada posto ainda
       pede — o cordão, um a cada 1,4 m; a travessia, 3 de cada lado; a
       escolta, 4; a rua fechada, 2 — e, se ainda sobra, vira uma 2ª (3ª,
       4ª) fila atrás de cada cordão, e depois a reserva na frente do
       portão de mais gente. Com pouca gente, sobra grade sem PM; com
       muita, o cordão fica fundo */
    const torcedores = p.torcedores, efetivo = p.efetivo;
    const naRevista = p.pm.revistas.reduce((s, rv) => s + rv.n, 0);
    /* (os guardas do isolamento, dentro do estádio: o plano da arquibancada já tirou) */
    const noIsolamento = p.arq ? p.arq.nGuardas : 0;
    let resta = Math.max(0, efetivo - naRevista - noIsolamento);
    const da = (q, k = 1) => { const x = Math.max(0, Math.min(k, q.max - q.n, resta)); q.n += x; resta -= x; return x; };
    const doTipo = tp => postos.filter(q => q.tipo === tp);
    const cords = doTipo('cordao').sort((a, c) => c.max1 - a.max1);
    for (const q of doTipo('escolta')) da(q, 2);
    for (const q of doTipo('travessia')) da(q);
    for (const q of cords) da(q);
    for (const q of doTipo('fechada')) da(q);
    /* o resto, pelo que cada posto ainda pede (o cordão, um a cada 1,4 m;
       a travessia, a escolta e a rua fechada, os delas); o que sobra de
       tudo cheio, em mais uma fila atrás de cada cordão */
    for (let filaN = 1; resta > 0 && filaN <= 4; filaN++) {
      if (filaN > 1) { if (!cords.length) break; for (const q of cords) q.max += q.max1; }
      const abertos = filaN === 1 ? postos : cords, livre = abertos.reduce((s, q) => s + q.max - q.n, 0);
      if (!livre) continue;
      const k = Math.min(1, resta / livre);
      for (const q of abertos) da(q, Math.floor((q.max - q.n) * k));
      for (const q of abertos.slice().sort((a, c) => (c.max - c.n) - (a.max - a.n))) if (resta > 0) da(q);
    }
    const reserva = resta; resta = 0;

    /* OS PMs de cada posto, no número que coube a ele */
    const livreEm = (x, z) => R.folgaEm(x, z) >= 0.3;
    for (const q of postos) {
      if (!q.n) continue;
      if (q.tipo === 'cordao') {
        const c = q.c, fila = [];
        for (let fl = 0, feitos = 0; feitos < q.n; fl++) {
          const nf = Math.min(q.max1, q.n - feitos), off = q.s * 1.2 * (fl + 1) * M;
          for (let k = 0; k < nf; k++) {
            let t0 = (k + 0.5) / nf, x, z;
            /* (onde não cabe gente, escorrega pro lado ao longo do cordão) */
            const L = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]);
            for (const d of [0, 0.35, -0.35, 0.7, -0.7]) {
              const tt = clamp(t0 + d * M / L, 0, 1);
              x = c.a[0] + (c.b[0] - c.a[0]) * tt + q.nx * off; z = c.a[1] + (c.b[1] - c.a[1]) * tt + q.nz * off;
              if (livreEm(x, z)) break;
            }
            fila.push({ pm: poePM(x, z, Math.atan2(q.s * q.nx, q.s * q.nz)) });
          }
          feitos += nf;
        }
        if (q.abre) abrirFila(fila, c.a, c.b);
      } else if (q.tipo === 'fechada') {
        const Q0 = q.q, fila = (q.n === 1 ? [0.5] : [0.3, 0.7]).map(k => ({ pm: poePM(Q0.a[0] + (Q0.b[0] - Q0.a[0]) * k - q.s * q.nx * 1.0 * M, Q0.a[1] + (Q0.b[1] - Q0.a[1]) * k - q.s * q.nz * 1.0 * M, Math.atan2(q.s * q.nx, q.s * q.nz)) }));
        if (q.abre) abrirFila(fila, Q0.a, Q0.b);
      } else if (q.tipo === 'travessia') {
        const { v, lado, ali, meia, nx, nz } = q, rumoFecha = Math.atan2(lado * ali.tx, lado * ali.tz);
        for (const i of [[1], [0, 2], [0, 1, 2]][q.n - 1]) {
          const lat = (i - 1) * meia * 0.6, la = i === 0 ? -(meia - 0.3) : meia - 0.3, ao = -lado * (1.2 + (i === 1 ? 1.3 : 0));
          const fecha = [ali.x + nx * lat * M - lado * ali.tx * 1.2 * M, ali.z + nz * lat * M - lado * ali.tz * 1.2 * M];
          const abre = [ali.x + nx * la * M + ali.tx * ao * M, ali.z + nz * la * M + ali.tz * ao * M];
          const sg = Math.sign(la);
          p.pmsQueSaem.push({ pm: poePM(fecha[0], fecha[1], rumoFecha), fecha, abre, libera: v.libera, rumoFecha, rumoAbre: Math.atan2(-sg * nx, -sg * nz) });
        }
      }
    }
    /* A REVISTA NA ENTRADA: os PMs de cada portão na boca das raias. Cada
       um cuida de um grupo de raias vizinhas; parado, fica no meio do
       grupo, virado pra quem chega; na vez de alguém, vai pro lado da raia
       dele (meia raia pro lado, 30 cm pra dentro) e fica de frente pra ele */
    p.revistadores = [];
    let portaoCheio = null;
    for (const rv of p.pm.revistas) {
      const nR = rv.raias.length;
      if (!rv.n || !nR) continue;
      const boca = rv.raias.map(r => p.mundo(r.pts[0], r.pts[1], r.pts[2])), dentro = rv.raias.map(r => p.mundo(r.pts[3], r.pts[4], r.pts[5]));
      const il = Math.hypot(dentro[0][0] - boca[0][0], dentro[0][2] - boca[0][2]) || 1;
      const ux = (dentro[0][0] - boca[0][0]) / il, uz = (dentro[0][2] - boca[0][2]) / il;
      let lx = -uz, lz = ux, larg = 1 * M;
      if (nR > 1) {
        const dx = boca[nR - 1][0] - boca[0][0], dz = boca[nR - 1][2] - boca[0][2], l = Math.hypot(dx, dz) || 1;
        lx = dx / l; lz = dz / l; larg = l / (nR - 1);
      }
      const cx = (boca[0][0] + boca[nR - 1][0]) / 2, cz = (boca[0][2] + boca[nR - 1][2]) / 2;
      const bs = p.vivos.filter(b => b.nPortao === rv.i), gente = bs.reduce((s, b) => s + b.n, 0);
      if (!portaoCheio || gente > portaoCheio.gente) portaoCheio = { gente, cx, cz, ux, uz, lx, lz };
      for (let j = 0; j < rv.n; j++) {
        const k0 = Math.floor(j * nR / rv.n), k1 = Math.max(k0, Math.floor((j + 1) * nR / rv.n) - 1), kc = (k0 + k1) / 2;
        const lugar = k => {
          const sg = k < kc ? 1 : k > kc ? -1 : (k < (nR - 1) / 2 ? 1 : -1);
          return { x: boca[k][0] + lx * sg * larg * 0.5 + ux * 0.3 * M, z: boca[k][2] + lz * sg * larg * 0.5 + uz * 0.3 * M, rumo: Math.atan2(-lx * sg, -lz * sg) };
        };
        const meio = { x: (boca[k0][0] + boca[k1][0]) / 2 + lx * (k0 === k1 ? 0.5 * larg : 0) + ux * 0.3 * M, z: (boca[k0][2] + boca[k1][2]) / 2 + lz * (k0 === k1 ? 0.5 * larg : 0) + uz * 0.3 * M, rumo: Math.atan2(-ux, -uz) };
        const servicos = [];
        for (const b of bs) for (const g of b.pessoas) if (g.pmRev === j && g.rev0 < Infinity) servicos.push({ t0: g.rev0, t1: g.rev1, ...(g.raia >= 0 ? lugar(g.raia) : meio) });
        servicos.sort((a, c) => a.t0 - c.t0);
        p.revistadores.push({ pm: poePM(meio.x, meio.z, meio.rumo, false), servicos, meio });
      }
      const r = rotulo('Revista · ' + rv.portao.nome, '#1f3f9a'); r.position.set(cx - ux * 2 * M, 4.2 * M, cz - uz * 2 * M); r.userData.prio = 1; grupo.add(r);
    }
    /* A RESERVA (o que sobrou do efetivo com todo posto cheio): uma fila
       5 m na frente do portão de mais gente, virada pra rua */
    if (reserva > 0 && portaoCheio) {
      const { cx, cz, ux, uz, lx, lz } = portaoCheio;
      for (let i = 0; i < reserva; i++) {
        const lat = (i % 12 - (Math.min(reserva, 12) - 1) / 2) * 1.0, fundo = 5 + Math.floor(i / 12) * 1.2;
        poePM(cx - ux * fundo * M + lx * lat * M, cz - uz * fundo * M + lz * lat * M, Math.atan2(-ux, -uz));
      }
    }
    /* a escolta: na frente (k 0 e 1) e atrás (2 e 3) do bonde */
    const qe = doTipo('escolta')[0];
    p.escolta = qe && qe.n ? [[0], [0, 2], [0, 1, 2], [0, 1, 2, 3]][qe.n - 1].map(k => ({ pm: poePM(qe.b.rua.pts[0][0], qe.b.rua.pts[0][2], 0, false), k, b: qe.b })) : [];
    const soma = tp => doTipo(tp).reduce((s, q) => s + q.n, 0);
    p.efetivo = { torcedores, total: efetivo, pms: policiais.length + noIsolamento, revistas: naRevista, isolamento: noIsolamento, cordoes: soma('cordao'), fechadas: soma('fechada'), travessias: soma('travessia'), escolta: p.escolta.length, reserva, filas: Math.max(1, ...cords.map(q => Math.ceil(q.n / q.max1))) };
    /* o corredor que abre pro mandante: as grades dele numa malha à parte */
    const mgA = malhaDeGrades(gradesAbre);
    if (mgA) { mgA.name = 'grades-do-corredor'; grupo.add(mgA); p.gradesQueSaem.push({ malha: mgA, libera: p.tAbre }); p.nGradesQueSaem += gradesAbre.length; }
    /* as grades numa malha só (instâncias) */
    const im = malhaDeGrades(grades);
    if (im) { im.name = 'grades-da-pm'; grupo.add(im); }
    p.nGrades = grades.length + p.nGradesQueSaem;
    p.nPMs = policiais.length;
    /* AS FITAS das rotas e o rótulo de cada torcida; a rota da paz de quem
       foi atacar fica fina e apagada, pra comparar */
    p.fitas = [];
    for (const b of p.vivos) {
      const f = fita(b.rua.pts, b.cor); f.name = 'rota ' + b.t.sigla; grupo.add(f); p.fitas.push(f);
      if (b.ruaPaz) { const f2 = fita(b.ruaPaz.pts, b.cor, 0.35, 0.12); f2.material.opacity = 0.35; f2.name = 'rota da paz ' + b.t.sigla; grupo.add(f2); p.fitas.push(f2); }
      const r = rotulo(`${b.t.sigla} · ${b.n}`, b.cor, luz(b.cor) > 150 ? '#1a1a1a' : '#fff'); r.userData.prio = 0; b.rotulo = r; grupo.add(r);
    }
    /* AS BRIGAS: o rótulo no ponto (aparece na hora) */
    for (const br of p.brigas) {
      br.rotulo = rotulo('Briga · ' + br.a.t.sigla + ' × ' + br.v.t.sigla, '#b3261e'); br.rotulo.position.set(br.P[0], 5.2 * M, br.P[1]); br.rotulo.userData.prio = 0.5; br.rotulo.visible = false; grupo.add(br.rotulo);
      br.vista = false;
    }
    const z = chaoDasZonas(p); if (z) { z.name = 'zonas'; grupo.add(z); p.chaoZonas = z; }
    /* OS BONECOS: na frente de onde o bonde sai, em rodinhas (a festa antes
       de sair); cada um sai da rodinha a tempo de pegar o lugar dele no
       bonde, lá onde o bonde se forma (s0). A escolta do aliado vai com a
       camisa dela */
    const rodasEm = new Map();
    for (const b of p.vivos) {
      const chave = Math.round(b.porta.x) + ',' + Math.round(b.porta.y);
      if (!rodasEm.has(chave)) rodasEm.set(chave, []);
      const lugares = rodinhas(b, R, semente(b.t.id + '|festa|' + b.n), rodasEm.get(chave));
      b.rua.ponto(b.s0, Q);
      b.gente = [];
      for (let m = 0; m < b.n; m++) {
        const lg = lugares[m], q = b.povo[m], T0 = b.daEscolta[m] ? b.escolta.t : b.t;
        const d = { nome: T0.sigla + ' ' + (m + 1), spawn: T0.id, torcida: T0.sigla, cor: T0.cor, cor2: T0.cor2, cor3: T0.cor3 || undefined,
                    x: lg.x, y: lg.z, alt: ctx.chaoDaRua(lg.x, lg.z), rumo: lg.rumo, vivo: true, passada: 1.15, jeito: 'festa',
                    derrubado: 0, golpe: 0, apanhou: 0, atordoado: 0, esquivou: 0, tremor: 0, defendendo: 0, hostil: 0, inimigoPerto: 0, chamou: -99, linha: 'frente' };
        /* o lugar dele no bonde lá no s0, e quanto ele leva andando até lá */
        const lat = p.ladoEm(b, b.s0, q.l / (LARGURA / 2)), px = Q.x + Q.tz * lat * M, pz = Q.z - Q.tx * lat * M;
        const T = Math.hypot(px - lg.x, pz - lg.z) / M / (MARCHA * 1.1) + 0.6;
        const tLugar = b.sai + (b.s0 / M + q.o) / MARCHA;
        b.gente.push({ d, m, festa: [lg.x, lg.z], festaAlt: d.alt, festaRumo: lg.rumo, passada: 1.1 * q.passo, T, sai: Math.max(b.sai + (m ? q.reage : 0), tLugar - T), golpeEm: Math.random() * 1.5 });
        discos.push(d);
      }
    }
    /* A BRIGA NA PORTA (a concentração), com as rodinhas postas: quem ataca
       vai no do alvo mais perto de onde ele vem (a esquina da tocaia), e
       quem cai sai dos que brigam de fato */
    for (const br of p.brigas) if (br.naPorta) {
      br.a.rua.ponto(br.sQ, Q);
      const hx = Q.x, hz = Q.z;
      br.parear(br.v.gente.map(gg => ({ m: gg.m, d: Math.hypot(gg.festa[0] - hx, gg.festa[1] - hz) })).sort((x, y) => x.d - y.d).map(x => x.m));
      br.sortearQuedas();
    }
    /* A ARQUIBANCADA: os panos, a bateria, os bandeirões, os guardas do isolamento e a invasão */
    if (p.arq) {
      try { arq = criarArquibancada(ctx, p, grupo, { M, luta, sossega, poePM, rotulo, revistadores: p.revistadores }); }
      catch (e) { console.error('dia de jogo, arquibancada:', e); arq = null; }
    }
    t = p.inicio;
    J.discos = discos; J.policiais = policiais;
    atualizar(0);
    if (!modoJogo) desenharPainel();
    return true;
  }
  function desmontar() {
    if (arq) { try { arq.limpar(); } catch (e) { console.error(e); } arq = null; }
    if (grupo) {
      grupo.traverse(o => {
        if (o.isInstancedMesh) { o.dispose(); return; }
        if (o.geometry && o.geometry !== geoGrade) o.geometry.dispose();
        if (o.material && o.material !== matGrade) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      });
      grupo.removeFromParent();
    }
    grupo = null; discos = []; policiais = []; plano = null;
    J.discos = discos; J.policiais = policiais;
  }

  /* ======================================================
     O PASSO DO RELÓGIO: cada boneco onde deve estar na hora t
     ====================================================== */
  const estadoDe = (b, m) => {
    const g = b.pessoas[m], br = b.brigou;
    /* (a briga na porta é antes de sair: a concentração é que briga) */
    if (br && br.naPorta && br.v === b && t >= br.tIni - 3 && t < br.tFim && !(b.ferido && b.ferido[m] && t >= b.tCai[m])) return 'na briga';
    if (t < b.sai) return 'na sede';
    if (b.ferido && b.ferido[m] && t >= b.tCai[m]) return b.ferido[m] === 2 ? 'preso' : 'ferido';
    if (t >= g.passa) { const s = (t - g.passa) * DENTRO * M; return s >= g.dentro.L ? 'no lugar' : 'entrando'; }
    if (br && t >= br.tIni - 3 && t < br.tFim) return 'na briga';
    if (br && br.v === b && t >= br.tFim && t < br.tFim + REAGRUPA) return 'juntando';
    const sh = plano.cabeca(b, t);
    if (br && br.a === b && t < br.tIni - 3 && sh >= br.sQ - 0.5 * M) return 'na tocaia';
    if (t >= g.rev0 && t < g.rev1) return 'na revista';
    if (sh >= b.rua.L - 1) return 'na fila';
    return 'andando';
  };
  const suave = (a, b, k) => a + (b - a) * k;
  /* onde fica na rua, na hora tt, quem tem o lugar q no bonde (sem a onda) */
  const Q3 = {}, F1 = {}, F2 = {};
  const naRua = (b, q, tt, o = {}) => {
    const s = Math.max(b.s0, plano.cabeca(b, tt) - plano.atras(b, q.o, tt) * M);
    b.rua.ponto(s, Q3);
    const lat = plano.ladoEm(b, s, q.l / (LARGURA / 2));
    o.x = Q3.x + Q3.tz * lat * M; o.z = Q3.z - Q3.tx * lat * M;
    return o;
  };
  /* A BRIGA, na hora tt: onde está o boneco m de quem ataca — corre (a
     CORRE m/s) de onde estava na tocaia, 3 s antes de o alvo chegar no
     ponto, até o lado do alvo dele (os que caem no mesmo, em volta dele);
     quem não tem alvo avança até perto e fica na guarda */
  /* o lugar da rodinha dele, na porta de onde sai (a concentração) */
  const naRodinha = (gg, o) => { o.x = gg.festa[0]; o.z = gg.festa[1]; return o; };
  const posAtaque = (br, m, tt, o = {}) => {
    const a = br.a, v = br.v, w = br.alvoDe[m];
    const de = naRua(a, a.povo[m], br.tIni - 3, F2), dx0 = de.x, dz0 = de.z;
    let ax, az, ox, oz;
    if (w >= 0) {
      /* (na porta, o alvo está na rodinha dele) */
      const pv = br.naPorta ? naRodinha(v.gente[w], Q3) : naRua(v, v.povo[w], tt, Q3), px = pv.x, pz = pv.z;
      const dx = dx0 - px, dz = dz0 - pz, l = Math.hypot(dx, dz) || 1;
      const ang = (br.ordem[m] - (br.quantosEm[w] - 1) / 2) * 0.9, c = Math.cos(ang), s = Math.sin(ang);
      ax = px + (dx * c - dz * s) / l * 0.8 * M; az = pz + (dx * s + dz * c) / l * 0.8 * M; ox = px; oz = pz;
    } else { ax = dx0 + (br.P[0] - dx0) * 0.6; az = dz0 + (br.P[1] - dz0) * 0.6; ox = br.P[0]; oz = br.P[1]; }
    const dist = Math.hypot(ax - dx0, az - dz0), k = clamp((tt - (br.tIni - 3)) * CORRE * M / Math.max(dist, 1e-3), 0, 1);
    o.x = dx0 + (ax - dx0) * k; o.z = dz0 + (az - dz0) * k; o.chegou = k >= 1; o.ox = ox; o.oz = oz;
    return o;
  };
  /* a pancada (bonecos3.js: `d.ataque`, no relógio de verdade — a briga
     corre a 1× pra se ver): quem ganha bate mais; quem perde, no fim, só
     se cobre */
  function luta(gg, d, alvoD, ganhou, fimK, dt) {
    d.hostil = 1;
    if (!alvoD) { d.ataque = null; d.apanhou = 0; return; }
    if (!ganhou && fimK > 0.6) { d.ataque = null; d.apanhou = 1; return; }
    d.apanhou = 0;
    if (d.ataque) {
      d.ataque.t += dt;
      if (!d.ataque.bateu && d.ataque.t >= d.ataque.impacto) d.ataque.bateu = true;
      if (d.ataque.t >= d.ataque.dur) d.ataque = null;
      return;
    }
    gg.golpeEm -= dt;
    if (gg.golpeEm > 0) return;
    const chute = Math.random() < 0.22;
    d.ataque = { t: 0, dur: chute ? 0.58 : 0.36, impacto: chute ? 0.28 : 0.15, tipo: chute ? 'chute' : 'soco', bateu: false, alvo: alvoD };
    gg.golpeEm = (ganhou ? 0.6 : 1.1) * (0.7 + Math.random() * 1.1);
  }
  const sossega = d => { if (d.hostil || d.ataque || d.apanhou) { d.hostil = 0; d.ataque = null; d.apanhou = 0; } };
  /* o relógio de verdade (o balanço de cada um pro lado não corre a 30×) */
  let tReal = 0;
  function atualizar(dt) {
    if (!plano) return;
    const p = plano;
    tReal += dt;
    for (const b of p.vivos) {
      const sh = p.cabeca(b, t), L = b.rua.L;
      /* quantos já passaram a catraca */
      let dentro = 0; for (const g of b.pessoas) if (g.passa <= t) dentro++;
      b.dentroN = dentro;
      let noLugar = 0;
      /* a cabeça, com a raia depois da boca: quem vem atrás continua no passo do bonde */
      const cab = t <= b.chega ? sh : L + (t - b.chega) * MARCHA * M;
      /* o desenho respira andando e para quieto com o bonde parado (a tocaia, a briga) */
      const pr = p.paradaEm(b, t);
      const anda = pr ? 1 - liso((t - pr.t1 + 3) / 3) * (1 - liso((t - pr.t2) / 5)) : 1;
      const br = b.brigou, ataca = !!br && br.a === b;
      const naBriga = !!br && t >= br.tIni - 3 && t < br.tFim + 6, brigando = !!br && t >= br.tIni && t < br.tFim;
      const ganhou = !!br && (ataca ? br.venceA : !br.venceA), fimK = br ? (t - br.tIni) / BRIGA : 0;
      for (const gg of b.gente) {
        const d = gg.d, m = gg.m, g = b.pessoas[m], q = b.povo[m];
        const x0 = d.x, z0 = d.y;
        d.passada = gg.passada * Math.max(1, rodando ? vezes : 1); d._cacando = false;
        /* FERIDO NA BRIGA: fica no chão, onde caiu; PRESO: rendido de pé,
           com as mãos pra cima, onde estava (esperando a viatura) */
        if (b.ferido && b.ferido[m] && t >= b.tCai[m]) {
          const f = ataca ? posAtaque(br, m, b.tCai[m], F1) : br && br.naPorta ? naRodinha(gg, F1) : naRua(b, q, b.tCai[m], F1);
          d.x = f.x; d.y = f.z; d.alt = ctx.chaoDaRua(f.x, f.z);
          d.hostil = 0; d.ataque = null; d.apanhou = 0;
          if (b.ferido[m] === 2) {
            if (d.noChao) { d.derrubado = 0; d.noChao = false; }
            d.jeito = 'revista';
          } else { d.jeito = undefined; d.derrubado = 1; d.derrubadoDur = 2; d.noChao = true; }
          continue;
        }
        /* NO LUGAR (arquibancada.js): o papel dele — o canto, a bateria, o
           bandeirão, o pano, o puxador — e a invasão */
        if (arq && arq.controla(b, m, t)) { arq.pessoa(b, gg, d, t, dt); if (arq.noLugar(b, m, t)) noLugar++; continue; }
        if (d.noChao) { d.derrubado = 0; d.noChao = false; }
        if (t >= g.passa) {
          /* DENTRO: da catraca até a vaga */
          sossega(d);
          const tr = g.dentro, s = (t - g.passa) * DENTRO * M;
          tr.ponto(s, Q);
          d.x = Q.x; d.y = Q.z;
          const yc = ctx.chaoDoEstadio ? ctx.chaoDoEstadio(Q.x, Q.z, d.alt ?? Q.y) : NaN;
          d.alt = yc === yc && Math.abs(yc - Q.y) < 1.2 * M ? suave(d.alt ?? yc, yc, 0.5) : Q.y;
          d.jeito = undefined;
          if (s >= tr.L) { noLugar++; d.rumo = Math.atan2(p.centroEst[0] - d.x, p.centroEst[2] - d.y); }
          else { const mx = d.x - x0, mz = d.y - z0; if (mx * mx + mz * mz > 1e-4) d.rumo = Math.atan2(mx, mz); }
          if (arq) arq.gesto(b, gg, d);
          continue;
        }
        if (t < gg.sai) {
          /* A BRIGA NA PORTA (a concentração): quem está na rodinha briga ali
             mesmo, virado pra quem veio nele (quem ficou sem ninguém, pro
             meio da briga) */
          if (naBriga && br.naPorta && !ataca) {
            d.x = gg.festa[0]; d.y = gg.festa[1]; d.alt = gg.festaAlt; d.jeito = undefined;
            const i = br.primeiro[m], alvoD = i >= 0 ? br.a.gente[i].d : null;
            d.rumo = Math.atan2((alvoD ? alvoD.x : br.P[0]) - d.x, (alvoD ? alvoD.y : br.P[1]) - d.y);
            if (brigando && alvoD && Math.hypot(alvoD.x - d.x, alvoD.y - d.y) < 1.6 * M) luta(gg, d, alvoD, ganhou, fimK, dt);
            else if (brigando) { d.hostil = 1; d.ataque = null; }
            else sossega(d);
            continue;
          }
          /* NA PORTA DA SEDE (ou de onde sai), na rodinha */
          sossega(d);
          d.x = gg.festa[0]; d.y = gg.festa[1]; d.alt = gg.festaAlt; d.rumo = gg.festaRumo; d.jeito = 'festa';
          if (arq) arq.gesto(b, gg, d);
          continue;
        }
        /* NA RUA E NA RAIA: o lugar dele no bonde (com a onda que passa
           pelo desenho, que some perto do portão), até a fila da raia
           dele deixar: antes da revista, atrás da boca da raia, um NA_FILA
           por quem da raia ainda não foi revistado; depois, andando até a
           parada, atrás de quem ainda não passou a catraca */
        const perto = clamp((L - (cab - q.o * M)) / (12 * M), 0, 1);
        const onda = anda * perto * (0.5 * Math.sin(q.o * 2 * Math.PI / 14 + t * 2 * Math.PI / 47 + b.onda[0]) + 0.25 * Math.sin(q.l * 2 * Math.PI / 7 + t * 2 * Math.PI / 29 + b.onda[1]));
        const livre = cab - (p.atras(b, q.o, t) - onda) * M;
        let lim = Infinity, revistando = false;
        if (g.mesmaRaia) {
          let naBoca = g.j, naCat = g.j;
          for (const h of g.mesmaRaia) { if (h.j >= g.j) break; naBoca -= liso((t - h.rev1) / 0.6); naCat -= liso((t - h.passa) / 0.6); }
          if (t < g.rev1) { lim = L + (g.Lm - naBoca * NA_FILA) * M; revistando = t >= g.rev0; }
          else lim = Math.min(L + (g.Lm + (t - g.rev1) * MARCHA) * M, L + (g.Lf - naCat * NA_FILA) * M);
        }
        const X = Math.min(livre, lim);
        let x, z, alt;
        if (X > L) {
          g.fila.ponto(X - L, Q); x = Q.x; z = Q.z;
          const yc = ctx.chaoDoEstadio ? ctx.chaoDoEstadio(x, z, d.alt ?? Q.y) : NaN;
          alt = yc === yc && Math.abs(yc - Q.y) < 1.2 * M ? yc : ctx.chaoDaRua(x, z);
        } else {
          const s = Math.max(b.s0, X);
          b.rua.ponto(s, Q);
          const lat = p.ladoEm(b, s, q.l / (LARGURA / 2)) + 0.1 * anda * perto * Math.sin(tReal * q.wl + q.fl);
          x = Q.x + Q.tz * lat * M; z = Q.z - Q.tx * lat * M; alt = ctx.chaoDaRua(x, z);
        }
        /* saindo da rodinha: da festa até o lugar dele no bonde */
        const k = liso((t - gg.sai) / gg.T);
        if (k < 1) { x = gg.festa[0] + (x - gg.festa[0]) * k; z = gg.festa[1] + (z - gg.festa[1]) * k; alt = ctx.chaoDaRua(x, z); }
        let jeito = revistando && X >= lim - 0.05 * M ? 'revista' : lim < livre - 0.05 * M ? 'fila' : 'bonde';
        /* A BRIGA: quem ataca corre pro lado do alvo dele e, no fim, volta
           pro lugar dele no bonde (que sai da tocaia); quem é atacado fica
           onde o bonde parou */
        let olha = null, alvoD = null;
        if (naBriga) {
          jeito = undefined;
          if (ataca) {
            const f = posAtaque(br, m, Math.min(t, br.tFim), F1);
            if (t < br.tFim) { x = f.x; z = f.z; d._cacando = !f.chegou; }
            else { const kk = liso((t - br.tFim) / 6); x = f.x + (x - f.x) * kk; z = f.z + (z - f.z) * kk; }
            alt = ctx.chaoDaRua(x, z);
            if (f.chegou) { olha = [f.ox, f.oz]; const w = br.alvoDe[m]; if (w >= 0) alvoD = br.v.gente[w].d; }
          } else {
            const i = br.primeiro[m];
            if (i >= 0) { alvoD = br.a.gente[i].d; olha = [alvoD.x, alvoD.y]; }
            else olha = [br.P[0], br.P[1]];
          }
        }
        d.x = x; d.y = z; d.alt = alt; d.jeito = jeito;
        if (arq) arq.gesto(b, gg, d);
        if (brigando && (olha || alvoD)) {
          if (olha) d.rumo = Math.atan2(olha[0] - d.x, olha[1] - d.y);
          if (!ataca || (alvoD && Math.hypot(alvoD.x - d.x, alvoD.y - d.y) < 1.6 * M)) luta(gg, d, alvoD, ganhou, fimK, dt);
          else { d.hostil = 1; d.ataque = null; }
        } else {
          sossega(d);
          const mx = d.x - x0, mz = d.y - z0;
          if (mx * mx + mz * mz > 1e-4) d.rumo = Math.atan2(mx, mz);
        }
      }
      b.noLugar = noLugar;
      /* o rótulo em cima da cabeça do bonde (ou em cima da torcida, no lugar) */
      const lider = b.gente[0].d;
      /* (no lugar, em cima dos bandeirões: a 3,4 m ele tapava a torcida) */
      b.rotulo.position.set(lider.x, (lider.alt || 0) + (arq && arq.controla(b, 0, t) ? 8.5 : 3.4) * M, lider.y);
    }
    /* o rótulo da briga aparece na hora dela e fica (é onde ficam os feridos) */
    for (const br of p.brigas) br.rotulo.userData.escondido = t < br.tIni - 3;
    /* a escolta: na frente e atrás do bonde, até o portão */
    for (const e of p.escolta) {
      const b = e.b, sh = p.cabeca(b, t), atras = (b.cauda + 1.5) * M;
      const s = Math.min(e.k < 2 ? sh + 2 * M : Math.max(0, sh - atras), b.rua.L - (e.k < 2 ? 2 : 5) * M);
      b.rua.ponto(Math.max(0, s), Q2);
      const folga = p.R.folgaEm(Q2.x, Q2.z), lat = Math.min(2.2, Math.max(0.6, folga - 0.6)) * (e.k % 2 ? 1 : -1);
      const x0 = e.pm.x, z0 = e.pm.y;
      e.pm.x = Q2.x + Q2.tz * lat * M; e.pm.y = Q2.z - Q2.tx * lat * M; e.pm.alt = ctx.chaoDaRua(e.pm.x, e.pm.y);
      const mx = e.pm.x - x0, mz = e.pm.y - z0;
      if (mx * mx + mz * mz > 1e-4) e.pm.rumo = Math.atan2(mx, mz);
    }
    /* A REVISTA: cada PM vai (0,8 s) pro lado da raia de quem é a vez e
       fica de frente pra ele; sem ninguém, volta pro meio do grupo dele */
    for (const rv of p.revistadores) {
      const S = rv.servicos, pm = rv.pm;
      let lo = 0, hi = S.length;
      while (lo < hi) { const md = (lo + hi) >> 1; if (S[md].t1 <= t) lo = md + 1; else hi = md; }
      let alvo = rv.meio, de = null, k = 1, servindo = false;
      if (lo < S.length && t >= S[lo].t0 - 0.8) {
        alvo = S[lo]; servindo = t >= S[lo].t0;
        de = lo > 0 && S[lo].t0 - S[lo - 1].t1 < 4 ? S[lo - 1] : rv.meio;
        k = liso((t - (S[lo].t0 - 0.8)) / 0.8);
      } else if (lo > 0 && t - S[lo - 1].t1 < 3) alvo = S[lo - 1];
      pm.x = de ? de.x + (alvo.x - de.x) * k : alvo.x; pm.y = de ? de.z + (alvo.z - de.z) * k : alvo.z;
      pm.alt = ctx.chaoDaRua(pm.x, pm.y);
      pm.rumo = servindo || (alvo !== rv.meio && k >= 1) ? alvo.rumo : rv.meio.rumo;
    }
    /* a travessia e o corredor que abre: fechados até a hora; aí a grade sai e os PMs andam (25 s) pra calçada */
    for (const g of p.gradesQueSaem) g.malha.visible = t < g.libera;
    for (const q of p.pmsQueSaem) {
      const k = clamp((t - q.libera) / 25, 0, 1), pm = q.pm;
      pm.x = q.fecha[0] + (q.abre[0] - q.fecha[0]) * k; pm.y = q.fecha[1] + (q.abre[1] - q.fecha[1]) * k;
      pm.alt = ctx.chaoDaRua(pm.x, pm.y);
      pm.rumo = k <= 0 ? q.rumoFecha : k >= 1 ? q.rumoAbre : Math.atan2(q.abre[0] - q.fecha[0], q.abre[1] - q.fecha[1]);
    }
    /* A ARQUIBANCADA: os panos, os instrumentos, os bandeirões, as grades e a PM do estádio */
    if (arq) arq.quadro(t, tReal, dt);
    /* a passada dos PMs que andam, como a dos bonecos */
    for (const pm of policiais) pm.passada = 1.15 * Math.max(1, rodando ? vezes : 1);
    J.t = t;
  }

  /* ======================================================
     O PAINEL
     ====================================================== */
  function cabecalho() {
    return `<button class="cen-x" data-jogo="fechar" aria-label="Fechar o dia de jogo">×</button><p class="cj-sobre">Dia de jogo · jogo fictício</p>`;
  }
  const pct = x => Math.round(x) + '%';
  /* de onde o bonde sai, e quem vai nele */
  function saidaTxt(b) {
    const ini = b.inicio;
    if (ini.tipo === 'entrada') return `A caravana desce na ${esc(ini.entrada ? ini.entrada.nome.replace(/^Pórtico da /, '') : 'entrada da cidade')} e vai a pé`;
    if (ini.tipo === 'aliado') return `Sai da sede da ${esc(ini.t.sigla)}, que ${b.anfitriao.decisao === 'escolta' ? 'hospedou e escolta' : 'hospedou'}${b.anfitriao.doMandante ? ' (e sai sozinha: a anfitriã é do mandante, só hospeda)' : ''}`;
    return `Sai da sede (${esc(b.t.bairro || '—')})`;
  }
  function genteTxt(b) {
    const esc1 = b.escolta ? ` + ${b.escolta.membros} da ${esc(b.escolta.t.sigla)} na escolta` : '';
    return b.deFora ? `caravana de ${b.naRua} (de ${b.t.membros || '?'} membros, de ${esc(b.t.cidade || 'fora')})${esc1}` : `${b.naRua} na rua (de ${b.t.membros || '?'} membros)`;
  }
  /* o que a IA decidiu, e por quê */
  function decisaoTxt(b) {
    const d = b.decisao, br = b.brigou;
    if (!d) return '';
    if (br && br.v === b) return `Foi atacada pela ${esc(br.a.t.sigla)}.`;
    const al = d.alvo ? esc(d.alvo.t.sigla) : '';
    if (d.ataca && d.porque === 'mandada') return `<b>Vai atacar a ${al}</b> (a briga que o jogo mandou): ${b.brigou && b.brigou.naPorta ? 'vai até a porta de onde ela sai e cai em cima da concentração, antes de ela partir' : 'espera na esquina da rota dela e cai em cima do bonde quando ele passa'}; depois, vai pro estádio.`;
    if (d.ataca) return `<b>Decidiu atacar a ${al}</b> (chance ${pct(d.chance)}${plano.modoIA === 'sorteio' ? `, tirou ${d.tirou}` : ''}): vai de encontro ao bonde dela em vez de ir direto pro estádio.`;
    if (d.porque === 'sem rival') return 'Vai em paz: nenhuma rival dela no outro clube.';
    if (d.porque === 'pequena') return 'Vai em paz: as rivais dela no outro clube são grandes demais (a paridade do jogo: com menos de 45% do tamanho da rival, ninguém vai).';
    if (d.porque === 'rivais ocupadas') return 'Vai em paz: as rivais dela já estão numa briga.';
    if (d.porque === 'paz') return `Vai em paz (mandada; a chance de atacar a ${al} era ${pct(d.chance)}).`;
    if (d.porque === 'não achou') return b.naoAchou && !b.naoAchou.pontos
      ? `Queria atacar a ${al}, mas a rota dela quase não passa pela cidade (a sede fica colada nos arredores do estádio, onde está a PM): vai em paz.`
      : `Queria atacar a ${al}, mas não achou onde esperar escondido no caminho dela: vai em paz.`;
    return `Vai em paz (a chance de atacar a ${al} era ${pct(d.chance)}; tirou ${d.tirou}).`;
  }
  function brigaTxt(b) {
    const br = b.brigou;
    if (!br) return '';
    const ataca = br.a === b, venceu = ataca ? br.venceA : !br.venceA, fer = ataca ? br.ferA : br.ferV, pres = ataca ? br.presA : br.presV, n = ataca ? br.nA : br.nV;
    return `Briga às ${hora(br.tIni)}: ${venceu ? 'ganhou' : 'perdeu'}${(ataca ? br.favoritoA : !br.favoritoA) ? ' (era a favorita)' : ' (era a zebra)'}; ${fer} ferido${fer === 1 ? '' : 's'} e ${pres} preso${pres === 1 ? '' : 's'} ficam na rua — chega no estádio com ${n - fer - pres} de ${n}.`;
  }
  function linhaDe(b) {
    const est = b.estadoTxt || '—';
    return `<li><i style="background:${esc(b.cor)}"></i><div><b>${esc(b.t.sigla)}</b> <small>${esc(b.t.nome)} · ${b.escalao}º escalão · ${genteTxt(b)} · ${b.n} bonecos</small>
      <small>${saidaTxt(b)} às ${hora(b.sai)}${b.adiantou ? ` (${b.adiantou} min antes, pra não cruzar rival)` : ''}${b.esperou ? ` (${b.esperou} min depois: espera o corredor do visitante abrir)` : ''} · ${Math.round(b.comprimento)} m até o ${esc(b.portao.nome.toLowerCase())} · setor ${esc(b.setor)}</small>
      ${b.deFora ? `<small>${b.anfitriao ? `Aliado na praça: ${esc(b.anfitriao.t.sigla)} (${b.anfitriao.grau === 2 ? 'irmandade' : 'aliado'}${b.anfitriao.doMandante ? ', do mandante: só hospeda' : ''}) — ${b.anfitriao.decisao === 'nada' ? 'não recebeu' : b.anfitriao.decisao === 'hospedar' ? 'hospedou' : `hospedou e escoltou com ${b.anfitriao.escoltaMembros}`}${b.anfitriao.forcada ? ' (mandado)' : ` (sorteio: ${b.anfitriao.pct.join('/')}%, tirou ${b.anfitriao.tirou})`}` : 'Sem aliado com sede na praça'}.</small>` : ''}
      <small>${decisaoTxt(b)}${b.brigou ? ' ' + brigaTxt(b) : ''}</small>
      ${arq ? arq.linha(b) : ''}
      <small class="cj-estado" data-bonde="${esc(b.t.id)}">${esc(est)}</small></div></li>`;
  }
  /* o que o plano diz do encontro entre rivais na cidade */
  const siglas = l => { const n = l.slice().sort((a, b) => a.escalao - b.escalao).map(b => esc(b.t.sigla)); return n.length > 1 ? n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1] : n[0]; };
  function encontroTxt(p) {
    const e = p.menor && p.menor.d < Infinity ? p.menor : null, v = p.travessias;
    const doPlano = p.brigas.length ? 'No plano da PM (o da paz), ' : '';
    if (e && e.d < ENCONTRO) return `${doPlano}Encontro provável: ${esc(e.a.t.sigla)} e ${esc(e.b.t.sigla)} passam a <b>${Math.round(e.d)} m</b> um do outro às ${hora(e.t)}, na cidade.`;
    const partes = [];
    if (e) partes.push(`${doPlano}na rua, o mais perto que dois bondes rivais chegam um do outro: <b>${Math.round(e.d)} m</b> (${esc(e.a.t.sigla)} e ${esc(e.b.t.sigla)}, às ${hora(e.t)}).`);
    else partes.push(doPlano + 'nenhum bonde rival está na rua ao mesmo tempo que outro, fora dos arredores.');
    if (!v.length) partes.push(`As rotas rivais não se cruzam na cidade: nenhuma passa a menos de ${TRAVESSIA} m de outra.`);
    else partes.push(`As rotas rivais se cruzam em ${v.length === 1 ? 'um ponto' : v.length + ' pontos'} da cidade, onde o mapa não deixa uma evitar a outra: ` +
      v.map(x => `${siglas(x.antes)} passa${x.antes.length > 1 ? 'm' : ''} até ${hora(x.libera - 60)} e ${siglas(x.depois)} chega${x.depois.length > 1 ? 'm' : ''} às ${hora(x.chega)}`).join('; ') +
      '. Ali quem separa é o horário, e a PM fecha a travessia enquanto o primeiro passa.');
    const s = partes.join(' ');
    return s[0].toUpperCase() + s.slice(1);
  }
  /* as brigas do dia: quem, onde, quando e como acabou */
  function brigasTxt(p) {
    if (!p.brigas.length) return `<p class="cj-aviso">Nenhuma torcida decidiu atacar: todo mundo vai em paz, na rota da PM.</p>`;
    return p.brigas.map((br, i) => {
      const venc = br.venceA ? br.a : br.v, perd = br.venceA ? br.v : br.a;
      return `<p class="cj-aviso ruim">Às ${hora(br.tIni)}, a ${esc(br.a.t.sigla)} (${br.nA}) cai em cima ${br.naPorta ? `da concentração da ${esc(br.v.t.sigla)} (${br.nV}), na porta de onde ela sai, antes de o bonde partir` : `do bonde da ${esc(br.v.t.sigla)} (${br.nV}) ${br.esquina ? 'numa esquina da rota dela' : 'na rua'}, fora dos arredores`} — a PM não sabia (o plano dela é o da paz). A ${esc(venc.t.sigla)} leva a melhor (força ${Math.round(br.venceA ? br.fA : br.fV)} × ${Math.round(br.venceA ? br.fV : br.fA)}: ${(br.venceA === br.favoritoA) ? 'a favorita venceu, como em 70% das vezes' : 'deu zebra, como em 30% das vezes'}). Ficam no chão ${br.ferA} da ${esc(br.a.t.sigla)} e ${br.ferV} da ${esc(br.v.t.sigla)}, e ficam presos ${br.presA} e ${br.presV}; depois, cada uma vai pro estádio com quem ficou de pé e solto (a ${esc(br.v.t.sigla)} junta os dela ${br.naPorta ? 'e sai na hora dela' : `por ${Math.round(REAGRUPA / 60)} min`}). <button class="cen-bt" data-jogo="briga" data-i="${i}">Ver a briga</button></p>`;
    }).join('');
  }
  function controlesDoJogo(p) {
    const daqui = p.lista.filter(c => c.id !== p.casa.id);
    const opt = (c, sel, uf) => `<option value="${esc(c.id)}"${sel ? ' selected' : ''}>${esc(c.nome)}${uf && c.uf ? ' (' + esc(c.uf) + ')' : ''}</option>`;
    const temAnf = p.vivos.some(b => b.anfitriao);
    /* o aliado do mandante só hospeda: sem a opção de escoltar */
    const podeEscoltar = p.vivos.some(b => b.anfitriao && !b.anfitriao.doMandante);
    return `<div class="cj-ctrl">
        <select data-jogo="casa" aria-label="O mandante">${p.lista.map(c => opt(c, c.id === p.casa.id)).join('')}</select> ×
        <select data-jogo="fora" aria-label="O visitante">${daqui.length ? `<optgroup label="Da praça">${daqui.map(c => opt(c, c.id === p.fora.id)).join('')}</optgroup>` : ''}<optgroup label="De fora">${p.deFora.map(c => opt(c, c.id === p.fora.id, true)).join('')}</optgroup></select>
        ${p.foraDaqui ? '<button class="cen-bt" data-jogo="inverter">Inverter o mando</button>' : ''}
        <select data-jogo="gente" aria-label="Quanta gente"><option value="0.5"${escolha.gente === 0.5 ? ' selected' : ''}>Pouca gente</option><option value="1"${escolha.gente === 1 ? ' selected' : ''}>Gente normal</option><option value="2"${escolha.gente === 2 ? ' selected' : ''}>Muita gente</option></select>
      </div>
      <div class="cj-ctrl">
        <select data-jogo="ia" aria-label="O que as torcidas decidem"><option value="sorteio"${(escolha.ia || 'sorteio') === 'sorteio' ? ' selected' : ''}>As torcidas decidem (sorteio)</option><option value="paz"${escolha.ia === 'paz' ? ' selected' : ''}>Todas vão em paz</option><option value="ataque"${escolha.ia === 'ataque' ? ' selected' : ''}>Quem pode, ataca</option></select>
        ${temAnf ? `<select data-jogo="anfitriao" aria-label="O que o aliado decide"><option value="sorteio"${(escolha.anfitriao || 'sorteio') === 'sorteio' ? ' selected' : ''}>O aliado decide (sorteio)</option><option value="nada"${escolha.anfitriao === 'nada' ? ' selected' : ''}>O aliado não recebe</option><option value="hospedar"${escolha.anfitriao === 'hospedar' ? ' selected' : ''}>O aliado hospeda</option>${podeEscoltar ? `<option value="escolta"${escolha.anfitriao === 'escolta' ? ' selected' : ''}>Hospeda e escolta</option>` : ''}</select>` : ''}
        <button class="cen-bt" data-jogo="sortear">Sortear de novo</button>
      </div>
      <div class="cj-ctrl">
        <select data-jogo="invade" aria-label="A briga no estádio"><option value="nao"${(escolha.estadio || 'nao') === 'nao' ? ' selected' : ''}>No estádio: ninguém invade sozinho</option><option value="sorteio"${escolha.estadio === 'sorteio' ? ' selected' : ''}>As torcidas decidem (sorteio)</option><option value="arquibancada"${escolha.estadio === 'arquibancada' ? ' selected' : ''}>Invade pela arquibancada</option><option value="corredor"${escolha.estadio === 'corredor' ? ' selected' : ''}>Invade pelo corredor</option></select>
        <select data-jogo="cordao" aria-label="O cordão da PM"><option value="sorteio"${(escolha.cordao || 'sorteio') === 'sorteio' ? ' selected' : ''}>O cordão: sorteio</option><option value="segura"${escolha.cordao === 'segura' ? ' selected' : ''}>A PM segura</option><option value="fura"${escolha.cordao === 'fura' ? ' selected' : ''}>A torcida fura o cordão</option></select>
      </div>`;
  }
  function desenharPainel() {
    const p = plano;
    if (!p || p.erro) return;
    const menor = p.menor && p.menor.d < Infinity ? p.menor : null;
    const pmN = p.pm, ef = p.efetivo;
    const revTxt = pmN.revistas.map(rv => `${rv.n} no ${esc(rv.portao.nome.toLowerCase())}`).join(', ');
    painel.innerHTML = cabecalho() + `
      <h2>${esc(p.casa.nome)} × ${esc(p.fora.nome)}</h2>
      <p class="cj-onde">${esc(p.estadio.nome)} · domingo, bola rolando às 16h00${p.foraDaqui ? '' : ` · o ${esc(p.fora.nome)} vem de ${esc(p.fora.cidade || 'fora')}${p.fora.uf ? ' (' + esc(p.fora.uf) + ')' : ''}`}</p>
      <div class="cj-rel"><b class="cj-relogio">${hora(t)}</b>
        <button class="cen-bt" data-jogo="toca" aria-pressed="${rodando}">${rodando ? 'Pausar' : 'Começar'}</button>
        <span class="cj-vezes" role="group" aria-label="Velocidade">${VEZES.map(v => `<button data-vezes="${v}" aria-pressed="${v === vezes}">${v}×</button>`).join('')}</span></div>
      <input type="range" class="cj-tempo" min="${Math.floor(p.inicio)}" max="${Math.ceil(p.fimTudo + 60)}" step="1" value="${Math.round(t)}" aria-label="A hora do jogo">
      <p class="cj-lado">Mandante · portões 1 e 2</p><ul>${p.vivos.filter(b => b.lado === 'mandante').map(linhaDe).join('')}</ul>
      <p class="cj-lado">Visitante · portão 3</p><ul>${p.vivos.filter(b => b.lado === 'visitante').map(linhaDe).join('')}</ul>
      ${brigasTxt(p)}
      ${arq ? arq.texto() : ''}
      ${p.bondes.filter(b => !b.rua).map(b => `<p class="cj-aviso ruim">${esc(b.t.sigla)}: ${esc(b.erro || 'sem rota')}</p>`).join('')}
      ${p.rotaVelha ? `<p class="cj-aviso ruim">O ${esc(p.estadio.modelo.replace('estadio-', 'estádio de ') + ' mil')} mudou depois das rotas de dentro dele: dentro do estádio a torcida pode atravessar parede. Rode ferramentas/planta_html/rotas_estadios.mjs de novo.</p>` : ''}
      <p class="cj-pm"><b>A PM</b>: a revista é na entrada, na boca das raias de cada portão (${revTxt}: um PM pra cada ${REVISTA_POR_PM} que passam, no máximo um por raia; ${REVISTA} s cada um); ${pmN.cordoes.length} ${pmN.cordoes.length === 1 ? 'cordão' : 'cordões'} na divisa das zonas (a verde é do mandante, a vermelha do visitante) e ${pmN.fechadas.length} rua${pmN.fechadas.length === 1 ? '' : 's'} fechada${pmN.fechadas.length === 1 ? '' : 's'} na borda dos arredores (${Math.round(p.raio)} m de rua em volta dos portões)${p.travessias.length ? `, ${p.travessias.length} travessia${p.travessias.length === 1 ? '' : 's'} na cidade` : ''}${p.longeDe.length && p.tAbre == null ? ` (o corredor do visitante foi traçado longe do ${esc(p.longeDe.map(n => n.toLowerCase()).join(' e do '))}, que ele deixava ilhado)` : ''} · ${p.nGrades} grades. <b>${ef.pms} PMs</b>, um pra cada ${Math.round(1 / PM_POR_TORCEDOR)} torcedores do jogo (${ef.torcedores} bonecos): ${[[ef.revistas, 'na revista'], [ef.isolamento, 'no isolamento dentro do estádio (entre as torcidas)'], [ef.cordoes, 'nos cordões' + (ef.filas > 1 ? ` (em ${ef.filas} filas)` : '')], [ef.fechadas, 'nas ruas fechadas'], [ef.travessias, 'nas travessias'], [ef.escolta, 'na escolta do visitante'], [ef.reserva, 'de reserva na frente do portão']].filter(x => x[0]).map(x => x[0] + ' ' + x[1]).join(', ')}.${p.tAbre != null ? ` O ${esc(p.portoesQueAbrem.map(n => n.toLowerCase()).join(' e o '))} fica no caminho do visitante (o mapa não deixa outro): a PM segura o corredor até o último visitante entrar e só às ${hora(p.tAbre)} abre a rua pro mandante.` : ''}</p>
      <p class="cj-aviso${(menor && menor.d < ENCONTRO) || p.travessias.some(v => v.folga < 60) ? ' ruim' : ''}">${encontroTxt(p)}</p>
      <div class="cj-ctrl">
        <button class="cen-bt" data-jogo="plano">Ver o plano</button>
        <button class="cen-bt" data-jogo="estadio">Ver o estádio</button>
        <select data-jogo="seguir" aria-label="Seguir uma torcida"><option value="">Seguir…</option>${p.vivos.map(b => `<option value="${esc(b.t.id)}"${seguir === b ? ' selected' : ''}>${esc(b.t.sigla)}</option>`).join('')}</select>
        <label><input type="checkbox" data-jogo="rotas"${verRotas ? ' checked' : ''}> Rotas e zonas</label>
      </div>
      ${controlesDoJogo(p)}`;
    ligarPainel();
    atualizarPainel(true);
  }
  let ultimoPainel = 0;
  function atualizarPainel(ja) {
    if (!plano || plano.erro) return;
    const agora = performance.now();
    if (!ja && agora - ultimoPainel < 250) return;
    ultimoPainel = agora;
    const r = painel.querySelector('.cj-relogio'); if (r) r.textContent = hora(t);
    const lt = painel.querySelector('.cj-tempo'); if (lt && document.activeElement !== lt) lt.value = Math.round(t);
    for (const b of plano.vivos) {
      const el = painel.querySelector(`[data-bonde="${CSS.escape(b.t.id)}"]`);
      if (!el) continue;
      const lider = estadoDe(b, 0);
      /* o último que ainda vai entrar (quem ficou ferido não conta) */
      let m1 = b.n - 1; while (m1 > 0 && b.ferido && b.ferido[m1]) m1--;
      const ult = estadoDe(b, m1);
      let caidos = 0, presos = 0;
      if (b.ferido && b.tCai) for (let m = 0; m < b.n; m++) if (b.tCai[m] <= t) { if (b.ferido[m] === 2) presos++; else caidos++; }
      const fora = b.ferido ? b.ferido.reduce((s, x) => s + (x ? 0 : 1), 0) : b.n;
      let txt;
      if (lider === 'na sede') txt = b.inicio.tipo === 'entrada' ? 'Na entrada da cidade, descendo da caravana' : b.inicio.tipo === 'aliado' ? 'Na porta da sede do aliado' : 'Na porta da sede';
      else if (ult === 'no lugar') txt = `Todos no lugar, no setor ${b.setor}` + (caidos || presos ? ` (ficaram na rua ${caidos} feridos e ${presos} presos)` : '');
      else if (lider === 'na briga') txt = `Na briga com a ${esc((b.brigou.a === b ? b.brigou.v : b.brigou.a).t.sigla)}` + (caidos || presos ? `: ${caidos} no chão${presos ? `, ${presos} rendidos` : ''}` : '');
      else if (lider === 'na tocaia') txt = `Na tocaia, esperando o bonde da ${b.brigou.v.t.sigla}`;
      else if (lider === 'juntando') txt = `Juntando os dela depois da briga (${caidos} no chão)`;
      else if (b.dentroN > 0) txt = `Passando a catraca: ${b.dentroN} de ${fora} dentro, ${b.noLugar} no lugar`;
      else if (lider === 'na revista' || lider === 'na fila') txt = 'Na revista e na fila do ' + b.portao.nome.toLowerCase();
      else txt = `Andando: ${Math.round(plano.cabeca(b, t) / M)} de ${Math.round(b.comprimento)} m` + (caidos ? ` (${caidos} ficaram na rua)` : '');
      /* a invasão no estádio (arquibancada.js) manda na linha de quem está nela */
      const naInvasao = arq && arq.statusDe(b, t);
      if (naInvasao) txt = naInvasao;
      el.textContent = txt;
    }
    const bt = painel.querySelector('[data-jogo="toca"]');
    if (bt) { bt.textContent = rodando ? 'Pausar' : t >= plano.fimTudo ? 'De novo' : t > plano.inicio + 1 ? 'Continuar' : 'Começar'; bt.setAttribute('aria-pressed', String(rodando)); }
  }
  const marcarVezes = () => { for (const o of painel.querySelectorAll('[data-vezes]')) o.setAttribute('aria-pressed', String(+o.dataset.vezes === vezes)); };
  /* a briga a 1×, até ela acabar; depois volta a velocidade de antes */
  /* (no jogo de verdade a briga passa a 2×: a 1× ela tomava 45 s de tela a cada vez) */
  const devagar = br => { const v1 = modoJogo ? 2 : 1; if (vezes > v1 || lenta) { lenta = { ate: br.tFim + 8, vezes: lenta ? lenta.vezes : vezes }; vezes = v1; marcarVezes(); } };
  function ligarPainel() {
    for (const el of painel.querySelectorAll('[data-jogo]')) {
      const a = el.dataset.jogo;
      if (el.tagName === 'SELECT' || el.type === 'checkbox') el.onchange = () => acao(a, el);
      else el.onclick = () => acao(a, el);
    }
    for (const el of painel.querySelectorAll('[data-vezes]')) el.onclick = () => { vezes = +el.dataset.vezes; lenta = null; marcarVezes(); };
    const lt = painel.querySelector('.cj-tempo');
    if (lt) lt.oninput = () => { t = +lt.value; atualizar(0); atualizarPainel(true); ctx.pedir(); };
  }
  const refazem = ['inverter', 'par', 'gente', 'casa', 'fora', 'ia', 'anfitriao', 'sortear', 'padrao', 'invade', 'cordao'];
  function acao(a, el) {
    if (a === 'fechar') { fechar(); return; }
    if (!plano || plano.erro) { if (refazem.includes(a)) refazer(a, el); return; }
    if (a === 'toca') {
      if (t >= plano.fimTudo) t = plano.inicio;
      rodando = !rodando;
      if (rodando && !seguir) verPlano();
    } else if (a === 'plano') { seguir = null; semFoco(); verPlano(); }
    else if (a === 'estadio') { seguir = null; semFoco(); verEstadio(); }
    else if (a === 'invasao') { const iv = arq && arq.invasao; if (iv) { seguir = null; t = iv.t0 + Math.max(0, iv.tPush - iv.t0 - 14); iv.vista = true; devagar({ tFim: iv.tFim }); rodando = true; atualizar(0); verInvasao(); } }
    else if (a === 'seguir') { semFoco(); seguir = plano.vivos.find(b => b.t.id === el.value) || null; if (seguir) { const d = seguir.gente[0].d; ctx.voarPara(d.x, d.y, 45 * M, 0.95, undefined, d.alt || 0); } }
    else if (a === 'rotas') { verRotas = el.checked; mostrarRotas(); }
    else if (a === 'briga') { const br = plano.brigas[+el.dataset.i]; if (br) { seguir = null; semFoco(); t = br.tIni - 12; br.vista = true; devagar(br); rodando = true; atualizar(0); ctx.voarPara(br.P[0], br.P[1], 40 * M, 0.85, undefined, 0); } }
    else refazer(a, el);
    atualizarPainel(true);
    ctx.pedir();
  }
  function refazer(a, el) {
    const p = plano && !plano.erro ? plano : null;
    if (a === 'inverter') { if (p && p.foraDaqui) { escolha.casa = p.fora.id; escolha.fora = p.casa.id; } else escolha.inverter = !escolha.inverter; }
    if (a === 'par') { escolha.par = +el.value; escolha.inverter = false; escolha.casa = escolha.fora = null; }
    if (a === 'casa') { escolha.casa = el.value; escolha.fora = null; }
    if (a === 'fora') { escolha.casa = p ? p.casa.id : escolha.casa; escolha.fora = el.value; }
    if (a === 'gente') escolha.gente = +el.value;
    if (a === 'ia') escolha.ia = el.value;
    if (a === 'anfitriao') escolha.anfitriao = el.value;
    if (a === 'invade') escolha.estadio = el.value;
    if (a === 'cordao') escolha.cordao = el.value;
    if (a === 'sortear') escolha.sorteio = (escolha.sorteio || 0) + 1;
    if (a === 'padrao') escolha = { par: 0, inverter: false, gente: escolha.gente || 1 };
    rodando = false; seguir = null;
    if (lenta) { vezes = lenta.vezes; lenta = null; }
    montar(); mostrarRotas(); verPlano();
    ctx.pedir();
  }
  function mostrarRotas() {
    if (!plano || plano.erro) return;
    for (const f of plano.fitas) f.visible = verRotas;
    if (plano.chaoZonas) plano.chaoZonas.visible = verRotas;
  }
  /* a câmera: o plano todo (as sedes e o estádio), de cima */
  function verPlano() {
    const p = plano; if (!p || p.erro) return;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const b of p.vivos) for (const q of b.rua.pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[2]); z1 = Math.max(z1, q[2]); }
    const r = Math.max(x1 - x0, z1 - z0) / 2 + 30 * M;
    ctx.voarPara((x0 + x1) / 2, (z0 + z1) / 2, r / Math.tan(21 * Math.PI / 180) * 0.95, 1.2, 0);
  }
  function verEstadio() {
    const c = plano.centroEst;
    ctx.voarPara(c[0], c[2], 150 * M, 0.75, -0.6);
  }
  /* A INVASÃO NO ESTÁDIO: a câmera na grade do isolamento (de cima, no
     corredor: o que fica em cima dele se abre no corte do cenário) */
  function verInvasao() {
    const f = arq && arq.foco(), iv = arq && arq.invasao;
    if (!f) return;
    iv.foco = true;
    ctx.voarPara(f.x, f.z, (f.corredor ? 26 : 34) * M, f.corredor ? 1.05 : 0.62, undefined, f.y);
  }
  const semFoco = () => { const iv = arq && arq.invasao; if (iv) iv.foco = false; };

  /* ======================================================
     O QUE O CENÁRIO CHAMA
     ====================================================== */
  function abrir() {
    painel.hidden = false;
    if (!plano) { if (!montar()) return; mostrarRotas(); verPlano(); }
    ctx.pedir();
  }
  function fechar() {
    /* (o dia do jogo de verdade só fecha por quem abriu: `sair`) */
    if (modoJogo) return;
    painel.hidden = true; rodando = false; seguir = null;
    if (lenta) { vezes = lenta.vezes; lenta = null; }
    desmontar();
    ctx.aoFechar && ctx.aoFechar();
    ctx.pedir();
  }
  /* a cada quadro (dt de verdade) */
  function quadro(dt) {
    if (!plano || plano.erro) return;
    if (rodando) {
      /* A BRIGA SE VÊ A 1×: rodando mais rápido, o relógio para no começo
         dela, cai pra 1× e a câmera vai até lá (se não está seguindo
         ninguém); no fim, volta pra velocidade de antes */
      const t1 = t + dt * vezes;
      for (const br of plano.brigas) if (!br.vista && t < br.tIni - 3 && t1 >= br.tIni - 3) {
        br.vista = true;
        devagar(br);
        t = br.tIni - 3 - dt * vezes;
        if (!seguir) ctx.voarPara(br.P[0], br.P[1], 40 * M, 0.85, undefined, 0);
        break;
      }
      const iv = arq && arq.invasao, tv = iv ? Math.max(iv.t0, iv.tPush - 12) : 0;
      if (iv && !iv.vista && t < tv && t1 >= tv) {
        iv.vista = true;
        devagar({ tFim: iv.tFim });
        t = tv - dt * vezes;
        if (!seguir) verInvasao();
      }
      t += dt * vezes;
      if (lenta && t >= lenta.ate) { vezes = lenta.vezes; lenta = null; marcarVezes(); }
      if (t >= plano.fimTudo + 30) { t = plano.fimTudo + 30; rodando = false; }
    }
    atualizar(dt);
    if (seguir) { const d = seguir.gente[0].d; ctx.seguirPonto(d.x, d.y, d.alt || 0); }
    atualizarPainel();
  }
  /* os rótulos, do tamanho de sempre na tela (mais longe, maior): depois
     que a câmera andou no quadro */
  const vRot = new THREE.Vector3(), caixas = [];
  function ajustarRotulos() {
    if (!grupo) return;
    const cam = ctx.cam, tg = Math.tan(cam.fov * Math.PI / 360);
    cam.updateMatrixWorld();
    const sprites = grupo.children.filter(o => o.isSprite).sort((a, b) => (a.userData.prio || 0) - (b.userData.prio || 0));
    caixas.length = 0;
    for (const o of sprites) {
      if (o.userData.escondido || (soTorcidas && (o.userData.prio || 0) !== 0)) { o.visible = false; continue; }
      const dd = cam.position.distanceTo(o.position), k = clamp(dd / (110 * M), 0.5, 8);
      const w = o.scale.x / o.scale.y;
      o.scale.set(o.userData.alto * M * k * w, o.userData.alto * M * k, 1);
      /* quem cobre na tela um rótulo mais importante (a torcida, a revista, o cordão maior) some */
      vRot.copy(o.position).applyMatrix4(cam.matrixWorldInverse);
      const z = -vRot.z;
      if (z <= 0) { o.visible = true; continue; }
      vRot.copy(o.position).project(cam);
      const hh = o.scale.y / (2 * z * tg) * 1.1, hw = o.scale.x / (2 * z * tg * cam.aspect) * 1.05;
      const cx = vRot.x, cy = vRot.y;
      o.visible = !caixas.some(c => Math.abs(c[0] - cx) < c[2] + hw && Math.abs(c[1] - cy) < c[3] + hh);
      if (o.visible) caixas.push([cx, cy, hw, hh]);
    }
  }
  /* ======================================================
     O DIA DO JOGO DE VERDADE (dia3d.js): monta com a escolha do jogo e
     entrega o relógio a quem chama
     ====================================================== */
  function jogo(esc) {
    painel.hidden = true; painel.innerHTML = '';
    rodando = false; seguir = null; lenta = null; verRotas = false;
    modoJogo = true;
    escolha = { ...esc };
    if (!montar()) { const erro = plano && plano.erro ? plano : { erro: 'o plano do dia não montou' }; plano = null; return erro; }
    mostrarRotas();
    return plano;
  }
  function sair() {
    if (!modoJogo) return;
    modoJogo = false; rodando = false; seguir = null; lenta = null; verRotas = true; soTorcidas = false;
    desmontar();
    ctx.aoFechar && ctx.aoFechar();
    ctx.pedir();
  }
  return {
    abrir, fechar, quadro, ajustarRotulos, J,
    jogo, sair,
    get modoJogo() { return modoJogo; },
    set soTorcidas(v) { soTorcidas = !!v; },
    /* o relógio: a hora (s do dia), rodar a `v`× e parar */
    get t() { return t; },
    /* (a partida manda no relógio: o minuto dela vira a hora do dia) */
    set t(h) { t = h; },
    get vezes() { return vezes; },
    rodar(v) { if (!plano) return; if (v) vezes = v; lenta = null; rodando = true; ctx.pedir(); },
    parar() { rodando = false; if (lenta) { vezes = lenta.vezes; lenta = null; } },
    /* a câmera: atrás de um bonde (null solta), o estádio, o plano todo */
    seguirBonde(b) { seguir = b || null; semFoco(); if (seguir) { const d = seguir.gente[0].d; ctx.voarPara(d.x, d.y, 45 * M, 0.95, undefined, d.alt || 0); } },
    get seguindo() { return seguir; },
    verEstadio: () => { if (plano) { seguir = null; verEstadio(); } },
    verPlano: () => { if (plano) { seguir = null; verPlano(); } },
    /* com a briga do jogo por cima (o palco dela), os rótulos do dia saem
       (os panos, os bandeirões e as grades da PM ficam); `tudo`, o dia inteiro */
    esconder(v, tudo = false) {
      if (!grupo) return;
      if (tudo) { grupo.visible = !v; return; }
      grupo.visible = true;
      for (const o of grupo.children) if (o.isSprite && v) o.visible = false;
    },
    /* os bonecos do dia que não são de `ids` (as torcidas da briga, que o combate desenha) */
    semAsDaBriga(ids) { const fora = new Set(ids); return discos => discos.filter(d => !fora.has(d.spawn)); },
    /* as torcidas da briga sem os objetos do dia (o bandeirão, o instrumento, o pano no ombro): null devolve */
    ocultarTorcidas(ids, o) { if (arq && arq.ocultar) arq.ocultar(ids || [], o); },
    /* em que pé está cada um (a sede, andando, na briga, entrando, no lugar) */
    estadoDo: (b, m = 0) => plano ? estadoDe(b, m) : null,
    /* o corte do cenário: o corredor da invasão, embaixo da arquibancada */
    alvoDoCorte: () => (arq && !painel.hidden ? arq.alvoDoCorte(t) : null),
    get arquibancada() { return arq; },
    get aberto() { return modoJogo || !painel.hidden; },
    get rodando() { return rodando; },
    get plano() { return plano; },
    /* pro teste: pula pra hora h (segundos do dia) e diz onde está cada um */
    irPara(h) { t = h; atualizar(0); atualizarPainel(true); ctx.pedir(); },
    estado() {
      if (!plano || plano.erro) return plano;
      return { hora: hora(t), t, inicio: plano.inicio, fim: plano.fimTudo, raio: plano.raio, tempos: plano.tempos, rotaVelha: plano.rotaVelha,
               menor: plano.menor && { d: plano.menor.d, t: plano.menor.t, a: plano.menor.a && plano.menor.a.t.sigla, b: plano.menor.b && plano.menor.b.t.sigla },
               jogo: plano.casa.nome + ' × ' + plano.fora.nome, deFora: !plano.foraDaqui, ia: plano.modoIA,
               pm: { cordoes: plano.pm.cordoes.length, revistas: plano.pm.revistas.map(rv => rv.portao.nome + ':' + rv.n).join(','), fechadas: plano.pm.fechadas.length, pms: policiais.length, grades: plano.nGrades, efetivo: plano.efetivo },
               brigas: plano.brigas.map(br => ({ a: br.a.t.sigla, v: br.v.t.sigla, ini: hora(br.tIni), P: [Math.round(br.P[0]), Math.round(br.P[1])], vence: br.venceA ? br.a.t.sigla : br.v.t.sigla, nA: br.nA, nV: br.nV, ferA: br.ferA, ferV: br.ferV, presA: br.presA, presV: br.presV, caemA: br.caemA, caemV: br.caemV, rendemA: br.rendemA, rendemV: br.rendemV, fA: Math.round(br.fA), fV: Math.round(br.fV), favorita: br.favoritoA ? br.a.t.sigla : br.v.t.sigla })),
               longeDe: plano.longeDe, tentativas: plano.tentativas, abre: plano.tAbre != null ? hora(plano.tAbre) : null,
               travessias: plano.travessias.map(v => ({ antes: v.antes.map(b => b.t.sigla).join('+'), depois: v.depois.map(b => b.t.sigla).join('+'), d: Math.round(v.d), libera: hora(v.libera), chega: hora(v.chega), folga: Math.round(v.folga / 60) })),
               bondes: plano.vivos.map(b => ({ sigla: b.t.sigla, lado: b.lado, escalao: b.escalao, setor: b.setor, portao: b.portao.nome, n: b.n, m: Math.round(b.comprimento), sai: hora(b.sai), chega: hora(b.chega), fim: hora(b.fim), adiantou: b.adiantou || 0, esperou: b.esperou || 0,
                                             naRua: b.naRua, inicio: b.inicio.tipo + (b.inicio.entrada ? ':' + b.inicio.entrada.id : b.inicio.t ? ':' + b.inicio.t.sigla : ''), anfitriao: b.anfitriao ? b.anfitriao.t.sigla + ':' + b.anfitriao.decisao : null, escolta: b.escolta ? b.escolta.n : 0,
                                             decisao: b.decisao ? { alvo: b.decisao.alvo && b.decisao.alvo.t.sigla, chance: b.decisao.chance, tirou: b.decisao.tirou, ataca: b.decisao.ataca, porque: b.decisao.porque, naoAchou: b.naoAchou || null } : null, feridos: b.feridos || 0, presos: b.presos || 0,
                                             revista: (() => { let a = Infinity, z = -Infinity; for (const g of b.pessoas) if (g.rev0 < Infinity) { a = Math.min(a, g.rev0); z = Math.max(z, g.rev1); } return a < Infinity ? Math.round(z - a) : 0; })(),
                                             raias: b.raias.length, semRaia: b.pessoas.filter(g => g.raia < 0).length, catraca: (() => { const f = [...b.passa].filter(x => x < Infinity); return f.length ? Math.round(Math.max(...f) - Math.min(...f) + CATRACA) : 0; })(), cauda: +b.cauda.toFixed(1),
                                             estado: estadoDe(b, 0) + ' / ' + estadoDe(b, (() => { let m = b.n - 1; while (m > 0 && b.ferido && b.ferido[m]) m--; return m; })()), dentro: b.dentroN, noLugar: b.noLugar, caidos: b.ferido ? b.ferido.reduce((s, x) => s + (x === 1 ? 1 : 0), 0) : 0, presosN: b.ferido ? b.ferido.reduce((s, x) => s + (x === 2 ? 1 : 0), 0) : 0 })),
               erros: plano.bondes.filter(b => !b.rua).map(b => b.t.sigla + ': ' + (b.erro || '')),
               arquibancada: arq ? arq.estado(t) : null };
    },
    limpar() { rodando = false; seguir = null; modoJogo = false; desmontar(); painel.hidden = true; }
  };
}
