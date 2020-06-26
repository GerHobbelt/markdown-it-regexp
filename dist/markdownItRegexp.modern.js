/*! markdown-it-regexp 0.5.0-4 https://github.com//GerHobbelt/markdown-it-regexp @license MIT */

/*!
 * markdown-it-regexp
 * Copyright (c) 2014 Alex Kocharin
 * MIT Licensed
 */

/**
 * Escape special characters in the given string of html.
 *
 * Borrowed from escape-html component, MIT-licensed
 */
function escape(html) {
  return String(html).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/*!
 * markdown-it-regexp
 * Copyright (c) 2014 Alex Kocharin
 * MIT Licensed
 */
/**
 * Counter for multi usage.
 */

let counter = 0;
let registered_ids = [];
/**
 * Constructor function
 */

function createPlugin(regexp, replacer, plugin_id) {
  // clone regexp with all the flags
  let flags = (regexp.global ? 'g' : '') + (regexp.multiline ? 'm' : '') + (regexp.ignoreCase ? 'i' : '');
  regexp = RegExp('^' + regexp.source, flags); // this plugin can be inserted multiple times,
  // so we're generating unique name for it

  let id = plugin_id;

  if (id && registered_ids['p-' + id]) {
    throw new Error(`Plugin ID '${id}' has already been registered by another plugin or this plugin is registered multiple times.`);
  }

  if (!id) {
    id = 'regexp-' + counter;

    while (registered_ids['p-' + id]) {
      counter++;
      id = 'regexp-' + counter;
    }
  }

  registered_ids['p-' + id] = true; // closure var

  let plugin_options; // return value should be a callable function
  // with strictly defined options passed by markdown-it

  let handler = function cbHandler(md, options) {
    plugin_options = options;
    init(md);
  }; // function that registers plugin with markdown-it


  function init(md) {
    md.inline.ruler.push(id, parse);
    md.renderer.rules[id] = render;
  }

  function parse(state, silent) {
    // slowwww... maybe use an advanced regexp engine for this
    let match = regexp.exec(state.src.slice(state.pos));
    if (!match) return false; // valid match found, now we need to advance cursor

    state.pos += match[0].length; // don't insert any tokens in silent mode

    if (silent) return true;
    let token = state.push(id, '', 0);
    token.meta = {
      match: match
    };
    return true;
  }

  function render(tokens, id, options, env) {
    return replacer(tokens[id].meta.match, {
      escape
    }, plugin_options, env);
  }

  return handler;
}

export default createPlugin;
//# sourceMappingURL=markdownItRegexp.modern.js.map
