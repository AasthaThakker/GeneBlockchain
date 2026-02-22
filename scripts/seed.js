const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Import models
const { User } = require('../lib/models/User');
const { GenomicData } = require('../lib/models/GenomicData');
const { LabResult } = require('../lib/models/LabResult');
const { ResearchAccess } = require('../lib/models/ResearchAccess');
const { AccessLog } = require('../lib/models/AccessLog');

const MONGODB_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/genomic-data-platform'

const seedData = {
  patients: [
    {
      email: 'patient1@example.com',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      role: 'PATIENT'
    },
    {
      email: 'patient2@example.com', 
      walletAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      role: 'PATIENT'
    },
    {
      email: 'patient3@example.com',
      walletAddress: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      role: 'PATIENT'
    },
    {
      email: 'patient4@example.com',
      walletAddress: '0x1234567890123456789012345678901234567890',
      role: 'PATIENT'
    }
  ],
  labs: [
    {
      email: 'lab1@genomics.com',
      walletAddress: '0x9876543210987654321098765432109876543210',
      password: 'lab123',
      role: 'LAB'
    },
    {
      email: 'lab2@genomics.com',
      walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      password: 'lab123',
      role: 'LAB'
    },
    {
      email: 'lab3@genomics.com',
      walletAddress: '0x1111111111111111111111111111111111111111',
      password: 'lab123',
      role: 'LAB'
    }
  ],
  researchers: [
    {
      email: 'researcher1@university.edu',
      walletAddress: '0x2222222222222222222222222222222222222222',
      password: 'research123',
      role: 'RESEARCHER'
    },
    {
      email: 'researcher2@university.edu',
      walletAddress: '0x3333333333333333333333333333333333333333',
      password: 'research123',
      role: 'RESEARCHER'
    },
    {
      email: 'researcher3@university.edu',
      walletAddress: '0x4444444444444444444444444444444444444444',
      password: 'research123',
      role: 'RESEARCHER'
    }
  ]
}

const genomicDataSamples = [
  {
    dataType: 'Whole Genome Sequencing',
    size: 150000000000,
    ipfsHash: 'QmXxx1'
  },
  {
    dataType: 'Exome Sequencing',
    size: 30000000000,
    ipfsHash: 'QmXxx2'
  },
  {
    dataType: 'RNA Sequencing',
    size: 50000000000,
    ipfsHash: 'QmXxx3'
  },
  {
    dataType: 'Targeted Panel',
    size: 1000000000,
    ipfsHash: 'QmXxx4'
  }
]

const labResultSamples = [
  {
    testName: 'BRCA1/BRCA2 Mutation Analysis',
    result: 'No pathogenic variants detected',
    status: 'COMPLETED'
  },
  {
    testName: 'Pharmacogenomics Panel',
    result: 'CYP2C19*2 heterozygous - Intermediate metabolizer',
    status: 'COMPLETED'
  },
  {
    testName: 'Cardiovascular Risk Panel',
    result: 'Increased risk for hypertension detected',
    status: 'PENDING'
  }
]

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URL)
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await GenomicData.deleteMany({})
    await LabResult.deleteMany({})
    await ResearchAccess.deleteMany({})
    await AccessLog.deleteMany({})
    console.log('Cleared existing data')

    const createdUsers = []

    // Create patients
    for (const patient of seedData.patients) {
      const user = new User(patient)
      await user.save()
      createdUsers.push({ user, type: 'patient' })
      console.log(`Created patient: ${patient.email}`)
    }

    // Create labs with hashed passwords
    for (const lab of seedData.labs) {
      const hashedPassword = await bcrypt.hash(lab.password, 10)
      const user = new User({
        ...lab,
        password: hashedPassword
      })
      await user.save()
      createdUsers.push({ user, type: 'lab' })
      console.log(`Created lab: ${lab.email}`)
    }

    // Create researchers with hashed passwords
    for (const researcher of seedData.researchers) {
      const hashedPassword = await bcrypt.hash(researcher.password, 10)
      const user = new User({
        ...researcher,
        password: hashedPassword
      })
      await user.save()
      createdUsers.push({ user, type: 'researcher' })
      console.log(`Created researcher: ${researcher.email}`)
    }

    // Create genomic data for patients
    const patients = createdUsers.filter(u => u.type === 'patient')
    for (let i = 0; i < patients.length; i++) {
      const dataSample = genomicDataSamples[i % genomicDataSamples.length]
      const genomicData = new GenomicData({
        userId: patients[i].user._id,
        dataHash: `hash_${Date.now()}_${i}`,
        ...dataSample
      })
      await genomicData.save()
      
      // Create access log
      await AccessLog.create({
        genomicDataId: genomicData._id,
        accessedBy: patients[i].user.walletAddress,
        accessType: 'UPLOAD',
        ipfsHash: dataSample.ipfsHash
      })
      
      console.log(`Created genomic data for patient ${i + 1}`)
    }

    // Create lab results for patients
    const labs = createdUsers.filter(u => u.type === 'lab')
    for (let i = 0; i < patients.length; i++) {
      const resultSample = labResultSamples[i % labResultSamples.length]
      const labResult = new LabResult({
        userId: patients[i].user._id,
        labId: labs[i % labs.length].user._id,
        ...resultSample
      })
      await labResult.save()
      console.log(`Created lab result for patient ${i + 1}`)
    }

    // Create research access requests
    const researchers = createdUsers.filter(u => u.type === 'researcher')
    const allGenomicData = await GenomicData.find({})
    
    for (let i = 0; i < Math.min(3, researchers.length); i++) {
      for (let j = 0; j < Math.min(2, allGenomicData.length); j++) {
        const researchAccess = new ResearchAccess({
          researcherId: researchers[i].user._id,
          genomicDataId: allGenomicData[j]._id,
          accessLevel: 'READ_ONLY',
          purpose: `Research study ${i + 1} - Genetic markers analysis`,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        })
        await researchAccess.save()
        
        // Create access log
        await AccessLog.create({
          genomicDataId: allGenomicData[j]._id,
          accessedBy: researchers[i].user.walletAddress,
          accessType: 'ACCESS_GRANTED'
        })
        
        console.log(`Created research access for researcher ${i + 1}`)
      }
    }

    console.log('\n✅ Database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`- Patients: ${seedData.patients.length}`)
    console.log(`- Labs: ${seedData.labs.length}`)
    console.log(`- Researchers: ${seedData.researchers.length}`)
    console.log(`- Genomic Data: ${patients.length}`)
    console.log(`- Lab Results: ${patients.length}`)
    console.log(`- Research Access: ${Math.min(3, researchers.length) * Math.min(2, allGenomicData.length)}`)
    
    console.log('\n🔑 Login Credentials:')
    console.log('Labs:')
    seedData.labs.forEach((lab, i) => {
      console.log(`  ${lab.email} - Password: lab123`)
    })
    console.log('Researchers:')
    seedData.researchers.forEach((researcher, i) => {
      console.log(`  ${researcher.email} - Password: research123`)
    })

  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await mongoose.connection.close()
  }
}

seedDatabase()
