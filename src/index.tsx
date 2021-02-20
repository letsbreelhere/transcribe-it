import React from 'react';
import { render } from 'react-dom';
import { readFileSync } from 'fs';
import App from './App';

const audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "playback" });
const processorPath = 'static/StretchProcessor.tsx';
const processorSource = readFileSync(processorPath); // just a promisified version of fs.readFile
const processorBlob = new Blob([processorSource.toString()], { type: 'text/javascript' });
const processorURL = URL.createObjectURL(processorBlob);
audioContext.audioWorklet.addModule(processorURL);

render(<App audioContext={audioContext} />, document.getElementById('root'));
