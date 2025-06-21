import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

async function findPythonExecutable() {
  const possiblePaths = ['python3', 'python', '/usr/bin/python3', '/usr/bin/python'];
  
  for (const pythonPath of possiblePaths) {
    try {
      await execAsync(`${pythonPath} --version`);
      return pythonPath;
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('Python executable not found. Please ensure Python is installed and available in PATH.');
}

function runPythonScript(args) {
  return new Promise(async (resolve, reject) => {
    try {
      const pythonExecutable = await findPythonExecutable();
      const scriptPath = path.join(process.cwd(), 'bakong_handler.py');
      
      // Check if the script file exists
      const fs = require('fs');
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Python script not found at: ${scriptPath}`);
      }
      
      // Pass environment variables to Python script
      const python = spawn(pythonExecutable, [scriptPath, ...args], {
        env: {
          ...process.env,
          // Explicitly pass the environment variables
          BAKONG_TOKEN: process.env.BAKONG_TOKEN,
          BANK_ACCOUNT: process.env.BANK_ACCOUNT,
          MERCHANT_NAME: process.env.MERCHANT_NAME,
          MERCHANT_CITY: process.env.MERCHANT_CITY,
          PHONE_NUMBER: process.env.PHONE_NUMBER,
          TERMINAL_LABEL: process.env.TERMINAL_LABEL,
          APP_CALLBACK_URL: process.env.APP_CALLBACK_URL,
          APP_ICON_URL: process.env.APP_ICON_URL,
          APP_NAME: process.env.APP_NAME,
        }
      });

      let result = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Python script exited with code ${code}. Error: ${error}`));
        }
        
        try {
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (e) {
          reject(new Error(`Failed to parse Python script output: ${result}. Parse error: ${e.message}`));
        }
      });
      
      python.on('error', (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

export async function POST(req) {
  try {
    const { amount, currency, billNumber } = await req.json();
    
    if (!amount || !currency) {
      return NextResponse.json({ 
        success: false, 
        message: "Amount and currency are required." 
      }, { status: 400 });
    }
    
    // Validate required environment variables
    const requiredEnvVars = ['BAKONG_TOKEN', 'BANK_ACCOUNT', 'PHONE_NUMBER'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required environment variables: ${missingVars.join(', ')}`
      }, { status: 500 });
    }
    
    const data = JSON.stringify({ amount, currency, billNumber });
    const result = await runPythonScript(['generate', data]);
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: result.message || 'Error generating QR code.' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('POST /api/bakong error:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const md5 = searchParams.get('md5');

    if (!md5) {
      return NextResponse.json({ 
        success: false, 
        message: "MD5 hash is required." 
      }, { status: 400 });
    }

    // Validate required environment variables
    const requiredEnvVars = ['BAKONG_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required environment variables: ${missingVars.join(', ')}`
      }, { status: 500 });
    }

    const result = await runPythonScript(['status', md5]);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: result.message || 'Error checking payment status.' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('GET /api/bakong error:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, { status: 500 });
  }
}