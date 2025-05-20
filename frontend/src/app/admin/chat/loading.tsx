import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ChatLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List Skeleton */}
        <Card className="md:col-span-1 flex flex-col h-full">
          <CardHeader className="px-4 py-3 border-b">
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent className="p-0 overflow-auto flex-grow">
            <div className="divide-y">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages Skeleton */}
        <Card className="md:col-span-2 flex flex-col h-full">
          <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent className="p-6 overflow-auto flex-grow flex flex-col gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <Skeleton className={`h-20 ${i % 2 === 0 ? "w-2/3" : "w-1/2"} rounded-lg`} />
                </div>
              ))}
          </CardContent>
          <div className="p-4 border-t">
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    </div>
  )
}
