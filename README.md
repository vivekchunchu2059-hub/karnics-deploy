# SunarKhata - Jewellery Management System

A modern React-based web application for managing jewellery inventory, sales, invoices, and customer data.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Quick Start

```bash
# 1. Install dependencies
npm install
or
npm install --legacy-peer-deps

# 2. Start backend (Terminal 1)
cd server && node server.js

# 3. Start frontend (Terminal 2)
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

**Username:** `admin123`  
**Password:** `admin123`

Use these credentials to log in to the application.

## Steps to Execute the Project

### Prerequisites
- **Node.js** (v14 or higher) installed on your system
- **npm** (Node Package Manager) - comes with Node.js
- A code editor (VS Code recommended)

### Step 1: Clone and Navigate to Project

```bash
# If cloning from repository
git clone <repository-url>
cd Jewellery-UI

# Or if you already have the project
cd Jewellery-UI
```

### Step 2: Install Dependencies

Install all required dependencies for the project:

```bash
npm install
```

**Note:** If you encounter peer dependency issues, use:
```bash
npm install --legacy-peer-deps
```

This will install all React, Material-UI, and other required packages.

### Step 3: Start the Backend Server

Open a **terminal/command prompt** and start the Express backend server:

```bash
cd server
node server.js
```

**Expected Output:**
```
Server running on http://localhost:3001
```

**Important:** Keep this terminal window open - the backend server must remain running for the application to work.

The backend server:
- Serves the inventory API at `http://localhost:3001/api/inventory`
- Reads/writes data from `server/data/Inventory/Inventory.json`
- Handles CORS for frontend requests

### Step 4: Start the React Frontend

Open a **new terminal window** (keep the backend server running) and navigate to the project root:

```bash
npm start
```

**Expected Output:**
- The React development server will compile the application
- Your default browser will automatically open at `http://localhost:3000`
- You'll see compilation progress in the terminal

**Features:**
- ✅ Hot-reload: Changes to code automatically refresh the browser
- ✅ Error overlay: Compilation errors displayed in the browser
- ✅ Fast refresh: React components update without losing state

**Note:** If the browser doesn't open automatically, manually navigate to `http://localhost:3000`

### Step 5: Access the Application

Once both servers are running:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001/api/inventory](http://localhost:3001/api/inventory)

**Login Credentials:**
- **Username:** `admin123`
- **Password:** `admin123`

### Step 6: Stop the Servers

To stop the development servers:

**Method 1: Stop Individually (Recommended)**
- In each terminal window, press `Ctrl + C`
- Confirm with `Y` if prompted
- This gracefully shuts down each server

**Method 2: Stop All Node Processes (Windows)**
```bash
taskkill /F /IM node.exe
```

**Method 3: Stop All Node Processes (Linux/Mac)**
```bash
pkill -f node
```

## Building for Production

To create a production build of the application:

```bash
npm run build
```

This will:
- Create an optimized production build in the `build/` folder
- Minify JavaScript and CSS files
- Optimize assets for best performance
- Generate source maps for debugging

**To serve the production build locally:**
```bash
npx serve -s build
```

The production build is ready to be deployed to any static hosting service.

## Project Structure

```
Jewellery-UI/
├── public/                 # Static files (HTML, images, etc.)
├── server/                # Backend Express server
│   ├── data/              # JSON data files
│   │   ├── Inventory/
│   │   ├── Invoices/
│   │   └── Sales/
│   └── server.js          # Express server configuration
├── src/                   # React source code
│   ├── components/        # Reusable React components
│   ├── pages/            # Page components
│   │   └── Inventory/    # Inventory management module
│   ├── App.tsx           # Main App component
│   └── index.tsx         # Application entry point
├── package.json          # Project dependencies and scripts
└── README.md            # This file
```

## Troubleshooting

### Issue: Connection Refused or Cannot Connect
- ✅ Ensure the backend server is running on port 3001
- ✅ Check that both servers are started correctly
- ✅ Verify no firewall is blocking ports 3000 and 3001
- ✅ Try accessing `http://localhost:3001/api/inventory` directly in browser

### Issue: Port 3000 or 3001 Already in Use
- ✅ Stop any existing Node.js processes using those ports
- ✅ On Windows: `netstat -ano | findstr :3000` to find process, then `taskkill /PID <pid> /F`
- ✅ On Linux/Mac: `lsof -ti:3000 | xargs kill`
- ✅ Or change the port in configuration files

### Issue: Backend API Not Responding
- ✅ Ensure the backend server is running (`node server.js` in server directory)
- ✅ Check that `server/data/Inventory/Inventory.json` exists
- ✅ Verify the server console shows no errors
- ✅ Test the API endpoint: `http://localhost:3001/api/inventory`

### Issue: Module Not Found Errors
- ✅ Delete `node_modules` folder and `package-lock.json`
- ✅ Run `npm install` again
- ✅ If issues persist, try `npm install --legacy-peer-deps`

### Issue: Build Fails
- ✅ Check for TypeScript errors: `npm run build` will show compilation errors
- ✅ Ensure all imports are correct
- ✅ Verify all required files exist
- ✅ Check for syntax errors in source files

## Available Scripts

In the project directory, you can run:

### `npm start`
Starts the React development server. The app will open at `http://localhost:3000` with hot-reload enabled.

### `npm run build`
Creates an optimized production build in the `build/` folder. The build is minified and ready for deployment.

### `npm test`
Launches the test runner in interactive watch mode. See the [testing documentation](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)