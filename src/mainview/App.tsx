import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from 'dockview-react'
import type { DockviewApi } from 'dockview-core'
import 'dockview-react/dist/styles/dockview.css'
import { TitleBar } from './components/TitleBar'
import { SettingsPanel } from './components/panels/SettingsPanel'
import { AboutPanel } from './components/panels/AboutPanel'
import { useRef } from 'react'

const MyPanel = (props: IDockviewPanelProps) => {
  return <div style={{ padding: 16 }}>{props.api.title}</div>
}

const components = {
  default: MyPanel,
  settings: SettingsPanel,
  about: AboutPanel,
}

function App() {
  const apiRef = useRef<DockviewApi | null>(null)

  const onReady = (event: DockviewReadyEvent) => {
    apiRef.current = event.api
    event.api.addPanel({ id: 'panel_1', component: 'default', title: 'Panel 1' })
    event.api.addPanel({
      id: 'panel_2',
      component: 'default',
      title: 'Panel 2',
      position: { referencePanel: 'panel_1', direction: 'right' },
    })
  }

  const handleMenuAction = (action: string) => {
    const api = apiRef.current
    if (!api) return

    if (action === 'settings') {
      const existing = api.getPanel('settings')
      if (existing) {
        existing.api.setActive()
      } else {
        api.addPanel({ id: 'settings', component: 'settings', title: '设置' })
      }
    } else if (action === 'about') {
      const existing = api.getPanel('about')
      if (existing) {
        existing.api.setActive()
      } else {
        api.addPanel({
          id: 'about',
          component: 'about',
          title: '关于',
          floating: true,
        })
      }
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <TitleBar title="dawn-term" onMenuAction={handleMenuAction} />
      <DockviewReact
        className="dockview-theme-abyss flex-1"
        onReady={onReady}
        components={components}
      />
    </div>
  )
}
export default App
