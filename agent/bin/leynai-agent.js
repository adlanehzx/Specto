#!/usr/bin/env node

/**
 * LeynAI Agent CLI
 * Entry point for the command-line interface
 */

import { Command } from "commander";
import chalk from "chalk";

// Import CLI commands
import {
  login,
  start,
  stop,
  status,
  logout,
  test,
  init,
  validate,
  analyze,
} from "../dist/cli.js";

const program = new Command();

program
  .name("leynai-agent")
  .description(
    "LeynAI Agent - Automatic tunnel management for localhost testing"
  )
  .version("1.0.0");

// Login command
program
  .command("login")
  .description("Authenticate with LeynAI")
  .option("-e, --email <email>", "Email address")
  .option("-p, --password <password>", "Password")
  .option("-t, --token <token>", "JWT token (from dashboard)")
  .action(async (options) => {
    try {
      await login(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Start command
program
  .command("start")
  .description("Start the LeynAI agent")
  .option("-d, --daemon", "Run as background daemon")
  .option(
    "--ports <ports>",
    "Ports to monitor (comma-separated)",
    "3000,8080,5173"
  )
  .option("--backend <url>", "Backend API URL", "http://localhost:4000")
  .action(async (options) => {
    try {
      await start(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Stop command
program
  .command("stop")
  .description("Stop the running agent")
  .action(async () => {
    try {
      await stop();
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command("status")
  .description("Check agent status and active tunnels")
  .action(async () => {
    try {
      await status();
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Logout command
program
  .command("logout")
  .description("Logout from LeynAI")
  .action(async () => {
    try {
      await logout();
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Test command (CI/CD integration)
program
  .command("test")
  .description("Run tests from leynai.json configuration")
  .option("-c, --config <path>", "Path to config file", "leynai.json")
  .option("-e, --env <name>", "Environment to use", "local")
  .option(
    "--only <type>",
    "Run only specific test type (e2e, api, unit, smoke, performance, security)"
  )
  .option("-o, --output <format>", "Output format (console or json)", "console")
  .action(async (options) => {
    try {
      await test(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Init command
program
  .command("init")
  .description("Generate leynai.json configuration file")
  .option("-f, --force", "Overwrite existing configuration")
  .action(async (options) => {
    try {
      await init(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command("validate")
  .description("Validate leynai.json configuration")
  .option("-c, --config <path>", "Path to config file", "leynai.json")
  .action(async (options) => {
    try {
      await validate(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Analyze command (Unit Tests)
program
  .command("analyze")
  .description("Analyze project and generate unit tests for critical functions")
  .option("-t, --threshold <number>", "Minimum importance score (0-100)", "70")
  .option("--no-generate", "Only analyze, don't generate tests")
  .option("--no-ai", "Skip AI analysis, use static analysis only")
  .action(async (options) => {
    try {
      await analyze({
        threshold: parseInt(options.threshold),
        generate: options.generate,
        ai: options.ai,
      });
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
