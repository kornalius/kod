import { Chip } from '../chip.js'

export var KeyboardChip

KeyboardChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.mods = 0
    this.joystick = 0
    this.keys = {}
    this.key = ''
    this.keyCode = 0

    this.publicize([
      { name: 'key', value: which => this.keys[which] },

      { name: 'k_shift', value: () => this.shift },
      { name: 'k_ctrl', value: () => this.ctrl },
      { name: 'k_alt', value: () => this.alt },
      { name: 'k_meta', value: () => this.meta },
      { name: 'k_numpad', value: () => this.numpad },

      { name: 'j_btn0', value: () => this.btn0 },
      { name: 'j_btn1', value: () => this.btn1 },
      { name: 'j_btn2', value: () => this.btn2 },
      { name: 'j_btn3', value: () => this.btn3 },
      { name: 'j_btn4', value: () => this.btn4 },

      { name: 'j_up', value: () => this.up },
      { name: 'j_down', value: () => this.down },
      { name: 'j_right', value: () => this.right },
      { name: 'j_left', value: () => this.left },
    ])

    window.addEventListener('keydown', this.onKeydown.bind(this))
    window.addEventListener('keyup', this.onKeyup.bind(this))
  }

  get shift () { return this.mods & 0x01 }
  get ctrl () { return this.mods & 0x02 }
  get alt () { return this.mods & 0x04 }
  get meta () { return this.mods & 0x08 }
  get numpad () { return this.mods & 0x10 }
  get btn0 () { return this.joystick & 0x10 }
  get btn1 () { return this.joystick & 0x20 }
  get btn2 () { return this.joystick & 0x40 }
  get btn3 () { return this.joystick & 0x80 }
  get btn4 () { return this.joystick & 0x100 }
  get up () { return this.joystick & 0x01 }
  get down () { return this.joystick & 0x02 }
  get right () { return this.joystick & 0x04 }
  get left () { return this.joystick & 0x08 }

  onKeydown (e) {
    let code = e.keyCode
    let numpad = e.location === 3
    if (numpad) {
      this.mods |= 0x10
    }
    else {
      this.mods &= ~0x10
    }
    this.keys[code] = 1

    this.key = e.key
    this.keyCode = code

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

      case 91: // Meta
        this.mods |= 0x08
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

    this.vm.emit('keydown', this)

    // e.preventDefault()
    e.stopPropagation()
  }

  onKeyup (e) {
    let code = e.keyCode
    let numpad = e.location === 3
    if (numpad) {
      this.mods |= 0x10
    }
    else {
      this.mods &= ~0x10
    }
    this.keys[code] = 0

    this.key = e.key
    this.keyCode = code

    switch (code) {
      case 16: // Shift
        this.mods &= ~0x01
        break

      case 17: // Ctrl
        this.mods &= ~0x02
        break

      case 18: // Alt
        this.mods &= ~0x04
        break

      case 91: // Meta
        this.mods &= ~0x08
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

    this.vm.emit('keyup', this)

    // e.preventDefault()
    e.stopPropagation()
  }

}
