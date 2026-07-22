# GitQuest Tactics

GitQuest Tactics 是一个离线可运行的 Git 战术解谜游戏。它根据真实的提交图、分支指针和祖先关系判定关卡，而不是根据按钮点击顺序判定。

## 30 秒上手

```bash
npm ci
npm run dev
```

打开 Vite 输出的地址，在第一关输入 `commit checkpoint`。提交图会从 `c1` 推进到 `c2`，目标即时重新计算。

## 核心价值

- 12 个确定性关卡，覆盖 commit、branch、checkout、merge、rebase 与 cherry-pick。
- 无网、无账号、无真实仓库访问；错误命令不会改变原始图。
- 内置 JSON 关卡编辑器，可本地校验并导出可复现关卡元数据。

## 架构与质量

领域核心位于 `src/core`，React 界面位于 `src/features`，Worker 边界位于 `src/workers`。测试覆盖成功、失败、边界和关卡自动解法。完整说明见英文 [README](README.md)、[架构文档](docs/ARCHITECTURE.md) 和 [隐私安全说明](docs/PRIVACY_AND_SECURITY.md)。

```bash
npm run lint && npm run typecheck && npm run test:coverage && npm run test:e2e && npm run build
npm run package
```

MIT 许可证。欢迎依照 [CONTRIBUTING.md](CONTRIBUTING.md) 贡献。
