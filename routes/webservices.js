var express = require('express');
var router = express.Router();
var async = require('async')
var json = require('json-file');
var authentication_mdl = require('../middlewares/authentication');
var request = require('request');
var fs = require('fs');
var cheerio = require('cheerio');
var soap = require('soap');
var async = require("async");


var identity = {
	type: 'webservices', 
	title: 'SOA services as is', 
	description: ' GPP service-oriented architecture (SOA) services. Each service is an unassociated, self-supporting functionality. A business flow of messages is a cluster of services set in a predefined order which provide GPPs range of functionality'
}

var group_services = function(){
  var res = {};
  var services = new json.File(appRoot + "/db/properties/services_index.json" );
  services.readSync();
  var uids = Object.keys(services.data);

  for(var i=0; i<uids.length; i++){
    uid = uids[i];
    obj = services.get(uid + ".flow_item")
    key = obj["interface_type"]

    if(key == null || key == undefined) { continue;}    
    if(!(key in res)){ res[key] = []}        
    res[key].push(obj);
  }
  return res;
}

router.get('/', function(req, res, next) {
  var data = group_services();  
  res.render('services_list', { identity: identity, data: data });
});

router.get('/profile/:uid', function(req, res){
	uid = req.params.uid
	var services = new json.File(appRoot + "/db/properties/services_index.json" );
  services.readSync();
	res.render('service_profile', { title: 'SOAP Service - ' + services.get(req.params.uid + ".flow_item.interface_type"), service: services.get(req.params.uid), uid: req.params.uid });
})




// Build Input Parameters 
var buildInput2SOAP = function buildInput2SOAP(req, uid) {
    "use strict";
    var bindValues = {};
    var properties = new json.File(appRoot + "/db/properties/services_index.json" ); 
    properties.readSync(); 
    
    var req_fields = properties.get(uid + ".req_fields");
    if (req_fields.indexOf("UserID,") > -1 && req.body.UserID) {        
        bindValues.UserID = req.body.UserID;
    }
    if (req_fields.indexOf("effectiveDate,") > -1 && req.body.effectiveDate) {        
        bindValues.effectiveDate = req.body.effectiveDate;
    }
    if (req_fields.indexOf("profileIDs,") > -1 && req.body.profileIDs) {        
        bindValues.profileIDs = req.body.profileIDs;
    }
    if (req_fields.indexOf("profileID,") > -1 && req.body.profileID) {        
        bindValues.profileID = req.body.profileID;
    }
    if (req_fields.indexOf("profileRecordUniqueID,") > -1 && req.body.profileRecordUniqueID) {        
        bindValues.profileRecordUniqueID = req.body.profileRecordUniqueID;
    }
    if (req_fields.indexOf("P_MID,") > -1 && req.body.P_MID) {        
        bindValues.P_MID = req.body.P_MID;
    }
    if (req_fields.indexOf("P_OFFICE,") > -1 && req.body.P_OFFICE) {        
        bindValues.P_OFFICE = req.body.P_OFFICE;
    }
    if (req_fields.indexOf("P_DEPARTMENT,") > -1 && req.body.P_DEPARTMENT) {        
        bindValues.P_DEPARTMENT = req.body.P_DEPARTMENT;
    }
    if (req_fields.indexOf("D_BUTTON_ID,") > -1 && req.body.D_BUTTON_ID) {        
        bindValues.D_BUTTON_ID = req.body.D_BUTTON_ID;
    }
    return bindValues
};





