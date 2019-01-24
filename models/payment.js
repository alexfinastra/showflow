var fs = require('fs');
var path = require('path');
var json = require('json-file');
var method = Payment.prototype

var Storage = require('../middlewares/storage');

function Payment(env, mid){  
  this.storage = new Storage(env+"_payments"); 
  this.env = env;
  this.mid = mid;
}

method.loadFlow = function(cb){  
  this.storage.getDoc({"mid": this.mid }, function(doc){
    if(doc != null){
      cb(doc["flow"]);  
    } else {
      cb(null);
    }  
  });
}

method.loadActivities = function(cb){
  this.storage.getDoc({"mid": this.mid }, function(doc){
    if(doc != null){
      cb(doc["activities"]);  
    } else {
      cb([]);
    }  
  });
}

method.loadDetails = function(feature, uid, cb){
  this.storage.getDoc({"mid": this.mid }, function(doc){
    if(doc != null){
      flowitems = doc["flow"]["flowitems"]
      flowitem = flowitems.find(function(i){ return i["uid"] == uid})
      details = validateDetails(feature, flowitem["activities"])
      cb(flowitem, details);  
    } else {
      cb(null, []);
    }  
  });
}

var validateDetails = function(feature, activities){
  var val = [];
  console.log(">>>>>>>> Valid Details ["+feature+"] >>" + JSON.stringify(activities) );
  if(activities != undefined ){
    switch(feature){
      case "pdo":
        console.log(">>>>>>>> PDO ["+feature+"] >>" + JSON.stringify(activities[feature]) );
        val = beautifyPDO(activities[feature]);
        break;
      case "rule":
        console.log(">>>>>>>> RULE ["+feature+"] >>" + JSON.stringify(activities[feature]) );
        val = beautifyRule(activities[feature]);
        break;
      case "interface":
        console.log(">>>>>>>> INTERFACE ["+feature+"] >>" + JSON.stringify(activities) );
        val.push( beautifyXML(activities["request"]) )
        val.push( beautifyXML(activities["response"]) )
        val = flatten(val);
        break;
      default:
        console.log(">>>>>>>> DEFAULT ["+feature+"] >>" + JSON.stringify(activities) );
        break;
    }
  }

  return val;
}

var beautifyPDO = function(value){
  var arr = []
  for(var i=0; i<value.length; i++){
    var cur = value[i]
    var cur_arr = String(cur).split(": PDO")    
    if(cur_arr.length > 0){ 
      for (var ii=0; ii<cur_arr.length; ii++) {
        if(cur_arr[ii].trim().length > 0 ){ arr.push(cur_arr[ii]);}
      };
    }
  }

  return flatten(arr);
}

var beautifyRule = function(value){
  var arr = []
  for(var i=0; i<value.length; i++){
    var cur = value[i]
    var cur_arr = String(cur).split(": [BORuleExecution.executeRule()] :")    
    if(cur_arr.length > 0){ 
      for (var ii=0; ii<cur_arr.length; ii++) {
        if(cur_arr[ii].trim().length > 0 ){ arr.push(cur_arr[ii]);}
      };
    }
  }
  
  return flatten(arr);
}

var beautifyXML = function(value){
  var arr = []
  for(var i=0; i<value.length; i++){
    var cur = value[i]
    var cur_arr = String(cur).split("\n")    
    if(cur_arr.length > 0){ 
      for (var ii=0; ii<cur_arr.length; ii++) {
        if(cur_arr[ii].trim().length > 0 ){ arr.push(cur_arr[ii]);}
      };
    }
  }
  
  return flatten(arr);
}

var flatten = function(list) {
    return list.reduce(function (a, b) {
        return a.concat(Array.isArray(b) ? flatten(b) : b);
    }, []);
}

module.exports = Payment;