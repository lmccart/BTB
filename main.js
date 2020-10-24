let userId;
let lastPrompt = 0;
let endTimer = 0;
let endInterval = false;

if (window.location.hash.includes('#guide')) {
  $('#guide-holder').show();
}

const domain = 'meet.jit.si';
const options = {
  roomName: 'BTB Session 02 (20 August 2020)',
  parentNode: document.querySelector('#meet')
};
const api = new JitsiMeetExternalAPI(domain, options);
api.addListener('dominantSpeakerChanged', speakerChange);
api.addListener('videoConferenceJoined', joined);

// api.executeCommand('muteEveryone');

let app = firebase.app();
firebase.auth().signInAnonymously().catch(function(error) { console.log(error); });
firebase.auth().onAuthStateChanged(function(user) { });
let db = firebase.firestore(app);

let now = new Date().getTime();
db.collection('messages').where('timestamp', '>', now).onSnapshot({}, function(snapshot) {
  snapshot.docChanges().forEach(function(change) {
    console.log(change);
    if (change.type === 'added') {
      let msg = change.doc.data();
      if (msg.type === 'pause') pause(msg);
      else if (msg.type === 'play') playMessage(msg.val, true);
      else if (msg.type === 'guide') speak(msg.val);
    }
  });
});

// setInterval(displayPrompt, 8000);

$('#intro .x').click(closeIntro);
$('#pause').click(pauseAsk);
$('#prompt').click(promptAsk);
$('#pause-holder .x').click(closePause);
$('#prompt-holder .x').click(closePrompt);
$('#pause-response').keypress(pauseKey);
$('#prompt-response').keypress(promptKey);
$('.speak').click(triggerSpeak);
$('#speak-guide').click(guide);


function sendMessage(type, val) {
  let m = { type: type, val: val, timestamp: new Date().getTime() };
  db.collection('messages').add(m)
}

function pause(msg) {
  if (endInterval) clearInterval(endInterval);
  endTimer = performance.now() + msg.val;
  $('#timer').text(msToHms(msg.val));
  $('#overlay').fadeIn(0).delay(msg.val).fadeOut(0);
  api.isAudioMuted().then(muted => {
    if (!muted) api.executeCommand('toggleAudio');
  });
  setTimeout(function() {
    api.executeCommand('toggleAudio');
  }, msg.val);
  endInterval = setInterval(function() { 
    const remaining = endTimer - performance.now();
    $('#timer').text(msToHms(remaining));
  });
}



function speakerChange(e) {
  console.log('SPEAKER CHANGE DETECTED');
  if (e.id === userId) {
    displayPrompt();
  } else {
    // let name = api.getDisplayName(e.id);
    // let ind = name.indexOf(' ');
    // if (ind === -1) ind = name.length;
    // name = name.substring(0, ind);
    // $('#notif').text(name + ' is speaking');
    // $('#notif-holder').stop().fadeIn(0).delay(2000).fadeOut(0);
  }
}

function joined(e) {
  userId = e.id;

  $('#join').hide();
  $('#intro').show();
  $('#controls').show();
  $('#controls-secondary').show();
}


function displayPrompt() {
  let now = new Date().getTime();
  if (now - lastPrompt > 3*60*1000) {
    db.collection('prompts').get().then(function(querySnapshot) {
      let random = Math.floor(Math.random() * querySnapshot.docs.length);
      let msg = querySnapshot.docs[random].data().text;
      playMessage(msg, false);
    })
    lastPrompt = now;
  } else {
    console.log('TOO SOON');
  }
}

function playMessage(msg, doSpeak) {
  $('#notif').text(msg);
  $('#notif-holder').stop().fadeIn(300).delay(4000).fadeOut(300);
  if (doSpeak) speak(msg);
  console.log('playMessage: ' + msg);
}

function pauseAsk() {
  if ($('#pause-holder').is(':visible')) {
    closePause();
    closePrompt();
  } else {
    closePrompt();
    $('#pause .icon').addClass('icon-open');
    $('#pause-response').val('');
    $('#pause-holder').show();
  }
}

function promptAsk() {
  if ($('#prompt-holder').is(':visible')) {
    closePause();
    closePrompt();
  } else {
    closePause();
    $('#prompt .icon').addClass('icon-open');
    $('#prompt-thankyou').hide();
    $('#prompt-ask').show();
    $('#prompt-response').val('');
    $('#prompt-response').show();
    $('#prompt-holder').show();
  }
}

function pauseKey(e) {
  if (e.keyCode === 13) {
    closePause();
    closePrompt();
    let time = $('#pause-response').val() * 1000;
    if (!time || time <= 0) time = 3000;
    sendMessage('pause', time);
  }
}

function promptKey(e) {
  if (e.keyCode === 13) {
    let prompt = $('#prompt-response').val();
    if (prompt && prompt.length > 0) {
      let p = { type: 'prompt', text: prompt, timestamp: new Date().getTime() };
      db.collection('prompts').add(p);
      $('#prompt-ask').hide();
      $('#prompt-response').hide();
      $('#prompt-thankyou').show();
      $('#prompt-holder').delay(3000).fadeOut(0);
    } else {
      closeAsk();
    }
  }
}

function closeIntro() {
  $('#intro').hide();
}

function closePrompt() {
  $('#prompt-holder').hide();
  $('#prompt .icon').removeClass('icon-open');
}

function closePause() {
  $('#pause-holder').hide();
  $('#pause .icon').removeClass('icon-open');
}

function triggerSpeak(e) {
  const msg = $(this).data('msg');
  sendMessage('play', msg);
}

function guide(e) {
  const msg = $('#guide').val();
  if (msg) sendMessage('guide', msg);
  $('#guide').val('');
}

function speak(msg) {
  const utter = new SpeechSynthesisUtterance(msg);
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

function msToHms(d) {
  d = Number(d) / 1000;
  let h = Math.floor(d / 3600);
  let m = Math.floor(d % 3600 / 60);
  let s = Math.floor(d % 3600 % 60);

  let time =  String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  if (h > 0) time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  return time;
}