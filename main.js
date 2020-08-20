let userId;
let lastPrompt = 0;

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
    }
  });
});


$('#pause').click(pauseAsk);
$('#prompt').click(promptAsk);
$('#pause-holder .x').click(closePause);
$('#prompt-holder .x').click(closePrompt);
$('#pause-response').keypress(pauseKey);
$('#prompt-response').keypress(promptKey);


function sendMessage(type, val) {
  let m = { type: type, val: val, timestamp: new Date().getTime() };
  db.collection('messages').add(m)
}

function pause(msg) {
  $('#overlay').fadeIn(0).delay(msg.val).fadeOut(0);
  api.isAudioMuted().then(muted => {
    if (!muted) api.executeCommand('toggleAudio');
  });
  setTimeout(function() {
    api.executeCommand('toggleAudio');
  }, msg.val);
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
  $('#controls').show();
}

// setInterval(displayPrompt, 5*60*1000);

function displayPrompt() {
  console.log("DISPLAY")
  let now = new Date().getTime();
  if (now - lastPrompt > 60*1000) {
    db.collection('prompts').get().then(function(querySnapshot) {
      let random = Math.floor(Math.random() * querySnapshot.docs.length);
      let msg = querySnapshot.docs[random].data().text;
      $('#notif').text(msg);
      $('#notif-holder').stop().fadeIn(0).delay(5000).fadeOut(0);
    })
    lastPrompt = now;
  } else {
    console.log('TOO SOON');
  }
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

function closePrompt() {
  $('#prompt-holder').hide();
  $('#prompt .icon').removeClass('icon-open');
}

function closePause() {
  $('#pause-holder').hide();
  $('#pause .icon').removeClass('icon-open');
}
