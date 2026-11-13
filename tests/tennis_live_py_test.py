"""Contrôle de la structure réelle partagée des classements tennis live FR."""
import unittest
from scripts.refresh_tennis_live import SOURCES, parse_live_ranking

def mock_ranking(kind):
    wta = kind == "wta"
    result = []
    for i in range(1, 151):
        current = "Finales WTA RR (2 V / 0 D)" if i == 2 else ""
        previous = "Défaite Stockholm 8e" if i == 3 else ""
        movement = "+1" if i == 2 else ""
        diff = "+400" if i == 2 else ""
        next_points = "6906" if i == 2 else ""
        max_points = "7806" if i == 2 else ""
        points = "6706" if i == 2 else str(5000-i)
        if wta:
            cells = [str(i), "NMC (3)" if i == 2 else "MC", "", f"Joueuse {i}", "19", "FRA",
                     points, movement, diff, current, previous, next_points, max_points]
        else:
            cells = [str(i), "", f"✓ Joueur {i}", "20", "FRA",
                     points, movement, diff, current, previous, next_points, max_points]
        result.append("<tr>" + "".join(
            '<td class="rk">' + c + "</td>"
            if n == 0 else f"<td>{c}</td>"
            for n,c in enumerate(cells)
        ) + "</tr>")
    return '<table id="t900">' + "".join(result) + "</table>"

class TennisSourceTests(unittest.TestCase):
    def test_each_live_source_has_exact_150_positions(self):
        self.assertEqual(set(SOURCES), {"wta","atprace","wtarace","nextgen"})
        for kind in SOURCES:
            with self.subTest(kind=kind):
                rows = parse_live_ranking(mock_ranking(kind), kind)
                self.assertEqual(len(rows), 150)
                self.assertEqual(rows[0]["rank"],1)
                self.assertEqual(rows[-1]["rank"],150)
                self.assertEqual(rows[1]["livePoints"],6706)
                self.assertEqual(rows[1]["movement"],1)
                self.assertEqual(rows[1]["pointsChange"],400)
                self.assertEqual(rows[1]["tournament"],"Finales WTA RR (2 V / 0 D)")
                self.assertEqual(rows[2]["tournamentStatus"],"defaite")
                self.assertEqual(rows[1]["nextPoints"],6906)
                self.assertEqual(rows[1]["maxPoints"],7806)
                self.assertEqual(rows[0]["country"],"FRA")
                if kind == "wta":
                    self.assertEqual(rows[1]["careerHigh"],"NMC (3)")
                else:
                    self.assertEqual(rows[1]["careerHigh"],"")
                    self.assertEqual(rows[1]["name"],"Joueur 2")

    def test_incomplete_source_is_rejected(self):
        html = mock_ranking("nextgen").replace('<td class="rk">150</td>', '<td class="rk">151</td>')
        with self.assertRaisesRegex(ValueError,"incomplet"):
            parse_live_ranking(html,"nextgen")

    def test_projection_below_current_points_is_rejected(self):
        html=mock_ranking("wta").replace("<td>6906</td>", "<td>6000</td>")
        with self.assertRaisesRegex(ValueError,"incohérente"):
            parse_live_ranking(html,"wta")

if __name__=="__main__":
    unittest.main()
