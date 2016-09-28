import _ from 'lodash'

export class Chip {

  constructor (vm) {
    this.vm = vm
  }

  publicize (data) {
    let that = this
    let publics = this.vm.publics
    for (let d of data) {
      let name = d.name
      let prop = name
      if (d.value) {
        if (_.isFunction(d.value)) {
          publics[name] = d.value.bind(that)
          continue
        }
        else if (_.isString(d.value)) {
          prop = d.value
        }
      }

      if (_.isFunction(that[prop])) {
        publics[name] = that[prop].bind(that)
      }
      else {
        let description = {
          enumerable: true,
          get: () => that[prop],
        }
        if (!d.readonly) {
          description.set = value => { that[prop] = value }
        }
        Object.defineProperty(publics, name, description)
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
