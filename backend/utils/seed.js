require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/database');
const User = require('../model/user');
const ConnectionRequest = require('../model/connectionRequest');

const sampleDevelopers = [
  {
    firstName: 'Sarah',
    lastName: 'Chen',
    emailId: 'sarah.chen@example.com',
    password: 'Password123!',
    age: 26,
    gender: 'female',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    about: 'Full-stack developer obsessed with clean code and intuitive UI. Currently building high-throughput distributed apps with Node.js and React.',
    skills: ['React', 'Node.js', 'Express', 'MongoDB', 'TailwindCSS', 'TypeScript', 'Docker'],
  },
  {
    firstName: 'Alex',
    lastName: 'Rivera',
    emailId: 'alex.rivera@example.com',
    password: 'Password123!',
    age: 29,
    gender: 'male',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    about: 'AI/ML Enthusiast & Backend Engineer. Building LLM-powered developer tools and multi-agent workflows. Looking for hackathon teammates!',
    skills: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'Node.js', 'Redis', 'PostgreSQL'],
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    emailId: 'priya.sharma@example.com',
    password: 'Password123!',
    age: 24,
    gender: 'female',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
    about: 'Frontend specialist & UI/UX aficionado. I love transforming intricate Figma wireframes into pixel-perfect, accessible React experiences.',
    skills: ['React', 'Next.js', 'CSS3', 'TailwindCSS', 'Figma', 'Redux', 'Jest'],
  },
  {
    firstName: 'Marcus',
    lastName: 'Vance',
    emailId: 'marcus.vance@example.com',
    password: 'Password123!',
    age: 32,
    gender: 'male',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    about: 'DevOps & Cloud Architect. Automated CI/CD pipelines, Kubernetes clusters, and zero-downtime AWS deployments are my superpower.',
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'GitHub Actions', 'Linux', 'Go'],
  },
  {
    firstName: 'Elena',
    lastName: 'Rostova',
    emailId: 'elena.rostova@example.com',
    password: 'Password123!',
    age: 27,
    gender: 'female',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    about: 'Mobile & Web cross-platform builder. Love crafting high-framerate mobile apps with React Native and performant web frontends.',
    skills: ['React Native', 'React', 'JavaScript', 'GraphQL', 'Firebase', 'State Management'],
  },
  {
    firstName: 'David',
    lastName: 'Kim',
    emailId: 'david.kim@example.com',
    password: 'Password123!',
    age: 30,
    gender: 'male',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    about: 'Open Source maintainer and backend systems engineer. Obsessed with database query optimization, indexing strategies, and microservices.',
    skills: ['MongoDB', 'Express', 'Mongoose', 'Node.js', 'RabbitMQ', 'Redis', 'Jest'],
  },
  {
    firstName: 'Amina',
    lastName: 'Diallo',
    emailId: 'amina.diallo@example.com',
    password: 'Password123!',
    age: 25,
    gender: 'female',
    photoUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
    about: 'Creative coder & 3D Web enthusiast. Creating immersive Three.js and WebGL interactive portfolio experiences and playful dev tools.',
    skills: ['Three.js', 'WebGL', 'JavaScript', 'React', 'GSAP', 'HTML5 Canvas', 'CSS3'],
  },
  {
    firstName: 'Lucas',
    lastName: 'Silva',
    emailId: 'lucas.silva@example.com',
    password: 'Password123!',
    age: 28,
    gender: 'male',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
    about: 'FinTech developer and cybersecurity researcher. Passionate about cryptography, OAuth 2.0 flows, and robust RESTful API designs.',
    skills: ['Node.js', 'Express', 'JWT', 'OAuth', 'MongoDB', 'REST APIs', 'Cybersecurity'],
  },
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('Clearing existing test data...');
    await User.deleteMany({});
    await ConnectionRequest.deleteMany({});

    console.log('Inserting seed developers...');
    for (const dev of sampleDevelopers) {
      const passwordHash = await bcrypt.hash(dev.password, 10);
      const user = new User({
        ...dev,
        password: passwordHash,
      });
      await user.save();
    }

    console.log(`Successfully seeded ${sampleDevelopers.length} developers into MongoDB!`);
    console.log('Sample login credentials:');
    console.log('Email: sarah.chen@example.com | Password: Password123!');
    console.log('Email: alex.rivera@example.com | Password: Password123!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
