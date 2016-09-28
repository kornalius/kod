import { Chip } from '../chip.js'

export var KeyboardChip

KeyboardChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.mods = 0
    this.joystick = 0
    this.keys = {}

    this.publicize([
      { name: 'key', value: which => this.keys[which] },

      { name: 'k_shift', value: () => this.mods & 0x01 },
      { name: 'k_ctrl', value: () => this.mods & 0x02 },
      { name: 'k_alt', value: () => this.mods & 0x04 },

      { name: 'j_btn0', value: idx => this.joystick & 0x10 },
      { name: 'j_btn1', value: idx => this.joystick & 0x20 },
      { name: 'j_btn2', value: idx => this.joystick & 0x40 },
      { name: 'j_btn3', value: idx => this.joystick & 0x80 },
      { name: 'j_btn4', value: idx => this.joystick & 0x100 },

      { name: 'j_up', value: () => this.joystick & 0x01 },
      { name: 'j_down', value: () => this.joystick & 0x02 },
      { name: 'j_right', value: () => this.joystick & 0x04 },
      { name: 'j_left', value: () => this.joystick & 0x08 },
    ])

    window.addEventListener('keydown', this.onKeydown.bind(this))
    window.addEventListener('keyup', this.onKeyup.bind(this))
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

      case 90: // button 0
        this.joystick |= 0x10
        break

      case 88: // button 1
        this.joystick |= 0x20
        break

      case 67: // button 2
        this.joystick |= 0x40
        break

      case 32: // button 3
        this.joystick |= 0x80
        break

      case 13: // button 4
        this.joystick |= 0x100
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

      case 90: // button 0
        this.joystick &= ~0x10
        break

      case 88: // button 1
        this.joystick &= ~0x20
        break

      case 67: // button 2
        this.joystick &= ~0x40
        break

      case 32: // button 3
        this.joystick &= ~0x80
        break

      case 13: // button 4
        this.joystick &= ~0x100
        break
    }

    // e.preventDefault()
    e.stopPropagation()
  }

}
