import { Chip } from '../chip.js'

export var PaletteChip

PaletteChip = class extends Chip {

  constructor (vm, count) {
    super(vm)

    this.count = count || 32
    this.data = new Array(this.count)

    this.reset()

    this.publicize([
      { name: 'p_get', value: c => this.data[c] },
      { name: 'p_count', value: 'count', readonly: true },
      { name: 'red' },
      { name: 'green' },
      { name: 'blue' },
      { name: 'alpha' },
      { name: 'rgba_num' },
      { name: 'num_rgba' },
      { name: 'pal_rgba' },
      { name: 'rgba_pal' },
    ])
  }

  reset () {
    super.reset()

    this.pal_rgba(0, 0x000000ff)
    this.pal_rgba(1, 0xffffffff)
    this.pal_rgba(2, 0x120723ff)
    this.pal_rgba(3, 0x080e41ff)
    this.pal_rgba(4, 0x12237aff)
    this.pal_rgba(5, 0x4927a1ff)
    this.pal_rgba(6, 0x7f65d0ff)
    this.pal_rgba(7, 0x60c8d0ff)
    this.pal_rgba(8, 0xaad7dfff)
    this.pal_rgba(9, 0x331a36ff)
    this.pal_rgba(10, 0x993dadff)
    this.pal_rgba(11, 0xdf8085ff)
    this.pal_rgba(12, 0xf2d5e8ff)
    this.pal_rgba(13, 0x152418ff)
    this.pal_rgba(14, 0x12451aff)
    this.pal_rgba(15, 0x50bf50ff)
    this.pal_rgba(16, 0x8fea88ff)
    this.pal_rgba(17, 0xf2efdeff)
    this.pal_rgba(18, 0x28130dff)
    this.pal_rgba(19, 0x5f1500ff)
    this.pal_rgba(20, 0x3f2a00ff)
    this.pal_rgba(21, 0x5e4800ff)
    this.pal_rgba(22, 0x91382dff)
    this.pal_rgba(23, 0x9c6526ff)
    this.pal_rgba(24, 0xbfd367ff)
    this.pal_rgba(25, 0xe2d38eff)
    this.pal_rgba(26, 0x211f35ff)
    this.pal_rgba(27, 0x36324bff)
    this.pal_rgba(28, 0x5a5871ff)
    this.pal_rgba(29, 0x877f97ff)
    this.pal_rgba(30, 0xc1aebdff)
    this.pal_rgba(31, 0xe3d1d6ff)
  }

  red (rgba) { return this.num_rgba(rgba).r }

  green (rgba) { return this.num_rgba(rgba).g }

  blue (rgba) { return this.num_rgba(rgba).b }

  alpha (rgba) { return this.num_rgba(rgba).a }

  num_rgba (rgba) {
    return {
      r: rgba >> (this.vm.littleEndian ? 24 : 0) & 0xFF,
      g: rgba >> (this.vm.littleEndian ? 16 : 8) & 0xFF,
      b: rgba >> (this.vm.littleEndian ? 8 : 16) & 0xFF,
      a: rgba >> (this.vm.littleEndian ? 0 : 24) & 0xFF,
    }
  }

  rgba_num (r, g, b, a) {
    let reverse = x => {
      let s32 = new Uint32Array(4)
      let s8 = new Uint8Array(s32.buffer)
      let t32 = new Uint32Array(4)
      let t8 = new Uint8Array(t32.buffer)
      s32[0] = x
      t8[0] = s8[3]
      t8[1] = s8[2]
      t8[2] = s8[1]
      t8[3] = s8[0]
      return t32[0]
    }

    let c = r

    if (r && g) {
      c = a << 24 | r << 16 | g << 8 | b
    }

    return this.vm.littleEndian ? reverse(c) : c
  }

  pal_rgba (c, r, g, b, a) {
    let pal = this.data
    if (r) {
      pal[c] = this.rgba_num(r, g, b, a)
    }
    return pal[c]
  }

  rgba_pal (r, g, b, a) {
    let pal = this.data
    let color = this.rgba_num(r, g, b, a)
    for (let c = 0; c < this.count; c++) {
      if (pal[c] === color) {
        return c
      }
    }
    return -1
  }

}
