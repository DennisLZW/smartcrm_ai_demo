import Link from "next/link";
import { ActivitiesPanel } from "./ActivitiesPanel";
import { AiPanels } from "./AiPanels";
import { EmailLogsPanel } from "./EmailLogsPanel";
import { notFound } from "next/navigation";
import { requireSession } from "../../../../src/lib/auth";
import { db } from "../../../../src/lib/db";
import { listActivitiesByCustomer } from "../../../../src/services/activity-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  if (!session) notFound();

  const customer = await db.customer.findUnique({ where: { id } });
  if (!customer) notFound();
  if (session.user.role !== "ADMIN" && customer.ownerId !== session.user.id) {
    notFound();
  }

  const activities = await listActivitiesByCustomer(id);
  const initialActivities = activities.map((a: any) => ({
    ...a,
    occurredAt:
      a.occurredAt instanceof Date ? a.occurredAt.toISOString() : a.occurredAt,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Customer details: {customer.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            View customer information and activity history.
          </p>
        </div>
        <Link
          href="/customers"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to list
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
        <div className="space-y-3 rounded-md border border-border bg-card p-4 text-sm">
          <div className="font-medium">Basic information</div>
          <div className="space-y-1">
            <div>
              <span className="text-muted-foreground">Name:</span>
              {customer.name}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              {customer.email ?? "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Company:</span>
              {customer.company ?? "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              {customer.status}
            </div>
            <div>
              <span className="text-muted-foreground">Notes:</span>
              {customer.notes ?? "-"}
            </div>
            <div className="text-xs text-muted-foreground">
              Created at: {new Date(customer.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AiPanels customerId={id} customerEmail={customer.email} />
          <EmailLogsPanel customerId={id} />
          <ActivitiesPanel customerId={id} initialActivities={initialActivities} />
        </div>
      </div>
    </div>
  );
}

