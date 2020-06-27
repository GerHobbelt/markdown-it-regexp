/* eslint-env mocha, es6 */

const assert = require('assert');
const Md = require('@gerhobbelt/markdown-it');
const createPlugin = require('../');

describe('Unicode support', () => {
  it('example from README', () => {
    let html = Md()
    .use(createPlugin(
      /@([\u{1F4A9}-\u{1F4AB}])/gu,

      function (match, utils, options, env) {
        return '<found emoji>'
             + match[1]
             + '</found emoji>';
      }
    ))
    .render('@hello @💨@💩@💪@💫@💬');

    assert.strictEqual(html, '<p>@hello <found emoji>💨💩💪💫💬</found emoji></p>\n');
  });
});
