import type { HTMLAttributes } from "react";
import { cn } from "@/web/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("card", className)} {...props} />;
}
