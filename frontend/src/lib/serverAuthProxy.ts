import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

type ProxyWithRefreshOptions = {
  request: NextRequest;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: BodyInit | null;
  contentType?: string | null;
  failureMessage: string;
  successStatus?: number;
};

type RefreshedTokens = {
  accessToken: string;
  refreshToken?: string;
};

async function readJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    try {
      const txt = await response.text();
      return { raw: txt };
    } catch {
      return null;
    }
  }
}

function isTokenError(payload: any): boolean {
  const message = String(payload?.detail || payload?.error || "").toLowerCase();
  return (
    message.includes("token not valid") ||
    message.includes("given token not valid") ||
    message.includes("token is invalid") ||
    message.includes("token is expired") ||
    message.includes("token has expired")
  );
}

async function refreshAccessToken(request: NextRequest): Promise<RefreshedTokens | null> {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return null;
  }

  const refreshResponse = await fetch(`${BACKEND_URL}/api/users/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
    cache: "no-store",
  });

  if (!refreshResponse.ok) {
    return null;
  }

  const refreshPayload = await readJsonSafe(refreshResponse);
  const accessToken = refreshPayload?.access;

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: refreshPayload?.refresh,
  };
}

export function applyAuthCookies(
  response: NextResponse,
  options: {
    accessToken: string;
    role?: string;
    refreshToken?: string;
  }
) {
  response.cookies.set("authToken", options.accessToken, {
    ...baseCookieOptions,
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });

  if (options.role) {
    response.cookies.set("userRole", options.role, {
      ...baseCookieOptions,
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });
  }

  if (options.refreshToken) {
    response.cookies.set("refreshToken", options.refreshToken, {
      ...baseCookieOptions,
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("authToken", "", {
    ...baseCookieOptions,
    expires: new Date(0),
  });

  response.cookies.set("userRole", "", {
    ...baseCookieOptions,
    expires: new Date(0),
  });

  response.cookies.set("refreshToken", "", {
    ...baseCookieOptions,
    expires: new Date(0),
  });
}

export async function proxyBackendWithRefresh({
  request,
  endpoint,
  method,
  body,
  contentType,
  failureMessage,
  successStatus,
}: ProxyWithRefreshOptions): Promise<NextResponse> {
  const authToken = request.cookies.get("authToken")?.value;

  if (!authToken) {
    const unauthorizedResponse = NextResponse.json(
      { error: "Session expired. Please login again." },
      { status: 401 }
    );
    clearAuthCookies(unauthorizedResponse);
    return unauthorizedResponse;
  }

  const callBackend = (token: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    return fetch(endpoint, {
      method,
      headers,
      body: body ?? undefined,
      cache: "no-store",
    });
  };

  let backendResponse = await callBackend(authToken);
  let refreshedTokens: RefreshedTokens | null = null;

  if (backendResponse.status === 401) {
    refreshedTokens = await refreshAccessToken(request);

    if (refreshedTokens?.accessToken) {
      backendResponse = await callBackend(refreshedTokens.accessToken);
    }

    if (backendResponse.status === 401) {
      const unauthorizedResponse = NextResponse.json(
        { error: "Session expired. Please login again." },
        { status: 401 }
      );
      clearAuthCookies(unauthorizedResponse);
      return unauthorizedResponse;
    }
  }

  const payload = await readJsonSafe(backendResponse);

  if (!backendResponse.ok && isTokenError(payload)) {
    const unauthorizedResponse = NextResponse.json(
      { error: "Session expired. Please login again." },
      { status: 401 }
    );
    clearAuthCookies(unauthorizedResponse);
    return unauthorizedResponse;
  }

  const response = backendResponse.ok
    ? NextResponse.json(payload, {
        status: successStatus ?? backendResponse.status,
      })
    : NextResponse.json(
        {
          error:
            backendResponse.status === 401
              ? "Session expired. Please login again."
              : payload?.detail || payload?.error || payload?.raw || failureMessage,
        },
        { status: backendResponse.status }
      );

  if (backendResponse.status === 401) {
    clearAuthCookies(response);
  }

  if (refreshedTokens?.accessToken) {
    applyAuthCookies(response, {
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken,
    });
  }

  return response;
}
