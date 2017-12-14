var express = require('express');
var router = express.Router();
var async = require('async')
var json = require('json-file');
var jade = require("jade");
var authentication_mdl = require('../middlewares/authentication');
var fs = require('fs');
var oracledb = require('oracledb');
var database = require('../db/database.js')
var dbConfig = require('../db/dbconfig.js');
var async = require('async');
var Promise = require('es6-promise').Promise;
var XLSX = require('xlsx');
var util = require('util');
var path = require('path');
var formidable = require('formidable');
var readLineFile = require("read-line-file");

var identity = {
	type: 'onboard', 
	title: 'On boarding and COTS (Commercial off-the-shelf)', 
	description: 'Although COTS products can be used out of the box, in practice the COTS product must be configured to achieve the needs of the business and integrated to existing organisational systems. Extending the functionality of COTS products via custom development is also an option, however this decision should be carefully considered due to the long term support and maintenance implications. Such customised functionality is not supported by the COTS vendor, so brings its own sets of issues when upgrading the COTS product.'
}

router.get('/', function(req, res, next) {
	//splitSchema()

  //generate_scripts(); // require 5 manula updates !!!!	
	var data = group_scripts();  
	console.log("DATA is :" + JSON.stringify(data))
	res.render('scripts_list', { identity: identity, data: data });    	
});

router.get("/selectnode/:parent/:node", function(req, res){
  selectNode(req, function(){  	
  	var data = group_scripts();  
  	res.json({cots: jade.renderFile(appRoot + '/views/cotsdoc.jade', { identity: identity, data: data }) });
  });
})

router.get("/selectrow/:checkboxId/:checked", function(req, res){  
  selectRow(req, function(){  	
  	checkboxId = req.params["checkboxId"]
  	key = checkboxId.split("_").slice(1, -1).join("_"); 
  	
  	checkboxId = req.params["checkboxId"]
  	item = checkboxId.split("_").pop();

	  var scripts = new json.File(appRoot + "/cots/eurobank/COTS_Eurobank_"+ key +".json" );
    scripts.readSync();
    node =  scripts.get(key + ".values."+ item)
    ehref = "/" + identity["type"] + "/run/"+ key +"/" + item    

    console.log("NU CHE BLYA node >> " + JSON.stringify(node) + "\n  ehref >>" + ehref + "\n checkboxId >> " + checkboxId)
  	res.json({row: jade.renderFile(appRoot + '/views/row.jade', { node: node, ehref: ehref, checkboxId: checkboxId }) });
  });
})


router.get('/run/:script_key/:id', function(req, res, next){	
	//execute(req, function(){
		console.log("IN CALLBACK")
		script_key = req.params["script_key"];
		step = parseInt(req.params["id"]);
		var scripts = new json.File(appRoot + "/cots/eurobank/COTS_Eurobank_"+ script_key +".json" );
    scripts.readSync();

    status = script_key + ".values."+ step +".status"
		scripts.set(status , "success")	;
		action = script_key + ".values."+ step +".action"
		scripts.set(action , "rollback")	;

		scripts.write(function(){			
	    node =  scripts.get(script_key + ".values."+ step)
	    ehref = "/" + identity["type"] + "/rollback/"+ script_key +"/" + step
	    checkboxId = "cb_" + script_key.replace(/ /g, "-") + "_" + step

	    console.log("NU CHE BLYA run script >> " + JSON.stringify(node) + "\n  ehref >>" + ehref + "\n checkboxId >> " + checkboxId)
	  	res.json({row: jade.renderFile(appRoot + '/views/row.jade', { node: node, ehref: ehref, checkboxId: checkboxId  }) });	
		});
	//})
});

router.get('/rollback/:script_key/:id', function(req, res, next) {
	//execute(req, function(){
		console.log("IN ROLLBACK")
		script_key = req.params["script_key"];
		step = parseInt(req.params["id"]);
		var scripts = new json.File(appRoot + "/cots/eurobank/COTS_Eurobank_"+ script_key +".json" );
    scripts.readSync();

    status = script_key + ".values."+ step +".status"
		scripts.set(status , "")	;
		action = script_key + ".values."+ step +".action"
		scripts.set(action , "run")	;

		scripts.write(function(){			
	    node =  scripts.get(script_key + ".values."+ step)
	    ehref = "/" + identity["type"] + "/run/"+ script_key +"/" + step
	    checkboxId = "cb_" + script_key.replace(/ /g, "-") + "_" + step

	    console.log("NU CHE BLYA run script >> " + JSON.stringify(node) + "\n  ehref >>" + ehref + "\n checkboxId >> " + checkboxId)
	  	res.json({row: jade.renderFile(appRoot + '/views/row.jade', { node: node, ehref: ehref, checkboxId: checkboxId  }) });	
		});
	//})
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
  var products = new json.File(appRoot + "/cots/eurobank/COTS_Eurobank_product_index.json" );
  products.readSync();
 
  res.json({tree: products.data});
});


