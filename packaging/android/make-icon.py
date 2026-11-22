#!/usr/bin/env python3
"""The owl as the app's icon on Android, where a launcher cuts an icon to its
own shape (a circle, a rounded square) out of the middle of a larger sheet.

Tauri's `tauri icon` lays the drawing over the whole sheet, and the launcher
then shows the beak and half of each eye. Here the drawing is only scaled,
as everywhere, and set in the middle of the sheet at the size the launchers
leave whole; the ground behind it is the white the drawing has itself
(`values/ic_launcher_background.xml`).

    python3 packaging/android/make-icon.py

writes `ic_launcher_foreground.png` for each density into the Android project.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OWL = ROOT / "resources/brand/owl-icon.png"
RES = ROOT / "src-phone/gen/android/app/src/main/res"
# The sheet is 108 units square; what every launcher shows of it lies within
# the 66 in its middle.
SHEET, WHOLE = 108, 66
SIZES = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}

owl = Image.open(OWL).convert("RGBA")
for density, side in SIZES.items():
    drawn = round(side * WHOLE / SHEET)
    sheet = Image.new("RGBA", (side, side), (255, 255, 255, 0))
    sheet.paste(owl.resize((drawn, drawn), Image.LANCZOS), ((side - drawn) // 2,) * 2)
    sheet.save(RES / f"mipmap-{density}" / "ic_launcher_foreground.png")
    print(f"mipmap-{density}: {side} px, the owl {drawn} px")
