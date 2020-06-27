const assert = require('assert');
const md = require('@gerhobbelt/markdown-it');
const createPlugin = require('../' /* '@gerhobbelt/markdown-it-regexp' */);

const plugin = createPlugin(
  // regexp to match
  /@(\w+)/,

  // this function will be called when something matches
  function (match, setup, options) {
    let url = 'http://example.org/u/' + match[1];

    return '<a href="' + setup.escape(url) + '">'
         + setup.escape(match[1])
         + '</a>';
  }
);

let html = md()
  .use(plugin /* , options */)
  .render('hello @user');

console.log(html);
// prints out: (including a newline at the very end there!)
assert.strictEqual(html, '<p>hello <a href="http://example.org/u/user">user</a></p>\n');
