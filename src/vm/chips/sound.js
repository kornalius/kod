import { mixin } from '../../globals.js'
import { Chip } from '../chip.js'
import { Sound } from '../sound.js'

export var SoundChip

SoundChip = class extends Chip {

  constructor () {
    super(...arguments)

    this.snd_init()
  }

  $load () { return this.snd_load(...arguments) }

  $name () { return this.snd_name(...arguments) }

  $play () { return this.snd_play(...arguments) }

  $stop () { return this.snd_stop(...arguments) }

  $free () { return this.snd_free(...arguments) }

  $note () { return this.snd_note(...arguments) }

  $poly () { return this.snd_poly(...arguments) }

  $poly_add () { return this.snd_poly_add(...arguments) }

  $poly_rem () { return this.snd_poly_rem(...arguments) }

  tick (t) {
    super.tick(t)
    this.snd_tick(t)
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
