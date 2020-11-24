
var TSV_ROWS_AS_JSON;

$.ajax({
  url: '/data/prompts.tsv',
})
.done(function( data ) {
	console.log(data);
  console.log('tsv available:', !!data)
  convertTsvIntoObjects(data)
});

function convertTsvIntoObjects(tsvText){
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
  }).filter((value)=>{
  	value.offsetMilli = offsetToMilli(value.Offset)
  	if(isNaN(value.offsetMilli)){
  		console.log(value, isNaN(value.offsetMilli));
  		return false;
  	}
  	return true;
  })
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

var pauseButton = $('#pause-prompts');
var skipButton = $('#skip-prompt');
var TIME_INTERVAL = 10;
var time = 0;
var interval = void 0;
var lastPlayed = -1;

pauseButton.click((e)=>{
	e.preventDefault()
	if(participantPaused){
		return
	}
	if(interval){
		pausePrompts();
	} else {
		resumePrompts();
	}
})

skipButton.click((e)=>{
	e.preventDefault();
	console.log('skip', lastPlayed);
	lastPlayed += 1;
	time = TSV_ROWS_AS_JSON[lastPlayed].offsetMilli;
})

function resumePrompts(){
		runPrompts((row)=>{
			sendMessage('guide-mute', row['Possible Prompt 0']);
		});
		pauseButton.text('Pause Prompts');
}

function eraseCounter(){
  $("#content").remove();
}
function displayCounter(prompt, timeleft){
  var minutes = Math.floor(timeleft/60);
  var seconds = timeleft%60;
  if(seconds.toString().length == 1){
    seconds = "0" + seconds.toString();
  }

  $('#content').html(`
    <p>
      <span>NEXT PROMPT IN: </span><span>${minutes}:${seconds}</span>
    </p>
    <p>${prompt}</p>
  `)
}

function runPrompts(handleRow){
	interval = setInterval(()=>{
	    if(time%1000 === 0){
	      if(TSV_ROWS_AS_JSON.length === lastPlayed){
	        eraseCounter()
	      }else{
	        displayCounter(
	          TSV_ROWS_AS_JSON[lastPlayed + 1]['Possible Prompt 0'],
	          TSV_ROWS_AS_JSON[lastPlayed+1].offsetMilli/1000 - time/1000
	        )
	      }
	    }
		var nextSoonest;
		TSV_ROWS_AS_JSON.filter((item, index)=>{
			if(index <= lastPlayed) return console.log();
			var offset = item.offsetMilli
			if(offset <= time){
				lastPlayed = index;
				handleRow(item)
			} else {
				if(time - offset < nextSoonest);
			}
		})
	    time += TIME_INTERVAL
	}, TIME_INTERVAL);
}

function pausePrompts(){
	clearInterval(interval);
	interval = void 0;
	pauseButton.text('Resume Prompts')
}

function offsetToMilli(offset){
      var minSec = offset.split(':');
      var seconds = parseInt(minSec[1]);
      var minutes = parseInt(minSec[0]) * 60;
      var milli = (seconds + minutes) * 1000
      return milli
}
