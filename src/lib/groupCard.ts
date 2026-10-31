import { connection } from "next/server";
import { getActiveGroupById } from "@/lib/group";

export function calculateDaysLeft(expiresAt: Date, now: number): number {
  return Math.max(
    0,
    Math.ceil((expiresAt.getTime() - now) / (24 * 60 * 60 * 1000))
  );
}

/** Load fresh card data at the server request boundary, outside React render. */
export async function getActiveGroupCardData(id: string) {
  // Next's connection() excludes the database read and clock from prerendering.
  await connection();
  const group = await getActiveGroupById(id);
  if (!group) return null;

  return {
    group,
    daysLeft: calculateDaysLeft(group.expiresAt, Date.now()),
  };
}
