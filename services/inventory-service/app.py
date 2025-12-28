from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'postgres'),
    'port': os.getenv('DB_PORT', 5432),
    'database': os.getenv('DB_NAME', 'inventorydb'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres')
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

def init_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                product_id INTEGER UNIQUE NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                reserved INTEGER NOT NULL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Initialize sample inventory
        cur.execute("SELECT COUNT(*) FROM inventory")
        if cur.fetchone()['count'] == 0:
            for product_id in range(1, 11):
                cur.execute(
                    "INSERT INTO inventory (product_id, quantity) VALUES (%s, %s)",
                    (product_id, 50 + product_id * 10)
                )
        
        conn.commit()
        cur.close()
        conn.close()
        print('Inventory database initialized')
    except Exception as e:
        print(f'Database initialization error: {e}')

init_db()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'inventory-service'})

@app.route('/<int:product_id>', methods=['GET'])
def get_inventory(product_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT * FROM inventory WHERE product_id = %s', (product_id,))
        inventory = cur.fetchone()
        cur.close()
        conn.close()
        
        if not inventory:
            return jsonify({'product_id': product_id, 'quantity': 0, 'available': 0})
        
        inventory['available'] = inventory['quantity'] - inventory['reserved']
        return jsonify(inventory)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/check', methods=['POST'])
def check_inventory():
    try:
        items = request.json.get('items', [])
        conn = get_db_connection()
        cur = conn.cursor()
        
        for item in items:
            cur.execute(
                'SELECT quantity, reserved FROM inventory WHERE product_id = %s',
                (item['productId'],)
            )
            result = cur.fetchone()
            
            if not result:
                cur.close()
                conn.close()
                return jsonify({'error': f'Product {item["productId"]} not found'}), 404
            
            available = result['quantity'] - result['reserved']
            if available < item['quantity']:
                cur.close()
                conn.close()
                return jsonify({'error': f'Insufficient stock for product {item["productId"]}'}), 400
        
        cur.close()
        conn.close()
        return jsonify({'status': 'ok'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/<int:product_id>', methods=['PUT'])
def update_inventory(product_id):
    try:
        data = request.json
        quantity_delta = data.get('quantity', 0)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if inventory exists
        cur.execute('SELECT quantity FROM inventory WHERE product_id = %s', (product_id,))
        result = cur.fetchone()
        
        if not result:
            # Create new inventory record
            cur.execute(
                'INSERT INTO inventory (product_id, quantity) VALUES (%s, %s) RETURNING *',
                (product_id, max(0, quantity_delta))
            )
        else:
            # Update existing inventory
            new_quantity = max(0, result['quantity'] + quantity_delta)
            cur.execute(
                'UPDATE inventory SET quantity = %s, updated_at = CURRENT_TIMESTAMP WHERE product_id = %s RETURNING *',
                (new_quantity, product_id)
            )
        
        inventory = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(inventory)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5002)))
