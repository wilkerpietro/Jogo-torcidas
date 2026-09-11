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
              'mancha_azul','torcida_jovem_do_galo']},
    {id:'lado_b', nome:'Lado B', sigla:'LADO B',
     membros:['cearamor','tubaroes_da_fiel','esporao_do_galo','garra_alvinegra',
              'fanautico','jovem_do_botafogo_pb','terror_tricolor']},
    {id:'punho_colado', nome:'União Punho Colado', sigla:'UPCo',
     membros:['young_flu','pavilhao_6','furia_independente_do_guarani',
              'furia_independente','raca_tricolor','mafia_vermelha','falange_tricolor']}
  ],
  /* os nomes dos eixos que podem nascer no jogo: com região, o nome
     entra quando a maioria dos fundadores é de lá; sem região, serve
     pra qualquer grupo. Cada nome é usado uma vez por save. */
  nomesNovos: [
    {nome:'Frente Norte',            sigla:'FN',   regiao:'Norte'},
    {nome:'União do Nordeste',       sigla:'UNE',  regiao:'Nordeste'},
    {nome:'Aliança Sertaneja',       sigla:'AS',   regiao:'Nordeste'},
    {nome:'Bloco do Cerrado',        sigla:'BC',   regiao:'Centro-Oeste'},
    {nome:'União Sudeste',           sigla:'USE',  regiao:'Sudeste'},
    {nome:'Frente Sul',              sigla:'FS',   regiao:'Sul'},
    {nome:'Aliança da Serra',        sigla:'ADS',  regiao:'Sul'},
    {nome:'Pacto das Fiéis',         sigla:'PDF'},
    {nome:'Aliança Independente',    sigla:'AI'},
    {nome:'União das Capitais',      sigla:'UDC'},
    {nome:'Frente do Interior',      sigla:'FDI'},
    {nome:'Bloco Litorâneo',         sigla:'BL'},
    {nome:'União dos Bondes',        sigla:'UDB'},
    {nome:'Frente Unida',            sigla:'FU'},
    {nome:'Aliança Ribeirinha',      sigla:'AR'},
    {nome:'Pacto do Meio-Campo',     sigla:'PMC'}
  ]
};
