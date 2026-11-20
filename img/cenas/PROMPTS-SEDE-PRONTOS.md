# Os cinco prompts das sedes, prontos pra colar

Cada bloco é completo e independente: projeção, enquadramento do quarteirão,
disposição das salas, acabamento e a negativa, tudo junto. Não precisa emendar
nada.

O raciocínio por trás de cada regra está em `PROMPT-SEDE.md`. Aqui é só colar.

**Antes de colar, no Google Flow:**

- proporção **16:9** (o Flow não faz 3:2; 16:9 o importador aceita e completa em
  cima e embaixo);
- anexe a **planta do nível** (`docs/plantas/sede-nivel-N`) e, junto,
  `img/cenas/Aerial_view_of_roofless_bar_202608131633.jpeg`. A foto do bar
  agora serve pra duas coisas: a projeção de zênite **e o enquadramento** —
  ela é um lote sem telhado no meio de um quarteirão inteiro de casas com
  telha, calçada e rua, que é exatamente o que se quer.

**O quadro é o QUARTEIRÃO, não o prédio.** Foi o que faltou nas quatro
primeiras rodadas: descrevendo só a sede, o Flow enquadrava só a sede, e sobrava
uma tira de rua onde o rival não tem onde nascer nem por onde vir. Agora o
primeiro parágrafo de cada prompt descreve os vizinhos, as calçadas e a rua
como assunto, e a sede aparece como **um lote entre muitos**.

Isso ainda ajuda a máscara de colisão: telhado de barro sai por cor no
importador (`R > G+18 && R > B+22`), então casa de vizinho com telha se exclui
sozinha do chão de andar.


---

## Nível 1 — o galpão

```
true orthographic zenith satellite orthophoto of AN ENTIRE CITY BLOCK in a working-class neighborhood of northeast Brazil, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, the top of every object reads as a flat shape. No vertical surface is visible anywhere: no wall faces, no house facades, no table legs, no chair backs, no cabinet fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

FRAME THE WHOLE BLOCK, NOT ONE BUILDING. This is the single most important instruction, and the frame is filled edge to edge with the neighborhood:
- LEFT AND RIGHT of the frame: ordinary neighboring houses packed wall to wall, seen from straight above. Terracotta tile roofs, flat concrete roof slabs carrying blue plastic water tanks and satellite dishes, narrow back yards with washing hung on lines, party walls between the lots. They run all the way out to the left and right edges of the image.
- THE LOWER QUARTER of the frame is a wide asphalt street running unbroken from the left edge to the right edge, with a faded yellow center line, a white painted crosswalk, and a paved sidewalk with a white painted curb on both sides. The street is wide and open and has real room in the frame.
- THE TOP of the frame: the back yards and roof slabs of the houses on the next street over.
- IN THE MIDDLE OF THE BLOCK, one single lot has NO ROOF AT ALL, and that lot is the subject: a walled compound with its interior fully exposed from above. It occupies about one third of the frame width and half of its height — it is ONE LOT AMONG MANY, not the whole picture.
Match the reference photo of the roofless bar exactly in this respect: a small roofless lot sitting in the middle of a full block of roofed houses, sidewalks and street.

THE COMPOUND HAS NO ROOF, while every neighboring house keeps its own roof: seen from directly above, every room of the compound is fully exposed, its thick masonry walls read as continuous pale grey bands, and each room shows its own floor.

LAYOUT OF THE COMPOUND, THREE SPACES ONLY. The left half is an open concrete yard: cracked slab floor with a drain, one blue plastic water tank standing in the far corner, and three thin foam mattresses laid flat side by side on the ground along the side wall, because people sleep here and there is no dormitory. The center of the yard stays completely clear. The right half is divided into two rooms of equal width, one above the other. The upper room is an office: one wooden desk with a chair pushed against the far wall and one metal filing cabinet beside it, bare floor everywhere else. The lower room is a storeroom: one single long empty metal shelf against the far wall and absolutely nothing else.

BARE MINIMALIST INTERIORS: at most three large objects per room, all pushed flat against the walls, the entire center of every room is clear bare floor.

EVERY ROOM HAS ONE WIDE OPEN DOORWAY: a broad gap cut clean through the wall, no door leaf, no frame, opening onto the yard, so that all the floors connect into one continuous walkable surface. The street gate stands wide open in the bottom wall of the yard with its leaf folded flat against the inside of the wall.

Polished cement and worn ceramic tile floors in pale grey and cream, clearly lighter than the walls, swept clean. Flat overcast diffuse daylight, almost no cast shadows, desaturated muted colors, documentary photography, sun-bleached concrete, weathered paint, damp stains at the base of the walls. Photorealistic, natural materials, high detail.

Absolutely no roof over the walled compound itself and no cover of any kind over its rooms — the neighboring houses DO keep their roofs. No close crop on the compound, no isolated building, no empty ground around the compound, no building floating in a void. No wide angle lens, no fisheye, no lens distortion, no perspective, no leaning or splayed walls, no visible wall faces, no visible house facades, no vertical surfaces, no furniture seen from the side, no table legs, no chair backs, no oblique or 45 degree angle, no tilted camera. No clutter, no stacked crates, no boxes, no furniture in the middle of a room, no banners, no flags, no flagpoles, no drums, no sports memorabilia. No closed rooms, no room without a doorway, no closed gate, no narrow doorway. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no text, no labels, no numbers, no watermark, no people, no cars inside the compound. No dark interior floors, no saturated colors, no HDR, no dramatic lighting, no night, no long shadows.
```

