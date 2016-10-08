import { Chip } from '../chip.js'
import { Sound } from '../sound.js'

export var SoundChip

/*
volume  : 1.0,   // Peak volume can range from 0 to an arbitrarily high number, but you probably shouldn't set it higher than 1.
loop    : false, // If true, the audio will loop. This parameter only works for audio clips, and does nothing for oscillators.
pitch   : 'A4',  // Set a default pitch on the constuctor if you don't want to set the pitch on play().
detune  : 0,     // Set a default detune on the constructor if you don't want to set detune on play(). Detune is measured in cents. 100 cents is equal to 1 semitone.
panning : -.5,    // Horizontal placement of the sound source. Possible values are from 1 to -1.

env     : {      // This is the ADSR envelope.
    attack  : 0.0,  // Time in seconds from onset to peak volume.  Common values for oscillators may range from 0.05 to 0.3.
    decay   : 0.0,  // Time in seconds from peak volume to sustain volume.
    sustain : 1.0,  // Sustain volume level. This is a percent of the peak volume, so sensible values are between 0 and 1.
    hold    : 3.14, // Time in seconds to maintain the sustain volume level. If this is not set to a lower value, oscillators must be manually stopped by calling their stop() method.
    release : 0     // Time in seconds from the end of the hold period to zero volume, or from calling stop() to zero volume.
},
filter  : {
    type      : 'lowpass', // What type of filter is applied.
    frequency : 600,       // The frequency, in hertz, to which the filter is applied.
    q         : 1,         // Q-factor.  No one knows what this does. The default value is 1. Sensible values are from 0 to 10.
    env       : {          // Filter envelope.
        frequency : 800, // If this is set, filter frequency will slide from filter.frequency to filter.env.frequency when a note is triggered.
        attack    : 0.5  // Time in seconds for the filter frequency to slide from filter.frequency to filter.env.frequency
    }
},
reverb  : {
    wet     : 1,                                            // Volume of the reverberations.
    impulse : 'http://www.myServer.com/path/to/impulse.wav' // A URL for an impulse response file, if you do not want to use the default impulse response.
},
delay   : {
    delayTime : .5,  // Time in seconds between each delayed playback.
    wet       : .25, // Relative volume change between the original sound and the first delayed playback.
    feedback  : .25, // Relative volume change between each delayed playback and the next.
},
vibrato : { // A vibrating pitch effect.  Only works for oscillators.
    shape     : 'sine', // shape of the lfo waveform. Possible values are 'sine', 'sawtooth', 'square', and 'triangle'.
    magnitude : 3,      // how much the pitch changes. Sensible values are from 1 to 10.
    speed     : 4,      // How quickly the pitch changes, in cycles per second.  Sensible values are from 0.1 to 10.
    attack    : 0       // Time in seconds for the vibrato effect to reach peak magnitude.
},
tremolo : { // A vibrating volume effect.
    shape     : 'sine', // shape of the lfo waveform. Possible values are 'sine', 'sawtooth', 'square', and 'triangle'.
    magnitude : 3,      // how much the volume changes. Sensible values are from 1 to 10.
    speed     : 4,      // How quickly the volume changes, in cycles per second.  Sensible values are from 0.1 to 10.
    attack    : 0       // Time in seconds for the tremolo effect to reach peak magnitude.
},
tuna   : {
    Chorus : {
        intensity: 0.3,  //0 to 1
        rate: 4,         //0.001 to 8
        stereoPhase: 0, //0 to 180
        bypass: 0
    }
}
*/

SoundChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.sound = new Sound()

    this.publicize([
      { name: 'play', value: this.sound.play.bind(this.sound) },
      { name: 'stop', value: this.sound.stop.bind(this.sound) },
      { name: 'note', value: this.sound.note.bind(this.sound) },
      { name: 'note_to_str', value: this.sound.note_to_str.bind(this.sound) },
      { name: 'str_to_note', value: this.sound.str_to_note.bind(this.sound) },
      { name: 'note_poly', value: this.sound.poly.bind(this.sound) },
      { name: 'poly_add', value: this.sound.poly_add.bind(this.sound) },
      { name: 'poly_rem', value: this.sound.poly_remove.bind(this.sound) },
    ])
  }

  reset () {
    super.reset()
    this.sound.reset()
  }

  tick (t, delta) {
    super.tick(t, delta)
    this.sound.tick(t, delta)
  }

  shut () {
    super.shut()
    this.sound.shut()
  }
}
