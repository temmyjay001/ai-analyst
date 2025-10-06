// components/BillingUpgrade.tsx
"use client";

import { useRouter } from "next/navigation";
import { ReactNode, ComponentPropsWithoutRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";

interface BillingUpgradeProps extends ComponentPropsWithoutRef<"a"> {
  children?: ReactNode;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  asButton?: boolean;
}

/**
 * Reusable component for navigating to the billing page
 * Uses Next.js router for smooth client-side navigation
 * Supports all Button component variants and sizes
 *
 * @example
 * // As a styled button
 * <BillingUpgrade variant="default" size="sm">
 *   Upgrade Now
 * </BillingUpgrade>
 *
 * @example
 * // As a link with custom styling
 * <BillingUpgrade className="text-emerald-600 hover:underline">
 *   Upgrade →
 * </BillingUpgrade>
 */
export function BillingUpgrade({
  children,
  className,
  variant,
  size,
  asButton = false,
  onClick,
  ...props
}: Readonly<BillingUpgradeProps>) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Call optional onClick handler first
    onClick?.(e as any);

    // Navigate using Next.js router
    router.push("/billing");
  };

  // If variant or size is provided, or asButton is true, use Button component
  if (variant || size || asButton) {
    return (
      <Button
        variant={variant || "default"}
        size={size}
        className={className}
        asChild
      >
        <a href="/billing" onClick={handleClick} {...props}>
          {children || "Upgrade"}
        </a>
      </Button>
    );
  }

  // Otherwise, render as plain link
  return (
    <a href="/billing" onClick={handleClick} className={className} {...props}>
      {children || "Upgrade"}
    </a>
  );
}
