const assert = require('assert');
const md = require('@gerhobbelt/markdown-it');
const createPlugin = require('../' /* '@gerhobbelt/markdown-it-regexp' */);

// separate the setup/config object from the `md.use(...)` call for code clarity:
const setup = {
  pluginId: 'demoPlugin',
  replacer: function (match, setup, options, env, tokens, id) {
    let url = 'https://twitter.com/' + match[1];
    let token = tokens[id];

    // - showcase using the `options` passed in via `MarkdownIt.use()`
    // - showcase using the `setup` object
    // - showcase using the `tokens` stream + `id` index to access the token
    return '\n' + setup.pluginId + ':' + options.opt1 + ':' + setup.escape(url) + ':' + options.opt2 + ':' + (token.wonko || '---') + ':' + token.type + ':' + token.nesting + ':' + token.level;
  },
  shouldParse: function (state, match, setup, options) {
    // ignore the one called 'user2'
    // --> that one was addressed as '@user2':
    // note the `[1]` regex match access in the check condition!
    return match[1] !== 'user2';
  },
  postprocessParse: function (state, token, setup, options) {
    // regexp plugin stores the match in token.meta.match, not in token.content:
    if (token.meta.match[1].includes('1')) {
      token.wonko = 'BLETCH';
    }
  }
};

const plugin = createPlugin(
  // regexp to match
  /@(\w+)/,

  setup
);

let engine = md()
  .use(
    plugin,

    // options object passed into `.use()`:
    {
      opt1: 'foo',
      opt2: 'bar'
    }
  );

let html = engine
  .render('hello @userA, @userB, @user1,\n@user2, @user20 and @user21.');

// for better visibility in the demo, show all spaces:
html = html.replace(/ /g, '⎵');

// Note that:
// - `user20` and `user21` are not skipped by `shouldParse` thanks to the `!==` condition, while
// - both `user1` and `user21` have augmented tokens ('wonko' attribute) thanks to the `.include('1')`
//   condition in `postprocessParse()`.
// - `config.pluginId` matches the `Token.type` of every token produced by this plugin.
// - `Token.nesting` and `Token.level` are both zero(0) and don't add information, but are merely
//   here to show that we have full `token` access.

console.log(html);
// prints out: (including a newline at the very end there!)
assert.strictEqual(html, `<p>hello⎵
demoPlugin:foo:https://twitter.com/userA:bar:---:demoPlugin:0:0,⎵
demoPlugin:foo:https://twitter.com/userB:bar:---:demoPlugin:0:0,⎵
demoPlugin:foo:https://twitter.com/user1:bar:BLETCH:demoPlugin:0:0,
@user2,⎵
demoPlugin:foo:https://twitter.com/user20:bar:---:demoPlugin:0:0⎵and⎵
demoPlugin:foo:https://twitter.com/user21:bar:BLETCH:demoPlugin:0:0.</p>
`);
