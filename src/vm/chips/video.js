import { Chip } from '../chip.js'
import { Struct } from '../struct.js'

PIXI.Point.prototype.distance = target => {
  Math.sqrt((this.x - target.x) * (this.x - target.x) + (this.y - target.y) * (this.y - target.y))
}

export var VideoChip

VideoChip = class extends Chip {

  constructor (vm, width, height, scale, offset, margins) {
    super(vm)

    this.width = width || 378
    this.height = height || 264
    this.size = this.width * this.height
    this.scale = scale || 3
    this.offset_x = offset ? offset.x : 0
    this.offset_y = offset ? offset.y : 0
    this.margins_x = margins ? margins.x : 32
    this.margins_y = margins ? margins.y : 32

    this.struct = new Struct(this, this.mem, [
      { name: 'force_update', type: 'B' },
      { name: 'force_flip', type: 'B' },
      { name: 'width', type: 'I', value: this.width },
      { name: 'height', type: 'I', value: this.height },
      { name: 'data', type: 'B', dimensions: this.size },
    ])

    this.top = this.data.mem_top
    this.bottom = this.top + this.size - 1

    this.array = new Uint8Array(_vm.mem_buffer, this.top, this.size)

    this.monitor_init()
    this.monitor_resize()

    this.clear()

    this.publicize([
      { name: 'clear', value: () => this.clear(...arguments) },
      { name: 'pixel', value: () => this.pixel(...arguments) },
      { name: 'pixidx', value: () => this.pix_idx(...arguments) },
      { name: 'idxpix', value: () => this.idx_pix(...arguments) },
      { name: 'scroll', value: () => this.scroll(...arguments) },
      { name: 'flip', value: () => this.flip(...arguments) },
      { name: 'refresh', value: () => this.refresh(...arguments) },
    ])
  }

  boot (cold = false) {
    super.boot(cold)

    if (cold) {
      this.reset()
      this.test()
    }
  }

  tick (t) {
    this.monitor_tick(t)

    if (this.force_update) {
      this.force_update = false

      this.pal_tick(t)
      this.txt_tick(t)
      this.spr_tick(t)

      if (this.force_flip) {
        this.flip()
      }

      this.renderer.render(this.stage)
    }

    super.tick(t)
  }

  reset () {
    this.monitor_reset()
    this.clear()
    super.reset()
  }

  shut () {
    this.monitor_shut()

    this.struct.release()

    this.stage.destroy()
    this.stage = null

    this.renderer.destroy()
    this.renderer = null

    super.shut()
  }

  refresh (flip = true) {
    this.force_update = true
    if (!this.force_flip) {
      this.force_flip = flip
    }
  }

  clear () {
    this.array.fill(0)
    this.refresh()
  }

  flip () {
    let screenOverlay = this.overlays.screen
    let data = screenOverlay.context.getImageData(0, 0, screenOverlay.width, screenOverlay.height)
    let pixels = new Uint32Array(data.data.buffer)

    let mem = this.array
    for (let i = 0; i < this.size; i++) {
      pixels[i] = this.palette_rgba(mem[i])
    }

    screenOverlay.context.putImageData(data, 0, 0)

    this.force_flip = false
  }

  pixel (i, c) {
    let mem = this.array
    if (c !== undefined && mem[i] !== c) {
      mem[i] = c
    }
    return mem[i]
  }

  pix_idx (x, y) { return y * this.width + x }

  idx_pix (i) {
    let y = Math.min(Math.trunc(i / this.width), this.height - 1)
    let x = i - y
    return { x, y }
  }

  scroll (x, y) {
    let lw = y * this.width
    let s = lw
    let e = this.size - lw
    this.array.copy(s, 0, e - s)
    this.refresh()
  }

  test () {
    this.mem.fill(10, this.top, 2000)

    this.pixel(200, 0)
    this.pixel(400, 6)
    this.pixel(500, 8)
    this.pixel(600, 20)

    this.refresh()

    this.to(1, 1)
    this.put('A', 29, 15)

    this.to(10, 11)
    this.print('Welcome to DX32\nÉgalitée!', 2, 6)

    let chars = ''
    for (let i = 33; i < 256; i++) {
      chars += String.fromCharCode(i)
    }
    this.to(1, 2)
    this.print(chars, 25, 0)

    this.to(1, 23)
    this.print('Second to last line', 1, 0)

    this.to(1, 24)
    this.print('012345678901234567890123456789012345678901234567890123', 21, 0)

    this.txt_refresh()
  }

}
