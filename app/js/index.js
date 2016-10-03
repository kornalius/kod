import { VM } from './vm/vm.js'
import { OS } from './os/os.js'
import { fs, p } from './utils.js'

// let win = new BrowserWindow({ width: 800, height: 600 })
// win.loadURL('https://github.com')

let vm = new VM()

let pn = p('/test/test1.kod')
fs.readFile(pn, 'utf8', (err, data) => {
  if (!err) {
    console.log(data)
    vm.load(pn, data)
    vm.run()
    vm.os = new OS(vm)
    vm.os.boot()
  }
})
