// Digitakt MIDI parameter mappings
// Values based on Elektron Digitakt MIDI Implementation Chart

// Digitakt MIDI parameter specifications by category
export const parameterGroups = {
  // MIDI Track parameters 
  midiTrack: {
    title: "MIDI Track Controls",
    channel: 8, // Default to MIDI track 9 (0-indexed)
    parameters: [
      {
        id: "midi_val1",
        name: "VAL1",
        type: "knob",
        min: 0,
        max: 127,
        value: 0,
        cc: 70,
        nrpn: 16440
      },
      {
        id: "midi_val2",
        name: "VAL2",
        type: "knob",
        min: 0,
        max: 127,
        value: 0,
        cc: 71,
        nrpn: 16441
      },
      {
        id: "midi_val5",
        name: "VAL5",
        type: "knob",
        min: 0,
        max: 127,
        value: 0,
        cc: 74,
        nrpn: 16444
      },
      {
        id: "midi_val8",
        name: "VAL8",
        type: "knob",
        min: 0,
        max: 127,
        value: 0, 
        cc: 77,
        nrpn: 16447
      }
    ]
  },
  // Filter section parameters
  filter: {
    title: "Filter",
    channel: 0, // Default channel 1 (0-indexed)
    parameters: [
      {
        id: "filter_freq",
        name: "Frequency",
        type: "knob",
        min: 0,
        max: 127,
        value: 64,
        cc: 74,
        nrpn: 16384  // NRPN 0 + MSB 128
      },
      {
        id: "filter_res",
        name: "Resonance",
        type: "knob",
        min: 0,
        max: 127,
        value: 0,
        cc: 75,
        nrpn: 16385
      },
      {
        id: "filter_type",
        name: "Type",
        type: "toggle",
        min: 0,
        max: 1,
        value: 0,
        cc: 76,
        nrpn: 16386
      },
      {
        id: "filter_attack",
        name: "Attack",
        type: "slider",
        min: 0,
        max: 127,
        value: 0,
        cc: 73,
        nrpn: 16387
      }
    ]
  },
  
  // Amp section parameters
  amp: {
    title: "Amplifier",
    channel: 0,
    parameters: [
      {
        id: "amp_attack",
        name: "Attack",
        type: "slider",
        min: 0,
        max: 127,
        value: 0,
        cc: 24,
        nrpn: 16392
      },
      {
        id: "amp_decay",
        name: "Decay",
        type: "slider",
        min: 0,
        max: 127,
        value: 64,
        cc: 25,
        nrpn: 16393
      },
      {
        id: "amp_sustain",
        name: "Sustain",
        type: "slider",
        min: 0,
        max: 127,
        value: 0,
        cc: 26,
        nrpn: 16394
      },
      {
        id: "amp_release",
        name: "Release",
        type: "slider",
        min: 0,
        max: 127,
        value: 0,
        cc: 27,
        nrpn: 16395
      }
    ]
  },
  
  // LFO section parameters
  lfo: {
    title: "LFO",
    channel: 0,
    parameters: [
      {
        id: "lfo_speed",
        name: "Speed",
        type: "knob",
        min: 0,
        max: 127,
        value: 32,
        cc: 28,
        nrpn: 16400
      },
      {
        id: "lfo_multiply",
        name: "Multiply",
        type: "knob",
        min: 0,
        max: 127,
        value: 0,
        cc: 29,
        nrpn: 16401
      },
      {
        id: "lfo_fade",
        name: "Fade",
        type: "slider",
        min: 0,
        max: 127,
        value: 0,
        cc: 30,
        nrpn: 16402
      },
      {
        id: "lfo_destination",
        name: "Destination",
        type: "knob",
        min: 0,
        max: 127,
        value: 0,
        cc: 31,
        nrpn: 16403
      }
    ]
  },
  
  // Delay effect parameters
  delay: {
    title: "Delay",
    channel: 0,
    parameters: [
      {
        id: "delay_time",
        name: "Time",
        type: "knob",
        min: 0,
        max: 127,
        value: 64,
        cc: 16,
        nrpn: 16448
      },
      {
        id: "delay_feedback",
        name: "Feedback",
        type: "knob",
        min: 0,
        max: 127,
        value: 40,
        cc: 17,
        nrpn: 16449
      },
      {
        id: "delay_mix",
        name: "Mix",
        type: "slider",
        min: 0,
        max: 127,
        value: 0,
        cc: 18,
        nrpn: 16450
      },
      {
        id: "delay_ping_pong",
        name: "Ping Pong",
        type: "toggle",
        min: 0,
        max: 1,
        value: 0,
        cc: 19,
        nrpn: 16451
      }
    ]
  },
  
  // Reverb effect parameters
  reverb: {
    title: "Reverb",
    channel: 0,
    parameters: [
      {
        id: "reverb_pre_delay",
        name: "Pre-Delay",
        type: "knob",
        min: 0,
        max: 127,
        value: 0,
        cc: 20,
        nrpn: 16452
      },
      {
        id: "reverb_decay",
        name: "Decay",
        type: "knob",
        min: 0,
        max: 127,
        value: 64,
        cc: 21,
        nrpn: 16453
      },
      {
        id: "reverb_mix",
        name: "Mix",
        type: "slider",
        min: 0,
        max: 127,
        value: 0,
        cc: 22,
        nrpn: 16454
      },
      {
        id: "reverb_highpass",
        name: "High-Pass",
        type: "knob",
        min: 0,
        max: 127,
        value: 0,
        cc: 23,
        nrpn: 16455
      }
    ]
  }
};

// Helper functions for working with parameters
export function getDefaultParameterValues() {
  const defaults = {};
  
  // Extract default values from all parameter groups
  Object.keys(parameterGroups).forEach(groupKey => {
    const group = parameterGroups[groupKey];
    
    group.parameters.forEach(param => {
      defaults[param.id] = param.value;
    });
  });
  
  return defaults;
}

export function createParameterSnapshot() {
  const snapshot = {};
  
  // Create snapshot of current parameter values
  Object.keys(parameterGroups).forEach(groupKey => {
    const group = parameterGroups[groupKey];
    
    snapshot[groupKey] = {
      title: group.title,
      channel: group.channel,
      parameters: group.parameters.map(param => ({
        id: param.id,
        value: param.value
      }))
    };
  });
  
  return snapshot;
}

export function restoreParameterValues(snapshot) {
  // Restore parameter values from a snapshot
  Object.keys(snapshot).forEach(groupKey => {
    const group = snapshot[groupKey];
    
    if (parameterGroups[groupKey]) {
      // Update channel if provided
      if (group.channel !== undefined) {
        parameterGroups[groupKey].channel = group.channel;
      }
      
      // Update parameter values
      group.parameters.forEach(paramSnapshot => {
        const param = parameterGroups[groupKey].parameters.find(p => p.id === paramSnapshot.id);
        
        if (param && paramSnapshot.value !== undefined) {
          param.value = paramSnapshot.value;
        }
      });
    }
  });
} 