---

## Nível 2 — a casa

```
true orthographic zenith satellite orthophoto of AN ENTIRE CITY BLOCK in a working-class neighborhood of northeast Brazil, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, the top of every object reads as a flat shape. No vertical surface is visible anywhere: no wall faces, no house facades, no table legs, no chair backs, no cabinet fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

FRAME THE WHOLE BLOCK, NOT ONE BUILDING. This is the single most important instruction, and the frame is filled edge to edge with the neighborhood:
- LEFT AND RIGHT of the frame: ordinary neighboring houses packed wall to wall, seen from straight above. Terracotta tile roofs, flat concrete roof slabs carrying blue plastic water tanks and satellite dishes, narrow back yards with washing hung on lines, party walls between the lots. They run all the way out to the left and right edges of the image.
- THE LOWER QUARTER of the frame is a wide asphalt street running unbroken from the left edge to the right edge, with a faded yellow center line, a white painted crosswalk, and a paved sidewalk with a white painted curb on both sides. The street is wide and open and has real room in the frame.
- THE TOP of the frame: the back yards and roof slabs of the houses on the next street over.
- IN THE MIDDLE OF THE BLOCK, one single lot has NO ROOF AT ALL, and that lot is the subject: a walled compound with its interior fully exposed from above. It occupies about one third of the frame width and half of its height — it is ONE LOT AMONG MANY, not the whole picture.
Match the reference photo of the roofless bar exactly in this respect: a small roofless lot sitting in the middle of a full block of roofed houses, sidewalks and street.

THE COMPOUND HAS NO ROOF, while every neighboring house keeps its own roof: seen from directly above, every room of the compound is fully exposed, its thick masonry walls read as continuous pale grey bands, and each room shows its own floor.

LAYOUT OF THE COMPOUND, SIX SPACES. Across the top, three rooms side by side, each opening onto the yard below: on the left an office with one desk and one filing cabinet against the far wall; in the center a workshop with one single long empty work table against the far wall; on the right a storeroom with one single long empty shelf against the far wall and absolutely nothing else. Below them a wide open concrete yard running the full width of the compound, empty except for four thin foam mattresses laid flat side by side on the ground along one side wall, because people sleep here and there is no dormitory; the center of the yard stays completely clear. In the bottom-left corner a narrow bar room with a tiled counter along its outer wall and nothing else. In the bottom-right corner a training room with two punching bags hanging near one wall and a rolled mat against another, center floor clear.

BARE MINIMALIST INTERIORS: at most three large objects per room, all pushed flat against the walls, the entire center of every room is clear bare floor.

EVERY ROOM HAS ONE WIDE OPEN DOORWAY: a broad gap cut clean through the wall, no door leaf, no frame, opening onto the yard, so that all the floors connect into one continuous walkable surface. The street gate stands wide open in the bottom wall of the yard with its leaf folded flat against the inside of the wall.

Polished cement and worn ceramic tile floors in pale grey and cream, clearly lighter than the walls, swept clean. Flat overcast diffuse daylight, almost no cast shadows, desaturated muted colors, documentary photography, sun-bleached concrete, weathered paint, damp stains at the base of the walls. Photorealistic, natural materials, high detail.

Absolutely no roof over the walled compound itself and no cover of any kind over its rooms — the neighboring houses DO keep their roofs. No close crop on the compound, no isolated building, no empty ground around the compound, no building floating in a void. No wide angle lens, no fisheye, no lens distortion, no perspective, no leaning or splayed walls, no visible wall faces, no visible house facades, no vertical surfaces, no furniture seen from the side, no table legs, no chair backs, no oblique or 45 degree angle, no tilted camera. No clutter, no stacked crates, no boxes, no furniture in the middle of a room, no banners, no flags, no flagpoles, no drums, no sports memorabilia. No closed rooms, no room without a doorway, no closed gate, no narrow doorway. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no text, no labels, no numbers, no watermark, no people, no cars inside the compound. No dark interior floors, no saturated colors, no HDR, no dramatic lighting, no night, no long shadows.
```

