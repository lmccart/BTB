let userId;
let endTimer = 0;
let endInterval = false;

// Parse URL params, show HTML elements depending on view
const params = new URLSearchParams(window.location.search);
let roomId = params.get('roomId');
if (!roomId) {
  $('#error').show(); // TODO show error page
}
let guide = params.get('guide') ? true : false;
if (guide) {
  $('#guide-holder').show();
}

// Create jitsi session
const domain = 'meet.jit.si';
const options = {
  roomName: roomId,
  parentNode: document.querySelector('#meet');
};
const api = new JitsiMeetExternalAPI(domain, options);
api.addListener('videoConferenceJoined', joined);

// Setup firebase app
let app = firebase.app();
firebase.auth().signInAnonymously().catch(function(error) { console.log(error); });
firebase.auth().onAuthStateChanged(function(user) { });
let db = firebase.firestore(app);

//retrieve tsv
// fetch('/data/prompts.tsv').then((response)=>{
//   return response.text()
// }).then((value)=>{
//   console.log('tsv available:', !!value)
//   console.log(value)
// })

// db.collection('tsv').doc('prompt').get().then((value)=>{
//   if (!value.exists) {
//     console.log('34:', 'No such document!');
//   } else {
//     console.log('36:', 'Document data:', value.data());
//   }  
// })

// Setup listener for firestore changes
// This is how messages are triggered for all clients/participants. 
// A button press calls a "trigger" function, and when the messages collection changes
// each client is notified and handles the new message accordingly.
let now = new Date().getTime();
db.collection('messages').where('timestamp', '>', now).onSnapshot({}, function(snapshot) {
  snapshot.docChanges().forEach(function(change) {
    console.log(change);
    if (change.roomId === roomId && change.type === 'added') { // only react to new messages (instead of all old messages in firestore)
      let msg = change.doc.data();
      if (msg.type === 'pause') pause(msg.val);
      else if (msg.type === 'guide') playMessage(msg.val, true);
    }
  });
});

// DOM button event listeners
$('#pause').click(triggerPause);
$('#speak-guide').click(triggerGuide);

// Called when participant joins.
function joined(e) {
  userId = e.id;
  $('#controls').show();
}

// This function adds a new message to firestore, triggering all clients
// subscribed to changes to react.
function sendMessage(type, val) {
  let m = { type: type, roomId: roomId, val: val, timestamp: new Date().getTime() };
  db.collection('messages').add(m);
}

function triggerPause() {
  sendMessage('pause', 10000); // 10 second pause
}

function triggerGuide(e) {
  const msg = $('#guide').val();
  if (msg) sendMessage('guide', msg);
  $('#guide').val('');
}

// Enacts a pause moment, user is muted and ocean scene displayed.
// After pause ends, user is unmuted.
function pause(ms) {
  if (endInterval) clearInterval(endInterval);
  endTimer = performance.now() + ms;
  $('#timer').text(msToHms(ms));
  $('#overlay').fadeIn(0).delay(ms).fadeOut(0);
  api.isAudioMuted().then(muted => {
    if (!muted) api.executeCommand('toggleAudio');
  });
  setTimeout(function() {
    api.executeCommand('toggleAudio');
  }, ms);
  endInterval = setInterval(function() { 
    const remaining = endTimer - performance.now();
    $('#timer').text(msToHms(remaining));
  });
}

// Plays a message with overlaid text.
// If doSpeak is true, it also speaks it
function playMessage(msg, doSpeak) {
  $('#notif').text(msg);
  $('#notif-holder').stop().fadeIn(300).delay(4000).fadeOut(300);
  if (doSpeak) speak(msg);
  console.log('playMessage: ' + msg);
}

// Speaks a message in the browser via TTS.
function speak(msg) {
  const utter = new SpeechSynthesisUtterance(msg);
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

// Helper function for formatting text in hh:mm format.
function msToHms(d) {
  d = Number(d) / 1000;
  let h = Math.floor(d / 3600);
  let m = Math.floor(d % 3600 / 60);
  let s = Math.floor(d % 3600 % 60);

  let time =  String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  if (h > 0) time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  return time;
}

