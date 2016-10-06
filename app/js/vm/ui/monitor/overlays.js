import { path } from '../../../utils.js'
import _ from 'lodash'

export var Overlay
export var ScreenOverlay
export var ScanlinesOverlay
export var ScanlineOverlay
export var NoisesOverlay
export var RgbOverlay
export var CrtOverlay
export var TextCursorOverlay
export var MouseCursorOverlay
export var Overlays

Overlay = class {

  constructor (monitor, width, height) {
    this.monitor = monitor
    this.width = width
    this.height = height
    this.last = 0
  }

  create () {
    this.created = true
    this.resize()
  }

  resize (width, height) {
    this.width = width || this.width
    this.height = height || this.height

    if (this.created) {
      if (this.sprite) {
        this.sprite.texture = null
      }

      if (this.texture) {
        this.texture.destroy()
        this.texture = null
      }

      if (this.canvas) {
        this.canvas.remove()
      }

      this.canvas = document.createElement('canvas')
      this.canvas.style.display = 'none'
      this.canvas.width = this.width
      this.canvas.height = this.height
      document.body.appendChild(this.canvas)

      this.texture = PIXI.Texture.fromCanvas(this.canvas, PIXI.SCALE_MODES.NEAREST)
      // this.texture.scaleMode = PIXI.SCALE_MODES.NEAREST

      if (!this.sprite) {
        this.sprite = new PIXI.Sprite(this.texture)
      }
      else {
        this.sprite.texture = this.texture
      }

      this.context = this.canvas.getContext('2d', { alpha: true, antialias: false })

      this.context.clearRect(0, 0, this.width, this.height)
    }

    this.draw()
  }

  draw () {
  }

  tick (t, delay) {
  }

  reset () {
  }

  shut () {
    if (this.sprite) {
      this.sprite.destroy()
    }
    if (this.texture) {
      this.texture.destroy()
      this.texture = null
    }
    if (this.canvas) {
      this.canvas.remove()
      this.canvas = null
    }
  }

  update () {
    this.monitor.video.refresh(false)
  }
}


ScreenOverlay = class extends Overlay {

  constructor (monitor, width, height) {
    super(monitor, width, height)

    this.create()

    this.sprite.x = this.monitor.video.offset_x + this.monitor.video.margins_x / 2
    this.sprite.y = this.monitor.video.offset_y + this.monitor.video.margins_y / 2
  }
}


ScanlinesOverlay = class extends Overlay {

  constructor (monitor, width, height, gap, alpha) {
    super(monitor, width, height)
    this.gap = gap || 3
    this.alpha = alpha || 0.35
    this.create()
  }

  draw () {
    super.draw()
    let a = this.alpha * 255
    let image_data = this.context.getImageData(0, 0, this.width, this.height)
    let pixels = image_data.data
    let sz = this.width * 4
    let idx
    for (let y = 0; y < this.height; y += this.gap) {
      idx = y * sz
      for (let i = idx; i < idx + sz; i += 4) {
        pixels.set([0, 0, 0, a], i)
      }
    }
    this.context.putImageData(image_data, 0, 0)
  }
}


ScanlineOverlay = class extends Overlay {

  constructor (monitor, width, height, refresh, alpha, speed) {
    super(monitor, width, height)
    this.refresh = refresh || 50
    this.speed = speed || 16
    this.alpha = alpha || 0.1
    this.create()
    this.sprite.y = -this.sprite.height
  }

  draw () {
    super.draw()
    let image_data = this.context.getImageData(0, 0, this.width, this.height)
    let pixels = image_data.data
    let sz = this.width * 4
    let len = this.height * sz
    let l = 0
    let h = this.height
    let a = this.alpha * 255
    let aa
    for (let y = 0; y < len; y += sz) {
      aa = l / h * a
      for (let x = y; x < y + sz; x += 4) {
        pixels.set([25, 25, 25, aa], x)
      }
      l++
    }
    this.context.putImageData(image_data, 0, 0)
  }

  tick (t, delay) {
    if (t - this.last >= this.refresh) {
      this.sprite.y += this.speed
      if (this.sprite.y > this.height) {
        this.sprite.y = -this.sprite.height
      }
      this.last = t

      this.update()
    }
  }
}


