#!/usr/bin/env python3
"""Inspection et collecte des classements tennis live publics."""
import argparse
import requests
from bs4 import BeautifulSoup

SOURCES={
 'wta':'https://live-tennis.eu/fr/classement-wta-live',
 'atprace':'https://live-tennis.eu/fr/classement-atp-race',
 'wtarace':'https://live-tennis.eu/fr/classement-wta-race',
 'nextgen':'https://live-tennis.eu/fr/classement-atp-race-next-gen',
}
HEADERS={"User-Agent":"Mozilla/5.0 (compatible; MonSport/14.5; personal sports dashboard)"}

def diagnose():
 for key,url in SOURCES.items():
  response=requests.get(url,headers=HEADERS,timeout=30)
  print("SOURCE",key,response.status_code,len(response.content),response.url,flush=True)
  response.raise_for_status()
  soup=BeautifulSoup(response.content,'html.parser')
  tables=[(t.get('id'),len(t.select('tr'))) for t in soup.select('table')]
  print("TABLES",key,tables[:20],flush=True)
  table=next((t for t in soup.select('table') if len(t.select('tr'))>12),None)
  if table:
   for tr in table.select('tr')[:7]:
    cells=tr.find_all('td',recursive=False)
    if cells:
     print("ROW",key,[(i,td.get('class'),' '.join(td.stripped_strings)[:70]) for i,td in enumerate(cells[:14])],flush=True)
     break

if __name__=="__main__":
 parser=argparse.ArgumentParser()
 parser.add_argument('--diagnose',action='store_true')
 args=parser.parse_args()
 if args.diagnose: diagnose()
 else: print("Collector under development; use --diagnose.")
