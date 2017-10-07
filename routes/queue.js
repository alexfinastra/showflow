var fs = require('fs');
var fse = require('fs-extra');
var moment = require('moment');
var express = require('express');
var router = express.Router();
var json = require('json-file');
var oracledb = require('oracledb');
var dbConfig = require('../db/dbconfig.js');

var path = require('path');
var mkdirp = require('mkdirp');


flowItem = function(uid){
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();
  var item = properties.get(uid)
  return  (item == undefined || item == null) ? null : item[".flow_item"];
}

queueFormats = function(uid){
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();
  var item = properties.get(uid)
  return  (item == undefined || item == null) ? "" : item[".to_schemas"];
}

queuePath = function(uid){
  if(uid == undefined || uid == null || uid == "exports"){
    return "/db/exports/"; 
  }

  if(uid.indexOf("flow") != -1 ){
    var f = uid.split("^")[1]
    return "/flows/" + f; 
  }

  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();
  var connection = properties.get(uid + ".flow_item.request_connections_point")
  return ((connection.indexOf('jms') != -1) ? (appRoot + "/" + connection) : connection);
}

fileInclude = function(file){
  var excludeList = ['template']

  for(var i=0; i<excludeList.length; i++){
    var exclude = excludeList[i];
    if(file.indexOf(exclude) > -1) {
      return false;
    }
  }
  return true;
}

queueFiles = function(uid){
  var files = [];
  var folder = queuePath(uid);

  fs.readdirSync(folder).forEach( function(file) {
    console.log("current file is "+file)
    
    if (file.length > 2 && fileInclude(file)){ 
      var stats = fs.statSync(folder + '/' + file);
      var folderName = (folder.indexOf("/") == -1) ? folder : folder.split("/")[folder.split("/").length - 1]
      
      if(stats.isFile()){
            files.push({      
              "name": file,
              "size": humanFileSize(stats.size, true) , //(stats.size / 1000.0 + " KB"),
              "created": moment(stats.birthtime).fromNow(),
              "id" : uid,
              "formats": queueFormats(uid),
              "folder": folderName
            })
          }
    }
  })
  return files;
}


router.get('/',  function(req, res){
  res.redirect('/folder/exports');
});

router.get('/download/:uid/:file', function(req, res) {
  var folder = queuePath(req.params.uid); 
  res.download(folder + "/" + req.params.file);
});

router.get('/delete/:uid/:file', function(req, res){
  var folder = queuePath(req.params.uid);
  fs.unlinkSync(folder + "/" + req.params.file);
  
  res.redirect(req.get('referer'));
})

router.get('/list/:uid', function(req, res){
  res.redirect("/folder/list/" + req.params.uid);
})

router.get('/upload/:uid', function(req, res){
  res.redirect("/folder/upload/" + req.params.uid);
})

router.get('/build_folders', function(req, res){
  var folders = [];
  var all = "INTERFACE_NAME, OFFICE, REQUEST_CONNECTIONS_POINT, RESPONSE_CONNECTIONS_POINT"  
  var sql = "select " + all + " from INTERFACE_TYPES" ;
  "use strict";
  oracledb.getConnection(dbConfig, function (err, connection) {
    if (err) {
        console.log("Error connecting to DB" + err.message);
        return;
    }
    connection.execute(sql, [], {
            maxRows: 300,
            outFormat: oracledb.OBJECT // Return the result as Object
        },
        function (err, result) {
            if (err) {
              console.log("Error connecting to DB" + err.message + " -- "+ err.message.indexOf("ORA-00001") > -1 ? "User already exists" : "Input Error");
            } 
            else {
              console.log("----------- > Results are " + result.rows.length)               
              for(var i=0; i<result.rows.length; i++){
                var item = result.rows[i];
                if(item["REQUEST_CONNECTIONS_POINT"] != null && item["REQUEST_CONNECTIONS_POINT"].indexOf("jms") != -1){
                  folders.push(item["REQUEST_CONNECTIONS_POINT"])
                }
                if(item["RESPONSE_CONNECTIONS_POINT"] != null &&  item["RESPONSE_CONNECTIONS_POINT"].indexOf("jms") != -1){
                  folders.push(item["RESPONSE_CONNECTIONS_POINT"])
                }
              }
              for (var i = folders.length - 1; i >= 0; i--) {
                var folder = folders[i];
                if(folder == "" || folder.indexOf(":") > -1 || folder.indexOf(".") > -1  ){
                  continue;
                }
                var p = path.join(folder);
                console.log("  PATH is --> " + p);
                ensureExists(p, 0744, function(err){
                  if (err){ console.log("Error") }// handle folder creation error
                  else { console.log("Creatated ") } // we're all good
                })
              }
              res.send(folders);
            }
            // Release the connection
            connection.release(
                function (err) {
                    console.log( " 7 ========>>>> Release connection : " + err );
                    if (err) {console.error(err.message); } 
                    else { console.log("Run sql query from script : Connection released");  }
                });
        });            
  });
});

ensureExists = function (path, mask, cb) {
    
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    mkdirp(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}

module.exports = router;
