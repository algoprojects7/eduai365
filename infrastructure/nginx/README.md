# VPS Nginx Deployment Guide for eduAI365

This guide explains how to configure a Hostinger VPS (KVM4/KVM8) to host the multi-tenant school operating system with wildcard subdomains and path-based routing.

## 1. Domain & DNS Setup

To route all current and future school subdomains to the VPS, add these DNS records to your domain provider (e.g., Cloudflare, Hostinger, GoDaddy):

| Type | Name | Value | TTL | Description |
|---|---|---|---|---|
| A | `@` | `YOUR_VPS_IP` | Auto / 3600 | Root domain (`eduai365.com`) |
| A | `*` | `YOUR_VPS_IP` | Auto / 3600 | Wildcard for schools (`*.eduai365.com`) |

*Note: The wildcard record routes `superadmin.eduai365.com`, `api.eduai365.com`, and any school subdomain (like `greenfield.eduai365.com`) to the same server.*

---

## 2. Let's Encrypt Wildcard SSL

Wildcard certificates (`*.eduai365.com`) require the **DNS-01 challenge** from Let's Encrypt, which validates control of the domain via DNS TXT records.

Install Certbot and the Cloudflare DNS plugin (if using Cloudflare):

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

Generate the wildcard certificate:

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges=dns \
  --email admin@eduai365.com \
  --agree-tos \
  -d eduai365.com \
  -d '*.eduai365.com'
```

Certbot will ask you to add a `_acme-challenge.eduai365.com` TXT record to your DNS settings. Once added and propagated, press Enter to verify and download the certificates to `/etc/letsencrypt/live/eduai365.com/`.

---

## 3. Nginx Reverse Proxy Setup

Copy the files from this directory to Nginx's configuration folders:

```bash
# Copy main config
sudo cp eduai365.conf /etc/nginx/sites-available/eduai365.conf

# Copy shared headers
sudo cp proxy_params /etc/nginx/proxy_params

# Enable the configuration
sudo ln -s /etc/nginx/sites-available/eduai365.conf /etc/nginx/sites-enabled/

# Test Nginx syntax
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx
```

---

## 4. PM2 Process Manager Setup

All 6 services run on the same server on localhost ports. Install PM2 to run them in the background and auto-restart on system boot.

Create an `ecosystem.config.js` file in the root workspace:

```javascript
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      cwd: './apps/api-gateway',
      script: 'npm run start:prod',
      env: {
        PORT: 4000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'web-landing',
      cwd: './apps/web-landing',
      script: 'npm run start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'web-admin',
      cwd: './apps/web-admin',
      script: 'npm run start',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'web-school',
      cwd: './apps/web-school',
      script: 'npm run start',
      env: {
        PORT: 3002,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'web-teacher',
      cwd: './apps/web-teacher',
      script: 'npm run start',
      env: {
        PORT: 3003,
        NEXT_PUBLIC_BASE_PATH: '/teacher',
        NODE_ENV: 'production'
      }
    },
    {
      name: 'web-student',
      cwd: './apps/web-student',
      script: 'npm run start',
      env: {
        PORT: 3004,
        NEXT_PUBLIC_BASE_PATH: '/student',
        NODE_ENV: 'production'
      }
    },
    {
      name: 'web-parent',
      cwd: './apps/web-parent',
      script: 'npm run start',
      env: {
        PORT: 3005,
        NEXT_PUBLIC_BASE_PATH: '/parent',
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Start the processes:

```bash
# Start all apps
pm2 start ecosystem.config.js

# Ensure PM2 starts on system boot
pm2 startup
pm2 save
```

---

## 5. Security & Firewall

Only expose HTTP, HTTPS, and SSH ports to the internet. Keep Next/Nest ports closed.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```
