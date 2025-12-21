import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center px-6">
        <h1 className="font-display text-8xl lg:text-9xl text-stone-200 mb-4">404</h1>
        <p className="text-xl lg:text-2xl text-stone-600 mb-2">Page Not Found</p>
        <p className="text-stone-400 mb-10 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-stone-900 text-white text-sm tracking-widest uppercase hover:bg-stone-800 transition-colors duration-300"
        >
          Return to Collection
        </Link>
      </div>
    </div>
  );
}
