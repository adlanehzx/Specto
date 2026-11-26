# 📁 Services - Architecture

This folder contains the application backend's business services.

## Structure

```
services/
├── llm.ts              # Code generation service using an LLM
└── testGenerator.ts    # Test generation orchestrator
```

---

## 📄 Files

### `llm.ts` - LLM service

**Responsibility:** Generating Playwright TypeScript test code

**Main functions:**

- `generateTestCode(prompt, url)` - Generates test code
- `validateGeneratedCode(code)` - Validates the generated code
- `extractCodeMetadata(code)` - Extracts metadata
- `estimateTestDuration(code)` - Estimates execution time

**Current state:** Basic template (stub)

**Future:** OpenAI GPT-4, Mistral, Claude integration (commented code ready)

**Configuration:**

```env
OPENAI_API_KEY=sk-...    # Optional
MISTRAL_API_KEY=...      # Optional
```

**Usage:**

```typescript
import { generateTestCode } from "./services/llm";

const code = await generateTestCode(
  "Click the login button",
  "https://example.com"
);
```

---

### `testGenerator.ts` - Orchestrator

**Responsibility:** High-level interface for test generation

**Role:**

- Orchestrates calls to the LLM service
- Handles validation of the generated code
- Returns structured results

**Usage:**

```typescript
import { generateTestCode } from "./services/testGenerator";

const result = await generateTestCode({
  prompt: "Test the contact form",
  url: "https://example.com/contact",
});

console.log(result.code);
console.log(result.estimatedDuration);
```

---

## 🔄 Data flow

```
routes.ts (POST /api/tests)
    ↓
testGenerator.generateTestCode({ prompt, url })
    ↓
llm.generateTestCode(prompt, url)
    ↓
[Current template OR future OpenAI/Mistral]
    ↓
llm.validateGeneratedCode(code)
    ↓
llm.estimateTestDuration(code)
    ↓
Return: { code, framework, estimatedDuration }
```

---

## 🚀 Future evolution

### Phase 1: Template (Current) ✅

- Basic Playwright code
- Prompt and URL embedded
- Simple validation

### Phase 2: Simple LLM (Next)

- OpenAI GPT-3.5 integration
- Optimized system prompts
- Fallback to template

### Phase 3: Advanced LLM

- Few-shot learning
- Web page analysis (Puppeteer)
- Smart selectors
- Multi-step tests

### Phase 4: Multi-LLM

- GPT-4, Mistral, Claude support
- Automatic selection based on complexity
- Quality A/B testing

---

## 🛠️ Adding a new service

To add a service to this folder:

1. **Create the file**

```typescript
// services/myService.ts
export async function myFunction() {
  // ...
}
```

2. **Add the types**

```typescript
export interface MyServiceResult {
  data: string;
}
```

3. **Document it**

```typescript
/**
 * Function description
 *
 * @param param1 - Description
 * @returns Description of the return value
 */
```

4. **Test it**

```typescript
// tests/services/myService.test.ts
import { myFunction } from "../src/services/myService";

test("myFunction works", async () => {
  const result = await myFunction();
  expect(result).toBeDefined();
});
```

5. **Use it in the routes**

```typescript
// routes.ts
import { myFunction } from "./services/myService";

router.post("/endpoint", async (req, res) => {
  const result = await myFunction();
  res.json(result);
});
```

---

## 📚 Related documentation

- [LLM_INTEGRATION.md](../LLM_INTEGRATION.md) - Full LLM integration guide
- [API_TESTS.md](../API_TESTS.md) - API documentation

---

## ⚙️ Configuration

The services use the following environment variables:

| Variable            | Required | Description                     |
| ------------------- | -------- | ------------------------------- |
| `OPENAI_API_KEY`    | No       | OpenAI API key (for GPT-4)      |
| `MISTRAL_API_KEY`   | No       | Mistral API key                 |
| `ANTHROPIC_API_KEY` | No       | Anthropic API key (for Claude)  |

**Note:** If no key is provided, the system uses the basic template.

---

## 🧪 Tests

To test a service individually:

```bash
npx tsx -e "
import { generateTestCode } from './src/services/llm';
const code = await generateTestCode('Test prompt', 'https://example.com');
console.log(code);
"
```

---

## 🐛 Debugging

### Enable detailed logs

In `llm.ts`, add:

```typescript
console.log("🔍 Prompt:", prompt);
console.log("🔍 URL:", url);
console.log("🔍 Generated code:", code);
```

### Check the validation

```typescript
import { validateGeneratedCode } from "./services/llm";

const isValid = validateGeneratedCode(myCode);
console.log("Valid:", isValid);
```

---

## 💡 Best Practices

1. **Always validate** the generated code before returning it
2. **Handle errors** with try/catch and a fallback
3. **Log** important events
4. **Document** with JSDoc
5. **Type** with strict TypeScript
6. **Test** with varied examples

---

## 📊 Metrics

To monitor in the services:

- Code generation time
- Validation success rate
- Number of tokens used (if LLM)
- Cost per request (if paid LLM)
- Error rate

Example:

```typescript
const startTime = Date.now();
const code = await generateTestCode(prompt, url);
const duration = Date.now() - startTime;

console.log(`⏱️ Generated in ${duration}ms`);
```

---

This services architecture provides a **clear separation of responsibilities** and makes **unit testing** and **future evolution** towards more sophisticated LLMs easier.
