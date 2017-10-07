var fs = require('fs');
var fse = require('fs-extra');
var moment = require('moment');
var express = require('express');
var router = express.Router();
var json = require('json-file');
var oracledb = require('oracledb');
var dbConfig = require('../db/dbconfig.js');

var path = require('path');
var formidable = require('formidable');
var mkdirp = require('mkdirp');

humanFileSize = function(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
};

flowItem = function(uid){
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();
  var item = properties.get(uid)
  return  (item == undefined || item == null) ? null : item[".flow_item"];
}

folderFormats = function(uid){
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();
  var item = properties.get(uid)
  return  (item == undefined || item == null) ? "" : item[".to_schemas"];
}

folderPath = function(uid){
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
  return ((connection.indexOf('jms') != -1) ? ("/" + connection) : connection);
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

folderFiles = function(uid){
  var files = [];
  var folder = appRoot + folderPath(uid);

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
              "formats": folderFormats(uid),
              "folder": folderName
            })
          }
    }
  })
  return files;
}

getFilenameFolder = function(folder){
  var files = fs.readdirSync(folder);
  
  var index = files.indexOf("template.json");
  files.splice(index, 1);
  files.sort(function(a, b) {
               return fs.statSync(folder + '/' + b).mtime.getTime() - 
                      fs.statSync(folder + '/' + a).mtime.getTime();
           }); 
  var fileName = files[0].split('_')[0] + "_" + (parseInt(files[0].split('_')[1]) + 1).toString() + ".json"
  return fileName;
}


router.get('/',  function(req, res){
  res.redirect('/folder/exports');
});

router.get('/download/:uid/:file', function(req, res) {
  var folder = appRoot + folderPath(req.params.uid); 
  res.download(folder + "/" + req.params.file);
});

router.get('/delete/:uid/:file', function(req, res){
  var folder = appRoot + folderPath(req.params.uid);
  fs.unlinkSync(folder + "/" + req.params.file);
  
  res.redirect(req.get('referer'));
})

router.get('/exports',  function(req, res) {
  res.redirect("/folder/list/exports");
});

router.get('/exports/new', function(req, res){
  var file_name  = "./db/exports/integration_script_" + moment().format('YYYY_MM_DD_hh_mm_ss') + ".sql"; 
  var all = "INTERFACE_NAME, OFFICE, INTERFACE_TYPE, INTERFACE_SUB_TYPE, REQUEST_DIRECTION, MESSAGE_WAIT_STATUS, INTERFACE_STATUS, MESSAGE_STOP_STATUS, STOP_AFTER_CONN_EXCEPTION, INTERFACE_MONITOR_INDEX, REQUEST_PROTOCOL, REQUEST_CONNECTIONS_POINT, REQUEST_FORMAT_TYPE, REQUEST_STORE_IND, RESPONSE_PROTOCOL, RESPONSE_CONNECTIONS_POINT, RESPONSE_FORMAT_TYPE, RESPONSE_STORE_IND, UID_INTERFACE_TYPES, NOT_ACTIVE_BEHAVIOUR, REC_STATUS, ASSOCIATED_SERVICE_NAME, NO_OF_LISTENERS, NON_JMS_RECEPIENT_IND, HANDLER_CLASS, BUSINESS_OBJECT_CLASS, BUSINESS_OPERATION, PMNT_SRC, CUSTOM_PROPERTIES, WAIT_BEHAVIOUR, BATCH_SIZE, SUPPORTED_APP_IDS, BACKOUT_INTERFACE_NAME, BULK_INTERFACE_NAME, APPLICATION_PROTOCOL_TP, REQUEST_GROUP_NM, SEQUENCE_HANDLER_CLASS, RESPONSE_INTERFACE, RESPONSE_TIMEOUT_MILLIS, RESPONSE_TIMEOUT_RETRY_NUM, HEARTBEAT_INTERFACE_NAME, INTERFACE_STOPPED_SOURCE, RESEND_ALLOWED, DESCRIPTION, THROTTLING_TX, THROTTLING_MILLIS, BULKING_PURPOSE, ENABLED_GROUPS,RESUME_SUPPORTED, EVENT_ID_GENERATION, BULK_RESPONSE_BY_ORIG_CHUNK, INVALID_RESPONSE_IN, PCI_DSS_COMPLIANT, BULKING_TRIGGER_METHOD, IS_BULK"  
  var arr = all.split(",");
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();

  sql = "select " + all + " from INTERFACE_TYPES" ;
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
              var script = "";  
              for(var i=0; i<result.rows.length; i++){
                var item = result.rows[i];
                console.log("--> Item is " + item);
                if(properties.get(item["UID_INTERFACE_TYPES"]+".active") == true){
                  var values = [], fields = [];
                  
                  for(var f=0; f<arr.length; f++){
                    var field = arr[f];
                    console.log(" What we get from DB for " + field + " is " + item[String(field)])
                    fields.push(field)
                    if(item[field] != null && item[field] != undefined){        
                      values.push("'" + item[field] + "'")
                    } else {
                      values.push(null);
                    }
                  }

                  script += "delete from INTERFACE_TYPES where uid_interface_types ='" + item["UID_INTERFACE_TYPES"] + "';\n\n"
                  script += "insert into INTERFACE_TYPES ("+ fields.join(',') +") \n"
                  script += "values ("+ values.join(',') +"); \n\n" 
                }
              }

              fs.writeFile(file_name, script , function (err,data) {
                if (err) { return console.log(err); }
                console.log(data);
              });
                
              res.redirect('/folder/exports');
            }
            // Release the connection
            connection.release(
                function (err) {
                    console.log( " 7 ========>>>> Release connection : " + err );
                    if (err) {
                        console.error(err.message);                       
                    } else {
                        console.log("Run sql query from script : Connection released");
                    }
                });
        });            
  });

})

