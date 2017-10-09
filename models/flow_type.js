var fs = require('fs');
var path = require('path');
var json = require('json-file');
var method = Flow.prototype

function Flow(filePath){
  console.log("File Path for the flow: " + filePath)
  this._flow_template = new json.File(filePath);
  this._flow_template.readSync();

  this._flow = {};
  this._flow["name"] = this._flow_template.get("name")
  this._flow["stp"] = this._flow_template.get("stp")
  this._flow["items"] = [];
  this._flow["filepath"] = filePath;

  this._properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  this._properties.readSync(); 

  this._services = new json.File(appRoot + "/db/properties/services_index.json" ); 
  this._services.readSync(); 

  this.populate_items();
}

method.populate_items = function(){  
  var flowitems = this._flow_template.get("flowitems");
  if(flowitems == null  && flowitems.length == 0 ){
    return;
  }

  for(var i=0; i< flowitems.length; i++){
    var item = flowitems[i];
    var current = null;
    
    if (item["type"] == "service"){
      current = this._services.get(item["uid"]);
    } else {
      current = this._properties.get(item["uid"]);
    }

    if(current == null || current["active"] != true){
      continue;
    }   
   
    if (current["connected"] == true){ current["status_class"] = "success"}
    if (current["connected"] == "error"){ current["status_class"] = "danger"}

    console.log("Current Item is " + current["title"]);
    this._flow["items"].push(current);
  }
};


module.exports = Flow;