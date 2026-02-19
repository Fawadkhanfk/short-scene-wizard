import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, LayoutDashboard, LogOut, Clock } from "lucide-react";
import { format } from "date-fns";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Conversion {
  id: string;
  input_filename: string;
  input_format: string | null;
  output_format: string;
  status: string;
  created_at: string;
  output_path: string | null;
  file_size: number | null;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    supabase
      .from("conversions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setConversions((data as Conversion[]) || []);
        setLoading(false);
      });
  }, [user, navigate]);

  const handleDownload = (conv: Conversion) => {
    if (!conv.output_path) return;
    const { data } = supabase.storage.from("video-outputs").getPublicUrl(conv.output_path);
    const a = document.createElement("a");
    a.href = data.publicUrl;
    a.download = conv.input_filename.replace(/\.[^.]+$/, "") + "." + conv.output_format;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild size="sm">
              <Link to="/">Convert More</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut} className="text-destructive gap-1.5">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Conversion History</h2>
            <span className="ml-auto text-xs text-muted-foreground">{conversions.length} conversions</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading...</div>
          ) : conversions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No conversions yet</p>
              <Button className="gradient-primary border-0 text-white" asChild>
                <Link to="/">Start Converting</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversions.map(conv => (
                <div key={conv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conv.input_filename}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {conv.input_format?.toUpperCase() || "?"} → {conv.output_format.toUpperCase()} ·{" "}
                      {format(new Date(conv.created_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
                    STATUS_COLORS[conv.status] || "bg-muted text-muted-foreground"
                  )}>
                    {STATUS_LABELS[conv.status] || conv.status}
                  </span>
                  {conv.status === "ready" && conv.output_path && (
                    <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => handleDownload(conv)}>
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
