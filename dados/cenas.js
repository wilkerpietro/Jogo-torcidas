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
     Praça de bairro de cidade grande do Nordeste: coreto no
     meio, canteiro de mangueira em volta, igreja de um lado,
     fileira de comércio do outro, e a rua contornando tudo.
     ======================================================= */
  const blocosPraca = [];
  const bp = (x,y,w,h,tipo,extra)=>blocosPraca.push(
    Object.assign({x,y,w,h,tipo}, extra||{}));

  /* fachadas: igreja ao norte, comércio ao sul, sobrados nos flancos */
  bp(300, 0, 420, 150, 'igreja');
  bp(0,   0, 250, 118, 'predio');
  bp(820, 0, 300, 118, 'predio');
  bp(1210,0, 326, 150, 'predio');
  bp(0,   906, 340, 118, 'predio');
  bp(430, 930, 300,  94, 'boteco');
  bp(830, 906, 706, 118, 'predio');
  bp(0,   300, 96, 420, 'predio');
  bp(1440,300, 96, 420, 'predio');

  /* o coreto no centro, oitavado — desenhado como bloco redondo */
  bp(690, 430, 160, 160, 'coreto', {redondo:true});

  /* canteiros com árvore, os quatro em volta do coreto */
  for(const [x,y] of [[440,330],[930,330],[440,610],[930,610]])
    bp(x, y, 168, 96, 'canteiro');

  /* banca de jornal e quiosque de pipoca, nas quinas de quem passa */
  bp(250, 250, 92, 70, 'banca');
  bp(1180, 690, 84, 64, 'quiosque');

  /* carros estacionados encostados no meio-fio de baixo */
  for(let i=0;i<6;i++) bp(200 + i*180, 826, 88, 44, 'carro');

  const praca = montar({
    id:'praca', nome:'Praça', pintura:'praca', blocos:blocosPraca,
    /* aqui não se entra em estádio nenhum: quem sai da praça sai pela rua */
    local:'Na praça',
    saida:{perto:'Sair pela rua', longe:'Saída (leve o líder)',
           feito:'sua torcida saiu da praça com a rua na mão',
           dica:'Leve o líder até a boca de rua da sua torcida.'},
    /* postes e mobiliário só de desenho, que o corpo desvia sozinho */
    enfeites:[
      {tipo:'poste', x:360, y:250}, {tipo:'poste', x:1150, y:250},
      {tipo:'poste', x:360, y:760}, {tipo:'poste', x:1150, y:760},
      {tipo:'orelhao', x:1300, y:300},
      {tipo:'lixeira', x:640, y:250}, {tipo:'lixeira', x:900, y:760},
      {tipo:'banco', x:560, y:512, ang:0}, {tipo:'banco', x:980, y:512, ang:0},
      {tipo:'banco', x:770, y:330, ang:1}, {tipo:'banco', x:770, y:700, ang:1},
      {tipo:'mesa', x:470, y:890}, {tipo:'mesa', x:560, y:900},
      {tipo:'mesa', x:650, y:888}
    ],
    /* varal de bandeirinha atravessando a praça, de poste a poste */
    varais:[[[360,250],[1150,250]], [[360,760],[1150,760]]],
    spawns:[
      {id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:120, y:512, jogador:true,
       entrada:'saida_leste'},
      {id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:190, y:790,
       entrada:'saida_leste'},
      /* o rival vem do leste e a saída dele é a oeste: ninguém escapa sem
         cruzar a praça inteira, que é onde a briga tem de acontecer */
      {id:'visitante1',rot:'BONDE RIVAL',lado:'visitante',x:1400, y:512,
       entrada:'saida_oeste'},
      {id:'visitante2',rot:'RETAGUARDA',  lado:'visitante',x:1360, y:210,
       entrada:'saida_oeste'}
    ],
    /* na praça ninguém "entra" em lugar nenhum: sair da praça é o objetivo
       de quem perde o pé, e o cordão fica na boca de cada rua */
    entradas:[
      {id:'saida_oeste', rot:'RUA DO OESTE',  lado:'visitante', x:110,  y:512, raio:44, dir:[-1,0]},
      {id:'saida_leste', rot:'AVENIDA LESTE', lado:'mandante',  x:1420, y:512, raio:44, dir:[1,0]}
    ],
    pmPostos:[
      {x:512, y:180}, {x:1024, y:180}, {x:768, y:840}, {x:250, y:600}
    ],
    /* gradil de canteiro: quebra e vira arma, como no GDD §12 */
    grades:[
      {id:'gradil_norte', rot:'GRADIL DO CANTEIRO',
       de:{x:440,y:318}, ate:{x:1098,y:326}, modulos:8, espessura:9},
      {id:'gradil_sul',   rot:'GRADIL DO CANTEIRO',
       de:{x:440,y:700},  ate:{x:1098,y:708}, modulos:8, espessura:9}
    ]
  });

  /* =======================================================
     RUA
     Rua de bairro: asfalto remendado no meio, calçada estreita
     dos dois lados, muro pichado, boteco com mesa de plástico
     na porta, caçamba de entulho e carro estacionado. Corredor
     comprido — quem quer fugir corre pro fim da rua.
     ======================================================= */
  const blocosRua = [];
  const br = (x,y,w,h,tipo,extra)=>blocosRua.push(
    Object.assign({x,y,w,h,tipo}, extra||{}));

  /* as duas fileiras de casa, com recuo variando pra rua não ficar reta */
  let x = 0;
  let i = 0;
  while(x < W){
    const larg = 150 + ((i*97) % 110);
    const fundo = 250 + ((i*53) % 70);
    br(x, 0, larg-8, fundo, i%4===1 ? 'sobrado' : 'casa', {n:i});
    x += larg; i++;
  }
  x = 0; i = 0;
  while(x < W){
    const larg = 140 + ((i*71) % 120);
    const fundo = 240 + ((i*61) % 80);
    br(x, H-fundo, larg-8, fundo, i%5===2 ? 'boteco' : 'casa', {n:i+40});
    x += larg; i++;
  }

  /* caçamba de entulho e carros no meio-fio: o que vira barricada */
  br(300, 700, 150, 70, 'cacamba');
  br(980, 296, 150, 70, 'cacamba');
  for(const [cx,cy] of [[120,300],[560,300],[1180,300],
                        [230,690],[720,690],[1320,690]])
    br(cx, cy, 96, 46, 'carro');

  const rua = montar({
    id:'rua', nome:'Rua', pintura:'rua', blocos:blocosRua,
    local:'Na rua',
    saida:{perto:'Furar pra fora', longe:'Boca da rua (leve o líder)',
           feito:'sua torcida furou o cerco e sumiu na rua',
           dica:'Leve o líder até a ponta da rua que é sua.'},
    enfeites:[
      {tipo:'poste', x:180, y:352}, {tipo:'poste', x:640, y:352},
      {tipo:'poste', x:1100, y:352},
      {tipo:'poste', x:400, y:672}, {tipo:'poste', x:880, y:672},
      {tipo:'poste', x:1340, y:672},
      {tipo:'lixeira', x:300, y:352}, {tipo:'lixeira', x:1000, y:672},
      {tipo:'mesa', x:1015, y:730}, {tipo:'mesa', x:1090, y:742},
      {tipo:'lombada', x:768, y:512}
    ],
    varais:[[[180,352],[400,672]], [[880,672],[1100,352]]],
    spawns:[
      /* corredor: cada bonde sai pela ponta oposta, e a rua é estreita
         demais pra alguém passar sem esbarrar */
      {id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:90,  y:512, jogador:true,
       entrada:'boca_leste'},
      {id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:150, y:420,
       entrada:'boca_leste'},
      {id:'visitante1',rot:'BONDE RIVAL',lado:'visitante',x:1450, y:512,
       entrada:'boca_oeste'},
      {id:'visitante2',rot:'RETAGUARDA', lado:'visitante',x:1400, y:600,
       entrada:'boca_oeste'}
    ],
    entradas:[
      {id:'boca_oeste', rot:'BOCA DA RUA', lado:'visitante', x:40,   y:512, raio:46, dir:[-1,0]},
      {id:'boca_leste', rot:'FIM DA RUA',  lado:'mandante',  x:1496, y:512, raio:46, dir:[1,0]}
    ],
    /* rua estreita: a PM chega pelas duas pontas e fecha o corredor */
    pmPostos:[{x:210, y:512}, {x:1330, y:512}, {x:768, y:400}],
    grades:[]
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

  return {praca, rua, bar, comercio, ct};
})();
