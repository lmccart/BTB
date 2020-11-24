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
} else {
  $('#participant-holder').show();
}

// Create jitsi session
const domain = 'meet.jit.si';
const options = {
  roomName: 'BTB Session 02 (20 August 2020)',
  parentNode: document.querySelector('#meet'),
};
const api = new JitsiMeetExternalAPI(domain, options);
api.addListener('videoConferenceJoined', joined);

// Setup firebase app
let app = firebase.app();
firebase.auth().signInAnonymously().catch(function(error) { console.log(error); });
firebase.auth().onAuthStateChanged(function(user) { });
let db = firebase.firestore(app);


// Setup listener for firestore changes
// This is how messages are triggered for all clients/participants. 
// A button press calls a "trigger" function, and when the messages collection changes
// each client is notified and handles the new message accordingly.
let now = new Date().getTime();
db.collection('messages').where('timestamp', '>', now).onSnapshot({}, function(snapshot) {
  snapshot.docChanges().forEach(function(change) {
    if(change.type !== 'added'){
      console.log("not an add");
      return
    }

    let msg = change.doc.data();
    if(msg.roomId !== roomId){
      console.log("wrong room", roomId, msg.roomId)
      return
    }
    
    console.log(msg);
    if (msg.type === 'pause') return pause(msg.val);
    if (msg.type === 'guide') {
      return playMessage(msg.val, true);
    }
    
    if(msg.type === 'guide-mute'){
      return playMessage(msg.val, false);
    }

    if(msg.type === 'uptick'){
      return uptick(msg)
    }

    if(msg.type === 'participant-pause'){
      return particpantPauseMessage();
    }
    console.log('badType:', msg.type)
  });
});

// DOM button event listeners
$('#pause').click(triggerPause);
$('#speak-guide').click(triggerGuide);

// Called when participant joins.
function joined(e) {
  userId = e.id;
  $('#controls').show();
  startPrompts();
}

// This function adds a new message to firestore, triggering all clients
// subscribed to changes to react.
function sendMessage(type, val) {
  let m = { type: type, roomId: roomId, val: val, timestamp: new Date().getTime() };
  db.collection('messages').add(m);
}

function triggerPause() {
  sendMessage('pause', 30000); // 30 second pause
}

function triggerGuide(e) {
  const msg = $('#guide').val();
  if (msg) sendMessage('guide', msg);
  $('#guide').val('');
}
var participantPaused = false;
var participantPausedInterval = void 0;
var participantPausedIntervalCount = 0;
var pButton = $('#participant-holder button')

pButton.click((e)=>{
  e.preventDefault()
  if(participantPaused){
    return;
  }
  sendMessage('participant-pause', 'no email');
})
function particpantPauseMessage(){

  if(guide){
    pausePrompts()
    pauseButton.prop('disabled', true)
  }
  participantPaused = true;


    api.executeCommand('toggleAudio')
    pButton.prop('disabled', true);
    var newPrompt = $(`
      <video class="absolute-center" id="pause-vid" style="width:100%" controls autoplay loop>
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
        <source src="https://www.w3schools.com/html/mov_bbb.ogg" type="video/ogg">
        Your browser does not support HTML video.
      </video>
    `);
    newPrompt.appendTo(options.parentNode)
    var countDown = $(`
      <p id='count-down'>30</p>
    `);
    countDown.appendTo($('#participant-holder'));

    participantPausedInterval = setInterval(()=>{
      var nextInt = parseInt(countDown.text()) - 1;
      if(nextInt === 0){
        console.log("video-ended");
        participantPausedIntervalCount = 0
        clearInterval(participantPausedInterval);

        api.executeCommand('toggleAudio')
        pButton.prop('disabled', false)
        $('#participant-holder #count-down').remove()
        $('#pause-vid').remove()
        participantPaused = false
        if(guide){
          pausePrompts()
          pauseButton.prop('disabled', false)
        }

      }
      countDown.text(nextInt);
    }, 1000)
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
