"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  accountSettingsSchema,
  notificationPrefsSchema,
  type AccountSettingsFormData,
  type NotificationPrefsFormData,
} from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function SettingsPage() {
  return (
    <div className="space-y-[var(--space-8)]">
      <h1
        className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-semibold text-[var(--color-text-base)]"
      >
        Account settings
      </h1>

      <AccountSection />
      <Separator />
      <NotificationsSection />
    </div>
  );
}

function AccountSection() {
  const form = useForm<AccountSettingsFormData, unknown, AccountSettingsFormData>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: { name: "", email: "" },
  });

  function onSubmit(_data: AccountSettingsFormData) {
    // tRPC auth.updateProfile mutation — wired by BE agent
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your account information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[var(--space-4)]">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function NotificationsSection() {
  const form = useForm<NotificationPrefsFormData, unknown, NotificationPrefsFormData>({
    resolver: zodResolver(notificationPrefsSchema),
    defaultValues: {
      failedBackups: true,
      systemUpdates: true,
      weeklyDigest: false,
    },
  });

  function onSubmit(_data: NotificationPrefsFormData) {
    // tRPC auth.updateNotificationPrefs mutation — wired by BE agent
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Receive emails when apps go offline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[var(--space-5)]">
            <fieldset>
              <legend className="sr-only">Notification preferences</legend>
              <div className="space-y-[var(--space-4)]">
                <FormField
                  control={form.control}
                  name="failedBackups"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Failed backups</FormLabel>
                        <FormDescription>
                          Email me about failed backups
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="systemUpdates"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>System updates</FormLabel>
                        <FormDescription>
                          Email me about system updates
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weeklyDigest"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Weekly digest</FormLabel>
                        <FormDescription>
                          Send weekly digest
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
