import { Electroview } from 'electrobun/view'
import { Minus, Square, X } from 'lucide-react'
import type { WindowRPCType } from '../../shared/types'
import { DropdownMenu } from './DropdownMenu'

interface TitleBarProps {
  title: string
  onMenuAction?: (action: string) => void
}

const menuItems = [
  { id: 'settings', label: '设置' },
  { id: 'about', label: '关于' },
]

const rpc = Electroview.defineRPC<WindowRPCType>({
  handlers: {
    requests: {},
    messages: {},
  },
})

const electrobun = new Electroview({ rpc })

export function TitleBar({ title, onMenuAction }: TitleBarProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const handleMinimize = () => {
    electrobun.rpc?.send.minimizeWindow()
  }

  const handleMaximize = () => {
    electrobun.rpc?.send.maximizeWindow()
  }

  const handleClose = () => {
    electrobun.rpc?.send.closeWindow()
  }

  const handleDoubleClick = () => {
    electrobun.rpc?.send.maximizeWindow()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    electrobun.rpc?.send.startWindowDrag({
      mouseX: e.screenX,
      mouseY: e.screenY,
    })
  }

  const handleMenuClick = (id: string) => {
    onMenuAction?.(id)
  }

  return (
    <div
      className="titlebar electrobun-webkit-app-region-drag"
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="titlebar-drag electrobun-webkit-app-region-no-drag">
        <DropdownMenu trigger={title} items={menuItems} onItemClick={handleMenuClick} />
      </div>
      {!isMac && (
        <div className="titlebar-controls electrobun-webkit-app-region-no-drag">
          <button className="titlebar-button" onClick={handleMinimize}>
            <Minus size={16} />
          </button>
          <button className="titlebar-button" onClick={handleMaximize}>
            <Square size={14} />
          </button>
          <button className="titlebar-button titlebar-button-close" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
