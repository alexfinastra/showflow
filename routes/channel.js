var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var Profile = require('../models/profileModel');
var session_store;



router.get('/', function(req, res, next) {
	var channel = new Profile('channel'); 
	var keys = channel.keys();
	var values = channel.values();
	res.render('profile_list', { type: 'channel', keys:  keys, values: values });
});

router.get('/profile/:id', function(req, res, next){
	row_id = req.params["id"]
	var channel = new Profile('channel'); 
	var record = channel.select(row_id);
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

router.get('/new', authentication_mdl.is_login, function(req, res, next) {
	var channel = new Profile('channel'); 
	var record = channel.select(0);
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

module.exports = router;
