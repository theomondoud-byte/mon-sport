#!/usr/bin/env python3
"""Collecte à fréquence limitée des tableaux publics ATP live (sans inventer de valeurs).

La source peut devenir inaccessible ou changer de structure : dans ce cas,
le dernier fichier validé reste en place et le workflow signale un échec.
"""
import argparse
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
import requests
from bs4 import BeautifulSoup

SOURCE="https://live-tennis.eu/fr/classement-atp-live"
DEST=Path("data/atp-live.json")
HEADERS={"User-Agent":"Mozilla/5.0 (compatible; MonSport/14.1; personal sports dashboard)"}

def txt(el):
    return " ".join(el.stripped_strings).strip() if el else ""

def integer(value):
    value=str(value or "").replace("\u00a0","").replace(",","").replace(" ","").replace("−","-")
    return int(value) if re.fullmatch(r"[-+]?\d+",value) else None

def tournament_status(current, previous):
    """Statut fondé sur une défaite explicitement publiée par la source.

    Une victoire en qualification ne signifie pas qu'un joueur est toujours en lice
    s'il a ensuite perdu dans le tableau principal du même tournoi.
    """
    loss=bool(re.search(r"\b(?:défaite|perdu|éliminé|lost(?: in)?)\b", previous, re.I))
    if not current:
        return "defaite" if loss else "non_communique"
    if not loss:
        return "en_lice"
    def names(text):
        letters=unicodedata.normalize("NFKD",text.lower())
        clean="".join(c for c in letters if not unicodedata.combining(c))
        stop={"defaite","perdu","elimine","lost","qualif","finale","finales",
              "finals","tournoi","round","victory","victoire"}
        return {w for w in re.findall(r"[a-z]{4,}",clean) if w not in stop}
    # Le lieu commun est un signal explicite du même tournoi, pas une déduction des points.
    return "defaite" if names(current)&names(previous) else "en_lice"

def parse(html, debug=False):
    soup=BeautifulSoup(html,"html.parser")
    table=soup.select_one("table#t900") or soup.select_one("table#u868")
    if not table: raise RuntimeError("Tableau ATP live absent")
    rows=[]
    for tr in table.select("tr"):
        cells=tr.find_all("td",recursive=False)
        # En-tête, publicités et menus du site : ignorés.
        if len(cells)<7 or not cells[0].get("class") or "rk" not in cells[0].get("class"):
            continue
        rank=integer(txt(cells[0]))
        name=txt(cells[3])
        age=integer(txt(cells[4]))
        country=txt(cells[5])
        live_points=integer(txt(cells[6]))
        movement=integer(txt(cells[7]))
        points_change=integer(txt(cells[8]))
        tournament=txt(cells[9])[:160] if len(cells)>9 else ""
        previous_tournaments=txt(cells[10])[:240] if len(cells)>10 else ""
        career_high=txt(cells[1])[:35] if len(cells)>1 else ""
        status=tournament_status(tournament,previous_tournaments)
        next_points=integer(txt(cells[11])) if len(cells)>11 else None
        max_points=integer(txt(cells[12])) if len(cells)>12 else None
        if rank is None or not name or live_points is None or rank<1 or rank>150:
            continue
        if (next_points is not None and next_points<live_points) or (max_points is not None and max_points<live_points):
            raise RuntimeError("Projection incohérente pour "+name)
        row={"rank":rank,"name":name,"livePoints":live_points,
            "movement":movement,"pointsChange":points_change,
            "age":age,"country":country,"careerHigh":career_high,
            "tournament":tournament,"previousTournaments":previous_tournaments,
            "tournamentStatus":status,"nextPoints":next_points,"maxPoints":max_points}
        if debug and len(rows)<2: print("EXTRACTED_ROW",row)
        rows.append(row)
    rows=sorted({r["rank"]:r for r in rows}.values(),key=lambda r:r["rank"])
    if debug: print("MISSING",sorted(set(range(1,151))-{r["rank"] for r in rows}))
    if len(rows)!=150 or [r["rank"] for r in rows]!=list(range(1,151)):
        raise RuntimeError(f"Top 150 incomplet : {len(rows)} positions fiables")
    if not all(r["livePoints"]>0 for r in rows):
        raise RuntimeError("Points ATP live invalides")
    return rows


