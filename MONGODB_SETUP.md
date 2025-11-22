# MongoDB Connection Guide

## Option 1: MongoDB Atlas (Cloud - Recommended for Quick Setup)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Verify your email

### Step 2: Create a Free Cluster
1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (Free forever)
3. Select a cloud provider and region (choose closest to you)
4. Click **"Create"** (takes 3-5 minutes)

### Step 3: Create Database User
1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `eventadmin`)
5. Enter a strong password (save this!)
6. Set privileges to **"Atlas admin"** or **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Whitelist Your IP Address
1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Add Current IP Address"** (or use `0.0.0.0/0` for development - allows all IPs)
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update .env File
Replace `<username>` and `<password>` with your database user credentials:
```
MONGODB_URI=mongodb+srv://eventadmin:yourpassword@cluster0.xxxxx.mongodb.net/event-management?retryWrites=true&w=majority
```

**Note:** Add `/event-management` before the `?` to specify the database name.

---

## Option 2: Local MongoDB Installation

### Step 1: Download MongoDB
1. Go to https://www.mongodb.com/try/download/community
2. Select:
   - Version: Latest (7.0+)
   - Platform: Windows
   - Package: MSI
3. Click **"Download"**

### Step 2: Install MongoDB
1. Run the downloaded `.msi` file
2. Choose **"Complete"** installation
3. Check **"Install MongoDB as a Service"**
4. Select **"Run service as Network Service user"**
5. Check **"Install MongoDB Compass"** (GUI tool - optional but helpful)
6. Click **"Install"**

### Step 3: Verify Installation
Open PowerShell and run:
```powershell
Get-Service -Name MongoDB
```

You should see the service running.

### Step 4: Update .env File
Your `.env` file should have:
```
MONGODB_URI=mongodb://localhost:27017/event-management
```

---

## After Setting Up MongoDB

### 1. Restart Backend Server
```powershell
# Stop current server (Ctrl+C if running in terminal)
# Then restart:
cd backend
npm start
```

### 2. Verify Connection
You should see in the console:
```
MongoDB Connected: localhost:27017
```
or
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
```

### 3. Seed Default Users
```powershell
cd backend
npm run seed
```

This will create:
- **Site Admin**: admin@example.com / admin123
- **Artist**: artist@example.com / artist123
- **Regular User**: user@example.com / user123

---

## Troubleshooting

### Connection Refused Error
- **Local MongoDB**: Make sure MongoDB service is running
  ```powershell
  Start-Service MongoDB
  ```

### Authentication Failed (Atlas)
- Check username and password in connection string
- Verify database user was created in Atlas
- Check IP whitelist includes your current IP

### Timeout Errors
- Check internet connection (for Atlas)
- Verify firewall isn't blocking MongoDB port (27017 for local)
- For Atlas: Check if IP is whitelisted

### Still Having Issues?
Check the backend server logs for specific error messages.

