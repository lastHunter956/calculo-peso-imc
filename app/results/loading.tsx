export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-600 text-sm animate-pulse">Cargando...</p>
      </div>
    </div>
  )
}
