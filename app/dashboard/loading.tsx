import { AppShell } from "@/components/nav/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function LoadingDashboard() {
  return (
    <AppShell activePath="/dashboard">
      <div className="grid gap-4 lg:gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardBody>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-20" />
              </CardBody>
            </Card>
          ))}
        </div>
        <Card>
          <CardBody>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-36 w-full" />
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

