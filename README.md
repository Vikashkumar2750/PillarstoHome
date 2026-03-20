# Deployment Guide: PillarstoHome Real Estate & CRM

This application is a **Full-Stack** project consisting of:
1. **Frontend:** React (Vite)
2. **Backend:** Node.js (Express)
3. **Database:** SQLite (`better-sqlite3`)

Because this app uses a custom Node.js backend and an SQLite database, **you cannot host the entire application on a standard Hostinger Shared Web Hosting plan** (which is designed primarily for PHP and static files). 

Below are the two options for deploying this application.

---

## Option 1: Full-Stack Deployment on Hostinger VPS (Recommended)

If you have a Hostinger VPS (Virtual Private Server), you can host both the frontend and the backend together on the same server. This is the recommended approach for this application.

### Step 1: Prepare Your Local App
1. Open your terminal and build the frontend:
   ```bash
   npm run build
   ```
   *This creates a `dist` folder containing your compiled React app. The Express server is configured to serve this folder in production.*

### Step 2: Set Up the VPS
1. Log in to your Hostinger VPS via SSH:
   ```bash
   ssh root@your_vps_ip
   ```
2. Install Node.js and npm (if not already installed):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   ```
3. Install PM2 (a process manager to keep your app running in the background):
   ```bash
   npm install -g pm2
   ```

### Step 3: Upload Your Files
Upload your project files to the VPS (using SFTP, FileZilla, or Git). 
**Important:** You need to upload the following:
- `server.ts`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `dist/` folder (your built frontend)
- `.env` (create this on the server with your `JWT_SECRET` and `GEMINI_API_KEY`)

*Do NOT upload the `node_modules` folder. You will install dependencies directly on the server.*

### Step 4: Install Dependencies and Start the Server
1. Navigate to your project folder on the VPS:
   ```bash
   cd /path/to/your/app
   ```
2. Install production dependencies:
   ```bash
   npm install
   ```
3. Start the backend server using PM2 and `tsx` (since the server is written in TypeScript):
   ```bash
   NODE_ENV=production pm2 start "npx tsx server.ts" --name "pillarstohome"
   ```
4. Save the PM2 process so it restarts automatically if the server reboots:
   ```bash
   pm2 save
   pm2 startup
   ```

### Step 5: Set Up Nginx Reverse Proxy
To link your domain to the Node.js app running on port 3000, you need a reverse proxy.
1. Install Nginx:
   ```bash
   apt-get install nginx
   ```
2. Create a new Nginx configuration file:
   ```bash
   nano /etc/nginx/sites-available/pillarstohome
   ```
3. Paste the following configuration (replace `yourdomain.com` with your actual domain):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. Enable the site and restart Nginx:
   ```bash
   ln -s /etc/nginx/sites-available/pillarstohome /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

Your full-stack app is now live!

---

## Option 2: Split Deployment (Frontend on Hostinger Shared Hosting)

If you only have **Hostinger Shared Hosting**, you can host the React frontend there, but you **must** host the Node.js backend (`server.ts`) on a separate Node.js hosting service like Render, Railway, or Heroku.

### Step 1: Deploy the Backend Elsewhere
1. Deploy your Node.js backend (the `server.ts` file and `package.json`) to a service like [Render.com](https://render.com) or [Railway.app](https://railway.app).
2. Once deployed, you will get a backend URL (e.g., `https://my-backend.onrender.com`).
3. **Important:** You will need to update your frontend code (any `fetch` calls to `/api/...`) to point to this new external backend URL.

### Step 2: Build the Frontend Locally
1. Open your terminal and install dependencies:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. This creates a `dist` folder containing the production-ready static files.

### Step 3: Handle Client-Side Routing for Shared Hosting
Since this app uses `react-router-dom`, you need to tell Hostinger's Apache server to redirect all requests to `index.html`. Otherwise, refreshing a page (like `/about`) will result in a 404 error.

1. Inside the newly created `dist` folder, create a file named `.htaccess`.
2. Add the following code to the `.htaccess` file:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteCond %{REQUEST_FILENAME} !-l
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Step 4: Upload to Hostinger via File Manager
1. Log in to your Hostinger account and go to **hPanel**.
2. Navigate to **Websites** -> **Manage** for your domain.
3. Scroll down to the **Files** section and click on **File Manager**.
4. Open the `public_html` directory (this is the root folder for your website).
   * *Note: If there is a default `default.php` or `index.php` file provided by Hostinger, delete it.*
5. Upload all the **contents** of your local `dist` folder (including the `.htaccess` file) directly into the `public_html` directory. 

Your frontend is now live on Hostinger and communicating with your external backend!
