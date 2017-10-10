var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var Flow = require('../models/flow_type');
var fs = require('fs');

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
/*
to_edittree = function(folder, files){  
  var branch = "";
  var model = new Profile('all');
  model.reload();  
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
}
*/
/* GET home page. */
router.get('/', authentication_mdl.is_login, function(req, res, next) {		
	res.render('flow', { data: null});
});

// need to add a flow index as input 
router.get('/load/:folder/:file', function(req, res, next){	
	var filepath = "flows/" + req.params["folder"] + "/" + req.params["file"] + ".json";
	var flow = new Flow(filepath); 
	res.render('flow', { data: flow._flow});
});

router.get('/tree', function(req, res){
  let files = []
  to_tree("flows", files);
  console.log("")
	res.json({tree: files});
});

/*
router.get('/edittree', function(req, res){
  let files = []
  to_edittree("flows", files);
  res.json({tree: files});
});
*/


router.get('/reset/:flow', function(req, res){
  res.send("OK !!!")
});

module.exports = router;
