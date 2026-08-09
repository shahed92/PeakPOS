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
  const [detailItem, setDetailItem] = useState<SaleItem | null>(null)
  const [detailPrice, setDetailPrice] = useState('')
  const [detailQuantity, setDetailQuantity] = useState('')
  const [detailNotes, setDetailNotes] = useState('')
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [receipt, setReceipt] = useState<{
    method: string
    items: SaleItem[]
    subtotal: number
    discount: number
    tax: number
    total: number
    createdAt: number
  } | null>(null)

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

  const TAX_RATE = 0.089
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = 0
  const tax = (subtotal - discount) * TAX_RATE
  const total = subtotal - discount + tax

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

  function openItemDetail(item: SaleItem) {
    setDetailItem(item)
    setDetailPrice(item.price.toFixed(2))
    setDetailQuantity(String(item.quantity))
    setDetailNotes(item.notes ?? '')
  }

  function closeItemDetail() {
    setDetailItem(null)
  }

  function saveItemDetail() {
    if (!detailItem) return
    const parsedPrice = parseFloat(detailPrice)
    const price = Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : detailItem.price
    const parsedQuantity = parseInt(detailQuantity, 10)
    const quantity = Number.isFinite(parsedQuantity) && parsedQuantity >= 1 ? parsedQuantity : detailItem.quantity
    const notes = detailNotes.trim() || undefined
    setCart((prev) =>
      prev.map((item) =>
        item.productId === detailItem.productId ? { ...item, price, quantity, notes } : item,
      ),
    )
    setDetailItem(null)
  }

  async function completeCheckout(method: string) {
    if (cart.length === 0) return
    const saleItems = cart
    const saleSubtotal = subtotal
    const saleDiscount = discount
    const saleTax = tax
    const saleTotal = total
    const createdAt = Date.now()
    await db.sales.add({
      items: saleItems,
      total: saleTotal,
      createdAt,
      synced: false,
      paymentMethod: method,
    })
    setCart([])
    setReceipt({
      method,
      items: saleItems,
      subtotal: saleSubtotal,
      discount: saleDiscount,
      tax: saleTax,
      total: saleTotal,
      createdAt,
    })
  }

  function chooseCardMethod(method: 'Credit' | 'Debit') {
    setPaymentMethodOpen(false)
    completeCheckout(method)
  }

  function closeReceipt() {
    setReceipt(null)
  }

  function printReceipt() {
    window.print()
    setReceipt(null)
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
                <li
                  key={item.productId}
                  className="order-item"
                  onClick={() => openItemDetail(item)}
                >
                  <div className="order-item-info">
                    <span className="order-item-name">
                      {item.name}
                      {item.notes && <span className="order-item-note-icon" title={item.notes}>📝</span>}
                    </span>
                    <span className="order-item-qty">x{item.quantity}</span>
                  </div>
                  <span className="order-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  <button
                    className="order-item-remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromCart(item.productId)
                    }}
                  >
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
            <div className="totals-row">
              <span>Tax (8.9%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="totals-row totals-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-buttons">
            <button
              className="pay-btn pay-btn-secondary"
              disabled={cart.length === 0}
              onClick={() => setPaymentMethodOpen(true)}
            >
              All Payments
            </button>
            <button
              className="pay-btn pay-btn-primary"
              disabled={cart.length === 0}
              onClick={() => completeCheckout('Cash')}
            >
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

      {detailItem && (
        <div className="modal-backdrop" onClick={closeItemDetail}>
          <div className="modal item-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{detailItem.name}</h2>
              <button className="modal-close" aria-label="Close" onClick={closeItemDetail}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label htmlFor="detail-price">Price</label>
                <input
                  id="detail-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={detailPrice}
                  onChange={(e) => setDetailPrice(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label htmlFor="detail-quantity">Quantity</label>
                <div className="quantity-stepper">
                  <button
                    type="button"
                    className="quantity-stepper-btn"
                    onClick={() =>
                      setDetailQuantity((q) => String(Math.max(1, (parseInt(q, 10) || 1) - 1)))
                    }
                  >
                    −
                  </button>
                  <input
                    id="detail-quantity"
                    type="number"
                    step="1"
                    min="1"
                    value={detailQuantity}
                    onChange={(e) => setDetailQuantity(e.target.value)}
                  />
                  <button
                    type="button"
                    className="quantity-stepper-btn"
                    onClick={() =>
                      setDetailQuantity((q) => String((parseInt(q, 10) || 0) + 1))
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="modal-field modal-field-static">
                <span>Line Total</span>
                <span>
                  $
                  {(
                    (Number.isFinite(parseFloat(detailPrice)) ? parseFloat(detailPrice) : detailItem.price) *
                    (Number.isFinite(parseInt(detailQuantity, 10)) && parseInt(detailQuantity, 10) >= 1
                      ? parseInt(detailQuantity, 10)
                      : detailItem.quantity)
                  ).toFixed(2)}
                </span>
              </div>

              <div className="modal-field">
                <label htmlFor="detail-notes">Notes</label>
                <textarea
                  id="detail-notes"
                  rows={4}
                  placeholder="Add a note for this item…"
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={closeItemDetail}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-primary" onClick={saveItemDetail}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentMethodOpen && (
        <div className="modal-backdrop" onClick={() => setPaymentMethodOpen(false)}>
          <div className="modal payment-method-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Payment Method</h2>
              <button
                className="modal-close"
                aria-label="Close"
                onClick={() => setPaymentMethodOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <button className="payment-method-option" onClick={() => chooseCardMethod('Credit')}>
                <span className="payment-method-icon">💳</span>
                <span>Credit</span>
              </button>
              <button className="payment-method-option" onClick={() => chooseCardMethod('Debit')}>
                <span className="payment-method-icon">🏧</span>
                <span>Debit</span>
              </button>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setPaymentMethodOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="modal-backdrop" onClick={closeReceipt}>
          <div className="modal receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Payment Approved</h2>
            </div>

            <div className="modal-body">
              <p className="receipt-summary">
                Paid <strong>${receipt.total.toFixed(2)}</strong> via {receipt.method}
              </p>
              <p className="receipt-question">Print a receipt for this order?</p>
            </div>

            <div className="modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={closeReceipt}>
                No Thanks
              </button>
              <button className="modal-btn modal-btn-primary" onClick={printReceipt}>
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="receipt-print">
          <div className="receipt-print-header">
            <h1>MOBILE BUZZ WIRELESS</h1>
            <p>{new Date(receipt.createdAt).toLocaleString()}</p>
          </div>

          <table className="receipt-print-items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr key={item.productId}>
                  <td>
                    {item.name}
                    {item.notes && <div className="receipt-print-note">Note: {item.notes}</div>}
                  </td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-print-totals">
            <div>
              <span>Subtotal</span>
              <span>${receipt.subtotal.toFixed(2)}</span>
            </div>
            <div>
              <span>Discount</span>
              <span>${receipt.discount.toFixed(2)}</span>
            </div>
            <div>
              <span>Tax</span>
              <span>${receipt.tax.toFixed(2)}</span>
            </div>
            <div className="receipt-print-grand-total">
              <span>Total</span>
              <span>${receipt.total.toFixed(2)}</span>
            </div>
            <div>
              <span>Payment Method</span>
              <span>{receipt.method}</span>
            </div>
          </div>

          <p className="receipt-print-thanks">Thank you for your purchase!</p>
        </div>
      )}
    </div>
  )
}

export default App
