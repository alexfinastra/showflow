var express = require('express');
var router = express.Router();
var async = require('async')
var authentication_mdl = require('../middlewares/authentication');

var Profile = require('../models/profileModel');
var channel = new Profile('channel'); 

var identity = {
	type: 'onboard', 
	title: 'On boarding scripts and tasks', 
	description: 'A list of scripts which will create a new offices and allow to start processing payments scoping tham in terms of office and departments.'
}

router.get('/', function(req, res, next) {
	//if(oracle == true){
	//	async.waterfall([
	//		function(callback){
	//			channel.load_from_db(channel, callback)	
	//		}
	//	],
	//	function(err, results){			
	//		res.render('profile_list', { identity: identity, keys: null , values: null });
	//	})
	//}else{
		//channel.load()
		all = new Profile('all');		
		all.populate_properties();
		res.render('profile_list', { identity: identity, keys: null , values: null });	  
	//}
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
