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
   
  this._flow["guide_url"] = doc["guide_url"]
  this._flow["description"] = doc["description"] 
  this._flow["items"] = [];
  
  if(doc["flowsteps"].length > 0){
    for(var i=0; i< doc["flowsteps"].length; i++){    
      this._flow["items"].push(doc["flowsteps"][i])
    }  
  }
}

module.exports = Usecase;