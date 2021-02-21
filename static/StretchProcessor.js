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
      throw new Error('Buffer full');
    }
    this.inBuffer += values.length;

    values.forEach((value) => {
      this.buffer[this.writeCursor++ % this.size] = value;
    });
  }

  deq(n) {
    const res = [];
    for (let i = 0; i < n; i++) {
      if (this.inBuffer <= 0) {
        throw new Error('Buffer empty');
      }
      res.push(this.buffer[this.readCursor++ % this.size]);
    }

    return res;
  }
}

class StretchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'rate', defaultValue: 1 }];
  }

  constructor(...opts) {
    super(...opts);
    this.lbuf = [];
    this.rbuf = [];
    this.ix = null;
  }

  process(inputs, outputs, parameters) {
    const rate = 2;

    if (this.ix === null) {
      for (let i = 0; i < 128; i++) {
        outputs[0][0][i] = inputs[0][0][i];
        outputs[0][1][i] = inputs[0][1][i];
      }
      this.lbuf = Array(inputs[0][0]);
      this.rbuf = Array(inputs[0][1]);
      this.ix = 0;
    } else {
      for (let i = 0; i < 128; i++) {
        outputs[0][0][i] = this.lbuf[this.ix + i];
        outputs[0][1][i] = this.rbuf[this.ix + i];
      }
      this.ix += 128;
      const writeIx = rate * this.ix;
      for (let i = 0; i < rate * 128; i++) {
        this.lbuf[writeIx + i] = inputs[0][0][i % 128];
        this.rbuf[writeIx + i] = inputs[0][1][i % 128];
      }
    }
    return true;
  }
}

registerProcessor('stretch-processor', StretchProcessor);
