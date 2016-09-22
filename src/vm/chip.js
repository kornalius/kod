import { reserved } from '../compiler/tokenizer/token.js'

export class Chip {

  constructor (vm) {
    this.vm = vm
  }

  publicize (data) {
    let publics = this.vm.publics
    for (let d of data) {
      let name = d.name
      let prop = d.name
      if (d.value) {
        if (_.isFunction(d.value)) {
          publics[name] = d.value.bind(this)
          reserved[name] = 'fn'
          continue
        }
      }
      if (_.isFunction(this[prop])) {
        publics[name] = this[prop].bind(this)
        reserved[name] = 'fn'
      }
      else {
        let description = {
          enumerable: true,
          get: () => publics[prop],
        }
        if (!d.readonly) {
          description.set = value => { publics[prop] = value }
        }
        Object.defineProperty(publics, name, description)
        reserved[name] = 'var'
      }
    }
  }

  boot (cold = false) {
  }

  reset () {
  }

  shut () {
  }

  tick (t, delta) {
  }

}
