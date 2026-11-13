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
    table=soup.select_one("tbody.flags")
    if table is None:
        tables=soup.select("table")
        if debug: print("TABLES",len(tables),[(i,t.get("class"),t.get("id"),len(t.select("tr")),txt(t)[:110]) for i,t in enumerate(tables)])
        table=next((t for t in tables if t.select_one("td.t-name")),None)
    if table is None: raise RuntimeError("tableau HTML introuvable")
    rows=[]
    for tr in table.select("tr"):
        cells=tr.find_all("td",recursive=False)
        if not cells: continue
        if debug and len(rows)<2:
            print("RAW_ROW",[(c.get("class"),txt(c)[:100],c.get("title")) for c in cells])
        rank=integer(txt(tr.select_one("td.rank.first") or tr.select_one("td.rank")))
        name=txt(tr.select_one("td.t-name"))
        points=integer(txt(tr.select_one("td.long-point")))
        if rank is None or not name or points is None or rank>150: continue
        # Les données supplémentaires ne sont conservées que lorsque les cellules
        # de la source peuvent être identifiées sans ambiguïté.
        rows.append({"rank":rank,"name":name,"livePoints":points})
    rows=sorted({r["rank"]:r for r in rows}.values(), key=lambda r:r["rank"])
    if len(rows)<140: raise RuntimeError(f"Seulement {len(rows)} rangs lisibles, conservation du précédent relevé")
    return rows[:150]

def main():
    args=argparse.ArgumentParser()
    args.add_argument("--dry-run",action="store_true")
    args.add_argument("--debug",action="store_true")
    ns=args.parse_args()
    response=requests.get(SOURCE,headers=HEADERS,timeout=25)
    print("SOURCE_HTTP",response.status_code,"HTML_BYTES",len(response.content))
    response.raise_for_status()
    rows=parse(response.text,debug=ns.debug)
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
