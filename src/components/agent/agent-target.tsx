import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  id: string;
  children: ReactNode;
};

export function AgentTarget({ id, className, children, type, ...props }: Props) {
  return (
    <button
      type={type ?? "button"}
      data-agent={id}
      className={cn(
        "min-h-11 text-left transition-[background-color,opacity,transform] duration-150 ease-out active:scale-[0.96]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
