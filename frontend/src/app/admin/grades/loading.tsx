import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function RolesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-16 mb-1" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="h-10 px-4 border-b flex items-center">
              <Skeleton className="h-4 w-16 mr-8" />
              <Skeleton className="h-4 w-32 mr-8" />
              <Skeleton className="h-4 w-16 mr-8" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="divide-y">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-16 px-4 flex items-center">
                    <Skeleton className="h-4 w-32 mr-8" />
                    <Skeleton className="h-4 w-48 mr-8" />
                    <Skeleton className="h-4 w-16 mr-8" />
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
