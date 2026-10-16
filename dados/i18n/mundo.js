/* Dicionário da fatia "mundo" — ver docs/I18N.md.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}. */
TO.i18n.registrar({
  /* ======================================================
     relacoes.js — o balanço e o extrato das outras torcidas
     ====================================================== */
  '{ano} s{semana}':             {es:'{ano} s{semana}',              en:'{ano} w{semana}'},
  'Mensalidades ({n})':            {es:'Cuotas ({n})',                  en:'Dues ({n})'},
  'Bar — {bairro} (n{nivel})':     {es:'Bar — {bairro} (n{nivel})',     en:'Bar — {bairro} (L{nivel})'},
  'Bar (n{nivel})':                {es:'Bar (n{nivel})',                en:'Bar (L{nivel})'},
  ' · quebrado, {d} d':            {es:' · roto, {d} d',                en:' · smashed, {d} d'},
  'Loja — {bairro} (n{nivel})':    {es:'Tienda — {bairro} (n{nivel})',  en:'Shop — {bairro} (L{nivel})'},
  'Loja (n{nivel})':               {es:'Tienda (n{nivel})',             en:'Shop (L{nivel})'},
  ' · fábrica':                    {es:' · fábrica',                    en:' · factory'},
  'Subsede — {bairro}':            {es:'Subsede — {bairro}',            en:'Branch — {bairro}'},
  'Subsede':                       {es:'Subsede',                       en:'Branch'},
  'Subsede — {cidade} (n{nivel})': {es:'Subsede — {cidade} (n{nivel})', en:'Branch — {cidade} (L{nivel})'},
  'Manutenção da sede (n{n})':     {es:'Mantenimiento de la sede (n{n})', en:'HQ upkeep (L{n})'},
  'Manutenção do comércio':        {es:'Mantenimiento de los negocios', en:'Business upkeep'},
  'Insumos das lojas':             {es:'Insumos de las tiendas',        en:'Shop supplies'},
  'Insumos das lojas · fábrica':   {es:'Insumos de las tiendas · fábrica', en:'Shop supplies · factory'},
  'Ônibus da torcida':             {es:'Micros de la barra',            en:"The firm's buses"},
  'Professores de MMA':            {es:'Profesores de MMA',             en:'MMA coaches'},
  'Advogados':                     {es:'Abogados',                      en:'Lawyers'},
  'Recepção de aliados ({n})':     {es:'Recepción de aliados ({n})',    en:'Hosting allies ({n})'},
  'Enfermaria da sede':            {es:'Enfermería de la sede',         en:'HQ infirmary'},
  'Galpão de material':            {es:'Galpón de material',            en:'Gear warehouse'},
  'Ampliação da sede':             {es:'Ampliación de la sede',         en:'HQ expansion'},
  'Bar novo':                      {es:'Bar nuevo',                     en:'New bar'},
  'Loja nova':                     {es:'Tienda nueva',                  en:'New shop'},
  'Subsede nova':                  {es:'Subsede nueva',                 en:'New branch'},
  'Subsede em outra cidade':       {es:'Subsede en otra ciudad',        en:'Branch in another city'},
  'Investimento no clube':         {es:'Inversión en el club',          en:'Investment in the club'},
  'Ônibus novo':                   {es:'Micro nuevo',                   en:'New bus'},
  'Bombas ×5':                     {es:'Bombas ×5',                     en:'Bombs ×5'},
  'Fábrica de material':           {es:'Fábrica de material',           en:'Gear factory'},
  'Cofre blindado':                {es:'Caja fuerte blindada',          en:'Armoured safe'},
  'Área de treino ampliada':       {es:'Área de entrenamiento ampliada', en:'Bigger training area'},
  'Ampliação do bar':              {es:'Ampliación del bar',            en:'Bar expansion'},
  'Ampliação da loja':             {es:'Ampliación de la tienda',       en:'Shop expansion'},
  'Ampliação da subsede':          {es:'Ampliación de la subsede',      en:'Branch expansion'},
  'Ampliação da filial':           {es:'Ampliación de la filial',       en:'Branch expansion'},
  'Ampliar a sede':                {es:'Ampliar la sede',               en:'Expand the HQ'},
  'Abrir uma loja':                {es:'Abrir una tienda',              en:'Open a shop'},
  'Abrir um bar':                  {es:'Abrir un bar',                  en:'Open a bar'},
  'Abrir subsede em outra cidade': {es:'Abrir subsede en otra ciudad',  en:'Open a branch in another city'},
  'torcida fora do mundo':         {es:'barra fuera del mundo',         en:'firm outside the world'},
  'sede nível {n}':                {es:'sede nivel {n}',                en:'HQ level {n}'},
  'a sede dela já é o Complexo (nível 6)':
    {es:'su sede ya es el Complejo (nivel 6)', en:'their HQ is already the Complex (level 6)'},
  'a sede nível {s} dela banca {n} filial':
    {es:'su sede nivel {s} sostiene {n} filial', en:'their level {s} HQ supports {n} branch'},
  'a sede nível {s} dela banca {n} filiais':
    {es:'su sede nivel {s} sostiene {n} filiales', en:'their level {s} HQ supports {n} branches'},
  'a sede nível {s} dela ainda não banca filial':
    {es:'su sede nivel {s} todavía no sostiene filial', en:"their level {s} HQ can't support a branch yet"},
  'subsede em {cidade}':           {es:'subsede en {cidade}',           en:'branch in {cidade}'},
  'não há cidade com torcedor do clube dela sem subsede':
    {es:'no hay ciudad con hinchas de su club sin subsede', en:"there's no city with fans of their club and no branch"},
  'a sede nível {s} dela não comporta mais bares':
    {es:'su sede nivel {s} no admite más bares', en:"their level {s} HQ can't take more bars"},
  'a sede nível {s} dela não comporta bar':
    {es:'su sede nivel {s} no admite bar', en:"their level {s} HQ can't take a bar"},
  'a sede nível {s} dela não comporta mais lojas':
    {es:'su sede nivel {s} no admite más tiendas', en:"their level {s} HQ can't take more shops"},
  'a sede nível {s} dela não comporta loja':
    {es:'su sede nivel {s} no admite tienda', en:"their level {s} HQ can't take a shop"},
  'bar novo':                      {es:'bar nuevo',                     en:'new bar'},
  'loja nova':                     {es:'tienda nueva',                  en:'new shop'},
  'Presente da {nome}: {rot}':     {es:'Regalo de {nome}: {rot}',       en:'Gift from {nome}: {rot}'},
  'Semana — comércio, folhas e manutenção':
    {es:'Semana — negocios, sueldos y mantenimiento', en:'Week — business, wages and upkeep'},
  'Caravana — jogo fora ({n} cabeças)':
    {es:'Caravana — partido de visitante ({n} cabezas)', en:'Away trip — away match ({n} heads)'},
  'Caravana da subsede ({n} cabeças)':
    {es:'Caravana de la subsede ({n} cabezas)', en:'Branch away trip ({n} heads)'},
  'Loja vendida — 30 dias no vermelho':
    {es:'Tienda vendida — 30 días en rojo', en:'Shop sold — 30 days in the red'},
  'Faixa nova':                    {es:'Trapo nuevo',                   en:'New banner'},
  'Bandeira nova':                 {es:'Bandera nueva',                 en:'New flag'},
  'Promoção de {n} a {cargo}':     {es:'Ascenso de {n} a {cargo}',      en:'{n} promoted to {cargo}'},
  'Recepção da {nome} ({n} cabeças)':
    {es:'Recepción de {nome} ({n} cabezas)', en:'Hosting {nome} ({n} heads)'},
  'treta marcada':                 {es:'pelea pactada',                 en:'arranged brawl'},
  'ataque ao bar':                 {es:'ataque al bar',                 en:'bar attack'},
  'ataque-surpresa':               {es:'ataque sorpresa',               en:'surprise attack'},
  'emboscada na estrada':          {es:'emboscada en la ruta',          en:'ambush on the road'},
  'Bar saqueado pela {nome}':      {es:'Bar saqueado por {nome}',       en:'Bar looted by {nome}'},
  'Saque no bar da {nome}':        {es:'Saqueo en el bar de {nome}',    en:"Looting {nome}'s bar"},
  /* a situação financeira no ranking */
  'Endividado':                    {es:'Endeudada',                     en:'In debt'},
  'Muito ruim':                    {es:'Muy mal',                       en:'Very bad'},
  'Pobre':                         {es:'Pobre',                         en:'Poor'},
  'Estável':                       {es:'Estable',                       en:'Stable'},
  'Bem financeiramente':           {es:'Bien de plata',                 en:'Doing well'},
  'Rico':                          {es:'Rica',                          en:'Rich'},

  /* ======================================================
     eixos.js — os motivos da mesa e dos pedidos
     ====================================================== */
  '{quem} anda com a {aliada}, que é maior rival da {contra}':
    {es:'{quem} anda con {aliada}, que es archirrival de {contra}',
     en:'{quem} runs with {aliada}, the arch-rival of {contra}'},
  'não existe':                    {es:'no existe',                     en:"doesn't exist"},
  'já é do eixo':                  {es:'ya es del eje',                 en:'already in the axis'},
  'já está em dois eixos':         {es:'ya está en dos ejes',           en:'already in two axes'},
  'saiu há pouco desse eixo':      {es:'salió hace poco de ese eje',    en:'left this axis recently'},
  'a {nome} é de outro país':      {es:'{nome} es de otro país',        en:'{nome} is from another country'},
  'maior rival da {nome}':         {es:'archirrival de {nome}',         en:'arch-rival of {nome}'},
  'rival da {nome}':               {es:'rival de {nome}',               en:'rival of {nome}'},
  'aliada de só {n} de {total}':   {es:'aliada de solo {n} de {total}', en:'allied with only {n} of {total}'},
  'irmã da {nome}, maior rival do eixo':
    {es:'hermana de {nome}, archirrival del eje', en:"sister firm of {nome}, the axis's arch-rival"},
  'o {eixo} ficaria com {n} em comum com o {outro}':
    {es:'{eixo} quedaría con {n} en común con {outro}', en:'{eixo} would share {n} members with {outro}'},
  'já pedimos nesta reunião':      {es:'ya pedimos en esta reunión',    en:'we already asked in this meeting'},
  'torcida desconhecida':          {es:'barra desconocida',             en:'unknown firm'},
  'esse pedido não cabe':          {es:'ese pedido no corresponde',     en:"that request doesn't fit"},
  'A {aliado} topou e sentou com a {alvo}: a relação entre as duas subiu {n}.':
    {es:'{aliado} aceptó y se sentó con {alvo}: la relación entre las dos subió {n}.',
     en:'{aliado} agreed and sat down with {alvo}: the relationship between them rose {n}.'},
  'A {aliado} topou e se afastou da {alvo}: a relação entre as duas caiu {n}.':
    {es:'{aliado} aceptó y se alejó de {alvo}: la relación entre las dos bajó {n}.',
     en:'{aliado} agreed and pulled away from {alvo}: the relationship between them fell {n}.'},
  'A {aliado} não topou: "isso é problema nosso". A relação com ela caiu {n}.':
    {es:'{aliado} no aceptó: "eso es problema nuestro". La relación con ellos bajó {n}.',
     en:'{aliado} said no: "that\'s our business". Our relationship with them fell {n}.'},
  'a gente já é do eixo':          {es:'ya somos del eje',              en:"we're already in the axis"},
  'a gente já está em dois eixos': {es:'ya estamos en dos ejes',        en:"we're already in two axes"},
  'a gente é irmã da {nome}, maior rival do eixo':
    {es:'somos hermanos de {nome}, archirrival del eje', en:"we're the sister firm of {nome}, the axis's arch-rival"},
  'disseram não — voltam a ouvir em {n} semana':
    {es:'dijeron que no — vuelven a escuchar en {n} semana', en:"they said no — they'll listen again in {n} week"},
  'disseram não — voltam a ouvir em {n} semanas':
    {es:'dijeron que no — vuelven a escuchar en {n} semanas', en:"they said no — they'll listen again in {n} weeks"},
  'o nome precisa de pelo menos 3 letras':
    {es:'el nombre necesita al menos 3 letras', en:'the name needs at least 3 letters'},
  'nome comprido demais':          {es:'nombre demasiado largo',        en:'name too long'},
  'já existe um eixo com esse nome':
    {es:'ya existe un eje con ese nombre', en:'there is already an axis with that name'},
  '{a} e {b} são maiores rivais':  {es:'{a} y {b} son archirrivales',   en:'{a} and {b} are arch-rivals'},
  '{a} e {b} são rivais':          {es:'{a} y {b} son rivales',         en:'{a} and {b} are rivals'},
  'a mesa só senta de novo em {n} semana':
    {es:'la mesa recién se vuelve a sentar en {n} semana', en:"the table won't sit again for {n} week"},
  'a mesa só senta de novo em {n} semanas':
    {es:'la mesa recién se vuelve a sentar en {n} semanas', en:"the table won't sit again for {n} weeks"},
  'um eixo nasce com {n}: chame pelo menos {m}':
    {es:'un eje nace con {n}: llama al menos a {m}', en:'an axis starts with {n}: invite at least {m}'},
  'só {n} topou — um eixo nasce com {min}':
    {es:'solo {n} aceptó — un eje nace con {min}', en:'only {n} agreed — an axis starts with {min}'},
  'só {n} toparam — um eixo nasce com {min}':
    {es:'solo {n} aceptaron — un eje nace con {min}', en:'only {n} agreed — an axis starts with {min}'},
  'não rolou':                     {es:'no salió',                      en:"it didn't happen"},
  'esse eixo não existe':          {es:'ese eje no existe',             en:"that axis doesn't exist"},
  'esse eixo não é nosso':         {es:'ese eje no es nuestro',         en:"that axis isn't ours"},
  'eles disseram não faz pouco — voltam a ouvir em {n} semana':
    {es:'dijeron que no hace poco — vuelven a escuchar en {n} semana', en:"they said no recently — they'll listen again in {n} week"},
  'eles disseram não faz pouco — voltam a ouvir em {n} semanas':
    {es:'dijeron que no hace poco — vuelven a escuchar en {n} semanas', en:"they said no recently — they'll listen again in {n} weeks"},
  'o eixo já chamou alguém: o próximo nome sai em {n} dia':
    {es:'el eje ya llamó a alguien: el próximo nombre sale en {n} día', en:'the axis already invited someone: the next name comes in {n} day'},
  'o eixo já chamou alguém: o próximo nome sai em {n} dias':
    {es:'el eje ya llamó a alguien: el próximo nombre sale en {n} días', en:'the axis already invited someone: the next name comes in {n} days'},

  /* ======================================================
     competicoes.js / ligas.js / lnt.js / relacaoclube.js
     ====================================================== */
  'O elenco já está no teto.':     {es:'El plantel ya está en el tope.', en:'The squad is already maxed out.'},
  'Não dá: falta caixa.':          {es:'No se puede: falta caja.',       en:"Can't do it: not enough cash."},
  'Reforço no elenco do {time}':   {es:'Refuerzo en el plantel de {time}', en:'Squad boost for {time}'},
  'A torcida reforçou o elenco do {time}: +{n} de força.':
    {es:'La barra reforzó el plantel de {time}: +{n} de fuerza.', en:'The firm boosted the {time} squad: +{n} strength.'},
  '{time}: +{n} de força':         {es:'{time}: +{n} de fuerza',        en:'{time}: +{n} strength'},
  'campo neutro':                  {es:'cancha neutral',                en:'neutral ground'},
  'Regionais e estaduais':         {es:'Regionales y estaduales',       en:'Regional and state leagues'},
  'Rodada {n}':                    {es:'Fecha {n}',                     en:'Round {n}'},
  /* ligas.js — como o campeonato do país fechou */
  'campeão dos dois torneios':     {es:'campeón de los dos torneos',    en:'won both tournaments'},
  'playoff do título':             {es:'repechaje por el título',       en:'title play-off'},
  'Série Final':                   {es:'Serie Final',                   en:'Final Series'},
  'final do campeonato':           {es:'final del campeonato',          en:'championship final'},
  'campeão do Clausura · Campeão de Liga pela anual':
    {es:'campeón del Clausura · Campeón de Liga por la tabla anual', en:'Clausura champion · League Champion on the season table'},
  'campeão do torneio':            {es:'campeón del torneo',            en:'tournament champion'},
  /* lnt.js — o prêmio no extrato */
  'LNT · {rot}':                   {es:'LNT · {rot}',                   en:'LNT · {rot}'},
  'campeão':                       {es:'campeón',                       en:'champion'},
  'vice':                          {es:'subcampeón',                    en:'runner-up'},
  /* relacaoclube.js — as faixas e o livro da relação com o clube */
  'ruim':                          {es:'mala',                          en:'bad'},
  'morna':                         {es:'tibia',                         en:'lukewarm'},
  'boa':                           {es:'buena',                         en:'good'},
  'ótima':                         {es:'excelente',                     en:'great'},
  'Casa cheia: {pct}% dos membros no estádio':
    {es:'Casa llena: {pct}% de los miembros en el estadio', en:'Full house: {pct}% of members at the ground'},
  'Caravana forte: {pct}% dos membros na viagem':
    {es:'Caravana fuerte: {pct}% de los miembros en el viaje', en:'Strong away trip: {pct}% of members travelled'},
  'Briga na arquibancada, jogo em casa':
    {es:'Pelea en la tribuna, partido de local', en:'Fight in the stands, home match'},
  'Briga na arquibancada, jogo fora':
    {es:'Pelea en la tribuna, partido de visitante', en:'Fight in the stands, away match'},
  'Briga nos arredores do estádio, jogo em casa':
    {es:'Pelea en los alrededores del estadio, partido de local', en:'Fight around the stadium, home match'},
  'Briga nos arredores do estádio, jogo fora':
    {es:'Pelea en los alrededores del estadio, partido de visitante', en:'Fight around the stadium, away match'},

  /* ======================================================
     VALORES DE DADO QUE OUTROS MÓDULOS MOSTRAM COM _t(valor)
     (o código guarda e compara em português; a tradução é na tela)
     ====================================================== */
  /* as zonas da cidade (bairro.zona, mundo.ZONAS) */
  'Norte': {es:'Norte', en:'North'},
  'Sul':   {es:'Sur',   en:'South'},
  'Leste': {es:'Este',  en:'East'},
  'Oeste': {es:'Oeste', en:'West'},
  'Zona Norte': {es:'Zona Norte', en:'North Side'},
  'Zona Sul':   {es:'Zona Sur',   en:'South Side'},
  'Zona Leste': {es:'Zona Este',  en:'East Side'},
  'Zona Oeste': {es:'Zona Oeste', en:'West Side'},
  /* as regiões do Brasil (torcida.regiao, cidade.regiao) */
  'Sudeste':      {es:'Sudeste',      en:'Southeast'},
  'Nordeste':     {es:'Nordeste',     en:'Northeast'},
  'Centro-Oeste': {es:'Centro-Oeste', en:'Centre-West'},
  /* a classe do bairro (bairro.classe, mundo.CLASSES) */
  'Nobre':        {es:'Acomodado',    en:'Upmarket'},
  'Classe Alta':  {es:'Clase Alta',   en:'Upper Class'},
  'Classe Média': {es:'Clase Media',  en:'Middle Class'},
  'Classe Baixa': {es:'Clase Baja',   en:'Working Class'},
  'Favela':       {es:'Favela',       en:'Favela'},
  /* o tamanho da praça (cidade.tamanho) */
  'Grande':  {es:'Grande',  en:'Large'},
  'Médio':   {es:'Mediana', en:'Medium'},
  'Pequeno': {es:'Pequeña', en:'Small'},
  /* o status da relação (mundo.statusDoValor / relacaoBase; os com
     maiúscula moram no comum.js) e o rótulo visto do vigia */
  'aliado':    {es:'aliado',    en:'ally'},
  'aliada':    {es:'aliada',    en:'ally'},
  'rival':     {es:'rival',     en:'rival'},
  'neutro':    {es:'neutral',   en:'neutral'},
  'neutra':    {es:'neutral',   en:'neutral'},
  'irmandade': {es:'hermandad', en:'brotherhood'},
  'Aliada':    {es:'Aliada',    en:'Ally'},
  'Neutra':    {es:'Neutral',   en:'Neutral'},
  'Hostil':    {es:'Hostil',    en:'Hostile'},
  'hostil':    {es:'hostil',    en:'hostile'},
  /* as divisões da LNT (lnt.FORMATO[].nome) */
  '1ª Divisão': {es:'1.ª División', en:'1st Division'},
  '2ª Divisão': {es:'2.ª División', en:'2nd Division'},
  '3ª Divisão': {es:'3.ª División', en:'3rd Division'},
  '4ª Divisão': {es:'4.ª División', en:'4th Division'},
  /* os torneios das ligas de fora (ligas.FORMATOS[].torneios) — nome
     próprio que já é espanhol; o inglês mantém */
  'Apertura':      {es:'Apertura',      en:'Apertura'},
  'Clausura':      {es:'Clausura',      en:'Clausura'},
  'Finalización':  {es:'Finalización',  en:'Finalización'},
  'Intermedio':    {es:'Intermedio',    en:'Intermedio'},
  'Apertura B':    {es:'Apertura B',    en:'Apertura B'},
  'Finalización B':{es:'Finalización B',en:'Finalización B'},

  /* @@RESTO@@ */
});

