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
    	    		"text" : "<span class= 'font-weight-bold'>" + file + "</span>",
    	    		"state": {
						    "expanded": false,
						  },
    	    		"nodes" : []
    	    	})
    	to_tree(folder + "/" + file, files)
    }
    
    if(stats.isFile()){
      files[files.length -1]["nodes"].push({      
        "text": file.replace(".json", "")
      })
    }    
  })
  return
}

/* GET home page. */
router.get('/', authentication_mdl.is_login, function(req, res, next) {		
	res.redirect('/flow/load/iscb')
});

router.get('/load/:flow_key', function(req, res, next){
	var flow_key = req.params["flow_key"];
	var flow = new Flow(flow_key); 
	console.log(flow._flow);
	res.render('flow', { data: flow._flow});
});

router.get('/tree', function(req, res){
  let files = []
  to_tree("views/flows", files);
	res.json({tree: files});
});

module.exports = router;
