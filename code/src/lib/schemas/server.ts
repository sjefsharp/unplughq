import { z } from "zod";

export const authMethodSchema = z.enum(["password", "ssh-key"]);
export type AuthMethod = z.infer<typeof authMethodSchema>;

export const serverCredentialsSchema = z.object({
  ip: z
    .string()
    .min(1, "IP address is required")
    .regex(
      /^(\d{1,3}\.){3}\d{1,3}$/,
      "Enter a valid IPv4 address",
    )
    .refine(
      (ip) => ip.split(".").every((octet) => Number(octet) >= 0 && Number(octet) <= 255),
      "Each octet must be between 0 and 255",
    ),
  sshPort: z.coerce.number().int().min(1).max(65535),
  authMethod: authMethodSchema,
  sshUser: z.string().min(1, "SSH username is required").max(64),
  password: z.string().optional(),
  privateKey: z.string().optional(),
});
export type ServerCredentialsFormData = z.infer<typeof serverCredentialsSchema>;
