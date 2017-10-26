var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var session_store;

/* GET home page. */
router.get('/', function(req, res, next) {
	res.redirect('/onboard');
});

router.get('/login',function(req,res,next){
	res.render('login', {title:"Login Page"});
});

router.post('/login',function(req,res,next){
	session_store=req.session;
	req.assert('user', 'Please fill the Username').notEmpty();	
	req.assert('pass', 'Please fill the Password').notEmpty();
	var errors = req.validationErrors();
	if (!errors) {
		v_pass = req.sanitize( 'pass' ).escape().trim(); 
		v_user = req.sanitize( 'user' ).escape().trim();
		
		if(v_pass == '1' && v_user == '1'){
			session_store.is_login = true;
			res.redirect('/onboard');
		}else{
			req.flash('msg_error', "Wrong email address or password. Try again."); 
			res.redirect('/login');
		}
	}
	else{
		errors_detail = "Sory there are error<ul>";
		for (i in errors) { 
			error = errors[i]; 
			errors_detail += '<li>'+error.msg+'</li>'; 
		} 
		errors_detail += "</ul>"; 

		console.log(errors_detail);
		req.flash('msg_error', errors_detail); 
		res.redirect('/login'); 
	}	
});

router.get('/logout', function(req, res)
{ 
	req.session.destroy(function(err){ 
		if(err){ 
			console.log(err); 
		} 
		else { 
			res.redirect('/login'); 
		} 
	}); 
});


module.exports = router;