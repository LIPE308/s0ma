"""Exporta a geometria Enlace (100 unidades); requer Pillow apenas para os PNGs."""
from pathlib import Path
from PIL import Image, ImageDraw

DESTINO = Path(__file__).resolve().parents[1] / "assets" / "brand"
DESTINO.mkdir(parents=True, exist_ok=True)
CAMINHOS = 'M20 24Q20 20 24 20H64V38H38V64H20Z M80 76Q80 80 76 80H36V62H62V36H80Z'

for nome, cor in [("enlace", "#1748F5"), ("enlace-inverso", "#FFFFFF"), ("enlace-mono", "#101F48")]:
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="SOMA Enlace"><path fill="{cor}" d="{CAMINHOS}"/></svg>\n'
    (DESTINO / f"{nome}.svg").write_text(svg, encoding="utf-8")

def exportar(nome, tamanho, fundo, cor):
    escala = tamanho * 4 / 100
    imagem = Image.new("RGBA", (tamanho * 4, tamanho * 4), fundo)
    desenho = ImageDraw.Draw(imagem)
    primeiro = [(24, 20), (64, 20), (64, 38), (38, 38), (38, 64), (20, 64), (20, 24)]
    # Bézier quadrática do pequeno canto óptico superior esquerdo.
    primeiro += [(20 + 4 * (i / 12) ** 2, 24 - 8 * (i / 12) + 4 * (i / 12) ** 2) for i in range(1, 13)]
    segundo = [(100 - x, 100 - y) for x, y in primeiro]
    for pontos in [primeiro, segundo]:
        desenho.polygon([(round(x * escala), round(y * escala)) for x, y in pontos], fill=cor)
    imagem.resize((tamanho, tamanho), Image.Resampling.LANCZOS).save(DESTINO / nome)

exportar("icon.png", 1024, "#1748F5", "#FFFFFF")
exportar("adaptive-foreground.png", 1024, (0, 0, 0, 0), "#FFFFFF")
exportar("adaptive-monochrome.png", 1024, (0, 0, 0, 0), "#FFFFFF")
exportar("splash.png", 512, (0, 0, 0, 0), "#FFFFFF")
exportar("favicon.png", 64, "#1748F5", "#FFFFFF")
print("Marca exportada:", DESTINO)
