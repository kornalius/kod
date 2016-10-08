import _ from 'lodash'
import { Chip } from '../chip.js'
import { Sound } from '../sound.js'
import { DEBUG_MODE, runtime_error, delay } from '../../globals.js'
import { basePath, Disk } from '../fs.js'
import { fs, path } from '../../utils.js'
import { DriveUI } from '../ui/drive.js'

export var DriveChip

DriveChip = class extends Chip {

  constructor (vm, name) {
    super(vm)

    this.ui = new DriveUI()

    this.name = name
    this.disk = null

    this.sound = new Sound()

    this.sound.load('insert', 'disk_insert.wav', false)
    this.sound.load('eject', 'disk_eject.wav', false)
    this.sound.load('spin', 'disk_spin.wav', true)
    this.sound.load('read1', 'disk_read1.wav', false)
    this.sound.load('read2', 'disk_read2.wav', false)
    this.sound.load('read3', 'disk_read3.wav', false)
    this.sound.load('read4', 'disk_read4.wav', false)
    this.sound.load('write1', 'disk_write1.wav', false)
    this.sound.load('write2', 'disk_write2.wav', false)

    this.operations = {
      insert: { min_time: 1000, max_time: 2000, sound: 'insert' },
      eject: { min_time: 1000, max_time: 2000, sound: 'eject' },
      spin: { min_time: 1000, max_time: 2500 },
      seek: { min_time: 100, max_time: 250, sound: 'read', random_sound: true },
      read: { min_time: 250, max_time: 500, sound: 'read', random_sound: true },
      write: { min_time: 500, max_time: 1500, sound: 'write', random_sound: true },
    }

    this.spinning = null
    this.stop_spin_bound = this.stop_spin.bind(this)

    this.test()
  }

  boot (cold = false) {
    if (cold) {
    }
  }

  reset () {
  }

  shut () {
    this.unmount()
  }

  tick (t, delta) {
  }

  when_finished_spinning (cb) {
    if (this.spinning) {
      let that = this
      setTimeout(() => { that.when_finished_spinning(cb) }, 500)
    }
    else {
      cb()
    }
  }

  start_spin () {
    if (!this.spinning) {
      this.sound.play('spin', { loop: true })
    }
    clearTimeout(this.spinning)
    this.spinning = setTimeout(this.stop_spin_bound, _.random(this.operations.spin.min_time, this.operations.spin.max_time))
  }

  stop_spin () {
    clearTimeout(this.spinning)
    this.spinning = null
    this.sound.sounds.spin.stop()
  }

  operation (name, size = 0) {
    if (name !== 'insert' && name !== 'eject') {
      this.start_spin()
      if (!this.ready) {
        return
      }
    }

    let _op = this.operations[name]

    let min_time = _op ? _op.min_time : 250
    let max_time = _op ? _op.max_time : 500
    let sound = _op ? _op.sound : null

    if (sound) {
      if (!DEBUG_MODE) {
        for (let i = 0; i < Math.min(100, size || 1); i++) {
          this.sound.play(sound, {}, _op.random_sound)
          let t = _.random(min_time, max_time)
          delay(t)
        }
      }
    }
  }

  get type () { return this.name.substr(0, 1) }

  get mounted () { return this.disk !== null }

  get ready () { return true }

  get size () { return 128 * 1024 }

  get disks () {
    return new Promise((resolve, reject) => {
      fs.readdir(basePath, 'utf8', (err, files) => {
        if (!err) {
          resolve(_.filter(files, f => path.extname(f) === '.fdk'))
        }
        else {
          reject()
        }
      })
    })
  }

  seek (oldPos, newPos) {
    this.operation('seek', Math.abs(newPos - oldPos))
  }

  read (len) {
    this.operation('read', len)
  }

  write (len) {
    this.operation('write', len)
  }

  create (name) {
    let d = new Disk(this, name, null, false)
    d.save(false)
    return true
  }

  mount (name) {
    if (this.ready) {
      if (this.mounted) {
        runtime_error(0x01)
        return false
      }
      this.operation('insert')
      this.disk = new Disk(this, name)
      return true
    }
    return false
  }

  unmount () {
    if (this.ready) {
      if (!this.mounted) {
        runtime_error(0x02)
        return false
      }
      this.save()
      this.disk = null
      this.operation('eject')
      return true
    }
    return false
  }

  test () {
    setTimeout(() => {
      this.create('disk1')
      this.mount('disk1')
      this.disk.format()
      this.disks.then(files => console.log(files))
    }, 2500)
  }
}
