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

var Payment = require('../models/payment');
var Storage = require('../middlewares/storage');

router.get('/', function(req, res, next) {
  res.render('payments');      
});



router.get('/bymid/:mid', function(req, res){
  var payments = [];
  db.listCollections().toArray(function(err, collections){ 
    relevant = collections.filter( function(c){ return c.name.indexOf("payments") > -1 })
    if(relevant.length == 0){ res.json({tree: payments}); }
    
    var ind = 0;
    for(var i=0; i<relevant.length; i++){
      collection = relevant[i];
      var env = collection.name.replace("_payments","");        
      payments.push({ "text" : "<span class= 'font-weight-bold ml-2'>" + env + "</span>",
                      "key": env,
                      "mid": req.params["mid"],
                      "selectable": false,
                      "lazyLoad": true,
                      "state": { "expanded": false, "selected": false },
                      "nodes" : []
                    });  
    }
    res.json({tree: payments});
  });
})

router.get('/tree/:env/:mid', function(req, res){
  var nodes= []
  var env = req.params["env"];
  var mid = req.params["mid"];
  var storage = new Storage(env + "_payments");

  var where = (mid == 'blank') ? {} : {"mid" : {"$regex" : ".*"+mid+".*"}}
  storage.listDoc( {"mid":1,"_id":0}, where, {"last_update": -1},  function(docs){
    console.log("-----> ["+env+"] Received number of docs " + docs.length)
    if(docs.length > 0){
      nodes = docs.map(function(doc){  return {
                                                    "text": doc["mid"], 
                                                    "selectable": true, 
                                                    "state": { "selected": false }, 
                                                    "key": doc["mid"],
                                                    "env": env
                                                    } 
                                        })       
      res.json({nodes: nodes});
    } else {
      res.json({nodes: nodes});
    }
  })
})


router.get('/byscore/:usecase/:score', function(req, res){
  var payments = [];
  db.listCollections().toArray(function(err, collections){ 
    relevant = collections.filter( function(c){ return c.name.indexOf("payments") > -1 })
    if(relevant.length == 0){ res.json({tree: payments}); }
    
    var ind = 0;
    for(var i=0; i<relevant.length; i++){
      collection = relevant[i];
      var env = collection.name.replace("_payments","");        
      payments.push({ "text" : "<span class= 'font-weight-bold ml-2'>" + env + "</span>",
                      "key": env,
                      "usecase": req.params["usecase"],
                      "score": req.params["score"],
                      "selectable": false,
                      "lazyLoad": true,
                      "state": { "expanded": false, "selected": false },
                      "nodes" : []
                    });  
    }
    res.json({tree: payments});
  });
})

router.get('/tree/:env/:usecase/:score', function(req, res){
  var nodes= []
  var env = req.params["env"];
  var usecase = req.params["usecase"];
  var score = req.params["score"];
  var storage = new Storage(env + "_payments");
  var where = {"flow.similarities": {"$gt": []} }
  storage.listDoc({"flow.similarities": 1, "mid": 1, "_id" :0}, where, {"last_update": -1},  function(docs){
    console.log("-----> ["+env+"] Received Usecase number of docs " + docs.length)
    if(docs.length > 0){
      relevant = docs.filter( function(d){ return (d["flow"]["similarities"][0].indexOf(usecase) != -1) && (parseInt(d["flow"]["similarities"][2], 10) > parseInt(score, 10)) })
      console.log("-----> ["+usecase + ":" + score + "] Whoa Docs>" + docs.length + " relevant>" + relevant.length);
      if(relevant.length > 0){
        nodes = relevant.map(function(doc){  return {
                                                    "text": doc["mid"], 
                                                    "selectable": true, 
                                                    "tags": [doc["flow"]["similarities"][2] + "%"],
                                                    "state": { "selected": false }, 
                                                    "key": doc["mid"],
                                                    "env": env
                                                    } 
                                        })         
      }      
      res.json({nodes: nodes});
    } else {
      res.json({nodes: nodes});
    }
  })
})


