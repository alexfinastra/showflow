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

router.get('/tree', function(req, res){
  var payments_strg = new Storage();
  console.log("-----> We should load payments from : " + payments_strg.collection)
  payments_strg.listDoc({}, {"env":1,"mid":1,"_id":0}, function(docs){
    var env = "";
    payments = [];
    console.log("----> Selected from db " + docs.length)
    docs.sort((a,b) => {a["env"]<b["env"] ? 1 : (a["env"]>b["env"] ? -1 : 0)}).forEach(function(doc){
      console.log("-----> Received : " + doc["env"] + " - " + doc["mid"])
      if(doc["env"] != env){
        env = doc["env"];
        payments.push({ "text" : "<span class= 'font-weight-bold ml-2'>" + env + "</span>",
                        "key": env,
                        "selectable": false,
                        "state": { "expanded": false, "selected": false },
                        "nodes" : []
                      });
       
      }
      payments[payments.length-1]["nodes"].push({"text": doc["mid"], "selectable": true, "state": { "selected": false }, "key": doc["mid"]});      
    })
    
    res.json({tree: payments});  
  });
});

router.get('/flow/:env/:mid', function(req, res, next) {
  var payment = new Payment(req.params["env"], req.params["mid"])
  payment.loadFlow(function(flow){
    console.log("-----> Get payment flow : " + JSON.stringify(flow))
    flow["mid"] = req.params["mid"];
    res.render('payments', { data: flow, view: "flow" });       
  })
});

router.get("/activities/:env/:mid", function(req, res){
  res.render('payments', { data: { "mid": req.params["mid"], "name": "Activities log" }, view: "table" });
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
          if(a["activity"].indexOf(query["search"]["value"]) != -1){
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
      res.render('payments', {data_left: flow_left, data_right: flow_right, view: "split" });       
    }) 
  })
});

module.exports = router;

