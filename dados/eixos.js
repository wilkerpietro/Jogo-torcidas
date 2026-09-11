/* EIXOS DE ALIANÇA — os clãs de torcidas (pedido do dono, 11/09/2026)
   Editado à mão, não é gerado. Cada eixo é um perfil, como cidade e
   torcida: os membros nascem daqui; o resto (quem entra, quem funda)
   vive no save, em `E.eixos`. Uma torcida cabe em no máximo dois. */
TO.dados.eixos = {
  base: [
    {id:'punho_cruzado', nome:'União Punho Cruzado', sigla:'UPC',
     membros:['independente','mafia_azul','jovem_fla','jovem_sport',
              'camisa_12_do_inter','dragoes_atleticanos']},
    {id:'dedo_pro_alto', nome:'Dedo pro Alto', sigla:'DPA',
     membros:['mancha_verde','forca_jovem_vasco','galoucura',
              'torcida_jovem_do_gremio','bamor','inferno_coral']},
    {id:'lado_a', nome:'Lado A', sigla:'LADO A',
     membros:['leoes_da_tuf','mafia_vermelha','inferno_coral','trovao_azul',
              'mancha_azul_do_csa','torcida_jovem_do_galo']},
    {id:'lado_b', nome:'Lado B', sigla:'LADO B',
     membros:['cearamor','tubaroes_da_fiel','esporao_do_galo','garra_alvinegra',
              'fanautico','jovem_do_botafogo_pb','terror_tricolor']},
    {id:'punho_colado', nome:'União Punho Colado', sigla:'UPCo',
     membros:['young_flu','pavilhao_6','furia_independente_do_guarani',
              'furia_independente','raca_tricolor','mafia_vermelha','falange_tricolor']}
  ],
  /* os nomes dos eixos que podem nascer no jogo (lista do dono,
     11/09/2026): `pt` pros grupos do Brasil, `es` pros dos outros
     países latinos — a maioria dos fundadores decide. Cada nome sai
     uma vez por save. */
  nomesNovos: {
    pt: [
      {nome:'União Firma Forte',       sigla:'UFF'},
      {nome:'União Ponta a Ponta',     sigla:'UPP'},
      {nome:'União Bate Forte',        sigla:'UBF'},
      {nome:'União Bloco Pesado',      sigla:'UBP'},
      {nome:'Frente Unida',            sigla:'FU'},
      {nome:'Unidade Guerrilheira',    sigla:'UG'},
      {nome:'União Terrorista',        sigla:'UT'},
      {nome:'União Suicida',           sigla:'US'},
      {nome:'União Rei da Pista',      sigla:'URP'},
      {nome:'Bonde dos Toma Faixa',    sigla:'BTF'},
      {nome:'Bonde Soco & Chute',      sigla:'BSC'},
      {nome:'União Terror do Brasil',  sigla:'UTB'}
    ],
    es: [
      {nome:'Unión Mano Dura',            sigla:'UMD'},
      {nome:'Unión Punta a Punta',        sigla:'UPP'},
      {nome:'Unión Golpe Fuerte',         sigla:'UGF'},
      {nome:'Unión Bloque Pesado',        sigla:'UBP'},
      {nome:'Frente Unido',               sigla:'FU'},
      {nome:'Unidad Guerrillera',         sigla:'UG'},
      {nome:'Unión Terrorista',           sigla:'UT'},
      {nome:'Unión Suicida',              sigla:'US'},
      {nome:'Unión Rey de la Pista',      sigla:'URP'},
      {nome:'Barra de los Roba Trapos',   sigla:'BRT'},
      {nome:'Barra Puño y Patada',        sigla:'BPP'},
      {nome:'Unión Terror del Continente',sigla:'UTC'}
    ]
  }
};