router.get("/parsecots/:filename", function(req, res){
	parseCOTS(req.params.filename)
	res.redirect("/onboard")
})

router.post('/upload/:uid', function(req, res){    
  var form = new formidable.IncomingForm();
  var filename = ""

  form.multiples = true;
  form.uploadDir = path.join(appRoot + '/cots/' + req.params.uid);  

  // rename it to it's orignal name
  form.on('file', function(field, file) {
    console.log("**** Before rename " + file.path);    
    if (fs.existsSync(file.path)) {
      if(fs.existsSync( path.join(form.uploadDir, file.name) ) ){
        fs.unlinkSync(path.join(form.uploadDir, file.name))
      }
      fs.rename(file.path, path.join(form.uploadDir, file.name));
      filename = file.name;     
    }else{
      console.log("File was taken")
    } 
  });

  form.on('error', function(err) {
    console.log('Upload to folder Error: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {  
  	console.log("End upload")  	
  	res.end(filename);    
  });
  
  form.parse(req);
})

module.exports = router;


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
  //if (obj == null || obj == undefined){
  	return opt;
 // }
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
  var res = {};
  var products = appRoot + "/cots/eurobank/COTS_Eurobank_product_index.json";
  if (!fs.existsSync(products)) {
  	return res;
  }

	var product = new json.File(products);
  product.readSync();  
	var uids = [];
  for(var j=0; j<product.data.length; j++){
  	var parent_key = product.data[j]["key"];
  	var nodes =  product.data[j]["nodes"];
  	var nlen = nodes.length
  	if (nlen == 0 ){continue;}

  	for(var k=0; k<nlen; k++){
  		var node = nodes[k]
  		if(node.state.selected == true){
  			var new_key = parent_key + "_" + node.key;
  			uids.push(new_key);
  		}
  	}
  }  
  console.log(" UIDS are " + uids)

  for(var i=0; i<uids.length; i++){
    key = uids[i];  
    if(!(key in res)){ res[key] = []} 

    var file_name = appRoot + "/cots/eurobank/COTS_Eurobank_" + key + ".json";
  	if (fs.existsSync(file_name)) {
		  var cots = new json.File(file_name);
			cots.readSync();
			obj = cots.get(key);
	    if(obj == null || obj == undefined) { continue;}    
	    
			res[key].push(Object.assign(obj,{options: getOptions(obj)}));	
		} else{
			console.log("File " + file_name + " does not exists")
		}
  }
  return res;
}

var selectNode = function(req, callback){
	parentId = 0, nodeId = 0;
	parent = req.params["parent"]
  node = req.params["node"]
  var product = new json.File(appRoot + "/cots/eurobank/COTS_Eurobank_product_index.json" );
  product.readSync();
  console.log("Product " + product.data)
  
  for(var j=0; j<product.data.length; j++){
  	if (product.data[j].key != parent) {
  		var nodes =  product.data[j]["nodes"];  	
  	  for(var k=0; k<nodes.length; k++){
  	  	product.set( j + ".nodes."+ k + ".state.selected", false) 
  	  }  
  		continue;
  	}
  	parentId = j;

  	var nodes =  product.data[j]["nodes"];  	
  	for(var k=0; k<nodes.length; k++){  		
  		console.log(" 1. " +  parentId + ".nodes."+ k + ".state.selected : " + product.get( parentId + ".nodes."+ k + ".state.selected"))
  		product.set( parentId + ".nodes."+ k + ".state.selected", false)  		
  		if(nodes[k].key != node){ continue;}
  		nodeId = k
  	}
  }
  console.log(" 2. " +   parentId + ".nodes."+ nodeId + ".state.selected")

  product.set( parentId + ".nodes."+ nodeId + ".state.selected", true)
  product.write(callback); 
}

