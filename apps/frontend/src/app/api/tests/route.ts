/**
 * API Route: /api/tests
 *
 * Proxy vers le backend pour gérer les tests
 * - GET: Liste des tests
 * - POST: Créer un nouveau test
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/**
 * GET /api/tests
 * Liste des tests pour un utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Appeler le backend
    const response = await fetch(`${BACKEND_URL}/api/tests?userId=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch tests", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tests
 * Créer un nouveau test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, prompt, userId } = body;

    // Validation basique
    if (!url || !prompt || !userId) {
      return NextResponse.json(
        { error: "url, prompt, and userId are required" },
        { status: 400 }
      );
    }

    // Appeler le backend
    const response = await fetch(`${BACKEND_URL}/api/tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, prompt, userId }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error creating test:", error);
    return NextResponse.json(
      { error: "Failed to create test", message: error.message },
      { status: 500 }
    );
  }
}
