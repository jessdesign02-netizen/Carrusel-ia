export default function CarruselesLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Search + filters skeleton */}
      <div className="mb-5 space-y-3">
        <div className="h-9 w-full bg-gray-100 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[80, 72, 92, 88, 76].map((w, i) => (
            <div key={i} className="h-7 rounded-full bg-gray-100 animate-pulse" style={{ width: w }} />
          ))}
          <div className="h-7 w-28 rounded-lg bg-gray-100 animate-pulse ml-auto" />
        </div>
      </div>

      {/* List rows skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-4 py-3"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
