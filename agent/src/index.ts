#!/usr/bin/env node

import { LeynAIAgent } from "./agent";
import dotenv from "dotenv";
import chalk from "chalk";

// Load environment variables
dotenv.config();

const BANNER = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║                   🚀 LeynAI Agent v1.0.0                   ║
║                                                            ║
║           Automatic Tunnel Management for Localhost        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`;

async function main() {
  console.log(chalk.cyan(BANNER));

  const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
  const authToken = process.env.AUTH_TOKEN;

  if (!authToken) {
    console.error(chalk.red("❌ Error: AUTH_TOKEN not found in environment"));
    console.log(chalk.yellow("\n💡 Instructions:"));
    console.log(chalk.white("1. Copy .env.example to .env"));
    console.log(chalk.white("2. Get your auth token from LeynAI dashboard"));
    console.log(chalk.white("3. Set AUTH_TOKEN=your_token_here in .env\n"));
    process.exit(1);
  }

  // Parse ports from env or use defaults
  const portsString = process.env.PORTS || "3000,8080,5173";
  const ports = portsString.split(",").map((p) => parseInt(p.trim(), 10));

  console.log(chalk.gray(`🔗 Backend: ${backendUrl}`));
  console.log(chalk.gray(`🔑 Token: ${authToken.substring(0, 10)}...`));
  console.log(chalk.gray(`📡 Monitoring ports: ${ports.join(", ")}\n`));

  // Initialize agent
  const agent = new LeynAIAgent({
    backendUrl,
    authToken,
    ports,
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log(chalk.yellow("\n\n🛑 Shutting down agent..."));
    await agent.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log(chalk.yellow("\n\n🛑 Shutting down agent..."));
    await agent.stop();
    process.exit(0);
  });

  // Start agent
  try {
    await agent.start();
  } catch (error) {
    console.error(chalk.red("❌ Fatal error:"), error);
    process.exit(1);
  }
}

main();
