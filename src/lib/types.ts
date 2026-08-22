export type Category =
  | 'Kitchen'
  | 'Laundry'
  | 'Cooling'
  | 'Home Entertainment'
  | 'Small Appliances'
  | 'Phones & Tablets'
  | 'Computing'

export interface Review {
  id: string
  author: string
  location: string
  rating: number
  title: string
  body: string
  date: string
  verified: boolean
}

export interface GalleryShot {
  /** zoom factor applied to the base photo to simulate an alternate shot */
  zoom: number
  /** object-position value */
  pos: string
  label: string
}

export interface Product {
  id: string
  slug: string
  name: string
  tagline: string
  brand: string
  category: Category
  price: number
  compareAt?: number
  image: string
  gallery: GalleryShot[]
  badges: string[]
  rating: number
  reviewCount: number
  stock: number
  warrantyMonths: number
  powerWatts?: number
  capacity?: string
  colour: string
  featured?: boolean
  bestseller?: boolean
  /** Eligible for Chikwafu Express fast delivery. */
  express?: boolean
  description: string
  highlights: string[]
  specs: { label: string; value: string }[]
  reviews: Review[]
}

export interface CartLine {
  productId: string
  qty: number
}

export type PaymentMethod = 'mtn' | 'airtel' | 'card' | 'cod'

export interface DeliveryDetails {
  fullName: string
  phone: string
  email: string
  region: string
  town: string
  address: string
  notes: string
}
