"""Regeração opcional dos WebP sem perdas; requer Pillow com suporte a WebP.
Não faz parte do build do Netlify. Os PNG originais são preservados.
"""
from pathlib import Path
from PIL import Image

public = Path(__file__).resolve().parent.parent / "public"
output = public / "optimized"
output.mkdir(exist_ok=True)
for name in ("cookies.png", "limonada.png", "Brownies_tela_inicial.png", "Chef Feliz na Cozinha Vibrante.png"):
    original = Image.open(public / name).convert("RGBA")
    target = output / (Path(name).stem.replace(" ", "-") + ".webp")
    original.save(target, "WEBP", lossless=True, method=6, exact=True)
    assert Image.open(target).convert("RGBA").tobytes() == original.tobytes()
    print(f"{name}: {(public / name).stat().st_size} → {target.stat().st_size} bytes; pixels idênticos")
