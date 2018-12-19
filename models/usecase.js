var fs = require('fs');
var path = require('path');
var json = require('json-file');
var method = Usecase.prototype


var properties = require("../db/profile_index.json" ); 
var services = require("../db/services_index.json" );
var rules = new require("../db/rules_index.json" );  

function Usecase(currentFlow = ""){  
  this._flow = {};
  if(currentFlow.length==0){return;}
  console.log("++++++ Current Flow " + currentFlow)
  this._flow_template = new json.File(currentFlow);
  this._flow_template.readSync();

  this._flow["name"] = this._flow_template.get("basic_use_case")
  this._flow["group_name"] = this._flow_template.get("use_case")
  this._flow["template"] = this._flow_template.get("template")
  this._flow["guide_url"] = this._flow_template.get("guide_url")
  this._flow["description"] = this._flow_template.get("description")
  this._flow["flowgroups"] = this._flow_template.get("flowgroups")
  this._flow["items"] = [];
  console.log("Usecase is =>" + JSON.stringify(this._flow))
  this._flow["group_name"] == "subflow" ? this.buildSubFlow() : this.buildFlow()
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

method.buildSubFlow = function(){  
  if(this._flow_template == null ) {return;}  
  
  var flowitems = this._flow_template.get("flowitems");
  if(flowitems == null || flowitems.length == 0 ){ return; }
 
  for(var i=0; i< flowitems.length; i++){    
    this._flow["items"].push(flowitems[i])
  }  
}

method.buildFlow = function(){  
  if(this._flow_template == null ) {return;}  

  var template = new json.File(appRoot + "/reference/" + this._flow["template"]);
  console.log("Usecase template path =>" + JSON.stringify(template))
  template.readSync();
  
  var flowitems = template.get("flowitems");
  if(flowitems == null || flowitems.length == 0 ){ return; }
 
  for(var i=0; i< flowitems.length; i++){    
    if(this._flow["flowgroups"].indexOf(flowitems[i]["group"]) != -1){
      this._flow["items"].push(flowitems[i])
    }
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

module.exports = Usecase;