# Supabase から PostgreSQL への乗り換え提案

## 目的

現在の構成では、アプリケーションは `DATABASE_URL` を通じて PostgreSQL に接続し、Drizzle ORM でスキーマ・マイグレーションを管理しています。Supabase 固有の SDK や認証・ストレージ機能に強く依存していないため、接続先を Supabase PostgreSQL から独立した PostgreSQL 基盤へ移行しやすい状態です。

この提案では、Supabase を「BaaS」ではなく「PostgreSQL ホスティング」として利用している前提で、運用コスト・移植性・接続安定性を改善するために PostgreSQL へ乗り換える方針を整理します。

## 現状整理

- DB アクセスは `packages/db` の Drizzle ORM に集約されています。
- アプリケーション側は `DATABASE_URL` を環境変数として受け取り、接続先の PostgreSQL を差し替えられる設計です。
- ローカル開発環境では `docker-compose.yml` に PostgreSQL 16 が用意されています。
- API は Cloudflare Workers 上で動作するため、本番 DB へ接続する場合は接続数・レイテンシ・プーリング方針を明確にする必要があります。

## 乗り換えを提案する理由

### 1. ベンダーロックインの低減

Supabase の便利な周辺機能を使っていない場合、主要な依存は PostgreSQL の接続文字列だけです。Drizzle ORM と標準 PostgreSQL を中心に据えることで、将来的に Neon、Railway、Render、AWS RDS、Cloud SQL、自前 PostgreSQL などへ移しやすくなります。

### 2. コスト構造の明確化

Supabase は PostgreSQL に加えて、API、Auth、Storage、Realtime などを含むプラットフォームです。DB だけを使う場合、専用の PostgreSQL ホスティングや既存インフラの PostgreSQL に寄せることで、利用していない機能分の運用判断を切り離せます。料金や上限は変更されるため、移行前に Supabase の公式 Pricing と移行候補サービスの料金を同一条件で比較してください。

### 3. Cloudflare Workers との接続設計を最適化しやすい

このリポジトリの API は Cloudflare Workers 前提です。Workers から PostgreSQL に接続する場合、通常の TCP 接続、接続プーリング、Cloudflare Hyperdrive などの選択肢があります。Supabase のプーラーに合わせるのではなく、本番運用に合わせて PostgreSQL ホストとプーリング層を選ぶことで、コールドスタート時の接続負荷やリージョン間レイテンシを制御しやすくなります。

### 4. Drizzle マイグレーション中心の運用に揃えられる

スキーマは Drizzle で管理されているため、移行後も `pnpm db:generate` / `pnpm db:migrate` の運用を継続できます。Supabase Dashboard 上の手作業変更を避け、Git 管理された SQL マイグレーションを正とする運用に統一できます。

## 推奨方針

### 結論

短期的には、Supabase から「標準 PostgreSQL として接続できるマネージド PostgreSQL」へ段階移行することを推奨します。アプリケーションコードの大きな書き換えは不要で、主な変更点は `DATABASE_URL`、接続プーリング、バックアップ、監視、運用手順です。

### 移行先候補

| 候補                        | 向いているケース                                                    | 注意点                                                           |
| --------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Neon                        | サーバーレス PostgreSQL、ブランチ運用、開発環境の複製を重視する場合 | Workers からの接続方式とプーリング設定を事前検証する             |
| Railway / Render PostgreSQL | 小〜中規模で簡単な運用を重視する場合                                | リージョン、バックアップ、スケール時の上限を確認する             |
| AWS RDS / Google Cloud SQL  | 本番運用、監査、ネットワーク制御、長期保守を重視する場合            | 初期設定と運用負荷が上がるため、専任運用が必要                   |
| 自前 PostgreSQL             | コスト最適化や完全な制御が必要な場合                                | バックアップ、監視、セキュリティパッチを自社で担保する必要がある |

## 移行計画

### Phase 1: 事前調査

1. Supabase で利用中の機能を棚卸しする。
   - PostgreSQL のみ
   - Supabase Auth
   - Supabase Storage
   - Realtime / Edge Functions
   - Row Level Security / PostgREST
