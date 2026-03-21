"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Label } from "@starter/ui";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("Valid email required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type FormData = z.infer<typeof formSchema>;

export function DemoForm() {
  const [submitted, setSubmitted] = useState<FormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    setSubmitted(data);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="test@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <Button type="submit" size="sm">
          Submit
        </Button>
      </form>

      {submitted && (
        <div className="rounded-md bg-green-50 p-3 text-sm dark:bg-green-950">
          <p className="font-medium text-green-800 dark:text-green-200">
            Form validated successfully!
          </p>
          <pre className="mt-1 text-xs text-green-700 dark:text-green-300">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
