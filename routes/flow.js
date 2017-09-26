var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var Flow = require('../models/flowModel');
var fs = require('fs');
var Profile = require('../models/profileModel');

to_tree = function(folder, files){  
  fs.readdirSync(folder).forEach( function(file) {
  	var stats = fs.statSync(folder + '/' + file);    
    if(stats.isDirectory()){      	
    	let f = folder + "/" + file;
    	//console.log("Sub folder -> " + f);
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
    
    if(stats.isFile() && file.indexOf("template") == -1 ){
    	//console.log("Files -> " + file);
      files[files.length -1]["nodes"].push({      
        "text": file.replace(".json", ""),
        "state": {
						    "checked": false
						  },
        "folder": folder.split("/")[folder.split("/").length - 1]
      })
    }    
  })
  return
}

to_edittree = function(folder, files){  
  var model = new Profile('all');
  model.load()
  var branch = ""
  console.log(" Collection length :" + model._collection.length)
  for (var i = 0; i< model._collection.length; i++  ) { 
    var obj = model._collection[i];
    if (branch != obj["INTERFACE_TYPE"]){
      branch = obj["INTERFACE_TYPE"]
      var branch_name = model.get_interface_type(branch) || model.get_channel_type(branch)
      files.push({
            "text" : "<span class= 'font-weight-bold ml-2'>" + branch_name + "</span>",
            "selectable": false,
            "state": {
              "expanded": false,
              "checked": true
            },
            "folder": branch_name,
            "nodes" : []
          })
    }

    files[files.length -1]["nodes"].push({      
      "text": obj["INTERFACE_NAME"].split("_").join(" "),
      "state": {
              "checked": false
            } 
    })

  }
 

  return
}

/* GET home page. */
router.get('/', authentication_mdl.is_login, function(req, res, next) {		
	res.render('flow', { data: null});
});

router.get('/load/:folder/:file', function(req, res, next){	
	var filepath = "flows/" + req.params["folder"] + "/" + req.params["file"] + ".json";
	console.log(filepath);
	var flow = new Flow(filepath); 
	console.log(flow._flow);
	res.render('flow', { data: flow._flow});
});

router.get('/tree', function(req, res){
  let files = []
  to_tree("flows", files);
	res.json({tree: files});
});

router.get('/edittree', function(req, res){
  let files = []
  to_edittree("flows", files);
  res.json({tree: files});
});

module.exports = router;
