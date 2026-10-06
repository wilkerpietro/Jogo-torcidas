# -*- coding: utf-8 -*-
"""
O BONECO A PARTIR DE HUMANOS DE VERDADE (pedido do dono, 06/10/2026)
--------------------------------------------------------------------
"observe esse modelo e use como base pra refazer do zero o boneco" — o
dono mandou três modelos. O boneco sai de dois deles:

  · ferramentas/fonte/boneco_corpo.glb — o "proxy human base mesh": o
    CORPO, com as curvas que o dono pediu ("com as curvas bem definidas,
    só tem mais polígonos, mas as curvas que preciso são desse estilo").
    Não tem esqueleto nem UV; tem 76 mil triângulos.
  · ferramentas/fonte/boneco_cabeca.glb — o humano base do MetaCreators
    (padrão MakeHuman, pele em domínio público): a CABEÇA (rosto com
    pálpebra, nariz, lábios e orelha modelados), os OLHOS, o TÊNIS e a
    textura de pele. O corpo dele vem recortado embaixo da roupa, por
    isso o corpo é o do outro.

O que este script faz:
  1. Escala o corpo pra 1,75 m e o reduz (colapso de arestas) até o
     tamanho do jogo.
  2. Corta a cabeça do corpo no pescoço, corta o pescoço da cabeça do
     MakeHuman, põe uma em cima da outra no eixo do pescoço e costura os
     dois anéis de borda numa malha só.
  3. Monta o esqueleto do jogo (os mesmos 16 ossos: pelvis, tronco,
     pescoco, cabeca, ombro/cotovelo/mao e quadril/joelho/pe) nas juntas
     medidas no corpo, pesa com os pesos automáticos do Blender e baixa
     os braços da pose A pra pose pendurada que a animação espera.
  4. Corta a roupa do jogo na pele: bainha, faixa do peito, manga no meio
     do braço com punho, gola careca em volta do pescoço, bermuda, meia; a
     camisa fica 4 mm por fora.
  5. A pele do MakeHuman vira MAPA DE DETALHE (a textura dividida pelo
     tom de fundo dela), que o jogo multiplica pela cor de pele do boneco:
     rosto e corpo no mesmo tom. A sobrancelha é pintada nele.
  6. Olhos e tênis do MakeHuman, reduzidos; cabelos, barbas, bonés e
     acessórios gerados da própria cabeça, como antes.

Roda com o `bpy` do PyPI (Python 3.11, `pip install bpy==4.2.0 pillow`):
    python ferramentas/boneco_base.py --leve   → img/boneco_leve.glb, dados/boneco_leve_glb.js
    python ferramentas/boneco_base.py          → img/boneco.glb,      dados/boneco_glb.js
"""
import bpy, bmesh, math, os, sys, base64, random
from mathutils import Vector, Matrix
import mathutils

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEVE = ('--leve' in sys.argv) or bool(os.environ.get('BONECO_LEVE'))
FONTE_CORPO = os.path.join(RAIZ, 'ferramentas', 'fonte', 'boneco_corpo.glb')
FONTE_CABECA = os.path.join(RAIZ, 'ferramentas', 'fonte', 'boneco_cabeca.glb')
SAIDA_GLB = os.path.join(RAIZ, 'img', 'boneco_leve.glb' if LEVE else 'boneco.glb')
SAIDA_JS = os.path.join(RAIZ, 'dados', 'boneco_leve_glb.js' if LEVE else 'boneco_glb.js')
import tempfile
# a pele de detalhe só existe embutida no GLB: o PNG fica numa pasta temporária
SAIDA_PELE = os.path.join(tempfile.mkdtemp(), 'pele_detalhe%s.png' % ('_leve' if LEVE else ''))
ALTURA = 1.75
# o tamanho no jogo: triângulos do corpo (sem a cabeça) e da cabeça
ALVO_CORPO, ALVO_CABECA = (1700, 1050) if LEVE else (12000, 6000)
ALTURA_CORPO = 1.72      # o corpo; a cabeça do MakeHuman, costurada no pescoço, leva o boneco a ~1,76

bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection

def material(nome, cor, rug=0.75, metal=0.0, alfa=1.0):
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*cor, 1.0)
    bsdf.inputs['Roughness'].default_value = rug
    bsdf.inputs['Metallic'].default_value = metal
    if alfa < 1.0:
        bsdf.inputs['Alpha'].default_value = alfa
        m.blend_method = 'BLEND'
    return m

M = {
  'pele':    material('pele',    (1.0, 1.0, 1.0)),
  'camisa':  material('camisa',  (0.75, 0.16, 0.14)),
  'faixa':   material('faixa',   (0.92, 0.92, 0.90)),
  'gola':    material('gola',    (0.92, 0.92, 0.90)),
  'punho':   material('punho',   (0.92, 0.92, 0.90)),
  'punho2':  material('punho2',  (0.10, 0.10, 0.10)),
  'calca':   material('calca',   (0.18, 0.20, 0.26)),
  'meia':    material('meia',    (0.95, 0.95, 0.93)),
  'tenis':   material('tenis',   (0.93, 0.93, 0.92)),
  'sola':    material('sola',    (0.20, 0.20, 0.20)),
  'cabelo':  material('cabelo',  (0.08, 0.05, 0.03)),
  'olho':    material('olho',    (0.93, 0.92, 0.90), 0.3),
  'iris':    material('iris',    (0.28, 0.17, 0.09), 0.3),
  'pupila':  material('pupila',  (0.02, 0.02, 0.02), 0.3),
  'bone':    material('bone',    (0.75, 0.16, 0.14)),
  'metal':   material('metal',   (0.85, 0.70, 0.30), 0.35, 1.0),
  'armacao': material('armacao', (0.10, 0.10, 0.10), 0.4),
  'lente':   material('lente',   (0.62, 0.78, 0.92), 0.2, 0.0, 0.35),
  'escuros': material('escuros', (0.05, 0.05, 0.06), 0.2),
  'relogio': material('relogio', (0.80, 0.82, 0.85), 0.3, 0.8),
  'pulseira':material('pulseira',(0.12, 0.12, 0.12), 0.6),
}

def aplicar_modificadores(ob):
    deps = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(deps)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=deps)
    ob.modifiers.clear()
    velho = ob.data
    ob.data = me
    bpy.data.meshes.remove(velho)
    for poly in me.polygons: poly.use_smooth = True
    return ob

def tri(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
def reduzir(ob, alvo):
    """colapso de arestas até ~`alvo` triângulos (o Decimate guarda a UV)"""
    n = tri(ob)
    if n <= alvo: return ob
    d = ob.modifiers.new('Decimate', 'DECIMATE'); d.ratio = alvo/n
    return aplicar_modificadores(ob)

def importar(caminho):
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=caminho)
    return [o for o in bpy.data.objects if o not in antes]

def assentado(o, nome):
    """a malha como está na cena (pose e transformação aplicadas), num objeto novo e solto"""
    deps = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(deps), preserve_all_data_layers=True, depsgraph=deps)
    me.transform(o.matrix_world)
    me.name = nome
    # O IMPORTADOR SEPARA OS VÉRTICES NAS COSTURAS DE UV: a malha vem rachada
    # (atrás do pescoço do MakeHuman, por exemplo) e, depois de reduzida, a
    # rachadura abria uma fresta escura. Junta de volta — a UV é por canto de
    # face e continua a mesma.
    bm_ = bmesh.new(); bm_.from_mesh(me)
    bmesh.ops.remove_doubles(bm_, verts=bm_.verts, dist=1e-5)
    bm_.to_mesh(me); bm_.free()
    novo = bpy.data.objects.new(nome, me); col.objects.link(novo)
    return novo

def cortar_e_apagar(ob, co, no, apagar_acima):
    """corta a malha no plano e apaga o lado escolhido — a borda fica um anel limpo"""
    bm = bmesh.new(); bm.from_mesh(ob.data)
    geom = list(bm.verts) + list(bm.edges) + list(bm.faces)
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no, clear_outer=apagar_acima, clear_inner=not apagar_acima)
    bm.to_mesh(ob.data); bm.free()

V = lambda ob: [v.co for v in ob.data.vertices]
def centro(pts):
    pts = list(pts); n = max(1, len(pts))
    return Vector((sum(p.x for p in pts)/n, sum(p.y for p in pts)/n, sum(p.z for p in pts)/n))
