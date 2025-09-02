"use client";

import * as React from "react";
import {
  type HTMLMotionProps,
  motion,
  type SpringOptions,
  type Transition,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Meteors } from "./meteors";

type StarLayerProps = HTMLMotionProps<"div"> & {
  count: number;
  size: number;
  transition: Transition;
  starColor: string;
};

function generateStars(count: number, starColor: string) {
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;
    shadows.push(`${x}px ${y}px ${starColor}`);
  }
  return shadows.join(", ");
}

function StarLayer({
  count = 1000,
  size = 1,
  transition = { repeat: Infinity, duration: 50, ease: "linear" },
  starColor = "#fff",
  className,
  ...props
}: StarLayerProps) {
  const [boxShadow, setBoxShadow] = React.useState<string>("");

  React.useEffect(() => {
    setBoxShadow(generateStars(count, starColor));
  }, [count, starColor]);

  return (
    <motion.div
      data-slot="star-layer"
      animate={{ y: [0, -2000] }}
      transition={transition}
      className={cn("absolute top-0 left-0 w-full h-[2000px]", className)}
      {...props}
    >
      <div
        className="absolute bg-transparent rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: boxShadow,
        }}
      />
      <div
        className="absolute bg-transparent rounded-full top-[2000px]"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: boxShadow,
        }}
      />
    </motion.div>
  );
}

type StarsBackgroundProps = React.ComponentProps<"div"> & {
  factor?: number;
  speed?: number;
  transition?: SpringOptions;
  starColor?: string;
};

export function StarsBackground({
  children,
  className,
  factor = 0.15,
  speed = 50,
  transition = { stiffness: 30, damping: 15 },
  starColor,
  ...props
}: StarsBackgroundProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const offsetX = useMotionValue(1);
  const offsetY = useMotionValue(1);

  const springX = useSpring(offsetX, transition);
  const springY = useSpring(offsetY, transition);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
    console.log('🌟 StarsBackground mounted');
  }, []);

  // Determine colors based on theme
  const isDark = mounted && theme === "dark";
  const backgroundGradient = "bg-transparent";
  const defaultStarColor = isDark ? "#ffffff" : "#1a1a1a";

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent> | CustomEvent) => {
      let clientX: number, clientY: number;
      
      if (e instanceof CustomEvent) {
        clientX = e.detail.x;
        clientY = e.detail.y;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const newOffsetX = -(clientX - centerX) * factor;
      const newOffsetY = -(clientY - centerY) * factor;

      offsetX.set(newOffsetX);
      offsetY.set(newOffsetY);
    },
    [offsetX, offsetY, factor],
  );

  // Listen for custom mouse move events from other components
  React.useEffect(() => {
    const handleCustomMouseMove = (e: CustomEvent) => {
      handleMouseMove(e);
    };

    window.addEventListener('starsMouseMove', handleCustomMouseMove as EventListener);
    
    return () => {
      window.removeEventListener('starsMouseMove', handleCustomMouseMove as EventListener);
    };
  }, [handleMouseMove]);

  if (!mounted) {
    return (
      <div
        data-slot="stars-background"
        className={cn(
          "relative size-full overflow-hidden",
          backgroundGradient,
          className,
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
          Loading stars...
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="stars-background"
      className={cn(
        "relative size-full overflow-hidden",
        backgroundGradient,
        className,
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div style={{ x: springX, y: springY }}>
        <StarLayer
          count={1000}
          size={1}
          transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
          starColor={starColor || defaultStarColor}
        />
        <StarLayer
          count={400}
          size={2}
          transition={{
            repeat: Infinity,
            duration: speed * 2,
            ease: "linear",
          }}
          starColor={starColor || defaultStarColor}
        />
        <StarLayer
          count={200}
          size={3}
          transition={{
            repeat: Infinity,
            duration: speed * 3,
            ease: "linear",
          }}
          starColor={starColor || defaultStarColor}
        />
      </motion.div>
      
      {/* Add meteors effect - less frequent, longer meteors */}
      <Meteors number={2} className="pointer-events-none" />
      
      {children}
    </div>
  );
} 