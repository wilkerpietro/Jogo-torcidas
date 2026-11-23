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
import { montar, desenharDeCima, desenharVitrine, limparDeCima, fotoDoTrofeu, fotoDaBriga, fotoDaCena, perdeu, porCenario, bonecos } from './bonecos3_cena.js?v=203b323bd6';
import { cenarioDaFesta } from './festa3d.js?v=203b323bd6';
import { cenarioDaSede } from './sede3d_cena.js?v=203b323bd6';
import { montarSede } from './sede3d.js?v=203b323bd6';

window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};
/* (as fotos dos posts da rede social — a da briga e a do post, cartaz.js —
   e o canvas que perdeu o contexto, main.js: vieram do jogo 2D, 06/10/2026) */
/* O CENÁRIO EM 3D DA CENA (a casa de festas, 23/11/2026): quem monta a
   cena (a ponte) diz qual é; a que tem peças em 3D entra junto dos
   bonecos, e as outras tiram o que estava */
const CENARIOS = { festa: cenarioDaFesta, 'sede-cena': cenarioDaSede };
/* a planta da sede (paredes, portas, móveis, cômodos, armários), sem a
   geometria: é dela que a cena da invasão tira a máscara de caminhada */
TO.diaJogo.plantaDaSede = sede => montarSede(sede, {}, { so2d: true });
function cenario(id, D){
  const f = CENARIOS[id];
  let g = null;
  try { g = f ? f(D) : null; } catch (err) { console.error('o cenário 3D da cena não montou:', err); }
  porCenario(g);
  return !!g;
}
TO.diaJogo.bonecos3 = {
  montar, desenharDeCima, desenharVitrine, limparDeCima, fotoDoTrofeu, fotoDaBriga, fotoDaCena, perdeu, cenario,
  get ativo(){ return bonecos.ativo; },
  get escalaDeCima(){ return bonecos.escala; },
  set escalaDeCima(v){ bonecos.escala = v; }
};
