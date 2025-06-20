import sys
import json
from bakong_khqr import KHQR

# --- IMPORTANT ---
# Load these values from environment variables in a real application
BAKONG_DEV_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiZmU2MzNjNDdlOGZlNDQ0YSJ9LCJpYXQiOjE3NTAzMDM4MzYsImV4cCI6MTc1ODA3OTgzNn0.qfto6ysuh0bUwIHeDsX3nMACGTwGU3gfcxmPZ6n2z3c"
BANK_ACCOUNT = "say_vathanak@aclb"
MERCHANT_NAME = "Baby Bear"
MERCHANT_CITY = "Phnom Penh"
PHONE_NUMBER = "85592886006"
TERMINAL_LABEL = "BabyBear-Checkout"
# -----------------

def generate_qr():
    try:
        input_data = json.loads(sys.argv[1])
        amount = float(input_data.get("amount"))
        currency = input_data.get("currency", "USD")
        bill_number = input_data.get("billNumber", "")

        khqr = KHQR(BAKONG_DEV_TOKEN)
        
        if currency == 'KHR':
            amount = int(amount)

        # --- MODIFIED FUNCTION CALL ---
        qr_string = khqr.create_qr(
            bank_account=BANK_ACCOUNT,
            merchant_name=MERCHANT_NAME,
            merchant_city=MERCHANT_CITY,
            amount=amount,
            currency=currency,
            store_label='Baby Bear',
            bill_number=bill_number,
            phone_number=PHONE_NUMBER,
            terminal_label=TERMINAL_LABEL,
            static=False
        )
        # ----------------------------

        md5_hash = khqr.generate_md5(qr_string)
        print(json.dumps({"success": True, "qr": qr_string, "md5": md5_hash}))

    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))

def check_status():
    try:
        md5_hash = sys.argv[1]
        khqr = KHQR(BAKONG_DEV_TOKEN)
        status = khqr.check_payment(md5_hash)
        print(json.dumps({"success": True, "status": status}))
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))

if __name__ == "__main__":
    command = sys.argv.pop(1)
    if command == "generate":
        generate_qr()
    elif command == "status":
        check_status()