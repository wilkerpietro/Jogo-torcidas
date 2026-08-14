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

   PREÇOS. As receitas e manutenções mensais vêm do GDD e já
   estavam em financeiro.js. Os preços de AQUISIÇÃO não estão
   no repositório (o GDD V3 não está aqui), então foram
   calculados a partir delas por uma regra só: o imóvel se
   paga em torno de doze meses de lucro líquido, no bairro e
   na fase médios. Quem tiver o número oficial troca a
   tabela — a regra está escrita ao lado de cada preço pra
   saber o que muda junto.
   ========================================================= */
window.TO = window.TO || {};

TO.patrimonio = (function(){
  const U = TO.util;
  const F = () => TO.financeiro;

  /* -------------------------------------------------------
     ESTRUTURA
     ------------------------------------------------------- */

  /* Ampliar a sede é a compra que destrava as outras: teto de
     membros, diretoria, treino e quantos pontos comerciais cabem.
     Preço = ~10 meses da manutenção nova, que é o que o GDD usa
     pra medir o tamanho do salto. */
  const SEDE = [null,
    null,                                        // n1 é onde se começa
    {custo: 20000,  rot:'Sede nível 2'},
    {custo: 45000,  rot:'Sede nível 3'},
    {custo: 90000,  rot:'Sede nível 4'},
    {custo:160000,  rot:'Sede nível 5'}
  ];

  /* Quantos pontos de cada tipo cabem por nível de sede. Sem teto,
     a torcida de nível 1 compraria a cidade inteira e o resto do
     jogo perderia a graça. */
  const TETO = {
    bar:     [null, 1, 2, 3, 4, 6],
    loja:    [null, 0, 1, 2, 3, 5],
    subsede: [null, 0, 1, 2, 4, 6]
  };

  /* Aquisição e ampliação. O lucro mensal de referência está no
     comentário: é dele que sai o preço (≈12 meses). */
  const PONTO = {
    bar: {
      rot:'Bar', plural:'bares',
      /* n1 rende 800 e custa 120 → 680/mês */
      compra: 8000,
      /* n2: +580/mês · n3: +1290/mês */
      ampliar:[null, 7000, 15000, null]
    },
    loja: {
      rot:'Loja', plural:'lojas',
      /* n1 rende 1000, custa 150 de manutenção e 250 de insumo → 600 */
      compra: 9000,
      /* n2: +600/mês · n3: +960/mês */
      ampliar:[null, 8000, 13000, null]
    },
    subsede: {
      rot:'Subsede', plural:'subsedes',
      /* 600 de receita, 90 de manutenção → 510/mês, e ainda dá pé
         na zona pra recrutar */
      compra: 6000,
      ampliar:[null, null]
    }
  };

  /* A fábrica de material não fatura: ela corta o custo de material
     por membro, que é despesa fixa e cresce com a torcida. */
  const FABRICA = {custo:35000, corte:0.4, rot:'Fábrica de material'};

  const nivelSede = E => E.torcida.sedeNivel;
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
    const fator = F().fatorComercial(E);
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
    for(const l of p.lojas) fora.push({tipo:'loja',
      rot:`Loja (nível ${l.nivel})${l.semInsumo?' · sem insumo':''}`, bairro:l.bairro,
      receita: l.semInsumo ? 0 : REC.loja[l.nivel]*mult(l.bairro)*fator,
      despesa: MAN.loja[l.nivel] + REC.loja[l.nivel]*INSUMO});
    for(const s of p.subsedes) fora.push({tipo:'subsede', rot:'Subsede', bairro:s.bairro,
      receita: REC.subsede*mult(s.bairro)*fator, despesa: MAN.subsede});

    if(p.fabrica) fora.push({tipo:'fabrica', rot:FABRICA.rot, bairro:'',
      receita:0, despesa:0,
      nota:`corta ${Math.round(FABRICA.corte*100)}% do material`});

    /* material por membro entra como linha: é despesa de estrutura,
       não some só porque não tem endereço */
    const material = E.membros.length*F().MATERIAL*(p.fabrica ? 1-FABRICA.corte : 1);
    fora.push({tipo:'material', rot:`Material (${E.membros.length} membros)`,
               bairro:'', receita:0, despesa:material});

    /* o que a torcida já comprou de faixa, bandeirão e bateria também
       custa todo mês — a aba Materiais lista o que é, aqui entra o preço */
    const guarda = efeito(E).manutencao;
    if(guarda) fora.push({tipo:'guarda', rot:'Guarda e conserto do material',
                          bairro:'', receita:0, despesa:guarda});

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
        nota:`${tem} de ${teto} pela sede nível ${n}`,
        custo:cfg.compra,
        trava:trava(cfg.compra, tem>=teto ? 'a sede não comporta mais' : null)});

      /* ampliar o ponto mais fraco de cada tipo: é o que o jogador
         faria de qualquer jeito, e evita uma lista de dez botões */
      const pontos = p[cfg.plural] || [];
      const alvo = pontos.filter(x=>cfg.ampliar[x.nivel])
                         .sort((a,b)=>a.nivel-b.nivel)[0];
      if(alvo) lista.push({
        id:'ampliar:'+tipo, rot:`Ampliar ${cfg.rot.toLowerCase()} para nível ${alvo.nivel+1}`,
        nota:alvo.bairro ? `em ${alvo.bairro}` : '',
        custo:cfg.ampliar[alvo.nivel], trava:trava(cfg.ampliar[alvo.nivel])});
    }

    if(!p.fabrica) lista.push({
      id:'fabrica', rot:FABRICA.rot,
      nota:`corta ${Math.round(FABRICA.corte*100)}% do material de todo mês`,
      custo:FABRICA.custo,
      trava:trava(FABRICA.custo, n<3 ? 'precisa de sede nível 3' : null)});

    return lista;
  }

  function comprar(E, id){
    const p = F().patrimonio(E);
    const o = opcoes(E).find(x=>x.id===id);
    if(!o) return {ok:false, msg:'Opção que não existe.'};
    if(o.trava) return {ok:false, msg:`Não dá: ${o.trava}.`};

    const [acao, tipo] = id.split(':');
    if(acao==='sede'){
      E.torcida.sedeNivel++;
      TO.estado.lancar(E, `Ampliação da sede — nível ${E.torcida.sedeNivel}`, -o.custo);
      TO.estado.anotar(E, `A sede subiu pro nível ${E.torcida.sedeNivel}.`, 'boa');
    } else if(acao==='fabrica'){
      p.fabrica = true;
      TO.estado.lancar(E, 'Fábrica de material', -o.custo);
      TO.estado.anotar(E, 'A torcida montou a própria fábrica de material.', 'boa');
    } else if(acao==='comprar'){
      const cfg = PONTO[tipo];
      const bairro = F().bairroDeFora(E, tipo+'-'+(cont(E,tipo)+1));
      p[cfg.plural].push({nivel:1, bairro});
      TO.estado.lancar(E, `${cfg.rot} em ${bairro}`, -o.custo);
      TO.estado.anotar(E, `${cfg.rot} novo em ${bairro}.`, 'boa');
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
     MATERIAL
     Preço de rua, com a economia do jogo em mente: a torcida
     começa com R$ 12.000 e fecha a semana com algumas
     centenas de sobra. Bandeira e bomba são compra de
     semana; faixa é compra de mês; bandeirão é obra do ano,
     e o mega é coisa de torcida grande — é pra ser assim.

     `manutencao` é mensal e só existe no que se guarda e se
     conserta. Festa também dá trabalho.
     ======================================================= */
  const MATERIAIS = [
    {id:'bandeira', fam:'Bandeiras', rot:'Bandeira de haste 2×1,4',
     preco:180, manutencao:0, satisfacao:0.10, prestigio:0.05,
     nota:'a mais barata, e a que enche a arquibancada'},
    {id:'bandeira_gigante', fam:'Bandeiras', rot:'Bandeira 4×3',
     preco:650, manutencao:5, satisfacao:0.25, prestigio:0.12},

    {id:'faixa_10', fam:'Faixas', rot:'Faixa 10×1,5',
     preco:400, manutencao:4, satisfacao:0.12, prestigio:0.10},
    {id:'faixa_20', fam:'Faixas', rot:'Faixa 20×1,5',
     preco:750, manutencao:7, satisfacao:0.20, prestigio:0.18},
    {id:'faixa_30', fam:'Faixas', rot:'Faixa 30×1,5',
     preco:1100, manutencao:10, satisfacao:0.28, prestigio:0.26,
     nota:'atravessa o setor inteiro'},

    {id:'bandeirao_10', fam:'Bandeirões', rot:'Bandeirão 10×10',
     preco:3500, manutencao:30, satisfacao:0.6, prestigio:0.5},
    {id:'bandeirao_20', fam:'Bandeirões', rot:'Bandeirão 20×20',
     preco:9000, manutencao:70, satisfacao:1.1, prestigio:1.0},
    {id:'bandeirao_50', fam:'Bandeirões', rot:'Bandeirão 50×30',
     preco:26000, manutencao:180, satisfacao:2.0, prestigio:2.0,
     nota:'precisa de gente pra abrir', sede:3},
    {id:'bandeirao_mega', fam:'Bandeirões', rot:'Mega bandeirão 80×50',
     preco:60000, manutencao:400, satisfacao:3.2, prestigio:3.5,
     nota:'cobre a arquibancada toda', sede:4},

    {id:'bateria_base', fam:'Bateria', rot:'Bateria básica (surdo, caixa, repique)',
     preco:4500, manutencao:60, satisfacao:0.8, prestigio:0.4},
    {id:'bateria_completa', fam:'Bateria', rot:'Bateria completa (naipe fechado)',
     preco:12000, manutencao:180, satisfacao:1.8, prestigio:1.2,
     nota:'naipe fechado, do surdo ao tamborim', sede:2},

    /* pirotecnia é consumível e já morava em E.estoque, que é de onde
       o planejamento tira as bombas da semana: aqui só se compra */
    {id:'bomba', fam:'Bombas', rot:'Bomba', campo:'bombas',
     preco:120, consumivel:true, nota:'estoque do dia de jogo'},
    {id:'rojao', fam:'Bombas', rot:'Rojão', campo:'rojoes',
     preco:60, consumivel:true, nota:'barulho na chegada'},
    {id:'sinalizador', fam:'Bombas', rot:'Sinalizador', campo:'sinalizadores',
     preco:220, consumivel:true, nota:'fumaça vermelha na entrada'}
  ];

  const doId = id => MATERIAIS.find(m=>m.id===id);

  /* Duas gavetas, porque já eram duas antes desta tela: o que se
     guarda fica no patrimônio, o que se queima fica no estoque de
     pirotecnia que o planejamento da semana consome. */
  function itens(E){
    const p = F().patrimonio(E);
    if(!p.itens) p.itens = {};
    return p.itens;
  }
  function estoquePiro(E){
    if(!E.estoque) E.estoque = {bombas:0, rojoes:0, sinalizadores:0};
    return E.estoque;
  }
  function quantidade(E, id){
    const m = doId(id);
    if(!m) return 0;
    return m.consumivel ? (estoquePiro(E)[m.campo]||0) : (itens(E)[id]||0);
  }
  function guardar(E, id, n){
    const m = doId(id);
    if(m.consumivel) estoquePiro(E)[m.campo] = (estoquePiro(E)[m.campo]||0) + n;
    else itens(E)[id] = (itens(E)[id]||0) + n;
  }

  /* O que o material somou de festa. Duas contas separadas porque
     satisfação é do torcedor comum e prestígio é da rua. */
  function efeito(E){
    let satisfacao = 0, prestigio = 0, manutencao = 0;
    for(const m of MATERIAIS){
      if(m.consumivel) continue;
      const n = quantidade(E, m.id);
      if(!n) continue;
      /* o segundo bandeirão não impressiona como o primeiro: cada
         cópia rende 60% da anterior */
      let peso = 0;
      for(let i=0;i<n;i++) peso += Math.pow(0.6, i);
      satisfacao += (m.satisfacao||0)*peso;
      prestigio  += (m.prestigio ||0)*peso;
      manutencao += (m.manutencao||0)*n;
    }
    return {satisfacao, prestigio, manutencao:Math.round(manutencao)};
  }

  function podeComprar(E, id, qtd){
    const m = doId(id);
    if(!m) return 'não existe';
    if(m.sede && E.torcida.sedeNivel < m.sede) return `precisa de sede nível ${m.sede}`;
    if(E.dinheiro < m.preco*(qtd||1)) return 'falta caixa';
    return null;
  }

  function comprarMaterial(E, id, qtd){
    qtd = Math.max(1, qtd||1);
    const trava = podeComprar(E, id, qtd);
    if(trava) return {ok:false, msg:`Não dá: ${trava}.`};
    const m = doId(id);
    guardar(E, id, qtd);
    TO.estado.lancar(E, `${m.rot}${qtd>1?' ×'+qtd:''}`, -m.preco*qtd);
    return {ok:true, msg:m.rot};
  }

  /* Derrota feia na rua tira material — decisão de design antiga, e é o
     que impede a loja de virar catraca de mão única. Leva o que se
     carrega na mão, do menor pro maior: faixa e bandeira saem rasgadas
     na correria, bandeirão só quando não sobrou mais nada, e a bateria
     não sai porque ela não vai pra briga. */
  function perderItem(E){
    const g = itens(E);
    const alvo = MATERIAIS
      .filter(m=>!m.consumivel && m.fam!=='Bateria' && g[m.id]>0)
      .sort((a,b)=>a.preco-b.preco)[0];
    if(!alvo) return null;
    g[alvo.id]--;
    if(!g[alvo.id]) delete g[alvo.id];
    return alvo;
  }

  /* famílias na ordem em que a tela mostra */
  const FAMILIAS = ['Bateria','Faixas','Bandeirões','Bandeiras','Bombas'];

  return {SEDE, TETO, PONTO, FABRICA, MATERIAIS, FAMILIAS,
          linhas, opcoes, comprar,
          quantidade, efeito, comprarMaterial, podeComprar, doId, perderItem};
})();
