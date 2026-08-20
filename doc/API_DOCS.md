# XY 南昌 API 接口文档

## 1. 基本约定

- 开发地址：`http://localhost:5000/api/v1`
- 格式：JSON，字段使用 `camelCase`
- 时间：ISO 8601 UTC，例如 `2026-08-10T08:30:00Z`
- 标识：对外使用 UUID/ULID 字符串，避免暴露数据库自增量
- 认证：`Authorization: Bearer <accessToken>`

统一成功响应：

```json
{ "success": true, "data": {}, "traceId": "00-abcd" }
```

统一错误响应遵循 RFC 9457 Problem Details：

```json
{
  "type": "https://api.xy.local/problems/validation",
  "title": "参数校验失败",
  "status": 400,
  "detail": "category 不受支持",
  "traceId": "00-abcd",
  "errors": { "category": ["不受支持的分类"] }
}
```

## 2. 探索首页

### `GET /explore/home`

首屏聚合接口，与 `xy-frontend/src/mock/mock.json` 对齐。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| longitude | decimal | 否 | GCJ-02 经度；缺失时使用城市中心 |
| latitude | decimal | 否 | GCJ-02 纬度 |
| cityCode | string | 否 | 高德城市编码，默认南昌 |
| category | string | 否 | 分类名称或编码 |

响应 `data`：

```json
{
  "city": "南昌",
  "weather": "28° 晴",
  "categories": [{ "id": 1, "name": "日落", "icon": "sunny" }],
  "places": [{
    "id": "01JXYPLACE101",
    "name": "赣江观景步道",
    "subtitle": "晚风与城市天际线",
    "category": "日落",
    "distance": "1.8km",
    "distanceMeters": 1800,
    "score": 4.8,
    "image": "https://cdn.example.com/place/101.jpg",
    "tags": ["日落", "散步"],
    "longitude": 115.8581,
    "latitude": 28.6829
  }],
  "posts": [{
    "id": "01JXYPOST201",
    "placeId": "01JXYPLACE101",
    "title": "把南昌的橘子汽水天空收进口袋",
    "excerpt": "六点半到七点的光最好。",
    "author": { "id": "01JXYUSER1", "nickname": "小宇在散步", "avatar": "https://cdn.example.com/avatar/1.jpg" },
    "cover": "https://cdn.example.com/post/201.jpg",
    "likes": 126,
    "useful": 48,
    "checkedIn": true,
    "live": true
  }]
}
```

## 3. 探索 Feed

### `GET /explore/posts`

参数：`cursor`、`limit`（默认 20，最大 50）、`category`、`keyword`、`longitude`、`latitude`、`sort`（`recommended|nearest|latest`）。

```json
{
  "success": true,
  "data": { "items": [], "nextCursor": "eyJpZCI6...", "hasMore": true },
  "traceId": "00-abcd"
}
```

## 4. 地点

| 方法 | 路径 | 认证 | 用途 |
| --- | --- | --- | --- |
| GET | `/places/{id}` | 否 | 地点详情和统计 |
| GET | `/places/{id}/posts` | 否 | 地点下的帖子 |
| POST | `/places/{id}/check-ins` | 是 | 现场打卡，服务端验证位置 |
| POST | `/places/{id}/corrections` | 是 | 提交地点纠错 |
| GET | `/places/nearby` | 否 | 按坐标和半径查询附近地点 |

## 5. 帖子与互动

| 方法 | 路径 | 认证 | 用途 |
| --- | --- | --- | --- |
| GET | `/posts/{id}` | 否 | 帖子详情 |
| POST | `/posts` | 是 | 创建草稿或提交审核 |
| PUT | `/posts/{id}` | 是 | 编辑自己的帖子 |
| DELETE | `/posts/{id}` | 是 | 软删除自己的帖子 |
| POST | `/posts/{id}/likes` | 是 | 点赞，幂等 |
| DELETE | `/posts/{id}/likes` | 是 | 取消点赞 |
| POST | `/posts/{id}/useful` | 是 | 标记有用，幂等 |
| GET | `/posts/{id}/comments` | 否 | 评论游标分页 |
| POST | `/posts/{id}/comments` | 是 | 发表评论或回复 |

创建帖子示例：

```json
{
  "placeId": "01JXYPLACE101",
  "title": "傍晚散步记录",
  "content": "正文",
  "experienceScore": 4,
  "publishMode": "live",
  "mediaIds": ["01JXYMEDIA1"],
  "tags": ["日落", "散步"]
}
```

## 6. 消息中心

消息首页使用聚合接口，前端 DTO 与 `src/types/message.ts`、`mock.json.messages` 保持一致。

| 方法 | 路径 | 认证 | 用途 |
| --- | --- | --- | --- |
| GET | `/messages/home` | 是 | 会话、互动通知与首屏聊天记录 |
| GET | `/messages/conversations` | 是 | 会话游标分页与关键词搜索 |
| PUT | `/messages/conversations/{id}/read` | 是 | 将会话标记为已读，幂等 |
| GET | `/messages/conversations/{id}/messages` | 是 | 聊天记录游标分页 |
| POST | `/messages/conversations/{id}/messages` | 是 | 发送文本、图片或地点消息 |
| GET | `/messages/notices` | 是 | 按 `comments|likes|follows` 查询互动通知 |
| GET | `/messages/audits` | 是 | 当前用户的内容审核记录 |
| GET | `/messages/rewards` | 是 | 奖励余额、待领取与领取记录 |
| POST | `/messages/rewards/activate` | 是 | 激活奖励码，接口必须支持幂等 |

发送文本消息：

```json
{
  "clientMessageId": "01JXYCLIENTMSG1",
  "type": "text",
  "content": "傍晚六点左右过去最好看"
}
```

服务端返回正式消息 ID、UTC 创建时间和发送状态。实时推送后续通过 ASP.NET Core SignalR 的 `/hubs/chat` 提供，REST 接口仍作为发送和历史记录的可靠主链路。

已读接口由服务端根据当前用户身份更新 `lastReadMessageId`，禁止客户端提交未读数量。未读数由数据库游标计算或缓存投影生成。

## 7. 认证预留

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/auth/wechat/phone-login` | 微信手机号登录 |
| POST | `/auth/refresh` | 刷新访问令牌 |
| POST | `/auth/logout` | 撤销刷新令牌 |
| GET | `/users/me` | 当前用户摘要 |

## 8. ASP.NET Core 实现约定

- 通过 Swagger/OpenAPI 暴露当前契约，并生成前端客户端作为后续优化项。
- 查询接口返回 DTO，禁止直接序列化 EF Core Entity。
- 写接口通过 FluentValidation 校验，业务冲突返回 `409`。
- 上传采用 `POST /media/upload-ticket` 获取预签名地址，完成后调用 `POST /media/{id}/complete`。
