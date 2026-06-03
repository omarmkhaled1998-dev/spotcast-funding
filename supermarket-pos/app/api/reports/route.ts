import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todaySales, allSales, topItems] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: todayStart } },
        include: { items: true },
      }),
      prisma.sale.findMany({ include: { items: true } }),
      prisma.saleItem.groupBy({
        by: ["productId", "nameAr", "nameEn"],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 10,
      }),
    ]);

    const todayRevenue = todaySales.reduce((s, sale) => s + sale.total, 0);
    const todayOrders = todaySales.length;
    const todayAvg = todayOrders ? todayRevenue / todayOrders : 0;

    const totalRevenue = allSales.reduce((s, sale) => s + sale.total, 0);
    const totalOrders = allSales.length;

    return NextResponse.json({
      today: { revenue: todayRevenue, orders: todayOrders, average: todayAvg },
      overall: { revenue: totalRevenue, orders: totalOrders },
      topProducts: topItems,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
