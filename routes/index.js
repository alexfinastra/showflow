var express = require('express');
var router = express.Router();
var authentication_mdl = require('../middlewares/authentication');
var session_store;

var nodemailer = require('nodemailer');
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var USERS_COLLECTION = "users";

/* GET home page. */
router.get('/', function(req, res, next) {
	res.redirect('/usecases');
});

router.get('/login',function(req,res,next){
	res.render('login', {title:"Login Page"});
});

router.post('/login',function(req,res,next){
	session_store=req.session;
	req.assert('email', 'Please fill the email').notEmpty();	
	var errors = req.validationErrors();
	if (!errors) {
		v_email = req.sanitize( 'email' ).escape().trim();		
		if(v_email != "" && v_email.indexOf('finastra.com') != -1){
			session_store.email = v_email;
			user = getUser(v_email, function(user){
				if(user == null){
					var code = getRandomIntInclusive(1000, 9999);
					var user = {"email": v_email, "verify_code": code, "confirmed": false};
					db.collection(USERS_COLLECTION).insertOne(user, function(err, doc) {
		        if (err) {
		        	res.render('login', {message: err});
		        } else {
		          console.log("New document created " + doc.ops[0] );
		          sendMail(user, res);
		        }
		      });
				} else {
					code = getRandomIntInclusive(1000, 9999);
					db.collection(USERS_COLLECTION).updateOne({ "email": session_store["email"] }, {$set: {"verify_code": code}},{ upsert: true }, function(err, doc){
			    	if (err != null) {
			      	res.render('login', {message: err});
			    	} else {
			    		user["verify_code"] = code;
			      	sendMail(user, res);
			    	}
			  	});
				}
			});
		}else{
			res.render('login', {message: "Please fill the corporate email address."});
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
		res.render('login', {message: errors_detail});
	}	
});


router.get('/confirmation/:email/:code',function(req,res,next){
	session_store=req.session;
	console.log("confirmation "+ JSON.stringify(session_store));
	if(session_store == undefined){
		res.redirect('/login');
	} else {
		getUser(req.params["email"], function(user){
			if(user == null){
				res.redirect('/login');
			} else {
				console.log("-----> Compare validation codes "+ req.params["code"] + " == " + user["verify_code"] );
				if(req.params["code"] == user["verify_code"]){
					session_store.is_login = true;
					res.redirect('/usecases');
				} else{
					res.render('login', {message: "A provided verification code is incorrect. Please re-login"});
				}				
			}
		});
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



function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'finastra.integration.team@gmail.com',
    pass: 'mjhgwsiqiiadllrb'
  }
});

function getUser(email, cb){
	console.log("Users email is " + email);
	db.collection(USERS_COLLECTION).findOne({ "email": email }, function(err, doc) {
		console.log("Check if user exists :" + err + " result :" + JSON.stringify(doc));
    if (err == null) {
      cb(doc);
    } else {
      return null;
    }
  });
}

function sendMail(user, res){
	var mailOptions = {
	  from: 'finastra.integration.team@gmail.com',
	  to: user["email"],
	  subject: 'ShowFlow access link :)',
	  text: " Please follow the link : https://paymentflow.herokuapp.com/confirmation/"+user["email"]+"/"+user["verify_code"]
	};

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	    //res.redirect('/login');
	    res.render('login', {message: error });
	  } else {
	    console.log('Email sent: ' + info.response);
	    res.render('login', {message:  "A email message was sent to " + user["email"] + " address. Please click on the link mentioned in the email for entering the site. "});
	  }
	});
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}