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
var Storage = require('../middlewares/storage');

router.get("/parsefile/:filename", function(req, res){
  console.log("Parse File request " + req.params.filename)
  // TODO should be backgroung task here
  //parseTrace(req.params.filename);
  res.redirect("/usecases")
})

router.get("/upload", function(req, res, next){
  res.redirect("/usecases")
});

router.post('/upload/:uid', function(req, res){      
  var form = new formidable.IncomingForm();
  var filename = ""

  //form.multiples = true;
  var dir = path.join(appRoot + '/temp/' );
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
})

module.exports = router;

////////////////////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////////////////////
var parseTrace = function(filename){ 
  var lineNr = 0, flowData = [], context = "";
  var new_mids = [];
  var env = filename.split('-')[0]
  var s = fs.createReadStream(appRoot + "/temp/" + filename)
    .pipe(es.split())
    .pipe(es.mapSync(function(line){
        // pause the readstream
        s.pause();
        lineNr += 1;
        str = beautifier(line.split(/\s+/) );          
        
        if ( str.length > 0 ){           
          formatted = mapSPtrace(str);
          if (new_mids.indexOf(formatted[3]) == -1){
            new_mids.push(Formatted[3]);
          }

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
          storeFlowData(env, flowData, new_mids);         
        }        
        //onsole.log('Read entire file.')
    })
  );  
}

var parseFlowsXML = function(filename){
  var lineNr = 0;
  var flowBeans = [];

  var env = filename.split('-')[0]
  var s = fs.createReadStream(appRoot + "/temp/" + filename)
    .pipe(es.split())
    .pipe(es.mapSync(function(line){
        // pause the readstream
        s.pause();
        lineNr += 1;
        flowBeans.push(line);
        s.resume();          
    })
    .on('error', function(err){
        console.log('Error while reading file.', err);
    })
    .on('end', function(){
        if(flowBeans.length > 0){    
          console.log("-- Just before Payment Flow --")                    
          //fs.writeFileSync(appRoot + "/temp/traces_data.csv", flowData.join('\n') , 'utf-8'); 
          console.log("-----> Also wir haben ein Flow Beans :" + flowBeans.length)  
          storeFlows(env, flowBeans);
        }        
        //onsole.log('Read entire file.')
    })
  );  
}

var storeFlows = function(env, flowBeans=[]){
  var parser = new xml2js.Parser({"attrkey": "attr"});
  parser.parseString(flowBeans.join("\n"), function (err, result) {
    //console.dir(result["beans"]["bean"]);
    if(result["beans"] != undefined && result["beans"]["bean"] != undefined){
      console.log("-----> Die Anzahl der Bohnen ist gleich :" + result["beans"]["bean"].length)
      result["beans"]["bean"].forEach(function(bean){
        if(bean["attr"] != undefined){
          console.log("-----> Die neu Bohnen ist : " + bean["attr"]["id"]);
          console.dir(bean["property"]);  
        }
      })
      
    }
  });

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


var storeFlowData = function(env, flowData = [], new_mids = []){
  console.log("------ And flow data length is " + flowData.length)
  var storage = new Storage();
  var docs = {}; 

  flowData.forEach(function(line){
    var mid = line[3];
    if(mid != "NO MID"){
      if(docs[mid] == undefined){
        doc = storage.getDoc({ "env": env, "mid": mid }, function(doc){ docs[mid] = doc; })
        if(doc == null){
          docs[mid] = {
            "env": env,
            "mid": mid,
            "last_update": [date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds(),],
            "activities": [],
            "flow": null
          };
          new_mids.push(mid);
        }        
      } else {
        docs[mid]["activities"].push(line);  
      }
      
    }
  })
  
  var mids = Object.keys(docs)
  console.log(" So far we have : " + mids.length)
  if(mids.length > 0 ){
    mids.forEach(function(mid){
      paymentFlow(docs[mid])
      saveDoc(env, docs[mid], (new_mids.indexOf(mid) > -1 ? true : false));
    })
  }
}

var saveDoc = function(env, doc, newDoc = true){
  //console.log("----> Saving doc with flow :" + JSON.stringify(doc["flow"]) )
  if(doc["activities"].length > 0){
    var storage = new Storage();
    if(newDoc){
      storage.newDoc(doc, function(doc){
        console.log("----> Created new doc :)")
      })
    } else {
      storage.setDoc({"env": env, "mid": doc["mid"]}, {"activities": doc["activities"], "flow": doc["flow"]}, function(doc){
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
  usecases = walkSync(appRoot + "/reference/usecases/", [])
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