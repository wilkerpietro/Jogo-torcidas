/* =========================================================
   TRÊS — a briga de rua vista de perto
   ---------------------------------------------------------
   A versão paralela das cenas de briga. A simulação é a MESMA
   de combate.js, o estado é o mesmo J, a malha é a mesma de
   arredores.js — o que muda é só a tela: em vez do disco visto
   de cima, um boneco de corpo inteiro; em vez do mapa, uma
   câmera atrás do líder, do jeito dos jogos de rua em terceira
   pessoa.

   Nada aqui altera a briga. Este arquivo LÊ J e D e desenha.

   Não há biblioteca: a página roda solta, sem rede, e o jogo
   não depende de CDN pra abrir. O renderizador é WebGL cru —
   caixa, prisma, cilindro e esfera com cor por vértice, luz de
   fim de tarde, neblina de distância e um céu de gradiente. A
   rua é levantada dos MESMOS blocos que a pintura 2D usa
   (dados/cenas.js): parede que barra o disco é parede que
   aparece na tela.

   Régua: 1 unidade = 1 px da cena 2D. O disco tem raio 7, o
   que dá 1 m ≈ 28 px — o boneco tem 50 de altura, a casa 85,
   o poste 230, o carro 96 de comprimento. É a mesma escala em
   que a cena foi desenhada; só ganhou o eixo de cima.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.tres = (function(){
  const U = TO.util;
  const A = TO.diaJogo.arredores;

  /* ---------- semente por elemento: a mesma casa é sempre a mesma casa ---------- */
  function hash(txt){
    let h = 2166136261;
    const s = String(txt);
    for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h,16777619)>>>0; }
    return h >>> 0;
  }
  const dado = (t, n) => hash(t) % n;
  const frac = t => (hash(t) % 1000) / 1000;

  /* ---------- cor ---------- */
  const _cores = new Map();
  function cor(v){
    if(Array.isArray(v)) return v;
    if(!v) return [0.5,0.5,0.5];
    let c = _cores.get(v); if(c) return c;
    const s = String(v).trim();
    let r=128, g=128, b=128;
    if(s[0]==='#'){
      if(s.length===4){ r=parseInt(s[1]+s[1],16); g=parseInt(s[2]+s[2],16); b=parseInt(s[3]+s[3],16); }
      else if(s.length>=7){ r=parseInt(s.slice(1,3),16); g=parseInt(s.slice(3,5),16); b=parseInt(s.slice(5,7),16); }
    } else {
      const m = s.match(/(\d+)\D+(\d+)\D+(\d+)/);
      if(m){ r=+m[1]; g=+m[2]; b=+m[3]; }
    }
    c = [r/255, g/255, b/255];
    _cores.set(v, c);
    return c;
  }
  const tom = (c, k) => [Math.min(1,c[0]*k), Math.min(1,c[1]*k), Math.min(1,c[2]*k)];
  const varia = (c, chave, amp) => tom(c, 1 + (frac(chave)-0.5)*2*amp);
  const PRETO = [0.08,0.08,0.09];

  /* =======================================================
     MATRIZES 4×4, coluna-maior como o GL espera
     ======================================================= */
  const M4 = {
    id(){ const m=new Float32Array(16); m[0]=m[5]=m[10]=m[15]=1; return m; },
    mul(a,b){
      const o=new Float32Array(16);
      for(let i=0;i<4;i++) for(let j=0;j<4;j++){
        let s=0; for(let k=0;k<4;k++) s+=a[k*4+i]*b[j*4+k];
        o[j*4+i]=s;
      }
      return o;
    },
    trans(x,y,z){ const m=M4.id(); m[12]=x; m[13]=y; m[14]=z; return m; },
    escala(s){ const m=M4.id(); m[0]=m[5]=m[10]=s; return m; },
    rotX(a){ const m=M4.id(), c=Math.cos(a), s=Math.sin(a); m[5]=c; m[6]=s; m[9]=-s; m[10]=c; return m; },
    rotY(a){ const m=M4.id(), c=Math.cos(a), s=Math.sin(a); m[0]=c; m[2]=-s; m[8]=s; m[10]=c; return m; },
    rotZ(a){ const m=M4.id(), c=Math.cos(a), s=Math.sin(a); m[0]=c; m[1]=s; m[4]=-s; m[5]=c; return m; },
    persp(fov, asp, n, f){
      const m=new Float32Array(16), t=1/Math.tan(fov/2);
      m[0]=t/asp; m[5]=t; m[10]=(f+n)/(n-f); m[11]=-1; m[14]=2*f*n/(n-f);
      return m;
    },
    olhar(e, c, u){
      let zx=e[0]-c[0], zy=e[1]-c[1], zz=e[2]-c[2];
      let l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;
      let xx=u[1]*zz-u[2]*zy, xy=u[2]*zx-u[0]*zz, xz=u[0]*zy-u[1]*zx;
      l=Math.hypot(xx,xy,xz)||1; xx/=l; xy/=l; xz/=l;
      const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
      const m=new Float32Array(16);
      m[0]=xx; m[1]=yx; m[2]=zx; m[4]=xy; m[5]=yy; m[6]=zy; m[8]=xz; m[9]=yz; m[10]=zz;
      m[12]=-(xx*e[0]+xy*e[1]+xz*e[2]);
      m[13]=-(yx*e[0]+yy*e[1]+yz*e[2]);
      m[14]=-(zx*e[0]+zy*e[1]+zz*e[2]);
      m[15]=1;
      return m;
    },
    ponto(m, x, y, z){
      return [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]];
    },
    vetor(m, x, y, z){
      return [m[0]*x+m[4]*y+m[8]*z, m[1]*x+m[5]*y+m[9]*z, m[2]*x+m[6]*y+m[10]*z];
    }
  };

  /* =======================================================
     MALHA — vértices com posição, normal e cor (9 floats)
     ======================================================= */
  class Malha{
    constructor(cap){ this.d = new Float32Array(cap || 9*8192); this.n = 0; }
    get vertices(){ return this.n/9; }
    limpar(){ this.n = 0; }
    reservar(k){
      if(this.n + k > this.d.length){
        const nova = new Float32Array(Math.max(this.d.length*2, this.n+k+9));
        nova.set(this.d.subarray(0, this.n));
        this.d = nova;
      }
    }
    v(x,y,z, nx,ny,nz, c){
      const d=this.d; let i=this.n;
      d[i++]=x; d[i++]=y; d[i++]=z; d[i++]=nx; d[i++]=ny; d[i++]=nz;
      d[i++]=c[0]; d[i++]=c[1]; d[i++]=c[2];
      this.n=i;
    }
    tri(a, b, c, cor, n){
      if(!n){
        const ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2];
        const vx=c[0]-a[0], vy=c[1]-a[1], vz=c[2]-a[2];
        let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
        const l=Math.hypot(nx,ny,nz)||1;
        n=[nx/l, ny/l, nz/l];
      }
      this.reservar(27);
      this.v(a[0],a[1],a[2], n[0],n[1],n[2], cor);
      this.v(b[0],b[1],b[2], n[0],n[1],n[2], cor);
      this.v(c[0],c[1],c[2], n[0],n[1],n[2], cor);
    }
    /* normal = (b−a) × (d−a) */
    quad(a, b, c, d, cor, n){
      if(!n){
        const ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2];
        const vx=d[0]-a[0], vy=d[1]-a[1], vz=d[2]-a[2];
        let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
        const l=Math.hypot(nx,ny,nz)||1;
        n=[nx/l, ny/l, nz/l];
      }
      this.tri(a,b,c,cor,n); this.tri(a,c,d,cor,n);
    }
    /* chão: quadrado horizontal com a normal pra cima */
    chao(x0,z0,x1,z1,y,cor){
      this.quad([x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0], cor, [0,1,0]);
    }
    /* caixa alinhada aos eixos. Sem fundo por padrão: quase tudo
       aqui está apoiado no chão e ninguém olha por baixo. */
    caixa(x0,y0,z0,x1,y1,z1,c,opc){
      const cima = (opc && opc.topo) || c, lado = (opc && opc.lado) || c;
      this.quad([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0], cima, [0,1,0]);
      if(opc && opc.fundo) this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1], c, [0,-1,0]);
      this.quad([x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1], lado, [-1,0,0]);
      this.quad([x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0], lado, [1,0,0]);
      this.quad([x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0], lado, [0,0,-1]);
      this.quad([x0,y0,z1],[x0,y1,z1],[x1,y1,z1],[x1,y0,z1], lado, [0,0,1]);
    }
    /* caixa levada por uma matriz rígida: é como se monta o boneco */
    caixaM(M, w,h,d, c, cx, cy, cz){
      cx=cx||0; cy=cy||0; cz=cz||0;
      const hx=w/2, hy=h/2, hz=d/2;
      const P = (x,y,z)=>M4.ponto(M, cx+x, cy+y, cz+z);
      const N = (x,y,z)=>{ const n=M4.vetor(M,x,y,z); const l=Math.hypot(n[0],n[1],n[2])||1; return [n[0]/l,n[1]/l,n[2]/l]; };
      const a=P(-hx,-hy,-hz), b=P(hx,-hy,-hz), cc=P(hx,hy,-hz), dd=P(-hx,hy,-hz);
      const e=P(-hx,-hy,hz), f=P(hx,-hy,hz), g=P(hx,hy,hz), hh=P(-hx,hy,hz);
      this.quad(dd,hh,g,cc, c, N(0,1,0));
      this.quad(a,b,f,e, c, N(0,-1,0));
      this.quad(a,dd,hh,e, c, N(-1,0,0));
      this.quad(b,f,g,cc, c, N(1,0,0));
      this.quad(a,b,cc,dd, c, N(0,0,-1));
      this.quad(e,hh,g,f, c, N(0,0,1));
    }
    cilindro(cx,cy,cz, r, h, c, seg, opc){
      seg = seg || 8;
      const topo = !(opc && opc.semTopo);
      for(let i=0;i<seg;i++){
        const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2;
        const x0=cx+Math.cos(a0)*r, z0=cz+Math.sin(a0)*r;
        const x1=cx+Math.cos(a1)*r, z1=cz+Math.sin(a1)*r;
        const am=(a0+a1)/2, n=[Math.cos(am),0,Math.sin(am)];
        this.quad([x0,cy,z0],[x0,cy+h,z0],[x1,cy+h,z1],[x1,cy,z1], c, n);
        if(topo) this.tri([cx,cy+h,cz],[x0,cy+h,z0],[x1,cy+h,z1], (opc&&opc.topo)||c, [0,1,0]);
      }
    }
    /* roda de carro: cilindro deitado no eixo z */
    roda(cx,cy,cz, r, larg, c, seg){
      seg = seg || 8;
      for(let i=0;i<seg;i++){
        const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2;
        const x0=cx+Math.cos(a0)*r, y0=cy+Math.sin(a0)*r;
        const x1=cx+Math.cos(a1)*r, y1=cy+Math.sin(a1)*r;
        const am=(a0+a1)/2, n=[Math.cos(am),Math.sin(am),0];
        this.quad([x0,y0,cz-larg/2],[x1,y1,cz-larg/2],[x1,y1,cz+larg/2],[x0,y0,cz+larg/2], c, n);
        this.tri([cx,cy,cz-larg/2],[x0,y0,cz-larg/2],[x1,y1,cz-larg/2], c, [0,0,-1]);
        this.tri([cx,cy,cz+larg/2],[x1,y1,cz+larg/2],[x0,y0,cz+larg/2], c, [0,0,1]);
      }
    }
    esfera(cx,cy,cz, r, c, seg, aneis, ry){
      seg = seg || 8; aneis = aneis || 5; ry = ry || r;
      for(let j=0;j<aneis;j++){
        const t0=j/aneis*Math.PI, t1=(j+1)/aneis*Math.PI;
        for(let i=0;i<seg;i++){
          const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2;
          const P=(t,a)=>[cx+Math.sin(t)*Math.cos(a)*r, cy+Math.cos(t)*ry, cz+Math.sin(t)*Math.sin(a)*r];
          const N=(t,a)=>[Math.sin(t)*Math.cos(a), Math.cos(t), Math.sin(t)*Math.sin(a)];
          const tm=(t0+t1)/2, am=(a0+a1)/2;
          this.quad(P(t0,a0),P(t1,a0),P(t1,a1),P(t0,a1), c, N(tm,am));
        }
      }
    }
    /* telhado de duas águas: a cumeeira no eixo maior */
    telhado(x0,z0,x1,z1, yb, yt, aoLongoX, c, beiral){
      beiral = beiral || 0;
      x0-=beiral; z0-=beiral; x1+=beiral; z1+=beiral;
      const dy=yt-yb;
      if(aoLongoX){
        const zm=(z0+z1)/2, dz=zm-z0, l=Math.hypot(dy,dz)||1;
        this.quad([x0,yb,z0],[x1,yb,z0],[x1,yt,zm],[x0,yt,zm], c, [0,dz/l,-dy/l]);
        this.quad([x0,yb,z1],[x0,yt,zm],[x1,yt,zm],[x1,yb,z1], c, [0,dz/l,dy/l]);
        this.tri([x0,yb,z0],[x0,yt,zm],[x0,yb,z1], tom(c,.8), [-1,0,0]);
        this.tri([x1,yb,z0],[x1,yb,z1],[x1,yt,zm], tom(c,.8), [1,0,0]);
      } else {
        const xm=(x0+x1)/2, dx=xm-x0, l=Math.hypot(dy,dx)||1;
        this.quad([x0,yb,z0],[x0,yb,z1],[xm,yt,z1],[xm,yt,z0], c, [-dy/l,dx/l,0]);
        this.quad([x1,yb,z0],[xm,yt,z0],[xm,yt,z1],[x1,yb,z1], c, [dy/l,dx/l,0]);
        this.tri([x0,yb,z0],[x1,yb,z0],[xm,yt,z0], tom(c,.8), [0,0,-1]);
        this.tri([x0,yb,z1],[xm,yt,z1],[x1,yb,z1], tom(c,.8), [0,0,1]);
      }
    }
  }

  /* malha simples: posição + cor com alfa (7 floats). Serve pras linhas
     (fio, varal, cerca) e pros planos com transparência (sombra, anel). */
  class Simples{
    constructor(cap){ this.d = new Float32Array(cap || 7*4096); this.n = 0; }
    get vertices(){ return this.n/7; }
    limpar(){ this.n = 0; }
    reservar(k){
      if(this.n + k > this.d.length){
        const nova = new Float32Array(Math.max(this.d.length*2, this.n+k+7));
        nova.set(this.d.subarray(0, this.n));
        this.d = nova;
      }
    }
    v(x,y,z,c){
      this.reservar(7);
      const d=this.d; let i=this.n;
      d[i++]=x; d[i++]=y; d[i++]=z; d[i++]=c[0]; d[i++]=c[1]; d[i++]=c[2]; d[i++]=c[3]===undefined?1:c[3];
      this.n=i;
    }
    linha(a,b,c){ this.v(a[0],a[1],a[2],c); this.v(b[0],b[1],b[2],c); }
    /* fio com barriga: catenária aproximada por parábola */
    fio(a,b,sag,c,n){
      n=n||8;
      let p=a;
      for(let i=1;i<=n;i++){
        const t=i/n;
        const q=[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t - sag*4*t*(1-t), a[2]+(b[2]-a[2])*t];
        this.linha(p,q,c); p=q;
      }
    }
    elipse(cx,cy,cz,rx,rz,c,seg){
      seg=seg||10;
      for(let i=0;i<seg;i++){
        const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2;
        this.v(cx,cy,cz,c);
        this.v(cx+Math.cos(a0)*rx,cy,cz+Math.sin(a0)*rz,c);
        this.v(cx+Math.cos(a1)*rx,cy,cz+Math.sin(a1)*rz,c);
      }
    }
    anel(cx,cy,cz,r0,r1,c,seg){
      seg=seg||14;
      for(let i=0;i<seg;i++){
        const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2;
        const p=(a,r)=>[cx+Math.cos(a)*r, cy, cz+Math.sin(a)*r];
        const A0=p(a0,r0),B0=p(a1,r0),A1=p(a0,r1),B1=p(a1,r1);
        this.v(...A0,c); this.v(...A1,c); this.v(...B1,c);
        this.v(...A0,c); this.v(...B1,c); this.v(...B0,c);
      }
    }
  }

  /* =======================================================
     GL — programas, buffers e texturas
     ======================================================= */
  let gl=null, cv=null, sobre=null, ctx2=null;
  const prog = {};
  const buf = {};

  function compilar(vs, fs, atributos){
    const mk=(tipo,src)=>{
      const s=gl.createShader(tipo); gl.shaderSource(s,src); gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p=gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const o={p, a:{}, u:{}};
    for(const a of atributos) o.a[a]=gl.getAttribLocation(p,a);
    const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
    for(let i=0;i<n;i++){ const u=gl.getActiveUniform(p,i); o.u[u.name]=gl.getUniformLocation(p,u.name); }
    return o;
  }

  const FOG_GLSL = `
    uniform vec3 uCam; uniform vec2 uFog;
    float neblina(vec3 p){ float d=distance(p,uCam); return clamp((d-uFog.x)/(uFog.y-uFog.x),0.0,1.0); }`;

  const VS_SOLIDO = `
    attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aCor;
    uniform mat4 uPV; uniform vec3 uLuz;
    ${FOG_GLSL}
    varying vec3 vCor; varying float vFog;
    void main(){
      gl_Position = uPV*vec4(aPos,1.0);
      vec3 n = normalize(aNor);
      float dif = max(dot(n,uLuz),0.0);
      float hemi = 0.55 + 0.45*n.y;
      vec3 luz = vec3(0.42,0.44,0.52)*hemi + vec3(1.0,0.86,0.68)*dif*0.82;
      /* o pé da parede é mais escuro: é o que assenta a casa no chão */
      float ao = mix(1.0, 0.70+0.30*clamp(aPos.y/34.0,0.0,1.0), 1.0-abs(n.y));
      vCor = aCor*luz*ao;
      vFog = neblina(aPos);
    }`;
  const FS_SOLIDO = `
    precision mediump float;
    uniform vec3 uCorFog;
    varying vec3 vCor; varying float vFog;
    void main(){ gl_FragColor = vec4(mix(vCor,uCorFog,vFog),1.0); }`;

  const VS_SIMPLES = `
    attribute vec3 aPos; attribute vec4 aCor;
    uniform mat4 uPV;
    ${FOG_GLSL}
    varying vec4 vCor; varying float vFog;
    void main(){ gl_Position=uPV*vec4(aPos,1.0); vCor=aCor; vFog=neblina(aPos); }`;
  /* alfa pré-multiplicado: é o que o canvas transparente da vista de
     cima espera, e no palco opaco dá no mesmo */
  const FS_SIMPLES = `
    precision mediump float;
    uniform vec3 uCorFog;
    varying vec4 vCor; varying float vFog;
    void main(){ float a = vCor.a*(1.0-vFog); gl_FragColor = vec4(mix(vCor.rgb,uCorFog,vFog)*a, a); }`;

  const VS_TEX = `
    attribute vec3 aPos; attribute vec2 aUV;
    uniform mat4 uPV;
    ${FOG_GLSL}
    varying vec2 vUV; varying float vFog;
    void main(){ gl_Position=uPV*vec4(aPos,1.0); vUV=aUV; vFog=neblina(aPos); }`;
  const FS_TEX = `
    precision mediump float;
    uniform sampler2D uTex; uniform vec3 uCorFog; uniform float uLuz;
    varying vec2 vUV; varying float vFog;
    void main(){
      vec4 c = texture2D(uTex, vUV);
      if(c.a < 0.25) discard;
      gl_FragColor = vec4(mix(c.rgb*uLuz, uCorFog, vFog), 1.0);
    }`;

  const VS_CEU = `attribute vec2 aPos; void main(){ gl_Position=vec4(aPos,0.999,1.0); }`;
  const FS_CEU = `
    precision mediump float;
    uniform vec3 uCima; uniform vec3 uHorizonte; uniform float uAlt;
    void main(){
      float t = clamp(gl_FragCoord.y/uAlt, 0.0, 1.0);
      gl_FragColor = vec4(mix(uHorizonte, uCima, pow(t,0.8)), 1.0);
    }`;

  function montarGL(){
    prog.solido  = compilar(VS_SOLIDO, FS_SOLIDO, ['aPos','aNor','aCor']);
    prog.simples = compilar(VS_SIMPLES, FS_SIMPLES, ['aPos','aCor']);
    prog.tex     = compilar(VS_TEX, FS_TEX, ['aPos','aUV']);
    prog.ceu     = compilar(VS_CEU, FS_CEU, ['aPos']);
    for(const k of ['estatico','dinamico','linhas','planos','tex','ceu']) buf[k]=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.ceu);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);       // toldo, bandeirinha e telhado se veem dos dois lados
  }

  function enviar(b, malha, modo){
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, malha.d.subarray(0, malha.n), modo||gl.DYNAMIC_DRAW);
  }
  function desenharSolido(b, n, PV, luz){
    if(!n) return;
    const p=prog.solido;
    gl.useProgram(p.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(p.a.aPos); gl.vertexAttribPointer(p.a.aPos,3,gl.FLOAT,false,36,0);
    gl.enableVertexAttribArray(p.a.aNor); gl.vertexAttribPointer(p.a.aNor,3,gl.FLOAT,false,36,12);
    gl.enableVertexAttribArray(p.a.aCor); gl.vertexAttribPointer(p.a.aCor,3,gl.FLOAT,false,36,24);
    gl.uniformMatrix4fv(p.u.uPV,false,PV);
    gl.uniform3fv(p.u.uLuz, luz.dir); gl.uniform3fv(p.u.uCam, luz.cam);
    gl.uniform2fv(p.u.uFog, luz.fog); gl.uniform3fv(p.u.uCorFog, luz.corFog);
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }
  function desenharSimples(b, n, PV, luz, modo){
    if(!n) return;
    const p=prog.simples;
    gl.useProgram(p.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(p.a.aPos); gl.vertexAttribPointer(p.a.aPos,3,gl.FLOAT,false,28,0);
    gl.enableVertexAttribArray(p.a.aCor); gl.vertexAttribPointer(p.a.aCor,4,gl.FLOAT,false,28,12);
    gl.uniformMatrix4fv(p.u.uPV,false,PV);
    gl.uniform3fv(p.u.uCam, luz.cam); gl.uniform2fv(p.u.uFog, luz.fog); gl.uniform3fv(p.u.uCorFog, luz.corFog);
    gl.drawArrays(modo, 0, n);
  }

  /* ---------- texturas de texto: letreiro, placa, pichação ---------- */
  const _tex = new Map();
  function textura(chave, pintar, w, h){
    let t=_tex.get(chave); if(t) return t;
    const c=document.createElement('canvas'); c.width=w||256; c.height=h||64;
    const x=c.getContext('2d');
    pintar(x, c.width, c.height);
    t=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    _tex.set(chave,t);
    return t;
  }
  function texturaTexto(txt, opc){
    opc=opc||{};
    const chave='txt|'+txt+'|'+JSON.stringify(opc);
    return textura(chave, (x,w,h)=>{
      if(opc.fundo){ x.fillStyle=opc.fundo; x.fillRect(0,0,w,h); }
      if(opc.faixa){ x.fillStyle=opc.faixa; x.fillRect(0,0,w,h*0.18); x.fillRect(0,h*0.82,w,h*0.18); }
      x.font = opc.fonte || `700 ${Math.round(h*0.62)}px "Barlow Condensed", Impact, sans-serif`;
      x.textAlign='center'; x.textBaseline='middle';
      if(opc.gira){ x.translate(w/2,h/2); x.rotate(opc.gira); x.translate(-w/2,-h/2); }
      if(opc.sombra){ x.fillStyle=opc.sombra; x.fillText(txt, w/2+3, h/2+3); }
      x.fillStyle = opc.cor || '#111';
      x.fillText(txt, w/2, h/2);
    }, opc.w||256, opc.h||64);
  }

  /* =======================================================
     A CENA LEVANTADA — geometria estática
     ======================================================= */
  const TELHADO = ['#a64a32','#8a4030','#7a4a3a','#6a504a','#56524a','#5a4030'];
  const LAJE    = ['#8d8b83','#7d7b74','#96938a','#6f6d67'];
  const PAREDE  = ['#c8b89a','#b8a488','#d4c3a5','#9fb0a8','#c2a48f','#a8b6c0','#d9c9a0','#b7c7b0'];
  const PICHACAO= ['#1c1c1c','#20303f','#2a1c30','#123018','#3a1a1a'];
  const TAGS = ['BONDE','SÓ VAI','RUA VIVA','FÉ','PAZ','TREM','SAUDADE','ZONA','FÚRIA',
                'RESPEITA','ÉS NÓIS','FAVELA','VAI TER','100%'];
  const BARES = ['BAR DO ZÉ','BAR DA NEGA','BAR E MERCEARIA','ESPETINHO DO TIÃO',
                 'CERVEJA GELADA','BAR DO PAULINHO','BOTECO DA ESQUINA'];
  const BANDEIRINHA = ['#e63946','#f4d35e','#2a9d8f','#f77f00','#8ecae6','#ffffff','#7b2cbf','#43aa8b'];
  const ROUPA = ['#c94a3a','#dcd6c6','#3a6ba8','#d8b23a','#5a8a4a','#e8e8e8','#8a3a8a'];
  const CARROS = ['#d8d8d8','#1c1c1e','#9a9a9a','#b52c2c','#2c4a9a','#e0e0d0','#3a6b3a','#c9c9b0'];

  let cenaAtual=null;            // o D pra que a estática foi levantada
  let est=null, linhas=null, letreiros=[], alturas=[];
  let nEst=0, nLin=0;
  let W=1536, H=1024;

  /* de que lado da casa fica a rua: a fileira de cima abre pro sul (+z),
     a de baixo pro norte (−z) */
  function frente(b){
    if(b.y + b.h <= H/2) return 's';
    return 'n';
  }
  /* os quatro cantos de um retângulo na fachada (u ao longo de x, v em y),
     já com a ordem que deixa texto legível de quem olha da rua */
  function cantosFachada(lado, b, u0, v0, u1, v1, off){
    off = off || 0.6;
    if(lado==='s'){
      const z=b.y+b.h+off;
      return [[u0,v0,z],[u1,v0,z],[u1,v1,z],[u0,v1,z]];
    }
    const z=b.y-off;
    return [[u1,v0,z],[u0,v0,z],[u0,v1,z],[u1,v1,z]];
  }
  function quadFachada(m, lado, b, u0,v0,u1,v1, c, off){
    const q=cantosFachada(lado,b,u0,v0,u1,v1,off);
    m.quad(q[0],q[1],q[2],q[3], c, [0,0,lado==='s'?1:-1]);
  }
  function letreiro(lado, b, u0,v0,u1,v1, tex, off, luz){
    const q=cantosFachada(lado,b,u0,v0,u1,v1,off);
    letreiros.push({tex, luz:luz||0.9, d:new Float32Array([
      q[0][0],q[0][1],q[0][2],0,1,  q[1][0],q[1][1],q[1][2],1,1,  q[2][0],q[2][1],q[2][2],1,0,
      q[0][0],q[0][1],q[0][2],0,1,  q[2][0],q[2][1],q[2][2],1,0,  q[3][0],q[3][1],q[3][2],0,0])});
  }

  function janela(m, lado, b, u, v, w, h){
    quadFachada(m, lado, b, u-1.5, v-1.5, u+w+1.5, v+h+1.5, cor('#e9e4d6'), 0.5);
    quadFachada(m, lado, b, u, v, u+w, v+h, cor('#7fa6c9'), 0.9);
    /* a grade da janela, que casa de rua tem */
    quadFachada(m, lado, b, u+w/2-0.6, v, u+w/2+0.6, v+h, cor('#3a3a3a'), 1.1);
  }
  function porta(m, lado, b, u, w, h, c){
    quadFachada(m, lado, b, u-1.5, 0, u+w+1.5, h+1.5, cor('#e0d8c8'), 0.5);
    quadFachada(m, lado, b, u, 0, u+w, h, c||cor('#4a2e1c'), 0.9);
  }
  function pichacao(lado, b, s, h){
    const n = 1 + dado(s+'pq', 2);
    for(let i=0;i<n;i++){
      const tag = TAGS[dado(s+'tag'+i, TAGS.length)];
      const larg = 60 + dado(s+'tl'+i, 50), alt = larg*0.32;
      if(b.w < larg+20) return;
      const u0 = b.x + 8 + dado(s+'tu'+i, Math.max(1, b.w-larg-16));
      const v0 = 14 + dado(s+'tv'+i, Math.max(1, Math.min(40, h-alt-20)));
      const tex = texturaTexto(tag, {cor:PICHACAO[dado(s+'tc'+i,PICHACAO.length)],
        fonte:'italic 900 40px Impact, "Arial Black", sans-serif', gira:(frac(s+'g'+i)-0.5)*0.2});
      letreiro(lado, b, u0, v0, u0+larg, v0+alt, tex, 1.3, 0.95);
    }
  }
  function caixaDagua(m, x, y, z){
    m.cilindro(x, y, z, 10, 15, cor('#2d6fa8'), 10, {topo:cor('#3d82c0')});
    m.cilindro(x, y, z, 11, 2, cor('#5a5a58'), 10);
  }
  function varalDeRoupa(m, x0, x1, y, z, chave){
    linhas.linha([x0,y,z],[x1,y,z],[0.9,0.9,0.88,0.9]);
    const n = Math.max(2, Math.floor((x1-x0)/16));
    for(let i=0;i<n;i++){
      const px = x0 + 6 + i*((x1-x0-12)/Math.max(1,n-1));
      const c = cor(ROUPA[dado(chave+'r'+i, ROUPA.length)]);
      m.quad([px-4,y,z],[px+4,y,z],[px+4,y-12,z],[px-4,y-12,z], c, [0,0,1]);
    }
  }
  function antena(m, x, y, z){
    m.caixa(x-0.6, y, z-0.6, x+0.6, y+26, z+0.6, cor('#555'));
    for(let k=0;k<3;k++) m.caixa(x-8+k*1.5, y+16+k*4, z-0.4, x+8-k*1.5, y+17+k*4, z+0.4, cor('#555'));
  }

  function lajeDeCasa(m, b, h, s){
    const c = cor(LAJE[dado(s+'l', LAJE.length)]);
    m.chao(b.x, b.y, b.x+b.w, b.y+b.h, h+0.2, c);
    /* platibanda: a mureta em volta da laje */
    const p = cor('#a09a8c');
    m.caixa(b.x, h, b.y, b.x+b.w, h+8, b.y+3, p);
    m.caixa(b.x, h, b.y+b.h-3, b.x+b.w, h+8, b.y+b.h, p);
    m.caixa(b.x, h, b.y, b.x+3, h+8, b.y+b.h, p);
    m.caixa(b.x+b.w-3, h, b.y, b.x+b.w, h+8, b.y+b.h, p);
    caixaDagua(m, b.x+b.w*0.25, h, b.y+b.h*0.3);
    if(frac(s+'var')>0.35)
      varalDeRoupa(m, b.x+14, b.x+b.w-14, h+22, b.y+b.h*0.68, s);
    if(frac(s+'ant')>0.5) antena(m, b.x+b.w-12, h, b.y+10);
    /* o segundo andar que ficou no tijolo, esperando dinheiro */
    if(frac(s+'tij')>0.72){
      const t = cor('#a0563a');
      m.caixa(b.x+b.w*0.5, h, b.y+4, b.x+b.w-4, h+34, b.y+b.h*0.6, t);
    }
  }

  function construirCasa(m, b, s, opc){
    opc = opc||{};
    const lado = frente(b);
    const laje = opc.laje!==undefined ? opc.laje : frac(s) > 0.45;
    const h = opc.h || (78 + dado(s+'h', 26));
    const par = varia(cor(opc.parede || PAREDE[dado(s+'p',PAREDE.length)]), s+'v', 0.08);
    m.caixa(b.x, 0, b.y, b.x+b.w, h, b.y+b.h, par);
    /* a fachada: porta e janelas viradas pra rua */
    const nJ = Math.max(1, Math.min(3, Math.floor((b.w-40)/44)));
    const uPorta = b.x + 12 + dado(s+'pu', Math.max(1, b.w-46));
    porta(m, lado, b, uPorta, 22, 58);
    for(let k=0;k<nJ;k++){
      const u = b.x + 10 + k*((b.w-20-30)/Math.max(1,nJ-1||1));
      if(Math.abs(u-uPorta) < 30 && nJ>1) continue;
      janela(m, lado, b, u, 42, 30, 26);
    }
    if(opc.pichar!==false && frac(s+'pich') > 0.45) pichacao(lado, b, s, h);
    if(laje) lajeDeCasa(m, b, h, s);
    else {
      const t = varia(cor(TELHADO[dado(s+'t',TELHADO.length)]), s+'tv', 0.08);
      m.telhado(b.x, b.y, b.x+b.w, b.y+b.h, h, h+24, b.w >= b.h, t, 6);
    }
    return h;
  }

  function construirSobrado(m, b, s){
    const lado = frente(b);
    const h = 160 + dado(s+'h', 20);
    const par = varia(cor(PAREDE[dado(s+'p',PAREDE.length)]), s+'v', 0.08);
    m.caixa(b.x, 0, b.y, b.x+b.w, h, b.y+b.h, par);
    const uPorta = b.x + 14 + dado(s+'pu', Math.max(1, b.w-50));
    porta(m, lado, b, uPorta, 24, 60);
    const nJ = Math.max(1, Math.min(3, Math.floor((b.w-40)/48)));
    for(let k=0;k<nJ;k++){
      const u = b.x + 12 + k*((b.w-24-30)/Math.max(1,nJ-1||1));
      if(Math.abs(u-uPorta) >= 30 || nJ===1) janela(m, lado, b, u, 40, 30, 26);
      janela(m, lado, b, u, 112, 30, 30);
    }
    /* a sacada do segundo andar */
    const z0 = lado==='s' ? b.y+b.h : b.y-16, z1 = lado==='s' ? b.y+b.h+16 : b.y;
    m.caixa(b.x+8, 84, z0, b.x+b.w-8, 88, z1, cor('#9a958a'));
    const zg = lado==='s' ? z1-1.5 : z0;
    m.caixa(b.x+8, 88, zg, b.x+b.w-8, 108, zg+1.5, cor('#3a3a3a'));
    if(frac(s+'pich') > 0.4) pichacao(lado, b, s, 80);
    lajeDeCasa(m, b, h, s);
    return h;
  }

  function construirBoteco(m, b, s){
    const lado = frente(b);
    const h = 88 + dado(s+'h', 10);
    const vivas = ['#e8b524','#c73b2b','#2f8a55','#2f6bb8','#f0f0e8'];
    const par = cor(vivas[dado(s+'c', vivas.length)]);
    m.caixa(b.x, 0, b.y, b.x+b.w, h, b.y+b.h, cor('#cfc4a8'), {lado:cor('#cfc4a8')});
    /* a fachada pintada de cor viva, só ela */
    quadFachada(m, lado, b, b.x, 0, b.x+b.w, h, par, 0.4);
    const uPorta = b.x + b.w*0.5 - 22;
    porta(m, lado, b, uPorta, 44, 66, cor('#2b2b2b'));
    janela(m, lado, b, b.x+12, 40, 32, 28);
    /* o letreiro */
    const nome = BARES[dado(s+'nome', BARES.length)];
    const tex = texturaTexto(nome, {fundo:'#f4d35e', cor:'#b3261e', faixa:'#b3261e', w:512, h:96});
    const lw = Math.min(b.w-16, 150);
    letreiro(lado, b, b.x+b.w/2-lw/2, h-22, b.x+b.w/2+lw/2, h-4, tex, 1.2, 1.0);
    /* o toldo listrado por cima da calçada */
    const zP = lado==='s' ? b.y+b.h : b.y, dir = lado==='s' ? 1 : -1;
    const x0 = b.x+8, x1 = b.x+b.w-8;
    const nL = Math.max(2, Math.floor((x1-x0)/16));
    for(let i=0;i<nL;i++){
      const a = x0 + i*(x1-x0)/nL, bx = x0 + (i+1)*(x1-x0)/nL;
      const c = i%2 ? cor('#f2efe6') : cor('#c8322a');
      m.quad([a,66,zP],[bx,66,zP],[bx,56,zP+dir*44],[a,56,zP+dir*44], c, [0,0.97,0.24*dir]);
    }
    /* engradado de cerveja empilhado do lado da porta */
    const ex = b.x+b.w-30, ez = zP + dir*10;
    for(let k=0;k<2;k++)
      m.caixa(ex, k*11, ez-6, ex+16, k*11+10, ez+6, k ? cor('#d8b23a') : cor('#c8322a'));
    /* freezer branco na porta */
    m.caixa(b.x+6, 0, zP+dir*2, b.x+24, 30, zP+dir*22, cor('#f2f2ee'));
    lajeDeCasa(m, b, h, s);
    return h;
  }

  function construirCacamba(m, b){
    const c = cor('#c8722a');
    m.caixa(b.x, 0, b.y, b.x+b.w, 40, b.y+b.h, c);
    m.caixa(b.x-1, 36, b.y-1, b.x+b.w+1, 40, b.y+b.h+1, tom(c,0.7));
    for(let i=0;i<9;i++){
      const s='ent|'+b.x+'|'+i;
      const px=b.x+8+dado(s,Math.max(1,b.w-28)), pz=b.y+8+dado(s+'z',Math.max(1,b.h-22));
      const cc = (i%3) ? cor('#8a857c') : cor('#a0563a');
      m.caixa(px, 38, pz, px+10+dado(s+'w',10), 38+5+dado(s+'h',8), pz+8+dado(s+'d',8), cc);
    }
    return 40;
  }

  function construirCarro(m, b){
    const s='carro|'+b.x+'|'+b.y;
    const c = cor(CARROS[dado(s, CARROS.length)]);
    const L=b.w, Wd=b.h, x0=b.x, z0=b.y;
    const aoLongoX = L >= Wd;
    if(aoLongoX){
      m.caixa(x0+3, 8, z0+3, x0+L-3, 24, z0+Wd-3, c);
      m.caixa(x0+L*0.30, 24, z0+6, x0+L*0.78, 40, z0+Wd-6, cor('#26313f'));
      m.caixa(x0+L*0.32, 39, z0+7, x0+L*0.76, 42, z0+Wd-7, c);
      for(const fx of [0.2, 0.8]) for(const fz of [0, 1])
        m.roda(x0+L*fx, 9, z0 + (fz ? Wd-4 : 4), 9, 6, cor('#1a1a1a'), 8);
    } else {
      m.caixa(x0+3, 8, z0+3, x0+Wd-3, 24, z0+L-3, c);
      m.caixa(x0+6, 24, z0+L*0.30, x0+Wd-6, 40, z0+L*0.78, cor('#26313f'));
      m.caixa(x0+7, 39, z0+L*0.32, x0+Wd-7, 42, z0+L*0.76, c);
    }
    return 42;
  }

  function construirPoste(m, e, ctx){
    m.caixa(e.x-3.5, 0, e.y-3.5, e.x+3.5, 230, e.y+3.5, cor('#8c8c85'));
    const dir = e.y < H/2 ? 1 : -1;         // o braço aponta pra rua
    m.caixa(e.x-2, 222, Math.min(e.y, e.y+dir*30), e.x+2, 226, Math.max(e.y, e.y+dir*30), cor('#6f6f68'));
    const zl = e.y + dir*30;
    m.caixa(e.x-7, 216, zl-5, e.x+7, 222, zl+5, cor('#e9dcb0'));
    ctx.postes.push(e);
  }
  function fios(ctx){
    const escuro=[0.10,0.10,0.11,0.9];
    for(const lado of [true,false]){
      const ps = ctx.postes.filter(p=>(p.y < H/2)===lado).sort((a,b)=>a.x-b.x);
      for(let i=1;i<ps.length;i++){
        const a=ps[i-1], b=ps[i];
        linhas.fio([a.x,214,a.y],[b.x,214,b.y],12,escuro);
        linhas.fio([a.x,204,a.y],[b.x,204,b.y],15,escuro);
      }
      /* a gambiarra: do poste pra casa mais perto */
      for(const p of ps){
        let melhor=null, md=1e9;
        for(const c of ctx.casas){
          const d = Math.hypot(c.cx-p.x, c.cz-p.y);
          if(d<md){ md=d; melhor=c; }
        }
        if(melhor && md<220) linhas.fio([p.x,208,p.y],[melhor.cx, melhor.h+2, melhor.cz],8,escuro);
      }
    }
  }
  function bandeirinhas(m, a, b, chave){
    const [x1,z1]=a, [x2,z2]=b;
    const y=196, sag=24, n=Math.max(2, Math.floor(Math.hypot(x2-x1,z2-z1)/22));
    linhas.fio([x1,y,z1],[x2,y,z2],sag,[0.95,0.95,0.9,0.9], 12);
    for(let i=1;i<n;i++){
      const t=i/n;
      const px=x1+(x2-x1)*t, pz=z1+(z2-z1)*t, py=y-sag*4*t*(1-t);
      const c=cor(BANDEIRINHA[dado(chave+'|'+i, BANDEIRINHA.length)]);
      const dx=(x2-x1), dz=(z2-z1), l=Math.hypot(dx,dz)||1, ux=dx/l*5, uz=dz/l*5;
      m.tri([px-ux,py,pz-uz],[px+ux,py,pz+uz],[px,py-13,pz], c, [uz/5,0,-ux/5]);
    }
  }

  function construirLixeira(m, e){
    m.caixa(e.x-1.5, 0, e.y-1.5, e.x+1.5, 22, e.y+1.5, cor('#4a4740'));
    m.caixa(e.x-11, 20, e.y-7, e.x+11, 36, e.y+7, cor('#3f7d3a'));
  }
  function construirMesa(m, e){
    const branco = cor('#ece8dc');
    m.cilindro(e.x, 26, e.y, 15, 1.6, branco, 10);
    m.cilindro(e.x, 0, e.y, 1.6, 26, branco, 6);
    for(const [dx,dz] of [[-22,0],[22,0],[0,-22],[0,22]]){
      m.caixa(e.x+dx-5, 13, e.y+dz-5, e.x+dx+5, 15, e.y+dz+5, branco);
      for(const [px,pz] of [[-4,-4],[4,-4],[-4,4],[4,4]])
        m.caixa(e.x+dx+px-0.7, 0, e.y+dz+pz-0.7, e.x+dx+px+0.7, 13, e.y+dz+pz+0.7, branco);
      /* o encosto, virado pra fora da mesa */
      const ex = dx ? Math.sign(dx)*4.5 : 0, ez = dz ? Math.sign(dz)*4.5 : 0;
      m.caixa(e.x+dx+ex-(dx?0.8:5), 15, e.y+dz+ez-(dz?0.8:5), e.x+dx+ex+(dx?0.8:5), 27, e.y+dz+ez+(dz?0.8:5), branco);
    }
    m.cilindro(e.x-4, 27.6, e.y-3, 1.6, 8, cor('#3f6b2a'), 6);
    m.cilindro(e.x+4, 27.6, e.y+2, 1.6, 8, cor('#3f6b2a'), 6);
  }
  function construirLombada(m, e){
    const z0 = 330, z1 = H-330;
    for(let z=z0, k=0; z<z1; z+=40, k++){
      const c = k%2 ? cor('#e8d24a') : cor('#2a2a28');
      m.caixa(e.x-11, 0, z, e.x+11, 3.5, Math.min(z+40, z1), c);
    }
  }
  function construirBanco(m, e){
    const ang = e.ang ? Math.PI/2 : 0;
    const M = M4.mul(M4.trans(e.x,0,e.y), M4.rotY(ang));
    m.caixaM(M, 72, 3, 16, cor('#8d7a5c'), 0, 17, 0);
    m.caixaM(M, 8, 17, 16, cor('#6f6b62'), -28, 8.5, 0);
    m.caixaM(M, 8, 17, 16, cor('#6f6b62'), 28, 8.5, 0);
    m.caixaM(M, 72, 14, 2.5, cor('#8d7a5c'), 0, 26, -7);
  }
  function construirOrelhao(m, e){
    m.caixa(e.x-1.5, 0, e.y-1.5, e.x+1.5, 44, e.y+1.5, cor('#5a5a58'));
    m.esfera(e.x, 52, e.y, 15, cor('#2f6bb8'), 10, 4, 12);
  }

  /* ---- classe média ---- */
  function construirCasaMedia(m, b, s){
    const lado = frente(b);
    const dir = lado==='s' ? 1 : -1;
    const zF = lado==='s' ? b.y+b.h : b.y;          // a linha da calçada
    /* o muro baixo com o portão */
    const muro = cor('#d8d2c4');
    const uG = b.x + b.w*0.55;
    m.caixa(b.x, 0, Math.min(zF,zF-dir*4), uG-18, 26, Math.max(zF,zF-dir*4), muro);
    m.caixa(uG+18, 0, Math.min(zF,zF-dir*4), b.x+b.w, 26, Math.max(zF,zF-dir*4), muro);
    m.caixa(uG-18, 0, Math.min(zF,zF-dir*3), uG+18, 30, Math.max(zF,zF-dir*3), cor('#3a3a3a'));
    /* o jardim na frente e a casa atrás, com a garagem de um lado */
    const zC0 = lado==='s' ? b.y : b.y+44, zC1 = lado==='s' ? b.y+b.h-44 : b.y+b.h;
    m.chao(b.x+1, Math.min(zF,zF-dir*44), b.x+b.w-1, Math.max(zF,zF-dir*44), 0.4, cor('#4f7d3a'));
    const casa = {x:b.x, y:zC0, w:b.w*0.62, h:zC1-zC0};
    const h = 92 + dado(s+'h', 14);
    const par = cor(['#f2ede0','#e6d8b8','#dfe4d8','#f0dcc4'][dado(s+'p',4)]);
    m.caixa(casa.x, 0, casa.y, casa.x+casa.w, h, casa.y+casa.h, par);
    const bb = {x:casa.x, y:casa.y, w:casa.w, h:casa.h};
    porta(m, lado, bb, casa.x+16, 22, 58, cor('#6a3a1e'));
    janela(m, lado, bb, casa.x+casa.w-46, 42, 32, 28);
    m.telhado(casa.x, casa.y, casa.x+casa.w, casa.y+casa.h, h, h+22, casa.w>=casa.h, cor('#8a4030'), 6);
    /* garagem: mais baixa, portão de aço */
    const gx0 = casa.x+casa.w+4, gx1 = b.x+b.w;
    const gz0 = lado==='s' ? b.y : zF-dir*(b.h-6), gz1 = lado==='s' ? zF-dir*6 : b.y+b.h;
    m.caixa(gx0, 0, Math.min(gz0,gz1), gx1, 62, Math.max(gz0,gz1), par);
    quadFachada(m, lado, {x:gx0,y:Math.min(gz0,gz1),w:gx1-gx0,h:Math.abs(gz1-gz0)}, gx0+6, 0, gx1-6, 52, cor('#8d8f96'), 0.8);
    /* árvore pequena no jardim */
    m.cilindro(b.x+b.w*0.82, 0, zF-dir*22, 2.5, 26, cor('#5a3d27'), 6);
    m.esfera(b.x+b.w*0.82, 34, zF-dir*22, 16, cor('#4a8a3a'), 8, 5);
    return h;
  }
  function construirPredinho(m, b, s){
    const lado = frente(b);
    const h = 250;
    const par = cor(['#e8dcc8','#d9c5a5','#cfd6d0','#e0c8b0'][dado(s+'p',4)]);
    m.caixa(b.x, 0, b.y, b.x+b.w, h, b.y+b.h, par);
    quadFachada(m, lado, b, b.x+b.w*0.5-30, 0, b.x+b.w*0.5+30, 62, cor('#8d8f96'), 0.8);
    const nJ = Math.max(2, Math.floor((b.w-30)/42));
    for(let andar=1; andar<3; andar++)
      for(let k=0;k<nJ;k++){
        const u = b.x + 15 + k*((b.w-30-28)/Math.max(1,nJ-1));
        janela(m, lado, b, u, andar*80+30, 28, 30);
      }
    lajeDeCasa(m, b, h, s);
    return h;
  }
  function construirPadaria(m, b, s){
    const lado = frente(b);
    const h = 96;
    m.caixa(b.x, 0, b.y, b.x+b.w, h, b.y+b.h, cor('#f0e6d2'));
    quadFachada(m, lado, b, b.x+8, 0, b.x+b.w-8, 62, cor('#a9cbe6'), 0.8);
    porta(m, lado, b, b.x+b.w*0.5-20, 40, 62, cor('#6f8da6'));
    const tex = texturaTexto('PADARIA PÃO QUENTE', {fundo:'#f2f2ee', cor:'#b3261e', faixa:'#e8b524', w:512, h:96});
    const lw = Math.min(b.w-16, 170);
    letreiro(lado, b, b.x+b.w/2-lw/2, h-24, b.x+b.w/2+lw/2, h-6, tex, 1.2, 1.0);
    lajeDeCasa(m, b, h, s);
    return h;
  }
  function construirArvore(m, b, r){
    const cx=b.x+b.w/2, cz=b.y+b.h/2;
    const tr = r>34 ? 7 : 4, alt = r>34 ? 70 : 50;
    m.cilindro(cx, 0, cz, tr, alt, cor('#5a3d27'), 7);
    const verde = varia(cor('#3f7d3a'), 'arv|'+b.x+'|'+b.y, 0.15);
    m.esfera(cx, alt+r*0.7, cz, r, verde, 9, 6, r*0.8);
    return alt+r*1.5;
  }
  function construirPontoOnibus(m, b){
    const lado = frente(b);
    const azul = cor('#2c3e50');
    m.caixa(b.x, 70, b.y, b.x+b.w, 74, b.y+b.h, azul);
    for(const [px,pz] of [[b.x+2,b.y+2],[b.x+b.w-4,b.y+2],[b.x+2,b.y+b.h-4],[b.x+b.w-4,b.y+b.h-4]])
      m.caixa(px, 0, pz, px+2.5, 70, pz+2.5, azul);
    const zB = lado==='s' ? b.y+8 : b.y+b.h-16;
    m.caixa(b.x+8, 18, zB, b.x+b.w-8, 22, zB+9, cor('#8d7a5c'));
    const zV = lado==='s' ? b.y+1 : b.y+b.h-2;
    m.caixa(b.x+3, 8, zV, b.x+b.w-3, 68, zV+1, cor('#8fb6cf'));
    return 74;
  }
  /* ---- classe alta ---- */
  function construirTorre(m, b, s){
    const h = 440 + dado(s+'h', 60);
    const par = cor(['#e9e4dc','#d7cfc4','#cfd8dc','#e2d5c3'][dado(s+'p',4)]);
    m.caixa(b.x, 0, b.y, b.x+b.w, h, b.y+b.h, par);
    /* janelas nos quatro lados, andar por andar */
    const vidro = cor('#6f95b8');
    for(let andar=1; andar*44+30 < h-20; andar++){
      const v0 = andar*44, v1 = v0+22;
      for(let x=b.x+10; x<b.x+b.w-30; x+=34){
        m.quad([x,v0,b.y-0.6],[x+22,v0,b.y-0.6],[x+22,v1,b.y-0.6],[x,v1,b.y-0.6], vidro, [0,0,-1]);
        m.quad([x,v0,b.y+b.h+0.6],[x+22,v0,b.y+b.h+0.6],[x+22,v1,b.y+b.h+0.6],[x,v1,b.y+b.h+0.6], vidro, [0,0,1]);
      }
      for(let z=b.y+10; z<b.y+b.h-30; z+=34){
        m.quad([b.x-0.6,v0,z],[b.x-0.6,v0,z+22],[b.x-0.6,v1,z+22],[b.x-0.6,v1,z], vidro, [-1,0,0]);
        m.quad([b.x+b.w+0.6,v0,z],[b.x+b.w+0.6,v0,z+22],[b.x+b.w+0.6,v1,z+22],[b.x+b.w+0.6,v1,z], vidro, [1,0,0]);
      }
    }
    const lado = frente(b);
    quadFachada(m, lado, b, b.x+b.w*0.5-34, 0, b.x+b.w*0.5+34, 34, cor('#7d8087'), 0.8);
    m.caixa(b.x+b.w*0.3, h, b.y+b.h*0.3, b.x+b.w*0.6, h+22, b.y+b.h*0.6, tom(par,0.9));
    return h;
  }
  function construirJardimAlto(m, b, s){
    const lado = frente(b), dir = lado==='s' ? 1 : -1;
    const zF = lado==='s' ? b.y+b.h : b.y;
    const muro = cor(['#e6e1d6','#d5d9cf','#e8dcc8'][dado(s+'m',3)]);
    const uG = b.x + b.w*0.5;
    m.caixa(b.x, 0, Math.min(zF,zF-dir*6), uG-20, 92, Math.max(zF,zF-dir*6), muro);
    m.caixa(uG+20, 0, Math.min(zF,zF-dir*6), b.x+b.w, 92, Math.max(zF,zF-dir*6), muro);
    m.caixa(uG-20, 0, Math.min(zF,zF-dir*4), uG+20, 70, Math.max(zF,zF-dir*4), cor('#3b2a1e'));
    /* a cerca elétrica em cima do muro */
    const fio=[0.75,0.75,0.72,0.9];
    for(let x=b.x+8; x<b.x+b.w; x+=40)
      m.caixa(x-0.8, 92, zF-dir*3-0.8, x+0.8, 110, zF-dir*3+0.8, cor('#3a3a3a'));
    for(const y of [98,104,110]) linhas.linha([b.x,y,zF-dir*3],[b.x+b.w,y,zF-dir*3],fio);
    /* a casa lá no fundo do terreno */
    const zC0 = lado==='s' ? b.y+6 : zF-dir*(b.h-6), zC1 = lado==='s' ? zF-dir*60 : b.y+b.h-6;
    const h = 150;
    m.caixa(b.x+10, 0, Math.min(zC0,zC1), b.x+b.w-10, h, Math.max(zC0,zC1), cor('#f4f1ea'));
    m.telhado(b.x+10, Math.min(zC0,zC1), b.x+b.w-10, Math.max(zC0,zC1), h, h+26, true, cor('#7a4a3a'), 8);
    m.chao(b.x+1, Math.min(zF,zF-dir*60), b.x+b.w-1, Math.max(zF,zF-dir*60), 0.4, cor('#4a8a3a'));
    m.cilindro(b.x+b.w*0.25, 0, zF-dir*32, 6, 60, cor('#5a3d27'), 7);
    m.esfera(b.x+b.w*0.25, 90, zF-dir*32, 36, cor('#3f7d3a'), 9, 6, 28);
    return h;
  }
  function construirGuarita(m, b){
    const lado = frente(b);
    m.caixa(b.x, 0, b.y, b.x+b.w, 70, b.y+b.h, cor('#e8e2d0'));
    for(const z of [b.y-0.6, b.y+b.h+0.6])
      m.quad([b.x+6,36,z],[b.x+b.w-6,36,z],[b.x+b.w-6,60,z],[b.x+6,60,z], cor('#7fa6c9'), [0,0,z<b.y+1?-1:1]);
    m.caixa(b.x-3, 70, b.y-3, b.x+b.w+3, 74, b.y+b.h+3, cor('#5a5a58'));
    porta(m, lado, b, b.x+b.w/2-10, 20, 58, cor('#4a4a48'));
    return 74;
  }
  function construirGenerico(m, b){
    m.caixa(b.x, 0, b.y, b.x+b.w, 70, b.y+b.h, cor('#6a665e'));
    return 70;
  }

  const CONSTRUTOR = {
    casa:(m,b,s)=>construirCasa(m,b,s),
    sobrado:construirSobrado,
    boteco:construirBoteco,
    cacamba:(m,b)=>construirCacamba(m,b),
    carro:(m,b)=>construirCarro(m,b),
    'casa-media':construirCasaMedia,
    predinho:construirPredinho,
    padaria:construirPadaria,
    'arvore-rua':(m,b)=>construirArvore(m,b,26),
    'arvore-grande':(m,b)=>construirArvore(m,b,42),
    'ponto-onibus':(m,b)=>construirPontoOnibus(m,b),
    torre:construirTorre,
    'jardim-alto':construirJardimAlto,
    guarita:(m,b)=>construirGuarita(m,b),
    predio:(m,b,s)=>construirSobrado(m,b,s),
    igreja:(m,b,s)=>construirCasa(m,b,s,{h:120,parede:'#f2eee4',laje:false,pichar:false}),
    quiosque:(m,b,s)=>construirCasa(m,b,s,{h:50,laje:true,pichar:false}),
    banca:(m,b,s)=>construirCasa(m,b,s,{h:46,parede:'#2f6bb8',laje:true,pichar:false})
  };
  const ENFEITE = {
    poste:construirPoste, lixeira:(m,e)=>construirLixeira(m,e), mesa:(m,e)=>construirMesa(m,e),
    lombada:(m,e)=>construirLombada(m,e), banco:(m,e)=>construirBanco(m,e),
    orelhao:(m,e)=>construirOrelhao(m,e)
  };

  /* ---------- o chão da rua ---------- */
  function ladrilhos(m, x0,z0,x1,z1, y, passo, c, amp, chave){
    for(let z=z0; z<z1; z+=passo) for(let x=x0; x<x1; x+=passo){
      const cc = amp ? varia(c, chave+'|'+x+'|'+z, amp) : c;
      m.chao(x, z, Math.min(x+passo,x1), Math.min(z+passo,z1), y, cc);
    }
  }
  function meioFio(m, x0, x1, z, y, paraSul){
    /* a face do meio-fio virada pra pista, pintada de preto e branco */
    for(let x=x0, k=0; x<x1; x+=30, k++){
      const c = k%2 ? cor('#1b1b1b') : cor('#e8e4d8');
      const xb = Math.min(x+30, x1);
      if(paraSul) m.quad([x,0,z],[xb,0,z],[xb,y,z],[x,y,z], c, [0,0,1]);
      else        m.quad([x,0,z],[x,y,z],[xb,y,z],[xb,0,z], c, [0,0,-1]);
    }
  }
  function faixaPedestre(m, cx, cz, comp, larg, vertical){
    const c = cor('#ece8dc'), n=7, f=larg/(n*2-1);
    for(let i=0;i<n;i++){
      if(vertical) m.chao(cx-larg/2+i*f*2, cz-comp/2, cx-larg/2+i*f*2+f, cz+comp/2, 0.35, c);
      else         m.chao(cx-comp/2, cz-larg/2+i*f*2, cx+comp/2, cz-larg/2+i*f*2+f, 0.35, c);
    }
  }
  function chaoDeRua(m, e){
    const PONTA=250, T=PONTA-40, ASF0=330, ASF1=H-330, CAL=4;
    const EXT=1500;
    /* o fundo de tudo, até onde a neblina alcança. Em pedaços, e bem
       abaixo do asfalto: um quadrado só de oito mil unidades tem os
       quatro cantos dentro da neblina e sai bege inteiro, e a meio
       milímetro do asfalto ele briga no z-buffer e aparece em faixas. */
    ladrilhos(m, -4000, -4000, W+4000, H+4000, -3, 400, tom(e.fundo, 0.85), 0.06, e.id+'fundo');
    /* a pista, pra fora da cena dos dois lados */
    ladrilhos(m, -EXT, ASF0, W+EXT, ASF1, 0, 48, e.asfalto, e.remendo ? 0.10 : 0.04, e.id+'a');
    if(e.pedra) ladrilhos(m, 620, ASF0, 920, ASF1, 0.15, 15, cor('#5a5650'), 0.14, e.id+'pp');
    /* as duas transversais, também continuando pra fora */
    ladrilhos(m, 0, -EXT, T, ASF0, 0, 48, e.asfalto, 0.05, e.id+'t1');
    ladrilhos(m, 0, ASF1, T, H+EXT, 0, 48, e.asfalto, 0.05, e.id+'t2');
    ladrilhos(m, W-T, -EXT, W, ASF0, 0, 48, e.asfalto, 0.05, e.id+'t3');
    ladrilhos(m, W-T, ASF1, W, H+EXT, 0, 48, e.asfalto, 0.05, e.id+'t4');
    /* remendo e buraco: só a periferia tem */
    if(e.remendo){
      for(let i=0;i<22;i++){
        const s=hash(e.id+'|rem|'+i);
        const rx=(s%(W+1200))-600, rz=ASF0+10+((s>>>7)%(ASF1-ASF0-60));
        m.chao(rx, rz, rx+36+(s%40), rz+22+((s>>>5)%22), 0.12, (s>>>3)%2 ? cor('#26262b') : cor('#46444a'));
      }
      for(let i=0;i<5;i++){
        const s=hash(e.id+'|bur|'+i);
        m.chao(s%W, ASF0+30+((s>>>9)%(ASF1-ASF0-70)), s%W+18+(s%12), ASF0+30+((s>>>9)%(ASF1-ASF0-70))+12+(s%8), 0.2, cor('#121214'));
      }
    }
    /* calçadas dos dois lados, levantadas, com o meio-fio pintado */
    const cal = (x0,x1)=>{
      ladrilhos(m, x0, 190, x1, ASF0, CAL, 26, e.calcada, 0.07, e.id+'cn');
      ladrilhos(m, x0, ASF1, x1, H-190, CAL, 26, e.calcada, 0.07, e.id+'cs');
      meioFio(m, x0, x1, ASF0, CAL, true);
      meioFio(m, x0, x1, ASF1, CAL, false);
    };
    cal(T, W-T); cal(-EXT, 0); cal(W, W+EXT);
    /* a calçada dobra a esquina */
    for(const x of [0, W-T]){
      ladrilhos(m, x, 190, x+T, 216, CAL, 26, e.calcada, 0.07, e.id+'q'+x);
      ladrilhos(m, x, H-216, x+T, H-190, CAL, 26, e.calcada, 0.07, e.id+'r'+x);
    }
    /* vaga pintada, que bairro cuidado tem */
    if(e.vagas){
      const br = cor('#eeeade');
      for(const z of [[340,400],[H-400,H-340]])
        for(let x=PONTA+40; x<W-PONTA-40; x+=124) m.chao(x-1.5, z[0], x+1.5, z[1], 0.3, br);
    }
    /* eixo tracejado da pista e das transversais */
    for(let x=-EXT; x<W+EXT; x+=78) m.chao(x, 509.5, x+44, 514.5, 0.3, e.eixo);
    for(const x of [T/2, W-T/2]){
      for(let z=-EXT; z<ASF0-20; z+=58) m.chao(x-2.5, z, x+2.5, z+32, 0.3, e.eixo);
      for(let z=ASF1+20; z<H+EXT; z+=58) m.chao(x-2.5, z, x+2.5, z+32, 0.3, e.eixo);
    }
    /* faixa de pedestre nas quatro esquinas */
    faixaPedestre(m, PONTA+30, 512, 320, 60, true);
    faixaPedestre(m, W-PONTA-30, 512, 320, 60, true);
    faixaPedestre(m, T/2, 260, 150, 52, false);
    faixaPedestre(m, W-T/2, 764, 150, 52, false);
    /* a placa de rua na esquina */
    const tex = texturaTexto(e.placa, {fundo:'#1f4e8c', cor:'#fff', w:256, h:64,
      fonte:'700 30px "Barlow Condensed", sans-serif'});
    for(const [x,z] of [[T+6, ASF0-40],[W-T-6, ASF1+40]]){
      m.caixa(x-1.5, 0, z-1.5, x+1.5, 96, z+1.5, cor('#5a5a58'));
      letreiros.push({tex, luz:0.95, d:new Float32Array([
        x-30,84,z,0,1, x+30,84,z,1,1, x+30,96,z,1,0, x-30,84,z,0,1, x+30,96,z,1,0, x-30,96,z,0,0])});
    }
  }

  /* o bairro que continua além da cena, pra rua não acabar na borda */
  function vizinhanca(m, e){
    const EXT=1500, T=210;
    const casaSolta=(x,z,w,d,chave)=>{
      const s='viz|'+chave;
      const h = 70 + dado(s+'h', 110);
      const par = varia(cor(PAREDE[dado(s+'p',PAREDE.length)]), s+'v', 0.1);
      m.caixa(x, 0, z, x+w, h, z+d, par);
      if(frac(s)>0.5) m.telhado(x, z, x+w, z+d, h, h+22, w>=d, cor(TELHADO[dado(s+'t',TELHADO.length)]), 5);
      else { m.chao(x,z,x+w,z+d,h+0.2,cor(LAJE[dado(s+'l',LAJE.length)])); caixaDagua(m, x+w*0.3, h, z+d*0.4); }
    };
    let k=0;
    for(const [x0,x1] of [[-EXT+40, -60],[W+60, W+EXT-40]])
      for(let x=x0; x<x1-120; x+=150+dado('vx'+k,60), k++){
        casaSolta(x, 20+dado('vn'+k,40), 130, 150, 'n'+k);
        casaSolta(x, H-190, 130, 150, 's'+k);
      }
    for(const [z0,z1] of [[-EXT+40, -80],[H+80, H+EXT-40]])
      for(let z=z0; z<z1-120; z+=160+dado('vz'+k,50), k++){
        casaSolta(-190, z, 150, 140, 'w'+k);
        casaSolta(T+40, z, 150, 140, 'e'+k);
        casaSolta(W-T-190, z, 150, 140, 'f'+k);
        casaSolta(W+40, z, 150, 140, 'g'+k);
      }
    /* os morros no horizonte, com casinha subindo a encosta */
    const morro = cor(e.morro);
    for(const [mx,mz,r,alt] of [[W/2-900,-2600,1500,420],[W/2+1100,-2400,1300,360],
                                [-2400,H/2+300,1400,380],[W+2600,H/2-200,1500,430],
                                [W/2-400,H+2500,1400,340],[W/2+1300,H+2300,1200,300]]){
      m.esfera(mx, -60, mz, r, morro, 14, 6, alt);
      for(let i=0;i<26;i++){
        const s=hash('enc|'+mx+'|'+i);
        const a=(s%628)/100, rr=r*(0.3+((s>>>8)%50)/100);
        const px=mx+Math.cos(a)*rr, pz=mz+Math.sin(a)*rr;
        const py=Math.max(0, (alt-60)*Math.sqrt(Math.max(0,1-(rr/r)*(rr/r)))-60);
        m.caixa(px, py, pz, px+40, py+34, pz+40, cor(PAREDE[(s>>>3)%PAREDE.length]));
      }
    }
  }

  const ESTILO = {
    'rua':       {id:'rua', asfalto:cor('#3a3a41'), calcada:cor('#9d968a'), fundo:cor('#5a4c3c'),
                  eixo:cor('#c8b060'), remendo:true, pedra:true, placa:'R. SÃO FRANCISCO', morro:'#4b6a3a'},
    'rua-media': {id:'rua-media', asfalto:cor('#44444b'), calcada:cor('#b4ada0'), fundo:cor('#5f5a4a'),
                  eixo:cor('#d8c26a'), vagas:true, placa:'R. DAS ACÁCIAS', morro:'#4e6e3c'},
    'rua-nobre': {id:'rua-nobre', asfalto:cor('#46464c'), calcada:cor('#cfc8b8'), fundo:cor('#4e5544'),
                  eixo:cor('#eee8d8'), placa:'AV. DAS MANGUEIRAS', morro:'#557a44'}
  };

  function levantar(D){
    cenaAtual = D;
    W = D.largura || 1536; H = D.altura || 1024;
    est = new Malha(9*400000);
    linhas = new Simples(7*4096);
    letreiros = []; alturas = [];
    const e = ESTILO[D.pintura] || ESTILO['rua'];
    const ctx = {postes:[], casas:[]};
    chaoDeRua(est, e);
    vizinhanca(est, e);
    for(const b of D.blocos || []){
      const s = `${b.tipo}|${b.x}|${b.y}`;
      const f = CONSTRUTOR[b.tipo] || construirGenerico;
      const h = f(est, b, s) || 60;
      alturas.push({x0:b.x, z0:b.y, x1:b.x+b.w, z1:b.y+b.h, h});
      if(['casa','sobrado','boteco','casa-media','predinho','padaria','torre','jardim-alto','predio'].includes(b.tipo))
        ctx.casas.push({cx:b.x+b.w/2, cz:frente(b)==='s' ? b.y+b.h : b.y, h:Math.min(h, 200)});
    }
    for(const en of D.enfeites || []){
      const f = ENFEITE[en.tipo];
      if(f) f(est, en, ctx);
    }
    fios(ctx);
    for(const [i,v] of (D.varais||[]).entries()) bandeirinhas(est, v[0], v[1], D.id+'|'+i);
    enviar(buf.estatico, est, gl.STATIC_DRAW); nEst = est.vertices;
    enviar(buf.linhas, linhas, gl.STATIC_DRAW); nLin = linhas.vertices;
    est = null;   // a CPU não precisa mais dela; o buffer está na placa
  }

  function alturaEm(x, z){
    let h=0;
    for(const a of alturas) if(x>=a.x0 && x<=a.x1 && z>=a.z0 && z<=a.z1 && a.h>h) h=a.h;
    return h;
  }

  /* =======================================================
     OS BONECOS — o disco vira gente

     O corpo tem articulação de verdade: quadril → joelho, ombro →
     cotovelo, pescoço. A pose é um objeto de ângulos (`poseNeutra`)
     que cada momento da briga preenche — andar, correr, socar,
     cobrir, cambalear, arremessar, cair, sentar preso — e `corpo`
     só monta as caixas. Os sinais vêm todos do combate: `golpe`
     (está batendo, e em quem: `_alvo`), `apanhou` (levou pancada),
     `atordoado`, `fugindo`, `agarrado`, `arremesso`, `caido`,
     `preso`. Nada aqui decide nada; só lê e dobra o boneco.
     ======================================================= */
  const PELE   = ['#8d5524','#c68642','#e0ac69','#f1c27d','#ffdbac','#5c3a1e','#a56a3c','#d9a679'];
  const CALCA  = ['#2b3a55','#1e2a3a','#3c3c3c','#5a4a3a','#262626','#3a4a6a'];
  const CABELO = ['#1a1a1a','#2e1f14','#4a3320','#0f0f0f','#5a3a1a'];
  const din = new Malha(9*60000);
  const planos = new Simples(7*8000);

  function corLado(lado, claro){
    if(lado==='visitante') return claro?'#e8e8e8':'#2a5fa8';
    return claro?'#e8e4dc':'#c0392b';
  }
  function fichaDe(d, i){
    if(d._t3) return d._t3;
    const s = (d.nome||'')+'|'+(d.spawn||'')+'|'+i;
    const camisa = cor(d.cor || corLado(d.lado,false));
    let faixa = cor(d.cor2 || corLado(d.lado,true));
    const bone = frac(s+'b') < 0.42;
    d._t3 = {
      sem:s, fase:frac(s+'f')*6.28, yaw:frac(s+'y')*6.28, tomba:0,
      pele:cor(PELE[dado(s+'p',PELE.length)]),
      calca:cor(CALCA[dado(s+'c',CALCA.length)]),
      cabelo:cor(CABELO[dado(s+'h',CABELO.length)]),
      bermuda: frac(s+'bm') < 0.45,
      bone, corBone: frac(s+'bc') < 0.6 ? camisa : PRETO,
      camisa, faixa,
      escala: d.lider ? 1.08 : 0.96 + frac(s+'e')*0.08,
      /* o que a animação precisa lembrar de um quadro pro outro */
      viuVivo:false, queda:null, caiDeFrente: frac(s+'q') < 0.55,
      cobre: frac(s+'cb') < 0.6,          // cobre com os dois braços, ou só encolhe
      soco:0, olhaTras:0, ultimoLado:frac(s+'ul')<0.5 ? 0 : 1,
      /* a velocidade que a animação usa é MEDIDA, não a do combate:
         o líder anda por `A.mover` direto e nunca escreve `vx`, então
         pela conta do combate ele está sempre parado — e o boneco saía
         do lugar sem mexer as pernas */
      px:null, pz:null, vx:0, vz:0
    };
    return d._t3;
  }
  function medirVelocidade(f, x, z, dt){
    if(f.px!==null && dt>0){
      const vx=(x-f.px)/dt, vz=(z-f.pz)/dt;
      /* um pouco de suavização: o passo não pode gaguejar com o quadro */
      const k=Math.min(1, dt*14);
      f.vx += (vx-f.vx)*k; f.vz += (vz-f.vz)*k;
      /* teletransporte (reencosto no chão livre) não é corrida */
      if(Math.hypot(vx,vz) > 400){ f.vx=0; f.vz=0; }
    }
    f.px=x; f.pz=z;
    return Math.hypot(f.vx, f.vz);
  }

  function girar(atual, alvo, k){
    let d = alvo - atual;
    while(d > Math.PI) d -= Math.PI*2;
    while(d < -Math.PI) d += Math.PI*2;
    return atual + d*k;
  }
  const suave = k => k<=0 ? 0 : k>=1 ? 1 : k*k*(3-2*k);
  const mistura = (a, b, k) => a + (b-a)*k;

  /* ---------- a pose ----------
     Sinais: coxa > 0 é perna pra trás; joelho > 0 dobra natural;
     ombro < 0 é braço erguido pra frente; cotovelo < 0 dobra natural;
     abre > 0 afasta o braço do corpo. `y` levanta ou afunda o corpo,
     `rotRaiz` deita ele (+ de bruços, − de costas). */
  function poseNeutra(){
    return {coxa:[0,0], joelho:[0,0], ombro:[0.05,0.05], cotovelo:[-0.25,-0.25], abre:[0,0],
            inclina:0, tomba:0, gira:0, cabecaX:0, cabecaY:0,
            y:0, rotRaiz:0, altRaiz:0, escala:1};
  }

  function corpo(m, o, p, f){
    let R = M4.mul(M4.trans(o.x, p.y, o.z), M4.rotY(o.yaw));
    if(p.escala!==1) R = M4.mul(R, M4.escala(p.escala));
    if(p.rotRaiz) R = M4.mul(R, M4.mul(M4.trans(0, p.altRaiz, 0), M4.rotX(p.rotRaiz)));
    /* pernas: coxa no quadril, canela no joelho, pé na ponta */
    for(const [k,lado] of [[0,-1],[1,1]]){
      const Mq = M4.mul(R, M4.mul(M4.trans(lado*3.4, 22, 0), M4.rotX(p.coxa[k])));
      if(f.bermuda) m.caixaM(Mq, 6.0, 11, 6.2, f.calca, 0,-5.5,0);
      else          m.caixaM(Mq, 5.4, 11, 5.6, f.calca, 0,-5.5,0);
      const Mc = M4.mul(Mq, M4.mul(M4.trans(0,-11,0), M4.rotX(p.joelho[k])));
      m.caixaM(Mc, 5.0, 11, 5.2, f.bermuda ? f.pele : f.calca, 0,-5.5,0);
      m.caixaM(Mc, 5.6, 3, 7.5, PRETO, 0,-10,1.2);
    }
    /* tronco em três faixas: a camisa com a segunda cor no meio */
    let T = M4.mul(R, M4.trans(0,22,0));
    if(p.gira)    T = M4.mul(T, M4.rotY(p.gira));
    if(p.inclina) T = M4.mul(T, M4.rotX(p.inclina));
    if(p.tomba)   T = M4.mul(T, M4.rotZ(p.tomba));
    m.caixaM(T, 14, 7, 7.5, f.camisa, 0,3.5,0);
    m.caixaM(T, 14.3, 4, 7.8, f.faixa, 0,9,0);
    m.caixaM(T, 14, 7, 7.5, f.camisa, 0,14.5,0);
    /* braços: manga no ombro, antebraço no cotovelo, mão na ponta */
    const maos=[];
    for(const [k,lado] of [[0,-1],[1,1]]){
      let Mo = M4.mul(T, M4.trans(lado*8.8, 16.5, 0));
      Mo = M4.mul(Mo, M4.rotZ(lado*(p.abre[k]-0.12)));
      Mo = M4.mul(Mo, M4.rotX(p.ombro[k]));
      m.caixaM(Mo, 4.6, 8, 4.6, f.camisa, 0,-4,0);
      const Mc = M4.mul(Mo, M4.mul(M4.trans(0,-8,0), M4.rotX(p.cotovelo[k])));
      m.caixaM(Mc, 4.0, 9, 4.0, f.pele, 0,-4.5,0);
      m.caixaM(Mc, 4.4, 3.6, 4.4, f.pele, 0,-10.5,0);
      maos.push(Mc);
    }
    /* cabeça no pescoço, com cabelo, boné ou bandana */
    let Mh = M4.mul(T, M4.trans(0,18.5,0));
    if(p.cabecaY) Mh = M4.mul(Mh, M4.rotY(p.cabecaY));
    if(p.cabecaX) Mh = M4.mul(Mh, M4.rotX(p.cabecaX));
    m.caixaM(Mh, 8, 8.5, 8, f.pele, 0,4.25,0);
    if(f.bone){
      m.caixaM(Mh, 8.6, 3.2, 8.6, f.corBone, 0,8.6,0);
      m.caixaM(Mh, 7.2, 1, 5, f.corBone, 0,7.6,6.2);
    } else if(f.bandana){
      m.caixaM(Mh, 8.6, 3.2, 8.6, f.bandana, 0,7.4,0);
      m.caixaM(Mh, 8.4, 2.4, 8.4, f.cabelo, 0,9.2,-0.3);
    } else {
      m.caixaM(Mh, 8.4, 3, 8.4, f.cabelo, 0,8.5,-0.4);
    }
    if(p.escudo) m.caixaM(maos[0], 18, 26, 2, cor('#5d6b7a'), 0, 2, 4);
    if(p.cassetete) m.caixaM(maos[1], 2, 18, 2, PRETO, 0,-15,3);
    return maos;
  }

  /* ---------- os momentos da briga, cada um dobrando a pose ---------- */

  /* andar e correr: o passo vem da velocidade real do disco */
  function passo(p, f, vel, dt, corre, sem){
    f.fase += vel*dt*(corre ? 0.13 : 0.115);
    const amp = Math.min(1, vel/48) * (corre ? 1.0 : 0.62);
    for(const k of [0,1]){
      const ph = f.fase + k*Math.PI;
      p.coxa[k] = Math.sin(ph)*amp;
      p.joelho[k] = Math.max(0, -Math.cos(ph))*amp*(corre ? 1.3 : 0.9);
      p.ombro[k] = -Math.sin(ph)*amp*(corre ? 1.0 : 0.7);
      p.cotovelo[k] = corre ? -1.5 : -0.35 - amp*0.4;
    }
    p.gira = Math.sin(f.fase)*0.08*amp;
    p.y = Math.abs(Math.cos(f.fase))*amp*1.2 - amp*0.8;
    if(corre) p.inclina = 0.3;
    if(amp < 0.05){
      /* parado: respira e muda o peso de perna */
      p.inclina += Math.sin(sem*0.3 + f.fase*0.0 + performance.now()/900)*0.02;
      p.tomba = Math.sin(performance.now()/1700 + sem)*0.02;
    }
  }

  /* socar: jab e direto alternando, com giro de tronco e o outro braço
     de guarda. O relógio do soco só anda enquanto `golpe` está aceso. */
  function socar(p, f, dt){
    f.soco += dt*5.5;
    const ciclo = Math.floor(f.soco), k = f.soco - ciclo;
    const bate = ciclo % 2, guarda = 1 - bate;
    const ext = k < 0.45 ? suave(k/0.45) : 1 - suave((k-0.45)/0.55);
    p.ombro[bate] = -0.9 - 0.75*ext;
    p.cotovelo[bate] = -2.0 + 1.85*ext;
    p.abre[bate] = 0.15;
    p.ombro[guarda] = -1.05; p.cotovelo[guarda] = -2.3; p.abre[guarda] = 0.25;
    p.gira = (bate ? -1 : 1) * 0.35 * ext;
    p.inclina = 0.12 + 0.1*ext;
    p.coxa = [0.35, -0.35]; p.joelho = [0.3, 0.3]; p.y = -1.5;
    p.cabecaX = 0.12;
  }

  /* levar pancada: cobre com os dois braços ou encolhe, com recuo */
  function apanhar(p, f, k){
    const r = suave(k);          // 1 no instante da pancada, 0 no fim
    if(f.cobre){
      p.ombro = [-1.35, -1.35]; p.cotovelo = [-2.4, -2.4]; p.abre = [0.35, 0.35];
      p.cabecaX = 0.35*r;
      p.inclina = -0.22*r + 0.1;
    } else {
      p.ombro = [-0.6, -1.5]; p.cotovelo = [-1.2, -2.5]; p.abre = [0.6, 0.2];
      p.cabecaY = 0.7*r; p.cabecaX = 0.25*r;
      p.inclina = -0.3*r; p.tomba = 0.18*r;
    }
    p.joelho = [0.35*r, 0.35*r]; p.y -= 2*r;
  }

  /* cambalear: o corpo pende, os braços abrem, as pernas não obedecem */
  function cambalear(p, f, t){
    p.tomba = Math.sin(t*9 + f.fase)*0.3;
    p.inclina = 0.18 + Math.sin(t*5.3)*0.08;
    p.gira = Math.sin(t*3.7)*0.2;
    p.abre = [0.8, 0.8]; p.ombro = [0.3, 0.3]; p.cotovelo = [-0.6, -0.6];
    p.joelho = [0.55, 0.55]; p.coxa = [-0.25 + Math.sin(t*6)*0.2, -0.25 - Math.sin(t*6)*0.2];
    p.y = -3; p.cabecaX = 0.4; p.cabecaY = Math.sin(t*4)*0.4;
  }

  /* arremessar: no instante do lançamento o braço já está lá em cima e
     à frente (a pedra já saiu); o que se vê é o acompanhamento — o braço
     descendo, o tronco indo junto e a perna de trás vindo pra frente */
  function arremessar(p, f, arr){
    const k = 1 - arr.t/0.55;                 // 0 no lançamento, 1 no fim
    const desce = suave(k/0.55);
    p.ombro[1] = mistura(-2.4, -0.5, desce);
    p.cotovelo[1] = mistura(-0.15, -0.6, desce);
    p.abre[1] = 0.3;
    p.ombro[0] = mistura(-0.9, 0.1, desce); p.cotovelo[0] = -0.8; p.abre[0] = 0.4;
    p.inclina = mistura(-0.1, 0.32, desce) * (arr.tipo==='bomba' ? 1.2 : 1);
    p.gira = mistura(0.45, -0.25, desce);
    p.coxa = [mistura(0.4,-0.35,desce), mistura(-0.4,0.3,desce)];
    p.joelho = [0.3, 0.4]; p.y = -1;
    p.cabecaX = mistura(-0.25, 0.15, desce);
  }

  /* de guarda: hostil e parado, os punhos meio erguidos e o peso na
     frente — não é zumbi, é gente esperando o outro chegar */
  function guarda(p, f, t){
    const b = Math.sin(t*2.6 + f.fase)*0.06;
    p.ombro = [-0.6+b, -0.75-b]; p.cotovelo = [-1.9, -2.1]; p.abre = [0.2, 0.15];
    p.inclina = 0.08; p.coxa = [0.25, -0.25]; p.joelho = [0.25, 0.25]; p.y = -1;
    p.gira = 0.12;
  }

  /* correr fugindo: passo largo, tronco pra frente e o olhar por cima
     do ombro, de vez em quando. Agarrado, tropeça. */
  function fugir(p, f, d, t, dt){
    const quer = Math.sin(t*1.1 + f.fase*0.7) > 0.55 ? 1 : 0;
    f.olhaTras += (quer - f.olhaTras)*Math.min(1, dt*6);
    p.cabecaY = 0.95*f.olhaTras; p.cabecaX = -0.1;
    p.inclina = 0.32;
    if(d.agarrado > 0){
      const a = Math.min(1, d.agarrado/1.2);
      p.inclina = 0.32 + 0.35*a; p.tomba = Math.sin(t*18)*0.15*a;
      p.abre = [0.5*a, 0.5*a]; p.ombro[0] = -1.2*a; p.cotovelo[0] = -0.6;
      p.y -= 3*a; p.joelho[0] += 0.5*a;
    }
  }

  /* cair: o joelho cede primeiro, depois o corpo vai, e fica no chão de
     bruços ou de costas — decidido por semente, então a mesma queda
     não muda de lado de um quadro pro outro */
  function cair(p, f, dt){
    if(f.queda==null) f.queda = f.viuVivo ? 0 : 1;   // já estava no chão: sem tombo
    else if(f.queda < 1) f.queda = Math.min(1, f.queda + dt/0.62);
    const k = f.queda, frente = f.caiDeFrente;
    const k1 = suave(k/0.42), k2 = suave((k-0.28)/0.72);
    const quique = Math.sin(Math.min(1,k2)*Math.PI)*0.08;
    p.joelho = [1.15*k1, 0.9*k1]; p.coxa = [-0.55*k1, -0.3*k1];
    p.y = -7*k1*(1-k2);
    p.rotRaiz = (frente ? 1 : -1) * (Math.PI/2) * (k2 + quique);
    p.altRaiz = 4.5*k2;
    p.inclina = (frente ? 0.45 : -0.25)*k1*(1-k2);
    p.cabecaX = (frente ? 0.4 : -0.35)*k1;
    if(frente){
      p.ombro = [mistura(-0.8,-2.5,k2), mistura(-0.6,-1.6,k2)];
      p.cotovelo = [-0.3, mistura(-0.8,-1.4,k2)]; p.abre = [0.45, 0.25];
      p.coxa = [mistura(-0.55*k1, -0.15, k2), mistura(-0.3*k1, 0.35, k2)];
      p.joelho = [mistura(1.15*k1, 0.2, k2), mistura(0.9*k1, 0.9, k2)];
    } else {
      p.ombro = [mistura(-0.8, 0.25, k2), mistura(-0.6, -0.2, k2)];
      p.cotovelo = [-0.4, -0.9]; p.abre = [mistura(0.2,1.3,k2), mistura(0.2,0.9,k2)];
      p.coxa = [mistura(-0.55*k1, -0.2, k2), mistura(-0.3*k1, -0.7, k2)];
      p.joelho = [mistura(1.15*k1, 0.15, k2), mistura(0.9*k1, 1.0, k2)];
    }
  }

  /* preso: sentado no chão com as mãos pra trás */
  function sentar(p){
    p.y = -19; p.coxa = [-1.4, -1.35]; p.joelho = [0.75, 0.55];
    p.ombro = [0.75, 0.75]; p.cotovelo = [-0.35, -0.35]; p.abre = [0.3, 0.3];
    p.inclina = 0.18; p.cabecaX = 0.4;
  }

  function boneco(d, i, J, dt){
    if(d.entrou || d.sumiu) return;
    if(!vistaDeCima && cam.modo===0 && d.vivo && !d.lider && Math.hypot(d.x-cam.olho[0], d.y-cam.olho[2]) < 30) return;
    const f = fichaDe(d, i);
    if(d.lider && !f.bandana && !f.bone) f.bandana = f.faixa;
    const p = poseNeutra(); p.escala = f.escala*escalaGlobal;
    const t = J.t;
    const tx = d.tremor ? (Math.random()-0.5)*d.tremor*0.6 : 0;
    const tz = d.tremor ? (Math.random()-0.5)*d.tremor*0.6 : 0;
    const o = {x:d.x+tx, z:d.y+tz, yaw:f.yaw};

    if(!d.vivo){
      if(d.preso){ sentar(p); f.queda = null; }
      else cair(p, f, dt);
      corpo(din, o, p, f);
      return;
    }
    f.viuVivo = true; f.queda = null;

    const vel = medirVelocidade(f, d.x, d.y, dt);
    const corre = !!(d.fugindo || d._cacando);
    /* pra onde olha é o combate que diz (`rumo`): pra onde anda, pra quem
       bate, pra quem bateu por trás. Aqui só se suaviza. Jogando, olha
       pra onde a pedra foi. */
    if(typeof d.rumo === 'number') f.yaw = girar(f.yaw, d.rumo, Math.min(1, dt*14));
    else if(vel > 4) f.yaw = girar(f.yaw, Math.atan2(f.vx, f.vz), Math.min(1, dt*10));
    if(d.arremesso && d.arremesso.t > 0.4){
      const pr = J.projeteis.find(q=>!q.morto && q.t < 0.2 && Math.hypot(q.x-d.x, q.y-d.y) < 60);
      if(pr) f.yaw = girar(f.yaw, Math.atan2(pr.vx, pr.vy), Math.min(1, dt*18));
    }
    o.yaw = f.yaw;

    passo(p, f, vel, dt, corre, hash(f.sem)%100);
    if(corre && d.fugindo) fugir(p, f, d, t, dt);

    if(d.atordoado > 0)                       cambalear(p, f, t);
    else if(d.apanhou > 0)                    apanhar(p, f, d.apanhou/0.5);
    else if(d.arremesso)                      arremessar(p, f, d.arremesso);
    else if(d.golpe > 0)                      socar(p, f, dt);
    else if(d.hostil > 0 && vel < 6 && !corre) guarda(p, f, t);
    else f.soco = 0;

    corpo(din, o, p, f);
    planos.elipse(d.x, 0.5, d.y, 8.5*p.escala, 6*p.escala, [0,0,0,0.35], 8);
    if(d.lider && !vistaDeCima) planos.anel(d.x, 0.7, d.y, 12, 15, [0.88,0.69,0.25,0.85], 16);
  }

  function policial(pm, i, J, dt){
    if(!pm._t3) pm._t3 = {yaw:frac('pm|'+i)*6.28, fase:frac('pm|'+i+'f')*6.28, soco:0, olhaTras:0,
      pele:cor(PELE[dado('pmp'+i,PELE.length)]), calca:cor('#1b2620'), cabelo:cor('#111'),
      camisa:cor('#233a2c'), faixa:cor('#2d4a38'), bone:true, corBone:cor('#1c2a22'), escala:1.05,
      viuVivo:false, queda:null, caiDeFrente:frac('pmq'+i)<0.5, cobre:true, sem:'pm'+i,
      px:null, pz:null, vx:0, vz:0};
    const f = pm._t3;
    const p = poseNeutra(); p.escala = f.escala*escalaGlobal;
    const o = {x:pm.x, z:pm.y, yaw:f.yaw};
    if(!pm.vivo){ cair(p, f, dt); corpo(din, o, p, f); return; }
    f.viuVivo = true; f.queda = null;
    const vel = medirVelocidade(f, pm.x, pm.y, dt);
    if(vel > 4) f.yaw = girar(f.yaw, Math.atan2(f.vx, f.vz), Math.min(1, dt*8));
    o.yaw = f.yaw;
    passo(p, f, vel, dt, false, i);
    p.cassetete = true;
    if(pm.carga){
      p.escudo = true;
      p.ombro[0] = -1.2; p.cotovelo[0] = -1.4; p.abre[0] = 0.1;
      p.inclina = 0.14;
    }
    /* o cassetete desce: de trás da cabeça até a frente, em 0,3 s */
    if(pm.golpe > 0){
      const k = 1 - pm.golpe/0.3;
      const desce = suave(k/0.6);
      p.ombro[1] = mistura(-2.6, -0.9, desce);
      p.cotovelo[1] = mistura(-0.9, -0.3, desce);
      p.abre[1] = 0.25;
      p.inclina = mistura(-0.1, 0.3, desce); p.gira = mistura(0.3, -0.2, desce);
      p.coxa = [0.3, -0.3]; p.joelho = [0.3, 0.35]; p.y = -1;
    } else if(pm.cooldown > 1.2 && !pm.carga){
      p.ombro[1] = -0.7; p.cotovelo[1] = -1.8;
    }
    corpo(din, o, p, f);
    planos.elipse(pm.x, 0.5, pm.y, 9*p.escala, 6.5*p.escala, [0,0,0,0.35], 8);
  }

  /* =======================================================
     PEDRA, BOMBA E O QUE SOBRA DELAS
     Fragmento, poeira e fumaça são partículas só de tela: nascem
     de um projétil que estourou ou que sumiu, vivem um segundo e
     não voltam pro combate.
     ======================================================= */
  const particulas = [];
  function soltar(x, y, z, o){
    particulas.push(Object.assign({x, y, z, vx:0, vy:0, vz:0, vida:o.dur, dur:o.dur,
                                   tam:4, cresce:0, tipo:'caco', cor:[0.3,0.3,0.3]}, o));
  }
  function explodir(x, z){
    for(let i=0;i<16;i++){
      const a = Math.random()*Math.PI*2, v = 80+Math.random()*160;
      soltar(x, 6, z, {vx:Math.cos(a)*v, vy:70+Math.random()*180, vz:Math.sin(a)*v,
        dur:0.7+Math.random()*0.4, tam:2+Math.random()*3,
        cor:Math.random()<0.4 ? cor('#e07a2a') : cor('#2b2320')});
    }
    for(let i=0;i<8;i++){
      const a = Math.random()*Math.PI*2, v = 10+Math.random()*30;
      soltar(x+Math.cos(a)*8, 8+Math.random()*10, z+Math.sin(a)*8, {tipo:'fumo',
        vx:Math.cos(a)*v, vy:22+Math.random()*26, vz:Math.sin(a)*v,
        dur:1.2+Math.random()*0.5, tam:10+Math.random()*8, cresce:26,
        cor:i<3 ? [0.9,0.55,0.25] : [0.32,0.3,0.3]});
    }
    soltar(x, 1.2, z, {tipo:'clarao', dur:0.14, tam:42, cor:[1,0.8,0.45]});
    const dl = Math.hypot(x-cam.alvo[0], z-cam.alvo[2]);
    cam.tremor = Math.max(cam.tremor, 9*U.limitar(1-dl/420, 0, 1));
  }
  function poeira(x, z, forte){
    const n = forte ? 5 : 3;
    for(let i=0;i<n;i++){
      const a = Math.random()*Math.PI*2, v = 6+Math.random()*14;
      soltar(x, 3, z, {tipo:'fumo', vx:Math.cos(a)*v, vy:14+Math.random()*10, vz:Math.sin(a)*v,
        dur:0.45+Math.random()*0.2, tam:4+Math.random()*3, cresce:14, cor:[0.55,0.48,0.38]});
    }
  }
  function atualizarParticulas(dt){
    for(const q of particulas){
      q.vida -= dt;
      q.x += q.vx*dt; q.y += q.vy*dt; q.z += q.vz*dt;
      if(q.tipo==='caco'){
        q.vy -= 420*dt;
        if(q.y < q.tam/2){ q.y = q.tam/2; q.vy *= -0.35; q.vx *= 0.6; q.vz *= 0.6; }
      } else if(q.tipo==='fumo'){
        q.tam += q.cresce*dt; q.vx *= (1-dt*1.5); q.vz *= (1-dt*1.5);
      }
    }
    for(let i=particulas.length-1;i>=0;i--) if(particulas[i].vida<=0) particulas.splice(i,1);
  }
  function desenharParticulas(){
    const rx=-cam.fwd[2], rz=cam.fwd[0];     // o lado da câmera, pro cartaz da fumaça
    for(const q of particulas){
      const k = Math.max(0, q.vida/q.dur);
      if(q.tipo==='caco'){
        const M = M4.mul(M4.trans(q.x, q.y, q.z), M4.mul(M4.rotY(q.vida*11), M4.rotX(q.vida*7)));
        din.caixaM(M, q.tam, q.tam, q.tam, q.cor);
      } else if(q.tipo==='fumo'){
        const h = q.tam, c = [q.cor[0], q.cor[1], q.cor[2], 0.38*k];
        if(vistaDeCima){ planos.elipse(q.x, q.y, q.z, h, h*0.85, c, 8); continue; }
        const a=[q.x-rx*h, q.y-h*0.8, q.z-rz*h], b=[q.x+rx*h, q.y-h*0.8, q.z+rz*h];
        const cc=[q.x+rx*h, q.y+h*0.8, q.z+rz*h], d=[q.x-rx*h, q.y+h*0.8, q.z-rz*h];
        planos.v(...a,c); planos.v(...b,c); planos.v(...cc,c);
        planos.v(...a,c); planos.v(...cc,c); planos.v(...d,c);
      } else if(q.tipo==='clarao'){
        planos.elipse(q.x, q.y, q.z, q.tam*(1.4-k*0.4), q.tam*(1.4-k*0.4), [q.cor[0],q.cor[1],q.cor[2],0.85*k], 12);
      }
    }
  }

  /* os projéteis do combate somem no quadro em que batem; pra soltar a
     poeira no lugar certo, guarda-se onde cada um estava */
  const vistos = new Map();
  function projeteis(J){
    const agora = new Set();
    for(const p of J.projeteis){
      agora.add(p);
      let v = vistos.get(p);
      if(!v){ v = {tipo:p.tipo, ultimoFumo:0, explodiu:false}; vistos.set(p, v); }
      if(p.noChao){
        /* no chão com o pavio aceso: o raio de dano aparece pra todo
           mundo e a faísca pisca mais rápido perto do estouro */
        const k = 1 - (p.explodeEm - p.t)/(p.pavio||1);
        v.x = p.x; v.y = p.y; v.t = p.t;
        const raio = (TO.diaJogo.combate && TO.diaJogo.combate.RAIO_BOMBA) || 92;
        const M = M4.trans(p.x, 4.5, p.y);
        din.caixaM(M, 9, 9, 9, cor('#c8562f'));
        const pisca = Math.sin(p.t*(30+k*70))>0 ? 3 : 1.2;
        din.caixaM(M, pisca, pisca, pisca, cor('#ffd35a'), 2.5, 6.5, 0);
        if(p.t - v.ultimoFumo > 0.07){
          v.ultimoFumo = p.t;
          soltar(p.x+2.5, 12, p.y, {tipo:'fumo', vy:10, dur:0.5, tam:2, cresce:8, cor:[0.55,0.55,0.55]});
        }
        planos.anel(p.x, 0.7, p.y, raio-2, raio+1, [0.9,0.3,0.15,0.25+0.45*k], 32);
        planos.elipse(p.x, 0.45, p.y, 6, 4, [0,0,0,0.28], 6);
        continue;
      }
      if(!p.morto){
        const alt = Math.sin((p.t/p.dur)*Math.PI)*36 + 8;
        v.x = p.x; v.y = p.y; v.t = p.t;
        const r = p.tipo==='pedra' ? 3.5 : 4.5;
        const M = M4.mul(M4.trans(p.x, alt, p.y), M4.mul(M4.rotY(p.t*9), M4.rotX(p.t*7)));
        din.caixaM(M, r*2, r*2, r*2, p.tipo==='pedra' ? cor('#8d8880') : cor('#c8562f'));
        if(p.tipo==='bomba'){
          /* o pavio aceso e o rastro de fumaça */
          const pisca = 1.5 + Math.abs(Math.sin(p.t*40))*1.5;
          din.caixaM(M, pisca, pisca, pisca, cor('#ffd35a'), 0, r+1.5, 0);
          if(p.t - v.ultimoFumo > 0.05){
            v.ultimoFumo = p.t;
            soltar(p.x, alt, p.y, {tipo:'fumo', vy:8, dur:0.5, tam:2.5, cresce:9, cor:[0.5,0.5,0.5]});
          }
        }
        planos.elipse(p.x, 0.45, p.y, 4, 3, [0,0,0,0.28], 6);
        continue;
      }
      if(p.explosao!==undefined){
        if(!v.explodiu){ v.explodiu = true; explodir(p.x, p.y); poeira(p.x, p.y, true); }
        const k = p.explosao/0.45;
        planos.anel(p.x, 0.8, p.y, 18+k*70, 26+k*76, [0.95,0.55,0.2,1-k], 18);
        planos.elipse(p.x, 0.6, p.y, 20+k*40, 20+k*40, [0.2,0.12,0.08,0.5*(1-k)], 10);
      }
    }
    for(const [p,v] of vistos) if(!agora.has(p)){
      vistos.delete(p);
      if(v.tipo==='pedra' && v.x!==undefined && v.t > 0.07) poeira(v.x, v.y, false);
    }
  }

  function gradesDeFerro(mods){
    for(const g of mods || []){
      const ang = Math.atan2(g.ux, g.uy);
      const M = M4.mul(M4.trans(g.x, 0, g.y), M4.rotY(ang));
      if(g.tipo==='fila'){ din.caixaM(M, g.esp*2, 30, g.meia*2, cor('#9aa0a6'), 0, 15, 0); continue; }
      if(g.hp<=0){ din.caixaM(M, g.esp*2+6, 3, g.meia*2, cor('#6a5a30'), 4, 1.5, 0); continue; }
      const p=g.hp/g.hpMax;
      const c = p>0.6 ? cor('#e8b53c') : p>0.3 ? cor('#c08a2a') : cor('#8a5f22');
      din.caixaM(M, g.esp*2, 30, g.meia*2, c, 0, 15, 0);
      din.caixaM(M, g.esp*2+2, 3, g.meia*2+1, tom(c,0.8), 0, 30, 0);
    }
  }

  /* =======================================================
     CÂMERA — atrás do líder, do jeito dos jogos de rua
     ======================================================= */
  const MODOS = [
    {nome:'ombro', dist:170, pitch:0.46},
    {nome:'alta',  dist:300, pitch:0.66},
    {nome:'drone', dist:560, pitch:1.10}
  ];
  const cam = {
    yaw:Math.PI/2, pitch:0.46, dist:170, modo:0, zoom:1,
    alvo:[768, 0, 512], olho:[600,60,512], PV:null, P:null, V:null,
    _J:null,                 // a noite pra que a câmera já foi enquadrada
    tremor:0,                // a bomba perto sacode a lente
    arrastando:false, ultimoArrasto:-9, fwd:[1,0,0]
  };
  const FOV = 62*Math.PI/180;

  function alvoDaCamera(J){
    const l = J.discos.find(d=>d.lider && d.vivo);
    /* o rumo do líder vem da velocidade medida (ver `medirVelocidade`) */
    if(l) return {x:l.x, z:l.y, vx:l._t3 ? l._t3.vx : 0, vy:l._t3 ? l._t3.vz : 0, lider:true};
    /* sem líder de pé, o centro de quem sobrou do nosso lado */
    const meu = J.discos.filter(d=>d.doJogador && d.vivo);
    if(meu.length){
      let x=0,z=0; for(const d of meu){ x+=d.x; z+=d.y; }
      return {x:x/meu.length, z:z/meu.length, vx:0, vy:0};
    }
    const l2 = J.discos.find(d=>d.lider);
    if(l2) return {x:l2.x, z:l2.y, vx:0, vy:0};
    return {x:W/2, z:H/2, vx:0, vy:0};
  }

  function atualizarCamera(J, dt, agora){
    const a = alvoDaCamera(J);
    /* NOITE NOVA: A CÂMERA JÁ NASCE ENQUADRADA.
       O alvo começava no centro da tela e ia sendo perseguido, então a
       cena abria com a câmera deslizando meia quadra até achar o líder —
       e, no primeiro segundo, o bonde do jogador ficava atrás dela.
       Aqui ela cola no líder de uma vez e vira pro lado de quem está
       do outro lado da rua: quem abre a cena vê o próprio bonde na
       frente e o rival ao fundo, que é o que a briga é. */
    if(cam._J !== J){
      cam._J = J;
      cam.alvo[0] = a.x; cam.alvo[2] = a.z;
      const l = J.discos.find(d=>d.lider) || {lado:'mandante'};
      let ex=0, ez=0, n=0;
      for(const d of J.discos) if(d.vivo && d.lado !== l.lado){ ex+=d.x; ez+=d.y; n++; }
      if(n) cam.yaw = Math.atan2(ex/n - a.x, ez/n - a.z);
      cam.dist = MODOS[cam.modo].dist*cam.zoom;
      cam.pitch = MODOS[cam.modo].pitch;
    }
    const k = Math.min(1, dt*6);
    cam.alvo[0] += (a.x - cam.alvo[0])*k;
    cam.alvo[2] += (a.z - cam.alvo[2])*k;
    /* a câmera acompanha o rumo do líder, devagar, se ninguém arrastou */
    const vel = Math.hypot(a.vx||0, a.vy||0);
    if(!cam.arrastando && agora - cam.ultimoArrasto > 2.5 && vel > 8 && cam.modo < 2)
      cam.yaw = girar(cam.yaw, Math.atan2(a.vx, a.vy), Math.min(1, dt*1.4));
    const modo = MODOS[cam.modo];
    const dAlvo = modo.dist*cam.zoom, pAlvo = modo.pitch;
    cam.dist += (dAlvo - cam.dist)*Math.min(1, dt*5);
    cam.pitch += (pAlvo - cam.pitch)*Math.min(1, dt*5);

    const fx=Math.sin(cam.yaw), fz=Math.cos(cam.yaw);
    cam.fwd=[fx,0,fz];
    let dist = cam.dist;
    const olhoDe = (dd)=>[cam.alvo[0]-fx*Math.cos(cam.pitch)*dd, 22+Math.sin(cam.pitch)*dd, cam.alvo[2]-fz*Math.cos(cam.pitch)*dd];
    /* parede no caminho encurta a distância: a câmera não entra em casa
       nem passa raspando no telhado — quando o líder encosta numa
       fachada, ela vem pra frente da fachada em vez de olhar por dentro */
    if(cam.modo < 2) for(let t=0.15; t<=1; t+=0.05){
      const o = olhoDe(dist*t);
      if(alturaEm(o[0], o[2]) + 30 > o[1]){ dist = Math.max(40, dist*t - 12); break; }
    }
    cam.olho = olhoDe(dist);
    if(cam.tremor > 0){
      cam.olho[0] += (Math.random()-0.5)*cam.tremor;
      cam.olho[1] += (Math.random()-0.5)*cam.tremor*0.6;
      cam.olho[2] += (Math.random()-0.5)*cam.tremor;
      cam.tremor = Math.max(0, cam.tremor - dt*22);
    }
    const asp = cv.width/cv.height;
    cam.P = M4.persp(FOV, asp, 10, 7000);
    cam.V = M4.olhar(cam.olho, [cam.alvo[0], cam.alvo[1]+26, cam.alvo[2]], [0,1,0]);
    cam.PV = M4.mul(cam.P, cam.V);
  }

  function projetar(x,y,z){
    const m=cam.PV;
    const cx=m[0]*x+m[4]*y+m[8]*z+m[12];
    const cy=m[1]*x+m[5]*y+m[9]*z+m[13];
    const cw=m[3]*x+m[7]*y+m[11]*z+m[15];
    if(cw<=1) return null;
    return {x:(cx/cw*0.5+0.5)*sobre.width, y:(1-(cy/cw*0.5+0.5))*sobre.height, w:cw,
            k: sobre.height/(2*Math.tan(FOV/2))/cw};
  }

  /* ---------- entrada da câmera ---------- */
  function ligarCamera(){
    let px=0, py=0;
    cv.addEventListener('pointerdown', e=>{
      if(e.button!==0 && e.button!==2) return;
      cam.arrastando=true; px=e.clientX; py=e.clientY;
      try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    });
    cv.addEventListener('pointermove', e=>{
      if(!cam.arrastando) return;
      cam.yaw -= (e.clientX-px)*0.006;
      MODOS[cam.modo].pitch = U.limitar(MODOS[cam.modo].pitch + (e.clientY-py)*0.004, 0.12, 1.35);
      px=e.clientX; py=e.clientY;
      cam.ultimoArrasto = performance.now()/1000;
    });
    const solta=()=>{ if(cam.arrastando){ cam.arrastando=false; cam.ultimoArrasto=performance.now()/1000; } };
    cv.addEventListener('pointerup', solta);
    cv.addEventListener('pointercancel', solta);
    cv.addEventListener('contextmenu', e=>e.preventDefault());
    cv.addEventListener('wheel', e=>{
      e.preventDefault();
      cam.zoom = U.limitar(cam.zoom*Math.pow(1.1, e.deltaY/100), 0.7, 2.2);
    }, {passive:false});
  }
  function trocarCamera(){
    cam.modo = (cam.modo+1) % MODOS.length;
    return MODOS[cam.modo].nome;
  }

  /* WASD relativo à câmera: W é pra onde a câmera olha */
  function vetorDoTeclado(t){
    let dx=0, dy=0;
    if(t['a']||t['arrowleft'])  dx--;
    if(t['d']||t['arrowright']) dx++;
    if(t['w']||t['arrowup'])    dy++;
    if(t['s']||t['arrowdown'])  dy--;
    if(!dx && !dy) return null;
    const fx=Math.sin(cam.yaw), fz=Math.cos(cam.yaw);
    const rx=-fz, rz=fx;
    const x=fx*dy + rx*dx, y=fz*dy + rz*dx;
    const m=Math.hypot(x,y)||1;
    return {x:x/m, y:y/m};
  }

  /* =======================================================
     A CAMADA DE CIMA — nome, vida, preso, radar
     ======================================================= */
  function sobrepor(J){
    const c = ctx2;
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,sobre.width,sobre.height);
    c.font='600 11px "IBM Plex Mono", monospace'; c.textAlign='center';
    for(const d of J.discos){
      if(d.entrou || d.sumiu) continue;
      const p = projetar(d.x, d.vivo ? 52 : (d.preso ? 34 : 10), d.y);
      if(!p || p.x<-40 || p.x>sobre.width+40 || p.y<-40 || p.y>sobre.height+40) continue;
      if(!d.vivo){
        if(d.preso && p.w < 900){
          c.fillStyle='#5fa87d'; c.font='600 10px "IBM Plex Mono", monospace';
          c.fillText('PRESO', p.x, p.y);
        }
        continue;
      }
      if(d.lider){
        c.font='700 13px "IBM Plex Mono", monospace';
        c.fillStyle='rgba(0,0,0,.8)'; c.fillText(d.nome, p.x+1, p.y-9);
        c.fillStyle='#e0b040'; c.fillText(d.nome, p.x, p.y-10);
      }
      if(d.hp < d.hpMax && p.w < 1100){
        const w=Math.max(10, 22*p.k), pr=Math.max(0, d.hp/d.hpMax);
        c.fillStyle='rgba(0,0,0,.6)'; c.fillRect(p.x-w/2, p.y-4, w, 3);
        c.fillStyle=pr>.5?'#6a9c4a':pr>.25?'#c8a03c':'#b6432f'; c.fillRect(p.x-w/2, p.y-4, w*pr, 3);
      }
    }
    radar(J);
    /* o nome do modo de câmera, discreto */
    c.font='600 9px "IBM Plex Mono", monospace'; c.textAlign='right';
    c.fillStyle='rgba(233,233,233,.55)';
    c.fillText('CÂMERA '+MODOS[cam.modo].nome.toUpperCase()+' · C troca · arrastar gira · roda aproxima', sobre.width-12, sobre.height-10);
  }

  function radar(J){
    /* no canto de cima, à esquerda, embaixo da barra da PM: o de baixo é
       do pad de toque, que mora ali em qualquer largura na cena 3D */
    const dpr=sobre.width/Math.max(1,(cv.clientWidth||sobre.width));
    const c=ctx2, R=Math.round(58*dpr), cx=R+Math.round(14*dpr), cy=R+Math.round(58*dpr), alc=560, esc=R/alc;
    c.save();
    c.beginPath(); c.arc(cx,cy,R,0,Math.PI*2);
    c.fillStyle='rgba(14,14,13,.72)'; c.fill();
    c.lineWidth=1.5; c.strokeStyle='rgba(217,164,65,.6)'; c.stroke();
    c.clip();
    c.translate(cx,cy);
    c.rotate(-Math.atan2(cam.fwd[0], -cam.fwd[2]));   // pra frente é pra cima
    c.scale(esc,esc);
    c.translate(-cam.alvo[0], -cam.alvo[2]);
    /* pista e calçada, pra ler a rua */
    c.fillStyle='rgba(120,118,110,.35)'; c.fillRect(-1500,190,W+3000,H-380);
    c.fillStyle='rgba(60,60,66,.8)'; c.fillRect(-1500,330,W+3000,H-660);
    c.fillRect(0,-1500,210,H+3000); c.fillRect(W-210,-1500,210,H+3000);
    c.fillStyle='rgba(180,170,150,.55)';
    for(const b of cenaAtual.blocos||[]) if(b.tipo!=='carro') c.fillRect(b.x,b.y,b.w,b.h);
    for(const p of J.policiais) if(p.vivo){ c.fillStyle='#5fa87d'; c.beginPath(); c.arc(p.x,p.y,7,0,7); c.fill(); }
    for(const d of J.discos){
      if(!d.vivo) continue;
      c.fillStyle = d.lider ? '#e0b040' : (d.cor || corLado(d.lado,false));
      c.beginPath(); c.arc(d.x,d.y,d.lider?9:6,0,7); c.fill();
    }
    c.restore();
    c.beginPath(); c.moveTo(cx,cy-9); c.lineTo(cx-5,cy+4); c.lineTo(cx+5,cy+4); c.closePath();
    c.fillStyle='rgba(233,233,233,.85)'; c.fill();
  }

  /* =======================================================
     O QUADRO
     ======================================================= */
  function ajustarTamanho(){
    const dpr = Math.min(1.5, window.devicePixelRatio||1);
    const w = Math.max(320, Math.round((cv.clientWidth||cv.width)*dpr));
    const h = Math.max(200, Math.round((cv.clientHeight||cv.height)*dpr));
    if(cv.width!==w || cv.height!==h){ cv.width=w; cv.height=h; }
    if(sobre && (sobre.width!==w || sobre.height!==h)){ sobre.width=w; sobre.height=h; }
  }

  const LUZ = {
    dir:(()=>{ const v=[0.55,0.62,-0.42], l=Math.hypot(...v); return [v[0]/l,v[1]/l,v[2]/l]; })(),
    fog:[900, 3400], corFog:cor('#d9b48c'), cam:[0,0,0]
  };
  const CEU = {cima:cor('#4f7fb5'), horizonte:cor('#e8c49c')};

  let vistaDeCima = false, escalaGlobal = 1;
  function desenhar(J, opc){
    if(!gl || !J) return;
    opc = opc||{};
    vistaDeCima = false;
    ajustarTamanho();
    if(A.D !== cenaAtual) levantar(A.D);
    const dt = Math.min(0.05, opc.dt || 0.016);
    const agora = performance.now()/1000;
    atualizarCamera(J, dt, agora);
    LUZ.cam = cam.olho;

    din.limpar(); planos.limpar();
    J.discos.forEach((d,i)=>boneco(d,i,J,dt));
    J.policiais.forEach((p,i)=>policial(p,i,J,dt));
    projeteis(J);
    atualizarParticulas(dt);
    desenharParticulas();
    gradesDeFerro(J.grades);

    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(CEU.horizonte[0],CEU.horizonte[1],CEU.horizonte[2],1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    /* céu */
    gl.depthMask(false);
    gl.useProgram(prog.ceu.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.ceu);
    gl.enableVertexAttribArray(prog.ceu.a.aPos); gl.vertexAttribPointer(prog.ceu.a.aPos,2,gl.FLOAT,false,0,0);
    gl.uniform3fv(prog.ceu.u.uCima, CEU.cima); gl.uniform3fv(prog.ceu.u.uHorizonte, CEU.horizonte);
    gl.uniform1f(prog.ceu.u.uAlt, cv.height*0.62);
    gl.drawArrays(gl.TRIANGLES,0,3);
    gl.depthMask(true);
    /* sólidos */
    desenharSolido(buf.estatico, nEst, cam.PV, LUZ);
    enviar(buf.dinamico, din);
    desenharSolido(buf.dinamico, din.vertices, cam.PV, LUZ);
    /* letreiros, placas e pichação */
    if(letreiros.length){
      const p=prog.tex;
      gl.useProgram(p.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf.tex);
      gl.enableVertexAttribArray(p.a.aPos); gl.vertexAttribPointer(p.a.aPos,3,gl.FLOAT,false,20,0);
      gl.enableVertexAttribArray(p.a.aUV);  gl.vertexAttribPointer(p.a.aUV,2,gl.FLOAT,false,20,12);
      gl.uniformMatrix4fv(p.u.uPV,false,cam.PV);
      gl.uniform3fv(p.u.uCam, LUZ.cam); gl.uniform2fv(p.u.uFog, LUZ.fog); gl.uniform3fv(p.u.uCorFog, LUZ.corFog);
      gl.activeTexture(gl.TEXTURE0); gl.uniform1i(p.u.uTex, 0);
      for(const l of letreiros){
        gl.bindTexture(gl.TEXTURE_2D, l.tex);
        gl.uniform1f(p.u.uLuz, l.luz);
        gl.bufferData(gl.ARRAY_BUFFER, l.d, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES,0,6);
      }
    }
    /* fios e varais */
    desenharSimples(buf.linhas, nLin, cam.PV, LUZ, gl.LINES);
    /* sombras e anéis, com transparência, por último */
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    enviar(buf.planos, planos);
    desenharSimples(buf.planos, planos.vertices, cam.PV, LUZ, gl.TRIANGLES);
    gl.depthMask(true); gl.disable(gl.BLEND);

    if(ctx2) sobrepor(J);
  }

  /* =======================================================
     A VISTA DE CIMA — o boneco no lugar do disco
     A cena 2D continua sendo pintada pelo canvas de sempre (foto ou
     desenho, malha, editor, nomes). Este canvas fica por cima dela,
     transparente, e desenha só o que era disco: gente, PM, pedra,
     bomba, sombra e fumaça, com uma câmera ortográfica olhando de
     cima, casada ponto a ponto com a transformação do canvas 2D
     (`escala` de ponte.ajustar). Os bonecos e as poses são os mesmos
     da cena 3D — vistos de cima viram cabeça, ombro e braço.
     ======================================================= */
  let escalaDeCima = 1.25;     // o boneco um pouco maior que o disco, pra ler
  const LUZ_CIMA = {
    dir:(()=>{ const v=[0.45,0.62,-0.62], l=Math.hypot(...v); return [v[0]/l,v[1]/l,v[2]/l]; })(),
    fog:[1e6, 2e6], corFog:[0,0,0], cam:[0,4000,0]
  };
  function desenharDeCima(J, opc){
    if(!gl || !J) return;
    vistaDeCima = true;
    ajustarTamanho();
    const dt = Math.min(0.05, opc.dt || 0.016);
    const e = opc.escala, cw = opc.cw, ch = opc.ch;
    /* ortográfica: x da cena → tela como o 2D faz; y da cena (z do
       mundo) desce a tela; a altura vira profundidade, pra quem está
       em pé cobrir quem está no chão */
    const m = new Float32Array(16);
    m[0] = 2*e.s/cw;  m[12] = 2*e.ox/cw - 1;
    m[9] = -2*e.s/ch; m[13] = 1 - 2*e.oy/ch;
    m[6] = -1/1200;   m[15] = 1;
    cam.PV = m; cam.fwd = [0,0,-1];
    escalaGlobal = escalaDeCima;

    din.limpar(); planos.limpar();
    J.discos.forEach((d,i)=>boneco(d,i,J,dt));
    J.policiais.forEach((p,i)=>policial(p,i,J,dt));
    projeteis(J);
    atualizarParticulas(dt);
    desenharParticulas();
    gradesDeFerro(J.grades);
    escalaGlobal = 1;

    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    enviar(buf.dinamico, din);
    desenharSolido(buf.dinamico, din.vertices, cam.PV, LUZ_CIMA);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    enviar(buf.planos, planos);
    desenharSimples(buf.planos, planos.vertices, cam.PV, LUZ_CIMA, gl.TRIANGLES);
    gl.depthMask(true); gl.disable(gl.BLEND);
  }

  /* =======================================================
     MONTAGEM
     ======================================================= */
  function montar(canvas, camadaDeCima){
    cv = canvas;
    if(gl && gl.canvas === cv) { sobre = camadaDeCima || sobre; ctx2 = sobre ? sobre.getContext('2d') : null; return true; }
    try{
      gl = cv.getContext('webgl', {antialias:true, alpha:true, premultipliedAlpha:true})
        || cv.getContext('experimental-webgl');
    }catch(_){ gl=null; }
    if(!gl) return false;
    try{ montarGL(); }catch(err){ console.error('tres: '+err.message); gl=null; return false; }
    /* contexto novo, recursos novos: textura e cena do anterior não valem */
    _tex.clear(); letreiros=[]; cenaAtual=null;
    sobre = camadaDeCima || null;
    ctx2 = sobre ? sobre.getContext('2d') : null;
    cenaAtual = null;
    ligarCamera();
    return true;
  }

  /* o editor da cena de cima pinta malha e arrasta marcador; enquanto ele
     está aberto os bonecos saem da frente, e este é o apagador */
  function limparDeCima(){
    if(!gl) return;
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  }

  return {montar, desenhar, desenharDeCima, limparDeCima, vetorDoTeclado, trocarCamera, MODOS,
          get escalaDeCima(){ return escalaDeCima; }, set escalaDeCima(v){ escalaDeCima=v; },
          get ativo(){ return !!gl; }, get cam(){ return cam; }};
})();
