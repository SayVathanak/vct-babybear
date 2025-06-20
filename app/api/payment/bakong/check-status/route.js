import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

function runPythonScript(args) {
    // This helper can be centralized in a lib file if used often
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(process.cwd(), 'bakong_handler.py');
        const python = spawn('python', [scriptPath, ...args]);
        // const python = spawn('python', [scriptPath, ...args], {
        //     env: {
        //         ...process.env,
        //     }
        // });
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