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
SAIDA_GLB = os.path.join(RAIZ, 'img', 'boneco.glb')
SAIDA_JS  = os.path.join(RAIZ, 'dados', 'boneco_glb.js')

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
ponto('ombros',   0, 0.00, 1.40, 0.185, 0.100, 'camisa')
ponto('pescoco',  0, 0.00, 1.47, 0.058, 0.058, 'pele')
ponto('nuca',     0, 0.00, 1.53, 0.050, 0.050, 'pele')
for lado, sx in (('D', -1), ('E', 1)):
    ponto('ombro'+lado,   sx*0.215, 0.00, 1.395, 0.062, 0.062, 'camisa')
    ponto('manga'+lado,   sx*0.245, 0.00, 1.27, 0.052, 0.052, 'camisa')
    ponto('braco'+lado,   sx*0.255, 0.00, 1.20, 0.046, 0.046, 'pele')
    ponto('cotovelo'+lado,sx*0.265, 0.00, 1.13, 0.043, 0.043, 'pele')
    ponto('antebr'+lado,  sx*0.275, 0.00, 1.02, 0.040, 0.040, 'pele')
    ponto('pulso'+lado,   sx*0.285, 0.00, 0.90, 0.032, 0.026, 'pele')
    ponto('mao'+lado,     sx*0.290, 0.00, 0.82, 0.045, 0.022, 'pele')
    ponto('dedos'+lado,   sx*0.292, 0.00, 0.76, 0.030, 0.016, 'pele')
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
                ('cotovelo'+L,'antebr'+L),('antebr'+L,'pulso'+L),('pulso'+L,'mao'+L),('mao'+L,'dedos'+L),
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
    sub.levels = 2; sub.render_levels = 2
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

# MATERIAIS POR REGRA, com borda reta: o ponto do esqueleto mais perto
# diz o membro; a altura diz a peça de roupa. Camisa até a cintura e
# manga curta; bermuda até um palmo acima do joelho; meia; tênis.
NOMES = list(P.keys())
for m in ('pele','camisa','calca','tenis','sola','faixa','meia'):
    if m == 'meia': corpo.data.materials.append(material('meia', (0.95, 0.95, 0.93)))
    else: corpo.data.materials.append(M[m])
IDX = {m.name: k for k, m in enumerate(corpo.data.materials)}
pontos = [(P[n]['co'], n) for n in NOMES]
def membro(n):
    if n.startswith(('ombro','manga','braco','cotovelo','antebr','pulso','mao','dedos')): return 'braco'
    if n.startswith(('quadril','coxa','bermuda','joelho','canela','tornoz','pe','ponta')): return 'perna'
    if n in ('pescoco','nuca'): return 'pescoco'
    return 'tronco'
for poly in corpo.data.polygons:
    c = poly.center
    n = min(pontos, key=lambda pm: (pm[0]-c).length)[1]
    mb = membro(n)
    # a altura manda mais que o ponto mais perto: barriga é tronco,
    # mesmo que o quadril esteja mais perto (era o remendo escuro no peito)
    if abs(c.x) > 0.19 and c.z > 0.7: mb = 'braco'
    elif c.z > 1.0 and abs(c.x) < 0.20: mb = 'tronco'
    elif c.z <= 1.0 and mb != 'braco': mb = 'perna'
    if mb == 'tronco':
        m = 'calca' if c.z < 1.015 else 'camisa'
        if m == 'camisa' and 1.22 < c.z < 1.285 and abs(c.x) < 0.17: m = 'faixa'
    elif mb == 'braco':
        m = 'camisa' if c.z > 1.235 else 'pele'
    elif mb == 'perna':
        if c.z < 0.06 or (c.z < 0.11 and c.y < -0.02): m = 'tenis'
        elif c.z < 0.16: m = 'meia'
        elif c.z < 0.60: m = 'pele'
        else: m = 'calca'
        if m == 'tenis' and poly.normal.z < -0.6: m = 'sola'
    else:
        m = 'pele'
    poly.material_index = IDX[m]