NoisesOverlay = class extends Overlay {

  constructor (monitor, width, height, refresh, count, rate, red, green, blue, alpha) {
    super(monitor, width, height)
    this.refresh = refresh || 250
    this.count = count || 8
    this.rate = rate || 0.85
    this.red = red || 100
    this.green = green || 100
    this.blue = blue || 100
    this.alpha = alpha || 0.15
    this.draw()
  }

  draw () {
    super.draw()

    for (let k in this.noises) {
      let n = this.noises[k]
      n.shut()
    }

    this.noises = {}

    let a = this.alpha * 255
    for (let c = 0; c < this.count; c++) {
      let noise = new Overlay(this.monitor, this.width, this.height)
      noise.create()
      noise.sprite.visible = c === 0

      let image_data = noise.context.getImageData(0, 0, this.width, this.height)
      let pixels = image_data.data
      let len = pixels.length
      let r = this.red
      let g = this.green
      let b = this.blue
      let _rate = this.rate
      for (let i = 0; i < len; i += 4) {
        if (Math.random() >= _rate) {
          pixels.set([Math.trunc(Math.random() * r), Math.trunc(Math.random() * g), Math.trunc(Math.random() * b), a], i)
        }
      }
      noise.context.putImageData(image_data, 0, 0)
      this.noises[c] = noise
      this.monitor.stage.addChild(noise.sprite)
    }

    this.noiseKeys = _.keys(this.noises)
  }

  shut () {
    super.shut()
    for (let k in this.noises) {
      let noise = this.noises[k]
      noise.shut()
    }
    this.noises = {}
    this.noiseKeys = []
  }

  tick (t, delay) {
    if (t - this.last >= this.refresh) {
      for (let k of this.noiseKeys) {
        this.noises[k].sprite.visible = false
      }
      let noise = this.noiseKeys[Math.trunc(Math.random() * this.noiseKeys.length)]
      this.noises[noise].sprite.visible = true
      this.last = t

      this.update()
    }
  }
}


RgbOverlay = class extends Overlay {

  constructor (monitor, width, height, alpha) {
    super(monitor, width, height)
    this.alpha = alpha || 0.075
    this.create()
  }

  draw () {
    super.draw()
    let image_data = this.context.getImageData(0, 0, this.width, this.height)
    let pixels = image_data.data
    let len = pixels.length
    let a = this.alpha * 255
    for (let i = 0; i < len; i += 12) {
      pixels.set([100, 100, 100, a], i)
    }
    this.context.putImageData(image_data, 0, 0)
  }
}


CrtOverlay = class extends Overlay {

  constructor (monitor, width, height, radius, inside_alpha, outside_alpha) {
    super(monitor, width, height)
    this.radius = radius || 0.25
    this.inside_alpha = inside_alpha || 0.2
    this.outside_alpha = outside_alpha || 0.15
    this.create()
  }

  draw () {
    super.draw()
    this.context.globalCompositeOperation = 'darker'
    let gradient = this.context.createRadialGradient(this.width / 2, this.height / 2, this.height / 2, this.width / 2, this.height / 2, this.height / this.radius)
    gradient.addColorStop(0, 'rgba(255, 255, 255, ' + this.inside_alpha + ')')
    gradient.addColorStop(1, 'rgba(0, 0, 0, ' + this.outside_alpha + ')')
    this.context.fillStyle = gradient
    this.context.fillRect(0, 0, this.width, this.height)
    this.context.globalCompositeOperation = 'source-over'
  }
}


TextCursorOverlay = class extends Overlay {

  constructor (monitor, width, height, refresh) {
    super(monitor, width, height)
    this.refresh = refresh || 500
    this.x = 1
    this.y = 1
    this.create()
  }

  draw () {
    super.draw()
    let image_data = this.context.getImageData(0, 0, this.width, this.height)
    let pixels = image_data.data
    let len = pixels.length
    let c = this.monitor.pal.to_rgba(1)
    for (let i = 0; i < len; i += 4) {
      pixels.set([c >> 24 & 0xFF, c >> 16 & 0xFF, c >> 8 & 0xFF, c & 0xFF], i)
    }
    this.context.putImageData(image_data, 0, 0)
  }

  tick (t, delay) {
    if (t - this.last >= this.refresh) {
      this.sprite.visible = !this.sprite.visible
      this.last = t
      this.update()
    }
  }

  update () {
    let video = this.monitor.video
    this.sprite.x = (this.x - 1) * this.sprite.width + video.offset_x + this.monitor.txt.offset_x + video.margins_x / 2
    this.sprite.y = (this.y - 1) * this.sprite.height + video.offset_y + this.monitor.txt.offset_y + video.margins_y / 2
    super.update()
  }
}


