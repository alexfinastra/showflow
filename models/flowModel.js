var fs = require('fs');
var path = require('path');
var Profile = require( path.resolve( __dirname, "./profileModel.js" ) );

var method = Flow.prototype



get_filename = function(file_key){
  const files = {
      'oscb': './views/flows/outward_single_customer_bank.json',
      'iscb': './views/flows/HV inward single customer bank/inward_single_customer_bank.json',
      'or': './views/flows/outwards_returns.json',        
      'ir': './views/flows/inwards_returns.json',
      'ibp': './views/flows/inward_bulk_payments.json',
      'ntr': './views/flows/notice_to_receive.json',
      'mpoct': './views/flows/mp_outward_credit_transfer.json',
      'mpict': './views/flows/mp_inward_credit_transfer.json',
      'mpcfoct': './views/flows/mp_cancellation_for_outward_credit_transfer.json',
      'mporrfict': './views/flows/mp_outward_return_reject_for_inward_ct.json',
      'mpirfoct': './views/flows/mp_incoming_return_for_outward_ct.json',
      'mpodd': './views/flows/mp_outward_direct_debit.json',
      'mpidd': './views/flows/mp_inward_direct_debit.json',
      'mporfcdd': './views/flows/mp_outward_request_for_cancellation_dd.json',
      'mpirfcdd': './views/flows/mp_inward_request_for_cancellation_dd.json',
      'mpirdd': './views/flows/mp_incoming_reversal_dd.json',
      'mpordd': './views/flows/mp_outward_reject_dd.json',
      'mporrdd': './views/flows/mp_outward_return_refund_dd.json',
      'mpirdd': './views/flows/mp_incoming_reject_dd.json',
      'mpirrdd': './views/flows/mp_incoming_return_refund_dd.json'
  }
  return files[file_key];
}


function Flow(flow_key){

  var filePath = get_filename(flow_key);
  console.log("File Path for the flow: " + filePath)
  this._flow_template = JSON.parse(fs.readFileSync(filePath, 'utf8'));  
  
  this._flow = {};
  this._flow["name"] = this._flow_template["name"]
  this._flow["items"] = [];
  
  this.populate_items();
}

method.populate_items = function(){  
  var template_items = this._flow_template["flowitems"];
  if(template_items == null  && template_items.length == 0 ){return;}

  for(var j=0; j< template_items.length; j++){
    var item = template_items[j];
    var profile = new Profile(item["type"]);
    profile.load()
    var selected = profile.select_similarIds(item["interface_type"], item["interface_sub_type"]);
    if (selected.length == 0){ continue; }

    var current = null;
    var similars = [];
    for(var i=0; i < selected.length; i++){
      if( current == null){
        current  = profile.to_flowitem(selected[i], item["type"]);               
      }
      similars.push(profile.to_flowitem(selected[i], item["type"]));
    }

    this._flow["items"].push({
      "current" : current,
      "similars" : similars
    });
  }
};

module.exports = Flow;