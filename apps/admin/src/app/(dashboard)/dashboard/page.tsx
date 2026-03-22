import { Card, CardContent, CardHeader, CardTitle } from "@starter/ui";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>
      <Card>
        <CardHeader>
          <CardTitle>概要</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">管理者ダッシュボードへようこそ。左のメニューからユーザー管理にアクセスできます。</p>
        </CardContent>
      </Card>
    </div>
  );
}
