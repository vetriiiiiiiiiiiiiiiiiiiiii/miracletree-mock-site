/**
 * A local MongoDB for development, for a Mac with no MongoDB installed.
 *
 * Prisma's MongoDB connector needs a replica set (it uses transactions), so
 * this starts a single-node one on port 27017. Data persists in .mongo-data/
 * between runs. Point DATABASE_URL at the URI it prints, then
 * `npx prisma db push && npm run db:seed` once to fill it.
 */
import { mkdirSync } from "node:fs";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";

const dbPath = new URL("../.mongo-data", import.meta.url).pathname;
mkdirSync(dbPath, { recursive: true });

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
  instanceOpts: [{ port: 27017, dbPath }],
});
console.log(`MongoDB ready: ${replSet.getUri("miracletree")}`);

const stop = async () => {
  await replSet.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
