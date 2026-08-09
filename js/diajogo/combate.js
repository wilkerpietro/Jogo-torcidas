/* =========================================================
   COMBATE — discos, formações, moral, debandada
   Roda sobre a cena de arredores.js: toda locomoção passa
   pela malha de caminhabilidade, ninguém anda em cima de casa.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

/* ---------- parâmetros de calibragem ---------- */
TO.diaJogo.P = {
  efetivo:34, efetivoRival:30,
  velocidade:78, dano:1.5,
  vidaGrade:420, forcaPM:21, debandada:45,
  atrasoCarga:7, tropaCarga:8, duracaoCarga:18, aguentaPM:9,
  cdPedra:2, cdBomba:2.5, alcancePedra:170, alcanceBomba:210,
  bombas:4, chancePaz:35
};

TO.diaJogo.combate = (function(){
  const U = TO.util;
  const A = TO.diaJogo.arredores;
  const P = TO.diaJogo.P;
  const D = A.D;

  const FORMACOES={
    bonde    :{nome:'Bonde',    tecla:'1', desc:'coluna'},
    muralha  :{nome:'Muralha',  tecla:'2', desc:'linha'},
    investida:{nome:'Investida',tecla:'3', desc:'cunha'},
    espalhar :{nome:'Espalhar', tecla:'4', desc:'aberto'}
  };

  const inimigos=(a,b)=> a!==b;

  /* =======================================================
     DISCO
     ======================================================= */
  class Disco{
    constructor(nome,lado,spawn,x,y,lider){
      this.nome=nome; this.lado=lado;
      this.spawn=spawn.id; this.entrada=spawn.entrada;
      this.escalao=spawn.rot;
      this.x=x; this.y=y; this.vx=0; this.vy=0;
      this.r=lider?9:7; this.lider=!!lider;
      this.forca  = lider?14+U.inteiro(0,4):5+U.inteiro(0,8);
      this.defesa = lider?12+U.inteiro(0,4):4+U.inteiro(0,8);
      this.hpMax  = lider?220:150; this.hp=this.hpMax;
      this.moral=12;
      this.caido=false; this.preso=false; this.fugindo=false; this.entrou=false;
      this.atordoado=0; this.tremor=0; this.golpe=0; this.hostil=0;
      this.membroId=null;   // costura com a gestão
    }
    get vivo(){return !this.caido && !this.preso && !this.entrou;}
  }

  class Policial{
    constructor(posto){
      this.postoX=posto.x; this.postoY=posto.y;
      this.x=posto.x; this.y=posto.y; this.vx=0; this.vy=0;
      this.r=9; this.hpMax=340; this.hp=this.hpMax;
      this.caido=false; this.giro=U.entre(0,7); this.cooldown=0; this.carga=false;
    }
    get vivo(){return !this.caido;}
  }

  class Projetil{
    constructor(x,y,ax,ay,tipo,lado){
      this.x=x; this.y=y; this.tipo=tipo; this.lado=lado;
      const dx=ax-x, dy=ay-y, d=Math.hypot(dx,dy)||1;
      const v = tipo==='pedra'?430:300;
      this.vx=dx/d*v; this.vy=dy/d*v;
      this.t=0; this.dur=d/v; this.morto=false;
    }
  }

  /* =======================================================
     ESTADO
     ======================================================= */
  function criarEstado(cfg){
    cfg=cfg||{};
    const J={
      t:0, fase:'ativo',
      discos:[], policiais:[], projeteis:[], grades:A.montarGrades(),
      form:'bonde', bombas:P.bombas,
      alerta:12, rompido:false, reforco:0,
      cargaEm:null, cargaAte:0, tropaVeio:false,
      sobPressao:0, fracPM:0, avisouPM:false,
      recuando:false, recuoVisitante:false,
      paz: U.rng()*100 < P.chancePaz, cdClima:0,
      cdPedraAte:0, cdBombaAte:0,
      entraram:{}, presos:0,
      caidos:{mandante:0, visitante:0}, presosPor:{mandante:0, visitante:0},
      total:{mandante:0, visitante:0},
      debandou:{}, log:[], aviso:null, avisoAte:0,
      versaoGrades:0
    };

    for(const g of J.grades){ g.hpMax=P.vidaGrade; g.hp=P.vidaGrade; }
    for(const p of D.pmPostos) J.policiais.push(new Policial(p));

    /* ---- povoa cada spawn ----
       Com escalação, cada disco É um membro: nome, força, defesa e moral
       vêm da ficha, e o id volta no fim pra virar Ferido ou Preso.
       Sem escalação (página solta da cena), gera gente fictícia. */
    const nomes=U.embaralhar(TO.dados.nomes ? TO.dados.nomes.apelidos : ['TROVÃO']);
    let iN=0;

    const spawnsMandante=D.spawns.filter(s=>s.lado==='mandante');
    const porSpawn=new Map(spawnsMandante.map(s=>[s.id,[]]));
    if(cfg.escalacao && cfg.escalacao.length){
      /* o mais rodado vai no bonde do jogador e vira o líder */
      const fila=[...cfg.escalacao].sort((a,b)=>b.xp-a.xp);
      const doJogador=spawnsMandante.find(s=>s.jogador)||spawnsMandante[0];
      porSpawn.get(doJogador.id).push(fila.shift());
      let k=0;
      for(const m of fila){
        const s=spawnsMandante[k++%spawnsMandante.length];
        porSpawn.get(s.id).push(m);
      }
    }

    for(const s of D.spawns){
      const escalados = porSpawn.get(s.id);
      const qtd = escalados && escalados.length ? escalados.length
                : Math.max(1, Math.round(
                    (s.lado==='mandante'?P.efetivo:P.efetivoRival)/contarSpawns(s.lado)));
      for(let i=0;i<qtd;i++){
        const p=A.pontoLivreMaisProximo(s.x+U.entre(-46,46), s.y+U.entre(-46,46), 7);
        const m = escalados && escalados[i];
        const lider = !!s.jogador && i===0;
        const d=new Disco(
          m ? m.apelido.toUpperCase() : (nomes[iN++%nomes.length]||'ZÉ').toUpperCase(),
          s.lado, s, p.x, p.y, lider);
        if(m){
          d.membroId=m.id;
          d.forca=m.forca; d.defesa=m.defesa; d.moral=m.moral;
          /* defesa vira resistência: quem apanha melhor cai depois */
          d.hpMax = 90 + m.defesa*7 + (lider?60:0);
          d.hp=d.hpMax;
          d.cargo=m.cargo;
        }
        d.doJogador = !!s.jogador;   // só o seu bonde obedece à formação
        J.discos.push(d);
      }
      J.total[s.lado]+=qtd;
    }
    return J;
  }
  function contarSpawns(lado){
    return D.spawns.filter(s=>s.lado===lado).length||1;
  }

  /* =======================================================
     PASSO
     ======================================================= */
  function passo(J,dt,teclas,podeControlar){
    if(J.fase!=='ativo') return;
    J.t+=dt;
    moverLider(J,dt,teclas,podeControlar);
    moverDiscos(J,dt);
    moverPoliciais(J,dt);
    contatos(J,dt);
    moverProjeteis(J,dt);
    medirClima(J,dt);
    passoCarga(J,dt);
    pressaoSobreMim(J,dt);
    iaRecuo(J);
    separar(J);
    checarDebandada(J);
  }

  function logar(J,txt,cor){
    J.log.unshift({t:J.t, txt, cor:cor||''});
    if(J.log.length>90) J.log.pop();
  }
  function aviso(J,txt,cor){ J.aviso={txt,cor}; J.avisoAte=J.t+1.7; }

  const nivelMoral = m => m<5?0.6 : m<10?0.8 : m<15?1.0 : 1.2;

  /* ---------- líder ---------- */
  function moverLider(J,dt,teclas,podeControlar){
    const l=J.discos.find(d=>d.lider&&d.vivo);
    if(!l||l.fugindo||!podeControlar) return;
    let dx=0,dy=0;
    if(teclas['a']||teclas['arrowleft'])  dx--;
    if(teclas['d']||teclas['arrowright']) dx++;
    if(teclas['w']||teclas['arrowup'])    dy--;
    if(teclas['s']||teclas['arrowdown'])  dy++;
    const m=Math.hypot(dx,dy);
    if(!m) return;
    A.mover(l, dx/m*P.velocidade*dt, dy/m*P.velocidade*dt);
    A.barrarGrades(l,J.grades);
  }

  /* ---------- slots de formação ---------- */
  function slots(form,n,dx,dy){
    const s=[], e=22, px=-dy, py=dx;
    for(let i=0;i<n;i++){
      let a=0,b=0;
      switch(form){
        case 'bonde':    {const f=Math.floor(i/2)+1,l=i%2?1:-1; a=-f*e*0.8; b=l*e*0.42; break;}
        case 'muralha':  {const c=i-(n-1)/2; a=-e*0.3+(i%2)*(-e*0.42); b=c*e*0.72; break;}
        case 'investida':{const f=Math.floor(i/2)+1,l=i%2?1:-1; a=-f*e*0.6; b=l*f*e*0.42; break;}
        case 'espalhar': {const c=i-(n-1)/2; a=-(i%3)*e*0.7; b=c*e*1.05; break;}
      }
      s.push({x:dx*a+px*b, y:dy*a+py*b});
    }
    return s;
  }

  function inimigoAlcancavel(J,d,raio){
    const cands=[];
    for(const o of J.discos){
      if(!o.vivo||!inimigos(d.lado,o.lado)) continue;
      const q=U.dist2(d.x,d.y,o.x,o.y);
      if(q<=raio*raio) cands.push([q,o]);
    }
    if(!cands.length) return null;
    cands.sort((a,b)=>a[0]-b[0]);
    for(let i=0;i<Math.min(3,cands.length);i++)
      if(A.livre(d.x,d.y,cands[i][1].x,cands[i][1].y)) return cands[i][1];
    return null;
  }

  function entrarNoEstadio(J,d){
    if(d.entrou) return;
    d.entrou=true; d.vx=d.vy=0;
    J.entraram[d.lado]=(J.entraram[d.lado]||0)+1;
  }

  /* ---------- discos ---------- */
  function moverDiscos(J,dt){
    const lider = J.discos.find(d=>d.lider&&d.vivo);
    /* formação é coisa do SEU bonde. Os outros escalões — inclusive os do
       mesmo clube — têm portão próprio e vão sozinhos. */
    const meus  = J.discos.filter(d=>d.doJogador&&d.vivo&&!d.lider);
    let dirX=0, dirY=-1;
    if(lider){
      const c=A.campoDaEntrada(lider.entrada,J.grades,J.versaoGrades).passo(lider.x,lider.y);
      if(c.dx||c.dy){dirX=c.dx;dirY=c.dy;}
    }
    const sl=slots(J.form, Math.max(meus.length,1), dirX, dirY);

    for(const d of J.discos){
      if(!d.vivo) continue;

      if(d.atordoado>0){
        d.atordoado-=dt; d.vx*=0.85; d.vy*=0.85;
        A.mover(d, d.vx*dt, d.vy*dt); A.barrarGrades(d,J.grades);
        continue;
      }
      if(d.lider) continue;

      const recua = d.fugindo
        || (d.lado==='mandante'  && J.recuando)
        || (d.lado==='visitante' && J.recuoVisitante);

      let ax,ay, usarCampo=false, campo=null;

      if(recua){
        // volta pro próprio spawn
        const s=D.spawns.find(x=>x.id===d.spawn)||D.spawns[0];
        campo = campoDoSpawn(s); usarCampo=true;
      } else {
        const alvo = inimigoAlcancavel(J,d, d.doJogador?110:130);
        if(alvo && !J.paz){ ax=alvo.x; ay=alvo.y; }
        else if(d.doJogador && lider && !J.paz){
          const i=meus.indexOf(d), s=sl[i<0?0:i]||{x:0,y:0};
          /* O slot é geometria pura e pode cair em cima de prédio, ou
             fora da cena quando o líder está colado numa borda. Nesse
             caso puxa pro ponto válido mais perto.
             Só nesse caso: pontoLivreMaisProximo devolve CENTRO DE
             CÉLULA, então puxar sempre faria vários seguidores mirarem
             exatamente o mesmo ponto, empilhando e se empurrando. */
          ax=lider.x+s.x; ay=lider.y+s.y;
          if(!A.livrePara(ax,ay,A.raioMalha(d.r))){
            const q=A.pontoLivreMaisProximo(ax,ay,d.r);
            ax=q.x; ay=q.y;
          }
        } else {
          campo=A.campoDaEntrada(d.entrada,J.grades,J.versaoGrades); usarCampo=true;
          const e=D.entradas.find(x=>x.id===d.entrada);
          if(e && U.dist(d.x,d.y,e.x,e.y)<(e.raio||34)){ entrarNoEstadio(J,d); continue; }
        }
      }

      // rastro de diagnóstico: qual decisão e qual alvo, por disco
      d._ramo = recua?'recuo' : usarCampo?'campo' : (d.doJogador&&lider)?'formacao':'inimigo';
      d._alvo = usarCampo?null:[Math.round(ax),Math.round(ay)];

      let dirx,diry;
      if(usarCampo && campo){
        const c=campo.passo(d.x,d.y);
        dirx=c.dx; diry=c.dy;
        /* Sem caminho até o portão sem derrubar nada: só então a grade
           vira alvo. Enquanto houver volta, o campo já mandou dar a volta. */
        if(c.semRota){
          let g=null, md=1e9;
          for(const x of J.grades){
            if(x.hp<=0 || x.tipo==='fila') continue;
            const dd=U.dist(d.x,d.y,x.x,x.y);
            if(dd<md){md=dd;g=x;}
          }
          if(g){
            const gx=g.x-d.x, gy=g.y-d.y, gd=Math.hypot(gx,gy)||1;
            dirx=gx/gd; diry=gy/gd;
          }
        }
        if(recua){
          const s=D.spawns.find(x=>x.id===d.spawn);
          if(s && U.dist(d.x,d.y,s.x,s.y)<40){dirx=0;diry=0;}
        }
      } else {
        const ddx=ax-d.x, ddy=ay-d.y, dist=Math.hypot(ddx,ddy)||1;
        /* Histerese: chega com 9, só volta a andar depois de 22. Sem as
           duas soleiras ele oscila em cima do limite — para com 8, a
           separação empurra pra 10, anda de novo — e é isso que faz o
           bonde inteiro parecer inquieto parado no lugar. */
        if(d.acomodado && dist>22) d.acomodado=false;
        if(dist<=9) d.acomodado=true;
        if(d.acomodado){
          dirx=0; diry=0; d.melhorDist=undefined; d.semGanho=0;
        } else {
          /* Desistência: se em 0,8 s ele não encostou nem 2 px mais perto,
             o alvo é inalcançável daqui. Para, em vez de empurrar pedra.
             Se o alvo se afasta muito, é porque mudou — recomeça a contar. */
          if(d.melhorDist===undefined || dist<d.melhorDist-2){
            d.melhorDist=dist; d.semGanho=0;
          } else if(dist>d.melhorDist+25){
            d.melhorDist=dist; d.semGanho=0;
          } else {
            d.semGanho=(d.semGanho||0)+dt;
          }
          if(d.semGanho>0.8){dirx=0;diry=0;}
          else {dirx=ddx/dist; diry=ddy/dist;}
        }
      }

      const vel=P.velocidade*(d.fugindo?1.25:recua?1.15:1)*(0.75+nivelMoral(d.moral)*0.25);
      if(!dirx && !diry && d.acomodado){
        /* Chegou: para de verdade. Deixar o steering rodando com alvo
           a 8 px mantém micromovimento que, com 60 discos na tela,
           lê como uma multidão inquieta. Quem chegou, chegou. */
        d.vx=0; d.vy=0; d.travado=0;
        continue;
      }
      if(!dirx && !diry){
        /* chegou onde queria: freia e assenta. Decaimento exponencial
           sozinho nunca chega a zero, e o disco fica vibrando de leve —
           com 60 deles na tela isso vira inquietação visível. */
        d.vx*=0.70; d.vy*=0.70;
        if(Math.hypot(d.vx,d.vy)<3.5){d.vx=0; d.vy=0;}
      } else {
        d.vx += (dirx*vel-d.vx)*Math.min(1,dt*6);
        d.vy += (diry*vel-d.vy)*Math.min(1,dt*6);
      }
      const px=d.x, py=d.y;
      A.mover(d, d.vx*dt, d.vy*dt);
      A.barrarGrades(d,J.grades);
      /* progresso medido na posição real. O retorno do mover mente:
         ele pode "andar" 0,9 px e ser desfeito logo depois por um
         empurrão, e aí o disco nunca é considerado travado. */
      const andou = Math.hypot(d.x-px, d.y-py) > vel*dt*0.25;

      /* Rede de segurança: se nem deslizando nem contornando ele saiu
         do lugar, larga o steering e vai direto pela célula que o campo
         de fluxo aponta. Melhor andar torto que ficar parado na borda. */
      if(andou){ d.travado=0; }
      else {
        d.travado=(d.travado||0)+dt;
        if(d.travado>0.45){
          const guia = campo || A.campoDaEntrada(d.entrada,J.grades,J.versaoGrades);
          const st=guia.passo(d.x,d.y);
          if(st.dx||st.dy){
            d.vx=st.dx*vel; d.vy=st.dy*vel;
            A.mover(d, st.dx*vel*dt*1.6, st.dy*vel*dt*1.6);
          }
          if(d.travado>2.0){
            const q=A.pontoLivreMaisProximo(d.x,d.y,d.r);
            d.x=q.x; d.y=q.y; d.vx=d.vy=0; d.travado=0;
          }
        }
      }
    }
  }

  const camposSpawn={};
  function campoDoSpawn(s){
    if(!camposSpawn[s.id]) camposSpawn[s.id]=A.criarCampo(s.x,s.y);
    return camposSpawn[s.id];
  }

  /* ---------- polícia ---------- */
  function procurandoConflito(J,d){
    if(!d.vivo||d.fugindo||d.entrou) return false;
    if(d.lado==='mandante'  && J.recuando) return false;
    if(d.lado==='visitante' && J.recuoVisitante) return false;
    return d.hostil>0;
  }

  function moverPoliciais(J,dt){
    const buracos=J.grades.filter(g=>g.hp<=0);
    for(const p of J.policiais){
      if(!p.vivo) continue;
      p.cooldown=Math.max(0,p.cooldown-dt);
      let ax,ay,vel=54;

      if(p.carga){
        const alvo=alvoDaCarga(J,p);
        if(alvo){ax=alvo.x;ay=alvo.y;vel=96;} else {ax=p.postoX;ay=p.postoY;vel=76;}
        for(const d of J.discos){
          if(!procurandoConflito(J,d)) continue;
          if(U.dist(d.x,d.y,p.x,p.y)>d.r+p.r+8) continue;
          if(p.cooldown>0) break;
          p.cooldown=1.25;
          d.hp-=P.forcaPM*P.dano*1.4; d.atordoado=1.0; d.tremor=6;
          d.moral=Math.max(0,d.moral-0.6);
          if(d.hp<=0) prender(J,d);
          break;
        }
      } else if(buracos.length){
        let alvo=buracos[0], md=1e9;
        for(const b of buracos){const dd=U.dist(b.x,b.y,p.x,p.y); if(dd<md){md=dd;alvo=b;}}
        ax=alvo.x; ay=alvo.y; vel=64;
      } else {
        let perto=null, pd=1e9;
        for(const d of J.discos){
          if(!procurandoConflito(J,d)) continue;
          const dd=U.dist(d.x,d.y,p.x,p.y);
          if(dd>=80||dd>=pd) continue;
          // atrás da grade não se persegue: o cordão é pra ser segurado
          if(A.atravessaGrade(p.x,p.y,d.x,d.y,J.grades)) continue;
          pd=dd; perto=d;
        }
        if(perto){
          ax=perto.x; ay=perto.y; vel=70;
          const fx=ax-p.postoX, fy=ay-p.postoY, f=Math.hypot(fx,fy);
          if(f>80){ax=p.postoX+fx/f*80; ay=p.postoY+fy/f*80;}
          if(p.cooldown<=0 && pd<perto.r+p.r+8){
            p.cooldown=2.0;
            perto.hp-=P.forcaPM*P.dano; perto.atordoado=0.6; perto.tremor=5;
            if(perto.hp<=0) prender(J,perto);
          }
        } else {
          ax=p.postoX; ay=p.postoY+Math.sin(J.t*0.55+p.giro)*26; vel=42;
        }
      }

      const dx=ax-p.x, dy=ay-p.y, dist=Math.hypot(dx,dy)||1;
      if(dist>6){
        p.vx=dx/dist*vel; p.vy=dy/dist*vel;
        const andou=A.mover(p, p.vx*dt, p.vy*dt);
        A.barrarGrades(p, J.grades);
        // empacou tentando alcançar algo inalcançável: volta pro posto
        p.travado = andou ? 0 : (p.travado||0)+dt;
        if(p.travado>1.0){
          const v=A.pontoLivreMaisProximo(p.postoX,p.postoY,p.r);
          const bx=v.x-p.x, by=v.y-p.y, bd=Math.hypot(bx,by)||1;
          A.mover(p, bx/bd*vel*dt, by/bd*vel*dt);
          if(p.travado>2.5){p.x=v.x; p.y=v.y; p.travado=0;}
        }
      } else {p.vx=p.vy=0; p.travado=0;}
    }
    const vv=J.policiais.filter(p=>p.vivo);
    for(let i=0;i<vv.length;i++)for(let j=i+1;j<vv.length;j++){
      const a=vv[i],b=vv[j],dx=b.x-a.x,dy=b.y-a.y;
      const d=Math.hypot(dx,dy)||0.01, min=a.r+b.r;
      if(d<min){const e=(min-d)/2,nx=dx/d,ny=dy/d;a.x-=nx*e;a.y-=ny*e;b.x+=nx*e;b.y+=ny*e;}
    }
  }

  function alvoDaCarga(J,p){
    let melhor=null, melhorN=-1;
    for(const d of J.discos){
      if(!procurandoConflito(J,d)) continue;
      if(A.atravessaGrade(p.x,p.y,d.x,d.y,J.grades)) continue;
      let n=0;
      for(const o of J.discos)
        if(procurandoConflito(J,o)&&U.dist(o.x,o.y,d.x,d.y)<70) n++;
      const nota=n-U.dist(d.x,d.y,p.x,p.y)/90;
      if(nota>melhorN){melhorN=nota;melhor=d;}
    }
    return melhor;
  }

  /* ---------- contatos ---------- */
  function contatos(J,dt){
    const vivos=J.discos.filter(d=>d.vivo);
    for(const a of vivos){
      if(a.fugindo||a.atordoado>0) continue;
      if(a.lado==='mandante'&&J.recuando) continue;
      if(a.lado==='visitante'&&J.recuoVisitante) continue;

      for(const b of vivos){
        if(a===b||!inimigos(a.lado,b.lado)) continue;
        if(U.dist(a.x,a.y,b.x,b.y)>a.r+b.r+5) continue;
        const bruto=(a.forca*nivelMoral(a.moral)*U.entre(0.8,1.2))-b.defesa*0.5;
        b.hp-=Math.max(1,bruto)*P.dano*dt*(b.fugindo?1.6:1);
        b.tremor=Math.min(6,b.tremor+0.6); a.golpe=0.12; a.hostil=3.0;
        if(b.hp<=0) derrubar(J,b);
      }

      for(const g of J.grades){
        if(g.hp<=0 || g.tipo==='fila') continue;   // fila não quebra
        if(U.dist(g.x,g.y,a.x,a.y)>a.r+g.meia+4) continue;
        g.hp-=a.forca*nivelMoral(a.moral)*P.dano*dt*1.6;
        g.tremor=Math.min(5,g.tremor+0.5); a.hostil=3.5;
        if(g.hp<=0){
          g.hp=0; J.versaoGrades++; J.alerta=Math.min(100,J.alerta+13);
          logar(J,'Um módulo da grade foi ao chão.','pm');
          romperCordao(J);
        }
      }

      /* Só quem está procurando conflito se pega com a PM. Passar do lado
         de um policial a caminho do portão não é enfrentamento — sem esta
         guarda, a atenção policial ia a 100 em segundos só de todo mundo
         andar pela rua, e a IA recuava sem que nada tivesse acontecido. */
      if(procurandoConflito(J,a))
      for(const p of J.policiais){
        if(!p.vivo) continue;
        if(U.dist(p.x,p.y,a.x,a.y)>a.r+p.r+5) continue;
        p.hp-=a.forca*P.dano*dt*0.55; a.hostil=4.0;
        J.alerta=Math.min(100,J.alerta+7*dt);
        if(p.hp<=0){p.caido=true; J.alerta=Math.min(100,J.alerta+18); logar(J,'Um PM foi ao chão.','pm');}
        if(p.cooldown<=0){
          p.cooldown=1.9; a.hp-=P.forcaPM*P.dano; a.atordoado=0.7; a.tremor=5;
          if(a.hp<=0) prender(J,a);
        }
      }
    }
    for(const d of J.discos){
      d.tremor=Math.max(0,d.tremor-dt*9);
      d.golpe =Math.max(0,d.golpe-dt);
      d.hostil=Math.max(0,d.hostil-dt);
    }
    for(const g of J.grades) g.tremor=Math.max(0,g.tremor-dt*8);
    J.alerta=Math.max(0,J.alerta-dt*1.2);

    if(J.alerta>=100&&J.reforco<3&&!J.rompido){
      J.reforco++;
      const base=D.pmPostos[U.inteiro(0,D.pmPostos.length-1)];
      for(let i=0;i<3;i++) J.policiais.push(new Policial(base));
      J.alerta=64; logar(J,'Chegou reforço da PM.','pm');
    }
  }

  function derrubar(J,d){
    if(d.caido||d.preso) return;
    d.caido=true; d.hp=0; d.vx=d.vy=0;
    J.caidos[d.lado]++;
    for(const o of J.discos){
      if(o.lado===d.lado) o.moral=Math.max(0,o.moral-1.1);
      else o.moral=Math.min(20,o.moral+0.5);
    }
    if(d.lider){logar(J,'Seu líder caiu.','r'); aviso(J,'Líder caiu','#d9705f');}
  }
  function prender(J,d){
    if(d.caido||d.preso) return;
    d.preso=true; d.hp=0; d.vx=d.vy=0;
    J.presos++; J.caidos[d.lado]++; J.presosPor[d.lado]++;
    logar(J,`${d.nome} foi preso.`,'pm');
  }

  function romperCordao(J){
    if(J.rompido) return;
    J.rompido=true; J.alerta=100;
    J.cargaEm =J.t+P.atrasoCarga;
    J.cargaAte=J.t+P.atrasoCarga+P.duracaoCarga;
    for(const p of J.policiais) p.carga=true;
    aviso(J,'Grade rompida','#e0b040');
    logar(J,`Romperam a grade. Tropa de choque a caminho (${Math.round(P.atrasoCarga)}s).`,'pm');
  }

  function passoCarga(J,dt){
    if(J.rompido) J.alerta=100;
    if(J.cargaEm!==null&&!J.tropaVeio&&J.t>=J.cargaEm){
      J.tropaVeio=true;
      J.cargaAte=Math.max(J.cargaAte, J.t+P.duracaoCarga);
      const n=Math.round(P.tropaCarga);
      const buraco=J.grades.find(g=>g.hp<=0)||J.grades[0];
      for(let i=0;i<n;i++){
        const p=new Policial({x:buraco.x, y:buraco.y});
        const q=A.pontoLivreMaisProximo(buraco.x+U.entre(-70,70), buraco.y+U.entre(-70,70), 10);
        p.x=q.x; p.y=q.y; p.carga=true; p.hpMax=380; p.hp=380; p.r=10;
        J.policiais.push(p);
      }
      aviso(J,'Tropa de choque entrou','#5fa87d');
      logar(J,`${n} PMs entraram dispersando os dois lados.`,'pm');
    }
    if(J.tropaVeio&&J.t>J.cargaAte){
      let voltou=false;
      for(const p of J.policiais) if(p.carga){p.carga=false;voltou=true;}
      if(voltou) logar(J,'A tropa recompôs a linha.','pm');
    }
  }

  function medirClima(J,dt){
    if(!J.paz) return;
    J.cdClima=(J.cdClima||0)-dt;
    if(J.cdClima>0) return;
    J.cdClima=0.35;
    let motivo=null;
    if(J.rompido) motivo='romperam a grade';
    else if(J.caidos.mandante+J.caidos.visitante>0) motivo='caiu gente';
    else if(J.alerta>45) motivo='a PM se mexeu';
    else if(J.projeteis.some(p=>!p.morto)) motivo='voou pedra';
    else{
      const vivos=J.discos.filter(d=>d.vivo);
      for(const a of vivos){
        if(motivo) break;
        for(const b of vivos){
          if(b===a||!inimigos(a.lado,b.lado)) continue;
          if(U.dist(a.x,a.y,b.x,b.y)<110&&A.livre(a.x,a.y,b.x,b.y)){motivo='os bondes se encostaram';break;}
        }
      }
    }
    if(motivo){
      J.paz=false;
      logar(J,`O clima virou — ${motivo}. Ninguém mais entra em paz.`,'r');
      aviso(J,'O clima virou','#d9705f');
    }
  }

  function ameacaPM(J,d){
    for(const p of J.policiais){
      if(!p.vivo) continue;
      const dist=U.dist(p.x,p.y,d.x,d.y);
      if(p.carga && dist<120) return true;
      if(!p.carga && dist<46 && J.alerta>55) return true;
    }
    return false;
  }
  function pressaoSobreMim(J,dt){
    const meus=J.discos.filter(d=>d.lado==='mandante'&&d.vivo&&!d.fugindo);
    if(!meus.length){J.fracPM=0;return;}
    const frac=meus.filter(d=>ameacaPM(J,d)).length/meus.length;
    J.fracPM=frac;
    if(frac>0.35&&!J.recuando){
      J.sobPressao+=dt;
      for(const d of meus) d.moral=Math.max(0,d.moral-0.5*dt*frac);
      if(!J.avisouPM&&J.sobPressao>1.2){
        J.avisouPM=true;
        aviso(J,'PM em cima do seu bonde','#5fa87d');
        logar(J,'A PM encostou no seu pessoal. R pra recuar.','pm');
      }
      if(J.sobPressao>=P.aguentaPM){
        J.recuando=true; J.sobPressao=0;
        logar(J,'Seu pessoal não aguentou e recuou sozinho.','r');
        aviso(J,'Recuaram sem sua ordem','#d9705f');
      }
    } else {
      J.sobPressao=Math.max(0,J.sobPressao-dt*1.6);
      if(J.sobPressao<=0) J.avisouPM=false;
    }
  }
  function iaRecuo(J){
    const g=J.discos.filter(d=>d.lado==='visitante'&&d.vivo);
    if(!g.length) return;
    const sob=g.filter(d=>ameacaPM(J,d)).length/g.length;
    const moral=g.reduce((s,d)=>s+d.moral,0)/g.length;
    if(!J.recuoVisitante && (J.alerta>78&&sob>0.22 || moral<6)){
      J.recuoVisitante=true; J.recuoVisitanteAte=J.t+9;
      logar(J,'Os visitantes recuaram.','pm');
    } else if(J.recuoVisitante && J.t>J.recuoVisitanteAte && J.alerta<62){
      J.recuoVisitante=false;
    }
  }

  /* ---------- projéteis ---------- */
  function moverProjeteis(J,dt){
    for(const p of J.projeteis){
      if(p.morto) continue;
      p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
      const bateu = p.t>0.07 && p.t<p.dur && !A.caminhavel(p.x,p.y);
      if(bateu && p.tipo==='pedra'){p.morto=true;continue;}
      if(!bateu && p.t<p.dur) continue;
      p.morto=true;

      const alvos=J.discos.filter(d=>d.vivo&&inimigos(p.lado,d.lado));
      if(p.tipo==='pedra'){
        for(const d of alvos) if(U.dist(d.x,d.y,p.x,p.y)<32){
          d.hp-=22*P.dano; d.tremor=5; if(d.hp<=0) derrubar(J,d); break;
        }
        for(const g of J.grades) if(g.hp>0&&g.tipo!=='fila'&&U.dist(g.x,g.y,p.x,p.y)<26){g.hp-=30;g.tremor=4;break;}
      } else {
        p.explosao=0;
        for(const d of alvos){
          const dist=U.dist(d.x,d.y,p.x,p.y);
          if(dist<92){
            d.hp-=(58-dist*0.4)*P.dano; d.atordoado=1.1; d.tremor=6;
            const a=Math.atan2(d.y-p.y,d.x-p.x);
            d.vx=Math.cos(a)*150; d.vy=Math.sin(a)*150;
            if(d.hp<=0) derrubar(J,d);
          }
        }
        for(const g of J.grades){
          if(g.tipo==='fila') continue;
          const dist=U.dist(g.x,g.y,p.x,p.y);
          if(g.hp>0&&dist<92){
            g.hp-=110-dist*0.6; g.tremor=5;
            if(g.hp<=0){g.hp=0; J.versaoGrades++; J.alerta=Math.min(100,J.alerta+13); romperCordao(J);}
          }
        }
        J.alerta=Math.min(100,J.alerta+16);
      }
    }
    for(const p of J.projeteis) if(p.morto&&p.explosao!==undefined) p.explosao+=dt;
    J.projeteis=J.projeteis.filter(p=>!p.morto||(p.explosao!==undefined&&p.explosao<0.45));
  }

  const FOLGA=1.5;      // sobreposição tolerada, em px
  const MACIEZ=0.45;    // fração da sobreposição resolvida por quadro
  function separar(J){
    const t=J.discos.filter(d=>d.vivo);
    for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++){
      const a=t[i],b=t[j],dx=b.x-a.x,dy=b.y-a.y;
      const d=Math.hypot(dx,dy)||0.01, min=a.r+b.r;
      /* Resolver a sobreposição inteira todo quadro faz o par bater e
         voltar pra sempre. Com folga e resolução parcial, eles encostam
         e acomodam — que é como gente parada em aglomeração fica. */
      if(d<min-FOLGA){
        const e=(min-FOLGA-d)*MACIEZ, nx=dx/d, ny=dy/d;
        /* O líder é âncora (GDD §16.2): não é empurrado pelos próprios
           seguidores. Sem isso ele deriva, os slots da formação vão
           junto, e o bonde inteiro persegue a si mesmo sem parar. */
        if(a.lider)      A.empurrar(b, nx*e*2, ny*e*2);
        else if(b.lider) A.empurrar(a,-nx*e*2,-ny*e*2);
        else { A.empurrar(a,-nx*e,-ny*e); A.empurrar(b, nx*e, ny*e); }
      }
    }
    /* ninguém atravessa policial: a PM é obstáculo mesmo pra quem
       está só de passagem — desviar dela é o que faz o posto importar */
    const pms=J.policiais.filter(p=>p.vivo);
    for(const a of t) for(const p of pms){
      const dx=a.x-p.x, dy=a.y-p.y;
      const d=Math.hypot(dx,dy)||0.01, min=a.r+p.r;
      if(d<min-FOLGA) A.empurrar(a, dx/d*(min-FOLGA-d)*MACIEZ, dy/d*(min-FOLGA-d)*MACIEZ);
    }
  }

  function checarDebandada(J){
    for(const lado of ['mandante','visitante']){
      if(J.debandou[lado]) continue;
      const total=J.total[lado], caidos=J.caidos[lado];
      if(total>=6 && caidos/total>=P.debandada/100){
        J.debandou[lado]=true;
        for(const d of J.discos) if(d.lado===lado&&d.vivo) d.fugindo=true;
        const meu=lado==='mandante';
        logar(J, meu?'Seu pessoal correu.':'Os visitantes correram.', meu?'r':'a');
        aviso(J, meu?'Seu pessoal correu':'Eles correram', meu?'#d9705f':'#7098d9');
      }
    }
  }

  /* ---------- ações do jogador ---------- */
  function restaCd(J,tipo){
    return Math.max(0,(tipo==='pedra'?J.cdPedraAte:J.cdBombaAte)-J.t);
  }
  function arremessar(J,tipo){
    if(J.fase!=='ativo'||restaCd(J,tipo)>0) return;
    const l=J.discos.find(d=>d.lider&&d.vivo);
    if(!l) return;
    const alcance = tipo==='pedra'?P.alcancePedra:P.alcanceBomba;

    let alvo=null, md=1e9;
    for(const o of J.discos){
      if(!o.vivo||!inimigos(l.lado,o.lado)) continue;
      const d=U.dist(l.x,l.y,o.x,o.y);
      if(d<md){md=d;alvo=o;}
    }
    if(!alvo||md>alcance*1.6){
      let g=null; md=1e9;
      for(const x of J.grades){
        if(x.hp<=0) continue;
        const d=U.dist(l.x,l.y,x.x,x.y);
        if(d<md){md=d;g=x;}
      }
      alvo=g;
    }
    if(!alvo){logar(J,'Não tem em quem jogar daqui.','p');return;}

    let ax=alvo.x, ay=alvo.y;
    const dx=ax-l.x, dy=ay-l.y, dist=Math.hypot(dx,dy)||1;
    if(dist>alcance){ax=l.x+dx/dist*alcance; ay=l.y+dy/dist*alcance;}

    if(tipo==='bomba'){ if(J.bombas<=0) return; J.bombas--; }
    if(tipo==='pedra') J.cdPedraAte=J.t+P.cdPedra; else J.cdBombaAte=J.t+P.cdBomba;
    l.hostil=4.0;
    J.projeteis.push(new Projetil(l.x,l.y,ax,ay,tipo,l.lado));
  }
  function alternarRecuo(J){
    if(J.fase!=='ativo') return;
    J.recuando=!J.recuando;
    logar(J, J.recuando?'Recuando pro ponto de saída.':'De volta pra cima.','r');
  }
  function noPortao(J){
    const l=J.discos.find(d=>d.lider&&d.vivo);
    if(!l) return null;
    const e=D.entradas.find(x=>x.id===l.entrada);
    if(!e) return null;
    return U.dist(l.x,l.y,e.x,e.y) < (e.raio||34)+8 ? e : null;
  }

  /* =======================================================
     DESENHO
     ======================================================= */
  function corLado(l,claro){
    if(l==='visitante') return claro?'#e8e8e8':'#2a5fa8';
    return claro?'#e8e4dc':'#c0392b';
  }
  function desenharDisco(c,d){
    const tx=d.tremor?(Math.random()-0.5)*d.tremor:0;
    const ty=d.tremor?(Math.random()-0.5)*d.tremor:0;
    const x=d.x+tx, y=d.y+ty;
    if(!d.vivo){
      if(d.entrou) return;
      c.globalAlpha=d.preso?.5:.33;
      c.fillStyle='#000'; c.beginPath(); c.ellipse(x,y,d.r,d.r*.6,0,0,7); c.fill();
      c.strokeStyle=d.preso?'#5fa87d':corLado(d.lado,false); c.lineWidth=2.5;
      c.beginPath(); c.ellipse(x,y,d.r,d.r*.6,0,0,7); c.stroke();
      c.globalAlpha=1; return;
    }
    c.fillStyle='rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x+2,y+4,d.r,d.r*.82,0,0,7); c.fill();
    c.fillStyle=corLado(d.lado,false); c.beginPath(); c.arc(x,y,d.r,0,7); c.fill();
    c.fillStyle=corLado(d.lado,true);  c.beginPath(); c.arc(x,y,d.r*.62,0,7); c.fill();
    c.fillStyle='#2b2320'; c.beginPath(); c.arc(x,y,d.r*.34,0,7); c.fill();
    if(d.lider){c.strokeStyle='#e0b040';c.lineWidth=3;c.beginPath();c.arc(x,y,d.r+3,0,7);c.stroke();}
    if(d.golpe>0){c.strokeStyle=`rgba(255,235,190,${d.golpe*6})`;c.lineWidth=2;
      c.beginPath();c.arc(x,y,d.r+6,0,7);c.stroke();}
    if(d.hp<d.hpMax){
      const w=d.r*2, p=Math.max(0,d.hp/d.hpMax);
      c.fillStyle='rgba(0,0,0,.6)'; c.fillRect(x-w/2,y-d.r-9,w,3);
      c.fillStyle=p>.5?'#6a9c4a':p>.25?'#c8a03c':'#b6432f'; c.fillRect(x-w/2,y-d.r-9,w*p,3);
    }
    if(d.lider){
      c.font='600 10px "IBM Plex Mono",monospace'; c.textAlign='center';
      c.fillStyle='rgba(0,0,0,.75)'; c.fillText(d.nome,x+1,y-d.r-13);
      c.fillStyle='#e0b040';         c.fillText(d.nome,x,y-d.r-14);
    }
  }
  function desenharPolicial(c,p,t){
    if(!p.vivo){
      c.globalAlpha=.3; c.fillStyle='#1e3a2c';
      c.beginPath(); c.ellipse(p.x,p.y,p.r,p.r*.6,0,0,7); c.fill(); c.globalAlpha=1; return;
    }
    c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(p.x+1.5,p.y+3,p.r,p.r*.85,0,0,7); c.fill();
    c.fillStyle='#1e3a2c'; c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.fill();
    c.fillStyle='#3f7d5a'; c.beginPath(); c.arc(p.x,p.y,p.r*.62,0,7); c.fill();
    c.fillStyle='#0f1a14'; c.beginPath(); c.arc(p.x,p.y,p.r*.32,0,7); c.fill();
    const b=(Math.sin(t*6+p.giro)+1)/2;
    c.strokeStyle=`rgba(${b>0.5?'220,70,60':'80,140,235'},.8)`; c.lineWidth=2;
    c.beginPath(); c.arc(p.x,p.y,p.r+4,0,7); c.stroke();
    if(p.carga){
      c.strokeStyle='rgba(95,168,125,.55)'; c.lineWidth=1.5;
      c.beginPath(); c.arc(p.x,p.y,p.r+9,0,7); c.stroke();
      c.fillStyle='rgba(232,228,220,.75)'; c.fillRect(p.x-7,p.y-p.r-6,14,4);
    }
  }
  function desenharProjetil(c,p){
    if(p.morto){
      if(p.explosao!==undefined){
        const k=p.explosao/0.45;
        c.strokeStyle=`rgba(226,140,60,${1-k})`; c.lineWidth=4*(1-k);
        c.beginPath(); c.arc(p.x,p.y,20+k*76,0,7); c.stroke();
      }
      return;
    }
    const alt=Math.sin((p.t/p.dur)*Math.PI)*36;
    c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(p.x,p.y,5,3,0,0,7); c.fill();
    c.fillStyle=p.tipo==='pedra'?'#8d8880':'#c8562f';
    c.beginPath(); c.arc(p.x,p.y-alt,p.tipo==='pedra'?5:7,0,7); c.fill();
  }

  function desenhar(J,c,opc){
    A.desenharFundo(c);
    A.desenharSobreposicoes(c,J.grades,Object.assign({t:J.t},opc||{}));
    for(const p of J.policiais) desenharPolicial(c,p,J.t);
    const ord=[...J.discos].sort((a,b)=>a.y-b.y);
    for(const d of ord) if(!d.vivo) desenharDisco(c,d);
    for(const d of ord) if(d.vivo)  desenharDisco(c,d);
    for(const p of J.projeteis) desenharProjetil(c,p);
  }

  return {FORMACOES, Disco, criarEstado, passo, desenhar,
          arremessar, alternarRecuo, noPortao, entrarNoEstadio,
          restaCd, logar, aviso, nivelMoral};
})();
