# Security Policy

## Supported Versions

QBENCH is actively maintained, and security updates are applied to the currently deployed version of the project.

| Version | Supported |
| ------- | --------- |
| Latest / Production | :white_check_mark: |
| Older versions | :x: |

## Reporting a Vulnerability

If you discover a security vulnerability in the QBENCH website, admin portal, API integration, or related project code, please report it responsibly.

### How to Report

Please report security issues privately by contacting:

**Email:** qbench.official@gmail.com

Please do not publicly disclose the vulnerability before it has been reviewed and addressed.

### Please Include

When reporting a vulnerability, provide as much of the following information as possible:

- A clear description of the vulnerability
- The affected page, feature, API, or component
- Steps to reproduce the issue
- Potential security impact
- Screenshots or screen recordings, if applicable
- Any relevant logs or error messages
- A suggested fix, if you have one

Please do not include passwords, API keys, authentication tokens, personal data, or other sensitive credentials in your report.

## Response Process

After receiving a vulnerability report:

1. We will review and validate the report.
2. We will acknowledge receipt as soon as reasonably possible.
3. Confirmed vulnerabilities will be prioritized according to their severity and impact.
4. Appropriate fixes or mitigations will be implemented.
5. The reporter may be contacted for additional information or verification.
6. Once resolved, the affected systems may be updated and the vulnerability considered closed.

## Responsible Disclosure

We request that security researchers:

- Avoid accessing, modifying, deleting, or exposing data that does not belong to them.
- Do not intentionally disrupt QBENCH services.
- Do not perform attacks that could affect other users or production systems.
- Do not publicly disclose a vulnerability before we have had a reasonable opportunity to investigate and address it.

Security testing should be limited to accounts, data, and systems that you are authorized to access.

## Scope

Security reports may include issues affecting:

- QBENCH public website
- QBENCH Admin Portal / CMS
- Authentication and authorization
- Supabase database and Row Level Security policies
- Storage access controls
- API and RPC endpoints
- Portfolio and project management
- Contact and project inquiry functionality
- Client-side security issues
- Sensitive information exposure

Third-party services such as Supabase, Vercel, GitHub, EmailJS, and other external platforms may have their own security reporting procedures. Vulnerabilities originating entirely within those services should generally be reported to the respective provider.

## Out of Scope

The following are generally not considered security vulnerabilities unless they demonstrate a meaningful security impact:

- UI/UX issues
- Cosmetic bugs
- Missing features
- Spam without a demonstrated security impact
- Automated scanning reports without a reproducible vulnerability
- Vulnerabilities requiring physical access to a user's device
- Issues in unsupported or obsolete versions

## Recognition

We appreciate responsible security researchers and contributors who help improve the security of QBENCH.

We may acknowledge valid security reports after the issue has been resolved, subject to the reporter's preference and applicable privacy considerations.
