import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, seedIfEmpty, CATEGORIES, type Product, type SaleItem } from './db/db'
import './App.css'

const MENU_ITEMS = [
  { icon: '🛒', label: 'POS' },
  { icon: '🏬', label: 'Orders' },
  { icon: '➕', label: 'Add Product' },
  { icon: '↩️', label: 'Manual Refund' },
  { icon: '✕', label: 'Close Register' },
  { icon: '💳', label: 'Payins/Payouts' },
  { icon: '💰', label: 'Tips' },
  { icon: '⚙️', label: 'Settings' },
  { icon: '🔄', label: 'Synchronize' },
  { icon: '👥', label: 'Customers' },
  { icon: '❓', label: 'Help' },
  { icon: '⏏️', label: 'Logout' },
]

function App() {
  const [online, setOnline] = useState(navigator.onLine)
  const [cart, setCart] = useState<SaleItem[]>([])
  const [category, setCategory] = useState(CATEGORIES[4])
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    seedIfEmpty()
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const products = useLiveQuery(() => db.products.toArray(), [])

  const visibleProducts = useMemo(() => {
    if (!products) return []
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      return products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.barcode?.includes(q),
      )
    }
    return products.filter((p) => p.category === category)
  }, [products, category, search])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = 0
  const total = subtotal - discount

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { productId: product.id!, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  async function checkout() {
    if (cart.length === 0) return
    await db.sales.add({
      items: cart,
      total,
      createdAt: Date.now(),
      synced: false,
    })
    setCart([])
  }

  return (
    <div className="pos">
      {menuOpen && <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />}

      <nav className={menuOpen ? 'side-drawer open' : 'side-drawer'}>
        <div className="drawer-header">
          <button className="drawer-back" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            ←
          </button>
          <span className="drawer-shop-name">MOBILE BUZZ WIRELESS...</span>
        </div>
        <div className="drawer-account">Account ID: 145926</div>
        <ul className="drawer-list">
          {MENU_ITEMS.map((item) => (
            <li key={item.label}>
              <button className="drawer-item" onClick={() => setMenuOpen(false)}>
                <span className="drawer-item-icon">{item.icon}</span>
                <span className="drawer-item-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <header className="pos-topbar">
        <button className="menu-btn" aria-label="Menu" onClick={() => setMenuOpen(true)}>
          ☰
        </button>
        <select className="customer-select" defaultValue="walk-in">
          <option value="walk-in">Walk-In</option>
        </select>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search by item: name, serial #, UPC"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className={online ? 'status online' : 'status offline'}>
          {online ? 'Online' : 'Offline'}
        </span>
      </header>

      <div className="pos-body">
        <section className="order-panel">
          {cart.length === 0 ? (
            <div className="order-empty">
              <p className="order-empty-title">Order is empty</p>
              <p className="order-empty-sub">Add items from catalog</p>
            </div>
          ) : (
            <ul className="order-list">
              {cart.map((item) => (
                <li key={item.productId} className="order-item">
                  <div className="order-item-info">
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-qty">x{item.quantity}</span>
                  </div>
                  <span className="order-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  <button className="order-item-remove" onClick={() => removeFromCart(item.productId)}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="order-totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="totals-row">
              <span>Discount</span>
              <span>${discount.toFixed(2)}</span>
            </div>
            <div className="totals-row totals-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-buttons">
            <button className="pay-btn pay-btn-secondary" disabled={cart.length === 0}>
              All Payments
            </button>
            <button className="pay-btn pay-btn-primary" disabled={cart.length === 0} onClick={checkout}>
              Cash
            </button>
          </div>
        </section>

        <section className="catalog-panel">
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={cat === category ? 'category-tile active' : 'category-tile'}
                onClick={() => {
                  setCategory(cat)
                  setSearch('')
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="item-grid">
            {visibleProducts.map((product) => (
              <button key={product.id} className="item-tile" onClick={() => addToCart(product)}>
                <span className="item-tile-icon" />
                <span className="item-tile-name">{product.name}</span>
                <span className="item-tile-price">${product.price.toFixed(2)}</span>
              </button>
            ))}
            {visibleProducts.length === 0 && <p className="item-grid-empty">No items found</p>}
          </div>
        </section>
      </div>

      <footer className="pos-toolbar">
        <button>Save</button>
        <button>Notes</button>
        <button>Pre-Auth</button>
        <button>Terminal</button>
        <button>Discount</button>
        <button>Drawer</button>
        <button>More ⋮</button>
      </footer>
    </div>
  )
}

export default App
