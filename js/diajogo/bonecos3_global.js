/* =========================================================
   O BONECO DO CENÁRIO 3D NO JOGO (27/09/2026)

   O jogo de feed desenha o boneco da briga pelo `TO.diaJogo.bonecos3`
   (a ponte: montar / desenharDeCima / limparDeCima / ativo; o main.js:
   fotoDoTrofeu), que no Pages é o arquivo clássico com o Three r147
   global. Aqui o mesmo nome aponta pro módulo do cenário (bonecos3.js,
   Three r160 como módulo): os dois níveis afinados, os jeitos do dia de
   jogo e as poses da reunião — um boneco só pro jogo inteiro. As
   bancadas (arredores.html, bonecos.html) seguem com o clássico
   (bonecos3_classico.js), que é a cópia do Pages.

   Módulo carrega depois dos scripts clássicos, antes do
   DOMContentLoaded: quem usa (a ponte, numa cena aberta pelo jogador)
   chega muito depois.
   ========================================================= */
import { montar, desenharDeCima, desenharVitrine, limparDeCima, fotoDoTrofeu, fotoDaBriga, fotoDaCena, perdeu, bonecos } from './bonecos3.js';

window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};
/* (as fotos dos posts da rede social — a da briga e a do post, cartaz.js —
   e o canvas que perdeu o contexto, main.js: vieram do jogo 2D, 06/10/2026) */
TO.diaJogo.bonecos3 = {
  montar, desenharDeCima, desenharVitrine, limparDeCima, fotoDoTrofeu, fotoDaBriga, fotoDaCena, perdeu,
  get ativo(){ return bonecos.ativo; },
  get escalaDeCima(){ return bonecos.escala; },
  set escalaDeCima(v){ bonecos.escala = v; }
};
