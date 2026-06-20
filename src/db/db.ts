import Dexie, { type EntityTable } from 'dexie'

export interface Product {
  id?: number
  name: string
  price: number
  stock: number
  barcode?: string
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

db.version(1).stores({
  products: '++id, name, barcode',
  sales: '++id, createdAt, synced',
})

export async function seedIfEmpty() {
  await db.transaction('rw', db.products, async () => {
    const count = await db.products.count()
    if (count > 0) return

    await db.products.bulkAdd([
      { name: 'Screen Protector', price: 5.99, stock: 50, barcode: '1001' },
      { name: 'Phone Case', price: 12.5, stock: 30, barcode: '1002' },
      { name: 'USB-C Cable', price: 8.0, stock: 40, barcode: '1003' },
      { name: 'Charger 20W', price: 15.0, stock: 25, barcode: '1004' },
      { name: 'Earphones', price: 9.99, stock: 20, barcode: '1005' },
    ])
  })
}