router.get('/tree', function(req, res){
  var payments = [];
  db.listCollections().toArray(function(err, collections){ 
    relevant = collections.filter( function(c){ return c.name.indexOf("payments") > -1 })
    if(relevant.length == 0){ res.json({tree: payments}); }
    
    var ind = 0;
    for(var i=0; i<relevant.length; i++){
      collection = relevant[i];
      var env = collection.name.replace("_payments","");        
      payments.push({ "text" : "<span class= 'font-weight-bold ml-2'>" + env + "</span>",
                      "key": env,
                      "selectable": false,
                      "lazyLoad": true,
                      "state": { "expanded": false, "selected": false },
                      "nodes" : []
                    });  
    }
    res.json({tree: payments});
  });
});

router.get('/flow/:env/:mid', function(req, res, next) {
  var payment = new Payment(req.params["env"], req.params["mid"])
  payment.loadFlow(function(flow){
    console.log("-----> Get payment flow : " + JSON.stringify(flow))
    flow["mid"] = req.params["mid"];
    flow["env"] = req.params["env"];
    res.render('payments', { data: flow, view: "flow", env: req.params["env"], mid: req.params["mid"] });       
  })
});

router.get("/activities/:env/:mid", function(req, res){
  res.render('payments', { data: { "mid": req.params["mid"], "name": "Activities log" }, view: "table" });
});

router.get("/details/:env/:mid/:uid/:view", function(req, res){
  var payment = new Payment(req.params["env"], req.params["mid"])
  var view = req.params["view"];
  payment.loadDetails(view, req.params["uid"], function(step, details){
    console.log("-----> Get DETAILS : " + JSON.stringify(details))
    if(step == null){
      res.render('blank')
    } else {
      res.render('details', { data: { "step": step, "details": details }, view: view });          
    }    
  })
});

router.get("/tabledata/:env/:mid", function(req, res){
  console.log("Query  --< " + JSON.stringify(req.query))
  var payment = new Payment(req.params["env"], req.params["mid"]);
  activities = payment.loadActivities(function(activities){
    console.log("activities --< " + activities.length)
    var query = req.query
    var total = activities.length    
    var filtered = 0;
    data = [];
    if(query["start"] && query["length"]){      
      if(query["search"]["value"] == ""){
        data = activities.slice(parseInt(query["start"]), parseInt(query["start"]) + parseInt(query["length"]))
        filtered = total
      } else {
        searched = []
        activities.forEach(function(a){
          if((a[4].toLowerCase().indexOf(query["search"]["value"].toLowerCase()) > -1) || (a[5].toLowerCase().indexOf(query["search"]["value"].toLowerCase()) > -1)  ){
            searched.push(a)
          }
        })
        data = searched.slice(parseInt(query["start"]), parseInt(query["start"]) + parseInt(query["length"]))
        filtered = searched.length
      }
    }
    
    res_data = data.map(function(line){
      return {        
        "time": (new Date(line[0])).toISOString().split('T')[1].split('Z')[0], 
        "service": line[4],               
        "activity": line[5]
      }
    })
    console.log("-----> Res data " + JSON.stringify(res_data))
    res.json({
      "draw": parseInt(query["draw"]),
      "recordsTotal": total ,
      "recordsFiltered": filtered,    
      "data": res_data 
    });
  });
})

router.get('/compare/:env1/:mid1/:env2/:mid2', function(req, res, next) {
  console.log("-----> Comapre payemtns :" + JSON.stringify(req.params))
  
  var payment_left = new Payment(req.params["env1"], req.params["mid1"]);
  var payment_right = new Payment(req.params["env2"], req.params["mid2"]);

  payment_left.loadFlow(function(flow_left){    
    payment_right.loadFlow(function(flow_right){
      flow_left["mid"] = req.params["mid1"];
      flow_right["mid"] = req.params["mid2"]; 
      flow_left["env"] = req.params["env1"];
      flow_right["env"] = req.params["env2"];       
      res.render('payments', {data_left: flow_left, data_right: flow_right, view: "split" });       
    }) 
  })
});

module.exports = router;

