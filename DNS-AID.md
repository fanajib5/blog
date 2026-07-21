# DNS-AID setup for najib.id (Cloudflare)

DNS for AI Discovery (DNS-AID) records live at the **DNS provider**, not in
this repository. They cannot be published from a static deploy. This file is
the runbook for adding them on **Cloudflare DNS** and enabling DNSSEC so the
records are returned as authenticated data by validating resolvers.

Spec: <https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/>
SVCB/HTTPS parameters: <https://www.rfc-editor.org/rfc/rfc9460>

## 1. Enable DNSSEC (one click on Cloudflare)

Cloudflare DNS → **najib.id** → **DNS Settings** → **DNSSEC** → **Enable DNSSEC**.
Cloudflare manages key rollover automatically and gives you the DS record to
publish at the registrar (`.id` / PANDI). Publish that DS record at the
registrar so the chain validates end-to-end.

> DNSSEC is a hard requirement for DNS-AID: validating resolvers only treat
> discovery data as authoritative once the zone is signed.

## 2. Add the discovery namespace

Create the `_agents` label so records resolve as
`<name>._agents.najib.id`.

### Index endpoint (points agents at the catalog/skills)

On Cloudflare DNS add a custom record of type **SVCB** (or **HTTPS** for an
HTTPS endpoint). Cloudflare's dashboard supports SVCB/HTTPS via the "TXT-like"
advanced record editor — choose type `SVCB`:

```
Name:    _index._agents.najib.id
Type:    SVCB
TTL:     3600  (or Auto)
Priority: 1
Target:  najib.id
Value:   alpn="https" port=443 mandatory=alpn,port
```

### A2A / agent endpoint

```
Name:    _a2a._agents.najib.id
Type:    SVCB
TTL:     3600
Priority: 1
Target:  najib.id
Value:   alpn="a2a,https" port=443 mandatory=alpn,port
```

### MCP endpoint

```
Name:    _mcp._agents.najib.id
Type:    HTTPS
TTL:     3600
Priority: 1
Target:  najib.id
Value:   alpn="h2" port=443 mandatory=alpn,port
```

The `alpn` and `port` connection parameters follow RFC 9460. Experimental
DNS-AID–specific parameters should use numeric `keyNNNNN` SvcParamKey names
until IANA registers them.

## 3. Verify

```bash
# via Cloudflare DoH
curl -sH 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=_index._agents.najib.id&type=SVCB' | jq

# via Google DoH (fallback)
curl -s 'https://dns.google/resolve?name=_a2a._agents.najib.id&type=SVCB' | jq

# confirm DNSSEC AD bit
dig +dnssec _index._agents.najib.id SVCB @1.1.1.1
```

A passing result shows `Status: 0` with the SVCB RDATA, and `dig` shows the
`ad` (authenticated data) flag once DNSSEC is active end-to-end.

## 4. Re-scan

```bash
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://najib.id"}' | jq '.checks.discoverability.dnsAid'
```

Expect `"status": "pass"`.
