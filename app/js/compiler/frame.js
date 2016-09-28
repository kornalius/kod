
export var Frame
export var Frames
export var FrameItem

Frames = class {

  constructor () {
    this.reset()
  }

  reset () {
    this.current = null
  }

  start (type) { this.current = new Frame(this, this.current, type) }

  end () { this.current = this.current.parent }

  add (item_type, node) { return this.current.add(item_type, node) }

  exists (name) {
    let c = this.current
    while (c) {
      let i = c.exists(name)
      if (i) {
        return i
      }
      c = c.parent
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

FrameItem = class {

  constructor (frame, item_type, node) {
    this.frame = frame
    this.item_type = item_type
    this.node = node
  }

  get data () { return this.node.data }

  get name () { return this.node.value }

  get type () { return this.node.type }

  get is_var () { return this.item_type === 'var' }

  get is_fn () { return this.item_type === 'fn' }

  get is_local () { return this.frame.is_local }

  get is_global () { return this.frame.is_global }

}

Frame = class {

  constructor (frames, parent, type) {
    this.frames = frames
    this.parent = parent
    this.type = type
    this.items = []
  }

  get name () { return this.parent ? '$s' : '$g' }

  get is_local () { return this.parent !== null }

  get is_global () { return this.parent === null }

  add (item_type, node) {
    let i = new FrameItem(this, item_type, node)
    this.items.push(i)
    node._global = this.is_global
    return i
  }

  exists (name) { return _.find(this.items, { name }) }

  fn_exists (name) {
    let i = this.exists(name)
    return i && i.is_fn ? i : null
  }

  var_exists (name) {
    let i = this.exists(name)
    return i && i.is_var ? i : null
  }

}
