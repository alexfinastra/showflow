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
var Promise = require('es6-promise').Promise;

var identity = {
	type: 'onboard', 
	title: 'On boarding and COTS (Commercial off-the-shelf)', 
	description: 'Although COTS products can be used out of the box, in practice the COTS product must be configured to achieve the needs of the business and integrated to existing organisational systems. Extending the functionality of COTS products via custom development is also an option, however this decision should be carefully considered due to the long term support and maintenance implications. Such customised functionality is not supported by the COTS vendor, so brings its own sets of issues when upgrading the COTS product.'
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

var getOptions = function(obj){
	opt = { properties: false, allrun: false, allroll: false}
  var keys = Object.keys(obj.values);
  console.log("****************** Keys ARE : " + keys)
  for(var i=0; i<=keys.length-1; i++){
  	key = keys[i];
		opt["allrun"] =( opt["allrun"] || obj.values[key]["action"].length > 0 ? true : false);		 
		opt["allroll"] =( opt["allroll"] || obj.values[key]["action"].length > 0 ? true : false);
	}

	if(obj.values[keys[0]].status == ""){
		opt["properties"] = true
		if(obj.values[keys[0]].action != ""){
				opt["allrun"] = true
		}
		opt["allroll"] = false
	}
	if(obj.values[keys[keys.length-1]].status == "success"){
		opt["properties"] = true
		opt["allrun"] = false
		opt["allroll"] = true
	}

  return opt;
}


var group_scripts = function(){
	var product = new json.File(appRoot + "/db/properties/product_index.json" );
  product.readSync();  
	var uids = [];
  for(var j=0; j<product.data.length; j++){
  	var nodes =  product.data[j]["nodes"];
  	var nlen = nodes.length
  	if (nlen == 0 ){continue;}

  	for(var k=0; k<nlen; k++){
  		var node = nodes[k]
  		if(node.state.checked == true){
  			uids.push(node.text);
  		}
  	}
  }
  
  console.log(" UIDS are " + uids)
  var res = {};
  var scripts = new json.File(appRoot + "/db/properties/scripts_index.json" );
  scripts.readSync();

  for(var i=0; i<uids.length; i++){
    uid = uids[i];    
    obj = scripts.get(uid);
    key = uid

    if(key == null || key == undefined) { continue;}    
    if(!(key in res)){ res[key] = []} 

    res[key].push(Object.assign(obj,{options: getOptions(obj)}));
  }
  return res;
}


router.get('/', function(req, res, next) {
	//generate_scripts(); // require 5 manula updates !!!!	
	var data = group_scripts();  
  res.render('scripts_list', { identity: identity, data: data });
});

var checkNode = function(req, check, callback){
	parentId = 0, nodeId = 0;
	parent = req.params["parent"]
  node = req.params["node"]
  var product = new json.File(appRoot + "/db/properties/product_index.json" );
  product.readSync();

  for(var j=0; j<product.data.length; j++){
  	if (product.data[j].key != parent) {continue;}
  	parentId = j;

  	var nodes =  product.data[j]["nodes"];  	
  	for(var k=0; k<nodes.length; k++){  		
  		if(nodes[k].key != node){ continue;}
  		nodeId = k
  	}
  }
  console.log( parentId + ".nodes."+ nodeId + ".state.checked")

  product.set( parentId + ".nodes."+ nodeId + ".state.checked", check)
  product.writeSync();    
  callback();
}

router.get("/check/:parent/:node", function(req, res){
  checkNode(req, true, function(){  	
  	res.redirect('/onboard'); 
  });
})

router.get("/uncheck/:parent/:node", function(req, res){
	checkNode(req, false, function(){  	
  	res.redirect('/onboard'); 
  });
})


var inputs = function(file, script_key ){
	console.log(" **** SKRIPT KEY IS " + script_key);
	return {
		"OFFICE": file.get(script_key + ".input.office"),
		"DEPARTMENT": file.get(script_key + ".input.department"),
		"BIC": file.get(script_key + ".input.bic"),
		"COUNTRY": file.get(script_key + ".input.country"),
		"CURRENCY": file.get(script_key + ".input.currency"),
		"MOP": file.get(script_key + ".input.mop")
	}
}

var sql_statement = function(line, input){
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
	database.simpleExecute(line_new, [], {
                autoCommit: true,
                outFormat: database.OBJECT
            })
	.then(function(results){
  	console.log( " --- - - result.rowsAffected :" + ((result == undefined || result == null) ? null : result.rowsAffected) );                
  })
	.catch(function(err){
		console.log("Error connecting to DB" + err.message + " -- "+ err.message.indexOf("ORA-00001") > -1 ? "User already exists" : "Input Error");
	})
}


var run_sql_old = function(line_new){
		console.log("-------------------- CONNECTIONS ------------------------------------")
		console.log(" dbConfig " + dbConfig + " and oracledb" + oracledb);
		"use strict";
		oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            console.log("Error connecting to DB" + err.message);
            return;
        }
        console.log(" 5 ========>>>> S Q L :" + line_new ); 
               
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


var execute = function(file, ind, script_key, prefix = ''){
	console.log( "1 EXECUTE >>>> S Q L :" + ind );
	console.log(" **** SKRIPT KEY IS " + script_key);
	filename = prefix + file.get(script_key + ".values."+ ind +".name");
	
	console.log( "2 EXECUTE >>>> S Q L :" + filename );
	var lineRead = require('readline').createInterface({
		input: require('fs').createReadStream("./db/scripts/"+filename+".sql")
	});

	var input = inputs(file);
	lineRead.on('line', function (line) {
		if(line.indexOf('--REM') == -1 && line.indexOf('--') != 0){			
			var line_new = sql_statement(line, input);			
			run_sql(line_new)
		}
	});
}

var update_execute = function(file, size, script_key, step){
		console.log(" **** SKRIPT KEY IS " + script_key);
	status = script_key + ".values."+ step +".status"
	file.set(status , "success")	;

	if (step > 1){
		clean = script_key + ".values."+ (step-1) +".action"
		file.set(clean , "")	;
	}

	rollback = script_key + ".values."+ step +".action"
	file.set(rollback , "rollback")	;
  
  if ( (step+1) <= size)	{
		run = script_key + ".values."+ (step+1) +".action"
		file.set(run , "run")	;
	}
}

var update_rollback = function(file, size, script_key, step){
		console.log(" **** SKRIPT KEY IS " + script_key);
	status = script_key + ".values."+ step +".status"
	file.set(status , "")	;

	if (step > 1){
		rollback = script_key + ".values."+ (step-1) +".action"
	  file.set(rollback , "rollback")	;
	}
	
	run = script_key + ".values."+ step +".action"
	file.set(run , "run")	;
  
  if ( (step+1) <= size)	{
		clean = script_key + ".values."+ (step+1) +".action"
		file.set(clean , "")	;
	}
}

router.get('/run/:script_key/:id', function(req, res, next){			
	script_key = req.params["script_key"];
		console.log(" **** SKRIPT KEY IS " + script_key);
	step = parseInt(req.params["id"]);
	var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	file.readSync();

	var size = Object.keys(file.get(script_key + ".values")).length;	
	if (step == 0){
		for(var i=1; i<=size; i++){			
			status = script_key + ".values."+ i +".status"
			if (file.get(status) == ""){
				console.log("Execute Iteration "+i)
				execute(file, script_key, i);
			  update_execute(file, size, script_key, i);	
			}
		}
	} else {
		execute(file, script_key, step);
		update_execute(file, size, script_key, step);
	}

	file.writeSync();
	res.redirect('/onboard');		 
});

router.get('/rollback/:script_key/:id', function(req, res, next) {
	script_key = req.params["script_key"];
		console.log(" **** SKRIPT KEY IS " + script_key);
	step = parseInt(req.params["id"]);
	var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	file.readSync();

	var size = Object.keys(file.get(script_key + ".values")).length;
	if (step == 0){
		for(var i=size; i>0; i--){			
			status = script_key + ".values."+ i +".status"			
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

router.post('/input/:script_key', function (req, res) {
		script_key = req.params["script_key"];
		console.log(" **** SKRIPT KEY IS " + script_key);
    var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	  file.readSync();

	  file.set(script_key + ".input.office", req.body.OFFICE);
	  file.set(script_key + ".input.department", req.body.DEPARTMENT);
	  file.set(script_key + ".input.bic", req.body.BIC);
	  file.set(script_key + ".input.country", req.body.COUNTRY);
	  file.set(script_key + ".input.currency", req.body.CURRENCY);
	  file.set(script_key + ".input.mop", req.body.MOP);
	  file.set(script_key + ".values.1.action", "run");

	  file.writeSync();	
    res.redirect('/onboard');
});

router.get('/reset/:script_key', function (req, res) {
    script_key = req.params["script_key"];
		console.log(" **** SKRIPT KEY IS " + script_key);
    var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	  file.readSync();

	  file.set(script_key + ".input.office", "");
	  file.set(script_key + ".input.department", "");
	  file.set(script_key + ".input.bic", "");
	  file.set(script_key + ".input.country", "");
	  file.set(script_key + ".input.currency", "");
	  file.set(script_key + ".input.mop", "");

	  var size = Object.keys(file.get(script_key + ".values")).length;
	  for(var i=1; i<=size; i++){
      clean = script_key + ".values."+ i +".action"
  	  file.set(clean , "")	;
  	  status = script_key + ".values."+ i +".status"
      file.set(status , "")	;
	  }
	  
	  file.writeSync();	
    res.redirect('/onboard');
});

router.get('/tree', function(req, res){
  var product = new json.File(appRoot + "/db/properties/product_index.json" );
  product.readSync();
  console.log(product.data)
  res.json({tree: product.data});
});

module.exports = router;
