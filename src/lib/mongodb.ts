import mongoose from "mongoose";


interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global is used here to maintain a cached connection across hot-reloads in development.
// This prevents connections from growing exponentially during API Route usage.
declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local or deployment configuration.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export function getSubdomainFromRequest(request?: any): string {
  if (!request) return "";
  try {
    const getHeader = (name: string) => {
      if (typeof request.headers?.get === "function") return request.headers.get(name);
      return request.headers?.[name];
    };

    const headerSub = getHeader("x-community-subdomain");
    if (headerSub) return headerSub.toLowerCase().trim();

    const host = getHeader("x-forwarded-host") || getHeader("host") || "";
    const cleanHost = host.split(":")[0];
    const parts = cleanHost.split(".");

    if (parts.length >= 3) {
      const sub = parts[0].toLowerCase().trim();
      if (sub !== "www" && sub !== "app" && sub !== "mysocialclan") {
        return sub;
      }
    }

    if (parts.length === 2 && parts[1].includes("localhost")) {
      const sub = parts[0].toLowerCase().trim();
      if (sub !== "www") return sub;
    }
  } catch {}
  return "";
}

export function getTenantDbName(subdomain: string): string {
  const cleanSub = (subdomain || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
  return cleanSub ? `comicircle_${cleanSub}` : "";
}

export async function getTenantDb(subdomain: string) {
  await dbConnect();
  const tenantDbName = getTenantDbName(subdomain);
  if (tenantDbName) {
    return mongoose.connection.useDb(tenantDbName, { useCache: true });
  }
  return mongoose.connection;
}