---

## Nível 3 — o sobrado

```
true orthographic zenith satellite orthophoto of AN ENTIRE CITY BLOCK in a working-class neighborhood of northeast Brazil, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, the top of every object reads as a flat shape. No vertical surface is visible anywhere: no wall faces, no house facades, no table legs, no chair backs, no cabinet fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

FRAME THE WHOLE BLOCK, NOT ONE BUILDING. This is the single most important instruction, and the frame is filled edge to edge with the neighborhood:
- LEFT AND RIGHT of the frame: ordinary neighboring houses packed wall to wall, seen from straight above. Terracotta tile roofs, flat concrete roof slabs carrying blue plastic water tanks and satellite dishes, narrow back yards with washing hung on lines, party walls between the lots. They run all the way out to the left and right edges of the image.
- THE LOWER QUARTER of the frame is a wide asphalt street running unbroken from the left edge to the right edge, with a faded yellow center line, a white painted crosswalk, and a paved sidewalk with a white painted curb on both sides. The street is wide and open and has real room in the frame.
- THE TOP of the frame: the back yards and roof slabs of the houses on the next street over.
- IN THE MIDDLE OF THE BLOCK, one single lot has NO ROOF AT ALL, and that lot is the subject: a walled compound with its interior fully exposed from above. It occupies about two fifths of the frame width and half of its height — it is ONE LOT AMONG MANY, not the whole picture.
Match the reference photo of the roofless bar exactly in this respect: a small roofless lot sitting in the middle of a full block of roofed houses, sidewalks and street.

THE COMPOUND HAS NO ROOF, while every neighboring house keeps its own roof: seen from directly above, every room of the compound is fully exposed, its thick masonry walls read as continuous pale grey bands, and each room shows its own floor.

LAYOUT OF THE COMPOUND, TEN SPACES. In the top-left corner, two small rooms stacked one above the other: an office above with one desk against the wall, and a planning room below with one long table against the wall and one bare empty corkboard; both open onto the hall to their right. In the top-center, a wide empty hall of bare polished cement, a circulation corridor with absolutely nothing in it. Down the right side, a column of four rooms each opening onto that hall: first a dormitory with bunk beds lined against one wall; then a storeroom with one single long empty shelf and nothing else; then a small workshop with one work table against the wall; then a shop with two clothing racks against the wall and a counter. Across the bottom, an open concrete yard, completely empty, with a narrow bar in the bottom-left corner with a tiled counter along the wall, and a training room to the bottom-center-right with two hanging punching bags and a clear center floor. There are no mattresses anywhere: this compound has a dormitory.

BARE MINIMALIST INTERIORS: at most three large objects per room, all pushed flat against the walls, the entire center of every room is clear bare floor.

EVERY ROOM HAS ONE WIDE OPEN DOORWAY: a broad gap cut clean through the wall, no door leaf, no frame, opening onto the yard or onto the hall, so that all the floors connect into one continuous walkable surface. The street gate stands wide open in the bottom wall of the yard with its leaf folded flat against the inside of the wall.

Polished cement and worn ceramic tile floors in pale grey and cream, clearly lighter than the walls, swept clean. Flat overcast diffuse daylight, almost no cast shadows, desaturated muted colors, documentary photography, sun-bleached concrete, weathered paint, damp stains at the base of the walls. Photorealistic, natural materials, high detail.

Absolutely no roof over the walled compound itself and no cover of any kind over its rooms — the neighboring houses DO keep their roofs. No close crop on the compound, no isolated building, no empty ground around the compound, no building floating in a void. No wide angle lens, no fisheye, no lens distortion, no perspective, no leaning or splayed walls, no visible wall faces, no visible house facades, no vertical surfaces, no furniture seen from the side, no table legs, no chair backs, no oblique or 45 degree angle, no tilted camera. No clutter, no stacked crates, no boxes, no furniture in the middle of a room, no banners, no flags, no flagpoles, no drums, no sports memorabilia. No mattresses on the ground anywhere. No closed rooms, no room without a doorway, no closed gate, no narrow doorway. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no text, no labels, no numbers, no watermark, no people, no cars inside the compound. No dark interior floors, no saturated colors, no HDR, no dramatic lighting, no night, no long shadows.
```

