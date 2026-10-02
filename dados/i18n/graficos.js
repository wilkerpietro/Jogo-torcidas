/* Dicionário da fatia "gráficos" — ver docs/I18N.md.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}.
   Cobre o menu Gráficos do jogo 3D (pedido do dono, 30/09/2026: "crie
   mecanismos de melhorar o FPS em computadores fracos, em um menu de
   configuração de gráfico"): o painel em js/ui/graficos.js, o item da
   coluna e as Configurações do menu em js/main.js e o aviso da primeira
   vez sem placa de vídeo (ferramentas/planta_html/jogo3d.js). */
TO.i18n.registrar({
  /* =========================================================
     O PAINEL (graficos.js)
     ========================================================= */
  'Gráficos': {es:'Gráficos', en:'Graphics'},
  'Predefinição': {es:'Preajuste', en:'Preset'},
  'Personalizada': {es:'Personalizado', en:'Custom'},
  'Mínima': {es:'Mínima', en:'Lowest'},
  'Leve': {es:'Ligera', en:'Light'},
  'Normal': {es:'Normal', en:'Normal'},
  'Alta': {es:'Alta', en:'High'},
  'Recomendada pra este computador: {p}.': {es:'Recomendado para esta computadora: {p}.', en:'Recommended for this computer: {p}.'},
  'Quando a textura muda junto, a cidade monta de novo.': {es:'Cuando la textura cambia también, la ciudad se arma de nuevo.', en:'When the textures change too, the city is rebuilt.'},
  'Voltar ao recomendado': {es:'Volver a lo recomendado', en:'Back to recommended'},
  '{p}% da resolução': {es:'{p}% de la resolución', en:'{p}% resolution'},
  '(a cidade está parada atrás de outra tela)': {es:'(la ciudad está detenida detrás de otra pantalla)', en:'(the city is paused behind another screen)'},
  'Sem placa de vídeo: o navegador desenha no processador ({placa}).': {es:'Sin tarjeta de video: el navegador dibuja con el procesador ({placa}).', en:'No graphics card: the browser is drawing on the processor ({placa}).'},

  'Resolução da imagem': {es:'Resolución de la imagen', en:'Image resolution'},
  'Automática': {es:'Automática', en:'Automatic'},
  'É o que mais pesa sem placa de vídeo: menos resolução deixa a imagem borrada e o jogo muito mais leve. A automática desce e sobe sozinha atrás do fps escolhido embaixo.':
    {es:'Es lo que más pesa sin tarjeta de video: menos resolución deja la imagen borrosa y el juego mucho más liviano. La automática baja y sube sola para alcanzar los fps elegidos abajo.',
     en:'This is the heaviest part without a graphics card: lower resolution makes the image blurry and the game much lighter. Automatic goes down and up by itself to reach the fps chosen below.'},
  'A automática mira em': {es:'La automática apunta a', en:'Automatic aims for'},

  'Suavizar as bordas': {es:'Suavizar los bordes', en:'Smooth the edges'},
  'Automático': {es:'Automático', en:'Automatic'},
  'Tira o serrilhado das bordas; sem placa de vídeo custa caro (o automático desliga). Só vale quando o jogo abrir de novo.':
    {es:'Quita el serrucho de los bordes; sin tarjeta de video cuesta caro (el automático lo apaga). Solo vale cuando el juego se abra de nuevo.',
     en:'Removes jagged edges; without a graphics card it is expensive (automatic turns it off). Only applies when the game opens again.'},
  'Liga quando o jogo abrir de novo (recarregue a página).': {es:'Se enciende cuando el juego se abra de nuevo (recargue la página).', en:'Turns on when the game opens again (reload the page).'},
  'Desliga quando o jogo abrir de novo (recarregue a página).': {es:'Se apaga cuando el juego se abra de nuevo (recargue la página).', en:'Turns off when the game opens again (reload the page).'},

  'Limite de fps': {es:'Límite de fps', en:'Fps limit'},
  'Sem limite': {es:'Sin límite', en:'No limit'},
  'Não aumenta o fps: deixa o processador livre pro resto do jogo e esquenta menos o computador.':
    {es:'No aumenta los fps: deja el procesador libre para el resto del juego y calienta menos la computadora.',
     en:'It does not raise the fps: it leaves the processor free for the rest of the game and keeps the computer cooler.'},

  'Iluminação': {es:'Iluminación', en:'Lighting'},
  'Completa': {es:'Completa', en:'Full'},
  'Simples': {es:'Simple', en:'Simple'},
  'A simples faz a conta da luz nos cantos de cada face, e não em cada pixel: nas paredes e no chão fica igual. Ganho pequeno, uns 6 a 10%.':
    {es:'La simple calcula la luz en las esquinas de cada cara y no en cada píxel: en las paredes y el piso queda igual. Ganancia pequeña, un 6 a 10%.',
     en:'Simple computes the light at the corners of each face instead of every pixel: walls and floors look the same. Small gain, about 6 to 10%.'},

  'Luzes da noite': {es:'Luces de la noche', en:'Night lights'},
  'Acesas': {es:'Encendidas', en:'On'},
  'Apagadas': {es:'Apagadas', en:'Off'},
  'Os postes, os refletores, as janelas e os cômodos acesos. Apagadas, a noite fica só escura (uns 10% mais leve).':
    {es:'Los postes, los reflectores, las ventanas y las habitaciones encendidas. Apagadas, la noche queda solo oscura (un 10% más liviano).',
     en:'Street lamps, floodlights, windows and lit rooms. Off, the night is just dark (about 10% lighter).'},

  'Distância de visão': {es:'Distancia de visión', en:'View distance'},
  'Longe': {es:'Lejos', en:'Far'},
  'Média': {es:'Media', en:'Medium'},
  'Perto': {es:'Cerca', en:'Near'},
  'Com a câmera longe (a cidade vista de cima), a névoa chega antes e menos quarteirões são desenhados.':
    {es:'Con la cámara lejos (la ciudad vista desde arriba), la niebla llega antes y se dibujan menos manzanas.',
     en:'With the camera far away (the city seen from above), the fog comes sooner and fewer blocks are drawn.'},

  'Gente na rua': {es:'Gente en la calle', en:'People on the street'},
  'Muita': {es:'Mucha', en:'Many'},
  'Pouca': {es:'Poca', en:'Few'},

  'Bonecos': {es:'Muñecos', en:'Characters'},
  'Detalhados': {es:'Detallados', en:'Detailed'},
  'Leves': {es:'Livianos', en:'Light'},
  'Leves: todo mundo com o modelo de longe, menos o seu líder.': {es:'Livianos: todos con el modelo de lejos, menos tu líder.', en:'Light: everyone uses the far model, except your leader.'},

  'Texturas': {es:'Texturas', en:'Textures'},
  'O chão, os letreiros e a nitidez deles vistos de lado. Trocar monta a cidade de novo.':
    {es:'El piso, los carteles y su nitidez vistos de costado. Cambiarlo arma la ciudad de nuevo.',
     en:'The ground, the signs and how sharp they look from the side. Changing it rebuilds the city.'},

  'Medidor de fps': {es:'Medidor de fps', en:'Fps meter'},
  'Mostrar': {es:'Mostrar', en:'Show'},
  'Esconder': {es:'Ocultar', en:'Hide'},

  /* =========================================================
     AS CONFIGURAÇÕES DO MENU (main.js) E O AVISO (jogo3d.js)
     ========================================================= */
  'Abrir as opções de gráfico': {es:'Abrir las opciones de gráficos', en:'Open the graphics options'},
  'A resolução, a suavização, a luz, a gente na rua e as texturas da cidade em 3D. No computador sem placa de vídeo, é aqui que o jogo fica leve.':
    {es:'La resolución, el suavizado, la luz, la gente en la calle y las texturas de la ciudad en 3D. En la computadora sin tarjeta de video, aquí es donde el juego se vuelve liviano.',
     en:'Resolution, smoothing, lighting, people on the street and the textures of the 3D city. On a computer without a graphics card, this is where the game gets light.'},
  'Sem placa de vídeo: os gráficos começaram no mínimo. Dá pra mudar em <b>Gráficos</b>, no menu da esquerda.':
    {es:'Sin tarjeta de video: los gráficos empezaron en el mínimo. Se puede cambiar en <b>Gráficos</b>, en el menú de la izquierda.',
     en:'No graphics card: the graphics started at the lowest setting. You can change it in <b>Graphics</b>, in the left menu.'}
});
