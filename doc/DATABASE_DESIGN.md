# XY 南昌数据库设计

## 1. 选型

推荐 PostgreSQL 16+、PostGIS、EF Core。字符集使用 UTF-8，时间统一 `timestamptz`，主键使用 `uuid` 或数据库可排序 UUID。

## 2. 核心关系

```text
users 1──N posts N──1 places
users 1──N check_ins N──1 places
posts 1──N post_media
posts 1──N comments
users N──N posts（post_likes / post_useful）
places N──N tags（place_tags）
posts N──N tags（post_tags）
```

## 3. 第一阶段表

### `users`

| 字段 | 类型 | 约束/说明 |
| --- | --- | --- |
| id | uuid | PK |
| phone_hash | varchar(128) | UNIQUE，可空；不存明文手机号索引 |
| nickname | varchar(40) | NOT NULL |
| avatar_url | text | 可空 |
| status | smallint | 1 正常、2 限制、3 冻结 |
| identity_score | smallint | 0–100 |
| created_at / updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | 软删除 |

### `places`

| 字段 | 类型 | 约束/说明 |
| --- | --- | --- |
| id | uuid | PK |
| amap_poi_id | varchar(64) | UNIQUE，可空 |
| name / subtitle | varchar(120) / varchar(240) | NOT NULL / 可空 |
| city_code | varchar(16) | 索引 |
| address | varchar(300) | 可空 |
| location_gcj02 | geometry(Point, 4326) | 高德展示/附近搜索 |
| longitude_wgs84 / latitude_wgs84 | decimal(10,7) | 原始标准坐标 |
| score_sum / score_count | int | 聚合分数，事务更新 |
| cover_url | text | 可空 |
| status | smallint | 正常、停业、待核验、合并 |
| created_at / updated_at / deleted_at | timestamptz | 审计字段 |

### `posts`

| 字段 | 类型 | 约束/说明 |
| --- | --- | --- |
| id / user_id / place_id | uuid | PK / FK / FK |
| title | varchar(100) | NOT NULL |
| content | text | NOT NULL |
| excerpt | varchar(240) | 列表摘要 |
| experience_score | smallint | -5 至 5，按最终业务规则调整 |
| publish_mode | smallint | 现场、远程 |
| status | smallint | 草稿、审核中、已发布、需修改、下架 |
| like_count / useful_count / comment_count | int | 非负聚合字段 |
| published_at | timestamptz | 可空 |
| created_at / updated_at / deleted_at | timestamptz | 审计字段 |

### 互动表

- `post_likes(user_id, post_id, created_at)`，联合唯一键。
- `post_useful(user_id, post_id, created_at)`，联合唯一键。
- `comments(id, post_id, user_id, parent_id, content, status, created_at, deleted_at)`。
- `check_ins(id, user_id, place_id, distance_meters, visibility, checked_in_at)`。
- `post_media(id, post_id, object_key, media_type, width, height, sort_order, audit_status)`。
- `tags(id, code, name, status)`、`post_tags(post_id, tag_id)`、`place_tags(place_id, tag_id)`。

## 4. 后续模块表域

- Y 组局：`events`、`event_applications`、`event_members`、`event_check_ins`、`event_feedback`。
- 认证：`verification_cases`、`verification_materials`、`identity_score_changes`。
- 消息：`conversations`、`conversation_members`、`messages`。
- 经济：`wallets`、`wallet_transactions`、`reward_tasks`、`reward_claims`。
- 审核：`moderation_cases`、`moderation_actions`、`appeals`、`audit_logs`。

这些表应在对应模块启动时细化和迁移，不建议第一阶段一次性建空表。

## 5. 索引与约束

- `GIST places(location_gcj02)`：附近地点查询。
- `posts(place_id, status, published_at desc)`：地点内容流。
- `posts(status, published_at desc)`：全局最新内容流。
- `comments(post_id, created_at, id)`：评论游标分页。
- 所有计数列 `CHECK (value >= 0)`；体验分和身份分增加范围约束。
- 外键默认 `RESTRICT`，内容软删除；互动表可随主体删除。
- 审计日志只追加不更新，敏感字段变更记录操作者和原因。
