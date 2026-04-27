"use server";
import { saveCfCookie, loadCfCookie, cfCookieAgeHours } from "@/lib/scraper/daleel-madani";
import { revalidatePath } from "next/cache";

export async function saveCfClearanceCookie(formData: FormData) {
  const value = (formData.get("cfClearance") as string || "").trim();
  if (!value) return { error: "Cookie value cannot be empty" };
  saveCfCookie(value);
  revalidatePath("/discover");
  return { success: true };
}

export async function getCfCookieStatus(): Promise<{
  exists: boolean;
  ageHours: number | null;
  expired: boolean;
}> {
  const store = loadCfCookie();
  const ageHours = cfCookieAgeHours();
  return {
    exists: !!store,
    ageHours,
    expired: ageHours !== null && ageHours > 23,
  };
}