def fatia(ob, z, filtro=lambda p: True, e=0.006):
    return [p for p in V(ob) if abs(p.z - z) < e and filtro(p)]

# ------------------------------------------------------------- 1. O CORPO
novos = importar(FONTE_CORPO)
fonte_corpo = next(o for o in novos if o.type == 'MESH')
corpo = assentado(fonte_corpo, 'corpo')
for o in novos: bpy.data.objects.remove(o, do_unlink=True)
zs = [v.co.z for v in corpo.data.vertices]
K = ALTURA_CORPO/(max(zs) - min(zs))
corpo.data.transform(Matrix.Translation((0, 0, -min(zs)*K)) @ Matrix.Scale(K, 4))
corpo.data.update()
while corpo.data.uv_layers: corpo.data.uv_layers.remove(corpo.data.uv_layers[0])
reduzir(corpo, ALVO_CORPO + 1100)       # a cabeça dele sai daqui a pouco

# ---- as juntas, medidas no corpo (pose A)
JUN = {}
for L, s in (('D', -1), ('E', 1)):
    perna = lambda p, s=s: p.x*s > 0.015 and abs(p.x) < 0.26
    # O QUADRIL é o centro da coxa no alto dela (z 0,80): extrapolar pela
    # inclinação da coxa jogava a junta 14 cm pra trás e pro meio, e a perna
    # girava em volta da nádega
    coxa = centro(fatia(corpo, 0.80, perna))
    JUN['quadril.'+L] = Vector((coxa.x*0.92, coxa.y - 0.005, 0.93))
    JUN['joelho.'+L] = centro(fatia(corpo, 0.50, perna))
    JUN['pe.'+L] = centro(fatia(corpo, 0.09, perna))
    pe = [p for p in V(corpo) if p.z < 0.05 and p.x*s > 0.02]
    JUN['ponta.'+L] = min(pe, key=lambda p: p.y).copy(); JUN['ponta.'+L].z = 0.03
    # o braço: a reta dos pontos do braço (|x| > 0,26, acima da cintura)
    br = [p for p in V(corpo) if p.x*s > 0.26 and p.z > 0.75]
    ponta = max(br, key=lambda p: p.x*s)
    c0 = centro([p for p in br if abs(p.x*s - 0.28) < 0.02])
    c1 = centro([p for p in br if abs(p.x*s - 0.42) < 0.02])
    eixo = (c1 - c0).normalized()
    ombro = c0 + eixo*((0.19 - c0.x*s)/(eixo.x*s))
    JUN['ombro.'+L] = ombro
    # COTOVELO E PUNHO PELA PROPORÇÃO DO BRAÇO (braço 40%, antebraço 34%,
    # mão 26% do ombro à ponta dos dedos): as medidas fixas de antes davam
    # um antebraço de 17 cm
    tam = (ponta - ombro).length
    JUN['cotovelo.'+L] = ombro + eixo*(tam*0.40)
    d2 = (ponta - JUN['cotovelo.'+L]).normalized()
    JUN['mao.'+L] = ponta - d2*(tam*0.26)
    JUN['dedos.'+L] = ponta.copy()
tor = lambda p: abs(p.x) < 0.12
JUN['pelvis'] = centro(fatia(corpo, 0.95, tor)); JUN['pelvis'].z = 0.93
JUN['tronco'] = centro(fatia(corpo, 1.08, tor)); JUN['tronco'].z = 1.07
pesc = centro(fatia(corpo, 1.48, lambda p: abs(p.x) < 0.07))
JUN['pescoco'] = Vector((0, pesc.y, 1.455))

# ------------------------------------------------------------- 2. A CABEÇA
novos = importar(FONTE_CABECA)
def do_material(nome):
    return next(o for o in novos if o.type == 'MESH' and o.data.materials and o.data.materials[0] and o.data.materials[0].name == nome)
f_pele, f_olho, f_tenis = do_material('old_caucasian_male_detailed'), do_material('Eye_brown'), do_material('shoes04')
IMG_PELE = next(n.image for n in f_pele.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE')
IMG_OLHO = next(n.image for n in f_olho.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE')
cabeca = assentado(f_pele, 'cabeca_mh'); olhos = assentado(f_olho, 'olhos'); tenis = assentado(f_tenis, 'tenis')
for o in novos:
    if o.name in bpy.data.objects: bpy.data.objects.remove(o, do_unlink=True)
for ob in (cabeca, olhos, tenis):
    ob.data.materials.clear()
    for g in list(ob.vertex_groups): ob.vertex_groups.remove(g)

# só a cabeça e o pescoço (o resto do corpo dele é mão e canela soltas)
Z_CORTE_MH = 1.515
bm = bmesh.new(); bm.from_mesh(cabeca.data)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z < 1.40], context='FACES')
bm.to_mesh(cabeca.data); bm.free()
cortar_e_apagar(cabeca, (0, 0, Z_CORTE_MH), (0, 0, 1), apagar_acima=False)
# o anel do pescoço dele e o do corpo, onde vão se encontrar
Z_CORTE_CORPO = 1.474     # acima da crista do trapézio: aqui a seção do corpo já é só pescoço
cortar_e_apagar(corpo, (0, 0, Z_CORTE_CORPO), (0, 0, 1), apagar_acima=True)
anel_mh = centro(fatia(cabeca, Z_CORTE_MH, e=0.002))
anel_corpo = centro(fatia(corpo, Z_CORTE_CORPO, e=0.002))
# a cabeça vai pro eixo do pescoço do corpo, 1,6 cm acima do corte (a costura)
ESC_CAB = 1.0
desloc = Matrix.Translation(Vector((0, anel_corpo.y, Z_CORTE_CORPO + 0.016)) - Vector((0, anel_mh.y, Z_CORTE_MH))*ESC_CAB) @ Matrix.Scale(ESC_CAB, 4)
for ob in (cabeca, olhos):
    ob.data.transform(desloc); ob.data.update()

# O PESCOÇO DO CORPO AFINA ATÉ O DA CABEÇA: os 5 cm de cima do pescoço do corpo
# vão, ângulo a ângulo, do raio dele ao raio do pescoço da cabeça — a costura
# liga dois anéis quase iguais e não dobra
import bisect as _bis
def perfil(pts, c):
    ang = sorted((math.atan2(p.y - c.y, p.x - c.x), math.hypot(p.x - c.x, p.y - c.y)) for p in pts)
    def r(a):
        xs = [t for t, _ in ang]
        i = _bis.bisect_left(xs, a) % len(ang)
        (a0, r0), (a1, r1) = ang[i - 1], ang[i]
        if a1 < a0: a1 += 2*math.pi
        aa = a if a >= a0 else a + 2*math.pi
        f = 0 if a1 == a0 else (aa - a0)/(a1 - a0)
        return r0 + (r1 - r0)*max(0, min(1, f))
    return r
anel_mh_pts = [p.copy() for p in fatia(cabeca, Z_CORTE_CORPO + 0.016, e=0.002)]
c_mh = centro(anel_mh_pts); c_co = anel_corpo
r_mh = perfil(anel_mh_pts, c_mh)
r_co = perfil(fatia(corpo, Z_CORTE_CORPO, e=0.002), c_co)
for v in corpo.data.vertices:
    z = v.co.z
    if z < Z_CORTE_CORPO - 0.05 or abs(v.co.x) > 0.11: continue
    t = max(0.0, min(1.0, (z - (Z_CORTE_CORPO - 0.05))/0.05)); t = t*t*(3 - 2*t)
    a = math.atan2(v.co.y - c_co.y, v.co.x - c_co.x)
    rr = math.hypot(v.co.x - c_co.x, v.co.y - c_co.y)
    if rr > r_co(a)*1.25: continue
    k = 1 + (r_mh(a)/max(1e-4, r_co(a)) - 1)*t
    cx = c_co.x + (c_mh.x - c_co.x)*t; cy = c_co.y + (c_mh.y - c_co.y)*t
    v.co.x = cx + (v.co.x - c_co.x)*k; v.co.y = cy + (v.co.y - c_co.y)*k
corpo.data.update()

