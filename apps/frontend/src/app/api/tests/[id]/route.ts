/**
 * API Route: /api/tests/:id
 *
 * Proxy vers le backend pour récupérer un test spécifique
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/**
 * GET /api/tests/:id
 * Récupérer un test spécifique avec ses résultats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Appeler le backend
    const response = await fetch(`${BACKEND_URL}/api/tests/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error fetching test:", error);
    return NextResponse.json(
      { error: "Failed to fetch test", message: error.message },
      { status: 500 }
    );
  }
}
