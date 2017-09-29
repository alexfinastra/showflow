var fs = require('fs');
var path = require('path');
var json = require('json-file');
var Profile = require( path.resolve( __dirname, "./profileModel.js" ) );

var method = Flow.prototype

function Flow(filePath){
  console.log("File Path for the flow: " + filePath)
  //this._flow_template = JSON.parse(fs.readFileSync(filePath, 'utf8'));  
  this._flow_template = new json.File(filePath);
  this._flow_template.readSync();

  this._flow = {};
  this._flow["name"] = this._flow_template.get("name")
  this._flow["items"] = [];
  this._flow["filepath"] = filePath;

  this.populate_items();
}

method.populate_items = function(){  
  var template_items = this._flow_template.get("flowitems");
  if(template_items == null  && template_items.length == 0 ){
    return;
  }

  var profile = new Profile("all");
  profile.load();

  for(var i=0; i< template_items.length; i++){
    var item = template_items[i];

    if(item == null || item == undefined){
      continue;
    } 

    if(profile._properties.get(item["uid"]) == null || profile._properties.get(item["uid"])["active"] != true){
      continue;
    }
    
    var record = profile.select_by_uid(item["uid"]);    
    var current = profile.to_flowitem(record, item["type"]);
    console.log("Current Item is " + current["title"]);

    this._flow["items"].push(current);
  }
};

method.reset_connections = function(){
  if (this._flow.length != 0){
    var profile = new Profile("all");
    
    for(var i; i<this._flow.length; i++){
      var item = this._flow[i];
      var key = item["uid"] + ".connected";
      profile._properties.set(key, false);
    }
  }
}

module.exports = Flow;