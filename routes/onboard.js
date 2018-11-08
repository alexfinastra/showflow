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
var Flow = require('../models/flow_type');
var util = require('util');
var path = require('path');
var formidable = require('formidable');
var readLineFile = require("read-line-file");


router.get('/', function(req, res, next) {
	res.render('onboard');    	
});

router.get('/showflow/:mid/:view', function(req, res, next) {
  var payment_flow = appRoot + "/traces/global/"+ req.params["mid"] +"/flow.json" 
  var flow = new Flow(payment_flow);  
  //console.log("OPA DATA " + JSON.stringify(flow._flow)) 
  res.render('onboard', { data: flow._flow, view: req.params["view"] });     
});

router.get("/selectnode/:parent/:node", function(req, res){
  console.log("Query  --< " + JSON.stringify(req.query))
  
  var file_activities = new json.File(appRoot + "/traces/global/"+ req.params["node"] +"/activities.json");
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

  res.json({
    "draw": parseInt(query["draw"]),
    "recordsTotal": total ,
    "recordsFiltered": filtered,    
    "data": data 
  });
})

router.get('/tree', function(req, res){
  var products = new json.File(appRoot + "/traces/global/mids_index.json" );
  products.readSync();
  //should be filter here !!! 
  res.json({tree: products.data});
});


router.get("/parsefile/:filename", function(req, res){
  console.log("Parse File request " + req.params.filename)
  // TODO should be backgroung task here
  parseTrace(req.params.filename);
	res.redirect("/onboard")
})

router.post('/upload/:uid', function(req, res){      
  var form = new formidable.IncomingForm();
  var filename = ""

  form.multiples = true;
  form.uploadDir = path.join(appRoot + '/traces/' + req.params.uid);  

  // rename it to it's orignal name
  form.on('file', function(field, file) {
    console.log("**** Before rename " + file.path);    
    if (fs.existsSync(file.path)) {    
      date = new Date()
      datevalues = [date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds(),];
      new_filename = file.name.split(".")[0]  + "_" + datevalues.join('_') + "." + file.name.split(".")[1];

      if(fs.existsSync( path.join(form.uploadDir, new_filename) ) ){
        fs.unlinkSync(path.join(form.uploadDir, new_filename))
      }
      fs.rename(file.path, path.join(form.uploadDir, new_filename));
      filename = new_filename;     
    }else{
      console.log("File was taken")
    } 
  });

  form.on('error', function(err) {
    console.log('Upload to folder Error: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {   	
    console.log("End upload");  
    res.end(filename);
  });
  
  form.parse(req);
})

module.exports = router;


var rmDir = function(dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  fs.rmdirSync(dirPath);
}

var isDate = function(date) {
    return ((date.length > 4) && (date.match(/[a-z]/i) == null) && new Date(date) !== "Invalid Date" && !isNaN(new Date(date)) ) ? true : false;
}

var compose_activity = function(str, ind){
  activity = ""
  for(i=ind; i<str.length; i++)
  {
    fstr = str[i].replace(/:/g, '');
    fstr = str[i].replace(/,/g, ' ');            
    if(fstr.length > 0) {
      activity = activity + " " + fstr
    }
  }
  return activity
}

var beautifier = function(str){  
  if (isDate(str[0]) == false) { return [] }

  new_str = [];
  len = str.length;
  for(i=0;i<len;i++){
    val = str[i]

    vlen = val.length
    if(vlen > 3 && val[vlen-1] == ":"){
      new_str.push(val.replace(/:/g, ''))
      new_str.push(":") 
      continue; 
    }

    if((len != i+1) &&
       (val.indexOf('[') > -1) && (str[i+1].indexOf(']') > -1 )){      
      new_str.push(val + " " + str[i+1]); 
      str[i+1] = ""     
      continue;
    }

    if(vlen > 0){
      new_str.push(val) 
    }
  }  
  return new_str
}

var splitter_index = function(str){
  ind = 0
  for(i=0; i< str.length; i++){
    val = str[i].replace(/:/g, '')
    if(val.length == 0){
      ind = i
      break;
    }
  }
  return ind
}

var history_mids = function(){
  mids = [];
  
  var hnodes = history_nodes();
  if(hnodes.length > 0){
    hnodes.forEach(function(node){
      mids.push(node["key"]);
    }); 
  }
  return mids;
}

// List all files in a directory in Node.js recursively in a synchronous fashion
var walkSync = function(dir, filelist) {
  var path = path || require('path');
  var fs = fs || require('fs'),
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
          console.log("+++++++++++ " + file)
          file_arr = file.split('\\')
          filelist.push(file_arr[file_arr.length-1]);
          filelist = walkSync(path.join(dir, file), filelist);
      }
  });
  return filelist;
}

