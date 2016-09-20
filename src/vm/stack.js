import { Struct } from './struct.js'
import { data_type_size } from './mem.js'


export var stacks = {}


export class Stack {

  constructor (mem, offset, max_entries, entry_type, rolling, entry_size) {
    entry_type = entry_type || mem.block_type(offset) || 'f'
    entry_size = entry_size || data_type_size(entry_type)
    max_entries = max_entries || 255

    let sz = max_entries * entry_size

    this.mem = mem
    this.top = offset
    this.bottom = offset + sz - 1
    this.size = sz
    this.max_entries = max_entries
    this.entry_type = entry_type
    this.entry_size = entry_size
    this.rolling = rolling

    this.ptr = this.top

    stacks[this.top] = this
  }

  get used () { return Math.trunc((this.ptr - this.top) / this.entry_size) }

  reset () { this.ptr = this.top }

  release () { delete stacks[this.top] }

  push (...value) {
    let sz = this.entry_size
    let t = this.entry_type
    let top = this.top
    let bottom = this.bottom
    let rolling = this.rolling
    for (let v of value) {
      if (rolling && this.ptr >= bottom) {
        this.copy(top + sz, top, this.bottom - sz)
        this.ptr -= sz
      }
      if (this.ptr + sz < bottom) {
        this.mem.write(t, this.ptr, v)
        this.ptr += sz
      }
      else {
        break
      }
    }
  }

  pop () {
    if (this.ptr > this.top) {
      this.ptr -= this.entry_size
      return this.read(this.ptr, this.type)
    }
    return 0
  }

}
