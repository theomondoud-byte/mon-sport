#!/usr/bin/env python3
"""Collecte à fréquence limitée des tableaux publics ATP live (sans inventer de valeurs).

La source peut devenir inaccessible ou changer de structure : dans ce cas,
le dernier fichier validé reste en place et le workflow signale un échec.
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
import requests
from bs4 import BeautifulSoup

SOURCE="https://live-tennis.eu/en/atp-live-ranking"
DEST=Path("data/atp-live.json")
HEADERS={"User-Agent":"Mozilla/5.0 (compatible; MonSport/14.1; personal sports dashboard)"}

def txt(el):
    return " ".join(el.stripped_strings).strip() if el else ""

def integer(value):
    value=str(value or "").replace("\u00a0","").replace(",","").replace(" ","").replace("−","-")
    return int(value) if re.fullmatch(r"[-+]?\d+",value) else None

def parse(html, debug=False):
    soup=BeautifulSoup(html,"html.parser")
    table=soup.select_one("table#t900") or soup.select_one("table#u868")
    if not table: raise RuntimeError("Tableau ATP live absent")
    rows=[]
    for tr in table.select("tr"):
        cells=tr.find_all("td",recursive=False)
        # En-tête, publicités et menus du site : ignorés.
        if len(cells)<10 or not cells[0].get("class") or "rk" not in cells[0].get("class"):
            continue
        rank=integer(txt(cells[0]))
        name=txt(cells[3])
        age=integer(txt(cells[4]))
        country=txt(cells[5])
        live_points=integer(txt(cells[6]))
        movement=integer(txt(cells[7]))
        points_change=integer(txt(cells[8]))
        tournament=txt(cells[9])[:120]
        next_points=integer(txt(cells[11])) if len(cells)>11 else None
        max_points=integer(txt(cells[12])) if len(cells)>12 else None
        if rank is None or not name or live_points is None or rank<1 or rank>150:
            continue
        if (next_points is not None and next_points<live_points) or (max_points is not None and max_points<live_points):
            raise RuntimeError("Projection incohérente pour "+name)
        row={"rank":rank,"name":name,"livePoints":live_points,
            "movement":movement,"pointsChange":points_change,
            "age":age,"country":country,"tournament":tournament,
            "nextPoints":next_points,"maxPoints":max_points}
        if debug and len(rows)<2: print("EXTRACTED_ROW",row)
        rows.append(row)
    rows=sorted({r["rank"]:r for r in rows}.values(),key=lambda r:r["rank"])
    if len(rows)!=150 or [r["rank"] for r in rows]!=list(range(1,151)):
        raise RuntimeError(f"Top 150 incomplet : {len(rows)} positions fiables")
    if not all(r["livePoints"]>0 for r in rows):
        raise RuntimeError("Points ATP live invalides")
    return rows

def main():
    args=argparse.ArgumentParser()
    args.add_argument("--dry-run",action="store_true")
    args.add_argument("--debug",action="store_true")
    ns=args.parse_args()
    response=requests.get(SOURCE,headers=HEADERS,timeout=25)
    print("SOURCE_HTTP",response.status_code,"HTML_BYTES",len(response.content))
    response.raise_for_status()
    rows=parse(response.content.decode('utf-8',errors='replace'),debug=ns.debug)
    print("PARSED",len(rows),"TOP",rows[:2])
    data={"source":SOURCE,"fetchedAt":datetime.now(timezone.utc).isoformat(),"rows":rows}
    if not ns.dry_run:
        DEST.parent.mkdir(parents=True,exist_ok=True)
        DEST.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("WRITTEN",DEST)

if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("REFRESH_FAILED",repr(exc),file=sys.stderr)
        sys.exit(1)
