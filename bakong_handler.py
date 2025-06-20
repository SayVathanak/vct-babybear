import sys
import json
import os # <-- Import the 'os' module
from bakong_khqr import KHQR

# --- Load configuration from environment variables ---
# This makes the script secure and configurable without changing the code.
BAKONG_DEV_TOKEN = os.getenv("BAKONG_DEV_TOKEN")
BANK_ACCOUNT = os.getenv("BAKONG_BANK_ACCOUNT")
MERCHANT_NAME = os.getenv("BAKONG_MERCHANT_NAME")
MERCHANT_CITY = os.getenv("BAKONG_MERCHANT_CITY")
PHONE_NUMBER = os.getenv("BAKONG_PHONE_NUMBER")
TERMINAL_LABEL = os.getenv("BAKONG_TERMINAL_LABEL")
APP_CALLBACK_URL = os.getenv("BAKONG_APP_CALLBACK_URL")
APP_ICON_URL = os.getenv("BAKONG_APP_ICON_URL")
APP_NAME = os.getenv("BAKONG_APP_NAME")
# ----------------------------------------------------

def generate_qr():
    try:
        # Check if essential configuration is loaded
        if not all([BAKONG_DEV_TOKEN, BANK_ACCOUNT, MERCHANT_NAME]):
            raise ValueError("Bakong configuration is missing from environment variables.")

        input_data = json.loads(sys.argv[1])
        amount = float(input_data.get("amount"))
        currency = input_data.get("currency", "USD")
        bill_number = input_data.get("billNumber", "")

        khqr = KHQR(BAKONG_DEV_TOKEN)
        
        if currency == 'KHR':
            amount = int(amount)

        qr_string = khqr.create_qr(
            bank_account=BANK_ACCOUNT,
            merchant_name=MERCHANT_NAME,
            merchant_city=MERCHANT_CITY,
            amount=amount,
            currency=currency,
            store_label=APP_NAME,
            bill_number=bill_number,
            phone_number=PHONE_NUMBER,
            terminal_label=TERMINAL_LABEL,
            static=False
        )
        
        md5_hash = khqr.generate_md5(qr_string)

        deeplink_url = khqr.generate_deeplink(
            qr_string,
            callback=APP_CALLBACK_URL,
            appIconUrl=APP_ICON_URL,
            appName=APP_NAME
        )

        print(json.dumps({
            "success": True, 
            "qr": qr_string, 
            "md5": md5_hash, 
            "deeplink": deeplink_url
        }))

    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))

def check_status():
    try:
        if not BAKONG_DEV_TOKEN:
            raise ValueError("Bakong developer token is missing from environment variables.")
            
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
