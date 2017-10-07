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

folderformats = function(folder){
  return "pain.001.001.06, pain.002.001.08,pain.007.001.02,pain.008.001.06"
}

folderfiles = function(folderfiles, row_id){
  var files = [];
  fs.readdirSync(folder).forEach( function(file) {
    console.log("current file is "+file)
    
    if (file.length > 2 && file.indexOf("template") == -1){ 
      var stats = fs.statSync(folder + '/' + file);
      var folderName = (folder.indexOf("/") == -1) ? folder : folder.split("/")[folder.split("/").length - 1]
      console.log("--- . >> Upload folder is : " + folderName)
      if(stats.isFile()){
            files.push({      
              "name": file,
              "size": humanFileSize(stats.size, true) , //(stats.size / 1000.0 + " KB"),
              "created": moment(stats.birthtime).fromNow(),
              "id" : row_id,
              "formats": folderformats(folder),
              "folder": folderName
            })
          }
    }
  })
  return files;
}

get_filename_folder = function(folder){
  var files = fs.readdirSync(folder);
  
  var index = files.indexOf("template.json");
  files.splice(index, 1);
  files.sort(function(a, b) {
               return fs.statSync(folder + '/' + b).mtime.getTime() - 
                      fs.statSync(folder + '/' + a).mtime.getTime();
           }); 
  var filename = files[0].split('_')[0] + "_" + (parseInt(files[0].split('_')[1]) + 1).toString() + ".json"
  return filename;
}


router.get('/',  function(req, res){
  res.redirect('/folder/exports');
});

router.get('/download/:id/:file/:folder', function(req, res) {
  var row_id = req.params["id"];
  var file = req.params["file"];
  var f = req.params["folder"];

  if( row_id == 0 ){
    folder = "./db/exports/";
  } else if (row_id== 99999999){
    folder = "./flows/" + f; 
  }else{ 
    //var record = model.select(row_id);

    folder = "./flows/" + f //path.join(record["REQUEST_CONNECTIONS_POINT"]);
  }
  res.download(folder+"/"+file);
});

router.get('/exports',  function(req, res) {
  var row_id = 0;
  var files = folderfiles(appRoot + "/db/exports", row_id);
  var options = {
    "button": "exports",
    "upload": false,
    "row_id" : row_id,
    "formats" : ""
  }
  res.render('folder', { title: 'Interface setup scripts', files: files , options: options});
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
              console.log("----------- > REsults are " + result.rows.length)
              var script = "";  
              for(var i=0; i<result.rows.length; i++){
                var item = result.rows[i];
                var ikey = item["UID_INTERFACE_TYPES"]+".active"
                if(properties.get(ikey) == true){
                  var values = [];
                  var fields = [];
                  
                  for(var f=0; f<arr.length; f++){
                    var field = arr[f];
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
                if (err) {
                  return console.log(err);
                }
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

router.get('/flows/:folder', function(req, res){
 console.log("Flows folder " + req.params["folder"] )
  var folder = "flows/" + req.params["folder"] 
  var files = folderfiles(folder, 99999999);
  var options = {
    "button": "flow",
    "name": req.params["folder"],
    "upload": false,
    "row_id" : 99999999,
    "formats" : ""
  }  
  title = "List of files related to " + req.params["folder"];
  res.render('folder', { title: title, files: files , options: options});
})

router.get('/list/:id', function(req, res){
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();
  var record = properties.get(req.params.id);     
  var folder = path.join(record.flow_item.request_connections_point);
  var files = folderfiles(folder, req.params.id);
  var options = {
    "button": "",
    "upload": false,
    "row_id" : req.params.id,
    "formats" : ""
  }  
  title = "List of files related to " + record.flow_item.interface_name.split('_').join(" ") ;
  res.render('folder', { title: title, files: files , options: options});
})

router.get('/upload/:id', function(req, res){
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();
  
  var files = []
  var record = properties.get(req.params.id);      
  var folder = path.join(record.flow_item.request_connections_point);
  var title = "Upload to " + record.flow_item.interface_name.split('_').join(" ") ;  

  if (folder.length > 0){
    files = folderfiles(folder, req.params.id);
  }
  
  var options = {
    "button": "",
    "upload": ((folder.length > 0) ? true : false),
    "row_id" : req.params.id,
    "formats" : record.to_schemas
  }  
   
  res.render('folder', { title: title, files: files , options: options});
})

router.get('/clone/:folder', function(req, res){
  var folder = "flows/" + req.params["folder"]
  var file_name = get_filename_folder(folder)
  fse.copySync(folder + '/' + 'template.json' , folder + '/' +  file_name);
   
  res.redirect(req.get('referer'));
})

router.post('/upload/:id', function(req, res){
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" );
  properties.readSync();
  var record = properties.get(req.params.id);
  
  var form = new formidable.IncomingForm();
  var filename = ""

  form.multiples = true;
  form.uploadDir = path.join(record.flow_item.request_connections_point);  

  // rename it to it's orignal name
  form.on('file', function(field, file) {
    if (fs.existsSync(file.path)) {       
      fs.rename(file.path, path.join(form.uploadDir, file.name));
      filename = file.name;
    }else{
      console.log("File was taken" + socketsConnected)
    } 
  });

  form.on('error', function(err) {
    console.log('Upload to folder Error: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    console.log("File uploaded sucessfully");
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
