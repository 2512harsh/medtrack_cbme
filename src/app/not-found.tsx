import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription className="text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Please check the URL or navigate back to the dashboard.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-input bg-background rounded-md hover:bg-accent transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Home className="h-4 w-4" />
                Sign In
              </Link>
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
