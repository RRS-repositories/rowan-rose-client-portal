# 🧱 Phase B Stack Decision Worksheet

Pick at start of Phase B (after Phase A direction approved).

**Default recommendation: Expo + Tamagui** if no strong reason to pick otherwise.

---

## Candidates

### 1. Expo + Tamagui

| | |
|--|--|
| **Codebase** | Single — RN + Web from one source |
| **Languages** | TypeScript / JavaScript |
| **Pros** | Compiler-optimised, fresh component vocabulary (not shadcn), built-in theming + dark mode, strong animation primitives, very close to existing JS expertise |
| **Cons** | Smaller ecosystem than NativeWind, learning curve on the compiler |
| **Best for** | Brad's most likely default — keeps RN ecosystem without the shadcn look |
| **Risk** | Low |

### 2. Flutter

| | |
|--|--|
| **Codebase** | Single — iOS + Android + Web from Dart |
| **Languages** | Dart |
| **Pros** | True single codebase, animations are first-class, Material 3 + Cupertino built in, 60fps on cheap phones, mature toolchain |
| **Cons** | Web target still weaker than native web (esp. text selection, SEO), Dart is a context switch from JS |
| **Best for** | If smooth animation on old Android phones is the top priority for the 18–90 audience |
| **Risk** | Medium (new language + ecosystem) |

### 3. Kotlin Multiplatform + Compose Multiplatform

| | |
|--|--|
| **Codebase** | Single — iOS + Android + Web + Desktop from Kotlin |
| **Languages** | Kotlin |
| **Pros** | Modern, JetBrains-backed, hardest commitment to "not the common stack", composable UI model |
| **Cons** | Smaller community, fewer libraries, steepest learning curve from JS, web target still maturing |
| **Best for** | Hardest break from the React/RN ecosystem if that's the goal |
| **Risk** | Higher (newer ecosystem, fewer Stack Overflow answers) |

---

## Decision Criteria (Score Each 1–5)

| Criterion | Weight | Expo+Tamagui | Flutter | KMP+Compose |
|-----------|--------|--------------|---------|-------------|
| Single codebase quality | High | | | |
| Animation smoothness on old phones | High | | | |
| Web target quality | Medium | | | |
| Time to ship | High | | | |
| Distance from "common stack" look | Medium | | | |
| Existing team expertise fit | High | | | |
| Library ecosystem depth | Medium | | | |
| Long-term maintenance burden | Medium | | | |

---

## Decision

- **Date:**
- **Pick:**
- **Reasoning (3 lines max):**
- **Trade-offs accepted:**
