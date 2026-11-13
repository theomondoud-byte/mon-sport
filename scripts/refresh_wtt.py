#!/usr/bin/env python3
"""Enregistre les top 150 hommes/femmes du classement hebdomadaire ITTF.

Source de consultation publique : Eleven Table Tennis, avec lien vers l'ITTF.
Il ne s'agit pas de classements ATP ni de scores en direct.
"""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
import requests
from bs4 import BeautifulSoup

SOURCE = "https://www.eleventabletennis.com/rankings"
OFFICIAL = "https://www.ittf.com/rankings/"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; MonSport/14.7; personal sports dashboard)"}
LIMIT = 150


def positive_number(value):
    text = re.sub(r"[\s,\u00a0]", "", str(value or ""))
    return int(text) if re.fullmatch(r"\d+", text) else None


def movement(cell):
    if cell is None:
        return None
    label = str(cell.get("aria-label", "")).lower().strip()
    match = re.search(r"\b(up|down)\s+(\d+)\b", label)
    if match:
        return int(match.group(2)) * (1 if match.group(1) == "up" else -1)
    if "no change" in label or "same" in label:
        return 0
    return None


def parse_wtt_rankings(html):
    soup = BeautifulSoup(html, "html.parser", from_encoding="utf-8")
    tables = soup.select("table.rk-table")
    if len(tables) < 2:
        raise ValueError("Les deux tableaux hebdomadaires WTT/ITTF sont introuvables.")
    result = {}
    for gender, table in zip(("women", "men"), tables[:2]):
        players = []
        for tr in table.select("tr"):
            rank = positive_number(tr.select_one("td.rk-pos").get_text(" ", strip=True)) if tr.select_one("td.rk-pos") else None
            name_el = tr.select_one("td .rk-name")
            nation_el = tr.select_one("td .rk-nat")
            pts_el = tr.select_one("td.rk-pts")
            if rank is None or not name_el or not nation_el or not pts_el:
                continue
            name = name_el.get_text(" ", strip=True)[:120]
            country = nation_el.get_text(" ", strip=True)[:6]
            points = positive_number(pts_el.get_text(" ", strip=True))
            if not name or not re.fullmatch(r"[A-Z]{3}", country) or points is None:
                continue
            mv = movement(tr.select_one("td.rk-mv .mv"))
            players.append({"rank": rank, "name": name, "country": country,
                            "points": points, "movement": mv})
            if len(players) == LIMIT:
                break
        if len(players) != LIMIT:
            raise ValueError(f"{gender}: {len(players)} lignes au lieu de {LIMIT}")
        if any(players[n]["rank"] < players[n-1]["rank"] for n in range(1, LIMIT)):
            raise ValueError(f"{gender}: ordre des rangs incohérent")
        if len({row["name"].casefold() for row in players}) != LIMIT:
            raise ValueError(f"{gender}: joueurs en double")
        result[gender] = players
    return result


def refresh():
    response = requests.get(SOURCE, headers=HEADERS, timeout=25)
    print("WTT_SOURCE",response.status_code,"bytes",len(response.content),flush=True)
    response.raise_for_status()
    rankings = parse_wtt_rankings(response.content)
    soup=BeautifulSoup(response.content,"html.parser",from_encoding="utf-8")
    match=re.search(r"\bweek\s+(\d{1,2})\b",soup.get_text(" ",strip=True),re.I)
    week=int(match.group(1)) if match else None
    now=datetime.now(timezone.utc).isoformat()
    for gender, rows in rankings.items():
        path=Path(f"data/wtt-{gender}.json")
        data={"source":SOURCE,"officialSource":OFFICIAL,"fetchedAt":now,
              "week":week,"rows":rows}
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("WTT_PARSED",gender,"count",len(rows),"week",week,
              "top",rows[0],"france",sum(x["country"]=="FRA" for x in rows),flush=True)


if __name__=="__main__":
    refresh()
