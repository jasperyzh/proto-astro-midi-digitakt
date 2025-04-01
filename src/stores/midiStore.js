import { reactive, ref } from 'vue';
import { useMidiDebugger } from '../composables/useMidiDebugger';

// Initialize the MIDI debugger
const { logMessage, logError } = useMidiDebugger();

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
    
    // Log error to debugger
    logError(error);
    
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
  
  const stateChangeMsg = {
    type: 'system',
    message: `${direction} device "${device.name}" ${isConnected ? 'connected' : 'disconnected'}`,
    timestamp: new Date()
  };

  
  addToMessageLog(stateChangeMsg);
  logMessage(stateChangeMsg); // Log to debugger
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
  
  const connectMsg = {
    type: 'system',
    message: `Connected to input: ${input.name}`,
    timestamp: new Date()
  };
  
  addToMessageLog(connectMsg);
  logMessage(connectMsg); // Log to debugger
  
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
  
  const connectMsg = {
    type: 'system',
    message: `Connected to output: ${output.name}`,
    timestamp: new Date()
  };
  
  addToMessageLog(connectMsg);
  logMessage(connectMsg); // Log to debugger
  
  return true;
}

// Handle incoming MIDI messages
function handleMidiMessage(event) {
  try {
    console.warn("🎹 [MIDI DEBUG] Raw MIDI message received:", event.data);
    
    // First, ensure we have valid data
    if (!event.data || !event.data.length) {
      console.error("🎹 [MIDI ERROR] Invalid MIDI message received - no data");
      return;
    }
    
    const data = Array.from(event.data);
    console.warn("🎹 [MIDI DEBUG] MIDI data as array:", data, "First byte as hex:", data[0].toString(16));
    
    // For debugging, dump the status and channel info
    const status = data[0] & 0xF0; // Status byte (high nibble)
    const channel = data[0] & 0x0F; // Channel (low nibble)
    
    console.warn(`🎹 [MIDI DEBUG] MIDI status: 0x${status.toString(16)}, channel: ${channel+1}, status byte: 0x${data[0].toString(16)}`);
    
    // Special handling for note messages - some devices use non-standard velocity encoding
    const isNoteMessage = (status === 0x80 || status === 0x90);
    let normalizedVelocity = isNoteMessage ? data[2] : undefined;
    
    // Ensure velocity is never undefined for note messages
    if (isNoteMessage && (normalizedVelocity === undefined || normalizedVelocity === null)) {
      normalizedVelocity = 0;
    }
    
    // Adjust velocity if it's abnormally high or uses a non-standard range
    if (isNoteMessage && normalizedVelocity > 127) {
      console.warn("🎹 [MIDI DEBUG] Adjusting abnormal velocity value:", normalizedVelocity);
      normalizedVelocity = Math.min(normalizedVelocity, 127);
    }
    
    // Check for Digitakt-specific characteristics
    // Digitakt often sends on channels 9-10 (indexed as 8-9)
    const isDigitaktChannel = (channel === 8 || channel === 9);
    console.warn("🎹 [MIDI DEBUG] Is Digitakt channel:", isDigitaktChannel, "channel:", channel+1);
    
    // Create the decoded message
    const decoded = decodeMidiMessage(data);
    console.warn("🎹 [MIDI DEBUG] Decoded MIDI message:", decoded);
    
    const message = {
      data: data,
      timestamp: new Date(),
      decoded: decoded,
      statusByte: data[0]
    };
    
    midiState.lastMidiMessage = message;
    
    // Create a base log entry with default values
    const logEntry = {
      type: 'input',
      message: decoded,
      rawData: data,
      timestamp: message.timestamp,
      channel: channel + 1, // Convert to 1-16 range
      details: {}
    };
    
    // Add type-specific details
    switch (status) {
      case 0x80: // Note Off
      case 0x90: // Note On
        const isNoteOn = status === 0x90 && data[2] > 0;
        const noteName = getMidiNoteName(data[1]);
        console.warn(`🎹 [MIDI DEBUG] Note message: ${isNoteOn ? "On" : "Off"}, Note: ${noteName} (${data[1]}), Velocity: ${normalizedVelocity}`);
        
        // Special case for Digitakt messages on channels 9-10
        if (isDigitaktChannel) {
          console.warn("🎹 [MIDI DEBUG] Processing Digitakt note message");
          
          let digitaktNote = data[1];
          let digitaktNoteName = "Digitakt: ";
          
          // Map common Digitakt notes
          if (digitaktNote >= 60 && digitaktNote <= 67) {
            // Track triggers typically use C4 (60) through G4 (67)
            digitaktNoteName += `Track ${digitaktNote - 59}`;
          } else if (digitaktNote === 72) {
            // A4 (72) is often "MIDI A" on Digitakt
            digitaktNoteName += "MIDI A";
          } else if (digitaktNote === 74) {
            // B4 (74) is often "MIDI B" on Digitakt
            digitaktNoteName += "MIDI B";
          } else if (digitaktNote === 48) {
            // C3 (48) is often used for pads
            digitaktNoteName += "Pad";
          } else {
            digitaktNoteName += noteName;
          }
          
          console.warn("🎹 [MIDI DEBUG] Created Digitakt note name:", digitaktNoteName, "for note", digitaktNote);
          
          logEntry.details = {
            messageType: isNoteOn ? 'Note On' : 'Note Off',
            note: digitaktNoteName,
            noteNumber: data[1],
            velocity: normalizedVelocity
          };
        } else {
          // Standard note message handling
          logEntry.details = {
            messageType: isNoteOn ? 'Note On' : 'Note Off',
            note: noteName,
            noteNumber: data[1],
            velocity: normalizedVelocity
          };
        }
        break;
        
      case 0xA0: // Aftertouch
        logEntry.details = {
          messageType: 'Aftertouch',
          note: getMidiNoteName(data[1]),
          noteNumber: data[1],
          pressure: data[2]
        };
        break;
        
      case 0xB0: // Control Change
        logEntry.details = {
          messageType: 'Control Change',
          controller: data[1],
          value: data[2]
        };
        break;
        
      case 0xC0: // Program Change
        logEntry.details = {
          messageType: 'Program Change',
          program: data[1]
        };
        break;
        
      case 0xD0: // Channel Pressure
        logEntry.details = {
          messageType: 'Channel Pressure',
          pressure: data[1]
        };
        break;
        
      case 0xE0: // Pitch Bend
        const pitchValue = ((data[2] << 7) | data[1]) - 8192;
        logEntry.details = {
          messageType: 'Pitch Bend',
          value: pitchValue
        };
        break;
        
      case 0xF0: // System Message
        logEntry.details = {
          messageType: 'System',
          data: data.map(b => b.toString(16).padStart(2, '0')).join(' ')
        };
        break;
        
      default:
        // Handle unusual status bytes
        console.warn("Unknown MIDI status byte:", status.toString(16));
        logEntry.details = {
          messageType: 'Unknown',
          data: data.map(b => b.toString(16).padStart(2, '0')).join(' ')
        };
    }
    
    console.warn("🎹 [MIDI DEBUG] Final log entry details:", logEntry.details);
    
    // Add to internal message log
    addToMessageLog(logEntry);
    
    // Also log to the MIDI debugger for the monitor component
    logMessage(logEntry);
    console.warn("🎹 [MIDI DEBUG] Message logged to debugger successfully");
  } catch (error) {
    console.error("Error handling MIDI message:", error);
    logError(`Failed to process MIDI message: ${error.message}`);
  }
}

