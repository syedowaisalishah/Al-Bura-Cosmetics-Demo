import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/web/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn("button", `button-${variant}`, className)} {...props} />;
}
