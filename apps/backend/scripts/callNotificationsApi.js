#!/usr/bin/env node

const jwt = require("jsonwebtoken");
const fetch = global.fetch || require("node-fetch");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "test@leynai.com";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  // read JWT secret from env (fallback to dev secret)
  const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-key-12345";
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  console.log("Using token:", token);

  const API_URL = process.env.API_URL || "http://localhost:4000";
  const url = `${API_URL}/api/notifications`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await resp.text();
  console.log("Status:", resp.status);
  console.log("Body:", text);
}

main()
  .catch((e) => {
    console.error("Error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
