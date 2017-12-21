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
  this._flow["customization"] = this._flow_template.get("customization")
  this._flow["input"] = this._flow_template.get("input")
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
  this._rules = new json.File(appRoot + "/db/properties/rules_index.json" );  
  this._properties.readSync(); 
  this._services.readSync(); 
  this._rules.readSync();

  for(var i=0; i< flowitems.length; i++){
    var item = flowitems[i];
    if ("status_class" in item) {continue;}

    var current = null;
    switch (item["type"]) {
      case "service":
        current = this._services.get(item["uid"]);
        break;
      case "interface":
      case "channel":
        current = this._properties.get(item["uid"]);
        break;
      case "rule":
        current = this._rules.get(item["uid"]);
        break;
      default:
        current = {
            "name":"Adjust Basic Properties",
            "active":true,
            "connected":true,
            "req_fields":"",
            "auditmsg":[],
            "logpattern":[],
            "mid":[],
            "flow_item":{
               "step":0,
               "type": item["type"] ,
               "title": item["uid"],
               "description": (item["description"] != null ? item["description"] : ""),
               "uid":"",
               "request_protocol":"",
               "direction":"",
               "request_connections_point":"",
               "interface_name": item["type"],
               "status_class":"secondary",
               "office":"***",
               "interface_type": item["type"],
               "interface_sub_type":"",
               "request_format_type":""
            }
          }
      }

    if(current == null || current["active"] != true){ continue;} 
    
    var obj = current["flow_item"]  
    obj["step"] = i
    flowitems[i] = obj    
  }
  cflow.set('flowitems', flowitems)
  cflow.writeSync(); 
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