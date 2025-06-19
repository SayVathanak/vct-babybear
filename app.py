# VCT-BABYBEAR/app.py
from flask import Flask, request, jsonify
from bakong_khqr import KHQR
import qrcode
import base64
from io import BytesIO
from flask_cors import CORS

# Initialize Flask App and enable CORS
app = Flask(__name__)
CORS(app) # This allows your React frontend to make requests to this backend

# Create an instance of KHQR with Bakong Developer Token:
# IMPORTANT: For production, store your token securely, e.g., in an environment variable.
khqr = KHQR("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiZmU2MzNjNDdlOGZlNDQ0YSJ9LCJpYXQiOjE3NTAzMDM4MzYsImV4cCI6MTc1ODA3OTgzNn0.qfto6ysuh0bUwIHeDsX3nMACGTwGU3gfcxmPZ6n2z3c")

@app.route('/api/generate-qr', methods=['POST'])
def generate_qr_code():
    """
    API Endpoint 1: Generate QR Code
    This takes the order amount, generates the KHQR data, creates a QR code image,
    and sends it to the frontend along with a unique transaction ID (hash).
    """
    try:
        data = request.get_json()
        amount = data.get('amount')
        currency = data.get('currency', 'KHR') # Default to KHR if not provided

        if not amount:
            return jsonify({"error": "Amount is required"}), 400

        # Generate a unique bill number for each transaction to avoid collisions
        import time
        bill_number = f"TRX{int(time.time())}"

        # Generate QR code data string for the transaction:
        # FIX: Added the 'phone_number' parameter back, which was likely causing the error.
        qr_data_string = khqr.create_qr(
            bank_account='say_vathanak@aclb', # Your Bakong account
            merchant_name='SAY SAKSOVATHANAK',
            merchant_city='Phnom Penh',
            amount=float(amount),
            currency=currency,
            store_label='Baby Bear',
            phone_number='855928866006', # Added this required field back
            bill_number=bill_number,
            terminal_label='Cashier-01',
            static=False
        )

        # Generate the unique transaction ID (MD5 hash) for payment checking
        md5_hash = khqr.generate_md5(qr_data_string)

        # Create the QR code image from the data string
        qr_img = qrcode.make(qr_data_string)

        # Save the image to a memory buffer to avoid saving to a file
        buffered = BytesIO()
        qr_img.save(buffered, format="PNG")

        # Encode the image to a base64 string to easily send it via JSON
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # Send the image and transaction hash back to the frontend
        return jsonify({
            "success": True,
            "qr_image_base64": f"data:image/png;base64,{img_str}",
            "transaction_hash": md5_hash,
            "bill_number": bill_number
        })

    except Exception as e:
        # This will print the exact Python error to your terminal for better debugging
        print(f"Error in /api/generate-qr: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/check-payment', methods=['POST'])
def check_payment_status():
    """
    API Endpoint 2: Check Payment Status
    This checks if a payment for a given transaction ID (hash) has been
    successfully paid.
    """
    try:
        data = request.get_json()
        md5_hash = data.get('transaction_hash')

        if not md5_hash:
            return jsonify({"error": "Transaction hash is required"}), 400

        # Use the KHQR library to check the payment status
        payment_status = khqr.check_payment(md5_hash)

        # The frontend will check for this 'is_paid' boolean
        is_paid = (payment_status == "PAID")

        return jsonify({
            "success": True,
            "status": payment_status,
            "is_paid": is_paid
        })

    except Exception as e:
        print(f"Error in /api/check-payment: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Instructions to run the server:
    # 1. Make sure you have the required libraries:
    #    pip install Flask flask-cors bakong-khqr "qrcode[pil]"
    # 2. Run this script from your terminal:
    #    python app.py
    # 3. The API server will start and be accessible at http://127.0.0.1:5000
    app.run(debug=True, port=5000)
