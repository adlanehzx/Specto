#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "test@leynai.com";
  console.log(`Searching notifications for user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { notifications: true },
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  const notifications = user.notifications || [];
  console.log(
    `Found user id=${user.id}, ${notifications.length} notification(s)`
  );
  for (const n of notifications) {
    console.log("---");
    console.log(`id: ${n.id}`);
    console.log(`type: ${n.type}`);
    console.log(`title: ${n.title}`);
    console.log(`message: ${n.message}`);
    console.log(`link: ${n.link}`);
    console.log(`read: ${n.read}`);
    console.log(`createdAt: ${n.createdAt}`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
