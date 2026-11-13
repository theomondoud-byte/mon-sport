"""Tests sans accès réseau du collecteur ITTF hommes et femmes."""
import unittest
from scripts.refresh_wtt import parse_wtt_rankings, movement
from bs4 import BeautifulSoup

def fixture(limit=150):
    tables=[]
    for gender in ("women","men"):
        trs=['<tr><th>Rank</th><th>Movement</th><th>Player</th><th>Points</th></tr>']
        for i in range(1,limit+1):
            mv='up 2' if i==2 else 'down 1' if i==3 else 'no change'
            points=9000-i
            trs.append(
                '<tr>'
                f'<td class="rk-pos">{i}</td>'
                f'<td class="rk-mv"><span class="mv" aria-label="{mv}">-</span></td>'
                '<td><span class="rk-player"><span class="rk-name">'
                f'<a>Player {gender} {i}</a></span>'
                '<span class="rk-nat"><a>FRA</a></span></span></td>'
                f'<td class="rk-pts">{points:,}</td>'
                '</tr>'
            )
        tables.append('<table class="rk-table">' + ''.join(trs) + '</table>')
    return '<html>' + ''.join(tables) + '</html>'

class WTTRankingsTests(unittest.TestCase):
    def test_top_150_men_women(self):
        result=parse_wtt_rankings(fixture())
        for gender in ("men","women"):
            rows=result[gender]
            self.assertEqual(len(rows),150)
            self.assertEqual(rows[0]["rank"],1)
            self.assertEqual(rows[0]["points"],8999)
            self.assertEqual(rows[1]["movement"],2)
            self.assertEqual(rows[2]["movement"],-1)
            self.assertEqual(rows[0]["movement"],0)
            self.assertEqual(rows[0]["country"],"FRA")

    def test_incomplete_source_is_rejected(self):
        with self.assertRaisesRegex(ValueError,"lignes au lieu"):
            parse_wtt_rankings(fixture(140))

    def test_movement_uses_explicit_accessible_label(self):
        soup=BeautifulSoup('<span aria-label="up 4">?</span>','html.parser')
        self.assertEqual(movement(soup.span),4)
        self.assertIsNone(movement(BeautifulSoup('<span>?</span>','html.parser').span))

if __name__=="__main__":
    unittest.main()
