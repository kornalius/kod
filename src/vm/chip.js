
export class Chip {

  constructor (vm, size) {
    this.vm = vm
    this.size = size || 4
    this.top = this.vm.mm.alloc(this.size)
    this.bottom = this.top + this.size - 1
  }

  get mem () { return this.vm.mem }

  get mm () { return this.vm.mm }

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
