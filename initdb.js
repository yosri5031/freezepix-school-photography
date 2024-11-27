import mongoose from 'mongoose';


// Require your models (adjust paths as needed)
import School from './Photography/School.js';
import Event from './Photography/Event.js';
import Package from './Photography/Package.js';

class DatabaseInitializer {
  static async connectToDatabase() {
    const mongoUri = 'mongodb+srv://servicedesk:Freeze2024@freezepix2024.apzfq.mongodb.net/?retryWrites=true&w=majority&appName=freezepix2024';
    
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      console.log('✅ Successfully connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  static async clearExistingData() {
    try {
      await connection.db.dropCollection('schools');
      await connection.db.dropCollection('events');
      await connection.db.dropCollection('packages');
      console.log('🧹 Existing collections cleared');
    } catch (error) {
      console.log('No existing collections to clear or collections do not exist');
    }
  }

  static async initializeSchools() {
    const schoolsData = [
      {
        name: 'International School of Tunis (mongo)',
        value: 'ist',
        location: 'Tunis',
        country: 'Tunisia',
        isActive: true
      },
      {
        name: 'American Cooperative School of Tunis  (mongo)',
        value: 'acst',
        location: 'Tunis',
        country: 'Tunisia',
        isActive: true
      },
      {
        name: 'New York University  (mongo)',
        value: 'nyu',
        location: 'New York',
        country: 'United States',
        isActive: true
      }
    ];

    try {
      const schools = [];
      for (const schoolData of schoolsData) {
        const school = new School(schoolData);
        await school.save();
        schools.push(school);
      }
      console.log(`🏫 ${schools.length} schools initialized`);
      return schools;
    } catch (error) {
      console.error('Error initializing schools:', error);
      return [];
    }
  }

  static async initializeEvents() {

    const eventsData = [
      {
        name: 'Spring Photography Workshop',
        value: 'spring-workshop-2024',
        date: new Date('2024-04-15'),
        schoolId: schools[0]._id,
        isActive: true
      },
      {
        name: 'Summer Photo Camp',
        value: 'summer-camp-2024',
        date: new Date('2024-07-20'),
        schoolId: schools[1]._id,
        isActive: true
      },
      {
        name: 'NYU Photography Symposium',
        value: 'nyu-photo-symposium-2024',
        date: new Date('2024-09-10'),
        schoolId: schools[2]._id,
        isActive: true
      }
    ];

    try {
      const events = [];
      for (const eventData of eventsData) {
        const event = new Event(eventData);
        await event.save();
        events.push(event);
      }
      console.log(`📅 ${events.length} events initialized`);
      return events;
    } catch (error) {
      console.error('Error initializing events:', error);
      return [];
    }
  }

  static async initializePackages() {
    const packagesData = [
      {
        name: 'Take Photo',
        value: '1 Digital Photo',
        price: 19.99,
        description: '',
        isActive: true
      }
    ];

    try {
      const packages = [];
      for (const packageData of packagesData) {
        const packageItem = new Package(packageData);
        await packageItem.save();
        packages.push(packageItem);
      }
      console.log(`📦 ${packages.length} packages initialized`);
      return packages;
    } catch (error) {
      console.error('Error initializing packages:', error);
      return [];
    }
  }

  static async initializeDatabase() {
    await this.connectToDatabase();
    await this.clearExistingData();
    
    await this.initializeSchools();
    await this.initializeEvents();
    await this.initializePackages();

    console.log('🚀 Database initialization complete');
    process.exit(0);
  }
}

// Immediately Invoked Function Expression (IIFE) to run the initialization
(async () => {
  try {
    await DatabaseInitializer.initializeDatabase();
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
})();