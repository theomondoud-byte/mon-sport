#!/usr/bin/env python3
"""Récupère les classements tennis live FR vérifiés : WTA, Race ATP/WTA, Next Gen.

Un fichier invalide n'est jamais substitué au dernier relevé correct.
Les dates correspondent aux relevés, pas aux rencontres.
"""
import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from scripts.refresh_atp_live import txt, integer, tournament_status, add_recent_tournaments

SOURCES = {
    "wta": "https://live-tennis.eu/fr/classement-wta-live",
    "atprace": "https://live-tennis.eu/fr/classement-atp-race",
    "wtarace": "https://live-tennis.eu/fr/classement-wta-race",
    "nextgen": "https://live-tennis.eu/fr/classement-atp-race-next-gen",
}
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; MonSport/14.5; personal sports dashboard)"}
DIR = Path("data")


def parse_live_ranking(html, kind, *, limit=150):
    """Colonnes : WTA (avec MC) ou Race/NextGen (sans MC), dans le même ordre FR."""
    if kind not in SOURCES:
        raise ValueError("Classement inconnu : " + str(kind))
    table = BeautifulSoup(html, "html.parser").select_one("table#t900")
    if table is None:
        raise ValueError("Tableau t900 absent : " + kind)
    wta = kind == "wta"
    # Dans le classement WTA simple, la colonne MC précède le nom de la joueuse.
    offset = 1 if wta else 0
    players = {}
    for tr in table.select("tr"):
        cells = tr.find_all("td", recursive=False)
        if not cells or "rk" not in (cells[0].get("class") or []):
            continue
        rank = integer(txt(cells[0]))
        if rank is None or rank < 1 or rank > limit:
            continue
        name_idx, age_idx, country_idx, points_idx = (
            2 + offset, 3 + offset, 4 + offset, 5 + offset
        )
        if len(cells) <= points_idx:
            continue
        name = re.sub(r"^[✓✗✔✘×]\s*", "", txt(cells[name_idx])).strip()[:120]
        points = integer(txt(cells[points_idx]))
        if not name or points is None or points < 0:
            continue

        def value(index):
            return txt(cells[index]) if index < len(cells) else ""

        tournament = value(8 + offset)[:160]
        previous = value(9 + offset)[:240]
        next_points = integer(value(10 + offset))
        max_points = integer(value(11 + offset))
        # Les projections sont des *totaux* ; une valeur inférieure aux points live
        # signale probablement un changement de structure de la source.
        if (next_points is not None and next_points < points) or (
                max_points is not None and max_points < points):
            raise ValueError("Projection incohérente : " + kind + " / " + name)
        age = integer(value(age_idx))
        movement = integer(value(6 + offset))
        points_change = integer(value(7 + offset))
        players[rank] = {
            "rank": rank,
            "name": name,
            "age": age,
            "country": value(country_idx)[:6],
            "livePoints": points,
            "careerHigh": value(1)[:35] if wta else "",
            "movement": movement,
            "pointsChange": points_change,
            "tournament": tournament,
            "previousTournaments": previous,
            "tournamentStatus": tournament_status(tournament, previous),
            "nextPoints": next_points,
            "maxPoints": max_points,
        }
    if len(players) != limit or sorted(players) != list(range(1, limit + 1)):
        raise ValueError(f"{kind} : classement incomplet : {len(players)} sur {limit}")
    return [players[i] for i in range(1, limit + 1)]


def refresh(kind, *, dry_run=False):
    url = SOURCES[kind]
    response = requests.get(url, headers=HEADERS, timeout=30)
    print("SOURCE", kind, response.status_code, len(response.content), flush=True)
    response.raise_for_status()
    rows = parse_live_ranking(response.content, kind)
    path = DIR / f"{kind}-live.json"
    previous = {}
    if path.exists():
        try:
            previous = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            print("PREVIOUS_SNAPSHOT_INVALID", kind, flush=True)
    now = datetime.now(timezone.utc)
    rows = add_recent_tournaments(rows, previous, now=now)
    data = {"source": url, "fetchedAt": now.isoformat(), "rows": rows}
    print("PARSED", kind, len(rows), "FIRST", rows[0]["name"], "LAST", rows[-1]["name"],
          "NEXT_MAX", sum(r["nextPoints"] is not None for r in rows),
          "PREVIOUS", sum(bool(r["previousTournaments"]) for r in rows), flush=True)
    if not dry_run:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("WRITTEN", path, flush=True)
    return data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--diagnose", action="store_true")
    args = parser.parse_args()
    successes, failures = [], []
    for kind in SOURCES:
        try:
            refresh(kind, dry_run=args.diagnose)
            successes.append(kind)
        except Exception as error:
            print("SOURCE_FAILED", kind, type(error).__name__, str(error)[:250], flush=True)
            failures.append(kind)
    print("COLLECTION_SUMMARY", {"success": successes, "failed": failures}, flush=True)
    if not successes:
        raise SystemExit("Aucun classement tennis récupéré.")


if __name__ == "__main__":
    main()
