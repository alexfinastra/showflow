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
      details = validateDetails(feature, flowitem["activities"][feature])
      cb(flowitem, details);  
    } else {
      cb(null, []);
    }  
  });
}

var validateDetails = function(feature, value){
  var val = [];
  console.log(">>>>>>>> Details >>" + value);
  if(value != undefined && value.length > 0){
    switch(feature){
      case "pdo":
        val = beautifyPDO(value);
        break;
      case "rule":
        val = beautifyRule(value);
        break;
      case "request":
        val = beautifyXML(value);
        break;
      case "response":
        val = beautifyXML(value);
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
    var cur_arr = String(cur).split(":")    
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