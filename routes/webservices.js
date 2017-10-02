var express = require('express');
var router = express.Router();
var async = require('async')
var json = require('json-file');
var authentication_mdl = require('../middlewares/authentication');

var identity = {
	type: 'webservices', 
	title: 'SOA services as is', 
	description: ' GPP service-oriented architecture (SOA) services. Each service is an unassociated, self-supporting functionality. A business flow of messages is a cluster of services set in a predefined order which provide GPPs range of functionality'
}

var services = {
	"file" : null,
	"keys": null,
	"values" : null
};

loadservices = function(){
	services["file"] = new json.File(appRoot + "/db/properties/services_index.json" );
	services["file"].readSync();
	services["keys"] = services["file"].get("keys");
	services["values"]= services["file"].get("values");	
}

router.get('/', function(req, res, next) {
  loadservices();

  console.log(" services " + services["keys"] + " and " + services["values"].length);
  res.render('services_list', { identity: identity, keys: services["keys"]  , values: services["values"] });	  
});

router.get('/profile/:id', function(req, res){
	row_id = req.params["id"]
	var service = "STATIC_DATA"
	res.render('service_profile', { title: 'interface Profile', service: service });
})

router.post('/execute/:id', function(req, res){
	row_id = req.params["id"]
	res.redirect('/webservices/profile/'+row_id);
})

module.exports = router;
