import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AuthTest from "../../components/AuthTest";

export default function DashboardPage() {
  return (
    <SignedIn>
      <div>
        <h1>Dashboard</h1>
        <AuthTest />
      </div>
    </SignedIn>
  );
}