// Helper to extract channel from status byte
function getChannelFromStatus(statusByte) {
  // If it's a channel message (not system message), extract channel
  if ((statusByte & 0xF0) !== 0xF0) {
    return (statusByte & 0x0F) + 1; // Convert from 0-15 to 1-16
  }
  return null;
}

// Send MIDI message to the selected output
export function sendMidiMessage(data) {
  if (!midiState.selectedOutput) {
    const errorMsg = {
      type: 'error',
      message: 'No output device selected',
      timestamp: new Date()
    };
    
    addToMessageLog(errorMsg);
    logError('No output device selected'); // Log to debugger
    return false;
  }
  
  try {
    midiState.selectedOutput.reference.send(data);
    
    const outputMsg = {
      type: 'output',
      message: decodeMidiMessage(data),
      rawData: Array.from(data),
      timestamp: new Date(),
      channel: getChannelFromStatus(data[0])
    };
    
    addToMessageLog(outputMsg);
    logMessage(outputMsg); // Log to debugger
    
    return true;
  } catch (error) {
    const errorMsg = {
      type: 'error',
      message: `Failed to send MIDI message: ${error.message}`,
      timestamp: new Date()
    };
    
    addToMessageLog(errorMsg);
    logError(error); // Log to debugger
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

// Helper function to convert MIDI note number to note name
function getMidiNoteName(noteNumber) {
  // Handle invalid note numbers
  if (noteNumber === undefined || noteNumber === null) {
    console.warn("Invalid note number: undefined or null");
    return "Unknown";
  }
  
  // Ensure the note number is a number and in valid range
  const noteNum = parseInt(noteNumber, 10);
  if (isNaN(noteNum) || noteNum < 0 || noteNum > 127) {
    console.warn(`Invalid MIDI note number: ${noteNumber}`);
    return `Unknown (${noteNumber})`;
  }
  
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(noteNum / 12) - 1;
  const noteName = notes[noteNum % 12];
  
  return `${noteName}${octave}`;
}

// Basic MIDI message decoder
function decodeMidiMessage(data) {
  if (!data || data.length === 0) return 'Empty message';
  
  const status = data[0] & 0xF0; // Status byte (high nibble)
  const channel = data[0] & 0x0F; // Channel (low nibble)
  
  switch (status) {
    case 0x80:
      return `Note Off: channel ${channel + 1}, note ${getMidiNoteName(data[1])} (${data[1]}), velocity ${data[2]}`;
    case 0x90:
      return data[2] === 0
        ? `Note Off: channel ${channel + 1}, note ${getMidiNoteName(data[1])} (${data[1]})`
        : `Note On: channel ${channel + 1}, note ${getMidiNoteName(data[1])} (${data[1]}), velocity ${data[2]}`;
    case 0xA0:
      return `Aftertouch: channel ${channel + 1}, note ${getMidiNoteName(data[1])} (${data[1]}), pressure ${data[2]}`;
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
  console.log("Adding to internal message log:", message);
  
  // Add to internal message log
  midiState.messageLog.unshift(message);
  
  // Trim log if it exceeds maximum size
  if (midiState.messageLog.length > MAX_LOG_SIZE) {
    midiState.messageLog.length = MAX_LOG_SIZE;
  }
} 