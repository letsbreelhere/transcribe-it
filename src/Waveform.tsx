import React, { useEffect, useRef } from 'react';

const Waveform = ({ sliceStart, sliceLength, rawData }) => {
  const ref = useRef();

  useEffect(() => {
    drawWaveform({ canvas: ref.current, rawData, sliceStart, sliceLength });
  }, [sliceStart, sliceLength, rawData, ref]);

  return (
    <canvas
      style={{ position: "absolute", top: 0, left: 0 }}
      height={100}
      width={window.innerWidth}
      ref={ref}
    />
  )
}

const drawWaveform = ({ canvas, rawData, sliceLength, sliceStart }) => {
  const { height, width } = canvas;
  const canvasCtx = canvas.getContext('2d');

  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = '#000000';
  canvasCtx.clearRect(0, 0, width, height);

  canvasCtx.moveTo(0, height / 2);
  const filterData = (rawData) => {
    const samples = width * 5;
    const blockSize = Math.floor(sliceLength / samples);
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += rawData[sliceStart + blockStart + j];
      }
      filteredData.push(sum / blockSize);
    }
    return filteredData;
  };

  const normalizeData = (filteredData) => {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map((n) => n * multiplier);
  };

  const filteredData = normalizeData(filterData(rawData));
  const sliceWidth = (width * 1.0) / filteredData.length;

  let x = 0;
  filteredData.forEach((item) => {
    const y = ((item + 1) * height) / 2;
    canvasCtx.beginPath();
    if (Math.abs(y - height / 2) >= 1) {
      canvasCtx.moveTo(x, height / 2);
      canvasCtx.lineTo(x, y);
    } else {
      canvasCtx.moveTo(x, height / 2);
      canvasCtx.lineTo(x, height / 2 + 1);
    }
    canvasCtx.stroke();
    x += sliceWidth;
  });
};

export default Waveform;
