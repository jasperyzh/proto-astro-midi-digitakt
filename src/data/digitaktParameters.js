// Digitakt MIDI parameter mappings
// Values based on Elektron Digitakt MIDI Implementation Chart

// Helper function to calculate NRPN value from MSB (X) and LSB (Y)
const calculateNrpn = (msb, lsb) => (msb * 128) + lsb;

// Define parameter groups based on Digitakt structure
export const parameterGroups = {
  // --- Audio Track Parameters (Example for Track 1, Channel 0) ---
  // Note: Channel should be dynamic based on selected track in a future implementation
  source: {
    title: "Source",
    channel: 0, // Default to Track 1 (MIDI Channel 1)
    parameters: [
      { id: "src_tune", name: "Tune", type: "knob", min: -64, max: 63, value: 0, nrpn: calculateNrpn(1, 0) }, // Range approx -60 to +24, map to -64/63 for NRPN? Using -64/63 for wider range.
      // { id: "src_play_mode", name: "Play Mode", type: "knob", min: 0, max: 3, value: 0, cc: 17 }, // Values depend on machine, knob 0-3 for now
      { id: "src_bit_redux", name: "Bit Reduction", type: "knob", min: 0, max: 127, value: 0, cc: 18, nrpn: calculateNrpn(1, 2) },
      { id: "src_sample_select", name: "Sample Slot", type: "knob", min: 0, max: 127, value: 0, cc: 19, nrpn: calculateNrpn(1, 3) }, // 0=OFF, 1-127=Sample
      { id: "src_sample_level", name: "Sample Level", type: "knob", min: 0, max: 127, value: 100, cc: 23, nrpn: calculateNrpn(1, 7) },
      { id: "src_srr", name: "SRR", type: "knob", min: 0, max: 127, value: 0, cc: 87, nrpn: calculateNrpn(1, 53) }, // Sample Rate Reduction
      { id: "src_srr_routing", name: "SRR Route", type: "toggle", min: 0, max: 1, value: 0, nrpn: calculateNrpn(1, 54), offLabel: "PRE", onLabel: "POST" },
      { id: "src_base", name: "Base", type: "knob", min: 0, max: 127, value: 64, cc: 84, nrpn: calculateNrpn(1, 51) }, // Filter Base
      { id: "src_width", name: "Width", type: "knob", min: 0, max: 127, value: 64, cc: 85, nrpn: calculateNrpn(1, 52) }, // Filter Width
    ]
  },
  filter: {
    title: "Filter",
    channel: 0,
    parameters: [
      { id: "flt_freq", name: "Frequency", type: "knob", min: 0, max: 127, value: 127, cc: 74, nrpn: calculateNrpn(1, 20) },
      { id: "flt_res", name: "Resonance", type: "knob", min: 0, max: 127, value: 0, cc: 75, nrpn: calculateNrpn(1, 21) },
      { id: "flt_type", name: "Type", type: "knob", min: 0, max: 7, value: 0, cc: 76, nrpn: calculateNrpn(1, 22) }, // Multiple types, represent as 0-7
      { id: "flt_env_attack", name: "Env Attack", type: "slider", min: 0, max: 127, value: 0, cc: 70, nrpn: calculateNrpn(1, 16) },
      { id: "flt_env_decay", name: "Env Decay", type: "slider", min: 0, max: 127, value: 64, cc: 71, nrpn: calculateNrpn(1, 17) },
      { id: "flt_env_sustain", name: "Env Sustain", type: "slider", min: 0, max: 127, value: 127, cc: 72, nrpn: calculateNrpn(1, 18) },
      { id: "flt_env_release", name: "Env Release", type: "slider", min: 0, max: 127, value: 64, cc: 73, nrpn: calculateNrpn(1, 19) },
      { id: "flt_env_depth", name: "Env Depth", type: "knob", min: -64, max: 63, value: 0, cc: 77, nrpn: calculateNrpn(1, 23) }, // Mapped 0-127 to -64/63
      { id: "flt_env_delay", name: "Env Delay", type: "slider", min: 0, max: 127, value: 0, cc: 86, nrpn: calculateNrpn(1, 50) },
    ]
  },
  amp: {
    title: "Amplifier",
    channel: 0,
    parameters: [
      { id: "amp_attack", name: "Attack", type: "slider", min: 0, max: 127, value: 0, cc: 78, nrpn: calculateNrpn(1, 24) },
      { id: "amp_hold", name: "Hold", type: "slider", min: 0, max: 127, value: 0, cc: 79, nrpn: calculateNrpn(1, 25) }, // Also includes 'INF' setting
      { id: "amp_decay", name: "Decay", type: "slider", min: 0, max: 127, value: 64, cc: 80, nrpn: calculateNrpn(1, 26) }, // Also includes 'INF' setting
      { id: "amp_overdrive", name: "Overdrive", type: "knob", min: 0, max: 127, value: 0, cc: 81, nrpn: calculateNrpn(1, 27) },
      { id: "amp_delay_send", name: "Delay Send", type: "knob", min: 0, max: 127, value: 0, cc: 82, nrpn: calculateNrpn(1, 28) },
      { id: "amp_reverb_send", name: "Reverb Send", type: "knob", min: 0, max: 127, value: 0, cc: 83, nrpn: calculateNrpn(1, 29) },
      { id: "amp_pan", name: "Pan", type: "knob", min: -64, max: 63, value: 0, cc: 10, nrpn: calculateNrpn(1, 30) }, // MIDI CC is 0-127, NRPN uses -64 to +63
      { id: "amp_volume", name: "Volume", type: "knob", min: 0, max: 127, value: 100, cc: 7, nrpn: calculateNrpn(1, 31) },
      { id: "amp_level", name: "Track Level", type: "knob", min: 0, max: 127, value: 100, cc: 95 },
      { id: "amp_mute", name: "Mute", type: "toggle", min: 0, max: 1, value: 0, cc: 94, offLabel:"UNMUTE", onLabel:"MUTE" } // Assuming 0=unmuted, 1=muted
    ]
  },
  lfo1: {
    title: "LFO 1",
    channel: 0,
    parameters: [
      { id: "lfo1_speed", name: "Speed", type: "knob", min: -64, max: 63, value: 0, cc: 102, nrpn: calculateNrpn(1, 32) },
      { id: "lfo1_mult", name: "Multiplier", type: "knob", min: 0, max: 127, value: 16, cc: 103, nrpn: calculateNrpn(1, 33) }, // Values depend on BPM sync
      { id: "lfo1_fade", name: "Fade", type: "slider", min: -64, max: 63, value: 0, cc: 104, nrpn: calculateNrpn(1, 34) },
      { id: "lfo1_dest", name: "Destination", type: "knob", min: 0, max: 127, value: 0, cc: 105, nrpn: calculateNrpn(1, 35) }, // Values map to destinations
      { id: "lfo1_wave", name: "Waveform", type: "knob", min: 0, max: 7, value: 0, cc: 106, nrpn: calculateNrpn(1, 36) }, // Values map to waveforms
      { id: "lfo1_phase", name: "Start Phase", type: "knob", min: 0, max: 127, value: 0, cc: 107, nrpn: calculateNrpn(1, 37) },
      { id: "lfo1_mode", name: "Trig Mode", type: "toggle", min: 0, max: 1, value: 0, cc: 108, nrpn: calculateNrpn(1, 38), offLabel:"FREE", onLabel:"TRIG" },
      { id: "lfo1_depth", name: "Depth", type: "knob", min: -64, max: 63, value: 0, cc: 109, nrpn: calculateNrpn(1, 39) }, // CC 109 MSB, CC 61 LSB for 14-bit. NRPN simpler.
    ]
  },
   lfo2: { // Assuming LFO2 exists and follows similar pattern based on user list hints
    title: "LFO 2",
    channel: 0, // Same channel as Track params
    parameters: [
      { id: "lfo2_speed", name: "Speed", type: "knob", min: -64, max: 63, value: 0, cc: 112, nrpn: calculateNrpn(1, 40) },
      { id: "lfo2_mult", name: "Multiplier", type: "knob", min: 0, max: 127, value: 16, cc: 113, nrpn: calculateNrpn(1, 41) },
      { id: "lfo2_fade", name: "Fade", type: "slider", min: -64, max: 63, value: 0, cc: 114, nrpn: calculateNrpn(1, 42) },
      { id: "lfo2_dest", name: "Destination", type: "knob", min: 0, max: 127, value: 0, cc: 115, nrpn: calculateNrpn(1, 43) },
      { id: "lfo2_wave", name: "Waveform", type: "knob", min: 0, max: 7, value: 0, cc: 116, nrpn: calculateNrpn(1, 44) },
      { id: "lfo2_phase", name: "Start Phase", type: "knob", min: 0, max: 127, value: 0, cc: 117, nrpn: calculateNrpn(1, 45) },
      { id: "lfo2_mode", name: "Trig Mode", type: "toggle", min: 0, max: 1, value: 0, cc: 118, nrpn: calculateNrpn(1, 46), offLabel:"FREE", onLabel:"TRIG" },
      { id: "lfo2_depth", name: "Depth", type: "knob", min: -64, max: 63, value: 0, cc: 119, nrpn: calculateNrpn(1, 47) }, // CC 119 MSB, CC 63 LSB. NRPN simpler.
    ]
  },
  delay: {
    title: "Delay FX",
    channel: 0, // Global FX might not adhere strictly to track channel? Check Digitakt manual. Defaulting to 0.
    parameters: [
      // Note: User list has CC85 MSB/CC2 LSB etc. for Delay/Reverb/Comp, implying 14-bit CC. WebMIDI might struggle. Sticking to NRPN.
      { id: "delay_time", name: "Time", type: "knob", min: 1, max: 128, value: 64, nrpn: calculateNrpn(2, 0) },
      { id: "delay_pingpong", name: "Ping Pong", type: "toggle", min: 0, max: 1, value: 0, nrpn: calculateNrpn(2, 1), offLabel:"OFF", onLabel:"ON" },
      { id: "delay_width", name: "Stereo Width", type: "knob", min: 0, max: 127, value: 64, nrpn: calculateNrpn(2, 2) },
      { id: "delay_feedback", name: "Feedback", type: "knob", min: 0, max: 127, value: 64, nrpn: calculateNrpn(2, 3) },
      { id: "delay_hpf", name: "Highpass", type: "knob", min: 0, max: 127, value: 0, nrpn: calculateNrpn(2, 4) },
      { id: "delay_lpf", name: "Lowpass", type: "knob", min: 0, max: 127, value: 127, nrpn: calculateNrpn(2, 5) },
      { id: "delay_reverb_send", name: "Reverb Send", type: "knob", min: 0, max: 127, value: 0, nrpn: calculateNrpn(2, 6) },
      { id: "delay_mix", name: "Mix Volume", type: "slider", min: 0, max: 127, value: 0, nrpn: calculateNrpn(2, 7) },
    ]
  },
  reverb: {
    title: "Reverb FX",
    channel: 0,
    parameters: [
      { id: "rev_predelay", name: "Predelay", type: "knob", min: 0, max: 127, value: 64, nrpn: calculateNrpn(2, 8) },
      { id: "rev_decay", name: "Decay", type: "knob", min: 0, max: 127, value: 64, nrpn: calculateNrpn(2, 9) }, // Includes INF
      { id: "rev_shelf_freq", name: "Shelf Freq", type: "knob", min: 0, max: 127, value: 64, nrpn: calculateNrpn(2, 10) },
      { id: "rev_shelf_gain", name: "Shelf Gain", type: "knob", min: -64, max: 63, value: 0, nrpn: calculateNrpn(2, 11) },
      { id: "rev_hpf", name: "Highpass", type: "knob", min: 0, max: 127, value: 0, nrpn: calculateNrpn(2, 12) },
      { id: "rev_lpf", name: "Lowpass", type: "knob", min: 0, max: 127, value: 127, nrpn: calculateNrpn(2, 13) },
      { id: "rev_comp_route", name: "Comp Route", type: "toggle", min: 0, max: 1, value: 0, nrpn: calculateNrpn(2, 14), offLabel:"PRE", onLabel:"POST" },
      { id: "rev_mix", name: "Mix Volume", type: "slider", min: 0, max: 127, value: 0, nrpn: calculateNrpn(2, 15) },
    ]
  },
  compressor: {
    title: "Compressor FX",
    channel: 0,
    parameters: [
      { id: "comp_threshold", name: "Threshold", type: "knob", min: 0, max: 127, value: 64, nrpn: calculateNrpn(2, 16) }, // Maps to dB range
      { id: "comp_attack", name: "Attack", type: "knob", min: 0, max: 127, value: 64, nrpn: calculateNrpn(2, 17) }, // Maps to ms range
      { id: "comp_release", name: "Release", type: "knob", min: 0, max: 127, value: 64, nrpn: calculateNrpn(2, 18) }, // Maps to ms range
      { id: "comp_makeup", name: "Makeup Gain", type: "knob", min: 0, max: 127, value: 64, nrpn: calculateNrpn(2, 19) }, // Maps to dB range
      // Skipping Pattern Volume (NRPN 2 24) for now
      // Skipping External Mixer controls (NRPN 2 32-39) for now
    ]
  },
  // VAL Controls for MIDI Tracks (Example, Channel 8 = MIDI Track 9)
  midiTrackVal: {
    title: "MIDI VAL Controls",
    channel: 8, // Default channel 9
    parameters: [
      { id: "midi_val1", name: "VAL1", type: "knob", min: 0, max: 127, value: 0, cc: 70 },
      { id: "midi_val2", name: "VAL2", type: "knob", min: 0, max: 127, value: 0, cc: 71 },
      { id: "midi_val3", name: "VAL3", type: "knob", min: 0, max: 127, value: 0, cc: 72 },
      { id: "midi_val4", name: "VAL4", type: "knob", min: 0, max: 127, value: 0, cc: 73 },
      { id: "midi_val5", name: "VAL5", type: "knob", min: 0, max: 127, value: 0, cc: 74 },
      { id: "midi_val6", name: "VAL6", type: "knob", min: 0, max: 127, value: 0, cc: 75 },
      { id: "midi_val7", name: "VAL7", type: "knob", min: 0, max: 127, value: 0, cc: 76 },
      { id: "midi_val8", name: "VAL8", type: "knob", min: 0, max: 127, value: 0, cc: 77 },
    ]
  },

};

