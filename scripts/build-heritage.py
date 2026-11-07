"""Original Malaysian-inspired shophouse asset; Blender 4+; no external model dependency."""
import bpy, math, os
from mathutils import Vector

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','public','assets'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def mat(name,color,texture=None,roughness=.8):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=roughness
 if texture:
  tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(os.path.join(ROOT,texture));m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
 return m
plaster=mat('Weathered limestone plaster',(.76,.70,.48),'plaster.jpg')
trim=mat('Ivory lime moulding',(.84,.79,.65))
dark=mat('Recess shadow',(.05,.09,.08))
green=mat('Aged teal shutters',(.10,.29,.25))
wood=mat('Tropical hardwood',(.36,.20,.10),'wood.jpg')
terra=mat('Terracotta roof tiles',(.52,.22,.11),'roof.jpg')
metal=mat('Aged brass',(.34,.27,.13),roughness=.4)

def cube(name,loc,scale,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:
  b=o.modifiers.new('Rounded crafted edges','BEVEL');b.width=bevel;b.segments=2
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def mesh(name,vertices,faces,material):
 m=bpy.data.meshes.new(name);m.from_pydata(vertices,[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);o.data.materials.append(material);return o
def prism(name,poly,y,depth,material):
 n=len(poly);verts=[(x,y,z) for x,z in poly]+[(x,y+depth,z) for x,z in poly];faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)];return mesh(name,verts,faces,material)
def arch(cx,base,radius,height,y,material):
 points=[(cx-radius-.14,base),(cx-radius-.14,base+height-radius)]
 for j in range(25):
  t=math.pi-j*math.pi/24;points.append((cx+(radius+.14)*math.cos(t),base+height-radius+(radius+.14)*math.sin(t)))
 points.extend([(cx+radius+.14,base),(cx+radius,base),(cx+radius,base+height-radius)])
 for j in range(25):
  t=j*math.pi/24;points.append((cx+radius*math.cos(t),base+height-radius+radius*math.sin(t)))
 points.append((cx-radius,base))
 return prism('Curved arch moulding',points,y,.16,material)

# Five-foot veranda, colonnade and arched openings, rather than a block facade.
cube('Veranda stone step',(0,-1.0,.12),(6.1,6.3,.24),trim,.025)
cube('Shop rear wall',(0,1.25,1.7),(5.8,.24,3.0),plaster)
for x in [-2.85,2.85]:
 cube('Side party wall',(x,.0,3.5),(.28,5.2,6.7),plaster)
for x in [-2.8,-.94,.94,2.8]:
 cube('Veranda square pillar',(x,-3.0,1.55),(.28,.36,2.8),trim,.025)
 cube('Pillar foot',(x,-3.0,.35),(.45,.48,.3),trim,.02)
 cube('Pillar capital',(x,-3.0,2.87),(.48,.51,.24),trim,.015)
for x in [-1.87,0,1.87]:
 arch(x,.45,.77,2.65,-3.21,trim)
 # Spandrel above curved arcade.
 pts=[(x-.94,3.55),(x+.94,3.55),(x+.94,2.3)]
 for j in range(25):
  t=j*math.pi/24;pts.append((x+.77*math.cos(t),2.33+.77*math.sin(t)))
 pts.append((x-.94,2.3));prism('Arcade arch spandrel',pts,-3.04,.25,plaster)
 cube('Recessed shop door',(x,.98,1.7),(1.65,.12,2.85),wood,.02)
 for sx in [-.42,.42]:
  for z in [.85,1.7,2.5]:cube('Carved door panel',(x+sx,.88,z),(.67,.09,.65),green,.02)

# Upper storey: three shuttered arch windows, lintels and pilasters.
cube('Upper storey',(0,-.25,5.1),(5.75,5.0,3.3),plaster)
for z,w,d in [(3.43,6.15,.25),(3.66,6.04,.16),(6.65,6.16,.21),(6.9,6.32,.18)]:
 cube('Facade cornice',(0,-2.88,z),(w,d,.13),trim,.02)
for x in [-2.8,-.95,.95,2.8]:
 cube('Upper pilaster',(x,-2.84,5.12),(.16,.18,2.94),trim,.01)
 cube('Decorative pilaster capital',(x,-2.94,6.43),(.32,.2,.12),trim,.015)
for x in [-1.87,0,1.87]:
 cube('Window dark inset',(x,-2.79,5.0),(1.4,.08,1.95),dark,.025)
 arch(x,4.0,.7,2.15,-2.94,trim)
 for side in [-1,1]:
  xx=x+side*.35
  cube('Shutter frame',(xx,-2.91,4.92),(.63,.1,1.75),green,.02)
  for j in range(12):
   o=cube('Angled shutter louvre',(xx,-3.0,4.15+j*.13),(.55,.08,.09),green,.01);o.rotation_euler.x=.28
 cube('Window sill',(x,-3.01,3.98),(1.62,.4,.14),trim,.02)
 for j in range(9):
  xx=x-.6+j*.15;h=math.sqrt(max(0,.64**2-(xx-x)**2))
  cube('Arched fanlight slat',(xx,-2.92,5.65+h/2),(.045,.06,h+.08),wood)

# Characteristic pitched terracotta roof, individually modelled overlapping tiles.
for side in [-1,1]:
 v=[(-3.22,0,8.0),(3.22,0,8.0),(3.22,side*3.1,6.88),(-3.22,side*3.1,6.88)]
 mesh('Pitched roof bed',v,[(0,1,2,3)],terra)
 for row in range(10):
  yy=side*(.12+row*.32);zz=8-abs(yy)*.36
  for col in range(25):
   xx=-3.12+col*.26
   verts=[]
   for end in [0,1]:
    for k in range(5):
     ang=k*math.pi/4;verts.append((xx+.13*math.cos(ang),yy+side*end*.39,zz-end*.14+.055*math.sin(ang)))
   mesh('Half-round overlapping tile',verts,[(k,k+1,k+6,k+5) for k in range(4)],terra)
for i in range(25):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=1,location=(-3.1+i*.26,0,8.04));o=bpy.context.object;o.name='Rounded ridge tile';o.scale=(.16,.20,.12);o.data.materials.append(terra)

# Export with embedded textures and explicit UVs. Original asset is reproducible.
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active=bpy.context.selected_objects[0]
bpy.ops.object.convert(target='MESH')
bpy.ops.object.join()
bpy.context.object.name='Heritage_Shophouse_Original'
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'shophouse.glb'),export_format='GLB',export_apply=True,export_yup=True)
print('Original detailed shophouse model exported.')
