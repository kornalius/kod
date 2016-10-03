import _ from 'lodash'
import { EventEmitter2 } from 'eventemitter2'

export class Chip extends EventEmitter2 {

  constructor (vm) {
    super({ wildcard: true, delimiter: '.' })
    this.vm = vm
  }

  publicize (data) {
    let that = this
    let publics = this.vm.publics

    let defineProperty = (desc, name, prop, readonly) => {
      let description = { enumerable: true }
      if (desc && desc.get) {
        readonly = readonly || _.isUndefined(desc.set)
        description.get = desc.get
        description.set = !readonly && desc.set ? desc.set : undefined
      }
      else {
        description.get = () => that[prop]
        description.set = !readonly ? value => { that[prop] = value } : undefined
      }
      Object.defineProperty(publics, name, description)
    }

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

      let desc = Object.getOwnPropertyDescriptor(that.constructor.prototype, prop)
      if (desc) {
        defineProperty(desc, name, prop, d.readonly)
      }
      else if (_.isFunction(that[prop])) {
        publics[name] = that[prop].bind(that)
      }
      else {
        let description = {
          enumerable: true,
          get: () => that[prop],
          set: !d.readonly ? value => { that[prop] = value } : undefined
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
