import { Struct } from '../struct.js'

export var Palette

Palette = class {

  constructor (vm, count) {
    this.vm = vm

    count = count || 32

    this.data = new Struct(this.mem, [
      { name: 'count', type: '', value: count },
      { name: 'data', type: count * 4 },
    ])
  }

  get mem () { return this.vm.mem }

  get mm () { return this.vm.mm }

  tick (t) {
  }

  reset () {
    this.top = this.data._data.mem_top
    this.bottom = this.data._data.mem_bottom
    this.size = this.data._data.mem_size

    this.array = new Uint32Array(this.mem, this.top, this.size)

    this.palette_rgba(0, 0x000000ff)
    this.palette_rgba(1, 0xffffffff)
    this.palette_rgba(2, 0x120723ff)
    this.palette_rgba(3, 0x080e41ff)
    this.palette_rgba(4, 0x12237aff)
    this.palette_rgba(5, 0x4927a1ff)
    this.palette_rgba(6, 0x7f65d0ff)
    this.palette_rgba(7, 0x60c8d0ff)
    this.palette_rgba(8, 0xaad7dfff)
    this.palette_rgba(9, 0x331a36ff)
    this.palette_rgba(10, 0x993dadff)
    this.palette_rgba(11, 0xdf8085ff)
    this.palette_rgba(12, 0xf2d5e8ff)
    this.palette_rgba(13, 0x152418ff)
    this.palette_rgba(14, 0x12451aff)
    this.palette_rgba(15, 0x50bf50ff)
    this.palette_rgba(16, 0x8fea88ff)
    this.palette_rgba(17, 0xf2efdeff)
    this.palette_rgba(18, 0x28130dff)
    this.palette_rgba(19, 0x5f1500ff)
    this.palette_rgba(20, 0x3f2a00ff)
    this.palette_rgba(21, 0x5e4800ff)
    this.palette_rgba(22, 0x91382dff)
    this.palette_rgba(23, 0x9c6526ff)
    this.palette_rgba(24, 0xbfd367ff)
    this.palette_rgba(25, 0xe2d38eff)
    this.palette_rgba(26, 0x211f35ff)
    this.palette_rgba(27, 0x36324bff)
    this.palette_rgba(28, 0x5a5871ff)
    this.palette_rgba(29, 0x877f97ff)
    this.palette_rgba(30, 0xc1aebdff)
    this.palette_rgba(31, 0xe3d1d6ff)
  }

  pal_shut () {
  }

  red (rgba) { return this.split_rgba(rgba).r }

  green (rgba) { return this.split_rgba(rgba).g }

  blue (rgba) { return this.split_rgba(rgba).b }

  alpha (rgba) { return this.split_rgba(rgba).a }

  split_rgba (rgba) {
    return {
      r: rgba >> (this.mem.littleEndian ? 24 : 0) & 0xFF,
      g: rgba >> (this.mem.littleEndian ? 16 : 8) & 0xFF,
      b: rgba >> (this.mem.littleEndian ? 8 : 16) & 0xFF,
      a: rgba >> (this.mem.littleEndian ? 0 : 24) & 0xFF,
    }
  }

  rgba_to_num (r, g, b, a) {
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

    return this.mem.littleEndian ? reverse(c) : c
  }

  palette_rgba (c, r, g, b, a) {
    let mem = this.array
    if (r) {
      mem[c] = this.rgba_to_num(r, g, b, a)
    }
    return mem[c]
  }

  rgba_to_palette (r, g, b, a) {
    let mem = this.array
    let color = this.rgba_to_num(r, g, b, a)
    for (let c = 0; c < this.count; c++) {
      if (mem[c] === color) {
        return c
      }
    }
    return -1
  }

}
