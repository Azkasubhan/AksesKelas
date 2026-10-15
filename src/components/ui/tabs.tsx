"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex gap-1 rounded-[14px] border border-line bg-surface-subtle/80 p-1 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[14.5px] font-medium text-muted transition-all duration-200 hover:text-ink data-[state=active]:bg-surface data-[state=active]:font-semibold data-[state=active]:text-ink data-[state=active]:shadow-[0_1px_2px_rgba(19,23,21,0.06),0_4px_12px_-4px_rgba(19,23,21,0.08)] [&_svg]:size-4 data-[state=active]:[&_svg]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("pt-6", className)} {...props} />;
}
