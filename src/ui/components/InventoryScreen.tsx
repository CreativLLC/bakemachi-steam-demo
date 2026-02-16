import { useUIStore } from '../../store/uiStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';

export function InventoryScreen() {
  const activeMenu = useUIStore((s) => s.activeMenu);
  const items = useInventoryStore((s) => s.items);

  useInputAction('cancel', () => {
    useUIStore.getState().closeMenu();
  }, activeMenu === 'inventory');

  if (activeMenu !== 'inventory') return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: UI.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
    }}>
      <PixelPanel
        borderWidth={52}
        panelOrigin={PANELS.rounded}
        style={{
          maxWidth: 500,
          width: '90%',
          padding: '24px 28px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <div style={{ position: 'absolute', top: -8, right: -8 }}>
          <PixelPanel
            borderWidth={22}
            style={{ cursor: 'pointer' }}
          >
            <button
              onClick={() => useUIStore.getState().closeMenu()}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: 14,
                color: UI.text,
                fontFamily: UI_FONT,
                fontWeight: UI_FONT_BOLD,
              }}
            >
              X
            </button>
          </PixelPanel>
        </div>

        {/* Header */}
        <div style={{
          fontSize: 20,
          color: UI.text,
          fontFamily: UI_FONT,
          fontWeight: UI_FONT_BOLD,
          textAlign: 'center',
          letterSpacing: '0.05em',
        }}>
          もちもの
        </div>
        <div style={{
          fontSize: 11,
          color: UI.textMuted,
          fontFamily: UI_FONT,
          textAlign: 'center',
          marginBottom: 20,
        }}>
          Inventory
        </div>

        {/* Items grid or empty state */}
        {items.length === 0 ? (
          <div style={{
            fontSize: 14,
            color: UI.textMuted,
            fontFamily: UI_FONT,
            textAlign: 'center',
            padding: '40px 0',
          }}>
            まだ なにも ない...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}>
            {items.map((item) => (
              <PixelPanel
                key={item.id}
                borderWidth={16}
                style={{ position: 'relative' }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 8,
                }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: 'contain',
                      imageRendering: 'pixelated',
                    }}
                  />
                  <div style={{
                    fontSize: 12,
                    color: UI.text,
                    fontFamily: UI_FONT,
                    textAlign: 'center',
                    marginTop: 4,
                  }}>
                    {item.name}
                  </div>
                </div>

                {/* Quantity badge */}
                {item.quantity > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: UI.text,
                    color: '#fff',
                    fontSize: 10,
                    fontFamily: UI_FONT,
                    fontWeight: UI_FONT_BOLD,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {item.quantity}
                  </div>
                )}
              </PixelPanel>
            ))}
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
