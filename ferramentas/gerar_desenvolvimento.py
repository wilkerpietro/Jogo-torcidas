#!/usr/bin/env python3
"""Gera `desenvolvimento.html`: o jogo inteiro + o protótipo do
Desenvolvimento da Torcida (dono, 12/10/2026: "testar isso sem aplicar no
jogo, numa versão à parte pra sentir a diferença").

A página é uma CÓPIA do `index.html` com três mudanças:

  * o título ganha " — Desenvolvimento (protótipo)";
  * antes de qualquer script, o save é desviado pra outra gaveta do
    navegador: toda chave `torcida-organizada:…` vira
    `torcida-organizada-desenv:…`. O save do jogo normal não é lido nem
    escrito por ela (pra levar uma partida pra cá, use exportar/importar);
  * no fim, o módulo `js/prototipo/desenvolvimento.js`.

Como é cópia, rode de novo sempre que o `index.html` mudar:

    python3 ferramentas/gerar_desenvolvimento.py
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / 'index.html'
SAIDA = RAIZ / 'desenvolvimento.html'

DESVIO = """<script>
/* PROTÓTIPO À PARTE (gerado por ferramentas/gerar_desenvolvimento.py):
   o save desta página mora noutra gaveta — o jogo normal não é tocado */
(function(){
  var P = 'torcida-organizada:', N = 'torcida-organizada-desenv:';
  var S = Storage.prototype, g = S.getItem, s = S.setItem, r = S.removeItem;
  var troca = function(k){ k = String(k); return k.indexOf(P) === 0 ? N + k.slice(P.length) : k; };
  S.getItem = function(k){ return g.call(this, troca(k)); };
  S.setItem = function(k, v){ return s.call(this, troca(k), v); };
  S.removeItem = function(k){ return r.call(this, troca(k)); };
})();
</script>
"""


def main():
    html = ORIGEM.read_text(encoding='utf-8')
    aviso = ('<!-- GERADO por ferramentas/gerar_desenvolvimento.py a partir do '
             'index.html — não edite à mão -->\n')
    html = html.replace('<title>Torcida Organizada</title>',
                        '<title>Torcida Organizada — Desenvolvimento (protótipo)</title>', 1)
    assert '<head>' in html and '</body>' in html
    html = html.replace('<head>', '<head>\n' + DESVIO, 1)
    fim = html.rfind('</body>')
    html = (html[:fim] + '<!-- o protótipo do Desenvolvimento da Torcida -->\n'
            '<script src="js/prototipo/desenvolvimento.js"></script>\n' + html[fim:])
    i = html.find('>', html.lower().find('<!doctype')) + 1
    html = html[:i] + '\n' + aviso.rstrip('\n') + html[i:]
    SAIDA.write_text(html, encoding='utf-8')
    print('ok:', SAIDA.relative_to(RAIZ))


if __name__ == '__main__':
    main()