router.get('/flows/:uid', function(req, res){
 res.redirect("/folder/list/flow^" + req.params.uid);
})

router.get('/list/:uid', function(req, res){
  var uid = req.params.uid;
  var title = ""
  var options = {
    "button": "",
    "upload": true,
    "uid" : uid,
    "formats" : folderFormats(uid)
  }

  if(uid.indexOf('exports') > -1){
    title = 'Interface setup scripts';
    options["button"] = "exports"
    options["upload"] = false
  }

  if(uid.indexOf('flow') > -1){
    title = "List of flows files from " + uid.split('^')[1];
    options["button"] = "flow"
    options["upload"] = false
  }

  if (title == ""){
    var item = flowItem(uid)
    folderName = item == null ? "udefined" : item.interface_name.split('_').join(" ")
    title = "List of files from " + folderName;
  }
  res.render('folder', { title: title, files: folderFiles(uid) , options: options});
})

router.get('/upload/:uid', function(req, res){
  var uid = req.params.uid;   
  var item = flowItem(uid)
  var folderName = item == null ? "udefined" : item.interface_name.split('_').join(" ")
  var title = "Upload to " + folderName;
  var options = {
    "button": "",
    "upload": true,
    "uid" : uid,
    "formats" : folderFormats(uid)
  }

  res.render('folder', { title: title, files: folderFiles(uid) , options: options});
})

router.get('/clone/:folder', function(req, res){
  var folder = "flows/" + req.params["folder"]
  var file_name = getFilenameFolder(folder)
  fse.copySync(folder + '/' + 'template.json' , folder + '/' +  file_name);
   
  res.redirect(req.get('referer'));
})

router.post('/upload/:uid', function(req, res){    
  form.multiples = true;
  var form = new formidable.IncomingForm();
  form.uploadDir = appRoot + folderPath(req.params.uid);  

  // rename it to it's orignal name
  //form.on('file', function(field, file) {
  //  if (fs.existsSync(file.path)) {       
  //    fs.rename(file.path, path.join(form.uploadDir, file.name));
  //    filename = file.name;
  //  }else{
  //    console.log("File was taken" + socketsConnected)
  //  } 
  //});

  form.on('error', function(err) {
    console.log('Upload to folder Error: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    var filename = this.openedFiles[0].name;
    console.log("File uploaded sucessfully " + filename);
    console.log("Uploaded to --> " + form.uploadDir);
    var isWin = /^win/.test(process.platform);
    if (!isWin && form.uploadDir.indexOf('jms') > -1){
      var sys = require('sys');
      var exec = require('child_process').exec;
      var queue = form.uploadDir.substring(4, form.uploadDir.length)
      var cmd = '~/dh/scripts/util/putMQMessage.ksh PRDTHV_465_LR ' + queue + ' ' +  appRoot + '/' + form.uploadDir + '/' + filename;
      console.log("Execute cmd --> " + cmd);
      exec(cmd, function (error, stdout, stderr) {
          console.log('stdout: ' + stdout);
          console.log('stderr: ' + stderr);
          if (error !== null) {
            console.log('exec error: ' + error);
          }
      });

    }
    res.end('success');
  });
  
  form.parse(req);
})

module.exports = router;
