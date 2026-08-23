#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monta as barras bravas dos nove paises e as pracas onde elas moram.

    python3 ferramentas/importar_barras.py

Gera dados/barras.js, que entra DEPOIS de cidades.js e torcidas.js e
empurra os registros nos mesmos dois vetores. Foi feito assim de
proposito: cidades.js e torcidas.js sao gerados por importar_bairros.py
e importar_relacoes.py a partir das fontes brasileiras, e regerar
qualquer um dos dois apagaria o mundo de fora se ele morasse la dentro.

A fonte aqui e a pesquisa, nao uma planilha: cada barra tem nome real,
ano de fundacao e um efetivo na regua brasileira (20 a 250, Gavioes e
Jovem Fla no teto). Barra que a pesquisa nao confirmou fica de fora --
nao se inventa nome de organizada que existe de verdade.

Regua do efetivo:
  250-200  as maiores do continente   199-140  grandes
  139- 60  medias                      59- 20  pequenas e de divisao de baixo
"""
import json, pathlib, unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent.parent

# ===================================================================
# AS PRACAS DE FORA
# bairro no formato 'Nome|zona|classe'
#   zona:   N Norte · S Sul · L Leste · O Oeste   (sempre equilibrado)
#   classe: N Nobre · M Classe Media · B Classe Baixa · F Favela
# Os nomes dos bairros sao os de verdade -- e o bairro que aparece no
# texto da treta, entao nao pode ser inventado. Zona e classe seguem a
# geografia real onde ela e conhecida (a zona sul de Santiago, o Poblado
# de Medellin, Petare em Caracas) e completam equilibrado no resto.
# (nome, tamanho, uf, populacao em milhares, bairros)
# ===================================================================
PRACAS = {
'buenos-aires': ('Buenos Aires', 'Grande', 'AR', 3100, [
  'La Boca|S|B','Barracas|S|F','Parque Patricios|S|B','Villa Soldati|S|F',
  'Liniers|O|M','Mataderos|O|B','Flores|O|M','Nueva Pompeya|O|F',
  'Núñez|N|M','Belgrano|N|N','Palermo|N|N','Recoleta|N|N',
  'Boedo|L|B','Caballito|L|M','Villa Crespo|L|M','Constitución|L|F']),
'buenos-aires-norte': ('Norte de CABA', 'Médio', 'AR', 900, [
  'Núñez|N|M','Saavedra|N|M','Villa Urquiza|N|M',
  'Chacarita|S|B','Villa Ortúzar|S|B','La Paternal|S|B',
  'Belgrano|L|N','Palermo|L|N','Colegiales|L|M',
  'Villa Crespo|O|M','Parque Chas|O|B','Coghlan|O|M']),
'buenos-aires-oeste': ('Oeste de CABA', 'Médio', 'AR', 1000, [
  'Liniers|O|M','Mataderos|O|B','Villa Luro|O|M',
  'Villa Devoto|N|N','Villa del Parque|N|M','Monte Castro|N|M',
  'Flores|S|M','Floresta|S|B','Parque Avellaneda|S|F',
  'Caballito|L|N','Vélez Sarsfield|L|M','Versalles|L|M']),
'avellaneda': ('Avellaneda', 'Médio', 'AR', 700, [
  'Piñeyro|N|B','Crucecita|N|M','Centro|N|M',
  'Dock Sud|L|F','Isla Maciel|L|F','Villa Tranquila|L|F',
  'Sarandí|S|B','Wilde|S|M','Villa Domínico|S|M',
  'Gerli|O|B','Villa Corina|O|F','Villa Luján|O|B']),
'lanus-e-lomas': ('Lanús e Lomas', 'Médio', 'AR', 1200, [
  'Lanús Este|N|B','Lanús Oeste|N|M','Valentín Alsina|N|B',
  'Lomas de Zamora|S|M','Temperley|S|M','Adrogué|S|N',
  'Banfield|L|M','Turdera|L|M','Llavallol|L|B',
  'Remedios de Escalada|O|B','Monte Chingolo|O|F','Villa Fiorito|O|F']),
'la-plata': ('La Plata', 'Médio', 'AR', 900, [
  'Tolosa|N|B','Gonnet|N|N','City Bell|N|N',
  'Casco Urbano|L|M','Villa Elvira|L|B','Ringuelet|L|B',
  'Los Hornos|S|B','Altos de San Lorenzo|S|F','San Carlos|S|B',
  'Berisso|O|B','Ensenada|O|B','Melchor Romero|O|F']),
'rosario': ('Rosário', 'Médio', 'AR', 1300, [
  'Arroyito|N|B','Alberdi|N|M','Pichincha|N|M',
  'Tablada|S|F','Saladillo|S|B','Refinería|S|B',
  'Centro|L|M','Barrio Martín|L|N','Bella Vista|L|M',
  'Empalme Graneros|O|F','Fisherton|O|N','Ludueña|O|F']),
'cordoba': ('Córdoba', 'Médio', 'AR', 1500, [
  'Alta Córdoba|N|M','General Paz|N|M','Los Boulevares|N|B',
  'Nueva Córdoba|S|N','Güemes|S|M','Villa El Libertador|S|F',
  'San Vicente|L|B','Barrio Talleres|L|B','Observatorio|L|M',
  'Alberdi|O|B','Villa Belgrano|O|N','Jardín|O|N']),
'mendoza': ('Mendoza', 'Pequeno', 'AR', 1000, [
  'Las Heras|N|B','Guaymallén|N|M',
  'Godoy Cruz|S|M','Luján de Cuyo|S|N',
  'Maipú|L|M','San José|L|B',
  'Ciudad|O|M','Dorrego|O|B']),
'tucuman': ('Tucumã', 'Pequeno', 'AR', 900, [
  'Barrio Norte|N|N','Lomas de Tafí|N|F',
  'Barrio Sur|S|B','San Cayetano|S|B',
  'Centro|L|M','Villa 9 de Julio|L|B',
  'Villa Luján|O|B','Ciudadela|O|M']),
'litoral-argentino': ('Litoral Argentino', 'Pequeno', 'AR', 600, [
  'Guadalupe|N|N','Candioti|N|M',
  'Barrio Sur|S|B','Villa Setúbal|S|M',
  'Puerto|L|B','Alto Verde|L|F',
  'Centenario|O|B','Barranquitas|O|F']),
'norte-de-buenos-aires': ('Zona Norte', 'Pequeno', 'AR', 1100, [
  'Tigre Centro|N|M','Victoria|N|B',
  'Vicente López|S|N','Munro|S|M',
  'Olivos|L|N','Martínez|L|N',
  'San Isidro|O|N','Boulogne|O|B']),
'san-martin-e-tres-de-febrero': ('San Martín e Tres de Febrero', 'Pequeno', 'AR', 800, [
  'Villa Maipú|N|M','Loma Hermosa|N|B',
  'Villa Lynch|S|B','José Ingenieros|S|F',
  'Caseros|L|M','Santos Lugares|L|M',
  'Ciudadela|O|B','San Andrés|O|M']),
'moron-e-merlo': ('Morón e Merlo', 'Pequeno', 'AR', 1300, [
  'Morón Centro|N|M','Castelar|N|N',
  'Merlo Centro|S|B','Libertad|S|F',
  'Haedo|L|M','Ituzaingó|L|M',
  'San Antonio de Padua|O|B','Parque San Martín|O|F']),
'quilmes-e-berazategui': ('Quilmes e Berazategui', 'Pequeno', 'AR', 900, [
  'Quilmes Centro|N|M','Don Bosco|N|M',
  'Berazategui|S|M','Ranelagh|S|N',
  'Bernal|L|M','Ezpeleta|L|B',
  'San Francisco Solano|O|F','La Florida|O|B']),
'varela-e-ezeiza': ('Varela e Ezeiza', 'Pequeno', 'AR', 800, [
  'Florencio Varela|N|B','Ingeniero Allan|N|F',
  'Bosques|S|B','Zeballos|S|F',
  'Ezeiza|L|M','Tristán Suárez|L|B',
  'Cañuelas|O|M','La Capilla|O|B']),
'interior-de-buenos-aires': ('Interior de Buenos Aires', 'Pequeno', 'AR', 900, [
  'Junín|N|M','Pergamino|N|M',
  'Mar del Plata Centro|S|M','Chapadmalal|S|B',
  'Puerto|L|B','Campana|L|B',
  'Zárate|O|B','Carlos Casares|O|M']),
'cuyo-e-patagonia': ('Cuyo e Patagônia', 'Pequeno', 'AR', 700, [
  'San Juan Centro|N|M','Chimbas|N|F',
  'Rawson|S|B','Pueblo Viejo|S|B',
  'Puerto Madryn|L|M','Rada Tilly|L|N',
  'Concepción|O|B','Trelew|O|M']),
'norte-da-argentina': ('Norte da Argentina', 'Pequeno', 'AR', 900, [
  'Salta Centro|N|M','San Salvador|N|M',
  'Alto Comedero|S|F','Villa Los Lirios|S|F',
  'Resistencia|L|M','Barranqueras|L|B',
  'Villa Cristina|O|B','Ciudad Vieja|O|B']),

'santiago': ('Santiago', 'Grande', 'CL', 2800, [
  'Independencia|N|B','Recoleta|N|B','Renca|N|F','Quinta Normal|N|M',
  'Macul|S|M','La Florida|S|M','La Pintana|S|F','San Miguel|S|M',
  'Ñuñoa|L|M','Providencia|L|N','Las Condes|L|N','Lo Barnechea|L|N',
  'Maipú|O|M','Pudahuel|O|B','Estación Central|O|B','Cerro Navia|O|F']),
'santiago-sul': ('Santiago Sul', 'Médio', 'CL', 1600, [
  'San Miguel|N|M','San Joaquín|N|B','Pedro Aguirre Cerda|N|B',
  'Puente Alto|S|B','San Bernardo|S|B','La Pintana|S|F',
  'La Granja|L|B','La Cisterna|L|M','San Ramón|L|F',
  'El Bosque|O|B','Lo Espejo|O|F','La Legua|O|F']),
'valparaiso': ('Valparaíso', 'Médio', 'CL', 1000, [
  'Viña del Mar|N|N','Recreo|N|M','Forestal|N|B',
  'Playa Ancha|S|B','Cerro Barón|S|B','Placeres|S|B',
  'Quilpué|L|M','Villa Alemana|L|M','Limache|L|B',
  'Cerro Alegre|O|N','La Calera|O|B','Quillota|O|M']),
'norte-do-chile': ('Norte do Chile', 'Pequeno', 'CL', 800, [
  'Arica Centro|N|M','Iquique Centro|N|M',
  'Copiapó Centro|S|M','La Chimba|S|B',
  'Calama Centro|L|M','Villa Ayquina|L|B',
  'Antofagasta Centro|O|N','Alto Hospicio|O|F']),
'norte-chico': ('Norte Chico', 'Pequeno', 'CL', 500, [
  'La Serena Centro|N|N','Las Compañías|N|F',
  'Ovalle|S|B','Vallenar|S|B',
  'El Salvador|L|B','Tierras Blancas|L|F',
  'Coquimbo Puerto|O|B','Peñuelas|O|M']),
'centro-do-chile': ('Centro do Chile', 'Pequeno', 'CL', 700, [
  'Rancagua Centro|N|M','Machalí|N|N',
  'Talca Centro|S|M','Villa Alegre|S|B',
  'Curicó Centro|L|M','Molina|L|B',
  'San Fernando|O|B','Santa Cruz|O|M']),
'concepcion': ('Concepción', 'Pequeno', 'CL', 1000, [
  'Barrio Norte|N|M','Higueras|N|B',
  'San Pedro de la Paz|S|N','Chiguayante|S|M',
  'Concepción Centro|L|M','Lorenzo Arenas|L|B',
  'Talcahuano|O|B','Hualpén|O|B']),

'bogota': ('Bogotá', 'Grande', 'CO', 3200, [
  'Usaquén|N|N','Suba|N|M','Chapinero|N|N','Teusaquillo|N|M',
  'Bosa|S|B','Ciudad Bolívar|S|F','Tunjuelito|S|B','Rafael Uribe|S|F',
  'San Cristóbal|L|B','La Candelaria|L|B','Santa Fe|L|F','Los Mártires|L|B',
  'Engativá|O|M','Fontibón|O|M','Kennedy|O|B','Puente Aranda|O|M']),
'medellin': ('Medellín', 'Médio', 'CO', 1900, [
  'Castilla|N|B','Aranjuez|N|B','Manrique|N|F',
  'El Poblado|S|N','Belén|S|M','La Candelaria|S|M',
  'Buenos Aires|L|B','Villa Hermosa|L|F','Popular|L|F',
  'Laureles|O|N','Robledo|O|B','San Javier|O|F']),
'cali': ('Cali', 'Médio', 'CO', 1500, [
  'Granada|N|N','Junín|N|B','Terrón Colorado|N|F',
  'Ciudad Jardín|S|N','Meléndez|S|M','El Poblado|S|F',
  'Aguablanca|L|F','Alfonso López|L|B','La Base|L|M',
  'San Fernando|O|M','El Peñón|O|N','Siloé|O|F']),
'costa-colombiana': ('Costa Colombiana', 'Médio', 'CO', 1600, [
  'Riomar|N|N','El Rodadero|N|M','La Playa|N|M',
  'Rebolo|S|F','Simón Bolívar|S|B','Chiquinquirá|S|B',
  'El Prado|L|N','La Concepción|L|M','Boston|L|M',
  'Getsemaní|O|B','Manga|O|M','Gaira|O|B']),
'eixo-cafeteiro': ('Eixo Cafeteiro', 'Pequeno', 'CO', 700, [
  'Chipre|N|M','Villamaría|N|B',
  'La Enea|S|N','El Jardín|S|M',
  'Palogrande|L|N','Pinares|L|M',
  'Cuba|O|B','Circunvalar|O|M']),
'sul-da-colombia': ('Sul da Colômbia', 'Pequeno', 'CO', 800, [
  'Ibagué Centro|N|M','La Pola|N|B',
  'Pasto Centro|S|M','Torobajo|S|B',
  'Neiva Centro|L|M','Calixto|L|B',
  'Belén|O|B','Fátima|O|M']),
'norte-da-colombia': ('Norte da Colômbia', 'Pequeno', 'CO', 900, [
  'Cabecera|N|N','Floridablanca|N|M',
  'García Rovira|S|B','Girón|S|B',
  'Cúcuta Centro|L|M','La Libertad|L|B',
  'Atalaya|O|F','Aguas Claras|O|B']),

'montevideu': ('Montevidéu', 'Grande', 'UY', 1400, [
  'Prado|N|M','Sayago|N|B','Colón|N|B','Belvedere|N|B',
  'Pocitos|S|N','Punta Carretas|S|N','Parque Rodó|S|M','Buceo|S|M',
  'Malvín|L|N','La Blanqueada|L|M','Maroñas|L|B','Villa Española|L|B',
  'Centro|O|M','Ciudad Vieja|O|B','Cordón|O|M','Cerrito|O|F']),
'montevideu-oeste': ('Oeste de Montevidéu', 'Pequeno', 'UY', 400, [
  'Nuevo París|N|B','Paso Molino|N|B',
  'Villa del Cerro|S|B','Casabó|S|F',
  'La Teja|L|B','Belvedere|L|M',
  'Pajas Blancas|O|F','Santiago Vázquez|O|B']),

'lima': ('Lima', 'Grande', 'PE', 3400, [
  'San Martín de Porres|N|B','Comas|N|F','Rímac|N|B','Bellavista|N|M',
  'Barranco|S|N','Chorrillos|S|M','Villa El Salvador|S|F','Surquillo|S|M',
  'La Victoria|L|B','El Agustino|L|F','Ate|L|B','Cercado de Lima|L|M',
  'San Isidro|O|N','Miraflores|O|N','Callao|O|B','Breña|O|M']),
'cusco': ('Cusco', 'Pequeno', 'PE', 500, [
  'San Blas|N|M','Ttio|N|B',
  'San Jerónimo|S|B','San Sebastián|S|B',
  'Centro Histórico|L|N','Magisterio|L|M',
  'Wanchaq|O|M','Santiago|O|F']),
'sul-do-peru': ('Sul do Peru', 'Pequeno', 'PE', 900, [
  'Cayma|N|M','Yanahuara|N|N',
  'Miraflores|S|B','Chilca|S|B',
  'Huancayo Centro|L|M','El Tambo|L|B',
  'Arequipa Cercado|O|M','Tarma|O|B']),

'quito': ('Quito', 'Médio', 'EC', 1800, [
  'Cotocollao|N|B','Carcelén|N|B','Calderón|N|F',
  'Chillogallo|S|B','La Magdalena|S|M','Solanda|S|F',
  'La Floresta|L|N','El Batán|L|N','Sangolquí|L|M',
  'Centro Histórico|O|M','La Mariscal|O|M','Chimbacalle|O|B']),
'guayaquil': ('Guayaquil', 'Médio', 'EC', 2200, [
  'Alborada|N|M','Sauces|N|M','Bastión Popular|N|F',
  'Guasmo|S|F','Isla Trinitaria|S|F','Astillero|S|B',
  'Centro|L|M','García Moreno|L|B','Suburbio|L|F',
  'Urdesa|O|N','Kennedy|O|N','Ceibos|O|N']),
'sul-do-equador': ('Sul do Equador', 'Pequeno', 'EC', 700, [
  'Cuenca Centro|N|N','Totoracocha|N|B',
  'El Vergel|S|M','Yanuncay|S|M',
  'Loja Centro|L|M','San Sebastián|L|B',
  'Machala Centro|O|B','Puerto Bolívar|O|F']),

'assuncao': ('Assunção', 'Médio', 'PY', 1600, [
  'Trinidad|N|M','Luque|N|B','San Pablo|N|B',
  'Sajonia|S|M','Tacumbú|S|F','Lambaré|S|B',
  'Villa Morra|L|N','Recoleta|L|N','Fernando de la Mora|L|M',
  'Centro|O|M','Barrio Obrero|O|B','Ñemby|O|B']),

'la-paz': ('La Paz', 'Médio', 'BO', 1500, [
  'Villa Fátima|N|B','Achachicala|N|F','Ciudad Satélite|N|B',
  'Zona Sur|S|N','Calacoto|S|N','Obrajes|S|M',
  'Miraflores|L|M','San Pedro|L|M','Villa Dolores|L|B',
  'Sopocachi|O|N','Max Paredes|O|F','Cotahuma|O|B']),
'santa-cruz': ('Santa Cruz', 'Pequeno', 'BO', 1700, [
  'Urubó|N|N','Los Lotes|N|B',
  'Plan Tres Mil|S|F','El Bajío|S|B',
  'Pampa de la Isla|L|F','Villa Primero de Mayo|L|B',
  'Equipetrol|O|N','Centro|O|M']),
'cochabamba': ('Cochabamba', 'Pequeno', 'BO', 900, [
  'Cala Cala|N|N','Queru Queru|N|M',
  'Villa Pagador|S|F','Alalay|S|B',
  'Muyurina|L|M','Temporal|L|B',
  'Centro|O|M','Sarco|O|M']),

'caracas': ('Caracas', 'Médio', 'VE', 2200, [
  'Catia|N|F','La Candelaria|N|B','23 de Enero|N|F',
  'Coche|S|B','San Agustín|S|F','La Vega|S|F',
  'Petare|L|F','Chacao|L|N','Sabana Grande|L|M',
  'El Silencio|O|B','El Paraíso|O|M','Antímano|O|B']),
'centro-da-venezuela': ('Centro da Venezuela', 'Pequeno', 'VE', 1400, [
  'Naguanagua|N|N','San Blas|N|B',
  'Barinas Centro|S|M','Alto Barinas|S|M',
  'Valencia Centro|L|M','Puerto Cabello|L|B',
  'Acarigua|O|B','Araure|O|B']),
'oeste-da-venezuela': ('Oeste da Venezuela', 'Pequeno', 'VE', 1300, [
  'Maracaibo Centro|N|M','La Limpia|N|B',
  'Mérida Centro|S|M','Milla|S|B',
  'San Cristóbal Centro|L|M','Táriba|L|B',
  'Pueblo Nuevo|O|B','Santa Juana|O|N']),
'oriente-da-venezuela': ('Oriente da Venezuela', 'Pequeno', 'VE', 900, [
  'Maturín Centro|N|M','La Cruz|N|B',
  'Ciudad Bolívar Centro|S|M','Vista Hermosa|S|N',
  'Puerto La Cruz|L|M','Lechería|L|N',
  'Barcelona|O|B','Guanta|O|B']),
}

# ===================================================================
# AS RODOVIAS
# Duas pracas na mesma rodovia sao vizinhas (planejamento.js). O Brasil
# fica fora da malha de fora de proposito: de la pra ca so de aviao, que
# e como a caravana atravessa mesmo.
# ===================================================================
RODOVIAS = {
 'Ruta Panamericana': ['buenos-aires','buenos-aires-norte','norte-de-buenos-aires',
                       'san-martin-e-tres-de-febrero','rosario'],
 'Ruta 3': ['buenos-aires','avellaneda','lanus-e-lomas','quilmes-e-berazategui',
            'varela-e-ezeiza','la-plata','interior-de-buenos-aires'],
 'Ruta 7': ['buenos-aires-oeste','moron-e-merlo','interior-de-buenos-aires',
            'mendoza','cuyo-e-patagonia'],
 'Ruta 9': ['rosario','cordoba','tucuman','norte-da-argentina','litoral-argentino','la-paz'],
 'Corredor do Prata': ['buenos-aires','la-plata','montevideu','montevideu-oeste','assuncao'],
 'Corredor Andino': ['mendoza','santiago','valparaiso','centro-do-chile','la-paz'],
 'Ruta 5': ['norte-do-chile','norte-chico','valparaiso','santiago','santiago-sul',
            'centro-do-chile','concepcion'],
 'Autopista Norte-Sul': ['bogota','eixo-cafeteiro','medellin','cali','sul-da-colombia'],
 'Ruta do Caribe': ['medellin','costa-colombiana','norte-da-colombia','bogota',
                    'oeste-da-venezuela'],
 'Panamericana Sul': ['lima','sul-do-peru','norte-do-chile'],
 'Carretera Central': ['lima','cusco','sul-do-peru'],
 'Panamericana Equatoriana': ['quito','guayaquil','sul-do-equador','sul-da-colombia','lima'],
 'Ruta Bolívia': ['la-paz','cochabamba','santa-cruz'],
 'Autopista Venezuelana': ['caracas','centro-da-venezuela','oeste-da-venezuela',
                           'oriente-da-venezuela'],
}

# ===================================================================
# AS BARRAS
# (clubeId, nome, fundacao, membros)
# Entram so as que a pesquisa confirmou. As 54 que ficaram em duvida --
# quase todas da terceira divisao argentina e de clube pequeno -- estao
# fora ate o dono decidir: nome de organizada de verdade nao se inventa.
# ===================================================================
BARRAS = [
# ---------------- Argentina ----------------
("boca-juniors","La 12",1970,250),
("river-plate","Los Borrachos del Tablón",1975,250),
("racing","La Guardia Imperial",1958,200),
("independiente","La Barra del Rojo",1970,190),
("san-lorenzo","La Gloriosa Butteler",1959,180),
("rosario-central","Los Guerreros",1980,135),
("newell-s","La Hinchada Más Popular",1980,130),
("velez","La Pandilla de Liniers",1980,120),
("talleres","La Fiel",1979,120),
("estudiantes","Los Leales",1985,110),
("huracan","La Banda de la Quema",1975,110),
("gimnasia","La Banda de Fierro",1987,105),
("belgrano","Los Piratas Celestes de Alberdi",1985,100),
("atletico-tucuman","La Inimitable",1980,95),
("lanus","La Barra 14",1985,90),
("colon","Los de Siempre",1980,90),
("chacarita","Los Funebreros",1975,80),
("union","La Barra de la Bomba",1985,75),
("banfield","La Banda del Sur",1988,70),
("tigre","La Barra del Matador",1985,65),
("argentinos","Los Ninjas",1985,60),
("godoy-cruz","La Banda del Expreso",1990,60),
("instituto","La Barra del Gloria",1990,60),
("quilmes","Los Indios",1985,60),
("san-martin-tucuman","La Banda del Camion",1990,60),
("nueva-chicago","Los Torditos",1985,55),
("ferro","La Banda 100% Puro Ferro",1985,50),
("defensa-y-justicia","La Banda de Varela",1990,45),
("platense","La Banda Marrón",1990,45),
("all-boys","La Peste Blanca",1990,45),
("san-martin-sj","La Banda del Pueblo Viejo",1990,45),
("gimnasia-jujuy","La Banda del Lobo Jujeño",1990,45),
("atlanta","La Banda de Villa Crespo",1985,40),
("aldosivi","La Banda del Puerto",1990,40),
("los-andes","La Banda Descontrolada",1990,40),
("temperley","La Barra del Gasolero",1990,35),
("deportivo-moron","Los Borrachos del Oeste",1990,35),
("san-telmo","La Banda de la Isla",1990,30),
# ---------------- Chile ----------------
("colo-colo","Garra Blanca",1986,250),
("universidad-de-chile","Los de Abajo",1988,240),
("u-catolica","Los Cruzados",1992,160),
("santiago-wanderers","Los Panzers",1990,90),
("o-higgins","Trinchera Celeste",1995,55),
("cobreloa","Los Guerreros del Desierto",1990,55),
("coquimbo-unido","Los Piratas",1995,50),
("union-espanola","Los Marginales",1990,45),
("palestino","Los Baisanos",1990,40),
("everton","Los Ruleteros",1990,40),
("deportes-antofagasta","Los Pumas del Norte",1995,35),
("huachipato","Los Acereros",1995,35),
# ---------------- Colômbia ----------------
("atletico-nacional","Los del Sur",1997,230),
("millonarios","Comandos Azules",1992,220),
("america-de-cali","Barón Rojo Sur",1992,190),
("independiente-medellin","Rexixtenxia Norte",1996,170),
("deportivo-cali","Frente Radical Verdiblanco",1993,165),
("junior","Frente Rojiblanco Sur",1998,150),
("santa-fe","La Guardia Albirroja Sur",1998,140),
("once-caldas","Holocausto Norte",1998,70),
("deportes-tolima","Revolución Vinotinto Sur",1999,65),
("bucaramanga","Fortaleza Leoparda Sur",2000,60),
("deportivo-pereira","Lobo Sur",1999,55),
("union-magdalena","Garra Samaria Norte",1999,45),
("cucuta-deportivo","La Banda del Indio",1998,45),
("deportivo-pasto","Attake Masivo",2000,40),
("atletico-huila","Fuerza Opita",2000,30),
# ---------------- Uruguai ----------------
("penarol","Barra Amsterdam",1970,230),
("nacional-uru","La Banda del Parque",1970,230),
("defensor-sporting","La Banda del Violeta",1990,60),
("wanderers","La Banda del Bohemio",1990,45),
("danubio","La Banda del Franjeado",1990,45),
("cerro","La Banda del Villero",1985,45),
("liverpool","La Banda del Negriazul",1990,40),
# ---------------- Peru ----------------
("universitario","Trinchera Norte",1988,230),
("alianza-lima","Comando SVR",1988,230),
("sporting-cristal","Extremo Celeste",1993,130),
("melgar","Barra Roja Sur",1995,60),
("cienciano","Fuerza Oriente",1998,55),
("sport-boys","La Marea Rosada",1995,35),
# ---------------- Equador ----------------
("barcelona-sc","Sur Oscura",1997,220),
("emelec","Boca del Pozo",1997,200),
("ldu-quito","Muerte Blanca",1998,150),
("aucas","Armagedón",1999,90),
("el-nacional","Marea Roja",1998,60),
("deportivo-cuenca","Nueva Generación Roja",2000,45),
# ---------------- Paraguai ----------------
("olimpia","La Barra 79",1979,190),
("cerro-porteno","La Plaza y Comando",1990,190),
("libertad","La Banda del Gumarelo",1995,70),
("guarani-par","La Banda del Indio",1995,60),
# ---------------- Bolívia ----------------
("bolivar","Furia Celeste",1990,150),
("the-strongest","Ultra Sur",1995,145),
("oriente-petrolero","Los de Siempre",1995,110),
("blooming","La Banda del Cielo",1995,70),
("wilstermann","La Gloriosa",1995,60),
("always-ready","La Banda Roja",2000,55),
# ---------------- Venezuela ----------------
("deportivo-tachira","Avalancha Sur",1997,100),
("caracas","Los Demonios Rojos",1997,90),
("carabobo","La Banda Granate",2000,40),
("monagas","Guerreros del Guarapiche",2000,40),
("deportivo-la-guaira","La Banda Naranja",2010,40),
("zamora","Furia Llanera",2000,35),
]

# bairro-sede: onde a barra de verdade se junta, por clube -- duas barras
# de paises diferentes tem o mesmo nome ("Los de Siempre", "La Banda do
# Indio"), entao a chave e o clube. Quem nao esta aqui cai num bairro
# estavel da propria praca, sorteado por hash do nome e com preferencia
# por classe baixa e favela -- que e de onde barra sai.
SEDES = {
 # Argentina
 'boca-juniors':'La Boca', 'river-plate':'Núñez', 'racing':'Crucecita',
 'independiente':'Piñeyro', 'san-lorenzo':'Boedo', 'huracan':'Parque Patricios',
 'velez':'Liniers', 'estudiantes':'Casco Urbano', 'gimnasia':'Los Hornos',
 'rosario-central':'Arroyito', 'newell-s':'Tablada', 'talleres':'Barrio Talleres',
 'belgrano':'Alberdi', 'instituto':'Alta Córdoba', 'lanus':'Lanús Este',
 'banfield':'Banfield', 'argentinos':'La Paternal', 'tigre':'Victoria',
 'platense':'Vicente López', 'atletico-tucuman':'Barrio Norte',
 'godoy-cruz':'Godoy Cruz', 'union':'Barrio Sur', 'colon':'Centenario',
 'quilmes':'Quilmes Centro', 'ferro':'Caballito', 'all-boys':'Floresta',
 'atlanta':'Villa Crespo', 'nueva-chicago':'Mataderos', 'temperley':'Temperley',
 'los-andes':'Lomas de Zamora', 'san-telmo':'Isla Maciel',
 'chacarita':'Villa Maipú', 'defensa-y-justicia':'Florencio Varela',
 'aldosivi':'Puerto', 'san-martin-sj':'Pueblo Viejo',
 'deportivo-moron':'Morón Centro', 'gimnasia-jujuy':'Alto Comedero',
 'san-martin-tucuman':'Villa Luján',
 # Chile
 'colo-colo':'Macul', 'universidad-de-chile':'Ñuñoa', 'u-catolica':'Las Condes',
 'santiago-wanderers':'Playa Ancha', 'everton':'Viña del Mar',
 'union-espanola':'San Miguel', 'palestino':'La Cisterna',
 'o-higgins':'Rancagua Centro', 'cobreloa':'Calama Centro',
 'deportes-antofagasta':'Antofagasta Centro', 'coquimbo-unido':'Coquimbo Puerto',
 'huachipato':'Talcahuano',
 # Colombia
 'atletico-nacional':'Robledo', 'independiente-medellin':'Manrique',
 'millonarios':'Bosa', 'santa-fe':'San Cristóbal', 'america-de-cali':'Aguablanca',
 'deportivo-cali':'Siloé', 'junior':'Rebolo', 'union-magdalena':'Gaira',
 'once-caldas':'Chipre', 'deportivo-pereira':'Cuba',
 'deportes-tolima':'La Pola', 'deportivo-pasto':'Torobajo',
 'atletico-huila':'Calixto', 'bucaramanga':'García Rovira',
 'cucuta-deportivo':'Atalaya',
 # Uruguai
 'penarol':'Villa Española', 'nacional-uru':'Prado', 'wanderers':'Prado',
 'defensor-sporting':'Parque Rodó', 'danubio':'Maroñas',
 'cerro':'Villa del Cerro', 'liverpool':'Belvedere',
 # Peru
 'universitario':'Rímac', 'alianza-lima':'La Victoria',
 'sporting-cristal':'Rímac', 'sport-boys':'Callao',
 'melgar':'Arequipa Cercado', 'cienciano':'Wanchaq',
 # Equador
 'barcelona-sc':'Suburbio', 'emelec':'Astillero', 'ldu-quito':'Cotocollao',
 'aucas':'Chimbacalle', 'el-nacional':'La Magdalena',
 'deportivo-cuenca':'Totoracocha',
 # Paraguai
 'olimpia':'Centro', 'cerro-porteno':'Barrio Obrero', 'libertad':'Tacumbú',
 'guarani-par':'Trinidad',
 # Bolivia
 'bolivar':'Miraflores', 'the-strongest':'Max Paredes',
 'always-ready':'Villa Fátima', 'wilstermann':'Temporal',
 'oriente-petrolero':'Pampa de la Isla', 'blooming':'Villa Primero de Mayo',
 # Venezuela
 'caracas':'Catia', 'deportivo-la-guaira':'La Vega',
 'deportivo-tachira':'San Cristóbal Centro', 'carabobo':'Valencia Centro',
 'monagas':'Maturín Centro', 'zamora':'Barinas Centro',
}

# os classicos: maiores rivais, por par de clube
CLASSICOS = [
 ('boca-juniors','river-plate'), ('racing','independiente'),
 ('san-lorenzo','huracan'), ('estudiantes','gimnasia'),
 ('newell-s','rosario-central'), ('talleres','belgrano'),
 ('belgrano','instituto'), ('talleres','instituto'),
 ('lanus','banfield'), ('colon','union'),
 ('atletico-tucuman','san-martin-tucuman'), ('chacarita','atlanta'),
 ('all-boys','nueva-chicago'), ('aldosivi','san-telmo'),
 ('colo-colo','universidad-de-chile'), ('universidad-de-chile','u-catolica'),
 ('colo-colo','u-catolica'), ('santiago-wanderers','everton'),
 ('cobreloa','deportes-antofagasta'),
 ('atletico-nacional','independiente-medellin'), ('millonarios','santa-fe'),
 ('america-de-cali','deportivo-cali'), ('once-caldas','deportivo-pereira'),
 ('junior','union-magdalena'),
 ('penarol','nacional-uru'), ('cerro','danubio'),
 ('universitario','alianza-lima'), ('sporting-cristal','universitario'),
 ('alianza-lima','sporting-cristal'), ('melgar','cienciano'),
 ('barcelona-sc','emelec'), ('ldu-quito','el-nacional'), ('ldu-quito','aucas'),
 ('olimpia','cerro-porteno'), ('libertad','guarani-par'),
 ('bolivar','the-strongest'), ('oriente-petrolero','blooming'),
 ('caracas','deportivo-tachira'), ('caracas','deportivo-la-guaira'),
]

TAMANHO = {
 # tamanho: (nivel, quarteiroes, grade, guardas, pms, choque, fatia de rua)
 'Grande':  (1, 196, [14, 14], 5, 12, 3, 0.16),
 'Médio':   (2, 120, [10, 12], 2,  6, 1, 0.12),
 'Pequeno': (3,  64,  [8, 8],  1,  3, 0, 0.10),
}
ZONA_LONGA = {'N':'Norte', 'S':'Sul', 'L':'Leste', 'O':'Oeste'}
CLASSE = {'N': ('Nobre', 1.5), 'M': ('Classe Média', 1.0),
          'B': ('Classe Baixa', 0.8), 'F': ('Favela', 0.4)}
PAIS_DE_UF = {'AR':'Argentina', 'CL':'Chile', 'CO':'Colômbia', 'UY':'Uruguai',
              'PE':'Peru', 'EC':'Equador', 'PY':'Paraguai', 'BO':'Bolívia',
              'VE':'Venezuela'}


def sem_acento(t):
    return ''.join(c for c in unicodedata.normalize('NFD', str(t))
                   if unicodedata.category(c) != 'Mn')


def ident(t):
    s = sem_acento(t).strip().lower().replace('_', '-')
    s = ''.join(c if c.isalnum() else '-' for c in s)
    while '--' in s:
        s = s.replace('--', '-')
    return s.strip('-')


def hashado(t):
    h = 0
    for c in str(t):
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return h


def ler_times():
    txt = (RAIZ / 'dados/times.js').read_text(encoding='utf-8')
    return [json.loads(l.strip().rstrip(','))
            for l in txt.splitlines() if l.strip().startswith('{')]


def ler_torcidas():
    txt = (RAIZ / 'dados/torcidas.js').read_text(encoding='utf-8')
    return [json.loads(l.strip().rstrip(','))
            for l in txt.splitlines() if l.strip().startswith('{')]


def sigla_curta(nome):
    """sigla da barra: iniciais das palavras que valem, no maximo 8."""
    corta = {'de','del','da','do','la','las','los','el','y','e','a'}
    ps = [p for p in sem_acento(nome).upper().split() if p.lower() not in corta]
    s = ''.join(p[0] for p in ps)
    if len(s) < 3:
        s = sem_acento(nome).upper().replace(' ', '')[:6]
    return s[:8]


def montar_pracas(times):
    """as 49 pracas, com bairros, times e efetivo de rua"""
    por_mapa = {}
    for t in times:
        por_mapa.setdefault(t.get('mapa', ''), []).append(t)

    rod_de = {}
    for nome, lista in RODOVIAS.items():
        for p in lista:
            rod_de.setdefault(p, []).append(nome)

    cidades, avisos = [], []
    for pid, (nome, tam, uf, pop, bs) in PRACAS.items():
        nivel, quart, grade, guardas, pms, choque, fatia = TAMANHO[tam]
        bairros, zonas = [], {}
        for b in bs:
            n, z, c = b.split('|')
            classe, mult = CLASSE[c]
            zona = ZONA_LONGA[z]
            zonas[zona] = zonas.get(zona, 0) + 1
            bairros.append({'id': ident(n), 'nome': n, 'zona': zona,
                            'classe': classe, 'mult': mult, 'sedes': []})
        esperado = len(bs) // 4
        ruins = [f'{z}={zonas.get(z,0)}' for z in ZONA_LONGA.values()
                 if zonas.get(z, 0) != esperado]
        if ruins:
            avisos.append(f'{nome}: por zona {" ".join(ruins)}, esperado {esperado}')

        locais = sorted(por_mapa.get(pid, []), key=lambda t: -t.get('qualidade', 0))
        pais = PAIS_DE_UF.get(uf, uf)
        # os grandes do pais que nao moram aqui ainda tem torcedor na praca
        forasteiros = [t for t in times
                       if t.get('pais') == pais and t.get('mapa') != pid][:0]
        gr = sorted([t for t in times if t.get('pais') == pais
                     and t.get('mapa') != pid],
                    key=lambda t: -t.get('qualidade', 0))[:2]
        forasteiros = gr

        peso = {t['id']: max(1, t.get('qualidade', 10)) ** 1.4 for t in locais}
        soma = sum(peso.values()) or 1
        sobra = 100.0 - 3.0 * len(forasteiros)
        lista_times = []
        for t in locais:
            perc = round(sobra * peso[t['id']] / soma, 1)
            lista_times.append({'clube': t['nome'], 'clubeId': t['id'],
                                'sigla': t.get('sigla', ''), 'perc': perc,
                                'torcedores': round(perc / 100 * pop),
                                'estadioProprio': True, 'local': True})
        for t in forasteiros:
            lista_times.append({'clube': t['nome'], 'clubeId': t['id'],
                                'sigla': t.get('sigla', ''), 'perc': 3.0,
                                'torcedores': round(0.03 * pop),
                                'estadioProprio': False, 'local': False})

        mult_medio = round(sum(b['mult'] for b in bairros) / len(bairros), 3)
        cidades.append({
            'id': pid, 'nome': nome, 'uf': uf, 'regiao': pais,
            'nivel': nivel, 'tamanho': tam, 'quarteiroes': quart,
            'grade': list(grade), 'populacao': pop, 'temMetro': tam != 'Pequeno',
            'estadios': sorted({t['estadio'] for t in locais if t.get('estadio')}),
            'rodovias': rod_de.get(pid, []),
            'multMedio': mult_medio,
            'torcedores': round(pop * fatia),
            'guardas': guardas, 'pms': pms, 'choque': choque,
            'bairros': bairros, 'times': lista_times, 'fora': True,
        })
    return cidades, avisos


def cargos_de(m):
    return {'povao': round(m * 0.5), 'componentes': round(m * 0.3),
            'frente': round(m * 0.15), 'diretoria': min(10, round(m * 0.05))}


def sede_nivel(m):
    return 4 if m >= 150 else 3 if m >= 80 else 2 if m >= 40 else 1


def bairro_da_sede(clube_id, barra, praca):
    """o bairro que a pesquisa deu; se nao bater com a praca, um estavel
    da propria praca, com preferencia por classe baixa e favela."""
    alvo = SEDES.get(clube_id)
    if alvo:
        for b in praca['bairros']:
            if b['nome'] == alvo:
                return b['nome'], True
    pobres = [b for b in praca['bairros'] if b['classe'] in ('Classe Baixa', 'Favela')]
    pool = pobres or praca['bairros']
    return pool[hashado(barra) % len(pool)]['nome'], False


def montar_torcidas(times, pracas):
    por_id = {t['id']: t for t in times}
    por_praca = {c['id']: c for c in pracas}
    div_do_pais = {}
    for t in times:
        div_do_pais.setdefault(t.get('pais', ''), [])
        if t['divisao'] not in div_do_pais[t['pais']]:
            div_do_pais[t['pais']].append(t['divisao'])

    fora, sem_sede = [], []
    for clube_id, nome, fund, membros in BARRAS:
        c = por_id[clube_id]
        praca = por_praca[c['mapa']]
        bairro, casou = bairro_da_sede(clube_id, nome, praca)
        if not casou:
            sem_sede.append(f'{nome} ({clube_id})')
        cor = c.get('cores', ['#8a8a8a', '#8a8a8a'])
        pais = c.get('pais', '')
        fora.append({
            'id': ident(nome) + '-' + ident(clube_id)[:12],
            'nome': nome, 'clube': c['nome'], 'clubeId': clube_id,
            'sigla': c.get('sigla', ''), 'siglaTorcida': sigla_curta(nome),
            'cidade': praca['nome'], 'mapa': c['mapa'], 'uf': c.get('uf', ''),
            'regiao': pais, 'estadio': c.get('estadio', ''),
            'divisaoClube': div_do_pais[pais].index(c['divisao']) + 1,
            'bairroSede': bairro,
            'fundacao': fund,
            'fundacaoMes': 1 + hashado(nome) % 12,
            'fundacaoDia': 1 + hashado(nome + 'd') % 28,
            'cores': [cor[0], cor[1] if len(cor) > 1 else cor[0]],
            'detalhe': '#e9e9e9',
            'membros': membros,
            'sedeNivel': sede_nivel(membros),
            'moral': 60,
            'prestigio': sede_nivel(membros) * 15,
            'saldo': membros * 10,
            'poder': round(membros * 0.9835 + 8.3, 1),
            'cargos': cargos_de(membros),
            'aliados': [], 'irmandade': [], 'rivais': [], 'maioresRivais': [],
            'fora': True,
        })

    # ---- o grafo ----
    # maior rival e o classico. Rival comum e quem divide a praca ou joga
    # a mesma divisao no mesmo pais. Alianca fica vazia de proposito: a
    # barra brava nao tem a rede de aliadas que a organizada brasileira
    # tem, e inventar hermanamiento seria inventar fato.
    por_clube = {t['clubeId']: t for t in fora}
    for a, b in CLASSICOS:
        ta, tb = por_clube.get(a), por_clube.get(b)
        if not ta or not tb:
            continue
        if tb['id'] not in ta['maioresRivais']:
            ta['maioresRivais'].append(tb['id'])
        if ta['id'] not in tb['maioresRivais']:
            tb['maioresRivais'].append(ta['id'])

    for t in fora:
        for o in fora:
            if o['id'] == t['id']:
                continue
            if o['id'] in t['maioresRivais']:
                continue
            mesma_praca = o['mapa'] == t['mapa']
            mesma_liga = (o['regiao'] == t['regiao'] and
                          o['divisaoClube'] == t['divisaoClube'])
            if mesma_praca or mesma_liga:
                t['rivais'].append(o['id'])

    for t in fora:
        t['rivais'].sort()
        t['maioresRivais'].sort()
    return fora, sem_sede


def main():
    times = ler_times()
    pracas, avisos = montar_pracas(times)
    torcidas, sem_sede = montar_torcidas(times, pracas)

    # a sede tambem mora no bairro, que e o que o mapa da praca le
    por_praca = {c['id']: c for c in pracas}
    for t in torcidas:
        for b in por_praca[t['mapa']]['bairros']:
            if b['nome'] == t['bairroSede']:
                b['sedes'].append(t['nome'])

    lp = ',\n'.join('  ' + json.dumps(c, ensure_ascii=False) for c in pracas)
    lt = ',\n'.join('  ' + json.dumps(t, ensure_ascii=False) for t in torcidas)
    saida = RAIZ / 'dados/barras.js'
    saida.write_text(
        f'/* BARRAS BRAVAS — {len(torcidas)} organizadas de nove países,\n'
        f'   em {len(pracas)} praças com '
        f'{sum(len(c["bairros"]) for c in pracas)} bairros.\n'
        f'   GERADO por ferramentas/importar_barras.py — nao editar a mao.\n'
        f'   Entra DEPOIS de cidades.js e torcidas.js: empurra nos mesmos vetores. */\n'
        f'(function(){{\n'
        f'  const pracas = [\n{lp}\n  ];\n'
        f'  const torcidas = [\n{lt}\n  ];\n'
        f'  TO.dados.cidades  = (TO.dados.cidades  || []).concat(pracas);\n'
        f'  TO.dados.torcidas = (TO.dados.torcidas || []).concat(torcidas);\n'
        f'}})();\n', encoding='utf-8')
    print(f'  dados/barras.js: {saida.stat().st_size/1024:.0f} KB')

    # ---------------- conferencia ----------------
    print('\nconferencia:')
    print(f'  barras: {len(torcidas)} · praças: {len(pracas)} · '
          f'bairros: {sum(len(c["bairros"]) for c in pracas)}')
    ids_clube = {t['id'] for t in times}
    orfas = [t['clubeId'] for t in torcidas if t['clubeId'] not in ids_clube]
    print(f'  clube fora de times.js: {orfas or "nenhum"}')

    velhas = ler_torcidas()
    colisao = ({t['id'] for t in torcidas} & {t['id'] for t in velhas})
    print(f'  id colidindo com torcida brasileira: {sorted(colisao) or "nenhum"}')
    dobrado = len(torcidas) - len({t['id'] for t in torcidas})
    print(f'  id repetido entre as novas: {dobrado}')

    por_pais = {}
    for t in torcidas:
        por_pais[t['regiao']] = por_pais.get(t['regiao'], 0) + 1
    print('  por país: ' + ', '.join(f'{k} {v}' for k, v in sorted(por_pais.items())))

    print(f'  bairro-sede da pesquisa que não bateu com a praça: {len(sem_sede)}'
          + (f' {sem_sede[:6]}' if sem_sede else ''))

    m = [t['membros'] for t in torcidas]
    print(f'  efetivo: menor {min(m)} · maior {max(m)} · soma {sum(m)}')

    rel = sum(len(t['rivais']) + len(t['maioresRivais']) for t in torcidas)
    sem = [t['nome'] for t in torcidas if not t['rivais'] and not t['maioresRivais']]
    print(f'  relações direcionais: {rel} · sem rival nenhum: {sem or "nenhuma"}')

    # simetria
    porid = {t['id']: t for t in torcidas}
    assim = 0
    for t in torcidas:
        for campo in ('rivais', 'maioresRivais'):
            for alvo in t[campo]:
                o = porid.get(alvo)
                if not o or t['id'] not in (o['rivais'] + o['maioresRivais']):
                    assim += 1
    print(f'  relação sem volta: {assim}')

    # classes por tamanho
    for tam in ('Grande', 'Médio', 'Pequeno'):
        cs = [b['classe'] for c in pracas if c['tamanho'] == tam for b in c['bairros']]
        n = sum(1 for c in pracas if c['tamanho'] == tam) or 1
        d = {}
        for x in cs:
            d[x] = d.get(x, 0) + 1
        print(f'  {tam} ({n}): ' + ', '.join(f'{k} {v/n:.1f}' for k, v in sorted(d.items())))

    # malha de estrada: alguma praça ilhada?
    ilhadas = [c['nome'] for c in pracas if not c['rodovias']]
    print(f'  praça sem rodovia (só de avião): {ilhadas or "nenhuma"}')


if __name__ == '__main__':
    main()
