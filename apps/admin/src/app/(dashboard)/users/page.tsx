"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminUsers } from "@/lib/api";
import { Input, Badge, Button } from "@starter/ui";
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
    <div>
      <h1 className="mb-6 text-2xl font-bold">ユーザー管理</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="メールアドレスまたは名前で検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">検索</Button>
      </form>

      {isLoading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : !data || data.data.length === 0 ? (
        <p className="text-gray-500">ユーザーが見つかりません。</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">メール</th>
                  <th className="px-4 py-3 font-medium">名前</th>
                  <th className="px-4 py-3 font-medium">権限</th>
                  <th className="px-4 py-3 font-medium">状態</th>
                  <th className="px-4 py-3 font-medium">登録日</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/users/${user.id}`} className="text-blue-600 hover:underline">
                        {user.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{user.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "super_admin" ? "destructive" : user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {user.banned ? (
                        <Badge variant="destructive">停止</Badge>
                      ) : (
                        <Badge variant="secondary">有効</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              全 {data.total} 件中 {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} 件
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
