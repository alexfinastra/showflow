var fs = require('fs');
var path = require('path');
var json = require('json-file');
var method = Payment.prototype

var Storage = require('../middlewares/storage');

function Payment(env, mid){  
  this.storage = new Storage(); 
  this.env = env;
  this.mid = mid;
}

method.loadFlow = function(cb){  
  this.storage.getDoc({ "env": this.env, "mid": this.mid }, function(doc){
    if(doc != null){
      cb(doc["flow"]);  
    } else {
      cb(null);
    }  
  });
}

method.loadActivities = function(cb){
  this.storage.getDoc({ "env": this.env, "mid": this.mid }, function(doc){
    if(doc != null){
      cb(doc["activities"]);  
    } else {
      cb([]);
    }  
  });

}

module.exports = Payment;