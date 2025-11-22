# MongoDB Connection Guide - Complete Setup

## 📋 Prerequisites & Requirements

### System Requirements
- **Operating System**: Windows 10/11 (64-bit)
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk Space**: At least 1GB free space
- **Node.js**: Already installed (required for the application)
- **Internet Connection**: Required for MongoDB Atlas (cloud option)

### What's Already Installed in Your Project
✅ **Node.js** - Required (already installed)
✅ **npm packages** - All MongoDB-related packages are already in `package.json`:
   - `mongoose` - MongoDB ODM (Object Data Modeling)
   - `dotenv` - Environment variable management

### What You Need to Install
You have **TWO OPTIONS**:

---

## 🚀 Option 1: MongoDB Atlas (Cloud - RECOMMENDED)

### ✅ Advantages:
- ✅ No installation required
- ✅ Free tier available
- ✅ Works immediately
- ✅ No local setup needed
- ✅ Accessible from anywhere

### ❌ Requirements:
- Internet connection
- MongoDB Atlas account (free)

### Installation Steps:

#### Step 1: Create MongoDB Atlas Account
1. Go to: **https://www.mongodb.com/cloud/atlas/register**
2. Click **"Try Free"** or **"Sign Up"**
3. Fill in:
   - Email address
   - Password (strong password)
   - First & Last name
4. Click **"Create your Atlas account"**
5. Verify your email address

#### Step 2: Create Free Cluster
1. After login, click **"Build a Database"**
2. Choose **"M0 FREE"** (Free forever, no credit card required)
3. Select:
   - **Cloud Provider**: AWS (or any)
   - **Region**: Choose closest to you (e.g., `us-east-1`)
4. Click **"Create"** (takes 3-5 minutes)

#### Step 3: Create Database User
1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter:
   - **Username**: `eventadmin` (or any username)
   - **Password**: Create a strong password (SAVE THIS!)
5. Set privileges: **"Atlas admin"** or **"Read and write to any database"**
6. Click **"Add User"**

#### Step 4: Whitelist IP Address
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Add Current IP Address"** (or use `0.0.0.0/0` for development - allows all IPs)
   - ⚠️ **Note**: `0.0.0.0/0` allows access from anywhere (use only for development)
4. Click **"Confirm"**

#### Step 5: Get Connection String
1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

#### Step 6: Update Your .env File
1. Open `backend/.env` file
2. Replace the `MONGODB_URI` line with your connection string:
   ```env
   MONGODB_URI=mongodb+srv://eventadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/event-management?retryWrites=true&w=majority
   ```
   - Replace `eventadmin` with your database username
   - Replace `YOUR_PASSWORD` with your database password
   - Replace `cluster0.xxxxx.mongodb.net` with your cluster address
   - **Important**: Add `/event-management` before the `?` to specify database name

#### Step 7: Restart Backend Server
```powershell
# Stop current server (Ctrl+C)
cd backend
npm start
```

#### Step 8: Verify Connection
You should see in console:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
```

#### Step 9: Seed Default Users
```powershell
cd backend
npm run seed
```

---

## 💻 Option 2: Local MongoDB Installation

### ✅ Advantages:
- Works offline
- Full control
- No internet required
- Faster (local connection)

### ❌ Requirements:
- Local installation
- Windows service setup
- More configuration

### Installation Steps:

#### Step 1: Download MongoDB Community Server
1. Go to: **https://www.mongodb.com/try/download/community**
2. Select:
   - **Version**: Latest (7.0 or higher)
   - **Platform**: Windows
   - **Package**: MSI
3. Click **"Download"** (file size: ~200MB)

#### Step 2: Install MongoDB
1. Run the downloaded `.msi` file
2. Click **"Next"** on welcome screen
3. Accept license agreement → **"Next"**
4. Choose **"Complete"** installation → **"Next"**
5. **IMPORTANT**: Check **"Install MongoDB as a Service"**
   - Service Name: `MongoDB`
   - Service Account: **"Run service as Network Service user"**
6. **Optional**: Check **"Install MongoDB Compass"** (GUI tool - recommended)
7. Click **"Install"**
8. Wait for installation to complete
9. Click **"Finish"**

#### Step 3: Verify Installation
Open PowerShell (as Administrator) and run:
```powershell
Get-Service -Name MongoDB
```

You should see:
```
Status   Name               DisplayName
------   ----               -----------
Running  MongoDB            MongoDB
```

If not running, start it:
```powershell
Start-Service MongoDB
```

#### Step 4: Verify MongoDB is Working
Open PowerShell and run:
```powershell
mongosh
```

You should see MongoDB shell prompt. Type `exit` to quit.

#### Step 5: Update Your .env File
1. Open `backend/.env` file
2. Set the connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017/event-management
   ```
   - `localhost:27017` - Default MongoDB address and port
   - `event-management` - Database name