# ---------------------------------------------------------------- a cabeça (metaballs → malha)
def cabeca_metaball():
    mb = bpy.data.metaballs.new('cabecaMB')
    mb.resolution = 0.012
    mb.threshold = 0.6
    ob = bpy.data.objects.new('cabecaMB', mb)
    col.objects.link(ob)
    def bola(x, y, z, rx, ry, rz, stiff=2.0):
        e = mb.elements.new(); e.type = 'ELLIPSOID'
        e.co = (x, y, z); e.size_x = rx; e.size_y = ry; e.size_z = rz; e.stiffness = stiff
        return e
    bola(0, 0.005, 1.640, 0.066, 0.074, 0.070)      # crânio
    bola(0, -0.018, 1.590, 0.056, 0.056, 0.050)     # rosto de baixo / mandíbula
    bola(0, -0.046, 1.562, 0.032, 0.024, 0.022)     # queixo
    bola(-0.044, -0.034, 1.602, 0.024, 0.021, 0.021)  # bochecha D
    bola( 0.044, -0.034, 1.602, 0.024, 0.021, 0.021)  # bochecha E
    bola(0, 0.008, 1.525, 0.036, 0.036, 0.048)      # pescoço (emenda com o corpo)
    deps = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(deps)
    me = bpy.data.meshes.new_from_object(ev, depsgraph=deps)
    for poly in me.polygons: poly.use_smooth = True
    cab = bpy.data.objects.new('cabeca', me)
    col.objects.link(cab)
    bpy.data.objects.remove(ob)
    me.materials.append(M['pele'])
    return cab

cabeca = cabeca_metaball()

# ---------------------------------------------------------------- peças presas a ossos
def esfera(nome, x, y, z, rx, ry, rz, mat, seg=16, an=10):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=an, radius=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x*rx, v.co.y*ry, v.co.z*rz)) + Vector((x, y, z))
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    me.materials.append(M[mat])
    return ob

def caixa(nome, x, y, z, sx, sy, sz, mat, rot=(0,0,0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x*sx, v.co.y*sy, v.co.z*sz))
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    ob.location = (x, y, z); ob.rotation_euler = rot
    me.materials.append(M[mat])
    return ob

def toro(nome, x, y, z, raio, esp, mat, rot=(0,0,0)):
    bm = bmesh.new()
    # anel por revolução simples
    segs, anel = 24, 8
    verts = []
    for i in range(segs):
        a = 2*math.pi*i/segs
        for j in range(anel):
            b = 2*math.pi*j/anel
            r = raio + esp*math.cos(b)
            verts.append(bm.verts.new((r*math.cos(a), r*math.sin(a), esp*math.sin(b))))
    for i in range(segs):
        for j in range(anel):
            v1 = verts[i*anel+j]; v2 = verts[((i+1)%segs)*anel+j]
            v3 = verts[((i+1)%segs)*anel+(j+1)%anel]; v4 = verts[i*anel+(j+1)%anel]
            bm.faces.new((v1, v2, v3, v4))
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nome, me); col.objects.link(ob)
    ob.location = (x, y, z); ob.rotation_euler = rot
    me.materials.append(M[mat])
    return ob

# A CABEÇA MEDIDA: tudo que vai no rosto é posicionado pela superfície
# real da malha, não por número decorado — foi assim que o rosto
# ficou enterrado na primeira versão.
_hv = [v.co for v in cabeca.data.vertices]
def frenteY(z, x=0.0, folga=0.012):
    vs = [v.y for v in _hv if abs(v.z - z) < folga and abs(v.x - x) < folga]
    return min(vs) if vs else min(v.y for v in _hv)
def ladoX(z, folga=0.012):
    vs = [v.x for v in _hv if abs(v.z - z) < folga]
    return max(vs) if vs else max(v.x for v in _hv)
topoZ = max(v.z for v in _hv)
queixoZ = min(v.z for v in _hv if v.y < -0.03)
tras = max(v.y for v in _hv)
olhosZ = queixoZ + 0.56*(topoZ - queixoZ)
olhoX = 0.38*ladoX(olhosZ)
olhoY = frenteY(olhosZ, olhoX) + 0.004
print('cabeça: topo %.3f queixo %.3f olhos z %.3f x %.3f y %.3f lado %.3f' % (topoZ, queixoZ, olhosZ, olhoX, olhoY, ladoX(olhosZ)))

