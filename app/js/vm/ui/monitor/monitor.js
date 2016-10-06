import { Overlays } from './overlays.js'

export var Monitor

Monitor = class {

  constructor (video, pal, txt, spr) {
    this.video = video
    this.pal = pal
    this.txt = txt
    this.spr = spr

    this.stage = new PIXI.Container()

    this.renderer = new PIXI.autoDetectRenderer(this.video.width * this.video.scale + this.video.margins_x, this.video.height * this.video.scale + this.video.margins_y, null, { })
    this.renderer.view.style.position = 'absolute'
    this.renderer.view.style.cursor = 'none'
    this.renderer.view.id = 'monitor'

    window.addEventListener('resize', this.resize.bind(this))

    document.body.appendChild(this.renderer.view)

    this.overlays = new Overlays(this)

    this.resize()
  }

  resize () {
    let scale = Math.ceil(Math.min(window.innerWidth / 1.25 / this.video.width, window.innerHeight / 1.25 / this.video.height))

    if (scale !== this.video.scale) {
      this.video.scale = scale
      this.overlays.scale(scale)

      let w = this.video.width * this.video.scale + this.video.margins_x
      let h = this.video.height * this.video.scale + this.video.margins_y

      this.renderer.resize(w, h)
      this.overlays.resize(w, h)

      this.video.refresh()
    }

    this.renderer.view.style.left = window.innerWidth * 0.5 - this.renderer.width * 0.5 + 'px'
    this.renderer.view.style.top = '8px'

    this.overlays.frame.x = this.video.margins_x / -4
    this.overlays.frame.y = this.video.margins_y / -4
  }

  tick (t, delta) {
    this.overlays.tick(t, delta)
  }

  reset () {
    this.overlays.reset()
  }

  shut () {
    this.overlays.shut()

    this.stage.destroy()
    this.stage = null

    this.renderer.destroy()
    this.renderer = null
  }

}
