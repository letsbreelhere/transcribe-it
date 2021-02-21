class RingBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = [];
    this.writeCursor = 0;
    this.readCursor = 0;
    this.inBuffer;
  }

  push(values) {
    if (this.size - this.inBuffer < values.length) {
      throw "Buffer full";
    }
    this.inBuffer += values.length;

    values.forEach((val) => {
      this.buffer[this.writeCursor++ % size] = value;
    })
  }

  take(n) {
    let res = [];
    for (let i = 0; i < n; i++) {
      if (this.inBuffer === 0) {
        throw "Buffer empty";
      }
      res.push(this.buffer[this.readCursor++ % size]);
    }

    return res;
  }
}

class StretchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'rate', defaultValue: 1 }];
  }

  constructor(...opts) {
    super(...opts)
    this.lbuf = [];
    this.rbuf = [];
    this.ix = null;
  }

  process(inputs, outputs, parameters) {
    const rate = 2;

    if (this.ix === null) {
      for (let i = 0; i < 128; ++i) {
        outputs[0][0][i] = inputs[0][0][i];
        outputs[0][1][i] = inputs[0][1][i];
      }
      this.lbuf = Array(inputs[0][0]);
      this.rbuf = Array(inputs[0][1]);
      this.ix = 0;
    } else {
      for (let i = 0; i < 128; ++i) {
        outputs[0][0][i] = this.lbuf[this.ix+i];
        outputs[0][1][i] = this.rbuf[this.ix+i];
      }
      this.ix += 128;
      const writeIx = rate*this.ix;
      for (let i = 0; i < rate*128; ++i) {
        this.lbuf[writeIx + i] = inputs[0][0][i%128];
        this.rbuf[writeIx + i] = inputs[0][1][i%128];
      }
    }
    return true;
  }
}

registerProcessor('stretch-processor', StretchProcessor);
