import { WebMidi } from 'webmidi';

/**
 * Initialize WebMIDI.js with SysEx support
 * @returns {Promise<Object>} MIDI access object with inputs, outputs, and Digitakt-specific devices
 */
export async function initMidi() {
  try {
    // Check if we're in a browser environment that has navigator
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      throw new Error('Web MIDI API is not supported in this browser');
    }

    // Enable WebMIDI with more robust error handling
    await WebMidi.enable({ 
      sysex: true,
      software: true // Try to enable software synthesizers too
    });
    
    console.log("WebMidi enabled successfully:", WebMidi.version);
    
    // Log available inputs and outputs for debugging
    console.log("Available MIDI inputs:", WebMidi.inputs.length);
    WebMidi.inputs.forEach(input => console.log(`- Input: ${input.name}`));
    
    console.log("Available MIDI outputs:", WebMidi.outputs.length);
    WebMidi.outputs.forEach(output => console.log(`- Output: ${output.name}`));
    
    // Find Digitakt specific devices with more flexible matching
    // Look for different possible Digitakt names in MIDI ports
    const digitaktNames = ['digitakt', 'elektron', 'midi 1'];
    
    const digitaktInput = WebMidi.inputs.find(input => {
      if (!input.name) return false;
      const lowerName = input.name.toLowerCase();
      return digitaktNames.some(term => lowerName.includes(term));
    });
    
    const digitaktOutput = WebMidi.outputs.find(output => {
      if (!output.name) return false;
      const lowerName = output.name.toLowerCase();
      return digitaktNames.some(term => lowerName.includes(term));
    });
    
    return {
      inputs: WebMidi.inputs,
      outputs: WebMidi.outputs,
      digitakt: {
        in: digitaktInput || null,
        out: digitaktOutput || null
      },
      webmidi: WebMidi // Export the WebMidi instance for advanced usage
    };
  } catch (err) {
    console.error("MIDI Initialization Failed:", err);
    throw new Error(`MIDI Init Failed: ${err.message}`);
  }
}

/**
 * Set up event listeners for MIDI device connection changes
 * @param {Function} onDeviceChange Callback for device connection changes
 */
export function setupMidiConnectionListeners(onDeviceChange) {
  WebMidi.addListener("connected", event => {
    console.log("MIDI Device Connected:", event.port.name);
    if (typeof onDeviceChange === "function") {
      onDeviceChange();
    }
  });
  
  WebMidi.addListener("disconnected", event => {
    console.log("MIDI Device Disconnected:", event.port.name);
    if (typeof onDeviceChange === "function") {
      onDeviceChange();
    }
  });
}

/**
 * Set up input message listeners for a specific MIDI input device
 * @param {Input} input MIDI input device
 * @param {Function} onMidiMessage Callback for MIDI messages
 * @returns {Boolean} Whether the listener was successfully set up
 */
export function setupInputListeners(input, onMidiMessage) {
  if (!input) {
    console.error("No MIDI input device provided for listener setup");
    return false;
  }
  
  try {
    // Remove any existing listeners first
    input.removeListener();
    
    // Listen for all message types
    input.addListener("midimessage", event => {
      /* console.log("MIDI Message Received:", 
        event.message.type, 
        "Channel:", event.message.channel,
        "Data:", event.message.data
      ); */
      
      if (typeof onMidiMessage === "function") {
        onMidiMessage(event);
      }
    });
    
    // Add specific listeners for common message types for better debugging
    input.addListener("controlchange", event => {
      console.log("Control Change Received:", 
        "Controller:", event.controller.number,
        "Value:", event.value,
        "Channel:", event.channel
      );
    });
    
    input.addListener("noteon", event => {
      console.log("Note On Received:", 
        event,
        "Note:", event.note.name + event.note.octave,
        "Velocity:", event.velocity,
        "Channel:", event.message.channel
      );
    });
    
    input.addListener("noteoff", event => {
      console.log("Note Off Received:", 
        "Note:", event.note.name + event.note.octave,
        "Channel:", event.message.channel
      );
    });
    
    input.addListener("sysex", event => {
      console.log("SysEx Message Received:", 
        "Length:", event.message.data.length,
        "Data:", event.message.data
      );
    });
    
    console.log(`Input listeners set up for ${input.name}`);
    return true;
  } catch (error) {
    console.error("Failed to set up MIDI input listeners:", error);
    return false;
  }
}

/**
 * Send a Control Change (CC) message
 * @param {Output} output MIDI output device
 * @param {Number} channel MIDI channel (1-16)
 * @param {Number} controller CC number
 * @param {Number} value CC value (0-127)
 */
export function sendCC(output, channel, controller, value) {
  // Get the output from WebMidi if available
  if (!output && WebMidi.outputs.length > 0) {
    output = WebMidi.outputs[0];
    console.log("Using default output:", output.name);
  }
  
  if (!output) {
    console.error("No MIDI output device selected");
    return false;
  }
  
  try {
    // Make sure channel is 1-based (WebMIDI.js expects 1-16, not 0-15)
    const midiChannel = channel + 1;
    
    output.sendControlChange(controller, value, { channels: midiChannel });
    console.log(`CC sent: ch:${midiChannel}, cc:${controller}, val:${value}`);
    return true;
  } catch (error) {
    console.error("Failed to send CC message:", error);
    return false;
  }
}

/**
 * Send a Non-Registered Parameter Number (NRPN) message
 * @param {Output} output MIDI output device
 * @param {Number} channel MIDI channel (1-16)
 * @param {Number} parameter NRPN parameter number
 * @param {Number} value NRPN value (0-16383 for 14-bit precision)
 */
export function sendNRPN(output, channel, parameter, value) {
  // Get the output from WebMidi if available
  if (!output && WebMidi.outputs.length > 0) {
    output = WebMidi.outputs[0];
    console.log("Using default output for NRPN:", output.name);
  }
  
  if (!output) {
    console.error("No MIDI output device selected");
    return false;
  }
  
  try {
    // Make sure channel is 1-based (WebMIDI.js expects 1-16, not 0-15)
    const midiChannel = channel + 1;
    
    // WebMidi.js expects parameter as a number for sendNrpnValue
    output.sendNrpnValue(parameter, value, { channels: midiChannel });
    console.log(`NRPN sent: ch:${midiChannel}, param:${parameter}, val:${value}`);
    return true;
  } catch (error) {
    console.error("Failed to send NRPN message:", error);
    return false;
  }
}

/**
 * Create a throttled version of a function to prevent MIDI flooding
 * @param {Function} func The function to throttle
 * @param {Number} limit Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}