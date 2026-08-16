export type UserRole = "User" | "Superuser" | "Admin";

export type UserRecord = {
  [key: string]: unknown;
  id?: number;
  uuid?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  role?: string;
};

export type UserEditorForm = {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole | "";
};

export type AdminUserContext =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      user: UserRecord;
    };

export const USER_ROLES: UserRole[] = ["User", "Superuser", "Admin"];

const toUserRole = (value: unknown): UserRole | "" => {
  const role = String(value || "");
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : "";
};

export function createUserEditorForm(
  initial: Partial<UserRecord & UserEditorForm> = {},
): UserEditorForm {
  return {
    firstname: String(initial.firstname || ""),
    lastname: String(initial.lastname || ""),
    phone: String(initial.phone || ""),
    email: String(initial.email || ""),
    password: "",
    role: toUserRole(initial.role),
  };
}
