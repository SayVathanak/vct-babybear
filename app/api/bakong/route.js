import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Finds the correct Python command by trying 'python3' first (for Vercel)
 * and falling back to 'python' (for local Windows).
 * @returns {Promise<string>} The name of the executable ('python3' or 'python').
 */
async function findPythonExecutable() {
  // First, try 'python3' which is standard on Vercel and Linux/macOS
  try {
    await execAsync('python3 --version');
    return 'python3';
  } catch (error) {
    // If 'python3' fails, try 'python' which is common on Windows
    console.log("Log: 'python3' not found, falling back to 'python'.");
    try {
      await execAsync('python --version');
      return 'python';
    } catch (fallbackError) {
      // If both fail, throw an error
      throw new Error('Python executable not found. Please ensure Python is installed and in the system PATH.');
    }
  }
}

/**
 * Runs the bakong_handler.py script with the given arguments.
 * @param {string[]} args - The arguments to pass to the Python script.
 * @returns {Promise<object>} The parsed JSON output from the script.
 */
function runPythonScript(args) {
  return new Promise(async (resolve, reject) => {
    try {
      // This will now return 'python3' on Vercel and 'python' on your PC
      const pythonExecutable = await findPythonExecutable();
      const scriptPath = path.join(process.cwd(), 'bakong_handler.py');

      // Check if the script file exists
      if (!fs.existsSync(scriptPath)) {
        return reject(new Error(`Python script not found at: ${scriptPath}`));
      }

      // Spawn the Python process
      const python = spawn(pythonExecutable, [scriptPath, ...args], {
        // Pass all necessary environment variables from the Vercel/local environment
        env: {
          ...process.env,
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
          return reject(new Error(`Python script exited with code ${code}. Stderr: ${error}`));
        }
        try {
          // The script should print a single JSON string to stdout
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (e) {
          reject(new Error(`Failed to parse Python script output. Raw output: "${result}". Parse error: ${e.message}`));
        }
      });

      python.on('error', (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });

    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Handles POST requests to generate a new KHQR code.
 * Expects { amount, currency, billNumber } in the request body.
 */
export async function POST(req) {
  try {
    const { amount, currency, billNumber } = await req.json(); //

    if (!amount || !currency) { //
      return NextResponse.json({
        success: false,
        message: "Amount and currency are required." //
      }, { status: 400 });
    }

    // Validate that required environment variables are set on the server
    const requiredEnvVars = ['BAKONG_TOKEN', 'BANK_ACCOUNT', 'PHONE_NUMBER']; //
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]); //
    if (missingVars.length > 0) { //
      console.error(`Server configuration error: Missing env vars: ${missingVars.join(', ')}`);
      return NextResponse.json({
        success: false,
        message: `Server configuration error: Missing required environment variables: ${missingVars.join(', ')}` //
      }, { status: 500 });
    }

    const data = JSON.stringify({ amount, currency, billNumber }); //
    const result = await runPythonScript(['generate', data]); //

    if (result.success) {
      return NextResponse.json(result, { status: 200 }); //
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Error generating QR code.' //
      }, { status: 500 });
    }

  } catch (error) {
    console.error('POST /api/bakong error:', error);
    return NextResponse.json({
      success: false,
      message: `Server error: ${error.message}` //
    }, { status: 500 });
  }
}

/**
 * Handles GET requests to check the payment status of a transaction.
 * Expects md5 hash as a URL query parameter (e.g., /api/bakong?md5=...).
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const md5 = searchParams.get('md5'); //

    if (!md5) {
      return NextResponse.json({
        success: false,
        message: "MD5 hash is required." //
      }, { status: 400 });
    }

    // Validate that required environment variables are set on the server
    const requiredEnvVars = ['BAKONG_TOKEN']; //
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]); //
    if (missingVars.length > 0) { //
       console.error(`Server configuration error: Missing env vars: ${missingVars.join(', ')}`);
       return NextResponse.json({
        success: false,
        message: `Server configuration error: Missing required environment variables: ${missingVars.join(', ')}` //
      }, { status: 500 });
    }

    const result = await runPythonScript(['status', md5]); //

    if (result.success) {
      return NextResponse.json(result, { status: 200 }); //
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Error checking payment status.' //
      }, { status: 500 });
    }

  } catch (error) {
    console.error('GET /api/bakong error:', error);
    return NextResponse.json({
      success: false,
      message: `Server error: ${error.message}` //
    }, { status: 500 });
  }
}