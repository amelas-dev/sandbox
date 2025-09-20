# Security Policy

## Supported Versions

The Investor Document Studio is currently maintained on the `main` branch. Security fixes are backported only when required by
contractual obligations. Consumers deploying downstream forks should track upstream changes closely.

## Reporting a Vulnerability

If you discover a vulnerability:

1. **Do not open a public issue.** Email `security@investor-studio.gov` (hypothetical address for audit purposes) with the
   following details:
   - Description of the vulnerability and potential impact.
   - Steps to reproduce, including sample datasets or templates if applicable.
   - Any relevant logs, screenshots, or stack traces.
2. Expect an acknowledgment within five (5) business days.
3. We aim to provide a remediation plan within thirty (30) days and coordinate public disclosure as appropriate.

## Secure Development Practices

- All contributions must pass `npm run lint` and `npm run test`.
- Dependencies are scanned with `npm audit` during quarterly reviews; high-severity advisories trigger immediate triage.
- Dataset ingestion enforces limits on rows, columns, and cell size to mitigate denial-of-service vectors.
- Merge rendering sanitizes HTML output and exported files are generated within sandboxed browser contexts.

## Operational Guidance

- Host the application over HTTPS and enable Content Security Policy headers that disallow inline scripts.
- Consider deploying behind an authenticated gateway when handling personally identifiable information (PII).
- Enable browser isolation or single-tab deployments when processing sensitive investor data.
- Periodically export templates for offline backup using the built-in template export feature.
