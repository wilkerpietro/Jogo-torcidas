# Torcida Organizada

Jogo de gestão de torcida organizada, em HTML e JavaScript puros, sem build.

## Jogar

O jogo é servido direto deste repositório pelo GitHub Pages:

- Jogo: https://wilkerpietro.github.io/jogo-torcidas/
- Bancada de cenas de briga (editor de máscara, F2): https://wilkerpietro.github.io/jogo-torcidas/arredores.html

Cada push na branch configurada no Pages vira a versão nova em um ou dois minutos.
O navegador pode segurar a versão anterior por até dez minutos.

O save fica no `localStorage` do navegador, por endereço. Pra levar uma partida
de um endereço pra outro, use o exportar e importar do menu do jogo.

## Rodar local

Qualquer servidor de arquivos estáticos na raiz do repositório serve:

```
python3 -m http.server 8765
```

e abra `http://127.0.0.1:8765/index.html`.

## Pastas

- `js/` e `dados/`: o jogo. `js/lib/` tem as bibliotecas de terceiros.
- `img/`: a arte. Os arquivos `_ref_*` são referências do editor de máscara, o jogo não os carrega.
- `docs/DECISOES.md`: o diário de decisões do projeto, uma seção por mudança.
- `ferramentas/`: utilitários. `empacotar_jogo.py` gera o arquivo único `torcida-organizada.html`, que só servia pra publicar como artefato e não é mais o caminho principal.
