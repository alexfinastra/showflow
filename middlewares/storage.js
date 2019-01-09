var method = Storage.prototype

function Storage(collection = 'payments'){  
	this.collection = collection  
}

method.loadDocs = function(where, cb){
  console.log("-----> [" +this.collection+ "] loadDocs all from this collection with where :" + JSON.stringify(where) );

  db.collection(this.collection).find(where).toArray(function(err, docs) {     
    if (err == null) {
      if(docs == null || docs.length == 0 ){        
        console.log("-----> There is no docs answering the where !!!! :(");
        cb([]);
      } else {
        console.log("----->  The number of found Docs are :) " + docs.length);
        cb(docs);
      }
    } else {
      console.log("-----> Get error form db " + err)
      return null;
    }
  });
}


method.getDoc = function(search, cb){
  console.log("-----> [" +this.collection+ "] getDoc search parameters are:" + JSON.stringify(search));
	
	db.collection(this.collection).findOne(search, function(err, doc) {
    console.log("----->  Check if document exists :" + err + " result :" + doc == null);
    if (err == null) {
      if(doc == null){        
        console.log("----->  There is no Doc with such parameters in storage !!!! :(");
      	cb(null);
      } else {
      	console.log("----->  Find a Doc in the storage !!!! :)");
        cb(doc);
      }
    } else {
    	console.log("----->  Get error form db " + err)
      return null;
    }
  });
}

method.newDoc = function(newDoc, cb){
	console.log("-----> [" +this.collection+ "] newDoc with following ID:");
	db.collection(this.collection).insertOne(newDoc, function(err, doc) {	
    if (err) {
      console.log("----->  Get error form db " + err)
      cb(null);
    } else {
      console.log("----->  New document created "  );      
      cb(doc);
    }
  });
}

method.updateDoc = function(conditons, updatedDoc, cb){
	console.log("-----> [" +this.collection+ "] setDoc conditons are:" + JSON.stringify(conditons));
	db.collection(this.collection).updateOne(conditons, {$set: updatedDoc}, { upsert: true }, function(err, doc) {	
    if (err) {
      console.log("----->  Get error form db " + err)
      cb(null);
    } else {
      console.log("----->  Document was updated "   );      
      cb(doc);
    }
  });
}

method.listDoc = function(select, where, order, cb){
  console.log("-----> listDoc for " + this.collection);

	db.collection(this.collection).find(where, select).limit( 35 ).sort(order).toArray(function(err, docs) {     
    if (err == null) {
      if(docs == null || docs.length == 0 ){        
        console.log("----->  There is no docs answering the where !!!! :(");
      	cb([]);
      } else {
      	console.log("----->  The number of found Docs are :) " + docs.length);
        cb(docs);
      }
    } else {
    	console.log("-----> Get error form db " + err)
      return null;
    }
  });
}

module.exports = Storage;

