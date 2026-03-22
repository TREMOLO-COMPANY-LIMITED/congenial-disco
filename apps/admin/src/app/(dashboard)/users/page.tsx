"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminUsers } from "@/lib/api";
import {
  Input,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@starter/ui";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 20;

  const { data, isLoading } = useAdminUsers({ page, limit, search: search || undefined });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ユーザー管理</h1>
        <p className="text-muted-foreground">ユーザーの一覧表示・検索・権限管理を行います。</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ユーザー一覧</CardTitle>
              <CardDescription>
                {data ? `全 ${data.total} 件のユーザー` : "読み込み中..."}
              </CardDescription>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="検索..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
              <Button type="submit" size="sm">
                検索
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              </div>
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">ユーザーが見つかりません。</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">メール</TableHead>
                    <TableHead>名前</TableHead>
                    <TableHead>権限</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>登録日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="pl-6 font-medium">
                        <Link
                          href={`/users/${user.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {user.email}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "super_admin"
                              ? "destructive"
                              : user.role === "admin"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.banned ? (
                          <Badge variant="destructive">停止</Badge>
                        ) : (
                          <Badge variant="outline">有効</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} / {data.total} 件
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    前へ
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    次へ
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