#### Step 6: Restart Backend Server
```powershell
# Stop current server (Ctrl+C)
cd backend
npm start
```

#### Step 7: Verify Connection
You should see in console:
```
✅ MongoDB Connected: localhost:27017
```

#### Step 8: Seed Default Users
```powershell
cd backend
npm run seed
```

---

## 📝 Environment Variables Required

Your `backend/.env` file should contain:

```env
# Server Configuration
PORT=5000

# MongoDB Configuration
# For Atlas (Cloud):
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/event-management?retryWrites=true&w=majority

# OR For Local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/event-management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
```

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] MongoDB service is running (for local) OR Atlas cluster is active (for cloud)
- [ ] `.env` file has correct `MONGODB_URI`
- [ ] Backend server shows: `✅ MongoDB Connected: ...`
- [ ] No error messages in console
- [ ] Can run `npm run seed` successfully
- [ ] Can login with seeded users

---

## 🛠️ Troubleshooting

### Issue: "Connection Refused" (Local MongoDB)
**Solution:**
```powershell
# Check if service is running
Get-Service -Name MongoDB

# If not running, start it
Start-Service MongoDB

# If service doesn't exist, reinstall MongoDB
```

### Issue: "Authentication Failed" (Atlas)
**Solutions:**
- Verify username and password in connection string
- Check if database user was created in Atlas
- Verify IP address is whitelisted in Network Access
- Make sure password doesn't contain special characters (or URL-encode them)

### Issue: "Timeout" (Atlas)
**Solutions:**
- Check internet connection
- Verify firewall isn't blocking
- Check if IP is whitelisted
- Try using `0.0.0.0/0` for development (allows all IPs)

### Issue: "Module not found: mongoose"
**Solution:**
```powershell
cd backend
npm install
```

### Issue: MongoDB Compass Not Opening (Local)
**Solution:**
- MongoDB Compass is installed separately
- Launch from Start Menu or:
```powershell
mongodb-compass
```

---

## 📦 What Gets Installed

### For MongoDB Atlas (Cloud):
- ✅ Nothing to install locally
- ✅ Just need account and connection string

### For Local MongoDB:
- ✅ MongoDB Community Server (~200MB)
- ✅ MongoDB Shell (mongosh)
- ✅ MongoDB Compass (optional GUI tool)
- ✅ Windows Service (runs automatically)

---

## 🎯 Quick Start Recommendation

**For beginners or quick setup**: Use **MongoDB Atlas** (Option 1)
- Takes 10-15 minutes
- No installation needed
- Free forever
- Works immediately

**For advanced users or offline work**: Use **Local MongoDB** (Option 2)
- Full control
- Works offline
- Requires installation

---

## 📚 Additional Resources

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- MongoDB Download: https://www.mongodb.com/try/download/community
- MongoDB Documentation: https://docs.mongodb.com/
- MongoDB Compass: https://www.mongodb.com/products/compass

---

## ✅ After Successful Connection

Once MongoDB is connected:

1. **Seed default users:**
   ```powershell
   cd backend
   npm run seed
   ```

2. **Default login credentials:**
   - Admin: `admin@example.com` / `admin123`
   - Artist: `artist@example.com` / `artist123`
   - User: `user@example.com` / `user123`

3. **The application will automatically:**
   - Switch from mock JSON data to MongoDB
   - Use real database for all operations
   - Persist data permanently

---

**Need help?** Check the server console logs for specific error messages!

