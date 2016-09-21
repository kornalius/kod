
export var Frame
export var Frames
export var FrameItem

Frames = class {

  constructor () {
    this.reset()
  }

  reset () {
    this.list = []
    this.current = null
    this.global = null
  }

  start (frame_type) {
    if (!this.global) {
      this.global = new Frame(this)
      this.list.push(this.global)
      this.current = this.global
      return this.current
    }
    if (this.current && this.current.is_local) {
      this.list.unshift(this.current)
    }
    this.current = new Frame(this, frame_type)
    return this.current
  }

  end () {
    if (this.current.is_local) {
      this.current = this.list.shift()
    }
    return this.current
  }

  add (item_type, node) { return this.current.add(item_type, node) }

  exists (name) {
    let i = null
    if (this.current) {
      i = this.current.exists(name)
      if (!i) {
        i = this.global.exists(name)
      }
    }
    return i
  }

  fn_exists (name) {
    let i = this.exists(name)
    return i && i.is_fn ? i : null
  }

  var_exists (name) {
    let i = this.exists(name)
    return i && i.is_var ? i : null
  }

}

FrameItem = class {

  constructor (frame, item_type, node) {
    this.frame = frame
    this.item_type = item_type
    this.node = node
  }

  get data () { return this.node.data }

  get name () { return this.data.id.value }

  get type () { return this.data.type.value }

  get is_var () { return this.item_type === 'var' }

  get is_fn () { return this.item_type === 'fn' }

  get is_local () { return this.frame.is_local }

  get is_global () { return this.frame.is_global }

}

Frame = class {

  constructor (frames, frame_type) {
    this.frames = frames
    this.frame_type = frame_type
    this.items = []
  }

  get is_local () { return this !== this.frames.global }

  get is_global () { return this === this.frames.global }

  add (item_type, node) {
    let i = new FrameItem(this, item_type, node)
    this.items.push(i)
    node._global = this.is_global
    return i
  }

  exists (name) {
    for (let i of this.items) {
      if (i.name === name) {
        return i
      }
    }
    return null
  }

  fn_exists (name) {
    let i = this.exists(name)
    return i && i.is_fn ? i : null
  }

  var_exists (name) {
    let i = this.exists(name)
    return i && i.is_var ? i : null
  }

}
