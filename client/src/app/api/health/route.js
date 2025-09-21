import { NextResponse } from "next/server";

export async function GET() {
  try {
    // You can add more comprehensive health checks here
    // Check database connection, external services, etc.

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
      },
      { status: 503 }
    );
  }
}

export async function HEAD() {
  // Simple health check for HEAD requests
  return new NextResponse(null, { status: 200 });
}
