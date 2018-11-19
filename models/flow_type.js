var fs = require('fs');
var path = require('path');
var json = require('json-file');
var method = Flow.prototype
var properties = require("../db/profile_index.json" ); 
var services = require("../db/services_index.json" );
var rules = new require("../db/rules_index.json" );  

function Flow(currentFlow = ""){  
  this._flow = {};
  if(currentFlow.length==0){return;}
  console.log("++++++ Current Flow " + currentFlow)
  this._flow_template = new json.File(currentFlow);
  this._flow_template.readSync();

  this._flow["name"] = this._flow_template.get("name")
  this._flow["mid"] = this._flow_template.get("mid")
  this._flow["template"] = this._flow_template.get("template")
  this._flow["customization"] = this._flow_template.get("customization")
  this._flow["guide_url"] = this._flow_template.get("guide_url")
  this._flow["description"] = this._flow_template.get("description")
  this._flow["items"] = [];
  this.buildFlow()
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

module.exports = Flow;