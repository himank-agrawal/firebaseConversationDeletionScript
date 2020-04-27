/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const {Storage} = require('@google-cloud/storage');
//  const storage = new Storage();
admin.initializeApp({
    "projectId": "gi-diana-165",
    "databaseURL": "https://gi-diana-165.firebaseio.com",
    "storageBucket": "gi-diana-165.appspot.com",
    "cloudResourceLocation": "us-central"
});
exports.helloPubSub = (event, context) => {
  const pubsubMessage = event.data;
  console.log(Buffer.from(pubsubMessage, 'base64').toString());
  const id = Buffer.from(pubsubMessage, 'base64').toString();
  const firebase = admin.database();

  const refC = firebase.ref("Conversations/" + id)
  refC.once("value")
    .then(function(snapshot) {
      console.log("Updated: ", id);
      console.log(snapshot.numChildren());
    });

  const refM = firebase.ref("Members/" + id)
  refM.once("value")
    .then(function(snapshot) {
      console.log("Updated: ", id);
      console.log(snapshot.numChildren());
  });

  const refMeta = firebase.ref("__meta__/" + id)
  refMeta.once("value")
    .then(function(snapshot) {
      console.log("Updated: ", id);
      console.log(snapshot.numChildren());
  });

  const ifSuccess = true
  var errorString = "";
  refM.once('value').then(function(snapshot) {
    console.log(JSON.stringify(snapshot));
    const userID = Object.keys(snapshot.val())[0];
    console.log(userID);
    const refU = firebase.ref("Users/" + userID)
    refU.once("value")
    .then(function(snapshot) {
      console.log("Updated: ", id);
      console.log(snapshot.numChildren());
    });
    
    refU.remove().then(function(){
      console.log("URemove succeeded for id - " + id)
      refM.remove().then(function(){
        console.log("MRemove succeeded for id - " + id)
      }).catch(function(error){
        errorString = errorString + ". Members: " + error;
        ifSuccess = false
        console.log("MRemove failed")
      })
    }).catch(function(error) {
      errorString = errorString + ". Users: " + error;
      ifSuccess = false
      console.log("MRemove failed")
    })
  });

  console.log("ref fetched");

  refC.remove()
  .then(function() {
    console.log("CRemove succeeded for id - " + id)
  })
  .catch(function(error) {
    errorString = errorString + ". Conversation: " + error;
    ifSuccess = false
    console.log("Remove failed: " + error.message)
  });

  refMeta.remove().then(function(){
    console.log("Meta Remove succeeded for id - " + id)
  }).catch(function(error){
    errorString = errorString + ". Meta: " + error;
    ifSuccess = false
    console.log("MRemove failed")
  })

  //const bucketName = 'gi-diana-165.appspot.com';
  const bucket = admin.storage().bucket();
  bucket.deleteFiles({
    prefix: 'Attachments/' + id + '/'
  }, function(err) {
    if (!err) {
      console.log("deleted successfully" + err);
    } else{
       ifSuccess = false;
       errorString = errorString + ". Storage: " + err;
       console.log("error in deletion." + err);
    }
  });
  firebase.ref('DeletionStatus/' + id).set({
    status: ifSuccess,
    message: errorString
  });

  if(ifSuccess == true){
    console.log("All data removed succesfully for ID " + id);
  } else{

    console.log(" remove unsuccesfully for ID " + id);
  }
  
  //res.send(200);
};