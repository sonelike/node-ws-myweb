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
let customersMemory = [];
let projectsMemory = [];
let contractsMemory = [];
let depositsMemory = [];
let invoicesMemory = [];
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

// Customer Schema
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  taxId: { type: String },
  bankAccount: { type: String },
  bankName: { type: String },
  remark: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Project Schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  customer: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  budget: { type: Number },
  status: { type: String, enum: ['进行中', '已完成', '已暂停', '已取消'], default: '进行中' },
  manager: { type: String },
  remark: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Contract Schema
const contractSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  customer: { type: String, required: true },
  project: { type: String },
  type: { type: String, enum: ['销售合同', '采购合同', '服务合同', '其他'], default: '销售合同' },
  amount: { type: Number },
  signDate: { type: Date },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['草稿', '已签署', '执行中', '已完成', '已终止'], default: '草稿' },
  paymentTerms: { type: String },
  remark: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Deposit Schema (保证金管理)
const depositSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  customer: { type: String, required: true },
  contract: { type: String },
  project: { type: String },
  type: { type: String, enum: ['投标保证金', '履约保证金', '质量保证金', '其他'], default: '履约保证金' },
  amount: { type: Number, required: true },
  payDate: { type: Date },
  returnDate: { type: Date },
  expectedReturnDate: { type: Date },
  status: { type: String, enum: ['已支付', '部分退还', '已退还', '已没收'], default: '已支付' },
  remark: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Invoice Schema (发票管理)
const invoiceSchema = new mongoose.Schema({
  code: { type: String, required: true },
  type: { type: String, enum: ['增值税专用发票', '增值税普通发票', '电子发票', '其他'], default: '增值税专用发票' },
  direction: { type: String, enum: ['开票', '收票'], required: true },
  customer: { type: String, required: true },
  contract: { type: String },
  project: { type: String },
  amount: { type: Number, required: true },
  taxAmount: { type: Number },
  totalAmount: { type: Number },
  issueDate: { type: Date },
  status: { type: String, enum: ['未开具', '已开具', '已寄送', '已签收', '已作废'], default: '未开具' },
  remark: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Project = mongoose.model('Project', projectSchema);
const Contract = mongoose.model('Contract', contractSchema);
const Deposit = mongoose.model('Deposit', depositSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

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

// ==================== Customer Management APIs ====================

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const customers = await Customer.find().sort({ createdAt: -1 });
      res.json(customers);
    } else {
      demoMode = true;
      res.json(customersMemory);
    }
  } catch (error) {
    demoMode = true;
    res.json(customersMemory);
  }
});

