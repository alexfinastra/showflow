var fs = require('fs');
var moment = require('moment');
var express = require('express');
var router = express.Router();
var json = require('json-file');

var path = require('path');
var formidable = require('formidable');
var mkdirp = require('mkdirp');

var async = require('async')


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


queuefiles = function(folder, row_id){
  var files = [];
  fs.readdirSync(folder).forEach( function(file) {
    console.log("current file is "+file)
    
    if (file.length > 2){ 
      var stats = fs.statSync(folder + '/' + file);
      if (stats.isFile()){
            files.push({      
              "name": file,
              "size": humanFileSize(stats.size, true) , //(stats.size / 1000.0 + " KB"),
              "created": moment(stats.birthtime).fromNow(),
              "id" : row_id
            })
          }
    }
  })
  return files;
}

router.get('/',  function(req, res){
  res.redirect('/folder/exports');
});

router.get('/download/:id/:file', function(req, res) {
  var row_id = req.params["id"];
  var file = req.params["file"];

  if( row_id != 0 ){
    var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
    properties.readSync();
    var record = properties.get(req.params.id);     
    folder = path.join(record.flow_item.request_connections_point);
    res.download(folder+"/"+file);
  }
  res.send("File could not be downloaded. Sorry ;( ")
});

router.get('/delete/:id/:file', function(req, res){
  var row_id = req.params["id"];
  var file = req.params["file"];
  
  if( row_id != 0 ){
    var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
    properties.readSync();
    var record = properties.get(req.params.id);     
    folder = path.join(record.flow_item.request_connections_point);   
    fs.unlinkSync(folder+"/"+file);
  }
  res.redirect(req.get('referer'));
})

router.get('/list/:id', function(req, res){
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();
  var record = properties.get(req.params.id);     
  folder = path.join(record.flow_item.request_connections_point); 
  var files = queuefiles(folder, req.params.id);
  var options = {
    "exports": false,
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
    var record = properties.get(req.params.id);     
    folder = path.join(record.flow_item.request_connections_point);
  var files = queuefiles(folder, req.params.id);
  var options = {
    "exports": false,
    "upload": true,
    "row_id" : req.params.id,
    "formats" : record.to_schemas
  }  
  
  title = "Upload to " + record.flow_item.interface_name.split('_').join(" ") ;
  res.render('folder', { title: title, files: files , options: options});
})

router.get('/build_folders', function(req, res){
    var folders = [] // model.folders('jms');
    console.log("Number of folders are "+ folders.length)

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
