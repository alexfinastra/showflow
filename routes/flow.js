var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var Flow = require('../models/flowModel');
var fs = require('fs');


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
    
    if(stats.isFile()){
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

/* GET home page. */
router.get('/', authentication_mdl.is_login, function(req, res, next) {		
	res.render('flow', { data: null});
});

router.get('/load/:folder/:file', function(req, res, next){	
	var filepath = "views/flows/" + req.params["folder"] + "/" + req.params["file"] + ".json";
	console.log(filepath);
	var flow = new Flow(filepath); 
	console.log(flow._flow);
	res.render('flow', { data: flow._flow});
});

router.get('/tree', function(req, res){
  let files = []
  to_tree("views/flows", files);
	res.json({tree: files});
});

module.exports = router;
