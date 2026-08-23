import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { hashPassword } from "../lib/password";

const DEFAULT_SUPER_ADMIN = {
  firstName: "Super",
  lastName: "Admin",
  email: "superadmin@medtrack.edu",
  password: "Admin@12345",
};

async function ensureSuperAdmin() {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.role, "Super Admin"));
  if (existing) {
    console.log("Super Admin already exists — skipping.");
    return;
  }

  await db.insert(users).values({
    firstName: DEFAULT_SUPER_ADMIN.firstName,
    lastName: DEFAULT_SUPER_ADMIN.lastName,
    email: DEFAULT_SUPER_ADMIN.email,
    passwordHash: hashPassword(DEFAULT_SUPER_ADMIN.password),
    role: "Super Admin",
    status: "ACTIVE",
  });
  console.log(
    `Seeded: 1 Super Admin account (email: ${DEFAULT_SUPER_ADMIN.email}, password: ${DEFAULT_SUPER_ADMIN.password}). Change the password after logging in.`
  );
}

async function seed() {
  await ensureSuperAdmin();
  console.log(
    "Everything else — institutions, departments, streams, subjects, competencies, faculty, and other accounts — is created through the app UI."
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
