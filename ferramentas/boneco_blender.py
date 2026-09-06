# -*- coding: utf-8 -*-
"""
O BONECO HUMANO, FEITO NO BLENDER POR SCRIPT
--------------------------------------------
Roda com o Blender de verdade (aba Scripting → Run Script) ou com o
módulo `bpy` do PyPI (python3 ferramentas/boneco_blender.py). Gera:

  img/boneco.glb            — o modelo com esqueleto e variantes
  dados/boneco_glb.js       — o mesmo GLB em base64, pra abrir sem rede
                              e entrar no empacotador do artifact

O corpo é um "esqueleto de pontos" com raio por ponto, inflado pelo
modificador Skin e alisado por Subdivision Surface — é assim que se
faz um humanoide orgânico sem esculpir: ombro largo, peito achatado,
cintura, coxa grossa, canela, tornozelo fino. A cabeça são metaballs
(crânio, mandíbula, queixo, bochechas, pescoço) convertidas em malha,
porque metaball funde as formas sem emenda. O rosto (olhos, pálpebra,
sobrancelha, nariz, boca, orelha) e as VARIANTES (cabelos, bonés,
bandana, barbas, óculos, brinco, relógio, corrente) são malhas
separadas presas ao osso da cabeça ou do pulso; o jogo liga e desliga
cada uma por nome.

O esqueleto tem os MESMOS nomes de junta que a animação em Three.js
usa (bonecos3.js): pelvis, tronco, pescoco, cabeca, ombro.D/E,
cotovelo.D/E, mao.D/E, quadril.D/E, joelho.D/E, pe.D/E — D é o lado
de x negativo (a direita do boneco), como os índices 0 e 1 lá.

O boneco olha pro -Y do Blender, que o exportador glTF vira +Z: o
mesmo "pra frente" da animação. 1,75 m de altura; o jogo escala.
"""
import bpy, bmesh, math, os, base64, sys
from mathutils import Vector

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if '__file__' in globals() else os.getcwd()
# DOIS MODELOS DO MESMO SCRIPT (pedido do dono, 05/09/2026):
#   detalhado (padrão)  → img/boneco.glb, dados/boneco_glb.js — a vitrine
#   --leve              → img/boneco_leve.glb, dados/boneco_leve_glb.js — a cena
# O leve tem corpo com menos subdivisão e sem dedos, cabeça única de 6 mm
# com o ROSTO PINTADO numa textura gerada aqui (olho, sobrancelha, nariz,
# boca, orelha), só cabelos como malha e nenhum acessório na cabeça.
LEVE = ('--leve' in sys.argv) or bool(os.environ.get('BONECO_LEVE'))
SAIDA_GLB = os.path.join(RAIZ, 'img', 'boneco_leve.glb' if LEVE else 'boneco.glb')
SAIDA_JS  = os.path.join(RAIZ, 'dados', 'boneco_leve_glb.js' if LEVE else 'boneco_glb.js')

# ---------------------------------------------------------------- cena limpa
bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene
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
  'pele':    material('pele',    (0.80, 0.60, 0.45)),
  'camisa':  material('camisa',  (0.75, 0.16, 0.14)),
  'faixa':   material('faixa',   (0.92, 0.92, 0.90)),
  'calca':   material('calca',   (0.18, 0.20, 0.26)),
  'tenis':   material('tenis',   (0.93, 0.93, 0.92)),
  'sola':    material('sola',    (0.20, 0.20, 0.20)),
  'cabelo':  material('cabelo',  (0.08, 0.05, 0.03)),
  'olho':    material('olho',    (0.95, 0.95, 0.95), 0.3),
  'iris':    material('iris',    (0.20, 0.11, 0.06), 0.3),
  'pupila':  material('pupila',  (0.02, 0.02, 0.02), 0.3),
  'boca':    material('boca',    (0.45, 0.18, 0.16)),
  'bone':    material('bone',    (0.75, 0.16, 0.14)),
  'metal':   material('metal',   (0.85, 0.70, 0.30), 0.35, 1.0),
  'armacao': material('armacao', (0.10, 0.10, 0.10), 0.4),
  'lente':   material('lente',   (0.62, 0.78, 0.92), 0.2, 0.0, 0.35),
  'escuros': material('escuros', (0.05, 0.05, 0.06), 0.2),
  'relogio': material('relogio', (0.80, 0.82, 0.85), 0.3, 0.8),
  'pulseira':material('pulseira',(0.12, 0.12, 0.12), 0.6),
}

# ---------------------------------------------------------------- o esqueleto de pontos
# (x, y, z) em metros; y negativo é a frente. raio = (rx, ry) da seção.
P = {}
def ponto(nome, x, y, z, rx, ry=None, mat='pele'):
    P[nome] = dict(co=Vector((x, y, z)), r=(rx, ry if ry is not None else rx), mat=mat)

