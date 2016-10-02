import { Chip } from '../chip.js'
import { Monitor } from '../ui/monitor/monitor.js'

export var VideoChip

VideoChip = class extends Chip {

  constructor (vm, width, height, scale, offset, margins) {
    super(vm)

    this.width = width || 240
    this.height = height || 160
    this.size = this.width * this.height
    this.scale = scale || 4
    this.offset_x = offset ? offset.x : 0
    this.offset_y = offset ? offset.y : 0
    this.margins_x = margins ? margins.x : 24
    this.margins_y = margins ? margins.y : 24

    this.force_update = false
    this.force_flip = false

    this.data = new Uint8ClampedArray(this.size)

    this.clear()

    this.publicize([
      { name: 'pixels', value: 'data', readonly: true },
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
      if (!this.monitor) {
        this.monitor = new Monitor(this, this.vm.chips.palette, this.vm.chips.text, this.vm.chips.sprite)
      }
      this.screen = this.monitor.overlays.screen
      this.image_data = this.screen.context.getImageData(0, 0, this.width, this.height)
      this.pixels = new Uint32Array(this.image_data.data.buffer)
      this.monitor.resize()

      // this.test()
    }
  }

  tick (t, delta) {
    this.monitor.tick(t, delta)

    if (this.force_update) {
      this.force_update = false
      if (this.force_flip) {
        this.flip()
      }
      this.monitor.renderer.render(this.monitor.stage)
    }

    super.tick(t, delta)
  }

  reset () {
    this.force_update = false
    this.force_flip = false
    this.clear()
    this.monitor.reset()
    super.reset()
  }

  shut () {
    this.monitor.shut()
    super.shut()
  }

  refresh (flip = true) {
    this.force_update = true
    if (!this.force_flip) {
      this.force_flip = flip
    }
  }

  clear () {
    this.data.fill(0)
    this.refresh()
  }

  flip () {
    let data = this.data
    let pixels = this.pixels
    let pal = this.vm.chips.palette
    for (let i = 0; i < this.size; i++) {
      pixels[i] = pal.data[data[i]]
    }
    this.screen.context.putImageData(this.image_data, 0, 0)
    this.force_flip = false
  }

  pixel (i, c) {
    let data = this.data
    if (c !== undefined && data[i] !== c) {
      data[i] = Math.max(0, Math.min(c, this.vm.chips.palette.count - 1))
    }
    return data[i]
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
    this.data.copy(s, 0, e - s)
    this.refresh()
  }

  test () {
    this.data.fill(10, 0, 2000)

    this.pixel(100, 0)
    this.pixel(200, 1)
    this.pixel(300, 8)
    this.pixel(400, 12)

    this.refresh()
  }

}
