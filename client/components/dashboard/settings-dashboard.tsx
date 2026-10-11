"use client";

import React from "react";
import { LogOut, User, Palette } from "lucide-react";
import { GithubIcon } from "@/components/icons/github-icon";
import { DashboardHeader } from "./dashboard-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";

export function SettingsDashboard() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const initial = (user?.displayName || user?.githubUsername || "U").slice(0, 1).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Settings" showSearch={false} showSync={false} />

      <main className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Profile Card */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <User className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Profile</span>
            </div>
            <CardTitle className="text-xl">User Account</CardTitle>
            <CardDescription>
              Your personal profile connected via GitHub OAuth.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="size-16 rounded-2xl border border-border">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName} />
                <AvatarFallback className="text-lg font-bold">{initial}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {user?.displayName || "Developer"}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  @{user?.githubUsername}
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">
                  <span>ID: {user?.id}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Integration Card */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <GithubIcon className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Integration</span>
            </div>
            <CardTitle className="text-xl">GitHub Authorization</CardTitle>
            <CardDescription>
              Connected OAuth application with repository access permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
                  <GithubIcon className="size-5" />
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">GitHub Account</div>
                  <div className="text-xs text-muted-foreground">Connected with read:user, repo scopes</div>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Connected
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Palette className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Appearance</span>
            </div>
            <CardTitle className="text-xl">Preferences</CardTitle>
            <CardDescription>Customize your workspace theme and display settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/60">
              <div>
                <div className="font-medium text-sm text-foreground">Color Theme</div>
                <div className="text-xs text-muted-foreground">Switch between dark and light mode</div>
              </div>
              <ModeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Danger / Logout Zone */}
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Session</CardTitle>
            <CardDescription>Sign out of your active session on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="gap-2"
            >
              <LogOut className="size-4" />
              <span>{logout.isPending ? "Signing out..." : "Log out"}</span>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
