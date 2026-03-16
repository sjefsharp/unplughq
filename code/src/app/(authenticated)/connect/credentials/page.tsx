"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  serverCredentialsSchema,
  type ServerCredentialsFormData,
} from "@/lib/schemas/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function CredentialsPage() {
  const router = useRouter();

  const form = useForm<ServerCredentialsFormData, unknown, ServerCredentialsFormData>({
    resolver: zodResolver(serverCredentialsSchema),
    defaultValues: {
      ip: "",
      sshPort: 22,
      authMethod: "ssh-key",
      sshUser: "root",
      password: "",
      privateKey: "",
    },
  });

  const authMethod = form.watch("authMethod");

  function onSubmit(_data: ServerCredentialsFormData) {
    // TODO: tRPC server.testConnection mutation — wired by BE agent
    router.push("/connect/validation");
  }

  return (
    <>
      <h1
        className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-semibold text-[var(--color-text-base)]"
      >
        Connect your server
      </h1>
      <p className="mt-[var(--space-2)] mb-[var(--space-6)] text-[var(--color-text-subtle)]">
        Enter your IP address and SSH key to begin provisioning.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-[var(--space-5)]"
        >
          <FormField
            control={form.control}
            name="ip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IPv4 or IPv6 Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="192.168.1.100"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sshPort"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SSH Port</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={65535}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <fieldset>
            <FormField
            control={form.control}
            name="authMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel asChild>
                  <legend>Authentication Method</legend>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-[var(--space-6)]"
                  >
                    <div className="flex items-center space-x-[var(--space-2)]">
                      <RadioGroupItem value="password" id="auth-password" />
                      <Label htmlFor="auth-password">Password</Label>
                    </div>
                    <div className="flex items-center space-x-[var(--space-2)]">
                      <RadioGroupItem value="ssh-key" id="auth-ssh-key" />
                      <Label htmlFor="auth-ssh-key">
                        SSH Key (Recommended)
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </fieldset>

          <FormField
            control={form.control}
            name="sshUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SSH Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="root"
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {authMethod === "password" && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {authMethod === "ssh-key" && (
            <FormField
              control={form.control}
              name="privateKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Private Key</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Testing connection…"
              : "Test connection"}
          </Button>
        </form>
      </Form>
    </>
  );
}
