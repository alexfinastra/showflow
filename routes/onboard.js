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
var underscore = require("underscore");

router.get('/', function(req, res, next) {
	res.render('onboard');    	
});

router.get('/showflow/template/:name', function(req, res, next) {
  var payment_flow = appRoot + "/traces/flows/"+ req.params["name"] +".json" 
  var flow = new Flow(payment_flow);  
  //console.log("OPA DATA " + JSON.stringify(flow._flow)) 
  res.render('onboard', { data: flow._flow, view: "flow"});     
});

router.get('/showflow/:mid/:view', function(req, res, next) {
  var payment_flow = appRoot + "/traces/global/"+ req.params["mid"] +"/flow.json" 
  var flow = new Flow(payment_flow);  
  //console.log("OPA DATA " + JSON.stringify(flow._flow)) 
  res.render('onboard', { data: flow._flow, view: req.params["view"] });     
});

router.get('/showflow/:mid/:view/:othermid', function(req, res, next) {
  console.log("00000000  " + JSON.stringify(req.params))
  var payment_flow_left = appRoot + "/traces/global/"+ req.params["mid"] +"/flow.json" 
  var flow_left = new Flow(payment_flow_left);  

  var payment_flow_right = appRoot + "/traces/global/"+ req.params["othermid"] +"/flow.json" 
  var flow_right = new Flow(payment_flow_right);  
  //console.log("OPA DATA " + JSON.stringify(flow._flow)) 
  res.render('onboard', { data_left: flow_left._flow, 
                          view: req.params["view"],
                          data_right: flow_right._flow                           
                        });     
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
          //console.log("+++++++++++ " + file)
          file_arr = file.split('\\')
          filelist.push(file_arr[file_arr.length-1]);
          filelist = walkSync(path.join(dir, file), filelist);
      }
  });
  //console.log(" >>>>>>> files list " + filelist)
  return filelist;
}

var history_nodes = function(mids){
  var hnodes = []
  var existing = walkSync(appRoot + "/traces/global")
  if(existing.length > 0){
    for(var i=0; i< existing.length; ++i) {
      if(mids.indexOf(existing[i]) == -1){
        hnodes.push({
            "text": existing[i],
            "selectable":true,
            "key": existing[i],
            "state":{
               "selected":false
            }
        });  
      } 
    }
  }
  console.log("------ hisotric nodes " + hnodes.length);
  return hnodes;     
}

var getMid = function(line){
   var mid = "";
   if(line.length > 0 ){
    mid = line[3];

    if(mid == undefined || mid == null || mid.length < 5){ 
      mid = "NO MID"; 
    } else {
      if(mid.indexOf('_') > -1){
        mida = mid.split('_'); 
        mid = mida[1]; 
      }
    }
  }
  //console.log(" ******** Oh, MID!!! " + mid + " from : " + line[3]);
  return mid;
}

var last_upload = function(mids){
  if (mids.length > 0 ){
    nodes = []
    mids.forEach(function(mid){
       nodes.push({ "text": mid, "selectable": true, "key": mid, "state": {"selected":false} });
    })
    return {
          "text":"<span class= 'ml-2'>Last upload ("+nodes.length+")</span>",
          "key": 'latest' ,
          "selectable":false,
          "state":{
             "expanded":false,
             "selected":false
          },
          "nodes": nodes
      }
  } else {
    return null;
  }
}

var history_payments = function(mids){
  if (mids.length > 0 ){    
    hnodes = history_nodes(mids)
    if(hnodes.length > 0 ){
      return {
              "text": "<span class= 'ml-2'> History payments ("+hnodes.length+")</span>",
              "key": 'history' ,
              "selectable":false,
              "state":{
                 "expanded":false,
                 "selected":false
              },
              "nodes": hnodes
          }
    } else {
      return null;
    }
  } else {
    return null;
  }
}

var getType = function(service){
  var flowTypes = [ 'activity',
                  'status-outfile', 
                  'status-message', 
                  'status-related', 
                  'rule-business-mandatory', 
                  'rule-business-optional', 
                  'rule-system', 
                  'channel',
                  'interface',
                  'service',
                  'subflow'];
  type = 'activity';
  if (service.indexOf('ROM') > -1){
    type = 'rule'
  }
  return type
}

var paymentFlow = function(mid, activities){
  var flowitems = new Array;
  var previous = "";
  var flowitem = null;

  activities.forEach(function(line){
    console.log(previous + "-:-" + line[4]);
    if(activities[activities.length-1] == line ){      
      if(flowitem == null ){
        flowitem = {"type": 'activity', "description": line[4], "uid": line[4], "mid": mid, "rules": "", "features": line[5]} 
      }
      else if(previous.indexOf(line[4]) == -1 ){
        console.log("Push the item " + flowitem["uid"]);
        flowitems.push(flowitem) 
        flowitem = {"type": 'activity', "description": line[4], "uid": line[4], "mid": mid, "rules": "", "features": line[5]} 
      } else {
        flowitem["features"] = flowitem["features"] + "^^^"+ line[5];
      }
      console.log("Push the last item " + flowitem["uid"]);
      flowitems.push(flowitem) // the last      
    }
    else {
      if(previous.indexOf(line[4]) == -1){
        if(flowitem != null){ 
          console.log("Push the item " + flowitem["uid"]);
          flowitems.push(flowitem) 
        }
        flowitem = {"type": 'activity', "description": line[4], "uid": line[4], "mid": mid, "rules": "", "features": line[5]} 
        previous = line[4];
      } else {
        flowitem["features"] = flowitem["features"] + "^^^"+ line[5];    
      } 
    }
  })

  return {
            "name": "Payment Flow",
            "mid": mid,
            "stp": "79%",
            "customization": "0%",
            "template": "single_payment_workflow",
            "input": "",
            "flowitems": flowitems
          }
}

