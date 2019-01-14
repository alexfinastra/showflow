var method = Parser.prototype

//var chokidar = require('chokidar');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra')
var es = require('event-stream');
var underscore = require("underscore");
var _ = require('lodash');
//var mongodb = require("mongodb");
//var ObjectID = mongodb.ObjectID;
var xml2js = require('xml2js');
var json = require('json-file');

var Usecase = require('../models/usecase');
var Storage = require('./storage');

function Parser(){  }
////////////////////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////////////////////
var parseTrace = function(filename, cb){ 
  var lineNr = 0, flowData = [], context = "";
  splitter = filename.indexOf('/') > -1 ? "/" : "\\"
  filename_arr = filename.split(splitter)
  var env = filename_arr[filename_arr.length-1].split('-')[0];
  var s = fs.createReadStream(filename)
    .pipe(es.split())
    .pipe(es.mapSync(function(line){
        // pause the readstream
        s.pause();
        lineNr += 1;
        str = beautifier(line.split(/\s+/) );          
       
        if ( str.length > 0 ){           
          formatted = mapSPtrace(str);
          len = flowData.length; 
          if(len > 0){
            if(formatted[4] == flowData[len-1][4]){
              flowData[len-1][5] =  flowData[len-1][5] + " " + formatted[5];
            } else {
              flowData.push(formatted);              
            }
          } else {
            flowData.push(formatted) ;           
          }
          s.resume(); 
        } else { 
          len = flowData.length; 
          if(len > 0){
            l = flowData[len-1].length
            flowData[len-1][l-1] =  flowData[len-1][l-1] + " " + line.replace(/:/g, '').replace(/,/g, ' '); 
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
          //fs.writeFileSync(appRoot + "/temp/traces_data.csv", flowData.`in('\n') , 'utf-8'); 
          storeFlowData(env, flowData); 
          fs.unlinkSync(filename);
          cb();        
        }        
        //onsole.log('Read entire file.')
    })
  );  
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

var isDate = function(date) {
  return ((date.length > 4) && (date.match(/[a-z]/i) == null) && new Date(date) !== "Invalid Date" && !isNaN(new Date(date)) ) ? true : false;
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

  formatted[0] = (str[0] + " " + str[1])
  formatted[1] = str[3]
  
  if(data.length == 0){
    formatted[2] = "GENERAL"           
    formatted[3] = "NO MID"
    formatted[4] = str[sind-1]
  }

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
    if(data[1].length > 10 && /\d/.test(data[1])){
      formatted[3] = data[1].indexOf('_') > -1 ? data[1].split('_')[1] : data[1]
    }else{
      formatted[3] = "NO MID"
    }            
    formatted[4] = data[2]
  }

  formatted[5] = compose_activity(str, sind)   
  //console.log(" ++++ Formatted :" + formatted);
  return formatted;
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

var storeFlowData = function(env, flowData = []){
  console.log("------ And flow data length is " + flowData.length)
  var storage = new Storage(env + "_payments");
  var docs = {}; 
  var new_mids = [];
  var date = new Date();

  var mids_arr = [...new Set(flowData.map(a => a[3]))];
  storage.loadDocs({"mid": { "$in": mids_arr}}, function(db_docs){
    console.log("-----> Loaded docs are >>" + db_docs.length);

    flowData.forEach(function(line){
      var mid = line[3];
      if(mid != "NO MID"){
        if(docs[mid] == undefined){
          db_doc = db_docs.find(function(d){ return d["mid"] == mid})
          if(db_doc == null){
            docs[mid] = { "mid": mid,
                          "last_update": [date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds()].join('_'),
                          "activities": [],
                          "flow": null };
            new_mids.push(mid);
          } else { 
            docs[mid] = db_doc; 
          }            
        }

        if(docs[mid]["activities"].indexOf(line) == -1){
          docs[mid]["activities"].push(line);   
        }
      }
    })
    
    var mids = Object.keys(docs)
    console.log(" So far we have : " + mids.length)
    if(mids.length > 0 ){
      mids.forEach(function(mid){
        var currentDoc = docs[mid];
        var is_NewDoc = (new_mids.indexOf(mid) > -1 ? true : false);
        paymentFlow(env, currentDoc, function(currentDoc){
          saveDoc(env, currentDoc, is_NewDoc);  
        });
      });
    }
  })
}

var saveDoc = function(env, doc, newDoc = true){
  //console.log("----> Saving doc with flow :" + JSON.stringify(doc["flow"]) )
  if(doc["activities"].length > 0){
    var storage = new Storage(env + "_payments");
    if(newDoc){
      storage.newDoc(doc, function(doc){
        console.log("----> Created new doc :)")
      })
    } else {
      storage.setDoc({"mid": doc["mid"]}, {"activities": doc["activities"], "flow": doc["flow"]}, function(doc){
        console.log("----> Update doc :)")
      })  
    }
    
    //var dir = path.join(appRoot + '/temp/'  + env);
    //if (!fs.existsSync(dir)){   fs.mkdirSync(dir);  }
    //var doc_path = appRoot + "/temp/" + env + "/" + doc["mid"] + ".json"
    //fs.writeFileSync(doc_path, JSON.stringify(doc) , {encoding:'utf8',flag:'w+'});    
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
  if (service.indexOf('Rule') > -1){
    type = 'rule'
  }
  return type
}

// should retrive from flowsteps and references
var to_flowstepitem = function(line){
  var activities_arr  = line[5].split(" ")
  var uid = activities_arr.find(function(w){return w.indexOf("Flow") > -1 && w.indexOf("Step") > -1;})
  walkSync("./data/flowsteps",[]).forEach(function(json_path){
    var fpath = appRoot + "/" + json_path;
    var steps = new json.File(fpath);
    steps.readSync();
    step = refs.get(uid);
    if (step != undefined){
      return {
        "type": "service", 
        "timestamp": line[0],
        "name": step["name"],
        "description": step["description"], 
        "uid": uid,
        "features": step["features"] ,
        "activities": []
      } 
    }
  });
  return null;
}

var to_flowrule = function(line){
  var rule_arr = line[5].split(";")
  if(rule_arr.length > 0){
    step = {}
    var fpath = appRoot + "/data/references/rules_flowsteps.json";
    var rules_steps = new json.File(fpath);
    rules_steps.readSync();

    rule_arr.forEach(function(rule){
      var rdata =  rule.split(":");

      //check for rulety
      rdata.forEach(function(item){
        if(item.indexOf("ruleType") > -1){ 
          var ruleType = rdata[rdata.indexOf(item) + 1].trim(); 
          step = rules_steps.get(ruleType)
          if(step != undefined) {return step;}
        }
      })
    })
    return null;
  } else {
    return null;
  }
}

var to_flowinterface = function(line){
  return  {
      "type": "interface",
      "group": "Posting",      
      "timestamp": "",
      "name": "Posting Interface",
      "description": "", 
      "uid": "interfaceposting",
      "features": "flowmanagement-posting",
      "activities": ""
    }
}

var filterActivities = function(doc, cb){
  var flowitems = [];  
  var pattern = [];
  
  // map flow items
  doc["activities"].forEach(function(line){
    var service = line[4];

    if(service.toLowerCase() === "abstractflowstep"){      
      var step_item = to_flowstepitem(line) 
      if(step_item != null){ 
        flowitems.push(step_item); 
        pattern.push(step_item["name"])
      }
    }

    if(service.toLowerCase() === 'boruleexecution' ){
      var rule_item = to_flowrule(line);
      if(rule_item != null){ flowitems.push(rule_item); }      
    }

    if(service.toLowerCase() === 'bointerface' ){
      var iface_item = to_flowinterface(line);
      if(iface_item != null){ flowitems.push(iface_item); }      
    }

    if(service.toLowerCase() === 'pdo'){
      var lastItem = flowitems.pop();
      lastItem["activities"].push(activity);
      flowitems.push(lastItem);
    }
  })
  cb(flowitems, pattern);
}

// TODO! Trigger dialog flow with activity 
var paymentFlow = function(env, doc, cb){
  filterActivities(doc, function(flowitems, pattern){
    var storage = new  Storage(env+"_usecases")
    storage.listDoc( {"flow":1, "_id":0}, {"type": "usecase"}, {"group": -1},  function(usecases){
      var similarities = {};
      if(usecases.length > 0){
        usecases.forEach(function(usecase){
          similarities[usecase["use_case"]] = similarity_score(usecase, pattern)
        })  
      }   

      doc["flow"] =  {
              "name": "Payment Flow - " + doc["mid"],            
              "similarities": similarities,
              "flowitems": flowitems,
              "pattern": pattern
            };
      cb(doc);
    }) 
  })
}

// similarity score check if items exists and located correctly in the flow
var getSum = function(total, num){
  return total + num;
}

var similarity_score = function(usecase, payment_pattern){
  var scores = [];
  var uc_len = usecase["flow"].length;
  var p_len = payment_pattern.length;

  for(var ind =0; ind < p_len; ind++){
    pitem = payment_pattern[ind];
    uc_index = usecase["flow"].indexOf(pitem)
    scores.push([usecase["uid"], (uc_index != -1 ? 1 : 0 )+(uc_index == ind ? 1 : 0)]);
  }

  return scores.reduce(getSum, 0) / (2 * uc_len);
}

// List all files in a directory in Node.js recursively in a synchronous fashion
var walkSync = function(dir, filelist) {
  var files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {        
      filelist.push(dir + "/" + file);
    }
  });
  //console.log(" >>>>>>> files list " + filelist)
  return filelist;
}



///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
parseConfig = function(filename, cb){ 
  console.log("----> XML configurate file: " + filename);
  var parser = new xml2js.Parser({attrkey: "attr"});
	fs.readFile(filename, function(err, data) {
	    parser.parseString(data, function (err, result) {
	    		buildBusinessFlows(filename, result);
	        fs.unlinkSync(filename);
          cb();
	    });
	});
}


var buildBusinessFlows = function(filename, jsonXML) {
	if(jsonXML["beans"] != undefined){
		if(jsonXML["beans"]["bean"] != undefined){
			parseBusinessFlows(filename, jsonXML["beans"]["bean"]);
		} else {
			console.log("-----> There is no business flows defined in files");
		}
	}

	if(jsonXML["ROWDATA"] != undefined){
		parseEnviromentFlows(jsonXML)
		console.dir(jsonXML);	
	}
}

var usecaseFlow = function(flowsteps){
  var flow = []
  flowsteps.forEach(function(step){
    if(step["type"].indexOf("subflow") > -1){
      var subflow = usecaseSubFlow(step)
      flow.push(subflow);
    } else {
      flow.push(step["uid"])
    }
  });

  return flow;
}

var to_usecase = function(group_name, flowId, bean){ 
  var flowsteps = to_flowsteps(group_name, flowId, bean["property"][1]);  
  var raw_name = flowId.split(/(?=[A-Z])/).join(" ")
  var name = raw_name.charAt(0).toUpperCase() + raw_name.slice(1);  
  var is_usecase = (flowId.toLowerCase().indexOf('subflow') == -1 ) ? true : false;
  var type  = is_usecase ? "usecase" : "subflow";
  var ref = getRef(group_name, type, flowId);

  console.log("-----> Build usecase of " + type + " with uid " + flowId + " and " + flowsteps.length + " flowsteps");
  if(is_usecase){    
    return {
      "type": type,
      "basic_use_case": group_name ,
      "guide_url": ref["guide_url"], 
      "description": ref["description"],
      "group" : group_name,
      "uid": flowId, 
      "use_case": bean["property"][0]["attr"]["value"],
      "flowsteps": flowsteps,
      "flow": []
    }
  } else {
    return {
      "type": type,
      "name": name,
      "uid": flowId, 
      "guide_url": ref["guide_url"], 
      "description": ref["description"],
      "group" : group_name,
      "use_case": "subflow",
      "flowsteps": flowsteps,
      "flow": []
      }
  }
}

var getRef = function(group_name, type, uid){
  var fpath = appRoot + "/data/references/"+ group_name.replace(" ", "_") +"_references.json";
  if (!fs.existsSync(fpath)) {fs.writeFileSync(fpath, JSON.stringify({}), 'utf-8');}
  
  var refs = new json.File(fpath);
  refs.readSync();
  ref = refs.get(uid);
  if (ref == undefined ){      
    ref = {
      "type": type,
      "description": "BA Help Is Required :)",
      "guide_url": ""
    };      
    refs.set(uid, ref);
    refs.writeSync(); 
  }
  return ref;
}

var getFlowItem = function(group_name, flowId, uid){
  var raw_name = uid.split(/(?=[A-Z])/).join(" ")
  var name = raw_name.charAt(0).toUpperCase() + raw_name.slice(1)  
  var is_subflow = (uid.toLowerCase().indexOf('subflow') > -1) ? true : false;
  var type  = is_subflow ? "subflow" : "";
  var ref = getRef(group_name, type, uid);

  if(is_subflow){   
    return  {
      "type": type,
      "group": flowId,      
      "timestamp": "",
      "name": name,
      "description": ref["description"], 
      "uid": uid,
      "features": ""
    }   
  } else {
    var fpath = appRoot + "/data/flowsteps/"+ group_name.replace(" ", "_") +"_flowsteps.json";
    if (!fs.existsSync(fpath)) {fs.writeFileSync(fpath, JSON.stringify({}), 'utf-8');}

    var flowitems = new json.File(fpath);
    flowitems.readSync();
    flowstep = flowitems.get(uid);    
    if(flowstep == undefined){
      
      flowstep = {
        "type": ref["type"],
        "group": flowId,      
        "timestamp": "",
        "name": name,
        "description": ref["description"], 
        "uid": uid,
        "features": ""
      }      

      flowitems.set(uid, flowstep);
      flowitems.writeSync(); 
    }
    return flowstep;
  }
}

var to_flowsteps = function(group_name, flowId, steps){  
  flowitems = [];
  if(steps == undefined ) { return flowitems;}
  
  if(steps['util:list'] == undefined){
    doc = getFlowItem(group_name, flowId, steps["attr"]["ref"])
    flowitems.push(doc);    
  } 
  else {     
    steps_arr = steps['util:list'][0]["ref"];
    if(steps_arr != undefined){
      steps_arr.forEach(function(step){
        var uid = step["attr"]["bean"];
        if(uid != undefined){
          var doc = getFlowItem(group_name, flowId, uid);
          flowitems.push(doc);            
        }
      })
    }    
  }
  console.log("------> Parsed :" + flowitems.length + " for : " + flowId);
  return flowitems;
}

var group_name = function(filename_arr){
  var group_arr = []
  var env = filename_arr[filename_arr.length-1].split('-')[0]; 
  var group = filename_arr[filename_arr.length-1].replace(env, "").replace(".xml", "")
  
  group.split("-").forEach(function(item){ 
    if(item.length > 0 && ['gpp', 'spring', 'flows'].indexOf(item) == -1){
      group_arr.push(item.indexOf('_') == -1 ? item : item.split('_')[0])
    }
  })
  return group_arr.join(" ");
}

var parseBean = function(groupName, bean, cb){
  var flowId = bean["attr"]["id"] == undefined ? bean["attr"]["name"] : bean["attr"]["id"];
  console.log("\n\n-----> parsing Bean with uid " + flowId + " with bean property equals to >>" + bean["property"])
  if(bean["property"] == undefined || flowId == undefined ){ 
    cb(null);
  } else {
    var usecase = to_usecase(groupName, flowId, bean)
    cb(usecase);
  }
}

var mapFlow = function(usecase, allcases, cb){
  var flow = [];
  console.log("-----> Mapping actual flow for "+ usecase["uid"] + " with " + usecase["flowsteps"] )
  usecase["flowsteps"].forEach(function(item){
    if(item["type"].indexOf("subflow") > -1){
      var subflow = allcases.find(function(uc){ return uc["uid"] === item["uid"]})
      if(subflow != undefined){
        if(subflow["flow"].length == 0){
          mapFlow(subflow, allcases, function(flow){ subflow["flow"] = flow.flat();  })
        }
        flow.push(subflow["flow"].flat())
      }
    } else{
      flow.push(item["uid"])
    }
  })
  cb(flow);
}

var saveUsecases = function(env, groupName, usecases, docs){
  var storage = new Storage(env + "_usecases");
  usecases.forEach(function(usecase){
    console.log("-----> saving usecases >" + JSON.stringify(usecase))
    mapFlow(usecase, usecases, function(flow){

      var is_new = (docs.find(function(doc){ return doc["uid"] == usecase["uid"]; }) == undefined)      
      if(is_new){
        usecase["flow"] = flow.flat()
        storage.newDoc(usecase, function(doc){ console.log("+++++> Callback from NEW Doc " ); })
      } else{
        storage.updateDoc({"uid": usecase["uid"]}, {"flowsteps": usecase["flowsteps"], "flow": flow.flat() }, function(doc){
          console.log("+++++> Callback from UPDATE doc  ")
        }) 
      }
    });
  })
}

var parseBusinessFlows = function(filename, beansXML){
	splitter = filename.indexOf('/') > -1 ? "/" : "\\"
  filename_arr = filename.split(splitter)
  var env = filename_arr[filename_arr.length-1].split('-')[0];  
  var groupName = group_name(filename_arr);
  
  var storage = new Storage(env + "_usecases");  
  var usecases = [];
  var beanParsed = 0;
  storage.loadDocs({"group": groupName },function(docs){       
    beansXML.forEach(function(bean, ind, array){
      parseBean(groupName, bean, function(usecase){
        beanParsed++ ;
        if(usecase != null){ usecases.push(usecase); }  
        if(beanParsed == array.length) {
          console.log("------> Until now we have " + usecases.length + " usecases ") 
          saveUsecases(env, groupName, usecases, docs); }
      });
    })  
  })
}

var parseEnviromentFlows = function(result){
	console.log("-----> Process file with environemnt flows");
}

method.parse = function(filename, cb){
  if(filename.indexOf(".xml") > -1){
    parseConfig(filename, cb);
  }

  if(filename.indexOf(".log") > -1){
    parseTrace(filename, cb);
  }
}
module.exports = Parser;



/*
function startParser(){
	mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://heroku_lmc8x7v4:emjfkgue1ijf6jqi78aq519gvs@ds139614.mlab.com:39614/heroku_lmc8x7v4", { useNewUrlParser: true }, function (err, client) {
	  if (err) {
	    console.log(err);
	    process.exit(1);
	  }

	  // Save database object from the callback for reuse.
	  db = client.db();
	  console.log("Database connection ready");

	  var filesPath = path.resolve(__dirname)
		console.log("Start parser for : " + filesPath)
		
		var watcherLog = chokidar.watch(filesPath + "/uploads/*.log" , {
		  ignored: /(^|[\/\\])\../,
		  persistent: true
		});
		watcherLog.on('add', function(path){
			parseTrace(path);
			console.log("Log file has been added :" + path);
		});

		var watcherXML = chokidar.watch(filesPath + "/uploads/*.xml" , {
		  ignored: /(^|[\/\\])\../,
		  persistent: true
		});
		watcherXML.on('add', function(path){
			parseConfig(path);
			console.log("XML file has been added :" + path);
		});	
	});
}

startParser();
*/