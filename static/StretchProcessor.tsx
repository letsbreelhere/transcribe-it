class StretchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'rate', defaultValue: 1 }];
  }

  process(inputs, outputs, parameters) {
    for (let i = 0; i < inputs[0][0].length; ++i) {
      outputs[0][0][i] = inputs[0][0][i];
      outputs[0][1][i] = inputs[0][1][i];
    }
    return true;
  }
}

registerProcessor('stretch-processor', StretchProcessor);