rosto = []
for sx in (-1, 1):
    rosto.append(esfera('olho%s' % sx, sx*olhoX, olhoY, olhosZ, 0.015, 0.010, 0.012, 'olho'))
    rosto.append(esfera('iris%s' % sx, sx*olhoX, olhoY-0.0075, olhosZ, 0.0080, 0.005, 0.0080, 'iris'))
    rosto.append(esfera('pupila%s' % sx, sx*olhoX, olhoY-0.011, olhosZ, 0.0038, 0.003, 0.0038, 'pupila'))
    rosto.append(esfera('palpebra%s' % sx, sx*olhoX, olhoY+0.001, olhosZ+0.008, 0.017, 0.011, 0.006, 'pele'))
    rosto.append(caixa('sobrancelha%s' % sx, sx*olhoX, frenteY(olhosZ+0.022, olhoX)-0.002, olhosZ+0.022, 0.032, 0.008, 0.006, 'cabelo', (0, sx*0.18, 0)))
    ez = olhosZ - 0.012
    rosto.append(esfera('orelha%s' % sx, sx*(ladoX(ez)-0.004), -0.005, ez, 0.010, 0.018, 0.022, 'pele'))
nz = olhosZ - 0.032
rosto.append(esfera('nariz', 0, frenteY(nz, 0)-0.010, nz, 0.012, 0.020, 0.022, 'pele'))
bz = olhosZ - 0.066
rosto.append(caixa('boca', 0, frenteY(bz, 0)-0.002, bz, 0.034, 0.008, 0.007, 'boca'))
for ob in rosto: ob.name = 'rosto_' + ob.name

# variantes (o jogo liga uma de cada grupo por nome)
var = []
hz = olhosZ + 0.03                      # onde o cabelo começa
hw, hd = ladoX(hz), (tras - frenteY(hz, 0))/2
cy = (tras + frenteY(hz, 0))/2
hh = topoZ - hz
def touca(nome, mat, fx=1.06, fy=1.05, fz=1.3, dz=0.0):
    return esfera(nome, 0, cy + 0.004, hz + dz, hw*fx, hd*fy, hh*fz, mat, 20, 12)
var.append(touca('cabelo_curto', 'cabelo', 1.07, 1.06, 1.35))
var.append(touca('cabelo_raspado', 'cabelo', 1.035, 1.03, 1.25))
var.append(touca('cabelo_black', 'cabelo', 1.35, 1.35, 1.75, 0.01))
var.append(touca('cabelo_moicano', 'cabelo', 1.035, 1.03, 1.25))
var.append(caixa('cabelo_moicano_crista', 0, cy, topoZ + 0.02, 0.028, 0.15, 0.06, 'cabelo'))
var.append(touca('cabelo_comprido', 'cabelo', 1.10, 1.08, 1.40))
var.append(caixa('cabelo_comprido_nuca', 0, tras - 0.01, hz - 0.05, hw*2.0, 0.05, 0.14, 'cabelo'))
# bonés e chapéus
var.append(touca('bone_copa', 'bone', 1.10, 1.09, 1.30, 0.004))
abaZ = topoZ - 0.045
var.append(caixa('bone_aba', 0, frenteY(abaZ, 0) - 0.05, abaZ, 0.10, 0.10, 0.010, 'bone', (0.10, 0, 0)))
var.append(caixa('bone_aba_tras', 0, tras + 0.05, abaZ, 0.10, 0.10, 0.010, 'bone', (-0.10, 0, 0)))
var.append(touca('bucket_copa', 'bone', 1.14, 1.12, 1.30, 0.008))
var.append(toro('bucket_aba', 0, cy + 0.004, hz + 0.01, hw*1.30, 0.012, 'bone'))
var.append(toro('bandana', 0, cy + 0.004, hz + 0.012, hw*1.02, 0.014, 'faixa'))
var.append(caixa('bandana_ponta', 0.025, tras + 0.008, hz - 0.03, 0.028, 0.012, 0.07, 'faixa', (0.3, 0, 0)))
# barbas
var.append(esfera('barba_cavanhaque', 0, frenteY(queixoZ + 0.012, 0) - 0.006, queixoZ + 0.012, 0.024, 0.018, 0.018, 'cabelo'))
var.append(esfera('barba_cheia', 0, cy - 0.012, queixoZ + 0.032, ladoX(queixoZ + 0.03)*1.05, hd*1.0, 0.040, 'cabelo', 20, 12))
var.append(caixa('barba_bigode', 0, frenteY(bz + 0.012, 0) - 0.004, bz + 0.012, 0.036, 0.010, 0.009, 'cabelo'))
# óculos
oy = olhoY - 0.012
for sx in (-1, 1):
    var.append(caixa('oculos_grau_aro%s' % sx, sx*olhoX, oy, olhosZ, 0.036, 0.006, 0.028, 'armacao'))
    var.append(caixa('oculos_grau_lente%s' % sx, sx*olhoX, oy + 0.001, olhosZ, 0.030, 0.002, 0.022, 'lente'))
    var.append(caixa('oculos_grau_haste%s' % sx, sx*(ladoX(olhosZ) - 0.004), oy + 0.055, olhosZ + 0.002, 0.004, 0.110, 0.004, 'armacao'))
    var.append(caixa('oculos_escuros_lente%s' % sx, sx*olhoX, oy, olhosZ, 0.038, 0.006, 0.028, 'escuros'))
    var.append(caixa('oculos_escuros_haste%s' % sx, sx*(ladoX(olhosZ) - 0.004), oy + 0.055, olhosZ + 0.002, 0.004, 0.110, 0.004, 'escuros'))
