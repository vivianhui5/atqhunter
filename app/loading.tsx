export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="w-12 h-12 border border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-6" />
        <p className="text-stone-400 text-sm tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );
}
