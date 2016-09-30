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
    this.renderer.view.style.top = Math.trunc(this.video.margins_x / 2) + 'px'
    this.renderer.view.style.left = Math.trunc(this.video.margins_y / 2) + 'px'

    window.addEventListener('resize', this.resize.bind(this))

    document.body.appendChild(this.renderer.view)

    this.overlays = new Overlays(this)
  }

  resize () {
    // let ratio = Math.min(window.innerWidth / this.width, window.innerHeight / this.height)
    // this.stage.scale.x = this.stage.scale.y = ratio
    // this.renderer.monitor_resize(Math.ceil(this.width * ratio), Math.ceil(this.height * ratio))
    this.renderer.view.style.left = window.innerWidth * 0.5 - this.renderer.width * 0.5 + 'px'
    this.renderer.view.style.top = window.innerHeight * 0.5 - this.renderer.height * 0.5 + 'px'
    if (this.refresh) {
      this.refresh()
    }
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
