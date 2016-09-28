
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

error = (instance, token, ...message) => {
  let args = []
  for (let m of message) {
    if (_.isArray(m)) {
      args.push(m.join(', '))
    }
    else if (_.isString(m)) {
      args.push(m)
    }
  }
  console.error(...args, 'at', token.toString())
  instance.errors++
  debugger
  return null
}

runtime_error = (vm, code) => {
  let e = 'Unknown runtime error'
  switch (code) {
    case 0x01:
      e = 'Out of memory'
      break
    case 0x02:
      e = 'Stack underflow'
      break
    case 0x03:
      e = 'Stack overflow'
      break
    case 0x04:
      e = 'Invalid stack address'
      break
    case 0x05:
      e = 'Stack address already assigned'
      break
    case 0x06:
      e = 'Interrupt already exists'
      break
    case 0x07:
      e = 'Interrupt not found'
      break
    case 0x08:
      e = 'Address out of bounds'
      break
  }
  console.error(e)
}

io_error = (vm, code) => {
  let e = 'I/O runtime error'
  switch (code) {
    case 0x01:
      e = 'File not found'
      break
    case 0x02:
      e = 'Cannot open file'
      break
    case 0x03:
      e = 'Cannot close file'
      break
    case 0x04:
      e = 'Cannot lock file'
      break
    case 0x05:
      e = 'Cannot unlock file'
      break
    case 0x06:
      e = 'Invalid file id'
      break
    case 0x07:
      e = 'A floppy is already in the drive'
      break
    case 0x08:
      e = 'No floppy in drive'
      break
    case 0x09:
      e = 'Cannot delete file'
      break
    case 0x10:
      e = 'Drive is not spinning'
      break
  }
  console.error(e)
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
    PIXI.ticker.shared.update(c)
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
