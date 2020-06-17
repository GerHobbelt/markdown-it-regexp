/*!
 * markdown-it-regexp
 * Copyright (c) 2014 Alex Kocharin
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import escape from './utils';

/**
 * Counter for multi usage.
 */
let counter = 0;

/**
 * Constructor function
 */
function createPlugin(regexp, replacer) {
  // clone regexp with all the flags
  let flags = (regexp.global     ? 'g' : '')
            + (regexp.multiline  ? 'm' : '')
            + (regexp.ignoreCase ? 'i' : '');

  regexp = RegExp('^' + regexp.source, flags);

  // this plugin can be inserted multiple times,
  // so we're generating unique name for it
  let id = 'regexp-' + counter;
  counter++;

  // closure var
  let plugin_options;

  // return value should be a callable function
  // with strictly defined options passed by markdown-it
  let handler = function cbHandler(md, options) {
    plugin_options = options;
    init(md);
  };

  // function that registers plugin with markdown-it
  function init(md) {
    md.inline.ruler.push(id, parse);

    md.renderer.rules[id] = render;
  }

  function parse(state, silent) {
    // slowwww... maybe use an advanced regexp engine for this
    let match = regexp.exec(state.src.slice(state.pos));
    if (!match) return false;

    // valid match found, now we need to advance cursor
    state.pos += match[0].length;

    // don't insert any tokens in silent mode
    if (silent) return true;

    let token = state.push(id, '', 0);
    token.meta = { match: match };

    return true;
  }

  function render(tokens, id, options, env) {
    return replacer(tokens[id].meta.match, { escape }, plugin_options, env);
  }

  return handler;
}


/**
 * Expose `Plugin`
 */

export default createPlugin;

