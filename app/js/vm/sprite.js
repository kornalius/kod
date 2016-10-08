
export var Sprite
export var SpriteSheet

Sprite = class {

  constructor (f, x, y, z) {
    this.video = _vm.chips.video
    this.sprite = _vm.chips.sprite
    this._f = f || 0 // frame
    this._x = x || 0
    this._y = y || 0
    this._z = z || 0
  }

  tick (t, delta) {
  }

  get sheet () { return this.sprite.sheet }

  get frame () { return this.sheet.frames[this.f] }

  get frame_ptr () { return this.sheet.frame_ptr(this.f) }

  get width () { return this.frame.width }

  get height () { return this.frame.height }

  get x () { return this._x }

  set x (value) {
    this._x = value
    this.sprite.refresh()
  }

  get y () { return this._y }

  set y (value) {
    this._y = value
    this.sprite.refresh()
  }

  get z () { return this._z }

  set z (value) {
    this._z = value
    this.sprite.update_zindexes()
    this.sprite.refresh()
  }

  get f () { return this._f }

  set f (value) {
    this._f = value
    this.sprite.refresh()
  }

  move_top () {
    let z = this.sprite.zindex_max()
    this.z = z + 1
  }

  move_bottom () {
    let z = this.sprite.zindex_min()
    this.z = z - 1
  }

  move (x, y) {
    this.x = x || this.x
    this.y = y || this.y
    return this
  }

  move_by (x, y) { return this.move(this.x + x, this.y + y) }

  draw () {
    this.sheet.draw(this.f, this.x, this.y)
    return this
  }
}


SpriteSheet = class {

  constructor (data, width, height, frame_width, frame_height) {
    this.video = _vm.chips.video
    this.sprite = _vm.chips.sprite
    this.frames = []
    this.data = data
    this.set_sizes(width, height, frame_width, frame_height)
  }

  make_cursor () {
    this.data = new Uint8Array(64)
    this.from_frame_string(0, '??      ???     ?@@?    ?@@@?   ?@@@@?  ??@@@??   ?@@?     ???  ')
  }

  from_frame_string (f, str) {
    let pi = this.frame_ptr(f)
    for (let i = 0; i < str.length; i++) {
      this.data[pi++] = str[i] === ' ' ? 0 : str.charCodeAt(i) - 62
    }
  }

  from_string (str, width, height) {
    this.width = width
    this.height = height
    this.data = new Uint8Array(width * height)
    for (let i = 0; i < str.length; i++) {
      this.data[i] = str[i] === ' ' ? 0 : str.charCodeAt(i) - 62
    }
    this.update_frames()
  }

  from_image (path) {
    let canvas = document.createElement('canvas')
    canvas.style.display = 'hidden'
    document.body.appendChild(canvas)

    let context = canvas.getContext('2d', { alpha: true, antialias: false })

    let img = new Image()
    img.src = path
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      this.width = canvas.width
      this.height = canvas.height
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(img, 0, 0)
      let image_data = context.getImageData(0, 0, canvas.width, canvas.height)
      let pixels = new Uint32Array(image_data.data.buffer)
      this.data = new Uint8Array(this.width * this.height)
      let pi = 0
      for (let p of pixels) {
        let a = (_vm.littleEndian ? p >> 24 : p) & 0xFF
        if (a > 0) {
          this.data[pi] = 1
        }
        pi++
      }
      document.body.removeChild(canvas)
      this.update_frames()
    }
  }

  update_frames () {
    let fw = this.frame_width
    let fh = this.frame_height
    this.frames = []
    for (let y = 0; y < this.height; y += this.frame_height) {
      for (let x = 0; x < this.width; x += this.frame_width) {
        this.frames.push(new PIXI.Rectangle(x, y, fw, fh))
      }
    }
    this.sprite.refresh()
    return this
  }

  set_sizes (width, height, frame_width, frame_height) {
    this.width = width || 240
    this.height = height || 160
    this.frame_width = frame_width || 8
    this.frame_height = frame_height || 8
    return this.update_frames()
  }

  frame_ptr (f) {
    f = this.frames[f]
    return f.y * this.width + f.x
  }

  draw (f, x, y) {
    let video = this.video
    let sw = this.frame_width
    let sh = this.frame_height
    let mem = this.data
    let ptr = this.frame_ptr(f)
    for (let by = 0; by < sh; by++) {
      let pi = (y + by) * this.video.width + x
      for (let bx = 0; bx < sw; bx++) {
        if (mem[ptr] !== 0) {
          video.pixel(pi, mem[ptr])
        }
        pi++
        ptr++
      }
    }
    return this
  }
}

