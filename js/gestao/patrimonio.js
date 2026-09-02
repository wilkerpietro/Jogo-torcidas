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
    {custo:400000,  rot:'Sede nível 5'}
  ];

  /* Quanto de cada coisa cabe por nível de sede (GDD V4 §8.1). Duas
     dimensões, não uma: `qtd` é quantos pontos, `nivel` é até que
     nível eles podem chegar. Bar nível 3 só existe em sede nível 5. */
  const TETO = {
    bar:     [null, {qtd:1, nivel:1}, {qtd:1, nivel:1}, {qtd:1, nivel:2},
                    {qtd:2, nivel:2}, {qtd:2, nivel:3}],
    loja:    [null, {qtd:0, nivel:0}, {qtd:1, nivel:1}, {qtd:1, nivel:2},
                    {qtd:2, nivel:2}, {qtd:2, nivel:3}],
    /* subsede na cidade e fora somadas: a cena não distingue as duas
       ainda, então o teto é a soma das duas colunas do GDD */
    subsede: [null, {qtd:0, nivel:1}, {qtd:1, nivel:1}, {qtd:2, nivel:1},
                    {qtd:5, nivel:1}, {qtd:8, nivel:1}]
  };

  /* GDD V4 §8.3. O preço de cada nível é o preço de ter o ponto
     naquele nível, então ampliar custa o cheio do nível novo. */
  const PONTO = {
    bar: {
      rot:'Bar', plural:'bares',
      compra: 40000,
      /* ampliar baixou na reforma do comércio (dono, 24/08/2026):
         era 80/150 mil — a ampliação nunca se pagava */
      ampliar:[null, 50000, 90000, null]
    },
    loja: {
      rot:'Loja', plural:'lojas',
      compra: 50000,
      /* idem: era 100/150 mil */
      ampliar:[null, 60000, 90000, null]
    },
    subsede: {
      rot:'Subsede', plural:'subsedes',
      /* ÚNICO PREÇO INFERIDO: o GDD V4 §8.3 descreve o que a subsede
         faz mas não diz quanto custa. Ela rende 600/mês contra 90 de
         manutenção e dobra o recrutamento da zona — na escala que os
         pontos tinham antes da reforma de 24/08/2026 (bar 40k pra
         680/mês), 30k era o equivalente, e o preço ficou. */
      compra: 30000,
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
    ampliar: [null, 70000, 70000, null],
    teto:    [0, 20, 40, 80],
    porSede: [0, 0, 0, 1, 3, 8],
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
  const FABRICA = {custo:400000, sede:5, multLoja:3, corteInsumo:0.6,
                   rot:'Fábrica'};

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

    for(const b of p.bares) fora.push({tipo:'bar',
      rot:`Bar (nível ${b.nivel})${b.gratis?' · da sede':''}`, bairro:b.bairro,
      receita: REC.bar[b.nivel]*mult(b.bairro)*fator, despesa: MAN.bar[b.nivel]});
    const fab = p.fabrica ? FABRICA : null;
    for(const l of p.lojas) fora.push({tipo:'loja',
      rot:`Loja (nível ${l.nivel})${l.semInsumo?' · sem insumo':fab?' · fábrica':''}`,
      bairro:l.bairro,
      receita: l.semInsumo ? 0
             : REC.loja[l.nivel]*mult(l.bairro)*fator*(fab?fab.multLoja:1),
      despesa: MAN.loja[l.nivel]
             + REC.loja[l.nivel]*INSUMO*(fab?1-fab.corteInsumo:1)});
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
    if(temAdv >= maxAdv && n < 5){
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
      const alvoF = fs.filter(f=>FILIAL.ampliar[f.nivel])
                      .sort((a,b)=>a.nivel-b.nivel)[0];
      if(alvoF) lista.push({id:'ampliar-filial:'+alvoF.cidade,
        rot:`Ampliar a subsede de ${F().nomeCidade(alvoF.cidade)} `+
            `para o nível ${alvoF.nivel+1}`,
        nota:`o núcleo local passa a caber ${FILIAL.teto[alvoF.nivel+1]} membros`,
        custo:FILIAL.ampliar[alvoF.nivel],
        trava:trava(FILIAL.ampliar[alvoF.nivel])});
    }

    if(!p.fabrica) lista.push({
      id:'fabrica', rot:FABRICA.rot,
      nota:`triplica o faturamento das lojas e corta ${Math.round(FABRICA.corteInsumo*100)}% do insumo`,
      custo:FABRICA.custo,
      trava:trava(FABRICA.custo,
        n < FABRICA.sede ? `precisa de sede nível ${FABRICA.sede}` : null)});

    return lista;
  }

  function comprar(E, id){
    const p = F().patrimonio(E);
    let o = opcoes(E).find(x=>x.id===id);
    /* a filial vem do dropdown: o id chega como 'filial:cidade', mas a
       opção na vitrine é uma só, com as escolhas dentro */
    if(!o && id.indexOf('filial:') === 0){
      const f = opcoes(E).find(x=>x.id === 'filial');
      if(f && (f.escolhas||[]).some(c=>c.id === id.slice(7))) o = f;
    }
    if(!o) return {ok:false, msg:'Opção que não existe.'};
    if(o.trava) return {ok:false, msg:`Não dá: ${o.trava}.`};

    const [acao, tipo] = id.split(':');
    if(acao==='filial'){
      p.filiais = p.filiais || [];
      p.filiais.push({cidade:tipo, nivel:1});
      TO.estado.lancar(E, `Subsede em ${F().nomeCidade(tipo)}`, -o.custo);
      /* A FUNDAÇÃO DESCE COM GENTE DA SEDE (ordem do dono, 31/08/2026):
         um diretor e dois linha de frente saem destacados pra abrir a
         subsede — os aptos de ficha mais fraca de cada cargo, pra não
         desfalcar o bonde principal. */
      const aptosDe = cargo => E.membros
        .filter(m=>m.cargo === cargo && !m.ferido && !m.preso && !m.filial)
        .sort((a,b)=>(a.forca+a.defesa)-(b.forca+b.defesa));
      const destacados = aptosDe('diretoria').slice(0,1)
        .concat(aptosDe('frente').slice(0,2));
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
      if(f){ f.nivel++;
        TO.estado.lancar(E, `Ampliação da subsede de ${F().nomeCidade(tipo)}`+
                            ` — nível ${f.nivel}`, -o.custo); }
      return {ok:true, msg:o.rot+'.'};
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
  /* R$ 400 a unidade (reajuste do dono, 31/08/2026 — era 120) */
  const PRECO_BOMBA = 400;

  function estoquePiro(E){
    if(!E.estoque) E.estoque = {bombas:0};
    if(E.estoque.bombas == null) E.estoque.bombas = 0;
    return E.estoque;
  }
  const bombas = E => estoquePiro(E).bombas;

  function comprarBombas(E, qtd){
    qtd = Math.max(0, Math.round(qtd||0));
    if(!qtd) return {ok:true, compradas:0};
    const custo = qtd * PRECO_BOMBA;
    if(E.dinheiro < custo) return {ok:false, msg:'falta caixa'};
    estoquePiro(E).bombas += qtd;
    TO.estado.lancar(E, `Bombas ×${qtd}`, -custo);
    return {ok:true, compradas:qtd, custo};
  }

  return {SEDE, TETO, PONTO, FABRICA, FILIAL,
          filiaisDe, temFilialEm, cidadesCandidatas,
          linhas, opcoes, comprar,
          PRECO_BOMBA, bombas, comprarBombas};
})();
