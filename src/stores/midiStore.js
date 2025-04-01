import { reactive, ref } from 'vue';

// Main MIDI state store
export const midiState = reactive({
  devices: {
    inputs: [],
    outputs: []
  },
  selectedInput: null,
  selectedOutput: null,
  connectionStatus: 'disconnected', // 'disconnected', 'connected', 'error'
  lastError: null,
  midiAccess: null,
  lastMidiMessage: null,
  messageLog: [],
  isNrpnMode: false,
});

// Maximum number of messages to keep in the log
const MAX_LOG_SIZE = 100;

// Initialize Web MIDI API
export async function initMidi() {
  try {
    if (!navigator.requestMIDIAccess) {
      throw new Error('Web MIDI API is not supported in this browser');
    }
    
    const midiAccess = await navigator.requestMIDIAccess({ sysex: true });
    midiState.midiAccess = midiAccess;
    updateDeviceLists();
    
    // Listen for device connection/disconnection
    midiAccess.addEventListener('statechange', handleStateChange);
    
    midiState.connectionStatus = 'connected';
    return true;
  } catch (error) {
    midiState.connectionStatus = 'error';
    midiState.lastError = error.message;
    console.error('MIDI Initialization Error:', error);
    return false;
  }
}

// Update lists of available MIDI devices
function updateDeviceLists() {
  if (!midiState.midiAccess) return;
  
  const inputs = [];
  const outputs = [];
  
  midiState.midiAccess.inputs.forEach(input => {
    inputs.push({
      id: input.id,
      name: input.name || `Input ${input.id}`,
      manufacturer: input.manufacturer || 'Unknown',
      reference: input
    });
  });
  
  midiState.midiAccess.outputs.forEach(output => {
    outputs.push({
      id: output.id,
      name: output.name || `Output ${output.id}`,
      manufacturer: output.manufacturer || 'Unknown',
      reference: output
    });
  });
  
  midiState.devices.inputs = inputs;
  midiState.devices.outputs = outputs;
}

// Handle MIDI device state changes
function handleStateChange(event) {
  updateDeviceLists();
  
  // Log the state change
  const device = event.port;
  const isConnected = device.state === 'connected';
  const direction = device.type === 'input' ? 'Input' : 'Output';
  
  addToMessageLog({
    type: 'system',
    message: `${direction} device "${device.name}" ${isConnected ? 'connected' : 'disconnected'}`,
    timestamp: new Date()
  });
}

// Connect to selected input device
export function connectInput(inputId) {
  if (!midiState.midiAccess) return false;
  
  // Disconnect current input if any
  if (midiState.selectedInput) {
    midiState.selectedInput.reference.onmidimessage = null;
    midiState.selectedInput = null;
  }
  
  if (!inputId) return true; // Just disconnecting
  
  const input = midiState.devices.inputs.find(d => d.id === inputId);
  if (!input) return false;
  
  // Connect to the new input
  input.reference.onmidimessage = handleMidiMessage;
  midiState.selectedInput = input;
  
  addToMessageLog({
    type: 'system',
    message: `Connected to input: ${input.name}`,
    timestamp: new Date()
  });
  
  return true;
}

// Connect to selected output device
export function connectOutput(outputId) {
  if (!midiState.midiAccess) return false;
  
  if (midiState.selectedOutput) {
    midiState.selectedOutput = null;
  }
  
  if (!outputId) return true; // Just disconnecting
  
  const output = midiState.devices.outputs.find(d => d.id === outputId);
  if (!output) return false;
  
  midiState.selectedOutput = output;
  
  addToMessageLog({
    type: 'system',
    message: `Connected to output: ${output.name}`,
    timestamp: new Date()
  });
  
  return true;
}

// Handle incoming MIDI messages
function handleMidiMessage(event) {
  const message = {
    data: Array.from(event.data),
    timestamp: new Date(),
    decoded: decodeMidiMessage(event.data)
  };
  
  midiState.lastMidiMessage = message;
  
  addToMessageLog({
    type: 'input',
    message: message.decoded,
    rawData: message.data,
    timestamp: message.timestamp
  });
}

// Send MIDI message to the selected output
export function sendMidiMessage(data) {
  if (!midiState.selectedOutput) {
    addToMessageLog({
      type: 'error',
      message: 'No output device selected',
      timestamp: new Date()
    });
    return false;
  }
  
  try {
    midiState.selectedOutput.reference.send(data);
    
    addToMessageLog({
      type: 'output',
      message: decodeMidiMessage(data),
      rawData: Array.from(data),
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    addToMessageLog({
      type: 'error',
      message: `Failed to send MIDI message: ${error.message}`,
      timestamp: new Date()
    });
    return false;
  }
}

// Send Control Change (CC) message
export function sendCC(device, channel, controller, value) {
  // device parameter is optional (null is allowed)
  const status = 0xB0 | (channel & 0x0F); // Control Change status byte
  return sendMidiMessage([status, controller & 0x7F, value & 0x7F]);
}

// Send NRPN message (Non-Registered Parameter Number)
export function sendNRPN(device, channel, parameter, value) {
  // device parameter is optional (null is allowed)
  const paramMSB = (parameter >> 7) & 0x7F;
  const paramLSB = parameter & 0x7F;
  const valueMSB = (value >> 7) & 0x7F;
  const valueLSB = value & 0x7F;
  
  const status = 0xB0 | (channel & 0x0F); // Control Change status byte
  
  // NRPN is sent as a sequence of Control Change messages
  sendMidiMessage([status, 99, paramMSB]); // NRPN Parameter MSB
  sendMidiMessage([status, 98, paramLSB]); // NRPN Parameter LSB
  sendMidiMessage([status, 6, valueMSB]);  // Data Entry MSB
  return sendMidiMessage([status, 38, valueLSB]); // Data Entry LSB
}

// Basic MIDI message decoder
function decodeMidiMessage(data) {
  if (!data || data.length === 0) return 'Empty message';
  
  const status = data[0] & 0xF0; // Status byte (high nibble)
  const channel = data[0] & 0x0F; // Channel (low nibble)
  
  switch (status) {
    case 0x80:
      return `Note Off: channel ${channel + 1}, note ${data[1]}, velocity ${data[2]}`;
    case 0x90:
      return data[2] === 0
        ? `Note Off: channel ${channel + 1}, note ${data[1]}`
        : `Note On: channel ${channel + 1}, note ${data[1]}, velocity ${data[2]}`;
    case 0xA0:
      return `Aftertouch: channel ${channel + 1}, note ${data[1]}, pressure ${data[2]}`;
    case 0xB0:
      return `Control Change: channel ${channel + 1}, controller ${data[1]}, value ${data[2]}`;
    case 0xC0:
      return `Program Change: channel ${channel + 1}, program ${data[1]}`;
    case 0xD0:
      return `Channel Pressure: channel ${channel + 1}, pressure ${data[1]}`;
    case 0xE0:
      const pitchValue = ((data[2] << 7) | data[1]) - 8192;
      return `Pitch Bend: channel ${channel + 1}, value ${pitchValue}`;
    case 0xF0:
      return `System Message: ${data.map(b => b.toString(16).padStart(2, '0')).join(' ')}`;
    default:
      return `Unknown: ${data.map(b => b.toString(16).padStart(2, '0')).join(' ')}`;
  }
}

// Add message to log with timestamp
function addToMessageLog(message) {
  midiState.messageLog.unshift(message);
  
  // Trim log if it exceeds maximum size
  if (midiState.messageLog.length > MAX_LOG_SIZE) {
    midiState.messageLog.length = MAX_LOG_SIZE;
  }
} 