/**
 * The demo database: a stand-in for PrismaClient that answers from
 * src/demo/snapshot.json, held in memory.
 *
 * This is what lets the site run as a clickable mock with no database at all
 * (on Vercel, for a client preview). It implements the part of the Prisma
 * query API this codebase uses — where filters including relation filters,
 * select / include with nested relations and _count, orderBy, take / skip,
 * create / update / upsert / delete, count, aggregate, groupBy and
 * $transaction — generically, by reading the relation map from Prisma's own
 * DMMF rather than hard-coding each model.
 *
 * Writes succeed but live only in this server instance's memory. That is
 * deliberate: a demo should never persist what a visitor types into it. The
 * cart, which must survive between requests, is kept in the browser instead
 * (see components/cart/CartProvider.jsx).
 */
import { Prisma } from "@prisma/client";
import snapshot from "@/demo/snapshot.json";

const MODELS = Object.fromEntries(
  Prisma.dmmf.datamodel.models.map((m) => [m.name, m]),
);

const delegateToModel = (key) => key[0].toUpperCase() + key.slice(1);

/* ------------------------------------------------------------- the store */

function revive(modelName, row) {
  const model = MODELS[modelName];
  const out = { ...row };
  for (const field of model.fields) {
    if (field.type === "DateTime" && out[field.name] != null) {
      out[field.name] = new Date(out[field.name]);
    }
  }
  return out;
}

function loadTables() {
  const tables = {};
  for (const name of Object.keys(MODELS)) {
    tables[name] = (snapshot[name] ?? []).map((row) => revive(name, row));
  }
  return tables;
}

const globalForDemo = globalThis;
const tables = (globalForDemo.__demoTables ??= loadTables());

/* ------------------------------------------------------------ relations */

/** Describes how `field` on `model` joins to its target model. */
function relationOf(modelName, field) {
  const target = MODELS[field.type];
  if (field.relationFromFields?.length) {
    // This side holds the foreign key.
    return {
      target: field.type,
      list: field.isList,
      local: field.relationFromFields,
      remote: field.relationToFields,
    };
  }
  // The other side holds it.
  const back = target.fields.find(
    (f) =>
      f.relationName === field.relationName &&
      f.type === modelName &&
      f.relationFromFields?.length &&
      (f.name !== field.name || target.name !== modelName),
  );
  if (!back) return { target: field.type, list: field.isList, local: [], remote: [] };
  return {
    target: field.type,
    list: field.isList,
    local: back.relationToFields,
    remote: back.relationFromFields,
  };
}

function related(modelName, row, fieldName) {
  const model = MODELS[modelName];
  const field = model.fields.find((f) => f.name === fieldName);
  const rel = relationOf(modelName, field);
  const rows = tables[rel.target].filter((other) =>
    rel.local.length
      ? rel.local.every((l, i) => row[l] != null && other[rel.remote[i]] === row[l])
      : false,
  );
  return rel.list ? rows : rows[0] ?? null;
}

const fieldOf = (modelName, name) =>
  MODELS[modelName].fields.find((f) => f.name === name);

/* ---------------------------------------------------------------- where */

function compare(a, b) {
  if (a instanceof Date) a = a.getTime();
  if (b instanceof Date) b = b.getTime();
  return a < b ? -1 : a > b ? 1 : 0;
}

function eq(a, b) {
  if (a instanceof Date || b instanceof Date) return compare(a, b) === 0;
  return a === b;
}

