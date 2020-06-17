/* eslint-env mocha, es6 */

const assert = require('assert');
const Md = require('@gerhobbelt/markdown-it');
const createPlugin = require('../');

describe('basics', () => {
  it('example from README', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      function (match, utils, options, env) {
        let url = 'http://example.org/u/' + match[1];

        return '<a href="' + utils.escape(url) + '">'
             + utils.escape(match[1])
             + '</a>';
      }
    ))
    .render('hello @user');

    assert.strictEqual(html, '<p>hello <a href="http://example.org/u/user">user</a></p>\n');
  });

  it('passing options', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      function (match, utils, options) {
        let url = match[1];

        return options.opt1 + ':' + utils.escape(url) + ':' + options.opt2;
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .render('hello @user');

    assert.strictEqual(html, '<p>hello foo:user:bar</p>\n');
  });

  it('multiple instances should not clash', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      function (match, utils, options, env) {
        let url = match[1];

        return options.opt1 + ':' + utils.escape(url) + ':' + options.opt2;
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .use(createPlugin(
      /#(\w+)/,

      function (match, utils, options, env) {
        let url = match[1];

        return options.opt2 + ':' + utils.escape(url) + ':' + options.opt1;
      }
    ), { opt1: 'BAR', opt2: 'FOO' })
    .render('hello @user #tag');

    assert.strictEqual(html, '<p>hello foo:user:bar FOO:tag:BAR</p>\n');
  });

  it('instances should receive a shared environment from markdown_it', () => {
    let html = Md()
    .use(createPlugin(
      /@(\w+)/,

      function (match, utils, options, env) {
        let url = match[1];

        // comms via ENV:
        env.communications = 42;

        return options.opt1 + ':' + utils.escape(url) + ':' + options.opt2 + ':' + env.state_block.line;
      }
    ), { opt1: 'foo', opt2: 'bar' })
    .use(createPlugin(
      /#(\w+)/,

      function (match, utils, options, env) {
        let url = match[1];

        assert.strictEqual(env.communications, 42);

        return options.opt2 + ':' + utils.escape(url) + ':' + options.opt1 + ':' + env.state_block.line;
      }
    ), { opt1: 'BAR', opt2: 'FOO' })
    .render('hello\n\nbla @user\n\n#tag is it');

    assert.strictEqual(html, '<p>hello</p>\n<p>bla foo:user:bar:5</p>\n<p>FOO:tag:BAR:5 is it</p>\n');
  });
});

