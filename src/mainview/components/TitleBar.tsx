import { Electroview } from "electrobun/view";
import { Minus, Square, X } from "lucide-react";
import type { WindowRPCType } from "../../shared/types";

interface TitleBarProps {
  title: string
}

const rpc = Electroview.defineRPC<WindowRPCType>({
  handlers: {
    requests: {},
    messages: {},
  },
});

const electrobun = new Electroview({ rpc });

export function TitleBar({ title }: TitleBarProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const handleMinimize = () => {
    electrobun.rpc?.send.minimizeWindow();
  }

  const handleMaximize = () => {
    electrobun.rpc?.send.maximizeWindow();
  }

  const handleClose = () => {
    electrobun.rpc?.send.closeWindow();
  }

  const handleDoubleClick = () => {
    electrobun.rpc?.send.maximizeWindow();
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    electrobun.rpc?.send.startWindowDrag({ 
      mouseX: e.screenX, 
      mouseY: e.screenY 
    });
  }

  return (
    <div 
      className="titlebar electrobun-webkit-app-region-drag" 
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="titlebar-drag">
        <span className="titlebar-title">{title}</span>
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
