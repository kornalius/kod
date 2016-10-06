export var DriveUI

DriveUI = class {

  constructor (width, height) {
    this.width = width
    this.height = height

    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.width = this.width
    this.canvas.height = this.height
    document.body.appendChild(this.canvas)

    this.context = this.canvas.getContext('2d', { alpha: true, antialias: false })

    let img = new Image()
    img.src = 'assets/imgs/drive.png'
    img.onload = () => {
      if (!this.width && !this.height) {
        this.width = img.width
        this.height = img.height
        this.canvas.width = this.width
        this.canvas.height = this.height
      }
      this.context.clearRect(0, 0, this.width, this.height)
      this.context.drawImage(img, 0, 0)
      this.resize()
    }

    window.addEventListener('resize', this.resize.bind(this))
  }

  resize () {
    this.canvas.style.left = window.innerWidth * 0.5 - this.width * 0.5 + 'px'
    this.canvas.style.top = window.innerHeight - (window.innerHeight - _vm.chips.video.monitor.renderer.height) * 0.5 - this.height * 0.5 + 'px'
  }

  tick (t, delta) {
  }

  reset () {
  }

  shut () {
  }

}
