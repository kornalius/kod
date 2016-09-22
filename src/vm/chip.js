
export class Chip {

  constructor (vm) {
    this.vm = vm
  }

  init_mem (size) {
    this.size = size || 4
    this.top = this.mm.alloc(this.size)
    this.bottom = this.top + this.size - 1
  }

  get mem () { return this.vm.mem }

  get mm () { return this.vm.mm }

  publicize (data) {
    for (let d of data) {
      if (_.isFunction(d.value)) {
        this['$' + d.name] = d.value.bind(this)
      }
      else {
        let name = d.name
        let description = {
          enumerable: true,
          get: () => this[name],
        }
        if (!d.readonly) {
          description.set = value => { this[name] = value }
        }
        Object.defineProperty(this, '$' + name, description)
      }
    }
  }

  boot (cold = false) {
    this.reset()
  }

  reset () {
    if (this.top && this.size) {
      this.mem.fill(0, this.top, this.size)
    }
  }

  shut () {
    this.reset()
    if (this.top) {
      this.mm.free(this.top)
    }
  }

  tick () {
  }

}
