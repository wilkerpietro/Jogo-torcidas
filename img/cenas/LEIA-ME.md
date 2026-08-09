# Imagens das cenas

## Arquivo que falta: `arredores.png`

A cena dos arredores é desenhada **por cima da foto aérea**. O jogo carrega:

```
img/cenas/arredores.png
```

Suba aqui a foto limpa (a versão sem os desenhos), com esse nome exato.

A versão anotada — com as marcações de spawn, PM, grades e entradas — pode ser
subida junto como `_ref_arredores_marcado.png`. Ela **não é carregada pelo jogo**,
fica só como referência de conferência.

### Enquanto o arquivo não sobe

A cena funciona mesmo assim: sem a imagem, ela desenha a malha de caminhabilidade
em cinza sobre fundo escuro e avisa na tela. Dá pra testar movimentação e colisão.

No editor (tecla **F2**) também dá pra **arrastar um arquivo de imagem** direto pra
tela — ela é usada como fundo na hora, sem precisar commitar nada. Serve pra
conferir o alinhamento antes de subir de vez.

### Sobre dimensões

`dados/cena_arredores.js` está calibrado para uma imagem de **1536 × 1024**.
Se a sua tiver outro tamanho, ajuste `largura` e `altura` nesse arquivo — todas as
coordenadas de spawn, portão, PM e grade escalam junto.

### Sobre peso

O GDD (§2.3) alerta: imagem pesada inviabiliza o download. PNG de foto nesse
tamanho costuma passar de 2 MB. Converter para **WebP** com qualidade ~82 derruba
para algo em torno de 200–400 KB, sem diferença visível no jogo. Se você converter,
troque a extensão em `dados/cena_arredores.js` no campo `imagem`.
