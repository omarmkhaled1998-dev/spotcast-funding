import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || undefined;
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const products = await prisma.product.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { nameAr: { contains: search } },
                { nameEn: { contains: search } },
                { barcode: { contains: search } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: { nameAr: "asc" },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        barcode: body.barcode || null,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        categoryId: body.categoryId || null,
        price: parseFloat(body.price),
        cost: body.cost ? parseFloat(body.cost) : null,
        unit: body.unit || "قطعة",
        stock: parseFloat(body.stock || 0),
        minStock: parseFloat(body.minStock || 5),
        isActive: body.isActive !== false,
      },
      include: { category: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
