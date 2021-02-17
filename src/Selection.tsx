import React, { useEffect, useRef } from 'react';

const Selection = ({ start, end, sliceStart, sliceLength, rawData }) => {
  const ref = useRef();

  useEffect(() => {
    drawSelection({
      canvas: ref.current,
      sliceStart,
      sliceLength,
      start,
      end,
      rawData,
    });
  }, [start, end, sliceStart, sliceLength]);

  return (
    <canvas
      style={{ position: 'absolute', top: 0, left: 0 }}
      height={100}
      width={window.innerWidth}
      ref={ref}
    />
  );
};

const drawSelection = ({
  canvas,
  sliceStart,
  sliceLength,
  start,
  end,
  rawData,
}) => {
  const { height } = canvas;
  const { width } = canvas;
  const canvasCtx = canvas.getContext('2d');

  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = '#000000';
  canvasCtx.clearRect(0, 0, width, height);
  canvasCtx.beginPath();

  if (end) {
    canvasCtx.fillStyle = '#cccccc';
    canvasCtx.fillRect(
      Math.floor((width * (start - sliceStart)) / sliceLength),
      0,
      Math.floor((width * (end - start)) / sliceLength),
      canvas.height
    );
  }
};

export default Selection;
