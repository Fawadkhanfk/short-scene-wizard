import React from "react";
import { Link } from "react-router-dom";
import { CONVERTER_GRID_FORMATS } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

const ConverterGrid = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-bold text-center mb-2">All Video Converters</h2>
        <p className="text-muted-foreground text-center text-sm mb-8">
          Click any format to convert to or from it
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {CONVERTER_GRID_FORMATS.map(fmt => (
            <Link
              key={fmt}
              to={`/${fmt.toLowerCase()}-converter`}
              className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary hover:bg-accent transition-all duration-150"
            >
              <span className="font-mono font-bold text-sm text-primary group-hover:text-primary">
                {fmt}
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-accent-foreground flex items-center gap-0.5">
                Convert <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConverterGrid;
