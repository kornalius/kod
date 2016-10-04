import { Chip } from '../chip.js'

export var CpuChip

CpuChip = class extends Chip {

  constructor (vm) {
    super(vm)

    this.publicize([
      { name: 'puts', value: console.log },
      { name: 'on', value: this.vm.on.bind(this.vm) },
      { name: 'off', value: this.vm.off.bind(this.vm) },
      { name: 'emit', value: this.vm.emit.bind(this.vm) },
      { name: 'NaN', value: NaN },
      { name: 'Infinity', value: Infinity },
      { name: 'undefined', value: undefined },
      { name: 'abs', value: Math.abs },
      { name: 'acos', value: Math.acos },
      { name: 'acosh', value: Math.acosh },
      { name: 'asin', value: Math.asin },
      { name: 'asinh', value: Math.asinh },
      { name: 'atan', value: Math.atan },
      { name: 'atan2', value: Math.atan2 },
      { name: 'atanh', value: Math.atanh },
      { name: 'cbrt', value: Math.cbrt },
      { name: 'ceil', value: Math.ceil },
      { name: 'clz32', value: Math.clz32 },
      { name: 'cos', value: Math.cos },
      { name: 'cosh', value: Math.cosh },
      { name: 'exp', value: Math.exp },
      { name: 'expm1', value: Math.expm1 },
      { name: 'floor', value: Math.floor },
      { name: 'fround', value: Math.fround },
      { name: 'hypot', value: Math.hypot },
      { name: 'imul', value: Math.imul },
      { name: 'log', value: Math.log },
      { name: 'log1p', value: Math.log1p },
      { name: 'log2', value: Math.log2 },
      { name: 'log10', value: Math.log10 },
      { name: 'max', value: Math.max },
      { name: 'min', value: Math.min },
      { name: 'pow', value: Math.pow },
      { name: 'random', value: Math.random },
      { name: 'round', value: Math.round },
      { name: 'sign', value: Math.sign },
      { name: 'sin', value: Math.sin },
      { name: 'sinh', value: Math.sinh },
      { name: 'sqrt', value: Math.sqrt },
      { name: 'tan', value: Math.tan },
      { name: 'tanh', value: Math.tanh },
      { name: 'trunc', value: Math.trunc },
    ])
  }

}
