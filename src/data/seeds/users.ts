import { Model } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

export async function seedUsers(userModel: Model<User>) {
  console.log('👥 Seeding users...');
  
  // Clear existing users
  await userModel.deleteMany({});
  
  const hashedPassword = await bcrypt.hash('Password123', 10);

  const users = await userModel.insertMany([
    // Admin
    {
      fullName: 'Admin User',
      email: 'admin@auction.com',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      address: '123 Admin Street, Q1, TP.HCM',
      dateOfBirth: new Date('1985-01-01'),
      ratingPositive: 1,
      ratingNegative: 0,
    },
    // Sellers
    {
      fullName: 'TechStore Vietnam',
      email: 'techstore@auction.com',
      password: hashedPassword,
      role: 'seller',
      isEmailVerified: true,
      address: '456 Tech Road, Q1, TP.HCM',
      dateOfBirth: new Date('1990-03-15'),
      ratingPositive: 98,
      ratingNegative: 2,
      sellerUpgradeExpiry: new Date('2027-12-31'),
    },
    {
      fullName: 'LuxuryWatch Store',
      email: 'luxurywatch@auction.com',
      password: hashedPassword,
      role: 'seller',
      isEmailVerified: true,
      address: '789 Luxury Ave, Q1, TP.HCM',
      dateOfBirth: new Date('1988-06-20'),
      ratingPositive: 100,
      ratingNegative: 0,
      sellerUpgradeExpiry: new Date('2027-12-31'),
    },
    {
      fullName: 'SneakerHead Shop',
      email: 'sneakerhead@auction.com',
      password: hashedPassword,
      role: 'seller',
      isEmailVerified: true,
      address: '321 Sneaker Blvd, Q3, TP.HCM',
      dateOfBirth: new Date('1995-09-10'),
      ratingPositive: 96,
      ratingNegative: 4,
      sellerUpgradeExpiry: new Date('2027-12-31'),
    },
    {
      fullName: 'Art Gallery Saigon',
      email: 'artgallery@auction.com',
      password: hashedPassword,
      role: 'seller',
      isEmailVerified: true,
      address: '555 Art Street, Q1, TP.HCM',
      dateOfBirth: new Date('1980-12-05'),
      ratingPositive: 100,
      ratingNegative: 0,
      sellerUpgradeExpiry: new Date('2027-12-31'),
    },
    {
      fullName: 'Fashion House',
      email: 'fashion@auction.com',
      password: hashedPassword,
      role: 'seller',
      isEmailVerified: true,
      address: '888 Fashion St, Q7, TP.HCM',
      dateOfBirth: new Date('1992-04-18'),
      ratingPositive: 95,
      ratingNegative: 5,
      sellerUpgradeExpiry: new Date('2027-12-31'),
    },
    // Bidders
    {
      fullName: 'normal bidder',
      email: 'normalbid1@gmail.com',
      password: hashedPassword,
      role: 'bidder',
      isEmailVerified: true,
      address: '12 Nguyen Hue, Q1, TP.HCM',
      dateOfBirth: new Date('1995-05-15'),
      ratingPositive: 45,
      ratingNegative: 5,
    },
    {
      fullName: 'Bidder 2',
      email: 'bidder2@gmail.com',
      password: hashedPassword,
      role: 'bidder',
      isEmailVerified: true,
      address: '34 Le Loi, Q3, TP.HCM',
      dateOfBirth: new Date('1998-08-20'),
      ratingPositive: 0,
      ratingNegative: 0,
    },
    {
      fullName: 'Le Van C',
      email: 'levanc@gmail.com',
      password: hashedPassword,
      role: 'bidder',
      isEmailVerified: true,
      address: '56 Tran Hung Dao, Q5, TP.HCM',
      dateOfBirth: new Date('1993-11-10'),
      ratingPositive: 60,
      ratingNegative: 10,
    },
    {
      fullName: 'Pham Thi D',
      email: 'phamthid@gmail.com',
      password: hashedPassword,
      role: 'bidder',
      isEmailVerified: true,
      address: '78 Hai Ba Trung, Q1, TP.HCM',
      dateOfBirth: new Date('1996-03-25'),
      ratingPositive: 40,
      ratingNegative: 0,
    },
  ]);

  console.log(`   ✅ Created ${users.length} users`);
  
  return {
    admin: users[0],
    sellers: users.slice(1, 6),
    bidders: users.slice(6),
  };
}
