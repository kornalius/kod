import { Chip } from '../chip.js'
import { Struct } from '../struct.js'

export var MouseChip

MouseChip = class extends Chip {

  constructor () {
    super(...arguments)

    this.data = new Struct(this.mem, [
      { name: 'x', type: 'I' },
      { name: 'y', type: 'I' },
      { name: 'btns', type: 'B' },
    ])

    // this.video = _vm.ports[_vm.port_by_name('vid')]

    // let video = this.video
    // let renderer = video.renderer
    // let margins_x = video.vid_margins_x
    // let margins_y = video.vid_margins_y
    // let cursor = video.overlays.mouseCursor

    // this.size = new PIXI.Point(renderer.width - margins_x / 2 - cursor.sprite.width, renderer.height - margins_y / 2 - cursor.sprite.height)

    // let stage = this.video.stage
    // if (stage) {
    //   stage.interactive = true

    //   stage.on('mousedown', this.onMouseDown.bind(this))
    //   stage.on('rightdown', this.onMouseDown.bind(this))
    //   stage.on('touchstart', this.onMouseDown.bind(this))

    //   stage.on('mousemove', this.onMouseMove.bind(this))

    //   stage.on('mouseup', this.onMouseUp.bind(this))
    //   stage.on('touchend', this.onMouseUp.bind(this))
    //   stage.on('mouseupoutside', this.onMouseUp.bind(this))
    //   stage.on('touchendoutside', this.onMouseUp.bind(this))
    // }
  }

  get $pos_x () { return this.data.x }
  set $pos_x (value) { this.data.x = value }

  get $pos_y () { return this.data.y }
  set $pos_y (value) { this.data.y = value }

  get $left () { return this.data.btns & 0x01 }

  get $middle () { return this.data.$btns & 0x02 }

  get $right () { return this.data.btns & 0x04 }

  reset () {
    this.data.reset()
    super.reset()
  }

  shut () {
    this.data.release()
    super.shut()
  }

  onMouseDown (e) {
    switch (e.data.originalEvent.button) {
      case 0: // left
        this.$btns |= 0x01
        break

      case 1: // middle
        this.$btns |= 0x02
        break

      case 2: // right
        this.$btns |= 0x04
        break
    }
  }

  onMouseUp (e) {
    switch (e.data.originalEvent.button) {
      case 0: // left
        this.$btns &= ~0x01
        break

      case 1: // middle
        this.$btns &= ~0x02
        break

      case 2: // right
        this.$btns &= ~0x04
        break
    }
  }

  onMouseMove (e) {
    // let margins_x = this.video.vid_margins_x
    // let margins_y = this.video.vid_margins_y
    // let cursor = this.video.overlays.mouseCursor
    // let x = Math.trunc(Math.min(this.size.x, Math.max(margins_x / 2, e.data.global.x)) / cursor.sprite.scale.x)
    // let y = Math.trunc(Math.min(this.size.y, Math.max(margins_y / 2, e.data.global.y)) / cursor.sprite.scale.y)

    // this.$x = x
    // this.$y = y

    // cursor.x = x
    // cursor.y = y

    // this.video.vid_refresh(false)
  }
}
