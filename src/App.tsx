import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { CartDrawer } from './components/CartDrawer'

/*
 * Pages are code-split: the catalogue module is heavy, and lazy chunks keep
 * the first paint small on Ugandan mobile connections.
 */
const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const Express = lazy(() => import('./pages/Express'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderConfirmed = lazy(() => import('./pages/OrderConfirmed'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Track = lazy(() => import('./pages/Track'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminTickets = lazy(() => import('./pages/admin/Tickets'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading page">
      <Loader2 size={26} className="animate-spin text-accent" />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function Storefront() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/express" element={<Express />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/track" element={<Track />} />
            <Route path="/order-confirmed" element={<OrderConfirmed />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="products" element={<AdminProducts />} />
          </Route>
          <Route path="*" element={<Storefront />} />
        </Routes>
      </Suspense>
    </>
  )
}
