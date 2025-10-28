/**
 * AI Prompts for Security Testing (OWASP)
 * Generates security scan configurations and vulnerability analysis
 */

export interface SecurityScanConfig {
  targetUrl: string;
  scanType: "full" | "quick" | "custom";
  checks: {
    sqlInjection: boolean;
    xss: boolean;
    csrf: boolean;
    authBypass: boolean;
    sensitiveData: boolean;
    securityHeaders: boolean;
    sslTls: boolean;
    directoryTraversal: boolean;
  };
  authType?: "none" | "basic" | "bearer" | "cookie";
  authConfig?: any;
  customPrompt?: string;
}

/**
 * Build prompt for generating security scan test cases
 */
export function buildSecurityScanPrompt(config: SecurityScanConfig): string {
  const enabledChecks = Object.entries(config.checks)
    .filter(([_, enabled]) => enabled)
    .map(([check]) => check);

  return `You are a cybersecurity expert specializing in OWASP Top 10 vulnerabilities.

Generate a comprehensive security scan configuration for the following target:

**Target URL:** ${config.targetUrl}
**Scan Type:** ${config.scanType}
**Enabled Checks:** ${enabledChecks.join(", ")}

${
  config.authType && config.authType !== "none"
    ? `
**Authentication:**
- Type: ${config.authType}
- Configuration: ${JSON.stringify(config.authConfig, null, 2)}
`
    : ""
}

${
  config.customPrompt
    ? `
**Additional Requirements:**
${config.customPrompt}
`
    : ""
}

For each enabled security check, provide:
1. **Test Cases**: Specific payloads, requests, or scenarios to test
2. **Expected Indicators**: Signs that a vulnerability exists
3. **Severity Assessment**: How to determine if it's Critical, High, Medium, Low, or Info
4. **OWASP/CWE Mapping**: Relevant OWASP category and CWE identifier

**Security Checks to Include:**

${
  config.checks.sqlInjection
    ? `
### 1. SQL Injection (OWASP A03:2021 - Injection)
- Test common SQL injection patterns in query parameters, form fields, headers
- Payloads: \`' OR '1'='1\`, \`'; DROP TABLE users--\`, \`1' UNION SELECT NULL--\`
- Check for error messages, unexpected behavior, time-based blind injection
- CWE-89: Improper Neutralization of Special Elements used in SQL Command
`
    : ""
}

${
  config.checks.xss
    ? `
### 2. Cross-Site Scripting (XSS) (OWASP A03:2021 - Injection)
- Test reflected, stored, and DOM-based XSS
- Payloads: \`<script>alert('XSS')</script>\`, \`<img src=x onerror=alert(1)>\`
- Check if input is reflected in response without proper encoding
- CWE-79: Improper Neutralization of Input During Web Page Generation
`
    : ""
}

${
  config.checks.csrf
    ? `
### 3. Cross-Site Request Forgery (CSRF) (OWASP A01:2021 - Broken Access Control)
- Check for CSRF tokens in forms and state-changing requests
- Verify SameSite cookie attributes
- Test if sensitive actions can be triggered from external sites
- CWE-352: Cross-Site Request Forgery
`
    : ""
}

${
  config.checks.authBypass
    ? `
### 4. Authentication Bypass (OWASP A07:2021 - Identification and Authentication Failures)
- Test for weak password policies, default credentials
- Check session management (session fixation, hijacking)
- Test privilege escalation (horizontal and vertical)
- CWE-287: Improper Authentication
`
    : ""
}

${
  config.checks.sensitiveData
    ? `
### 5. Sensitive Data Exposure (OWASP A02:2021 - Cryptographic Failures)
- Check for exposed credentials, API keys, tokens in responses
- Verify encryption in transit (HTTPS) and at rest
- Test for information disclosure in error messages
- CWE-200: Exposure of Sensitive Information to an Unauthorized Actor
`
    : ""
}

${
  config.checks.securityHeaders
    ? `
### 6. Security Headers (OWASP A05:2021 - Security Misconfiguration)
- Check for missing security headers:
  * Content-Security-Policy (CSP)
  * X-Frame-Options (clickjacking protection)
  * X-Content-Type-Options (MIME sniffing)
  * Strict-Transport-Security (HSTS)
  * X-XSS-Protection
  * Referrer-Policy
- CWE-16: Configuration
`
    : ""
}

${
  config.checks.sslTls
    ? `
### 7. SSL/TLS Configuration (OWASP A02:2021 - Cryptographic Failures)
- Check SSL/TLS version (must be TLS 1.2+)
- Verify cipher suites (no weak ciphers like RC4, DES)
- Check certificate validity (not expired, proper domain)
- Test for mixed content issues
- CWE-326: Inadequate Encryption Strength
`
    : ""
}

${
  config.checks.directoryTraversal
    ? `
### 8. Directory Traversal (OWASP A01:2021 - Broken Access Control)
- Test path traversal patterns: \`../\`, \`..%2F\`, \`..%5C\`
- Attempt to access sensitive files: \`/etc/passwd\`, \`web.config\`, \`.env\`
- Check file upload functionality for malicious files
- CWE-22: Improper Limitation of a Pathname to a Restricted Directory
`
    : ""
}

