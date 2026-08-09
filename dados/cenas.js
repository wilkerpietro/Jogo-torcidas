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

  return {praca, rua};
})();
