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
        `Buffer full: tried to enqueue ${values.length} but capacity is ${
          this.size - this.inBuffer
        }`
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
    if (this.inBuffer < n) {
      throw new Error(
        `Buffer empty: tried to dequeue ${n} but only have ${this.inBuffer}`
      );
    }
    for (let i = 0; i < n; i++) {
      res.push(this.buffer[this.readCursor++ % this.size]);
    }
    this.inBuffer -= n;

    return res;
  }
}

const frameSize = 1024;
const rate = 2;
class StretchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'rate', defaultValue: 1 }];
  }

  constructor(...opts) {
    super(...opts);
    this.ibufs = [new RingBuffer(frameSize * 2), new RingBuffer(frameSize * 2)];
    this.pbufs = [[], []];
    this.obufs = [new RingBuffer(frameSize * 2), new RingBuffer(frameSize * 2)];
    this.writeIx = 0;
    this.ix = 0;
  }

  process(inputs, outputs, parameters) {
    if (inputs[0][0]?.length === 0) {
      return false;
    }

    // Enqueue this frame into input buffers
    inputs[0].forEach((input, i) => {
      this.ibufs[i].enq(input);
    });

    // If input buffers are full, push them to grain buffer
    if (this.ibufs[0].inBuffer >= frameSize) {
      this.ibufs.forEach((ibuf, i) => {
        const dequeued = ibuf.deq(frameSize);
        for (let j = 0; j < frameSize * rate; j++) {
          this.pbufs[i][this.writeIx + j] = dequeued[j % frameSize];
        }
      });
      this.writeIx += Math.floor(rate * frameSize);
    }

    // Output if the buffer is full
    if (this.pbufs[0].length >= frameSize) {
      outputs[0].forEach((_, i) => {
        for (let j = 0; j < 128; j++) {
          outputs[0][i][j] = this.pbufs[i][this.ix + j];
        }
      });
      this.ix += 128;
    }

    return true;
  }
}

registerProcessor('stretch-processor', StretchProcessor);
