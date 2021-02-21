import React, { useEffect, useRef } from 'react';

const PlayBar = ({ location, sliceStart, sliceLength, rawData }) => {
  const ref = useRef();

  useEffect(() => {
    drawPlayBar({ canvas: ref.current, location, sliceStart, sliceLength, rawData });
  }, [location, sliceStart, sliceLength]);

  return (
    <canvas
      style={{ position: "absolute", top: 0, left: 0 }}
      height={100}
      width={window.innerWidth}
      ref={ref}
    />
  );
};

const drawPlayBar = ({ location, rawData, canvas, sliceStart, sliceLength }) => {
  const { height, width } = canvas;
  const canvasCtx = canvas.getContext('2d');

  canvasCtx.clearRect(0, 0, width, height);
  canvasCtx.beginPath();

  const approxSlice = location * rawData.length;
  let playBarX;
  if (approxSlice >= sliceStart && approxSlice <= sliceStart + sliceLength) {
    playBarX = Math.floor(width * (approxSlice - sliceStart) / sliceLength) + 0.5;
  }

  if (playBarX) {
    canvasCtx.strokeStyle = '#ff0000';
    canvasCtx.moveTo(playBarX, 0);
    canvasCtx.lineTo(playBarX, height);
    canvasCtx.stroke();
  }
};

export default PlayBar;
