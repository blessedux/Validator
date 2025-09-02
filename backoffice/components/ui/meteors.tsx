import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [meteorStyles, setMeteorStyles] = useState<Array<{
    left: string;
    animationDelay: string;
    animationDuration: string;
  }>>([]);

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
  
  return (
    <>
      {meteors.map((el, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[100px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{
            top: 0,
            left: meteorStyles[idx]?.left || "0px",
            animationDelay: meteorStyles[idx]?.animationDelay || "0s",
            animationDuration: meteorStyles[idx]?.animationDuration || "8s",
          }}
        ></span>
      ))}
    </>
  );
}; 