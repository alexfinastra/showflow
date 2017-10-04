var fs = require('fs');
var path = require('path');
var json = require('json-file');

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


to_flowitem = function(profile, type){ 
  return {
    "id": profile["uid"],
    "type": type,
    "direction": profile["direction"],
    "status_class": profile["status_class"],
    "title" : profile["interface_name"].split("_").join(" ") ,
    "request_protocol": profile["request_protocol"],
    "request_connections_point": profile["request_connections_point"],
    "response_connections_point": profile["response_connections_point"]
  }
};

/*
var load = function(){
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
*/

var folders = function(data, select=''){
  var folders = [];
  for (var i = 0; i< data.length; i++  ) {      
    var obj = data[i];
    
    if(obj["REQUEST_CONNECTIONS_POINT"] && obj["REQUEST_CONNECTIONS_POINT"].indexOf(select) > -1){
      folders.push(obj["REQUEST_CONNECTIONS_POINT"]);
    }
    if(obj["RESPONSE_CONNECTIONS_POINT"] && obj["RESPONSE_CONNECTIONS_POINT"].indexOf(select) > -1){
      folders.push(obj["RESPONSE_CONNECTIONS_POINT"])
    }
  }
  return folders;
};

var populate_properties = function(idata = null){
  var file = new json.File(appRoot + "/db/properties/profile_index.json" ); 
  file.readSync();

  var data = JSON.parse(fs.readFileSync('./interfaces_list_3.json', 'utf8')); 
  for(var i=0; i<data.length; i++ ){ 
    var itype = data[i]["INTERFACE_TYPE"],
        type = '';

    if(interface_type.indexOf(itype) != -1 ){ type = 'interface' }
    else if(channel_type.indexOf(itype) != -1 ){ type = 'channel' }

    if (file.get(data[i]["UID_INTERFACE_TYPES"]) == null){
        file.set(data[i]["UID_INTERFACE_TYPES"], {
        active: false,
        connected: false,
        to_schemas: "",
        from_schemas: "",
        flow_item: {
                      step: 0,
                      type: type,
                      uid: data[i]["UID_INTERFACE_TYPES"],
                      request_protocol: data[i]["REQUEST_PROTOCOL"],
                      direction: data[i]["REQUEST_DIRECTION"],
                      request_connections_point: data[i]["REQUEST_CONNECTIONS_POINT"],
                      response_connections_point: data[i]["RESPONSE_CONNECTIONS_POINT"],
                      interface_name: data[i]["INTERFACE_NAME"],
                      status_class: "secondary",
                      office: ["OFFICE"], 
                      interface_type: ["INTERFACE_TYPE"], 
                      interface_sub_type: ["INTERFACE_SUB_TYPE"],  
                      request_format_type: ["REQUEST_FORMAT_TYPE"], 
                      response_protocol: ["RESPONSE_PROTOCOL"], 
                      response_format_type: ["RESPONSE_FORMAT_TYPE"]
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
module.exports  = { populate_properties, interface_type_desc, interface_subtype_desc, channel_type_desc, description, to_flowitem};


