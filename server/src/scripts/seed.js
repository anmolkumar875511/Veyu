// ─────────────────────────────────────────────────────────────────────────────
// scripts/seed.js
//
// Run ONCE to generate a large dataset:
//   npm run seed
//
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import Ward, { STRESS_BANDS } from '../models/ward.model.js';
import User from '../models/user.model.js';
import Complaint, { COMPLAINT_CATEGORIES, COMPLAINT_STATUS } from '../models/complaint.model.js';
import Assignment, { ASSIGNMENT_STATUS } from '../models/assignment.model.js';
import Observation, { OBSERVATION_STATUS } from '../models/observation.model.js';
import Vote from '../models/vote.model.js';

if (!process.env.MONGODB_URI) {
    console.error('\n✗ MONGODB_URI is not set in .env\n');
    process.exit(1);
}

// ── Configuration for Large Dataset ──────────────────────────────────────────
const NUM_WARDS = 20;
const NUM_CITIZENS = 150;
const NUM_WORKERS = 30;
const NUM_OFFICERS = 10;
const NUM_COMPLAINTS = 1000;

const PASS = 'demo1234';

// Helpers
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomCoords = () => [79.4 + Math.random() * 0.1, 28.3 + Math.random() * 0.1]; // Around Nagarik City

// ── Main Seed Function ───────────────────────────────────────────────────────
async function seed() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Nagarik — Large Dataset Seeding');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB Atlas\n');

    // 0. Clear existing data to prevent unique constraint errors during bulk insert
    console.log('Cleaning existing database...');
    await Promise.all([
        Ward.deleteMany({}),
        User.deleteMany({}),
        Complaint.deleteMany({}),
        Assignment.deleteMany({}),
        Observation.deleteMany({}),
        Vote.deleteMany({}),
    ]);

    // 1. Wards ────────────────────────────────────────────────────────────────
    console.log('Seeding Wards...');
    const wardsData = Array.from({ length: NUM_WARDS }).map((_, i) => ({
        wardNumber: i + 1,
        name: `Ward ${i + 1} — Sector ${String.fromCharCode(65 + (i % 26))}`,
        city: 'Nagarik City',
        healthScore: randomInt(40, 95),
        pulseVelocity: Math.random() * 5,
        isActive: true,
    }));

    const wards = await Ward.insertMany(wardsData);
    console.log(`  ✓ Inserted ${wards.length} Wards`);

    // 2. Users ────────────────────────────────────────────────────────────────
    console.log('Seeding Users...');
    // IMPORTANT: .insertMany() bypasses Mongoose pre('save') hooks.
    // Therefore, we MUST hash the password here for bulk users.
    const preHashedPassword = await bcrypt.hash(PASS, 12);

    // Create Demo Users via .create() to intentionally trigger the pre('save') hook
    // Fix: We pass the plain text PASS, letting the model handle the hashing.
    const demoUsersData = [
        {
            name: 'Anmol Kumar',
            email: 'citizen@nagarik.dev',
            role: 'citizen',
            password: PASS,
            reputationScore: 25,
        },
        {
            name: 'Priya Sharma',
            email: 'officer@nagarik.dev',
            role: 'officer',
            password: PASS,
            assignedWard: wards[0]._id,
        },
        {
            name: 'Ravi Singh',
            email: 'worker@nagarik.dev',
            role: 'worker',
            password: PASS,
            assignedWard: wards[1]._id,
        },
        { name: 'Admin Nagarik', email: 'admin@nagarik.dev', role: 'admin', password: PASS },
    ];

    const demoUsers = [];
    for (const u of demoUsersData) {
        demoUsers.push(await User.create(u));
    }

    // Create Bulk Users via .insertMany() using the pre-hashed password
    const bulkUsersData = [];
    for (let i = 0; i < NUM_CITIZENS; i++) {
        bulkUsersData.push({
            name: `Citizen ${i}`,
            email: `citizen${i}@test.com`,
            role: 'citizen',
            password: preHashedPassword,
            reputationScore: randomInt(0, 100),
        });
    }
    for (let i = 0; i < NUM_WORKERS; i++) {
        bulkUsersData.push({
            name: `Worker ${i}`,
            email: `worker${i}@test.com`,
            role: 'worker',
            password: preHashedPassword,
            assignedWard: randomItem(wards)._id,
        });
    }
    for (let i = 0; i < NUM_OFFICERS; i++) {
        bulkUsersData.push({
            name: `Officer ${i}`,
            email: `officer${i}@test.com`,
            role: 'officer',
            password: preHashedPassword,
            assignedWard: randomItem(wards)._id,
        });
    }

    const bulkUsers = await User.insertMany(bulkUsersData);
    const allUsers = [...demoUsers, ...bulkUsers];

    const citizens = allUsers.filter((u) => u.role === 'citizen');
    const workers = allUsers.filter((u) => u.role === 'worker');
    const officers = allUsers.filter((u) => u.role === 'officer');

    console.log(`  ✓ Inserted ${allUsers.length} Users`);

    // 3. Complaints ───────────────────────────────────────────────────────────
    console.log('Seeding Complaints...');
    const complaintsData = Array.from({ length: NUM_COMPLAINTS }).map((_, i) => {
        const status = randomItem(Object.values(COMPLAINT_STATUS));
        const createdAt = new Date(Date.now() - randomInt(0, 30) * 86_400_000);

        return {
            title: `Issue reported with ${randomItem(COMPLAINT_CATEGORIES).toLowerCase()} at location ${i}`,
            description: `This is a generated description for complaint #${i}. The severity and status are simulated for testing purposes.`,
            category: randomItem(COMPLAINT_CATEGORIES),
            status: status,
            imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
            location: { type: 'Point', coordinates: randomCoords() },
            wardId: randomItem(wards)._id,
            severity: randomInt(1, 10),
            aiConfidence: Math.random() * 0.5 + 0.5,
            categorySource: Math.random() > 0.2 ? 'ai' : 'manual',
            createdBy: randomItem(citizens)._id,
            createdAt,
            resolvedAt:
                status === 'resolved'
                    ? new Date(createdAt.getTime() + randomInt(1, 5) * 86_400_000)
                    : null,
            upvotes: randomInt(0, 50),
        };
    });

    const complaints = await Complaint.insertMany(complaintsData);
    console.log(`  ✓ Inserted ${complaints.length} Complaints`);

    // 4. Assignments ──────────────────────────────────────────────────────────
    console.log('Seeding Assignments...');
    const assignmentsData = complaints
        .filter((c) => ['assigned', 'in_progress', 'resolved'].includes(c.status))
        .map((c) => ({
            complaintId: c._id,
            workerId: randomItem(workers)._id,
            assignedBy: randomItem(officers)._id,
            wardId: c.wardId,
            status:
                c.status === 'resolved'
                    ? 'completed'
                    : randomItem(['pending', 'acknowledged', 'on_site']),
            instructions: 'Standard operating procedure for this category.',
            createdAt: c.createdAt,
            completedAt: c.resolvedAt,
        }));

    await Assignment.insertMany(assignmentsData);
    console.log(`  ✓ Inserted ${assignmentsData.length} Assignments`);

    // 5. Votes ────────────────────────────────────────────────────────────────
    console.log('Seeding Votes...');
    const votesData = [];
    // Give random upvotes to the first 100 complaints to simulate trending issues
    for (let i = 0; i < 100; i++) {
        const targetComplaint = complaints[i];
        const numVotes = randomInt(1, 10);
        for (let v = 0; v < numVotes; v++) {
            votesData.push({
                complaintId: targetComplaint._id,
                userId: randomItem(citizens)._id,
                voteType: 'upvote',
            });
        }
    }

    // Deduplicate votes (User can only vote once per complaint)
    const uniqueVotes = Array.from(
        new Set(votesData.map((v) => `${v.complaintId}-${v.userId}`))
    ).map((idString) => {
        const [cId, uId] = idString.split('-');
        return { complaintId: cId, userId: uId, voteType: 'upvote' };
    });

    await Vote.insertMany(uniqueVotes);
    console.log(`  ✓ Inserted ${uniqueVotes.length} Votes`);

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Done Seeding Large Dataset');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Demo Credentials (All passwords: demo1234)');
    demoUsersData.forEach((u) => console.log(`  ${u.role.padEnd(8)} → ${u.email}`));
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
