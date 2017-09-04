var fs = require('fs');
var method = Profile.prototype
var async = require('async');
var oracledb = require('oracledb');


interface_type = function(type){
  var types = [ 'OFAC', 
                'BI',
                'CDB',
                'EXT_FX',
                'POSTING',
                'ADVISING'];
  var type_desc = {
    'OFAC' : "Compliance",
    'BI': "Balance Inquiry",
    'CDB': "Account Lookup",
    'EXT_FX': "FX Engine",
    'POSTING': "Accounting System",
    'ADVISING': "Advising"
  }
  return (types.indexOf(type) > -1) ? type_desc[type] : null; 
}

interface_sub_type = function(sub_type){
  var sub_type_desc = {   
      "COMPLIANCE_IN": "Compliance Incoming",
      "COMPLIANCE_OUT_PREDEBIT": "Compliance Outgoing Pre Debit",
      "COMPLIANCE_OUT_PREPOSTING": "Compliance Outgoing Pre Posting",
      "MP_BULK_COMPLIANCE_IN_RESPONSE": "Mass Payment Bulk Compliance Response (IN)",
      "MP_COMPLIANCE_IN_RESPONSE": "Mass Payment Compliance Response (IN)",
      "MP_COMPLIANCE_OUT_REQUEST": "Mass Payment Compliance Request (OUT)",
      "NPP_COMPLIANCE_OUT_PREDEBIT": "NPP Compliance Outgoing Pre Debit",
      "NPP_COMPLIANCE_OUT_PREPOSTING": "NPP Compliance Outgoing Pre Posting",
      "UPI_COMPLIANCE": "UPI Compliance",
      "BI_IN": "Balance Inquiry Incoming",
      "FNDT_BI_EARMARK_RLS": "Funding Balance Inquiry Earmark RLS",
      "FNDT_BI_OUT": "Funding Balance Inquiry Outgoing",
      "FNDT_BI_OUT_EARMARK": "Funding Balance Inquiry Earmark Outgoing",
      "FNDT_BI_RESPONSE": "Funding Balance Inquiry Response",
      "MP_BI_OUT_FOR_BLK": "Mass Payment Balance Inquiry Outgoing for Bulk",
      "MP_BI_OUT_FOR_SNGL": "Mass Payment Balance Inquiry Outgoing for Single",
      "MP_BI_OUT_FOR_SNGL_EARMARK": "Mass Payment Balance Inquiry Outgoing for Single Earmark",
      "BLK_HV_POSTING_OUT": "Bulk High Value Posting Outgoing",
      "BLK_MP_POSTING_OUT": "Bulk Mass Payment Posting Outgoing",
      "CLEARING_POSTNG_REQ": "Clearing Posting Request",
      "CREDIT_POSTNG_REQ": "Credit Posting Request",
      "DEBT_POSTNG_REQ": "Debit Posting Request",
      "EDO_POSTING_NEW": "New EDO Posting",
      "EDO_SINGLE_STORE": "EDO Single Store",
      "HV_POST_OUT": "High Value Posting Outgoing",
      "INUPI_MSG_POSTING_OUT": "Incoming UPI Posting Outgoing",
      "MP_POST_OUT": "Mass Payment Posting Outgoing",
      "MSG_POSTING_ RESPONSE": "Message Posting Response",
      "MSG_POSTING_OUT": "Message Posting Outgoing",
      "MTFR_POSTING_REQ": "MTFR Posting Request",
      "MTFR_POSTING_RESP": "MTFR Posting Response",
      "NPP_POSTING_REQUEST": "NPP Posting Request",
      "NPP_POSTING_RESPONSE": "NPP Posting Response",
      "POSTING_IN": "Posting Incoming",
      "POSTING_OUT": "Posting Outgoing",
      "ACCLKP_IN": "Incoming CDB",
      "BLKMNDTDBT": "Debit bulk CDB",
      "CR": "Credit CDB",
      "CR_BLK": "Credit bulk CDB",
      "CR_MP_CDB_SYNC": "Credit Mass Payment CDB Sync",
      "CR_UCPP": "Credit UCPP",
      "DEB_MND": "Debit Mandate ",
      "DR": "Debit CDB",
      "DR_BLK": "Debit Bulk CDB",
      "DR_MP_CDB_SYNC": "Debit Mass Payment CDB Sync",
      "DR_UCPP": "Debit UCPP",
      "MNDT_ACCLKP_IN": "Mandate CDB Incoming",
      "TCH_ACCLKP_IN": "TCH CDB Incoming",
      "ADVISING": "Advising"
    }

    return  sub_type_desc[sub_type]; 
}

