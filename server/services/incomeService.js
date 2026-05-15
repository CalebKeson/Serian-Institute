// services/incomeService.js
import mongoose from 'mongoose';
import IncomeSource from '../models/incomeSource.model.js';
import IncomeTransaction from '../models/incomeTransaction.model.js';

// Helper function to generate transaction number
const generateTransactionNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const count = await IncomeTransaction.countDocuments();
  const sequence = (count + 1).toString().padStart(4, '0');
  return `INC-${year}${month}-${sequence}`;
};

// ==================== CREATE INCOME FROM PAYMENT ====================
export const createIncomeFromPayment = async (payment, course, student, userId, session = null) => {
  try {
    let feesSource = await IncomeSource.findOne({ type: 'fees' }).session(session);
    
    if (!feesSource) {
      const [newSource] = await IncomeSource.create([{
        name: 'Student Fees',
        type: 'fees',
        description: 'All student fee payments',
        createdBy: userId
      }], { session });
      feesSource = newSource;
    }
    
    const transactionNumber = await generateTransactionNumber();
    
    const [incomeTransaction] = await IncomeTransaction.create([{
      transactionNumber,
      incomeSource: feesSource._id,
      sourceType: 'fees',
      studentId: student._id,  // FIXED: Using studentId field name
      courseId: course._id,
      paymentId: payment._id,
      amount: payment.amount,
      incomeDate: payment.paymentDate,
      description: `Fee payment for ${course.name} (${course.courseCode})`,
      reference: payment.transactionId || payment.paymentReference,
      paymentMethod: payment.paymentMethod,
      status: 'received',
      recordedBy: userId
    }], { session });
    
    return incomeTransaction;
    
  } catch (error) {
    console.error('❌ Error in createIncomeFromPayment:', error);
    throw error;
  }
};

// ==================== CREATE INCOME FROM DIRECTOR ====================
export const createIncomeFromDirector = async (directorData, userId, session = null) => {
  try {
    let directorSource = await IncomeSource.findOne({ type: 'director_investment' }).session(session);
    
    if (!directorSource) {
      const [newSource] = await IncomeSource.create([{
        name: 'Director Investments',
        type: 'director_investment',
        description: 'Capital investments from directors (repaid via shares/dividends)',
        createdBy: userId
      }], { session });
      directorSource = newSource;
    }
    
    const transactionNumber = await generateTransactionNumber();
    
    const [incomeTransaction] = await IncomeTransaction.create([{
      transactionNumber,
      incomeSource: directorSource._id,
      sourceType: 'director_investment',
      directorId: directorData.directorId,
      investmentType: directorData.investmentType || 'equity',
      repaymentTerms: directorData.repaymentTerms || 'shares',
      interestRate: directorData.interestRate,
      amount: directorData.amount,
      incomeDate: directorData.incomeDate || new Date(),
      description: directorData.description || 'Director investment',
      reference: directorData.reference,
      paymentMethod: directorData.paymentMethod || 'bank_transfer',
      status: 'received',
      recordedBy: userId
    }], { session });
    
    return incomeTransaction;
    
  } catch (error) {
    console.error('❌ Error in createIncomeFromDirector:', error);
    throw error;
  }
};

// ==================== CREATE INCOME FROM GRANT ====================
export const createIncomeFromGrant = async (grantData, userId, session = null) => {
  try {
    let grantSource = await IncomeSource.findOne({ type: 'grant' }).session(session);
    
    if (!grantSource) {
      const [newSource] = await IncomeSource.create([{
        name: 'Grants',
        type: 'grant',
        description: 'Grants from government and organizations',
        createdBy: userId
      }], { session });
      grantSource = newSource;
    }
    
    const transactionNumber = await generateTransactionNumber();
    
    const [incomeTransaction] = await IncomeTransaction.create([{
      transactionNumber,
      incomeSource: grantSource._id,
      sourceType: 'grant',
      donorName: grantData.donorName,
      donorType: grantData.donorType,
      grantReference: grantData.grantReference,
      grantPeriod: grantData.grantPeriod,
      amount: grantData.amount,
      incomeDate: grantData.incomeDate || new Date(),
      description: grantData.description || 'Grant received',
      reference: grantData.reference,
      paymentMethod: grantData.paymentMethod,
      status: 'received',
      recordedBy: userId
    }], { session });
    
    return incomeTransaction;
    
  } catch (error) {
    console.error('❌ Error in createIncomeFromGrant:', error);
    throw error;
  }
};

