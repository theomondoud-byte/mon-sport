"""Non-régression du collecteur de classement ATP live français."""
import unittest
from datetime import datetime, timezone
from scripts.refresh_atp_live import parse, tournament_status, add_recent_tournaments

class ATPParserTests(unittest.TestCase):
    def test_status_for_previous_tournament_loss(self):
        self.assertEqual(tournament_status("", "Défaite Stockholm 8e"), "defaite")
        self.assertEqual(tournament_status("Qualif. Stockholm V", "Défaite Stockholm 8e"), "defaite")
        self.assertEqual(tournament_status("Orléans QF", "Défaite Stockholm 8e"), "en_lice")
        self.assertEqual(tournament_status("Finales ATP RR (0 V / 0 D)", ""), "en_lice")
        self.assertEqual(tournament_status("", ""), "non_communique")

    def test_two_week_observed_tournament_history(self):
        now=datetime(2026,11,13,10,tzinfo=timezone.utc)
        previous={"fetchedAt":"2026-11-06T09:00:00Z","rows":[{
            "name":"Arthur Fils","tournamentHistory":[
                {"text":"Stockholm QF","lastSeen":"2026-11-06T09:00:00+00:00"},
                {"text":"Paris R32","lastSeen":"2026-10-28T09:00:00+00:00"}]
        }]}
        current=[{"name":"Arthur Fils","tournament":"Finales ATP RR"}]
        updated=add_recent_tournaments(current,previous,now)
        self.assertEqual([x["text"] for x in updated[0]["tournamentHistory"]],
                         ["Finales ATP RR","Stockholm QF"])
        newer=add_recent_tournaments([{"name":"Arthur Fils","tournament":""}],
                  {"fetchedAt":now.isoformat(),"rows":updated},
                  datetime(2026,11,20,10,tzinfo=timezone.utc))
        self.assertEqual([x["text"] for x in newer[0]["tournamentHistory"]],
                         ["Finales ATP RR"])
        expired=add_recent_tournaments([{"name":"Arthur Fils","tournament":""}],
                  {"rows":updated},datetime(2026,11,28,10,tzinfo=timezone.utc))
        self.assertEqual(expired[0]["tournamentHistory"],[])

    def test_two_week_history_from_previous_snapshot_without_history_field(self):
        now=datetime(2026,11,13,10,tzinfo=timezone.utc)
        rows=add_recent_tournaments([{"name":"Rafael Jódar","tournament":"Orléans QF"}],
             {"fetchedAt":"2026-11-12T10:00:00+00:00",
              "rows":[{"name":"Rafael Jódar","tournament":"Stockholm SF"}]},now)
        self.assertEqual([x["text"] for x in rows[0]["tournamentHistory"]],
                         ["Orléans QF","Stockholm SF"])
        duplicate=add_recent_tournaments([{"name":"Rafael Jódar","tournament":"Orléans QF"}],
             {"fetchedAt":now.isoformat(),"rows":rows},now)
        self.assertEqual(len(duplicate[0]["tournamentHistory"]),2)

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
