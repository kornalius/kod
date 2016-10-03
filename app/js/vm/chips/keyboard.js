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

  eventDetails (e) {
    return {
      key: e.key,
      keyCode: e.keyCode,
      keys: this.keys,
      mods: this.mods,
      joystick: this.joystick,
      shift: this.shift,
      ctrl: this.ctrl,
      alt: this.alt,
      meta: this.meta,
      numpad: this.numpad,
      btn0: this.btn0,
      btn1: this.btn1,
      btn2: this.btn2,
      btn3: this.btn3,
      btn4: this.btn4,
      up: this.up,
      down: this.down,
      right: this.right,
      left: this.left,
    }
  }

  onKeydown (e) {
    let numpad = e.location === 3
    if (numpad) {
      this.mods |= 0x10
    }
    else {
      this.mods &= ~0x10
    }
    this.keys[e.keyCode] = 1

    switch (e.key) {
      case 'Shift':
        this.mods |= 0x01
        break

      case 'Control':
        this.mods |= 0x02
        break

      case 'Alt':
        this.mods |= 0x04
        break

      case 'Meta':
        this.mods |= 0x08
        break

      case 'ArrowUp':
        this.joystick |= 0x01
        break

      case '8':
        if (numpad) {
          this.joystick |= 0x01
        }
        break

      case 'ArrowDown':
        this.joystick |= 0x02
        break

      case '2':
        if (numpad) {
          this.joystick |= 0x02
        }
        break

      case 'ArrowLeft':
        this.joystick |= 0x04
        break

      case '4':
        if (numpad) {
          this.joystick |= 0x04
        }
        break

      case 'ArrowRight':
        this.joystick |= 0x08
        break

      case '6': // numpad 6
        if (numpad) {
          this.joystick |= 0x08
        }
        break

      case 'z': // button 0
        this.joystick |= 0x10
        break

      case 'x': // button 1
        this.joystick |= 0x20
        break

      case 'c': // button 2
        this.joystick |= 0x40
        break

      case ' ': // button 3
        this.joystick |= 0x80
        break

      case 'Enter': // button 4
        this.joystick |= 0x100
        break
    }

    this.emit('keydown', this.eventDetails(e))

    e.stopPropagation()
  }

  onKeyup (e) {
    let numpad = e.location === 3
    if (numpad) {
      this.mods |= 0x10
    }
    else {
      this.mods &= ~0x10
    }
    this.keys[e.keyCode] = 0

    switch (e.key) {
      case 'Shift':
        this.mods &= ~0x01
        break

      case 'Control':
        this.mods &= ~0x02
        break

      case 'Alt':
        this.mods &= ~0x04
        break

      case 'Meta':
        this.mods &= ~0x08
        break

      case 'ArrowUp':
        this.joystick &= ~0x01
        break

      case '8':
        if (numpad) {
          this.joystick &= ~0x01
        }
        break

      case 'ArrowDown':
        this.joystick &= ~0x02
        break

      case '2':
        if (numpad) {
          this.joystick &= ~0x02
        }
        break

      case 'ArrowLeft':
        this.joystick &= ~0x04
        break

      case '4':
        if (numpad) {
          this.joystick &= ~0x04
        }
        break

      case 'ArrowRight':
        this.joystick &= ~0x08
        break

      case '6': // numpad 6
        if (numpad) {
          this.joystick &= ~0x08
        }
        break

      case 'z': // button 0
        this.joystick &= ~0x10
        break

      case 'x': // button 1
        this.joystick &= ~0x20
        break

      case 'c': // button 2
        this.joystick &= ~0x40
        break

      case ' ': // button 3
        this.joystick &= ~0x80
        break

      case 'Enter': // button 4
        this.joystick &= ~0x100
        break
    }

    this.emit('keyup', this.eventDetails(e))

    e.stopPropagation()
  }

}
