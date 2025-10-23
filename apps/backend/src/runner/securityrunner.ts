/**
 * Security Test Runner - OWASP Security Scanner
 * Performs automated security testing based on OWASP Top 10
 */

import { PrismaClient } from "@prisma/client";
import axios, { AxiosRequestConfig } from "axios";
import * as https from "https";

const prisma = new PrismaClient();

interface SecurityCheckResult {
  type: string;
  passed: boolean;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  title?: string;
  description?: string;
  evidence?: string;
  remediation?: string;
}

/**
 * Execute a security test
 */
export async function executeSecurityTest(testId: string): Promise<void> {
  const test = await prisma.securityTest.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw new Error(`Security test ${testId} not found`);
  }

  // Create a new run
  const run = await prisma.securityTestRun.create({
    data: {
      securityTestId: testId,
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    // Update test status
    await prisma.securityTest.update({
      where: { id: testId },
      data: { status: "running" },
    });

    const results: SecurityCheckResult[] = [];
    let vulnerabilitiesFound = 0;
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let infoCount = 0;

    // Execute enabled security checks
    if (test.checkSqlInjection) {
      const sqlResults = await checkSqlInjection(
        test.targetUrl,
        test.authType,
        test.authConfig
      );
      results.push(...sqlResults);
    }

    if (test.checkXss) {
      const xssResults = await checkXss(
        test.targetUrl,
        test.authType,
        test.authConfig
      );
      results.push(...xssResults);
    }

    if (test.checkCsrf) {
      const csrfResults = await checkCsrf(
        test.targetUrl,
        test.authType,
        test.authConfig
      );
      results.push(...csrfResults);
    }

    if (test.checkSecurityHeaders) {
      const headerResults = await checkSecurityHeaders(test.targetUrl);
      results.push(...headerResults);
    }

    if (test.checkSslTls) {
      const sslResults = await checkSslTls(test.targetUrl);
      results.push(...sslResults);
    }

    if (test.checkSensitiveData) {
      const sensitiveResults = await checkSensitiveData(
        test.targetUrl,
        test.authType,
        test.authConfig
      );
      results.push(...sensitiveResults);
    }

    if (test.checkAuthBypass) {
      const authResults = await checkAuthBypass(
        test.targetUrl,
        test.authType,
        test.authConfig
      );
      results.push(...authResults);
    }

    if (test.checkDirectoryTraversal) {
      const traversalResults = await checkDirectoryTraversal(
        test.targetUrl,
        test.authType,
        test.authConfig
      );
      results.push(...traversalResults);
    }

    // Count vulnerabilities by severity
    const vulnerabilities = results.filter((r) => !r.passed);
    vulnerabilitiesFound = vulnerabilities.length;

    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case "critical":
          criticalCount++;
          break;
        case "high":
          highCount++;
          break;
        case "medium":
          mediumCount++;
          break;
        case "low":
          lowCount++;
          break;
        case "info":
          infoCount++;
          break;
      }

      // Create vulnerability record
      await prisma.vulnerability.create({
        data: {
          runId: run.id,
          type: vuln.type,
          severity: vuln.severity || "info",
          title: vuln.title || `${vuln.type} vulnerability detected`,
          description: vuln.description || "No description available",
          url: test.targetUrl,
          evidence: vuln.evidence,
          remediation: vuln.remediation,
          cwe: getCweId(vuln.type),
          owasp: getOwaspCategory(vuln.type),
        },
      });
    }

    // Calculate risk score (0-100)
    const riskScore = calculateRiskScore(
      criticalCount,
      highCount,
      mediumCount,
      lowCount
    );

    // Update run with results
    await prisma.securityTestRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        totalChecks: results.length,
        vulnerabilitiesFound,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        infoCount,
        riskScore,
        scanResults: results as any,
      },
    });

    // Update test
    await prisma.securityTest.update({
      where: { id: testId },
      data: {
        status: "completed",
        lastRunAt: new Date(),
      },
    });

    console.log(
      `Security test ${testId} completed. Found ${vulnerabilitiesFound} vulnerabilities.`
    );
  } catch (error: any) {
    console.error(`Security test ${testId} failed:`, error);

    await prisma.securityTestRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        error: error.message,
      },
    });

    await prisma.securityTest.update({
      where: { id: testId },
      data: { status: "failed" },
    });

    throw error;
  }
}

