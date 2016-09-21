import { Chip } from '../chip.js'
import { Struct } from '../struct.js'


export var KeyboardChip

KeyboardChip = class extends Chip {

  constructor () {
    super(...arguments)

    this.data = new Struct(this.mem, [
      { name: 'mods', type: 'B' },
      { name: 'joystick', type: 'B' },
      { name: 'keys', type: 256 },
    ])

    window.addEventListener('keydown', this.onKeydown.bind(this))
    window.addEventListener('keyup', this.onKeyup.bind(this))
  }

  get $keys () { return this.data.keys }
  set $keys (value) { this.data.keys = value }

  get $mods () { return this.data.mods }
  set $mods (value) { this.data.mods = value }

  get $joystick () { return this.data.joystick }
  set $joystick (value) { this.data.joystick = value }

  get $shift () { return this.$mods & 0x01 }

  get $ctrl () { return this.$mods & 0x02 }

  get $alt () { return this.$mods & 0x04 }

  $key (which) { return this.keys[which] }

  reset () {
    this.data.reset()
    super.reset()
  }

  shut () {
    this.data.release()
    super.shut()
  }

  onKeydown (e) {
    let code = e.keyCode
    let numpad = e.location === 3
    this.$keys[code] = 1

    switch (code) {
      case 16: // Shift
        this.$mods |= 0x01
        break

      case 17: // Ctrl
        this.$mods |= 0x02
        break

      case 18: // Alt
        this.$mods |= 0x04
        break

      case 38: // up
        this.$joystick |= 0x01
        break

      case 56: // numpad 8
        if (numpad) {
          this.$joystick |= 0x01
        }
        break

      case 40: // down
        this.$joystick |= 0x02
        break

      case 50: // numpad 2
        if (numpad) {
          this.$joystick |= 0x02
        }
        break

      case 37: // left
        this.$joystick |= 0x04
        break

      case 52: // numpad 4
        if (numpad) {
          this.$joystick |= 0x04
        }
        break

      case 39: // right
        this.$joystick |= 0x08
        break

      case 54: // numpad 6
        if (numpad) {
          this.$joystick |= 0x08
        }
        break

      case 32: // button 1
        this.$joystick |= 0x10
        break
    }

    // e.preventDefault()
    e.stopPropagation()
  }

  onKeyup (e) {
    let code = e.keyCode
    let numpad = e.location === 3
    this.$keys[code] = 0

    switch (e.keyCode) {
      case 16: // Shift
        this.$mods &= ~0x01
        break

      case 17: // Ctrl
        this.$mods &= ~0x02
        break

      case 18: // Alt
        this.$mods &= ~0x04
        break

      case 38: // up
        this.$joystick &= ~0x01
        break

      case 56: // numpad 8
        if (numpad) {
          this.$joystick &= ~0x01
        }
        break

      case 40: // down
        this.$joystick &= ~0x02
        break

      case 50: // numpad 2
        if (numpad) {
          this.$joystick &= ~0x02
        }
        break

      case 37: // left
        this.$joystick &= ~0x04
        break

      case 52: // numpad 4
        if (numpad) {
          this.$joystick &= ~0x04
        }
        break

      case 39: // right
        this.$joystick &= ~0x08
        break

      case 54: // numpad 6
        if (numpad) {
          this.$joystick &= ~0x08
        }
        break

      case 32: // button 1
        this.$joystick &= ~0x10
        break
    }

    // e.preventDefault()
    e.stopPropagation()
  }

}
