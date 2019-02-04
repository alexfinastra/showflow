var json = require('json-file');
var method = Usecase.prototype

function Usecase(doc){    
  this._flow = {};

  if(doc == null){ return; }
  
  this._flow["type"] = doc["type"]
  if (this._flow["type"] == "usecase"){
    this._flow["name"] = doc["use_case"]  
    this._flow["group_name"] = doc["group"]
  } else {
    this._flow["name"] = doc["name"]
  }

  var group_name = doc["group"].replace(/ /g, "_")
  var fpath = appRoot + "/data/references/"+ group_name +"_references.json";    
  var refs = new json.File(fpath);
  refs.readSync();
  ref = refs.get(doc["uid"]); 
  
  if (ref != undefined ){  
    this._flow["guide_url"] = ref["guide_url"]
    this._flow["description"] = ref["description"]   
  } else {
    this._flow["guide_url"] = doc["guide_url"]
    this._flow["description"] = doc["description"] 
  }

  this._flow["items"] = [];  
  if(doc["flowsteps"].length > 0){
    for(var i=0; i< doc["flowsteps"].length; i++){
      var step =  doc["flowsteps"][i]         
      var r = refs.get(step["uid"]);      
      if(r != undefined) {step["description"] = r["description"] ;}      
      step["group_name"] = group_name;
      this._flow["items"].push(step)
    }  
  }
}

module.exports = Usecase;