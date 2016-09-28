import { mixin } from '../../globals.js'
import { Chip } from '../chip.js'
import { Sound } from '../sound.js'

export var SoundChip

SoundChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.snd_init()

    this.publicize([
      { name: 'load', value: (...args) => this.snd_load(...args) },
      { name: 'name', value: (...args) => this.snd_name(...args) },
      { name: 'play', value: (...args) => this.snd_play(...args) },
      { name: 'stop', value: (...args) => this.snd_stop(...args) },
      { name: 'free', value: (...args) => this.snd_free(...args) },
      { name: 'note', value: (...args) => this.snd_note(...args) },
      { name: 'poly', value: (...args) => this.snd_poly(...args) },
      { name: 'poly_add', value: (...args) => this.snd_poly_add(...args) },
      { name: 'poly_rem', value: (...args) => this.snd_poly_rem(...args) },
    ])
  }

  tick (t, delta) {
    super.tick(t, delta)
    this.snd_tick(t, delta)
  }

  reset () {
    super.reset()
    this.snd_reset()
  }

  shut () {
    super.shut()
    this.snd_shut()
  }

}

mixin(SoundChip.prototype, Sound.prototype)
