/* Dicionário da fatia "menu": a tela inicial, as Configurações, o
   cofre visto do menu, a seleção de torcida (os três passos) e o HTML
   estático do index.html. Ver docs/I18N.md. */
TO.i18n.registrar({
  /* ---------- menu principal (index.html) ---------- */
  'Organizada':      {es:'Organizada',      en:'Organizada'},
  '— desde 1997 —':  {es:'— desde 1997 —',  en:'— since 1997 —'},
  'Continuar':       {es:'Continuar',       en:'Continue'},
  'Novo jogo':       {es:'Nuevo juego',     en:'New game'},
  'Carregar jogo':   {es:'Cargar partida',  en:'Load game'},
  'Configurações':   {es:'Configuración',   en:'Settings'},
  'Conquistas':      {es:'Logros',          en:'Achievements'},
  'Créditos':        {es:'Créditos',        en:'Credits'},
  'v0.4.0 · o feed é o jogo': {es:'v0.4.0 · el feed es el juego', en:'v0.4.0 · the feed is the game'},

  /* ---------- configurações ---------- */
  'Idioma': {es:'Idioma', en:'Language'},
  'O idioma vale pro jogo inteiro neste navegador. As mensagens que um save já tinha continuam na língua em que foram escritas.':
    {es:'El idioma vale para todo el juego en este navegador. Los mensajes que una partida guardada ya tenía siguen en el idioma en que fueron escritos.',
     en:'The language applies to the whole game in this browser. Messages a saved game already had stay in the language they were written in.'},

  /* ---------- cofre visto do menu ---------- */
  'O save guardado não abriu — pode ser de outra versão do jogo.':
    {es:'La partida guardada no abrió: puede ser de otra versión del juego.',
     en:"The saved game didn't open — it may be from another version of the game."},
  'Não deu pra importar: {motivo}': {es:'No se pudo importar: {motivo}', en:"Couldn't import: {motivo}"},
  'Este navegador não guarda o save.': {es:'Este navegador no guarda la partida.', en:"This browser doesn't keep saved games."},
  'Nenhuma vaga ocupada neste navegador. Dá pra trazer um save de arquivo ou de texto aqui embaixo.':
    {es:'No hay ninguna ranura ocupada en este navegador. Puedes traer una partida desde un archivo o desde texto aquí abajo.',
     en:'No slot is in use in this browser. You can bring a save from a file or from text down here.'},
  'Autosave':  {es:'Autoguardado', en:'Autosave'},
  'Vaga {n}':  {es:'Ranura {n}',   en:'Slot {n}'},
  'semana {s} de {a}': {es:'semana {s} de {a}', en:'week {s} of {a}'},
  'Jogar':     {es:'Jugar',        en:'Play'},
  'Esse save não abriu — pode ser de outra versão.':
    {es:'Esa partida no abrió: puede ser de otra versión.', en:"That save didn't open — it may be from another version."},
  'De fora do navegador': {es:'Desde fuera del navegador', en:'From outside the browser'},
  'arquivo .json ou texto compactado': {es:'archivo .json o texto comprimido', en:'.json file or compressed text'},
  'De arquivo': {es:'Desde archivo', en:'From file'},
  'De texto':   {es:'Desde texto',   en:'From text'},
  'Cole o texto do save.': {es:'Pega el texto de la partida.', en:'Paste the save text.'},
  'Colar um save': {es:'Pegar una partida', en:'Paste a save'},
  'Não deu: {motivo}': {es:'No se pudo: {motivo}', en:"Didn't work: {motivo}"},
  'as vagas deste navegador': {es:'las ranuras de este navegador', en:"this browser's slots"},

  /* ---------- seleção de torcida ---------- */
  'Seleção de torcida':     {es:'Selección de barra',     en:'Choose your firm'},
  'O presidente da torcida':{es:'El presidente de la barra', en:"The firm's president"},
  'Selecionar torcida':     {es:'Elegir barra',           en:'Choose firm'},
  'Começar a partida':      {es:'Empezar la partida',     en:'Start the game'},
  'Voltar ao menu':         {es:'Volver al menú',         en:'Back to menu'},
  'escolha ao lado':        {es:'elige al lado',          en:'pick one alongside'},
  'passo 3 de 3 · {nome} · quem é o presidente':
    {es:'paso 3 de 3 · {nome} · quién es el presidente', en:"step 3 of 3 · {nome} · who's the president"},
  'passo 1 de 3 · país, liga e clube · {n} clubes em 10 países':
    {es:'paso 1 de 3 · país, liga y club · {n} clubes en 10 países', en:'step 1 of 3 · country, league and club · {n} clubs in 10 countries'},
  'passo 2 de 3 · {nome} · escolha a torcida':
    {es:'paso 2 de 3 · {nome} · elige la barra', en:'step 2 of 3 · {nome} · choose the firm'},
  'Você é o presidente da <b>{nome}</b>. É o seu boneco que desce nas cenas — quando ele estiver preso, ferido ou fora da escalação, você assume o membro mais forte que estiver de pé.':
    {es:'Eres el presidente de <b>{nome}</b>. Es tu muñeco el que baja a las escenas: cuando esté preso, herido o fuera de la convocatoria, controlas al miembro más fuerte que siga en pie.',
     en:"You are the president of <b>{nome}</b>. Your figure is the one who goes down into the scenes — when he's jailed, injured or left out, you take over the strongest member still standing."},
  'nome do presidente': {es:'nombre del presidente', en:"president's name"},
  'Sortear outro':      {es:'Sortear otro',          en:'Draw another'},
  'Onde você torce':    {es:'Dónde alientas',        en:'Where you support'},
  'País':  {es:'País',  en:'Country'},
  'Liga':  {es:'Liga',  en:'League'},
  'Clube': {es:'Club',  en:'Club'},
  '{n} clubes': {es:'{n} clubes', en:'{n} clubs'},
  'sem torcidas': {es:'sin barras', en:'no firms'},
  'sem torcida':  {es:'sin barra',  en:'no firm'},
  'clube ou cidade…': {es:'club o ciudad…', en:'club or city…'},
  '{cidade} - {uf} · fundada em {ano}': {es:'{cidade} - {uf} · fundada en {ano}', en:'{cidade} - {uf} · founded in {ano}'},
  'Escolha uma das torcidas acima pra ver a ficha.':
    {es:'Elige una de las barras de arriba para ver la ficha.', en:'Pick one of the firms above to see its sheet.'},
  'Divisão':          {es:'División',          en:'Division'},
  'Estádio':          {es:'Estadio',           en:'Stadium'},
  'Aliados / Rivais': {es:'Aliados / Rivales', en:'Allies / Rivals'},
  'Rivalidade máxima':{es:'Rivalidad máxima',  en:'Top rivalry'},

  /* ---------- a coluna de navegação ---------- */
  'Feed':           {es:'Feed',            en:'Feed'},
  'Financeiro':     {es:'Finanzas',        en:'Finances'},
  'Calendário':     {es:'Calendario',      en:'Calendar'},
  'Competições':    {es:'Competiciones',   en:'Competitions'},
  'Ranking':        {es:'Ranking',         en:'Ranking'},
  'Diplomacia':     {es:'Diplomacia',      en:'Diplomacy'},
  'Notícias':       {es:'Noticias',        en:'News'},
  'Jogo':           {es:'Partida',         en:'Game'},
  'Menu principal': {es:'Menú principal',  en:'Main menu'},

  /* ---------- o dia de jogo e o relatório (index.html) ---------- */
  'Velocidade da cena': {es:'Velocidad de la escena', en:'Scene speed'},
  'PM': {es:'Policía', en:'Police'},
  'Soltar o E na hora do golpe é o contragolpe':
    {es:'Soltar la E en el momento del golpe es el contragolpe', en:'Releasing E right as the blow lands is the counter'},
  'Bater':    {es:'Golpear',  en:'Hit'},
  '· Defender':{es:'· Defender', en:'· Block'},
  '· Agarrar': {es:'· Agarrar',  en:'· Grab'},
  '· Chamar':  {es:'· Llamar',   en:'· Rally'},
  'Pedra':    {es:'Piedra',   en:'Stone'},
  'Bomba':    {es:'Bomba',    en:'Bomb'},
  'Recuar':   {es:'Retroceder', en:'Fall back'},
  'Fugir':    {es:'Huir',     en:'Flee'},
  'Entrar pelo portão': {es:'Entrar por el portón', en:'Go in through the gate'},
  'Fim da noite':       {es:'Fin de la noche',     en:'End of the night'},
  'Voltar pra sede':    {es:'Volver a la sede',    en:'Back to HQ'},
  'Retrospectiva':      {es:'Resumen del año',     en:'Year in review'}
});
