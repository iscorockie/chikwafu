import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-px py-32 text-center">
      <h1 className="text-6xl font-display font-bold text-ink-900 mb-4">404</h1>
      <p className="text-ink-400 mb-8">This page wandered off the shelf.</p>
      <Link to="/" className="btn-primary">
        Back to Home
      </Link>
    </div>
  );
}
