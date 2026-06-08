import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from 'dockview-react'
import 'dockview-react/dist/styles/dockview.css'
import { TitleBar } from './components/TitleBar'

const MyPanel = (props: IDockviewPanelProps) => {
  return <div style={{ padding: 16 }}>{props.api.title}</div>
}

const components = { default: MyPanel }

function App() {
  const onReady = (event: DockviewReadyEvent) => {
    event.api.addPanel({ id: 'panel_1', component: 'default', title: 'Panel 1' })
    event.api.addPanel({
      id: 'panel_2',
      component: 'default',
      title: 'Panel 2',
      position: { referencePanel: 'panel_1', direction: 'right' },
    })
  }

  return (
    <div className="flex flex-col h-screen">
      <TitleBar title="dawn-term" />
      <DockviewReact
        className="dockview-theme-abyss flex-1"
        onReady={onReady}
        components={components}
      />
    </div>
  )
}
export default App
