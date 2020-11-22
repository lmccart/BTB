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

exports.sendConfirm = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate((change, context) => {
    console.log('send confirm');
    let session = change.after.data();
    let updated_participants = [];
    for (let i=0; i<session.participants.length; i++) {
      updated_participants[i] = session.participants[i];
      if (!session.participants[i].confirmed) {
        let html = 'Dear ' + session.participants[i].name + ',';
        html += '<br><br>Your session registration is confirmed for '+session.datetime+'.';
        html += '<br><br>At that time, please connect at <a href="'+session.session_url+'">'+session.session_url+'</a>.';
        html += '<br><br>If you are unable to attend, please <a href="'+session.cancel_url+'">click here to cancel</a>.';
        html += '<br><br>Sincerely,';
        html += '<br>Tony Patrick, Lauren Lee McCarthy, and Grace Lee';
        html += '<br>Artists, Beyond the Breakdown';
        let msg = {
          to: session.participants[i].email,
          message: {
            subject: 'Beyond the Breakdown session confirmation',
            html: html
          },
        };
        db.collection('mail').add(msg);
        updated_participants[i].confirmed = true;
      }
      db.collection('sessions').doc(session.id).set({participants: updated_participants}, {merge: true});
    }
});

exports.sendCancel = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate((change, context) => {
    console.log('send cancel');
    let session = change.after.data();
    let after = change.after.data().participants;
    let before = change.before.data().participants;
    
    for (let b=0; b<before.length; b++) {
      let found = false;
      for (let a=0; a<after.length; a++) {
        if (a.pid === b.pid) {
          found = true;
        }
      }
      if (!found) {
        console.log('sending cancel to ' + before[b].name);
        let html = 'Dear ' + before[b].name + ',';
        html += '<br><br>Your registration for the session scheduled for '+ session.datetime +' has been cancelled.';
        html += ' To make a new registration, you can visit <a href="http://beyond-the-breakdown.web.app">beyond-the-breakdown.web.app</a>.';
        html += '<br><br>Sincerely,';
        html += '<br>Tony Patrick, Lauren Lee McCarthy, and Grace Lee';
        html += '<br>Artists, Beyond the Breakdown';
        let msg = {
          to: before[b].email,
          message: {
            subject: 'Beyond the Breakdown cancellation confirmation',
            html: html
          },
        };
        db.collection('mail').add(msg);

      }
    }
});

// exports.testEmail = functions.https.onRequest((req, res) => {
//   let html = 'Dear ______,';
//   html += '<br><br>Your registration for the session scheduled for _____ has been cancelled.';
//   html += 'To make a new registration, you can visit <a href="http://beyond-the-breakdown.web.app">beyond-the-breakdown.web.app</a>.';
//   html += '<br><br>Sincerely,';
//   html += '<br>Tony Patrick, Lauren Lee McCarthy, and Grace Lee';
//   html += '<br>Artists, Beyond the Breakdown';
//   let msg = {
//     to: 'laurenleemccarthy@gmail.com',
//     message: {
//       subject: 'Beyond the Breakdown cancellation confirmation',
//       html: html
//     },
//   };
//   db.collection('mail').add(msg);
//   res.json(msg);
// });