# a cabeça densa, antes de reduzir: é dela que nascem o cabelo e as medidas do rosto
cab_densa = cabeca.data.copy()
_verts = cab_densa.vertices
OLHOS_C = {}
for s in (-1, 1):
    OLHOS_C[s] = centro([v.co for v in olhos.data.vertices if v.co.x*s > 0])
olhosZ = (OLHOS_C[-1].z + OLHOS_C[1].z)/2
topoZ = max(v.co.z for v in _verts)
CY = centro([v.co for v in _verts if v.co.z > olhosZ]).y       # o meio da cabeça em y
frente_cab = min(v.co.y for v in _verts if abs(v.co.x) < 0.01 and abs(v.co.z - olhosZ) < 0.03)
queixoZ = min(v.co.z for v in _verts if v.co.y < frente_cab + 0.04 and abs(v.co.x) < 0.02)
print('cabeça: olhos %.3f topo %.3f queixo %.3f meio y %.3f' % (olhosZ, topoZ, queixoZ, CY))

reduzir(cabeca, ALVO_CABECA)
reduzir(olhos, 200 if LEVE else 1200)

# ---- os olhos: branco, íris e pupila pela cor da textura dele
PX_OLHO = list(IMG_OLHO.pixels[:])
def cor_olho(uv):
    w, h = IMG_OLHO.size
    x = min(w-1, max(0, int(uv[0] % 1.0 * w))); y = min(h-1, max(0, int(uv[1] % 1.0 * h)))
    i = (y*w + x)*4
    return PX_OLHO[i:i+3]
for m in ('olho', 'iris', 'pupila'): olhos.data.materials.append(M[m])
uvl = olhos.data.uv_layers.active
for p in olhos.data.polygons:
    u = sum(uvl.data[li].uv[0] for li in p.loop_indices)/len(p.loop_indices)
    v = sum(uvl.data[li].uv[1] for li in p.loop_indices)/len(p.loop_indices)
    # pela direção da face a partir do centro do globo: a frente é íris, o
    # miolo dela é pupila (a textura, depois de reduzir, já não separa)
    s_ = -1 if p.center.x < 0 else 1
    dd = (p.center - OLHOS_C[s_]).normalized()
    fr = -dd.y
    p.material_index = 2 if fr > 0.975 else (1 if fr > 0.86 else 0)
    p.use_smooth = True
while olhos.data.uv_layers: olhos.data.uv_layers.remove(olhos.data.uv_layers[0])

# ---- a costura: junta a cabeça no corpo e liga os dois anéis
# o corpo não tem UV: as faces dele apontam pra um ponto de pele lisa da textura
UV_LISO = (0.02, 0.98)
corpo.data.uv_layers.new(name='UVMap')
for li in range(len(corpo.data.loops)): corpo.data.uv_layers[0].data[li].uv = UV_LISO
cabeca.data.uv_layers[0].name = 'UVMap'
for x in bpy.context.selected_objects: x.select_set(False)
corpo.select_set(True); cabeca.select_set(True)
bpy.context.view_layer.objects.active = corpo
bpy.ops.object.join()
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(corpo.data)
for e in bm.edges: e.select = False
for f in bm.faces: f.select = False
for v in bm.verts: v.select = False
for e in bm.edges:
    if e.is_boundary and Z_CORTE_CORPO - 0.01 < (e.verts[0].co.z + e.verts[1].co.z)/2 < Z_CORTE_CORPO + 0.04:
        e.select = True
bmesh.update_edit_mesh(corpo.data)
bpy.ops.mesh.bridge_edge_loops(number_cuts=1, interpolation='LINEAR', smoothness=0.0)
# as faces da costura nascem com a normal de qualquer jeito: acerta todas pra fora
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.object.mode_set(mode='OBJECT')
for p in corpo.data.polygons: p.use_smooth = True
uv = corpo.data.uv_layers[0]
for p in corpo.data.polygons:
    if p.center.z < Z_CORTE_CORPO + 0.016 + 0.012:      # a costura e a beira da ilha de UV do pescoço
        for li in p.loop_indices: uv.data[li].uv = UV_LISO

_bm = bmesh.new(); _bm.from_mesh(corpo.data)
print('bordas abertas acima do pescoço: %d' % sum(1 for e in _bm.edges if e.is_boundary and min(v.co.z for v in e.verts) > Z_CORTE_CORPO - 0.02)); _bm.free()
# ---- o pé: some dentro do tênis
bm = bmesh.new(); bm.from_mesh(corpo.data)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z < 0.075], context='FACES')
bm.to_mesh(corpo.data); bm.free()

# ---- o tênis do MakeHuman, um pra cada pé, no pé do corpo
TENIS_ALTO = 0.115
reduzir(tenis, 380 if LEVE else 2500)
bm = bmesh.new(); bm.from_mesh(tenis.data)
pares = {}
for s in (-1, 1):
    b2 = bm.copy()
    bmesh.ops.delete(b2, geom=[v for v in b2.verts if v.co.x*s < 0], context='VERTS')
    me_ = bpy.data.meshes.new('tenis.' + ('D' if s < 0 else 'E')); b2.to_mesh(me_); b2.free()
    ob = bpy.data.objects.new(me_.name, me_); col.objects.link(ob)
    pares[s] = ob
bm.free(); bpy.data.objects.remove(tenis, do_unlink=True)
for s, ob in pares.items():
    L = 'D' if s < 0 else 'E'
    vs = V(ob)
    c = centro(vs); zmin = min(p.z for p in vs)
    comp_t = max(p.y for p in vs) - min(p.y for p in vs)
    comp_p = (JUN['pe.'+L].y + 0.06) - JUN['ponta.'+L].y
    esc = max(0.9, min(1.25, (comp_p + 0.03)/comp_t))
    alvo_c = Vector((JUN['pe.'+L].x, (JUN['pe.'+L].y + 0.07 + JUN['ponta.'+L].y - 0.02)/2, 0))
    ob.data.transform(Matrix.Translation(alvo_c) @ Matrix.Scale(esc, 4) @ Matrix.Translation(Vector((-c.x, -c.y, -zmin))))
    ob.data.update()
    # o sapato dele é de cano alto: vira tênis cortando o cano na altura do tornozelo
    cortar_e_apagar(ob, (0, 0, TENIS_ALTO), (0, 0, 1), apagar_acima=True)
    ob.data.materials.append(M['tenis']); ob.data.materials.append(M['sola'])
    for p in ob.data.polygons:
        p.material_index = 1 if (p.center.z < 0.018 or p.normal.z < -0.7) else 0
        p.use_smooth = True
    while ob.data.uv_layers: ob.data.uv_layers.remove(ob.data.uv_layers[0])
TOPO_TENIS = max(max(p.z for p in V(ob)) for ob in pares.values())

# ------------------------------------------------------------- 3. O ESQUELETO
arm_data = bpy.data.armatures.new('esqueleto')
arm = bpy.data.objects.new('esqueleto', arm_data)
col.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones
def osso(nome, cab, cauda, pai=None):
    b = eb.new(nome); b.head = Vector(cab); b.tail = Vector(cauda)
    if pai: b.parent = eb[pai]; b.use_connect = False
    return b
P_ = JUN
osso('pelvis', P_['pelvis'], P_['tronco'])
osso('tronco', P_['tronco'], P_['pescoco'], 'pelvis')
pesc_alto = Vector((0, anel_corpo.y + 0.004, queixoZ + 0.012))
osso('pescoco', P_['pescoco'], pesc_alto, 'tronco')
osso('cabeca', pesc_alto, Vector((0, CY, topoZ)), 'pescoco')
for L in ('D', 'E'):
    osso('ombro.'+L, P_['ombro.'+L], P_['cotovelo.'+L], 'tronco')
    osso('cotovelo.'+L, P_['cotovelo.'+L], P_['mao.'+L], 'ombro.'+L)
    osso('mao.'+L, P_['mao.'+L], P_['dedos.'+L], 'cotovelo.'+L)
    osso('quadril.'+L, P_['quadril.'+L], P_['joelho.'+L], 'pelvis')
    osso('joelho.'+L, P_['joelho.'+L], P_['pe.'+L], 'quadril.'+L)
    osso('pe.'+L, P_['pe.'+L], P_['ponta.'+L], 'joelho.'+L)
