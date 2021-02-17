import React, { useState, useEffect, useRef } from 'react';
import Waveform from './Waveform';
import PlayBar from './PlayBar';
import Selection from './Selection';

import './visualizer.scss';

const ZOOM_FACTOR = 1.1;

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

const AudioVisualizer = ({ audio, context }) => {
  const rawData = audio.getChannelData(0);

  const selectionRef = useRef(null);
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const [playTrack, setPlayTrack] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [startPoint, setStartPoint] = useState(0);
  const [playBar, setPlayBar] = useState(0);
  const [selection, setSelection] = useState({});
  const [sliceLength, setSliceLength] = useState(rawData.length);
  const [sliceStart, setSliceStart] = useState(0);
  const [selecting, setSelecting] = useState(false);

  const playing = !!playTrack;
  const looping = !!selection?.end;
  const loopLength = looping
    ? (audio.duration * Math.abs(selection.end - selection.start)) /
      rawData.length
    : null;

  useInterval(() => {
    if (playing) {
      const curTime = startPoint + context.currentTime - startedAt;
      let newPlayBar;
      if (looping) {
        newPlayBar = (startPoint + (curTime % loopLength)) / audio.duration;
      } else {
        newPlayBar = curTime / audio.duration;
      }
      setPlayBar(newPlayBar);
    }
  }, 1);

  useEffect(() => {
    const newPlayBar = startPoint / audio.duration;
    setPlayBar(newPlayBar);
  }, [startPoint]);

  const togglePlayback = () => {
    if (playing) {
      pausePlayback();
    } else {
      playFrom(startPoint);
    }
  };

  const pausePlayback = () => {
    playTrack.stop();
    const pausedAt = context.currentTime;
    setStartPoint(startPoint + pausedAt - startedAt);
    setPlayTrack(null);
  };

  const playFrom = (offset) => {
    if (playing) {
      pausePlayback();
    }
    setStartPoint(offset);
    const audioTrack = context.createBufferSource();
    audioTrack.connect(context.destination);
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

  const onMouseDown = (e) => {
    setSelecting(true);
    const bounds = e.target.getBoundingClientRect();
    const pctClicked = (e.clientX - bounds.x) / bounds.width;
    const start = pctClicked * sliceLength + sliceStart;
    setSelection({ start });
    const offset = audio.duration * (start / rawData.length);
    if (playing) {
      playFrom(offset);
    } else {
      setStartPoint(offset);
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
      <div>{sliceStart}</div>
      <div>{sliceLength}</div>
      <div>
        {startPoint}, {playBar}
      </div>
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
          location={playBar}
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
