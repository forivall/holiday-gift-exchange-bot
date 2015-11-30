#!/usr/bin/env node
"use strict";

const _ = require("lodash");

let family = require("./family.json");
// format: [
//   {"name": "Alice", "spouse": "Bob", "email": "alice@example.com"},
//   {"name": "Bob", "spouse": "Alice", "email": "bob@example.com"},
//   {"name": "Carol", "email": "carol@example.com"},
// ...]

function isOk(matches) {
  for (let i = 0, len = matches.length; i < len; i++) {
    let match = matches[i];
    if (match[0].name === match[1].name) return false;
    if (match[0].spouse && match[0].spouse === match[1].name) return false;
  }
  // make sure it's a perfect loop
  let visited = {}, next = matches[0];
  for (let i = 0, len = matches.length; i < len; i++) {
    if (visited[next[0].name]) return false;
    visited[next[0].name] = true;
    let nextName = next[1].name;
    next = _.find(matches, function(match) { return match[0].name === nextName});
  }
  return true;
}

let matches;
do {
  matches = _.zip(family, _.shuffle(family));
} while (!isOk(matches));

console.log("matches calculated.");

const nodemailer = require("nodemailer");
const asyncEach = require("async-each-series");
const mailTransport = require("./mail-transport.json");
const transporter = nodemailer.createTransport(mailTransport);

// const hashcash = require('nodemailer-hashcash');
// nodemailerTransport.use('compile', hashcash(options));

const ver = 2;

asyncEach(matches, function(match, callback) {
  let giver = match[0];
  let recipient = match[1];
  let mailOptions = {
    from: "Christmas Bot <" + mailTransport.auth.user + ">",
    sender: mailTransport.auth.user,
    to: "" + giver.name + " <" + giver.email + ">",
    subject: "Family Gift Exchange information!",
    text: "The recipient for your gift is " + recipient.name + "! Merry Christmas!\n\n(v" + ver + ")",
    html: "The recipient for your gift is <b>" + recipient.name + "</b>! <i>Merry Christmas!</i><br><br>(v" + ver + ")"
  };

  if (giver.emailIsShared) {
    mailOptions.subject += " (" + giver.spouse + ", DO NOT OPEN)";
  }

  transporter.sendMail(mailOptions, function(err, info) {
    if (err){
      console.log(err);
      return callback(err);
    }
    console.log('Message sent: ' + info.response + ' from ' + mailOptions.from + ' to ' + mailOptions.to);
    callback();
  });
}, function(err) {
  console.log("finished!");
  if (err) console.log(err);
});
