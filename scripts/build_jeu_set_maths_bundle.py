#!/usr/bin/env python3
"""Publie un module ES vérifiable depuis le dernier relevé validé de @JeuSetMaths.

Le module est importé directement par la PWA. Les posts restent disponibles
sur Android même lorsque la requête JSON séparée est bloquée.
"""
import json
from pathlib import Path

SOURCE=Path("data/jeu-set-et-maths.json")
DESTINATION=Path("data/jeu-set-et-maths-bundle.js")

def build(source=SOURCE, destination=DESTINATION):
    data=json.loads(Path(source).read_text(encoding="utf-8"))
    if (data.get("source")!="https://x.com/JeuSetMaths"
            or not isinstance(data.get("posts"),list) or not data["posts"]):
        raise ValueError("Flux Jeu Set Maths incomplet ou source non vérifiée")
    output=(
        "// Généré depuis data/jeu-set-et-maths.json : disponibilité intégrée dans l'application mobile.\n"
        "// Ne pas éditer à la main. Généré par scripts/build_jeu_set_maths_bundle.py\n"
        "export const jeuSetMathsBundledData = "
        +json.dumps(data,ensure_ascii=False,indent=1)+";\n"
    )
    Path(destination).write_text(output,encoding="utf-8")
    print("JSM_BUNDLE",len(data["posts"]),str(destination),flush=True)
    return len(data["posts"])

if __name__=="__main__":
    build()
