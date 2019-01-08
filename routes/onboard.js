var express = require('express');
var router = express.Router();
var async = require('async')
var json = require('json-file');
var jade = require("jade");
var authentication_mdl = require('../middlewares/authentication');
var fs = require('fs');
var fse = require('fs-extra')
var es = require('event-stream');
var moment = require('moment');

var util = require('util');
var path = require('path');
var formidable = require('formidable');
var readLineFile = require("read-line-file");
var underscore = require("underscore");

var Usecase = require('../models/usecase');
var Parser = require('../middlewares/parser');
var Storage = require('../middlewares/storage');

router.get("/parsefile/:filename", function(req, res){
  var dir = path.join(appRoot + '/uploads/' );
  console.log("Parse File request " +  dir + req.params.filename + "file exists : " + fs.existsSync(dir + req.params.filename))
  var parser = new Parser()
  parser.parse(dir + req.params.filename, function(){
    res.redirect("/usecases");  
  })
  // TODO should be backgroung task here
  //parseTrace(req.params.filename);
})

router.get("/upload", function(req, res, next){
  res.redirect("/usecases")
});

router.post('/upload/:uid', function(req, res){      
  var form = new formidable.IncomingForm();
  var filename = ""
  var filepath = "";

  //form.multiples = true;
  var dir = path.join(appRoot + '/uploads/' );
  if (!fs.existsSync(dir)){   fs.mkdirSync(dir);  }
  form.uploadDir = dir;  
  form.env = req.params.uid
  form.parse(req);

  // rename it to it's orignal name
  form.on('file', function(field, file) {
    console.log("**** Before rename " + file.path);    
    if (fs.existsSync(file.path)) {    
      date = new Date()
      datevalues = [date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds(),];
      new_filename = form.env + "-" + file.name.split(".")[0]  + "_" + datevalues.join('_') + "." + file.name.split(".")[1];

      if(fs.existsSync( path.join(form.uploadDir, new_filename) ) ){
        fs.unlinkSync(path.join(form.uploadDir, new_filename))
      }
      fs.renameSync(file.path, path.join(form.uploadDir, new_filename));
      filename = new_filename;
      filepath = path.join(form.uploadDir, new_filename)
    }else{
      console.log("File was taken")
    } 
  });

  form.on('error', function(err) {
    console.log('Upload to folder Error: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {     
    console.log("End upload : " + filepath );  
    res.end(filename);
  });
})

module.exports = router;
