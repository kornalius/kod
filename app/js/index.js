import { VM } from './vm/vm.js'
import { fs } from './utils.js'

// let win = new BrowserWindow({ width: 800, height: 600 })
// win.loadURL('https://github.com')

setTimeout(() => {
  fs.readFile('/test/test1.kod', data => {
    console.log(data)

    let vm = new VM()
    vm.load(data)
    vm.run()
  })
}, 100)
