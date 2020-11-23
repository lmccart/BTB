var TSV_ROWS_AS_JSON;

function createPromptElement(){
  var newPrompt = document.createElement("div");
  newPrompt.id = 'tsv-prompt';
  newPrompt.style.position = 'absolute';
  newPrompt.style.top = '50%';
  newPrompt.style.left = '50%';
  newPrompt.style.transform = 'translate(-50%, -50%)';
  newPrompt.style.backgroundColor = 'rgba(255,255,255,0.75)';
  return newPrompt;
}

function addBeginPrompts(){
  options.parentNode.style.position = 'static';
  options.parentNode.style.height = '100%'
  
  if(!guide){
    return;
  }
  var newPrompt = createPromptElement();
  newPrompt.style.padding = '50px';
  newPrompt.innerHTML = `
    <button>Begin</button>
  `//the button allows the guide to begin the timer/prompts.
  
  newPrompt.addEventListener('click', (e)=>{
    e.preventDefault();
    options.parentNode.removeChild(newPrompt);
    startPrompts();
  })
  options.parentNode.appendChild(newPrompt);
}

function displayRow(row){
  console.log(row);
  // remove previous
  var oldPrompt = options.parentNode.querySelector('#tsv-prompt');
  if(oldPrompt){
    options.parentNode.removeChild(oldPrompt);
  }
  var newPrompt = createPromptElement();

  Object.keys(row).map((key)=>{
  	console.log(key, ":", row[key]);
  })
  newPrompt.innerHTML = `
    <p>${row['Possible Prompt 0']}</p>
    <p>${row['Possible Prompt 1']}</p>
  `;

  newPrompt.addEventListener('click', (e)=>{
    e.preventDefault();
    var oldPrompt = options.parentNode.querySelector('#tsv-prompt');
    if(oldPrompt){
      options.parentNode.removeChild(oldPrompt);
    }
  })
  options.parentNode.appendChild(newPrompt);
}

function loopUntilReady(varName, maxTime, currentTime){
  var waitTime = 100;
  currentTime = currentTime || 0;
  return new Promise((resolve, reject)=>{
    if(currentTime >= maxTime){
      return reject(new Error('waited too long'))
    }
    setTimeout(resolve, waitTime)
  }).then(()=>{
    if(window[varName]){
      return;
    }
    return loopUntilReady(varName, maxTime, currentTime + waitTime)
  })
}

function startPrompts(){
  loopUntilReady('TSV_ROWS_AS_JSON', 5 * 1000).then(()=>{
    TSV_ROWS_AS_JSON.map((row)=>{
      var offset = row.Offset;
      var minSec = offset.split(':');
      var seconds = parseInt(minSec[1]);
      var minutes = parseInt(minSec[0]) * 60;
      var milli = (seconds + minutes) * 1000
      console.log(milli / 4)  // this is only temporary for testing
      if(isNaN(milli)){
        return;
      }
      setTimeout(()=>{
        displayRow(row)
      }, milli / 4);
    })
  })
}

// Use this to retrieve prompts.tsv
fetch('/data/prompts.tsv').then((response)=>{
  return response.text()
}).then((tsvText)=>{
  console.log('tsv available:', !!tsvText)
//  console.log(tsvText)
  var tsvRows = tsvText.split('\n');
  var headers = tsvRows.shift();
  headers = headers.split('\t');
  console.log(headers)
  TSV_ROWS_AS_JSON = tsvRows.map((row)=>{
    var cols = row.split('\t');
    var value = {};
    headers.forEach((header, index)=>{
      value[header] = cols[index]
    })
    return value;
  })
  addBeginPrompts();
//  startPrompts(tsvRowsAsJSON);

})



/*

- Guide can write new prompts on demand
- load prompts from tsv file and display it for each given time
- pause on certian prompts is the guide wants

Guide can
- Send messages to all other participants
	- can this be done with jitsi - maybe
		- api.executeCommand(command, ...arguments);
			- endpointTextMessageReceived
				- if we know the guide's id
					- on recieved 
						- ifsender id is guide's id
						- display as prompt

				```
				{
				    senderInfo: {
			        	jid: string, // the jid of the sender
        				id: string // the participant id of the sender
			    	},
				    eventData: {
				        name: string // the name of the datachannel event: `endpoint-text-message`
    				    text: string // the received text from the sender
				    }
				}
				```
			- incomingMessage
				- if we know the id of the sender and the guide's id
					- can display the prompt
				```
				{
				    from: string, // The id of the user that sent the message
				    nick: string, // the nickname of the user that sent the message
				    message: string // the text of the message
				}

				```



*/
