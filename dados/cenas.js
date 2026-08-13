/* =========================================================
   CENAS DE BRIGA — praça e rua
   ---------------------------------------------------------
   A cena dos arredores nasceu de uma foto aérea. Estas duas
   são desenhadas, e por isso a geometria e a pintura saem da
   MESMA lista de blocos: o que bloqueia a passagem é
   exatamente o que aparece na tela. Não há como o disco andar
   por cima de um muro que existe só no desenho.

   Mesmo tamanho de tela e mesma célula da cena dos arredores,
   pra o resto do dia de jogo não precisar saber de nada.
   ========================================================= */
TO.dados = TO.dados || {};

TO.dados.cenas = (function(){
  const W = 1536, H = 1024, CEL = 8;

  const retangulo = b => ({rot:b.tipo, pontos:[
    [b.x, b.y], [b.x+b.w, b.y], [b.x+b.w, b.y+b.h], [b.x, b.y+b.h]]});

  /* o chão inteiro é pisável; o que tira o chão é a lista de blocos */
  const montar = cena => Object.assign({
    largura:W, altura:H, celula:CEL, imagem:null,
    poligonos:{
      caminhavel:[{rot:'chão', pontos:[[0,0],[W,0],[W,H],[0,H]]}],
      bloqueio: cena.blocos.map(retangulo)
    }
  }, cena);

  /* =======================================================
     PRAÇA
     Praça de bairro de cidade grande do Nordeste: um largo
     aberto, pouca árvore, coreto no meio e o comércio nas
     bordas — boteco, quiosque, banca. A rua contorna os
     quatro lados e uma transversal chega no meio de cada
     borda: são quatro esquinas, uma por lado. Espaço aberto
     é o que a briga pede; canteiro fechado só atrapalha.
     ======================================================= */
  const blocosPraca = [];
  const bp = (x,y,w,h,tipo,extra)=>blocosPraca.push(
    Object.assign({x,y,w,h,tipo}, extra||{}));

  /* A régua da praça, a mesma que cenario.js usa pra pintar:
     fachada → rua de contorno → largo → rua de contorno → fachada.
     A boca de cada transversal é o vão no meio de cada borda: são as
     quatro esquinas, uma por lado. */
  const P_VAO = 190;              // largura da boca de cada transversal
  const P_MX = 226, P_MY = 250;   // do canto da tela até a borda do largo
  const P_FX = 96,  P_FY = 120;   // fundo da fachada (leste-oeste / norte-sul)
  const P_CX = W/2, P_CY = H/2;
  const vaoX0 = P_CX - P_VAO/2, vaoX1 = P_CX + P_VAO/2;
  const vaoY0 = P_CY - P_VAO/2, vaoY1 = P_CY + P_VAO/2;

  bp(0,       0, vaoX0,   P_FY, 'igreja');            // norte-oeste
  bp(vaoX1,   0, W-vaoX1, P_FY, 'predio');            // norte-leste
  bp(0,     H-P_FY, vaoX0,   P_FY, 'predio');         // sul-oeste
  bp(vaoX1, H-P_FY, W-vaoX1, P_FY, 'boteco');         // sul-leste: os botecos
  bp(0,     P_FY, P_FX, vaoY0-P_FY, 'predio');        // oeste-norte
  bp(0,     vaoY1, P_FX, H-P_FY-vaoY1, 'predio');     // oeste-sul
  bp(W-P_FX, P_FY, P_FX, vaoY0-P_FY, 'predio');       // leste-norte
  bp(W-P_FX, vaoY1, P_FX, H-P_FY-vaoY1, 'sobrado');   // leste-sul

  /* o coreto no centro, oitavado — desenhado como bloco redondo */
  bp(P_CX-60, P_CY-60, 120, 120, 'coreto', {redondo:true});

  /* pouca árvore: dois canteiros compridos, encostados na borda, e só.
     O miolo fica limpo — é lá que a briga acontece. */
  bp(320, 300, 150, 74, 'canteiro');
  bp(1066, 650, 150, 74, 'canteiro');

  /* o comércio da borda, que é o que dá cara de praça de bairro:
     quiosque de pipoca, banca de jornal e o carrinho de lanche */
  bp(320, 660, 128, 72, 'quiosque');
  bp(1160, 292, 112, 72, 'banca');
  bp(940, 292, 130, 72, 'quiosque');

  /* carros no meio-fio da rua de contorno, sem tampar as bocas */
  for(const [cx,cy] of [[200,180],[1244,180],[200,834],[1244,834]])
    bp(cx, cy, 92, 46, 'carro');

  const praca = montar({
    id:'praca', nome:'Praça', pintura:'praca', blocos:blocosPraca,
    /* aqui não se entra em estádio nenhum: quem sai da praça sai pela rua */
    local:'Na praça',
    /* praça de bairro não tem operação montada: quem responde é a PM
       do posto, e ela vem a pé (GDD §12) */
    tropaChoque:false,
    saida:{perto:'Sair pela rua', longe:'Saída (leve o líder)',
           feito:'sua torcida saiu da praça com a rua na mão',
           dica:'Leve o líder até a boca de rua da sua torcida.'},
    /* postes e mobiliário só de desenho, que o corpo desvia sozinho */
    enfeites:[
      {tipo:'poste', x:300, y:290}, {tipo:'poste', x:1236, y:290},
      {tipo:'poste', x:300, y:734}, {tipo:'poste', x:1236, y:734},
      {tipo:'orelhao', x:1276, y:420},
      {tipo:'lixeira', x:700, y:290}, {tipo:'lixeira', x:836, y:734},
      {tipo:'banco', x:560, y:512, ang:0}, {tipo:'banco', x:976, y:512, ang:0},
      {tipo:'banco', x:768, y:360, ang:1}, {tipo:'banco', x:768, y:664, ang:1},
      /* as mesas do boteco da borda sul, viradas pro largo */
      {tipo:'mesa', x:900, y:742}, {tipo:'mesa', x:1000, y:754},
      {tipo:'mesa', x:1100, y:742}
    ],
    /* varal de bandeirinha atravessando a praça, de poste a poste */
    varais:[[[300,290],[1236,290]], [[300,734],[1236,734]]],
    spawns:[
      /* cada bonde entra por uma esquina; as outras duas ficam livres
         pra quem quiser flanquear */
      {id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:110, y:512, jogador:true,
       entrada:'esquina_leste'},
      {id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:768, y:950,
       entrada:'esquina_leste'},
      {id:'visitante1',rot:'BONDE RIVAL',lado:'visitante',x:1426, y:512,
       entrada:'esquina_oeste'},
      {id:'visitante2',rot:'RETAGUARDA',  lado:'visitante',x:768, y:74,
       entrada:'esquina_oeste'}
    ],
    /* quatro esquinas, uma em cada borda: as duas do meio são objetivo,
       as de cima e de baixo servem de fuga e de entrada da PM */
    entradas:[
      {id:'esquina_oeste', rot:'ESQUINA OESTE', lado:'visitante', x:48,   y:512, raio:46, dir:[-1,0]},
      {id:'esquina_leste', rot:'ESQUINA LESTE', lado:'mandante',  x:1488, y:512, raio:46, dir:[1,0]},
      {id:'esquina_norte', rot:'ESQUINA NORTE', lado:'neutro',    x:768,  y:40,  raio:46, dir:[0,-1]},
      {id:'esquina_sul',   rot:'ESQUINA SUL',   lado:'neutro',    x:768,  y:984, raio:46, dir:[0,1]}
    ],
    /* a viatura para na rua de contorno, longe das bocas */
    pmPostos:[
      {x:420, y:185}, {x:1116, y:185}, {x:420, y:839}, {x:1116, y:839}
    ],
    /* gradil de canteiro: quebra e vira arma, como no GDD §12 */
    grades:[
      {id:'gradil_norte', rot:'GRADIL DO CANTEIRO',
       de:{x:310,y:290}, ate:{x:480,y:290}, modulos:3, espessura:9},
      {id:'gradil_sul',   rot:'GRADIL DO CANTEIRO',
       de:{x:1056,y:640}, ate:{x:1226,y:640}, modulos:3, espessura:9}
    ]
  });

  /* =======================================================
     AS TRÊS RUAS
     Mesma planta nas três: pista larga atravessando a tela,
     calçada larga dos dois lados e uma transversal em cada
     ponta — duas esquinas de cada lado. O que muda é o bairro
     em volta, porque esbarrão no Pirambu não pode abrir a
     mesma tela do esbarrão na Aldeota. A tática continua a
     mesma de propósito; o cenário é que conta de onde é.
     ======================================================= */
  const PONTA = 250;              // largura da transversal de cada ponta

  function fazRua(cfg){
    const blocos = [];
    const br = (x,y,w,h,tipo,extra)=>blocos.push(
      Object.assign({x,y,w,h,tipo}, extra||{}));

    /* as duas fileiras, cada uma parando antes das pontas */
    const fila = (cima)=>{
      const L = cima ? cfg.norte : cfg.sul;
      let x = PONTA, i = cima ? 0 : 40;
      while(x < W-PONTA){
        const larg = Math.min(L.larg + ((i*97) % L.varia), W-PONTA-x);
        if(larg < 40) break;
        const fundo = L.fundo + ((i*53) % 60);
        br(x, cima ? 0 : H-fundo, larg-8, fundo, L.tipos[i % L.tipos.length], {n:i});
        x += larg; i++;
      }
    };
    fila(true); fila(false);

    /* as quatro quinas das transversais */
    const q = cfg.quinas;
    br(0, 0, PONTA-40, 190, q[0], {n:80});
    br(W-PONTA+40, 0, PONTA-40, 190, q[1], {n:81});
    br(0, H-190, PONTA-40, 190, q[2], {n:82});
    br(W-PONTA+40, H-190, PONTA-40, 190, q[3], {n:83});

    /* o mobiliário do meio-fio: é o que muda de bairro pra bairro */
    for(const b of cfg.mobilia || []) br(...b);
    /* carros nas duas faixas de estacionamento */
    for(const [cx,cy] of cfg.carros) br(cx, cy, 96, 46, 'carro');

    return montar(Object.assign({
      blocos, tropaChoque:false,
      saida:{perto:'Furar pra fora', longe:'Boca da rua (leve o líder)',
             feito:'sua torcida furou o cerco e sumiu na rua',
             dica:'Leve o líder até a ponta da rua que é sua.'},
      varais:[],
      spawns:[
        /* cada bonde entra por uma ponta; as transversais das quinas dão
           a volta, então dá pra flanquear em vez de bater de frente */
        {id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:120, y:512, jogador:true,
         entrada:'boca_leste'},
        {id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:120, y:290,
         entrada:'boca_leste'},
        {id:'visitante1',rot:'BONDE RIVAL',lado:'visitante',x:1416, y:512,
         entrada:'boca_oeste'},
        {id:'visitante2',rot:'RETAGUARDA', lado:'visitante',x:1416, y:740,
         entrada:'boca_oeste'}
      ],
      entradas:[
        {id:'boca_oeste', rot:'BOCA DA RUA', lado:'visitante', x:40,   y:512, raio:48, dir:[-1,0]},
        {id:'boca_leste', rot:'FIM DA RUA',  lado:'mandante',  x:1496, y:512, raio:48, dir:[1,0]}
      ],
      /* a PM fecha as duas pontas, que é onde a rua tem saída */
      pmPostos:[{x:150, y:700}, {x:1400, y:300}, {x:880, y:430}],
      grades:[]
    }, cfg.cena));
  }

  /* --- periferia: favela e classe baixa --------------------------------
     Asfalto remendado, muro pichado, boteco com mesa de plástico na
     porta, caçamba de entulho e quintal de terra batida atrás. */
  const rua = fazRua({
    norte:{larg:150, varia:110, fundo:210, tipos:['casa','sobrado','casa','casa']},
    sul:  {larg:150, varia:110, fundo:200, tipos:['casa','casa','boteco','casa','casa']},
    quinas:['sobrado','casa','casa','boteco'],
    mobilia:[[420, 690, 150, 70, 'cacamba'], [980, 286, 150, 70, 'cacamba']],
    carros:[[320,290],[700,290],[1160,290],[330,700],[760,700],[1150,700]],
    cena:{
      id:'rua', nome:'Rua', pintura:'rua', local:'Na rua',
      enfeites:[
        {tipo:'poste', x:340, y:330}, {tipo:'poste', x:780, y:330},
        {tipo:'poste', x:1200, y:330},
        {tipo:'poste', x:400, y:694}, {tipo:'poste', x:880, y:694},
        {tipo:'poste', x:1240, y:694},
        {tipo:'lixeira', x:560, y:330}, {tipo:'lixeira', x:1040, y:694},
        {tipo:'mesa', x:1180, y:756}, {tipo:'mesa', x:1256, y:768},
        {tipo:'lombada', x:768, y:512}
      ],
      varais:[[[340,330],[400,694]], [[880,694],[1200,330]]]
    }
  });

  /* --- classe média ----------------------------------------------------
     Casa de muro baixo com garagem e jardim na frente, predinho de três
     andares, padaria na esquina e árvore nova plantada no meio-fio. */
  const ruaMedia = fazRua({
    norte:{larg:170, varia:80, fundo:220, tipos:['casa-media','casa-media','predinho']},
    sul:  {larg:170, varia:80, fundo:214, tipos:['casa-media','predinho','casa-media']},
    quinas:['padaria','casa-media','casa-media','predinho'],
    /* a árvore de calçada é obstáculo: é o que muda a briga de bairro */
    mobilia:[[360, 260, 54, 54, 'arvore-rua'], [700, 260, 54, 54, 'arvore-rua'],
             [1040, 260, 54, 54, 'arvore-rua'],
             [470, 706, 54, 54, 'arvore-rua'], [810, 706, 54, 54, 'arvore-rua'],
             [1150, 706, 54, 54, 'arvore-rua'],
             [560, 700, 120, 60, 'ponto-onibus']],
    /* aqui o carro fica na vaga pintada, não em cima da calçada */
    carros:[[440,344],[820,344],[1160,344],[330,630],[930,630],[1250,630]],
    cena:{
      id:'rua-media', nome:'Rua de classe média', pintura:'rua-media',
      local:'Na rua, bairro de classe média',
      enfeites:[
        {tipo:'poste', x:300, y:340}, {tipo:'poste', x:900, y:340},
        {tipo:'poste', x:1290, y:340},
        {tipo:'poste', x:380, y:684}, {tipo:'poste', x:990, y:684},
        {tipo:'poste', x:1300, y:684},
        {tipo:'lixeira', x:640, y:340}, {tipo:'lixeira', x:1080, y:684},
        {tipo:'mesa', x:196, y:760}, {tipo:'mesa', x:196, y:840},
        {tipo:'lombada', x:768, y:512}
      ]
    }
  });

  /* --- classe alta -----------------------------------------------------
     Muro alto com cerca elétrica, guarita em cada portão, torre com
     piscina na cobertura e mangueira grande sombreando a calçada. */
  const ruaNobre = fazRua({
    norte:{larg:250, varia:60, fundo:230, tipos:['torre','jardim-alto','torre']},
    sul:  {larg:250, varia:60, fundo:226, tipos:['jardim-alto','torre','jardim-alto']},
    quinas:['torre','jardim-alto','jardim-alto','torre'],
    mobilia:[[330, 250, 68, 68, 'arvore-grande'], [700, 250, 68, 68, 'arvore-grande'],
             [1070, 250, 68, 68, 'arvore-grande'],
             [420, 706, 68, 68, 'arvore-grande'], [790, 706, 68, 68, 'arvore-grande'],
             [1160, 706, 68, 68, 'arvore-grande'],
             [560, 252, 70, 64, 'guarita'], [960, 706, 70, 64, 'guarita']],
    carros:[[470,344],[860,344],[1230,344],[300,630],[900,630],[1270,630]],
    cena:{
      id:'rua-nobre', nome:'Rua de classe alta', pintura:'rua-nobre',
      local:'Na rua, bairro nobre',
      enfeites:[
        {tipo:'poste', x:250, y:346}, {tipo:'poste', x:640, y:346},
        {tipo:'poste', x:1010, y:346}, {tipo:'poste', x:1380, y:346},
        {tipo:'poste', x:250, y:678}, {tipo:'poste', x:640, y:678},
        {tipo:'poste', x:1010, y:678}, {tipo:'poste', x:1380, y:678},
        {tipo:'lixeira', x:880, y:346}, {tipo:'lixeira', x:1240, y:678}
      ]
    }
  });

  /* =======================================================
     BAR DA RIVAL
     Esquina de bairro com o bar da outra torcida: fachada
     pintada nas cores deles, mesa de plástico na calçada,
     mesa de sinuca dentro, gradil separando o salão da rua.
     Quem invade quer chegar na porta; quem defende quer
     segurar a calçada.
     ======================================================= */
  const blocosBar = [];
  const bb = (x,y,w,h,tipo,extra)=>blocosBar.push(
    Object.assign({x,y,w,h,tipo}, extra||{}));

  /* o bar toma a esquina nordeste, com o salão virado pra rua */
  bb(1010, 140, 400, 310, 'bar-rival');
  /* o sobrado em cima do bar e o vizinho de parede, a leste */
  bb(1010, 0, 526, 130, 'sobrado', {n:80});
  bb(1420, 140, 116, 310, 'casa', {n:81});
  /* o muro que fecha o deck do bar pelo lado da esquina */
  bb(1010, 470, 30, 110, 'muro');

  /* a vizinhança: casa e sobrado dos dois lados da rua */
  for(let k=0;k<5;k++) bb(k*206, 0, 190, 210 + (k%3)*40, k%3===1?'sobrado':'casa', {n:k});
  for(let k=0;k<7;k++) bb(k*222, 860, 204, 164, k%4===2?'boteco':'casa', {n:k+20});

  /* o que vira arma: caçamba, carro no meio-fio e engradado de cerveja */
  bb(620, 690, 150, 70, 'cacamba');
  for(const [cx,cy] of [[300,300],[700,300],[430,700],[1140,780]])
    bb(cx, cy, 96, 46, 'carro');
  /* engradado de cerveja empilhado na ponta do deck: pilha que vira arma */
  bb(1442, 476, 70, 60, 'engradado');
  bb(1442, 544, 70, 60, 'engradado');

  const bar = montar({
    id:'bar', nome:'Bar', pintura:'bar', blocos:blocosBar,
    local:'No bar deles',
    saida:{perto:'Tomar o bar', longe:'Porta do bar (leve o líder)',
           feito:'sua torcida tomou o bar deles',
           dica:'Leve o líder até a porta do bar.'},
    enfeites:[
      {tipo:'poste', x:520, y:430}, {tipo:'poste', x:980, y:430},
      {tipo:'poste', x:1340, y:760},
      {tipo:'lixeira', x:840, y:430},
      {tipo:'mesa', x:1090, y:505}, {tipo:'mesa', x:1200, y:520},
      {tipo:'mesa', x:1310, y:500}, {tipo:'mesa', x:1150, y:548},
      {tipo:'orelhao', x:640, y:434}
    ],
    /* a bandeirinha do bar, pendurada de poste a poste na frente dele */
    varais:[[[980,430],[1340,430]]],
    spawns:[
      /* a gente chega pela rua, eles saem de dentro */
      {id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:120, y:512, jogador:true,
       entrada:'porta_bar'},
      {id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:180, y:760,
       entrada:'porta_bar'},
      {id:'visitante1',rot:'DONOS DA CASA', lado:'visitante', x:1160, y:480,
       entrada:'fuga_oeste'},
      {id:'visitante2',rot:'SAIU DE DENTRO', lado:'visitante', x:1340, y:540,
       entrada:'fuga_oeste'}
    ],
    entradas:[
      {id:'porta_bar',  rot:'PORTA DO BAR', lado:'mandante',  x:1120, y:462, raio:52, dir:[0,-1]},
      {id:'fuga_oeste', rot:'FIM DA RUA',   lado:'visitante', x:40,   y:512, raio:46, dir:[-1,0]}
    ],
    /* o gradil da calçada é o que segura a investida — e quebra */
    grades:[
      {id:'gradil_bar', rot:'GRADIL DA CALÇADA',
       de:{x:1040, y:568}, ate:{x:1436, y:568}, modulos:6, espessura:9}
    ],
    pmPostos:[{x:400, y:512}, {x:760, y:840}, {x:1450, y:770}]
  });

  /* =======================================================
     ALVO COMERCIAL
     Rua de comércio de centro: joalheria com porta de aço,
     agência bancária com vestíbulo de caixa eletrônico,
     vitrine de loja de roupa e guarita de segurança. Aqui
     quem enfrenta a torcida é segurança particular, e a PM
     chega mais rápido do que em briga de bonde.
     ======================================================= */
  const blocosCom = [];
  const bc = (x,y,w,h,tipo,extra)=>blocosCom.push(
    Object.assign({x,y,w,h,tipo}, extra||{}));

  /* fileira norte: loja de roupa, joalheria no meio, mercadinho */
  bc(0,   0, 380, 250, 'vitrine', {rot:'MODAS'});
  bc(400, 0, 380, 250, 'joalheria');
  bc(800, 0, 330, 250, 'vitrine', {rot:'MERCADINHO'});
  bc(1150,0, 386, 250, 'predio');
  /* fileira sul: a agência, com o vestíbulo do caixa eletrônico */
  bc(0,    790, 420, 234, 'predio');
  bc(440,  760, 460, 264, 'banco');
  bc(920,  790, 616, 234, 'predio');
  /* guarita, banca e o carro-forte parado no meio-fio */
  bc(1230, 300, 80, 80, 'guarita');
  bc(250,  690, 150, 70, 'cacamba');
  bc(600,  650, 180, 76, 'carroforte');
  for(const [cx,cy] of [[120,300],[900,300],[1000,660],[1330,660]])
    bc(cx, cy, 96, 46, 'carro');

  const comercio = montar({
    id:'comercio', nome:'Comércio', pintura:'comercio', blocos:blocosCom,
    local:'No comércio',
    saida:{perto:'Arrombar e levar', longe:'Porta de aço (leve o líder)',
           feito:'a porta de aço cedeu e a turma levou o que deu',
           dica:'Leve o líder até a porta de aço da joalheria.'},
    enfeites:[
      {tipo:'poste', x:300, y:290}, {tipo:'poste', x:780, y:290},
      {tipo:'poste', x:1180, y:740}, {tipo:'poste', x:420, y:740},
      {tipo:'lixeira', x:960, y:290}, {tipo:'lixeira', x:700, y:742},
      {tipo:'lombada', x:768, y:512}
    ],
    varais:[],
    spawns:[
      {id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:110, y:512, jogador:true,
       entrada:'porta_aco'},
      {id:'mandante2', rot:'CAMPANA',    lado:'mandante', x:170, y:640,
       entrada:'porta_aco'},
      /* segurança particular: pouca gente, mas armada de cassetete */
      {id:'visitante1',rot:'SEGURANÇA',  lado:'visitante', x:1290, y:420,
       entrada:'fuga_leste'},
      {id:'visitante2',rot:'REFORÇO',    lado:'visitante', x:1400, y:560,
       entrada:'fuga_leste'}
    ],
    entradas:[
      {id:'porta_aco',  rot:'PORTA DE AÇO', lado:'mandante',  x:590, y:262, raio:50, dir:[0,-1]},
      {id:'fuga_leste', rot:'FIM DA RUA',   lado:'visitante', x:1496, y:512, raio:46, dir:[1,0]}
    ],
    /* a grade de proteção da vitrine: cai depois de muita pancada */
    grades:[
      {id:'grade_vitrine', rot:'GRADE DA VITRINE',
       de:{x:400, y:302}, ate:{x:780, y:302}, modulos:5, espessura:10}
    ],
    /* comércio tem câmera e botão de pânico: a PM já está na esquina */
    pmPostos:[{x:200, y:512}, {x:1350, y:512}, {x:768, y:400}, {x:768, y:640}]
  });

  /* =======================================================
     CT DO CLUBE
     O centro de treinamento: muro alto, portão de chapa,
     campo de treino, vestiário, arquibancadinha de torcedor
     e o ônibus da delegação parado. Pressionar o clube é
     furar o portão e chegar no gramado onde o elenco treina.
     ======================================================= */
  const blocosCT = [];
  const bt2 = (x,y,w,h,tipo,extra)=>blocosCT.push(
    Object.assign({x,y,w,h,tipo}, extra||{}));

  /* o muro do CT fecha os quatro lados, com o portão a oeste */
  bt2(0,    0, W, 96, 'muro');
  bt2(0, H-96, W, 96, 'muro');
  bt2(0,   96, 60, 300, 'muro');
  bt2(0,  628, 60, 300, 'muro');
  bt2(W-60, 96, 60, H-192, 'muro');

  /* vestiário e sala de imprensa, no fundo leste */
  bt2(1180, 200, 296, 240, 'vestiario');
  bt2(1180, 580, 296, 240, 'vestiario');
  /* a arquibancadinha de quem vê o treino */
  bt2(300, 130, 620, 80, 'arquibancada');
  /* o ônibus da delegação, parado no saibro de frente pro portão */
  bt2(130, 690, 210, 96, 'onibus');
  /* material de treino: o carrinho de bola e os manequins de barreira */
  bt2(980, 470, 70, 90, 'engradado');
  for(const [cx,cy] of [[820,300],[880,300],[940,300]])
    bt2(cx, cy, 26, 26, 'manequim');

  const ct = montar({
    id:'ct', nome:'CT', pintura:'ct', blocos:blocosCT,
    local:'No CT do clube',
    saida:{perto:'Chegar no elenco', longe:'Gramado (leve o líder)',
           feito:'a torcida chegou no gramado e o elenco ouviu o que tinha de ouvir',
           dica:'Leve o líder até o meio do gramado.'},
    enfeites:[
      {tipo:'poste', x:180, y:420}, {tipo:'poste', x:180, y:620},
      {tipo:'poste', x:1120, y:420}, {tipo:'poste', x:1120, y:620},
      {tipo:'lixeira', x:1000, y:640}
    ],
    varais:[],
    spawns:[
      {id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:120, y:512, jogador:true,
       entrada:'gramado'},
      {id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:150, y:620,
       entrada:'gramado'},
      /* seguranças do clube: linha na frente do vestiário */
      {id:'visitante1',rot:'SEGURANÇA DO CT', lado:'visitante', x:1120, y:420,
       entrada:'portao_ct'},
      {id:'visitante2',rot:'ROUPEIRO E CIA',  lado:'visitante', x:1120, y:640,
       entrada:'portao_ct'}
    ],
    entradas:[
      {id:'gramado',   rot:'MEIO DO GRAMADO', lado:'mandante',  x:700, y:512, raio:60, dir:[1,0]},
      {id:'portao_ct', rot:'PORTÃO DE CHAPA', lado:'visitante', x:30,  y:512, raio:48, dir:[-1,0]}
    ],
    /* o alambrado que separa a área do treino do estacionamento */
    grades:[
      {id:'alambrado', rot:'ALAMBRADO DO CAMPO',
       de:{x:360, y:250}, ate:{x:360, y:790}, modulos:7, espessura:10}
    ],
    /* CT tem segurança e a PM demora: é propriedade privada, longe da rua */
    pmPostos:[{x:120, y:300}, {x:120, y:760}]
  });

  /* =======================================================
     QUANDO EXISTE FOTO
     A cena desenhada é o rascunho; quando a foto aérea chega,
     ela manda. A imagem vira o chão e a máscara tirada dela
     (ferramentas/importar_cena_foto.py) vira a colisão — bloco
     e enfeite desenhados saem, senão apareceria muro em cima
     de casa que já está na foto.

     Os marcadores são puxados pro chão mais perto: a foto nunca
     cai exatamente onde a planta imaginou, e spawn dentro de
     telhado é bonde que nasce presd.
     ======================================================= */
  function sobreFoto(cena, f){
    if(!f) return cena;
    cena.imagem = f.imagem;
    cena.mascara = f.mascara;
    cena.foto = true;
    delete cena.pintura;                 // quem pinta agora é a foto
    cena.blocos = []; cena.enfeites = []; cena.varais = [];
    cena.poligonos = {caminhavel:[], bloqueio:[]};
    /* railing modelado é coisa de cena desenhada: na foto não dá pra
       saber onde o gradil está sem marcar na mão */
    cena.grades = [];

    const C = cena.celula, COLS = cena.largura/C, ROWS = cena.altura/C;
    const m = new Uint8Array(COLS*ROWS);
    f.mascara.split(';').forEach((linha, r)=>{
      let c = 0, v = 0;
      for(const n of linha.split(',')){
        for(let k=0; k<+n && c<COLS; k++, c++) m[r*COLS+c] = v;
        v ^= 1;
      }
    });
    const livre = (x, y)=>{
      const c = Math.floor(x/C), r = Math.floor(y/C);
      return c>=0 && r>=0 && c<COLS && r<ROWS && m[r*COLS+c] === 1;
    };
    const puxa = p=>{
      if(livre(p.x, p.y)) return p;
      for(let raio=C; raio<=460; raio+=C)
        for(let a=0; a<32; a++){
          const x = p.x + Math.cos(a*Math.PI/16)*raio;
          const y = p.y + Math.sin(a*Math.PI/16)*raio;
          if(livre(x, y)){ p.x = Math.round(x); p.y = Math.round(y); return p; }
        }
      return p;
    };
    /* a pista da foto não cai na mesma altura da desenhada */
    if(f.meio) for(const s of cena.spawns)
      if(Math.abs(s.y - cena.altura/2) < 40) s.y = f.meio;
    if(f.bocas) for(const e of cena.entradas){
      if(e.x < cena.largura*0.2) e.x = f.bocas[0];
      if(e.x > cena.largura*0.8) e.x = f.bocas[1];
      if(f.meio && Math.abs(e.y - cena.altura/2) < 40) e.y = f.meio;
    }
    cena.spawns.forEach(puxa);
    cena.entradas.forEach(puxa);
    cena.pmPostos.forEach(puxa);
    return cena;
  }

  const FOTO = (typeof TO !== 'undefined' && TO.dados && TO.dados.cenasFoto) || {};
  sobreFoto(praca, FOTO.praca);
  sobreFoto(rua, FOTO.rua);
  sobreFoto(ruaMedia, FOTO['rua-media']);
  sobreFoto(ruaNobre, FOTO['rua-nobre']);

  return {praca, rua, 'rua-media':ruaMedia, 'rua-nobre':ruaNobre,
          bar, comercio, ct};
})();