**Output Format:**
Return a JSON object with this structure:
\`\`\`json
{
  "testCases": [
    {
      "type": "sql_injection" | "xss" | "csrf" | "auth_bypass" | "sensitive_data" | "security_headers" | "ssl_tls" | "directory_traversal",
      "name": "Test case name",
      "description": "What this test checks",
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "endpoint": "/api/endpoint",
      "payload": "Test payload or configuration",
      "expectedIndicators": ["Indicator 1", "Indicator 2"],
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "cwe": "CWE-XXX",
      "owasp": "OWASP category"
    }
  ]
}
\`\`\`

Focus on practical, real-world test cases that can be automated.`;
}

/**
 * Build prompt for analyzing security scan results
 */
export function buildVulnerabilityAnalysisPrompt(
  scanResults: any,
  targetUrl: string
): string {
  return `You are a cybersecurity expert analyzing security scan results.

**Target:** ${targetUrl}
**Scan Results:**
\`\`\`json
${JSON.stringify(scanResults, null, 2)}
\`\`\`

Analyze these results and identify all vulnerabilities found. For each vulnerability:

1. **Classify the vulnerability type** (SQL injection, XSS, CSRF, etc.)
2. **Assess severity** (Critical, High, Medium, Low, Info) based on:
   - Ease of exploitation
   - Impact on confidentiality, integrity, availability
   - Potential for privilege escalation or data breach
3. **Provide evidence** (exact payload, response, or configuration issue)
4. **Map to standards** (CWE identifier, OWASP category)
5. **Recommend remediation** (specific code fixes or configuration changes)
6. **Include references** (links to documentation, security guides)

**Severity Guidelines:**
- **Critical**: Direct SQL injection, RCE, authentication bypass affecting all users
- **High**: XSS, CSRF on sensitive actions, exposed credentials
- **Medium**: Missing security headers, weak SSL configuration
- **Low**: Information disclosure, non-exploitable issues
- **Info**: Best practice recommendations, no immediate risk

**Output Format:**
Return a JSON array of vulnerabilities:
\`\`\`json
[
  {
    "type": "sql_injection",
    "severity": "critical",
    "title": "SQL Injection in login endpoint",
    "description": "The login form is vulnerable to SQL injection...",
    "url": "${targetUrl}/login",
    "parameter": "username",
    "method": "POST",
    "evidence": "Payload: ' OR '1'='1 resulted in successful authentication",
    "cwe": "CWE-89",
    "owasp": "A03:2021 - Injection",
    "remediation": "Use parameterized queries or prepared statements...",
    "references": [
      "https://owasp.org/www-community/attacks/SQL_Injection",
      "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
    ]
  }
]
\`\`\`

Be thorough but only report genuine vulnerabilities, not false positives.`;
}

/**
 * Build prompt for generating security recommendations
 */
export function buildSecurityRecommendationsPrompt(
  vulnerabilities: any[],
  targetUrl: string
): string {
  const criticalCount = vulnerabilities.filter(
    (v) => v.severity === "critical"
  ).length;
  const highCount = vulnerabilities.filter((v) => v.severity === "high").length;
  const mediumCount = vulnerabilities.filter(
    (v) => v.severity === "medium"
  ).length;

  return `You are a cybersecurity consultant providing remediation guidance.

**Target:** ${targetUrl}
**Vulnerabilities Summary:**
- Critical: ${criticalCount}
- High: ${highCount}
- Medium: ${mediumCount}
- Total: ${vulnerabilities.length}

**Detected Vulnerabilities:**
\`\`\`json
${JSON.stringify(vulnerabilities, null, 2)}
\`\`\`

Provide a comprehensive security remediation plan:

1. **Immediate Actions** (Critical/High vulnerabilities - fix within 24-48h)
2. **Short-term Actions** (Medium vulnerabilities - fix within 1-2 weeks)
3. **Long-term Improvements** (Low/Info - architectural or process improvements)
4. **Security Best Practices** (prevent future vulnerabilities)
5. **Testing Strategy** (how to verify fixes and prevent regression)

For each recommendation:
- **Priority**: Urgent, High, Medium, Low
- **Action**: What needs to be done
- **Implementation**: Code examples or configuration changes
- **Verification**: How to test that the fix works
- **Resources**: Links to documentation and tools

**Output Format:**
Return a structured remediation plan in JSON:
\`\`\`json
{
  "riskScore": 0-100,
  "overallRisk": "critical" | "high" | "medium" | "low",
  "summary": "Brief executive summary",
  "immediateActions": [
    {
      "priority": "urgent",
      "vulnerability": "SQL Injection in login",
      "action": "Implement parameterized queries",
      "implementation": "Code example or configuration",
      "verification": "How to test the fix",
      "resources": ["URL1", "URL2"]
    }
  ],
  "shortTermActions": [...],
  "longTermImprovements": [...],
  "bestPractices": [
    {
      "category": "Input Validation",
      "recommendation": "...",
      "implementation": "..."
    }
  ],
  "testingStrategy": {
    "automated": "Tools and scripts to run regularly",
    "manual": "Manual testing procedures",
    "cicd": "Integration with CI/CD pipeline"
  }
}
\`\`\`

Be practical and actionable. Prioritize based on real-world risk.`;
}
