import { Chip } from '../chip.js'
import { Sprite, SpriteSheet } from '../sprite.js'

export var SpriteChip

SpriteChip = class extends Chip {

  constructor (vm) {
    super(vm)
    this.vm.chips.sprite = this
    this.video = this.vm.chips.video
    this.sprites = []
    this.ordered_sprites = []
    this.spritesheet = new SpriteSheet()
  }

  get width () { return this.spritesheet.frame_width }

  get height () { return this.spritesheet.frame_height }

  update_zindexes () {
    this.ordered_sprites = _.sortBy(this.sprites, 'z')
  }

  zindex_min () {
    let r = Number.MAX_VALUE
    for (let s of this.sprites) {
      if (s.z < r) {
        r = s.z
      }
    }
    return r
  }

  zindex_max () {
    let r = 0
    for (let s of this.sprites) {
      if (s.z > r) {
        r = s.z
      }
    }
    return r
  }

  tick (t, delta) {
    super.tick(t, delta)
    for (let s of this.sprites) {
      s.tick(t, delta)
    }
    if (this.force_update) {
      this.draw()
      this.force_update = false
    }
  }

  reset () {
    this.force_update = false
    this.clear()
    super.reset()
  }

  refresh (flip = true) {
    this.video.refresh(flip)
    this.force_update = true
  }

  clear () {
    this.sprites = []
    this.ordered_sprites = []
    this.refresh()
  }

  add (f, x, y, z) {
    let s = new Sprite(f, x, y, z)
    this.sprites.push(s)
    return s
  }

  draw () {
    for (let s of this.ordered_sprites) {
      s.draw()
    }
  }
}
