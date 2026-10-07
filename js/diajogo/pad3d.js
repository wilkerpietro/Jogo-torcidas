/* =========================================================
   OS BOTÕES DE MOVIMENTO, nas páginas 3D
   ---------------------------------------------------------
   É o mesmo pad de `ponte.js`, e é de propósito que ele seja o
   mesmo: quem aprendeu a andar no celular na cena 2D não tem de
   reaprender na cena 3D. As regras que valiam lá valem aqui, e
   as duas são a mesma frase —

   O PAD NÃO IMPLEMENTA LÓGICA NENHUMA. Cada botão escreve no
   MESMO objeto `teclas` que o teclado alimenta, e as ações de
   uma tecolada só (pedra, bomba, recuar, formação) chamam
   exatamente o que a tecla chama. Por isso `combate.js` não
   precisa saber que existe botão: `moverLider` continua lendo
   `teclas['w'|'a'|'s'|'d']` e normalizando o vetor, e a diagonal
   sai de encostar em dois botões da cruz ao mesmo tempo.

   `pointerdown` e não `click`: click só dispara quando o gesto
   termina, e pedra e bomba têm de sair no toque.
   `setPointerCapture` por botão faz o multitoque valer e garante
   que o dedo que escorrega pra fora solte a tecla — sem isso o W
   fica preso e o líder anda sozinho.
   ========================================================= */

export function montarPad(opc) {
  const { pai, teclas, acoes, formacoes, cameras } = opc;

  const botao = (rot, cls, aoTocar, aoSoltar) => {
    const b = document.createElement('button');
    b.className = 'pad-bt ' + cls;
    b.textContent = rot;
    b.addEventListener('pointerdown', ev => {
      ev.preventDefault(); ev.stopPropagation();
      try { b.setPointerCapture(ev.pointerId); } catch (_) {}
      b.classList.add('apertado');
      aoTocar();
    });
    const solta = ev => {
      if (ev) ev.preventDefault();
      b.classList.remove('apertado');
      if (aoSoltar) aoSoltar();
    };
    b.addEventListener('pointerup', solta);
    b.addEventListener('pointercancel', solta);
    b.addEventListener('lostpointercapture', solta);
    b.addEventListener('contextmenu', ev => ev.preventDefault());
    return b;
  };
  /* tecla de segurar: liga no toque, desliga ao soltar */
  const segurar = k => botao(k.toUpperCase(), 'pad-mov pad-' + k,
                             () => { teclas[k] = true; }, () => { teclas[k] = false; });
  /* tecla de disparo: o mesmo caminho do botão do teclado */
  const disparo = (k, rot, fn) => botao(rot, 'pad-acao pad-' + k, () => {
    teclas[k] = true; fn();
    setTimeout(() => { teclas[k] = false; }, 60);
  });

  const caixa = document.createElement('div');
  caixa.id = 'djPad'; caixa.className = 'dj-pad';

  const esq = document.createElement('div');
  esq.className = 'pad-lado pad-esq';
  const faixaAcoes = document.createElement('div');
  faixaAcoes.className = 'pad-acoes';
  for (const a of acoes || [])
    /* ação de SEGURAR (a defesa): o botão liga a tecla enquanto o dedo
       está nele e chama `aoSoltar` quando sai — é o mesmo caminho do
       `keydown`/`keyup` do teclado, que é onde o contragolpe nasce */
    faixaAcoes.appendChild(a.segurar
      ? botao(a.rot, 'pad-acao pad-' + a.tecla,
              () => { teclas[a.tecla] = true; },
              () => { teclas[a.tecla] = false; if (a.aoSoltar) a.aoSoltar(); })
      : disparo(a.tecla, a.rot, a.fn));
  const cruz = document.createElement('div');
  cruz.className = 'pad-cruz';
  cruz.append(segurar('w'), segurar('a'), segurar('s'), segurar('d'));
  esq.append(faixaAcoes, cruz);

  const dir = document.createElement('div');
  dir.className = 'pad-lado pad-dir';
  const botoesForm = [];
  for (const f of formacoes || []) {
    const b = botao(f.tecla, 'pad-form', () => { f.fn(); marcarFormacao(); });
    botoesForm.push({ b, id: f.id });
    dir.appendChild(b);
  }
  caixa.append(esq, dir);
  pai.appendChild(caixa);

  /* a fila de câmeras fica em cima, longe do polegar: trocar de
     câmera não é reflexo de briga, é decisão */
  const botoesCam = [];
  if (cameras && cameras.lista.length) {
    const fila = document.createElement('div');
    fila.className = 'pad-cam';
    for (const c of cameras.lista) {
      const b = botao(c.rot, 'pad-cam-bt', () => { cameras.fn(c.id); marcarCamera(c.id); });
      botoesCam.push({ b, id: c.id });
      fila.appendChild(b);
    }
    pai.appendChild(fila);
  }

  let formAtual = null, camAtual = null;
  function marcarFormacao(id) {
    if (id !== undefined) formAtual = id;
    for (const x of botoesForm) x.b.classList.toggle('on', x.id === formAtual);
  }
  function marcarCamera(id) {
    if (id !== undefined) camAtual = id;
    for (const x of botoesCam) x.b.classList.toggle('on', x.id === camAtual);
  }
  /* a recarga da pedra e o estoque de bomba aparecem no botão */
  function gastar(tecla, gasto) {
    const b = caixa.querySelector('.pad-' + tecla);
    if (b) b.classList.toggle('gasto', !!gasto);
  }

  return { caixa, marcarFormacao, marcarCamera, gastar };
}
