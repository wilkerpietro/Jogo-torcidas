/* =========================================================
   TORCEDOR COMUM E FATOR TORCIDA (GDD §9.5 e §21)
   ---------------------------------------------------------
   Duas coisas que faltavam e que fecham o laço do jogo:

   1. O que a torcida faz no estádio mexe no placar. O GDD §9.5
      é explícito: o MatchSimulator soma um bônus chamado Fator
      Torcida, feito de público, faixas, bateria e moral.
   2. O que o time faz em campo mexe no torcedor comum. O GDD
      §21 chama isso de Satisfação: sobe com vitória, desaba com
      derrota em clássico, e é ela que decide quanta gente topa
      entrar na organizada e quanta gente vai ao estádio.

   Juntos viram um ciclo: resultado → satisfação → público →
   fator torcida → resultado.
   ========================================================= */
window.TO = window.TO || {};

TO.torcedores = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  /* =======================================================
     SATISFAÇÃO (GDD §21) — 0 a 20, do torcedor comum
     ======================================================= */
  const FAIXAS = [
    {ate:4,  nome:'Insatisfeito',   organizar:0.02, estadio:0.20, cor:'#d9705f',
     nota:'não quer ir ao estádio nem entrar em organizada'},
    {ate:9,  nome:'Preocupado',     organizar:0.05, estadio:0.40, cor:'#c8a03c',
     nota:'vai ao estádio às vezes; entra na torcida com esforço'},
    {ate:14, nome:'Contente',       organizar:0.15, estadio:0.60, cor:'#8b867d',
     nota:'vai com frequência e é receptivo a entrar'},
    {ate:20, nome:'Muito Contente', organizar:0.30, estadio:0.80, cor:'#7fc2a0',
     nota:'quase todo jogo, e procura organizada pra entrar'}
  ];
  const ORGANIZAR_MAX = 0.30;
  const faixa = v => U.faixa(v, FAIXAS);
  const faixaDe = E => faixa(E.indicadores.satisfacao);

  /* --- o resultado do jogo (GDD §21, aplicado no dia do jogo) --- */
  function aplicarResultado(E, j){
    if(!j || !j.jogado) return null;
    const I = E.indicadores;
    const venceu = j.gp > j.gc, perdeu = j.gp < j.gc;
    /* clássico é jogo contra time da mesma praça, e pesa cinco vezes mais */
    const adv = M().time(j.adversario);
    const meu = M().time(E.torcida.clubeId);
    const clas = !!(adv && meu && adv.mapa === meu.mapa);

    let d = 0;
    if(clas) d = venceu ? U.entre(3, 5) : perdeu ? -U.entre(3, 5) : 0;
    else     d = venceu ? U.entre(0.5, 1) : perdeu ? -U.entre(0.5, 1) : 0;

    I.satisfacao = U.limitar(I.satisfacao + d, 0, 20);
    /* a moral da nossa gente acompanha, mais amortecida */
    I.moral = U.limitar(I.moral + d*0.35, 0, 20);
    return {delta:d, classico:clas, venceu, perdeu};
  }

  /* --- a posição na tabela (GDD §21, após cada rodada) ---
     O que move a satisfação não é a posição, é a diferença entre a
     posição esperada — pela força do elenco — e a real. Time pequeno em
     sétimo alegra; time grande em sétimo irrita. */
  function posicaoEsperada(E, comp, id){
    const q = x => TO.competicoes.forcaDe(E, x);
    const ordem = [...comp.clubes].sort((a,b)=>q(b)-q(a));
    return ordem.indexOf(id) + 1;
  }
  function posicaoAtual(E, comp, id){
    if(comp.grupos && comp.grupos.length > 1){
      for(let g=0; g<comp.grupos.length; g++){
        const i = TO.competicoes.tabela(comp, g).findIndex(l=>l.id===id);
        if(i >= 0) return i+1;
      }
      return 0;
    }
    const i = TO.competicoes.tabela(comp).findIndex(l=>l.id===id);
    return i < 0 ? 0 : i+1;
  }

  function aplicarClassificacao(E){
    if(!E.temporada) return null;
    const id = E.torcida.clubeId;
    /* a competição que importa é a nacional; sem ela, a regional */
    const comps = E.temporada.competicoes.filter(c=>!c.copa &&
      (c.clubes||[]).includes(id));
    const comp = comps.find(c=>c.tipo === 'nacional') || comps[0];
    if(!comp) return null;
    const atual = posicaoAtual(E, comp, id);
    if(!atual) return null;

    const esperada = posicaoEsperada(E, comp, id);
    const n = comp.clubes.length;
    /* a fórmula do GDD normaliza pelo tamanho da competição: subir cinco
       posições numa Série D de 20 vale menos que numa final de 6 */
    const nota = p => U.limitar((esperada - p) * (n/20) * 0.5, -6, 6);
    const antes = E.classifAnterior != null ? E.classifAnterior : atual;
    /* variação por rodada travada em ±1, como manda o GDD */
    const d = U.limitar(nota(atual) - nota(antes), -1, 1);
    E.classifAnterior = atual;
    if(!d) return null;
    E.indicadores.satisfacao = U.limitar(E.indicadores.satisfacao + d, 0, 20);
    return {delta:d, atual, esperada, comp:comp.nome};
  }

  /* A satisfação precisa respirar. Com o puxão de classificação de ±1 por
     rodada somado a clássico de ±5, ela cola no teto ou no chão e trava —
     medido: 20,0 fixo depois de duas temporadas. Toda semana ela volta um
     pouco para o meio, que é o humor de quem não teve motivo nenhum. */
  const NEUTRA = 11;
  /* O material que a torcida comprou não empurra a satisfação pra cima:
     ele muda o lugar pra onde ela volta. Torcida com bateria completa e
     bandeirão descansa mais feliz do que torcida com faixa remendada, e
     é só isso — vitória e derrota continuam mandando mais. Teto em 15
     porque material sozinho não faz temporada boa. */
  function neutraDe(E){
    const f = TO.patrimonio ? TO.patrimonio.efeito(E).satisfacao : 0;
    return U.limitar(NEUTRA + f*0.45, NEUTRA, 15);
  }
  function esfriar(E){
    const I = E.indicadores;
    const d = (neutraDe(E) - I.satisfacao) * 0.06;
    I.satisfacao = U.limitar(I.satisfacao + d, 0, 20);
    return d;
  }

  /* =======================================================
     A TORCIDA PROIBIDA DE ENTRAR NO ESTÁDIO

     A punição mora aqui e não no feed porque as três coisas que ela
     corta são desta casa: o público que entra no Fator Torcida, a
     caravana (que `financeiro` consulta) e a satisfação. O feed só
     conta que aconteceu — regra de jogo vai pro módulo dela.

     Ela dura QUATRO SEMANAS de calendário, contadas em semana
     absoluta, e não em dias: quem entra em campo é o clube, e o que a
     torcida perde são quatro fins de semana.
     ======================================================= */
  const PUNICAO_SEMANAS = 4;
  const semanaAbs = E => (E.data.ano - 2026)*52 + E.data.semana;
  const punida = E => !!(E && E.punicao && semanaAbs(E) < E.punicao.ate);
  function punir(E, motivo){
    E.punicao = {desde: semanaAbs(E), ate: semanaAbs(E) + PUNICAO_SEMANAS,
                 motivo: motivo || 'polícia', avisado:false, fechado:false};
    return E.punicao;
  }
  /* a punição acabou e o fim ainda não foi contado: é o gatilho da 8.4 */
  const punicaoAcabou = E => !!(E && E.punicao && !E.punicao.fechado &&
                                semanaAbs(E) >= E.punicao.ate);
  /* SEM ESTÁDIO, A SATISFAÇÃO CAI TODA SEMANA. Sem isto a punição seria
     só um número menor no Fator Torcida, que o jogador nem vê. */
  const CUSTO_PUNICAO = -0.8;
  function pesoDaPunicao(E){
    if(!punida(E)) return 0;
    const I = E.indicadores;
    const antes = I.satisfacao;
    I.satisfacao = U.limitar(I.satisfacao + CUSTO_PUNICAO, 0, 20);
    return Math.round((I.satisfacao - antes)*100)/100;
  }

  /* --- fim de temporada (GDD §21) --- */
  const CONQUISTA = {campeao:5, vice:2, rebaixado:-3};
  function aplicarConquista(E, tipo){
    const d = CONQUISTA[tipo] || 0;
    if(!d) return 0;
    E.indicadores.satisfacao = U.limitar(E.indicadores.satisfacao + d, 0, 20);
    return d;
  }

  /* =======================================================
     O TORCEDOR COMUM DA PRAÇA
     A base é gente de verdade da cidade; os números da fonte
     estão em milhares.
     ======================================================= */
  function base(E){
    return TO.mundo.baseDeRecrutamento(E.torcida.mapa, E.torcida.clubeId,
      o => TO.acoes.efetivoDe(E, o));
  }
  /* Quantos torcedores comuns vão ao estádio nesta rodada (GDD §21). A
     faixa dá a vontade; quem dá o teto é a catraca — um Castelão cheio
     são 63 mil, não os 438 mil que topariam ir. */
  function publicoDaCidade(E){
    const querem = Math.round(base(E) * 1000 * faixaDe(E).estadio);
    const est = M().estadioDoClube(E.torcida.clubeId);
    const teto = (est && est.capacidade) || 30000;
    return {querem, teto, publico: Math.min(querem, teto),
            lotado: querem >= teto,
            ocupacao: U.limitar(querem/teto, 0, 1)};
  }

  /* =======================================================
     FATOR TORCIDA (GDD §9.5)
       Fator = Público×0.40 + Faixas×0.25 + Bateria×0.20 + Moral×0.15
     Cada parcela é 0..1. O resultado entra como bônus no placar.
     ======================================================= */
  const PESOS = {publico:0.40, faixas:0.25, bateria:0.20, moral:0.15};

  /* GDD §20: quanto material a sede comporta */
  const MATERIAL = [null, {faixas:1, bateria:3},  {faixas:2, bateria:5},
                          {faixas:3, bateria:8},  {faixas:5, bateria:12},
                          {faixas:10, bateria:20}];
  const capacidade = E => MATERIAL[E.torcida.sedeNivel] || MATERIAL[1];

  /* o que a torcida tem hoje; nasce cheio e só encolhe quando é roubado
     na caminhada ou na emboscada (GDD §12) */
  function material(E){
    const cap = capacidade(E);
    if(!E.material) E.material = {faixas:cap.faixas, bateria:cap.bateria};
    E.material.faixas  = U.limitar(E.material.faixas,  0, cap.faixas);
    E.material.bateria = U.limitar(E.material.bateria, 0, cap.bateria);
    return E.material;
  }
  /* material perdido numa briga: volta com o tempo, mas custa a semana */
  function perderMaterial(E, faixas, bateria){
    const m = material(E);
    m.faixas  = Math.max(0, m.faixas  - (faixas||0));
    m.bateria = Math.max(0, m.bateria - (bateria||0));
    return m;
  }
  /* a rotina da semana repõe uma faixa e um instrumento */
  function reporMaterial(E){
    const cap = capacidade(E), m = material(E);
    if(m.faixas  < cap.faixas)  m.faixas++;
    if(m.bateria < cap.bateria) m.bateria++;
    return m;
  }

  function fatorTorcida(E){
    const cap = capacidade(E), m = material(E);
    const total = Math.max(1, E.membros.length);
    /* "percentual de membros presentes no estádio" — em jogo fora é o
       tamanho da caravana que manda, e é isso que liga a decisão da
       Gestão ao placar */
    const vao = TO.planejamento ? TO.planejamento.efetivoDaSaida(E)
                                : TO.membros.aptosParaOEstadio(E).length;
    const p = {
      /* TORCIDA PROIBIDA NÃO ENTRA, e o Fator Torcida sente isso na
         parcela que pesa mais (40%): sem público nosso, a arquibancada
         é dos outros. As faixas e a bateria continuam contando — elas
         estão na sede, não no estádio. */
      publico: punida(E) ? 0 : U.limitar(vao/total, 0, 1),
      faixas:  U.limitar(m.faixas /cap.faixas,  0, 1),
      bateria: U.limitar(m.bateria/cap.bateria, 0, 1),
      moral:   U.limitar(E.indicadores.moral/20, 0, 1)
    };
    /* O que a torcida comprou entra por cima do estoque de rua: um
       bandeirão de 50×30 aberto na arquibancada não é "faixa cheia",
       é outra categoria de festa (patrimonio.js). O teto continua em 1
       de propósito — o bônus do jogo é ±4 de força desde sempre, e
       comprar material não é jeito de furar esse limite: serve pra
       cobrir o que falta de gente, de faixa e de moral. */
    const comprado = TO.patrimonio ? TO.patrimonio.efeito(E).satisfacao : 0;
    const rua = p.publico*PESOS.publico + p.faixas*PESOS.faixas
              + p.bateria*PESOS.bateria + p.moral*PESOS.moral;
    const base  = U.limitar(rua, 0, 1);
    const valor = U.limitar(rua + U.limitar(comprado*0.06, 0, 0.25), 0, 1);
    /* `ganho` é o que o material comprado adicionou de verdade depois do
       teto: torcida que já lota e canta não ganha nada com mais um
       bandeirão, e a tela do Patrimônio precisa dizer isso */
    return Object.assign({}, p, {valor, ganho:valor-base, vao, total, cap,
                            tem:{faixas:m.faixas, bateria:m.bateria}});
  }

  /* =======================================================
     DO FATOR AO PLACAR
     O GDD diz "aplicado como bônus" sem dar o número. Aqui ele
     vale até 8 pontos de força — com a torcida cheia contra
     uma vazia, é meia bola de vantagem, o suficiente pra sentir
     e longe de decidir sozinho. A referência é 0.5: torcida
     mediana não dá nem tira nada.
     ======================================================= */
  const EM_FORCA = 8;
  const NEUTRO = 0.5;
  function bonusDoJogo(E, idCasa, idFora){
    const meu = E.torcida.clubeId;
    if(idCasa !== meu && idFora !== meu) return 0;
    const f = fatorTorcida(E).valor;
    /* GDD §4.1: cobrança no CT vale algumas semanas — elenco cobrado joga
       apertado, elenco humilhado joga com medo */
    const cob = TO.acoes && TO.acoes.cobrancaAtiva ? TO.acoes.cobrancaAtiva(E) : 0;
    const b = (f - NEUTRO) * EM_FORCA + cob;
    return idCasa === meu ? b : -b;      // o bônus é de quem a gente apoia
  }

  return {FAIXAS, ORGANIZAR_MAX, faixa, faixaDe, PESOS, MATERIAL, EM_FORCA,
          punida, punir, punicaoAcabou, pesoDaPunicao, PUNICAO_SEMANAS,
          aplicarResultado, aplicarClassificacao, aplicarConquista, CONQUISTA,
          esfriar, NEUTRA, neutraDe,
          posicaoEsperada, posicaoAtual,
          base, publicoDaCidade,
          capacidade, material, perderMaterial, reporMaterial,
          fatorTorcida, bonusDoJogo};
})();
