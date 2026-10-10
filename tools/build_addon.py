#!/usr/bin/env python3
"""Packages the two packs into dist/GrandLine_Haki_Clash.mcaddon (double-click to import into Minecraft)."""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
OUT = os.path.join(DIST, "GrandLine_Haki_Clash.mcaddon")


def add_dir(z, base, arc_root):
    for dirpath, _dirs, files in os.walk(base):
        for name in sorted(files):
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, base)
            z.write(full, os.path.join(arc_root, rel))


def main():
    os.makedirs(DIST, exist_ok=True)
    if os.path.exists(OUT):
        os.remove(OUT)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        add_dir(z, os.path.join(ROOT, "packs", "GrandLine_BP"), "GrandLine_BP")
        add_dir(z, os.path.join(ROOT, "packs", "GrandLine_RP"), "GrandLine_RP")
    print(f"wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} KB)")


if __name__ == "__main__":
    main()
