import { eq } from "drizzle-orm";
import { createDb } from "./client";
import { users } from "./schema";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("ADMIN_EMAIL environment variable is required");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const db = createDb(databaseUrl);

  const [user] = await db
    .update(users)
    .set({ role: "super_admin" })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (!user) {
    console.error(`User with email "${email}" not found`);
    process.exit(1);
  }

  console.log(`Updated user ${user.email} (${user.id}) to super_admin`);
  process.exit(0);
}

main();
