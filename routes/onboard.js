var express = require('express');
var router = express.Router();
var async = require('async')
var json = require('json-file');
var authentication_mdl = require('../middlewares/authentication');
var fs = require('fs');


var identity = {
	type: 'onboard', 
	title: 'On boarding scripts and tasks', 
	description: 'A list of scripts which will create a new offices and allow to start processing payments scoping tham in terms of office and departments.'
}

const readline = require('readline');
var generate_scripts = function(){
	var lineReader = require('readline').createInterface({
	  input: require('fs').createReadStream('./db/scripts/template_create_new_office.sql')
	});

	lineReader.on('line', function (line) {
		if(line.indexOf('---REM') > -1 ){
		  var arr = line.split(" ") 		  
 		  filename = './db/scripts/' + arr[arr.length -1].toLowerCase() + ".sql" ;
 		  
 		  if (fs.existsSync(filename)) {
			  fs.appendFile(filename, line + '\n', function (err) {
				  console.log('Saved!');
				});
			} else {
				fs.writeFile(filename, line+'\n' , function(err) {
	    		console.log("The file was saved!");
	    	})	
			}
 		} else {
 			fs.appendFile(filename, line + '\n', function (err) {
				console.log('Saved!');				
			})			
 		}
	  console.log('Line from file:', line);
	});
}



router.get('/', function(req, res, next) {
	
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
		opt["properties"] = false
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

var execute = function(file, ind){
	filename = file.get("scripts.values."+ ind +".name")
	var lineRead = require('readline').createInterface({
		input: require('fs').createReadStream("./db/scripts/"+filename+".sql")
	});

	var input = inputs(file);
	console.log(" ))))) inputs " + input);
	lineRead.on('line', function (line) {
		if(line.indexOf('---REM') == -1 ){			
			var line_new = sql_tatement(line, input);
			console.log( " ========>>>> S Q L :" + line_new );
		}
	});
}

var update_results = function(file, size, step){
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

router.get('/run/:id', function(req, res, next){			
	step = parseInt(req.params["id"]);
	var file = new json.File(appRoot + "/db/properties/scripts_index.json" );
	file.readSync();
	var size = Object.keys(file.get("scripts.values")).length;
	// apply to all 
	if (step == 0){
		for(var i=1; i<=size; i++){			
			execute(file, i);
			update_results(file, size, i);
		}
	} else {
		execute(file, step);
		update_results(file, size, step);
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
		for(var i=1; i<=size; i++){
			status = "scripts.values."+ i +".status"
	  	file.set(status , "")	;
	  	action = "scripts.values."+ i +".action"
	  	if(i == 1){
	  		file.set(action , "run")	;
	  	}else{
	  		file.set(action , "")	;
	  	}
		}
	} else {
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
	  file.set("scripts.values.1.action", "run")	;
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

	  for(var i=1; i<24; i++){
      clean = "scripts.values."+ i +".action"
  	  file.set(clean , "")	;
  	  status = "scripts.values."+ i +".status"
      file.set(status , "")	;
	  }
	  file.writeSync();	
    res.redirect('/onboard');
});


module.exports = router;
