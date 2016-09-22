import { Chip } from '../chip.js'

export var KeyboardChip

KeyboardChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.mods = 0
    this.joystick = 0
    this.keys = {}

    this.publicize([
      { name: 'keys', readonly: true },
      { name: 'mods', readonly: true },
      { name: 'joystick', readonly: true },
      { name: 'shift', value: () => this.mods & 0x01 },
      { name: 'ctrl', value: () => this.mods & 0x02 },
      { name: 'alt', value: () => this.mods & 0x04 },
      { name: 'key', value: which => this.keys[which] },
    ])

    window.addEventListener('keydown', this.onKeydown.bind(this))
    window.addEventListener('keyup', this.onKeyup.bind(this))
  }

  reset () {
    this.header.reset()
    super.reset()
  }

  shut () {
    this.header.release()
    super.shut()
  }

  onKeydown (e) {
    let code = e.keyCode
    let numpad = e.location === 3
    this.keys[code] = 1

    switch (code) {
      case 16: // Shift
        this.mods |= 0x01
        break

      case 17: // Ctrl
        this.mods |= 0x02
        break

      case 18: // Alt
        this.mods |= 0x04
        break

      case 38: // up
        this.joystick |= 0x01
        break

      case 56: // numpad 8
        if (numpad) {
          this.joystick |= 0x01
        }
        break

      case 40: // down
        this.joystick |= 0x02
        break

      case 50: // numpad 2
        if (numpad) {
          this.joystick |= 0x02
        }
        break

      case 37: // left
        this.joystick |= 0x04
        break

      case 52: // numpad 4
        if (numpad) {
          this.joystick |= 0x04
        }
        break

      case 39: // right
        this.joystick |= 0x08
        break

      case 54: // numpad 6
        if (numpad) {
          this.joystick |= 0x08
        }
        break

      case 32: // button 1
        this.joystick |= 0x10
        break
    }

    // e.preventDefault()
    e.stopPropagation()
  }

  onKeyup (e) {
    let code = e.keyCode
    let numpad = e.location === 3
    this.keys[code] = 0

    switch (e.keyCode) {
      case 16: // Shift
        this.mods &= ~0x01
        break

      case 17: // Ctrl
        this.mods &= ~0x02
        break

      case 18: // Alt
        this.mods &= ~0x04
        break

      case 38: // up
        this.joystick &= ~0x01
        break

      case 56: // numpad 8
        if (numpad) {
          this.joystick &= ~0x01
        }
        break

      case 40: // down
        this.joystick &= ~0x02
        break

      case 50: // numpad 2
        if (numpad) {
          this.joystick &= ~0x02
        }
        break

      case 37: // left
        this.joystick &= ~0x04
        break

      case 52: // numpad 4
        if (numpad) {
          this.joystick &= ~0x04
        }
        break

      case 39: // right
        this.joystick &= ~0x08
        break

      case 54: // numpad 6
        if (numpad) {
          this.joystick &= ~0x08
        }
        break

      case 32: // button 1
        this.joystick &= ~0x10
        break
    }

    // e.preventDefault()
    e.stopPropagation()
  }

}
