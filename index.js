const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 15333;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection - Use environment variable or default to local MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/enterprise_management';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Running in demo mode without database connection');
});

// In-memory storage for demo mode (when MongoDB is not available)
let transactionsMemory = [];
let demoMode = false;

// Financial Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['收入', '支出'] },
  amount: { type: Number, required: true },
  accountSuffix: { type: String, required: true },
  accountName: { type: String, required: true },
  balance: { type: Number, required: true },
  customer: { type: String },
  contract: { type: String },
  project: { type: String },
  summary: { type: String },
  remark: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Helper function to check if MongoDB is connected
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Generate unique ID for demo mode
function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// API Routes

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const transactions = await Transaction.find().sort({ createdAt: -1 });
      res.json(transactions);
    } else {
      demoMode = true;
      res.json(transactionsMemory);
    }
  } catch (error) {
    demoMode = true;
    res.json(transactionsMemory);
  }
});

// Get single transaction
app.get('/api/transactions/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const transaction = await Transaction.findById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      res.json(transaction);
    } else {
      demoMode = true;
      const transaction = transactionsMemory.find(t => t._id === req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      res.json(transaction);
    }
  } catch (error) {
    demoMode = true;
    res.status(500).json({ message: error.message });
  }
});

// Create transaction
app.post('/api/transactions', async (req, res) => {
  const transactionData = {
    type: req.body.type,
    amount: req.body.amount,
    accountSuffix: req.body.accountSuffix,
    accountName: req.body.accountName,
    balance: req.body.balance,
    customer: req.body.customer,
    contract: req.body.contract,
    project: req.body.project,
    summary: req.body.summary,
    remark: req.body.remark
  };

  try {
    if (isMongoConnected()) {
      const transaction = new Transaction(transactionData);
      const newTransaction = await transaction.save();
      res.status(201).json(newTransaction);
    } else {
      demoMode = true;
      const newTransaction = {
        _id: generateId(),
        ...transactionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      transactionsMemory.unshift(newTransaction);
      res.status(201).json(newTransaction);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const transaction = await Transaction.findById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      transaction.type = req.body.type || transaction.type;
      transaction.amount = req.body.amount || transaction.amount;
      transaction.accountSuffix = req.body.accountSuffix || transaction.accountSuffix;
      transaction.accountName = req.body.accountName || transaction.accountName;
      transaction.balance = req.body.balance || transaction.balance;
      transaction.customer = req.body.customer || transaction.customer;
      transaction.contract = req.body.contract || transaction.contract;
      transaction.project = req.body.project || transaction.project;
      transaction.summary = req.body.summary || transaction.summary;
      transaction.remark = req.body.remark || transaction.remark;
      transaction.updatedAt = Date.now();

      const updatedTransaction = await transaction.save();
      res.json(updatedTransaction);
    } else {
      demoMode = true;
      const index = transactionsMemory.findIndex(t => t._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      transactionsMemory[index] = {
        ...transactionsMemory[index],
        type: req.body.type || transactionsMemory[index].type,
        amount: req.body.amount || transactionsMemory[index].amount,
        accountSuffix: req.body.accountSuffix || transactionsMemory[index].accountSuffix,
        accountName: req.body.accountName || transactionsMemory[index].accountName,
        balance: req.body.balance || transactionsMemory[index].balance,
        customer: req.body.customer || transactionsMemory[index].customer,
        contract: req.body.contract || transactionsMemory[index].contract,
        project: req.body.project || transactionsMemory[index].project,
        summary: req.body.summary || transactionsMemory[index].summary,
        remark: req.body.remark || transactionsMemory[index].remark,
        updatedAt: new Date()
      };
      res.json(transactionsMemory[index]);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const transaction = await Transaction.findByIdAndDelete(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      res.json({ message: 'Transaction deleted successfully' });
    } else {
      demoMode = true;
      const index = transactionsMemory.findIndex(t => t._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      transactionsMemory.splice(index, 1);
      res.json({ message: 'Transaction deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Enterprise Management System is ready!`);
  console.log(`Financial Transaction Management Module Active`);
  if (demoMode) {
    console.log(`Running in DEMO mode (in-memory storage)`);
  }
});
