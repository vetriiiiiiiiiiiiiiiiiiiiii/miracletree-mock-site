import "server-only";
import { cookies } from "next/headers";
import { isDemo } from "@/lib/prisma";
import { demoRows, restoreDemoRows } from "@/lib/demo-db";

/**
 * The demo's last placed order, carried in a cookie so the confirmation page
 * can show it even when it is rendered by a different server instance than the
 * one that took the order (see lib/demo-db.js). Only the most recent order is
 * kept; this is a preview, not an order history.
 */
const COOKIE = "mt_demo_order";

export async function persistDemoOrder(orderNumber) {
  if (!isDemo) return;
  const [order] = demoRows("Order", (o) => o.orderNumber === orderNumber);
  if (!order) return;
  const payload = {
    order,
    items: demoRows("OrderItem", (i) => i.orderId === order.id),
    events: demoRows("OrderEvent", (e) => e.orderId === order.id),
  };
  const store = await cookies();
  store.set(COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function hydrateDemoOrder(orderNumber) {
  if (!isDemo) return;
  const store = await cookies();
  let saved = null;
  try {
    saved = JSON.parse(store.get(COOKIE)?.value ?? "null");
  } catch {
    return;
  }
  if (!saved || saved.order?.orderNumber !== orderNumber) return;
  restoreDemoRows("Order", [saved.order]);
  restoreDemoRows("OrderItem", saved.items ?? []);
  restoreDemoRows("OrderEvent", saved.events ?? []);
}
