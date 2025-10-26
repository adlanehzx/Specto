#!/usr/bin/env node
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "test@leynai.com";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("User not found");
    return;
  }
  console.log("User:", {
    id: user.id,
    email: user.email,
    passwordHash: !!user.passwordHash,
    createdAt: user.createdAt,
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => prisma.$disconnect());
