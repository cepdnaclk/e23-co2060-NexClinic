type RouterLike = {
  push?: (href: string) => void;
  replace?: (href: string) => void;
};

let isHandlingDoctorSessionExpiry = false;

export function clearDoctorClientSession() {
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

export function handleDoctorSessionExpired(router?: RouterLike) {
  if (isHandlingDoctorSessionExpiry) {
    return;
  }

  isHandlingDoctorSessionExpiry = true;
  clearDoctorClientSession();

  window.alert("Your session has expired. Please login again.");

  window.setTimeout(() => {
    isHandlingDoctorSessionExpiry = false;
  }, 1000);

  if (router?.replace) {
    router.replace("/doctor/login");
    return;
  }

  if (router?.push) {
    router.push("/doctor/login");
    return;
  }

  window.location.href = "/doctor/login";
}
