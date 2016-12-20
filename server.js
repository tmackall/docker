"use strict";
const http = require('http');
const request = require('request');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const url = require('url');
const os = require( 'os' );
const srvLib = require('./lib/srv_lib');
const site = require('./config/site');
const winston = require('winston');

var reImage = /.*image-cam.*\.jpg/;
var reSwitch = /.*switch.*/;

const PORT = 3050;

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp':true, level: site.LL})
   ]
});

var STATE_SERVER = 'on';

logger.debug('start');

// -----------------------------
//
// web app - create the server
//
// -----------------------------
var server = http.createServer(requestProcess);

function requestProcess(request, response) {
  var headers = request.headers;
  var method = request.method;
  var url = request.url;
  var body = [];
  var valRet = {};

  response.statusCode = 200;
  request.on('error', function(err) {
    logger.error(err);
    valRet.text = err;
  }).on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body);
    response.on('error', function(err) {
      logger.error(err);
      valRet.text = err;
    });

    // movement - log movement in the database
    if (url == '/dockserver' &&  method == 'GET') {
      logger.info('health request');

    } else {
      logger.error('received an unrecongized request: ' + url);
      response.statusCode = 404;
    }

    response.setHeader('Content-Type', 'application/json');
    valRet.status = response.statusCode;

    var responseBody = {
      method: method,
      data: valRet,
      url: url,
    };

    response.write(JSON.stringify(responseBody));
    response.end();

  });
}
server.listen(PORT);