router.post('/execute/:uid', function(req, res){	
  var services = new json.File(appRoot + "/db/properties/services_index.json" );
  services.readSync();
 
  var key = req.params.uid; 
  var url = services.get(key + ".wsdl")
  var args = buildInput2SOAP(req, uid);
  console.log(">>>>> URL " + url + " Input to SOAP :" + JSON.stringify(args) )
	
  soap.createClient(url, function(err, client) {
      if (services.get(key+".func_name").indexOf("applyChanges") > -1){
        client.applyChanges(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("performLoadProfile") > -1){
        client.performLoadProfile(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("profileSave,") > -1){
        client.profileSave(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("profileHold") > -1){
        client.profileHold(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("profileDelete,") > -1){
        client.profileDelete(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("profileActivate,") > -1){
        client.profileActivate(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("profileDecline,") > -1){
        client.profileDecline(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("profileApprove,") > -1){
        client.profileApprove(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("profileMultiActions,") > -1){
        client.profileMultiActions(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("loadMessage,") > -1){
        client.loadMessage(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
      if (services.get(key+".func_name").indexOf("submitMessage,") > -1){
        client.submitMessage(args, function(err, result) {
          console.log(result);
          res.redirect('/webservices/profile/'+uid);
        });
      }
  });
})

router.get('/populate/wsdl', function(req, res){
  var gppspUrl = "http://prdthv465lr.dh-demo.com/gpp" ;
  var serverUrl = gppspUrl + "/services";
  request({
            method: "GET", 
            "rejectUnauthorized": false, 
            "url": serverUrl
          },
          function(err,data,body) {
            const $ = cheerio.load(body);
            var services = new json.File(appRoot + "/db/properties/services_index.json" );
            services.readSync(); 
            
            $('table').find('tbody > tr > td > a').each(function (index, element) {
              var wsdl_path = $(element).attr('href').split('/') 
              for(var a=0; a < wsdl_path.length; a++){
                    if(wsdl_path[a] == "http:"){
                      wsdl_path[a] = ""
                    }
                    if(wsdl_path[a] == "interim466.dh-demo.com"){
                      wsdl_path[a] = "prdthv465lr.dh-demo.com"
                    }
                console.log("WSDL Path " + wsdl_path[a])
              }
              var url = "http:" + wsdl_path.join('/')
              var key = url.split('/')[url.split('/').length-1].split('?')[0] 
              services.set(key + ".wsdl", url)
            });

            services.writeSync(); 
            res.send("OK")
          });
})

router.get('/populate/soap/:uid', function(req, res){  
  var services = new json.File(appRoot + "/db/properties/services_index.json" );
  services.readSync();
  var key = req.params.uid; 

  console.log("Current Key is   " + key + " and properties =>>> "+services.get(key + ".description"))
  var url = services.get(key + ".wsdl")
  console.log("URL is   " + url)
  if(url.length != 0)
  {
    soap.createClient(url, function(err, client) { 
      desc = client.describe()
      console.log("And finally   " + key + " and value " + desc)
      services.set(key+".description",desc)  
      services.set(key+".active", true)  
      services.writeSync(); 
      res.send("OK") 
    })
  }
  else{
    res.send("URL is empty!!!")
  }
})

router.get('/populate/init', function(req, res){
  var services = new json.File(appRoot + "/db/properties/services_index.json" );
  services.readSync(); 
  var keys = Object.keys(services.data);
  console.log("Keys are    " + keys.length)
  
  for(var i=0; i< keys.length; i++){
    var key = keys[i];
    services.set(key,        
      {
        "active": false,
        "connected": false,
        "req_fields": "",
        "func_name": "",
        "res_fields": "",
        "flow_item": {
          "step": 0,
          "type": "service",
          "title": key.replace("Service", ""),
          "description": key.match(/[A-Z][a-z]+/g).join(" "),
          "uid": key,
          "request_protocol": "SOAP",
          "direction": "I",
          "request_connections_point": "",      
          "interface_name": key,
          "status_class": "secondary",
          "office": "***", 
          "interface_type": "Web Service", 
          "interface_sub_type": "",  
          "request_format_type": "XML"
        },
        "rule": [],
        "auditmsg": [],
        "logpattern": [],
        "mid": []
      })
    services.writeSync();  
  }
  res.send("OK")

});

module.exports = router;
