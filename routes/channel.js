var express = require('express');
var router = express.Router();
var async = require('async')
var authentication_mdl = require('../middlewares/authentication');

var Profile = require('../models/profileModel');
var channel = new Profile('channel'); 

var identity = {
	type: 'channel', 
	title: 'Payments, uploads, notifications, etc...', 
	description: 'Data sources or consumers are united into channels. Also grouped by type and ordered by subtype. Auto-refresh, instant monitoring, content validations, documentation reference are applied.'
}

router.get('/', function(req, res, next) {
	if(oracle == true){
		channel.load_db();
		//async.waterfall([
		//	function(callback){
		//		channel.load_from_db(channel, callback)	
		//	}
		//],
		//function(err, results){			
			res.render('profile_list', { identity: identity, keys: channel.keys() , values: channel.values() });
		//})
	}else{
		channel.load();
		res.render('profile_list', { identity: identity, keys: channel.keys() , values: channel.values() });	  
	}
});

router.get('/profile/:id', function(req, res, next){			
	row_id = req.params["id"]	
	channel.reload();
	var record = channel.select(row_id);
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

router.get('/new', authentication_mdl.is_login, function(req, res, next) {
	var record = channel.select(0);
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

router.post('/update/:id', function(req, res){
	row_id = req.params["id"]
	channel.reload();
	var record = channel.select(row_id)
	
	var key = record["UID_INTERFACE_TYPES"] + ".to_schemas";	
	channel._properties.set(key, req.body.REQUEST_SCHEMA);	
	key = record["UID_INTERFACE_TYPES"] + ".from_schemas";	
	channel._properties.set(key, req.body.RESPONSE_SCHEMA);
	channel._properties.writeSync();

	if(oracle){
		var update = "update INTERFACE_TYPES "
		var where = "where UID_INTERFACE_TYPES ='" + record["UID_INTERFACE_TYPES"] + "' "
		var set = ""

		if(req.body.DESCRIPTION != "" && record["DESCRIPTION"] != req.body.DESCRIPTION){
			set += " DESCRIPTION = '" + req.body.DESCRIPTION + "'";
		}
		if(req.body.REQUEST_DIRECTION != "" && record["REQUEST_DIRECTION"] != req.body.REQUEST_DIRECTION){
			set += " REQUEST_DIRECTION = '" + req.body.REQUEST_DIRECTION + "'";
		}
		if(req.body.REQUEST_PROTOCOL != "" && record["REQUEST_PROTOCOL"] != req.body.REQUEST_PROTOCOL){
			set += " REQUEST_PROTOCOL = '" + req.body.REQUEST_PROTOCOL + "'";
		}
		if(req.body.REQUEST_FORMAT_TYPE != "" && record["REQUEST_FORMAT_TYPE"] != req.body.REQUEST_FORMAT_TYPE){
			set += " REQUEST_FORMAT_TYPE = '" + req.body.REQUEST_FORMAT_TYPE + "'";
		}
		if(req.body.REQUEST_DIRECTION != "" && record["REQUEST_DIRECTION"] != req.body.REQUEST_DIRECTION){
			set += " REQUEST_DIRECTION = '" + req.body.REQUEST_DIRECTION + "'";
		}
		if(req.body.RESPONSE_PROTOCOL != "" && record["RESPONSE_PROTOCOL"] != req.body.RESPONSE_PROTOCOL){
			set += " RESPONSE_PROTOCOL = '" + req.body.RESPONSE_PROTOCOL + "'";
		}
		if(req.body.RESPONSE_FORMAT_TYPE != "" && record["RESPONSE_FORMAT_TYPE"] != req.body.RESPONSE_FORMAT_TYPE){
			set += " RESPONSE_FORMAT_TYPE = '" + req.body.RESPONSE_FORMAT_TYPE + "'";
		}

		var query = update + " set " + set + " " + where;
		console.log("== Update query: " + query)
		channel.update_db(query);
	}
	
	res.redirect("/channel/profile/" + row_id);
})

module.exports = router;
