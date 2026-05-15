// controllers/expenseCategory.controller.js
import mongoose from 'mongoose';
import ExpenseCategory from '../models/expenseCategory.model.js';
import Expense from '../models/expense.model.js';
import { errorHandler } from '../utils/error.js';

// @desc    Get all expense categories
// @route   GET /api/expense-categories
// @access  Private (Admin only)
export const getExpenseCategories = async (req, res, next) => {
  try {
    const { isActive = true, parentCategory, search = '' } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (parentCategory) query.parentCategory = parentCategory === 'null' ? null : parentCategory;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const categories = await ExpenseCategory.find(query)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });
    
    // Calculate additional stats for each category
    const categoriesWithStats = await Promise.all(categories.map(async (category) => {
      // Get total expenses for this category
      const expenses = await Expense.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.category': category._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$items.amount' } } }
      ]);
      
      const totalSpent = expenses[0]?.total || 0;
      const budgetAmount = category.budgetAmount || 0;
      const budgetUtilization = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
      
      // Get subcategories count
      const subcategoriesCount = await ExpenseCategory.countDocuments({ 
        parentCategory: category._id,
        isActive: true 
      });
      
      return {
        ...category.toObject(),
        totalSpent,
        budgetAmount,
        budgetUtilization: Math.round(budgetUtilization),
        budgetRemaining: budgetAmount - totalSpent,
        subcategoriesCount,
        status: totalSpent > budgetAmount ? 'over_budget' : totalSpent >= budgetAmount * 0.9 ? 'warning' : 'good'
      };
    }));
    
    // Group into hierarchy
    const categoryMap = {};
    const rootCategories = [];
    
    categoriesWithStats.forEach(cat => {
      categoryMap[cat._id] = { ...cat, children: [] };
    });
    
    categoriesWithStats.forEach(cat => {
      if (cat.parentCategory) {
        const parent = categoryMap[cat.parentCategory];
        if (parent) {
          parent.children.push(categoryMap[cat._id]);
        }
      } else {
        rootCategories.push(categoryMap[cat._id]);
      }
    });
    
    res.json({
      success: true,
      data: rootCategories,
      flat: categoriesWithStats,
      count: categoriesWithStats.length
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single expense category by ID
// @route   GET /api/expense-categories/:id
// @access  Private (Admin only)
export const getExpenseCategory = async (req, res, next) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'name email');
    
    if (!category) {
      return next(errorHandler(404, 'Expense category not found'));
    }
    
    // Get total expenses for this category
    const expenses = await Expense.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.category': category._id, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$items.amount' } } }
    ]);
    
    const totalSpent = expenses[0]?.total || 0;
    const budgetAmount = category.budgetAmount || 0;
    const budgetUtilization = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
    
    // Get subcategories
    const subcategories = await ExpenseCategory.find({ 
      parentCategory: category._id,
      isActive: true 
    }).select('name budgetAmount');
    
    // Get recent expenses in this category
    const recentExpenses = await Expense.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.category': category._id, status: { $ne: 'cancelled' } } },
      { $sort: { expenseDate: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'expenses',
          localField: '_id',
          foreignField: '_id',
          as: 'expenseDetails'
        }
      },
      { $unwind: '$expenseDetails' },
      {
        $project: {
          expenseNumber: '$expenseDetails.expenseNumber',
          expenseDate: '$expenseDetails.expenseDate',
          vendor: '$expenseDetails.vendor',
          amount: '$items.amount',
          description: '$items.description'
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        ...category.toObject(),
        totalSpent,
        budgetUtilization: Math.round(budgetUtilization),
        budgetRemaining: budgetAmount - totalSpent,
        subcategories,
        recentExpenses
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create a new expense category
// @route   POST /api/expense-categories
// @access  Private (Admin only)
export const createExpenseCategory = async (req, res, next) => {
  try {
    const { name, parentCategory, description, budgetAmount, budgetPeriod } = req.body;
    
    // Check if category with same name exists
    const existingCategory = await ExpenseCategory.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return next(errorHandler(400, 'Expense category with this name already exists'));
    }
    
    // If parent category is provided, check if it exists
    if (parentCategory) {
      const parentExists = await ExpenseCategory.findById(parentCategory);
      if (!parentExists) {
        return next(errorHandler(404, 'Parent category not found'));
      }
    }
    
    const category = await ExpenseCategory.create({
      name,
      parentCategory: parentCategory || null,
      description,
      budgetAmount: budgetAmount || 0,
      budgetPeriod: budgetPeriod || 'monthly',
      isActive: true,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Expense category created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, messages.join(', ')));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Update an expense category
// @route   PUT /api/expense-categories/:id
// @access  Private (Admin only)
export const updateExpenseCategory = async (req, res, next) => {
  try {
    const { name, parentCategory, description, budgetAmount, budgetPeriod, isActive } = req.body;
    
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) {
      return next(errorHandler(404, 'Expense category not found'));
    }
    
    // Check name uniqueness if changing
    if (name && name !== category.name) {
      const existingCategory = await ExpenseCategory.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: category._id }
      });
      if (existingCategory) {
        return next(errorHandler(400, 'Expense category with this name already exists'));
      }
    }
    
    // Prevent circular parent reference
    if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
      if (parentCategory === category._id.toString()) {
        return next(errorHandler(400, 'Category cannot be its own parent'));
      }
      
      // Check for circular reference
      let currentParent = await ExpenseCategory.findById(parentCategory);
      while (currentParent && currentParent.parentCategory) {
        if (currentParent.parentCategory.toString() === category._id.toString()) {
          return next(errorHandler(400, 'Circular reference detected'));
        }
        currentParent = await ExpenseCategory.findById(currentParent.parentCategory);
      }
      
      const parentExists = await ExpenseCategory.findById(parentCategory);
      if (!parentExists) {
        return next(errorHandler(404, 'Parent category not found'));
      }
    }
    
    category.name = name || category.name;
    category.parentCategory = parentCategory !== undefined ? (parentCategory || null) : category.parentCategory;
    category.description = description !== undefined ? description : category.description;
    category.budgetAmount = budgetAmount !== undefined ? budgetAmount : category.budgetAmount;
    category.budgetPeriod = budgetPeriod || category.budgetPeriod;
    category.isActive = isActive !== undefined ? isActive : category.isActive;
    
    await category.save();
    
    res.json({
      success: true,
      data: category,
      message: 'Expense category updated successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete an expense category
// @route   DELETE /api/expense-categories/:id
// @access  Private (Admin only)
export const deleteExpenseCategory = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const category = await ExpenseCategory.findById(req.params.id).session(session);
    if (!category) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Expense category not found'));
    }
    
    // Check if category has subcategories
    const hasSubcategories = await ExpenseCategory.exists({ parentCategory: category._id }).session(session);
    if (hasSubcategories) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Cannot delete category with subcategories. Delete subcategories first or reassign them.'));
    }
    
    // Check if category has expenses
    const hasExpenses = await Expense.exists({ 'items.category': category._id }).session(session);
    if (hasExpenses) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Cannot delete category with existing expenses. Deactivate it instead.'));
    }
    
    await category.deleteOne({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({
      success: true,
      message: 'Expense category deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(errorHandler(500, error.message));
  }
};

// @desc    Get category budget summary
// @route   GET /api/expense-categories/budget/summary
// @access  Private (Admin only)
export const getBudgetSummary = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const categories = await ExpenseCategory.find({ isActive: true });
    
    // Calculate spent amounts per category
    const spentByCategory = await Expense.aggregate([
      { $unwind: '$items' },
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$items.category',
          totalSpent: { $sum: '$items.amount' }
        }
      }
    ]);
    
    const spentMap = {};
    spentByCategory.forEach(item => {
      spentMap[item._id] = item.totalSpent;
    });
    
    const budgetData = categories.map(cat => {
      const totalSpent = spentMap[cat._id] || 0;
      const budgetAmount = cat.budgetAmount || 0;
      const utilization = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
      
      return {
        categoryId: cat._id,
        categoryName: cat.name,
        parentCategory: cat.parentCategory,
        budgetAmount,
        totalSpent,
        remaining: budgetAmount - totalSpent,
        utilization: Math.round(utilization),
        status: totalSpent > budgetAmount ? 'over_budget' : 
                totalSpent >= budgetAmount * 0.9 ? 'warning' : 
                totalSpent === 0 ? 'unused' : 'good'
      };
    });
    
    // Calculate totals
    const totals = budgetData.reduce((acc, item) => {
      acc.totalBudget += item.budgetAmount;
      acc.totalSpent += item.totalSpent;
      return acc;
    }, { totalBudget: 0, totalSpent: 0 });
    
    totals.overallUtilization = totals.totalBudget > 0 
      ? Math.round((totals.totalSpent / totals.totalBudget) * 100) 
      : 0;
    
    res.json({
      success: true,
      data: {
        period,
        totals,
        categories: budgetData
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get categories by budget status
// @route   GET /api/expense-categories/budget/status/:status
// @access  Private (Admin only)
export const getCategoriesByBudgetStatus = async (req, res, next) => {
  try {
    const { status } = req.params; // 'over_budget', 'warning', 'good', 'unused'
    
    const categories = await ExpenseCategory.find({ isActive: true });
    
    // Calculate spent amounts
    const spentByCategory = await Expense.aggregate([
      { $unwind: '$items' },
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$items.category',
          totalSpent: { $sum: '$items.amount' }
        }
      }
    ]);
    
    const spentMap = {};
    spentByCategory.forEach(item => {
      spentMap[item._id] = item.totalSpent;
    });
    
    const filteredCategories = categories.filter(cat => {
      const totalSpent = spentMap[cat._id] || 0;
      const budgetAmount = cat.budgetAmount || 0;
      const utilization = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
      
      switch (status) {
        case 'over_budget':
          return totalSpent > budgetAmount;
        case 'warning':
          return totalSpent >= budgetAmount * 0.9 && totalSpent <= budgetAmount;
        case 'good':
          return totalSpent < budgetAmount * 0.9 && totalSpent > 0;
        case 'unused':
          return totalSpent === 0;
        default:
          return true;
      }
    });
    
    res.json({
      success: true,
      data: filteredCategories.map(cat => ({
        id: cat._id,
        name: cat.name,
        budgetAmount: cat.budgetAmount || 0,
        totalSpent: spentMap[cat._id] || 0
      })),
      count: filteredCategories.length
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Add one-time budget to a category
// @route   POST /api/expense-categories/:id/one-time-budget
// @access  Private (Admin only)
export const addOneTimeBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, amount, date, notes } = req.body;

    const category = await ExpenseCategory.findById(id);
    if (!category) {
      return next(errorHandler(404, 'Expense category not found'));
    }

    // Set budget type to one-time if not already
    if (category.budgetType !== 'one-time') {
      category.budgetType = 'one-time';
    }

    category.oneTimeBudgets.push({
      description,
      amount,
      date: new Date(date),
      status: 'planned',
      notes
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category,
      message: 'One-time budget added successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Update one-time budget
// @route   PUT /api/expense-categories/:id/one-time-budget/:budgetId
// @access  Private (Admin only)
export const updateOneTimeBudget = async (req, res, next) => {
  try {
    const { id, budgetId } = req.params;
    const { description, amount, date, status, notes } = req.body;

    const category = await ExpenseCategory.findById(id);
    if (!category) {
      return next(errorHandler(404, 'Expense category not found'));
    }

    const budget = category.oneTimeBudgets.id(budgetId);
    if (!budget) {
      return next(errorHandler(404, 'One-time budget not found'));
    }

    if (description) budget.description = description;
    if (amount) budget.amount = amount;
    if (date) budget.date = new Date(date);
    if (status) budget.status = status;
    if (notes) budget.notes = notes;

    await category.save();

    res.json({
      success: true,
      data: category,
      message: 'One-time budget updated successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete one-time budget
// @route   DELETE /api/expense-categories/:id/one-time-budget/:budgetId
// @access  Private (Admin only)
export const deleteOneTimeBudget = async (req, res, next) => {
  try {
    const { id, budgetId } = req.params;

    const category = await ExpenseCategory.findById(id);
    if (!category) {
      return next(errorHandler(404, 'Expense category not found'));
    }

    category.oneTimeBudgets.pull(budgetId);
    await category.save();

    res.json({
      success: true,
      message: 'One-time budget deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};