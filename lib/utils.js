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
export function escape(html) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

	// code assumes you're wrapping HTML attributes in doublequotes:
export function encodeHtmlAttr(value) {
	// https://stackoverflow.com/questions/4015345/how-do-i-properly-escape-quotes-inside-html-attributes
  return value.replace(/"/g, '&#34;');
}



