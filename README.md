 # Tuleeto - Long Stays Hub
 
 A modern property rental platform built with React, Vite, TypeScript, and Supabase.
 
 ## Development
 
 ```bash
 # Install dependencies
 npm install
 
 # Start development server
 npm run dev
 
 # Build for production
 npm run build
 
 # Preview production build
 npm run preview
 ```
 
 ## Deployment
 
 This is a Single Page Application (SPA). All hosting platforms need to be configured to serve `index.html` for all routes (except static assets).
 
 ### Netlify
 
 Already configured via `netlify.toml` and `public/_redirects`. Just connect your repository and deploy.
 
 ### Vercel
 
 Already configured via `vercel.json`. Just connect your repository and deploy.
 
 ### AWS S3 + CloudFront
 
 1. **S3 Bucket Setup:**
    - Enable static website hosting
    - Set index document: `index.html`
    - Set error document: `index.html`
 
 2. **CloudFront Distribution:**
    - Create a distribution pointing to your S3 bucket
    - Configure custom error responses:
      - HTTP 403 → `/index.html` with 200 status
      - HTTP 404 → `/index.html` with 200 status
 
 3. **Recommended Cache Behaviors:**
    - `/assets/*` → Cache for 1 year (immutable hashed files)
    - `index.html` → No cache or short TTL
    - Other static files → Cache appropriately
 
 ### Self-Hosting (Nginx)
 
 ```nginx
 server {
     listen 80;
     server_name your-domain.com;
     root /var/www/tuleeto/dist;
     index index.html;
 
     # Gzip compression
     gzip on;
     gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
 
     # SPA routing - serve index.html for all routes
     location / {
         try_files $uri $uri/ /index.html;
     }
 
     # Cache hashed assets for 1 year
     location /assets/ {
         expires 1y;
         add_header Cache-Control "public, immutable";
     }
 
     # Don't cache index.html
     location = /index.html {
         add_header Cache-Control "no-cache, no-store, must-revalidate";
     }
 
     # Security headers
     add_header X-Content-Type-Options nosniff;
     add_header X-Frame-Options DENY;
     add_header X-XSS-Protection "1; mode=block";
 }
 ```
 
 ### Docker
 
 ```dockerfile
 FROM node:20-alpine AS builder
 WORKDIR /app
 COPY package*.json ./
 RUN npm ci
 COPY . .
 RUN npm run build
 
 FROM nginx:alpine
 COPY --from=builder /app/dist /usr/share/nginx/html
 COPY nginx.conf /etc/nginx/conf.d/default.conf
 EXPOSE 80
 CMD ["nginx", "-g", "daemon off;"]
 ```
 
 ## Environment Variables
 
 Create a `.env` file with:
 
 ```env
 VITE_SUPABASE_URL=your_supabase_url
 VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
 ```
 
 ## Tech Stack
 
 - **Frontend:** React 18, TypeScript, Vite
 - **Styling:** Tailwind CSS, shadcn/ui
 - **Backend:** Supabase (Auth, Database, Storage)
 - **State Management:** TanStack Query
 - **Routing:** React Router v6
 - **Image Optimization:** ImageKit