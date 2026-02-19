import React from "react";
import { Shield, Lock, Server, Clock } from "lucide-react";

const TrustSection = () => (
  <section className="py-10 border-t border-border bg-muted/30">
    <div className="container max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          { icon: Lock, title: "SSL Secured", desc: "256-bit encryption on all transfers" },
          { icon: Server, title: "Secure Servers", desc: "Files processed in secure data centers" },
          { icon: Shield, title: "Access Control", desc: "Only you can access your files" },
          { icon: Clock, title: "Auto Deleted", desc: "All files deleted after 24 hours" },
        ].map(item => (
          <div key={item.title} className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="font-semibold text-sm">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustSection;
