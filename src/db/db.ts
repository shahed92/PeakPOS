import Dexie, { type EntityTable } from 'dexie'

export interface Product {
  id?: number
  name: string
  price: number
  stock: number
  barcode?: string
  category: string
}

export interface SaleItem {
  productId: number
  name: string
  price: number
  quantity: number
}

export interface Sale {
  id?: number
  items: SaleItem[]
  total: number
  createdAt: number
  synced: boolean
}

export const db = new Dexie('PeakPosDB') as Dexie & {
  products: EntityTable<Product, 'id'>
  sales: EntityTable<Sale, 'id'>
}

db.version(2).stores({
  products: '++id, name, barcode, category',
  sales: '++id, createdAt, synced',
})

export const CATEGORIES = [
  'SAMSUNG',
  'PHONE',
  'NEW ACTIVATION',
  'BILL PAY',
  'CABLE/CHARGER',
  'Apps',
  'FLASH DRIVE & SD CARD',
  'CAR HOLDER',
]

export async function seedIfEmpty() {
  await db.transaction('rw', db.products, async () => {
    const count = await db.products.count()
    if (count > 0) return

    await db.products.bulkAdd([
      { name: 'Galaxy S24', price: 799.0, stock: 10, barcode: '2001', category: 'SAMSUNG' },
      { name: 'Galaxy A15', price: 199.0, stock: 15, barcode: '2002', category: 'SAMSUNG' },
      { name: 'Phone Case', price: 12.5, stock: 30, barcode: '1002', category: 'PHONE' },
      { name: 'Screen Protector', price: 5.99, stock: 50, barcode: '1001', category: 'PHONE' },
      { name: 'New Line Activation', price: 25.0, stock: 999, barcode: '3001', category: 'NEW ACTIVATION' },
      { name: 'Bill Payment', price: 0.0, stock: 999, barcode: '4001', category: 'BILL PAY' },
      { name: 'USB-C Cable', price: 8.0, stock: 40, barcode: '1003', category: 'CABLE/CHARGER' },
      { name: 'Charger 20W', price: 15.0, stock: 25, barcode: '1004', category: 'CABLE/CHARGER' },
      { name: 'Manual', price: 0.0, stock: 999, barcode: '1006', category: 'CABLE/CHARGER' },
      { name: 'Streaming App Card', price: 10.0, stock: 60, barcode: '5001', category: 'Apps' },
      { name: '64GB Flash Drive', price: 9.99, stock: 35, barcode: '6001', category: 'FLASH DRIVE & SD CARD' },
      { name: '128GB SD Card', price: 14.99, stock: 28, barcode: '6002', category: 'FLASH DRIVE & SD CARD' },
      { name: 'Car Phone Holder', price: 11.99, stock: 22, barcode: '7001', category: 'CAR HOLDER' },
    ])
  })
}
