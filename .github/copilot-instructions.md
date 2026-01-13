# Copilot instructions for excelindexhtml (updated for per-user auth)

## 重要更新（已实现）
- 添加了**简单客户端账号系统**（用户名 + 密码哈希），每个用户的数据独立存储在 localStorage 中。
- 支持：注册 / 登录 / 访客模式 / 退出。
- 密码使用浏览器 Web Crypto 的 SHA-256 做哈希（客户端存储哈希），注意：这只是**简单分区**，并非安全的服务器端认证。

## 关键文件与新 UI 元素
- `index.html` — 唯一实现文件，新增的 DOM 元素：
  - `#authModal` — 登录/注册模态
    - `#authUsernameInput`, `#authPasswordInput`, `#authMessage`
    - `#authLoginBtn`, `#authRegisterBtn`, `#authGuestBtn`
  - `#userInfo`, `#currentUserName`, `#logoutBtn` — 顶部用户信息与登出

## 新的数据与 localStorage 约定
- 用户列表：
  - Key: `yoloUsers` — 存储为对象，格式示例：{ "alice": { passwordHash: "...", createdAt: 167... } }
- 当前登录用户：
  - Key: `yoloCurrentUser` — 存储当前用户名的字符串
- 每个用户的数据使用“后缀”形式保存（例如：`<baseKey>_<username>`），常见 baseKey：
  - `yoloLiteratureData` → `yoloLiteratureData_<username>`
  - `yoloLiteratureTitle` → `yoloLiteratureTitle_<username>`
  - `yoloLiteratureHeadersV2` → `yoloLiteratureHeadersV2_<username>`
  - `yoloLiteratureCustomColumns` → `yoloLiteratureCustomColumns_<username>`
  - `yoloLiteratureHiddenColKeys` → `yoloLiteratureHiddenColKeys_<username>`

- 实用函数：`storageKey(key)` 会返回绑定到当前用户的 key（若未登录则返回原始 key），用于兼容与迁移检查。

## 行为与迁移细节
- 首次登录时，如果检测到存在旧的全局数据（`yoloLiteratureData`），页面会提示是否将旧数据导入到当前用户的存储空间（可选择）。
- 访客账户（guest）会被创建为 `guest_<ts>`，密码字段为空，适用于临时使用场景。

## 安全注意事项（对 AI 代理的重要说明）
- 这是**纯客户端认证**，仅用于把不同用户的数据隔离到不同的 localStorage key。不要把这当作安全认证方案：密码哈希在客户端计算并存储，任何本地用户都能查看/修改 localStorage。
- 如果未来需要真实的多用户安全模型，应替换为后端认证（HTTPS、服务器端存储密码哈希、会话或 JWT）。

## 开发者提醒（修改/扩展时请注意）
- 当你修改数据键名或 storageKey 的行为时，请同时考虑迁移策略（否则用户数据可能无法找到）。
- 与认证相关的函数：`hashPassword()`, `loadUsers()`, `saveUsers()`, `registerUser()`, `loginUser()`, `logoutUser()`, `bindAuthEvents()`。
- 如果新增列或字段，考虑是否需要在用户级别导出/导入这些字段（`exportToExcel()` 会跳过被隐藏的列并使用 label map）。

---

需要我把 README 或仓库主页也同步更新一条说明（提示该项目现在支持客户端账号隔离并说明其安全性），或者写一段示例文案给用户？如果要，我可以立即提交。