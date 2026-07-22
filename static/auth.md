# auth.md — najib.id

> Agent authentication & registration metadata for **https://najib.id**,
> the personal blog and portfolio of Faiq Najib Al-Aziz (Backend Developer,
> Independent Builder & Educator).

## Audience

This document is intended for **AI agents and automated clients** that want to
discover how to authenticate against, and register with, the `najib.id`
service surface.

## Resources & protection model

- Public, read-only content (pages, the writing archive, the RSS feed and the
  sitemap) is **not** protected and needs no access token.
- The machine API surface under `https://najib.id/api/` and the MCP server at
  `https://najib.id/mcp` are **OAuth 2.0 protected resources** and require a
  bearer access token obtained from the authorization server below.

## OAuth 2.0 authorization server

| Field | Value |
| --- | --- |
| Issuer | `https://najib.id` |
| Authorization server metadata | `https://najib.id/.well-known/oauth-authorization-server` |
| Protected resource metadata | `https://najib.id/.well-known/oauth-protected-resource` |
| JSON Web Key Set (JWKS) | `https://najib.id/.well-known/jwks.json` |
| Registration endpoint | `https://najib.id/oauth/register` |
| Token endpoint | `https://najib.id/oauth/token` |
| Revocation endpoint | `https://najib.id/oauth/revoke` |

## Supported grants

- `client_credentials` — for autonomous agents and service-to-service access.
- `authorization_code` with PKCE (`S256`) — for interactive, user-bound agents.
- `refresh_token` — to renew short-lived access tokens.

Scopes: `read` (default for content access), `write` (submit to the contact
endpoint), `offline_access` (issue refresh tokens).

## Agent registration

Agents can register using one of two methods:

1. **Dynamic registration (preferred).** `POST https://najib.id/oauth/register`
   per [RFC 7591](https://www.rfc-editor.org/rfc/rfc7591) to obtain a
   `client_id` (and `client_secret` for confidential clients).
2. **Manual registration.** Use the contact form at
   https://najib.id/contact/ to request credentials, including the intended
   use case and callback/redirect URIs.

## Agent identity (agent_auth)

The authorization server advertises an `agent_auth` block in its metadata at
`/.well-known/oauth-authorization-server`. Supported identity types:

- **`identity_assertion`** — supports
  `urn:ietf:params:oauth:token-type:id-jag` (ID-JAG) and `verified_email`
  assertion types. Claims are published at `https://najib.id/oauth/claims`.
- **`anonymous`** — short-lived bearer credentials for read-only, unattended
  access; no user identity required.

Credential types supported: `bearer` (access tokens presented in the
`Authorization: Bearer` header). Revocation events are published via
`https://najib.id/oauth/revoke` (`events_supported`: `token_revoked`).

## Presenting credentials

Send the access token on every protected request:

```http
GET /api/status HTTP/1.1
Host: najib.id
Authorization: Bearer <access_token>
```

On a missing or invalid token the resource server responds with
`401 Unauthorized` and a `WWW-Authenticate: Bearer` challenge pointing to the
protected-resource metadata.

## Reference skills

See `https://najib.id/.well-known/agent-skills/index.json` for machine-readable
skills, including `explore-writing`, which documents how to interact with the
content API.

## Status

Implementation note: discovery metadata is published and authoritative. The
OAuth endpoints (`/oauth/*`) and the MCP server (`/mcp`) are being rolled out;
public content is fully available now. Report issues via
https://najib.id/contact/.
