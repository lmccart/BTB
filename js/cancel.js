
// Setup firebase app
let app = firebase.app();
firebase.auth().signInAnonymously().catch(function(error) { console.log(error); });
firebase.auth().onAuthStateChanged(function(user) { });
let db = firebase.firestore(app);
let id, pid;
let session;

$('#cancel-individual').click(cancelIndividual);
$('#cancel-group').click(cancelGroup);
parseParams();

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  id = params.get('id');
  pid = params.get('pid');
  if (pid) pid = pid.split(',');

  if (!id || !pid || !pid.length) {
    $('#not-found').show();
  } else {
    let docRef = db.collection('sessions').doc(id);
    docRef.get().then(function(doc) {
      if (doc.exists) {
        session = doc.data();
        console.log(session);
        $('#cancel').show();
        if (pid.length === 1) {
          $('#cancel-group').hide();
        } else {
          $('#cancel-num').text(pid.length);
        }
      } else { $('#not-found').show(); }
    }).catch(function(error) { $('#not-found').show(); });
  }
}

function cancelIndividual() {
  let updated_participants = [];
  for (let p of session.participants) {
    if (p.pid !== pid[0]) {
      updated_participants.push(p);
    }
  }
  db.collection('sessions').doc(session.id).set({participants: updated_participants}, {merge: true});
  $('#cancel').hide();
  $('#confirm-individual').show();
}

function cancelGroup() {
  let updated_participants = [];
  for (let p of session.participants) {
    let found = false;
    for (let e of pid) {
      if (p.pid === e) {
        found = true;
      }
    }
    if (!found) updated_participants.push(p);
  }
  console.log(updated_participants)
  db.collection('sessions').doc(session.id).set({participants: updated_participants}, {merge: true});
  $('#cancel').hide();
  $('#confirm-group').show();
}
