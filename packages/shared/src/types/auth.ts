import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください")
  .regex(/[A-Z]/, "大文字を含めてください")
  .regex(/[a-z]/, "小文字を含めてください")
  .regex(/[0-9]/, "数字を含めてください");

export const registerSchema = z
  .object({
    name: z.string().min(1, "名前を入力してください").max(100, "名前は100文字以内で入力してください"),
    email: z.string().email("有効なメールアドレスを入力してください"),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "パスワードが一致しません",
    path: ["passwordConfirmation"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type LoginInput = z.infer<typeof loginSchema>;
