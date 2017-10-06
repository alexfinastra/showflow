var express = require('express');
var router = express.Router();
var async = require('async')
var json = require('json-file');
var authentication_mdl = require('../middlewares/authentication');
var fs = require('fs');
var oracledb = require('oracledb');
var database = require('../db/database.js')
var dbConfig = require('../db/dbconfig.js');
var async = require('async');

var identity = {
	type: 'onboard', 
	title: 'On boarding scripts and tasks', 
	description: 'A list of scripts which will create a new offices and allow to start processing payments scoping tham in terms of office and departments.'
}

const readline = require('readline');
var generate_scripts = function(){
	var lineReader = require('readline').createInterface({
	  input: require('fs').createReadStream('./db/scripts/templates/template_create_new_office.sql')
	});
	var filename = null, roll_filename = null;
	lineReader.on('line', function (line) {
		var uid = '--UID--';		
		var arr = line.split(" ") 
		var table = 'table'
		if(line.indexOf('--REM') > -1 ){
		  table = arr[arr.length -1].toLowerCase();
 		  filename = './db/scripts/' + table + ".sql" ;
 		  roll_filename = './db/scripts/roll_' + table + ".sql" ;
 		  var rollback = 'delete from ' + table + ' where uid_'+ table + " = '"+uid+"';"

 		  if (fs.existsSync(filename)) {
			  fs.appendFile(filename, line + '\n', function (err) {	});
				fs.appendFile(roll_filename, rollback + '\n', function (err) {});
			} else {
				fs.writeFile(filename, line+'\n' , function(err) {})	
				fs.writeFile(roll_filename, line+'\n' , function(err) { })
			}
 		} else {
 			var rollback = 'delete from ' + table + ' where uid_'+ table + " = '"+uid+"';"
 			fs.appendFile(filename, line + '\n', function (err) {})			
 			fs.appendFile(roll_filename, rollback + '\n', function (err) {})			
 		}
	  console.log('Line from file:', line);
	});
}



router.get('/', function(req, res, next) {
	//generate_scripts(); // require 5 manula updates !!!!
	var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	file.readSync();
	data = file.get("scripts")

	var size = Object.keys(file.get("scripts.values")).length;
	opt = { properties: false, allrun: false, allroll: false}
	
	for(var i=1; i<=size; i++){
		 opt["allrun"] =( opt["allrun"] || data.values[i]["action"].length > 0 ? true : false);		 
		 opt["allroll"] =( opt["allroll"] || data.values[i]["action"].length > 0 ? true : false);
  }

	if(file.get("scripts.values.1.status") == ""){
		opt["properties"] = true
		if(file.get("scripts.values.1.action") != ""){
				opt["allrun"] = true
		}
		opt["allroll"] = false
	}
	if(file.get("scripts.values."+size+".status") == "success"){
		opt["properties"] = true
		opt["allrun"] = false
		opt["allroll"] = true
	}
  res.render('scripts_list', { identity: identity, data: data, options: opt  });	

});

var inputs = function(file){
	return {
		"OFFICE": file.get("scripts.input.office"),
		"DEPARTMENT": file.get("scripts.input.department"),
		"BIC": file.get("scripts.input.bic"),
		"COUNTRY": file.get("scripts.input.country"),
		"CURRENCY": file.get("scripts.input.currency"),
		"MOP": file.get("scripts.input.mop")
	}
}

var sql_tatement = function(line, input){
	//params = ["BIC", "OFFICE", "DEPARTMENT", "COUNTRY", "CURRENCY", "MOP"];
	//for(var i = 0; i<params.length; i++){
	//var param = params[i]		
	//	if(line.indexOf(param) != -1 ){
	//		var new_value = input[param];	
	//		line = line.replace(/OFFICE/g, new_value); 
	//	}
	//}
	line = line.replace(/--BIC--/g, input["BIC"]); 
	line = line.replace(/--OFFICE--/g, input["OFFICE"]); 
	line = line.replace(/--DEPARTMENT--/g, input["DEPARTMENT"]); 
	line = line.replace(/--COUNTRY--/g, input["COUNTRY"]); 
	line = line.replace(/--CURRENCY--/g, input["CURRENCY"]); 
	line = line.replace(/--MOP--/g, input["MOP"]); 
	return line;
}

var run_sql = function(line_new){
		console.log("-------------------- CONNECTIONS ------------------------------------")
		console.log(" dbConfig " + dbConfig + " and oracledb" + oracledb);
		"use strict";
		oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            console.log("Error connecting to DB" + err.message);
            return;
        }
        console.log( " 5 ========>>>> S Q L :" + line_new ); 
               
        connection.execute(line_new, [], {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
            	  console.log( " 6 ========>>>> result.rowsAffected :" + ((result == undefined || result == null) ? null : result.rowsAffected) );
                console.log( " 6.5 ------------ >> err " + err);
                if (err) {
                	console.log("Error connecting to DB" + err.message + " -- "+ err.message.indexOf("ORA-00001") > -1 ? "User already exists" : "Input Error");
                } 
                else {
                    // Successfully created the resource
                    //res.status(201).set('Location', '/onboard/').end(); 
                    console.log("Successfully created the resource");
                    return;
                }
                // Release the connection
                connection.release(
                    function (err) {
                    	  console.log( " 7 ========>>>> Release connection : " + err );
                        if (err) {
                            console.error(err.message);                       
                        } else {
                            console.log("Run sql query from script : Connection released");
                        }
                    });
            });            
    });
}


