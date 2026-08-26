/* =========================================================
   HISTÓRIA REAL DAS COMPETIÇÕES (pedido do dono, 25/08/2026)
   ---------------------------------------------------------
   Campeões e vices ano a ano, condizentes com a realidade,
   pra tela de Histórico de cada competição. O jogo emenda os
   anos jogados (2026+) por cima desta base.

   · `anos`: [ano, campeão, vice] — vice null quando a fonte
     não crava. Ano pode ser string ("1967 (Taça Brasil)").
   · `maiores`: contagem REAL de títulos de toda a história
     (mesmo quando a lista de anos não vai até o início).
     Sem `maiores`, a tela conta a partir da própria lista.
   · `nota`: de onde a lista começa e por quê.
   ========================================================= */
window.TO = window.TO || {};
TO.dados = TO.dados || {};

TO.dados.historia = {

'brasileirao-serie-a': {
 nome:'Brasileirão Série A',
 nota:'Taça Brasil (1959–68) e Roberto Gomes Pedrosa (1967–70) contam como edições do nacional, como a CBF conta.',
 maiores:[['Palmeiras',12],['Flamengo',8],['Santos',8],['Corinthians',7],
  ['São Paulo',6],['Cruzeiro',4],['Fluminense',4],['Vasco da Gama',4],
  ['Internacional',3],['Botafogo',3],['Grêmio',2],['Bahia',2],['Atlético-MG',2]],
 anos:[
  [2025,'Flamengo','Palmeiras'],[2024,'Botafogo','Palmeiras'],
  [2023,'Palmeiras','Grêmio'],[2022,'Palmeiras','Internacional'],
  [2021,'Atlético-MG','Flamengo'],[2020,'Flamengo','Internacional'],
  [2019,'Flamengo','Santos'],[2018,'Palmeiras','Flamengo'],
  [2017,'Corinthians','Palmeiras'],[2016,'Palmeiras','Santos'],
  [2015,'Corinthians','Atlético-MG'],[2014,'Cruzeiro','São Paulo'],
  [2013,'Cruzeiro','Grêmio'],[2012,'Fluminense','Atlético-MG'],
  [2011,'Corinthians','Vasco da Gama'],[2010,'Fluminense','Cruzeiro'],
  [2009,'Flamengo','Internacional'],[2008,'São Paulo','Grêmio'],
  [2007,'São Paulo','Santos'],[2006,'São Paulo','Internacional'],
  [2005,'Corinthians','Internacional'],[2004,'Santos','Athletico-PR'],
  [2003,'Cruzeiro','Santos'],[2002,'Santos','Corinthians'],
  [2001,'Athletico-PR','São Caetano'],['2000 (Copa João Havelange)','Vasco da Gama','São Caetano'],
  [1999,'Corinthians','Atlético-MG'],[1998,'Corinthians','Cruzeiro'],
  [1997,'Vasco da Gama','Palmeiras'],[1996,'Grêmio','Portuguesa'],
  [1995,'Botafogo','Santos'],[1994,'Palmeiras','Corinthians'],
  [1993,'Palmeiras','Vitória'],[1992,'Flamengo','Botafogo'],
  [1991,'São Paulo','Bragantino'],[1990,'Corinthians','São Paulo'],
  [1989,'Vasco da Gama','São Paulo'],[1988,'Bahia','Internacional'],
  [1987,'Sport','Guarani'],[1986,'São Paulo','Guarani'],
  [1985,'Coritiba','Bangu'],[1984,'Fluminense','Vasco da Gama'],
  [1983,'Flamengo','Santos'],[1982,'Flamengo','Grêmio'],
  [1981,'Grêmio','São Paulo'],[1980,'Flamengo','Atlético-MG'],
  [1979,'Internacional','Vasco da Gama'],[1978,'Guarani','Palmeiras'],
  [1977,'São Paulo','Atlético-MG'],[1976,'Internacional','Corinthians'],
  [1975,'Internacional','Cruzeiro'],[1974,'Vasco da Gama','Cruzeiro'],
  [1973,'Palmeiras','São Paulo'],[1972,'Palmeiras','Botafogo'],
  [1971,'Atlético-MG','São Paulo'],
  ['1970 (RGP)','Fluminense','Palmeiras'],['1969 (RGP)','Palmeiras','Cruzeiro'],
  ['1968 (RGP)','Santos','Internacional'],['1968 (Taça Brasil)','Botafogo','Fortaleza'],
  ['1967 (RGP)','Palmeiras','Internacional'],['1967 (Taça Brasil)','Palmeiras','Náutico'],
  [1966,'Cruzeiro','Santos'],[1965,'Santos','Vasco da Gama'],
  [1964,'Santos','Flamengo'],[1963,'Santos','Bahia'],
  [1962,'Santos','Botafogo'],[1961,'Santos','Bahia'],
  [1960,'Palmeiras','Fortaleza'],[1959,'Bahia','Santos']]},

'brasileirao-serie-b': {
 nome:'Brasileirão Série B',
 nota:'A Série B não foi disputada em 1973–79, 1986–87 e 1993; em 2000 o Módulo Amarelo não é reconhecido pela CBF.',
 anos:[
  [2025,'Coritiba','Athletico-PR'],[2024,'Santos','Mirassol'],
  [2023,'Vitória','Juventude'],[2022,'Cruzeiro','Grêmio'],
  [2021,'Botafogo','Coritiba'],[2020,'Chapecoense','América-MG'],
  [2019,'Bragantino','Sport'],[2018,'Fortaleza','Avaí'],
  [2017,'América-MG','Internacional'],[2016,'Atlético-GO','Avaí'],
  [2015,'Botafogo','Santa Cruz'],[2014,'Joinville','Ponte Preta'],
  [2013,'Palmeiras','Chapecoense'],[2012,'Goiás','Criciúma'],
  [2011,'Portuguesa','Náutico'],[2010,'Coritiba','Figueirense'],
  [2009,'Vasco da Gama','Guarani'],[2008,'Corinthians','Santo André'],
  [2007,'Coritiba','Ipatinga'],[2006,'Atlético-MG','Sport'],
  [2005,'Grêmio','Santa Cruz'],[2004,'Brasiliense','CRB'],
  [2003,'Palmeiras','Botafogo'],[2002,'Criciúma','Fortaleza'],
  [2001,'Paysandu','Figueirense'],[1999,'Goiás','Paraná'],
  [1998,'Gama','Botafogo-SP'],[1997,'América-MG','Vila Nova'],
  [1996,'União São João','América-RN'],[1995,'Athletico-PR','Coritiba'],
  [1994,'Juventude','Goiás'],[1992,'Paraná','Marcílio Dias'],
  [1991,'Paysandu','Ceará'],[1990,'Sport','Atlético-GO'],
  [1989,'Bragantino','Inter de Limeira'],[1988,'Inter de Limeira','Náutico'],
  [1985,'Tuna Luso',null],[1984,'Uberlândia',null],
  [1983,'Juventus',null],[1982,'Campo Grande',null],
  [1981,'Guarani',null],[1980,'Londrina',null],
  [1972,'Sampaio Corrêa',null],[1971,'Villa Nova',null]]},

'brasileirao-serie-c': {
 nome:'Brasileirão Série C',
 nota:'A Série C não foi disputada em 1982–87, 1989, 1991, 1993 e 2000.',
 anos:[
  [2025,'Ponte Preta','Londrina'],[2024,'Volta Redonda','Athletic-MG'],
  [2023,'Amazonas','Brusque'],[2022,'Mirassol','ABC'],
  [2021,'Ituano','Tombense'],[2020,'Vila Nova','Remo'],
  [2019,'Náutico','Sampaio Corrêa'],[2018,'Operário-PR','Cuiabá'],
  [2017,'Fortaleza','CSA'],[2016,'Boa Esporte','Fortaleza'],
  [2015,'Vila Nova','Londrina'],[2014,'Macaé','Paysandu'],
  [2013,'Santa Cruz','Sampaio Corrêa'],[2012,'Oeste','Icasa'],
  [2011,'Joinville','CRB'],[2010,'ABC','Chapecoense'],
  [2009,'América-MG','ASA'],[2008,'Atlético-GO','Duque de Caxias'],
  [2007,'Bragantino','Vila Nova'],[2006,'Criciúma','Vitória'],
  [2005,'Remo','Gama'],[2004,'União Barbarense',null],
  [2003,'Ituano',null],[2002,'Brasiliense',null],
  [2001,'Paulista',null],[1999,'Fluminense',null],
  [1998,'Avaí',null],[1997,'Sampaio Corrêa',null],
  [1996,'Vila Nova',null],[1995,'XV de Piracicaba',null],
  [1994,'Novorizontino',null],[1992,'Tuna Luso',null],
  [1990,'Atlético-GO',null],[1988,'União São João',null],
  [1981,'Olaria',null]]},

'brasileirao-serie-d': {
 nome:'Brasileirão Série D',
 nota:'A Série D existe desde 2009.',
 anos:[
  [2025,'Barra-SC',null],[2024,'Retrô','Anápolis'],
  [2023,'Ferroviária','Caxias'],[2022,'América-RN','Pouso Alegre'],
  [2021,'Aparecidense','Campinense'],[2020,'Mirassol','Floresta'],
  [2019,'Brusque','Manaus'],[2018,'Ferroviário','Treze'],
  [2017,'Operário-PR','Globo'],[2016,'Volta Redonda','CSA'],
  [2015,'Botafogo-SP','Remo'],[2014,'Tombense','Confiança'],
  [2013,'Botafogo-PB','Juventude'],[2012,'Sampaio Corrêa','Cuiabá'],
  [2011,'Tupi','Santa Cruz'],[2010,'Guarany de Sobral','América-RN'],
  [2009,'São Raimundo-PA','Macaé']]},

'copa-do-brasil': {
 nome:'Copa do Brasil',
 maiores:[['Cruzeiro',6],['Flamengo',5],['Grêmio',5],['Corinthians',4],
  ['Palmeiras',4],['Atlético-MG',2]],
 anos:[
  [2025,'Corinthians','Vasco da Gama'],[2024,'Flamengo','Atlético-MG'],
  [2023,'São Paulo','Flamengo'],[2022,'Flamengo','Corinthians'],
  [2021,'Atlético-MG','Athletico-PR'],[2020,'Palmeiras','Grêmio'],
  [2019,'Athletico-PR','Internacional'],[2018,'Cruzeiro','Corinthians'],
  [2017,'Cruzeiro','Flamengo'],[2016,'Grêmio','Atlético-MG'],
  [2015,'Palmeiras','Santos'],[2014,'Atlético-MG','Cruzeiro'],
  [2013,'Flamengo','Athletico-PR'],[2012,'Palmeiras','Coritiba'],
  [2011,'Vasco da Gama','Coritiba'],[2010,'Santos','Vitória'],
  [2009,'Corinthians','Internacional'],[2008,'Sport','Corinthians'],
  [2007,'Fluminense','Figueirense'],[2006,'Flamengo','Vasco da Gama'],
  [2005,'Paulista','Fluminense'],[2004,'Santo André','Flamengo'],
  [2003,'Cruzeiro','Flamengo'],[2002,'Corinthians','Brasiliense'],
  [2001,'Grêmio','Corinthians'],[2000,'Cruzeiro','São Paulo'],
  [1999,'Juventude','Botafogo'],[1998,'Palmeiras','Cruzeiro'],
  [1997,'Grêmio','Flamengo'],[1996,'Cruzeiro','Palmeiras'],
  [1995,'Corinthians','Grêmio'],[1994,'Grêmio','Ceará'],
  [1993,'Cruzeiro','Grêmio'],[1992,'Internacional','Fluminense'],
  [1991,'Criciúma','Grêmio'],[1990,'Flamengo','Goiás'],
  [1989,'Grêmio','Sport']]},

'copa-do-nordeste': {
 nome:'Copa do Nordeste',
 nota:'A copa moderna: 1994 e de 1997 em diante (parou em 2004–09, 2011–12).',
 anos:[
  [2025,'Bahia','Confiança'],[2024,'Fortaleza','CRB'],
  [2023,'Ceará','Sport'],[2022,'Fortaleza','Sport'],
  [2021,'Bahia','Ceará'],[2020,'Ceará','Bahia'],
  [2019,'Fortaleza','Botafogo-PB'],[2018,'Sampaio Corrêa','Bahia'],
  [2017,'Bahia','Sport'],[2016,'Santa Cruz','Campinense'],
  [2015,'Ceará','Bahia'],[2014,'Sport','Ceará'],
  [2013,'Campinense','ASA'],[2010,'Vitória','ABC'],
  [2003,'Vitória','Bahia'],[2002,'Bahia','Sport'],
  [2001,'Bahia','Sport'],[2000,'Sport','América-RN'],
  [1999,'Vitória','Bahia'],[1998,'América-RN','CSA'],
  [1997,'Vitória','Bahia'],[1994,'Sport','Fortaleza']]},

'paulistao': {
 nome:'Paulistão',
 nota:'A lista ano a ano entra de 1971 pra cá; a contagem de títulos vale a história inteira, desde 1902.',
 maiores:[['Corinthians',31],['Palmeiras',26],['Santos',22],['São Paulo',22],
  ['Paulistano',11],['Portuguesa',3],['Ituano',2]],
 anos:[
  [2025,'Corinthians','Palmeiras'],[2024,'Palmeiras','Santos'],
  [2023,'Palmeiras','Água Santa'],[2022,'Palmeiras','São Paulo'],
  [2021,'São Paulo','Palmeiras'],[2020,'Palmeiras','Corinthians'],
  [2019,'Corinthians','São Paulo'],[2018,'Corinthians','Palmeiras'],
  [2017,'Corinthians','Ponte Preta'],[2016,'Santos','Audax'],
  [2015,'Santos','Palmeiras'],[2014,'Ituano','Santos'],
  [2013,'Corinthians','Santos'],[2012,'Santos','Guarani'],
  [2011,'Santos','Corinthians'],[2010,'Santos','Santo André'],
  [2009,'Corinthians','Santos'],[2008,'Palmeiras','Ponte Preta'],
  [2007,'Santos','São Caetano'],[2006,'Santos','São Paulo'],
  [2005,'São Paulo','Corinthians'],[2004,'São Caetano','Paulista'],
  [2003,'Corinthians','São Paulo'],[2002,'Ituano','União Barbarense'],
  [2001,'Corinthians','Botafogo-SP'],[2000,'São Paulo','Santos'],
  [1999,'Corinthians','Palmeiras'],[1998,'São Paulo','Corinthians'],
  [1997,'Corinthians','São Paulo'],[1996,'Palmeiras','São Paulo'],
  [1995,'Corinthians','Palmeiras'],[1994,'Palmeiras','Corinthians'],
  [1993,'Palmeiras','Corinthians'],[1992,'São Paulo','Palmeiras'],
  [1991,'São Paulo','Corinthians'],[1990,'Bragantino','Corinthians'],
  [1989,'São Paulo','Corinthians'],[1988,'Corinthians','Guarani'],
  [1987,'São Paulo','Corinthians'],[1986,'Inter de Limeira','Palmeiras'],
  [1985,'São Paulo','Portuguesa'],[1984,'Santos','Corinthians'],
  [1983,'Corinthians','São Paulo'],[1982,'Corinthians','São Paulo'],
  [1981,'São Paulo','Ponte Preta'],[1980,'São Paulo','Santos'],
  [1979,'Corinthians','Ponte Preta'],[1978,'Santos','São Paulo'],
  [1977,'São Paulo','Ponte Preta'],[1976,'Palmeiras','XV de Piracicaba'],
  [1975,'São Paulo','Portuguesa'],[1974,'Palmeiras','Corinthians'],
  ['1973 (dividido)','Portuguesa e Santos',null],[1972,'Palmeiras','São Paulo'],
  [1971,'São Paulo','Palmeiras']]},

'cariocao': {
 nome:'Cariocão',
 nota:'A lista ano a ano entra de 1971 pra cá; a contagem de títulos vale a história inteira, desde 1906.',
 maiores:[['Flamengo',39],['Fluminense',33],['Vasco da Gama',24],
  ['Botafogo',21],['América-RJ',7],['Bangu',2]],
 anos:[
  [2025,'Flamengo','Fluminense'],[2024,'Flamengo','Nova Iguaçu'],
  [2023,'Fluminense','Flamengo'],[2022,'Fluminense','Flamengo'],
  [2021,'Flamengo','Fluminense'],[2020,'Flamengo','Fluminense'],
  [2019,'Flamengo','Vasco da Gama'],[2018,'Botafogo','Vasco da Gama'],
  [2017,'Flamengo','Fluminense'],[2016,'Vasco da Gama','Botafogo'],
  [2015,'Vasco da Gama','Botafogo'],[2014,'Flamengo','Vasco da Gama'],
  [2013,'Botafogo','Fluminense'],[2012,'Fluminense','Botafogo'],
  [2011,'Flamengo','Vasco da Gama'],[2010,'Botafogo','Flamengo'],
  [2009,'Flamengo','Botafogo'],[2008,'Flamengo','Botafogo'],
  [2007,'Flamengo','Botafogo'],[2006,'Botafogo','Madureira'],
  [2005,'Fluminense','Volta Redonda'],[2004,'Flamengo','Vasco da Gama'],
  [2003,'Vasco da Gama','Fluminense'],[2002,'Fluminense','Americano'],
  [2001,'Flamengo','Vasco da Gama'],[2000,'Flamengo','Vasco da Gama'],
  [1999,'Flamengo','Vasco da Gama'],[1998,'Vasco da Gama','Flamengo'],
  [1997,'Botafogo','Vasco da Gama'],[1996,'Flamengo','Vasco da Gama'],
  [1995,'Fluminense','Flamengo'],[1994,'Vasco da Gama','Fluminense'],
  [1993,'Vasco da Gama','Botafogo'],[1992,'Vasco da Gama','Flamengo'],
  [1991,'Flamengo','Botafogo'],[1990,'Botafogo','Vasco da Gama'],
  [1989,'Botafogo','Flamengo'],[1988,'Vasco da Gama','Flamengo'],
  [1987,'Vasco da Gama','Flamengo'],[1986,'Flamengo','Vasco da Gama'],
  [1985,'Fluminense','Bangu'],[1984,'Fluminense','Vasco da Gama'],
  [1983,'Fluminense','Flamengo'],[1982,'Vasco da Gama','Flamengo'],
  [1981,'Flamengo','Vasco da Gama'],[1980,'Fluminense','Flamengo'],
  ['1979 (Especial)','Flamengo','Vasco da Gama'],[1979,'Flamengo','Fluminense'],
  [1978,'Flamengo','Vasco da Gama'],[1977,'Vasco da Gama','Flamengo'],
  [1976,'Fluminense','Vasco da Gama'],[1975,'Fluminense','Flamengo'],
  [1974,'Flamengo','Vasco da Gama'],[1973,'Fluminense','Flamengo'],
  [1972,'Flamengo','Fluminense'],[1971,'Fluminense','Botafogo']]},

'mineiro': {
 nome:'Campeonato Mineiro',
 nota:'A lista ano a ano entra de 2016 pra cá; a contagem de títulos vale a história inteira, desde 1915.',
 maiores:[['Atlético-MG',50],['Cruzeiro',38],['América-MG',16],['Villa Nova',5]],
 anos:[
  [2025,'Atlético-MG','América-MG'],[2024,'Atlético-MG','Cruzeiro'],
  [2023,'Atlético-MG','América-MG'],[2022,'Atlético-MG','Cruzeiro'],
  [2021,'Atlético-MG','América-MG'],[2020,'Atlético-MG','Tombense'],
  [2019,'Cruzeiro','Atlético-MG'],[2018,'Cruzeiro','Atlético-MG'],
  [2017,'Atlético-MG','Cruzeiro'],[2016,'América-MG','Atlético-MG']]},

'gauchao': {
 nome:'Gauchão',
 nota:'A lista ano a ano entra de 2011 pra cá; a contagem de títulos vale a história inteira, desde 1919.',
 maiores:[['Internacional',46],['Grêmio',43],['Juventude',1],['Caxias',1]],
 anos:[
  [2025,'Internacional','Grêmio'],[2024,'Grêmio','Juventude'],
  [2023,'Grêmio','Caxias'],[2022,'Grêmio','Ypiranga'],
  [2021,'Grêmio','Internacional'],[2020,'Grêmio','Caxias'],
  [2019,'Grêmio','Internacional'],[2018,'Grêmio','Brasil de Pelotas'],
  [2017,'Novo Hamburgo','Internacional'],[2016,'Internacional','Juventude'],
  [2015,'Internacional','Grêmio'],[2014,'Internacional','Grêmio'],
  [2013,'Internacional','Grêmio'],[2012,'Internacional','Grêmio'],
  [2011,'Internacional','Grêmio']]},

'catarinense': {
 nome:'Campeonato Catarinense',
 nota:'A lista ano a ano entra do que está confirmado; a história completa entra por partes, pra não inventar dado.',
 anos:[[2025,'Avaí','Chapecoense']]},

'paranaense': {
 nome:'Campeonato Paranaense',
 nota:'A lista ano a ano entra do que está confirmado; a história completa entra por partes, pra não inventar dado.',
 anos:[[2025,'Operário-PR',null]]},

'libertadores': {
 nome:'Copa Libertadores',
 maiores:[['Independiente',7],['Boca Juniors',6],['Peñarol',5],
  ['River Plate',4],['Flamengo',4],['Estudiantes',4],['Olimpia',3],
  ['Nacional-URU',3],['São Paulo',3],['Palmeiras',3],['Santos',3],['Grêmio',3]],
 anos:[
  [2025,'Flamengo','Palmeiras'],[2024,'Botafogo','Atlético-MG'],
  [2023,'Fluminense','Boca Juniors'],[2022,'Flamengo','Athletico-PR'],
  [2021,'Palmeiras','Flamengo'],[2020,'Palmeiras','Santos'],
  [2019,'Flamengo','River Plate'],[2018,'River Plate','Boca Juniors'],
  [2017,'Grêmio','Lanús'],[2016,'Atlético Nacional','Independiente del Valle'],
  [2015,'River Plate','Tigres-MEX'],[2014,'San Lorenzo','Nacional-PAR'],
  [2013,'Atlético-MG','Olimpia'],[2012,'Corinthians','Boca Juniors'],
  [2011,'Santos','Peñarol'],[2010,'Internacional','Guadalajara'],
  [2009,'Estudiantes','Cruzeiro'],[2008,'LDU Quito','Fluminense'],
  [2007,'Boca Juniors','Grêmio'],[2006,'Internacional','São Paulo'],
  [2005,'São Paulo','Athletico-PR'],[2004,'Once Caldas','Boca Juniors'],
  [2003,'Boca Juniors','Santos'],[2002,'Olimpia','São Caetano'],
  [2001,'Boca Juniors','Cruz Azul'],[2000,'Boca Juniors','Palmeiras'],
  [1999,'Palmeiras','Deportivo Cali'],[1998,'Vasco da Gama','Barcelona-EQU'],
  [1997,'Cruzeiro','Sporting Cristal'],[1996,'River Plate','América de Cali'],
  [1995,'Grêmio','Atlético Nacional'],[1994,'Vélez Sarsfield','São Paulo'],
  [1993,'São Paulo','Universidad Católica'],[1992,'São Paulo',"Newell's Old Boys"],
  [1991,'Colo-Colo','Olimpia'],[1990,'Olimpia','Barcelona-EQU'],
  [1989,'Atlético Nacional','Olimpia'],[1988,'Nacional-URU',"Newell's Old Boys"],
  [1987,'Peñarol','América de Cali'],[1986,'River Plate','América de Cali'],
  [1985,'Argentinos Juniors','América de Cali'],[1984,'Independiente','Grêmio'],
  [1983,'Grêmio','Peñarol'],[1982,'Peñarol','Cobreloa'],
  [1981,'Flamengo','Cobreloa'],[1980,'Nacional-URU','Internacional'],
  [1979,'Olimpia','Boca Juniors'],[1978,'Boca Juniors','Deportivo Cali'],
  [1977,'Boca Juniors','Cruzeiro'],[1976,'Cruzeiro','River Plate'],
  [1975,'Independiente','Unión Española'],[1974,'Independiente','São Paulo'],
  [1973,'Independiente','Colo-Colo'],[1972,'Independiente','Universitario'],
  [1971,'Nacional-URU','Estudiantes'],[1970,'Estudiantes','Peñarol'],
  [1969,'Estudiantes','Nacional-URU'],[1968,'Estudiantes','Palmeiras'],
  [1967,'Racing','Nacional-URU'],[1966,'Peñarol','River Plate'],
  [1965,'Independiente','Peñarol'],[1964,'Independiente','Nacional-URU'],
  [1963,'Santos','Boca Juniors'],[1962,'Santos','Peñarol'],
  [1961,'Peñarol','Palmeiras'],[1960,'Peñarol','Olimpia']]},

'sulamericana': {
 nome:'Copa Sul-Americana',
 anos:[
  [2025,'Lanús','Atlético-MG'],[2024,'Racing','Cruzeiro'],
  [2023,'LDU Quito','Fortaleza'],[2022,'Independiente del Valle','São Paulo'],
  [2021,'Athletico-PR','Bragantino'],[2020,'Defensa y Justicia','Lanús'],
  [2019,'Independiente del Valle','Colón'],[2018,'Athletico-PR','Junior'],
  [2017,'Independiente','Flamengo'],[2016,'Chapecoense','Atlético Nacional'],
  [2015,'Santa Fe','Huracán'],[2014,'River Plate','Atlético Nacional'],
  [2013,'Lanús','Ponte Preta'],[2012,'São Paulo','Tigre'],
  [2011,'Universidad de Chile','LDU Quito'],[2010,'Independiente','Goiás'],
  [2009,'LDU Quito','Fluminense'],[2008,'Internacional','Estudiantes'],
  [2007,'Arsenal de Sarandí','América-MEX'],[2006,'Pachuca','Colo-Colo'],
  [2005,'Boca Juniors','Pumas-MEX'],[2004,'Boca Juniors','Bolívar'],
  [2003,'Cienciano','River Plate'],[2002,'San Lorenzo','Atlético Nacional']]},

'liga:Argentina': {
 nome:'Primeira divisão argentina',
 nota:'A lista ano a ano entra de 2015 pra cá; a contagem de títulos vale a era profissional inteira, desde 1931.',
 maiores:[['River Plate',38],['Boca Juniors',35],['Racing',18],
  ['Independiente',16],['San Lorenzo',15],['Vélez Sarsfield',10],
  ['Estudiantes',7],['Lanús',2],['Platense',1]],
 anos:[
  ['2025 (Clausura)','Estudiantes','Racing'],['2025 (Apertura)','Platense','Huracán'],
  [2024,'Vélez Sarsfield','Huracán'],[2023,'River Plate','Talleres'],
  [2022,'Boca Juniors','Racing'],[2021,'River Plate','Defensa y Justicia'],
  ['2020 (Copa Maradona)','Boca Juniors','Banfield'],
  ['2019-20','Boca Juniors','River Plate'],['2018-19','Racing','Defensa y Justicia'],
  ['2017-18','Boca Juniors','Godoy Cruz'],['2016-17','Boca Juniors','Banfield'],
  [2016,'Lanús','San Lorenzo'],[2015,'Boca Juniors','Rosario Central']]},

'liga:Chile': {
 nome:'Primeira divisão chilena',
 nota:'A lista ano a ano entra de 2018 pra cá; a contagem de títulos vale desde 1933.',
 maiores:[['Colo-Colo',34],['Universidad de Chile',18],['Universidad Católica',17],
  ['Cobreloa',8],['Unión Española',7]],
 anos:[
  [2025,'Coquimbo Unido','Universidad Católica'],[2024,'Colo-Colo','Universidad de Chile'],
  [2023,'Huachipato','Cobresal'],[2022,'Colo-Colo','Universidad Católica'],
  [2021,'Universidad Católica','Colo-Colo'],[2020,'Universidad Católica','Unión La Calera'],
  [2019,'Universidad Católica','Colo-Colo'],[2018,'Universidad Católica','Universidad de Concepción']]},

'liga:Uruguai': {
 nome:'Primeira divisão uruguaia',
 nota:'A lista ano a ano entra de 2017 pra cá; a contagem de títulos vale desde 1900.',
 maiores:[['Peñarol',52],['Nacional-URU',50],['Defensor Sporting',4],
  ['Danubio',4]],
 anos:[
  [2025,'Nacional-URU','Peñarol'],[2024,'Peñarol','Nacional-URU'],
  [2023,'Liverpool-URU','Peñarol'],[2022,'Nacional-URU','Liverpool-URU'],
  [2021,'Peñarol','Plaza Colonia'],[2020,'Nacional-URU','Rentistas'],
  [2019,'Nacional-URU','Peñarol'],[2018,'Peñarol','Nacional-URU'],
  [2017,'Peñarol','Defensor Sporting']]},

'liga:Colômbia': {
 nome:'Primeira divisão colombiana',
 nota:'A lista ano a ano entra de 2020 pra cá (dois torneios por ano); a contagem vale desde 1948.',
 maiores:[['Atlético Nacional',18],['Millonarios',16],['América de Cali',15],
  ['Junior',11],['Santa Fe',10],['Deportivo Cali',10]],
 anos:[
  ['2025 (Finalización)','Junior','Deportes Tolima'],['2025 (Apertura)','Santa Fe','Independiente Medellín'],
  ['2024 (Finalización)','Atlético Nacional','Deportes Tolima'],['2024 (Apertura)','Bucaramanga','Santa Fe'],
  ['2023 (Finalización)','Junior','Independiente Medellín'],['2023 (Apertura)','Millonarios','Atlético Nacional'],
  ['2022 (Finalización)','Deportivo Pereira','Independiente Medellín'],['2022 (Apertura)','Atlético Nacional','Deportes Tolima'],
  ['2021 (Finalización)','Deportivo Cali','Deportes Tolima'],['2021 (Apertura)','Deportes Tolima','Millonarios'],
  [2020,'América de Cali','Santa Fe']]},

'liga:Equador': {
 nome:'Primeira divisão equatoriana',
 nota:'A lista ano a ano entra de 2019 pra cá; a contagem vale desde 1957.',
 maiores:[['Barcelona-EQU',16],['LDU Quito',13],['Emelec',14],
  ['El Nacional',13],['Independiente del Valle',2]],
 anos:[
  [2025,'Independiente del Valle','LDU Quito'],[2024,'LDU Quito','Independiente del Valle'],
  [2023,'LDU Quito','Independiente del Valle'],[2022,'Aucas','Barcelona-EQU'],
  [2021,'Independiente del Valle','Emelec'],[2020,'Barcelona-EQU','LDU Quito'],
  [2019,'Delfín','LDU Quito']]},

'liga:Paraguai': {
 nome:'Primeira divisão paraguaia',
 nota:'A lista ano a ano entra do que está confirmado; a contagem vale desde 1906.',
 maiores:[['Olimpia',47],['Cerro Porteño',35],['Libertad',26],['Guaraní-PAR',11]],
 anos:[
  ['2025 (Clausura)','Cerro Porteño',null],['2025 (Apertura)','Libertad',null],
  ['2024 (Clausura)','Libertad',null],['2024 (Apertura)','Libertad',null],
  ['2023 (Clausura)','Cerro Porteño',null],['2023 (Apertura)','Libertad',null]]},

'liga:Peru': {
 nome:'Primeira divisão peruana',
 nota:'A lista ano a ano entra de 2015 pra cá; a contagem vale desde 1912.',
 maiores:[['Universitario',29],['Alianza Lima',25],['Sporting Cristal',20]],
 anos:[
  [2025,'Universitario','Cusco FC'],[2024,'Universitario','Alianza Lima'],
  [2023,'Universitario','Alianza Lima'],[2022,'Alianza Lima','Melgar'],
  [2021,'Alianza Lima','Sporting Cristal'],[2020,'Sporting Cristal','Universitario'],
  [2019,'Binacional','Alianza Lima'],[2018,'Sporting Cristal','Alianza Lima'],
  [2017,'Alianza Lima','Real Garcilaso'],[2016,'Sporting Cristal','Melgar'],
  [2015,'Sporting Cristal','Melgar']]},

'liga:Bolívia': {
 nome:'Primeira divisão boliviana',
 nota:'A lista ano a ano entra do que está confirmado; a contagem vale desde 1950.',
 maiores:[['Bolívar',30],['The Strongest',18],['Jorge Wilstermann',11]],
 anos:[[2025,'Always Ready',null]]},

'liga:Venezuela': {
 nome:'Primeira divisão venezuelana',
 nota:'O registro ano a ano entra a partir do jogo.',
 anos:[]},

'copa:Copa Argentina': {
 nome:'Copa Argentina',
 nota:'A copa moderna, desde a edição 2011-12.',
 anos:[
  [2025,'Independiente Rivadavia',null],[2024,'Central Córdoba','Vélez Sarsfield'],
  [2023,'Estudiantes','Defensa y Justicia'],[2022,'Patronato','Talleres'],
  [2021,'Boca Juniors','Talleres'],['2019-20','Boca Juniors',null],
  ['2017-18','Rosario Central','Gimnasia-LP'],['2016-17','River Plate','Atlético Tucumán'],
  ['2015-16','River Plate','Rosario Central'],['2014-15','Boca Juniors','Rosario Central'],
  ['2013-14','Huracán','Rosario Central'],['2012-13','Arsenal de Sarandí','San Lorenzo'],
  ['2011-12','Boca Juniors','Racing']]}
};
