export var FloppyUI

FloppyUI = class {

  constructor () {
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    document.body.appendChild(this.canvas)

    this.context = this.canvas.getContext('2d', { alpha: true, antialias: false })

    let img = new Image()
    img.src = 'assets/imgs/floppy.png'
    img.onload = () => {
      if (!this.width && !this.height) {
        this.width = img.width
        this.height = img.height
        this.canvas.width = this.width
        this.canvas.height = this.height
      }
      this.context.clearRect(0, 0, this.width, this.height)
      this.context.drawImage(img, 0, 0)
    }
  }

  tick (t, delta) {
  }

  reset () {
  }

  shut () {
  }

}
