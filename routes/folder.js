var fs = require('fs');
var fse = require('fs-extra');
var moment = require('moment');
var express = require('express');
var router = express.Router();

var path = require('path');
var formidable = require('formidable');
var mkdirp = require('mkdirp');

var async = require('async')
var Profile = require('../models/profileModel');
var model = new Profile('all');

async.waterfall([
    function(callback){
      if(global.oracle == true ){
        model.load_from_db(model, callback) 
      }else{
        model.load()
      }
    }
  ],
  function(err, results){     
    if(err){
      console.log("WHAT A F*** "+ err)
    }    
})

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

folderfiles = function(folder, row_id){
  var files = [];
  fs.readdirSync(folder).forEach( function(file) {
    console.log("current file is "+file)
    
    if (file.length > 2 && file.indexOf("template") == -1){ 
      var stats = fs.statSync(folder + '/' + file);
      var puref = (folder.indexOf("/") == -1) ? folder : folder.split("/")[folder.split("/").length - 1]
      if(stats.isFile()){
            files.push({      
              "name": file,
              "size": humanFileSize(stats.size, true) , //(stats.size / 1000.0 + " KB"),
              "created": moment(stats.birthtime).fromNow(),
              "id" : row_id,
              "formats": folderformats(folder),
              "folder": puref
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
    var record = model.select(row_id);
    folder = path.join(record["REQUEST_CONNECTIONS_POINT"]);
  }
  res.download(folder+"/"+file);
});

router.get('/exports',  function(req, res) {
  var row_id = 0;
  var files = folderfiles("db/exports", row_id);
  var options = {
    "button": "exports",
    "upload": false,
    "row_id" : row_id,
    "formats" : ""
  }
  res.render('folder', { title: 'Interface setup scripts', files: files , options: options});
});


//insert into INTERFACE_TYPES (INTERFACE_NAME, OFFICE, INTERFACE_TYPE, INTERFACE_SUB_TYPE, REQUEST_DIRECTION, MESSAGE_WAIT_STATUS, INTERFACE_STATUS, MESSAGE_STOP_STATUS, STOP_AFTER_CONN_EXCEPTION, INTERFACE_MONITOR_INDEX, REQUEST_PROTOCOL, REQUEST_CONNECTIONS_POINT, REQUEST_FORMAT_TYPE, REQUEST_SKELETON_XML, REQUEST_STORE_IND, RESPONSE_PROTOCOL, RESPONSE_CONNECTIONS_POINT, RESPONSE_FORMAT_TYPE, RESPONSE_SKELETON_XML, RESPONSE_STORE_IND, UID_INTERFACE_TYPES, TIME_STAMP, NOT_ACTIVE_BEHAVIOUR, EFFECTIVE_DATE, PROFILE_CHANGE_STATUS, REC_STATUS, PENDING_ACTION, ASSOCIATED_SERVICE_NAME, NO_OF_LISTENERS, NON_JMS_RECEPIENT_IND, HANDLER_CLASS, BUSINESS_OBJECT_CLASS, BUSINESS_OPERATION, PMNT_SRC, CUSTOM_PROPERTIES, WAIT_BEHAVIOUR, BATCH_SIZE, SUPPORTED_APP_IDS, BACKOUT_INTERFACE_NAME, BULK_INTERFACE_NAME, APPLICATION_PROTOCOL_TP, REQUEST_GROUP_NM, SEQUENCE_HANDLER_CLASS, RESPONSE_INTERFACE, RESPONSE_TIMEOUT_MILLIS, RESPONSE_TIMEOUT_RETRY_NUM, HEARTBEAT_INTERFACE_NAME, INTERFACE_STOPPED_SOURCE, RESEND_ALLOWED, DESCRIPTION, THROTTLING_TX, THROTTLING_MILLIS, BULKING_PURPOSE, ENABLED_GROUPS, RESUME_SUPPORTED, EVENT_ID_GENERATION, BULK_RESPONSE_BY_ORIG_CHUNK, INVALID_RESPONSE_IN, PCI_DSS_COMPLIANT, BULKING_TRIGGER_METHOD, IS_BULK)
//values ('AC_MND_TT1_RJCT', '***', 'ACK', 'NAK_TO_EMANDATE', 'O', null, 'ACTIVE', null, 5, -1, 'MQ', 'jms/Q_ACK_AC_MND_TT1', 'Pacs_002', null, 1, null, null, null, null, 0, '***^AC_MND_TT1_RJCT', '2017-02-27 14:32:23.695', 'STOP', to_date('12-07-2015', 'dd-mm-yyyy'), 'NO', 'AC', 'UP', 'BusinessFlowSelectorService', 0, 1, 'backend.paymentprocess.interfaces.handlers.AckNotificationInterfaceHandler', 'gpp.webservices.businessflowselector.external.BusinessFlowSelectorServiceImpl', 'executeBusinessFlow', null, null, null, null, '1,2', null, null, null, null, null, null, null, null, null, null, '0', null, null, null, null, null, '0', null, null, null, null, null, null);
router.get('/exports/new', function(req, res){
  model.reload();

  var file_name  = "./db/exports/integration_script_" + moment().format('YYYY_MM_DD_hh_mm_ss') + ".sql"; 
  var all = "INTERFACE_NAME, OFFICE, INTERFACE_TYPE, INTERFACE_SUB_TYPE, REQUEST_DIRECTION, MESSAGE_WAIT_STATUS, INTERFACE_STATUS, MESSAGE_STOP_STATUS, STOP_AFTER_CONN_EXCEPTION, INTERFACE_MONITOR_INDEX, REQUEST_PROTOCOL, REQUEST_CONNECTIONS_POINT, REQUEST_FORMAT_TYPE, REQUEST_STORE_IND, RESPONSE_PROTOCOL, RESPONSE_CONNECTIONS_POINT, RESPONSE_FORMAT_TYPE, RESPONSE_STORE_IND, UID_INTERFACE_TYPES, NOT_ACTIVE_BEHAVIOUR, REC_STATUS, ASSOCIATED_SERVICE_NAME, NO_OF_LISTENERS, NON_JMS_RECEPIENT_IND, HANDLER_CLASS, BUSINESS_OBJECT_CLASS, BUSINESS_OPERATION, PMNT_SRC, CUSTOM_PROPERTIES, WAIT_BEHAVIOUR, BATCH_SIZE, SUPPORTED_APP_IDS, BACKOUT_INTERFACE_NAME, BULK_INTERFACE_NAME, APPLICATION_PROTOCOL_TP, REQUEST_GROUP_NM, SEQUENCE_HANDLER_CLASS, RESPONSE_INTERFACE, RESPONSE_TIMEOUT_MILLIS, RESPONSE_TIMEOUT_RETRY_NUM, HEARTBEAT_INTERFACE_NAME, INTERFACE_STOPPED_SOURCE, RESEND_ALLOWED, DESCRIPTION, THROTTLING_TX, THROTTLING_MILLIS, BULKING_PURPOSE, ENABLED_GROUPS,RESUME_SUPPORTED, EVENT_ID_GENERATION, BULK_RESPONSE_BY_ORIG_CHUNK, INVALID_RESPONSE_IN, PCI_DSS_COMPLIANT, BULKING_TRIGGER_METHOD, IS_BULK"  
  var arr = all.split(",");

  var script = "prompt This is for demo usage only... \n set feedback off \n set define off \n\n";
  for (var i = 0; i< model._collection.length; i++  ) { 
    var item = model._collection[i];
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

  fs.writeFile(file_name, script , function (err,data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);
  });
  
  res.redirect('/folder/exports');
});

router.get('/delete/:id/:file/:folder', function(req, res){
  var row_id = req.params["id"];
  var file = req.params["file"];
  var f = req.params["folder"];

  if( row_id == 0 ){
    folder = "./db/exports/";
  } else if (row_id== 99999999){
    folder = "./flows/" + f;
  }
  else{    
    var record = model.select(row_id);
    folder = path.join(record["REQUEST_CONNECTIONS_POINT"]);
  }
  fs.unlinkSync(folder+"/"+file);
  res.redirect(req.get('referer'));
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
  var row_id = req.params["id"]
  var record = model.select(row_id);

  var folder = path.join(record["REQUEST_CONNECTIONS_POINT"]);  
  var files = folderfiles(folder, row_id);
  var options = {
    "button": "",
    "upload": false,
    "row_id" : row_id,
    "formats" : ""
  }  
  title = "List of files related to " + record["INTERFACE_NAME"].split('_').join(" ") ;
  res.render('folder', { title: title, files: files , options: options});
})

router.get('/upload/:id', function(req, res){
  var row_id = req.params["id"]  
  var files = []
  var folder = ""
  var title = "Folder path is incorrect"
  var record = null

  if (row_id != undefined && row_id != null && row_id != 'undefined'){
    record = model.select(row_id);
    folder = path.join(record["REQUEST_CONNECTIONS_POINT"]);
    title = "Upload to " + record["INTERFACE_NAME"].split('_').join(" ") ;  
  } 
  
  if (folder.length > 0){
      files = folderfiles(folder, row_id);
  }
  
  var options = {
    "button": "",
    "upload": ((folder.length > 0) ? true : false),
    "row_id" : row_id,
    "formats" : model._properties.get(record["UID_INTERFACE_TYPES"])["to_schemas"]
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
  
  var row_id = req.params["id"]
  var record = model.select(row_id);
  var form = new formidable.IncomingForm();

  form.multiples = true;
  form.uploadDir = path.join(record["REQUEST_CONNECTIONS_POINT"]);  

  // rename it to it's orignal name
  form.on('file', function(field, file) {
    if (fs.existsSync(file.path)) {       
      fs.rename(file.path, path.join(form.uploadDir, file.name));
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
      exec('~/dh/scripts/util/putMQMessage.ksh PRDTHV_465_LR ' + form.uploadDir.split('/')[1] + ' ' +  file.path,
        function (error, stdout, stderr) {
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
