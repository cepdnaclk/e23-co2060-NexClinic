type RouterLike = {
  push?: (href: string) => void;
  replace?: (href: string) => void;
};

let isHandlingPatientSessionExpiry = false;

export function clearPatientClientSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("user");
  localStorage.removeItem("isAuthenticated");

  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
}

export function handlePatientSessionExpired(router?: RouterLike) {
  if (isHandlingPatientSessionExpiry) {
    return;
  }

  isHandlingPatientSessionExpiry = true;
  clearPatientClientSession();

  window.alert("Your session has expired. Please login again.");

  window.setTimeout(() => {
    isHandlingPatientSessionExpiry = false;
  }, 1000);

  if (router?.replace) {
    router.replace("/login");
    return;
  }

  if (router?.push) {
    router.push("/login");
    return;
  }

  window.location.href = "/login";
}
