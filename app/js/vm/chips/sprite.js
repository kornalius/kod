import { Chip } from '../chip.js'

export var SpriteChip

SpriteChip = class extends Chip {

  constructor (vm, count, width, height) {
    super(vm)

    this.list = []

    this.count = Math.min(16, count || 16)
    this.width = Math.min(16, width || 16)
    this.height = Math.min(16, height || 16)
    this.size = this.width * this.height
  }

  tick (t, delta) {
    super.tick(t, delta)
    if (this.force_update) {
      this.draw()
      this.force_update = false
    }
  }

  reset () {
    this.video = this.vm.chips.video
    this.force_update = false
    this.data = new Uint8Array(this.size)
    this.clear()
    super.reset()
  }

  refresh (flip = true) {
    this.video.refresh(flip)
    this.force_update = true
  }

  clear () {
    this.data.fill(0)
    this.list = []
    this.refresh()
  }

  find (name) { return _.find(this.list, { name }) }

  add (name, frame, x, y, z) {
    this.list.push({ name, frame, x, y, z, index: Number.MAX_VALUE })
  }

  del (name) {
    let s = this.find(name)
    if (s) {
      this.list.splice(s.index, 1)
    }
  }

  move (name, x, y, z) {
    let s = this.find(name)
    if (s) {
      s.x = x
      s.y = y
      if (z) {
        s.z = z
      }
      this.refresh()
    }
  }

  move_by (name, x, y) {
    let s = this.find(name)
    if (s) {
      s.x = x
      s.y = y
      this.refresh()
    }
  }

  draw () {
    let sw = this.width
    let sh = this.height
    let sl = this.list
    let ss = this.size

    let mem = this.data

    for (let s of _.sortBy(this.list, 'z')) {
      let ptr = sl + s.frame * ss
      for (let by = 0; by < sh; by++) {
        let pi = (s.y + by) * sw + s.x
        for (let bx = 0; bx < sw; bx++) {
          this.video.pixel(pi++, mem[ptr++])
        }
      }
    }
  }

}
