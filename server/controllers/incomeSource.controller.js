// controllers/incomeSource.controller.js
import IncomeSource from '../models/incomeSource.model.js';
import { errorHandler } from '../utils/error.js';

// @desc    Get all income sources
// @route   GET /api/income-sources
// @access  Private (Admin only)
export const getIncomeSources = async (req, res, next) => {
  try {
    const { type, isActive = true } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const sources = await IncomeSource.find(query)
      .populate('createdBy', 'name email')
      .sort({ type: 1, name: 1 });
    
    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single income source by ID
// @route   GET /api/income-sources/:id
// @access  Private (Admin only)
export const getIncomeSource = async (req, res, next) => {
  try {
    const source = await IncomeSource.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!source) {
      return next(errorHandler(404, 'Income source not found'));
    }
    
    res.json({
      success: true,
      data: source
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create a new income source
// @route   POST /api/income-sources
// @access  Private (Admin only)
export const createIncomeSource = async (req, res, next) => {
  try {
    const { name, type, description } = req.body;
    
    // Check if source with this type already exists
    const existingSource = await IncomeSource.findOne({ type });
    if (existingSource) {
      return next(errorHandler(400, `Income source with type '${type}' already exists`));
    }
    
    const source = await IncomeSource.create({
      name,
      type,
      description,
      createdBy: req.user._id,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      data: source,
      message: 'Income source created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, messages.join(', ')));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Update an income source
// @route   PUT /api/income-sources/:id
// @access  Private (Admin only)
export const updateIncomeSource = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    
    const source = await IncomeSource.findById(req.params.id);
    if (!source) {
      return next(errorHandler(404, 'Income source not found'));
    }
    
    // Prevent changing type for system-critical sources
    if (source.type === 'fees' && req.body.type && req.body.type !== 'fees') {
      return next(errorHandler(400, 'Cannot change type of Student Fees source'));
    }
    
    source.name = name || source.name;
    source.description = description !== undefined ? description : source.description;
    source.isActive = isActive !== undefined ? isActive : source.isActive;
    
    await source.save();
    
    res.json({
      success: true,
      data: source,
      message: 'Income source updated successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete an income source
// @route   DELETE /api/income-sources/:id
// @access  Private (Admin only)
export const deleteIncomeSource = async (req, res, next) => {
  try {
    const source = await IncomeSource.findById(req.params.id);
    if (!source) {
      return next(errorHandler(404, 'Income source not found'));
    }
    
    // Prevent deletion of system-critical sources
    if (source.type === 'fees' || source.type === 'director_investment') {
      return next(errorHandler(400, `Cannot delete '${source.type}' as it is a system-critical income source`));
    }
    
    // Check if there are any income transactions using this source
    const IncomeTransaction = mongoose.model('IncomeTransaction');
    const hasTransactions = await IncomeTransaction.exists({ incomeSource: source._id });
    
    if (hasTransactions) {
      return next(errorHandler(400, 'Cannot delete income source with existing transactions. Deactivate it instead.'));
    }
    
    await source.deleteOne();
    
    res.json({
      success: true,
      message: 'Income source deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get income source types (enum values)
// @route   GET /api/income-sources/types
// @access  Private (Admin only)
export const getIncomeSourceTypes = async (req, res, next) => {
  try {
    const types = [
      { value: 'fees', label: 'Student Fees' },
      { value: 'director_investment', label: 'Director Investment' },
      { value: 'grant', label: 'Grant' },
      { value: 'donation', label: 'Donation' },
      { value: 'investment', label: 'Investment Income' },
      { value: 'auxiliary', label: 'Auxiliary Income' },
      { value: 'other', label: 'Other Income' }
    ];
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};