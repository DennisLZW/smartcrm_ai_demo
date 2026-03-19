import Link from "next/link";
import { listStaleCustomers } from "../../../../src/services/dashboard-service";

type StaleCustomerRow = {
  id: string;
  name: string;
  company: string | null;
  status: string;
  createdAt: Date;
  lastActivityAt: Date | null;
};

export default async function StaleCustomersPage() {
  const staleDays = 14;
  const customers = (await listStaleCustomers(staleDays, 200)) as StaleCustomerRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Customers to follow up (no contact for {staleDays} days)
          </h1>
          <p className="text-sm text-muted-foreground">
            Includes customers who have never been contacted, and those whose last contact is older than the threshold.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          Back to dashboard
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Last contacted</th>
              <th className="px-4 py-2">Created at</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                  No customers to follow up.
                </td>
              </tr>
            ) : (
              customers.map((c: StaleCustomerRow) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="px-4 py-2">
                    <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{c.company ?? "-"}</td>
                  <td className="px-4 py-2">{c.status}</td>
                  <td className="px-4 py-2">
                    {c.lastActivityAt
                      ? new Date(c.lastActivityAt).toLocaleDateString()
                      : "Never contacted"}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

