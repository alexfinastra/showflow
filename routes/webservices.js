var express = require('express');
var router = express.Router();
var async = require('async')
var authentication_mdl = require('../middlewares/authentication');

var Profile = require('../models/profileModel');
var channel = new Profile('channel'); 

var identity = {
	type: 'webservices', 
	title: 'SOA services as is', 
	description: ' GPP service-oriented architecture (SOA) services. Each service is an unassociated, self-supporting functionality. A business flow of messages is a cluster of services set in a predefined order which provide GPPs range of functionality'
}

router.get('/', function(req, res, next) {
	if(oracle == true){
		async.waterfall([
			function(callback){
				channel.load_from_db(channel, callback)	
			}
		],
		function(err, results){			
			res.render('profile_list', { identity: identity, keys: null , values: null });
		})
	}else{
		channel.load()
		res.render('profile_list', { identity: identity, keys: null , values: null });	  
	}
});

router.get('/profile/:id', function(req, res, next){			
	row_id = req.params["id"]
	var record = channel.select(row_id)
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

router.get('/new', authentication_mdl.is_login, function(req, res, next) {
	var record = channel.select(0);
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

module.exports = router;