var history_nodes = function(cb){
  nodes = []
  var existing = walkSync(appRoot + "/traces/global")
  if(existing.length > 0){
    for(var i=0; i< existing.length; ++i) {
      //if(i < 45){
        nodes.push({
            "text": existing[i],
            "selectable":true,
            "key": existing[i],
            "state":{
               "selected":false
            }
        });  
      //} 
    }
  }
  console.log("------ hisotric nodes " + nodes.length);
  return cb(nodes);     
}

var buildPaymentFlow = function(flowData = []){
  var packages = [];
  var mids = [];
  var nodes = [];
  var activities = {};
  var flowitems = {};
  var existing_mids = walkSync(appRoot + "/traces/global");

  console.log("------ So we have mids " + existing_mids.length)
  console.log("------ And flow data length is " + flowData.length)
  flowData.forEach(function(line){
    if(line.length > 0 ){
      mid = line[3];      
      if(mid == undefined || mid == null){ mid = "NO MID"; }

      if(mid != "NO MID" && mid.length > 5){
        if(mid.indexOf('_') > -1){mida = mid.split('_'); mid = mida[1]; }
        
        if(existing_mids.indexOf(mid) == -1 && mids.indexOf(mid) == -1 ){
          mids.push(mid);
          nodes.push({
              "text": mid,
              "selectable":true,
              "key": mid,
              "state":{
                 "selected":false
              }
          });
        }

        if (activities[mid] == undefined){ activities[mid] = new Array }
        activities[mid].push(line)

        if(flowitems[mid] == undefined){ flowitems[mid] = new Array}
        flowitems[mid].push({
          "type": "activity",
          "description": line[4],
          "uid": line[4],
          "mid": mid,
          "rules": "",
          "features": line[5]
        });     
      }
    }
  });

  console.log("------ Mids collections is : " + mids.length)
  if(mids.length > 0){
    packages.push({
        "text":"<span class= 'ml-2'>Last upload ("+nodes.length+")</span>",
        "key": 'latest' ,
        "selectable":false,
        "state":{
           "expanded":false,
           "selected":false
        },
        "nodes": nodes
    });
  }
  
  history_nodes(function(nodes){
    if(nodes != undefined && nodes.length > 0){
      packages.push({
          "text": "<span class= 'ml-2'> History payments ("+nodes.length+")</span>",
          "key": 'history' ,
          "selectable":false,
          "state":{
             "expanded":false,
             "selected":false
          },
          "nodes": nodes
      });
    }
  })

  if(packages.length > 0){
    //packages[0]["state"]["selected"] = true
    //packages[0]["state"]["expanded"] = true
    // index filed updated with new mids

    fs.exists(appRoot + "/traces/global/mids_index.json", function(exists) {
      if(exists) {
        fs.unlinkSync(appRoot + "/traces/global/mids_index.json");              
      }
      fs.writeFileSync(appRoot + "/traces/global/mids_index.json", JSON.stringify(packages) , ['utf-8','as+']);  
    }); 

    //for each mid create a flow and activities files
    mids.forEach(function(mid){
      console.log(" --> Mid: " + mid + " has flowitems : " + flowitems[mid].length + " and  activities : " + activities[mid].length)
      
      current_path = appRoot +  "/traces/global/"+ mid;
      if (!fs.existsSync(current_path)){ fs.mkdirSync(current_path); }
      
      fs.writeFileSync(current_path +"/flow.json", JSON.stringify({
                                                                    "name": "Payment Flow",
                                                                    "mid": mid,
                                                                    "stp": "79%",
                                                                    "customization": "0%",
                                                                    "template": "single_payment_workflow",
                                                                    "input": "",
                                                                    "flowitems": flowitems[mid]
                                                                  }) , ['utf-8','as+']);
      fs.writeFileSync(current_path +"/activities.json", JSON.stringify(activities[mid]) , ['utf-8','as+']);
    })    
  }
  else{
    console.log("File is empty !!!!")
  }

  return;
}

var beautify_scope = function(scope){
  var s = []
  s.push(scope.split('-')[0])

  scope_arr = scope.split('-')[1].split('_');
  scope_arr.forEach(function(item){
    if((item.match(/[0-9]/i) == null) && (item.indexOf('[') == -1) && (item.indexOf(']') == -1)){
      s.push(item)
    }
  })

  return s.join(" ");
}