channel_type  = function(type){
  var types = [ 'BULK', 
                'MASSPMNTS',
                'SWIFT_IN',
                'FEEDER_UPI',
                'FEEDER',
                'RITS',
                'RENTAS2MYR_IN',
                'SPBI',
                'CLEARING',
                'ACK',
                'MOP',
                'STAT_DATA'];
  var type_desc = {
    'BULK' : 'Bulk payments', 
    'MASSPMNTS': 'Mass Payments',
    'SWIFT_IN': 'SWIFT',
    'FEEDER': 'Feeder',
    'RITS' : 'From RITS',
    'RENTAS2MYR_IN': 'From RENTAS',
    'SPBI' : 'From SPBI',
    'CLEARING': 'With Clearing systems',
    'ACK': 'Acknowledgment channel',
    'MOP': 'With different MOPs',
    'STAT_DATA': 'Static Data Upload'
  }

  return (types.indexOf(type) > -1) ? type_desc[type] : null;
}

get_type = function(select, obj){
	type = obj.INTERFACE_TYPE;	
	if(select == 'all'){
		return type;
	}

  if(obj["REQUEST_PROTOCOL"] == "STORE_REQUEST" || 
     obj["RESPONSE_PROTOCOL"] =="STORE_REQUEST"){
    return null;
  }

  var desc = interface_type(type);
  if(desc == null) {desc = channel_type(type);}
  return desc;
};

get_status_class = function(obj){
    var status = "secondary"; 
    var alles_gut = true;

    if (obj["INTERFACE_TYPE"] == 'ACK'){
      return status;
    }

    if (obj["INTERFACE_SUB_TYPE"] == "EFX_IN"){
      alles_gut = false;
    }

    if (alles_gut){
      status = "success"
    }else{
      status = "danger";
    }
    return status;
};

var dbConfig = {
    user          : "HVPRDT_465_NFT01",
    password      : "payplus1",
    connectString : "GPP12C"
  };

doconnect = function(cb) {
  oracledb.getConnection(
    {
      user          : dbConfig.user,
      password      : dbConfig.password,
      connectString : dbConfig.connectString
    },
    cb);
};

dorelease = function(conn) {
  conn.close(function (err) {
    if (err)
      console.error(err.message);
  });
};

var query = "SELECT ROWNUM, OFFICE, INTERFACE_NAME, INTERFACE_TYPE, INTERFACE_SUB_TYPE, REQUEST_DIRECTION, INTERFACE_STATUS, REQUEST_PROTOCOL, REQUEST_CONNECTIONS_POINT, REQUEST_FORMAT_TYPE, RESPONSE_PROTOCOL, RESPONSE_CONNECTIONS_POINT, RESPONSE_FORMAT_TYPE FROM interface_types "
doquery_data = function (conn,cb) {
  conn.execute(
    query,
    function(err, result)
    {
      console.log("Call back from execute" + err);
      console.log("Call back from execute" + result.metaData);
      if (err) {
        console.log("NU NAH!!!")
        return cb(err, conn, null);
      } else {        
        console.log("1 ---------------" + result.metaData)
        var data = []
        console.log("2 ---------------" + result.rows.length)
        for (var i = 0; i < result.rows.length; i++  ){
          console.log("3 ---------------" + i)
          var obj = {}
          console.log("4 ---------------" + result.metaData.length)
          for(var k = 0; k< result.metaData.length; k++ ){
            console.log("5 ---------------" + k )
            console.log("5.1 ---------------" + result.rows[i][k])
            console.log("5.2 ---------------" + result.metaData[k]["name"])
            obj[result.metaData[k]["name"]] = result.rows[i][k];
            console.log("6 ---------------" + obj)
          }
          console.log("7 ---------------" + obj)
          data.push(obj);
          console.log("9 ---------------" + data)
        }
        console.log("10 ---------------" + data)
        return cb(null, conn, data);
      }
    });
};


function Profile(type){
  this._keys = null; 
  this._values = null;
  this._collection = [];  
  this._type = type;
}

