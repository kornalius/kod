
export var Frame
export var Frames
export var FrameItem

Frames = class {

  constructor (parent) {
    this.parent = parent
    this.reset()
  }

  reset () {
    this.list = []
    this.local = null
    this.global = new Frame(this)
  }

  start (frame_type) {
    if (this.local) {
      this.list.push(this.local)
    }
    this.local = new Frame(this, frame_type)
    return this.local
  }

  end () {
    this.local = this.list.length ? this.list.pop() : null
    return this.local
  }

  add (item_type, node) { return this.local.add(item_type, node) }

  exists (name) {
    let i = null
    if (this.local) {
      i = this.local.exists(name)
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

}

Frame = class {

  constructor (parent, frame_type) {
    this.parent = parent
    this.frame_type = frame_type
    this.items = []
  }

  add (item_type, node) {
    let i = new FrameItem(this, item_type, node)
    this.items.push(i)
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
