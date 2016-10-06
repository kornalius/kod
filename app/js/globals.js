import _ from 'lodash'

PIXI.Point.prototype.distance = target => {
  Math.sqrt((this.x - target.x) * (this.x - target.x) + (this.y - target.y) * (this.y - target.y))
}

export var runtime_errors
export var io_errors
export var error
export var mixin
export var delay
export var buffer_to_string_hex
export var hex_string_to_buffer
export var string_buffer
export var runtime_error
export var io_error
export var hex
export var buffer_dump
export var utoa
export var atou

runtime_errors = {
  0x01: 'Volume already mounted',
  0x02: 'Volume not mounted',
  0x03: 'Volume not ready',
  0x04: 'File already opened',
  0x05: 'File is not opened',
  0x06: 'Interrupt already exists',
  0x07: 'Interrupt not found',
  0x08: 'File not found',
  0x09: 'Volume not found',
  0x10: 'Not enough space',
  0x11: 'Duplicate file',
}

io_errors = {
  0x01: 'File not found',
  0x02: 'Cannot open file',
  0x03: 'Cannot close file',
  0x04: 'Cannot lock file',
  0x05: 'Cannot unlock file',
  0x06: 'Invalid file id',
  0x07: 'A floppy is already in the drive',
  0x08: 'No floppy in drive',
  0x09: 'Cannot delete file',
  0x10: 'Drive is not spinning',
}

let normalizeMessages = (...message) => {
  let args = []
  for (let m of message) {
    if (_.isArray(m)) {
      args.push(m.join(', '))
    }
    else if (_.isString(m)) {
      args.push(m)
    }
  }
  return args
}

error = (instance, token, ...message) => {
  let args = normalizeMessages(...message)
  console.error(...args, token.toString())
  instance.errors++
  debugger;
  return null
}

runtime_error = (code, ...message) => {
  let args = normalizeMessages(...message)
  console.error(runtime_errors[code] || 'Unknown runtime error', ...args)
}

io_error = (code, ...message) => {
  let args = normalizeMessages(...message)
  console.error(io_errors[code] || 'I/O runtime error', ...args)
}

mixin = (proto, ...mixins) => {
  mixins.forEach(mixin => {
    Object.getOwnPropertyNames(mixin).forEach(key => {
      if (key !== 'constructor') {
        Object.defineProperty(proto, key, Object.getOwnPropertyDescriptor(mixin, key))
      }
    })
  })
}

delay = ms => {
  let t = performance.now()
  let c = t
  while (c - t <= ms) {
    // PIXI.ticker.shared.update(c)
    c = performance.now()
  }
}

buffer_to_string_hex = b => {
  let len = b.length
  let i = 0
  let s = ''
  while (i < len) { s += b[i++].toString(16) }
  return s
}

hex_string_to_buffer = str => {
  let i = 0
  let x = 0
  let len = str.length
  let b = new Buffer(Math.trunc(len / 2))
  while (i < len) { b[x++] = parseInt(str.substr(i += 2, 2), 16) }
  return b
}

string_buffer = (str, len = 0) => {
  len = len || str.length
  var b = new Buffer(len)
  b.write(str, 0, str.length, 'ascii')
  return b
}

hex = (value, size = 32) => '$' + _.padStart(value.toString(16), Math.trunc(size / 4), '0')

buffer_dump = (buffer, options = {}) => {
  let width = options.width || 16
  let caps = options.caps || 'upper'
  let indent = _.repeat(' ', options.indent || 0)

  let zero = (n, max) => {
    n = n.toString(16)
    if (caps === 'upper') { n = n.toUpperCase() }
    while (n.length < max) {
      n = '0' + n
    }
    return n
  }

  let len = Math.min(buffer.byteLength, options.length || buffer.byteLength)
  let rows = Math.ceil(len / width)
  let last = len % width || width
  let offsetLength = len.toString(16).length
  if (offsetLength < 6) { offsetLength = 6 }

  let arr = new Uint8Array(buffer)

  let str = indent + 'Offset'
  while (str.length < offsetLength) {
    str += ' '
  }

  str += '  '

  for (let i = 0; i < width; i++) {
    str += ' ' + zero(i, 2)
  }

  if (len) {
    str += '\n'
  }

  let b = 0

  for (let i = 0; i < rows; i++) {
    str += indent + zero(b, offsetLength) + '  '
    let lastBytes = i === rows - 1 ? last : width
    let lastSpaces = width - lastBytes

    for (let j = 0; j < lastBytes; j++) {
      str += ' ' + zero(arr[b], 2)
      b++
    }

    for (let j = 0; j < lastSpaces; j++) {
      str += '   '
    }

    b -= lastBytes
    str += '   '

    for (let j = 0; j < lastBytes; j++) {
      let v = arr[b]
      str += v > 31 && v < 127 || v > 159 ? String.fromCharCode(v) : '.'
      b++
    }

    str += '\n'
  }

  return str
}

utoa = str => window.btoa(unescape(encodeURIComponent(str)))

atou = str => decodeURIComponent(escape(window.atob(str)))
