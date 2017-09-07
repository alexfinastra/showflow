var express = require('express');
var router = express.Router();
var async = require('async')
var authentication_mdl = require('../middlewares/authentication');

var Profile = require('../models/profileModel');
var interface = new Profile('interface'); 

router.get('/', function(req, res, next) {
	async.waterfall([
			function(callback){
				if( 1==1 ){
	        interface.load_from_db(interface, callback)	
	      }else{
	        interface.load()
	      }
			}
		],
		function(err, results){			
			res.render('profile_list', { type: 'interface', keys: interface.keys() , values: interface.values() });
		})
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

module.exports = router;
