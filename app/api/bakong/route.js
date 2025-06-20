import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

function runPythonScript(args) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'bakong_handler.py');
    
    // Pass environment variables to Python script
    const python = spawn('python', [scriptPath, ...args], {
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
    python.stdout.on('data', (data) => result += data.toString());
    python.stderr.on('data', (data) => error += data.toString());
    python.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Python Error: ${error}`));
      try {
        resolve(JSON.parse(result));
      } catch (e) {
        reject(new Error('Failed to parse Python script output.'));
      }
    });
  });
}

export async function POST(req) {
  try {
    const { amount, currency, billNumber } = await req.json();
    if (!amount || !currency) {
      return NextResponse.json({ success: false, message: "Amount and currency are required." }, { status: 400 });
    }
    
    const data = JSON.stringify({ amount, currency, billNumber });
    const result = await runPythonScript(['generate', data]);
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: result.message || 'Error generating QR code.' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const md5 = searchParams.get('md5');

    if (!md5) {
      return NextResponse.json({ success: false, message: "MD5 hash is required." }, { status: 400 });
    }

    const result = await runPythonScript(['status', md5]);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: result.message || 'Error checking payment status.' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}