/* ======================================================
   AS FASES DAS COMPETIÇÕES — competicoes.js, conmebol.js,
   ligas.js e lnt.js guardam o nome da fase em português e o
   comparam (=== 'Final', /Campeão/…); quem mostra traduz com
   _t(fase). Aqui entram TODAS as formas que o código produz: a
   fase pura, com " · ida"/" · volta" (e "(ida)"/"(volta)", que o
   feed monta), em minúscula, e as numeradas ("Fecha 3",
   "3ª rodada", "Grupos · 3ª rodada", "Rodada 3", "12 clubes").
   ====================================================== */
(function(){
  const FASES = {
    'Primeira fase':    {es:'Primera fase',             en:'First round'},
    'Segunda fase':     {es:'Segunda fase',             en:'Second round'},
    'Terceira fase':    {es:'Tercera fase',             en:'Third round'},
    'Fase Preliminar':  {es:'Fase preliminar',          en:'Preliminary round'},
    'Fase 1':           {es:'Fase 1',                   en:'Stage 1'},
    'Fase 2':           {es:'Fase 2',                   en:'Stage 2'},
    'Fase 3':           {es:'Fase 3',                   en:'Stage 3'},
    'Prévia':           {es:'Fase previa',              en:'Qualifying'},
    'Grupos':           {es:'Grupos',                   en:'Groups'},
    'Fase de grupos':   {es:'Fase de grupos',           en:'Group stage'},
    'Fase de chaves':   {es:'Fase de grupos',           en:'Group stage'},
    'Playoff':          {es:'Repechaje',                en:'Play-off'},
    'Playoff do acesso':{es:'Repechaje por el ascenso', en:'Promotion play-off'},
    '32-avos':          {es:'Treintaidosavos de final', en:'Round of 64'},
    '16-avos':          {es:'Dieciseisavos de final',   en:'Round of 32'},
    'Oitavas':          {es:'Octavos de final',         en:'Round of 16'},
    'Quartas':          {es:'Cuartos de final',         en:'Quarter-finals'},
    'Semifinal':        {es:'Semifinal',                en:'Semi-finals'},
    'Final':            {es:'Final',                    en:'Final'},
    'Campeão':          {es:'Campeón',                  en:'Champion'},
    'Vice':             {es:'Subcampeón',               en:'Runner-up'}
  };
  const t = {};
  const minuscula = s => s.charAt(0).toLowerCase() + s.slice(1);
  const pernas = (pt, v) => {
    t[pt] = v;
    t[`${pt} · ida`]   = {es:`${v.es} · ida`,    en:`${v.en} · 1st leg`};
    t[`${pt} · volta`] = {es:`${v.es} · vuelta`, en:`${v.en} · 2nd leg`};
    t[`${pt} (ida)`]   = {es:`${v.es} (ida)`,    en:`${v.en} (1st leg)`};
    t[`${pt} (volta)`] = {es:`${v.es} (vuelta)`, en:`${v.en} (2nd leg)`};
  };
  for(const pt in FASES){
    const v = FASES[pt];
    pernas(pt, v);
    const pm = minuscula(pt);
    if(pm !== pt && !t[pm]) pernas(pm, {es:minuscula(v.es), en:minuscula(v.en)});
  }
  for(let n = 1; n <= 64; n++){
    t[`Fecha ${n}`]              = {es:`Fecha ${n}`,             en:`Matchday ${n}`};
    t[`Rodada ${n}`]             = {es:`Fecha ${n}`,             en:`Round ${n}`};
    t[`${n}ª rodada`]            = {es:`${n}.ª fecha`,           en:`Round ${n}`};
    t[`Grupos · ${n}ª rodada`]   = {es:`Grupos · ${n}.ª fecha`,  en:`Groups · round ${n}`};
    /* chave que não fecha em potência de 2 vira "N clubes" */
    pernas(`${n} clubes`, {es:`Ronda de ${n}`, en:`Round of ${n}`});
  }
  TO.i18n.registrar(t);
})();
