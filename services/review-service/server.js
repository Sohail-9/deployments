const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongodb:27017';
const DB_NAME = 'reviewdb';

let db;
let reviewsCollection;

// Initialize MongoDB connection
async function initDB() {
  try {
    const client = await MongoClient.connect(MONGO_URL);
    db = client.db(DB_NAME);
    reviewsCollection = db.collection('reviews');
    
    // Create indexes
    await reviewsCollection.createIndex({ productId: 1 });
    await reviewsCollection.createIndex({ userId: 1 });
    
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    setTimeout(initDB, 5000);
  }
}

initDB();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'review-service' });
});

// Get reviews for a product
app.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await reviewsCollection
      .find({ productId: parseInt(req.params.productId) })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create review
app.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ message: 'Product ID and rating required' });
    }

    const review = {
      productId: parseInt(productId),
      userId: parseInt(userId),
      rating: Math.max(1, Math.min(5, parseInt(rating))),
      comment: comment || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await reviewsCollection.insertOne(review);
    review._id = result.insertedId;

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update review
app.put('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { rating, comment } = req.body;

    const update = {
      $set: {
        rating: Math.max(1, Math.min(5, parseInt(rating))),
        comment: comment || '',
        updatedAt: new Date()
      }
    };

    const result = await reviewsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: parseInt(userId) },
      update,
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(result.value);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete review
app.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const result = await reviewsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
      userId: parseInt(userId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Review service running on port ${PORT}`);
});
