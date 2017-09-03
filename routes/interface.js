var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var Profile = require('../models/profileModel');
var session_store;

var interface = new Profile('interface');

/* GET home page. */
router.get('/', function(req, res, next) {
	interface.load()
	var keys = interface.keys();
	var values = interface.values();
	res.render('profile_list', { type: 'interface', keys:  keys, values: values });
});

router.get('/profile/:id', function(req, res, next){
	var row_id = req.params["id"]
	interface.load()
	var record = interface.select(row_id);

	res.render('profile', { title: 'Interface Profile', record: record , model: interface});
});

router.get('/new', authentication_mdl.is_login, function(req, res, next) {
	var record = interface.select(0);
	res.render('profile', { title: 'Interface Profile', record: record , model: interface });
});


module.exports = router;
