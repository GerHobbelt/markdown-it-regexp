/* eslint-env mocha, es6 */

import assert from 'assert';
import Md from '@gerhobbelt/markdown-it';
import createPlugin from '../index.js';


function itFails(descr, f, failureRegex) {
  it(descr, () => {
    try {
      f();
      assert.fail('expected a failure (exception thrown) but that did NOT happen!');
    } catch (ex) {
      assert(failureRegex.test(ex.message), `expected an exception which' message matches '${failureRegex.toString()}'`);
    }
  });
}


describe('intended failures', () => {
  itFails('plugin should barf when the same user-defined pluginId is used twice', () => {
    // make sure plugin ID autocount restarts: independence of the other tests!
    createPlugin.reset();

    const html = Md()
    .use(createPlugin(
      /@(\w+)/,

      {
        pluginId: 'failA',
        replacer: function (match, setup, options) {
          return setup.escape(match[1]);
        }
      }
    ))
    .use(createPlugin(
      /@(\w+)/,

      {
        pluginId: 'failA',      // <-- same pluginID as above!
        replacer: function (match, setup, options) {
          return setup.escape(match[1]);
        }
      }
    ));
  }, /has already been registered/);

  itFails('plugin should barf when replacer function is not defined', () => {
    const html = Md()
    .use(createPlugin(
      /@(\w+)/,

      null
    ));
  }, /config\.replacer MUST be a replacer function/);

  itFails('plugin should barf when replacer function is not defined in advanced setup', () => {
    const html = Md()
    .use(createPlugin(
      /@(\w+)/,

      // setup object, when specified, MUST include .replacer:
      {
        shouldParse: () => true
      }
    ));
  }, /config\.replacer MUST be a replacer function/);

  itFails('plugin should barf at setup time when shouldParse is not a function', () => {
    const html = Md()
    .use(createPlugin(
      /@(\w+)/,

      {
        replacer: () => { /* empty */ },
        shouldParse: true
      }
    ));
  }, /config\.shouldParse MUST be a function/);

  itFails('plugin should barf at setup time when postprocessParse is not a function', () => {
    const html = Md()
    .use(createPlugin(
      /@(\w+)/,

      {
        replacer: () => { /* empty */ },
        postprocessParse: true
      }
    ));
  }, /config\.postprocessParse MUST be a function/);

  it('any user-defined *falsey* pluginId must be ignored', () => {
    // make sure plugin ID autocount restarts: independence of the other tests!
    createPlugin.reset();

    const html = Md({
      linkify: true,
      highSecurity: false,

      // WARNING: when this test fails, cahnces are that your markdown-it DOES NOT SUPPORT
      // the `inlineTokenTerminatorsRe` option!
      inlineTokenTerminatorsRe: /[0-9]/
    })
    .use(createPlugin(
      /1(\w+)/,

      {
        replacer: (match, setup) => setup.pluginId + ':' + setup.escape(match[0]),
        pluginId: 0
      }
    ))
    .use(createPlugin(
      /2(\w+)/,

      {
        replacer: (match, setup) => setup.pluginId + ':' + setup.escape(match[0]),
        pluginId: false
      }
    ))
    .use(createPlugin(
      /3(\w+)/,

      {
        replacer: (match, setup) => setup.pluginId + ':' + setup.escape(match[0]),
        pluginId: null
      }
    ))
    .use(createPlugin(
      /4(\w+)/,

      {
        replacer: (match, setup) => setup.pluginId + ':' + setup.escape(match[0])
        // pluginId:
      }
    ))
    .use(createPlugin(
      /5(\w+)/,

      (match, setup) => setup.pluginId + ':' + setup.escape(match[0])
    ))
    .render('hello 1user, 2user, 3user, 4user and 5user at http://4chan.jp/ channel');
    // ^-- the 4chan fake url is used to verify that this particular set of filter regexes DO NOT collide with
    //     the standard `linkify` functionality of markdown-it.

    assert.strictEqual(html, '<p>hello regexp-0:1user, regexp-1:2user, regexp-2:3user, regexp-3:4user and regexp-4:5user at <a href="http://4chan.jp/">http://4chan.jp/</a> channel</p>\n');
  });
});
