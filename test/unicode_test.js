/* eslint-env mocha, es6 */

import assert from 'assert';
import md from '@gerhobbelt/markdown-it';
import createPlugin from '../index.js';


describe('Unicode support', () => {
  // TODO: fix Unicode Plane 1 stuff
  xit('example from README', () => {
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
