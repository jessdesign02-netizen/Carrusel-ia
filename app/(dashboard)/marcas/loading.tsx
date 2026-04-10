export default function MarcasLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-24 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex gap-1.5 mb-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="w-5 h-5 rounded-full bg-gray-100 animate-pulse" />
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
