/**
 * Writes src/demo/snapshot.json: the catalogue and editorial content from the
 * current database, for the database-free demo build (see src/lib/demo-db.js).
 *
 * Only public content is exported. Customers, orders, carts, sessions,
 * subscribers, logs and tokens are never written to the file, because the
 * snapshot is committed to the repository.
 *
 *   node scripts/export-demo-snapshot.mjs
 */
import { writeFileSync } from "node:fs";
import { PrismaClient, Prisma } from "@prisma/client";

const PRIVATE = new Set([
  "User", "PasswordResetToken", "Address", "CustomerNote", "Cart", "CartItem",
  "WishlistItem", "Order", "OrderItem", "OrderEvent", "NewsletterSubscriber",
  "AuditLog", "RateLimit", "Account", "Session", "EmailJob", "InventoryMovement",
]);

const prisma = new PrismaClient();
const snapshot = {};
for (const model of Prisma.dmmf.datamodel.models) {
  if (PRIVATE.has(model.name)) continue;
  const key = model.name[0].toLowerCase() + model.name.slice(1);
  snapshot[model.name] = await prisma[key].findMany();
}
// Reviews keep the public text and display name only.
snapshot.Review = (snapshot.Review ?? []).map((r) => ({ ...r, userId: null, authorEmail: null }));

writeFileSync(
  new URL("../src/demo/snapshot.json", import.meta.url),
  JSON.stringify(snapshot),
);
console.log(
  Object.entries(snapshot).map(([k, v]) => `${k}:${v.length}`).join(" "),
);
await prisma.$disconnect();