/**
 * Check for SQL Injection vulnerabilities
 */
async function checkSqlInjection(
  targetUrl: string,
  authType?: string | null,
  authConfig?: any
): Promise<SecurityCheckResult[]> {
  const results: SecurityCheckResult[] = [];

  // Common SQL injection payloads
  const payloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "admin' --",
    "admin' #",
    "' UNION SELECT NULL--",
    "1' AND '1'='1",
    "1' AND '1'='2",
  ];

  try {
    const config = buildAxiosConfig(authType, authConfig);

    // Test common parameters
    const testParams = ["id", "user", "username", "email", "search", "q"];

    for (const param of testParams) {
      for (const payload of payloads) {
        try {
          const testUrl = `${targetUrl}?${param}=${encodeURIComponent(
            payload
          )}`;
          const response = await axios.get(testUrl, {
            ...config,
            timeout: 5000,
          });

          // Check for SQL error messages
          const body = JSON.stringify(response.data).toLowerCase();
          const sqlErrors = [
            "sql syntax",
            "mysql",
            "postgresql",
            "ora-",
            "sqlite",
            "syntax error",
            "unclosed quotation",
            "quoted string not properly terminated",
          ];

          const hasSqlError = sqlErrors.some((err) => body.includes(err));

          if (hasSqlError) {
            results.push({
              type: "sql_injection",
              passed: false,
              severity: "critical",
              title: `SQL Injection vulnerability in parameter '${param}'`,
              description: `The parameter '${param}' is vulnerable to SQL injection. SQL error messages were detected in the response.`,
              evidence: `Payload: ${payload}\nResponse contains SQL error indicators`,
              remediation:
                "Use parameterized queries or prepared statements. Never concatenate user input into SQL queries.",
            });
            break; // Found vulnerability for this parameter
          }
        } catch (error) {
          // Ignore request errors, continue testing
        }
      }
    }

    // If no vulnerabilities found
    if (results.length === 0) {
      results.push({
        type: "sql_injection",
        passed: true,
      });
    }
  } catch (error: any) {
    console.error("SQL injection check failed:", error.message);
  }

  return results;
}

/**
 * Check for XSS vulnerabilities
 */
async function checkXss(
  targetUrl: string,
  authType?: string | null,
  authConfig?: any
): Promise<SecurityCheckResult[]> {
  const results: SecurityCheckResult[] = [];

  // Common XSS payloads
  const payloads = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "<svg onload=alert(1)>",
    "javascript:alert(1)",
    '"><script>alert(1)</script>',
  ];

  try {
    const config = buildAxiosConfig(authType, authConfig);
    const testParams = ["q", "search", "name", "comment", "message"];

    for (const param of testParams) {
      for (const payload of payloads) {
        try {
          const testUrl = `${targetUrl}?${param}=${encodeURIComponent(
            payload
          )}`;
          const response = await axios.get(testUrl, {
            ...config,
            timeout: 5000,
          });

          // Check if payload is reflected unescaped
          const body =
            typeof response.data === "string"
              ? response.data
              : JSON.stringify(response.data);

          if (
            body.includes(payload) ||
            body.includes(
              payload.replace(/</g, "&lt;").replace(/>/g, "&gt;")
            ) === false
          ) {
            results.push({
              type: "xss",
              passed: false,
              severity: "high",
              title: `XSS vulnerability in parameter '${param}'`,
              description: `The parameter '${param}' reflects user input without proper encoding, making it vulnerable to XSS attacks.`,
              evidence: `Payload: ${payload}\nPayload was reflected in the response`,
              remediation:
                "Encode all user input before displaying it. Use Content-Security-Policy headers.",
            });
            break;
          }
        } catch (error) {
          // Ignore request errors
        }
      }
    }

    if (results.length === 0) {
      results.push({
        type: "xss",
        passed: true,
      });
    }
  } catch (error: any) {
    console.error("XSS check failed:", error.message);
  }

  return results;
}

