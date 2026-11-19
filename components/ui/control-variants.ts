import { cva, type VariantProps } from "class-variance-authority";

export const controlVariants = cva(
  "w-full text-sm text-fg placeholder:text-fg-subtle transition-colors duration-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        boxed:
          "rounded-panel border border-input bg-surface px-3 focus-visible:ring-2 focus-visible:ring-brand/80",
        underline:
          "border-0 border-b border-input bg-transparent px-0 py-2 focus-visible:border-brand",
      },
      invalid: {
        true: "border-danger focus-visible:ring-danger/80",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "underline",
        invalid: true,
        className: "border-b-danger focus-visible:border-danger",
      },
    ],
    defaultVariants: {
      variant: "boxed",
      invalid: false,
    },
  }
);

export type ControlVariantProps = VariantProps<typeof controlVariants>;