method.load = function(){
  var filePath = './interfaces_list_3.json';
  var data = JSON.parse(fs.readFileSync(filePath, 'utf8')); 
  for(var i=0; i<data.length; i++ ){    
    if(this._type == 'interface'){
      if( interface_type(data[i]["INTERFACE_TYPE"]) != null ){
        this._collection.push(data[i]);
      }
      continue;
    }

    if(this._type == 'channel'){
      if( channel_type(data[i]["INTERFACE_TYPE"]) != null ){
        this._collection.push(data[i]);
      }
      continue;
    }

    if(this._type == 'all'){
      this._collection.push(data[i]);
    }
  }
}

method.load_from_db = function(cb){
 async.waterfall(
  [
    doconnect,
    doquery_data
  ],
  function (err, conn, data) {
    console.log("Load from DB data as Hash: " + data);
    if (err) { console.error("In waterfall error cb: ==>", err, "<=="); }    
    if (conn){ dorelease(conn); }
    if (data != null){
     for(var i=0; i<data.length; i++ ){    
        console.log("Data is " + data[i])
        if(this._type == 'interface'){
          if( interface_type(data[i]["INTERFACE_TYPE"]) != null ){
            this._collection.push(data[i]);
          }
          continue;
        }

        if(this._type == 'channel'){
          if( channel_type(data[i]["INTERFACE_TYPE"]) != null ){
            this._collection.push(data[i]);
          }
          continue;
        }

        if(this._type == 'all'){
          this._collection.push(data[i]);
        }
      }
     console.log("Populated "+ this._collection);
    }
  });
}

method.reset = function(){
  this._keys = null; 
  this._values = null;
  this._collection = null;    
};

method.keys = function(select = 'active') {     
  this._keys = [];     
  var obj = null;
  for (var i = 0; i< this._collection.length; i++  ) {      
    obj = this._collection[i];
    var key = get_type(select, obj);      
    if (key == null){ continue; }

    if(this._keys.indexOf(key) == -1){
      this._keys.push(key);
    }         
  }  

  return this._keys;
};

method.values = function(select = 'active') {    
  var keys = this._keys;
  this._values = new Array(keys.length).fill(null);
  var obj = null;
  for (var i = 0; i< this._collection.length; i++  ) {      
    var obj = this._collection[i];
    var key = get_type(select, obj);

    if (key == null){ continue; }
    var ind = keys.indexOf(key);
    if(this._values[ind] == null){
      this._values[ind] = [];
    }
    obj["DESCRIPTION"] = this.get_sub_type_desc(obj["INTERFACE_SUB_TYPE"])
    this._values[ind].push(obj);
  }  

  return this._values;
};

method.folders = function(select = 'active'){
  var folders = [];
  for (var i = 0; i< this._collection.length; i++  ) {      
    var obj = this._collection[i];
    folders.push(obj["REQUEST_CONNECTIONS_POINT"]);
    folders.push(obj["RESPONSE_CONNECTIONS_POINT"])
  }
  return folders;
};

method.select = function(row_id){    
  var obj = null;  
  if( row_id == 0 ) { return obj; }

  for (var i = 0; i< this._collection.length; i++  ) {      
    var obj = this._collection[i];
    if(obj["ROW"] == row_id){
      return obj;
    }
  }  
  return obj;
};

method.select_similarIds = function(type, sub_type){    
  var similars = [];  
  for (var i = 0; i< this._collection.length; i++  ) {      
    var obj = this._collection[i];
    if(obj["INTERFACE_TYPE"] == type && obj["INTERFACE_SUB_TYPE"] == sub_type ){
      similars.push(obj["ROW"]);
    }
  }  
  return similars;
};

method.to_flowitem = function(row_id, type){
  var profile = this.select(row_id);
  return {
    "id": row_id,
    "type": type,
    "direction": profile["REQUEST_DIRECTION"],
    "status_class": get_status_class(profile),
    "title" : profile["INTERFACE_SUB_TYPE"],
    "request_protocol": profile["REQUEST_PROTOCOL"],
    "request_connections_point": profile["REQUEST_CONNECTIONS_POINT"],
    "response_connections_point": profile["RESPONSE_CONNECTIONS_POINT"]
  }
};

method.get_interface_type = function(type){
  return interface_type(type) ;
};

method.get_channel_type = function(type){
  return channel_type(type)
};

method.get_sub_type_desc = function(sub_type){
  return interface_sub_type(sub_type);
};

module.exports = Profile;