var selectRow = function(req, callback){		
	checkboxId = req.params["checkboxId"]
  checked = req.params["checked"]
  pathTo = checkboxId.split("_"); 
  console.log("NU CHE BLYA checked >> " + pathTo )
  var scripts = new json.File(appRoot + "/cots/eurobank/COTS_Eurobank_"+ pathTo.slice(1, -1).join("_") +".json" );
  scripts.readSync();
  
  action = pathTo.slice(1, -1).join("_") + ".values."+ pathTo.pop() +".action"
  value = (checked == "true") ? "run" : ""
  console.log("NU CHE BLYA action >> " + action + "\n  value >>" + value)
  	
  scripts.set(action, value)
  scripts.write(callback);
}



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
	var isWin = /^win/.test(process.platform);
  if(isWin) { return; } 

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


var execute = function(req, callback){
	console.log("HERE WE ARE IN RUN REQUEST")

	script_key = req.params["script_key"];
	step = parseInt(req.params["id"]);
	var file = new json.File(appRoot + "/cots/eurobank/COTS_Eurobank_"+ script_key +".json" );
	file.readSync();
	
	console.log( "1 EXECUTE >>>> S Q L :" + step );
	console.log(" **** SKRIPT KEY IS " + script_key); // prefix +

	filename = file.get(script_key + ".values."+ step +".key");
	
	console.log( "2 EXECUTE >>>> S Q L :" + filename );
	var lineRead = require('readline').createInterface({
		input: require('fs').createReadStream("./db/scripts/"+filename+".sql")
	});

	var input = inputs(file, script_key);
	lineRead.on('line', function (line) {
		if(line.indexOf('--REM') == -1 && line.indexOf('--') != 0){			
			var line_new = sql_statement(line, input);			
			run_sql(line_new);
		}
	});
	callback;
}

