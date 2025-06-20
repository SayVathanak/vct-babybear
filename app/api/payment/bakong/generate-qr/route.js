import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

function runPythonScript(args) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'bakong_handler.py');
    // const python = spawn('python', [scriptPath, ...args]);
    const python = spawn('python', [scriptPath, ...args], {
        env: {
            ...process.env,
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