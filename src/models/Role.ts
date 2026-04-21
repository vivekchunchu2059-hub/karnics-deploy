export interface Role {
  id: number;
  role: string;
  description: string;
  users: number;
  permissions: string[];
  status: "ACTIVE" | "INACTIVE";
}