bpy.ops.object.mode_set(mode='OBJECT')
# os pesos automáticos (calor) do Blender
for x in bpy.context.selected_objects: x.select_set(False)
corpo.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# ---- O PEITO É DO TRONCO: o peso de calor dava ombro demais ao peitoral e ao
# trapézio, e o braço cruzado inflava o peito. No tronco (|x| < 0,19, acima da
# cintura) o peso do braço cai suave até zero perto do meio, e o tronco fica
# com o resto.
def suave(a, b, x):
    t = max(0.0, min(1.0, (x - a)/(b - a))); return t*t*(3 - 2*t)
gi_ = {g.name: g.index for g in corpo.vertex_groups}
for v in corpo.data.vertices:
    if v.co.z < 1.05 or abs(v.co.x) > 0.25: continue
    L = 'D' if v.co.x < 0 else 'E'
    k = suave(0.11, 0.20, abs(v.co.x))
    # e o alto do ombro é meio braço, meio tronco: sem isso o deltoide estufa com o braço cruzado
    k *= 1 - 0.5*suave(1.26, 1.38, v.co.z)
    tirado = 0.0
    for g in v.groups:
        nome = corpo.vertex_groups[g.group].name
        if nome.startswith(('ombro.', 'cotovelo.', 'mao.')):
            novo = g.weight*k; tirado += g.weight - novo; g.weight = novo
    if tirado > 0:
        corpo.vertex_groups['tronco'].add([v.index], tirado + sum(g.weight for g in v.groups if g.group == gi_['tronco']), 'REPLACE')

# ---- os braços pendurados: gira na pose, assenta a malha e faz disso o repouso
def girar(nome, para):
    bpy.context.view_layer.update()
    pb = arm.pose.bones[nome]
    d = (pb.tail - pb.head).normalized(); t = Vector(para).normalized()
    q = d.rotation_difference(t)
    h = pb.head.copy()
    pb.matrix = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ pb.matrix
    bpy.context.view_layer.update()
for L, s in (('D', -1), ('E', 1)):
    girar('ombro.'+L, (s*0.17, 0.0, -1.0))
    girar('cotovelo.'+L, (s*0.05, -0.12, -1.0))
    girar('mao.'+L, (s*0.03, -0.05, -1.0))
mod = next(m for m in corpo.modifiers if m.type == 'ARMATURE')
bpy.context.view_layer.objects.active = corpo
bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.armature_apply(selected=False)
bpy.ops.object.mode_set(mode='OBJECT')
mod = corpo.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
# as juntas novas (o repouso agora é com o braço pendurado)
JUN2 = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in arm_data.bones}

# ------------------------------------------------------------- 4. A ROUPA
me = corpo.data
gi = {g.index: g.name for g in corpo.vertex_groups}
BRACO_G = ('ombro', 'cotovelo', 'mao')
def peso_braco(v):
    return sum(g.weight for g in v.groups if gi.get(g.group, '').startswith(BRACO_G))

OMB = {s: JUN2['ombro.' + ('D' if s < 0 else 'E')][0] for s in (-1, 1)}
COT = {s: JUN2['cotovelo.' + ('D' if s < 0 else 'E')][0] for s in (-1, 1)}
EIXO = {s: (OMB[s] - COT[s]).normalized() for s in (-1, 1)}         # aponta pro ombro
MANGA = {s: OMB[s].lerp(COT[s], 0.48) for s in (-1, 1)}
PUNHO, PUNHO2 = 0.017, 0.008
BARRA = 0.006           # a altura da borda do pano (o lado de baixo da barra)
BAINHA = JUN2['pelvis'][0].z + 0.03
ALT_OMBRO = (OMB[-1].z + OMB[1].z)/2
FAIXA_Z = (ALT_OMBRO - 0.170, ALT_OMBRO - 0.115)
CALCAO = JUN2['joelho.E'][0].z + 0.10
MEIA = TOPO_TENIS + 0.05
# a gola desce na frente (até a fúrcula) e sobe atrás: o centro dela vai 1,2 cm pra frente
GOLA_C = Vector((0, anel_corpo.y - 0.012, 0)); GOLA_RX, GOLA_RY, GOLA_FAIXA, GOLA_LADOS = 0.080, 0.082, 0.015, 12
GOLA_Z0 = Z_CORTE_CORPO - 0.10
def planos_gola(folga):
    ps = []
    for k in range(GOLA_LADOS):
        a = 2*math.pi*k/GOLA_LADOS
        rx, ry = GOLA_RX + folga, GOLA_RY + folga
        n = Vector((math.cos(a)/rx, math.sin(a)/ry, 0)).normalized()
        ps.append((a, Vector((GOLA_C.x + rx*math.cos(a), GOLA_C.y + ry*math.sin(a), 0)), n))
    return ps
def dentro_gola(c, folga=0.0):
    if c.z < GOLA_Z0: return False
    return all((Vector((c.x, c.y, 0)) - q).dot(n) < 0 for _, q, n in planos_gola(folga))

def cortar_roupa():
    bm = bmesh.new(); bm.from_mesh(me)
    dl = bm.verts.layers.deform.active
    def eh_braco_f(f):
        return sum(1 for v in f.verts if sum(w for g, w in v[dl].items() if gi.get(g, '').startswith(BRACO_G)) > 0.5)*2 > len(f.verts)
    def corte(co, no, filtro=None):
        faces = [f for f in bm.faces if (filtro is None or filtro(f))]
        geom = list(set(faces) | set(e for f in faces for e in f.edges) | set(v for f in faces for v in f.verts))
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no, clear_outer=False, clear_inner=False)
    Z = Vector((0, 0, 1))
    for s in (-1, 1):
        for off in (0.0, PUNHO2, PUNHO):
            co = MANGA[s] + EIXO[s]*off
            perto = lambda f, s=s, co=co: f.calc_center_median().x*s > 0 and abs((f.calc_center_median() - co).dot(EIXO[s])) < 0.035 and eh_braco_f(f)
            corte(co, EIXO[s], perto)
    for folga in (0.0, GOLA_FAIXA):
        for a, q, n in planos_gola(folga):
            def setor(f, a=a, folga=folga):
                c = f.calc_center_median()
                if c.z < GOLA_Z0 or c.z > Z_CORTE_CORPO or abs(c.x) > 0.17: return False
                # só as faces perto da linha da gola (as outras ficam inteiras)
                r = math.hypot(c.x/(GOLA_RX + folga), (c.y - GOLA_C.y)/(GOLA_RY + folga))
                if abs(r - 1) > 0.30: return False
                b = math.atan2((c.y - GOLA_C.y)/GOLA_RY, c.x/GOLA_RX)
                return abs((b - a + math.pi) % (2*math.pi) - math.pi) < 1.5*2*math.pi/GOLA_LADOS
            corte(q, n, setor)
    tronco = lambda f: not eh_braco_f(f)
    corte(Vector((0, 0, BAINHA)), Z, tronco)
    corte(Vector((0, 0, FAIXA_Z[0])), Z, tronco); corte(Vector((0, 0, FAIXA_Z[1])), Z, tronco)
    corte(Vector((0, 0, CALCAO)), Z); corte(Vector((0, 0, MEIA)), Z)
    # os anéis de baixo das barras: o vão entre eles e a barra é a borda do pano
    perna_ = lambda f: not eh_braco_f(f) and f.calc_center_median().z < BAINHA
    corte(Vector((0, 0, CALCAO - BARRA)), Z, perna_)
    corte(Vector((0, 0, BAINHA - BARRA)), Z, tronco)
    bm.to_mesh(me); bm.free()
cortar_roupa()
braco_v = [peso_braco(v) > 0.5 for v in me.vertices]
def face_braco(p): return sum(braco_v[i] for i in p.vertices)*2 > len(p.vertices)

for m in ('pele', 'camisa', 'faixa', 'gola', 'punho', 'punho2', 'calca', 'meia'):
    me.materials.append(M[m])