// ==================== CREATE INCOME FROM DONATION ====================
export const createIncomeFromDonation = async (donationData, userId, session = null) => {
  try {
    let donationSource = await IncomeSource.findOne({ type: 'donation' }).session(session);
    
    if (!donationSource) {
      const [newSource] = await IncomeSource.create([{
        name: 'Donations',
        type: 'donation',
        description: 'Donations from individuals and organizations',
        createdBy: userId
      }], { session });
      donationSource = newSource;
    }
    
    const transactionNumber = await generateTransactionNumber();
    
    const [incomeTransaction] = await IncomeTransaction.create([{
      transactionNumber,
      incomeSource: donationSource._id,
      sourceType: 'donation',
      donorName: donationData.donorName,
      donorType: donationData.donorType,
      amount: donationData.amount,
      incomeDate: donationData.incomeDate || new Date(),
      description: donationData.description || 'Donation received',
      reference: donationData.reference,
      paymentMethod: donationData.paymentMethod,
      status: 'received',
      recordedBy: userId
    }], { session });
    
    return incomeTransaction;
    
  } catch (error) {
    console.error('❌ Error in createIncomeFromDonation:', error);
    throw error;
  }
};

// ==================== CREATE INCOME FROM AUXILIARY ====================
export const createIncomeFromAuxiliary = async (auxiliaryData, userId, session = null) => {
  try {
    let auxiliarySource = await IncomeSource.findOne({ type: 'auxiliary' }).session(session);
    
    if (!auxiliarySource) {
      const [newSource] = await IncomeSource.create([{
        name: 'Auxiliary Income',
        type: 'auxiliary',
        description: 'Income from canteen, bookshop, facility rental, etc.',
        createdBy: userId
      }], { session });
      auxiliarySource = newSource;
    }
    
    const transactionNumber = await generateTransactionNumber();
    
    const [incomeTransaction] = await IncomeTransaction.create([{
      transactionNumber,
      incomeSource: auxiliarySource._id,
      sourceType: 'auxiliary',
      amount: auxiliaryData.amount,
      incomeDate: auxiliaryData.incomeDate || new Date(),
      description: auxiliaryData.description,
      reference: auxiliaryData.reference,
      paymentMethod: auxiliaryData.paymentMethod,
      status: 'received',
      recordedBy: userId
    }], { session });
    
    return incomeTransaction;
    
  } catch (error) {
    console.error('❌ Error in createIncomeFromAuxiliary:', error);
    throw error;
  }
};

// ==================== CREATE INCOME FROM OTHER SOURCE ====================
export const createIncomeFromOther = async (otherData, userId, session = null) => {
  try {
    let otherSource = await IncomeSource.findOne({ type: 'other' }).session(session);
    
    if (!otherSource) {
      const [newSource] = await IncomeSource.create([{
        name: 'Other Income',
        type: 'other',
        description: 'Miscellaneous income not covered elsewhere',
        createdBy: userId
      }], { session });
      otherSource = newSource;
    }
    
    const transactionNumber = await generateTransactionNumber();
    
    const [incomeTransaction] = await IncomeTransaction.create([{
      transactionNumber,
      incomeSource: otherSource._id,
      sourceType: otherData.customType || 'other',
      amount: otherData.amount,
      incomeDate: otherData.incomeDate || new Date(),
      description: otherData.description,
      reference: otherData.reference,
      paymentMethod: otherData.paymentMethod,
      status: 'received',
      recordedBy: userId
    }], { session });
    
    return incomeTransaction;
    
  } catch (error) {
    console.error('❌ Error in createIncomeFromOther:', error);
    throw error;
  }
};

// ==================== CREATE INCOME FROM ANY SOURCE (UNIFIED) ====================
export const createIncome = async (incomeData, userId, session = null) => {
  const { sourceType } = incomeData;
  
  switch (sourceType) {
    case 'fees':
      throw new Error('Use payment system for fee income');
    case 'director_investment':
      return createIncomeFromDirector(incomeData, userId, session);
    case 'grant':
      return createIncomeFromGrant(incomeData, userId, session);
    case 'donation':
      return createIncomeFromDonation(incomeData, userId, session);
    case 'auxiliary':
      return createIncomeFromAuxiliary(incomeData, userId, session);
    case 'other':
      return createIncomeFromOther(incomeData, userId, session);
    default:
      throw new Error(`Unknown income source type: ${sourceType}`);
  }
};

// ==================== UPDATE INCOME ALLOCATION ====================
export const updateIncomeAllocation = async (incomeId, allocatedAmount, session = null) => {
  try {
    const income = await IncomeTransaction.findById(incomeId).session(session);
    if (!income) {
      throw new Error('Income transaction not found');
    }
    
    income.allocatedAmount += allocatedAmount;
    income.unallocatedAmount = income.amount - income.allocatedAmount;
    
    await income.save({ session });
    return income;
  } catch (error) {
    console.error('❌ Error updating income allocation:', error);
    throw error;
  }
};