var execute = function(file, ind, prefix = ''){
	console.log( "1 EXECUTE >>>> S Q L :" + ind );
	filename = prefix + file.get("scripts.values."+ ind +".name");
	
	console.log( "2 EXECUTE >>>> S Q L :" + filename );
	var lineRead = require('readline').createInterface({
		input: require('fs').createReadStream("./db/scripts/"+filename+".sql")
	});

	var input = inputs(file);
	//console.log( "3 EXECUTE >>>> S Q L :" + inputs );

	lineRead.on('line', function (line) {
		if(line.indexOf('--REM') == -1 && line.indexOf('--') == -1){			
			var line_new = sql_tatement(line, input);			
			run_sql(line_new)
			//console.log( "4 EXECUTE >>>> S Q L :" + line_new );
			/*database.simpleExecute(line_new,
	        {}, //no binds
	        {
	            autoCommit: true,
	            outFormat: database.OBJECT
	        }
    		)
        .then(function(results) {
            //res.send(results);
            console.log("Results " + results);
            return;
        })
        .catch(function(err) {
            console.log("Execute " + err);
        });*/


		}
	});
}

var update_execute = function(file, size, step){
	status = "scripts.values."+ step +".status"
	file.set(status , "success")	;

	if (step > 1){
		clean = "scripts.values."+ (step-1) +".action"
		file.set(clean , "")	;
	}

	rollback = "scripts.values."+ step +".action"
	file.set(rollback , "rollback")	;
  
  if ( (step+1) <= size)	{
		run = "scripts.values."+ (step+1) +".action"
		file.set(run , "run")	;
	}
}

var update_rollback = function(file, size, step){
	status = "scripts.values."+ step +".status"
	file.set(status , "")	;

	if (step > 1){
		rollback = "scripts.values."+ (step-1) +".action"
	  file.set(rollback , "rollback")	;
	}
	
	run = "scripts.values."+ step +".action"
	file.set(run , "run")	;
  
  if ( (step+1) <= size)	{
		clean = "scripts.values."+ (step+1) +".action"
		file.set(clean , "")	;
	}
}

router.get('/run/:id', function(req, res, next){			
	step = parseInt(req.params["id"]);
	var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	file.readSync();

	var size = Object.keys(file.get("scripts.values")).length;	
	if (step == 0){
		for(var i=1; i<=size; i++){			
			status = "scripts.values."+ i +".status"
			if (file.get(status) == ""){
				console.log("Execute Iteration "+i)
				execute(file, i);
			  update_execute(file, size, i);	
			}
		}
	} else {
		execute(file, step);
		update_execute(file, size, step);
	}

	file.writeSync();
	res.redirect('/onboard');		 
});

router.get('/rollback/:id', function(req, res, next) {
	step = parseInt(req.params["id"]);
	var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	file.readSync();

	var size = Object.keys(file.get("scripts.values")).length;
	if (step == 0){
		for(var i=size; i>0; i--){			
			status = "scripts.values."+ i +".status"			
			if (file.get(status) == "success"){
				console.log("Rollback Iteration "+i)
				execute(file, i, 'roll_');
				update_rollback(file, size, i);
			}
		}
	} else {
		execute(file, step, 'roll_');
		update_rollback(file, size, step);
	}
	
	file.writeSync();
	res.redirect('/onboard');
});

router.post('/input', function (req, res) {
    var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	  file.readSync();

	  file.set("scripts.input.office", req.body.OFFICE);
	  file.set("scripts.input.department", req.body.DEPARTMENT);
	  file.set("scripts.input.bic", req.body.BIC);
	  file.set("scripts.input.country", req.body.COUNTRY);
	  file.set("scripts.input.currency", req.body.CURRENCY);
	  file.set("scripts.input.mop", req.body.MOP);
	  file.set("scripts.values.1.action", "run");

	  file.writeSync();	
    res.redirect('/onboard');
});

router.get('/reset', function (req, res) {
    var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	  file.readSync();

	  file.set("scripts.input.office", "");
	  file.set("scripts.input.department", "");
	  file.set("scripts.input.bic", "");
	  file.set("scripts.input.country", "");
	  file.set("scripts.input.currency", "");
	  file.set("scripts.input.mop", "");

	  var size = Object.keys(file.get("scripts.values")).length;
	  for(var i=1; i<=size; i++){
      clean = "scripts.values."+ i +".action"
  	  file.set(clean , "")	;
  	  status = "scripts.values."+ i +".status"
      file.set(status , "")	;
	  }

	  file.writeSync();	
    res.redirect('/onboard');
});


module.exports = router;
