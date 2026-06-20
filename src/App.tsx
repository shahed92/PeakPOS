import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, seedIfEmpty, type Product, type SaleItem } from './db/db'
import './App.css'

function App() {
  const [online, setOnline] = useState(navigator.onLine)
  const [cart, setCart] = useState<SaleItem[]>([])

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
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
    <div className="app">
      <header className="app-header">
        <h1>PeakPos</h1>
        <span className={online ? 'status online' : 'status offline'}>
          {online ? 'Online' : 'Offline'}
        </span>
      </header>

      <div className="layout">
        <section className="products">
          <h2>Products</h2>
          <div className="product-grid">
            {products?.map((product) => (
              <button key={product.id} className="product-card" onClick={() => addToCart(product)}>
                <span className="product-name">{product.name}</span>
                <span className="product-price">${product.price.toFixed(2)}</span>
                <span className="product-stock">Stock: {product.stock}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="cart">
          <h2>Cart</h2>
          <ul className="cart-list">
            {cart.map((item) => (
              <li key={item.productId} className="cart-item">
                <span>{item.name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => removeFromCart(item.productId)}>x</button>
              </li>
            ))}
          </ul>
          <div className="cart-total">Total: ${total.toFixed(2)}</div>
          <button className="checkout-btn" disabled={cart.length === 0} onClick={checkout}>
            Checkout
          </button>
        </section>
      </div>
    </div>
  )
}

export default App
