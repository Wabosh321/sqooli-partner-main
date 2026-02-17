import usersData from './data/users.json';

export interface JsonAuthUser {
  id: string;
  email: string;
  role: string;
  partner_type: string;
  is_first_login: boolean;
  permissions: string[];
  access_level: number;
  commission_rate: number;
}

export interface JsonAuthResult {
  success: boolean;
  user?: JsonAuthUser;
  message?: string;
}

/**
 * JSON-based authentication handler
 * Reads from users.json and validates credentials
 */
export async function handleJsonSignIn(
  email: string,
  password: string
): Promise<JsonAuthResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = usersData.users.find(
      (u: any) => u.email.toLowerCase() === normalizedEmail
    );

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Verify password
    if (user.password !== password) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Return authenticated user (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      success: true,
      user: userWithoutPassword as JsonAuthUser,
    };
  } catch (error) {
    console.error('JSON auth error:', error);
    return {
      success: false,
      message: 'Authentication failed. Please try again.',
    };
  }
}

/**
 * Store authenticated user in sessionStorage
 */
export function storeAuthUser(user: JsonAuthUser): void {
  sessionStorage.setItem('auth_user', JSON.stringify(user));
}

/**
 * Retrieve authenticated user from sessionStorage
 */
export function getStoredAuthUser(): JsonAuthUser | null {
  try {
    const stored = sessionStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error retrieving auth user:', error);
    return null;
  }
}

/**
 * Clear authentication data
 */
export function clearAuthUser(): void {
  sessionStorage.removeItem('auth_user');
}
