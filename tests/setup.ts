import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-secret-key-for-vitest-only';
process.env.NODE_ENV = 'test';

// Module-level mutable cookie store driven by tests via setMockCookie helper.
// Handlers using `cookies()` from next/headers will see whatever the test set.
const cookieJar = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const v = cookieJar.get(name);
      return v ? { name, value: v } : undefined;
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
}));

// Test helpers (imported from tests/helpers.ts).
export function setMockCookie(name: string, value: string) {
  cookieJar.set(name, value);
}
export function clearMockCookies() {
  cookieJar.clear();
}

let mongo: MongoMemoryServer | null = null;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);

  // src/lib/db.ts captures `(global as any).mongoose` by reference at module
  // load and holds a local pointer (`cached`). Replacing the global object
  // wouldn't update that local pointer, so we MUTATE the existing object.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = global as any;
  if (g.mongoose) {
    g.mongoose.conn = mongoose;
    g.mongoose.promise = Promise.resolve(mongoose);
  } else {
    g.mongoose = { conn: mongoose, promise: Promise.resolve(mongoose) };
  }
});

afterEach(async () => {
  cookieJar.clear();
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
