import { Chip } from '../chip.js'

export var CpuChip

CpuChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.publicize([
      { name: 'puts', value: (...args) => console.log(...args) },
      { name: 'on', value: (...args) => this.vm.on(...args) },
      { name: 'off', value: (...args) => this.vm.off(...args) },
      { name: 'emit', value: (...args) => this.vm.emit(...args) },
    ])
  }

}
