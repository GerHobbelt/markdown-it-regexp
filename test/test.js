/* eslint-env mocha, es6 */

const assert = require('assert');
const Md = require('@gerhobbelt/markdown-it');
const createPlugin = require('../');

describe('basics', () => {
  it('example from README', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      function (match, setup, options) {
        let url = 'http://example.org/u/' + match[1];

        return '<a href="' + setup.escape(url) + '">'
             + setup.escape(match[1])
             + '</a>';
      }
    ))
    .render('hello @user');

    assert.strictEqual(html, '<p>hello <a href="http://example.org/u/user">user</a></p>\n');
  });

  it('passing options', () => {
    // make sure plugin ID autocount restarts: independence of the other tests!
    createPlugin.reset();

    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      function (match, setup, options) {
        let url = match[1];

        return setup.pluginId + ':' + options.opt1 + ':' + setup.escape(url) + ':' + options.opt2;
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .render('hello @user');

    assert.strictEqual(html, '<p>hello regexp-0:foo:user:bar</p>\n');
  });

  it('multiple instances should not clash', () => {
    // make sure plugin ID autocount restarts: independence of the other tests!
    createPlugin.reset();

    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      function (match, setup, options) {
        let url = match[1];

        return setup.pluginId + ':' + options.opt1 + ':' + setup.escape(url) + ':' + options.opt2;
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .use(createPlugin(
      /#(\w+)/,

      function (match, setup, options) {
        let url = match[1];

        return setup.pluginId + ':' + options.opt2 + ':' + setup.escape(url) + ':' + options.opt1;
      }
    ), { opt1: 'BAR', opt2: 'FOO' })
    .render('hello @user #tag');

    assert.strictEqual(html, '<p>hello regexp-0:foo:user:bar regexp-1:FOO:tag:BAR</p>\n');
  });

  it('instances should receive a shared environment from markdown_it', () => {
    // make sure plugin ID autocount restarts: independence of the other tests!
    createPlugin.reset();

    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      function (match, setup, options, env) {
        let url = match[1];

        // comms via ENV:
        env.communications = 42;

        return setup.pluginId + ':' + options.opt1 + ':' + setup.escape(url) + ':' + options.opt2 + ':' + env.state_block.line;
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .use(createPlugin(
      /#(\w+)/,

      function (match, setup, options, env) {
        let url = match[1];

        assert.strictEqual(env.communications, 42);

        return setup.pluginId + ':' + options.opt2 + ':' + setup.escape(url) + ':' + options.opt1 + ':' + env.state_block.line;
      }
    ), { opt1: 'BAR', opt2: 'FOO' })
    .render('hello\n\nbla @user\n\n#tag is it');

    assert.strictEqual(html, '<p>hello</p>\n<p>bla regexp-0:foo:user:bar:5</p>\n<p>regexp-1:FOO:tag:BAR:5 is it</p>\n');
  });

  it('render method should receive a token reference from markdown_it which carries position info', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      function (match, setup, options, env, tokens, id, render_options) {
        let url = match[1];

        assert(Array.isArray(tokens));
        assert(typeof id === 'number');
        assert(Number.isFinite(id));
        assert(id >= 0);
        assert(typeof render_options === 'object');
        assert(render_options);

        let token = tokens[id];

        return options.opt1 + ':' + setup.escape(url) + ':' + options.opt2 + ':' + token.position + ':' + token.size;
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .render('hello\n\nbla @user\n\n@tag is it');

    assert.strictEqual(html, '<p>hello</p>\n<p>bla foo:user:bar:11:5</p>\n<p>foo:tag:bar:18:4 is it</p>\n');
  });

  it('plugin can set its own token type ID', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      {
        replacer: function (match, setup, options, env, tokens, id) {
          let url = match[1];

          assert(Number.isFinite(id));
          assert(id >= 0);

          let token = tokens[id];

          return options.opt1 + ':' + setup.escape(url) + ':' + options.opt2 + ':' + token.type + ':' + token.nesting + ':' + token.level;
        },

        pluginId: 'banzai'
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .render('hello\n\nbla @user\n\n@tag is it');

    assert.strictEqual(html, '<p>hello</p>\n<p>bla foo:user:bar:banzai:0:0</p>\n<p>foo:tag:bar:banzai:0:0 is it</p>\n');
  });

  it('the shouldParse setup parameter should work as intended', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      {
        replacer: function (match, setup, options) {
          let url = match[1];

          return setup.pluginId + ':' + options.opt1 + ':' + setup.escape(url) + ':' + options.opt2;
        },
        shouldParse: function (state, match, setup, options) {
          return match[1] === 'user2';
        },
        pluginId: 'booger'
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .render('hello @user1 and @user2');

    assert.strictEqual(html, '<p>hello @user1 and booger:foo:user2:bar</p>\n');
  });

  it('the postprocessParse setup parameter should work as intended', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      {
        replacer: function (match, setup, options, env, tokens, id) {
          let url = match[1];
          let token = tokens[id];

          return options.opt1 + ':' + setup.escape(url) + ':' + options.opt2 + ':' + (token.wonko || '---');
        },
        postprocessParse: function (state, token, setup, options) {
          // regexp plugin stores the match in token.meta.match, not in token.content:
          if (token.meta.match[1] === 'user1') {
            token.wonko = 'BLETCH';
          }
        }
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .render('hello @user1 and @user2');

    assert.strictEqual(html, '<p>hello foo:user1:bar:BLETCH and foo:user2:bar:---</p>\n');
  });

  it('make sure compound regexes do not cause trouble by matching anywhere in the input', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)|!(.)/,      // <-- reduced version of the OR-bar regex which was used in markdown-it-wikilinks and which triggered the bug

      {
        replacer: function (match, setup, options, env, tokens, id) {
          let url = (match[1] || 'x') + '!' + (match[2] || 'y');

          return options.opt1 + ':' + url + ':' + options.opt2;
        }
      }
    ), { opt1: '+', opt2: '+' })
    .render('hello @user1!a!bang and @user2!b !c');

    assert.strictEqual(html, '<p>hello +:user1!y:++:x!a:++:x!b:+ang and +:user2!y:++:x!b:+ +:x!c:+</p>\n');
  });
});


