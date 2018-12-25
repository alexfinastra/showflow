var method = Storage.prototype

function Storage(collection = 'payments'){  
	this.collection = collection
}

method.getDoc = function (search, cb){
  console.log("-----> getDoc search parameters are:" + JSON.stringify(search));
	
	db.collection(this.collection).findOne(search, function(err, doc) {
    console.log("-----> Check if document exists :" + err + " result :" + doc == null);
    if (err == null) {
      if(doc == null){        
        console.log("-----> There is no Doc with such parameters in storage !!!! :(");
      	cb(null);
      } else {
      	console.log("-----> Find a Doc in the storage !!!! :)");
        cb(doc);
      }
    } else {
    	console.log("-----> Get error form db " + err)
      return null;
    }
  });
}

method.newDoc = function(newDoc, cb){
	console.log("-----> newDoc with following MID:" + newDoc["mid"]);
	db.collection(this.collection).insertOne(newDoc, function(err, doc) {	
    if (err) {
      console.log("-----> Get error form db " + err)
      cb(null);
    } else {
      console.log("-----> New document created " + doc );      
      cb(doc);
    }
  });
}

method.updateDoc = function(conditons, updatedDoc, cb){
	console.log("-----> setDoc conditons are:" + JSON.stringify(conditons));
	db.collection(this.collection).updateOne(conditons, {$set: updatedDoc}, { upsert: true }, function(err, doc) {	
    if (err) {
      console.log("-----> Get error form db " + err)
      cb(null);
    } else {
      console.log("-----> New document created " + doc );      
      cb(doc);
    }
  });
}

method.listDoc = function(select, where, cb){
	console.log("-----> listDoc conditons are:" + JSON.stringify(filter));
	 db.collection(this.collection).find(where, select).toArray(function(err, docs) {     
    if (err == null) {
      if(docs == null || docs.length == 0 ){        
        console.log("-----> There is no docs answering the filter !!!! :(");
      	cb([]);
      } else {
      	console.log("-----> The number of found Docs are :) " + docs.length);
        cb(docs);
      }
    } else {
    	console.log("-----> Get error form db " + err)
      return null;
    }
  });
}

module.exports = Storage;

