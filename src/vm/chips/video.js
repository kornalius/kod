import { mixin } from '../../globals.js'
import { Chip } from '../chip.js'
import { Video } from '../video/video.js'

export var VideoChip

VideoChip = class extends Chip {

  constructor () {
    super(...arguments)

    this.vid_init()
  }

  $pixel () { return this.vid_pixel(...arguments) }

  $clear () { return this.vid_clear(...arguments) }

  $flip () { return this.vid_flip(...arguments) }

  $ptoi () { return this.vid_pixel_to_index(...arguments) }

  $itop () { return this.vid_index_to_pixel(...arguments) }

  $scroll () { return this.vid_scroll(...arguments) }

  $draw () { return this.txt_draw(...arguments) }

  $txt_refresh () { return this.txt_refresh(...arguments) }

  $idx () { return this.txt_index(...arguments) }

  $lin () { return this.txt_line(...arguments) }

  $at () { return this.txt_char_at(...arguments) }

  $put () { return this.txt_put_char(...arguments) }

  $print () { return this.txt_print(...arguments) }

  $pos () { return this.txt_pos(...arguments) }

  $to () { return this.txt_move_to(...arguments) }

  $by () { return this.txt_move_by(...arguments) }

  $bol () { return this.txt_bol(...arguments) }

  $eol () { return this.txt_eol(...arguments) }

  $bos () { return this.txt_bos(...arguments) }

  $eos () { return this.txt_eos(...arguments) }

  $bs () { return this.txt_bs(...arguments) }

  $cr () { return this.txt_cr(...arguments) }

  $lf () { return this.txt_lf(...arguments) }

  $up () { return this.txt_up(...arguments) }

  $left () { return this.txt_left(...arguments) }

  $down () { return this.txt_down(...arguments) }

  $right () { return this.txt_right(...arguments) }

  $clr () { return this.txt_clear(...arguments) }

  $clr_eol () { return this.txt_clear_eol(...arguments) }

  $clr_os () { return this.txt_clear_eos(...arguments) }

  $clr_bl () { return this.txt_clear_bol(...arguments) }

  $clr_bs () { return this.txt_clear_bos(...arguments) }

  $cpy_lin () { return this.txt_copy_lin(...arguments) }

  $cpy_col () { return this.txt_copy_col(...arguments) }

  $erase_lin () { return this.txt_erase_lin(...arguments) }

  $erase_col () { return this.txt_erase_col(...arguments) }

  $txt_scroll () { return this.txt_scroll(...arguments) }

  boot (cold = false) {
    super.boot(cold)

    if (cold) {
      this.reset()
      this.test()
    }
  }

  tick (t) {
    this.vid_tick(t)
    super.tick(t)
  }

  reset () {
    this.vid_reset()
    super.reset()
  }

  shut () {
    this.vid_shut()
    super.shut()
  }

  test () {
    this.mem.fill(10, this.top, 2000)

    this.$pixel(200, 0)
    this.$pixel(400, 6)
    this.$pixel(500, 8)
    this.$pixel(600, 20)

    this.$refresh()

    this.$to(1, 1)
    this.$put('A', 29, 15)

    this.$to(10, 11)
    this.$print('Welcome to DX32\nÉgalitée!', 2, 6)

    let chars = ''
    for (let i = 33; i < 256; i++) {
      chars += String.fromCharCode(i)
    }
    this.$to(1, 2)
    this.$print(chars, 25, 0)

    this.$to(1, 23)
    this.$print('Second to last line', 1, 0)

    this.$to(1, 24)
    this.$print('012345678901234567890123456789012345678901234567890123', 21, 0)

    this.$txt_refresh()
  }

}

mixin(VideoChip.prototype, Video.prototype)
