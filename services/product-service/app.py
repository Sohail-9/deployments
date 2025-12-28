from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'postgres'),
    'port': os.getenv('DB_PORT', 5432),
    'database': os.getenv('DB_NAME', 'productdb'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres')
}

# Redis configuration
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'redis'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0,
    decode_responses=True
)

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

def init_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                image VARCHAR(500),
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert sample products
        cur.execute("SELECT COUNT(*) FROM products")
        if cur.fetchone()['count'] == 0:
            sample_products = [
                ('Laptop', 'High-performance laptop', 999.99, 50, 'laptop.jpg', 'Electronics'),
                ('Smartphone', 'Latest smartphone model', 699.99, 100, 'phone.jpg', 'Electronics'),
                ('Headphones', 'Wireless noise-canceling headphones', 199.99, 75, 'headphones.jpg', 'Electronics'),
                ('Coffee Maker', 'Automatic coffee maker', 79.99, 30, 'coffee.jpg', 'Appliances'),
                ('Running Shoes', 'Comfortable running shoes', 89.99, 60, 'shoes.jpg', 'Sports'),
                ('Backpack', 'Durable travel backpack', 49.99, 40, 'backpack.jpg', 'Accessories'),
                ('Watch', 'Smart fitness watch', 249.99, 25, 'watch.jpg', 'Electronics'),
                ('Desk Chair', 'Ergonomic office chair', 299.99, 20, 'chair.jpg', 'Furniture'),
                ('Water Bottle', 'Insulated water bottle', 24.99, 150, 'bottle.jpg', 'Accessories'),
                ('Keyboard', 'Mechanical gaming keyboard', 129.99, 45, 'keyboard.jpg', 'Electronics')
            ]
            
            cur.executemany(
                "INSERT INTO products (name, description, price, stock, image, category) VALUES (%s, %s, %s, %s, %s, %s)",
                sample_products
            )
        
        conn.commit()
        cur.close()
        conn.close()
        print('Product database initialized')
    except Exception as e:
        print(f'Database initialization error: {e}')

init_db()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'product-service'})

@app.route('/', methods=['GET'])
def get_products():
    try:
        # Check cache
        cached_products = redis_client.get('products:all')
        if cached_products:
            return jsonify(json.loads(cached_products))
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT * FROM products ORDER BY id')
        products = cur.fetchall()
        cur.close()
        conn.close()
        
        # Cache results
        redis_client.setex('products:all', 300, json.dumps(products, default=str))
        
        return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        # Check cache
        cache_key = f'product:{product_id}'
        cached_product = redis_client.get(cache_key)
        if cached_product:
            return jsonify(json.loads(cached_product))
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT * FROM products WHERE id = %s', (product_id,))
        product = cur.fetchone()
        cur.close()
        conn.close()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Cache result
        redis_client.setex(cache_key, 300, json.dumps(product, default=str))
        
        return jsonify(product)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['POST'])
def create_product():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO products (name, description, price, stock, image, category) 
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
            (data['name'], data.get('description'), data['price'], 
             data.get('stock', 0), data.get('image'), data.get('category'))
        )
        product = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        # Invalidate cache
        redis_client.delete('products:all')
        
        return jsonify(product), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """UPDATE products 
               SET name = %s, description = %s, price = %s, stock = %s, 
                   image = %s, category = %s, updated_at = CURRENT_TIMESTAMP
               WHERE id = %s RETURNING *""",
            (data['name'], data.get('description'), data['price'], 
             data.get('stock'), data.get('image'), data.get('category'), product_id)
        )
        product = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Invalidate cache
        redis_client.delete('products:all')
        redis_client.delete(f'product:{product_id}')
        
        return jsonify(product)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM products WHERE id = %s RETURNING id', (product_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not deleted:
            return jsonify({'error': 'Product not found'}), 404
        
        # Invalidate cache
        redis_client.delete('products:all')
        redis_client.delete(f'product:{product_id}')
        
        return jsonify({'message': 'Product deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5001)))
