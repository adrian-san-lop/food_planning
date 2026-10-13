import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeAttribute, escapeHTML, safeURL } from '../js/ui/html.js';

test('escapeHTML encodes markup and quote characters', () => {
  assert.equal(
    escapeHTML(`<img src=x onerror="alert('x')"> &`),
    '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp;',
  );
});

test('escapeAttribute is safe for quoted attributes', () => {
  assert.equal(escapeAttribute('" autofocus onfocus="alert(1)'), '&quot; autofocus onfocus=&quot;alert(1)');
});

test('safeURL accepts only HTTPS URLs from the explicit origin allowlist', () => {
  const allowed = ['https://unsplash.com'];
  assert.equal(safeURL('https://unsplash.com/photos/example', allowed), 'https://unsplash.com/photos/example');
  assert.equal(safeURL('javascript:alert(1)', allowed), null);
  assert.equal(safeURL('https://evil.example/photos/example', allowed), null);
  assert.equal(safeURL('https://user:pass@unsplash.com/photos/example', allowed), null);
});
