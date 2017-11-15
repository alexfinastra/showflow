var fs = require('fs');
var path = require('path');
var json = require('json-file');
var oracledb = require('oracledb');
var dbConfig = require('../db/dbconfig.js');

interface_type = [ 'OFAC', 
                'BI',
                'CDB',
                'EXT_FX',
                'POSTING',
                'ADVISING'];


interface_type_desc = function(type){
  var type_desc = {
    'OFAC' : "Compliance",
    'BI': "Balance Inquiry",
    'CDB': "Account Lookup",
    'EXT_FX': "FX Engine",
    'POSTING': "Accounting System",
    'ADVISING': "Advising"
  }
  return type_desc[type];
}


interface_subtype_desc = function(sub_type){
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

channel_type  =  [ 'ACK',
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
                //'MASSPMNTS',
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

channel_type_desc  = function(type){
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
    //'MASSPMNTS': 'Mass Payments',
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

  return type_desc[type]
}


description = function(obj){
	var type = obj["INTERFACE_TYPE"],
      desc = null;	
	
  if(obj["REQUEST_PROTOCOL"] == "STORE_REQUEST" || 
     obj["RESPONSE_PROTOCOL"] =="STORE_REQUEST"){
    return null;
  }

  var desc = interface_type_desc(type);
  if(desc == null) {desc = channel_type_desc(type);}
  return desc;
};


var folders = function(data, select=''){
  var folders = [];
  for (var i = 0; i< data.length; i++  ) {      
    var obj = profile;
    
    if(obj["REQUEST_CONNECTIONS_POINT"] && obj["REQUEST_CONNECTIONS_POINT"].indexOf(select) > -1){
      folders.push(obj["REQUEST_CONNECTIONS_POINT"]);
    }
    if(obj["RESPONSE_CONNECTIONS_POINT"] && obj["RESPONSE_CONNECTIONS_POINT"].indexOf(select) > -1){
      folders.push(obj["RESPONSE_CONNECTIONS_POINT"])
    }
  }
  return folders;
};

var to_flowitem = function(profile){
  var type = "";
  if(interface_type.indexOf(profile["INTERFACE_TYPE"]) != -1 ){ type = 'interface' }
  else if(channel_type.indexOf(profile["INTERFACE_TYPE"]) != -1 ){ type = 'channel' }
  return {
            step: 0,
            type: type,
            title: profile["INTERFACE_NAME"].split('_').join(" "),
            description: profile["DESCRIPTION"],
            uid: profile["UID_INTERFACE_TYPES"],
            request_protocol: profile["REQUEST_PROTOCOL"],
            direction: profile["REQUEST_DIRECTION"],
            request_connections_point: profile["REQUEST_CONNECTIONS_POINT"],
            response_connections_point: profile["RESPONSE_CONNECTIONS_POINT"],
            interface_name: profile["INTERFACE_NAME"],
            status_class: "secondary",
            office: profile["OFFICE"], 
            interface_type: profile["INTERFACE_TYPE"], 
            interface_sub_type: profile["INTERFACE_SUB_TYPE"],  
            request_format_type: profile["REQUEST_FORMAT_TYPE"], 
            response_protocol: profile["RESPONSE_PROTOCOL"], 
            response_format_type: profile["RESPONSE_FORMAT_TYPE"], 
            response_format_type: profile["RESPONSE_FORMAT_TYPE"]
         };
}

var populate_properties = function(idata = null){
  var properties = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  properties.readSync();
  var all = "INTERFACE_NAME, OFFICE, INTERFACE_TYPE, INTERFACE_SUB_TYPE, REQUEST_DIRECTION, MESSAGE_WAIT_STATUS, INTERFACE_STATUS, MESSAGE_STOP_STATUS, STOP_AFTER_CONN_EXCEPTION, INTERFACE_MONITOR_INDEX, REQUEST_PROTOCOL, REQUEST_CONNECTIONS_POINT, REQUEST_FORMAT_TYPE, REQUEST_STORE_IND, RESPONSE_PROTOCOL, RESPONSE_CONNECTIONS_POINT, RESPONSE_FORMAT_TYPE, RESPONSE_STORE_IND, UID_INTERFACE_TYPES, NOT_ACTIVE_BEHAVIOUR, REC_STATUS, ASSOCIATED_SERVICE_NAME, NO_OF_LISTENERS, NON_JMS_RECEPIENT_IND, HANDLER_CLASS, BUSINESS_OBJECT_CLASS, BUSINESS_OPERATION, PMNT_SRC, CUSTOM_PROPERTIES, WAIT_BEHAVIOUR, BATCH_SIZE, SUPPORTED_APP_IDS, BACKOUT_INTERFACE_NAME, BULK_INTERFACE_NAME, APPLICATION_PROTOCOL_TP, REQUEST_GROUP_NM, SEQUENCE_HANDLER_CLASS, RESPONSE_INTERFACE, RESPONSE_TIMEOUT_MILLIS, RESPONSE_TIMEOUT_RETRY_NUM, HEARTBEAT_INTERFACE_NAME, INTERFACE_STOPPED_SOURCE, RESEND_ALLOWED, DESCRIPTION, THROTTLING_TX, THROTTLING_MILLIS, BULKING_PURPOSE, ENABLED_GROUPS,RESUME_SUPPORTED, EVENT_ID_GENERATION, BULK_RESPONSE_BY_ORIG_CHUNK, INVALID_RESPONSE_IN, PCI_DSS_COMPLIANT, BULKING_TRIGGER_METHOD, IS_BULK"  
  var sql = "select " + all + " from INTERFACE_TYPES" ;
  
  "use strict";
  oracledb.getConnection(dbConfig, function (err, connection) {
    if (err) {
        console.log("Error connecting to DB" + err.message);
        return;
    }
    connection.execute(sql, [], {
            maxRows: 300,
            outFormat: oracledb.OBJECT // Return the result as Object
        },
        function (err, result) {
            if (err) {
              console.log("Error connecting to DB" + err.message + " -- "+ err.message.indexOf("ORA-00001") > -1 ? "User already exists" : "Input Error");
            } 
            else {
              console.log("----------- > Results are " + result.rows.length)                
              for(var i=0; i<result.rows.length; i++){
                var profile = result.rows[i];                
                var item = properties.get(profile["UID_INTERFACE_TYPES"])
                if(item != null){
                  properties.set(profile["UID_INTERFACE_TYPES"] + ".active", ((profile["INTERFACE_STATUS"] == "ACTIVE") ? true : false)) 
                  properties.set(profile["UID_INTERFACE_TYPES"] + ".flow_item", to_flowitem(profile)) 
                }else{                  
                  properties.set(profile["UID_INTERFACE_TYPES"], {
                    active: ((profile["INTERFACE_STATUS"] == "ACTIVE") ? true : false),
                    connected: false,
                    to_schemas: "",
                    from_schemas: "",
                    flow_item: to_flowitem(profile),
                    rule: [],
                    auditmsg: [],
                    logpattern: [],
                    mid: []
                  })                  
                }
              }
              properties.writeSync();
            }
            // Release the connection
            connection.release(
              function (err) {
                  console.log( " 7 ========>>>> Release connection : " + err );
                  if (err) {
                      console.error(err.message);                       
                  } else {
                      console.log("Run sql query from script : Connection released");
                      return;
                  }
              });
        });            
  });
  
}
module.exports  = { populate_properties, interface_type_desc, interface_subtype_desc, channel_type_desc, description, to_flowitem, interface_type, channel_type};

