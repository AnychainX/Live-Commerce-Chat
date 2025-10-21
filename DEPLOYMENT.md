# Deployment Guide

This guide covers deploying the Live Stream Chat System to production.

## Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Git
- Domain name (optional)
- SSL certificate (required for production)

## Environment Variables

Create a `.env` file:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
SOCKET_PORT=3001

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Socket.IO Configuration
SOCKET_PATH=/socket.io
SOCKET_RECONNECTION_ATTEMPTS=10

# Video Streaming (if using custom stream)
VIDEO_STREAM_URL=https://your-stream-url.m3u8

# Redis (for scaling)
REDIS_URL=redis://localhost:6379

# Database (for persistence)
DATABASE_URL=postgresql://user:pass@localhost:5432/chatdb

# Security
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here
```

## Local Production Build

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run start
   ```

3. **Run Socket.IO server separately**
   ```bash
   node dist/server.js
   ```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 remix

COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.ts ./server.ts

USER remix

EXPOSE 3000 3001

CMD ["npm", "run", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  remix-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    networks:
      - app-network
    restart: unless-stopped

  socket-server:
    build: .
    command: node server.js
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network
    restart: unless-stopped
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: chatdb
      POSTGRES_USER: chatuser
      POSTGRES_PASSWORD: changeme
    ports:
      - "5432:5432"
    networks:
      - app-network
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data

networks:
  app-network:
    driver: bridge

volumes:
  redis-data:
  postgres-data:
```

### Build and run

```bash
docker-compose up -d
```

## Cloud Deployment

### Vercel (Remix Frontend)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure environment variables** in Vercel dashboard

Note: Socket.IO server needs separate hosting (see below)

### Railway (Full Stack)

1. **Create account** at railway.app
2. **Create new project**
3. **Connect GitHub repo**
4. **Add Redis service**
5. **Configure environment variables**
6. **Deploy**

### Heroku (Full Stack)

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Add Redis addon**
   ```bash
   heroku addons:create heroku-redis:hobby-dev
   ```

3. **Add PostgreSQL addon**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Configure buildpacks**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### DigitalOcean (VPS)

1. **Create Droplet** (Ubuntu 22.04)

2. **SSH into server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2**
   ```bash
   npm install -g pm2
   ```

5. **Clone repo**
   ```bash
   git clone https://github.com/your-repo/live-stream-chat.git
   cd live-stream-chat
   npm install
   npm run build
   ```

6. **Create PM2 ecosystem file**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [
       {
         name: 'remix-app',
         script: 'npm',
         args: 'start',
         env: {
           NODE_ENV: 'production',
           PORT: 3000
         }
       },
       {
         name: 'socket-server',
         script: 'node',
         args: 'server.js',
         env: {
           NODE_ENV: 'production',
           PORT: 3001
         }
       }
     ]
   };
   ```

7. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

8. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/chatapp
   server {
       listen 80;
       server_name yourdomain.com;

       # Remix app
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Socket.IO
       location /socket.io/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Enable site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/chatapp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

10. **Add SSL with Certbot**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d yourdomain.com
    ```

### AWS (EC2 + Load Balancer)

1. **Launch EC2 instance** (t3.medium or larger)
2. **Configure security groups** (allow 80, 443, 3000, 3001)
3. **Install dependencies** (same as DigitalOcean)
4. **Create Application Load Balancer**
5. **Configure target groups** for Remix and Socket.IO
6. **Add SSL certificate** via AWS Certificate Manager
7. **Configure Route 53** for domain

### Kubernetes (Advanced)

See `k8s/` directory for Kubernetes manifests (not included in this version).

## Production Checklist

### Security
- [ ] Enable HTTPS/WSS
- [ ] Set up CORS properly
- [ ] Add rate limiting
- [ ] Implement authentication
- [ ] Use environment variables for secrets
- [ ] Enable CSRF protection
- [ ] Add input sanitization
- [ ] Set up security headers

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Enable HTTP/2
- [ ] Use Redis for Socket.IO adapter
- [ ] Set up database connection pooling

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging (Winston, Pino)
- [ ] Add performance monitoring (New Relic, Datadog)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure alerts
- [ ] Track metrics (Prometheus + Grafana)

### Reliability
- [ ] Set up automated backups
- [ ] Configure database replication
- [ ] Implement graceful shutdown
- [ ] Add health check endpoints
- [ ] Set up failover
- [ ] Test disaster recovery

### Compliance
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Implement GDPR compliance
- [ ] Set up audit logs
- [ ] Add data retention policies

## Scaling Strategy

### Phase 1: Single Server (0-1K users)
- Single EC2/Droplet
- In-memory storage
- No load balancer

### Phase 2: Horizontal Scaling (1K-10K users)
- Multiple app servers
- Redis for Socket.IO adapter
- PostgreSQL for persistence
- Load balancer
- CDN for static assets

### Phase 3: Microservices (10K-100K users)
- Separate chat, moderation, user services
- Message queue (RabbitMQ/Kafka)
- Distributed caching
- Auto-scaling groups
- Multi-region deployment

### Phase 4: Global Scale (100K+ users)
- Edge computing (CloudFlare Workers)
- Global database replication
- Video transcoding service
- ML-based moderation
- Dedicated ops team

## Cost Estimation

### Small (0-1K users)
- Hosting: $5-20/month (DigitalOcean, Railway)
- Total: ~$20/month

### Medium (1K-10K users)
- Hosting: $50-200/month
- Redis: $15/month
- Database: $25/month
- CDN: $10/month
- Monitoring: $20/month
- Total: ~$150-300/month

### Large (10K-100K users)
- Hosting: $500-2000/month
- Redis: $100/month
- Database: $200/month
- CDN: $100/month
- Monitoring: $100/month
- Total: ~$1,000-2,500/month

## Rollback Plan

1. **Keep previous version tagged**
   ```bash
   git tag -a v1.0.0 -m "Production release"
   ```

2. **Quick rollback with PM2**
   ```bash
   pm2 restart all --update-env
   ```

3. **Docker rollback**
   ```bash
   docker-compose down
   docker-compose up -d --build previous-image
   ```

## Maintenance

### Daily
- Monitor error rates
- Check server health
- Review logs

### Weekly
- Review performance metrics
- Check disk space
- Update dependencies (security patches)

### Monthly
- Full security audit
- Database optimization
- Review scaling needs
- Update documentation

## Support

For production issues:
1. Check logs: `pm2 logs` or `docker logs`
2. Review monitoring dashboard
3. Check GitHub issues
4. Contact support (if applicable)

## License

See LICENSE file for details.