---

## Nível 4 — o clube

```
true orthographic zenith satellite orthophoto of AN ENTIRE CITY BLOCK in a working-class neighborhood of northeast Brazil, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, the top of every object reads as a flat shape. No vertical surface is visible anywhere: no wall faces, no house facades, no table legs, no chair backs, no cabinet fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

FRAME THE WHOLE BLOCK, NOT ONE BUILDING. This is the single most important instruction, and the frame is filled edge to edge with the neighborhood:
- LEFT AND RIGHT of the frame: ordinary neighboring houses packed wall to wall, seen from straight above. Terracotta tile roofs, flat concrete roof slabs carrying blue plastic water tanks and satellite dishes, narrow back yards with washing hung on lines, party walls between the lots. They run all the way out to the left and right edges of the image.
- THE LOWER QUARTER of the frame is a wide asphalt street running unbroken from the left edge to the right edge, with a faded yellow center line, a white painted crosswalk, and a paved sidewalk with a white painted curb on both sides. The street is wide and open and has real room in the frame.
- THE TOP of the frame: the back yards and roof slabs of the houses on the next street over.
- IN THE MIDDLE OF THE BLOCK, one single lot has NO ROOF AT ALL, and that lot is the subject: a walled compound with its interior fully exposed from above. It occupies about half of the frame width and half of its height — it is ONE LOT AMONG MANY, not the whole picture.
Match the reference photo of the roofless bar exactly in this respect: a small roofless lot sitting in the middle of a full block of roofed houses, sidewalks and street.

THE COMPOUND HAS NO ROOF, while every neighboring house keeps its own roof: seen from directly above, every room of the compound is fully exposed, its thick masonry walls read as continuous pale grey bands, and each room shows its own floor.

LAYOUT OF THE COMPOUND, ELEVEN SPACES. In the top-left corner, two small rooms stacked: an office above, and a planning room below with one long table and one bare empty corkboard. A narrow vertical corridor of bare cement runs beside them, completely empty. Across the top, three rooms opening onto that corridor: a storeroom with one single long empty shelf and nothing else; a workshop with one long work table against the wall; and a dormitory with bunk beds lined against the walls and a clear center. Along the bottom: on the left an open concrete yard, empty, with a narrow bar along its outer wall; at the center a training room with two hanging punching bags and a clear center floor; to its right a large vehicle garage with one old intercity bus parked against the far wall and the rest of the floor bare, with a wide open roll-up door onto the street; and on the far right a shop with two clothing racks and a counter against the walls, clear center, with its own open door onto the street. There are no mattresses anywhere: this compound has a dormitory.

BARE MINIMALIST INTERIORS: at most three large objects per room, all pushed flat against the walls, the entire center of every room is clear bare floor.

EVERY ROOM HAS ONE WIDE OPEN DOORWAY: a broad gap cut clean through the wall, no door leaf, no frame, opening onto the yard or onto the corridor, so that all the floors connect into one continuous walkable surface. The street gate stands wide open in the bottom wall of the yard with its leaf folded flat against the inside of the wall.

Polished cement and worn ceramic tile floors in pale grey and cream, clearly lighter than the walls, swept clean. Flat overcast diffuse daylight, almost no cast shadows, desaturated muted colors, documentary photography, sun-bleached concrete, weathered paint, damp stains at the base of the walls. Photorealistic, natural materials, high detail.

Absolutely no roof over the walled compound itself and no cover of any kind over its rooms — the neighboring houses DO keep their roofs. No close crop on the compound, no isolated building, no empty ground around the compound, no building floating in a void. No wide angle lens, no fisheye, no lens distortion, no perspective, no leaning or splayed walls, no visible wall faces, no visible house facades, no vertical surfaces, no furniture seen from the side, no table legs, no chair backs, no oblique or 45 degree angle, no tilted camera. No clutter, no stacked crates, no boxes, no furniture in the middle of a room, no banners, no flags, no flagpoles, no drums, no sports memorabilia. No mattresses on the ground anywhere. No closed rooms, no room without a doorway, no closed gate, no narrow doorway. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no text, no labels, no numbers, no watermark, no people, no cars inside the compound. No dark interior floors, no saturated colors, no HDR, no dramatic lighting, no night, no long shadows.
```

