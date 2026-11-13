"""Non-régression du collecteur de classement ATP live français."""
import unittest
from scripts.refresh_atp_live import parse, tournament_status

class ATPParserTests(unittest.TestCase):
    def test_status_for_previous_tournament_loss(self):
        self.assertEqual(tournament_status("", "Défaite Stockholm 8e"), "defaite")
        self.assertEqual(tournament_status("Qualif. Stockholm V", "Défaite Stockholm 8e"), "defaite")
        self.assertEqual(tournament_status("Orléans QF", "Défaite Stockholm 8e"), "en_lice")
        self.assertEqual(tournament_status("Finales ATP RR (0 V / 0 D)", ""), "en_lice")
        self.assertEqual(tournament_status("", ""), "non_communique")

    def test_parses_full_top_150_and_explicit_defeats(self):
        rows=[]
        for i in range(1,151):
            curr="Stockholm DF" if i == 1 else "Qualif. Stockholm V" if i == 3 else "Orléans QF" if i == 4 else ""
            prev="Défaite Stockholm 8e" if i in (2,3,4) else ""
            cells=[str(i),"MC" if i==1 else "1","",f"Joueur {i}","29","FRA",
                   str(10000-i),"+2" if i==1 else "", "-200" if i==1 else "",
                   curr,prev,"10100" if i==1 else "", "10200" if i==1 else ""]
            rows.append("<tr>"+ "".join(
                f'<td class="{["rk","chtd","","pn","sm","sm","","rdf","","rst","rst","",""][k]}">{value}</td>'
                for k,value in enumerate(cells)
            )+"</tr>")
        parsed=parse('<table id="t900">'+"".join(rows)+"</table>")
        self.assertEqual(len(parsed),150)
        self.assertEqual(parsed[0]["movement"],2)
        self.assertEqual(parsed[0]["careerHigh"],"MC")
        self.assertEqual(parsed[0]["nextPoints"],10100)
        self.assertEqual(parsed[1]["tournamentStatus"],"defaite")
        self.assertEqual(parsed[2]["tournamentStatus"],"defaite")
        self.assertEqual(parsed[3]["tournamentStatus"],"en_lice")
        self.assertEqual(parsed[149]["rank"],150)

if __name__=="__main__":
    unittest.main()
