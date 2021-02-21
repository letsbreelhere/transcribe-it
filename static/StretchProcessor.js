// eslint-disable-next-line max-classes-per-file
class RingBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = [];
    this.writeCursor = 0;
    this.readCursor = 0;
    this.inBuffer = 0;
  }

  enq(values) {
    if (this.size - this.inBuffer < values.length) {
      throw new Error(
        `Buffer full: ${this.size}, ${this.inBuffer}, ${values.length}`
      );
    }
    this.inBuffer += values.length;

    values.forEach((value) => {
      this.buffer[this.writeCursor++ % this.size] = value;
    });

    return this.inBuffer;
  }

  deq(n) {
    const res = [];
    for (let i = 0; i < n; i++) {
      if (this.inBuffer <= 0) {
        throw new Error(`Buffer empty ${n}`);
      }
      res.push(this.buffer[this.readCursor++ % this.size]);
    }
    this.inBuffer -= Math.min(this.inBuffer, n);

    return res;
  }
}

const frameSize = 512;
class StretchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'rate', defaultValue: 1 }];
  }

  constructor(...opts) {
    super(...opts);
    this.ibufs = [new RingBuffer(frameSize * 2), new RingBuffer(frameSize * 2)];
    this.obufs = [new RingBuffer(frameSize * 2), new RingBuffer(frameSize * 2)];
    this.ix = null;
  }

  process(inputs, outputs, parameters) {
    if (!inputs[0][0] || inputs[0][0].length === 0) {
      return false;
    }

    inputs[0].forEach((input, i) => {
      this.ibufs[i].enq(input);
    });

    if (this.ibufs[0].inBuffer >= frameSize) {
      // Stretch processing will happen here
      this.ibufs.forEach((ibuf, i) => {
        this.obufs[i].enq(ibuf.deq(frameSize));
      });
    }

    if (this.obufs[0].inBuffer >= frameSize) {
      outputs[0].forEach((_, i) => {
        const toOutput = this.obufs[i].deq(128);
        for (let j = 0; j < 128; j++) {
          outputs[0][i][j] = toOutput[j];
        }
      });
    }

    return true;
  }
}

registerProcessor('stretch-processor', StretchProcessor);
