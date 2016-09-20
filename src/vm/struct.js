import { data_type_size } from './mem.js'
import { define_property } from './property.js'


export class Struct {

  constructor (mem, offset, fmt) {
    offset = offset || this.mem.alloc(this.size(fmt))
    this.mem = mem
    this.format = fmt
    this.top = offset
    this.bottom = this.define_props(fmt, this.top) - 1
  }

  names (fmt) { return _.map(fmt, st => st.name) }

  structs (fmt) { return _.map(this.names(fmt), name => this[name] instanceof Struct ? this[name] : undefined) }

  reset () { this.fill(0, this.top, this.size()) }

  release () {
    for (let s of this.structs(this.format)) {
      s.release()
    }
    this.mem.free(this.top)
  }

  format_by_name (fmt, name) { return _.find(fmt, { name }) }

  define_props (fmt, offset) {
    for (let name of this.names(fmt)) {
      let f = this.format_by_name(fmt, name)

      let type = f.type
      let value = f.value || 0
      let size
      let n = '_' + name
      let entry

      if (_.isObject(type)) {
        entry = new Struct(this.mem, offset, type)
        size = entry.bottom - entry.top + 1
      }
      else {
        size = this.struct_size(type)
        if (!_.isNumber(type) && ['w', 'W', 'i', 'I', 'f', 'd'].indexOf(type) !== -1) {
          while (offset % 2 !== 0) {
            offset++
          }
        }
        entry = { name, type, size, top: offset, bottom: offset + size - 1 }
      }

      this[n] = entry

      define_property(this, name, this.mem, offset, this.type, size)

      if (value) {
        this[name] = value
      }

      offset += size
    }
    return offset
  }

  size (fmt) {
    let sz = 0
    for (let name of this.names(fmt)) {
      let f = this.format_by_name(fmt, name)
      let type = f.type
      sz += _.isObject(type) ? this.size(type) : data_type_size(type)
    }
    return sz
  }

  struct_size (type) { return !type ? this.bottom - this.top + 1 : type instanceof Struct ? type.size() : data_type_size(type) }

  from_buffer (buf, offset) {
    this.mem.array.set(buf, offset || 0)
    return this
  }

  to_buffer (buf, offset) {
    if (!buf) {
      buf = new ArrayBuffer(this.struct_size())
    }
    buf.set(this.mem.array, offset || 0)
    return buf
  }

  from_object (obj) {
    for (let name of this.names(this.format)) {
      if (this[name] instanceof Struct) {
        this[name].from_object(obj[name])
      }
      else {
        this[name] = obj[name]
      }
    }
    return this
  }

  to_object () {
    let s = {}
    for (let name of this.names(this.format)) {
      let value = this[name]
      s[name] = value instanceof Struct ? value.to_object() : value
    }
    return s
  }

}