ponto('pelvis',   0, 0.00, 0.97, 0.150, 0.110, 'calca')
ponto('cintura',  0, 0.00, 1.08, 0.130, 0.100, 'camisa')
ponto('peito',    0, 0.00, 1.26, 0.170, 0.115, 'camisa')
ponto('ombros',   0, 0.00, 1.40, 0.165, 0.098, 'camisa')
ponto('pescoco',  0, 0.00, 1.47, 0.062, 0.062, 'pele')
ponto('nuca',     0, 0.00, 1.53, 0.054, 0.054, 'pele')
for lado, sx in (('D', -1), ('E', 1)):
    ponto('ombro'+lado,   sx*0.215, 0.00, 1.395, 0.062, 0.062, 'camisa')
    ponto('manga'+lado,   sx*0.245, 0.00, 1.27, 0.052, 0.052, 'camisa')
    ponto('braco'+lado,   sx*0.255, 0.00, 1.20, 0.046, 0.046, 'pele')
    ponto('cotovelo'+lado,sx*0.265, 0.00, 1.13, 0.043, 0.043, 'pele')
    ponto('antebr'+lado,  sx*0.275, 0.00, 1.02, 0.040, 0.040, 'pele')
    ponto('pulso'+lado,   sx*0.285, 0.00, 0.90, 0.032, 0.026, 'pele')
    ponto('mao'+lado,     sx*0.290, 0.00, 0.82, 0.042, 0.020, 'pele')
    ponto('nos'+lado,     sx*0.292, -0.004, 0.785, 0.040, 0.016, 'pele')
    # dedos: quatro ramos curtos mais o polegar, pra mão ter mão (só no detalhado)
    for k, (dx, dy, comp) in enumerate([] if LEVE else [(-0.030, 0.0, 0.055), (-0.011, -0.002, 0.062), (0.008, -0.002, 0.060), (0.026, 0.0, 0.050)]):
        ponto('dedo%d%s' % (k, lado), sx*0.292 + dx, dy - 0.004, 0.785 - comp*0.55, 0.0075, 0.0065, 'pele')
        ponto('ponta%d%s' % (k, lado), sx*0.292 + dx, dy - 0.006, 0.785 - comp, 0.0060, 0.0055, 'pele')
    if not LEVE:
        ponto('polegar'+lado, sx*0.292 + sx*(-0.030), -0.020, 0.80, 0.0085, 0.0075, 'pele')
        ponto('polegarp'+lado, sx*0.292 + sx*(-0.038), -0.036, 0.785, 0.0065, 0.0060, 'pele')
    else:
        ponto('dedos'+lado, sx*0.292, -0.004, 0.755, 0.030, 0.014, 'pele')
    ponto('quadril'+lado, sx*0.095, 0.00, 0.94, 0.095, 0.095, 'calca')
    ponto('coxa'+lado,    sx*0.105, 0.00, 0.74, 0.082, 0.085, 'calca')
    ponto('bermuda'+lado, sx*0.110, 0.00, 0.66, 0.078, 0.080, 'calca')
    ponto('joelho'+lado,  sx*0.115, 0.00, 0.52, 0.062, 0.066, 'pele')
    ponto('canela'+lado,  sx*0.118, 0.00, 0.35, 0.058, 0.064, 'pele')
    ponto('tornoz'+lado,  sx*0.120, 0.00, 0.10, 0.042, 0.046, 'tenis')
    ponto('pe'+lado,      sx*0.122, -0.06, 0.045, 0.048, 0.030, 'tenis')
    ponto('ponta'+lado,   sx*0.124, -0.15, 0.035, 0.045, 0.025, 'tenis')

ARESTAS = [('pelvis','cintura'),('cintura','peito'),('peito','ombros'),('ombros','pescoco'),('pescoco','nuca')]
for L in ('D','E'):
    ARESTAS += [('ombros','ombro'+L),('ombro'+L,'manga'+L),('manga'+L,'braco'+L),('braco'+L,'cotovelo'+L),
                ('cotovelo'+L,'antebr'+L),('antebr'+L,'pulso'+L),('pulso'+L,'mao'+L),('mao'+L,'nos'+L),
                ] + ([('nos'+L,'dedos'+L)] if LEVE else [('mao'+L,'polegar'+L),('polegar'+L,'polegarp'+L)] + [('nos'+L,'dedo%d%s'%(k,L)) for k in range(4)] + [('dedo%d%s'%(k,L),'ponta%d%s'%(k,L)) for k in range(4)]) + [
                ('pelvis','quadril'+L),('quadril'+L,'coxa'+L),('coxa'+L,'bermuda'+L),('bermuda'+L,'joelho'+L),
                ('joelho'+L,'canela'+L),('canela'+L,'tornoz'+L),('tornoz'+L,'pe'+L),('pe'+L,'ponta'+L)]

# ---------------------------------------------------------------- o corpo (Skin + Subsurf)
def malha_do_esqueleto():
    bm = bmesh.new()
    idx = {}
    for nome, p in P.items():
        idx[nome] = bm.verts.new(p['co'])
    bm.verts.ensure_lookup_table()
    for a, b in ARESTAS:
        bm.edges.new((idx[a], idx[b]))
    me = bpy.data.meshes.new('corpo')
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('corpo', me)
    col.objects.link(ob)
    # o Skin precisa da camada de vértices dele
    skin = ob.modifiers.new('Skin', 'SKIN')
    skin.use_smooth_shade = True
    ob.data.skin_vertices  # existe depois do modificador
    sv = ob.data.skin_vertices[0].data
    for i, nome in enumerate(P.keys()):
        sv[i].radius = P[nome]['r']
        if nome == 'pelvis': sv[i].use_root = True
    sub = ob.modifiers.new('Subsurf', 'SUBSURF')
    sub.levels = 1 if LEVE else 2; sub.render_levels = sub.levels
    return ob

corpo = malha_do_esqueleto()

# aplica os modificadores (vira malha de verdade) — por objeto avaliado
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

aplicar_modificadores(corpo)

# A ROUPA É MATERIAL NA MALHA DO CORPO, COM BORDA RETA: antes de pintar,
# a malha é CORTADA por planos (`bisect_plane` sem apagar nada) na
# bainha, na boca da manga, na gola, na faixa, no calção, na meia e no
# tênis — assim a borda entre dois materiais é uma linha reta e não o
# serrilhado dos quadriláteros da subdivisão. A camisa como casca
# separada (versão anterior) rasgava no sovaco quando o braço subia;
# na malha única, não rasga.
def cortar_corpo():
    bm = bmesh.new(); bm.from_mesh(corpo.data)
    Zv = Vector((0, 0, 1))
    def corte(z, filtro=None):
        faces = [f for f in bm.faces if (filtro is None or filtro(f.calc_center_median()))]
        geom = list(set(faces) | set(e for f in faces for e in f.edges) | set(v for f in faces for v in f.verts))
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, z), plane_no=Zv, clear_outer=False, clear_inner=False)
    tronco = lambda c: abs(c.x) <= 0.19
    braco = lambda c: abs(c.x) > 0.19
    corte(0.985, tronco); corte(1.235, braco); corte(1.445, lambda c: abs(c.x) < 0.11)
    corte(1.225, tronco); corte(1.285, tronco)
    corte(0.62); corte(0.115); corte(0.165)
    bm.to_mesh(corpo.data); bm.free()
    for poly in corpo.data.polygons: poly.use_smooth = True
