import arrowUpRight from './icons/arrow-up-right.svg'
import chevronLeft from './icons/chevron-left.svg'
import chevronRight from './icons/chevron-right.svg'
import chevronUp from './icons/chevron-up.svg'
import close from './icons/close.svg'
import collapse from './icons/collapse.svg'
import fit from './icons/fit.svg'
import minus from './icons/minus.svg'
import pause from './icons/pause.svg'
import play from './icons/play.svg'
import plus from './icons/plus.svg'
import restart from './icons/restart.svg'
import zoomIn from './icons/zoom-in.svg'
import zoomOut from './icons/zoom-out.svg'

export const icons = {
  'arrow-up-right': arrowUpRight,
  'chevron-left': chevronLeft,
  'chevron-right': chevronRight,
  'chevron-up': chevronUp,
  close,
  collapse,
  fit,
  minus,
  pause,
  play,
  plus,
  restart,
  'zoom-in': zoomIn,
  'zoom-out': zoomOut,
}

export type IconName = keyof typeof icons
