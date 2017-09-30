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
	var record = channel.select(row_id);
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

router.get('/new', authentication_mdl.is_login, function(req, res, next) {
	var record = channel.select(0);
	res.render('profile', { title: 'Channel Profile', record: record , model: channel});
});

var oracledb = require('oracledb');
var dbConfig = require('../db/dbconfig.js');
// Build UPDATE statement and prepare bind variables
var buildUpdateStatement = function buildUpdateStatement(req) {
    "use strict";
    var statement = "",
        bindValues = {};
   
		var record = channel.select(req.params.id)
		
		var key = record["UID_INTERFACE_TYPES"] + ".to_schemas";	
		channel._properties.set(key, req.body.REQUEST_SCHEMA);	
		
		key = record["UID_INTERFACE_TYPES"] + ".from_schemas";	
		channel._properties.set(key, req.body.RESPONSE_SCHEMA);
		
		channel._properties.writeSync();


    if (req.body.DESCRIPTION) {
        statement += "DESCRIPTION = :DESCRIPTION";
        bindValues.DESCRIPTION = req.body.DESCRIPTION;
    }
    if (req.body.REQUEST_DIRECTION) {
        if (statement) statement = statement + ", ";
        statement += "REQUEST_DIRECTION = :REQUEST_DIRECTION";
        bindValues.REQUEST_DIRECTION = req.body.REQUEST_DIRECTION;
    }
    if (req.body.REQUEST_PROTOCOL) {
        if (statement) statement = statement + ", ";
        statement += "REQUEST_PROTOCOL = :REQUEST_PROTOCOL";
        bindValues.REQUEST_PROTOCOL = req.body.REQUEST_PROTOCOL;
    }
    if (req.body.REQUEST_FORMAT_TYPE) {
        if (statement) statement = statement + ", ";
        statement += "REQUEST_FORMAT_TYPE = :REQUEST_FORMAT_TYPE";
        bindValues.REQUEST_FORMAT_TYPE = req.body.REQUEST_FORMAT_TYPE;
    }
    if (req.body.RESPONSE_PROTOCOL) {
        if (statement) statement = statement + ", ";
        statement += "RESPONSE_PROTOCOL = :RESPONSE_PROTOCOL";
        bindValues.RESPONSE_PROTOCOL = req.body.RESPONSE_PROTOCOL;
    }
    if (req.body.RESPONSE_FORMAT_TYPE) {
        if (statement) statement = statement + ", ";
        statement += "RESPONSE_FORMAT_TYPE = :RESPONSE_FORMAT_TYPE";
        bindValues.RESPONSE_FORMAT_TYPE = req.body.RESPONSE_FORMAT_TYPE;
    }

    statement += " WHERE UID_INTERFACE_TYPES = :UID_INTERFACE_TYPES";
    bindValues.UID_INTERFACE_TYPES = record["UID_INTERFACE_TYPES"];
    statement = "UPDATE INTERFACE_TYPES SET " + statement;

    return {
        statement: statement,
        bindValues: bindValues
    };
};

app.post('/update/:id', function (req, res) {
    "use strict";
    
    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }

    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        var updateStatement = buildUpdateStatement(req);
        connection.execute(updateStatement.statement, updateStatement.bindValues, {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
                if (err || result.rowsAffected === 0) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err ? "Input Error" : "Profile doesn't exist",
                        detailed_message: err ? err.message : ""
                    }));
                } else {
                    // Resource successfully updated. Sending an empty response body. 
                    res.redirect("/channel/profile/" + row_id);
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("POST /channels/update/" + req.params.id + " : Connection released ");
                        }
                    });
            });
    });
});

/*
router.post('/update/:id', function(req, res){
	row_id = req.params["id"]
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
*/

module.exports = router;
