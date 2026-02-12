/**
 * Skeleton Loader Components
 * Loading states for dashboard, assessments, and vendor cards
 */

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="card-body">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-gray-200 rounded-full w-12 h-12" />
              <div className="text-right">
                <div className="bg-gray-200 rounded h-4 w-24 mb-2" />
                <div className="bg-gray-300 rounded h-8 w-16" />
              </div>
            </div>
            <div className="bg-gray-200 rounded h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssessmentListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-200 rounded-full w-2 h-2" />
              <div className="flex-1">
                <div className="bg-gray-300 rounded h-5 w-64 mb-2" />
                <div className="bg-gray-200 rounded h-4 w-48" />
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-gray-200 rounded h-4 w-24" />
                <div className="bg-gray-200 rounded h-4 w-20" />
                <div className="bg-gray-300 rounded h-6 w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function VendorCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="card-body space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="bg-gray-300 rounded h-6 w-40 mb-2" />
                <div className="bg-gray-200 rounded h-4 w-32" />
              </div>
              <div className="bg-gray-200 rounded h-6 w-16" />
            </div>
            <div className="bg-gray-200 rounded h-4 w-48" />
            <div>
              <div className="bg-gray-200 rounded h-3 w-full mb-2" />
              <div className="bg-gray-300 rounded h-2 w-full" />
            </div>
            <div className="flex items-center space-x-2 pt-3 border-t border-border">
              <div className="bg-gray-200 rounded h-8 flex-1" />
              <div className="bg-gray-300 rounded h-8 flex-1" />
              <div className="bg-gray-200 rounded h-8 w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssessmentDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-200 rounded w-10 h-10" />
          <div>
            <div className="bg-gray-300 rounded h-8 w-64 mb-2" />
            <div className="bg-gray-200 rounded h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-200 rounded h-8 w-24" />
          <div className="bg-gray-300 rounded h-8 w-20" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border animate-pulse">
        <div className="flex space-x-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded h-6 w-32 mb-3" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-body">
              <div className="bg-gray-300 rounded h-6 w-48 mb-6" />
              <div className="bg-gray-200 rounded-full w-48 h-48 mx-auto" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="bg-gray-200 rounded h-4 w-24 mb-2" />
                  <div className="bg-gray-300 rounded h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card">
            <div className="card-body space-y-4">
              <div className="bg-gray-300 rounded h-6 w-40" />
              <div className="space-y-3">
                <div className="bg-gray-200 rounded h-4 w-full" />
                <div className="bg-gray-200 rounded h-4 w-full" />
                <div className="bg-gray-200 rounded h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="card animate-pulse mb-2">
      <div className="card-body">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
