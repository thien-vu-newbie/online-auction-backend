import { Model } from 'mongoose';
import { AdminConfig } from '../../admin/schemas/admin-config.schema';

export async function seedAdminConfigs(adminConfigModel: Model<AdminConfig>) {
  console.log('⚙️  Seeding admin configs...');

  // Clear existing configs
  await adminConfigModel.deleteMany({});

  const configs = await adminConfigModel.insertMany([
    {
      configKey: 'global',
      newProductHighlightMinutes: 5,
      autoExtendThresholdMinutes: 5,
      autoExtendDurationMinutes: 10,
    },
  ]);

  console.log(`   ✅ Created ${configs.length} admin config`);

  return configs;
}
