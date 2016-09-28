import { Chip } from '../chip.js'

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

    this.force_update = false
    this.force_flip = false

    this.pixels = new Uint8Array(this.size)

    this.monitor_init()
    this.monitor_resize()

    this.clear()

    this.publicize([
      { name: 'pixels' },
      { name: 'clear' },
      { name: 'flip' },
      { name: 'refresh' },
      { name: 'pixel' },
      { name: 'pix_idx' },
      { name: 'idx_pix' },
      { name: 'scroll' },
    ])
  }

  boot (cold = false) {
    super.boot(cold)

    if (cold) {
      this.reset()
      this.test()
    }
  }

  tick (t, delta) {
    this.monitor_tick(t, delta)

    if (this.force_update) {
      this.force_update = false
      if (this.force_flip) {
        this.flip()
      }
      this.renderer.render(this.stage)
    }

    super.tick(t, delta)
  }

  reset () {
    this.monitor_reset()
    this.clear()
    super.reset()
  }

  shut () {
    this.monitor_shut()

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
    this.pixels.fill(0)
    this.refresh()
  }

  flip () {
    let screenOverlay = this.overlays.screen
    let data = screenOverlay.context.getImageData(0, 0, screenOverlay.width, screenOverlay.height)
    let pixels = new Uint32Array(data.data.buffer)

    let mem = this.pixels
    for (let i = 0; i < this.size; i++) {
      pixels[i] = this.palette_rgba(mem[i])
    }

    screenOverlay.context.putImageData(data, 0, 0)

    this.force_flip = false
  }

  pixel (i, c) {
    let mem = this.pixels
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
    this.pixels.copy(s, 0, e - s)
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
