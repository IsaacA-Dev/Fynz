import { cva, type VariantProps } from "class-variance-authority";
import {
  forwardRef,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

const cardVariants = cva(
  "rounded-card border text-fg select-none transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        raised: "border-line bg-surface shadow-soft",
        soft: "border-transparent bg-surface-muted",
        outline: "border-line bg-surface",
      },
      interactive: {
        true:
          "hover:border-line-strong hover:shadow-lift active:scale-[0.98] active:duration-100",
        false: "",
      },
    },
    defaultVariants: {
      variant: "raised",
      interactive: false,
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, interactive, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 p-5", className)}
      {...props}
    />
  );
});

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-base font-semibold tracking-tight text-fg",
        className
      )}
      {...props}
    />
  );
});

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-sm leading-relaxed text-fg-muted", className)}
      {...props}
    />
  );
});

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />;
});

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 p-5 pt-0", className)}
      {...props}
    />
  );
});
