/* =======================================================
   A MALHA DAS PRAÇAS — a planta do dono (24/08/2026)
   As 94 praças ligadas numa malha só: as rodovias do Brasil,
   as rutas Conmebol e as travessias de fronteira, cada uma com
   os TRECHOS na ordem em que a caravana os percorre. Fechada
   pelo dono no Mapa das Praças (docs/mapa-das-pracas.html) e
   é ela que norteia a criação de rotas no jogo: o grafo do
   planejamento nasce daqui, trecho a trecho — praça vizinha é
   a PRÓXIMA do corredor, não qualquer uma da mesma rodovia.
   Editar À MÃO junto com o mapa; os dois têm de contar a
   mesma malha.
   ======================================================= */
(function(){
TO.dados = TO.dados || {};
TO.dados.malha = [
  {nome:'Rodovia Norte', fam:'BR', seg:[['manaus', 'belem']]},
  {nome:'Rodovia Nordeste 1', fam:'BR', seg:[['maranhao', 'fortaleza', 'interior-do-ce'], ['fortaleza', 'rio-grande-do-norte', 'paraiba']]},
  {nome:'Rodovia Nordeste 2', fam:'BR', seg:[['paraiba', 'recife', 'interior-de-pe', 'alagoas', 'sergipe', 'bahia']]},
  {nome:'Rodovia Centro-Oeste', fam:'BR', seg:[['maranhao', 'brasilia'], ['brasilia', 'goiania', 'mato-grosso'], ['brasilia', 'belo-horizonte']]},
  {nome:'Rodovia Sudeste 1', fam:'BR', seg:[['belo-horizonte', 'interior-de-minas', 'interior-de-sp', 'regiao-de-campinas']]},
  {nome:'Rodovia Sudeste 2', fam:'BR', seg:[['rio-de-janeiro', 'suburbio-carioca', 'sao-paulo'], ['sao-paulo', 'abc-paulista', 'santos'], ['sao-paulo', 'regiao-de-campinas', 'interior-de-sp', 'interior-do-pr'], ['sao-paulo', 'curitiba']]},
  {nome:'Rodovia Sul 1', fam:'BR', seg:[['interior-do-pr', 'curitiba', 'interior-de-sc']]},
  {nome:'Rodovia Sul 2', fam:'BR', seg:[['interior-de-sc', 'litoral-catarinense', 'porto-alegre'], ['interior-de-sc', 'interior-do-rs', 'porto-alegre']]},
  {nome:'Ruta Panamericana', fam:'CONMEBOL', seg:[['buenos-aires', 'buenos-aires-norte', 'norte-de-buenos-aires', 'rosario'], ['buenos-aires-norte', 'san-martin-e-tres-de-febrero']]},
  {nome:'Ruta 3', fam:'CONMEBOL', seg:[['buenos-aires', 'buenos-aires-sul', 'avellaneda', 'lanus-e-lomas', 'quilmes-e-berazategui', 'varela-e-ezeiza', 'la-plata'], ['la-plata', 'interior-de-buenos-aires']]},
  {nome:'Ruta 7', fam:'CONMEBOL', seg:[['buenos-aires-oeste', 'la-matanza', 'moron-e-merlo', 'mendoza', 'cuyo-e-patagonia'], ['moron-e-merlo', 'interior-de-buenos-aires']]},
  {nome:'Ruta 9', fam:'CONMEBOL', seg:[['rosario', 'litoral-argentino'], ['rosario', 'cordoba', 'santiago-del-estero', 'tucuman', 'norte-da-argentina', 'la-paz']]},
  {nome:'Corredor do Prata', fam:'CONMEBOL', seg:[['buenos-aires', 'la-plata'], ['la-plata', 'montevideu'], ['montevideu-oeste', 'montevideu', 'montevideu-leste'], ['montevideu', 'interior-do-uruguai', 'assuncao']]},
  {nome:'Corredor Andino', fam:'CONMEBOL', seg:[['mendoza', 'santiago'], ['santiago', 'valparaiso'], ['mendoza', 'la-paz'], ['centro-do-chile', 'santiago']]},
  {nome:'Ruta 5', fam:'CONMEBOL', seg:[['norte-do-chile', 'norte-chico', 'valparaiso'], ['valparaiso', 'santiago'], ['santiago', 'santiago-sul', 'centro-do-chile', 'concepcion', 'sul-do-chile']]},
  {nome:'Autopista Norte-Sul', fam:'CONMEBOL', seg:[['medellin', 'eixo-cafeteiro'], ['eixo-cafeteiro', 'cali', 'sul-da-colombia'], ['eixo-cafeteiro', 'interior-da-colombia', 'bogota', 'bogota-sul']]},
  {nome:'Ruta do Caribe', fam:'CONMEBOL', seg:[['medellin', 'costa-colombiana'], ['costa-colombiana', 'norte-da-colombia', 'oeste-da-venezuela'], ['norte-da-colombia', 'bogota'], ['norte-da-colombia', 'interior-da-colombia']]},
  {nome:'Panamericana Sul', fam:'CONMEBOL', seg:[['norte-do-peru', 'lima', 'sul-do-peru', 'norte-do-chile']]},
  {nome:'Carretera Central', fam:'CONMEBOL', seg:[['lima', 'cusco'], ['cusco', 'sul-do-peru']]},
  {nome:'Ruta 2', fam:'CONMEBOL', seg:[['assuncao', 'grande-assuncao'], ['assuncao', 'interior-do-paraguai']]},
  {nome:'Panamericana Equatoriana', fam:'CONMEBOL', seg:[['sul-da-colombia', 'quito', 'ambato', 'sul-do-equador', 'norte-do-peru'], ['ambato', 'guayaquil', 'costa-equatoriana'], ['guayaquil', 'sul-do-equador']]},
  {nome:'Ruta Bolívia', fam:'CONMEBOL', seg:[['la-paz', 'oruro-e-potosi'], ['oruro-e-potosi', 'cochabamba', 'santa-cruz'], ['oruro-e-potosi', 'interior-da-bolivia']]},
  {nome:'Autopista Venezuelana', fam:'CONMEBOL', seg:[['oeste-da-venezuela', 'centro-da-venezuela', 'caracas', 'oriente-da-venezuela']]},
  {nome:'BR-116 Sertão', fam:'BR', seg:[['interior-do-ce', 'bahia']]},
  {nome:'Rio–Bahia', fam:'BR', seg:[['bahia', 'belo-horizonte']]},
  {nome:'Fernão Dias', fam:'BR', seg:[['belo-horizonte', 'sao-paulo']]},
  {nome:'BR-316', fam:'BR', seg:[['belem', 'maranhao']]},
  {nome:'BR-174 Caribenha', fam:'INT', seg:[['manaus', 'oriente-da-venezuela']]},
  {nome:'Bioceânica', fam:'INT', seg:[['mato-grosso', 'santa-cruz']]},
  {nome:'Rota do Pantanal', fam:'INT', seg:[['mato-grosso', 'assuncao']]},
  {nome:'Rota do Chuí', fam:'INT', seg:[['porto-alegre', 'montevideu']]},
  {nome:'Ponte da Amizade', fam:'INT', seg:[['interior-de-sc', 'interior-do-paraguai']]},
  {nome:'Ruta 11', fam:'CONMEBOL', seg:[['assuncao', 'litoral-argentino']]},
  {nome:'Rota de Desaguadero', fam:'CONMEBOL', seg:[['sul-do-peru', 'la-paz']]},
  {nome:'Rota de Arica', fam:'CONMEBOL', seg:[['norte-do-chile', 'la-paz']]},
  {nome:'Ruta 20', fam:'CONMEBOL', seg:[['cordoba', 'mendoza']]},
  {nome:'General Paz', fam:'CONMEBOL', seg:[['buenos-aires', 'buenos-aires-oeste']]},
  {nome:'BR-364', fam:'BR', seg:[['manaus', 'mato-grosso']]},
  {nome:'BR-101 Sul', fam:'BR', seg:[['curitiba', 'litoral-catarinense']]},
  {nome:'BR-050', fam:'BR', seg:[['brasilia', 'interior-de-minas']]},
  {nome:'Rota de Foz', fam:'INT', seg:[['interior-do-pr', 'interior-do-paraguai']]},
  {nome:'BR-153', fam:'BR', seg:[['goiania', 'interior-do-pr']]},
  {nome:'Rota do Chaco', fam:'INT', seg:[['interior-da-bolivia', 'assuncao']]},
  {nome:'Rota da Patagônia', fam:'CONMEBOL', seg:[['sul-do-chile', 'cuyo-e-patagonia']]},
  {nome:'Ruta 22', fam:'CONMEBOL', seg:[['interior-de-buenos-aires', 'cuyo-e-patagonia']]},
];
})();
