import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Video } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else setSent(true);
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { setDone(true); toast.success("Password updated!"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gradient">VideoConvert Pro</span>
          </Link>
          <h1 className="text-2xl font-bold">{isRecovery ? "Set New Password" : "Reset Password"}</h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {done ? (
            <div className="text-center">
              <p className="text-success font-semibold mb-4">✓ Password updated successfully!</p>
              <Button asChild className="gradient-primary border-0 text-white">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          ) : isRecovery ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary border-0 text-white h-11" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : sent ? (
            <div className="text-center">
              <p className="text-success font-semibold mb-2">✓ Email sent!</p>
              <p className="text-sm text-muted-foreground">Check your inbox for the reset link.</p>
            </div>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <Label>Email address</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary border-0 text-white h-11" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-5">
            <Link to="/login" className="text-primary hover:underline">← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
