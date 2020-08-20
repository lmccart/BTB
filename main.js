const domain = 'meet.jit.si';

const options = {
    roomName: 'LeandroDottaTest',
    width: '100%',
    height: '100vh',
    parentNode: document.querySelector('#meet')
};

const api = new JitsiMeetExternalAPI(domain, options);


$(document).ready(function() {

  let app = firebase.app();
});