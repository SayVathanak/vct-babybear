# api/check-payment.py
from flask import Flask, request, jsonify
from bakong_khqr import KHQR
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
        md5_hash = data.get('transaction_hash')

        if not md5_hash:
            return jsonify({"error": "Transaction hash is required"}), 400

        payment_status = khqr.check_payment(md5_hash)
        is_paid = (payment_status == "PAID")

        return jsonify({
            "success": True,
            "status": payment_status,
            "is_paid": is_paid
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500