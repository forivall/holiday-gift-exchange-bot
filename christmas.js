#!/usr/bin/env node
"use strict";

const _ = require("lodash");
const fsp = require("fs/promises");
const crypto = require("crypto");

const {family, website} = require("./family");
// format: [
//   {"name": "Alice", "spouse": "Bob", "email": "alice@example.com"},
//   {"name": "Bob", "spouse": "Alice", "email": "bob@example.com"},
//   {"name": "Carol", "email": "carol@example.com"},
// ...]

/** @typedef {{name: string, spouse?: string}} Person */

/** @param {[Person, Person][]} matches */
function isOk(matches) {
  for (const match of matches) {
    if (match[0].name === match[1].name) return false;
    if (match[0].spouse && match[0].spouse === match[1].name) return false;
  }
  // make sure it's a perfect loop
  const visited = {}
  let next = matches[0];
  for (const _match of matches) {
    if (visited[next[0].name]) return false;
    visited[next[0].name] = true;
    let nextName = next[1].name;
    next = _.find(matches, function(match) { return match[0].name === nextName});
  }
  return true;
}

/** @type {[Person, Person][]} */
let matches;
do {
  matches = _.zip(family, _.shuffle(family));
} while (!isOk(matches));

console.log("matches calculated.");

const ver = 1;

(async () => {
  await fsp.mkdir('output', { recursive: true })
  for (const [giver, recipient] of matches) {
    const html = `Hi ${giver.name}, the recipient for your gift is <b>${recipient.name}</b>! <i>Merry Christmas!</i><br><br>(v${ver})`
    const filename = crypto.randomBytes(8).toString('hex') + '.html';
    await fsp.writeFile('output/' + filename, html, 'utf8');
    console.log(giver.name, '->', website + '/' + filename)
  }
})()

