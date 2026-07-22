# Architecture

GitQuest Tactics separates deterministic domain logic from browser presentation.

| Layer              | Location       | Responsibility                                                            |
| ------------------ | -------------- | ------------------------------------------------------------------------- |
| Domain core        | `src/core`     | Commit graph, ancestor walk, command rules, objectives, authored missions |
| UI feature         | `src/features` | Accessible React controls, graph display, editor, feedback                |
| Execution boundary | `src/workers`  | Message-based command executor suitable for expensive sandbox adapters    |
| Fixtures           | `examples`     | Offline failure examples and deterministic lesson data                    |

`executeCommand` clones the source state before every valid execution. A rejected command returns the original reference, which protects a resettable level from partial mutation. Objectives query graph facts such as pointer equality and ancestry; they do not inspect the action sequence.

The browser graph uses D3's point scale to turn commit identifiers into positions and renders parent edges directly from the graph. `isomorphic-git` is retained as the adapter dependency for the next filesystem-backed browser sandbox; the MVP's learning engine is intentionally pure so it can be tested with no DOM, filesystem, or network.