cortar_corpo()
for m in ('pele','camisa','faixa','calca','tenis','sola'):
    corpo.data.materials.append(M[m])
corpo.data.materials.append(material('meia', (0.95, 0.95, 0.93)))
IDX = {m.name: k for k, m in enumerate(corpo.data.materials)}
for poly in corpo.data.polygons:
    c = poly.center
    braco = abs(c.x) > 0.19 and c.z > 0.7
    if braco: m = 'camisa' if c.z > 1.235 else 'pele'
    elif c.z >= 1.445 and abs(c.x) < 0.11: m = 'pele'
    elif c.z >= 0.985: m = 'faixa' if 1.225 <= c.z <= 1.285 else 'camisa'
    elif c.z >= 0.62: m = 'calca'
    elif c.z >= 0.165: m = 'pele'
    elif c.z >= 0.115: m = 'meia'
    else: m = 'sola' if poly.normal.z < -0.6 else 'tenis'
    poly.material_index = IDX[m]

# ---------------------------------------------------------------- A CABEÇA ESCULPIDA
# (refeita a pedido do dono, 05/09/2026: "todos os detalhes do rosto
# devem ser bem similares à realidade"). Não é mais bola + peças
# soltas. É uma cabeça de metaballs REMALHADA em voxels de 3,5 mm
# (topologia uniforme, ~10 mil faces) e depois ESCULPIDA por
# deslocamento ao longo da normal: cada traço do rosto é uma
# gaussiana 3D centrada num ponto medido na própria superfície —
# órbita funda, arco da sobrancelha, dorso, ponta e narinas do
# nariz, maçã do rosto, cova da bochecha, lábio de cima e de baixo
# com o sulco entre eles, filtro, queixo com a covinha acima,
# têmpora, ângulo da mandíbula. Depois um alisamento leve e uma
# subdivisão. Olho de verdade (globo, íris, pupila) dentro da
# órbita, com pálpebra em casca; sobrancelha curva; orelha com
# hélice e concha. Cabelo, boné e barba são gerados DA PRÓPRIA
# superfície (as faces da cabeça acima da linha do cabelo, ou do
# queixo, deslocadas pra fora), então assentam perfeitos.
import mathutils
from mathutils import Matrix, kdtree

