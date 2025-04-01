<template>
  <div class="digitakt-panel">
    <h2 class="text-lg font-semibold mb-4">Digitakt MIDI Setup Guide</h2>
    
    <div class="space-y-4 text-sm">
      <p>
        To ensure your Digitakt is correctly sending and receiving MIDI data, follow these configuration steps:
      </p>
      
      <div class="bg-digitakt-secondary p-3 rounded">
        <h3 class="font-medium mb-2 text-digitakt-accent">MIDI Port Configuration</h3>
        <p class="mb-2">Navigate to <strong>SETTINGS > MIDI CONFIG > PORT CONFIG</strong> on your Digitakt.</p>
        <ul class="list-disc list-inside space-y-1 ml-2">
          <li><strong>OUT PORT FUNC</strong>: Set to <code>MIDI</code> for standard MIDI communication</li>
          <li><strong>OUTPUT TO</strong>: Choose <code>USB</code> when connecting to computer or <code>MIDI+USB</code> for both ports</li>
          <li><strong>PARAM OUTPUT</strong>: Choose between <code>NRPN</code> or <code>CC</code> based on what type of MIDI messages you want to send</li>
          <li><strong>TRIG KEY DEST</strong>: Set to <code>INT+EXT</code> if you want [TRIG] keys to send MIDI notes</li>
          <li><strong>MUTE DEST</strong>: Set to <code>INT+EXT</code> if you want mute actions to send MIDI messages</li>
        </ul>
      </div>
      
      <div class="bg-digitakt-secondary p-3 rounded">
        <h3 class="font-medium mb-2 text-digitakt-accent">MIDI Channel Settings</h3>
        <p class="mb-2">Navigate to <strong>SETTINGS > MIDI CONFIG > CHANNELS</strong>:</p>
        <ul class="list-disc list-inside space-y-1 ml-2">
          <li><strong>TRACK 1-8</strong>: Set channels for audio tracks (to receive parameter control)</li>
          <li><strong>TRACK A-H</strong>: Individual MIDI channels for each MIDI track are set on the <code>SRC</code> page</li>
          <li><strong>AUTO CHANNEL</strong>: For external MIDI control of the active track</li>
        </ul>
      </div>
      
      <div class="bg-digitakt-secondary p-3 rounded">
        <h3 class="font-medium mb-2 text-digitakt-accent">MIDI Track VAL Parameters</h3>
        <p class="mb-2">To use VAL parameters (like VAL5 with CC 74):</p>
        <ol class="list-decimal list-inside space-y-1 ml-2">
          <li>Select a MIDI track (TRK 9-16)</li>
          <li>Go to <strong>FLTR</strong> page to find VAL parameters</li>
          <li>Activate VAL parameters by pressing [FUNC] + DATA ENTRY knob</li>
          <li>Go to <strong>AMP</strong> page to configure <strong>SEL</strong> parameters (which CC the VAL will send)</li>
        </ol>
      </div>
      
      <div class="bg-digitakt-secondary p-3 rounded">
        <h3 class="font-medium mb-2 text-digitakt-accent">Troubleshooting</h3>
        <ul class="list-disc list-inside space-y-1 ml-2">
          <li>USB Connection: Make sure USB cable is firmly connected and functioning</li>
          <li>USB Config: Check <strong>SETTINGS > SYSTEM > USB CONFIG</strong> is set to <code>USB MIDI</code> or <code>USB AUDIO+MIDI</code></li>
          <li>USB Mode: Some OS may require restarting Digitakt after changing USB settings</li>
          <li>Program Change: Enable <strong>PRG CH SEND</strong> in <strong>SYNC</strong> menu to send pattern changes as MIDI</li>
        </ul>
      </div>
      
      <div class="text-right">
        <button @click="$emit('close')" class="digitakt-button">
          Close Guide
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close']);
</script>