import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Cookie lifetime matches the refresh token lifetime (default 3 min for dev, 2h for prod)
// The cookie must outlive the JWT so that refresh calls can still be made.
const REFRESH_COOKIE_MAX_AGE_SECONDS =
  (parseInt(process.env.JWT_REFRESH_TOKEN_LIFETIME_MINUTES || "120") * 60);
const ACCESS_COOKIE_MAX_AGE_SECONDS =
  (parseInt(process.env.JWT_ACCESS_TOKEN_LIFETIME_MINUTES || "20") * 60);

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
    message.includes("token has expired") ||
    message.includes("no active account")
  );
}

// In-process deduplication: if multiple requests come in simultaneously with the
// same refresh token, only one actual refresh call is made; others wait for that result.
// Note: this only helps within a single Node.js process instance. With BLACKLIST_AFTER_ROTATION=False
// on the backend, multiple simultaneous refresh calls with the same token are all safe.
const activeRefreshes = new Map<string, Promise<RefreshedTokens | null>>();

async function refreshAccessToken(refreshToken: string): Promise<RefreshedTokens | null> {
  const existingPromise = activeRefreshes.get(refreshToken);
  if (existingPromise) {
    return existingPromise;
  }

  const refreshPromise = (async () => {
    try {
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
        refreshToken: refreshPayload?.refresh || refreshToken,
      };
    } catch {
      return null;
    } finally {
      activeRefreshes.delete(refreshToken);
    }
  })();

  activeRefreshes.set(refreshToken, refreshPromise);
  return refreshPromise;
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
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });

  if (options.role) {
    response.cookies.set("userRole", options.role, {
      ...baseCookieOptions,
      maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
    });
  }

  if (options.refreshToken) {
    response.cookies.set("refreshToken", options.refreshToken, {
      ...baseCookieOptions,
      maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
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

function buildSessionExpiredResponse(): NextResponse {
  const res = NextResponse.json(
    { error: "Session expired. Please login again." },
    { status: 401 }
  );
  clearAuthCookies(res);
  return res;
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
  let authToken = request.cookies.get("authToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // If the access token cookie has expired (or is missing) but we still have
  // a refresh token, attempt a proactive refresh before even calling the backend.
  if (!authToken && refreshToken) {
    const proactiveRefresh = await refreshAccessToken(refreshToken);
    if (proactiveRefresh?.accessToken) {
      authToken = proactiveRefresh.accessToken;
      // We'll apply these cookies to the final response below.
    } else {
      // Refresh token is also expired or invalid — force login.
      return buildSessionExpiredResponse();
    }
  }

  if (!authToken) {
    // No access token and no refresh token — user is not logged in.
    return buildSessionExpiredResponse();
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

  // Access token was rejected — try to refresh.
  if (backendResponse.status === 401 && refreshToken) {
    refreshedTokens = await refreshAccessToken(refreshToken);

    if (refreshedTokens?.accessToken) {
      backendResponse = await callBackend(refreshedTokens.accessToken);
    }

    // If still 401 after refresh, session is truly expired.
    if (backendResponse.status === 401) {
      return buildSessionExpiredResponse();
    }
  } else if (backendResponse.status === 401) {
    // 401 and no refresh token — force login.
    return buildSessionExpiredResponse();
  }

  const payload = await readJsonSafe(backendResponse);

  // Catch token errors that don't always come back as 401.
  if (!backendResponse.ok && isTokenError(payload)) {
    return buildSessionExpiredResponse();
  }

  const resolvedSuccessStatus = successStatus ?? backendResponse.status;
  const isNoContentStatus = [204, 205, 304].includes(resolvedSuccessStatus);

  const response = backendResponse.ok
    ? isNoContentStatus
      ? new NextResponse(null, { status: resolvedSuccessStatus })
      : NextResponse.json(payload, {
          status: resolvedSuccessStatus,
        })
    : NextResponse.json(
        {
          error:
            payload?.detail || payload?.error || payload?.raw || failureMessage,
        },
        { status: backendResponse.status }
      );

  // If tokens were refreshed (either proactively or reactively), update cookies
  // and expose the new access token so the client can sync localStorage.
  if (refreshedTokens?.accessToken) {
    applyAuthCookies(response, {
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken,
    });
    // Allow the browser to read this header via SessionSyncProvider.
    response.headers.set("X-Auth-Token", refreshedTokens.accessToken);
    response.headers.set("Access-Control-Expose-Headers", "X-Auth-Token");
  }

  return response;
}
