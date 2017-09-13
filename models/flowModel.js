var fs = require('fs');
var path = require('path');
var Profile = require( path.resolve( __dirname, "./profileModel.js" ) );

var method = Flow.prototype

function Flow(filePath){
  console.log("File Path for the flow: " + filePath)
  this._flow_template = JSON.parse(fs.readFileSync(filePath, 'utf8'));  
  
  this._flow = {};
  this._flow["name"] = this._flow_template["name"]
  this._flow["items"] = [];
  
  this.populate_items();
}

method.populate_items = function(){  
  var template_items = this._flow_template["flowitems"];
  if(template_items == null  && template_items.length == 0 ){return;}

  for(var j=0; j< template_items.length; j++){
    var item = template_items[j];
    var profile = new Profile(item["type"]);
    profile.load()
    var selected = profile.select_similarIds(item["interface_type"], item["interface_sub_type"]);
    if (selected.length == 0){ continue; }

    var current = null;
    var similars = [];
    for(var i=0; i < selected.length; i++){
      if( current == null){
        current  = profile.to_flowitem(selected[i], item["type"]);               
      }
      similars.push(profile.to_flowitem(selected[i], item["type"]));
    }

    this._flow["items"].push({
      "current" : current,
      "similars" : similars
    });
  }
};

module.exports = Flow;