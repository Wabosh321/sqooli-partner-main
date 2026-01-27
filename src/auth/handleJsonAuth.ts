import usersData from "./data/users.json";
import createdUsersData from "./data/created_users.json";

export interface JsonUser {
  id: string;
  email: string;
  password: string;
  role: string;
  partner_type: string;
  access_level: number;
  permissions: Array<{
    category: string;
    level: string;
  }>;
  is_first_login: boolean;
  partner_id: string;
  parent_user_id?: string;
}

export interface SignInResult {
  success: boolean;
  user?: JsonUser;
  message?: string;
}

/**
 * JSON-based sign-in function
 * Authenticates against users.json data and stores user in sessionStorage
 */
export async function handleJsonSignIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  try {
    // Find user in main users.json
    let user = usersData.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    // If not found in main users, check created_users
    if (!user) {
      const createdUser = (createdUsersData.created_users as any[]).find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (createdUser) {
        // Map created_user to JsonUser format
        user = {
          id: createdUser.id,
          email: createdUser.email,
          password: createdUser.password || "Password@123", // Default password for created users
          role: createdUser.role,
          partner_type: createdUser.partner_type,
          access_level: createdUser.access_level,
          permissions: createdUser.permissions || [],
          is_first_login: false,
          partner_id: createdUser.partner_id || createdUser.parent_user_id,
          parent_user_id: createdUser.parent_user_id,
        } as JsonUser;
      }
    }

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Verify password
    if (user.password !== password) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Store user in sessionStorage
    sessionStorage.setItem("auth_user", JSON.stringify(user));
    sessionStorage.setItem("auth_token", `token_${user.id}_${Date.now()}`);

    console.log("✅ JSON Sign-in successful:", {
      userId: user.id,
      email: user.email,
      role: user.role,
      parentUserId: (user as any).parent_user_id,
    });

    return {
      success: true,
      user,
      message: "Sign in successful",
    };
  } catch (error) {
    console.error("JSON Sign-in error:", error);
    return {
      success: false,
      message: "An error occurred during sign in",
    };
  }
}

/**
 * Get the current authenticated user from sessionStorage
 */
export function getJsonAuthUser(): JsonUser | null {
  try {
    const stored = sessionStorage.getItem("auth_user");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error parsing auth user:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isJsonAuthenticated(): boolean {
  return getJsonAuthUser() !== null;
}

/**
 * Logout - remove user from sessionStorage
 */
export function handleJsonLogout(): void {
  sessionStorage.removeItem("auth_user");
  sessionStorage.removeItem("auth_token");
  console.log("✅ JSON Logout successful");
}
