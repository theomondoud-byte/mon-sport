import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

test('GET /api/sports-news agrège les flux RSS et conserve source, sport et extrait', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const feed = new URL(String(input));
    if (feed.hostname === 'fflose.com' && feed.pathname.startsWith('/wp-json/')) {
      return Response.json([{
        date_gmt: new Date(Date.now() - 3600e3).toISOString().slice(0, 19),
        link: 'https://fflose.com/2026/11/la-lose-du-jour/',
        title: { rendered: 'La lose du jour' },
        excerpt: { rendered: '<p>Un résumé &eacute;dit&eacute;.</p>' },
        content: { rendered: '<p>Premier paragraphe complet.</p><figure class="wp-block-embed"><blockquote class="twitter-tweet"><p>Le tweet qui résume tout</p></blockquote></figure><p><img src="https://fflose.com/wp-content/uploads/photo.jpg" width="800"></p><p>Dernier paragraphe.</p>' },
        _embedded: { 'wp:featuredmedia': [{ source_url: 'https://fflose.com/wp-content/uploads/une.jpg' }] }
      }]);
    }
    if (feed.hostname === 'articles.example') return new Response('<html><head></head></html>');
    const published = new Date().toUTCString();
    const link = 'https://articles.example/' + encodeURIComponent(feed.hostname + feed.pathname);
    return new Response(`<?xml version="1.0"?><rss><channel><item>
      <title>Actualité sportive de test</title>
      <link>${link}</link>
      <pubDate>${published}</pubDate>
      <description><![CDATA[Résumé éditorial de test]]></description>
      <enclosure url="https://images.example/photo.jpg" type="image/jpeg"/>
    </item></channel></rss>`, { status: 200, headers: { 'Content-Type': 'application/rss+xml' } });
  };
  try {
    const response = await worker.fetch(new Request('https://worker.example/api/sports-news'));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.articles.length, 11);
    const ffl = body.articles.find(article => article.source === 'FFL');
    assert.equal(ffl.image, 'https://fflose.com/wp-content/uploads/une.jpg');
    assert.equal(ffl.text, 'Premier paragraphe complet.\nLe tweet qui résume tout\nDernier paragraphe.');
    assert.ok(ffl.blocks.some(block => block.type === 'img' && block.src === 'https://fflose.com/wp-content/uploads/photo.jpg'));
    assert.ok(body.articles.some(article => article.source === 'Tennis Actu' && article.sport === 'Tennis'));
    assert.ok(body.articles.some(article => article.source === 'Basket USA' && article.sport === 'Basketball'));
    assert.ok(body.articles.some(article => article.source === "Cyclism'Actu" && article.sport === 'Cyclisme'));
    assert.ok(body.articles.filter(article => article.source !== 'FFL').every(article => article.excerpt === 'Résumé éditorial de test'));
    assert.ok(body.feeds.every(feed => feed.ok && feed.count === 1));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
