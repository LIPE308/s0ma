"""Gera caminhos municipais locais a partir das malhas simplificadas oficiais do IBGE.
Antes: baixar as 27 UFs em .expo/geografia/UF.json pela API v3, formato geo+json,
qualidade=minima e intrarregiao=municipio. O catálogo vem de Localidades v1.
"""
import json,math
from pathlib import Path
root=Path(__file__).resolve().parent.parent
catalog=json.loads((root/'src/data/municipios-brasil.json').read_text(encoding='utf-8-sig'))
nomes={str(m['id']):m for m in catalog}
out=root/'src/data/malhas-municipais';out.mkdir(exist_ok=True)
index=['export type TerritorioMunicipal = { id: number; nome: string; caminho: string; x: number; y: number; largura: number; altura: number };','export type MalhaMunicipal = { uf: string; municipios: TerritorioMunicipal[] };','export function carregarMalha(uf: string): MalhaMunicipal | null {','switch(uf) {']
covered=set()
def project(p):
 lon,lat=p[:2]
 return lon,-math.degrees(math.log(math.tan(math.pi/4+math.radians(lat)/2)))
for uf in sorted({m['uf'] for m in catalog}):
 raw=json.loads((root/f'.expo/geografia/{uf}.json').read_text(encoding='utf-8-sig'))
 geometries=[];allpts=[]
 for f in raw['features']:
  code=str(f['properties']['codarea']);meta=nomes.get(code)
  if not meta:continue
  geometry=f['geometry'];polygons=[geometry['coordinates']] if geometry['type']=='Polygon' else geometry['coordinates']
  rings=[[project(p) for p in ring] for poly in polygons for ring in poly]
  allpts.extend(p for ring in rings for p in ring);geometries.append((meta,rings));covered.add(meta['id'])
 if not allpts:raise ValueError('Sem malha para '+uf)
 xs,ys=zip(*allpts);xmin,xmax,ymin,ymax=min(xs),max(xs),min(ys),max(ys)
 scale=min(560/(xmax-xmin),540/(ymax-ymin));ox=(600-(xmax-xmin)*scale)/2;oy=(580-(ymax-ymin)*scale)/2
 records=[]
 for meta,rings in geometries:
  transformed=[[(round((x-xmin)*scale+ox,2),round((y-ymin)*scale+oy,2)) for x,y in ring] for ring in rings]
  pts=[p for ring in transformed for p in ring];xx,yy=zip(*pts)
  paths=['M'+' L'.join(f'{x},{y}' for x,y in ring)+' Z' for ring in transformed]
  records.append({'id':meta['id'],'nome':meta['nome'],'caminho':' '.join(paths),'x':min(xx),'y':min(yy),'largura':round(max(xx)-min(xx),2),'altura':round(max(yy)-min(yy),2)})
 data={'uf':uf,'municipios':records}
 (out/f'{uf}.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 index.append(f'case "{uf}": return require("./malhas-municipais/{uf}.json");')
index+=['default: return null;','}','}']
(root/'src/data/malhas-municipais.ts').write_text('\n'.join(index)+'\n',encoding='utf-8')
missing=[m for m in catalog if m['id'] not in covered]
(out/'fonte.json').write_text(json.dumps({'fonte':'IBGE / Malhas v3 e Localidades v1','consulta':'2026-11-05','malhas':'https://servicodados.ibge.gov.br/api/v3/malhas/estados/{UF}?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio','localidades':'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome','catalogo':len(catalog),'territorios':len(covered),'semMalha':missing},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Catálogo:',len(catalog),'Territórios:',len(covered),'Sem malha:',missing)
"""
Os nomes mantêm o catálogo atual mesmo quando o provedor não fornece o contorno
correspondente. Não se inventa geometria para municípios ausentes na edição da malha.
"""
