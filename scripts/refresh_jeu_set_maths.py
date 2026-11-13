#!/usr/bin/env python3
"""Derniers posts publics du compte X @JeuSetMaths, avec liens originaux.

Lecture d'une page publique indexant les posts (pas de clé privée).
Si la source échoue, aucune publication fictive ne remplace le dernier relevé.
"""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

PROFILE = "https://x.com/JeuSetMaths"
PUBLIC_MIRROR = "https://teapawt.org/JeuSetMaths"
OUTPUT = Path("data/jeu-set-et-maths.json")
TWITTER_EPOCH_MS = 1288834974657
WEEK_MS = 7 * 86400000
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; MonSport/15; public sports posts)"}


def timestamp_from_id(value):
    if not re.fullmatch(r"\d{16,20}", str(value)):
        return None
    stamp = (int(value) >> 22) + TWITTER_EPOCH_MS
    try:
        return datetime.fromtimestamp(stamp / 1000, timezone.utc)
    except (ValueError, OverflowError, OSError):
        return None


def parse_posts(html, *, now=None):
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    soup = BeautifulSoup(html, "html.parser")
    output = []
    used = set()
    for item in soup.select(".timeline-item[data-username]"):
        if str(item.get("data-username", "")).casefold() != "jeusetmaths":
            continue
        a = item.select_one('a.tweet-link[href*="/JeuSetMaths/status/"]')
        content = item.select_one(".tweet-content")
        if not a or not content:
            continue
        match = re.search(r"/JeuSetMaths/status/(\d{16,20})", a.get("href", ""), re.I)
        if not match or match.group(1) in used:
            continue
        id = match.group(1)
        date = timestamp_from_id(id)
        if date is None or not (0 <= (now - date).total_seconds() <= 7 * 86400):
            continue
        text = content.get_text(" ", strip=True)
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) < 18 or text.startswith("@"):
            continue
        # Présentation d'un extrait, et non copie complète des longs posts.
        title = text[:170].rstrip()
        if len(text) > 170:
            title = title.rsplit(" ", 1)[0] + "…"
        image = None
        for img in item.select("img"):
            url = str(img.get("src") or "")
            if re.match(r"^https://pbs\.twimg\.com/media/", url):
                image = url
                break
        used.add(id)
        output.append({
            "title": title, "link": f"https://x.com/JeuSetMaths/status/{id}",
            "date": date.isoformat(), "source": "Jeu, set et maths",
            "favorite": "Jeu, set et maths", "sport": "Tennis",
            "image": image
        })
    return sorted(output, key=lambda x: x["date"], reverse=True)[:25]


def refresh():
    response = requests.get(PUBLIC_MIRROR, headers=HEADERS, timeout=25)
    response.raise_for_status()
    posts = parse_posts(response.text)
    print("JSM_SOURCE", response.status_code, "POSTS_7D", len(posts), flush=True)
    if not posts:
        raise ValueError("Aucun post récent vérifiable, conservation du relevé précédent.")
    content = {
        "source": PROFILE,
        "retrievedFrom": PUBLIC_MIRROR,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "posts": posts
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("JSM_WRITTEN", str(OUTPUT), posts[0]["link"], flush=True)


if __name__ == "__main__":
    refresh()
