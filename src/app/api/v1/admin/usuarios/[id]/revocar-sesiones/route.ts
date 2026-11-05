import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { revokeUserSessions } from "@/lib/services/auth.service";

type Context = { params: Promise<{ id: string }> };

/** Revoca todas las sesiones/tokens del usuario (web y mobile). */
export async function POST(_request: NextRequest, { params }: Context) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;

  try {
    const data = await revokeUserSessions(id);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
