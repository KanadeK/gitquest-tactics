# Benchmark

Baseline environment: Windows 11, Node 24.18.0, deterministic 12-level fixture, measured on 2026-07-22.

| Operation                 | Fixture size                        | Result                              |
| ------------------------- | ----------------------------------- | ----------------------------------- |
| Command engine unit suite | 12 missions and small commit graphs | Recorded by `npm run test:coverage` |
| Production build          | Full application                    | Recorded by `npm run build`         |

The graph engine is linear in the visited ancestor subgraph. This document is updated with command output at release validation so it does not claim unmeasured timings.