var.append(caixa('oculos_grau_ponte', 0, oy, olhosZ + 0.002, 0.012, 0.004, 0.004, 'armacao'))
var.append(caixa('oculos_escuros_ponte', 0, oy, olhosZ + 0.002, 0.012, 0.004, 0.004, 'escuros'))
# brinco, corrente
var.append(esfera('brinco', -(ladoX(olhosZ - 0.012) - 0.002), -0.003, olhosZ - 0.032, 0.006, 0.006, 0.006, 'metal'))
var.append(toro('corrente', 0, -0.010, 1.455, 0.075, 0.005, 'metal', (0.35, 0, 0)))
# relógio (pulso D) e pulseira (pulso E) — presos ao pulso
var.append(toro('relogio_pulseira', -0.285, 0.0, 0.905, 0.034, 0.008, 'pulseira', (0, 0, 0)))
var.append(caixa('relogio_mostrador', -0.285, -0.030, 0.905, 0.022, 0.008, 0.024, 'relogio'))
var.append(toro('pulseira', 0.285, 0.0, 0.905, 0.034, 0.010, 'faixa', (0, 0, 0)))

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
    if ob.name.startswith('relogio'): prender(ob, 'mao.D')
    elif ob.name == 'pulseira': prender(ob, 'mao.E')
    else: prender(ob, 'cabeca')
prender(cabeca, 'cabeca')

# ---------------------------------------------------------------- exporta
os.makedirs(os.path.dirname(SAIDA_GLB), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=SAIDA_GLB, export_format='GLB', use_selection=True,
                          export_apply=True, export_skins=True, export_yup=True,
                          export_animations=False, export_materials='EXPORT',
                          export_normals=True, export_texcoords=False)
tam = os.path.getsize(SAIDA_GLB)
with open(SAIDA_GLB, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('ascii')
with open(SAIDA_JS, 'w', encoding='utf-8') as f:
    f.write('/* gerado por ferramentas/boneco_blender.py — o boneco humano em GLB (base64) */\n')
    f.write('window.TO = window.TO || {}; TO.dados = TO.dados || {};\n')
    f.write('TO.dados.bonecoGLB = "data:model/gltf-binary;base64,%s";\n' % b64)
print('GLB: %d bytes -> %s ; JS: %s' % (tam, SAIDA_GLB, SAIDA_JS))
print('objetos:', len(rosto), 'rosto,', len(var), 'variantes; verts corpo', len(corpo.data.vertices), 'cabeca', len(cabeca.data.vertices))
