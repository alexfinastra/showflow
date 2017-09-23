var express = require('express');
var router = express.Router();
var async = require('async')
var authentication_mdl = require('../middlewares/authentication');

var Profile = require('../models/profileModel');
var interface = new Profile('interface'); 

var identity = {
	type: 'interface', 
	title: 'On going standard interfaces', 
	description: 'Standard interfaces gruped by type and ordered by sub type. Auto-refresh, instant monitoring, content validations, documentation reference are applied.'
}

router.get('/', function(req, res, next) {
	if(global.oracle == true){
		async.waterfall([
			function(callback){
				interface.load_from_db(interface, callback)	
			}
		],
		function(err, results){			
			res.render('profile_list', { identity: identity, keys: interface.keys() , values: interface.values() });
		})
	}else{
		interface.load()
		res.render('profile_list', { identity: identity, keys: interface.keys() , values: interface.values() });	  
	}
});

router.get('/profile/:id', function(req, res, next){			
	row_id = req.params["id"]
	var record = interface.select(row_id)
	res.render('profile', { title: 'interface Profile', record: record , model: interface});
});

router.get('/new', authentication_mdl.is_login, function(req, res, next) {
	var record = interface.select(0);
	res.render('profile', { title: 'interface Profile', record: record , model: interface});
});


router.post('/update/:id', function(req, res){
	row_id = req.params["id"]
	var record = interface.select(row_id)
	//console.log(" ---------- > BODY " + req.body.TO_MQ)
	//INTERFACE_TYPE:OFAC
	//INTERFACE_SUB_TYPE:MP_COMPLIANCE_IN_RESPONSE
	//INTERFACE_NAME:MP COMPLIANCE IN
	//DESCRIPTION:
	//REQUEST_DIRECTION:I
	//REQUEST_PROTOCOL:MQ
	//REQUEST_FORMAT_TYPE:FULL
	//REQUEST_CONNECTIONS_POINT:jms/Q_COMPLIANCE_IN
	//REQUEST_PROTOCOL
	//RESPONSE_FORMAT_TYPE:
	//RESPONSE_CONNECTIONS_POINT:
	
	
	res.render('profile', { title: 'interface Profile', record: record , model: interface});
})


module.exports = router;
