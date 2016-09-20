require('file?name=[name].[ext]!../node_modules/pixi.js/bin/pixi.js')
// require('file?name=[name].[ext]!../bower_components/Wad/build/wad.min.js')

import _ from 'lodash'
import { VM } from './vm/vm.js'

_.templateSettings.interpolate = /#{([\s\S]+?)}/g

setTimeout(() => {
  let src = require('raw!./test/test1.kod')
  console.log(src)

  let vm = new VM()
  vm.load(src)
  vm.run()
  vm.dump()
}, 100)
