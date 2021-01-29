/* eslint-env mocha, es6 */

import assert from 'assert';
import Md from '@gerhobbelt/markdown-it';
import createPlugin from '../index.js';


describe('helpers', () => {
  it('escape() encodes any URI', () => {
    let md = Md()
    .use(createPlugin(
      /@([^\s]+)/,

      function (match, setup, options) {
        let url = 'http://example.org/u/' + match[1];

        return '<a href="X">'
             + setup.escape(match[1])
             + '</a>';
      }
    ));
    let html = md
    .render('hello @user');

    assert.strictEqual(html, '<p>hello <a href="X">user</a></p>\n');

    html = md
    .render('hello @a1<x>');

    assert.strictEqual(html, '<p>hello <a href="X">a1&lt;x&gt;</a></p>\n');

    html = md
    .render('hello @Gus."Cheeky".O\'Mally');

    assert.strictEqual(html, '<p>hello <a href="X">Gus.&quot;Cheeky&quot;.O&#39;Mally</a></p>\n');
  });

  it('encodeHtmlAttr() encodes any HTML attribute value', () => {
    let md = Md()
    .use(createPlugin(
      /@([^\s]+)/,

      function (match, setup, options) {
        let url = 'http://example.org/u/' + match[1];

        return '<a href="' + setup.encodeHtmlAttr(url) + '">'
             + setup.escape(match[1])
             + '</a>';
      }
    ));
    let html = md
    .render('hello @user');

    assert.strictEqual(html, '<p>hello <a href="http://example.org/u/user">user</a></p>\n');

    html = md
    .render('hello @a1<x>');

    assert.strictEqual(html, '<p>hello <a href="http://example.org/u/a1<x>">a1&lt;x&gt;</a></p>\n');

    html = md
    .render('hello @Gus."Cheeky".O\'Mally');

    assert.strictEqual(html, '<p>hello <a href="http://example.org/u/Gus.&#34;Cheeky&#34;.O\'Mally">Gus.&quot;Cheeky&quot;.O&#39;Mally</a></p>\n');
  });
});
