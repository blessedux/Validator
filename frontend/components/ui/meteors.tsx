import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [meteorStyles, setMeteorStyles] = useState<Array<{
    left: string;
    animationDelay: string;
    animationDuration: string;
  }>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Generate random styles only on client side to prevent hydration mismatch
    const styles = new Array(number || 20).fill(true).map(() => ({
      left: Math.floor(Math.random() * (400 - -400) + -400) + "px",
      animationDelay: Math.random() * (3 - 0.5) + 0.5 + "s",
      animationDuration: Math.floor(Math.random() * (15 - 8) + 8) + "s",
    }));
    setMeteorStyles(styles);
  }, [number]);

  const meteors = new Array(number || 20).fill(true);
  const isDark = mounted && theme === "dark";
  const meteorColor = isDark ? "#64748b" : "#1a1a1a";
  const meteorShadow = isDark ? "#ffffff10" : "#00000010";
  
  return (
    <>
      {meteors.map((el, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] rotate-[215deg]",
            className
          )}
          style={{
            top: 0,
            left: meteorStyles[idx]?.left || "0px",
            animationDelay: meteorStyles[idx]?.animationDelay || "0s",
            animationDuration: meteorStyles[idx]?.animationDuration || "8s",
            backgroundColor: isDark ? "#64748b" : "#1a1a1a",
            boxShadow: `0 0 0 1px ${meteorShadow}`,
          }}
        >
          <div
            className="absolute top-1/2 transform -translate-y-[50%] w-[100px] h-[1px]"
            style={{
              background: `linear-gradient(to right, ${meteorColor}, transparent)`,
            }}
          />
        </span>
      ))}
    </>
  );
}; 