/**
 * Script pour créer l'utilisateur temporaire temp-user-001
 * Nécessaire pour le développement avant l'implémentation de l'authentification
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTempUser() {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { id: "temp-user-001" },
    });

    if (existingUser) {
      console.log("ℹ️  L'utilisateur temp-user-001 existe déjà");
      console.log("   Email:", existingUser.email);
      console.log("   Créé le:", existingUser.createdAt);
      return;
    }

    // Créer l'utilisateur temporaire
    const user = await prisma.user.create({
      data: {
        id: "temp-user-001",
        email: "temp@leynai.com",
        passwordHash: "temp-password-hash-not-used", // Mot de passe temporaire (pas utilisé en dev)
      },
    });

    console.log("✅ Utilisateur temp-user-001 créé avec succès !");
    console.log("   ID:", user.id);
    console.log("   Email:", user.email);
    console.log("   Créé le:", user.createdAt);
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la création de l'utilisateur:",
      error.message
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTempUser();