def parse_utc(value):
    try:
        result=datetime.fromisoformat(str(value).replace("Z","+00:00"))
        return result.replace(tzinfo=timezone.utc) if result.tzinfo is None else result.astimezone(timezone.utc)
    except (TypeError,ValueError,OverflowError):
        return None

def add_recent_tournaments(rows, previous=None, now=None):
    """Conserver 14 jours de tournois *observés*, sans inventer de dates de matchs.

    Les classements live ne donnent pas de date par tournoi. On garde la date
    de dernière observation par notre collecteur, pas une date sportive supposée.
    """
    now=now or datetime.now(timezone.utc)
    if now.tzinfo is None: now=now.replace(tzinfo=timezone.utc)
    previous=previous if isinstance(previous,dict) else {}
    prev_at=parse_utc(previous.get("fetchedAt"))
    def key(name):
        name=unicodedata.normalize("NFD",str(name or "").lower())
        return re.sub(r"[^a-z0-9]","", "".join(c for c in name if not unicodedata.combining(c)))
    former={key(p.get("name")):p for p in previous.get("rows",[])
            if isinstance(p,dict) and p.get("name")}
    for row in rows:
        old=former.get(key(row["name"]),{})
        history={}
        observations=old.get("tournamentHistory") or []
        # Rétrocompatibilité du relevé initial, datant de la version précédente.
        if not observations and old.get("tournament") and prev_at:
            observations=[{"text":old["tournament"],"lastSeen":prev_at.isoformat()}]
        for event in observations:
            if not isinstance(event,dict): continue
            text=str(event.get("text") or "").strip()[:160]
            seen=parse_utc(event.get("lastSeen"))
            if not text or seen is None: continue
            age=(now-seen).total_seconds()
            if not (0<=age<14*86400): continue
            history[key(text)]={"text":text,"lastSeen":seen.isoformat()}
        current=str(row.get("tournament") or "").strip()[:160]
        if current:
            history[key(current)]={"text":current,"lastSeen":now.isoformat()}
        row["tournamentHistory"]=sorted(history.values(),key=lambda v:v["lastSeen"],reverse=True)[:10]
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
    previous=None
    if DEST.exists():
        try:
            previous=json.loads(DEST.read_text(encoding="utf-8"))
        except (OSError,UnicodeError,json.JSONDecodeError):
            print("PREVIOUS_SNAPSHOT_INVALID")
    rows=add_recent_tournaments(rows,previous)
    print("PARSED",len(rows),"TOP",rows[:2])
    losses=[(r["name"],r["previousTournaments"]) for r in rows if r["tournamentStatus"]=="defaite"]
    print("DEFAITES_DETECTEES",len(losses),"EXEMPLES",losses[:3])
    print("PROJECTIONS",sum(r["nextPoints"] is not None for r in rows),
          "MAX",sum(r["maxPoints"] is not None for r in rows))
    # Diagnostiquer la concordance réelle avec les joueurs du classement ESPN.
    def key(name):
        text=unicodedata.normalize("NFD",name.lower())
        return " ".join(re.findall(r"[a-z0-9]+","".join(c for c in text if not unicodedata.combining(c))))
    try:
        response_espn=requests.get("https://site.api.espn.com/apis/site/v2/sports/tennis/atp/rankings",
                headers=HEADERS,timeout=15)
        response_espn.raise_for_status()
        groups=response_espn.json().get("rankings",[])
        official={key(v.get("athlete",{}).get("displayName",""))
                  for group in groups for v in group.get("ranks",[])}
        overlap=sum(key(r["name"]) in official for r in rows)
        print("ESPN_NAMES",len(official),"LIVE_MATCHES",overlap)
    except Exception as exc:
        print("ESPN_DIAGNOSTIC_UNAVAILABLE",str(exc)[:130])
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
