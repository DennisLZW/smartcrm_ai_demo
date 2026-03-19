import Link from "next/link";
import { listNewCustomers } from "../../../../src/services/dashboard-service";

type NewCustomerRow = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
  createdAt: Date;
};

export default async function NewCustomersPage() {
  const customers = (await listNewCustomers(7, 200)) as NewCustomerRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            New customers (last 7 days)
          </h1>
          <p className="text-sm text-muted-foreground">
            Click a customer to view activities and notes.
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
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created at</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                  No new customers in the last 7 days.
                </td>
              </tr>
            ) : (
              customers.map((c: NewCustomerRow) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="px-4 py-2">
                    <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{c.email ?? "-"}</td>
                  <td className="px-4 py-2">{c.company ?? "-"}</td>
                  <td className="px-4 py-2">{c.status}</td>
                  <td className="px-4 py-2">
                    {new Date(c.createdAt).toLocaleString()}
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

