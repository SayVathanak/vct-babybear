import sys
import json
import os
from bakong_khqr import KHQR

# --- PRODUCTION CONFIGURATION ---
# Load from environment variables for security
BAKONG_TOKEN = os.getenv('BAKONG_TOKEN')  # Production token
BANK_ACCOUNT = os.getenv('BANK_ACCOUNT')  # Your real bank account
MERCHANT_NAME = os.getenv('MERCHANT_NAME', 'Baby Bear')
MERCHANT_CITY = os.getenv('MERCHANT_CITY', 'Phnom Penh')
PHONE_NUMBER = os.getenv('PHONE_NUMBER')
TERMINAL_LABEL = os.getenv('TERMINAL_LABEL', 'BabyBear-Checkout')

# --- DEEPLINK CONFIGURATION ---
APP_CALLBACK_URL = os.getenv('APP_CALLBACK_URL', 'https://vct-babybear.vercel.app/my-orders')
APP_ICON_URL = os.getenv('APP_ICON_URL', 'https://vct-babybear.vercel.app/icons/icon-192x192.png')
APP_NAME = os.getenv('APP_NAME', 'Baby Bear')

def validate_environment():
    """Validate that all required environment variables are set"""
    required_vars = [
        'BAKONG_TOKEN',
        'BANK_ACCOUNT', 
        'PHONE_NUMBER'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        return {
            "success": False,
            "message": f"Missing required environment variables: {', '.join(missing_vars)}"
        }
    
    return {"success": True}

def print_usage():
    """Print usage instructions"""
    usage = {
        "success": False,
        "message": "Usage: python bakong_handler.py <command> [args]\n" +
                  "Commands:\n" +
                  "  generate '<json_data>' - Generate QR code\n" +
                  "    Example: python bakong_handler.py generate '{\"amount\": 10, \"currency\": \"USD\", \"billNumber\": \"ORDER001\"}'\n" +
                  "  test - Generate QR code with test data (requires env vars)\n" +
                  "  status <md5_hash> - Check payment status\n" +
                  "    Example: python bakong_handler.py status abc123def456"
    }
    print(json.dumps(usage))

def generate_test_qr():
    """Generate QR code with predefined test data"""
    # Validate environment first
    env_check = validate_environment()
    if not env_check["success"]:
        print(json.dumps(env_check))
        return
        
    try:
        # Use test data
        test_data = {
            "amount": 10,
            "currency": "USD", 
            "billNumber": "TEST001"
        }
        
        amount = float(test_data.get("amount"))
        currency = test_data.get("currency", "USD")
        bill_number = test_data.get("billNumber", "")

        khqr = KHQR(BAKONG_TOKEN)
        
        if currency == 'KHR':
            amount = int(amount)

        qr_string = khqr.create_qr(
            bank_account=BANK_ACCOUNT,
            merchant_name=MERCHANT_NAME,
            merchant_city=MERCHANT_CITY,
            amount=amount,
            currency=currency,
            store_label=MERCHANT_NAME,
            bill_number=bill_number,
            phone_number=PHONE_NUMBER,
            terminal_label=TERMINAL_LABEL,
            static=False
        )
        
        md5_hash = khqr.generate_md5(qr_string)

        # --- Generate the deeplink ---
        deeplink_url = khqr.generate_deeplink(
            qr_string,
            callback=APP_CALLBACK_URL,
            appIconUrl=APP_ICON_URL,
            appName=APP_NAME
        )

        # --- Return all three pieces of data in the JSON response ---
        print(json.dumps({
            "success": True, 
            "qr": qr_string, 
            "md5": md5_hash, 
            "deeplink": deeplink_url,
            "test_data": test_data
        }))

    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))

def generate_qr():
    # Validate environment first
    env_check = validate_environment()
    if not env_check["success"]:
        print(json.dumps(env_check))
        return
        
    try:
        # Check if we have the required argument
        if len(sys.argv) < 3:
            print(json.dumps({
                "success": False,
                "message": "Generate command requires JSON data argument"
            }))
            return

        input_data = json.loads(sys.argv[2])
        amount = float(input_data.get("amount"))
        currency = input_data.get("currency", "USD")
        bill_number = input_data.get("billNumber", "")

        khqr = KHQR(BAKONG_TOKEN)
        
        if currency == 'KHR':
            amount = int(amount)

        qr_string = khqr.create_qr(
            bank_account=BANK_ACCOUNT,
            merchant_name=MERCHANT_NAME,
            merchant_city=MERCHANT_CITY,
            amount=amount,
            currency=currency,
            store_label=MERCHANT_NAME,
            bill_number=bill_number,
            phone_number=PHONE_NUMBER,
            terminal_label=TERMINAL_LABEL,
            static=False
        )
        
        md5_hash = khqr.generate_md5(qr_string)

        # --- Generate the deeplink ---
        deeplink_url = khqr.generate_deeplink(
            qr_string,
            callback=APP_CALLBACK_URL,
            appIconUrl=APP_ICON_URL,
            appName=APP_NAME
        )

        # --- Return all three pieces of data in the JSON response ---
        print(json.dumps({
            "success": True, 
            "qr": qr_string, 
            "md5": md5_hash, 
            "deeplink": deeplink_url
        }))

    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False, 
            "message": f"Invalid JSON data: {str(e)}"
        }))
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))

def check_status():
    # Validate environment first
    env_check = validate_environment()
    if not env_check["success"]:
        print(json.dumps(env_check))
        return
        
    try:
        # Check if we have the required argument
        if len(sys.argv) < 3:
            print(json.dumps({
                "success": False,
                "message": "Status command requires MD5 hash argument"
            }))
            return

        md5_hash = sys.argv[2]
        khqr = KHQR(BAKONG_TOKEN)
        status = khqr.check_payment(md5_hash)
        print(json.dumps({"success": True, "status": status}))
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))

if __name__ == "__main__":
    # Check if we have at least one argument (the command)
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "generate":
        generate_qr()
    elif command == "test":
        generate_test_qr()
    elif command == "status":
        check_status()
    else:
        print(json.dumps({
            "success": False,
            "message": f"Unknown command: {command}. Use 'generate', 'test', or 'status'"
        }))
        sys.exit(1)