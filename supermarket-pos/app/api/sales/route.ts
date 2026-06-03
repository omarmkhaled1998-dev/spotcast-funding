import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    let dateFilter: { gte?: Date } = {};
    const now = new Date();

    if (filter === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    } else if (filter === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      dateFilter = { gte: start };
    } else if (filter === "month") {
      const start = new Date(now);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    }

    const sales = await prisma.sale.findMany({
      where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sales);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, subtotal, discount, tax, total, amountPaid, change, paymentMethod, notes } = body;

    const lastSale = await prisma.sale.findFirst({ orderBy: { receiptNo: "desc" } });
    const receiptNo = (lastSale?.receiptNo ?? 0) + 1;

    const sale = await prisma.sale.create({
      data: {
        receiptNo,
        subtotal,
        discount: discount || 0,
        tax: tax || 0,
        total,
        amountPaid,
        change: change || 0,
        paymentMethod,
        notes: notes || null,
        items: {
          create: items.map((item: {
            productId: string;
            nameAr: string;
            nameEn: string;
            price: number;
            quantity: number;
            discount?: number;
            total: number;
          }) => ({
            productId: item.productId,
            nameAr: item.nameAr,
            nameEn: item.nameEn,
            price: item.price,
            quantity: item.quantity,
            discount: item.discount || 0,
            total: item.total,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // Update stock for each item
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create sale";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
