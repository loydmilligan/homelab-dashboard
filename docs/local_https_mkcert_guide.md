# Local HTTPS Setup ("Fake HTTPS") with mkcert on Ubuntu

## What is this?

This guide explains how to create **trusted HTTPS locally** on your
machine without using the internet.

It may feel like "fake HTTPS", but it is actually **real HTTPS using
your own local Certificate Authority (CA)**.

This is perfect for: - Chromecast custom receiver apps - Local
development - Avoiding Cloudflare / external services

------------------------------------------------------------------------

## Why you need this

When casting from Chrome to a custom receiver:

-   Chrome **requires HTTPS**
-   Chromecast expects a **secure origin**
-   Self-signed certs usually fail

`mkcert` solves this by creating certificates your system trusts.

------------------------------------------------------------------------

## Step 1 --- Install mkcert

Run:

``` bash
sudo apt update
sudo apt install libnss3-tools curl
```

Download mkcert:

``` bash
curl -LO https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-amd64
mv mkcert-v1.4.4-linux-amd64 mkcert
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

------------------------------------------------------------------------

## Step 2 --- Install local CA

``` bash
mkcert -install
```

This creates and installs a **local trusted certificate authority** on
your machine.

------------------------------------------------------------------------

## Step 3 --- Generate certificates

Replace with your local IP:

``` bash
mkcert localhost 127.0.0.1 192.168.1.100
```

This creates two files:

-   `localhost+2.pem` (certificate)
-   `localhost+2-key.pem` (private key)

------------------------------------------------------------------------

## Step 4 --- Use the certificate in your app

### Example: Python HTTPS server

``` bash
python3 -m http.server 8443 --bind 0.0.0.0
```

(For real HTTPS, you'd wrap with SSL --- example below)

### Example: Node.js (Express)

``` javascript
const https = require('https');
const fs = require('fs');
const app = require('express')();

app.get('/', (req, res) => {
  res.send('Hello HTTPS');
});

https.createServer({
  key: fs.readFileSync('localhost+2-key.pem'),
  cert: fs.readFileSync('localhost+2.pem')
}, app).listen(8443);
```

------------------------------------------------------------------------

## Step 5 --- Access your app

Open in browser:

    https://192.168.1.100:8443

No warnings = success ✅

------------------------------------------------------------------------

## Important notes

### Chromecast compatibility

-   Chromecast may or may not trust mkcert certificates
-   Works best when casting from Chrome on same network
-   If issues occur, use Cloudflare Tunnel (no Access)

------------------------------------------------------------------------

### Security

-   This is safe for local use only
-   Do NOT expose mkcert certs to the public internet

------------------------------------------------------------------------

## Alternative (more reliable for Chromecast)

Use:

-   Cloudflare Tunnel (HTTPS)
-   WITHOUT Cloudflare Access

------------------------------------------------------------------------

## Summary

-   mkcert = local trusted HTTPS
-   No internet required
-   Great for development and casting setups

------------------------------------------------------------------------

## TL;DR

``` bash
sudo apt install libnss3-tools
mkcert -install
mkcert localhost 192.168.x.x
```

Use generated certs in your app and serve over HTTPS.

------------------------------------------------------------------------

End of guide.
