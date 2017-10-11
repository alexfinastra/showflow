var fs = require('fs');
var path = require('path');
var json = require('json-file');
var method = Flow.prototype

function Flow(){
  this.ensureFlow()

  this._flow = {};
  this._flow_template = new json.File(currentFlow);
  this._flow_template.readSync();

  this._flow["name"] = this._flow_template.get("name")
  this._flow["stp"] = this._flow_template.get("stp")
  this._flow["items"] = [];
  this.loadItems();
}

method.loadItems = function(){  
  var flowitems = this._flow_template.get("flowitems");
  if(flowitems == null  && flowitems.length == 0 ){ return; }

  for(var i=0; i< flowitems.length; i++){
    var item = flowitems[i];
    if (!("status_class" in item)) {continue;}

    this._flow["items"].push(item);
  }
};

method.ensureFlow = function(){
  console.log("++++ currentFlow " + currentFlow)
  if(currentFlow == null ) {return;}
  var cflow = new json.File(currentFlow);
  cflow.readSync();
  
  var flowitems = cflow.get("flowitems");
  if(flowitems == null || flowitems.length == 0 ){ return; }

  this._properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  this._services = new json.File(appRoot + "/db/properties/services_index.json" ); 
  this._properties.readSync(); 
  this._services.readSync(); 

  for(var i=0; i< flowitems.length; i++){
    var item = flowitems[i];
    if ("status_class" in item) {continue;}

    var current = null;
    if (item["type"] == "service"){
      current = this._services.get(item["uid"]);
    } else {
      current = this._properties.get(item["uid"]);
    }
    if(current == null || current["active"] != true){ continue;} 
    
    var obj = current["flow_item"]  
    obj["step"] = i
    flowitems[i] = obj    
  }
  cflow.set('flowitems', flowitems)
  cflow.writeSync(); 
}

module.exports = Flow;