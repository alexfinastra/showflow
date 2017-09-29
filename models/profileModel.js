var fs = require('fs');
var method = Profile.prototype
var async = require('async');
var path = require('path');
var json = require('json-file');
var oracledb = require('oracledb');
var dbConfig = require('../db/dbconfig.js');

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
  var types = [ 'ACK',
                'AC_IN',
                'AC_IN_ONUS',
                'AC_MND_TT1_ONUS_IN',
                'AC_MND_TT1_OW_IN',
                'AC_MND_TT2_ONUS_IN',
                'AC_OUT',
                'BULK',
                'BULK_MNDT_FROM_AC',
                'CEQ',
                'CLEARING',
                'CLEARING_ACK_IP_DBTR',
                'CLEAR_ACK',
                'CLEAR_ACK_IP',
                'CLEAR_ACK_SNM',
                'COMPL_SNM',
                'CRQ',
                'CUST_ACK',
                'DBLCHECK',
                'DBLCHECK_COMPL',
                'DEBULK_MSG_IN',
                'DEBULK_MSG_OUT',
                'FD_SWIFT',
                'FEEDER',
                'FEEDER_TCH',
                'GFMS',
                'GPP_TOKEN_VAULT',
                'IND_MNDT_FROM_AC',
                'MASSPMNTS',
                'MNDT_AUTH',
                'MNDT_AUTH_IN',
                'MOP',
                'MQ',
                'NAK',
                'NOTIFY',
                'NPPMSG_IN',
                'NPRTY_MNDT_FR_CHNL',
                'PRFL_ACTNS',
                'PRTY_MNDT_FR_CHNL',
                'REBULK',
                'RENTAS2MYR_IN',
                'RETURN_FUNDS',
                'RITS',
                'SPBI',
                'SPBI_OUT',
                'SPEI',
                'SPEI_OUT',
                'SPI',
                'SPI_OUT',
                'STAGING_TASK_IN',
                'STAGING_TASK_OUT',
                'SWIFT_IN',
                'TCH_RTPS_IP_IN',
                'STAT_DATA'];

  var type_desc = {
    'ACK': 'Acknowledgment channel',
    'AC_IN': 'With Clearing systems',
    'AC_IN_ONUS': 'With Clearing systems',
    'AC_MND_TT1_ONUS_IN': 'With Clearing systems',
    'AC_MND_TT1_OW_IN': 'With Clearing systems',
    'AC_MND_TT2_ONUS_IN': 'With Clearing systems',
    'AC_OUT': 'With Clearing systems',
    'BULK': 'Bulk payments',
    'BULK_MNDT_FROM_AC': 'Bulk payments',
    'CEQ': 'With different MOPs',
    'CLEARING': 'With Clearing systems',
    'CLEARING_ACK_IP_DBTR': 'With Clearing systems',
    'CLEAR_ACK': 'Acknowledgment channel',
    'CLEAR_ACK_IP': 'Acknowledgment channel',
    'CLEAR_ACK_SNM': 'Acknowledgment channel',
    'COMPL_SNM': 'Messaging',
    'CRQ': 'With different MOPs',
    'CUST_ACK': 'Acknowledgment channel',
    'DBLCHECK': 'Messaging',
    'DBLCHECK_COMPL': 'Messaging',
    'DEBULK_MSG_IN': 'Bulk payments',
    'DEBULK_MSG_OUT': 'Bulk payments',
    'FD_SWIFT': 'Feeder',
    'FEEDER': 'Feeder',
    'FEEDER_TCH': 'Feeder',
    'GFMS': 'With different MOPs',
    'GPP_TOKEN_VAULT': 'Messaging',
    'IND_MNDT_FROM_AC': 'With Clearing systems',
    'MASSPMNTS': 'Mass Payments',
    'MNDT_AUTH': 'With Clearing systems',
    'MNDT_AUTH_IN': 'With Clearing systems',
    'MOP': 'With different MOPs',
    'MQ': 'Messaging',
    'NAK': 'Acknowledgment channel',
    'NOTIFY': 'Acknowledgment channel',
    'NPPMSG_IN': 'With Clearing systems',
    'NPRTY_MNDT_FR_CHNL': 'With Clearing systems',
    'PRFL_ACTNS': 'With Clearing systems',
    'PRTY_MNDT_FR_CHNL': 'With Clearing systems',
    'REBULK': 'Bulk payments',
    'RENTAS2MYR_IN': 'With Clearing systems',
    'RETURN_FUNDS': 'Messaging',
    'RITS': 'With Clearing systems',
    'SPBI': 'With Clearing systems',
    'SPBI_OUT': 'With Clearing systems',
    'SPEI': 'With Clearing systems',
    'SPEI_OUT': 'With Clearing systems',
    'SPI': 'With Clearing systems',
    'SPI_OUT': 'With Clearing systems',
    'SWIFT_IN': 'With different MOPs'
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

get_status_class = function(properties, obj){
    var status = "secondary"; 

    if(properties.get(obj["UID_INTERFACE_TYPES"])["connected"] == true){
      status = "success"
    }

    if(properties.get(obj["UID_INTERFACE_TYPES"])["connected"] == "error") {
      status = "danger";
    }

    return status;
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

//var query = "SELECT ROWNUM, OFFICE, INTERFACE_NAME, INTERFACE_TYPE, INTERFACE_SUB_TYPE, REQUEST_DIRECTION, INTERFACE_STATUS, REQUEST_PROTOCOL, REQUEST_CONNECTIONS_POINT, REQUEST_FORMAT_TYPE, RESPONSE_PROTOCOL, RESPONSE_CONNECTIONS_POINT, RESPONSE_FORMAT_TYPE, UID_ FROM interface_types "
var query = "SELECT ROWNUM, INTERFACE_NAME, OFFICE, INTERFACE_TYPE, INTERFACE_SUB_TYPE, REQUEST_DIRECTION, MESSAGE_WAIT_STATUS, INTERFACE_STATUS, MESSAGE_STOP_STATUS, STOP_AFTER_CONN_EXCEPTION, INTERFACE_MONITOR_INDEX, REQUEST_PROTOCOL, REQUEST_CONNECTIONS_POINT, REQUEST_FORMAT_TYPE, REQUEST_STORE_IND, RESPONSE_PROTOCOL, RESPONSE_CONNECTIONS_POINT, RESPONSE_FORMAT_TYPE, RESPONSE_STORE_IND, UID_INTERFACE_TYPES, NOT_ACTIVE_BEHAVIOUR, REC_STATUS, ASSOCIATED_SERVICE_NAME, NO_OF_LISTENERS, NON_JMS_RECEPIENT_IND, HANDLER_CLASS, BUSINESS_OBJECT_CLASS, BUSINESS_OPERATION, PMNT_SRC, CUSTOM_PROPERTIES, WAIT_BEHAVIOUR, BATCH_SIZE, SUPPORTED_APP_IDS, BACKOUT_INTERFACE_NAME, BULK_INTERFACE_NAME, APPLICATION_PROTOCOL_TP, REQUEST_GROUP_NM, SEQUENCE_HANDLER_CLASS, RESPONSE_INTERFACE, RESPONSE_TIMEOUT_MILLIS, RESPONSE_TIMEOUT_RETRY_NUM, HEARTBEAT_INTERFACE_NAME, INTERFACE_STOPPED_SOURCE, RESEND_ALLOWED, DESCRIPTION, THROTTLING_TX, THROTTLING_MILLIS, BULKING_PURPOSE, ENABLED_GROUPS,RESUME_SUPPORTED, EVENT_ID_GENERATION, BULK_RESPONSE_BY_ORIG_CHUNK, INVALID_RESPONSE_IN, PCI_DSS_COMPLIANT, BULKING_TRIGGER_METHOD, IS_BULK FROM INTERFACE_TYPES"
doquery_data = function (conn,cb) {
  conn.execute(
    query,
    {},
    {maxRows: 300},
    function(err, result)
    {
       if (err) {
        console.log("NU NAH!!!")
        return cb(err, conn, null);
      } else {        
        var data = []
        console.log("2 ---------------" + result.rows.length)
        for (var i = 0; i < result.rows.length; i++  ){
          var obj = {}
          for(var k = 0; k< result.metaData.length; k++ ){
            obj[result.metaData[k]["name"]] = result.rows[i][k];
          }
          data.push(obj);
        }
        return cb(null, conn, data);
      }
    });
};


function Profile(type){
  this._keys = null; 
  this._values = null;
  this._collection = [];  
  this._type = type;
  this._properties = new json.File(path.resolve( __dirname, "./profileProperties.json" ));
  this._properties.readSync();

}

method.reload = function(){
  this._properties.readSync();
  if(oracle == true){
    this.load_from_db(this, function(){})
  }else{
    this.load();
  }
}

method.load = function(){
  var filePath = './interfaces_list_3.json';
  var data = JSON.parse(fs.readFileSync(filePath, 'utf8')); 
  this.reset();

  for(var i=0; i<data.length; i++ ){    
    if (this._properties.get(data[i]["UID_INTERFACE_TYPES"]) == null ||
        this._properties.get(data[i]["UID_INTERFACE_TYPES"])["active"] == false){
      continue;
    }

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

method.update_db = function(query){
  oracledb.getConnection(
  {
    user          : dbConfig.user,
    password      : dbConfig.password,
    connectString : dbConfig.connectString
  },
  function(err, connection)
  {
    if (err)
    {
      console.error(err);
      return;
    }

    connection.execute(
      query,
      { autoCommit: true },
      function(err, result)
      {
        if (err)
        {
          console.error(err);
          return;
        }
        console.log(result.outBinds);
      });
  });
}

method.load_from_db = function(profile, cb){ 
 async.waterfall(
  [
    doconnect,
    doquery_data
  ],
  function (err, conn, data) {
    //console.log("Load from DB data as Hash: " + data);
    if (err) { console.error("In waterfall error cb: ==>", err, "<=="); 
      if (conn){ dorelease(conn); }
      cb(err, null)  
    }      
    if (data != null){
     profile.reset();
     //console.log("Current object is " + profile)    
     for(var i=0; i<data.length; i++ ){
        console.log("Load from DB data as Hash: " + data[i]);    
        if (this._properties.get(data[i]["UID_INTERFACE_TYPES"]) == null ||
           this._properties.get(data[i]["UID_INTERFACE_TYPES"])["active"] == false){
          continue;
        }

        //console.log("Data iterator " + i)
        if(profile._type == 'interface'){
          if( interface_type(data[i]["INTERFACE_TYPE"]) != null ){
            profile._collection.push(data[i]);
          }
          continue;
        }

        if(profile._type == 'channel'){
          if( channel_type(data[i]["INTERFACE_TYPE"]) != null ){
            profile._collection.push(data[i]);
          }
          continue;
        }

        if(profile._type == 'all'){
          profile._collection.push(data[i]);
        }
      }
     //console.log("Populated "+ profile._collection); 
     if (conn){ dorelease(conn); }
     cb(null, profile)    
    }
    
    if (conn){ dorelease(conn); }  
  })
}

method.reset = function(){
  this._keys = null; 
  this._values = null;
  this._collection = [];
  this._properties = new json.File(path.resolve( __dirname, "./profileProperties.json" ));
  this._properties.readSync();   
};

method.keys = function(select = 'active') {     
  this._keys = [];     
  var obj = null;
  console.log("Collection LEngth " + this._collection.length)
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

method.folders = function(select = ''){
  var folders = [];
  for (var i = 0; i< this._collection.length; i++  ) {      
    var obj = this._collection[i];
    
    if(obj["REQUEST_CONNECTIONS_POINT"] && obj["REQUEST_CONNECTIONS_POINT"].indexOf(select) > -1){
      folders.push(obj["REQUEST_CONNECTIONS_POINT"]);
    }
    if(obj["RESPONSE_CONNECTIONS_POINT"] && obj["RESPONSE_CONNECTIONS_POINT"].indexOf(select) > -1){
      folders.push(obj["RESPONSE_CONNECTIONS_POINT"])
    }
  }
  return folders;
};

method.select = function(row_id){    
  var obj = null;  
  if( row_id == 0 ) { return obj; }

  for (var i = 0; i< this._collection.length; i++  ) {      
    var obj = this._collection[i];
    if(obj["ROWNUM"] == row_id){
      return obj;
    }
  }  
  return obj;
};

method.select_by_uid = function(uid){
  var obj = null;  
  if( uid == 0 ) { return obj; }

  for (var i = 0; i< this._collection.length; i++  ) {      
    var obj = this._collection[i];
    if(obj["UID_INTERFACE_TYPES"] == uid){
      return obj;
    }
  }  
  return obj;
}

method.select_similarIds = function(type, sub_type){    
  var similars = [];  
  for (var i = 0; i< this._collection.length; i++  ) {      
    var obj = this._collection[i];
    if(obj["INTERFACE_TYPE"] == type && obj["INTERFACE_SUB_TYPE"] == sub_type ){
      similars.push(obj["ROWNUM"]);
    }
  }  
  return similars;
};

method.to_flowitem = function(profile, type){ 
  return {
    "id": profile["ROWNUM"],
    "type": type,
    "direction": profile["REQUEST_DIRECTION"],
    "status_class": get_status_class(this._properties, profile),
    "title" : profile["INTERFACE_NAME"].split("_").join(" ") ,
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

method.populate_properties = function(){
  var file = new json.File(path.resolve( __dirname, "./profileProperties.json" ));
  file.readSync();

  var data = JSON.parse(fs.readFileSync('./interfaces_list_3.json', 'utf8')); 
  for(var i=0; i<data.length; i++ ){ 
    var type = '';
    if(interface_type(data[i]["INTERFACE_TYPE"]) != null ){ type = 'interface' }
    else if(channel_type(data[i]["INTERFACE_TYPE"]) != null ){ type = 'channel' }

    if (file.get(data[i]["UID_INTERFACE_TYPES"]) == null){
      file.set(data[i]["UID_INTERFACE_TYPES"], {
        active: false,
        connected: false,
        to_schemas: "",
        from_schemas: "",
        flow_item: {
                      step: 1,
                      type: type,
                      uid: data[i]["UID_INTERFACE_TYPES"]
                   },
        rule: [],
        auditmsg: [],
        logpattern: [],
        mid: []
      })
    }
  }
  file.writeSync();
}

module.exports = Profile;