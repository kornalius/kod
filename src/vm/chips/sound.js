import { mixin } from '../../globals.js'
import { Chip } from '../chip.js'
import { Sound } from '../sound.js'

export var SoundChip

SoundChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.snd_init()

    this.publicize([
      { name: 'load', value: () => this.snd_load(...arguments) },
      { name: 'name', value: () => this.snd_name(...arguments) },
      { name: 'play', value: () => this.snd_play(...arguments) },
      { name: 'stop', value: () => this.snd_stop(...arguments) },
      { name: 'free', value: () => this.snd_free(...arguments) },
      { name: 'note', value: () => this.snd_note(...arguments) },
      { name: 'poly', value: () => this.snd_poly(...arguments) },
      { name: 'poly_add', value: () => this.snd_poly_add(...arguments) },
      { name: 'poly_rem', value: () => this.snd_poly_rem(...arguments) },
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
