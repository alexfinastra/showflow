var fs = require('fs');
var path = require('path');
var json = require('json-file');
var method = Payment.prototype
var properties = require("../db/profile_index.json" ); 
var services = require("../db/services_index.json" );
var rules = new require("../db/rules_index.json" );  

function Payment(currentFlow = ""){  
  this._flow = {};
  if(currentFlow.length==0){return;}
  console.log("++++++ Current Payment " + currentFlow)
  this._flow_template = new json.File(currentFlow);
  this._flow_template.readSync();
  flow = this._flow_template.get("flow")
  this._flow["mid"] = this._flow_template.get("mid")

  if(flow != undefined && flow != null){
    this._flow["name"] = flow["name"]  
    this._flow["similarities"] = flow["similarities"]
    this._flow["items"] = flow["flowitems"];
  }
}

method.loadItems = function(){  
  var flowitems = this._flow_template.get("flowitems");
  console.log(" ++++++ load flowitems " + JSON.stringify(flowitems))
  if(flowitems == null  || flowitems.length == 0 ){ return; }

  for(var i=0; i< flowitems.length; i++){    
    var item = flowitems[i];
    console.log(" +++  ITEMS is :" + JSON.stringify(item) + "\n")
    //if (!("status_class" in item)) {continue;}
    this._flow["items"].push(item);
  }
};

method.buildFlow = function(){  
  if(this._flow_template == null ) {return;}  
  
  var flowitems = this._flow_template.get("flowitems");
  if(flowitems == null || flowitems.length == 0 ){ return; }
 
  for(var i=0; i< flowitems.length; i++){    
    this._flow["items"].push(flowitems[i])
  }  
}

method.updateFlowItem  = function(step, key, value){
  var cflow = new json.File(currentFlow);
  cflow.readSync();
  
  var flowitems = cflow.get("flowitems");
  if(flowitems == null || flowitems.length == 0 ){ return; }

  if (key in flowitems[step-1]){
    flowitems[step-1][key] = value;          
    cflow.set('flowitems', flowitems)
    cflow.writeSync();
  }   
}

module.exports = Payment;