function matchScalar(value, cond) {
  if (cond === null) return value == null;
  if (typeof cond !== "object" || cond instanceof Date) return eq(value, cond);
  const ci = cond.mode === "insensitive";
  const str = (v) => (ci ? String(v ?? "").toLowerCase() : String(v ?? ""));
  for (const [op, arg] of Object.entries(cond)) {
    switch (op) {
      case "mode":
        break;
      case "equals":
        if (arg === null ? value != null : ci ? str(value) !== str(arg) : !eq(value, arg)) return false;
        break;
      case "not":
        if (arg !== null && typeof arg === "object" && !(arg instanceof Date)) {
          if (matchScalar(value, arg)) return false;
        } else if (arg === null ? value == null : eq(value, arg)) return false;
        break;
      case "in":
        if (!arg.some((a) => eq(value, a))) return false;
        break;
      case "notIn":
        if (arg.some((a) => eq(value, a))) return false;
        break;
      case "lt":
        if (value == null || compare(value, arg) >= 0) return false;
        break;
      case "lte":
        if (value == null || compare(value, arg) > 0) return false;
        break;
      case "gt":
        if (value == null || compare(value, arg) <= 0) return false;
        break;
      case "gte":
        if (value == null || compare(value, arg) < 0) return false;
        break;
      case "contains":
        if (value == null || !str(value).includes(str(arg))) return false;
        break;
      case "startsWith":
        if (value == null || !str(value).startsWith(str(arg))) return false;
        break;
      case "endsWith":
        if (value == null || !str(value).endsWith(str(arg))) return false;
        break;
      case "has":
        if (!Array.isArray(value) || !value.includes(arg)) return false;
        break;
      case "isSet":
        if ((value !== undefined) !== arg) return false;
        break;
      default:
        break;
    }
  }
  return true;
}

function matches(modelName, row, where) {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (key === "AND") {
      const list = Array.isArray(cond) ? cond : [cond];
      if (!list.every((w) => matches(modelName, row, w))) return false;
      continue;
    }
    if (key === "OR") {
      if (!cond.some((w) => matches(modelName, row, w))) return false;
      continue;
    }
    if (key === "NOT") {
      const list = Array.isArray(cond) ? cond : [cond];
      if (list.some((w) => matches(modelName, row, w))) return false;
      continue;
    }
    const field = fieldOf(modelName, key);
    if (!field) {
      // A compound unique key, e.g. { productId_userId: { productId, userId } }.
      if (cond && typeof cond === "object" && !matches(modelName, row, cond)) return false;
      continue;
    }
    if (field.kind === "object") {
      const value = related(modelName, row, key);
      if (field.isList) {
        if (cond.some && !value.some((r) => matches(field.type, r, cond.some))) return false;
        if (cond.every && !value.every((r) => matches(field.type, r, cond.every))) return false;
        if (cond.none && value.some((r) => matches(field.type, r, cond.none))) return false;
      } else {
        if (cond === null) {
          if (value != null) return false;
        } else if ("is" in cond || "isNot" in cond) {
          if ("is" in cond && !(cond.is === null ? value == null : value && matches(field.type, value, cond.is))) return false;
          if ("isNot" in cond && (cond.isNot === null ? value == null : value && matches(field.type, value, cond.isNot))) return false;
        } else if (!value || !matches(field.type, value, cond)) return false;
      }
      continue;
    }
    if (!matchScalar(row[key], cond)) return false;
  }
  return true;
}

/* -------------------------------------------------------------- orderBy */

function sortRows(modelName, rows, orderBy) {
  if (!orderBy) return rows;
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  const keyed = list.flatMap((o) => Object.entries(o));
  return [...rows].sort((a, b) => {
    for (const [key, dir] of keyed) {
      let av;
      let bv;
      let direction = dir;
      const field = fieldOf(modelName, key);
      if (key === "_count" || (field && field.kind === "object")) {
        if (key === "_count") {
          const [rel, d] = Object.entries(dir)[0];
          av = related(modelName, a, rel).length;
          bv = related(modelName, b, rel).length;
          direction = d;
        } else if (field.isList) {
          av = related(modelName, a, key).length;
          bv = related(modelName, b, key).length;
          direction = dir._count ?? "asc";
        } else {
          const [sub, d] = Object.entries(dir)[0];
          av = related(modelName, a, key)?.[sub];
          bv = related(modelName, b, key)?.[sub];
          direction = d;
        }
      } else {
        av = a[key];
        bv = b[key];
        if (typeof dir === "object") direction = dir.sort;
      }
      if (av == null && bv == null) continue;
      if (av == null) return 1;
      if (bv == null) return -1;
      const c = compare(av, bv);
      if (c !== 0) return direction === "desc" ? -c : c;
    }
    return 0;
  });
}

