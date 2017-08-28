var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var Flow = require('../models/flowModel');
var session_store;



/* GET home page. */
router.get('/', authentication_mdl.is_login, function(req, res, next) {		
	res.redirect('/flow/iscb')
});

router.post('/', function(req, res, next){
	var model = require('../models/flowModel');
	var flow_key = req.sanitize( 'flow' ).escape().trim();		
	res.redirect('/flow/' + flow_key)
});

router.get('/:flow_key', function(req, res, next){
	var flow_key = req.params["flow_key"];
	var flow = new Flow(flow_key); 
	console.log(flow._flow);
	res.render('flow', { data: flow._flow});
});

router.get('/update', function(req, res, next){
	res.redirect('/flow/iscb')
});

module.exports = router;
