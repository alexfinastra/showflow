var express = require('express');
var router = express.Router();
var fs = require('fs');
var fse = require('fs-extra');
var tmp = require('temporary');
var json = require('json-file');
var async = require('async');
var jade = require("jade");
var es = require('event-stream');
var moment = require('moment');
var util = require('util');
var path = require('path');
var underscore = require("underscore");

var authentication_mdl = require('../middlewares/authentication');
var Usecase = require('../models/usecase');

router.get('/', function(req, res, next) {
  res.render('usecases', {data: null});      
});

router.get('/tree', function(req, res){  
  files = to_tree("reference/usecases/", [])  
  res.json({tree: files});
});

router.get('/template/:folder/:name', function(req, res, next) {
  var usecase_template = appRoot + "/reference/usecases/"+ req.params["folder"] + "/" + req.params["name"] 
  console.log("Usecase flow " + usecase_template);

  var usecase = new Usecase(usecase_template);  
  res.render('usecases', { data: usecase._flow });     
});

router.get('/subflow/:name/:back', function(req, res, next) {
  var usecase_template = appRoot + "/reference/subflows/"+ req.params["name"] + ".json"
  console.log("Usecase flow " + usecase_template);

  var usecase = new Usecase(usecase_template);  
  res.render('subflow', { data: usecase._flow, back: req.params["back"]  });     
});

router.get('/current', function(req, res){  
  var data = null
  if (currentFlow != ""){
    var flow = new Flow();
    data = flow._flow
  }
  res.render('flow', { data: data});
})

// need to add a flow index as input 
router.get('/load/:folder/:file', function(req, res, next){		
  //if(req.params.file.indexOf("template") > -1){
    //var file = new tmp.File();
    //var template = "flows/" + req.params.folder + "/" + req.params.file + ".json";   
    //currentFlow = file.path;    
    //fse.copySync(template, currentFlow);    
  //}else{
    
  //}
  
	currentFlow = appRoot + "/flows/" + req.params.folder + "/" + req.params.file + ".json" ; 
  var flow = new Flow();  
  console.log("OPA DATA " + JSON.stringify(flow._flow))  
	res.render('flow', { data: flow._flow});
});



module.exports = router;


const to_tree = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      console.log('directory', path.join(dir, file));
      var odir = {
        "text" : "<span class= 'font-weight-bold ml-2'>" + file + "</span>",
        "key": file,
        "selectable": false,
        "state": {
          "expanded": false,
          "selected": false
        },
        "nodes" : []
      }
      odir["nodes"] = to_tree(dirFile, dir.files);
      filelist.push(odir);
    } else {
      filelist.push({      
          "text": file.replace(".json", ""),
          "selectable": true,
          "state": { "selected": false },
          "key": file
        });
    }
  }
  return filelist;
};


var populate_rules = function(){
  var rules = new json.File(appRoot + "/db/properties/rules_index.json" );
  rules.readSync();

  var ids = Object.keys(rules.data)
  console.log(" +++ Keys are "+ ids)
  for(var i=0; i<ids.length; i++){
    rules.set(ids[i] + ".active", true)
    rules.set(ids[i]+ ".connected", true)
    rules.set(ids[i]+ ".req_fields", "")
    rules.set(ids[i]+ ".auditmsg", [])
    rules.set(ids[i]+ ".logpattern", [])
    rules.set(ids[i]+ ".mid", [])
    rules.set(ids[i]+ ".flow_item", {})
    rules.set(ids[i]+ ".flow_item.step", 0)
    rules.set(ids[i]+ ".flow_item.type", "rule" )
    rules.set(ids[i]+ ".flow_item.title", rules.get(ids[i]+".name"))
    rules.set(ids[i]+ ".flow_item.description", "")
    rules.set(ids[i]+ ".flow_item.uid", ids[i])
    rules.set(ids[i]+ ".flow_item.request_protocol", "Java")
    rules.set(ids[i]+ ".flow_item.direction", "I")
    rules.set(ids[i]+ ".flow_item.request_connections_point", "")
    rules.set(ids[i]+ ".flow_item.interface_name", "Rules")
    rules.set(ids[i]+ ".flow_item.status_class", "secondary")
    rules.set(ids[i]+ ".flow_item.office", "***")
    rules.set(ids[i]+ ".flow_item.interface_type", "Business Rule")
    rules.set(ids[i]+ ".flow_item.interface_sub_type", "")
    rules.set(ids[i]+ ".flow_item.request_format_type", "PDO")
    rules.writeSync();
  }
  
  
}
