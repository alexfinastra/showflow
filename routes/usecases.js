var express = require('express');
var router = express.Router();
var fs = require('fs');
var fse = require('fs-extra');
var tmp = require('temporary');
var json = require('json-file');
var async = require('async');
var jade = require("jade");
var es = require('event-stream');
var moment = require('moment');
var util = require('util');
var path = require('path');
var underscore = require("underscore");

var authentication_mdl = require('../middlewares/authentication');
var Usecase = require('../models/usecase');
var Storage = require('../middlewares/storage');

router.get('/',authentication_mdl.is_login,function(req, res, next) {
  res.render('usecases', {data: null});      
});

router.get('/tree',authentication_mdl.is_login, function(req, res){
  var usecases = [];
  db.listCollections().toArray(function(err, collections){     
    if(collections.length == 0){ res.json({tree: usecases}); }

    relevant = collections.filter( function(c){ return c.name.indexOf("usecases") > -1 })
    if(relevant.length == 0){ res.json({tree: usecases}); }

    var total = relevant.length - 1;
    relevant.forEach(function(collection, index){ 
      console.log("-----> Load documents from collection " + collection.name + " " + index + " from " + total)
      var storage = new Storage(collection.name);
      var env = collection.name.replace("_usecases","");        
        
      storage.listDoc( {"uid":1,"group":1, "use_case":1, "_id":0}, {"type": "usecase"}, {"group": -1},  function(docs){
        console.log("-----> Get list of "+ docs.length + " for " + env);
        groups = [...new Set(docs.map(item => item["group"] ))];
        usecases.push({ "text" : "<span class= 'font-weight-bold ml-2'>" + env + "</span>",
                        "key": env,
                        "selectable": false,
                        "state": { "expanded": false, "selected": false },
                        "nodes" : groups.map(function(g){
                                      return {
                                        "text": g, 
                                        "selectable": false, 
                                        "state": {"expanded": false, "selected": false }, 
                                        "key": g,
                                        "nodes": docs.filter(function(d){return d["group"] == g}).map(function(doc){
                                          return {
                                            "text": doc["use_case"], 
                                            "env": env,
                                            "selectable": true, 
                                            "state": { "selected": false }, 
                                            "key": doc["uid"]} 
                                        })
                                      } 
                                    })
                        });
    
          if(total == index){
            res.json({tree: usecases});      
          }
        })
    })
  });
});

router.get('/template/:env/:uid',authentication_mdl.is_login, function(req, res, next) {
  var storage = new Storage(req.params["env"] + "_usecases");
  storage.getDoc({"type": "usecase", "uid": req.params["uid"]}, function(doc){
    var usecase = new Usecase(doc);  
    res.render('usecases', { env: req.params["env"], data: usecase._flow });     
  })
});

router.get('/subflow/:env/:uid/:back',authentication_mdl.is_login, function(req, res, next) {
  var storage = new Storage(req.params["env"] + "_usecases");
  storage.getDoc({"type": "subflow", "uid": req.params["uid"]}, function(doc){
    var usecase = new Usecase(doc);  
    res.render('subflow', {env: req.params["env"], data: usecase._flow, back: req.params["back"]  });     
  })
});

router.get('/flows/:env/:uid',authentication_mdl.is_login, function(req, res, next) {
  var storage = new Storage(req.params["env"] + "_usecases");
  storage.getDoc({"type": "usecase", "uid": req.params["uid"]}, function(doc){
    var usecase = new Usecase(doc);  
    res.render('usecases', {env: req.params["env"], data: usecase._flow });     
  })     
});



router.get('/flowmanagement/:env/:uid/:back',authentication_mdl.is_login, function(req, res, next) {
  var flowmanagement = new json.File(appRoot + "/data/flowmanagement/"+ req.params["uid"] +".json");
  flowmanagement.readSync();

  if(flowmanagement != undefined){
    var usecase = new Usecase(flowmanagement.data);
    res.render('subflow', {env: req.params["env"], data: usecase._flow, back: req.params["back"]  });     
  } else {
    res.render('blank');
  }  
});


router.post('/references/:group_name',authentication_mdl.is_login,function(req, res, next) {
  console.log("-----> Reference Update receive " + JSON.stringify(req.body))
  var fpath = appRoot + "/data/references/"+ req.params["group_name"] +"_references.json";    
  var refs = new json.File(fpath);
  refs.readSync();
  var ref = refs.get(req.body["pk"]); 
  if(ref != undefined){
    ref["description"] = req.body["value"]
    refs.set(req.body["pk"], ref);
    refs.writeSync();
    res.json({success: true})
  } else {
    res.json({success: false})
  }
      
});

module.exports = router;
