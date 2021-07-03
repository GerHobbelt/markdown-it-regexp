#!/usr/bin/env node

/* eslint no-console:0 */

async function action() {
  const hdrMod = await import('./header.js');
  const hdr = hdrMod.default;

  function help() {
    console.error(`
getGlobalName [choice]

Type of name/string to produce.

Choices:
  global, package, version, license, microbundle

`);
  }

  function print(msg) {
    process.stdout.write(msg);
  }

  ////////////////////////////////////////////////////////////////////////////////

  switch (process.argv[2]) {
  default:
    help();
    process.exit(1);
    break;

  case 'version':
    print(hdr.version);
    process.exit(0);
    break;

  case 'package':
    print(hdr.packageName);
    process.exit(0);
    break;

  case 'global':
    print(hdr.globalName);
    process.exit(0);
    break;

  case 'microbundle':
    print(hdr.safeVariableName);
    process.exit(0);
    break;

  case 'license':
    print(hdr.license);
    process.exit(0);
    break;
  }
}


// https://stackoverflow.com/questions/46515764/how-can-i-use-async-await-at-the-top-level
//
// Cannot do simple `await action()` because we still support v12... sort of...
(async () => {
  await action();
})().catch(ex => {
  console.error(ex);
});
