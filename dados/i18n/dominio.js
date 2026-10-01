/* Dicionário da fatia "domínio dos bairros" — ver docs/I18N.md.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}.
   Cobre o pedido do dono de 30/09/2026 ("inicie a setorização dos bairros
   de acordo com os dados que temos e as zonas também …"): o domínio dos
   bairros (js/mundo/dominio.js), o mapa do Brasil e dos bairros
   (js/ui/mapa_brasil.js e ferramentas/planta_html/mapa3d.js), a ação
   social no bairro (js/gestao/acoes.js), o bairro na compra do ponto
   (js/gestao/patrimonio.js) e o corte de 30% no financeiro. */
TO.i18n.registrar({
  /* =========================================================
     OS AVISOS DO DOMÍNIO (dominio.js)
     ========================================================= */
  'Tomamos {bairro} ({cidade}) da {de}. O bairro agora é nosso.':
    {es:'Tomamos {bairro} ({cidade}) de la {de}. El barrio ahora es nuestro.', en:'We took {bairro} ({cidade}) from {de}. The neighborhood is ours now.'},
  '{bairro} ({cidade}) passou de 50% pra nós. O bairro agora é nosso.':
    {es:'{bairro} ({cidade}) pasó del 50% para nosotros. El barrio ahora es nuestro.', en:'{bairro} ({cidade}) went past 50% for us. The neighborhood is ours now.'},
  'Perdemos {bairro} ({cidade}) pra {para}.': {es:'Perdimos {bairro} ({cidade}) ante {para}.', en:'We lost {bairro} ({cidade}) to {para}.'},
  '{bairro} ({cidade}) caiu abaixo de 50% pra nós: o bairro está em disputa.':
    {es:'{bairro} ({cidade}) bajó del 50% para nosotros: el barrio está en disputa.', en:'{bairro} ({cidade}) dropped below 50% for us: the neighborhood is contested.'},
  'A {para} tomou {bairro}{de}.': {es:'{para} tomó {bairro}{de}.', en:'{para} took {bairro}{de}.'},
  ' da {de}': {es:' de {de}', en:' from {de}'},
  '{bairro} ficou sem dona: a {de} caiu abaixo de 50%.': {es:'{bairro} se quedó sin dueña: {de} bajó del 50%.', en:'{bairro} has no owner now: {de} dropped below 50%.'},
  'Dominamos {cidade} (a semana)': {es:'Dominamos {cidade} (la semana)', en:'We rule {cidade} (the week)'},
  'Sem o domínio de {cidade} (a semana)': {es:'Sin el dominio de {cidade} (la semana)', en:'Without ruling {cidade} (the week)'},
  'Dominamos {cidade}: {n} de {total} bairros são nossos. +0,1 de prestígio e de moral por dia.':
    {es:'Dominamos {cidade}: {n} de {total} barrios son nuestros. +0,1 de prestigio y de moral por día.', en:'We rule {cidade}: {n} of {total} neighborhoods are ours. +0.1 prestige and morale per day.'},
  'A {nome} domina {cidade} com {n} de {total} bairros.': {es:'{nome} domina {cidade} con {n} de {total} barrios.', en:'{nome} rules {cidade} with {n} of {total} neighborhoods.'},
  'Perdemos o domínio de {cidade}: agora ninguém tem mais bairros que todo mundo.':
    {es:'Perdimos el dominio de {cidade}: ahora nadie tiene más barrios que todos.', en:'We lost our rule over {cidade}: now nobody has more neighborhoods than everyone else.'},
  '{cidade} ficou sem dona: empate no número de bairros.': {es:'{cidade} se quedó sin dueña: empate en número de barrios.', en:'{cidade} has no ruler: tie in the number of neighborhoods.'},
  'bairro da {sigla} −30%': {es:'barrio de {sigla} −30%', en:'{sigla} neighborhood −30%'},
  'já teve ação social esta semana': {es:'ya hubo acción social esta semana', en:'there was already a community action this week'},
  'Esse bairro não é da nossa cidade.': {es:'Ese barrio no es de nuestra ciudad.', en:'That neighborhood is not in our city.'},
  'Ação social em {bairro}: a barra da torcida foi a {v}%.': {es:'Acción social en {bairro}: la barra de la hinchada llegó a {v}%.', en:'Community action in {bairro}: our bar went to {v}%.'},

  /* =========================================================
     A AÇÃO SOCIAL NO BAIRRO (acoes.js) E A COMPRA DO PONTO (patrimonio.js)
     ========================================================= */
  'Ação social no bairro': {es:'Acción social en el barrio', en:'Community action in the neighborhood'},
  'Bairro': {es:'Barrio', en:'Neighborhood'},
  'R$ 1.500; soma de 6 a 10% na barra do bairro escolhido — 1 por semana':
    {es:'R$ 1.500; suma de 6 a 10% en la barra del barrio elegido — 1 por semana', en:'R$ 1,500; adds 6 to 10% to the chosen neighborhood’s bar — 1 per week'},
  'sem bairros nesta cidade': {es:'sin barrios en esta ciudad', en:'no neighborhoods in this city'},
  'o melhor alvo é {nome}': {es:'el mejor objetivo es {nome}', en:'the best target is {nome}'},
  'todos os bairros já são nossos': {es:'todos los barrios ya son nuestros', en:'every neighborhood is already ours'},
  'Esse bairro não existe mais.': {es:'Ese barrio ya no existe.', en:'That neighborhood no longer exists.'},
  'zona {zona} · da {sigla} ({v}%) · nossa barra {n}%': {es:'zona {zona} · de {sigla} ({v}%) · nuestra barra {n}%', en:'{zona} zone · {sigla}’s ({v}%) · our bar {n}%'},
  'zona {zona} · sem dona · nossa barra {n}%': {es:'zona {zona} · sin dueña · nuestra barra {n}%', en:'{zona} zone · no owner · our bar {n}%'},
  'Onde a barra rende mais: o bairro sem dona e o de dona fraca.': {es:'Donde la barra rinde más: el barrio sin dueña y el de dueña débil.', en:'Where the bar gains most: neighborhoods with no owner or a weak one.'},
  'sem dona': {es:'sin dueña', en:'no owner'},
  'nosso ({v}%)': {es:'nuestro ({v}%)', en:'ours ({v}%)'},
  'da {sigla} ({v}%)': {es:'de {sigla} ({v}%)', en:'{sigla}’s ({v}%)'},
  'rende 30% menos': {es:'rinde 30% menos', en:'earns 30% less'},
  '{bairro} (zona {zona}) · {dona}': {es:'{bairro} (zona {zona}) · {dona}', en:'{bairro} ({zona} zone) · {dona}'},
  '{nota}: a festa rende 30% menos': {es:'{nota}: la fiesta rinde 30% menos', en:'{nota}: the party earns 30% less'},

  /* =========================================================
     O MAPA: O BRASIL, A LEGENDA, O CARTÃO E O QUADRO (mapa_brasil.js)
     ========================================================= */
  'Mapa': {es:'Mapa', en:'Map'},
  'Mapa do Brasil com as praças do jogo': {es:'Mapa de Brasil con las plazas del juego', en:'Map of Brazil with the game’s cities'},
  'a {nome} domina ({n} de {total} bairros)': {es:'{nome} domina ({n} de {total} barrios)', en:'{nome} rules ({n} of {total} neighborhoods)'},
  'ninguém domina': {es:'nadie domina', en:'nobody rules'},
  'Brasil — {regiao}': {es:'Brasil — {regiao}', en:'Brazil — {regiao}'},
  'Dominamos {cidade}: {n} de {total} bairros.': {es:'Dominamos {cidade}: {n} de {total} barrios.', en:'We rule {cidade}: {n} of {total} neighborhoods.'},
  'A {nome} domina {cidade}: {n} de {total} bairros.': {es:'{nome} domina {cidade}: {n} de {total} barrios.', en:'{nome} rules {cidade}: {n} of {total} neighborhoods.'},
  'Ninguém domina {cidade}: empate no topo, com {n} bairros.': {es:'Nadie domina {cidade}: empate arriba, con {n} barrios.', en:'Nobody rules {cidade}: tie at the top, with {n} neighborhoods.'},
  'Ninguém domina {cidade}.': {es:'Nadie domina {cidade}.', en:'Nobody rules {cidade}.'},
  'Dominar a cidade: +0,1 de prestígio e +0,1 de moral por dia.': {es:'Dominar la ciudad: +0,1 de prestigio y +0,1 de moral por día.', en:'Ruling the city: +0.1 prestige and +0.1 morale per day.'},
  'Somos uma das duas maiores da cidade e não dominamos: −0,1 de prestígio e −0,1 de moral por dia.':
    {es:'Somos una de las dos más grandes de la ciudad y no dominamos: −0,1 de prestigio y −0,1 de moral por día.', en:'We are one of the two biggest in the city and do not rule it: −0.1 prestige and −0.1 morale per day.'},
  'maior': {es:'la mayor', en:'biggest'},
  '2ª maior': {es:'2ª mayor', en:'2nd biggest'},
  'domina': {es:'domina', en:'rules'},
  '{n} de {total}': {es:'{n} de {total}', en:'{n} of {total}'},
  'Sem dona (ninguém passa de 50%)': {es:'Sin dueña (nadie pasa del 50%)', en:'No owner (nobody above 50%)'},
  'Loja da {nome}': {es:'Tienda de {nome}', en:'{nome} store'},
  'Subsede da {nome}': {es:'Subsede de {nome}', en:'{nome} branch'},
  'Subsede de fora da {nome}': {es:'Subsede de afuera de {nome}', en:'{nome} out-of-town branch'},
  'Clique num bairro do mapa.': {es:'Haga clic en un barrio del mapa.', en:'Click a neighborhood on the map.'},
  'Zona {zona} · {classe} · receita ×{m}': {es:'Zona {zona} · {classe} · ingresos ×{m}', en:'{zona} zone · {classe} · revenue ×{m}'},
  'O bairro é nosso ({v}%).': {es:'El barrio es nuestro ({v}%).', en:'The neighborhood is ours ({v}%).'},
  'A dona é a {nome} ({v}%).': {es:'La dueña es {nome} ({v}%).', en:'The owner is {nome} ({v}%).'},
  'Sem dona: ninguém passa de 50%.': {es:'Sin dueña: nadie pasa del 50%.', en:'No owner: nobody is above 50%.'},
  'É o bairro da sede da {nome}: quem não é da casa ganha metade aqui, e a casa se refaz até 80%.':
    {es:'Es el barrio de la sede de {nome}: quien no es de la casa gana la mitad aquí, y la casa se rehace hasta el 80%.', en:'This is {nome}’s headquarters neighborhood: outsiders gain half here, and the home side recovers up to 80%.'},
  'Os nossos pontos aqui rendem 30% menos: o bairro é da {nome}, rival.': {es:'Nuestros puntos aquí rinden 30% menos: el barrio es de {nome}, rival.', en:'Our places here earn 30% less: the neighborhood belongs to rival {nome}.'},
  'Ação social aqui ({valor})': {es:'Acción social aquí ({valor})', en:'Community action here ({valor})'},
  'Ver na cidade 3D': {es:'Ver en la ciudad 3D', en:'See it in the 3D city'},
  'Zona {zona}': {es:'Zona {zona}', en:'{zona} zone'},
  'em disputa': {es:'en disputa', en:'contested'},

  /* =========================================================
     O MAPA DO JOGO 3D (ferramentas/planta_html/mapa3d.js)
     ========================================================= */
  'Cidade': {es:'Ciudad', en:'City'},
  'Fechar o mapa': {es:'Cerrar el mapa', en:'Close the map'},
  'Afastar': {es:'Alejar', en:'Zoom out'},
  'A cidade inteira': {es:'La ciudad entera', en:'The whole city'},
  'Arraste pra mover · role pra aproximar · clique num bairro pra ver quem manda · dois cliques levam a câmera até lá':
    {es:'Arrastre para mover · ruede para acercar · haga clic en un barrio para ver quién manda · doble clic lleva la cámara hasta allí',
     en:'Drag to move · scroll to zoom · click a neighborhood to see who rules it · double-click takes the camera there'},
  'a sua sede': {es:'su sede', en:'your headquarters'},
  'onde a câmera está': {es:'dónde está la cámara', en:'where the camera is'},
  'A SUA SEDE': {es:'SU SEDE', en:'YOUR HQ'},
  'EM DISPUTA': {es:'EN DISPUTA', en:'CONTESTED'},
  'BAR QUEBRADO · {n} DIAS': {es:'BAR ROTO · {n} DÍAS', en:'BROKEN BAR · {n} DAYS'},
  'Montando o mapa de {cidade}…': {es:'Armando el mapa de {cidade}…', en:'Building the map of {cidade}…'},
  'as praças do jogo': {es:'las plazas del juego', en:'the game’s cities'},
  '· a praça de {cidade} (só o mapa: a cidade 3D continua a de agora)': {es:'· la plaza de {cidade} (solo el mapa: la ciudad 3D sigue siendo la de ahora)', en:'· {cidade} (map only: the 3D city stays the current one)'},
  '· a praça de {cidade}': {es:'· la plaza de {cidade}', en:'· {cidade}'},
  'Esta praça não tem planta desenhada: os bairros dela aparecem por zona.': {es:'Esta plaza no tiene plano dibujado: sus barrios aparecen por zona.', en:'This city has no drawn map: its neighborhoods are shown by zone.'}
});
