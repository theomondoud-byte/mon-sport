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
  table=soup.select_one('table#t900') or soup.select_one('table#u868')
  if table:
   examples=0
   for tr in table.select('tr'):
    if not tr.select_one('td.rk'): continue
    cells=tr.find_all('td',recursive=False)
    if cells:
     print("ROW",key,[(i,td.get('class'),' '.join(td.stripped_strings)[:70]) for i,td in enumerate(cells[:14])],flush=True)
     examples+=1
     if examples>=3: break

if __name__=="__main__":
 parser=argparse.ArgumentParser()
 parser.add_argument('--diagnose',action='store_true')
 args=parser.parse_args()
 if args.diagnose: diagnose()
 else: print("Collector under development; use --diagnose.")
