#!/usr/bin/env node
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "test@leynai.com";
  const projectId = "cmhizi6ep000310iae24sdcc7";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("User not found");
    return;
  }
  console.log("User id:", user.id);
  const members = await prisma.projectMember.findMany({
    where: { projectId, userId: user.id },
  });
  console.log(
    `Found ${members.length} projectMember(s) for project ${projectId} and user ${user.email}`
  );
  for (const m of members) {
    console.log(m);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => prisma.$disconnect());
