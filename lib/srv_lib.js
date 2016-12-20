"use strict";
const path = require('path');
const fs = require('fs');
const async = require('async');
const clone = require('clone');
const archiver =  require('archiver');
const os = require('os');
const networkInterfaces = os.networkInterfaces( );
const winston = require('winston');
const site = require('../config/site');
const recursive = require('recursive-readdir');
var exports = module.exports = {};

// ====================
// logger
// ====================
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp':true, level: site.LL})
   ]
});

// =============================
//
// filesCopy(): copy files
//
// =============================
exports.filesCopy = function (fileList, destDir, callb) {
  // Array to hold async tasks
  var asyncTasks = [];
  var filesRet = [];
   
  // files - we need one task per
  fileList.forEach(function(item){
    // We don't actually execute the async action here
    // We add a function containing it to an array of "tasks"
    asyncTasks.push(function(cb){
      // Call an async function, often a save() to DB
      fs.readFile(item, function(err, data) {
        if (err) return cb(err);
        var tmpWriteFile = path.join(destDir, path.basename(item));
        fs.writeFile(tmpWriteFile, data, function(err) {
          filesRet.push(tmpWriteFile);
          cb(err);
        });
      });
    });
  });

  // copy - all files in parallel
  async.parallel(asyncTasks, function(err) {
    logger.info('done: ' + err);
    callb(err, filesRet);
  });
};

// ===============================
//
// rmFileList() - deletes a list
// of files.
//
// ===============================
var rmFileList = function(files, callb) {
  async.forEach(files, function(file, cb) {
    logger.debug('delete file: %s', file);
    fs.unlink(file, function(err) {
      cb(err);
    });
  }, function(err) {
    if (err) logger.info(err);
    callb(err);
  });
};
exports.rmFileList = rmFileList;


// ===============================
// 
// zipFiles() - zips up a list of 
// files.
//
// ===============================
function zipFiles(files, callb) {
  var fileZip = path.join(site.DIR_ZIP, new Date().toISOString() + '.zip');
  var output = fs.createWriteStream(fileZip);
  var zipArchive = archiver('zip');

  output.on('close', function() {
    logger.info(zipArchive.pointer() + ' total bytes');
    logger.info('%s created', fileZip);
    callb();
  });

  zipArchive.on('error', function(err) {
      throw err;
  });
  zipArchive.pipe(output);
  zipArchive.bulk([{src: files,  expand: true}]);
  zipArchive.finalize();
}
exports.zipFiles = zipFiles;


// ============================
//
// ip address - determine it
//
// ============================
exports.ipGet = function(callb) {
  var ipAddress = null;
  Object.keys(networkInterfaces).forEach(function(key) {
    logger.debug(key);
    if (key === 'wlan0' || key === 'eth0') {
      var val = networkInterfaces[key];
      val.forEach(function(addr) {
        if (addr.family === 'IPv4') {
          logger.info(addr.address);
          ipAddress = addr.address;
          /*
          cleanUp(site.PIC_STORE, function(err) {
            logger.info('Cleanup of the existing files on startup');
          });
          */
        }
      });
    }
  });
  callb(ipAddress);
};
