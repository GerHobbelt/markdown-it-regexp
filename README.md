# markdown-it-regexp

**THis is fork version of https://github.com/rlidwka/markdown-it-regexp**

Make simple [markdown-it](https://github.com/markdown-it/markdown-it) plugins easier.

## Usage:

```js
const md = require('@gerhobbelt/markdown-it');
const createPlugin = require('@gerhobbelt/markdown-it-regexp');

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
```

[Live demo as jsfiddle](https://jsfiddle.net/arve0/nz0Lb6ox/).


### Advanced Usage: setup object

Instead of just the `replacer` function from the previous example, 
we now provide a setup object with these members:

- `pluginId` (optional) : the type name which will be assigned to each token produced by the generated markdown-it plugin
- `replacer` (**mandatory**) : function which renders the given token, which was previously extracted using the regexp-to-match.

  The function interface `function replacer(match, config, plugin_options, env, tokens, id, options)`:
    
  - `match`: the match object produced by [`String.match()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match) for the regexp-to-match, i.e. this is identical to `tokens[id].meta.match`.
  - `config`: the active setup object, which is an *augmented clone* of the setup object passed as a second parameter to `createPlugin` (the markdown-it-regexp interface).
    
    Augmentation of the `config` object includes:
      
    - `escape`: a basic function to 'escape' troublesome characters to URI-safe ones.
    - `pluginId`: the active plugin token ID: auto-generated when you did not provide one via the setup object's `pluginId`.
    - `shouldParse`: the active function; a no-op when you did not specify one via the setup object.
    - `postprocessParse`: the active function; a no-op when you did not specify one via the setup object.
    
  - `plugin_options`: a reference to the options passed along with the plugin registration via `makrdownIt.use(..., options)` API. May be NULL or UNDEFINED.
    
  - `env`: the active MarkdownIt environment. Useful (together with the subsequent arguments) when you code more advanced plugins, which need access to the token stream / parse context / generated parse token.
  - `tokens`: the current (partial) token stream, including the token matched by the provided regex.
  - `id`: index into `tokens` where the token resides which was produced by the regexp-to-match.
    
    By providing both a reference to the token stream and an index into that stream, you *can* inspect & modify the currently produced token and/or surrounding token stream in your plugin. Of course, this counts as advanced use!

    Note that the generated token has an empty `content` and stores the entire regexp match info in `Token.meta.match`, i.e. `tokens[id].meta.match`.

  - `options`: MarkdownIt options as passed to the renderer.
     
  The `replacer` function is invoked by the MarkdownIt render process and must return a (HTML) string representing the given `match` in the HTML output.

- `setup`: (optional) function which will be invoked when the `markdownIt.use(...)` API is invoked for the created plugin.

  Return the `options` object from markdown_it `.use(plugin_func, options)` API call or an augmented clone, which will be used by the plugin code.

  The default `setup` function and its call site look like this:

  ```js
    // default callback spec:
    setup: (config, options) => options,
    ...

  // setup callback is called like this:
  plugin_options = config.setup(config, options);
  ```

  Indeed, the `options` object returned by `setup()` function will be passed to the other callbacks as `plugin_options`.

- `shouldParse`: (optional) function which is invoked immediately after matching the regexp-to-match, but *before* a token is produced.
    
  Return FALSE when you want to ignore this match, TRUE when the code should continue as is.
      
  The default `shouldParse` function (when you did not provide any) always returns TRUE.
      
  Function parameters:
  - `state`: the active MarkdownIt `State`.
  - `match`: the match object produced by [`String.match()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match) for the regexp-to-match. This will later be available in the `postprocessMatch(..., token, ...)` parameter.
  - `config`: the active setup object. This is the same object as the one described in the `replacer` parameter list above.
  - `plugin_options`: a reference to the `MarkdownIt.use(..., options)`; same as above for `replacer`.
    
- `postprocessParse`: (optional) function which will be invoked immediately after the parse token for the matching content has been created and added to the token stream.
    
  You can use this function to augment/tweak the parse token, which will be passed on to the renderer (`replacer`) later on.
      
  Function parameters:
  - `state`: the active MarkdownIt `State`.
  - `token`: a reference to the token which was just created and added to the token stream. In the `replacer` this one will be accessible as `tokens[id]`.
  - `config`: the active setup object. This is the same object as the one described in the `replacer` parameter list above.
  - `plugin_options`: a reference to the `MarkdownIt.use(..., options)`; same as above for `replacer`.
      
  The default `postprocessParse` function (when you did not provide any) is a no-op.

An example with the new, advanced interface, follows:

```js
const assert = require('assert');
const md = require('@gerhobbelt/markdown-it');
const createPlugin = require('@gerhobbelt/markdown-it-regexp');

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
```



## Process Flow

The process flow is as follows:
    
- MarkdownIt attempts to to match every "inline" code chunk to the given regexp-to-match.
- when a match occurs, `shouldParse()` is called to help decide whether the match should become a token or not (skipping it and keeping it part of the regular inline text block).
    
- When the token has been created and added to the token stream (the match is stored in `token.meta.match`, not in `Token.content`!)
  `postprocessMatch` is invoked to allow the plugin programmer last minute access to the token, before parsing continues.
      
  This allows plugin programmers to augment the token at *parse time*.

    
- Then, when the entire `.parse()` has completed, at some point the `MarkdownIt.render` action will be started.
    
- When this render process encounters a token of the matching type for this plugin (`config.pluginId`), the `replacer` method is invoked to turn the token into a chunk of HTML, which will be added to the render output.
Hence the order in which the setup elements are accessed by MarkdownIt is:

- regexp
- `shouldParse`
- `postprocessParse`
- `replacer`


### Setup/Init Process Flow

The `setup.setup` callback is invoked when userland code executes the `md.use(plugin, ...)` statement.

At that time, you may still safely adjust some setup/config parameters.

    
      


## Fair warning:

1. it could be slower than you expect
2. it is a draft, breaking changes might happen
3. markdown-it only stops at certain characters, then performs the regex match in this plugin. [markdown-it Development Recommendations](https://github.com/markdown-it/markdown-it/blob/master/docs/development.md)
