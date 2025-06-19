# api/generate-qr.py
from flask import Flask, request, jsonify
from bakong_khqr import KHQR
import qrcode
import base64
from io import BytesIO
import time
import os

app = Flask(__name__)

@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def handler(path):
    try:
        # Read the token from an environment variable
        token = os.environ.get('BAKONG_TOKEN')
        if not token:
            return jsonify({'error': 'Server configuration error: BAKONG_TOKEN not set'}), 500

        khqr = KHQR(token)
        data = request.get_json()
        amount = data.get('amount')
        currency = data.get('currency', 'KHR')

        if not amount:
            return jsonify({"error": "Amount is required"}), 400

        bill_number = f"TRX{int(time.time())}"
        qr_data_string = khqr.create_qr(
            bank_account='say_vathanak@aclb',
            merchant_name='SAY SAKSOVATHANAK',
            merchant_city='Phnom Penh',
            amount=float(amount),
            currency=currency,
            store_label='Baby Bear',
            phone_number='855928866006',
            bill_number=bill_number,
            terminal_label='Cashier-01',
            static=False
        )

        md5_hash = khqr.generate_md5(qr_data_string)
        qr_img = qrcode.make(qr_data_string)
        buffered = BytesIO()
        qr_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return jsonify({
            "success": True,
            "qr_image_base64": f"data:image/png;base64,{img_str}",
            "transaction_hash": md5_hash,
            "bill_number": bill_number
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500