import _ from 'lodash'
import { path } from '../utils.js'

export var Sound

var fx_table = [
  { name: 'sine', value: 1 },
  { name: 'sawtooth', value: 2 },
  { name: 'square', value: 3 },
  { name: 'triangle', value: 4 },
]

Sound = class {

  constructor () {
    this.sounds = {}
  }

  reset () {
    for (let k in this.sounds) {
      let s = this.sounds[k]
      if (s.playable) {
        s.stop()
      }
    }
  }

  shut () {
    this.sounds = {}
  }

  tick (t, delta) {
  }

  load (name, filename, loop) {
    this.sounds[name] = new Wad({ source: path.join(__dirname, 'assets/sounds/', filename), loop: loop || false })
  }

  name (name, random = false) {
    if (random) {
      let c = _.reduce(this.sounds, (r, v, k) => { return r + (_.startsWith(k, name) ? 1 : 0) }, 0)
      return name + _.random(1, c)
    }
    else {
      return name
    }
  }

  play (name, options = {}, random = false, repeat_min = 1, repeat_max = 1) {
    if (_.isString(name) && name.indexOf(':') !== -1) {
      name = name.split(',')
    }

    if (_.isArray(name)) {
      let spd = (options.speed || 1) / 100
      let t = 0
      for (let n of name) {
        if (_.isString(n)) {
          n = this.str_to_note(n)
        }
        let s = new Wad({ source: n.source })
        s.play({ wait: t += spd, volume: n.volume, pitch: n.pitch, env: { hold: spd } })
      }
    }

    else {
      repeat_max = _.random(repeat_min, repeat_max)
      while (repeat_max > 0) {
        let s = this.sounds[this.name(name, random)]
        if (s) {
          s.play(_.defaultsDeep({}, options, { env: { hold: 500 } }))
        }
        repeat_max--
      }
    }
  }

  stop (name) {
    let s = this.sounds[this.name(name, false)]
    if (s) {
      s.stop()
    }
  }

  free (name) {
    delete this.sounds[this.name(name)]
  }

  note (note) {
    let id = _.uniqueId()
    this.sounds[id] = new Wad(note)
    return id
  }

  poly () {
    let id = _.uniqueId()
    this.sounds[id] = new Wad.Poly()
    return id
  }

  poly_add (poly_id, wad_id) {
    this.sounds[poly_id].add(this.sounds[wad_id])
  }

  poly_remove (poly_id, wad_id) {
    this.sounds[poly_id].remove(this.sounds[wad_id])
  }

  str_to_note (str) {
    let notes = []
    let str_notes = str.split(',')
    for (let s of str_notes) {
      let note = {}
      let parts = s.split(':')
      note.source = 'sine'
      note.pitch = parts[0]
      if (parts.length > 1) {
        let src = _.find(fx_table, { value: parts[1].charCodeAt(0) - 48 })
        note.source = src ? src.name : 'sine'
        note.volume = (parts[1].charCodeAt(1) - 48) / 10
      }
      notes.push(note)
    }
    return notes.length > 1 ? notes : notes[0]
  }

  note_to_str (note) {
    let str = ''
    if (_.isArray(note)) {
      let l = []
      for (let n of note) {
        l.push(this.note_to_str(n))
      }
      str = l.join(',')
    }
    else {
      str += note.pitch + ':'
      str += String.fromCharCode(48 + _.find(fx_table, { name: note.source }).value)
      str += String.fromCharCode(48 + note.volume * 10)
    }
    return str
  }

}
