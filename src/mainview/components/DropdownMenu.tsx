import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'

interface MenuItemData {
  id: string
  label: string
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: MenuItemData[]
  onItemClick: (id: string) => void
}

export function DropdownMenu({ trigger, items, onItemClick }: DropdownMenuProps) {
  return (
    <Menu>
      <MenuButton as="div" className="titlebar-title-btn electrobun-webkit-app-region-no-drag">
        {trigger}
      </MenuButton>
      <MenuItems className="dropdown-menu" anchor="bottom start">
        {items.map((item) => (
          <MenuItem key={item.id}>
            {({ focus }) => (
              <button
                className={focus ? 'dropdown-item-active' : 'dropdown-item'}
                onClick={() => onItemClick(item.id)}
              >
                {item.label}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}