var parseTrace = function(filename){ 
  var lineNr = 0, 
      flowData = [],
      context = "";

  var s = fs.createReadStream(appRoot + "/traces/global/" + filename)
    .pipe(es.split())
    .pipe(es.mapSync(function(line){
        // pause the readstream
        s.pause();
        lineNr += 1;
        
          // formatted mapping is :
          // 0 - timestamp
          // 1 - thread
          // 2 - scope
          // 3 - MID
          // 4 - service
          // 5 - activity
        formatted = new Array(6) 
        str = beautifier(line.split(/\s+/) )       
        len = str.length;
        if ( len > 0 ){           
          sind = splitter_index(str)
          data = str.slice(4, sind)
          //console.log(" Line " + lineNr + ":  " + data.length + " context: " + data )

          formatted[0] = (str[0] + " " + str[1])
          formatted[1] = str[3]
          
          if(data.length == 1){
            formatted[2] = "GENERAL"           
            formatted[3] = "NO MID"
            formatted[4] = data[0]
          }

          if(data.length == 2){
            formatted[2] = data[0]
            formatted[3] = "NO MID"
            formatted[4] = data[1]
          }

          if(data.length == 3){
            formatted[2] = data[0]          
            if(data[1].length > 10){formatted[3] = data[1] }else{formatted[3] = "NO MID"}            
            formatted[4] = data[2]
          }

          formatted[5] = compose_activity(str, sind)           
          flowData.push(formatted)          
          s.resume(); 
        } else { 
          len = flowData.length; 
          if(len > 0){
            flowData[len-1] =  flowData[len-1] + " " + line.replace(/:/g, '').replace(/,/g, ' '); 
          }          
          s.resume();  
        }
    })
    .on('error', function(err){
        console.log('Error while reading file.', err);
    })
    .on('end', function(){
        if(flowData.length > 0){    
          console.log("-- Just before Payment Flow --")
          buildPaymentFlow(flowData)          
          //fs.writeFileSync(appRoot + "/traces/global/traces_data.csv", flowData.join('\n') , 'utf-8');          
        }        
        console.log('Read entire file.')
    })
  );
  
}

var parseCOTS = function(filename){	
  var workbook = XLSX.readFile(appRoot + "/cots/eurobank/" + filename);
	var sheet_name_list = workbook.SheetNames;
	
  var nodes_features = [], nodes_scenarios = []
	for(var s=0; s< sheet_name_list.length; s++) {				
		var y = sheet_name_list[s];
	  if("Parameters" == y) {continue;}

    var new_key = y.split('.').join('').split(' ').join('_')
    var worksheet = workbook.Sheets[y];          
    var features = [], scenarios = [];
    
    parseWorksheet(worksheet, features, scenarios)        
    console.log(" ---> Retrieve data from " + y + " sheet with " + features.length + " features and " + scenarios.length + " scenarios")

    if(features.length > 0){
      buildSetup(features, nodes_features, new_key)
    }
    
    var dir = appRoot + "/flows/" + new_key;
    if(scenarios.length > 0){     
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }

      buildSetup(scenarios, nodes_scenarios, new_key, "scenarios", dir)
    } else {
      if (fs.existsSync(dir)){
        rmDir(dir)
      }
    }
	}

  buildPackagesList(nodes_features, nodes_scenarios)	
}

var getFlow =  function(feature){
  var file = new json.File(appRoot + "/cots/GPP_SP_single_payment_workflow.json" );
  file.readSync();
  var flow = file.data
  var items = []

  var no_more_activity = false
  var has_activity = false
  var queue = ""
  for(var i=0; i< flow["flowitems"].length; i++){
    var item = flow["flowitems"][i]
    console.log(" ********  get Flow current item : " + item + "\n")

    switch(item["type"]){
      case "activity":
        if(no_more_activity == false){
          items.push(item)
          has_activity = true
        }
        if(item["features"].indexOf(feature) > -1){
          no_more_activity = true
        }
        break
      case "queue":
        if(no_more_activity == true && queue == "" && item["features"].indexOf(feature) > -1){
          items.push(item)
        }
        break
      default:
        if(no_more_activity == false){
          items.push(item)
        }
        break
    }    
  }

  flow["flowitems"] = items;
  return (has_activity ? JSON.stringify(flow) : null);
}


var filename = ""

var splitSchema = function(){  
  rlf = readLineFile(appRoot + '/db/scripts/schema.sql',
    (line) => processLine(line),
    () => console.log('close'),
    (err) => console.log('error')
  )
}

var processLine = function(line){  
  if(line.indexOf("prompt Loading") != -1){
    filename = appRoot + '/db/scripts/' + line.split(' ')[2].split("...")[0] + ".sql"  
    fs.writeFile(filename, "" , function(err) {})   
  }

}