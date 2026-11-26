# Cloudflare Tunnel Module

Cloudflare tunnel management module to expose local servers through temporary public URLs.

## 🎯 Purpose

Let Specto test local websites (`http://localhost:*`) by automatically creating public Cloudflare tunnels with no configuration.

## 📦 Installation

### Prerequisite: cloudflared

```bash
# Windows
choco install cloudflared

# macOS
brew install cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
```

## 🚀 Usage

### Basic example

```typescript
import {
  createCloudflareTunnel,
  closeCloudflareTunnel,
} from "./tunnel/cloudflare";

// Create a tunnel to localhost:3000
const publicUrl = await createCloudflareTunnel({ port: 3000 });
console.log(publicUrl);
// → https://abc-def-ghi.trycloudflare.com

// Use the public URL...
await runTests(publicUrl);

// Close the tunnel
closeCloudflareTunnel(3000);
```

### Automatic resolution

```typescript
import { resolveUrl } from "./tunnel/cloudflare";

// Local URL → creates a tunnel automatically
const result1 = await resolveUrl("http://localhost:3000");
// → { url: 'https://abc.trycloudflare.com', tunnelCreated: true, port: 3000 }

// Public URL → returned as is
const result2 = await resolveUrl("https://example.com");
// → { url: 'https://example.com', tunnelCreated: false }
```

## 📚 API

### createCloudflareTunnel(config)

Creates a Cloudflare tunnel to a local port.

**Parameters:**

- `port` (number) - Local server port
- `timeout` (number, optional) - Timeout in ms (default: 30000)
- `verbose` (boolean, optional) - Detailed logs (default: false)

**Returns:** Promise<string> - public URL of the tunnel

```typescript
const url = await createCloudflareTunnel({
  port: 3000,
  timeout: 30000,
  verbose: true,
});
```

### closeCloudflareTunnel(port)

Closes an active tunnel on a specific port.

**Returns:** boolean - true if closed, false if not found

```typescript
const closed = closeCloudflareTunnel(3000);
```

### closeAllCloudflareTunnels()

Closes all active tunnels.

```typescript
closeAllCloudflareTunnels();
```

### isLocalUrl(url)

Checks whether a URL is local.

**Returns:** boolean

```typescript
isLocalUrl("http://localhost:3000"); // true
isLocalUrl("http://127.0.0.1:8080"); // true
isLocalUrl("https://example.com"); // false
```

### resolveUrl(url, config?)

Resolves a URL: creates a tunnel if it is local, returns it as is otherwise.

**Returns:** Promise<{ url, tunnelCreated, port?, originalUrl? }>

```typescript
const result = await resolveUrl("http://localhost:3000");
if (result.tunnelCreated) {
  console.log(`Tunnel: ${result.url}`);
  console.log(`Port: ${result.port}`);
}
```

### listActiveTunnels()

Lists all active tunnels.

**Returns:** Map<number, string> - port → URL

```typescript
const tunnels = listActiveTunnels();
tunnels.forEach((url, port) => {
  console.log(`Port ${port}: ${url}`);
});
```

### getTunnelUrl(port)

Gets the URL of an active tunnel.

**Returns:** string | null

```typescript
const url = getTunnelUrl(3000);
if (url) {
  console.log(`Active tunnel: ${url}`);
}
```

### isTunnelActive(port)

Checks whether a tunnel is active on a port.

**Returns:** boolean

```typescript
if (isTunnelActive(3000)) {
  console.log("Tunnel active on port 3000");
}
```

### checkCloudflareBinary()

Checks whether cloudflared is installed.

**Returns:** Promise<boolean>

```typescript
const installed = await checkCloudflareBinary();
if (!installed) {
  printInstallationInstructions();
}
```

## 🔄 Integration in Specto

The module is integrated into:

1. **testGenerator.ts** - Automatically resolves local URLs
2. **queue.ts** - Manages the lifecycle (creation → test → closing)
3. **routes/tunnels.ts** - REST management API

### Automatic workflow

```typescript
// The user creates a test with a local URL
POST /api/tests {
  "url": "http://localhost:3000",
  "prompt": "Test homepage"
}

// The worker:
// 1. Detects the local URL
// 2. Creates a tunnel automatically
// 3. Generates code with the public URL
// 4. Runs the test
// 5. Closes the tunnel
```

## 🛡️ Security

### Limitations

⚠️ `trycloudflare.com` tunnels are **public**:

- Anyone with the URL can access it
- Temporary URLs (a few hours)
- No authentication

### Best practices

1. Never expose sensitive data
2. Close tunnels after use
3. Use `keepTunnelOpen: false` by default
4. Monitor active tunnels

## 📖 Examples

Runnable examples are in `src/examples/tunnel-examples.ts`.

## 🧪 Tests

```bash
# Run the examples
npx ts-node src/examples/tunnel-examples.ts
```

## 🐛 Troubleshooting

### "cloudflared not found"

→ Install cloudflared (see Installation above)

### "Tunnel timeout"

→ Check that the local server is running: `curl http://localhost:PORT`

### "Port already in use"

→ Close the tunnel: `DELETE /api/tunnels/PORT`
