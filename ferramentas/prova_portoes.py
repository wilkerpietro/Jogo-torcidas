#!/usr/bin/env python3
"""
Nenhuma cena pode selar um portao.

Cada spawn de cena tem um portao designado (`spawn.entrada`). Se a arte
fechar o funil — uma grade de fila com dois modulos a mais, um predio
novo na mascara, um remendo em `dados/cenas_editadas.js` — o escalao
fica sem caminho ate o portao dele e o jogo nao tem como avisar: o
sintoma e um botao cinza que ninguem sabe explicar. Foi o que aconteceu
com a `fila_m1` dos arredores, que deixava 21 px entre a ponta dela e a
parede quando o disco precisa de mais de 14 mais a meia-espessura da
grade.

Este teste roda a MESMA verificacao que o jogo faz ao montar a cena
(`TO.diaJogo.combate.conferirPortoes`), nas oito cenas. Nao tem modelo
proprio do dado: o que ele mede e o que o jogo enxerga.

    python3 -m http.server 8765 &
    python3 ferramentas/prova_portoes.py

Sai com codigo 1 se alguma cena selar um portao.
"""
import json
import sys

from playwright.sync_api import sync_playwright

CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
PAGINA = 'http://localhost:8765/arredores.html'
CENAS = ['arredores', 'praca', 'rua', 'rua-media', 'rua-nobre',
         'bar', 'comercio', 'ct']

JS = """(cena)=>{
  const B=TO.diaJogo.bancada, C=TO.diaJogo.combate, A=TO.diaJogo.arredores;
  B.abrir(B.CENAS.find(c=>c.id===cena));
  const J=TO.diaJogo.J;
  return {cena, spawns:A.D.spawns.length, portoes:A.D.entradas.length,
          selados: J.portoesSelados || C.conferirPortoes(J)};
}"""


def main():
    ruins = 0
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = b.new_page(viewport={'width': 1500, 'height': 1000})
        erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.goto(PAGINA)
        pg.wait_for_timeout(2500)
        for cena in CENAS:
            r = pg.evaluate(JS, cena)
            if r['selados']:
                ruins += 1
            print(json.dumps(r, ensure_ascii=False))
        print('CENAS COM PORTAO SELADO:', ruins)
        print('ERR', erros)
        b.close()
    return 1 if (ruins or erros) else 0


if __name__ == '__main__':
    sys.exit(main())
