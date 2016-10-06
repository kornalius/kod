import _ from 'lodash'
import { path } from '../utils.js'

export var Sound

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
    repeat_max = _.random(repeat_min, repeat_max)
    while (repeat_max > 0) {
      let s = this.sounds[this.name(name, random)]
      if (s) {
        s.play(_.defaultsDeep({}, options, { env: { hold: 500 } }))
      }
      repeat_max--
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

}
