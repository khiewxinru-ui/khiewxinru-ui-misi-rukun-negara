"""Original human characters and distinct civic/school architecture, built locally in Blender."""
import bpy, math, os
from mathutils import Vector
OUT=os.path.abspath('public/assets')
def reset():bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,c,rough=.8):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=rough;return m
def cube(name,loc,dim,m,bevel=.03):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:b=o.modifiers.new('Crafted edges','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return o
def uv(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def lathe(name,profile,loc,m):
 verts=[];faces=[];N=32
 for z,rx,ry in profile:
  verts.extend((loc[0]+rx*math.cos(j*2*math.pi/N),loc[1]+ry*math.sin(j*2*math.pi/N),loc[2]+z) for j in range(N))
 for k in range(len(profile)-1):
  for j in range(N):a=k*N+j;b=k*N+(j+1)%N;faces.append((a,b,b+N,a+N))
 faces.extend([tuple(range(N-1,-1,-1)),tuple((len(profile)-1)*N+j for j in range(N))]);mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 for p in mesh.polygons:p.use_smooth=True
 return o
def bone(name,a,b,r,m):
 mid=(Vector(a)+Vector(b))/2;o=uv(name,mid,(r,r,(Vector(b)-Vector(a)).length/2+r),m);o.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler();return o
def group(name,loc):o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;return o
def parent(o,g):o.parent=g;o.location-=g.location;return o
def export(name):
 if name in ['civic-gallery','community-school']:
  for material in list(bpy.data.materials):
   objs=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==material]
   if not objs:continue
   for obj in objs:
    bpy.context.view_layer.objects.active=obj
    for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
   bpy.ops.object.select_all(action='DESELECT')
   for obj in objs:obj.select_set(True)
   bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join()
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',export_yup=True,export_apply=True)
reset();skin=mat('Warm natural skin',(.49,.28,.17));cloth=mat('Cotton shirt',(.17,.35,.31));trousers=mat('Tailored trousers',(.14,.18,.19));hair=mat('Hair',(.065,.052,.036));eye=mat('Eyes',(.04,.045,.035));white=mat('Eye whites',(.87,.83,.70));shoe=mat('Leather shoes',(.11,.085,.06));seam=mat('Stitching',(.46,.53,.41));button=mat('Buttons',(.75,.69,.50))
lathe('Shirt',[(.86,.16,.11),(.96,.19,.13),(1.16,.205,.14),(1.35,.24,.115),(1.40,.15,.09)],(0,0,0),cloth)
# Curved anatomical limbs with articulated arms and a shaped face, rather than block figures.
for x in [-.105,.105]:
 bone('Trouser leg',(x,0,.91),(x,-.005,.19),.085,trousers);uv('Shoe',(x,-.08,.10),(.085,.17,.08),shoe)
head=group('Head',(0,0,1.52));parent(uv('Neck',(0,0,1.42),(.065,.065,.09),skin),head);parent(uv('Face',(0,-.005,1.60),(.122,.111,.155),skin),head)
parent(uv('Hair cap',(0,.025,1.69),(.126,.102,.087),hair),head)
for x in [-.047,.047]:
 parent(uv('Eye socket',(x,-.103,1.624),(.028,.011,.013),white),head);parent(uv('Iris',(x,-.114,1.624),(.010,.004,.010),eye),head);parent(bone('Brow',(x-.023,-.109,1.651),(x+.022,-.11,1.651),.006,hair),head)
parent(uv('Nose',(0,-.117,1.59),(.019,.031,.035),skin),head)
for x in [-.12,.12]:parent(uv('Ear',(x,0,1.60),(.025,.018,.04),skin),head)
parent(bone('Mouth',(-.025,-.11,1.547),(.025,-.11,1.547),.004,hair),head)
for side in [-1,1]:
 arm=group('ArmL' if side<0 else 'ArmR',(side*.225,0,1.33))
 for name,a,b,r,m in [('Sleeve',(side*.225,0,1.32),(side*.31,-.01,1.13),.083,cloth),('Forearm',(side*.31,-.01,1.12),(side*.33,-.09,.94),.052,skin)]:parent(bone(name,a,b,r,m),arm)
 parent(uv('Hand',(side*.33,-.10,.90),(.048,.04,.067),skin),arm)
 for finger in range(4):parent(bone('Finger',(side*.33+(finger-1.5)*.018,-.12,.89),(side*.33+(finger-1.5)*.018,-.13,.84),.009,skin),arm)
for z in [1.05,1.17,1.29]:uv('Shirt button',(0,-.142,z),(.009,.004,.009),button)
cube('Shirt placket',(0,-.137,1.15),(.027,.009,.38),seam,.003)
for x in [-.07,.07]:o=cube('Collar',(x,-.105,1.37),(.10,.018,.065),seam,.01);o.rotation_euler.y=(-1 if x<0 else 1)*.45
cube('Breast pocket',(-.115,-.137,1.25),(.085,.012,.09),cloth,.008)
export('companion')
parent(uv('Long tied hair',(0,.08,1.53),(.125,.08,.18),hair),head)
lathe('Long modest tunic',[(.48,.21,.14),(.7,.22,.15),(.95,.19,.13),(1.08,.18,.13)],(0,0,0),cloth)
export('companion-female')
# 1970-inspired civic gallery: colonnades, coffered ceiling, mouldings and exhibition niches.
reset();stone=mat('Warm civic limestone',(.71,.69,.58));cream=mat('Polished ivory',(.87,.83,.70));wood=mat('Dark teak',(.25,.13,.075));brass=mat('Brass trim',(.56,.40,.16),.35);glass=mat('Blue grey glazing',(.22,.38,.40),.3)
cube('Gallery foundation',(0,-12,-.12),(18,48,.24),stone)
for side in [-1,1]:
 cube('Gallery wall',(side*8.8,-12,3),(0.36,48,6),cream)
 for y in range(-32,13,7):
  lathe('Fluted column',[(0,.40,.40),(.2,.42,.42),(.34,.29,.29),(5.3,.25,.25),(5.45,.4,.4),(5.7,.42,.42)],(side*7.5,y,0),stone)
  for j in range(12):
   a=j*math.pi/6;bone('Column flute',(side*7.5+.27*math.cos(a),y+.27*math.sin(a),.4),(side*7.5+.24*math.cos(a),y+.24*math.sin(a),5.3),.018,cream)
  cube('Exhibition panel',(side*8.52,y+2.8,2.5),(.10,4.8,3.1),wood)
  for z in [.25,5.7]:cube('Wall cornice',(side*8.5,y+2.8,z),(.5,6.8,.16),brass)
 for y in range(-32,13,4):cube('Inlaid floor border',(side*6.3,y,.015),(.08,3.95,.018),brass,.001)
for y in range(-32,13,7):
 cube('Ceiling cross beam',(0,y,5.8),(17,.45,.45),wood)
 for x in [-5,0,5]:cube('Coffered ceiling panel',(x,y+3.0,6.02),(4.8,6.3,.15),cream)
 cube('Hanging light',(0,y,5.55),(2.0,.55,.08),brass)
cube('Gallery end wall',(0,-35,3),(18,.3,6),cream)
export('civic-gallery')
# Contemporary school/community buildings, beyond the walkable path; verandas and clear modern materials.
reset();wall=mat('Contemporary off white render',(.82,.84,.75));blue=mat('School teal',(.14,.38,.41));roof=mat('Modern clay roof',(.46,.20,.13));window=mat('Modern glazing',(.16,.32,.35),.3);grey=mat('Concrete paths',(.58,.63,.60));timber=mat('Community timber',(.38,.23,.11))
for side in [-1,1]:
 for y in [-4,-22]:
  x=side*12;cube('School building',(x,y,2.0),(8,14,4),wall)
  for zz in [.35,3.7]:cube('Colour band',(x,y,zz),(8.12,14.1,.23),blue)
  # A veranda protects windows and the entry from tropical rain.
  cube('Veranda roof',(side*7.7,y,3.15),(2.5,14.5,.18),blue)
  for yy in [-6,-2,2,6]:
   cube('Veranda post',(side*6.65,y+yy,1.5),(.14,.14,3),wall)
   cube('Window',(side*7.95,y+yy,2.0),(.05,2.3,1.35),window)
   for z in [1.34,2.65]:cube('Window frame',(side*7.89,y+yy,z),(.1,2.4,.08),wall)
   cube('Window mullion',(side*7.85,y+yy,2),(.12,.08,1.4),wall)
  cube('Veranda paving',(side*7.2,y,.06),(3.3,14.8,.12),grey)
# Timber community pavilion: pitched roof with eaves and structural rafters.
for x in [-4,4]:
 for y in [-38,-30]:cube('Pavilion post',(x,y,1.65),(.22,.22,3.3),timber)
for side in [-1,1]:
 o=cube('Pavilion pitched roof',(side*2.35,-34,4.2),(5.0,10.2,.18),roof);o.rotation_euler.y=side*.34
 for y in [-38,-36,-34,-32,-30]:o=cube('Pavilion rafters',(side*2.0,y,3.8),(4.35,.14,.18),timber);o.rotation_euler.y=side*.34
cube('Pavilion platform',(0,-34,.08),(9.2,9.5,.16),grey)
export('community-school')
print('Original human companion, civic gallery and contemporary community school exported.')