// Create customer
app.post('/api/customers', async (req, res) => {
  const customerData = {
    name: req.body.name,
    contact: req.body.contact,
    phone: req.body.phone,
    email: req.body.email,
    address: req.body.address,
    taxId: req.body.taxId,
    bankAccount: req.body.bankAccount,
    bankName: req.body.bankName,
    remark: req.body.remark
  };

  try {
    if (isMongoConnected()) {
      const customer = new Customer(customerData);
      const newCustomer = await customer.save();
      res.status(201).json(newCustomer);
    } else {
      demoMode = true;
      const newCustomer = {
        _id: generateId(),
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      customersMemory.unshift(newCustomer);
      res.status(201).json(newCustomer);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const customer = await Customer.findByIdAndUpdate(req.params.id, {
        ...req.body,
        updatedAt: Date.now()
      }, { new: true });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(customer);
    } else {
      demoMode = true;
      const index = customersMemory.findIndex(c => c._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      customersMemory[index] = {
        ...customersMemory[index],
        ...req.body,
        updatedAt: new Date()
      };
      res.json(customersMemory[index]);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const customer = await Customer.findByIdAndDelete(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json({ message: 'Customer deleted successfully' });
    } else {
      demoMode = true;
      const index = customersMemory.findIndex(c => c._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      customersMemory.splice(index, 1);
      res.json({ message: 'Customer deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== Project Management APIs ====================

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const projects = await Project.find().sort({ createdAt: -1 });
      res.json(projects);
    } else {
      demoMode = true;
      res.json(projectsMemory);
    }
  } catch (error) {
    demoMode = true;
    res.json(projectsMemory);
  }
});

// Create project
app.post('/api/projects', async (req, res) => {
  const projectData = {
    name: req.body.name,
    code: req.body.code,
    customer: req.body.customer,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    budget: req.body.budget,
    status: req.body.status || '进行中',
    manager: req.body.manager,
    remark: req.body.remark
  };

  try {
    if (isMongoConnected()) {
      const project = new Project(projectData);
      const newProject = await project.save();
      res.status(201).json(newProject);
    } else {
      demoMode = true;
      const newProject = {
        _id: generateId(),
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      projectsMemory.unshift(newProject);
      res.status(201).json(newProject);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const project = await Project.findByIdAndUpdate(req.params.id, {
        ...req.body,
        updatedAt: Date.now()
      }, { new: true });
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } else {
      demoMode = true;
      const index = projectsMemory.findIndex(p => p._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Project not found' });
      }
      projectsMemory[index] = {
        ...projectsMemory[index],
        ...req.body,
        updatedAt: new Date()
      };
      res.json(projectsMemory[index]);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const project = await Project.findByIdAndDelete(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json({ message: 'Project deleted successfully' });
    } else {
      demoMode = true;
      const index = projectsMemory.findIndex(p => p._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Project not found' });
      }
      projectsMemory.splice(index, 1);
      res.json({ message: 'Project deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== Contract Management APIs ====================

// Get all contracts
app.get('/api/contracts', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const contracts = await Contract.find().sort({ createdAt: -1 });
      res.json(contracts);
    } else {
      demoMode = true;
      res.json(contractsMemory);
    }
  } catch (error) {
    demoMode = true;
    res.json(contractsMemory);
  }
});

// Create contract
app.post('/api/contracts', async (req, res) => {
  const contractData = {
    code: req.body.code,
    name: req.body.name,
    customer: req.body.customer,
    project: req.body.project,
    type: req.body.type || '销售合同',
    amount: req.body.amount,
    signDate: req.body.signDate,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    status: req.body.status || '草稿',
    paymentTerms: req.body.paymentTerms,
    remark: req.body.remark
  };

  try {
    if (isMongoConnected()) {
      const contract = new Contract(contractData);
      const newContract = await contract.save();
      res.status(201).json(newContract);
    } else {
      demoMode = true;
      const newContract = {
        _id: generateId(),
        ...contractData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      contractsMemory.unshift(newContract);
      res.status(201).json(newContract);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update contract
app.put('/api/contracts/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const contract = await Contract.findByIdAndUpdate(req.params.id, {
        ...req.body,
        updatedAt: Date.now()
      }, { new: true });
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      res.json(contract);
    } else {
      demoMode = true;
      const index = contractsMemory.findIndex(c => c._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      contractsMemory[index] = {
        ...contractsMemory[index],
        ...req.body,
        updatedAt: new Date()
      };
      res.json(contractsMemory[index]);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete contract
app.delete('/api/contracts/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const contract = await Contract.findByIdAndDelete(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      res.json({ message: 'Contract deleted successfully' });
    } else {
      demoMode = true;
      const index = contractsMemory.findIndex(c => c._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      contractsMemory.splice(index, 1);
      res.json({ message: 'Contract deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== Deposit Management APIs ====================

// Get all deposits
app.get('/api/deposits', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const deposits = await Deposit.find().sort({ createdAt: -1 });
      res.json(deposits);
    } else {
      demoMode = true;
      res.json(depositsMemory);
    }
  } catch (error) {
    demoMode = true;
    res.json(depositsMemory);
  }
});

// Create deposit
app.post('/api/deposits', async (req, res) => {
  const depositData = {
    code: req.body.code,
    name: req.body.name,
    customer: req.body.customer,
    contract: req.body.contract,
    project: req.body.project,
    type: req.body.type || '履约保证金',
    amount: req.body.amount,
    payDate: req.body.payDate,
    returnDate: req.body.returnDate,
    expectedReturnDate: req.body.expectedReturnDate,
    status: req.body.status || '已支付',
    remark: req.body.remark
  };

  try {
    if (isMongoConnected()) {
      const deposit = new Deposit(depositData);
      const newDeposit = await deposit.save();
      res.status(201).json(newDeposit);
    } else {
      demoMode = true;
      const newDeposit = {
        _id: generateId(),
        ...depositData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      depositsMemory.unshift(newDeposit);
      res.status(201).json(newDeposit);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update deposit
app.put('/api/deposits/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const deposit = await Deposit.findByIdAndUpdate(req.params.id, {
        ...req.body,
        updatedAt: Date.now()
      }, { new: true });
      if (!deposit) {
        return res.status(404).json({ message: 'Deposit not found' });
      }
      res.json(deposit);
    } else {
      demoMode = true;
      const index = depositsMemory.findIndex(d => d._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Deposit not found' });
      }
      depositsMemory[index] = {
        ...depositsMemory[index],
        ...req.body,
        updatedAt: new Date()
      };
      res.json(depositsMemory[index]);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete deposit
app.delete('/api/deposits/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const deposit = await Deposit.findByIdAndDelete(req.params.id);
      if (!deposit) {
        return res.status(404).json({ message: 'Deposit not found' });
      }
      res.json({ message: 'Deposit deleted successfully' });
    } else {
      demoMode = true;
      const index = depositsMemory.findIndex(d => d._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Deposit not found' });
      }
      depositsMemory.splice(index, 1);
      res.json({ message: 'Deposit deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== Invoice Management APIs ====================

// Get all invoices
app.get('/api/invoices', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const invoices = await Invoice.find().sort({ createdAt: -1 });
      res.json(invoices);
    } else {
      demoMode = true;
      res.json(invoicesMemory);
    }
  } catch (error) {
    demoMode = true;
    res.json(invoicesMemory);
  }
});

// Create invoice
app.post('/api/invoices', async (req, res) => {
  const invoiceData = {
    code: req.body.code,
    type: req.body.type || '增值税专用发票',
    direction: req.body.direction,
    customer: req.body.customer,
    contract: req.body.contract,
    project: req.body.project,
    amount: req.body.amount,
    taxAmount: req.body.taxAmount,
    totalAmount: req.body.totalAmount,
    issueDate: req.body.issueDate,
    status: req.body.status || '未开具',
    remark: req.body.remark
  };

  try {
    if (isMongoConnected()) {
      const invoice = new Invoice(invoiceData);
      const newInvoice = await invoice.save();
      res.status(201).json(newInvoice);
    } else {
      demoMode = true;
      const newInvoice = {
        _id: generateId(),
        ...invoiceData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      invoicesMemory.unshift(newInvoice);
      res.status(201).json(newInvoice);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update invoice
app.put('/api/invoices/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const invoice = await Invoice.findByIdAndUpdate(req.params.id, {
        ...req.body,
        updatedAt: Date.now()
      }, { new: true });
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json(invoice);
    } else {
      demoMode = true;
      const index = invoicesMemory.findIndex(i => i._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      invoicesMemory[index] = {
        ...invoicesMemory[index],
        ...req.body,
        updatedAt: new Date()
      };
      res.json(invoicesMemory[index]);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete invoice
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const invoice = await Invoice.findByIdAndDelete(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json({ message: 'Invoice deleted successfully' });
    } else {
      demoMode = true;
      const index = invoicesMemory.findIndex(i => i._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      invoicesMemory.splice(index, 1);
      res.json({ message: 'Invoice deleted successfully' });
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
  console.log(`Modules Active: Financial, Customer, Project, Contract, Deposit, Invoice`);
  if (demoMode) {
    console.log(`Running in DEMO mode (in-memory storage)`);
  }
});
