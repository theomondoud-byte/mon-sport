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
        self.assertEqual(posts[0]['text'],long.strip())


    def test_all_images_and_video_from_the_original_post(self):
        now=datetime(2026,11,13,12,tzinfo=timezone.utc)
        ident=post_id(now-timedelta(minutes=9))
        html=(
          f'<div class="timeline-item" data-username="JeuSetMaths">'
          f'<a class="tweet-link" href="/JeuSetMaths/status/{ident}"></a>'
          '<div class="tweet-content">📊 Le post complet contient plusieurs chiffres et graphiques.</div>'
          '<div class="attachments"><div class="gallery-row">'
          '<a class="still-image" href="https://pbs.twimg.com/media/graph1.jpg?name=orig">'
          '<img src="https://pbs.twimg.com/media/graph1.jpg?name=small"></a>'
          '<a class="still-image" href="https://pbs.twimg.com/media/graph2.png?name=orig">'
          '<img src="https://pbs.twimg.com/media/graph2.png?name=small"></a>'
          '</div><video><source src="https://video.twimg.com/amplify_video/123/vid/avc1/1280x720/a.mp4?tag=1"></video>'
          '</div></div>'
        )
        posts=parse_posts(html,now=now)
        self.assertEqual(len(posts),1)
        self.assertEqual(posts[0]['text'],'📊 Le post complet contient plusieurs chiffres et graphiques.')
        self.assertEqual(posts[0]['images'],[
            'https://pbs.twimg.com/media/graph1.jpg?name=orig',
            'https://pbs.twimg.com/media/graph2.png?name=orig'])
        self.assertEqual(posts[0]['image'],posts[0]['images'][0])
        self.assertEqual(posts[0]['video'],
                         'https://video.twimg.com/amplify_video/123/vid/avc1/1280x720/a.mp4?tag=1')

    def test_external_media_are_not_embedded(self):
        now=datetime(2026,11,13,12,tzinfo=timezone.utc)
        ident=post_id(now-timedelta(minutes=8))
        html=(
          f'<div class="timeline-item" data-username="JeuSetMaths">'
          f'<a class="tweet-link" href="/JeuSetMaths/status/{ident}"></a>'
          '<div class="tweet-content">📊 Quelques chiffres tennis sont disponibles.</div>'
          '<div class="attachments">'
          '<a class="still-image" href="https://evil.example/media/a.jpg"></a>'
          '<video><source src="https://evil.example/video.mp4"></video></div></div>'
        )
        posts=parse_posts(html,now=now)
        self.assertEqual(len(posts),1)
        self.assertEqual(posts[0]['images'],[])
        self.assertIsNone(posts[0]['video'])


    def test_newlines_and_paragraphs_are_preserved_for_mobile(self):
        now=datetime(2026,11,13,12,tzinfo=timezone.utc)
        ident=post_id(now-timedelta(hours=2))
        original="📊 Bilan des finalistes sur le circuit ATP :\\n\\n▪️ 2001 : Serena Williams\\n↪️ 6/0 6/2\\n↪️ 6/3 6/0\\n\\n🆕 2026 : Mirra Andreeva"
        html=(f'<div class="timeline-item" data-username="JeuSetMaths">'
              f'<a class="tweet-link" href="/JeuSetMaths/status/{ident}"></a>'
              f'<div class="tweet-content">{original}</div></div>')
        row=parse_posts(html,now=now)[0]
        self.assertEqual(row['text'],original)
        self.assertNotIn('\\n',row['title'])
        self.assertIn('▪️ 2001 : Serena Williams',row['title'])


if __name__ == '__main__':
    unittest.main()
