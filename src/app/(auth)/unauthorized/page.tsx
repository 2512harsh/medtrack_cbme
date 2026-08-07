import Link from "next/link";
import { Home, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-muted-foreground">
              You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Your current role may not have access to this resource.</p>
              <p className="text-xs text-muted-foreground mt-1">Only authorized roles can view this page.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Link href="/dashboard" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button className="flex-1">
                <Link href="/login" className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  Sign In Again
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="mt-6 text-sm text-muted-foreground">
          MedTrack CBME &copy; 2024
        </p>
      </div>
    </div>
  );
}