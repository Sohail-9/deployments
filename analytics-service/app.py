from flask import Flask, request, jsonify
from pymongo import MongoClient
import redis
import json
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# MongoDB configuration
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://mongodb:27017')
mongo_client = MongoClient(MONGO_URL)
db = mongo_client['analyticsdb']
events_collection = db['events']

# Redis configuration
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'redis'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=1,
    decode_responses=True
)

# Create indexes
events_collection.create_index('userId')
events_collection.create_index('eventType')
events_collection.create_index('timestamp')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'analytics-service'})

@app.route('/event', methods=['POST'])
def track_event():
    try:
        data = request.json
        event = {
            'userId': data.get('userId'),
            'eventType': data.get('eventType'),
            'metadata': data.get('metadata', {}),
            'timestamp': datetime.utcnow()
        }
        
        result = events_collection.insert_one(event)
        event['_id'] = str(result.inserted_id)
        event['timestamp'] = event['timestamp'].isoformat()
        
        # Update real-time counters in Redis
        redis_client.incr(f'event_count:{event["eventType"]}')
        redis_client.incr('total_events')
        
        return jsonify(event), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/dashboard', methods=['GET'])
def get_dashboard():
    try:
        # Get date range
        days = int(request.args.get('days', 7))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Check cache
        cache_key = f'dashboard:{days}'
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data))
        
        # Total events
        total_events = events_collection.count_documents({
            'timestamp': {'$gte': start_date}
        })
        
        # Events by type
        pipeline = [
            {'$match': {'timestamp': {'$gte': start_date}}},
            {'$group': {
                '_id': '$eventType',
                'count': {'$sum': 1}
            }}
        ]
        events_by_type = list(events_collection.aggregate(pipeline))
        
        # Events by day
        pipeline = [
            {'$match': {'timestamp': {'$gte': start_date}}},
            {'$group': {
                '_id': {
                    '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$timestamp'
                    }
                },
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        events_by_day = list(events_collection.aggregate(pipeline))
        
        # Top users
        pipeline = [
            {'$match': {'timestamp': {'$gte': start_date}}},
            {'$group': {
                '_id': '$userId',
                'eventCount': {'$sum': 1}
            }},
            {'$sort': {'eventCount': -1}},
            {'$limit': 10}
        ]
        top_users = list(events_collection.aggregate(pipeline))
        
        dashboard_data = {
            'totalEvents': total_events,
            'eventsByType': events_by_type,
            'eventsByDay': events_by_day,
            'topUsers': top_users,
            'period': f'Last {days} days'
        }
        
        # Cache for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(dashboard_data, default=str))
        
        return jsonify(dashboard_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user/<int:user_id>', methods=['GET'])
def get_user_analytics(user_id):
    try:
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        events = list(events_collection.find({
            'userId': user_id,
            'timestamp': {'$gte': start_date}
        }).sort('timestamp', -1).limit(100))
        
        # Convert ObjectId to string
        for event in events:
            event['_id'] = str(event['_id'])
            event['timestamp'] = event['timestamp'].isoformat()
        
        analytics = {
            'userId': user_id,
            'totalEvents': len(events),
            'recentEvents': events
        }
        
        return jsonify(analytics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5003)))
