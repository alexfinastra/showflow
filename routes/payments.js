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

var Payment = require('../models/payment');

router.get('/', function(req, res, next) {
  res.render('payments');      
});

router.get('/tree', function(req, res){
  files = to_tree("temp/", [])  
  res.json({tree: files});
});

router.get('/flow/:env/:mid', function(req, res, next) {
  var payment_flow = appRoot + "/temp/" + req.params["env"] + "/" + req.params["mid"] +"/flow.json" 
  console.log("payment_flow :" + payment_flow) 
  var flow = new Payment(payment_flow);  
  console.log("Flow payments load :" + JSON.stringify(flow._flow)) 
  res.render('payments', { data: flow._flow, view: "flow" });     
});

router.get("/activities/:env/:mid", function(req, res){
  console.log("Query  --< " + JSON.stringify(req.query))
  
  var file_activities = new json.File(appRoot + "/temp/" + req.params["env"] + "/" + req.params["mid"] +"/activities.json" );
  file_activities.readSync();
  activities = []
  file_activities.data.forEach(function(line){ 
    activities.push({        
      "time": (new Date(line[0])).toISOString().split('T')[1].split('Z')[0], 
      "service": line[4],               
      "activity": line[5]
    })
  })

  var query = req.query
  var total = activities.length    
  var filtered = 0;
  data = [];
  if(query["start"] && query["length"]){      
    if(query["search"]["value"] == ""){
      data = activities.slice(parseInt(query["start"]), parseInt(query["start"]) + parseInt(query["length"]))
      filtered = total
    } else {
      searched = []
      activities.forEach(function(a){
        if(a["activity"].indexOf(query["search"]["value"]) != -1){
          searched.push(a)
        }
      })
      data = searched.slice(parseInt(query["start"]), parseInt(query["start"]) + parseInt(query["length"]))
      filtered = searched.length
    }
  }

  res.render('payments', { data: {
	  	"mid": req.params["mid"],
	  	"name": "Activities log",
	    "draw": parseInt(query["draw"]),
	    "recordsTotal": total ,
	    "recordsFiltered": filtered,    
	    "data": data 
	  }, view: "table" });
})


router.get('/compare/:env1/:mid1/:env2/:mid2', function(req, res, next) {
  console.log("00000000  " + JSON.stringify(req.params))
  var payment_flow_left = appRoot + "/temp/"+ req.params["env1"] + "/" + req.params["mid1"] +"/flow.json" 
  var flow_left = new Payment(payment_flow_left);  

  var payment_flow_right = appRoot + "/temp/"+ req.params["env2"] + "/" + req.params["mid2"] +"/flow.json" 
  var flow_right = new Payment(payment_flow_right);  
  //console.log("OPA DATA " + JSON.stringify(flow._flow)) 
  res.render('payments', { data_left: flow_left._flow, 
                          view: "split",
                          data_right: flow_right._flow                           
                        });     
});

module.exports = router;


const to_tree = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      //console.log('directory', path.join(dir, file));
      
      if(file.indexOf("189") == 0){
				filelist.push({      
				          "text": file,
				          "selectable": true,
				          "state": { "selected": false },
				          "key": file
				        });
      } else {
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
      }
      
    } else {
      // do nothing with files
    }
  }
  return filelist;
};