def cabeca_base():
    mb = bpy.data.metaballs.new('cabecaMB')
    mb.resolution = 0.008
    mb.threshold = 0.6
    ob = bpy.data.objects.new('cabecaMB', mb)
    col.objects.link(ob)
    def bola(x, y, z, rx, ry, rz, stiff=2.0):
        e = mb.elements.new(); e.type = 'ELLIPSOID'
        e.co = (x, y, z); e.size_x = rx; e.size_y = ry; e.size_z = rz; e.stiffness = stiff
    bola(0, 0.008, 1.648, 0.071, 0.082, 0.076)      # crânio
    bola(0, -0.015, 1.596, 0.061, 0.062, 0.054)     # rosto de baixo / mandíbula
    bola(0, -0.047, 1.560, 0.036, 0.028, 0.025)     # queixo
    bola(-0.047, -0.032, 1.606, 0.027, 0.024, 0.024)  # bochecha D
    bola( 0.047, -0.032, 1.606, 0.027, 0.024, 0.024)  # bochecha E
    bola(0, 0.010, 1.520, 0.040, 0.040, 0.052)      # pescoço (emenda com o corpo)
    deps = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(deps), depsgraph=deps)
    cab = bpy.data.objects.new('cabeca', me)
    col.objects.link(cab)
    bpy.data.objects.remove(ob)
    # remalha em voxels: topologia uniforme pra esculpir
    rm = cab.modifiers.new('Remesh', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = 0.0062 if LEVE else 0.0028; rm.use_smooth_shade = True
    aplicar_modificadores(cab)
    return cab

cabeca = cabeca_base()
_me = cabeca.data
_verts = _me.vertices
_kd = kdtree.KDTree(len(_verts))
for v in _verts: _kd.insert(v.co, v.index)
_kd.balance()

def superficie_frente(x, z, folga=0.02):
    """o ponto da superfície na frente do rosto em (x, z): o mais à frente (menor y) na vizinhança"""
    cands = [v for v in _verts if abs(v.co.x - x) < folga and abs(v.co.z - z) < folga]
    return min(cands, key=lambda v: v.co.y).co.copy()
def superficie_lado(y, z, sx, folga=0.02):
    cands = [v for v in _verts if abs(v.co.y - y) < folga and abs(v.co.z - z) < folga and v.co.x*sx > 0]
    return max(cands, key=lambda v: v.co.x*sx).co.copy()

topoZ = max(v.co.z for v in _verts)
queixoZ = min(v.co.z for v in _verts if v.co.y < -0.03)
olhosZ = queixoZ + 0.57*(topoZ - queixoZ)
alt = topoZ - queixoZ                    # ~0,22 m
E = 0.0
# os traços: (centro, amplitude, sigmas) — amplitude positiva é relevo, negativa é cova
tracos = []
ORBITA = {}     # o centro da órbita medido ANTES da escultura: é onde o olho vai
def traco(c, a, sx, sy=None, sz=None):
    tracos.append((Vector(c), a, sx, sy if sy is not None else sx, sz if sz is not None else sx))
for sx in (-1, 1):
    oc = superficie_frente(sx*0.031, olhosZ, 0.010)               # centro da órbita
    ORBITA[sx] = oc.copy()
    traco(oc, -0.014, 0.019, 0.016, 0.013)                        # órbita
    traco(superficie_frente(sx*0.030, olhosZ + 0.022), 0.0055, 0.028, 0.012, 0.008)  # arco da sobrancelha
    traco(superficie_frente(sx*0.052, olhosZ - 0.018), 0.0065, 0.020, 0.018, 0.016)  # maçã do rosto
    traco(superficie_frente(sx*0.046, olhosZ - 0.052), -0.0045, 0.018, 0.018, 0.018) # cova da bochecha
    traco(superficie_lado(0.020, olhosZ + 0.030, sx), -0.004, 0.018, 0.020, 0.018)   # têmpora
    traco(superficie_lado(0.020, olhosZ - 0.070, sx), 0.0045, 0.016, 0.018, 0.016)   # ângulo da mandíbula
    traco(superficie_frente(sx*0.015, olhosZ - 0.046, 0.008), 0.0055, 0.010, 0.010, 0.008)  # asa do nariz
    traco(superficie_frente(sx*0.009, olhosZ - 0.054, 0.008), -0.0030, 0.0045, 0.006, 0.0035) # narina
# o nariz: dorso do meio das sobrancelhas até a ponta
traco(superficie_frente(0, olhosZ + 0.008, 0.008), -0.0030, 0.010, 0.010, 0.008)   # raiz do nariz (afunda)
for k in range(8):
    t = k/7.0
    z = olhosZ - 0.002 - t*0.040
    traco(superficie_frente(0, z, 0.008), 0.004 + 0.009*t, 0.0065 + 0.0045*t, 0.014, 0.008)   # dorso, alargando
traco(superficie_frente(0, olhosZ - 0.046, 0.008), 0.0085, 0.013, 0.016, 0.010)     # ponta, redonda e ligada à face
traco(superficie_frente(0, olhosZ - 0.058, 0.008), -0.0025, 0.007, 0.006, 0.004)    # base/columela
traco(superficie_frente(0, olhosZ - 0.066), -0.0025, 0.004, 0.006, 0.006)            # filtro
traco(superficie_frente(0, olhosZ - 0.073), 0.0060, 0.022, 0.008, 0.005)             # lábio de cima
traco(superficie_frente(0, olhosZ - 0.079), -0.0060, 0.024, 0.006, 0.0022)           # a boca (sulco)
traco(superficie_frente(0, olhosZ - 0.086), 0.0070, 0.019, 0.008, 0.0055)            # lábio de baixo
traco(superficie_frente(0, olhosZ - 0.095), -0.0045, 0.016, 0.008, 0.004)            # sulco do queixo
traco(superficie_frente(0, olhosZ - 0.108), 0.0080, 0.020, 0.013, 0.014)             # queixo
traco(superficie_frente(0, olhosZ + 0.050), 0.0025, 0.045, 0.020, 0.030)             # testa

def esculpir(me, tracos):
    novos = []
    for v in me.vertices:
        n = v.normal
        d = 0.0
        for c, a, sx, sy, sz in tracos:
            dx = (v.co.x - c.x)/sx; dy = (v.co.y - c.y)/sy; dz = (v.co.z - c.z)/sz
            q = dx*dx + dy*dy + dz*dz
            if q < 9.0: d += a*math.exp(-0.5*q)
        novos.append(v.co + n*d)
    for v, p in zip(me.vertices, novos): v.co = p
esculpir(_me, tracos)
_me.update()
# alisa de leve e subdivide
sm = cabeca.modifiers.new('Smooth', 'SMOOTH'); sm.factor = 0.35; sm.iterations = 2
aplicar_modificadores(cabeca)
_me = cabeca.data; _verts = _me.vertices
_me.materials.append(M['pele'])
print('cabeça esculpida: %d vértices, topo %.3f queixo %.3f olhos %.3f' % (len(_verts), topoZ, queixoZ, olhosZ))

# ---------------------------------------------------------------- peças presas a ossos
def esfera(nome, x, y, z, rx, ry, rz, mat, seg=24, an=16, rot=(0,0,0)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=an, radius=1.0)
    R = mathutils.Euler(rot).to_matrix()
    for v in bm.verts:
        v.co = R @ Vector((v.co.x*rx, v.co.y*ry, v.co.z*rz)) + Vector((x, y, z))
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    me.materials.append(M[mat])
    return ob

def casca(nome, x, y, z, rx, ry, rz, mat, abre_dir, abre_ang, rot=(0,0,0)):
    """esfera com um buraco: as faces cuja normal faz menos de `abre_ang` com `abre_dir` saem — a pálpebra"""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=18, radius=1.0)
    d = Vector(abre_dir).normalized(); ca = math.cos(abre_ang)
    tirar = [f for f in bm.faces if f.normal.dot(d) > ca]
    bmesh.ops.delete(bm, geom=tirar, context='FACES')
    R = mathutils.Euler(rot).to_matrix()
    for v in bm.verts:
        v.co = R @ Vector((v.co.x*rx, v.co.y*ry, v.co.z*rz)) + Vector((x, y, z))
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    me.materials.append(M[mat])
    return ob

def tubo(nome, pontos, raio, mat, seg=10):
    """um tubo ao longo de uma polilinha (sobrancelha, haste de óculos, aro)"""
    bm = bmesh.new()
    aneis = []
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
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    me.materials.append(M[mat])
    return ob

def caixa(nome, x, y, z, sx, sy, sz, mat, rot=(0,0,0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x*sx, v.co.y*sy, v.co.z*sz))
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    ob.location = (x, y, z); ob.rotation_euler = rot
    me.materials.append(M[mat])
    return ob

def toro(nome, x, y, z, raio, esp, mat, rot=(0,0,0), segs=32, anel=10):
    bm = bmesh.new()
    verts = []
    for i in range(segs):
        a = 2*math.pi*i/segs
        for j in range(anel):
            b = 2*math.pi*j/anel
            r = raio + esp*math.cos(b)
            verts.append(bm.verts.new((r*math.cos(a), r*math.sin(a), esp*math.sin(b))))
    for i in range(segs):
        for j in range(anel):
            bm.faces.new((verts[i*anel+j], verts[((i+1)%segs)*anel+j], verts[((i+1)%segs)*anel+(j+1)%anel], verts[i*anel+(j+1)%anel]))
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    ob.location = (x, y, z); ob.rotation_euler = rot
    me.materials.append(M[mat])
    return ob

