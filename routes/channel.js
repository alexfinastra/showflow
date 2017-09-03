var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var Profile = require('../models/profileModel');
var session_store;

var async = require('async')

var channel = new Profile('channel'); 
router.get('/', function(req, res, next) {
	async.waterfall([
			function(callback){
				channel.load_from_db(callback)	
			}
		],
		function(err, results){
			console.log("____________ DATA: " + results);
			res.render('profile_list', { type: 'channel', keys: channel.keys() , values: channel.values() });
		})
});

router.get('/profile/:id', function(req, res, next){
	row_id = req.params["id"]	
	channel.load()
	var record = channel.select(row_id)
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

router.get('/new', authentication_mdl.is_login, function(req, res, next) {
	var record = channel.select(0);
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

module.exports = router;
