"""Converte a malha IBGE já salva em caminhos SVG locais, sem serviço externo em runtime."""
import json
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
dados = json.loads((raiz / 'src/data/brasil-uf.geojson').read_text(encoding='utf-8'))
codigos = dict(zip(
    '11 12 13 14 15 16 17 21 22 23 24 25 26 27 28 29 31 32 33 35 41 42 43 50 51 52 53'.split(),
    'RO AC AM RR PA AP TO MA PI CE RN PB PE AL SE BA MG ES RJ SP PR SC RS MS MT GO DF'.split(),
))
estados = []
for estado in dados['features']:
    geometria = estado['geometry']
    poligonos = [geometria['coordinates']] if geometria['type'] == 'Polygon' else geometria['coordinates']
    pontos, caminhos = [], []
    for poligono in poligonos:
        for anel in poligono:
            parte = [(round((lon + 74) * 10, 1), round((6 - lat) * 10, 1)) for lon, lat, *_ in anel]
            pontos += parte
            caminhos.append('M' + ' L'.join(f'{x},{y}' for x, y in parte) + 'Z')
    xs, ys = zip(*pontos)
    estados.append(dict(uf=codigos[estado['properties']['codarea']], path=' '.join(caminhos),
                        x=round((min(xs) + max(xs)) / 2, 1), y=round((min(ys) + max(ys)) / 2, 1)))
(raiz / 'src/data/brasil-uf.json').write_text(json.dumps(estados, separators=(',', ':')), encoding='utf-8')
