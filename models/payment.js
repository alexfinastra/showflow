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
      details = beautifyDetails(feature, flowitem["activities"][feature])
      cb(flowitem, details);  
    } else {
      cb(null, []);
    }  
  });
}

var beautifyDetails = function(feature, value){
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
  var arr = String(value).split(": PDO")
  return arr
}

var beautifyRule = function(value){
  var arr = String(value).split(": [BORuleExecution.executeRule()] :")
  return arr
}

var beautifyXML = function(value){
  var arr = String(value).split(":")
  return arr
}

module.exports = Payment;