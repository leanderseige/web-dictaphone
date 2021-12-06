// set up basic variables for app

const slider = document.querySelector('.slider');
const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const soundClips = document.querySelector('.sound-clips');
const canvas = document.querySelector('.visualizer');
const mainSection = document.querySelector('.main-controls');

var x = 0
var fac = 1.0

// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

let audioCtx;

const canvasCtx = canvas.getContext("2d");
canvasCtx.strokeStyle = 'rgb(255, 255, 255)';
canvasCtx.setLineDash([5,5]);
canvasCtx.lineWidth = 2;

var offcanvas = document.createElement('canvas');
offcanvas.id = "OffCanvas";
offcanvas.width = canvas.width
offcanvas.height = canvas.height
const offcanvasCtx = offcanvas.getContext("2d");
offcanvasCtx.fillStyle = 'rgb(0, 64, 0)';
offcanvasCtx.strokeStyle = 'rgb(0, 255, 0)';
offcanvasCtx.lineWidth = 2;

//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function(stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function() {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function() {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    }

    // mediaRecorder.onstop = function(e) {
    //   console.log("data available after MediaRecorder.stop() called.");
    //
    //   const clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
    //
    //   const clipContainer = document.createElement('article');
    //   const clipLabel = document.createElement('p');
    //   const audio = document.createElement('audio');
    //   const deleteButton = document.createElement('button');
    //
    //   clipContainer.classList.add('clip');
    //   audio.setAttribute('controls', '');
    //   deleteButton.textContent = 'Delete';
    //   deleteButton.className = 'delete';
    //
    //   if(clipName === null) {
    //     clipLabel.textContent = 'My unnamed clip';
    //   } else {
    //     clipLabel.textContent = clipName;
    //   }
    //
    //   clipContainer.appendChild(audio);
    //   clipContainer.appendChild(clipLabel);
    //   clipContainer.appendChild(deleteButton);
    //   soundClips.appendChild(clipContainer);
    //
    //   audio.controls = true;
    //   const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
    //   chunks = [];
    //   const audioURL = window.URL.createObjectURL(blob);
    //   audio.src = audioURL;
    //   console.log("recorder stopped");
    //
    //   deleteButton.onclick = function(e) {
    //     let evtTgt = e.target;
    //     evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
    //   }
    //
    //   clipLabel.onclick = function() {
    //     const existingName = clipLabel.textContent;
    //     const newClipName = prompt('Enter a new name for your sound clip?');
    //     if(newClipName === null) {
    //       clipLabel.textContent = existingName;
    //     } else {
    //       clipLabel.textContent = newClipName;
    //     }
    //   }
    // }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }

  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  if(!audioCtx) {
    audioCtx = new AudioContext();
  }

  slider.oninput = (e) => {
    console.log(e.target.value)
    fac = e.target.value
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  draw()
  offcanvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  offcanvasCtx.beginPath();
  offcanvasCtx.moveTo(0,canvas.height/2)

  function draw() {
    const WIDTH = offcanvas.width
    const HEIGHT = offcanvas.height

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    let sliceWidth = WIDTH * 1.0 / bufferLength;

    for(let i = 0; i < bufferLength; i++) {

      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT/2;

      offcanvasCtx.lineTo(x, y);

      x += sliceWidth/fac;

      if(x>=WIDTH) {
        offcanvasCtx.stroke();
        x=0
        canvasCtx.drawImage(offcanvas, 0, 0);
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, HEIGHT/2);
        canvasCtx.lineTo(WIDTH, HEIGHT/2);
        canvasCtx.stroke();
        offcanvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        offcanvasCtx.beginPath();
        offcanvasCtx.moveTo(0,canvas.height/2)
      }

    }
  }

}

window.onresize = function() {
  canvas.width = mainSection.offsetWidth;
}

window.onresize();