MouseCursorOverlay = class extends Overlay {

  constructor (monitor, width, height, refresh, offset) {
    super(monitor, width, height)
    this.refresh = refresh || 5
    this.offset_x = offset ? offset.x : 0
    this.offset_y = offset ? offset.y : 0
    this.x = 0
    this.y = 0
    this.create()
  }

  draw () {
    super.draw()
    let image_data = this.context.getImageData(0, 0, this.width, this.height)
    let pixels = image_data.data
    let len = pixels.length
    // let c = this.monitor.pal.to_rgba(1)
    for (let i = 0; i < len; i += 4) {
      pixels.set([200, 100, 50, 200], i)
    }
    this.context.putImageData(image_data, 0, 0)
  }

  tick (t, delay) {
    if (t - this.last >= this.refresh) {
      this.last = t
      this.update()
    }
  }

  update () {
    this.sprite.x = (this.x + this.offset_x) * this.sprite.scale.x + this.monitor.video.offset_x
    this.sprite.y = (this.y + this.offset_y) * this.sprite.scale.y + this.monitor.video.offset_y
    super.update()
  }
}


Overlays = class {

  constructor (monitor) {
    this.monitor = monitor

    let video = monitor.video
    let txt = monitor.txt
    let spr = monitor.spr

    let width = monitor.renderer.width
    let height = monitor.renderer.height
    let scale = video.scale

    this.screen = new ScreenOverlay(monitor, video.width, video.height)
    this.screen.sprite.scale = new PIXI.Point(scale, scale)
    monitor.stage.addChild(this.screen.sprite)

    this.textCursor = new TextCursorOverlay(monitor, txt.chr_width, txt.chr_height)
    this.textCursor.sprite.scale = new PIXI.Point(scale, scale)
    monitor.stage.addChild(this.textCursor.sprite)

    this.mouseCursor = new MouseCursorOverlay(monitor, spr.width, spr.height)
    this.mouseCursor.sprite.scale = new PIXI.Point(scale, scale)
    monitor.stage.addChild(this.mouseCursor.sprite)

    this.scanlines = new ScanlinesOverlay(monitor, width, height)
    monitor.stage.addChild(this.scanlines.sprite)

    this.scanline = new ScanlineOverlay(monitor, width, height)
    monitor.stage.addChild(this.scanline.sprite)

    this.rgb = new RgbOverlay(monitor, width, height)
    monitor.stage.addChild(this.rgb.sprite)

    this.noises = new NoisesOverlay(monitor, width, height)

    this.crt = new CrtOverlay(monitor, width, height)
    monitor.stage.addChild(this.crt.sprite)

    let texture = PIXI.Texture.fromImage(path.join(__dirname, 'assets/imgs/crt.png'))
    this.frame = new PIXI.Sprite(texture)
    monitor.stage.addChild(this.frame)

    this.resize(width, height)
  }

  scale (scale) {
    this.screen.sprite.scale = new PIXI.Point(scale, scale)
    this.textCursor.sprite.scale = new PIXI.Point(scale, scale)
    this.mouseCursor.sprite.scale = new PIXI.Point(scale, scale)
  }

  resize (width, height) {
    let monitor = this.monitor
    let video = monitor.video
    let margins_x = video.margins_x
    let margins_y = video.margins_y

    this.scanlines.resize(width, height)
    this.scanline.resize(width, height)
    this.rgb.resize(width, height)
    this.noises.resize(width, height)
    this.crt.resize(width, height)

    this.frame.width = width + margins_x / 2
    this.frame.height = height + margins_y / 2
  }

  tick (t, delay) {
    this.screen.tick(t, delay)
    this.scanlines.tick(t, delay)
    this.scanline.tick(t, delay)
    this.rgb.tick(t, delay)
    this.noises.tick(t, delay)
    this.crt.tick(t, delay)
    this.textCursor.tick(t, delay)
    this.mouseCursor.tick(t, delay)
  }

  reset () {
    this.screen.reset()
    this.scanlines.reset()
    this.scanline.reset()
    this.rgb.reset()
    this.noises.reset()
    this.crt.reset()
    this.textCursor.reset()
    this.mouseCursor.reset()
  }

  shut () {
    for (let k in this) {
      let o = this[k].canvas
      if (o) {
        o.shut()
      }
    }
  }
}