/**
 * Check for CSRF protection
 */
async function checkCsrf(
  targetUrl: string,
  authType?: string | null,
  authConfig?: any
): Promise<SecurityCheckResult[]> {
  const results: SecurityCheckResult[] = [];

  try {
    const config = buildAxiosConfig(authType, authConfig);
    const response = await axios.get(targetUrl, { ...config, timeout: 5000 });

    // Check for CSRF token in response (forms, meta tags)
    const body =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
    const hasCsrfToken =
      body.includes("csrf") ||
      body.includes("_token") ||
      body.includes("authenticity_token");

    // Check SameSite cookie attribute
    const cookies = response.headers["set-cookie"] || [];
    const hasSameSite = cookies.some((cookie: string) =>
      cookie.toLowerCase().includes("samesite=")
    );

    if (!hasCsrfToken && !hasSameSite) {
      results.push({
        type: "csrf",
        passed: false,
        severity: "high",
        title: "Missing CSRF protection",
        description:
          "No CSRF tokens detected and cookies lack SameSite attribute.",
        evidence:
          "No CSRF token found in HTML forms or cookies lack SameSite=Strict/Lax",
        remediation:
          "Implement CSRF tokens for state-changing requests. Set SameSite=Strict or SameSite=Lax on session cookies.",
      });
    } else {
      results.push({
        type: "csrf",
        passed: true,
      });
    }
  } catch (error: any) {
    console.error("CSRF check failed:", error.message);
  }

  return results;
}

/**
 * Check security headers
 */
