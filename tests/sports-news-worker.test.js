import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

test('GET /api/sports-news agrège les flux RSS et conserve source, sport et extrait', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const feed = new URL(String(input));
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
    assert.equal(body.articles.length, 10);
    assert.ok(body.articles.some(article => article.source === 'Tennis Actu' && article.sport === 'Tennis'));
    assert.ok(body.articles.some(article => article.source === 'Basket USA' && article.sport === 'Basketball'));
    assert.ok(body.articles.some(article => article.source === "Cyclism'Actu" && article.sport === 'Cyclisme'));
    assert.ok(body.articles.every(article => article.excerpt === 'Résumé éditorial de test'));
    assert.ok(body.feeds.every(feed => feed.ok && feed.count === 1));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
