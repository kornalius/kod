import { Chip } from '../chip.js'

export var MouseChip

MouseChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.video = this.vm.chips.video

    this.x = 0
    this.y = 0
    this.btns = 0

    this.publicize([
      { name: 'm_x', value: 'x', readonly: true },
      { name: 'm_y', value: 'y', readonly: true },
      { name: 'm_left', value: () => this.btns & 0x01 },
      { name: 'm_middle', value: () => this.btns & 0x02 },
      { name: 'm_right', value: () => this.btns & 0x04 },
    ])
  }

  boot (cold) {
    super.boot(cold)

    let video = this.video
    let renderer = video.monitor.renderer
    let margins_x = video.margins_x
    let margins_y = video.margins_y
    let cursor = video.monitor.overlays.mouseCursor

    this.size = new PIXI.Point(renderer.width - margins_x / 2 - cursor.sprite.width, renderer.height - margins_y / 2 - cursor.sprite.height)

    let stage = this.video.monitor.stage
    if (stage) {
      stage.interactive = true

      stage.on('mousedown', this.onMouseDown.bind(this))
      stage.on('rightdown', this.onMouseDown.bind(this))
      stage.on('touchstart', this.onMouseDown.bind(this))

      stage.on('mousemove', this.onMouseMove.bind(this))

      stage.on('mouseup', this.onMouseUp.bind(this))
      stage.on('touchend', this.onMouseUp.bind(this))
      stage.on('mouseupoutside', this.onMouseUp.bind(this))
      stage.on('touchendoutside', this.onMouseUp.bind(this))
    }
  }

  onMouseDown (e) {
    switch (e.data.originalEvent.button) {
      case 0: // left
        this.btns |= 0x01
        break

      case 1: // middle
        this.btns |= 0x02
        break

      case 2: // right
        this.btns |= 0x04
        break
    }
  }

  onMouseUp (e) {
    switch (e.data.originalEvent.button) {
      case 0: // left
        this.btns &= ~0x01
        break

      case 1: // middle
        this.btns &= ~0x02
        break

      case 2: // right
        this.btns &= ~0x04
        break
    }
  }

  onMouseMove (e) {
    let margins_x = this.video.margins_x
    let margins_y = this.video.margins_y
    let cursor = this.video.monitor.overlays.mouseCursor
    let x = Math.trunc(Math.min(this.size.x, Math.max(margins_x / 2, e.data.global.x)) / cursor.sprite.scale.x)
    let y = Math.trunc(Math.min(this.size.y, Math.max(margins_y / 2, e.data.global.y)) / cursor.sprite.scale.y)

    this.x = x
    this.y = y

    cursor.x = x
    cursor.y = y

    this.video.refresh(false)
  }
}