async function checkSecurityHeaders(
  targetUrl: string
): Promise<SecurityCheckResult[]> {
  const results: SecurityCheckResult[] = [];

  try {
    const response = await axios.get(targetUrl, { timeout: 5000 });
    const headers = response.headers;

    // Required security headers
    const requiredHeaders = {
      "content-security-policy": {
        severity: "medium" as const,
        title: "Missing Content-Security-Policy header",
        description:
          "CSP header helps prevent XSS attacks by controlling which resources can be loaded.",
        remediation: "Add header: Content-Security-Policy: default-src 'self'",
      },
      "x-frame-options": {
        severity: "medium" as const,
        title: "Missing X-Frame-Options header",
        description: "This header prevents clickjacking attacks.",
        remediation: "Add header: X-Frame-Options: DENY or SAMEORIGIN",
      },
      "x-content-type-options": {
        severity: "low" as const,
        title: "Missing X-Content-Type-Options header",
        description: "Prevents MIME-sniffing attacks.",
        remediation: "Add header: X-Content-Type-Options: nosniff",
      },
      "strict-transport-security": {
        severity: "high" as const,
        title: "Missing Strict-Transport-Security header",
        description:
          "HSTS header ensures the site is only accessed over HTTPS.",
        remediation:
          "Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains",
      },
    };

    for (const [headerName, config] of Object.entries(requiredHeaders)) {
      if (!headers[headerName] && !headers[headerName.toLowerCase()]) {
        results.push({
          type: "security_headers",
          passed: false,
          severity: config.severity,
          title: config.title,
          description: config.description,
          evidence: `Header '${headerName}' is missing from the response`,
          remediation: config.remediation,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        type: "security_headers",
        passed: true,
      });
    }
  } catch (error: any) {
    console.error("Security headers check failed:", error.message);
  }

  return results;
}

/**
 * Check SSL/TLS configuration
 */
async function checkSslTls(targetUrl: string): Promise<SecurityCheckResult[]> {
  const results: SecurityCheckResult[] = [];

  try {
    if (!targetUrl.startsWith("https://")) {
      results.push({
        type: "ssl_tls",
        passed: false,
        severity: "critical",
        title: "Site not using HTTPS",
        description:
          "The target URL is not using HTTPS, all traffic is transmitted in plaintext.",
        evidence: `URL scheme: ${targetUrl.split(":")[0]}`,
        remediation:
          "Enable HTTPS with a valid SSL/TLS certificate. Redirect all HTTP traffic to HTTPS.",
      });
    } else {
      // Try to connect with strict SSL verification
      try {
        await axios.get(targetUrl, { timeout: 5000 });
        results.push({
          type: "ssl_tls",
          passed: true,
        });
      } catch (error: any) {
        if (
          error.code === "CERT_HAS_EXPIRED" ||
          error.code === "DEPTH_ZERO_SELF_SIGNED_CERT"
        ) {
          results.push({
            type: "ssl_tls",
            passed: false,
            severity: "high",
            title: "Invalid SSL/TLS certificate",
            description: "The SSL/TLS certificate is expired or self-signed.",
            evidence: error.message,
            remediation:
              "Install a valid SSL/TLS certificate from a trusted CA.",
          });
        }
      }
    }
  } catch (error: any) {
    console.error("SSL/TLS check failed:", error.message);
  }

  return results;
}

/**
 * Check for sensitive data exposure
 */
async function checkSensitiveData(
  targetUrl: string,
  authType?: string | null,
  authConfig?: any
): Promise<SecurityCheckResult[]> {
  const results: SecurityCheckResult[] = [];

  try {
    const config = buildAxiosConfig(authType, authConfig);
    const response = await axios.get(targetUrl, { ...config, timeout: 5000 });

    const body = JSON.stringify(response.data).toLowerCase();

    // Patterns indicating sensitive data exposure
    const sensitivePatterns = [
      { pattern: /password.*:.*['"]/i, name: "password" },
      { pattern: /api[_-]?key.*:.*['"]/i, name: "API key" },
      { pattern: /secret.*:.*['"]/i, name: "secret" },
      { pattern: /token.*:.*['"]/i, name: "token" },
      { pattern: /aws.*key/i, name: "AWS credentials" },
      { pattern: /bearer [a-z0-9_\-\.]+/i, name: "bearer token" },
    ];

    for (const { pattern, name } of sensitivePatterns) {
      if (pattern.test(body)) {
        results.push({
          type: "sensitive_data",
          passed: false,
          severity: "critical",
          title: `Sensitive data exposure: ${name}`,
          description: `The response contains what appears to be ${name}, which should never be exposed to clients.`,
          evidence: `Pattern matched: ${pattern.toString()}`,
          remediation: `Remove ${name} from API responses. Store secrets securely and never return them to clients.`,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        type: "sensitive_data",
        passed: true,
      });
    }
  } catch (error: any) {
    console.error("Sensitive data check failed:", error.message);
  }

  return results;
}

/**
 * Check for authentication bypass
 */
async function checkAuthBypass(
  targetUrl: string,
  authType?: string | null,
  authConfig?: any
): Promise<SecurityCheckResult[]> {
  const results: SecurityCheckResult[] = [];

  try {
    // Try accessing without authentication
    const unauthResponse = await axios.get(targetUrl, {
      timeout: 5000,
      validateStatus: () => true, // Accept any status
    });

    // Try with authentication
    const config = buildAxiosConfig(authType, authConfig);
    const authResponse = await axios.get(targetUrl, {
      ...config,
      timeout: 5000,
      validateStatus: () => true,
    });

    // If both requests succeed with similar responses, might indicate auth bypass
    if (unauthResponse.status === 200 && authResponse.status === 200) {
      const unauthBody = JSON.stringify(unauthResponse.data);
      const authBody = JSON.stringify(authResponse.data);

      if (unauthBody === authBody) {
        results.push({
          type: "auth_bypass",
          passed: false,
          severity: "high",
          title: "Potential authentication bypass",
          description:
            "The endpoint returns the same response with and without authentication.",
          evidence:
            "Unauthenticated request returned 200 OK with same content as authenticated request",
          remediation:
            "Ensure all protected endpoints require and validate authentication tokens.",
        });
      }
    }

    if (results.length === 0) {
      results.push({
        type: "auth_bypass",
        passed: true,
      });
    }
  } catch (error: any) {
    console.error("Auth bypass check failed:", error.message);
  }

  return results;
}

/**
 * Check for directory traversal vulnerabilities
 */
async function checkDirectoryTraversal(
  targetUrl: string,
  authType?: string | null,
  authConfig?: any
): Promise<SecurityCheckResult[]> {
  const results: SecurityCheckResult[] = [];

  const payloads = [
    "../",
    "..%2F",
    "..%5C",
    "../../../etc/passwd",
    "..\\..\\..\\windows\\win.ini",
    "%2e%2e%2f",
  ];

  try {
    const config = buildAxiosConfig(authType, authConfig);
    const testParams = ["file", "path", "document", "page", "template"];

    for (const param of testParams) {
      for (const payload of payloads) {
        try {
          const testUrl = `${targetUrl}?${param}=${encodeURIComponent(
            payload
          )}`;
          const response = await axios.get(testUrl, {
            ...config,
            timeout: 5000,
          });

          const body =
            typeof response.data === "string"
              ? response.data
              : JSON.stringify(response.data);

          // Check for signs of file system access
          const fileSystemIndicators = [
            "root:",
            "[extensions]",
            "This program cannot be run",
            "/etc/passwd",
            "win.ini",
          ];

          if (
            fileSystemIndicators.some((indicator) => body.includes(indicator))
          ) {
            results.push({
              type: "directory_traversal",
              passed: false,
              severity: "critical",
              title: `Directory traversal vulnerability in parameter '${param}'`,
              description:
                "The application allows access to files outside the intended directory.",
              evidence: `Payload: ${payload}\nResponse contains file system indicators`,
              remediation:
                "Validate and sanitize file paths. Use a whitelist of allowed files. Never pass user input directly to file system operations.",
            });
            break;
          }
        } catch (error) {
          // Ignore request errors
        }
      }
    }

    if (results.length === 0) {
      results.push({
        type: "directory_traversal",
        passed: true,
      });
    }
  } catch (error: any) {
    console.error("Directory traversal check failed:", error.message);
  }

  return results;
}

/**
 * Build Axios configuration with authentication
 */
function buildAxiosConfig(
  authType?: string | null,
  authConfig?: any
): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    httpsAgent: new https.Agent({
      rejectUnauthorized: false, // Allow self-signed certs for testing
    }),
  };

  if (authType && authConfig) {
    switch (authType) {
      case "basic":
        config.auth = {
          username: authConfig.username,
          password: authConfig.password,
        };
        break;
      case "bearer":
        config.headers = {
          Authorization: `Bearer ${authConfig.token}`,
        };
        break;
      case "cookie":
        config.headers = {
          Cookie: authConfig.cookies,
        };
        break;
    }
  }

  return config;
}

/**
 * Get CWE ID for vulnerability type
 */
function getCweId(type: string): string {
  const cweMap: Record<string, string> = {
    sql_injection: "CWE-89",
    xss: "CWE-79",
    csrf: "CWE-352",
    auth_bypass: "CWE-287",
    sensitive_data: "CWE-200",
    security_headers: "CWE-16",
    ssl_tls: "CWE-326",
    directory_traversal: "CWE-22",
  };

  return cweMap[type] || "CWE-000";
}

/**
 * Get OWASP category for vulnerability type
 */
function getOwaspCategory(type: string): string {
  const owaspMap: Record<string, string> = {
    sql_injection: "A03:2021 - Injection",
    xss: "A03:2021 - Injection",
    csrf: "A01:2021 - Broken Access Control",
    auth_bypass: "A07:2021 - Identification and Authentication Failures",
    sensitive_data: "A02:2021 - Cryptographic Failures",
    security_headers: "A05:2021 - Security Misconfiguration",
    ssl_tls: "A02:2021 - Cryptographic Failures",
    directory_traversal: "A01:2021 - Broken Access Control",
  };

  return owaspMap[type] || "Unknown";
}

/**
 * Calculate risk score (0-100) based on vulnerability counts
 */
function calculateRiskScore(
  critical: number,
  high: number,
  medium: number,
  low: number
): number {
  // Weighted scoring: Critical=40, High=25, Medium=15, Low=5
  const score = critical * 40 + high * 25 + medium * 15 + low * 5;

  // Cap at 100
  return Math.min(score, 100);
}
