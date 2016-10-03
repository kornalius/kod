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

  getEventInfo (e) {
    let video = this.video
    let renderer = video.monitor.renderer
    let margins_x = video.margins_x
    let margins_y = video.margins_y
    let cursor = video.monitor.overlays.mouseCursor
    let sprite = cursor.sprite

    let size = new PIXI.Point(renderer.width - margins_x / 2 - sprite.width, renderer.height - margins_y / 2 - sprite.height)

    let x = Math.trunc(Math.min(size.x, Math.max(margins_x / 2, e.data.global.x)) / sprite.scale.x)
    let y = Math.trunc(Math.min(size.y, Math.max(margins_y / 2, e.data.global.y)) / sprite.scale.y)

    return { x, y, button: e.data.originalEvent.button }
  }

  onMouseDown (e) {
    let { x, y, button } = this.getEventInfo(e)

    switch (button) {
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

    this.emit('mousedown', { x, y, button })

    e.stopPropagation()
  }

  onMouseUp (e) {
    let { x, y, button } = this.getEventInfo(e)

    switch (button) {
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

    this.emit('mouseup', { x, y, button })

    e.stopPropagation()
  }

  onMouseMove (e) {
    let { x, y, button } = this.getEventInfo(e)
    let cursor = this.video.monitor.overlays.mouseCursor

    this.x = x
    this.y = y

    cursor.x = x
    cursor.y = y

    this.emit('mousemove', { x, y, button })

    this.video.refresh(false)

    e.stopPropagation()
  }
}
