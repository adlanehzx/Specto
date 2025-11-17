import * as ts from "typescript";
import { glob } from "glob";
import * as fs from "fs-extra";
import * as path from "path";
import axios from "axios";
import type { Config } from "./config.js";

export interface ExtractedFunction {
  name: string;
  filePath: string;
  code: string;
  lineStart: number;
  lineEnd: number;
  parameters: string[];
  isAsync: boolean;
  isExported: boolean;
  isMethod: boolean;
  className?: string;
}

export interface ScoredFunction extends ExtractedFunction {
  importance: number;
  reason: string;
  breakdown: {
    static: number;
    context: number;
    callGraph: number;
    ai?: number;
  };
}

/**
 * Analyse un projet pour identifier les fonctions importantes à tester
 */
export async function analyzeProject(
  projectPath: string
): Promise<ScoredFunction[]> {
  console.log("🔍 Scanning project...\n");

  // 1. Trouver tous les fichiers TypeScript/JavaScript
  const files = await glob(`${projectPath}/**/*.{ts,js}`, {
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.test.{ts,js}",
      "**/*.spec.{ts,js}",
    ],
    absolute: true,
  });

  console.log(`📂 Found ${files.length} files`);

  // 2. Extraire toutes les fonctions
  const allFunctions: ExtractedFunction[] = [];

  for (const file of files) {
    try {
      const code = await fs.readFile(file, "utf-8");
      const fileFunctions = extractFunctions(file, code);
      allFunctions.push(...fileFunctions);
    } catch (error) {
      console.error(`❌ Error parsing ${file}:`, error);
    }
  }

  console.log(`⚙️  Found ${allFunctions.length} exported functions`);

  // 3. Scorer chaque fonction
  const scoredFunctions: ScoredFunction[] = [];

  for (const func of allFunctions) {
    const staticScore = calculateImportanceScore(func);
    const contextScore = analyzeFileContext(func.filePath);
    const callGraphScore = analyzeCallGraph(func, allFunctions, files);

    const importance = Math.round(
      (staticScore + contextScore + callGraphScore) / 3
    );

    scoredFunctions.push({
      ...func,
      importance,
      reason: generateReason(func, importance),
      breakdown: {
        static: staticScore,
        context: contextScore,
        callGraph: callGraphScore,
      },
    });
  }

  // Trier par importance (décroissant)
  scoredFunctions.sort((a, b) => b.importance - a.importance);

  return scoredFunctions;
}

/**
 * Extrait les fonctions exportées d'un fichier TypeScript/JavaScript
 */
export function extractFunctions(
  filePath: string,
  code: string
): ExtractedFunction[] {
  const functions: ExtractedFunction[] = [];

  try {
    const sourceFile = ts.createSourceFile(
      filePath,
      code,
      ts.ScriptTarget.Latest,
      true
    );

    function visit(node: ts.Node, currentClass?: string) {
      // Fonction déclarée et exportée
      if (ts.isFunctionDeclaration(node) && node.name) {
        const isExported =
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ??
          false;

        if (isExported) {
          const lineStart =
            sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1;
          const lineEnd =
            sourceFile.getLineAndCharacterOfPosition(node.end).line + 1;

          functions.push({
            name: node.name.text,
            filePath,
            code: code.substring(node.pos, node.end).trim(),
            lineStart,
            lineEnd,
            parameters: node.parameters.map((p) => p.name.getText()),
            isAsync:
              node.modifiers?.some(
                (m) => m.kind === ts.SyntaxKind.AsyncKeyword
              ) ?? false,
            isExported: true,
            isMethod: false,
          });
        }
      }

      // Fonction fléchée exportée (export const func = () => {})
      if (ts.isVariableStatement(node)) {
        const isExported =
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ??
          false;

        if (isExported && node.declarationList.declarations.length > 0) {
          for (const declaration of node.declarationList.declarations) {
            if (
              ts.isVariableDeclaration(declaration) &&
              declaration.initializer &&
              (ts.isArrowFunction(declaration.initializer) ||
                ts.isFunctionExpression(declaration.initializer))
            ) {
              const name = declaration.name.getText();
              const lineStart =
                sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1;
              const lineEnd =
                sourceFile.getLineAndCharacterOfPosition(node.end).line + 1;

              functions.push({
                name,
                filePath,
                code: code.substring(node.pos, node.end).trim(),
                lineStart,
                lineEnd,
                parameters: declaration.initializer.parameters.map((p) =>
                  p.name.getText()
                ),
                isAsync: ts.isArrowFunction(declaration.initializer)
                  ? declaration.initializer.modifiers?.some(
                      (m) => m.kind === ts.SyntaxKind.AsyncKeyword
                    ) ?? false
                  : false,
                isExported: true,
                isMethod: false,
              });
            }
          }
        }
      }

      // Classe exportée avec ses méthodes
      if (ts.isClassDeclaration(node) && node.name) {
        const isExported =
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ??
          false;

        if (isExported) {
          const className = node.name.text;

          // Extraire les méthodes de la classe
          node.members.forEach((member) => {
            if (ts.isMethodDeclaration(member) && member.name) {
              const isPublic = !member.modifiers?.some(
                (m) =>
                  m.kind === ts.SyntaxKind.PrivateKeyword ||
                  m.kind === ts.SyntaxKind.ProtectedKeyword
              );

              if (isPublic) {
                const lineStart =
                  sourceFile.getLineAndCharacterOfPosition(member.pos).line + 1;
                const lineEnd =
                  sourceFile.getLineAndCharacterOfPosition(member.end).line + 1;

                functions.push({
                  name: member.name.getText(),
                  filePath,
                  code: code.substring(member.pos, member.end).trim(),
                  lineStart,
                  lineEnd,
                  parameters: member.parameters.map((p) => p.name.getText()),
                  isAsync:
                    member.modifiers?.some(
                      (m) => m.kind === ts.SyntaxKind.AsyncKeyword
                    ) ?? false,
                  isExported: true,
                  isMethod: true,
                  className,
                });
              }
            }
          });
        }
      }

      ts.forEachChild(node, (n) => visit(n, currentClass));
    }

    visit(sourceFile);
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
  }

  return functions;
}