function page(rows, { take, skip, distinct } = {}) {
  let out = rows;
  if (distinct) {
    const keys = Array.isArray(distinct) ? distinct : [distinct];
    const seen = new Set();
    out = out.filter((r) => {
      const k = keys.map((key) => String(r[key])).join("|");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  if (skip) out = out.slice(skip);
  if (take != null) out = take < 0 ? out.slice(take) : out.slice(0, take);
  return out;
}

/* ------------------------------------------------------- select/include */

function countOf(modelName, row, spec) {
  const out = {};
  const sel = spec === true ? null : spec.select;
  const fields = sel
    ? Object.keys(sel)
    : MODELS[modelName].fields.filter((f) => f.kind === "object" && f.isList).map((f) => f.name);
  for (const name of fields) {
    const arg = sel?.[name];
    const field = fieldOf(modelName, name);
    const rows = related(modelName, row, name);
    out[name] = rows.filter((r) => matches(field.type, r, arg?.where)).length;
  }
  return out;
}

function relationValue(modelName, row, name, arg) {
  const field = fieldOf(modelName, name);
  let value = related(modelName, row, name);
  if (field.isList) {
    const opts = arg === true ? {} : arg;
    value = value.filter((r) => matches(field.type, r, opts.where));
    value = page(sortRows(field.type, value, opts.orderBy), opts);
    return value.map((r) => shape(field.type, r, opts));
  }
  if (!value) return null;
  return shape(field.type, value, arg === true ? {} : arg);
}

function shape(modelName, row, args = {}) {
  const { select, include } = args;
  if (select) {
    const out = {};
    for (const [name, arg] of Object.entries(select)) {
      if (!arg) continue;
      if (name === "_count") out._count = countOf(modelName, row, arg);
      else if (fieldOf(modelName, name)?.kind === "object") out[name] = relationValue(modelName, row, name, arg);
      else out[name] = row[name];
    }
    return out;
  }
  const out = { ...row };
  if (include) {
    for (const [name, arg] of Object.entries(include)) {
      if (!arg) continue;
      if (name === "_count") out._count = countOf(modelName, row, arg);
      else out[name] = relationValue(modelName, row, name, arg);
    }
  }
  return out;
}

/* --------------------------------------------------------------- writes */

const objectId = () =>
  Array.from({ length: 24 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

function withDefaults(modelName, data) {
  const row = {};
  for (const field of MODELS[modelName].fields) {
    if (field.kind === "object") continue;
    if (data[field.name] !== undefined) continue;
    const d = field.default;
    if (field.isId && (d?.name === "auto" || d?.name === "cuid" || d?.name === "uuid" || !d)) row[field.name] = objectId();
    else if (d?.name === "now" || field.isUpdatedAt) row[field.name] = new Date();
    else if (d?.name === "autoincrement") row[field.name] = tables[modelName].length + 1;
    else if (d !== undefined && typeof d !== "object") row[field.name] = d;
    else if (field.isList) row[field.name] = [];
    else row[field.name] = null;
  }
  return row;
}

function applyScalar(current, value) {
  if (value && typeof value === "object" && !(value instanceof Date) && !Array.isArray(value)) {
    if ("set" in value) return value.set;
    if ("increment" in value) return (current ?? 0) + value.increment;
    if ("decrement" in value) return (current ?? 0) - value.decrement;
    if ("multiply" in value) return (current ?? 0) * value.multiply;
    if ("divide" in value) return (current ?? 0) / value.divide;
    if ("push" in value) return [...(current ?? []), ...[].concat(value.push)];
  }
  return value;
}

function writeRelations(modelName, row, data) {
  for (const [name, value] of Object.entries(data)) {
    const field = fieldOf(modelName, name);
    if (!field || field.kind !== "object" || value == null) continue;
    const rel = relationOf(modelName, field);
    if (rel.local.length && fieldOf(modelName, rel.local[0])?.kind === "scalar" && relationIsOwned(modelName, field)) {
      // This row holds the key: connect / create the parent.
      if (value.connect) {
        const target = tables[field.type].find((r) => matches(field.type, r, value.connect));
        if (target) rel.local.forEach((l, i) => (row[l] = target[rel.remote[i]]));
      } else if (value.create) {
        const target = createRow(field.type, value.create);
        rel.local.forEach((l, i) => (row[l] = target[rel.remote[i]]));
      } else if (value.disconnect) {
        rel.local.forEach((l) => (row[l] = null));
      }
      continue;
    }
    // Children hold the key back to this row.
    const link = (child) => rel.remote.forEach((r, i) => (child[r] = row[rel.local[i]]));
    const creates = value.create ? [].concat(value.create) : [];
    if (value.createMany) creates.push(...[].concat(value.createMany.data));
    if (value.deleteMany !== undefined) {
      const w = value.deleteMany === true ? {} : value.deleteMany;
      tables[field.type] = tables[field.type].filter(
        (c) => !(rel.remote.every((r, i) => c[r] === row[rel.local[i]]) && matches(field.type, c, w)),
      );
    }
    for (const c of creates) {
      const child = { ...c };
      link(child);
      createRow(field.type, child);
    }
    for (const c of value.connect ? [].concat(value.connect) : []) {
      const target = tables[field.type].find((r) => matches(field.type, r, c));
      if (target) link(target);
    }
    if (value.upsert) {
      for (const u of [].concat(value.upsert)) {
        const existing = tables[field.type].find((r) => matches(field.type, r, u.where));
        if (existing) updateRow(field.type, existing, u.update);
        else {
          const child = { ...u.create };
          link(child);
          createRow(field.type, child);
        }
      }
    }
    if (value.update && !field.isList) {
      const target = related(modelName, row, name);
      if (target) updateRow(field.type, target, value.update);
    }
  }
}

function relationIsOwned(modelName, field) {
  return Boolean(field.relationFromFields?.length);
}

function createRow(modelName, data) {
  const row = withDefaults(modelName, data);
  for (const [name, value] of Object.entries(data)) {
    const field = fieldOf(modelName, name);
    if (field && field.kind !== "object") row[name] = applyScalar(undefined, value);
  }
  tables[modelName].push(row);
  writeRelations(modelName, row, data);
  return row;
}

function updateRow(modelName, row, data) {
  for (const [name, value] of Object.entries(data)) {
    const field = fieldOf(modelName, name);
    if (field && field.kind !== "object" && value !== undefined) row[name] = applyScalar(row[name], value);
  }
  const updatedAt = MODELS[modelName].fields.find((f) => f.isUpdatedAt);
  if (updatedAt) row[updatedAt.name] = new Date();
  writeRelations(modelName, row, data);
  return row;
}

const clone = (v) => (v === null || v === undefined ? v : structuredClone(v));

/* ------------------------------------------------------------ delegates */

function notFound(modelName) {
  const error = new Error(`No ${modelName} found`);
  error.code = "P2025";
  return error;
}

function delegate(modelName) {
  const find = (args = {}) =>
    page(sortRows(modelName, tables[modelName].filter((r) => matches(modelName, r, args.where)), args.orderBy), args);

  const api = {
    async findMany(args = {}) {
      return clone(find(args).map((r) => shape(modelName, r, args)));
    },
    async findFirst(args = {}) {
      const [row] = find({ ...args, take: 1 });
      return row ? clone(shape(modelName, row, args)) : null;
    },
    async findUnique(args = {}) {
      const row = tables[modelName].find((r) => matches(modelName, r, args.where));
      return row ? clone(shape(modelName, row, args)) : null;
    },
    async findFirstOrThrow(args) {
      const row = await api.findFirst(args);
      if (!row) throw notFound(modelName);
      return row;
    },
    async findUniqueOrThrow(args) {
      const row = await api.findUnique(args);
      if (!row) throw notFound(modelName);
      return row;
    },
    async count(args = {}) {
      const n = find({ where: args.where, take: args.take, skip: args.skip }).length;
      if (args.select && typeof args.select === "object") {
        return Object.fromEntries(Object.keys(args.select).map((k) => [k, n]));
      }
      return n;
    },
    async create(args) {
      const row = createRow(modelName, args.data);
      return clone(shape(modelName, row, args));
    },
    async createMany(args) {
      const list = [].concat(args.data);
      list.forEach((d) => createRow(modelName, d));
      return { count: list.length };
    },
    async update(args) {
      const row = tables[modelName].find((r) => matches(modelName, r, args.where));
      if (!row) throw notFound(modelName);
      updateRow(modelName, row, args.data);
      return clone(shape(modelName, row, args));
    },
    async updateMany(args = {}) {
      const rows = tables[modelName].filter((r) => matches(modelName, r, args.where));
      rows.forEach((r) => updateRow(modelName, r, args.data));
      return { count: rows.length };
    },
    async upsert(args) {
      const row = tables[modelName].find((r) => matches(modelName, r, args.where));
      const result = row ? updateRow(modelName, row, args.update) : createRow(modelName, args.create);
      return clone(shape(modelName, result, args));
    },
    async delete(args) {
      const row = tables[modelName].find((r) => matches(modelName, r, args.where));
      if (!row) throw notFound(modelName);
      tables[modelName] = tables[modelName].filter((r) => r !== row);
      return clone(shape(modelName, row, args));
    },
    async deleteMany(args = {}) {
      const before = tables[modelName].length;
      tables[modelName] = tables[modelName].filter((r) => !matches(modelName, r, args.where));
      return { count: before - tables[modelName].length };
    },
    async aggregate(args = {}) {
      return aggregateRows(find(args), args);
    },
    async groupBy(args) {
      const rows = tables[modelName].filter((r) => matches(modelName, r, args.where));
      const by = [].concat(args.by);
      const groups = new Map();
      for (const r of rows) {
        const k = JSON.stringify(by.map((b) => r[b]));
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(r);
      }
      let out = [...groups.values()].map((g) => ({
        ...Object.fromEntries(by.map((b) => [b, g[0][b]])),
        ...aggregateRows(g, args),
      }));
      if (args.orderBy) {
        const list = [].concat(args.orderBy);
        out.sort((a, b) => {
          for (const o of list) {
            const [k, v] = Object.entries(o)[0];
            const [av, bv, dir] =
              typeof v === "object"
                ? [a[k]?.[Object.keys(v)[0]], b[k]?.[Object.keys(v)[0]], Object.values(v)[0]]
                : [a[k], b[k], v];
            const c = compare(av ?? 0, bv ?? 0);
            if (c) return dir === "desc" ? -c : c;
          }
          return 0;
        });
      }
      return page(out, args);
    },
  };
  return api;
}

function aggregateRows(rows, args) {
  const out = {};
  const nums = (f) => rows.map((r) => r[f]).filter((v) => typeof v === "number");
  if (args._count) {
    out._count =
      args._count === true
        ? rows.length
        : Object.fromEntries(
            Object.keys(args._count).map((f) => [f, f === "_all" ? rows.length : rows.filter((r) => r[f] != null).length]),
          );
  }
  const reducers = {
    _sum: (v) => (v.length ? v.reduce((a, b) => a + b, 0) : null),
    _avg: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null),
    _min: (v) => (v.length ? Math.min(...v) : null),
    _max: (v) => (v.length ? Math.max(...v) : null),
  };
  for (const [op, fn] of Object.entries(reducers)) {
    if (args[op]) out[op] = Object.fromEntries(Object.keys(args[op]).map((f) => [f, fn(nums(f))]));
  }
  return out;
}

/* --------------------------------------------------------------- client */

export function createDemoPrisma() {
  const delegates = {};
  const client = new Proxy(
    {},
    {
      get(_, key) {
        if (key === "$transaction") {
          return async (arg) => (typeof arg === "function" ? arg(client) : Promise.all(arg));
        }
        if (key === "$connect" || key === "$disconnect") return async () => {};
        if (key === "$queryRaw" || key === "$executeRaw" || key === "$queryRawUnsafe" || key === "$executeRawUnsafe") {
          return async () => [];
        }
        if (key === "$runCommandRaw") return async () => ({ ok: 1 });
        if (key === "then" || typeof key !== "string") return undefined;
        const name = delegateToModel(key);
        if (!MODELS[name]) return undefined;
        return (delegates[name] ??= delegate(name));
      },
    },
  );
  return client;
}

/** Rows of a model, as stored (for carrying a record across instances). */
export function demoRows(modelName, predicate) {
  return tables[modelName].filter(predicate);
}

/** Puts rows back into the store, reviving dates, unless their ids exist. */
export function restoreDemoRows(modelName, rows) {
  for (const row of rows) {
    if (tables[modelName].some((r) => r.id === row.id)) continue;
    tables[modelName].push(revive(modelName, row));
  }
}
