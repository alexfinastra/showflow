var express = require('express');
var router = express.Router();
var oracledb = require('oracledb');
var database = require('../db/database.js')
var dbConfig = require('../db/dbconfig.js');
var model = require('../models/interface_type.js')
var json = require('json-file');

var identity = {
	type: 'interface', 
	title: 'On going standard interfaces', 
	description: 'Standard interfaces gruped by type and ordered by sub type. Auto-refresh, instant monitoring, content validations, documentation reference are applied.'
}


var group_profiles = function(rows){
    var res = {};
    for(var i=0; i<rows.length; i++){
        obj = rows[i];
        key = model.description(obj)
        if(key == null || key == undefined) { continue;}    

        if(!(key in res)){ res[key] = []}
        //obj["DESCRIPTION"] = model.interface_subtype_desc(obj["INTERFACE_SUB_TYPE"])
        res[key].push(obj);
    }
    return res;
}

var select = "SELECT INTERFACE_NAME, OFFICE, INTERFACE_TYPE, INTERFACE_SUB_TYPE, REQUEST_DIRECTION, MESSAGE_WAIT_STATUS, INTERFACE_STATUS, MESSAGE_STOP_STATUS, STOP_AFTER_CONN_EXCEPTION, INTERFACE_MONITOR_INDEX, REQUEST_PROTOCOL, REQUEST_CONNECTIONS_POINT, REQUEST_FORMAT_TYPE, REQUEST_STORE_IND, RESPONSE_PROTOCOL, RESPONSE_CONNECTIONS_POINT, RESPONSE_FORMAT_TYPE, RESPONSE_STORE_IND, UID_INTERFACE_TYPES, NOT_ACTIVE_BEHAVIOUR, REC_STATUS, ASSOCIATED_SERVICE_NAME, NO_OF_LISTENERS, NON_JMS_RECEPIENT_IND, HANDLER_CLASS, BUSINESS_OBJECT_CLASS, BUSINESS_OPERATION, PMNT_SRC, CUSTOM_PROPERTIES, WAIT_BEHAVIOUR, BATCH_SIZE, SUPPORTED_APP_IDS, BACKOUT_INTERFACE_NAME, BULK_INTERFACE_NAME, APPLICATION_PROTOCOL_TP, REQUEST_GROUP_NM, SEQUENCE_HANDLER_CLASS, RESPONSE_INTERFACE, RESPONSE_TIMEOUT_MILLIS, RESPONSE_TIMEOUT_RETRY_NUM, HEARTBEAT_INTERFACE_NAME, INTERFACE_STOPPED_SOURCE, RESEND_ALLOWED, DESCRIPTION, THROTTLING_TX, THROTTLING_MILLIS, BULKING_PURPOSE, ENABLED_GROUPS,RESUME_SUPPORTED, EVENT_ID_GENERATION, BULK_RESPONSE_BY_ORIG_CHUNK, INVALID_RESPONSE_IN, PCI_DSS_COMPLIANT, BULKING_TRIGGER_METHOD, IS_BULK FROM INTERFACE_TYPES"
var where = "WHERE INTERFACE_TYPE in ( 'OFAC', 'BI', 'CDB','EXT_FX','POSTING','ADVISING') ";
var query = select + " " + where;
router.get('/', function (req, res) {
  database.simpleExecute(query, [], {
                maxRows: 300,
                outFormat: database.OBJECT
            })
  .then(function(results){
    var data = group_profiles(results.rows);
    res.render('profile_list', { identity: identity, data: data });
  })
  .catch(function(err){
    res.set('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({
        status: 500,
        message: "Error getting the interfaces profile",
        detailed_message: err.message
    }));
  })

/*
    "use strict";

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute(query, {}, {
        	maxRows: 300,
          outFormat: oracledb.OBJECT 
        }, function (err, result) {
            if (err) {
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error getting the interfaces profile",
                    detailed_message: err.message
                }));
            } else {
                //res.contentType('application/json').status(200);
                //res.send(JSON.stringify(result.rows));
                var data = group_profiles(result.rows);
                res.render('profile_list', { identity: identity, data: data });
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("GET /profiles : Connection released");
                    }
                });
        });
    });*/
});

router.get('/profile/:uid', function (req, res) {
    "use strict";

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute(select + " WHERE UID_INTERFACE_TYPES = '" + req.params.uid + "'", [], {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err || result.rows.length < 1) {
                res.set('Content-Type', 'application/json');
                var status = err ? 500 : 404;
                res.status(status).send(JSON.stringify({
                    status: status,
                    message: err ? "Error getting the user profile" : "User doesn't exist",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                //res.contentType('application/json').status(200).send(JSON.stringify(result.rows));
                var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
				properties.readSync();
				var config = properties.get(req.params.uid);
                res.render('profile', { title: 'Interface Profile', record: result.rows[0] , config: config });
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("GET interface/profile/" + req.params.uid + " : Connection released");
                    }
                });
        });
    });
});




// Build UPDATE statement and prepare bind variables
var buildUpdateStatement = function buildUpdateStatement(req, uid) {
    "use strict";
    var statement = "",
        bindValues = {};
    var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
    properties.readSync(); 
		
    //var record = channel.select(req.params.id)
		
		var key = uid + ".to_schemas";	
		properties.set(key, req.body.REQUEST_SCHEMA);	
		
		key = uid + ".from_schemas";	
		properties.set(key, req.body.RESPONSE_SCHEMA);
		properties.writeSync();


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
    bindValues.UID_INTERFACE_TYPES = uid;
    statement = "UPDATE INTERFACE_TYPES SET " + statement;

    return {
        statement: statement,
        bindValues: bindValues
    };
};

router.post('/update/:id', function (req, res) {
    "use strict";    
    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }
        var uid = req.params.id
        var updateStatement = buildUpdateStatement(req, uid);
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
                    //var record  = result.outBinds;
                    //var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
                    //properties.readSync();
                    //properties.set(uid + ".flow_item", model.to_flowitem(record));
                    //properties.writeSync()
                    res.redirect("/interface/profile/" + uid);
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

module.exports = router;