/**
 * Calcule un score d'importance basé sur l'analyse statique du code
 */
export function calculateImportanceScore(func: ExtractedFunction): number {
  let score = 0;

  // Mots-clés critiques dans le nom de la fonction
  const criticalKeywords = [
    "payment",
    "pay",
    "charge",
    "billing",
    "invoice",
    "auth",
    "login",
    "authenticate",
    "password",
    "token",
    "verify",
    "validate",
    "sanitize",
    "security",
    "permission",
    "authorize",
    "encrypt",
    "decrypt",
    "hash",
    "sign",
    "crypto",
    "transfer",
    "transaction",
    "money",
    "credit",
    "debit",
    "create",
    "delete",
    "update",
    "remove", // CRUD
    "execute",
    "run",
    "process",
    "handle",
  ];

  const funcNameLower = func.name.toLowerCase();
  if (criticalKeywords.some((kw) => funcNameLower.includes(kw))) {
    score += 40;
  }

  // Complexité cyclomatique approximative (nombre de branches)
  const branchKeywords = [
    "if",
    "else",
    "switch",
    "case",
    "for",
    "while",
    "?",
    "&&",
    "||",
  ];
  const complexity = branchKeywords.reduce((count, keyword) => {
    const matches = func.code.match(new RegExp(`\\b${keyword}\\b`, "g"));
    return count + (matches ? matches.length : 0);
  }, 0);

  if (complexity > 10) score += 20;
  else if (complexity > 5) score += 10;

  // Nombre de paramètres
  if (func.parameters.length > 3) score += 10;

  // Fonction async (probablement appelle des APIs/DB)
  if (func.isAsync) score += 15;

  // Gestion d'erreurs
  if (
    func.code.includes("try") ||
    func.code.includes("throw") ||
    func.code.includes("catch")
  ) {
    score += 10;
  }

  // Appels à des APIs externes, DB, etc.
  const externalCallPatterns = [
    /fetch\(/,
    /axios\./,
    /prisma\./,
    /db\./,
    /\.query\(/,
    /\.exec\(/,
    /\.create\(/,
    /\.update\(/,
    /\.delete\(/,
    /\.findMany\(/,
    /\.findUnique\(/,
  ];

  if (externalCallPatterns.some((pattern) => pattern.test(func.code))) {
    score += 20;
  }

  return Math.min(score, 100);
}

/**
 * Analyse le contexte du fichier (chemin) pour ajuster le score
 */
export function analyzeFileContext(filePath: string): number {
  let score = 0;

  const normalizedPath = filePath.toLowerCase().replace(/\\/g, "/");

  // Chemins critiques
  const criticalPaths = [
    "/auth/",
    "/authentication/",
    "/payment/",
    "/billing/",
    "/checkout/",
    "/security/",
    "/crypto/",
    "/api/",
    "/routes/",
    "/controllers/",
    "/database/",
    "/db/",
    "/prisma/",
    "/validation/",
    "/validators/",
  ];

  if (criticalPaths.some((path) => normalizedPath.includes(path))) {
    score += 30;
  }

  // Chemins importants
  if (normalizedPath.includes("/src/")) score += 10;
  if (normalizedPath.includes("/core/")) score += 15;
  if (normalizedPath.includes("/services/")) score += 10;

  // Chemins moins importants
  if (normalizedPath.includes("/utils/")) score -= 10;
  if (normalizedPath.includes("/helpers/")) score -= 10;
  if (normalizedPath.includes("/types/")) score -= 20;

  return Math.max(score, 0);
}

/**
 * Analyse le graphe d'appels (combien de fois la fonction est appelée)
 */
export function analyzeCallGraph(
  func: ExtractedFunction,
  allFunctions: ExtractedFunction[],
  projectFiles: string[]
): number {
  let score = 0;

  // Compter les appels dans tous les fichiers du projet
  let callCount = 0;
  const funcCallPattern = new RegExp(`\\b${func.name}\\(`, "g");

  for (const file of projectFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const matches = content.match(funcCallPattern);
      if (matches) {
        callCount += matches.length;
      }
    } catch (error) {
      // Ignorer les erreurs de lecture
    }
  }

  // Retirer 1 pour exclure la définition elle-même
  callCount = Math.max(0, callCount - 1);

  if (callCount > 20) score += 25;
  else if (callCount > 10) score += 15;
  else if (callCount > 5) score += 10;
  else if (callCount > 2) score += 5;

  // Vérifier si appelée depuis des routes/controllers
  const routeFiles = projectFiles.filter((f) => {
    const lower = f.toLowerCase();
    return (
      lower.includes("/routes/") ||
      lower.includes("/controllers/") ||
      lower.includes("/api/")
    );
  });

  for (const routeFile of routeFiles) {
    try {
      const content = fs.readFileSync(routeFile, "utf-8");
      if (funcCallPattern.test(content)) {
        score += 20;
        break;
      }
    } catch (error) {
      // Ignorer
    }
  }

  return Math.min(score, 100);
}

/**
 * Génère une raison expliquant le score
 */
function generateReason(func: ExtractedFunction, importance: number): string {
  const reasons: string[] = [];

  const funcNameLower = func.name.toLowerCase();

  if (funcNameLower.includes("payment") || funcNameLower.includes("billing")) {
    reasons.push("Fonction critique de paiement");
  } else if (
    funcNameLower.includes("auth") ||
    funcNameLower.includes("login") ||
    funcNameLower.includes("password")
  ) {
    reasons.push("Fonction d'authentification/sécurité");
  } else if (
    funcNameLower.includes("validate") ||
    funcNameLower.includes("sanitize")
  ) {
    reasons.push("Fonction de validation/sécurité");
  }

  if (func.isAsync) {
    reasons.push("fonction asynchrone (probablement appelle DB/API)");
  }

  if (func.code.includes("prisma") || func.code.includes("db.")) {
    reasons.push("accès base de données");
  }

  if (func.code.includes("try") && func.code.includes("catch")) {
    reasons.push("gestion d'erreurs");
  }

  if (reasons.length === 0) {
    if (importance >= 70) {
      reasons.push("fonction importante détectée par analyse statique");
    } else if (importance >= 50) {
      reasons.push("fonction utile mais non critique");
    } else {
      reasons.push("fonction simple, faible priorité");
    }
  }

  return reasons.join(", ");
}

/**
 * Affine le scoring avec l'IA (optionnel)
 */
export async function scoreFunctionsWithAI(
  functions: ScoredFunction[],
  config: Config
): Promise<ScoredFunction[]> {
  try {
    console.log("🧠 Analyzing function importance with AI...");

    // Envoyer au backend pour analyse IA
    const response = await axios.post(
      `${config.server}/api/unit-tests/analyze`,
      {
        functions: functions.map((f) => ({
          name: f.name,
          filePath: f.filePath,
          code: f.code,
          parameters: f.parameters,
          isAsync: f.isAsync,
        })),
      },
      {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      }
    );

    const aiScores = response.data.scoredFunctions;

    // Fusionner les scores IA avec les scores statiques
    return functions.map((func) => {
      const aiResult = aiScores.find((s: any) => s.functionName === func.name);

      if (aiResult) {
        // 40% score statique + 60% score IA
        const combinedScore = Math.round(
          func.importance * 0.4 + aiResult.importance * 0.6
        );

        return {
          ...func,
          importance: combinedScore,
          reason: aiResult.reason || func.reason,
          breakdown: {
            ...func.breakdown,
            ai: aiResult.importance,
          },
        };
      }

      return func;
    });
  } catch (error) {
    console.warn(
      "⚠️  AI scoring failed, using static analysis only:",
      (error as Error).message
    );
    return functions;
  }
}
