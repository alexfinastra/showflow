var express = require('express');
var router = express.Router();
var async = require('async')
var json = require('json-file');
var authentication_mdl = require('../middlewares/authentication');

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
        obj = services.get(uid + ".floW_item")
        key = obj["interface_type"]

        if(key == null || key == undefined) { continue;}    
        if(!(key in res)){ res[key] = []}        
        res[key].push(obj);
    }
    return res;
}

router.get('/', function(req, res, next) {
  var data = group_profiles(result.rows);
  res.render('services_list', { identity: identity, data: data });
});

router.get('/profile/:uid', function(req, res){
	uid = req.params.uid
	var services = new json.File(appRoot + "/db/properties/services_index.json" );
  services.readSync();
	res.render('service_profile', { title: 'SOAP Service - ' + services.get(req.params.uid + ".flow_item.interface_type"), service: services.get(req.params.uid) });
})

router.post('/execute/:id', function(req, res){
	uid = req.params["id"]
	res.redirect('/webservices/profile/'+uid);
})

module.exports = router;
