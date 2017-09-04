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
    model.load_from_db(model, callback) 
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


folderfiles = function(folder, row_id){
  var files = [];
  fs.readdirSync(folder).forEach(file => {
    const stats = fs.statSync(folder + '/' + file);
    files.push({      
      "name": file,
      "size": humanFileSize(stats.size, true) , //(stats.size / 1000.0 + " KB"),
      "created": moment(stats.birthtime).fromNow(),
      "id" : row_id
    });
  });
  return files;
}

router.get('/',  function(req, res){
  res.redirect('/folder/exports');
});

router.get('/download/:id/:file', function(req, res) {
  var row_id = req.params["id"];
  var file = req.params["file"];
  console.log(" YES I AM SDA");
  if( row_id == 0 ){
    folder = "./exports/";
  }else{    
    var record = model.select(row_id);
    folder = path.join('env', record["REQUEST_CONNECTIONS_POINT"]);
  }
  res.download(folder+"/"+file);
});

router.get('/exports',  function(req, res) {
  var row_id = 0;
  var files = folderfiles("exports", row_id);
  var options = {
    "exports": true,
    "upload": false,
    "row_id" : row_id
  }
  res.render('folder', { title: 'Interface setup scripts', files: files , options: options});
});

router.get('/exports/new', function(req, res){
  var file_name  = "./exports/integration_script_" + moment().format('YYYY_MM_DD_hh_mm_ss') + ".sql"; 
  
  fs.writeFile(file_name, "SELECT * FROM INTERFACE_TYPES; ", function (err,data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);
  });
  
  res.redirect('/folder/exports');
});

router.get('/delete/:id/:file', function(req, res){
  var row_id = req.params["id"];
  var file = req.params["file"];
  
  if( row_id == 0 ){
    folder = "./exports/";
  }else{        
    var record = model.select(row_id);
    folder = path.join('env', record["REQUEST_CONNECTIONS_POINT"]);
  }
  fs.unlinkSync(folder+"/"+file);
  res.redirect(req.get('referer'));
})

router.get('/list/:id', function(req, res){
  var row_id = req.params["id"]
  var record = model.select(row_id);

  var folder = path.join('env', record["REQUEST_CONNECTIONS_POINT"]);  
  var files = folderfiles(folder, row_id);
  var options = {
    "exports": false,
    "upload": false,
    "row_id" : row_id
  }  
  title = model.get_sub_type_desc(record["INTERFACE_SUB_TYPE"]) ; 
  res.render('folder', { title: title, files: files , options: options});
})


router.get('/upload/:id', function(req, res){
  var row_id = req.params["id"]
 var record = model.select(row_id);

  var folder = path.join('env', record["REQUEST_CONNECTIONS_POINT"]);
  var files = folderfiles(folder, row_id);
  var options = {
    "exports": false,
    "upload": true,
    "row_id" : row_id
  }  
  title = model.get_sub_type_desc(record["INTERFACE_SUB_TYPE"]) ; 
  res.render('folder', { title: title, files: files , options: options});
})


router.post('/upload/:id', function(req, res){
  var row_id = req.params["id"]
  var record = model.select(row_id);

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join('env', record["REQUEST_CONNECTIONS_POINT"]);  

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);
})

router.get('/build_folders', function(req, res){
    var folders = model.folders();
    console.log("Folders are "+folders)

    for (var i = folders.length - 1; i >= 0; i--) {
      var folder = folders[i];
      if(folder == "" || folder.indexOf(":") > -1 || folder.indexOf(".") > -1  ){
        continue;
      }

      if(folder.indexOf("jms") == -1){
        continue;
      }

      var p = "./env/" + folder;  // path.join('env', folder);
      console.log("  PATH is --> " + p);
      ensureExists(p, 0744, function(err){
        if (err){ }// handle folder creation error
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