---

## Níveis 5 e 6 — o complexo

```
true orthographic zenith satellite orthophoto of AN ENTIRE CITY BLOCK in a working-class neighborhood of northeast Brazil, camera pointing straight down at exactly 90 degrees from very high altitude with an extreme telephoto lens, orthographic projection, zero parallax, zero perspective, no horizon, no lens distortion. ONLY TOP SURFACES ARE VISIBLE ANYWHERE IN THE FRAME: the top of every wall reads as a flat even band, every roof reads as a flat plane, the top of every object reads as a flat shape. No vertical surface is visible anywhere: no wall faces, no house facades, no table legs, no chair backs, no cabinet fronts. The buildings at the edges of the frame read exactly like the building at the center, they never lean or splay outward.

FRAME THE WHOLE BLOCK, NOT ONE BUILDING. This is the single most important instruction, and the frame is filled edge to edge with the neighborhood:
- LEFT AND RIGHT of the frame: ordinary neighboring houses packed wall to wall, seen from straight above. Terracotta tile roofs, flat concrete roof slabs carrying blue plastic water tanks and satellite dishes, narrow back yards with washing hung on lines, party walls between the lots. They run all the way out to the left and right edges of the image.
- THE LOWER QUARTER of the frame is a wide asphalt street running unbroken from the left edge to the right edge, with a faded yellow center line, a white painted crosswalk, and a paved sidewalk with a white painted curb on both sides. The street is wide and open and has real room in the frame.
- THE TOP of the frame: the back yards and roof slabs of the houses on the next street over.
- IN THE MIDDLE OF THE BLOCK, one single lot has NO ROOF AT ALL, and that lot is the subject: a walled compound with its interior fully exposed from above. It occupies about three fifths of the frame width and half of its height — it is ONE LOT AMONG MANY, not the whole picture.
Match the reference photo of the roofless bar exactly in this respect: a small roofless lot sitting in the middle of a full block of roofed houses, sidewalks and street.

THE COMPOUND HAS NO ROOF, while every neighboring house keeps its own roof: seen from directly above, every room of the compound is fully exposed, its thick masonry walls read as continuous pale grey bands, and each room shows its own floor.

LAYOUT OF THE COMPOUND, ELEVEN SPACES, WIDE. In the top-left corner, two small rooms stacked: an office above, and an administration room below with two desks and one filing cabinet against the walls. Across the top, three large rooms: a storeroom with one single long empty shelf and nothing else; a small factory with two rows of sewing machines lined against the side walls and a completely clear aisle down the middle; and a lodging wing with single beds lined along the walls and a clear center. A long horizontal corridor of bare polished cement runs the full width of the compound just beneath them, completely empty, and every room above opens onto it. Along the bottom, a row of five spaces from left to right: a narrow bar with a tiled counter along the wall; a small empty concrete yard; a gym with mats and hanging punching bags around the edges and a clear center; a shop with clothing racks and a counter against the walls; and a garage with two intercity buses parked against the far wall. The shop and the garage each have their own wide open door onto the street. There are no mattresses anywhere: this compound has a lodging wing.

BARE MINIMALIST INTERIORS: at most three large objects per room, all pushed flat against the walls, the entire center of every room is clear bare floor.

EVERY ROOM HAS ONE WIDE OPEN DOORWAY: a broad gap cut clean through the wall, no door leaf, no frame, opening onto the yard or onto the corridor, so that all the floors connect into one continuous walkable surface. The street gate stands wide open in the bottom wall of the yard with its leaf folded flat against the inside of the wall.

Polished cement and worn ceramic tile floors in pale grey and cream, clearly lighter than the walls, swept clean. Flat overcast diffuse daylight, almost no cast shadows, desaturated muted colors, documentary photography, sun-bleached concrete, weathered paint, damp stains at the base of the walls. Photorealistic, natural materials, high detail.

Absolutely no roof over the walled compound itself and no cover of any kind over its rooms — the neighboring houses DO keep their roofs. No close crop on the compound, no isolated building, no empty ground around the compound, no building floating in a void. No wide angle lens, no fisheye, no lens distortion, no perspective, no leaning or splayed walls, no visible wall faces, no visible house facades, no vertical surfaces, no furniture seen from the side, no table legs, no chair backs, no oblique or 45 degree angle, no tilted camera. No clutter, no stacked crates, no boxes, no furniture in the middle of a room, no banners, no flags, no flagpoles, no drums, no sports memorabilia. No mattresses on the ground anywhere. No closed rooms, no room without a doorway, no closed gate, no narrow doorway. No illustration, no cartoon, no isometric, no 3d render, no blueprint look, no text, no labels, no numbers, no watermark, no people, no cars inside the compound. No dark interior floors, no saturated colors, no HDR, no dramatic lighting, no night, no long shadows.
```

---

## Se ainda vier cortado na sede

Não queime quatro gerações brigando com o enquadramento. Duas saídas, nesta
ordem:

1. **Gere só o quarteirão vazio uma vez** — o mesmo primeiro parágrafo, sem a
   sede, com um lote murado vazio no meio. Depois use ESSA imagem como
   referência de enquadramento pras cinco, no lugar da foto do bar.
2. **Mande a imagem cortada assim mesmo.** Eu costuro os vizinhos e a rua com
   as fotos das outras cenas, que já estão no projeto. Perde-se um pouco de
   realismo na emenda, não se perde a cena.
