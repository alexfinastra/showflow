var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var Flow = require('../models/flow_type');
var fs = require('fs');
var fse = require('fs-extra');
var tmp = require('temporary');
var json = require('json-file');


to_tree = function(folder, files){  
  fs.readdirSync(folder).forEach( function(file) {
    var stats = fs.statSync(folder + '/' + file);        
    if(stats.isDirectory()){        
      let f = folder + "/" + file;
      ref = '/flow/upload/' + file
      files.push({
              "text" : "<span class= 'font-weight-bold ml-2'>" + file + "</span>",
              "selectable": false,
              "state": {
                "expanded": false,
                "checked": true
              },
              "folder": file,
              "nodes" : []
            })
      to_tree(folder + "/" + file, files)
    }
    
    if(stats.isFile() && file.indexOf("template") > -1 ){     
      if (files.length > 0){
        files[files.length -1]["nodes"].push({      
          "text": file.replace(".json", "").replace("template","").split("_").join(" "),
          "state": {
                  "checked": false
                },
          "folder": folder.split("/")[folder.split("/").length - 1]
        })
      }
    }    
  })
  return
}


to_tree_old = function(folder, files){  
  var products = new json.File(appRoot + "/cots/eurobank/COTS_Eurobank_product_index.json" );
  products.readSync();
  nodes = null
  for(var i=0; i<products.data.length; i++){
    if(products.get(i+".key") == 'scenarios'){
      nodes = products.get(i+".nodes")
    }
  }
  if(nodes == null) { return }


  for(var n=0; n<nodes.length; n++){
    var node = nodes[n]
    files.push({
              "text" : "<span class= 'font-weight-bold ml-2'>" + node["text"] + "</span>",
              "selectable": false,
              "state": {
                "expanded": false,
                "checked": true
              },
              "folder": node["key"],
              "nodes" : []
            })
    var dir = appRoot + "/flows/" + node["key"]
    fs.readdirSync(dir).forEach( function(file) {      
      if( file.indexOf("template") > -1 ){     
        if (files.length > 0){
          files[files.length -1]["nodes"].push({      
            "text": file.replace(".json", "").replace("template","").split("_").join(" "),
            "state": {
                    "checked": false
                  },
            "folder": node["key"]
          })
        }
      }    
    })
  }
  return
}

/* GET home page. */
router.get('/', authentication_mdl.is_login, function(req, res, next) {		
	res.render('flow', { data: null});
});

router.get('/current', function(req, res){  
  var data = null
  if (currentFlow != ""){
    var flow = new Flow();
    data = flow._flow
  }
  res.render('flow', { data: data});
})

// need to add a flow index as input 
router.get('/load/:folder/:file', function(req, res, next){		
  //if(req.params.file.indexOf("template") > -1){
    //var file = new tmp.File();
    //var template = "flows/" + req.params.folder + "/" + req.params.file + ".json";   
    //currentFlow = file.path;    
    //fse.copySync(template, currentFlow);    
  //}else{
    
  //}
  
	currentFlow = appRoot + "/flows/" + req.params.folder + "/" + req.params.file + ".json" ; 
  var flow = new Flow();  
  console.log("OPA DATA " + JSON.stringify(flow._flow))  
	res.render('flow', { data: flow._flow});
});

router.get('/tree', function(req, res){
  let files = []
  to_tree("flows", files);
  console.log("Files List " + JSON.stringify(files))
	res.json({tree: files});
});




router.get('/reset/:flow', function(req, res){
  res.send("OK !!!")
});

module.exports = router;

var populate_rules = function(){
  var rules = new json.File(appRoot + "/db/properties/rules_index.json" );
  rules.readSync();

  var ids = Object.keys(rules.data)
  console.log(" +++ Keys are "+ ids)
  for(var i=0; i<ids.length; i++){
    rules.set(ids[i] + ".active", true)
    rules.set(ids[i]+ ".connected", true)
    rules.set(ids[i]+ ".req_fields", "")
    rules.set(ids[i]+ ".auditmsg", [])
    rules.set(ids[i]+ ".logpattern", [])
    rules.set(ids[i]+ ".mid", [])
    rules.set(ids[i]+ ".flow_item", {})
    rules.set(ids[i]+ ".flow_item.step", 0)
    rules.set(ids[i]+ ".flow_item.type", "rule" )
    rules.set(ids[i]+ ".flow_item.title", rules.get(ids[i]+".name"))
    rules.set(ids[i]+ ".flow_item.description", "")
    rules.set(ids[i]+ ".flow_item.uid", ids[i])
    rules.set(ids[i]+ ".flow_item.request_protocol", "Java")
    rules.set(ids[i]+ ".flow_item.direction", "I")
    rules.set(ids[i]+ ".flow_item.request_connections_point", "")
    rules.set(ids[i]+ ".flow_item.interface_name", "Rules")
    rules.set(ids[i]+ ".flow_item.status_class", "secondary")
    rules.set(ids[i]+ ".flow_item.office", "***")
    rules.set(ids[i]+ ".flow_item.interface_type", "Business Rule")
    rules.set(ids[i]+ ".flow_item.interface_sub_type", "")
    rules.set(ids[i]+ ".flow_item.request_format_type", "PDO")
    rules.writeSync();
  }
  
  
}
