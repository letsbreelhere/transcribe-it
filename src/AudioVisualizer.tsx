import React, { useState, useEffect, useRef } from 'react';
import Waveform from './Waveform';
import PlayBar from './PlayBar';
import Selection from './Selection';
import { readFileSync } from 'fs';

import './visualizer.scss';

const ZOOM_FACTOR = 1.2;

const useInterval = (callback, delay) => {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      savedCallback.current();
    };
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

const doubleArray = (array) => {
  let result = [];
  const chunkSize = 1024;
  for (let i = 0; i < array.length; i += chunkSize) {
    for (let j = 0; j < chunkSize; j++) {
      result[i*2+j] = array[i+j];
      result[i*2+chunkSize+j] = array[i+j];
    }
  }
  return Float32Array.from(result);
}

const AudioVisualizer = ({ audio, context }) => {
  const rawData = audio.getChannelData(0);

  const selectionRef = useRef(null);
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const [playTrack, setPlayTrack] = useState(null);
  const [selection, setSelection] = useState({});
  const [sliceLength, setSliceLength] = useState(rawData.length);
  const [sliceStart, setSliceStart] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [startedAt, setStartedAt] = useState(null);
  const [timeOfLastSample, setTimeOfLastSample] = useState(null);
  const [relDuration, setRelDuration] = useState(0);

  const playing = !!playTrack;
  const looping = !!selection?.end;
  const loopLength = looping
    ? (audio.duration * Math.abs(selection.end - selection.start)) /
      rawData.length
    : null;
  const loopStart = audio.duration * (selection.start / rawData.length)

  useInterval(() => {
    if (playing) {
      const cur = context.currentTime
      setTimeOfLastSample(cur);
      const timeSinceLastSample = cur - timeOfLastSample;
      let newRelDuration = relDuration + timeSinceLastSample * playbackRate;
      if (looping) {
        newRelDuration = loopStart + ((newRelDuration - loopStart) % loopLength);
      }
      setRelDuration(newRelDuration);
    }
  }, 1);

  const togglePlayback = async () => {
    if (playing) {
      pausePlayback();
    } else {
      await playFrom(relDuration);
    }
  };

  const pausePlayback = () => {
    playTrack.stop();
    setPlayTrack(null);
  };

  const playFrom = async (offset) => {
    if (playing) {
      pausePlayback();
    }
    setRelDuration(offset);
    setTimeOfLastSample(context.currentTime)
    const audioTrack = context.createBufferSource();
    const stretchNode = new AudioWorkletNode(context, 'stretch-processor');
    audioTrack.connect(stretchNode);
    stretchNode.connect(context.destination);
    audioTrack.buffer = audio;
    if (looping) {
      audioTrack.loop = true;
      audioTrack.loopStart = offset;
      audioTrack.loopEnd = offset + loopLength;
    }
    setPlayTrack(audioTrack);
    setStartedAt(context.currentTime);
    audioTrack.start(0, offset);
  };

  const onMouseDown = async (e) => {
    setSelecting(true);
    const bounds = e.target.getBoundingClientRect();
    const pctClicked = (e.clientX - bounds.x) / bounds.width;
    const start = pctClicked * sliceLength + sliceStart;
    setSelection({ start });
    const offset = audio.duration * (start / rawData.length);
    if (playing) {
      await playFrom(offset);
    } else {
      setRelDuration(offset);
    }
  };

  const onMouseMove = (e) => {
    if (selecting) {
      const bounds = e.target.getBoundingClientRect();
      const pctClicked = (e.clientX - bounds.x) / bounds.width;
      const end = pctClicked * sliceLength + sliceStart;

      setSelection({ ...selection, end });
    }
  };

  const onMouseUp = (e) => {
    if (Math.abs(selection.end - selection.start) < 10) {
      setSelection({});
    }
    setSelecting(false);
  };

  const onWheel = (e) => {
    const bounds = e.target.getBoundingClientRect();
    const wheelPct = (e.clientX - bounds.x) / bounds.width;
    const wheelX = Math.floor(wheelPct * sliceLength + sliceStart);

    let newLength;
    if (e.deltaY > 0) {
      // Zooming in
      newLength = Math.max(Math.floor(sliceLength / ZOOM_FACTOR), 10);
    } else if (e.deltaY < 0) {
      // Zooming out
      newLength = Math.ceil(
        Math.min(sliceLength * ZOOM_FACTOR, rawData.length)
      );
    }

    const newStart = Math.min(
      rawData.length - newLength,
      Math.max(Math.floor(wheelX - newLength * wheelPct), 0)
    );
    setSliceStart(newStart);
    setSliceLength(newLength);
  };

  return (
    <>
      <button onMouseDown={togglePlayback}>{playing ? 'Pause' : 'Play'}</button>
      <input type="range" min={0.1} max={2} step={0.1} onChange={(e) => setPlaybackRate(e.target.value) } />
      {playbackRate}
      <div style={{ position: 'relative' }}>
        <Selection
          start={selection.start}
          end={selection.end}
          sliceStart={sliceStart}
          sliceLength={sliceLength}
          rawData={rawData}
        />
        <Waveform
          sliceStart={sliceStart}
          sliceLength={sliceLength}
          rawData={rawData}
        />
        <PlayBar
          location={relDuration / audio.duration}
          sliceStart={sliceStart}
          sliceLength={sliceLength}
          rawData={rawData}
        />
        <canvas
          style={{ position: 'absolute', top: 0, left: 0 }}
          height={100}
          width={window.innerWidth}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        />
      </div>
    </>
  );
};

export default AudioVisualizer;
