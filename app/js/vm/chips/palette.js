import _ from 'lodash'

import { Chip } from '../chip.js'

// var reverse = x => {
//   let s32 = new Uint32Array(4)
//   let s8 = new Uint8Array(s32.buffer)
//   let t32 = new Uint32Array(4)
//   let t8 = new Uint8Array(t32.buffer)
//   s32[0] = x
//   t8[0] = s8[3]
//   t8[1] = s8[2]
//   t8[2] = s8[1]
//   t8[3] = s8[0]
//   return t32[0]
// }

export var PaletteChip

PaletteChip = class extends Chip {

  constructor (vm, count) {
    super(vm)

    this.count = count || 32

    this.reset()

    this.publicize([
      { name: 'p_get', value: c => this.data[c] },
      { name: 'p_count', value: 'count', readonly: true },
      { name: 'red' },
      { name: 'green' },
      { name: 'blue' },
      { name: 'rgba_num' },
      { name: 'num_rgba' },
      { name: 'pal_rgba', value: 'to_rgba' },
      { name: 'rgba_pal', value: 'from_rgba' },
    ])
  }

  reset () {
    super.reset()

    this.data = new Uint32Array(this.count)

    this.to_rgba(0, 0x000000)
    this.to_rgba(1, 0xffffff)
    this.to_rgba(2, 0x120723)
    this.to_rgba(3, 0x080e41)
    this.to_rgba(4, 0x12237a)
    this.to_rgba(5, 0x4927a1)
    this.to_rgba(6, 0x7f65d0)
    this.to_rgba(7, 0x60c8d0)
    this.to_rgba(8, 0xaad7df)
    this.to_rgba(9, 0x331a36)
    this.to_rgba(10, 0x993dad)
    this.to_rgba(11, 0xdf8085)
    this.to_rgba(12, 0xf2d5e8)
    this.to_rgba(13, 0x152418)
    this.to_rgba(14, 0x12451a)
    this.to_rgba(15, 0x50bf50)
    this.to_rgba(16, 0x8fea88)
    this.to_rgba(17, 0xf2efde)
    this.to_rgba(18, 0x28130d)
    this.to_rgba(19, 0x5f1500)
    this.to_rgba(20, 0x3f2a00)
    this.to_rgba(21, 0x5e4800)
    this.to_rgba(22, 0x91382d)
    this.to_rgba(23, 0x9c6526)
    this.to_rgba(24, 0xbfd367)
    this.to_rgba(25, 0xe2d38e)
    this.to_rgba(26, 0x211f35)
    this.to_rgba(27, 0x36324b)
    this.to_rgba(28, 0x5a5871)
    this.to_rgba(29, 0x877f97)
    this.to_rgba(30, 0xc1aebd)
    this.to_rgba(31, 0xe3d1d6)
  }

  red (rgba) { return this.num_rgba(rgba).r }

  green (rgba) { return this.num_rgba(rgba).g }

  blue (rgba) { return this.num_rgba(rgba).b }

  num_rgba (rgba) {
    if (this.vm.littleEndian) {
      return {
        b: rgba >> 16 & 0xFF,
        g: rgba >> 8 & 0xFF,
        r: rgba & 0xFF,
      }
    }
    else {
      return {
        r: rgba >> 16 & 0xFF,
        g: rgba >> 8 & 0xFF,
        b: rgba & 0xFF,
      }
    }
  }

  rgba_num (r, g, b) {
    if (!_.isUndefined(r) && !_.isUndefined(g) && !_.isUndefined(b)) {
      r = r << 16 | g << 8 | b | 0xFF
    }
    return this.vm.littleEndian ? 0xFF << 24 | r >> 16 | r >> 8 << 8 | r << 16 : r << 8 | 0xFF
  }

  to_rgba (c, r, g, b) {
    let pal = this.data
    if (!_.isUndefined(r)) {
      pal[c] = this.rgba_num(r, g, b)
    }
    return pal[c]
  }

  from_rgba (r, g, b) {
    let pal = this.data
    let color = this.rgba_num(r, g, b)
    for (let c = 0; c < this.count; c++) {
      if (pal[c] === color) {
        return c
      }
    }
    return -1
  }

}
