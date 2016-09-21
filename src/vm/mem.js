import pretty from 'pretty-bytes'
import { hex, buffer_dump } from '../globals.js'

export var data_type_sizes
export var data_type_size
export var data_view_fns
export var data_array_classes

export var Memory
export var MemoryBlock
export var MemoryManager

data_type_sizes = {
  b: 1,
  B: 1,
  w: 2,
  W: 2,
  i: 4,
  I: 4,
  f: 4,
  d: 8,
  s: 64,
}

data_type_size = type => _.isNumber(type) ? type : data_type_sizes[type]

data_view_fns = {
  b: 'Uint8',
  B: 'Int8',
  w: 'Uint16',
  W: 'Int16',
  i: 'Uint32',
  I: 'Int32',
  f: 'Float32',
  d: 'Float64',
  s: '',
}

data_array_classes = {
  b: Uint8Array,
  B: Int8Array,
  w: Uint16Array,
  W: Int16Array,
  i: Uint32Array,
  I: Int32Array,
  f: Float32Array,
  d: Float64Array,
  s: Uint8Array,
}

Memory = class {

  constructor (buffer, offset, size) {
    // Check for littleEndian
    let b = new ArrayBuffer(4)
    let a = new Uint32Array(b)
    let c = new Uint8Array(b)
    a[0] = 0xdeadbeef
    this.littleEndian = c[0] === 0xef

    if (_.isNumber(buffer)) {
      if (_.isNumber(offset)) {
        size = offset
      }
      offset = buffer
      buffer = null
    }

    if (!size) {
      size = buffer ? buffer.byteLength : 4
      offset = 0
    }

    this.size = size
    this.top = offset || 0
    this.bottom = this.top + this.size - 1

    this.buffer = buffer || new ArrayBuffer(this.size)
    this.array = new Uint8Array(this.buffer)
    this.view = new DataView(this.buffer)
  }

  tick (t) {
  }

  reset () { this.clear() }

  clear () { this.fill(0, this.top, this.size) }

  release () {
    this.view = null
    this.array = null
    this.buffer = null
  }

  view_fn (op, type) { return this.view[op + data_view_fns[type]] }

  db (type, offset, ...args) {
    // let size = data_type_sizes[type]
    // let fn = this.view_fn('set', type)
    // for (let a of args) { fn.call(this.view, offset + size, a) }
    // return offset
    new data_array_classes[type](this.buffer, offset).set(args || [])
    return args.dimensions * data_type_sizes[type]
  }

  read (type, offset, str_size) {
    if (_.isNumber(type)) {
      return this.array.slice(offset, offset + type - 1)
    }
    else if (type === 's') {
      let str = ''
      let size = str_size || data_type_sizes.s
      let bottom = Math.min(offset + size - 1, this.bottom)
      while (offset <= bottom) {
        let c = this.array[offset++]
        if (c === 0) { break }
        str += String.fromCharCode(c)
      }
      return str
    }
    else {
      return this.view_fn('get', type).call(this.view, offset, this.littleEndian)
    }
  }

  write (type, offset, value, str_size) {
    if (_.isNumber(type)) {
      this.array.set(value.subarray(0, type || value.byteLength), offset)
    }
    else if (type === 's') {
      let size = str_size || data_type_sizes.s - 1
      let a = _.map(value.split(''), i => i.charCodeAt(0))
      a.length = Math.min(size, a.length)
      this.array.set(a, offset)
      this.fill(0, offset + a.length, size - a.length)
    }
    else {
      this.view_fn('set', type).call(this.view, offset, value, this.littleEndian)
    }
  }

  fill (value, top, size) { this.array.fill(value || 0, top, top + size) }

  copy (src, tgt, size) { this.array.copyWithin(tgt, src, src + size - 1) }

  dump (offset = 0, size = 512) {
    console.log('Dumping', size, 'bytes from memory at', hex(offset))
    console.log(buffer_dump(this.buffer.slice(offset), { length: size, indent: 2 }))
    console.log('')
  }

}

MemoryBlock = class {

  constructor (manager, type, dimensions, top, bottom, size) {
    this._manager = manager
    this._mem = this.manager.mem
    this.type = type
    this.dimensions = dimensions
    this.top = top
    this.bottom = bottom
    this.size = size
    this.used = true
  }

  get manager () { return this._manager }
  get mem () { return this._mem }

}

MemoryManager = class {

  constructor (mem) {
    this._mem = mem || new Memory()
    this._blocks = []
    this._last_tick = 0
    this._collect_delay = 30720
  }

  get mem () { return this._mem }
  get blocks () { return this._blocks }
  get size () { return this._mem.size }
  get top () { return this._mem.top }
  get bottom () { return this._mem.bottom }

  tick (t) {
    if (t - this._last_tick >= this._collect_delay) {
      this.collect()
      this._last_tick = t
    }
  }

  reset () { this.collect() }

  release () {
    this.collect()
    this._blocks = []
    this._last_tick = 0
  }

  info () {
    let used = 0
    for (let b of this._blocks) {
      used += b.used ? b.size : 0
    }
    return { avail: this.size, used, free: this.size - used }
  }

  assign (type, dimensions = 1) {
    if (_.isArray(dimensions)) {
      dimensions = _.reduce(dimensions, (t, v) => t * v)
    }

    let size = data_type_size(type) * dimensions
    let n = 0

    for (let b of this._blocks) {
      if (b.bottom > n) {
        n = b.bottom
      }

      if (!b.used && b.size >= size) {
        if (b.size === size) {
          b.used = true
          return b.top
        }
        let old_bottom = b.bottom
        b.bottom = b.top + size - 1
        b.size = size
        b.dimensions = dimensions
        b.used = true

        let block = new MemoryBlock(this, type, dimensions, b.bottom + 1, old_bottom, old_bottom - b.bottom + 1)
        this._blocks.push(block)

        return block
      }
    }

    size = n + size > this.bottom ? this.bottom - n : size
    let offset = n + 1
    while (offset % (type !== 's' ? data_type_sizes[type] || 1 : 1) !== 0) { offset++ }
    let block = new MemoryBlock(this, type, dimensions, offset, offset + size - 1, size)
    this._blocks.push(block)
    this.mem.fill(0, offset, size)

    return block
  }

  alloc (type, dimensions, ...values) {
    let block = this.assign(type, dimensions)
    this._mem.db(type, block.top, ...values)
    return block.top
  }

  free (offset) {
    let b = this.block(offset)
    if (b) {
      b.used = false
    }
  }

  block (offset) { return _.find(this._blocks, { top: offset }) }

  block_type (offset) {
    let b = this.block(offset)
    return b && b.used ? b.type : null
  }

  block_size (offset) {
    let b = this.block(offset)
    return b && b.used ? b.size : -1
  }

  collect () {
    let n = []
    for (let b of this._blocks) {
      if (!b.used) {
        n.push(b)
      }
    }
    this._blocks = n
  }

  dump () {
    let info = this.info()

    console.log('memory _blocks dump...', 'avail:', pretty(info.avail), 'used:', pretty(info.used), 'free:', pretty(info.free))

    for (let b of this._blocks) {
      console.log('')
      console.log('offset:', hex(b.top, 32), 'size:', pretty(this.block_size(b.top)), 'type:', this.block_type(b.top))
      console.log(buffer_dump(this.mem.buffer.slice(b.top, b.size), { length: Math.min(255, b.size), indent: 2 }))
    }

    console.log('')
  }
}