IDX = {m.name: k for k, m in enumerate(me.materials)}
def material_da_face(p):
    c = p.center
    if c.z > Z_CORTE_CORPO + 0.004: return 'pele'                      # pescoço e cabeça
    if face_braco(p) and c.z > BAINHA - 0.05:
        s = -1 if c.x < 0 else 1
        d = (c - MANGA[s]).dot(EIXO[s])
        if d <= 0: return 'pele'
        return 'punho2' if d < PUNHO2 else 'punho' if d < PUNHO else 'camisa'
    if face_braco(p): return 'pele'                                      # a mão perto da coxa
    if dentro_gola(c): return 'pele'
    if dentro_gola(c, GOLA_FAIXA): return 'gola'
    if c.z >= BAINHA - BARRA: return 'faixa' if FAIXA_Z[0] <= c.z <= FAIXA_Z[1] else 'camisa'
    if c.z >= CALCAO - BARRA: return 'calca'
    if c.z >= MEIA: return 'pele'
    return 'meia'
for p in me.polygons:
    p.material_index = IDX[material_da_face(p)]
    p.use_smooth = True

def engrossar():
    """O PANO TEM CORPO (06/10/2026). A camisa fica 4 mm por fora e a barra
    dela abre até 1,1 cm, por cima do calção. O CALÇÃO É FOLGADO: 4 mm na
    cintura, crescendo até 2,4 cm na boca da perna (menos na parte de dentro
    da coxa, pra uma perna não entrar na outra). Os anéis logo abaixo das
    duas barras ficam na pele (ou no calção, embaixo da camisa): a face entre
    eles e a barra é a borda do pano, vista por baixo."""
    ROUPA = {IDX[m] for m in ('camisa', 'faixa', 'gola', 'punho', 'punho2')}
    CAL = IDX['calca']
    # a redução deixa o fundo do calção com triângulos de 15 cm: um vértice
    # afundado no início do vinco das nádegas puxava uma aresta comprida e
    # desenhava uma linha. Subdivide o calção uma vez antes de vestir.
    global braco_v
    # Só no modelo leve (o detalhado já é denso) e só na faixa do quadril,
    # onde ficam as nádegas e o gancho.
    if LEVE:
        bm = bmesh.new(); bm.from_mesh(me)
        z_quadril = JUN2['pelvis'][0].z - 0.16
        arestas = list({e for f in bm.faces if f.material_index == CAL and f.calc_center_median().z > z_quadril for e in f.edges})
        bmesh.ops.subdivide_edges(bm, edges=arestas, cuts=1, use_grid_fill=True)
        bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
        bm.to_mesh(me); bm.free(); me.update()
    braco_v = [peso_braco(v) > 0.5 for v in me.vertices]
    mats = [set() for _ in me.vertices]
    for p in me.polygons:
        for vi in p.vertices: mats[vi].add(p.material_index)
    # O PANO ESTICADO NO QUADRIL (06/10/2026: "ajuste o gancho do calção
    # também, no fundo o calção marca as nádegas ainda"). O pano não entra
    # nas reentrâncias do corpo: em cada fatia de 2 cm do quadril, acima do
    # gancho, os vértices do calção vão pro contorno convexo da fatia — some o
    # vinco entre as nádegas — e, na frente, entre o gancho e 14 cm acima
    # dele, o que passa do contorno das laterais volta pra ele — some o volume
    # marcado do gancho. Abaixo do gancho, cada perna é a sua fatia.
    def casco(pts):
        pts = sorted(set(pts))
        if len(pts) < 3: return pts
        def cr(o, a, b): return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
        lo, hi = [], []
        for q in pts:
            while len(lo) >= 2 and cr(lo[-2], lo[-1], q) <= 0: lo.pop()
            lo.append(q)
        for q in reversed(pts):
            while len(hi) >= 2 and cr(hi[-2], hi[-1], q) <= 0: hi.pop()
            hi.append(q)
        return lo[:-1] + hi[:-1]
    def raio_no_casco(c, d, poly):
        # a distância do centro c até a borda do polígono na direção d
        melhor = None
        for i in range(len(poly)):
            a, b = poly[i], poly[(i+1) % len(poly)]
            ex, ey = b[0]-a[0], b[1]-a[1]
            den = d[0]*ey - d[1]*ex
            if abs(den) < 1e-9: continue
            t = ((a[0]-c[0])*ey - (a[1]-c[1])*ex)/den
            u = ((a[0]-c[0])*d[1] - (a[1]-c[1])*d[0])/den
            if t > 0 and -1e-6 <= u <= 1+1e-6: melhor = t if melhor is None else min(melhor, t)
        return melhor
    so_calcao = [i for i, ms in enumerate(mats) if CAL in ms and ms <= {CAL}]
    pts_c = [me.vertices[i].co for i in so_calcao]
    # o gancho é o fundo do corpo entre as pernas: as faces do meio que olham
    # pra baixo (a coxa de dentro, encostada, não conta — ela olha pro lado)
    fundo = [p.center.z for p in me.polygons if p.material_index == CAL and abs(p.center.x) < 0.03
             and p.normal.z < -0.45 and CALCAO < p.center.z < BAINHA]
    GANCHO = sorted(fundo)[len(fundo)//2] if fundo else (CALCAO + BAINHA)/2
    zona = [i for i in so_calcao if CALCAO + 0.006 < me.vertices[i].co.z < BAINHA - BARRA - 0.004]
    # a camisa embaixo também não entra no vinco da coluna, até a altura do umbigo
    so_camisa = [i for i, ms in enumerate(mats) if ms & ROUPA and not braco_v[i] and BAINHA - BARRA - 0.002 < me.vertices[i].co.z < BAINHA + 0.22]
    parte_de = lambda q: 0 if q.z > GANCHO + 0.004 else (1 if q.x > 0 else -1)
    orig = {i: me.vertices[i].co.copy() for i in so_calcao + so_camisa}
    ehcam = set(so_camisa)
    cache = {}
    novos_xy = {}
    for i in zona + so_camisa:
        q = orig[i]; cam = i in ehcam
        pt = 'c' if cam else parte_de(q)
        chave = (round(q.z*200), pt)            # janelas a cada 0,5 cm, com ±2,5 cm de altura
        if chave not in cache:
            viz = [orig[k] for k in (so_camisa if cam else so_calcao) if abs(orig[k].z - q.z) < 0.025 and (cam or parte_de(orig[k]) == pt)]
            if len(viz) < 6: cache[chave] = None
            else:
                cx = sum(v.x for v in viz)/len(viz); cy = sum(v.y for v in viz)/len(viz)
                frente_gancho = (not cam) and pt == 0 and q.z < GANCHO + 0.14
                lat = [v for v in viz if not (frente_gancho and abs(v.x) < 0.06 and v.y < cy - 0.02)]
                cache[chave] = (cx, cy, casco([(v.x, v.y) for v in (viz)]), casco([(v.x, v.y) for v in (lat if len(lat) >= 3 else viz)]), frente_gancho)
        dado = cache[chave]
        if not dado: continue
        cx, cy, poly, poly_lat, frente_gancho = dado
        dx, dy = q.x - cx, q.y - cy
        r = math.hypot(dx, dy)
        if r < 1e-6 or len(poly) < 3: continue
        bojo = frente_gancho and abs(q.x) < 0.06 and q.y < cy - 0.02
        if bojo:
            R = raio_no_casco((cx, cy), (dx/r, dy/r), poly_lat)
            if R is None or r <= R: continue
            alvo = max(R, r - 0.012)                       # aplaina o volume do gancho, no máximo 1,2 cm
        else:
            R = raio_no_casco((cx, cy), (dx/r, dy/r), poly)
            if R is None or r >= R: continue
            alvo = min(R, r + 0.03)                        # o pano cobre o vinco, até 3 cm
        novos_xy[i] = (cx + dx/r*alvo, cy + dy/r*alvo)
    for i, (x, y) in novos_xy.items():
        me.vertices[i].co.x, me.vertices[i].co.y = x, y
    me.update()
    def folga_calcao(v):
        t = max(0.0, min(1.0, (BAINHA - BARRA - v.co.z)/max(1e-3, (BAINHA - BARRA) - CALCAO)))
        d = 0.004 + 0.020*t**1.3
        dentro = -v.normal.x*(1 if v.co.x > 0 else -1)          # a normal aponta pro meio das pernas
        if dentro > 0.3:
            # perto do gancho as coxas de dentro se encostam (a costura da
            # bermuda fica mais baixa que o corpo); mais embaixo, menos folga
            # dentro, pra uma perna não entrar na outra
            perto = max(0.0, min(1.0, 1 - (GANCHO - v.co.z)/0.07))
            if perto > 0: d += 0.022*perto*min(1.0, (dentro - 0.3)/0.4)
            else: d *= 1 - 0.55*min(1.0, (dentro - 0.3)/0.5)
        return d
    novos_ = []
    for v in me.vertices:
        ms = mats[v.index]
        z = v.co.z
        if CAL in ms and z < BAINHA - BARRA + 0.0015 and z > CALCAO - BARRA + 0.0015:
            d = folga_calcao(v)                                   # o calção, até a barra
        elif CAL in ms and z >= BAINHA - BARRA - 0.0015 and z < BAINHA - 0.0015:
            d = 0.004                                              # o anel embaixo da barra da camisa
        elif ms & ROUPA:
            d = 0.004
            if z < BAINHA + 0.06 and not face_braco_v(v.index):   # a barra da camisa abre um pouco
                d += 0.007*max(0.0, min(1.0, (BAINHA + 0.06 - z)/0.06))
            if IDX['pele'] in ms: d *= 0.5                         # gola e boca da manga: rampa
        else:
            d = 0.0
        novos_.append(v.co + v.normal*d)
    for v, p in zip(me.vertices, novos_): v.co = p
    me.update()
    # o calção cai como pano: alisa os vértices dele (sem as barras), o que
    # tira o vinco fundo do gancho e as dobras da pele que ele copiava
    bm = bmesh.new(); bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    alisar = [bm.verts[i] for i, ms in enumerate(mats)
              if CAL in ms and ms <= {CAL} and CALCAO + 0.004 < bm.verts[i].co.z < BAINHA - BARRA - 0.004]
    for _ in range(6):
        bmesh.ops.smooth_vert(bm, verts=alisar, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=False)
    # em volta do gancho o vinco é vertical (a virilha, o fundo das nádegas):
    # ali o alisamento mexe também na altura
    gancho_ = [v for v in alisar if GANCHO - 0.06 < v.co.z < GANCHO + 0.12 and abs(v.co.x) < 0.13]
    for _ in range(10):
        bmesh.ops.smooth_vert(bm, verts=gancho_, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.to_mesh(me); bm.free(); me.update()
def face_braco_v(i): return braco_v[i]
engrossar()
# A DIVISA ENTRE PANO E PELE É ARESTA VIVA: as faces da borda do pano são
# quase verticais e, com a normal suavizada, a pele logo abaixo da barra do
# calção (e da manga) herdava a sombra delas em riscos
_bm = bmesh.new(); _bm.from_mesh(me)
for e in _bm.edges:
    fs = e.link_faces
    if len(fs) == 2 and fs[0].material_index != fs[1].material_index and IDX['pele'] in (fs[0].material_index, fs[1].material_index):
        e.smooth = False
_bm.to_mesh(me); _bm.free(); me.update()

# ------------------------------------------------------------- 5. A PELE
def pele_de_detalhe():
    """a textura do MakeHuman dividida pelo tom de fundo dela: 1 = pele lisa,
    menos que 1 = sombra, lábio, barba rala; a sobrancelha pintada por cima"""
    import numpy as np
    from PIL import Image, ImageDraw
    w, h = IMG_PELE.size
    a = np.array(IMG_PELE.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1, :, :3]   # de cima pra baixo
    base = np.median(a[5:40, 5:40].reshape(-1, 3), axis=0)                            # o fundo liso do atlas
    det = np.clip(a / base * 0.96, 0, 1)
    det = 1 - (1 - det)*0.75            # a barba rala do modelo é forte: três quartos dela
    # A COSTURA SEM DEGRAU (06/10/2026): o corpo todo aponta pro texel liso
    # (UV_LISO), e o pescoço da cabeça, pro atlas dele, que ali é um tom
    # um pouco diferente — de perto aparecia uma linha. O texel liso ganha o
    # tom médio da pele do pescoço logo acima da costura.
    uvC0 = cab_densa.uv_layers[0]
    z_cost = Z_CORTE_CORPO + 0.016
    amostras = []
    for p in cab_densa.polygons:
        if z_cost + 0.006 < p.center.z < z_cost + 0.030:
            for li in p.loop_indices:
                u, v = uvC0.data[li].uv
                x = min(w - 1, max(0, int(u*w))); y = min(h - 1, max(0, int((1 - v)*h)))
                amostras.append(det[y, x])
    if amostras:
        tom = np.median(np.array(amostras), axis=0)
        cx, cy = int(UV_LISO[0]*w), int((1 - UV_LISO[1])*h)
        r = max(8, w//64)
        det[max(0, cy - r):cy + r, max(0, cx - r):cx + r] = tom
        print('costura: tom do pescoço %s' % [round(float(x), 3) for x in tom])
    im = Image.fromarray((det*255).astype(np.uint8), 'RGB')
    # A SOBRANCELHA: pontos do arco na superfície da cabeça densa → UV pelo vértice mais perto
    uvC = cab_densa.uv_layers[0]
    por_v = {}
    for p in cab_densa.polygons:
        for li in p.loop_indices: por_v[cab_densa.loops[li].vertex_index] = tuple(uvC.data[li].uv)
    def uv_de(p3):
        i = min(range(len(_verts)), key=lambda k: (_verts[k].co - p3).length_squared)
        u, v = por_v.get(i, (0, 0))
        return (u*w, (1 - v)*h)
    d = ImageDraw.Draw(im)
    rnd = random.Random(5)
    for s in (-1, 1):
        oc = OLHOS_C[s]
        arco = []
        for k in range(9):
            t = k/8
            x = oc.x + s*(-0.017 + 0.037*t)
            z = oc.z + 0.019 + 0.006*math.sin(math.pi*t) - 0.004*t
            cands = [v.co for v in _verts if abs(v.co.x - x) < 0.005 and abs(v.co.z - z) < 0.005]
            if cands: arco.append((t, min(cands, key=lambda c: c.y)))
        if len(arco) < 3: continue
        pts = [uv_de(c) for _, c in arco]
        esc = w/2048
        for k in range(len(pts) - 1):
            t = arco[k][0]
            d.line([pts[k], pts[k+1]], fill=(120, 92, 78), width=max(2, int((9 - 5*t)*esc)))
        for k in range(220):
            j = rnd.randrange(len(pts) - 1); f = rnd.random()
            x0 = pts[j][0] + (pts[j+1][0] - pts[j][0])*f; y0 = pts[j][1] + (pts[j+1][1] - pts[j][1])*f
            y0 += rnd.uniform(-3, 3)*esc
            Lh = (5 + rnd.random()*6)*esc
            dx, dy = pts[j+1][0] - pts[j][0], pts[j+1][1] - pts[j][1]
            ang = math.atan2(dy, dx) + rnd.uniform(-0.5, 0.5)
            d.line([(x0, y0), (x0 + Lh*math.cos(ang), y0 + Lh*math.sin(ang))], fill=(58, 42, 34), width=max(1, int(1.6*esc)))
    N = 1024 if LEVE else 2048
    im = im.resize((N, N), Image.LANCZOS)
    im.save(SAIDA_PELE)
    img = bpy.data.images.load(SAIDA_PELE)
    nt = M['pele'].node_tree
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img
    nt.links.new(tex.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
    print('pele de detalhe: %dx%d, fundo %s' % (N, N, [round(float(x), 3) for x in base]))
pele_de_detalhe()

# ------------------------------------------------------------- 6. AS VARIANTES
def esfera(nome, x, y, z, rx, ry, rz, mat, seg=24, an=16, rot=(0,0,0)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=an, radius=1.0)
    R = mathutils.Euler(rot).to_matrix()
    for v in bm.verts:
        v.co = R @ Vector((v.co.x*rx, v.co.y*ry, v.co.z*rz)) + Vector((x, y, z))
    me_ = bpy.data.meshes.new(nome); bm.to_mesh(me_); bm.free()
    for p in me_.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me_); col.objects.link(ob)
    me_.materials.append(M[mat])
    return ob
def tubo(nome, pontos, raio, mat, seg=10):
    bm = bmesh.new(); aneis = []
    for i, p in enumerate(pontos):
        p = Vector(p)
        d = (Vector(pontos[min(i+1, len(pontos)-1)]) - Vector(pontos[max(i-1, 0)])).normalized()
        u = d.cross(Vector((0, 0, 1))); u = u.normalized() if u.length > 1e-6 else Vector((1, 0, 0))
        w = d.cross(u).normalized()
        r = raio[i] if isinstance(raio, (list, tuple)) else raio
        aneis.append([bm.verts.new(p + (u*math.cos(a) + w*math.sin(a))*r) for a in [2*math.pi*k/seg for k in range(seg)]])
    for i in range(len(aneis)-1):
        for k in range(seg):
            bm.faces.new((aneis[i][k], aneis[i+1][k], aneis[i+1][(k+1)%seg], aneis[i][(k+1)%seg]))
    bmesh.ops.contextual_create(bm, geom=aneis[0]); bmesh.ops.contextual_create(bm, geom=aneis[-1])
    me_ = bpy.data.meshes.new(nome); bm.to_mesh(me_); bm.free()
    for p in me_.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me_); col.objects.link(ob)
    me_.materials.append(M[mat])
    return ob
def caixa(nome, x, y, z, sx, sy, sz, mat, rot=(0,0,0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x*sx, v.co.y*sy, v.co.z*sz))
    me_ = bpy.data.meshes.new(nome); bm.to_mesh(me_); bm.free()
    ob = bpy.data.objects.new(nome, me_); col.objects.link(ob)
    ob.location = (x, y, z); ob.rotation_euler = rot
    me_.materials.append(M[mat])
    return ob
def toro(nome, x, y, z, raio, esp, mat, rot=(0,0,0), segs=32, anel=10):
    bm = bmesh.new(); verts = []
    for i in range(segs):
        a = 2*math.pi*i/segs
        for j in range(anel):
            b = 2*math.pi*j/anel
            r = raio + esp*math.cos(b)
            verts.append(bm.verts.new((r*math.cos(a), r*math.sin(a), esp*math.sin(b))))
    for i in range(segs):
        for j in range(anel):
            bm.faces.new((verts[i*anel+j], verts[((i+1)%segs)*anel+j], verts[((i+1)%segs)*anel+(j+1)%anel], verts[i*anel+(j+1)%anel]))
    me_ = bpy.data.meshes.new(nome); bm.to_mesh(me_); bm.free()
    for p in me_.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me_); col.objects.link(ob)
    ob.location = (x, y, z); ob.rotation_euler = rot
    me_.materials.append(M[mat])
    return ob
def tampa(nome, mat, sel, desloc, ruido=0.0, semente=1):
    """uma casca feita das faces da cabeça densa que passam em `sel(centro, normal)`,
    deslocada `desloc` pra fora — cabelo, boné, barba assentam perfeitos"""
    rnd = random.Random(semente)
    bm = bmesh.new(); bm.from_mesh(cab_densa)
    bm.normal_update()
    tirar = [f for f in bm.faces if not sel(f.calc_center_median(), f.normal)]
    bmesh.ops.delete(bm, geom=tirar, context='FACES')
    bm.normal_update()
    for v in bm.verts:
        d = desloc(v.co, v.normal) if callable(desloc) else desloc
        v.co = v.co + v.normal*(d + (rnd.random()-0.5)*ruido)
    res = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    for g in res['geom']:
        if isinstance(g, bmesh.types.BMVert):
            d = desloc(g.co, g.normal) if callable(desloc) else desloc
            g.co = g.co - g.normal*(d*0.9)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    me_ = bpy.data.meshes.new(nome); bm.to_mesh(me_); bm.free()
    while me_.uv_layers: me_.uv_layers.remove(me_.uv_layers[0])
    for p in me_.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me_); col.objects.link(ob)
    me_.materials.clear(); me_.materials.append(M[mat])
    reduzir(ob, 520 if LEVE else 3000)
    return ob