def tampa(nome, mat, sel, desloc, ruido=0.0, semente=1):
    """uma casca feita das faces da cabeça que passam em `sel(centro, normal)`,
    deslocada `desloc` pra fora — cabelo, boné, barba assentam perfeitos"""
    import random
    rnd = random.Random(semente)
    bm = bmesh.new(); bm.from_mesh(_me)
    tirar = [f for f in bm.faces if not sel(f.calc_center_median(), f.normal)]
    bmesh.ops.delete(bm, geom=tirar, context='FACES')
    for v in bm.verts:
        d = desloc(v.co, v.normal) if callable(desloc) else desloc
        v.co = v.co + v.normal*(d + (rnd.random()-0.5)*ruido)
    # engrossa: extrusão pra dentro fecha a casca
    res = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    novos = [g for g in res['geom'] if isinstance(g, bmesh.types.BMVert)]
    for v in novos:
        d = desloc(v.co, v.normal) if callable(desloc) else desloc
        v.co = v.co - v.normal*(d*0.9)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    me.materials.append(M[mat])
    return ob

# ---- O ROSTO PINTADO (modelo leve): UV por projeção cilíndrica e uma
# textura gerada aqui — olho com esclera, íris e pupila, pálpebra,
# sobrancelha, sombra do nariz e narinas, boca, orelha. A base é branca
# pra cor da pele entrar por multiplicação no jogo.
def rosto_pintado():
    import numpy as np
    me = cabeca.data
    zmin = min(v.co.z for v in me.vertices); zmax = max(v.co.z for v in me.vertices)
    uv = me.uv_layers.new(name='rosto')
    for poly in me.polygons:
        us = []
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            u = 0.5 + math.atan2(v.x, -v.y)/(2*math.pi)     # a frente (−y) em u=0,5
            us.append((li, u, (v.z - zmin)/(zmax - zmin)))
        # a costura fica atrás: faces que cruzam u=0/1 são puxadas pro mesmo lado
        umin = min(u for _, u, _ in us); umax = max(u for _, u, _ in us)
        for li, u, vv in us:
            if umax - umin > 0.5 and u < 0.5: u += 1.0
            uv.data[li].uv = (u, vv)
    # a textura
    N = 512
    img = np.ones((N, N, 4), dtype=np.float32)
    def px_u(u): return int(u*N) % N
    def px_v(vv): return int(vv*N)
    def disco(u, vv, ru, rv, cor, dur=1.0):
        cu, cv = u*N, vv*N
        y0, y1 = max(0, int(cv - rv*N) - 1), min(N, int(cv + rv*N) + 2)
        x0, x1 = int(cu - ru*N) - 1, int(cu + ru*N) + 2
        for y in range(y0, y1):
            for x in range(x0, x1):
                d = ((x - cu)/(ru*N))**2 + ((y - cv)/(rv*N))**2
                if d <= 1.0:
                    a = 1.0 if dur >= 1.0 else max(0.0, min(1.0, (1.0 - d)/(1.0 - dur + 1e-6)))
                    xx = x % N
                    img[y, xx, :3] = img[y, xx, :3]*(1 - a) + np.array(cor)*a
    # TUDO EM METROS, convertido pra UV: u é fração da circunferência da
    # cabeça (2π·raio), v é fração da altura da malha
    raio = 0.078
    U_ = lambda m: m/(2*math.pi*raio)
    V_ = lambda m: m/(zmax - zmin)
    vO = (olhosZ - zmin)/(zmax - zmin)
    du = math.atan2(0.031, raio)/(2*math.pi)
    for sx in (-1, 1):
        u = 0.5 + sx*du
        disco(u, vO - V_(0.002), U_(0.021), V_(0.016), (0.62, 0.48, 0.40), 0.15)          # a sombra da órbita
        disco(u, vO, U_(0.0135), V_(0.0085), (0.97, 0.97, 0.97))                           # esclera (amendoada)
        disco(u, vO, U_(0.0062), V_(0.0062), (0.30, 0.17, 0.08))                           # íris
        disco(u, vO, U_(0.0030), V_(0.0030), (0.02, 0.02, 0.02))                           # pupila
        disco(u + sx*U_(0.002), vO + V_(0.0025), U_(0.0012), V_(0.0012), (1.0, 1.0, 1.0)) # o brilho
        disco(u, vO + V_(0.0075), U_(0.0145), V_(0.0025), (0.40, 0.28, 0.22), 0.4)         # a pálpebra de cima (linha)
        disco(u + sx*U_(0.003), vO + V_(0.021), U_(0.024), V_(0.0035), (0.12, 0.08, 0.05))   # sobrancelha
        disco(u + sx*U_(0.016), vO + V_(0.024), U_(0.011), V_(0.003), (0.12, 0.08, 0.05))    # a ponta, subindo
        disco(0.5 + sx*U_(0.011), vO - V_(0.047), U_(0.0055), V_(0.0035), (0.42, 0.27, 0.20)) # a narina
        disco(0.5 + sx*U_(0.016), vO - V_(0.030), U_(0.009), V_(0.020), (0.74, 0.60, 0.50), 0.05)  # a sombra do lado do nariz
        # a orelha: no lado (u = ±0,25), com a concha mais escura
        disco(0.5 + sx*0.25, vO - V_(0.010), U_(0.013), V_(0.026), (0.84, 0.68, 0.58), 0.55)
        disco(0.5 + sx*0.25, vO - V_(0.012), U_(0.007), V_(0.015), (0.55, 0.40, 0.32), 0.45)
    disco(0.5, vO - V_(0.030), U_(0.010), V_(0.028), (0.90, 0.82, 0.76), 0.0)               # o dorso do nariz, mais claro
    disco(0.5, vO - V_(0.079), U_(0.024), V_(0.0028), (0.42, 0.20, 0.17))                   # a boca (linha)
    disco(0.5, vO - V_(0.074), U_(0.021), V_(0.0035), (0.74, 0.47, 0.41), 0.4)              # lábio de cima
    disco(0.5, vO - V_(0.086), U_(0.018), V_(0.0045), (0.76, 0.49, 0.43), 0.4)              # lábio de baixo
    disco(0.5, vO - V_(0.096), U_(0.014), V_(0.004), (0.70, 0.56, 0.48), 0.1)               # o sulco do queixo
    im = bpy.data.images.new('rosto', N, N, alpha=True)
    im.pixels = img.ravel().tolist()
    im.filepath_raw = os.path.join(RAIZ, 'img', 'rosto_leve.png'); im.file_format = 'PNG'; im.save()
    mat = M['pele']
    nt = mat.node_tree
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = im
    nt.links.new(tex.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
    mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (1, 1, 1, 1)
    print('rosto pintado: textura %dx%d' % (N, N))

rosto = []
if LEVE: rosto_pintado()
else:
    for sx in (-1, 1):
        oc = ORBITA[sx]
        cx, cy, cz = oc.x, oc.y + 0.0045, oc.z         # o globo dentro da órbita (medida antes do nariz existir)
        rosto.append(esfera('olho%s' % sx, cx, cy, cz, 0.0125, 0.0125, 0.0125, 'olho'))
        rosto.append(esfera('iris%s' % sx, cx, cy - 0.0105, cz, 0.0058, 0.0025, 0.0058, 'iris'))
        rosto.append(esfera('pupila%s' % sx, cx, cy - 0.0125, cz, 0.0026, 0.0015, 0.0026, 'pupila'))
        # pálpebras: uma casca com a abertura amendoada (mais estreita em z)
        rosto.append(casca('palpebra%s' % sx, cx, cy + 0.0005, cz + 0.001, 0.0138, 0.0138, 0.0108, 'pele', (0, -1, 0), 0.74))
        # sobrancelha: tubo curvo que acompanha o arco
        pts = []
        for k in range(7):
            t = k/6.0
            x = sx*(0.012 + 0.040*t)
            z = olhosZ + 0.020 + 0.010*math.sin(t*math.pi) - 0.004*t
            p = superficie_frente(x, z, 0.010); p.y -= 0.0025
            if abs(x) < 0.02: p.y = min(p.y, ORBITA[sx].y - 0.004)   # perto do nariz, não sobe nele
            pts.append(p)
        rosto.append(tubo('sobrancelha%s' % sx, pts, [0.0024, 0.0028, 0.0028, 0.0026, 0.0022, 0.0018, 0.0012], 'cabelo'))
        # orelha: a hélice (tubo em arco) e a concha (casca funda)
        ez = olhosZ - 0.010
        eo = superficie_lado(0.0, ez, sx)
        hel = []
        for k in range(9):
            a = math.pi*(-0.55 + 1.6*k/8)
            hel.append((eo.x + sx*(0.004 + 0.006*math.cos(a)), eo.y + 0.012*math.cos(a) - 0.004, ez + 0.022*math.sin(a)))
        rosto.append(tubo('orelha_helice%s' % sx, hel, 0.0035, 'pele'))
        rosto.append(casca('orelha_concha%s' % sx, eo.x + sx*0.004, eo.y - 0.002, ez - 0.002, 0.010, 0.014, 0.018, 'pele', (sx, 0, 0), 0.9))
        rosto.append(esfera('lobulo%s' % sx, eo.x + sx*0.004, eo.y + 0.002, ez - 0.020, 0.006, 0.006, 0.006, 'pele'))
    # a boca: só a linha entre os lábios, escura (os lábios são relevo)
    bc = superficie_frente(0, olhosZ - 0.079); bc.y -= 0.0005
    rosto.append(esfera('boca', bc.x, bc.y, bc.z, 0.021, 0.004, 0.0018, 'boca'))
for ob in rosto: ob.name = 'rosto_' + ob.name

# ---- as variantes, geradas da própria cabeça
var = []
def acima_do_cabelo(c, n):
    # linha do cabelo: mais baixa atrás (nuca) e nos lados, mais alta na testa
    frente = max(0.0, -n.y)
    lim = olhosZ + 0.052*frente + 0.012*(1-frente) - 0.030*max(0.0, n.y)
    if n.z < -0.4: return False
    return c.z > lim
# OS PENTEADOS (mais variação a pedido do dono, 06/09/2026). Cada um é
# uma tampa da própria cabeça: o que muda é a linha do cabelo, a altura
# por região (função do centro e da normal da face) e o ruído.
topo = lambda n: max(0.0, n.z)                 # quanto a face olha pra cima
frente = lambda n: max(0.0, -n.y)              # quanto olha pra frente
def hairline(c, n, testa=0.052, lados=0.012, nuca=-0.030):
    f = frente(n)
    lim = olhosZ + testa*f + lados*(1-f) + nuca*max(0.0, n.y)
    return n.z > -0.4 and c.z > lim
def franja_sel(c, n): return hairline(c, n, testa=0.030) or (frente(n) > 0.6 and c.z > olhosZ + 0.024 and abs(c.x) < 0.05)
def entradas_sel(c, n): return hairline(c, n, testa=0.052) and not (frente(n) > 0.4 and abs(c.x) > 0.032 and c.z < olhosZ + 0.085)
var.append(tampa('cabelo_curto', 'cabelo', acima_do_cabelo, 0.006, 0.002, 1))
var.append(tampa('cabelo_raspado', 'cabelo', acima_do_cabelo, 0.0022, 0.0005, 2))
var.append(tampa('cabelo_black', 'cabelo', acima_do_cabelo, 0.030, 0.012, 3))
var.append(tampa('cabelo_cacheado', 'cabelo', acima_do_cabelo, 0.014, 0.010, 12))
var.append(tampa('cabelo_degrade', 'cabelo', acima_do_cabelo, lambda c, n: 0.0015 + 0.009*topo(n)**2, 0.0008, 13))   # fino no lado, cheio em cima
var.append(tampa('cabelo_topete', 'cabelo', acima_do_cabelo, lambda c, n: 0.004 + 0.026*max(0.0, (c.z - olhosZ - 0.06)/0.05)*frente(n)*topo(n)*2, 0.002, 14))
var.append(tampa('cabelo_franja', 'cabelo', franja_sel, lambda c, n: 0.007 + 0.004*frente(n), 0.002, 15))
var.append(tampa('cabelo_entradas', 'cabelo', entradas_sel, 0.005, 0.0015, 16))
var.append(tampa('cabelo_moicano', 'cabelo', acima_do_cabelo, 0.0022, 0.0005, 4))
var.append(tampa('cabelo_moicano_crista', 'cabelo', lambda c, n: acima_do_cabelo(c, n) and abs(c.x) < 0.014 and n.z > 0.3, 0.045, 0.006, 5))
var.append(tampa('cabelo_comprido', 'cabelo', lambda c, n: acima_do_cabelo(c, n) or (n.y > 0.3 and c.z > olhosZ - 0.06), 0.009, 0.003, 6))
var.append(caixa('cabelo_comprido_nuca', 0, 0.075, olhosZ - 0.075, 0.13, 0.05, 0.12, 'cabelo'))
var.append(tampa('cabelo_rabo', 'cabelo', acima_do_cabelo, 0.005, 0.001, 17))
_tras = max(v.co.y for v in _verts)
var.append(esfera('cabelo_rabo_elastico', 0, _tras + 0.006, olhosZ + 0.045, 0.014, 0.010, 0.012, 'cabelo'))
var.append(esfera('cabelo_rabo_ponta', 0, _tras + 0.030, olhosZ - 0.010, 0.016, 0.026, 0.060, 'cabelo', 14, 10, (0.55, 0, 0)))
var.append(tampa('cabelo_coque', 'cabelo', acima_do_cabelo, 0.005, 0.001, 18))
var.append(esfera('cabelo_coque_bola', 0, 0.010, topoZ + 0.020, 0.030, 0.030, 0.024, 'cabelo', 14, 10))
if not LEVE:
    # bonés: a copa é uma tampa mais alta e lisa; a aba, uma fatia curva
    def copa(c, n): return c.z > olhosZ + 0.040 - 0.012*max(0.0, n.y) and n.z > -0.3
    var.append(tampa('bone_copa', 'bone', copa, 0.012, 0.0, 7))
    def aba(nome, tras):
        bm = bmesh.new()
        s = -1 if not tras else 1
        base = superficie_frente(0, olhosZ + 0.045) if not tras else Vector((0, max(v.co.y for v in _verts) , olhosZ + 0.045))
        z0 = olhosZ + 0.046
        linhas = []
        for i in range(7):
            t = i/6.0
            y = base.y + s*(0.010 + 0.075*t)
            linha = []
            for k in range(9):
                u = -1 + 2*k/8
                x = u*(0.075 + 0.02*t)
                z = z0 - 0.006*t*t*4 - 0.010*u*u
                linha.append(bm.verts.new((x, y, z)))
            linhas.append(linha)
        for i in range(6):
            for k in range(8):
                bm.faces.new((linhas[i][k], linhas[i][k+1], linhas[i+1][k+1], linhas[i+1][k]))
        res = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
        for g in res['geom']:
            if isinstance(g, bmesh.types.BMVert): g.co.z -= 0.004
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
        for p in me.polygons: p.use_smooth = True
        ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
        me.materials.append(M['bone'])
        return ob
    var.append(aba('bone_aba', False))
    var.append(aba('bone_aba_tras', True))
    var.append(toro('bandana', 0, 0.006, olhosZ + 0.038, superficie_lado(0.0, olhosZ + 0.038, 1).x + 0.004, 0.011, 'faixa'))
    var.append(caixa('bandana_ponta', 0.025, max(v.co.y for v in _verts) + 0.006, olhosZ - 0.005, 0.028, 0.012, 0.07, 'faixa', (0.3, 0, 0)))
    # barbas: tampas da mandíbula
    def na_barba(c, n): return c.z < olhosZ - 0.060 and c.z > queixoZ - 0.01 and n.y < 0.35 and n.z < 0.5 and not (abs(c.x) < 0.024 and c.z > olhosZ - 0.083 and n.y < -0.5)
    var.append(tampa('barba_cheia', 'cabelo', na_barba, 0.006, 0.002, 9))
    var.append(tampa('barba_cavanhaque', 'cabelo', lambda c, n: na_barba(c, n) and abs(c.x) < 0.024 and n.y < -0.3, 0.005, 0.002, 10))
    var.append(tampa('barba_bigode', 'cabelo', lambda c, n: abs(c.x) < 0.026 and olhosZ - 0.076 < c.z < olhosZ - 0.064 and n.y < -0.5, 0.004, 0.001, 11))
    # óculos: aros em tubo, ponte e hastes
    def oculos(prefixo, mat_aro, com_lente):
        for sx in (-1, 1):
            oc = ORBITA[sx].copy(); oc.y -= 0.016
            pts = [(oc.x + 0.019*math.cos(a), oc.y, oc.z + 0.014*math.sin(a)) for a in [2*math.pi*k/24 for k in range(25)]]
            var.append(tubo(prefixo + '_aro%s' % sx, pts, 0.0014, mat_aro, 8))
            if com_lente:
                var.append(esfera(prefixo + '_lente%s' % sx, oc.x, oc.y, oc.z, 0.018, 0.001, 0.013, 'lente'))
            else:
                var.append(esfera(prefixo + '_lente%s' % sx, oc.x, oc.y + 0.001, oc.z, 0.019, 0.002, 0.014, 'escuros'))
            eo = superficie_lado(0.0, olhosZ + 0.004, sx)
            var.append(tubo(prefixo + '_haste%s' % sx, [(oc.x + sx*0.020, oc.y, oc.z + 0.004), (eo.x + sx*0.002, eo.y - 0.02, eo.z + 0.004), (eo.x + sx*0.002, eo.y + 0.012, eo.z - 0.004)], 0.0012, mat_aro, 6))
        ponte = superficie_frente(0, olhosZ + 0.004); ponte.y -= 0.010
        var.append(tubo(prefixo + '_ponte', [(-0.012, ponte.y, ponte.z), (0, ponte.y - 0.002, ponte.z + 0.002), (0.012, ponte.y, ponte.z)], 0.0012, mat_aro, 6))
    oculos('oculos_grau', 'armacao', True)
    oculos('oculos_escuros', 'escuros', False)
    # brinco, corrente
    eo = superficie_lado(0.0, olhosZ - 0.010, -1)
    var.append(toro('brinco', eo.x - 0.004, eo.y + 0.002, olhosZ - 0.032, 0.0045, 0.0012, 'metal', (0, math.pi/2, 0)))
    var.append(toro('corrente', 0, -0.010, 1.455, 0.075, 0.004, 'metal', (0.35, 0, 0)))
# o cordão de ouro grosso, caído no peito, com medalha
var.append(toro('cordao_grosso', 0, -0.052, 1.418, 0.105, 0.0075, 'metal', (0.78, 0, 0), 40, 12))
var.append(esfera('cordao_medalha', 0, -0.130, 1.338, 0.020, 0.004, 0.024, 'metal'))
var.append(toro('anel', -0.292 - 0.011, -0.006, 0.755, 0.0085, 0.0022, 'metal', (0, 0, 0)))
# relógio (pulso D) e pulseira (pulso E) — presos ao pulso
var.append(toro('relogio_pulseira', -0.285, 0.0, 0.905, 0.034, 0.007, 'pulseira', (0, 0, 0)))
var.append(caixa('relogio_mostrador', -0.285, -0.030, 0.905, 0.022, 0.007, 0.024, 'relogio'))
var.append(toro('pulseira', 0.285, 0.0, 0.905, 0.034, 0.006, 'metal', (0, 0, 0)))

# ---------------------------------------------------------------- o esqueleto (armature)
arm_data = bpy.data.armatures.new('esqueleto')
arm = bpy.data.objects.new('esqueleto', arm_data)
col.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones
def osso(nome, cabeca, cauda, pai=None, roll=0.0):
    b = eb.new(nome); b.head = Vector(cabeca); b.tail = Vector(cauda); b.roll = roll
    if pai: b.parent = eb[pai]; b.use_connect = False
    return b
osso('pelvis',  (0, 0, 0.97), (0, 0, 1.08))
osso('tronco',  (0, 0, 1.08), (0, 0, 1.40), 'pelvis')
osso('pescoco', (0, 0, 1.44), (0, 0, 1.53), 'tronco')
osso('cabeca',  (0, 0, 1.53), (0, 0, 1.74), 'pescoco')
for L, sx in (('D', -1), ('E', 1)):
    osso('ombro.'+L,    (sx*0.215, 0, 1.395), (sx*0.265, 0, 1.13), 'tronco')
    osso('cotovelo.'+L, (sx*0.265, 0, 1.13),  (sx*0.285, 0, 0.90), 'ombro.'+L)
    osso('mao.'+L,      (sx*0.285, 0, 0.90),  (sx*0.292, 0, 0.76), 'cotovelo.'+L)
    osso('quadril.'+L,  (sx*0.095, 0, 0.94),  (sx*0.115, 0, 0.52), 'pelvis')
    osso('joelho.'+L,   (sx*0.115, 0, 0.52),  (sx*0.120, 0, 0.10), 'quadril.'+L)
    osso('pe.'+L,       (sx*0.120, 0, 0.10),  (sx*0.124, -0.15, 0.035), 'joelho.'+L)
bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------- pesos no corpo
# O "automático" do Blender (heat) precisa de janela; aqui os pesos são
# calculados na mão: cada vértice vai pros DOIS ossos mais próximos
# (distância ao segmento cabeça→cauda), com peso 1/d², o que dá a
# transição suave na junta e o osso inteiro no meio do membro.
def dist_segmento(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(1e-9, ab.dot(ab))))
    return (p - (a + ab*t)).length
