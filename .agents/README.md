# Bundled Agent Skills

Skills live with the codebase so future agents get the same working context after cloning the repository.

```text
.agents/
└── skills/
```

| Skill                 | What it covers                                                       |
| --------------------- | -------------------------------------------------------------------- |
| `benrobo-iconary`     | Exact `@benrobo/iconary` imports, props, styles, and naming rules    |
| `frontend-design`     | Production-grade UI and visual design guidance                       |
| `karpathy-guidelines` | Simplicity, explicit assumptions, surgical changes, and verification |
| `web-perf`            | Frontend performance audits                                          |
| `find-skills`         | Discovering additional skills                                        |

Install the bundled skills into the local user skill directory:

```bash
bun run skills:install
```
