import _ from 'lodash'
import { runtime_error, utoa, atou } from '../globals.js'
import { fs, path, dirs } from '../utils.js'

export var basePath = dirs.user

export var File
export var Folder
export var Disk


File = class {

  constructor (disk, parent, d) {
    this.disk = disk
    this.parent = parent || null
    this.fid = 0
    this.ptr = 0
    this.deserialize(d)
  }

  deserialize (d) {
    let p = path.parse(path.basename(d.name))
    this.name = p.name.substr(0, 11)
    this.ext = p.ext ? '.' + p.ext : ''
    this.created = d.created || Date.now()
    this.modified = d.modified || Date.now()
    this._data = atou(d.data) || ''
  }

  serialize () {
    return {
      name: this.name,
      ext: this.ext,
      created: this.created,
      modified: this.modified,
      data: utoa(this._data)
    }
  }

  get key_name () { return this.disk.key_name(this.name) }

  get path () { return this.disk.path + '/' + this.name + this.ext }

  get data () { return this._data }

  set data (value) {
    if (this.check_size(value.length)) {
      this._data = value
    }
  }

  get size () { return this.data.length }

  get opened () { return this.fid > 0 }

  check_size (size) {
    if (this.disk.avail_size + size < this.disk.total_size) {
      runtime_error(0x10, this.toString())
      return false
    }
    return true
  }

  get ready () {
    if (!this.opened) {
      runtime_error(0x04, this.toString())
      return false
    }
    return true
  }

  open () {
    if (this.ready) {
      this.fid = _.uniqueId()
      this.ptr = 0
      return true
    }
    return false
  }

  close () {
    if (this.ready) {
      this.fid = 0
      this.ptr = 0
      return true
    }
    return false
  }

  rm () {
    if (this.ready) {
      delete this.parent.catalog[this.key_name]
      this.disk.save()
      return true
    }
    return false
  }

  pos () {
    if (this.ready) {
      return this.ptr
    }
    return -1
  }

  seek (pos) {
    if (this.ready) {
      if (pos === -1) {
        pos = this.size - 1
      }
      this.ptr = Math.max(0, Math.min(this.size - 1, pos))
      return this.ptr
    }
    return -1
  }

  get bof () { return this.ptr === 0 }

  get eof () { return this.ptr === this.size - 1 }

  read (len) {
    if (this.ready) {
      if (this.ptr + len > this.size - 1) {
        len = this.size - this.ptr
      }
      let r = this.data.substring(this.ptr, len)
      this.ptr += len
      return r
    }
    return null
  }

  write (data, len) {
    if (this.ready && this.check_size(len)) {
      this.data = this.data.substr(0, this.ptr) + data + this.data.substr(this.ptr + 1)
      this.disk.save()
      return len
    }
    return -1
  }

  append (data, len) {
    if (this.seek(-1)) {
      return this.write(data, len)
    }
    return -1
  }

  toString () { return this.path }
}


Folder = class extends File {

  deserialize (d) {
    this.name = d.name
    this.created = d.created || Date.now()
    this.modified = d.modified || Date.now()
    this.content = d.content || {}
    for (let k in this.content) {
      let dd = this.content[k]
      if (dd.content) {
        this.content[k] = new Folder(this.disk, this, dd)
      }
      else {
        this.content[k] = new File(this.disk, this, dd)
      }
    }
  }

  serialize () {
    let c = {}
    for (let k in this.content) {
      c[k] = this.content[k].serialize()
    }
    return {
      name: this.name,
      created: this.created,
      modified: this.modified,
      content: c
    }
  }

  get is_root () { return this.parent === null }

  get path () {
    if (this.is_root) {
      return this.disk.path + '/' + this.name
    }
    else {
      return this.parent.path + '/' + this.name
    }
  }

  get data () { return null }

  set data (value) {}

  get size () { return _.reduce(this.content, (sz, f) => sz + f.size) }

  get opened () { return true }

  create (name) {
    if (this.ready) {
      if (this.exists(name)) {
        runtime_error(0x11, this.toString())
        return null
      }
      let f = new File(this.disk, this.parent, { name })
      this.content[this.disk.key_name(name)] = f
      this.disk.save()
      return f
    }
    return null
  }

  mkdir (name) {
    if (this.ready) {
      if (this.exists(name)) {
        runtime_error(0x11, this.toString())
        return null
      }
      let f = new Folder(this.disk, this.parent, { name })
      this.content[this.disk.key_name(name)] = f
      this.disk.save()
      return f
    }
    return null
  }

  rm () {
    if (this.ready) {
      delete this.content[this.key_name]
      this.disk.save()
      return true
    }
    return false
  }

  exists (name) { return !_.isUndefined(this.file(name)) }

  file (name) {
    name = name instanceof File || name instanceof Folder ? name.name : name
    return this.content[this.disk.key_name(name)]
  }
}


Disk = class {

  constructor (drive, name, data, sfx = true) {
    this.drive = drive
    this.name = name
    if (!data) {
      this.load(sfx)
    }
    this.deserialize(data)
  }

  deserialize (data) {
    this.meta = data && data.meta || null
    if (this.meta && this.meta.image) {
      this.meta.image = window.btoa(this.meta.image)
    }
    this.root = data && data.root ? new Folder(this, null, data.root) : null
  }

  serialize () {
    return {
      meta: {
        label: this.label,
        image: window.atob(this.image),
      },
      root: this.root ? this.root.serialize() : { name: '/', content: {} }
    }
  }

  get path () { return '/' + this.drive.name }

  get filename () { return path.join(basePath, this.name + '.fdk') }

  get ready () {
    if (!this.meta || !this.root) {
      runtime_error(0x03, this.toString())
      return false
    }
    return true
  }

  get total_size () { return this.drive.size }

  get avail_size () { return this.total_size - this.size }

  get size () {
    let sz = 0
    if (this.ready) {
      for (let k in this.root) {
        this.drive.read(1)
        sz += this.root[k].size
      }
    }
    return sz
  }

  get catalog () { return this.root || {} }

  get label () { return this.meta ? this.meta.label : '' }

  get image () { return this.meta ? this.meta.image : null }

  key_name (name) { return name.toLowerCase() }

  create (name) { return this.ready ? this.root.create(name) : null }

  mkdir (name) { return this.ready ? this.root.mkdir(name) : null }

  rm (name) {
    let f = this.file(name)
    if (this.ready) {
      if (!f) {
        runtime_error(0x08, name)
        return false
      }
      return f.rm()
    }
    return false
  }

  exists (name) { return !_.isUndefined(this.file(name)) }

  file (name) {
    if (this.ready) {
      if (name instanceof File) {
        name = name.name
      }
      else {
        name = this.key_name(name)
      }
      return this.root.file(name)
    }
    else {
      return null
    }
  }

  format (sfx = true, gfx = true) {
    this.data = {
      meta: {
        label: 'UNTITLED',
        image: '',
      },
      root: { name: '/', content: {} },
    }
    if (sfx) {
      this.drive.write(10)
    }
    this.save(sfx, gfx)
    return true
  }

  load (sfx = true, gfx = true) {
    if (sfx) {
      this.drive.read(1)
    }
    fs.readFile(this.filename, 'utf8', (err, data) => {
      if (!err) {
        this.deserialize(JSON.parse(data))
      }
    })
  }

  save (sfx = true, gfx = true) {
    if (sfx) {
      this.drive.write(2)
    }
    fs.writeFile(this.filename, JSON.stringify(this.serialize()), 'utf8', err => {
      if (err) {
        throw err
      }
    })
  }
}
