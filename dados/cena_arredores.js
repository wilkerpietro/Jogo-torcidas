/* =========================================================
   CENA DOS ARREDORES — definição sobre a foto aérea
   ---------------------------------------------------------
   Todas as coordenadas estão no espaço da imagem: 1536 x 1024.

   Esta é a PRIMEIRA PASSADA, estimada a partir da imagem
   comentada. Nada aqui precisa ser editado na mão:
   abra a cena e aperte F2 para o editor visual — ele pinta a
   caminhabilidade, arrasta os marcadores e exporta este mesmo
   arquivo pronto para colar por cima.
   ========================================================= */
TO.dados.cenaArredores = {

  imagem:'img/cenas/arredores.webp',
  largura:1536,
  altura:1024,

  /* tamanho da célula da malha de caminhabilidade, em pixels da imagem.
     8 dá 192x128 células — preciso o bastante para meio-fio e fino
     o bastante para caber num arquivo de texto. */
  celula:8,

  /* -------------------------------------------------------
     ONDE DÁ PRA ANDAR
     'caminhavel' = asfalto e calçada.
     'bloqueio'   = recortado de dentro do caminhável (prédio,
                    canteiro, muro, terreno).
     A ordem importa: bloqueio sempre vence.
     ------------------------------------------------------- */
  poligonos:{

    caminhavel:[

      // ---- avenida principal que passa sob o estádio (leste-oeste)
      {nome:'avenida central',
       pontos:[[0,300],[1536,300],[1536,470],[0,470]]},

      // ---- calçadão em frente à fachada sul do estádio
      {nome:'calçadão do estádio',
       pontos:[[345,252],[1238,252],[1238,338],[345,338]]},

      // ---- rua vertical à esquerda do estádio (leva à ENTRADA 1º MANDANTE)
      {nome:'rua lateral oeste',
       pontos:[[238,0],[348,0],[348,342],[238,342]]},

      // ---- rua vertical à direita do estádio (leva à ENTRADA VISITANTE)
      {nome:'rua lateral leste',
       pontos:[[1226,0],[1302,0],[1302,348],[1226,348]]},

      // ---- rua vertical extrema leste
      {nome:'rua leste externa',
       pontos:[[1300,0],[1420,0],[1420,352],[1300,352]]},

      // ---- entrada de rua pela borda esquerda (SPAWN 3º MANDANTE)
      {nome:'rua noroeste',
       pontos:[[0,212],[252,212],[252,312],[0,312]]},

      // ---- entrada de rua pela borda direita (SPAWN 2º VISITANTE)
      {nome:'rua nordeste',
       pontos:[[1288,198],[1536,198],[1536,330],[1288,330]]},

      // ---- cruzamento central + avenida vertical descendo
      {nome:'avenida vertical',
       pontos:[[588,430],[912,430],[912,1024],[588,1024]]},

      // ---- rua horizontal inferior, lado oeste
      {nome:'rua sudoeste',
       pontos:[[0,598],[642,598],[642,714],[0,714]]},

      // ---- rua horizontal inferior, lado leste
      {nome:'rua sudeste',
       pontos:[[878,588],[1536,588],[1536,708],[878,708]]},


      // ---- calçada larga em frente ao bloco comercial oeste
      {nome:'calçada oeste',
       pontos:[[178,428],[602,428],[602,652],[178,652]]}
    ],

    bloqueio:[

      // ---- o estádio (cobertura + arquibancada)
      {nome:'estádio',
       pontos:[[332,0],[1242,0],[1242,258],[332,258]]},

      // ---- fachada sul, com os dois vãos de acesso abertos
      {nome:'fachada oeste',
       pontos:[[468,252],[506,252],[506,302],[468,302]]},
      {nome:'fachada central',
       pontos:[[562,252],[963,252],[963,302],[562,302]]},
      {nome:'fachada leste',
       pontos:[[1022,252],[1116,252],[1116,302],[1022,302]]},

      // ---- canteiro central com árvores, trecho de cima
      {nome:'canteiro norte',
       pontos:[[726,438],[806,438],[806,628],[726,628]]},

      // ---- canteiro central com árvores, trecho de baixo
      {nome:'canteiro sul',
       pontos:[[732,788],[804,788],[804,1024],[732,1024]]},

      // ---- bloco comercial oeste (prédio + terraço com mesas)
      {nome:'bloco oeste',
       pontos:[[204,466],[584,466],[584,624],[204,624]]},

      // ---- praça leste: ilha inteira, não se anda por dentro
      {nome:'praça leste',
       pontos:[[881,436],[1264,436],[1264,626],[881,626]]}
    ]
  },

  /* Máscara da caminhabilidade, extraída da própria foto: propagação a
     partir de sementes na via, barrada por meio-fio, parede e sombra.
     Cor sozinha não resolve — telhado e asfalto têm luminância quase
     igual aqui. Tem prioridade sobre os polígonos acima.
     Para reeditar: F2 na cena, pinte, e exporte este arquivo. */
  mascara:'30,7,1,2,112,10,30;30,7,1,2,113,9,30;30,10,113,9,30;30,10,113,9,30;30,10,113,9,30;30,10,113,8,31;30,10,113,8,31;30,10,113,7,32;30,10,113,8,31;29,11,112,10,30;29,11,112,11,29;29,11,112,11,29;29,12,111,11,29;29,12,111,11,29;29,12,111,11,29;29,12,111,11,29;29,13,110,4,1,6,29;29,14,109,4,1,6,29;29,14,109,11,29;29,15,107,12,29;29,15,107,12,29;29,15,106,6,1,6,29;29,15,106,13,29;29,16,105,13,29;29,16,104,14,29;28,18,103,15,28;18,1,9,18,102,16,28;0,22,5,19,102,17,27;0,46,101,20,25;0,47,99,46;0,49,94,49;0,50,90,52;0,52,86,54;0,54,73,1,9,55;0,59,68,1,5,59;0,64,63,1,1,6,1,56;0,64,63,7,2,56;0,64,64,64;19,45,64,57,7;20,50,51,64,7;24,47,49,66,6;25,47,46,28,2,26,7,6,5;26,147,11,2,6;27,146,19;28,143,21;29,142,21;30,141,21;31,140,21;33,138,21;34,136,22;36,134,22;23,3,11,133,22;23,4,13,130,22;23,4,15,128,22;23,4,16,3,1,64,47,12,22;21,6,50,33,48,13,21;21,6,52,31,48,13,21;20,7,53,30,48,13,21;20,7,54,29,48,13,21;20,7,54,29,48,13,21;17,1,1,7,55,11,8,10,48,13,21;17,9,55,10,9,10,48,13,21;17,9,55,10,9,10,48,13,21;18,8,55,10,9,10,48,18,1,15;17,9,55,10,9,10,48,34;17,9,55,10,10,9,48,34;17,9,55,10,10,9,48,34;17,9,55,10,10,9,48,34;17,8,56,10,10,9,48,34;17,8,56,10,10,9,48,34;17,8,56,10,10,9,48,34;17,8,56,10,10,9,48,34;17,8,56,10,10,9,48,34;17,9,55,10,10,9,48,34;16,11,53,11,10,9,48,34;17,10,53,11,10,9,48,34;16,11,52,12,10,9,48,34;16,50,11,14,10,9,48,34;42,24,10,116;5,187;0,192;0,192;0,192;0,192;0,192;0,192;0,192;0,15,1,1,1,5,53,39,77;77,38,77;78,36,78;78,35,79;79,33,80;79,32,81;80,30,82;80,30,82;80,30,82;80,30,82;80,30,82;80,12,9,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,10,81;80,11,10,10,81;80,11,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;78,33,81',

  /* -------------------------------------------------------
     DE ONDE CADA TORCIDA SAI  (bolinhas azuis da imagem)
     lado: 'mandante' | 'visitante'
     jogador:true  = é o bonde que você controla
     ------------------------------------------------------- */
  spawns:[
    {id:'mandante1', rot:'1º ESCALÃO MANDANTE', lado:'mandante',  x:690,  y:1000, jogador:true,  entrada:'ent_mandante1'},
    {id:'mandante2', rot:'2º ESCALÃO MANDANTE', lado:'mandante',  x:28,   y:656,  entrada:'ent_mandante3'},
    {id:'mandante3', rot:'3º ESCALÃO MANDANTE', lado:'mandante',  x:28,   y:262,  entrada:'ent_mandante3'},
    {id:'visitante1',rot:'1º ESCALÃO VISITANTE',lado:'visitante', x:1508, y:648,  entrada:'ent_visitante1'},
    /* Vai à ENTRADA VISITANTE, e não ao túnel do estádio: o cordão
       (praça + as duas grades) é contínuo, e o túnel fica do lado
       mandante dele. Mandar este grupo pra lá deixava 15 discos sem
       portão alcançável, batendo na grade e puxando a PM em cima do
       1º escalão, que aí também não entrava. */
    {id:'visitante2',rot:'2º ESCALÃO VISITANTE',lado:'visitante', x:1508, y:250,  entrada:'ent_visitante1'}
  ],

  /* -------------------------------------------------------
     PORTÕES  (marcas verdes da imagem)
     'raio' = a que distância o disco é considerado dentro.
     ------------------------------------------------------- */
  entradas:[
    {id:'ent_mandante1', rot:'ENTRADA 1º ESCALÃO MANDANTE', lado:'mandante',  x:291,  y:78,  raio:34},
    {id:'ent_mandante3', rot:'ENTRADA 3º ESCALÃO MANDANTE', lado:'mandante',  x:532,  y:316, raio:34},
    {id:'ent_visitante2',rot:'ENTRADA 2º ESCALÃO VISITANTE',lado:'visitante', x:996,  y:316, raio:34},
    {id:'ent_visitante1',rot:'ENTRADA VISITANTE',           lado:'visitante', x:1260, y:76,  raio:34}
  ],

  /* -------------------------------------------------------
     POSTOS DA PM  (bolinhas vermelhas da imagem)
     Cada posto vira um disco de policial que patrulha em volta
     dele e corre para tapar buraco na grade.
     ------------------------------------------------------- */
  pmPostos:[
    {x:256,  y:366},
    {x:313,  y:396},
    {x:781,  y:350},
    {x:641,  y:630},
    {x:1148, y:348},
    {x:1160, y:405},
    {x:1316, y:220},
    {x:1188, y:648},
    {x:1191, y:690}
  ],

  /* -------------------------------------------------------
     GRADES DE PROTEÇÃO  (traços amarelos da imagem)
     Cada linha é fatiada em módulos quebráveis — derrubar um
     módulo já conta como cordão rompido (GDD §15.3).
     ------------------------------------------------------- */
  grades:[
    {id:'grade_norte', rot:'GRADE DE PROTEÇÃO',
     de:{x:1186,y:205}, ate:{x:1197,y:432}, modulos:9, espessura:11},

    {id:'grade_sul',   rot:'GRADE DE PROTEÇÃO',
     de:{x:1219,y:625}, ate:{x:1231,y:706}, modulos:4, espessura:11}
  ]
};