def superficie_frente(x, z, folga=0.02):
    cands = [v for v in _verts if abs(v.co.x - x) < folga and abs(v.co.z - z) < folga]
    return min(cands, key=lambda v: v.co.y).co.copy()
def superficie_lado(y, z, sx, folga=0.02):
    cands = [v for v in _verts if abs(v.co.y - y) < folga and abs(v.co.z - z) < folga and v.co.x*sx > 0]
    return max(cands, key=lambda v: v.co.x*sx).co.copy()
ORBITA = {s: OLHOS_C[s] for s in (-1, 1)}

var = []
topo = lambda n: max(0.0, n.z)
frente = lambda n: max(0.0, -n.y)
TESTA = 0.060           # a linha do cabelo na testa, acima do olho
def hairline(c, n, testa=TESTA, lados=0.016, nuca=-0.034):
    f = frente(n)
    lim = olhosZ + testa*f + lados*(1-f) + nuca*max(0.0, n.y)
    return n.z > -0.4 and c.z > lim
acima_do_cabelo = hairline
def franja_sel(c, n): return hairline(c, n, testa=0.036) or (frente(n) > 0.6 and c.z > olhosZ + 0.030 and abs(c.x) < 0.05)
def entradas_sel(c, n): return hairline(c, n) and not (frente(n) > 0.4 and abs(c.x) > 0.032 and c.z < olhosZ + 0.095)
var.append(tampa('cabelo_curto', 'cabelo', acima_do_cabelo, 0.006, 0.002, 1))
var.append(tampa('cabelo_raspado', 'cabelo', acima_do_cabelo, 0.0022, 0.0005, 2))
var.append(tampa('cabelo_black', 'cabelo', acima_do_cabelo, 0.030, 0.012, 3))
var.append(tampa('cabelo_cacheado', 'cabelo', acima_do_cabelo, 0.014, 0.010, 12))
var.append(tampa('cabelo_degrade', 'cabelo', acima_do_cabelo, lambda c, n: 0.0015 + 0.009*topo(n)**2, 0.0008, 13))
var.append(tampa('cabelo_topete', 'cabelo', acima_do_cabelo, lambda c, n: 0.004 + 0.026*max(0.0, (c.z - olhosZ - 0.07)/0.05)*frente(n)*topo(n)*2, 0.002, 14))
var.append(tampa('cabelo_franja', 'cabelo', franja_sel, lambda c, n: 0.007 + 0.004*frente(n), 0.002, 15))
var.append(tampa('cabelo_entradas', 'cabelo', entradas_sel, 0.005, 0.0015, 16))
var.append(tampa('cabelo_moicano', 'cabelo', acima_do_cabelo, 0.0022, 0.0005, 4))
var.append(tampa('cabelo_moicano_crista', 'cabelo', lambda c, n: acima_do_cabelo(c, n) and abs(c.x) < 0.014 and n.z > 0.3, 0.045, 0.006, 5))
var.append(tampa('cabelo_comprido', 'cabelo', lambda c, n: acima_do_cabelo(c, n) or (n.y > 0.3 and c.z > olhosZ - 0.06), 0.009, 0.003, 6))
var.append(caixa('cabelo_comprido_nuca', 0, CY + 0.075, olhosZ - 0.075, 0.13, 0.05, 0.12, 'cabelo'))
var.append(tampa('cabelo_rabo', 'cabelo', acima_do_cabelo, 0.005, 0.001, 17))
_tras = max(v.co.y for v in _verts if v.co.z > olhosZ)
var.append(esfera('cabelo_rabo_elastico', 0, _tras + 0.006, olhosZ + 0.045, 0.014, 0.010, 0.012, 'cabelo'))
var.append(esfera('cabelo_rabo_ponta', 0, _tras + 0.030, olhosZ - 0.010, 0.016, 0.026, 0.060, 'cabelo', 14, 10, (0.55, 0, 0)))
var.append(tampa('cabelo_coque', 'cabelo', acima_do_cabelo, 0.005, 0.001, 18))
var.append(esfera('cabelo_coque_bola', 0, CY, topoZ + 0.020, 0.030, 0.030, 0.024, 'cabelo', 14, 10))
if not LEVE:
    def copa(c, n): return c.z > olhosZ + 0.045 - 0.012*max(0.0, n.y) and n.z > -0.3
    var.append(tampa('bone_copa', 'bone', copa, 0.012, 0.0, 7))
    def aba(nome, tras):
        bm = bmesh.new()
        s = -1 if not tras else 1
        base = superficie_frente(0, olhosZ + 0.050) if not tras else Vector((0, _tras, olhosZ + 0.050))
        z0 = olhosZ + 0.051
        linhas = []
        for i in range(7):
            t = i/6.0
            y = base.y + s*(0.010 + 0.075*t)
            linha = []
            for k in range(9):
                u = -1 + 2*k/8
                linha.append(bm.verts.new((u*(0.078 + 0.02*t), y, z0 - 0.006*t*t*4 - 0.010*u*u)))
            linhas.append(linha)
        for i in range(6):
            for k in range(8):
                bm.faces.new((linhas[i][k], linhas[i][k+1], linhas[i+1][k+1], linhas[i+1][k]))
        res = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
        for g in res['geom']:
            if isinstance(g, bmesh.types.BMVert): g.co.z -= 0.004
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        me_ = bpy.data.meshes.new(nome); bm.to_mesh(me_); bm.free()
        for p in me_.polygons: p.use_smooth = True
        ob = bpy.data.objects.new(nome, me_); col.objects.link(ob)
        me_.materials.append(M['bone'])
        return ob
    var.append(aba('bone_aba', False))
    var.append(aba('bone_aba_tras', True))
    var.append(toro('bandana', 0, CY, olhosZ + 0.045, superficie_lado(CY, olhosZ + 0.045, 1).x + 0.004, 0.011, 'faixa'))
    var.append(caixa('bandana_ponta', 0.025, _tras + 0.006, olhosZ, 0.028, 0.012, 0.07, 'faixa', (0.3, 0, 0)))
    def na_barba(c, n): return c.z < olhosZ - 0.060 and c.z > queixoZ - 0.012 and n.y < 0.35 and n.z < 0.5 and not (abs(c.x) < 0.024 and c.z > olhosZ - 0.085 and n.y < -0.5)
    var.append(tampa('barba_cheia', 'cabelo', na_barba, 0.004, 0.0015, 9))
    var.append(tampa('barba_cavanhaque', 'cabelo', lambda c, n: na_barba(c, n) and abs(c.x) < 0.024 and n.y < -0.3, 0.004, 0.0015, 10))
    var.append(tampa('barba_bigode', 'cabelo', lambda c, n: abs(c.x) < 0.026 and olhosZ - 0.080 < c.z < olhosZ - 0.066 and n.y < -0.5, 0.003, 0.001, 11))
    def oculos(prefixo, mat_aro, com_lente):
        for sx in (-1, 1):
            oc = ORBITA[sx].copy(); oc.y = superficie_frente(oc.x, oc.z, 0.01).y - 0.012
            pts = [(oc.x + 0.020*math.cos(a), oc.y, oc.z + 0.015*math.sin(a)) for a in [2*math.pi*k/24 for k in range(25)]]
            var.append(tubo(prefixo + '_aro%s' % sx, pts, 0.0014, mat_aro, 8))
            if com_lente: var.append(esfera(prefixo + '_lente%s' % sx, oc.x, oc.y, oc.z, 0.019, 0.001, 0.014, 'lente'))
            else: var.append(esfera(prefixo + '_lente%s' % sx, oc.x, oc.y + 0.001, oc.z, 0.020, 0.002, 0.015, 'escuros'))
            eo = superficie_lado(CY, olhosZ + 0.004, sx)
            var.append(tubo(prefixo + '_haste%s' % sx, [(oc.x + sx*0.021, oc.y, oc.z + 0.004), (eo.x + sx*0.003, oc.y + 0.03, eo.z + 0.004), (eo.x + sx*0.003, CY + 0.02, eo.z - 0.004)], 0.0012, mat_aro, 6))
        ponte = superficie_frente(0, olhosZ + 0.004); ponte.y -= 0.010
        var.append(tubo(prefixo + '_ponte', [(-0.013, ponte.y, ponte.z), (0, ponte.y - 0.002, ponte.z + 0.002), (0.013, ponte.y, ponte.z)], 0.0012, mat_aro, 6))
    oculos('oculos_grau', 'armacao', True)
    oculos('oculos_escuros', 'escuros', False)
    eo = superficie_lado(CY, olhosZ - 0.030, -1)
    var.append(toro('brinco', eo.x - 0.003, eo.y, olhosZ - 0.045, 0.0045, 0.0012, 'metal', (0, math.pi/2, 0)))
    var.append(toro('corrente', 0, anel_corpo.y - 0.005, Z_CORTE_CORPO - 0.010, 0.080, 0.004, 'metal', (0.35, 0, 0)))
