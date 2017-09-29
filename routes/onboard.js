var express = require('express');
var router = express.Router();
var async = require('async')
var json = require('json-file');
var authentication_mdl = require('../middlewares/authentication');

var identity = {
	type: 'onboard', 
	title: 'On boarding scripts and tasks', 
	description: 'A list of scripts which will create a new offices and allow to start processing payments scoping tham in terms of office and departments.'
}

var scripts = {
	"file" : null,
	"keys": null,
	"values" : null
};

loadscripts = function(){
	scripts["file"] = new json.File(appRoot + "/db/scripts_index.json" );
	scripts["file"].readSync();
	scripts["keys"] = scripts["file"].get("keys");
	scripts["values"]= scripts["file"].get("values");	
}

router.get('/', function(req, res, next) {
  loadscripts();

  console.log(" scripts " + scripts["keys"] + " and " + scripts["values"].length);
  res.render('scripts_list', { identity: identity, keys: scripts["keys"]  , values: scripts["values"] });	  
});

router.get('/run/:id', function(req, res, next){			
	step = req.params["id"];

	var script = null;
	loadscripts();
	for(var i=0; i<scripts["values"].length; i++){
		if(script != null){ continue;}

		if (scripts["values"][i]["step"] == step){
			script = scripts["values"][i]["name"] + ".sql"
		}
	}

	console.log("Should Run : " + script)
	res.redirect('/onboard');		 
});

router.get('/rollback/:id', function(req, res, next) {
	step = req.params["id"];

	var script = null;
	loadscripts();
	for(var i=0; i<scripts["values"].length; i++){
		if(script != null){ continue;}

		if (scripts["values"][i]["step"] == step){
			script = scripts["values"][i]["name"] + ".sql"
		}
	}

	console.log("Should Rolback : " + script)
	res.redirect('/onboard');		 
});

module.exports = router;