def pesar(ob):
    segs = [(b.name, b.head_local.copy(), b.tail_local.copy()) for b in arm_data.bones]
    grupos = {n: ob.vertex_groups.new(name=n) for n, _, _ in segs}
    for v in ob.data.vertices:
        ds = sorted(((dist_segmento(v.co, a, b), n) for n, a, b in segs), key=lambda x: x[0])[:2]
        d1, n1 = ds[0]; d2, n2 = ds[1]
        w1 = 1.0/(d1*d1 + 1e-6); w2 = 1.0/(d2*d2 + 1e-6)
        # só divide quando o segundo está perto de verdade (junta)
        if d2 > d1*2.2: w2 = 0.0
        tot = w1 + w2
        grupos[n1].add([v.index], w1/tot, 'REPLACE')
        if w2 > 0: grupos[n2].add([v.index], w2/tot, 'REPLACE')
    mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
    ob.parent = arm
pesar(corpo)

# a cabeça vai inteira no osso da cabeça (sem heat: é uma peça só)
from mathutils import Matrix
def prender(ob, osso_nome):
    """pendura o objeto no osso sem ele sair do lugar: o Blender prende o
    filho na CAUDA do osso, então a inversa compensa a matriz do osso
    deslocada até a cauda"""
    ob.parent = arm; ob.parent_type = 'BONE'; ob.parent_bone = osso_nome
    b = arm_data.bones[osso_nome]
    ob.matrix_parent_inverse = (arm.matrix_world @ arm.pose.bones[osso_nome].matrix @ Matrix.Translation((0, b.length, 0))).inverted()