var parseCOTS = function(filename){
	var workbook = XLSX.readFile(appRoot + "/cots/eurobank/" + filename);
	var sheet_name_list = workbook.SheetNames;
	var nodes_features = [], nodes_scenarios = []

	for(var s=0; s< sheet_name_list.length; s++) {		
		//if(s>10){break}
		var y = sheet_name_list[s];
	  console.log(" Retrieve data from " + y + " sheet")
    if("Parameters" == y) {continue;}
    var worksheet = workbook.Sheets[y];
        
    var headers_features = {}, headers_scenarios = {};
    var features = [], scenarios = [];
    var isFeauture = true;
    var features_headers_row = -1, scenarios_headers_row = -1; 
    var offset = 0;

    for(z in worksheet) {
        if(z[0] === '!') continue;
        //parse out the column, row, and value
        var tt = 0;
        for (var i = 0; i < z.length; i++) {
            if (!isNaN(z[i])) {
                tt = i;
                break;
            }
        };

        var col = z.substring(0,tt);
        var row = parseInt(z.substring(tt));
        var value = worksheet[z].v;
				//console.log("col :"+col+" row :"+row+" value :"+value)
        
        if(value){
        	if(value == "BG Ref#"){ features_headers_row = row; }
        	if(features_headers_row == row){
        		headers_features[col] = value;
            continue;
        	}

					if(value == "Customer Ref#"){ scenarios_headers_row = row; offset = row;	}
        	if(scenarios_headers_row == row){
        		isFeauture = false
        		headers_scenarios[col] = value;        		
            continue;
        	}

        	if(value == null || value == "" || String(value).indexOf("PASTE") !== -1){
        		continue;
        	}

        	if(isFeauture == true){
        		if(!features[row]) features[row]={};
        		features[row][headers_features[col]] = ('string' == typeof(value))  ? value.replace("'","\"") : value
        	}else{
						if(!scenarios[row - offset]) scenarios[row -offset]={};
        		scenarios[row-offset][headers_scenarios[col]] = ('string' == typeof(value))  ? value.replace("'","\"") : value
        	}
        }
    }

    //drop those first two rows which are empty 
    features.shift();features.shift();         
    var jsonFeaures = JSON.stringify(features).replace(/(\\r\\n|\\n|\\r)/gm, " ");
    //console.log(" -- jsonFeaures :" + jsonFeaures)
    var orig_json_features = JSON.parse(jsonFeaures)
    var values_features = {}
    var step_features = 1
    for(var i = 0; i< orig_json_features.length; i++){
    	var node = orig_json_features[i]
    	if(node != null && node["What"] != null && node["Feature"] != null ){
	    	values_features[step_features] = {
	    		"type":"script",
	        "name": node["Feature"],
	        "key":"users",
	        "description": node["What"],
	        "action":"",
	        "scope": node["Classification"],
	        "status":""
	    	}
	    	step_features = step_features+1
    	}
    }

		if(Object.keys(values_features).length > 0) {
	    var featuresNodes = {}
	    var new_key = y.split('.').join('').split(' ').join('_')
	    featuresNodes["features_" + new_key] = {
	    		"name": y,
	    		"input":{
	         "office":"",
	         "department":"",
	         "bic":"",
	         "country":"",
	         "currency":"",
	         "mop":""
	      },
	      "values": values_features
	    }  

	    fs.writeFileSync(appRoot + "/cots/eurobank/COTS_Eurobank_features_"+ new_key +".json", JSON.stringify(featuresNodes) , 'utf-8');	    	
	    nodes_features.push({
	    	"text": y,
	      "selectable":true,
	      "key": new_key,
	      "state":{
	         "selected":false
	      }
	    })
	  }

	  scenarios.shift();
	  var jsonScenarios = JSON.stringify(scenarios).replace(/(\\r\\n|\\n|\\r)/gm, " ");
	  //console.log(" -- jsonScenarios :" + jsonScenarios)
    var orig_json_scenarios = JSON.parse(jsonScenarios)
    var values_scenarios = {}
    var step_scenarios = 1
    for(var i = 0; i< orig_json_scenarios.length; i++){
    	var node = orig_json_scenarios[i]
    	if(node != null ){
	    	values_scenarios[step_scenarios] = {
	    		"type":"script",
	        "name": node["Feature "],
	        "key":"users",
	        "description": node["Then expected result"],
	        "action":"",
	        "scope": node["Phase"],
	        "status":""
	    	}
	    	step_scenarios = step_scenarios+1
    	}
    }

		if(Object.keys(values_scenarios).length > 0) {
	    var scenariosNodes = {}
	    var new_key = y.split('.').join('').split(' ').join('_')
	    scenariosNodes["scenarios_" + new_key] = {
	    		"name": y,
	    		"input":{
	         "office":"",
	         "department":"",
	         "bic":"",
	         "country":"",
	         "currency":"",
	         "mop":""
	      },
	      "values": values_scenarios
	    }  

	    fs.writeFileSync(appRoot + "/cots/eurobank/COTS_Eurobank_scenarios_"+ new_key +".json", JSON.stringify(scenariosNodes) , 'utf-8');	    	
	    nodes_scenarios.push({
	    	"text": y,
	      "selectable":true,
	      "key": new_key,
	      "state":{
	         "selected":false
	      }
	    })
	  }
	}

	var packages = [];
	if (nodes_features.length > 0 ){	
		nodes_features[0]["state"]["selected"] = true
		var features_packages = {
			"text":"<span class= 'ml-2'> Features </span>",
	      "key":"features",
	      "selectable":false,
	      "state":{
	         "expanded":true,
	         "selected":false
	      },
	      "nodes":nodes_features
		}		
		packages.push(features_packages)
	}

	if (nodes_scenarios.length > 0 ){	
		var scenarios_packages = {
			"text":"<span class= 'ml-2'> Scenarios </span>",
	      "key":"scenarios",
	      "selectable":false,
	      "state":{
	         "expanded":false,
	         "selected":false
	      },
	      "nodes":nodes_scenarios
		}
		packages.push(scenarios_packages)
	}

	if(packages.length > 0){
		fs.writeFileSync(appRoot + "/cots/eurobank/COTS_Eurobank_product_index.json", JSON.stringify(packages) , 'utf-8');	    	
	}
	else{
		console.log("File is empty !!!!")
	}
}


var filename = ""

var splitSchema = function(){  
  rlf = readLineFile(appRoot + '/db/scripts/schema.sql',
    (line) => processLine(line),
    () => console.log('close'),
    (err) => console.log('error')
  )
}

var processLine = function(line){  
  if(line.indexOf("prompt Loading") != -1){
    filename = appRoot + '/db/scripts/' + line.split(' ')[2].split("...")[0] + ".sql"  
    fs.writeFile(filename, "" , function(err) {})   
  }

}