2. 現在の DB サイズ、テーブル数、インデックス、拡張機能、接続数、クエリ負荷を確認する。
3. 本番 API の配置リージョンと DB リージョンを確認する。
4. 移行先候補の料金、バックアップ、PITR、接続上限、メンテナンス方針を比較する。

### Phase 2: 移行先 PostgreSQL の準備

1. 移行先に PostgreSQL を作成する。
2. 必要な PostgreSQL extension を有効化する。
3. `DATABASE_URL` を発行し、アプリケーション・Drizzle・CI から接続できることを確認する。
4. Cloudflare Workers 本番運用では、必要に応じて Hyperdrive または外部プーラーを検証する。

### Phase 3: スキーマ移行

1. Drizzle の既存マイグレーションを移行先 DB に適用する。
2. `packages/db/drizzle` 配下の SQL と `packages/db/src/schema` の定義が一致していることを確認する。
3. ステージング環境で API の `/verify/database` 相当の疎通確認を実施する。

### Phase 4: データ移行

1. Supabase から `pg_dump` でデータを取得する。
2. 移行先 PostgreSQL へ `pg_restore` または `psql` で復元する。
3. 件数、主要テーブル、外部キー、インデックス、シーケンス、UUID 生成が期待通りか検証する。
4. 読み取り専用メンテナンス時間を設け、最終差分を反映する。

### Phase 5: 切り替え

1. ステージングの `DATABASE_URL` を移行先に切り替える。
2. API、Web、Admin の主要導線を確認する。
3. 本番の `DATABASE_URL` を移行先に切り替える。
4. リリース直後は DB 接続数、エラー率、レスポンス時間、遅いクエリを重点監視する。
5. 問題があれば Supabase の接続文字列へ戻せるよう、ロールバック手順を残す。

## 検証項目

- `pnpm --filter @starter/db db:migrate` が移行先 DB に対して成功すること。
- `pnpm --filter @starter/db db:seed-admin` が必要な環境変数付きで成功すること。
- API の DB 検証エンドポイントが成功を返すこと。
- ユーザー登録、ログイン、セッション維持、管理画面のユーザー一覧が動作すること。
- 本番想定の同時アクセスで接続数上限に達しないこと。
- バックアップからのリストア手順を最低 1 回は検証すること。

## リスクと対策

| リスク                                 | 対策                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------- |
| Supabase 固有機能に未把握の依存がある  | Phase 1 で利用機能を棚卸しし、PostgreSQL 以外の依存があれば別途代替案を作る |
| Workers から DB への接続が不安定になる | Hyperdrive、接続プーラー、リージョン配置をステージングで負荷検証する        |
| データ移行中に差分が発生する           | メンテナンス時間を設定し、最終 dump / restore 後に書き込みを再開する        |
| マイグレーション履歴がずれる           | Drizzle のマイグレーションを正とし、手作業 DDL を禁止する                   |
| ロールバックできない                   | 切り替え直前の Supabase dump と旧 `DATABASE_URL` を保持する                 |

## 参考リンク

- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase: Manage Egress usage](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
- [Cloudflare Workers: Connect to databases](https://developers.cloudflare.com/workers/databases/connecting-to-databases/)
- [Cloudflare Workers: TCP sockets](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/)
- [Drizzle ORM: PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)

## 判断基準

以下の条件を満たす場合は移行を進める価値が高いです。

- Supabase の Auth、Storage、Realtime、Edge Functions をほぼ使っていない。
- DB 運用を Drizzle と PostgreSQL 標準機能に寄せたい。
- Cloudflare Workers からの接続方式を自社で最適化したい。
- コスト、接続上限、バックアップ、監視を PostgreSQL 単体の観点で管理したい。

一方で、Supabase Auth や Realtime を深く利用している場合は、PostgreSQL だけを移すとアプリケーション改修範囲が広がります。その場合は、まず PostgreSQL 以外の Supabase 依存を切り離す計画を別途作成してから移行してください。