# o cordão grosso e a medalha caem no peito: a frente do peito medida no corpo
frente_peito = min(v.co.y for v in me.vertices if abs(v.co.x) < 0.06 and abs(v.co.z - (ALT_OMBRO - 0.06)) < 0.03)
var.append(toro('cordao_grosso', 0, frente_peito + 0.060, ALT_OMBRO + 0.015, 0.110, 0.0075, 'metal', (0.78, 0, 0), 40, 12))
var.append(esfera('cordao_medalha', 0, frente_peito - 0.008, ALT_OMBRO - 0.075, 0.020, 0.004, 0.024, 'metal'))
# relógio (pulso D), pulseira (pulso E) e anel: no punho de cada lado, já pendurado
pulso = {L: JUN2['mao.' + L][0] for L in ('D', 'E')}
dedo = {L: JUN2['mao.' + L][1] for L in ('D', 'E')}
var.append(toro('relogio_pulseira', pulso['D'].x, pulso['D'].y, pulso['D'].z + 0.012, 0.031, 0.007, 'pulseira'))
var.append(caixa('relogio_mostrador', pulso['D'].x, pulso['D'].y - 0.028, pulso['D'].z + 0.012, 0.020, 0.007, 0.022, 'relogio'))
var.append(toro('pulseira', pulso['E'].x, pulso['E'].y, pulso['E'].z + 0.012, 0.031, 0.006, 'metal'))
an = pulso['D'].lerp(dedo['D'], 0.75)
var.append(toro('anel', an.x - 0.012, an.y, an.z, 0.0085, 0.0022, 'metal'))