for ob in rosto + var:
    if ob.name.startswith('relogio') or ob.name == 'anel': prender(ob, 'mao.D')
    elif ob.name == 'pulseira': prender(ob, 'mao.E')
    elif ob.name.startswith('cordao') or ob.name == 'corrente': prender(ob, 'tronco')
    else: prender(ob, 'cabeca')
prender(cabeca, 'cabeca')

# ---------------------------------------------------------------- exporta
os.makedirs(os.path.dirname(SAIDA_GLB), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=SAIDA_GLB, export_format='GLB', use_selection=True,
                          export_apply=True, export_skins=True, export_yup=True,
                          export_animations=False, export_materials='EXPORT',
                          export_normals=True, export_texcoords=LEVE, export_image_format='AUTO')
tam = os.path.getsize(SAIDA_GLB)
with open(SAIDA_GLB, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('ascii')
with open(SAIDA_JS, 'w', encoding='utf-8') as f:
    f.write('/* gerado por ferramentas/boneco_blender.py — o boneco humano em GLB (base64) */\n')
    f.write('window.TO = window.TO || {}; TO.dados = TO.dados || {};\n')
    f.write('TO.dados.%s = "data:model/gltf-binary;base64,%s";\n' % ('bonecoLeveGLB' if LEVE else 'bonecoGLB', b64))
print('GLB: %d bytes -> %s ; JS: %s' % (tam, SAIDA_GLB, SAIDA_JS))
print('objetos:', len(rosto), 'rosto,', len(var), 'variantes; verts corpo', len(corpo.data.vertices), 'cabeca', len(cabeca.data.vertices))
