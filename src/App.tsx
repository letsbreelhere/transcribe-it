import React, { useState } from 'react';
import fs from 'fs';
import AudioVisualizer from './AudioVisualizer';
import { Input } from '@material-ui/core';

const App = ({ audioContext }) => {
  const [audio, setAudio] = useState(null);

  const onOpen = async e => {
    const file = e.target.files[0];
    const contents = fs.readFileSync(file.path);
    const buffer = await audioContext.decodeAudioData(contents.buffer);
    setAudio(buffer);
  };

  return (
    <div className="App">
      <div className="controls">
        <Input onChange={onOpen} type="file" />
      </div>
      {audio ? <AudioVisualizer context={audioContext} audio={audio} /> : ''}
    </div>
  );
}

export default App;
