"""Validation des posts récents @JeuSetMaths et des liens originaux X."""
import unittest
from datetime import datetime, timezone, timedelta
from scripts.refresh_jeu_set_maths import parse_posts, timestamp_from_id, TWITTER_EPOCH_MS


def post_id(instant, serial=10):
    return str(((int(instant.timestamp()*1000) - TWITTER_EPOCH_MS) << 22) + serial)


class SocialPostsTests(unittest.TestCase):
    def test_recent_posts_from_exact_author_and_original_link(self):
        now=datetime(2026,11,13,12,tzinfo=timezone.utc)
        recent=post_id(now-timedelta(hours=3))
        old=post_id(now-timedelta(days=10))
        other=post_id(now-timedelta(hours=4),20)
        html=(
          f'<div class="timeline-item author-JeuSetMaths" data-username="JeuSetMaths">'
          f'<a class="tweet-link" href="/JeuSetMaths/status/{recent}#m"></a>'
          '<div class="tweet-content">📊 Le classement ATP évolue cette semaine !</div></div>'
          f'<div class="timeline-item" data-username="JeuSetMaths">'
          f'<a class="tweet-link" href="/JeuSetMaths/status/{old}#m"></a>'
          '<div class="tweet-content">Ancien résultat de tennis.</div></div>'
          f'<div class="timeline-item" data-username="AnotherUser">'
          f'<a class="tweet-link" href="/JeuSetMaths/status/{other}"></a>'
          '<div class="tweet-content">Faux auteur, ne pas inclure.</div></div>'
        )
        posts=parse_posts(html,now=now)
        self.assertEqual(len(posts),1)
        self.assertEqual(posts[0]['link'],f'https://x.com/JeuSetMaths/status/{recent}')
        self.assertEqual(posts[0]['source'],'Jeu, set et maths')
        self.assertEqual(posts[0]['sport'],'Tennis')
        self.assertTrue(posts[0]['date'].startswith('2026-11-13'))
        self.assertIsNone(timestamp_from_id('not-a-post'))

    def test_posts_are_short_excerpts_not_full_copies(self):
        now=datetime(2026,11,13,12,tzinfo=timezone.utc)
        ident=post_id(now-timedelta(minutes=4))
        long='Jeu set et maths données tennis statistiques ATP ' * 25
        html=(f'<div class="timeline-item" data-username="JeuSetMaths">'
              f'<a class="tweet-link" href="/JeuSetMaths/status/{ident}"></a>'
              f'<div class="tweet-content">{long}</div></div>')
        posts=parse_posts(html,now=now)
        self.assertEqual(len(posts),1)
        self.assertLessEqual(len(posts[0]['title']),172)
        self.assertNotIn(long,posts[0]['title'])


if __name__ == '__main__':
    unittest.main()