# ------------------------------------------------------------- 7. PENDURA E EXPORTA
def prender(ob, osso_nome):
    ob.parent = arm; ob.parent_type = 'BONE'; ob.parent_bone = osso_nome
    b = arm_data.bones[osso_nome]
    ob.matrix_parent_inverse = (arm.matrix_world @ arm.pose.bones[osso_nome].matrix @ Matrix.Translation((0, b.length, 0))).inverted()
bpy.context.view_layer.update()
for ob in var:
    if ob.name.startswith('relogio') or ob.name == 'anel': prender(ob, 'mao.D')
    elif ob.name == 'pulseira': prender(ob, 'mao.E')
    elif ob.name.startswith('cordao') or ob.name == 'corrente': prender(ob, 'tronco')
    else: prender(ob, 'cabeca')
olhos.name = 'rosto_olhos'
prender(olhos, 'cabeca')
prender(pares[-1], 'pe.D'); prender(pares[1], 'pe.E')

os.makedirs(os.path.dirname(SAIDA_GLB), exist_ok=True)
for o in bpy.data.objects: o.select_set(o.type in ('MESH', 'ARMATURE'))
bpy.ops.export_scene.gltf(filepath=SAIDA_GLB, export_format='GLB', use_selection=True,
                          export_apply=True, export_skins=True, export_yup=True,
                          export_animations=False, export_materials='EXPORT',
                          export_normals=True, export_texcoords=True, export_image_format='AUTO')
tam = os.path.getsize(SAIDA_GLB)
with open(SAIDA_GLB, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('ascii')
with open(SAIDA_JS, 'w', encoding='utf-8') as f:
    f.write('/* gerado por ferramentas/boneco_base.py — o boneco humano em GLB (base64) */\n')
    f.write('window.TO = window.TO || {}; TO.dados = TO.dados || {};\n')
    f.write('TO.dados.%s = "data:model/gltf-binary;base64,%s";\n' % ('bonecoLeveGLB' if LEVE else 'bonecoGLB', b64))
print('GLB: %d bytes -> %s' % (tam, SAIDA_GLB))
print('triângulos: corpo %d, olhos %d, tênis %d, cabelo curto %d' % (tri(corpo), tri(olhos), tri(pares[1])*2, tri(next(v for v in var if v.name == 'cabelo_curto'))))
