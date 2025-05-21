import { signIn, getProviders } from "next-auth/react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { Github, Mail } from "lucide-react";

type Provider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

type SignInProps = {
  providers: Record<string, Provider>;
};

export default function SignIn({ providers }: SignInProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="bg-card border border-border rounded-lg p-8 w-full max-w-md">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold">
              <span>SEO</span>
              <span className="text-primary">AI</span>
            </h1>
          </Link>
          <h2 className="text-xl font-semibold">Sign in to your account</h2>
          <p className="text-muted-foreground text-center">
            Connect with GitHub to access repository integrations for SEO automation
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {Object.values(providers).map((provider) => (
            <button
              key={provider.id}
              onClick={() => signIn(provider.id, { callbackUrl: "/auth/repository-selection" })}
              className={`flex items-center justify-center py-3 px-4 rounded-md w-full font-medium ${
                provider.id === "github"
                  ? "bg-[#24292F] text-white"
                  : "bg-[#4285F4] text-white"
              }`}
            >
              {provider.id === "github" ? (
                <Github className="mr-2 h-5 w-5" />
              ) : (
                <Mail className="mr-2 h-5 w-5" />
              )}
              Sign in with {provider.name}
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}; 