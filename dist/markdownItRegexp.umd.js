/*! markdown-it-regexp 0.6.0-8 https://github.com//GerHobbelt/markdown-it-regexp @license MIT */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.markdownitRegexp = factory());
}(this, (function () { 'use strict';

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

  function cloneRegExp(regexp) {
    // clone regexp with all the flags
    let flags = (regexp.global ? 'g' : '') + (regexp.multiline ? 'm' : '') + (regexp.ignoreCase ? 'i' : '') + (regexp.unicode ? 'u' : '') + (regexp.sticky ? 'y' : '');
    regexp = RegExp('^' + regexp.source, flags);
    return regexp;
  }
  /**
   * Constructor function
   */


  let createPlugin = function createPluginF(regexp, config) {
    regexp = cloneRegExp(regexp);
    config = Object.assign({
      setup: (setup, config) => config,
      shouldParse: (state, match) => true,
      postprocessParse: (state, token) => {},
      escape,
      regexp
    }, typeof config === 'function' ? {
      replacer: config
    } : config);

    if (typeof config.replacer !== 'function') {
      throw new Error('createPlugin(re, config): config.replacer MUST be a replacer function.');
    }

    if (typeof config.shouldParse !== 'function') {
      throw new Error('createPlugin(re, config): config.shouldParse MUST be a function.');
    }

    if (typeof config.postprocessParse !== 'function') {
      throw new Error('createPlugin(re, config): config.postprocessParse MUST be a function.');
    }

    if (typeof config.setup !== 'function') {
      throw new Error('createPlugin(re, config): config.setup MUST be a function.');
    } // this plugin can be inserted multiple times,
    // so we're generating unique name for it


    let id = config.pluginId;

    if (id && registered_ids['p-' + id]) {
      throw new Error(`Plugin ID '${id}' has already been registered by another plugin or this plugin is registered multiple times.`);
    }

    if (!id) {
      id = 'regexp-' + counter;

      while (registered_ids['p-' + id]) {
        counter++;
        id = 'regexp-' + counter;
      }

      config.pluginId = id;
    }

    registered_ids['p-' + id] = true; // closure var

    let plugin_options; // return value should be a callable function
    // with strictly defined options passed by markdown-it

    let handler = function cbHandler(md, options) {
      // store use(..., options) in closure
      plugin_options = config.setup(config, options); // register plugin with markdown-it

      let id = config.pluginId;
      md.inline.ruler.push(id, parse);
      md.renderer.rules[id] = render;
    };

    function parse(state, silent) {
      // slowwww... maybe use an advanced regexp engine for this
      let match = config.regexp.exec(state.src.slice(state.pos));
      if (!match) return false;

      if (!config.shouldParse(state, match, config, plugin_options)) {
        return false;
      }

      if (state.pending) {
        state.pushPending();
      } // valid match found, now we need to advance cursor


      let originalPos = state.pos;
      state.pos += match[0].length; // don't insert any tokens in silent mode

      if (silent) return true;
      let token = state.push(id, '', 0);
      token.meta = {
        match: match
      };
      token.position = originalPos;
      token.size = match[0].length;
      config.postprocessParse(state, token, config, plugin_options);
      return true;
    }

    function render(tokens, id, options, env) {
      return config.replacer(tokens[id].meta.match, config, plugin_options, env, tokens, id, options);
    }

    return handler;
  };

  createPlugin.reset = function () {
    counter = 0;
    registered_ids = [];
  };

  return createPlugin;

})));
//# sourceMappingURL=markdownItRegexp.umd.js.map
