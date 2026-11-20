#!/usr/bin/env python3
"""Cartas Bakugan — agrega o quita cartas en cartas.json.

Las fotos se copian 100% intactas, byte a byte (no se recortan, no se
redimensionan y no se recomprimen). Tras el cp se verifica el SHA-256
del original y del archivo en img/.

Ejemplos:
  python3 agregar_carta.py --nombre "Dragonoid" --serie "Battle Brawlers" \\
      --tipo Character --atributo Pyrus --rareza Rare --idioma Español \\
      --anio 2009 --estado NM --precio-min 3000 --precio-max 6000 \\
      --fotos frente.jpg reverso.jpg

  python3 agregar_carta.py --listar
  python3 agregar_carta.py --quitar BGN-001
  python3 agregar_carta.py --quitar 1
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import os
import shutil
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
JSON = os.path.join(BASE, "cartas.json")
IMG = os.path.join(BASE, "img")

SERIES = [
    "Battle Brawlers",
    "New Vestroia",
    "Gundalian Invaders",
    "Mechtanium Surge",
    "Battle Planet",
    "Armored Alliance",
    "Geogan Rising",
    "Evolutions",
    "Legends",
]
ATRIBUTOS = ["Pyrus", "Aquos", "Ventus", "Subterra", "Haos", "Darkus", "Aurelus"]
TIPOS = ["Ability", "Gate", "Character", "Evo", "Normal", "Command", "Special", "Bakugan", "Action", "Baku-Gear", "Flip", "Gate Trainer"]
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".tif", ".tiff", ".bmp", ".heic"}


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def copiar_intacta(origen: str, destino: str) -> str:
    """Copia byte a byte y comprueba que el SHA-256 coincida."""
    if not os.path.isfile(origen):
        raise SystemExit(f"No existe el archivo de foto: {origen}")
    os.makedirs(os.path.dirname(destino) or ".", exist_ok=True)
    shutil.copyfile(origen, destino)  # copia cruda, sin transformar
    a, b = sha256(origen), sha256(destino)
    if a != b or os.path.getsize(origen) != os.path.getsize(destino):
        raise SystemExit(
            f"ERROR: la copia no quedó intacta.\n  origen  {a}  {origen}\n  destino {b}  {destino}"
        )
    print(f"  foto intacta  sha256={a}  {origen} → {destino}")
    return b


def cargar() -> dict:
    with open(JSON, encoding="utf-8") as f:
        d = json.load(f)
    d.setdefault("cartas", [])
    return d


def guardar(d: dict) -> None:
    d["actualizado"] = datetime.date.today().isoformat()
    with open(JSON, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write("\n")


def siguiente_codigo(cartas: list) -> tuple[int, str]:
    ids = [int(c["id"]) for c in cartas if str(c.get("id", "")).isdigit()]
    nxt = (max(ids) if ids else 0) + 1
    return nxt, f"BGN-{nxt:03d}"


def find_card(cartas: list, clave: str) -> dict | None:
    clave = str(clave).strip()
    for c in cartas:
        if str(c.get("codigo")) == clave or str(c.get("id")) == clave:
            return c
    return None


def listar(d: dict) -> None:
    cartas = d["cartas"]
    if not cartas:
        print("No hay cartas en cartas.json (el catálogo está listo para agregar).")
        return
    for c in cartas:
        precio = ""
        if c.get("precio_min_clp") is not None and c.get("precio_max_clp") is not None:
            precio = f"${c['precio_min_clp']:,}–${c['precio_max_clp']:,} CLP".replace(",", ".")
        elif c.get("precio_sugerido_clp") is not None:
            precio = f"${c['precio_sugerido_clp']:,} CLP".replace(",", ".")
        print(
            f"{c.get('codigo') or c.get('id'):8}  {c.get('nombre','?'):30}  "
            f"{c.get('serie') or ''}  {c.get('atributo') or ''}  {c.get('tipo') or ''}  {precio}"
        )
    print(f"\n{len(cartas)} carta(s) distinta(s).")


def quitar(d: dict, clave: str) -> None:
    c = find_card(d["cartas"], clave)
    if not c:
        raise SystemExit(f"No encontré la carta {clave}.")
    d["cartas"] = [x for x in d["cartas"] if x is not c]
    guardar(d)
    print(f"Quité {c.get('codigo')} — {c.get('nombre')}. Las fotos en img/ se dejan (bórralas a mano si ya no las usas).")


def letras(n: int):
    for i in range(n):
        s, x = "", i
        while True:
            s = chr(ord("a") + x % 26) + s
            x = x // 26 - 1
            if x < 0:
                break
        yield s


def agregar(args: argparse.Namespace) -> None:
    if not args.nombre:
        raise SystemExit("Falta --nombre.")
    if args.tipo and args.tipo not in TIPOS:
        print(f"  aviso: tipo «{args.tipo}» no está en la lista habitual ({', '.join(TIPOS)}). Lo dejo igual.")
    if args.atributo and args.atributo not in ATRIBUTOS:
        print(f"  aviso: atributo «{args.atributo}» no está en la lista habitual ({', '.join(ATRIBUTOS)}). Lo dejo igual.")
    if args.serie and args.serie not in SERIES:
        print(f"  aviso: serie «{args.serie}» no está en la lista habitual. Lo dejo igual.")

    d = cargar()
    nid, codigo = siguiente_codigo(d["cartas"])
    if args.codigo:
        if find_card(d["cartas"], args.codigo):
            raise SystemExit(f"Ya existe una carta con código {args.codigo}.")
        codigo = args.codigo

    fotos = list(args.fotos or [])
    imagenes = []
    if fotos:
        os.makedirs(IMG, exist_ok=True)
        for origen, letra in zip(fotos, letras(len(fotos))):
            ext = os.path.splitext(origen)[1].lower() or ".jpg"
            if ext not in EXTS:
                print(f"  aviso: extensión poco habitual en {origen} ({ext}). Igual la copio intacta.")
            dest_name = f"{codigo}-{letra}{ext}"
            dest = os.path.join(IMG, dest_name)
            if os.path.exists(dest):
                raise SystemExit(f"Ya existe {dest}; no lo sobrescribo.")
            copiar_intacta(origen, dest)
            imagenes.append(f"img/{dest_name}")

    precio_sug = args.precio
    if precio_sug is None and args.precio_min is not None and args.precio_max is not None:
        precio_sug = int(round((args.precio_min + args.precio_max) / 2))

    carta = {
        "id": nid,
        "codigo": codigo,
        "nombre": args.nombre,
        "nombre_en": args.nombre_en,
        "serie": args.serie,
        "set": args.set,
        "codigo_set": args.codigo_set,
        "numero": args.numero,
        "anio": args.anio,
        "tipo": args.tipo,
        "atributo": args.atributo,
        "rareza": args.rareza,
        "idioma": args.idioma,
        "estado": args.estado,
        "cantidad": args.cantidad,
        "efecto": args.efecto,
        "precio_mercado_usd": args.precio_usd,
        "precio_mercado_clp": args.precio_mercado,
        "precio_sugerido_clp": precio_sug,
        "precio_min_clp": args.precio_min,
        "precio_max_clp": args.precio_max,
        "dolar_clp": args.dolar,
        "fuente": args.fuente,
        "fecha_precio": datetime.date.today().isoformat() if (precio_sug or args.precio_mercado or args.precio_usd) else None,
        "fecha_alta": datetime.date.today().isoformat(),
        "nota": args.nota,
        "imagen": imagenes[0] if imagenes else None,
        "imagenes": imagenes,
    }
    d["cartas"].append(carta)
    if args.dolar:
        d["dolar_clp"] = args.dolar
    guardar(d)
    print(f"✓ Agregada {codigo} — {args.nombre} (id {nid}).")
    print("  Publica con: ./publicar.sh")


def main() -> None:
    p = argparse.ArgumentParser(description="Agrega o quita cartas Bakugan. Las fotos se copian byte a byte.")
    p.add_argument("--listar", action="store_true", help="Lista las cartas del catálogo")
    p.add_argument("--quitar", metavar="CODIGO_O_ID", help="Quita una carta (BGN-001 o id numérico)")
    p.add_argument("--nombre")
    p.add_argument("--nombre-en")
    p.add_argument("--serie", help="Battle Brawlers, New Vestroia, Gundalian Invaders, Mechtanium Surge, Battle Planet, Armored Alliance, Geogan Rising, Evolutions, Legends")
    p.add_argument("--set", dest="set", help="Nombre del set o expansión, si es más específico que la serie")
    p.add_argument("--codigo-set")
    p.add_argument("--numero")
    p.add_argument("--anio", type=int)
    p.add_argument("--tipo", help="Ability, Gate, Character o Evo")
    p.add_argument("--atributo", help="Pyrus, Aquos, Ventus, Subterra, Haos, Darkus o Aurelus")
    p.add_argument("--rareza")
    p.add_argument("--idioma", default="Español")
    p.add_argument("--estado", default="NM")
    p.add_argument("--cantidad", type=int, default=1)
    p.add_argument("--efecto")
    p.add_argument("--nota")
    p.add_argument("--precio", type=int, help="Precio sugerido único en CLP")
    p.add_argument("--precio-min", type=int, help="Mínimo del rango sugerido en CLP")
    p.add_argument("--precio-max", type=int, help="Máximo del rango sugerido en CLP")
    p.add_argument("--precio-mercado", type=int, help="Precio de mercado en CLP")
    p.add_argument("--precio-usd", type=float)
    p.add_argument("--dolar", type=float, help="Dólar observado usado en la conversión")
    p.add_argument("--fuente", help="URL o nota de la referencia de precio")
    p.add_argument("--codigo", help="Código forzado (por defecto BGN-001, BGN-002, …)")
    p.add_argument("--fotos", nargs="+", help="Fotos originales; se copian intactas a img/")
    args = p.parse_args()

    if args.listar:
        listar(cargar()); return
    if args.quitar:
        quitar(cargar(), args.quitar); return
    if not args.nombre:
        p.print_help()
        sys.exit(1)
    agregar(args)


if __name__ == "__main__":
    main()
