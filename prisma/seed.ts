import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      name: "Yönetici",
      email: "admin@crm.com",
      password: "admin123",
      role: UserRole.ADMIN,
    },
    {
      name: "Ekip Lideri",
      email: "lead@crm.com",
      password: "lead123",
      role: UserRole.SALES_MANAGER,
    },
    {
      name: "Satış Temsilcisi",
      email: "rep@crm.com",
      password: "rep123",
      role: UserRole.SALES_REP,
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    const passwordHash = await bcrypt.hash(user.password, 10);

    if (existing) {
      await prisma.user.update({
        where: { email: user.email },
        data: {
          name: user.name,
          passwordHash,
          role: user.role,
          isActive: true,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
          isActive: true,
        },
      });
    }
  }

  console.log("Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });