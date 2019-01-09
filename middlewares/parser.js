var method = Parser.prototype

//var chokidar = require('chokidar');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra')
var es = require('event-stream');
var underscore = require("underscore");
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
          //fs.writeFileSync(appRoot + "/temp/traces_data.csv", flowData.join('\n') , 'utf-8'); 
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
/*
    flowData.forEach(function(line){
      var mid = line[3];
      if(mid != "NO MID"){
        if(docs[mid] == undefined){
          db_doc = db_docs.find(function(d){ return d["mid"] == mid})
          if(db_doc == null){
            docs[mid] = {
              "mid": mid,
              "last_update": [date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds()].join('_'),
              "activities": [],
              "flow": null
            };
            new_mids.push(mid);
          } else {
            docs[mid] = db_doc;  
          }
          docs[mid]["activities"].push(line);   
        } else {
          docs[mid]["activities"].push(line);  
        }
      }
    })
    
    var mids = Object.keys(docs)
    console.log(" So far we have : " + mids.length)
    if(mids.length > 0 ){
      mids.forEach(function(mid){
       //paymentFlow(docs[mid])
        saveDoc(env, docs[mid], (new_mids.indexOf(mid) > -1 ? true : false));
      }) 




https://finastra.sharepoint.com/Structured/gpsil/PaymentsSbuIL/Product/Product%20Offerings/Forms/AllItems.aspx?FolderCTID=0x01200053AA442FB76B604EA365E4C578C2B42A&id=%2FStructured%2Fgpsil%2FPaymentsSbuIL%2FProduct%2FProduct%20Offerings%2FFunctional%20Core%20Processing%2FGPP-SP%204%2E6%2FBusiness%20Guides%2FGPP%20Business%20Guide%20Pricing%2Epdf&parent=%2FStructured%2Fgpsil%2FPaymentsSbuIL%2FProduct%2FProduct%20Offerings%2FFunctional%20Core%20Processing%2FGPP-SP%204%2E6%2FBusiness%20Guides







    }*/
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

var to_flowitem = function(line){
  return {
    "type": getType(line[4]), 
    "timestamp": line[0],
    "name": line[4].split("_").join(" "),
    "description": line[4], 
    "uid": line[4],
    "features": "" ,
    "activities": line[5].split("^^^")
  } 
}

// TODO! Trigger dialog flow with activity 
var paymentFlow = function(doc){
  var flowitems = [];  
  // map flow items
  doc["activities"].forEach(function(line){
    service = line[4]
    if(service.toLowerCase().indexOf('rule') > -1){
      flowitems.push(to_flowitem(line))  
    }
  })

  var similarities = {};
  usecases = walkSync("./reference/usecases/", [])
  console.log("usecase ")
  usecases.forEach(function(usecase_template){
    var usecase = new Usecase(usecase_template);  
    similarities[usecase._flow["name"]] = similarity_score(usecase._flow["items"], flowitems)
  })

  doc["flow"] =  {
            "name": "Payment Flow - " + doc["mid"],            
            "similarities": similarities,
            "flowitems": flowitems
          }

}

// similarity score check if items exists and located correctly in the flow
var getSum = function(total, num){
  return total + num;
}

var similarity_score = function(usecase_items, pay_items){
  var scores = [];
  var uc_len = usecase_items.length;
  var p_len = pay_items.length;

  for(var ind =0; ind < p_len; ind++){
    pitem = pay_items[ind];
    uc_index = usecase_items.indexOf(pitem)
    scores.push([(uc_index != -1 ? 1 : 0 )+ (uc_index == ind ? 1 : 0)]);
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

var to_usecase = function(group_name, flowId, flow){ 
  var flowsteps = to_flowsteps(group_name, flowId, flow["property"][1]);
  var raw_name = flowId.split(/(?=[A-Z])/).join(" ")
  var name = raw_name.charAt(0).toUpperCase() + raw_name.slice(1);  
  var is_usecase = (flowId.toLowerCase().indexOf('subflow') == -1 ) ? true : false;
  var type  = is_usecase ? "usecase" : "subflow";
  var ref = getRef(group_name, type, flowId);

  if(is_usecase){    
    return {
      "type": type,
      "basic_use_case": group_name ,
      "guide_url": ref["guide_url"], 
      "description": ref["description"],
      "group" : group_name,
      "uid": flowId, 
      "use_case": flow["property"][0]["attr"]["value"],
      "flowsteps": flowsteps
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
      "flowsteps": flowsteps
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
      "features": "",
      "activities": ""
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
        "features": "",
        "activities": ""
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


var saveBean = function(env, groupName, bean, docs){
  var flowId = bean["attr"]["id"] == undefined ? bean["attr"]["name"] : bean["attr"]["id"];
  if(flowId == undefined){ return ;}

  console.log("-----> Current group "+groupName+ " and flow " + flowId);
  var storage = new Storage(env + "_usecases");
  if(bean["property"] != undefined){
    filtered = docs.find(function(doc){ return doc["uid"] == flowId;})      
    if(filtered == undefined){
      usecase = to_usecase(groupName, flowId, bean)
      storage.newDoc(usecase, function(doc){
        console.log("+++++> Callback from NEW Doc " );
      })
    } else {     
      storage.updateDoc({"uid": filtered["uid"]}, {"flowitems": to_flowsteps(groupName, flowId, bean["property"][1])}, function(doc){
        console.log("+++++> Callback from UPDATE doc  ")
      }) 
    }
  }
}

var parseBusinessFlows = function(filename, beansXML){
	splitter = filename.indexOf('/') > -1 ? "/" : "\\"
  filename_arr = filename.split(splitter)
  var env = filename_arr[filename_arr.length-1].split('-')[0];  
  var groupName = group_name(filename_arr);
  
  var storage = new Storage(env + "_usecases");  
  storage.loadDocs({"group": groupName },function(docs){   
    beansXML.forEach(function(bean){
      //console.dir(bean);  
      saveBean(env, groupName, bean, docs);
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