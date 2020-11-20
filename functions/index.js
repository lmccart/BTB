const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.refresh = functions.https.onRequest((req, res) => {
  let now = new Date().getTime();
  db.collection('sessions').onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      let slot = change.doc.data();
      if (slot.hold && now - slot.hold > 11*60*1000) { // 11 minutes
        s = {hold: false};
        db.collection('sessions').doc(slot.id).set(s, {merge: true});
      }
    });
    res.json({success: true});
  });
});