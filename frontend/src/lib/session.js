import { API_URL } from "@/lib/api";

export const SESSION_KEY = "loggedInUser";

export function getStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    const rawUser = localStorage.getItem(SESSION_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function storeLoggedInUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearLoggedInUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function routeForRole(role) {
  return role === "Manager" ? "/dashboard/manager" : "/dashboard/employee";
}

export async function validateStoredUser({ router, expectedRole } = {}) {
  const storedUser = getStoredUser();

  if (!storedUser?.id) {
    router?.replace("/login");
    return null;
  }

  try {
    const response = await fetch(API_URL + "/api/users/" + storedUser.id, {
      cache: "no-store",
    });

    if (!response.ok) {
      clearLoggedInUser();
      router?.replace("/login");
      return null;
    }

    const freshUser = await response.json();
    const roleMismatch = expectedRole && freshUser.role !== expectedRole;
    const employeeNotApproved =
      freshUser.role === "Employee" && freshUser.status !== "approved";

    if (roleMismatch || employeeNotApproved) {
      clearLoggedInUser();
      router?.replace("/login");
      return null;
    }

    storeLoggedInUser(freshUser);
    return freshUser;
  } catch (error) {
    console.error("Session validation failed:", error);
    clearLoggedInUser();
    router?.replace("/login");
    return null;
  }
}
