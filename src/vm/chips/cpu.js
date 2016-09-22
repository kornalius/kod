import { Chip } from '../chip.js'

export var CpuChip

CpuChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.publicize([
      { name: 'log', value: () => { console.log(...arguments) } },
    ])
  }

}
