var fs = require('fs');
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
    if( 1==0 ){
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
    var record = model.select(row_id);
    var folder = path.join(appRoot, record["REQUEST_CONNECTIONS_POINT"]);
    res.download(folder+"/"+file);
  }
  res.send("File could not be downloaded. Sorry ;( ")
});

router.get('/delete/:id/:file', function(req, res){
  var row_id = req.params["id"];
  var file = req.params["file"];
  
  if( row_id != 0 ){
    var record = model.select(row_id);
    var folder = path.join(appRoot, record["REQUEST_CONNECTIONS_POINT"]);    
    fs.unlinkSync(folder+"/"+file);
  }
  res.redirect(req.get('referer'));
})

router.get('/list/:id', function(req, res){
  var row_id = req.params["id"]
  var record = model.select(row_id);

  var folder = path.join(appRoot, record["REQUEST_CONNECTIONS_POINT"]);  
  var files = queuefiles(folder, row_id);
  var options = {
    "exports": false,
    "upload": false,
    "row_id" : row_id
  }  
  title = "List of files related to " + record["INTERFACE_NAME"].split('_').join(" ") ; 
  res.render('folder', { title: title, files: files , options: options});
})


router.get('/upload/:id', function(req, res){
  var row_id = req.params["id"]
  var record = model.select(row_id);
  
  var folder = path.join(appRoot, record["REQUEST_CONNECTIONS_POINT"]);
//  console.log(" --- The Folder is " + folder)
  var files = queuefiles(folder, row_id);
  var options = {
    "exports": false,
    "upload": true,
    "row_id" : row_id
  }  
  title = "Upload to " + record["INTERFACE_NAME"].split('_').join(" ") ;
  res.render('folder', { title: title, files: files , options: options});
})

router.post('/upload/:id', function(req, res){
  console.log("POST Fuile upload!!!")
  var row_id = req.params["id"]
  var record = model.select(row_id);
  
  
  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(appRoot, record["REQUEST_CONNECTIONS_POINT"]);    
  
  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    console.log("File upload" + file)
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('Upload error F***ed Up: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    console.log("File uploaded sucessfully")
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);
})

router.get('/build_folders', function(req, res){
    var folders = model.folders('jms');
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
