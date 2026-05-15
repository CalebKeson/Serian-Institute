// scripts/createInitialIncomeSources.js
import mongoose from 'mongoose';
import IncomeSource from '../models/IncomeSource.model.js';
import User from '../models/user.model.js';

console.log('🔍 Checking environment variables...');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined');
  process.exit(1);
}

const createInitialSources = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create a system user
    let systemUser = await User.findOne({ email: 'system@serian.ac.ke' });
    
    if (!systemUser) {
      console.log('Creating system user...');
      systemUser = await User.create({
        name: 'System',
        email: 'system@serian.ac.ke',
        password: Math.random().toString(36).slice(-12), // Random password
        role: 'admin',
        isActive: true
      });
      console.log('✅ System user created');
    }

    const sources = [
      { name: 'Student Fees', type: 'fees', description: 'All student fee payments' },
      { name: 'Director Investments', type: 'director_investment', description: 'Capital investments from directors' },
      { name: 'Government Grants', type: 'grant', description: 'Grants from government agencies' },
      { name: 'Donations', type: 'donation', description: 'Donations from individuals and organizations' },
      { name: 'Auxiliary Income', type: 'auxiliary', description: 'Canteen, bookshop, uniform sales' },
      { name: 'Investment Income', type: 'investment', description: 'Interest, dividends, etc.' },
      { name: 'Other Income', type: 'other', description: 'Miscellaneous income' }
    ];

    let created = 0;
    let skipped = 0;

    for (const source of sources) {
      const existing = await IncomeSource.findOne({ type: source.type });
      if (!existing) {
        await IncomeSource.create({
          ...source,
          createdBy: systemUser._id // Use the system user's ID
        });
        console.log(`✅ Created: ${source.name}`);
        created++;
      } else {
        console.log(`⏭️  Already exists: ${source.name}`);
        skipped++;
      }
    }

    console.log(`\n✨ Complete! Created: ${created}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createInitialSources();