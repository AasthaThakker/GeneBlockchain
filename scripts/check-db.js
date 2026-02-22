require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/genomic-data-platform'

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Checking database connection...')
    console.log(`📍 Connection URL: ${MONGODB_URL}`)
    
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Successfully connected to MongoDB!')
    
    // Get database info
    const db = mongoose.connection.db
    const collections = await db.listCollections().toArray()
    
    console.log('\n📊 Database Information:')
    console.log(`Database Name: ${db.databaseName}`)
    console.log(`Collections: ${collections.length}`)
    
    if (collections.length > 0) {
      console.log('\n📁 Collections and Document Counts:')
      
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments()
        console.log(`  - ${collection.name}: ${count} documents`)
      }
      
      // Show sample data from each collection
      console.log('\n📋 Sample Data:')
      
      for (const collection of collections) {
        const sample = await db.collection(collection.name).findOne()
        if (sample) {
          console.log(`\n${collection.name.toUpperCase()} (Sample):`)
          
          // Show only key fields for readability
          const keys = Object.keys(sample).slice(0, 5)
          keys.forEach(key => {
            let value = sample[key]
            if (typeof value === 'object' && value !== null) {
              value = '[Object]'
            } else if (typeof value === 'string' && value.length > 50) {
              value = value.substring(0, 50) + '...'
            }
            console.log(`  ${key}: ${value}`)
          })
          
          if (Object.keys(sample).length > 5) {
            console.log(`  ... and ${Object.keys(sample).length - 5} more fields`)
          }
        }
      }
    }
    
    console.log('\n🎉 Database connection test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting:')
      console.log('1. Make sure MongoDB is running on your system')
      console.log('2. Check if MongoDB is installed: mongod --version')
      console.log('3. Start MongoDB service: mongod')
      console.log('4. Verify connection string in .env file')
    } else if (error.message.includes('Authentication')) {
      console.log('\n💡 Troubleshooting:')
      console.log('1. Check MongoDB credentials in connection string')
      console.log('2. Verify user has permission to access the database')
    }
    
  } finally {
    await mongoose.connection.close()
    console.log('\n🔌 Database connection closed')
  }
}

checkDatabaseConnection()
