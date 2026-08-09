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

      // ---- praça pavimentada a leste do cruzamento
      {nome:'praça leste',
       pontos:[[878,428],[1264,428],[1264,608],[878,608]]},

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
       pontos:[[204,466],[584,466],[584,624],[204,624]]}
    ]
  },

  /* Máscara da caminhabilidade, extraída da própria foto: propagação a
     partir de sementes na via, barrada por meio-fio, parede e sombra.
     Cor sozinha não resolve — telhado e asfalto têm luminância quase
     igual aqui. Tem prioridade sobre os polígonos acima.
     Para reeditar: F2 na cena, pinte, e exporte este arquivo. */
  mascara:'30,2,4,1,1,2,117,5,30;30,2,4,1,1,2,117,5,30;30,2,4,4,117,5,30;30,2,4,4,117,5,30;30,2,4,4,117,5,30;30,2,4,4,117,4,31;30,2,4,4,117,4,31;30,1,5,4,117,3,32;30,1,5,4,117,4,31;29,2,5,4,117,5,30;29,2,5,4,117,6,29;29,2,5,4,117,6,29;29,2,5,5,116,6,29;29,2,5,5,116,6,29;29,2,5,5,116,6,29;29,2,5,5,116,6,29;29,2,5,6,115,6,29;29,2,5,7,114,6,29;29,2,5,7,114,6,29;29,2,5,8,113,6,29;29,2,5,8,113,6,29;29,2,4,9,113,6,29;29,2,4,9,114,5,29;29,2,4,10,113,5,29;29,2,4,10,113,5,29;28,3,4,11,112,6,28;18,1,9,3,4,11,112,6,28;0,22,5,4,4,11,112,7,27;0,31,4,11,112,9,25;0,31,4,12,111,34;0,31,4,14,108,35;0,32,4,14,106,36;0,32,4,16,105,35;0,33,3,18,73,1,29,35;0,34,3,22,68,1,5,3,20,36;0,35,2,27,63,1,1,6,21,36;0,37,1,26,63,7,21,37;0,38,1,25,64,15,11,38;19,20,4,21,64,18,7,20,19;20,20,6,24,51,25,6,20,20;24,18,4,25,49,26,4,20,3,1,18;25,19,6,22,46,27,3,26,18;26,147,19;27,146,19;28,143,21;29,142,21;30,141,21;31,140,21;33,138,21;34,136,22;36,134,22;23,3,11,133,22;23,4,13,130,22;23,4,15,128,22;23,4,16,3,1,123,22;21,6,50,14,9,71,21;21,6,52,12,10,70,21;20,7,53,11,10,70,21;20,7,54,10,10,70,21;20,7,54,10,10,70,21;17,1,1,7,55,10,10,70,21;17,9,55,10,10,70,21;17,9,55,10,10,70,21;18,8,55,10,10,75,1,15;17,9,55,10,10,91;17,9,55,10,10,91;17,9,55,10,10,91;17,9,55,10,10,91;17,8,56,10,10,91;17,8,56,10,10,91;17,8,56,10,10,91;17,8,56,10,10,91;17,8,56,10,10,91;17,9,55,10,10,91;16,11,53,11,10,91;17,10,53,11,10,91;16,11,52,12,10,91;16,50,11,14,10,91;42,24,10,116;5,187;0,192;0,192;0,192;0,192;0,192;0,192;0,192;0,15,1,1,1,5,53,39,77;77,38,77;78,36,78;78,35,79;79,33,80;79,32,81;80,30,82;80,30,82;80,30,82;80,30,82;80,30,82;80,12,9,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,9,82;80,11,10,10,81;80,11,10,10,81;80,11,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;79,12,10,10,81;78,33,81',

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
    {id:'visitante2',rot:'2º ESCALÃO VISITANTE',lado:'visitante', x:1508, y:250,  entrada:'ent_visitante2'}
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
