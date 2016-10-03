import _ from 'lodash'
import { EventEmitter2 } from 'eventemitter2'

export var _RDL_INACTIVE = 0
export var _RDL_ACTIVE = 1

export var Readline

Readline = class extends EventEmitter2 {

  constructor (vm, options) {
    super({ wildcard: true, delimiter: '.' })
    this.vm = vm
    this.txt = this.vm.chips.text
    this.kbd = this.vm.chips.keyboard
    this.cursor = 0
    this.status = _RDL_INACTIVE
    this.options = _.extend({}, {
      accept_tabs: true,
      tab_width: 2,
    }, options || {})
    this._keydownBound = this.keydown.bind(this)
  }

  get active () { return this.status === _RDL_ACTIVE }

  start (text, cursor) {
    this.start_pos = this.txt.pos
    this.status = _RDL_ACTIVE
    this.set_text(text)
    this.set_cursor(cursor || this.length)
    this.kbd.on('keydown', this._keydownBound)
    this.emit('start')
    return this
  }

  end () {
    this.txt.println()
    this.status = _RDL_INACTIVE
    this.kdb.off('keydown', this._keydownBound)
    this.emit('end', this.text)
    return this
  }

  keydown (d) {
    switch (d.key) {
      case 'Backspace':
        let c = this.cursor
        this.delete_text(c - 1, 1).set_cursor(c - 1)
        break

      case 'Delete':
        this.delete_text(this.cursor, 1)
        break

      case 'Tab':
        if (this.options.accept_tabs) {
          this.insert_text(this.cursor, _.repeat(' ', this.options.tab_width)).move_cursor(this.options.tab_width)
        }
        break

      case 'ArrowLeft':
        if (d.meta) {
          this.move_start()
        }
        else {
          this.move_cursor(-1)
        }
        break

      case 'ArrowRight':
        if (d.meta) {
          this.move_end()
        }
        else {
          this.move_cursor(1)
        }
        break

      case 'Home':
        this.move_start()
        break

      case 'End':
        this.move_end()
        break

      case 'Escape':
        this.set_text('')
        break

      case 'Enter':
        this.end()
        break

      default:
        if (d.key.length === 1) {
          let t = this.text.length
          this.insert_text(this.cursor, d.key)
          if (this.length > t) {
            this.move_cursor(1)
          }
        }
    }

    this.emit('keydown', d)
  }

  get max_length () { return this.txt.width - this.start_pos.x + 1 }

  get length () { return this.text.length }

  set_cursor (c) {
    this.cursor = c
    this.emit('move', c)
    return this.update_cursor()
  }

  move_start () { return this.set_cursor(0) }

  move_end () { return this.set_cursor(this.length) }

  move_cursor (c = 1) { return this.set_cursor(this.cursor + c) }

  update_cursor () {
    this.cursor = Math.max(0, Math.min(this.cursor, this.length))
    this.txt.move_to(this.start_pos.x + this.cursor, this.start_pos.y).refresh()
    return this
  }

  update () {
    this.txt.move_to(this.start_pos.x, this.start_pos.y).clear_eol().print(this.text)
    this.emit('change', this.text)
    return this.update_cursor()
  }

  clear_text () { return this.set_text('') }

  set_text (text) {
    text = text || ''
    if (text !== this.text) {
      this.text = text
      this.update()
    }
    return this
  }

  insert_text (i, text) {
    if (this.length + 1 < this.max_length) {
      text = text || ''
      let t = this.text
      if (i >= 0 && i < this.length) {
        t = t.substring(0, i) + text + t.substring(i)
      }
      else {
        t += text
      }
      return this.set_text(t)
    }
    else {
      return this
    }
  }

  delete_text (i, c = 1) {
    if (i >= 0 && i < this.length) {
      let t = this.text
      t = t.substring(0, i) + t.substring(i + 1)
      return this.set_text(t)
    }
    return this
  }

  get words () { return this.text.split(' ') }

  get words_index () { return this.text.split(' ') }

}
