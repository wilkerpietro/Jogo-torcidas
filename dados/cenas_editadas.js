/* =========================================================
   CENAS EDITADAS À MÃO — sobrescreve o que o importador gerou
   ---------------------------------------------------------
   dados/cenas_foto.js sai do ferramentas/importar_cena_foto.py e é
   reescrito toda vez que a foto muda: mexer lá se perde. Este arquivo
   é o contrário — ele é da mão, entra DEPOIS e manda.

   O editor (F2) exporta exatamente uma entrada destas. Abra a cena,
   pinte a malha, arraste os marcadores, clique em "Exportar arquivo"
   e cole o bloco aqui dentro, na chave da cena.

   Só o que estiver escrito troca: pôr só `mascara` mantém spawn,
   entrada e posto de PM como estão.
   ========================================================= */
TO.dados = TO.dados || {};
TO.dados.cenasEditadas = {

  /* rua de periferia — malha pintada na mão em cima da foto.
     O importador cortava a calçada (só o asfalto passava no corte de
     cor); aqui a faixa de andar vai de meio-fio a meio-fio, que é onde
     a briga acontece de verdade. */
  'rua': {
    mascara:
      '192;192;192;192;192;192;192;192;192;11,3,178;1,14,164,12,1;1,14,163,13,1;' +
      '1,14,163,13,1;1,14,164,12,1;1,14,164,12,1;1,14,163,13,1;1,14,163,13,1;' +
      '1,14,163,13,1;1,13,165,12,1;1,13,165,12,1;1,13,165,12,1;1,13,165,12,1;' +
      '1,12,166,12,1;1,12,166,12,1;1,12,166,12,1;1,12,166,12,1;1,12,167,11,1;' +
      '1,13,166,11,1;1,13,166,11,1;1,13,166,11,1;1,13,166,11,1;1,13,166,11,1;' +
      '1,13,166,11,1;1,13,166,11,1;1,13,166,11,1;1,13,166,11,1;1,13,165,12,1;' +
      '1,36,15,2,76,4,11,10,24,12,1;1,38,13,3,5,2,42,5,21,4,2,18,24,13,1;' +
      '1,47,2,13,34,76,4,14,1;1,47,2,13,12,5,23,70,4,14,1;1,171,1,18,1;1,190,1;' +
      '1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;' +
      '1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;' +
      '1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;' +
      '1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,44,1,145,1;1,190,1;' +
      '1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,190,1;1,20,149,21,1;' +
      '1,14,159,17,1;1,14,161,15,1;1,14,164,12,1;1,9,168,13,1;1,9,168,13,1;' +
      '1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;' +
      '1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;' +
      '1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;1,9,168,13,1;' +
      '1,8,169,13,1;1,9,168,13,1;1,12,165,13,1;1,13,165,1,2,9,1;1,13,168,9,1;' +
      '1,13,168,9,1;192;192;192;192;192;192;192;192;192;192;192',

    spawns:[
      {"id":"mandante1", "rot":"1º ESCALÃO", "lado":"mandante", "x":120, "y":512, "jogador":true, "entrada":"boca_leste"},
      {"id":"mandante2", "rot":"2º ESCALÃO", "lado":"mandante", "x":124, "y":297, "entrada":"boca_leste"},
      {"id":"visitante1", "rot":"BONDE RIVAL", "lado":"visitante", "x":1416, "y":512, "entrada":"boca_oeste"},
      {"id":"visitante2", "rot":"RETAGUARDA", "lado":"visitante", "x":1424, "y":740, "entrada":"boca_oeste"}
    ],

    entradas:[
      {"id":"boca_oeste", "rot":"BOCA DA RUA", "lado":"visitante", "x":60, "y":512, "raio":48, "dir":[-1, 0]},
      {"id":"boca_leste", "rot":"FIM DA RUA", "lado":"mandante", "x":1484, "y":512, "raio":48, "dir":[1, 0]}
    ],

    pmPostos:[
      {"x":119, "y":706},
      {"x":1383, "y":317},
      {"x":880, "y":430}
    ]
  }

};