var updateMidIndex = function(mids){
  fs.exists(appRoot + "/traces/global/mids_index.json", function(exists) {
      if(exists) {
        fs.unlinkSync(appRoot + "/traces/global/mids_index.json");              
      }

      var packages = [];
      latest = last_upload(mids)
      if(latest != null){
        packages.push(latest)   
      }      
      historic = history_payments(mids)
      if(historic != null){
        packages.push(historic)
      }
      if(packages.length > 0){
        fs.writeFileSync(appRoot + "/traces/global/mids_index.json", JSON.stringify(packages) , ['utf-8','as+']);  
      }
    }); 
}

var mergeActivities = function(existing_activities, activities){
  var existing_longer = (existing_activities.length > activities.length);
  var merged = existing_longer ? existing_activities : activities
  var remained = existing_longer ? activities : existing_activities

  remained.forEach(function(ra){
    var exists = underscore.find(merged, function(a){
      all_match = true
      for(var i=0; i<6; i++){
        all_match = ( all_match && (a[i] == ra[i]) )
      }
      return all_match
    })
    
    if(exists == undefined){
      merged.push(ra)
    }
  })

  merged = underscore.sortBy(merged, function(a){ return [a[0],a[1],a[4]].join('_') });
  return merged;
}

var storeFlowData = function(flowData = []){
  var mids = [];
  var activities = {};  
  
  console.log("------ And flow data length is " + flowData.length)
  flowData.forEach(function(line){    
    var mid = getMid(line);
    if(mid != "NO MID"){
      if(mids.indexOf(mid) == -1 ){ 
        mids.push(mid); 
      }
      
      if(activities[mid] == undefined){ 
        activities[mid] = new Array 
      }      
      activities[mid].push(line);
    }
  });

  console.log("------ Mids collections is : " + mids.length)
  if(mids.length > 0){
    var existing_mids = walkSync(appRoot + "/traces/global");    
    console.log("------ Existing MIDs is : " + existing_mids.length);
    // latest upload from file
    mids.forEach(function(mid){     
      current_path = appRoot +  "/traces/global/"+ mid;      
      var midFlow = null

      console.log("------ Mid is : " + mid + " already existed : " + (existing_mids.indexOf(mid) > -1));
      if (existing_mids.indexOf(mid) > -1){

        var existing_activities = new json.File(appRoot +  "/traces/global/"+ mid +"/activities.json");
        existing_activities.readSync();
        console.log("------ existing_activities is : " + existing_activities.data.length);
        
        var full_activities = mergeActivities(existing_activities.data, activities[mid])
        console.log("------ Accumulated records  : " + full_activities.length )
        
        midFlow = paymentFlow(mid, full_activities)
        fs.writeFileSync(current_path +"/activities.json", JSON.stringify(full_activities) , ['utf-8','w']);
      } else {
        console.log("------ New activities records  : " + activities[mid].length)  
        midFlow = paymentFlow(mid, activities[mid]);
        if (!fs.existsSync(current_path)){ fs.mkdirSync(current_path); }              
        fs.writeFileSync(current_path +"/activities.json", JSON.stringify(activities[mid]) , ['utf-8','as+']);
      }

      console.log("------ And finally flow : " + midFlow.length)
      fs.writeFileSync(current_path +"/flow.json", JSON.stringify(midFlow) , ['utf-8','as+']);
    });
    
    updateMidIndex(mids);    
  } else{
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

// formatted mapping is :
// 0 - timestamp
// 1 - thread
// 2 - scope
// 3 - MID
// 4 - service
// 5 - activity
var mapSPtrace = function(str){
  formatted = new Array(6)
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
  return formatted;
}

var parseTrace = function(filename){ 
  var lineNr = 0, flowData = [], context = "";
  var s = fs.createReadStream(appRoot + "/traces/global/" + filename)
    .pipe(es.split())
    .pipe(es.mapSync(function(line){
        // pause the readstream
        s.pause();
        lineNr += 1;
        str = beautifier(line.split(/\s+/) );  
        if ( str.length > 0 ){           
          formatted = mapSPtrace(str);
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
          storeFlowData(flowData)          
          //fs.writeFileSync(appRoot + "/traces/global/traces_data.csv", flowData.join('\n') , 'utf-8');          
        }        
        console.log('Read entire file.')
    })
  );
  
}

