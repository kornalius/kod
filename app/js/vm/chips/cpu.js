import { Chip } from '../chip.js'

export var CpuChip

CpuChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.publicize([
      { name: 'puts', value: (...args) => console.log(...args) },
    ])
  }

}
