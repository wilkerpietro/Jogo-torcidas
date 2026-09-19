/* =========================================================
   PATRIMÔNIO — o que a torcida tem e o que ela pode comprar
   ---------------------------------------------------------
   Duas coisas diferentes moram aqui, e é de propósito que
   estejam juntas: as duas saem do mesmo caixa.

   ESTRUTURA é imóvel: sede, bar, loja, subsede, fábrica.
   Rende e custa todo mês, e o financeiro já sabia somar isso
   — o que faltava era onde comprar.

   MATERIAL é o que a torcida leva pro estádio: bateria,
   faixa, bandeirão, bandeira, bomba. Não rende dinheiro;
   rende festa, e festa é satisfação do torcedor comum e
   prestígio na rua. Bomba é a exceção: ela vira estoque do
   dia de jogo.

   PREÇOS. Todos vêm do GDD V4 §8.1 e §8.3, com uma exceção
   anotada no lugar (subsede, que o GDD não precifica).
   Imóvel neste jogo é caro de propósito: um bar custa uns
   dois anos do que ele rende (a régua caiu de cinco anos na
   reforma do comércio, dono, 24/08/2026), então comprar é
   decisão de temporada e não de semana.
   ========================================================= */
window.TO = window.TO || {};

TO.patrimonio = (function(){
  const U = TO.util;
  const F = () => TO.financeiro;

  /* -------------------------------------------------------
     ESTRUTURA
     ------------------------------------------------------- */

  /* Ampliar a sede é a compra que destrava as outras: teto de
     membros, diretoria, treino e quantos pontos comerciais cabem —
     e não só quantos, também de que nível. GDD V4 §8.1. */
  const SEDE = [null,
    null,                                        // n1 é onde se começa
    {custo: 40000,  rot:'Sede nível 2'},
    {custo:100000,  rot:'Sede nível 3'},
    {custo:200000,  rot:'Sede nível 4'},
    {custo:400000,  rot:'Sede nível 5'},
    /* o COMPLEXO (dono, 02/09/2026): um milhão pra virar império */
    {custo:1000000, rot:'Sede nível 6'}
  ];

  /* Quanto de cada coisa cabe por nível de sede (GDD V4 §8.1). Duas
     dimensões, não uma: `qtd` é quantos pontos, `nivel` é até que
     nível eles podem chegar. Bar nível 3 só existe em sede nível 5. */
  const TETO = {
    bar:     [null, {qtd:1, nivel:1}, {qtd:1, nivel:1}, {qtd:1, nivel:2},
                    {qtd:2, nivel:2}, {qtd:2, nivel:3}, {qtd:2, nivel:3}],
    loja:    [null, {qtd:0, nivel:0}, {qtd:1, nivel:1}, {qtd:1, nivel:2},
                    {qtd:2, nivel:2}, {qtd:2, nivel:3}, {qtd:2, nivel:3}],
    /* subsede na cidade e fora somadas: a cena não distingue as duas
       ainda, então o teto é a soma das duas colunas do GDD */
    /* o nível 6 NÃO abre ponto comercial novo (ordem do dono,
       02/09/2026): o Complexo é membro, estrutura e anexo */
    subsede: [null, {qtd:0, nivel:1}, {qtd:1, nivel:1}, {qtd:2, nivel:1},
                    {qtd:5, nivel:1}, {qtd:8, nivel:1}, {qtd:8, nivel:1}]
  };

  /* GDD V4 §8.3. O preço de cada nível é o preço de ter o ponto
     naquele nível, então ampliar custa o cheio do nível novo. */
  /* =======================================================
     OS ANEXOS DA SEDE (pacote do dono, 02/09/2026)
     Obras únicas, cada uma com a sua porta por nível de sede:
     - ENFERMARIA (nv4): ferido volta em 3–9 dias, não 5–15.
     - GALPÃO (nv3): bomba 15% mais barata e o saque no nosso bar
       leva 30% menos (o material fica trancado).
     - COFRE BLINDADO (nv5): metade do prejuízo de saque não existe —
       o dinheiro grande não dorme no balcão.
     ======================================================= */
  const ANEXOS = {
    enfermaria: {rot:'Enfermaria da sede', custo:150000, mes:1200, sede:4,
      nota:'ferido volta em 3 a 9 dias em vez de 5 a 15'},
    galpao:     {rot:'Galpão de material', custo:150000, mes:600,  sede:3,
      nota:'bomba 15% mais barata e o saque no nosso bar leva 30% menos'},
    cofre:      {rot:'Cofre blindado',     custo:300000, mes:0,    sede:5,
      nota:'metade do prejuízo de qualquer saque fica guardada'},
  };

  /* a perda de saque passa por aqui: galpão corta 30%, cofre corta
     metade do que sobrar */
  function protegerPerda(E, v){
    const px = (E && E.patrimonio) || {};
    if(px.galpao) v *= 0.7;
    if(px.cofre)  v *= 0.5;
    return Math.round(v);
  }

  const PONTO = {
    bar: {
      rot:'Bar', plural:'bares',
      compra: 40000,
      /* ampliar baixou na reforma do comércio (dono, 24/08/2026):
         era 80/150 mil — a ampliação nunca se pagava */
      /* escala progressiva (ordem do dono, 02/09/2026): cada nível
         custa o dobro do anterior */
      ampliar:[null, 60000, 120000, null]
    },
    loja: {
      rot:'Loja', plural:'lojas',
      compra: 50000,
      /* idem: era 100/150 mil */
      ampliar:[null, 70000, 140000, null]
    },
    subsede: {
      rot:'Subsede', plural:'subsedes',
      /* ÚNICO PREÇO INFERIDO: o GDD V4 §8.3 descreve o que a subsede
         faz mas não diz quanto custa. Ela rende 600/mês contra 90 de
         manutenção e dobra o recrutamento da zona — na escala que os
         pontos tinham antes da reforma de 24/08/2026 (bar 40k pra
         680/mês), 30k era o equivalente, e o preço ficou. */
      /* 90 mil (reajuste do dono, 02/09/2026): o preço da filial —
         subsede é subsede, na cidade ou fora */
      compra: 90000,
      ampliar:[null, null]
    }
  };

  /* =======================================================
     A FILIAL — subsede em OUTRA CIDADE (aprovado pelo dono,
     25/08/2026). R$ 90 mil pra abrir, R$ 70 mil por nível, e
     cada nível comporta 20/40/80 membros do núcleo local.
     Só abre com prestígio 60 (na régua de 100) e a sede-mãe
     dita quantas: nível 3 permite 1, nível 4 permite 3 e a
     sede 5 permite 8. Abre onde o clube tem torcedor.
     ======================================================= */
  const FILIAL = {
    compra: 90000,
    ampliar: [null, 70000, 140000, null],  // progressiva (dono, 02/09)
    teto:    [0, 20, 40, 80],
    /* a coluna da sede 6 faltava (conserto de 03/09/2026): sem ela
       o Complexo lia `undefined` e voltava a permitir ZERO filiais,
       fechando a porta pra quem mais tinha condição de abrir. Fica
       em 8, o teto da nv5 — a ordem do dono foi que o nível 6 não
       abre ponto comercial novo. */
    porSede: [0, 0, 0, 1, 3, 8, 8],
    prestigioMin: 12            // 60 na régua de 0 a 100
  };
  const filiaisDe = E => F().patrimonio(E).filiais || [];
  const temFilialEm = (E, cidade) =>
    !!cidade && filiaisDe(E).some(f=>f.cidade === cidade);
  /* cidades onde o NOSSO clube tem torcedor, sem filial ainda e fora
     da nossa praça — as candidatas, da maior base pra menor */
  function cidadesCandidatas(E){
    const clube = E.torcida.clubeId, nossas = new Set(
      filiaisDe(E).map(f=>f.cidade).concat([E.torcida.mapa]));
    const fora = [];
    for(const c of (TO.dados.cidades||[])){
      if(nossas.has(c.id)) continue;
      const t = (c.times||[]).find(x=>x.clubeId === clube);
      const n = t ? TO.mundo.torcedoresDoClubeNa(c.id, clube) : 0;
      if(n > 0) fora.push({cidade:c.id, nome:c.nome, torcedores:n});
    }
    return fora.sort((a,b)=>b.torcedores - a.torcedores);
  }

  /* A fábrica não corta material: ela é fábrica de produto de loja.
     Triplica o faturamento das lojas e derruba o insumo em 60%
     (GDD V4 §8.3), e só existe em sede nível 5. */
  /* A FÁBRICA REPENSADA (ordem do dono, 02/09/2026): nada de
     triplicar faturamento — ela corta 50% do CUSTO da loja
     (manutenção e insumo). Produto próprio sai mais barato. */
  const FABRICA = {custo:400000, sede:5, corteCusto:0.5, rot:'Fábrica'};

  /* A ÁREA DE TREINO (ordem do dono, 02/09/2026): obra em três
     níveis, cada um esticando as vagas de treino da sede */
  const AREA_TREINO = {
    custo: [null, 100000, 200000, 500000],
    bonus: [0, 25, 50, 75]
  };

  const nivelSede = E => E.torcida.sedeNivel;
  /* qual sede é preciso ter pra caber o enésimo ônibus/professor */
  function proximaSedeQueCabe(n){
    const T = F().TETO_SEDE;
    for(let i = 1; i < T.length; i++) if(T[i] >= n) return `cabe na sede nível ${i}`;
    return 'não cabe em sede nenhuma';
  }
  const cont = (E, tipo) => (F().patrimonio(E)[PONTO[tipo].plural] || []).length;

  /* =======================================================
     A TABELA DA ESTRUTURA
     Um mês de cada ponto, com receita, despesa e o que sobra.
     Mensal e não semanal porque é assim que se compara com o
     preço de compra — o fechamento semanal continua sendo um
     quarto disto, como sempre foi.
     ======================================================= */
  function linhas(E){
    const p = F().patrimonio(E);
    /* a moral entra na conta da tabela igual entra no fechamento
       (régua do dono, 24/08/2026) — sem isso a tela mentiria */
    const fator = F().fatorComercial(E) * F().multMoral(E);
    const mult = b => TO.mundo.multiplicador(
      TO.mundo.bairro(E.torcida.mapa, b));
    /* os números do GDD moram no financeiro; puxar de lá é o que
       impede a tabela de mentir quando o balanço mudar */
    const REC = F().RECEITA, MAN = F().MANUT, INSUMO = F().INSUMO;
    const fora = [];

    fora.push({tipo:'sede', rot:`Sede (nível ${nivelSede(E)})`,
               bairro:(TO.mundo.bairroDaSede(E.torcida)||{}).nome || '',
               receita:0, despesa:F().MANUT_SEDE[nivelSede(E)]});
    for(const chave of Object.keys(ANEXOS))
      if(p[chave]) fora.push({tipo:'anexo', rot:ANEXOS[chave].rot,
        bairro:'', nota:ANEXOS[chave].nota,
        receita:0, despesa:ANEXOS[chave].mes});
    const nArea = (E.patrimonio && E.patrimonio.areaTreino) || 0;
    if(nArea) fora.push({tipo:'anexo',
      rot:`Área de treino (nível ${nArea})`, bairro:'',
      nota:`+${[0,25,50,75][nArea]}% de membros treinando por dia`,
      receita:0, despesa:0});

    const hojeAbs = (E.data && E.data.absoluto) || 0;
    for(const b of p.bares){
      /* bar quebrado no ataque rende metade por 45 dias (dono, 10/09/2026) */
      const dd = F().diasDeDano ? F().diasDeDano(b, hojeAbs) : 0;
      fora.push({tipo:'bar',
        rot:`Bar (nível ${b.nivel})${b.gratis?' · da sede':''}`, bairro:b.bairro,
        nota: dd ? `quebrado no ataque: metade da receita por mais ${dd} dia${dd>1?'s':''}` : undefined,
        receita: REC.bar[b.nivel]*mult(b.bairro)*fator*(F().multDano ? F().multDano(b, hojeAbs) : 1),
        despesa: MAN.bar[b.nivel]});
    }
    const fab = p.fabrica ? FABRICA : null;
    for(const l of p.lojas) fora.push({tipo:'loja',
      rot:`Loja (nível ${l.nivel})${l.semInsumo?' · sem insumo':fab?' · fábrica':''}`,
      bairro:l.bairro,
      receita: l.semInsumo ? 0 : REC.loja[l.nivel]*mult(l.bairro)*fator,
      despesa: (MAN.loja[l.nivel] + REC.loja[l.nivel]*INSUMO)
               * (fab ? 1-fab.corteCusto : 1)});
    for(const f of (p.filiais||[])) fora.push({tipo:'filial',
      rot:`Subsede de ${F().nomeCidade(f.cidade)} (nível ${f.nivel})`,
      bairro:F().nomeCidade(f.cidade),
      nucleo: (E.membros||[]).filter(m=>m.filial === f.cidade).length,
      teto: FILIAL.teto[f.nivel],
      receita: REC.subsede * F().multFilial(E, f) * fator,
      despesa: MAN.subsede[f.nivel] || MAN.subsede[1]});
    for(const s of p.subsedes) fora.push({tipo:'subsede', rot:'Subsede', bairro:s.bairro,
      receita: REC.subsede*mult(s.bairro)*fator,
      despesa: MAN.subsede[s.nivel || 1]});

    const frota = F().onibusDe(E);
    if(frota) fora.push({tipo:'onibus',
      rot: frota === 1 ? 'Ônibus da torcida' : `Ônibus da torcida (${frota})`,
      bairro:'',
      nota:`combustível e manutenção · a caravana sai `+
           `${Math.round(F().descontoCaravana(E)*100)}% mais barata`,
      receita:0, despesa:F().ONIBUS_MES * frota});

    const profs = F().professoresDe(E);
    if(profs) fora.push({tipo:'mma',
      rot: profs === 1 ? 'Professor de MMA' : `Professores de MMA (${profs})`,
      bairro:'',
      nota:`força e defesa evoluem +${Math.round((F().ganhoDoTreino(E)-1)*100)}% no treino`,
      receita:0, despesa:F().MMA_MES * profs});

    /* o escritório aparece na Estrutura como a comissão técnica
       (correção do dono, 31/08/2026: contratou, tem que registrar) */
    const advs = F().advogadosDe(E);
    if(advs) fora.push({tipo:'advogado',
      rot: advs === 1 ? 'Advogado' : `Advogados (${advs})`,
      bairro:'',
      nota:(advs === 1 ? `corta ${F().ADVOGADO_DIAS}`
                       : `cortam ${advs * F().ADVOGADO_DIAS}`)+
           ' dias de cadeia de todo membro preso',
      receita:0, despesa:F().ADVOGADO_MES * advs});

    /* A LINHA DE MATERIAL POR MEMBRO SAIU do financeiro, e sai daqui
       junto: a tabela de patrimônio mostrava a mesma despesa que as
       contas cobravam, e deixar a sombra dela aqui faria a tela cobrar
       um custo que o caixa não paga mais. */

    for(const f of fora){
      f.receita = Math.round(f.receita);
      f.despesa = Math.round(f.despesa);
      f.saldo   = f.receita - f.despesa;
    }
    return fora;
  }

  /* =======================================================
     O QUE DÁ PRA COMPRAR
     Cada opção diz o preço e, quando não dá, diz por quê —
     botão cinza sem explicação é o que faz o jogador achar
     que o jogo travou.
     ======================================================= */
  function opcoes(E){
    const p = F().patrimonio(E);
    const n = nivelSede(E);
    const lista = [];
    const trava = (custo, extra)=> extra ? extra
      : E.dinheiro < custo ? 'falta caixa' : null;

    /* a faixa (dono, 09/09/2026): R$ 5.000, quantas quiser */
    lista.push({id:'faixa', rot:'Faixa nova',
      nota:`${faixasDe(E).nossas.length} na sede · é a que a torcida expõe quando é atacada`,
      custo:FAIXA.custo, trava:trava(FAIXA.custo)});
    /* a bandeira (dono, 09/09/2026): R$ 2.000 */
    lista.push({id:'bandeira', rot:'Bandeira nova',
      nota:`${bandeirasDe(E).nossas.length} na sede · quadrada, com o escudo; sai no lugar da faixa no bar e na concentração, e junto dela no estádio`,
      custo:BANDEIRA.custo, trava:trava(BANDEIRA.custo)});

    if(SEDE[n+1]) lista.push({
      id:'sede', rot:`Ampliar a sede para o nível ${n+1}`,
      nota:'mais membros, mais diretoria, mais pontos comerciais',
      custo:SEDE[n+1].custo, trava:trava(SEDE[n+1].custo)});

    for(const tipo of ['bar','loja','subsede']){
      const cfg = PONTO[tipo], tem = cont(E,tipo), teto = TETO[tipo][n];
      lista.push({id:'comprar:'+tipo, rot:`Abrir ${cfg.rot.toLowerCase()}`,
        nota:`${tem} de ${teto.qtd} pela sede nível ${n}`,
        custo:cfg.compra,
        trava:trava(cfg.compra, tem>=teto.qtd ? 'a sede não comporta mais' : null)});

      /* ampliar o ponto mais fraco de cada tipo: é o que o jogador
         faria de qualquer jeito, e evita uma lista de dez botões */
      const pontos = p[cfg.plural] || [];
      const alvo = pontos.filter(x=>cfg.ampliar[x.nivel])
                         .sort((a,b)=>a.nivel-b.nivel)[0];
      if(alvo) lista.push({
        id:'ampliar:'+tipo, rot:`Ampliar ${cfg.rot.toLowerCase()} para nível ${alvo.nivel+1}`,
        nota:alvo.bairro ? `em ${alvo.bairro}` : '',
        custo:cfg.ampliar[alvo.nivel],
        trava:trava(cfg.ampliar[alvo.nivel],
          alvo.nivel+1 > teto.nivel ? `sede nível ${n} não comporta ${cfg.rot.toLowerCase()} nível ${alvo.nivel+1}` : null)});
    }

    /* A FROTA (régua do dono, 20/08/2026): até TRÊS ônibus, cada um
       por R$ 100 mil e R$ 1.500/mês de combustível e manutenção, com
       1% ao mês por ônibus de uma manutenção séria de R$ 15 mil. Um
       tira 30% do custo da caravana, dois tiram 60%, três deixam a
       estrada de graça. Avião continua pago: ônibus não voa. */
    const temOnibus = F().onibusDe(E);
    if(temOnibus < F().onibusMax(E)){
      const proximo = temOnibus + 1;
      const desc = Math.round(F().DESCONTO_ONIBUS[proximo]*100);
      lista.push({
        id:'onibus',
        rot: temOnibus ? `Comprar mais um ônibus (${proximo}º)`
                       : 'Comprar o ônibus da torcida',
        nota:`com ${proximo} ${proximo===1?'ônibus':'ônibus'} a caravana `+
             `de estrada sai ${desc}% mais barata`+
             (proximo === F().ONIBUS_MAX
               ? ' — frota cheia, estrada de graça e o rateio vira receita' : '')+
             ` · R$ 1.500/mês por ônibus · rota de avião continua paga`,
        custo:F().ONIBUS_CUSTO, trava:trava(F().ONIBUS_CUSTO)});
    } else if(F().onibusMax(E) < F().ONIBUS_MAX){
      /* dinheiro não é o que falta: falta garagem */
      lista.push({id:'onibus', rot:'Comprar mais um ônibus',
        nota:`a sede nível ${nivelSede(E)} guarda ${F().onibusMax(E)} `+
             `${F().onibusMax(E)===1?'ônibus':'ônibus'} · `+
             `${proximaSedeQueCabe(F().onibusMax(E)+1)}`,
        custo:F().ONIBUS_CUSTO, trava:'a garagem da sede está cheia'});
    }

    /* A COMISSÃO TÉCNICA (dono, 18/08/2026; escada em 20/08/2026):
       até três professores, R$ 2.000 por mês cada, cobrados no
       fechamento — e o treino rende +30%, +60% e +100%. */
    const temProf = F().professoresDe(E);
    if(temProf >= F().mmaMax(E) && F().mmaMax(E) < F().MMA_MAX){
      lista.push({id:'mma', rot:'Contratar mais um professor de MMA',
        nota:`a sede nível ${nivelSede(E)} comporta `+
             `${F().mmaMax(E)} ${F().mmaMax(E)===1?'professor':'professores'} · `+
             `${proximaSedeQueCabe(F().mmaMax(E)+1)}`,
        custo:F().MMA_MES, trava:'a sala de treino da sede está cheia'});
    } else if(temProf < F().mmaMax(E)){
      const proximo = Math.round((F().GANHO_MMA[temProf+1]-1)*100);
      const ORD = ['', '', '2º', '3º'];
      lista.push({
        id:'mma',
        rot: temProf ? `Contratar mais um professor de MMA (${ORD[temProf+1]})`
                     : 'Contratar professor de MMA',
        nota:`força e defesa evoluem +${proximo}% no treino`+
             (temProf ? ` (hoje +${Math.round((F().ganhoDoTreino(E)-1)*100)}%)` : '')+
             ` · R$ ${F().MMA_MES.toLocaleString('pt-BR')} fixos por mês por `+
             `professor, cobrados no fechamento`,
        custo:F().MMA_MES, trava:trava(F().MMA_MES)});
    }
    if(temProf) lista.push({
      id:'mma-fora',
      rot: temProf === 1 ? 'Dispensar o professor de MMA'
                         : 'Dispensar um professor de MMA',
      nota: temProf === 1
        ? 'o treino volta ao ritmo normal e a mensalidade de '+
          'R$ 2.000 para de cobrar no próximo fechamento'
        : `o treino cai pra +${Math.round((F().GANHO_MMA[temProf-1]-1)*100)}% e `+
          `a folha desce pra R$ ${(F().MMA_MES*(temProf-1)).toLocaleString('pt-BR')} por mês`,
      custo:0, trava:null});

    /* O ESCRITÓRIO DE ADVOCACIA (pedido do dono, 31/08/2026): cada
       advogado custa R$ 5.000 por mês e corta 10 dias da cadeia de
       todo membro preso. Escada própria da sede: nv2 um, nv3 dois,
       nv4 quatro, nv5 oito. */
    const temAdv = F().advogadosDe(E);
    const maxAdv = F().advogadosMax(E);
    if(temAdv >= maxAdv && n < 6){
      lista.push({id:'advogado',
        rot: maxAdv ? 'Contratar mais um advogado' : 'Contratar advogado',
        nota:`a sede nível ${n} comporta `+
             `${maxAdv} advogado${maxAdv===1?'':'s'} — a nível ${n+1} `+
             `comporta ${F().ADVOGADOS_SEDE[n+1]}`,
        custo:F().ADVOGADO_MES,
        trava: maxAdv ? 'o escritório da sede está cheio'
                      : 'a sede nível 1 não comporta advogado'});
    } else if(temAdv < maxAdv){
      lista.push({id:'advogado',
        rot: temAdv ? `Contratar mais um advogado (${temAdv+1}º)`
                    : 'Contratar advogado',
        nota:`cada advogado corta 10 dias de cadeia de todo membro preso `+
             `— na contratação e em toda prisão nova · R$ `+
             `${F().ADVOGADO_MES.toLocaleString('pt-BR')} fixos por mês por `+
             `advogado, cobrados no fechamento`,
        custo:F().ADVOGADO_MES, trava:trava(F().ADVOGADO_MES)});
    }
    if(temAdv) lista.push({
      id:'advogado-fora',
      rot: temAdv === 1 ? 'Demitir o advogado' : 'Demitir um advogado',
      nota: temAdv === 1
        ? 'os R$ 5.000 param de cobrar no próximo fechamento — quem está '+
          'preso cumpre a pena que já tem'
        : `a folha desce pra R$ ${(F().ADVOGADO_MES*(temAdv-1)).toLocaleString('pt-BR')} `+
          `por mês — as penas já cortadas ficam cortadas`,
      custo:0, trava:null});

    /* bomba também se compra pelo Financeiro (pedido do dono,
       18/08/2026): caixa com 5, direto pro estoque que as cenas usam */
    lista.push({
      id:'bombas', rot:'Comprar bombas (caixa com 5)',
      nota:`estoque atual: ${bombas(E)} · R$ ${PRECO_BOMBA} cada`,
      custo:5*PRECO_BOMBA, trava:trava(5*PRECO_BOMBA)});

    /* AS FILIAIS: um botão só com o dropdown do destino (pedido do
       dono, 26/08/2026), candidatas da maior base pra menor, e a
       ampliação da filial mais fraca. A população sai SEM o "mil":
       o número da planilha é o número de verdade. */
    {
      const fs = p.filiais || [];
      const limite = FILIAL.porSede[n] || 0;
      const travaF =
        n < 3 ? 'precisa de sede nível 3' :
        (E.indicadores.prestigio < FILIAL.prestigioMin)
          ? 'precisa de 60 de prestígio' :
        fs.length >= limite
          ? `a sede nível ${n} banca ${limite} ${limite===1?'filial':'filiais'}`
          : null;
      const cands = cidadesCandidatas(E);
      const clube = (TO.mundo.time(E.torcida.clubeId)||{}).nome || 'clube';
      if(cands.length) lista.push({
        id:'filial', rot:'Abrir subsede em outra cidade',
        nota:`núcleo local de até ${FILIAL.teto[1]} membros no nível 1 · `+
             `recruta, defende e ataca na cidade dela`,
        custo:FILIAL.compra, trava:trava(FILIAL.compra, travaF),
        escolhas: cands.map(c=>({id:c.cidade,
          rot:`${c.nome} — ${U.numero(c.torcedores)} torcedores do ${clube}`}))});
      /* QUAL SUBSEDE AMPLIAR É ESCOLHA (pedido do dono, 17/09/2026):
         era sempre a mais fraca; agora é um botão com o dropdown das
         que ainda sobem, da mais fraca pra mais forte, cada uma com o
         preço do nível seguinte na própria linha. O preço da vitrine
         acompanha a escolha. */
      const sobem = fs.filter(f=>FILIAL.ampliar[f.nivel])
                      .sort((a,b)=>a.nivel-b.nivel);
      if(sobem.length) lista.push({id:'ampliar-filial',
        rot:'Ampliar uma subsede de outra cidade',
        nota:`nível 2 cabe ${FILIAL.teto[2]} membros, nível 3 cabe ${FILIAL.teto[3]}`,
        custo:FILIAL.ampliar[sobem[0].nivel],
        trava:trava(FILIAL.ampliar[sobem[0].nivel]),
        escolhas: sobem.map(f=>({id:f.cidade, custo:FILIAL.ampliar[f.nivel],
          rot:`${F().nomeCidade(f.cidade)} — nível ${f.nivel} → ${f.nivel+1} · `+
              `R$ ${FILIAL.ampliar[f.nivel].toLocaleString('pt-BR')}`}))});
    }

    /* O PRESENTE PRO ALIADO (pedido do dono, 17/09/2026): dois
       dropdowns — qual aliado e qual melhoria (sede, loja, bar ou
       subsede em outra cidade). O preço e a trava dependem dos dois,
       então vão na tabela `precos[aliado][tipo]` e a vitrine lê na hora. */
    {
      const R = TO.relacoes, X = TO.eixos;
      const aliados = (X && X.aliadosNossos) ? X.aliadosNossos(E) : [];
      const precos = {};
      for(const a of aliados){
        precos[a.id] = {};
        for(const tipo of R.PRESENTES) precos[a.id][tipo] = R.presenteDe(E, a.id, tipo);
      }
      const primeiro = aliados[0] && precos[aliados[0].id].sede;
      lista.push({id:'presente', rot:'Dar uma melhoria de presente a um aliado',
        nota:'a gente paga, o patrimônio é dele · a relação com ele sobe +50',
        custo:(primeiro && primeiro.custo) || PONTO.loja.compra,
        trava: aliados.length ? null : 'nenhum aliado (relação de 20 ou mais)',
        escolhas: aliados.map(a=>({id:a.id,
          rot:`${a.nome} — relação ${Math.round(R.nivel(E, a.id))}`})),
        escolhas2: R.PRESENTES.map(t=>({id:t, rot:R.ROTULO_PRESENTE[t]})),
        precos});
    }

    if(!p.fabrica) lista.push({
      id:'fabrica', rot:FABRICA.rot,
      nota:`corta ${Math.round(FABRICA.corteCusto*100)}% do custo das lojas — manutenção e insumo`,
      custo:FABRICA.custo,
      trava:trava(FABRICA.custo,
        n < FABRICA.sede ? `precisa de sede nível ${FABRICA.sede}` : null)});

    /* a área de treino: um degrau por vez, até o nível 3 */
    const nAT = (E.patrimonio && E.patrimonio.areaTreino) || 0;
    if(AREA_TREINO.custo[nAT+1]) lista.push({
      id:'area-treino',
      rot: nAT ? `Ampliar a área de treino — nível ${nAT+1}`
               : 'Ampliar a área de treino',
      nota:`+${AREA_TREINO.bonus[nAT+1]}% de membros treinando por dia `+
           `(hoje: ${AREA_TREINO.bonus[nAT]
             ? '+'+AREA_TREINO.bonus[nAT]+'%' : 'a régua da sede'})`,
      custo:AREA_TREINO.custo[nAT+1],
      trava:trava(AREA_TREINO.custo[nAT+1])});

    /* os anexos da sede, um botão cada, enquanto não existirem */
    for(const chave of Object.keys(ANEXOS)){
      const a = ANEXOS[chave];
      if(p[chave]) continue;
      lista.push({id:'anexo:'+chave, rot:a.rot,
        nota:a.nota + (a.mes ? ` · R$ ${a.mes.toLocaleString('pt-BR')}/mês`
                             : ' · sem mensalidade'),
        custo:a.custo,
        trava:trava(a.custo,
          n < a.sede ? `precisa de sede nível ${a.sede}` : null)});
    }

    /* A NATUREZA de cada item (a Loja do dono, 09/09/2026): a tela
       agrupa por ela — material de cena, sede, pontos comerciais,
       subsedes de fora, pessoal e frota */
    for(const o of lista) o.natureza = naturezaDe(o.id);
    return lista;
  }
  function naturezaDe(id){
    if(/^(faixa|bandeira|bombas)$/.test(id)) return 'material';
    if(/^(sede|anexo:|area-treino|fabrica)/.test(id)) return 'sede';
    if(/^(comprar|ampliar):(bar|loja|subsede)$/.test(id)) return 'pontos';
    if(/^(filial|ampliar-filial)/.test(id)) return 'filiais';
    if(id === 'presente') return 'aliados';
    if(/^(mma|advogado)/.test(id)) return 'pessoal';
    if(id === 'onibus') return 'frota';
    return 'outros';
  }

  /* =======================================================
     AS FAIXAS (pedido do dono, 09/09/2026)
     Toda torcida nasce com uma faixa. Quem é ATACADO na praça, no
     estádio ou no bar expõe a dela na cena; dois membros correm pra
     recolher (3 s), um fica com ela na mão, e se esse cai a faixa é
     tomada: −10 de prestígio pra quem perdeu, +5 pra quem tomou (na
     régua de 0 a 100). Faixa nova custa R$ 5.000 aqui na loja. O
     Patrimônio mostra as nossas e as que tomamos — estas de cabeça
     pra baixo. A imagem de cada faixa é desenhada com as cores e o
     nome da torcida; `TO.dados.faixas[id]` (data-URI) substitui.
     ======================================================= */
  const FAIXA = {custo:5000, ganho:5, perda:10};
  /* A BANDEIRA (pedido do dono, 09/09/2026): quadrada, fundo na cor
     primária, bordas na secundária e na terciária, o escudo da torcida
     no meio. R$ 2.000. Um membro só recolhe. Tomada como a faixa, mas
     vale menos: −5 pra quem perde, +2 pra quem toma. */
  const BANDEIRA = {custo:2000, ganho:2, perda:5};
  function faixasDe(E){
    const p = F().patrimonio(E);
    if(!p.faixas) p.faixas = {nossas:[{n:1, desde:(E.data||{}).ano||2026}], tomadas:[]};
    if(!p.faixas.bandeiras) p.faixas.bandeiras = {nossas:[{n:1, desde:(E.data||{}).ano||2026}], tomadas:[]};
    return p.faixas;
  }
  const bandeirasDe = E => faixasDe(E).bandeiras;
  /* A CARA DA FAIXA (régua do dono, 09/09/2026): fundo na cor
     PRIMÁRIA da torcida, texto na SECUNDÁRIA, o escudo da torcida à
     esquerda do nome e o escudo do clube à direita. Os escudos são
     imagens e chegam depois: a faixa nasce só com cor e nome e é
     redesenhada no MESMO canvas quando eles carregam — quem guardou o
     canvas (a cena) vê a versão nova sozinho; quem precisa de URL
     (o Patrimônio) recebe um aviso pra trocar o `src`. */
  const FAIXA_W = 400, FAIXA_H = 100, BAND_W = 200;
  const telasFaixa = new Map();        // chave → canvas (com .versao)
  const escudoSrc = (tipo, id) => {
    const m = (TO.dados && TO.dados.escudos || {})[tipo === 'c' ? 'clubes' : 'torcidas'];
    if(!m || !id || !m[id]) return null;
    const caminho = `img/escudos/${tipo === 'c' ? 'clube' : 'torcida'}-${id}.png`;
    return (typeof window !== 'undefined' && window.__EMBUTIDOS && window.__EMBUTIDOS[caminho]) || caminho;
  };
  /* O PANO NO VARAL (referência do dono, 09/09/2026): a faixa não é
     reta — está presa em TRÊS pontos (esquerda, meio, direita), como
     num varal com três pregadores que não aparecem, e o tecido cai
     entre eles. A tela final é mais alta que a arte (margem
     transparente em cima e embaixo) e a arte lisa entra nela em fatias:
     cada fatia desce conforme a distância ao pregador mais perto, a
     barra de baixo cai um pouco mais que o topo, e o declive pinta a
     dobra — sombra leve descendo do pregador, brilho subindo pro outro. */
  const FAIXA_HP = 124, PANO_MARGEM = (FAIXA_HP - FAIXA_H)/2;
  function ondularPano(lisa, c, semente){
    const x = c.getContext('2d');
    x.clearRect(0, 0, c.width, c.height);
    let sd = 0; for(const ch of String(semente || '')) sd = (sd*31 + ch.charCodeAt(0)) >>> 0;
    /* quanto cai entre os pregadores: 6 a 9 px no topo, e a barra de
       baixo cai mais 3 a 5 px — varia um pouco por faixa */
    const queda = 6 + (sd % 4), extra = 3 + ((sd >> 2) % 3);
    const N = 100, fw = FAIXA_W/N;
    /* 0 nos pregadores (t = 0, 0,5 e 1), 1 no meio de cada vão — em
       cosseno, que chega redondo no pregador: o seno partido em dois
       vãos fazia um bico no meio com costura de sombra */
    const cai = t => (1 - Math.cos(4*Math.PI*t))/2;
    for(let i=0;i<N;i++){
      const t = (i+0.5)/N, s = cai(t);
      const dy = queda*s, hh = FAIXA_H + extra*s;
      const y0 = PANO_MARGEM + dy;
      x.drawImage(lisa, i*fw, 0, fw, FAIXA_H, i*fw - 0.5, y0, fw + 1, hh);
      const decl = (cai(t + 0.01) - cai(t - 0.01))/0.02;
      const a = Math.max(-0.14, Math.min(0.14, decl*0.035));
      x.fillStyle = a > 0 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${-a*0.55})`;
      x.fillRect(i*fw - 0.5, y0, fw + 1, hh);
    }
  }
  /* AS VARIAÇÕES DE TEXTO (pedido do dono, 09/09/2026): pra não ser
     sempre o nome, a faixa k de cada torcida sai com um dos dizeres —
     o nome, "DESDE {fundação}" ou "SEMPRE COM O {mascote do clube}" —
     rodando por um hash do id, pra torcidas diferentes não repetirem
     o mesmo dizer na mesma faixa. */
  function dizerDaFaixa(o, k){
    const t = (TO.mundo && TO.mundo.time && o.clubeId) ? TO.mundo.time(o.clubeId) : null;
    const nome = String(o.nome || '').toUpperCase();
    const opcoes = [{grande:nome, pequeno:''}];
    if(o.fundacao) opcoes.push({grande:`DESDE ${o.fundacao}`, pequeno:nome});
    if(t && t.mascote){
      const m = String(t.mascote).toUpperCase();
      const fem = /A$/.test(m) && !/HOMEM$/.test(m);
      opcoes.push({grande:`SEMPRE COM ${fem ? 'A' : 'O'} ${m}`, pequeno:nome});
    }
    let h = 0; for(const ch of String(o.id || o.nome || '')) h = (h*31 + ch.charCodeAt(0)) >>> 0;
    return opcoes[(h + (k||0)) % opcoes.length];
  }
  function pintarFaixa(c, o, escudos, variante){
    /* a arte lisa vai numa tela auxiliar; o pano ondulado é o que sai */
    const lisa = c._lisa || (c._lisa = (()=>{ const l = document.createElement('canvas'); l.width = FAIXA_W; l.height = FAIXA_H; return l; })());
    pintarFaixaLisa(lisa, o, escudos, variante);
    ondularPano(lisa, c, `${o.id || o.nome}|${variante||0}`);
  }
  function pintarFaixaLisa(c, o, escudos, variante){
    const x = c.getContext('2d');
    const cores = (TO.mundo && TO.mundo.coresDaTorcida) ? TO.mundo.coresDaTorcida(o) : {};
    const c1 = cores.cor || '#555', c2 = cores.cor2 || (c1.toLowerCase() === '#ffffff' ? '#141414' : '#f4f4f4');
    x.clearRect(0, 0, FAIXA_W, FAIXA_H);
    x.fillStyle = c1; x.fillRect(0, 0, FAIXA_W, FAIXA_H);
    x.strokeStyle = c2; x.lineWidth = 4; x.strokeRect(2, 2, FAIXA_W-4, FAIXA_H-4);
    const E = 72, M = 12;
    const temT = !!(escudos && escudos.t), temC = !!(escudos && escudos.c);
    if(temT) x.drawImage(escudos.t, M, (FAIXA_H-E)/2, E, E);
    if(temC) x.drawImage(escudos.c, FAIXA_W-M-E, (FAIXA_H-E)/2, E, E);
    const esq = temT ? M+E+8 : 14, dir = temC ? FAIXA_W-M-E-8 : FAIXA_W-14;
    const larg = dir - esq;
    const dz = dizerDaFaixa(o, variante);
    const nome = dz.grande;
    const yG = dz.pequeno ? FAIXA_H/2 + 8 : FAIXA_H/2;
    let px = dz.pequeno ? 40 : 44;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    do { x.font = `700 ${px}px "Barlow Condensed", system-ui, sans-serif`; px -= 2; }
    while(x.measureText(nome).width > larg && px > 12);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillText(nome, (esq+dir)/2 + 1.5, yG + 1.5);
    x.fillStyle = c2; x.fillText(nome, (esq+dir)/2, yG);
    if(dz.pequeno){
      let ps = 16;
      do { x.font = `600 ${ps}px "Barlow Condensed", system-ui, sans-serif`; ps -= 1; }
      while(x.measureText(dz.pequeno).width > larg && ps > 9);
      x.fillStyle = c2; x.globalAlpha = 0.9; x.fillText(dz.pequeno, (esq+dir)/2, 22); x.globalAlpha = 1;
    }
  }
  /* a bandeira: quadrada, fundo primário, borda de fora secundária, de
     dentro terciária (sem terciária, a secundária escurecida) e o
     escudo da torcida no meio; sem escudo, a sigla */
  function pintarBandeira(c, o, escudos){
    const x = c.getContext('2d');
    const cores = (TO.mundo && TO.mundo.coresDaTorcida) ? TO.mundo.coresDaTorcida(o) : {};
    const c1 = cores.cor || '#555', c2 = cores.cor2 || (c1.toLowerCase() === '#ffffff' ? '#141414' : '#f4f4f4');
    const c3 = cores.cor3 || 'rgba(0,0,0,.35)';
    const W = BAND_W;
    x.clearRect(0, 0, W, W);
    x.fillStyle = c2; x.fillRect(0, 0, W, W);
    x.fillStyle = c3; x.fillRect(12, 12, W-24, W-24);
    x.fillStyle = c1; x.fillRect(20, 20, W-40, W-40);
    const esc = escudos && escudos.t;
    if(esc){
      const E = 112; x.drawImage(esc, (W-E)/2, (W-E)/2, E, E);
    } else {
      const sigla = (TO.mundo && TO.mundo.siglaTorcida) ? TO.mundo.siglaTorcida(o) : '';
      x.fillStyle = c2; x.font = `700 64px "Barlow Condensed", system-ui, sans-serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(sigla || (o.nome||'').slice(0,3)).toUpperCase(), W/2, W/2);
    }
  }
  function telaDaFaixa(o, tipo, variante){
    if(!o) return null;
    tipo = tipo || 'faixa';
    variante = variante || 0;
    const chave = `${tipo}|${o.id || o.nome}|${variante}`;
    if(telasFaixa.has(chave)) return telasFaixa.get(chave);
    if(typeof document === 'undefined') return null;
    const bandeira = tipo === 'bandeira';
    const c = document.createElement('canvas');
    c.width = bandeira ? BAND_W : FAIXA_W; c.height = bandeira ? BAND_W : FAIXA_HP;
    c.versao = 1; c.avisos = [];
    const pinta = (esc) => bandeira ? pintarBandeira(c, o, esc) : pintarFaixa(c, o, esc, variante);
    const dado = TO.dados && TO.dados[bandeira ? 'bandeiras' : 'faixas'];
    const pronta = dado && dado[o.id];
    if(pronta){
      /* arte do dono, quando chegar: entra inteira no lugar */
      const im = new Image();
      im.onload = ()=>{ const x = c.getContext('2d'); x.clearRect(0,0,c.width,c.height);
        x.drawImage(im, 0, 0, c.width, c.height); c.versao++; avisar(c); };
      im.src = pronta;
    }
    pinta(null);
    const escudos = {};
    for(const [t, id] of [['t', o.id], ['c', o.clubeId]]){
      if(bandeira && t === 'c') continue;
      const src = escudoSrc(t, id);
      if(!src || typeof Image === 'undefined') continue;
      const im = new Image();
      im.onload = ()=>{ escudos[t] = im; if(!pronta){ pinta(escudos); c.versao++; avisar(c); } };
      im.onerror = ()=>{};
      im.src = src;
    }
    telasFaixa.set(chave, c);
    return c;
  }
  function avisar(c){
    const fila = c.avisos || []; c.avisos = [];
    for(const f of fila){ try{ f(c.toDataURL('image/png')); }catch(_){} }
  }
  /* a faixa como URL (Patrimônio). `aoAtualizar(url)` é chamado quando
     os escudos chegarem depois. */
  function imagemDaFaixa(o, aoAtualizar, tipo, variante){
    const c = telaDaFaixa(o, tipo, variante);
    if(!c) return null;
    if(aoAtualizar) c.avisos.push(aoAtualizar);
    try{ return c.toDataURL('image/png'); }catch(_){ return null; }
  }
  const imagemDaBandeira = (o, aoAtualizar) => imagemDaFaixa(o, aoAtualizar, 'bandeira');
  /* a mesma faixa como canvas, pra cena desenhar com drawImage */
  function imagemDaFaixaObj(o, tipo, variante){ return telaDaFaixa(o, tipo, variante); }
  /* as faixas das IAs vivem na ficha viva do mundo */
  function faixasIA(E, id){
    const t = TO.relacoes && TO.relacoes.mundo(E)[id];
    if(!t) return null;
    if(t.faixas == null) t.faixas = 1;
    if(!t.faixasTomadas) t.faixasTomadas = [];
    if(t.bandeiras == null) t.bandeiras = 1;
    if(!t.bandeirasTomadas) t.bandeirasTomadas = [];
    return t;
  }

  function comprar(E, id){
    if(id === 'faixa'){
      if(E.dinheiro < FAIXA.custo) return {ok:false, msg:'Não dá: falta caixa.'};
      faixasDe(E).nossas.push({n: faixasDe(E).nossas.length + 1, desde:(E.data||{}).ano||2026});
      TO.estado.lancar(E, 'Faixa nova', -FAIXA.custo);
      return {ok:true, msg:'Faixa nova na sede.'};
    }
    if(id === 'bandeira'){
      if(E.dinheiro < BANDEIRA.custo) return {ok:false, msg:'Não dá: falta caixa.'};
      bandeirasDe(E).nossas.push({n: bandeirasDe(E).nossas.length + 1, desde:(E.data||{}).ano||2026});
      TO.estado.lancar(E, 'Bandeira nova', -BANDEIRA.custo);
      return {ok:true, msg:'Bandeira nova na sede.'};
    }
    const p = F().patrimonio(E);
    let o = opcoes(E).find(x=>x.id===id);
    /* a filial vem do dropdown: o id chega como 'filial:cidade', mas a
       opção na vitrine é uma só, com as escolhas dentro */
    if(!o && id.indexOf('filial:') === 0){
      const f = opcoes(E).find(x=>x.id === 'filial');
      if(f && (f.escolhas||[]).some(c=>c.id === id.slice(7))) o = f;
    }
    /* a ampliação da subsede e o presente também chegam com a escolha
       colada no id ('ampliar-filial:cidade', 'presente:aliado:tipo') */
    if(!o && id.indexOf('ampliar-filial:') === 0) o = opcoes(E).find(x=>x.id === 'ampliar-filial');
    if(!o && id.indexOf('presente:') === 0) o = opcoes(E).find(x=>x.id === 'presente');
    if(!o) return {ok:false, msg:'Opção que não existe.'};
    if(o.trava) return {ok:false, msg:`Não dá: ${o.trava}.`};

    const [acao, tipo, extra] = id.split(':');
    if(acao==='presente'){
      const R = TO.relacoes;
      if(!(o.escolhas||[]).some(a=>a.id === tipo) || !R.PRESENTES.includes(extra))
        return {ok:false, msg:'Escolha que não existe.'};
      const pr = R.presenteDe(E, tipo, extra);
      if(pr.trava) return {ok:false, msg:`Não dá: ${pr.trava}.`};
      if(E.dinheiro < pr.custo) return {ok:false, msg:'Não dá: falta caixa.'};
      const nome = (TO.mundo.torcida(tipo)||{}).nome || tipo;
      const r = R.presentear(E, tipo, extra);
      if(!r) return {ok:false, msg:'Não deu.'};
      TO.estado.lancar(E, `Presente pra ${nome}: ${r.rot}`, -r.custo);
      return {ok:true, msg:`${nome} ganhou ${r.rot}. Relação +${r.ganho}.`};
    }
    if(acao==='filial'){
      p.filiais = p.filiais || [];
      p.filiais.push({cidade:tipo, nivel:1});
      TO.estado.lancar(E, `Subsede em ${F().nomeCidade(tipo)}`, -o.custo);
      /* A FUNDAÇÃO DESCE COM GENTE DA SEDE (ordem do dono, 31/08/2026;
         ampliada em 09/09/2026): um diretor, dois linha de frente e
         CINCO componentes saem destacados pra abrir a subsede — ela já
         nasce com 8. São os aptos de ficha mais fraca de cada cargo,
         pra não desfalcar o bonde principal. */
      const aptosDe = cargo => E.membros
        .filter(m=>m.cargo === cargo && !m.ferido && !m.preso && !m.filial)
        .sort((a,b)=>(a.forca+a.defesa)-(b.forca+b.defesa));
      const destacados = aptosDe('diretoria').slice(0,1)
        .concat(aptosDe('frente').slice(0,2))
        .concat(aptosDe('componente').slice(0,5));
      for(const m of destacados){
        m.filial = tipo;
        m.historico.push(
          `Destacado pra fundar a subsede de ${F().nomeCidade(tipo)}`);
      }
      E.inauguracao = {tipo:'subsede', bairro:F().nomeCidade(tipo),
                       quando:(E.data||{}).absoluto || 0, contada:false};
      return {ok:true, msg:`Subsede aberta em ${F().nomeCidade(tipo)}`+
        (destacados.length
          ? ` — ${destacados.length} da sede destacados pra lá.` : '.')};
    }
    if(acao==='ampliar-filial'){
      const f = (p.filiais||[]).find(x=>x.cidade === tipo);
      if(!f || !FILIAL.ampliar[f.nivel]) return {ok:false, msg:'Essa subsede não sobe mais.'};
      const custo = FILIAL.ampliar[f.nivel];
      if(E.dinheiro < custo) return {ok:false, msg:'Não dá: falta caixa.'};
      f.nivel++;
      TO.estado.lancar(E, `Ampliação da subsede de ${F().nomeCidade(tipo)}`+
                          ` — nível ${f.nivel}`, -custo);
      return {ok:true, msg:`Subsede de ${F().nomeCidade(tipo)} no nível ${f.nivel}.`};
    }
    if(acao==='sede'){
      E.torcida.sedeNivel++;
      TO.estado.lancar(E, `Ampliação da sede — nível ${E.torcida.sedeNivel}`, -o.custo);
      /* a inauguração é EFEMÉRIDE (feed 9.4), e quem sabe que ela
         aconteceu é quem comprou. O feed lê este carimbo e conta. */
      E.inauguracao = {tipo:'sede', nivel:E.torcida.sedeNivel,
                       quando:(E.data||{}).absoluto || 0, contada:false};
    } else if(acao==='fabrica'){
      p.fabrica = true;
      TO.estado.lancar(E, 'Fábrica de material', -o.custo);
    } else if(acao==='anexo'){
      p[tipo] = true;
      TO.estado.lancar(E, ANEXOS[tipo].rot, -o.custo);
    } else if(acao==='area-treino'){
      E.patrimonio.areaTreino = ((E.patrimonio.areaTreino||0) + 1);
      TO.estado.lancar(E, `Área de treino — nível `+
                          `${E.patrimonio.areaTreino}`, -o.custo);
    } else if(acao==='onibus'){
      const tinha = F().onibusDe(E);
      E.onibus = {desde:(E.onibus && E.onibus.desde) || (E.data||{}).absoluto || 0,
                  n: Math.min(F().onibusMax(E), tinha + 1)};
      TO.estado.lancar(E, tinha ? `Ônibus da torcida (${tinha+1}º)`
                                : 'Ônibus da torcida', -o.custo);
    } else if(acao==='mma'){
      /* nada sai do caixa agora: a mensalidade cobra no fim do mês */
      const tinha = F().professoresDe(E);
      E.professorMMA = {
        desde:(E.professorMMA && E.professorMMA.desde) || (E.data||{}).absoluto || 0,
        n: Math.min(F().mmaMax(E), tinha + 1)};
    } else if(acao==='mma-fora'){
      /* dispensa na hora: sem multa, sem cobrança no próximo fecho */
      const fica = F().professoresDe(E) - 1;
      E.professorMMA = fica > 0
        ? {desde:(E.professorMMA && E.professorMMA.desde) || 0, n:fica} : null;
    } else if(acao==='advogado'){
      /* nada sai do caixa agora: a mensalidade cobra no fim do mês.
         O advogado já chega trabalhando — 10 dias a menos pra cada
         membro que está preso hoje. */
      const tinha = F().advogadosDe(E);
      E.advogados = {
        desde:(E.advogados && E.advogados.desde) || (E.data||{}).absoluto || 0,
        n: Math.min(F().advogadosMax(E), tinha + 1)};
      if(TO.membros.aliviarPena)
        TO.membros.aliviarPena(E, F().ADVOGADO_DIAS);
    } else if(acao==='advogado-fora'){
      /* demite na hora: sem multa, sem cobrança no próximo fecho —
         e pena já cortada não volta */
      const fica = F().advogadosDe(E) - 1;
      E.advogados = fica > 0
        ? {desde:(E.advogados && E.advogados.desde) || 0, n:fica} : null;
    } else if(acao==='bombas'){
      estoquePiro(E).bombas += 5;
      TO.estado.lancar(E, 'Bombas ×5', -o.custo);
    } else if(acao==='comprar'){
      const cfg = PONTO[tipo];
      const bairro = F().bairroDeFora(E, tipo+'-'+(cont(E,tipo)+1));
      p[cfg.plural].push({nivel:1, bairro});
      TO.estado.lancar(E, `${cfg.rot} em ${bairro}`, -o.custo);
      /* subsede nova tem batismo (feed 9.5); bar e loja não — quem se
         reúne na subsede é a torcida, e é isso que vira data */
      if(tipo === 'subsede')
        E.inauguracao = {tipo:'subsede', bairro,
                         quando:(E.data||{}).absoluto || 0, contada:false};
      /* INAUGURAÇÃO É RECADO (pedido do dono, 19/09/2026): abrir
         porta nova na cidade pode ser só abrir, ou pode ser desfile.
         Quem pergunta é o cartão do feed. */
      if(TO.feed && TO.feed.registrarObra)
        TO.feed.registrarObra(E, {tipo:'obra', torcida:E.torcida.id, item:tipo});
    } else if(acao==='ampliar'){
      const cfg = PONTO[tipo];
      const alvo = (p[cfg.plural]||[]).filter(x=>cfg.ampliar[x.nivel])
                                      .sort((a,b)=>a.nivel-b.nivel)[0];
      if(!alvo) return {ok:false, msg:'Não há o que ampliar.'};
      alvo.nivel++;
      TO.estado.lancar(E, `Ampliação — ${cfg.rot} ${alvo.bairro} (n${alvo.nivel})`, -o.custo);
    }
    return {ok:true, msg:o.rot};
  }

  /* =======================================================
     BOMBAS
     O catálogo de materiais saiu do jogo (decisão do autor).
     O que sobrou de consumível é a bomba: ela é comprada na
     hora do planejamento do ataque e vai pro estoque que a
     cena gasta.
     ======================================================= */
  /* R$ 400 a unidade (reajuste do dono, 31/08/2026 — era 120);
     com o GALPÃO a compra sai 15% mais barata (pacote de 02/09/2026) */
  const PRECO_BOMBA = 400;
  const precoBomba = E => (E && E.patrimonio && E.patrimonio.galpao)
    ? Math.round(PRECO_BOMBA * 0.85) : PRECO_BOMBA;

  function estoquePiro(E){
    if(!E.estoque) E.estoque = {bombas:0};
    if(E.estoque.bombas == null) E.estoque.bombas = 0;
    return E.estoque;
  }
  const bombas = E => estoquePiro(E).bombas;

  function comprarBombas(E, qtd){
    qtd = Math.max(0, Math.round(qtd||0));
    if(!qtd) return {ok:true, compradas:0};
    const custo = qtd * precoBomba(E);
    if(E.dinheiro < custo) return {ok:false, msg:'falta caixa'};
    estoquePiro(E).bombas += qtd;
    TO.estado.lancar(E, `Bombas ×${qtd}`, -custo);
    return {ok:true, compradas:qtd, custo};
  }

  return {FAIXA, BANDEIRA, faixasDe, bandeirasDe, imagemDaFaixa, imagemDaBandeira, imagemDaFaixaObj, dizerDaFaixa, faixasIA,
          SEDE, TETO, PONTO, FABRICA, FILIAL,
          filiaisDe, temFilialEm, cidadesCandidatas,
          linhas, opcoes, comprar,
          PRECO_BOMBA, precoBomba, bombas, comprarBombas,
          ANEXOS, AREA_TREINO, protegerPerda};
})();
