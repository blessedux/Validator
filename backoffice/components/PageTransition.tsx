"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [blur, setBlur] = useState(true);

  useEffect(() => {
    setBlur(true);
    const timeout = setTimeout(() => setBlur(false), 25);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div className={`transition-all duration-25 ${blur ? "blur-lg" : ""}`}>
      {children}
    </div>
  );
}
