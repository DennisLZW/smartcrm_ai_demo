import { db } from "../lib/db";
import { listRecentActivities } from "./activity-service";

type LastByCustomerRow = {
  customerId: string;
  _max: { occurredAt: Date | null };
};

type CustomerRow = {
  id: string;
  name: string;
  email?: string | null;
  company: string | null;
  status: string;
  notes?: string | null;
  createdAt: Date;
};

export async function getDashboardData(options?: {
  recentActivityLimit?: number;
  staleDays?: number;
  staleLimit?: number;
  ownerId?: string;
}) {
  const recentActivityLimit = options?.recentActivityLimit ?? 12;
  const staleDays = options?.staleDays ?? 14;
  const staleLimit = options?.staleLimit ?? 10;
  const ownerId = options?.ownerId;

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 1000 * 60 * 60 * 24 * 7);
  const startOfMonth = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  })();
  const staleCutoff = new Date(now - 1000 * 60 * 60 * 24 * staleDays);

  const customerWhere = ownerId ? { ownerId } : undefined;
  const activityWhere = ownerId ? { customer: { ownerId } } : undefined;

  const [
    totalCustomers,
    newCustomers7d,
    activities7d,
    wonCustomersThisMonth,
    lostCustomersThisMonth,
    recentActivities,
  ] =
    await Promise.all([
      db.customer.count({ where: customerWhere }),
      db.customer.count({
        where: { ...(customerWhere ?? {}), createdAt: { gte: sevenDaysAgo } },
      }),
      ownerId
        ? db.activity.count({
            where: { ...(activityWhere as any), occurredAt: { gte: sevenDaysAgo } },
          })
        : db.activity.count({ where: { occurredAt: { gte: sevenDaysAgo } } }),
      db.customer.count({
        where: {
          ...(customerWhere ?? {}),
          status: "won",
          updatedAt: { gte: startOfMonth },
        },
      }),
      db.customer.count({
        where: {
          ...(customerWhere ?? {}),
          status: "lost",
          updatedAt: { gte: startOfMonth },
        },
      }),
      ownerId
        ? db.activity.findMany({
            orderBy: { occurredAt: "desc" },
            take: recentActivityLimit,
            where: activityWhere as any,
            include: {
              customer: {
                select: { id: true, name: true, company: true },
              },
            },
          })
        : listRecentActivities(recentActivityLimit),
    ]);

  const [noActivityCount, lastByCustomer] = await Promise.all([
    db.customer.count({
      where: { ...(customerWhere ?? {}), activities: { none: {} } },
    }),
    db.activity.groupBy({
      by: ["customerId"],
      _max: { occurredAt: true },
      where: ownerId ? { customer: { ownerId } } : undefined,
    }),
  ]);

  const staleByLastActivity = (lastByCustomer as LastByCustomerRow[])
    .filter((x: LastByCustomerRow) => x._max.occurredAt && x._max.occurredAt < staleCutoff)
    .map((x: LastByCustomerRow) => ({ customerId: x.customerId, lastActivityAt: x._max.occurredAt! }));

  const staleCount = noActivityCount + staleByLastActivity.length;

  const noActivityCustomers = await db.customer.findMany({
    where: { ...(customerWhere ?? {}), activities: { none: {} } },
    orderBy: { createdAt: "desc" },
    take: staleLimit,
    select: {
      id: true,
      name: true,
      company: true,
      status: true,
      createdAt: true,
    },
  });

  const remaining = Math.max(0, staleLimit - noActivityCustomers.length);
  const staleIds = staleByLastActivity.slice(0, remaining).map((x: { customerId: string }) => x.customerId);

  const staleCustomersWithActivity =
    staleIds.length === 0
      ? []
      : await db.customer.findMany({
          where: { id: { in: staleIds } },
          select: {
            id: true,
            name: true,
            company: true,
            status: true,
            createdAt: true,
          },
        });

  const lastActivityMap = new Map(
    staleByLastActivity.map((x: { customerId: string; lastActivityAt: Date }) => [x.customerId, x.lastActivityAt] as const),
  );

  const staleCustomers = [
    ...noActivityCustomers.map((c: CustomerRow) => ({ ...c, lastActivityAt: null as Date | null })),
    ...staleCustomersWithActivity.map((c: CustomerRow) => ({
      ...c,
      lastActivityAt: lastActivityMap.get(c.id) ?? null,
    })),
  ].slice(0, staleLimit);

  return {
    stats: {
      totalCustomers,
      newCustomers7d,
      activities7d,
      wonCustomersThisMonth,
      lostCustomersThisMonth,
      staleCount,
      staleDays,
    },
    recentActivities,
    staleCustomers,
  };
}

export async function listNewCustomers(days = 7, limit = 100) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);
  return db.customer.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      status: true,
      notes: true,
      createdAt: true,
    },
  });
}

export async function listStaleCustomers(days = 14, limit = 100, ownerId?: string) {
  const staleCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);
  const customerWhere = ownerId ? { ownerId } : undefined;

  const [noActivityCustomers, lastByCustomer] = await Promise.all([
    db.customer.findMany({
      where: { ...(customerWhere ?? {}), activities: { none: {} } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        status: true,
        notes: true,
        createdAt: true,
      },
    }),
    db.activity.groupBy({
      by: ["customerId"],
      _max: { occurredAt: true },
      where: ownerId ? { customer: { ownerId } } : undefined,
    }),
  ]);

  const staleByLastActivity = (lastByCustomer as LastByCustomerRow[])
    .filter((x: LastByCustomerRow) => x._max.occurredAt && x._max.occurredAt < staleCutoff)
    .map((x: LastByCustomerRow) => ({ customerId: x.customerId, lastActivityAt: x._max.occurredAt! }));

  const remaining = Math.max(0, limit - noActivityCustomers.length);
  const staleIds = staleByLastActivity.slice(0, remaining).map((x: { customerId: string }) => x.customerId);

  const staleCustomersWithActivity =
    staleIds.length === 0
      ? []
      : await db.customer.findMany({
          where: { id: { in: staleIds } },
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            status: true,
            notes: true,
            createdAt: true,
          },
        });

  const lastActivityMap = new Map(
    staleByLastActivity.map((x: { customerId: string; lastActivityAt: Date }) => [x.customerId, x.lastActivityAt] as const),
  );

  return [
    ...noActivityCustomers.map((c: CustomerRow) => ({ ...c, lastActivityAt: null as Date | null })),
    ...staleCustomersWithActivity.map((c: CustomerRow) => ({
      ...c,
      lastActivityAt: lastActivityMap.get(c.id) ?? null,
    })),
  ].slice(0, limit);
}