// --- Helper functions for preset management (Keep these) ---

// Function to extract default values
export function getDefaultParameterValues() {
  const defaults = {};
  for (const groupKey in parameterGroups) {
    defaults[groupKey] = {};
    parameterGroups[groupKey].parameters.forEach(param => {
      defaults[groupKey][param.id] = param.value;
    });
  }
  return defaults;
}

// Function to create a snapshot of current values (requires parameters to be reactive refs)
// This needs adjustment if parameters aren't passed directly as refs
export function createParameterSnapshot(reactiveParameters) {
   const snapshot = {};
   for (const groupKey in reactiveParameters) {
     snapshot[groupKey] = {};
     reactiveParameters[groupKey].parameters.forEach(param => {
       // Assuming param.value holds the current reactive value
       snapshot[groupKey][param.id] = param.value;
     });
   }
   return snapshot;
}


// Function to restore values from a snapshot (requires parameters to be reactive refs)
export function restoreParameterValues(snapshot, reactiveParameters) {
  for (const groupKey in snapshot) {
    if (reactiveParameters[groupKey]) {
      reactiveParameters[groupKey].parameters.forEach(param => {
        if (snapshot[groupKey]?.[param.id] !== undefined) {
          // Assuming param.value is a ref or can be directly assigned
          param.value = snapshot[groupKey][param.id];
          // TODO: Might need to trigger MIDI send here if required
        }
      });
    }
  }
}

// You might need to adjust snapshot/restore if the parameters passed to components aren't reactive refs
// or find a different way to manage state persistence (e.g., Pinia store). 