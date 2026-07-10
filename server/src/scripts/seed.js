// ─────────────────────────────────────────────────────────────────────────────
// scripts/seed.js
//
// Populates the database with a large, internally-consistent, realistic
// dataset that exercises every feature of the platform — including the
// SilentSignal seasonal forecasting engine, PulseGrid ward velocity,
// CascadeRisk flagging, FieldMesh observations, reputation/field points,
// notifications, votes, assignments, and ward health scoring.
//
// Run:  npm run seed
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import Ward from '../models/ward.model.js';
import User from '../models/user.model.js';
import Complaint, { COMPLAINT_CATEGORIES, COMPLAINT_STATUS } from '../models/complaint.model.js';
import Assignment, { ASSIGNMENT_STATUS } from '../models/assignment.model.js';
import { computeWardVoronoiCells } from '../utils/voronoi.util.js';
import Observation, { OBSERVATION_STATUS } from '../models/observation.model.js';
import Vote from '../models/vote.model.js';
import Notification, { NOTIFICATION_TYPES } from '../models/notification.model.js';
import Forecast, { FORECAST_STATUS, FORECAST_TRIGGERS } from '../models/forecast.model.js';

import { recomputeAllWards } from '../services/pulseGrid.service.js';
import { recomputeAllWardStats } from '../services/ward.service.js';
import { generateForecasts } from '../services/silentSignal.service.js';
import { CASCADE_RISK, FIELDMESH, REPUTATION } from '../constants/index.js';

if (!process.env.MONGODB_URI) {
    console.error('\n✗ MONGODB_URI is not set in .env\n');
    process.exit(1);
}

const { ObjectId } = mongoose.Types;
const DAY_MS = 86_400_000;
const PASS = 'demo1234';

// ── Generic helpers ──────────────────────────────────────────────────────────
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, dp = 2) => {
    const v = Math.random() * (max - min) + min;
    return Math.round(v * 10 ** dp) / 10 ** dp;
};
const sample = (arr, n) => {
    const copy = [...arr];
    const out = [];
    n = Math.min(n, copy.length);
    for (let i = 0; i < n; i++) {
        out.push(copy.splice(randomInt(0, copy.length - 1), 1)[0]);
    }
    return out;
};
const daysAgo = (n, hourJitter = true) =>
    new Date(Date.now() - n * DAY_MS - (hourJitter ? randomInt(0, 23) * 3_600_000 : 0));

// ── Geography — Bareilly, UP ─────────────────────────────────────────────────
const CITY = 'Bareilly';
const CITY_CENTER = { lat: 28.367, lon: 79.4304 };

const WARD_DEFS = [
    { name: 'Civil Lines', dLat: 0.021, dLon: -0.018 },
    { name: 'Cantt', dLat: 0.03, dLon: 0.012 },
    { name: 'Kila', dLat: -0.014, dLon: -0.026 },
    { name: 'Prem Nagar', dLat: 0.006, dLon: 0.028 },
    { name: 'Rajendra Nagar', dLat: -0.028, dLon: 0.008 },
    { name: 'Subhash Nagar', dLat: 0.014, dLon: -0.005 },
    { name: 'Krishna Nagar', dLat: -0.007, dLon: 0.019 },
    { name: 'Shahamatganj', dLat: -0.02, dLon: -0.011 },
    { name: 'Bakshi Bazar', dLat: 0.0, dLon: 0.0 },
    { name: 'Model Town', dLat: 0.024, dLon: 0.024 },
    { name: 'Ramganga Vihar', dLat: -0.033, dLon: -0.004 },
    { name: 'Iqbal Nagar', dLat: 0.011, dLon: -0.032 },
];

function jitterCoords(centerLat, centerLon, spreadKm = 1.2) {
    const dLat = (Math.random() - 0.5) * (spreadKm / 111);
    const dLon = (Math.random() - 0.5) * (spreadKm / (111 * Math.cos((centerLat * Math.PI) / 180)));
    return [Number((centerLon + dLon).toFixed(6)), Number((centerLat + dLat).toFixed(6))]; // [lng, lat]
}

function metresOffset(centerLat, centerLon, metres) {
    const bearing = Math.random() * 2 * Math.PI;
    const dLat = (metres * Math.cos(bearing)) / 111_320;
    const dLon = (metres * Math.sin(bearing)) / (111_320 * Math.cos((centerLat * Math.PI) / 180));
    return [Number((centerLon + dLon).toFixed(6)), Number((centerLat + dLat).toFixed(6))];
}

const STREETS = [
    'Civil Lines Road',
    'Cantt Road',
    'Kila Road Market',
    'Prem Nagar Colony',
    'Rajendra Nagar Chowk',
    'Subhash Nagar Marg',
    'Krishna Nagar Gali No. 4',
    'Shahamatganj Chauraha',
    'Bakshi Bazar Lane',
    'Model Town Sector 2',
    'Ramganga Vihar Phase 1',
    'Iqbal Nagar Road',
    'Baradari',
    'Butler Plaza Road',
    'Delapeer Chowk',
    'Income Tax Chauraha',
    'Rohilkhand University Road',
    'Junction Road',
    'Old City Bazar',
    'Nawabganj Road',
];

// ── Indian names ─────────────────────────────────────────────────────────────
const FIRST_NAMES = [
    'Aarav',
    'Vivaan',
    'Aditya',
    'Vihaan',
    'Arjun',
    'Sai',
    'Reyansh',
    'Krishna',
    'Ishaan',
    'Rohan',
    'Kabir',
    'Aryan',
    'Dev',
    'Karan',
    'Rahul',
    'Amit',
    'Sanjay',
    'Manoj',
    'Deepak',
    'Anil',
    'Priya',
    'Ananya',
    'Diya',
    'Saanvi',
    'Aadhya',
    'Ishita',
    'Kavya',
    'Neha',
    'Pooja',
    'Riya',
    'Sneha',
    'Meera',
    'Anjali',
    'Divya',
    'Simran',
    'Farhan',
    'Zoya',
    'Imran',
    'Ayesha',
    'Nikhil',
];
const LAST_NAMES = [
    'Sharma',
    'Verma',
    'Gupta',
    'Singh',
    'Kumar',
    'Yadav',
    'Mishra',
    'Pandey',
    'Tiwari',
    'Chauhan',
    'Rathore',
    'Rawat',
    'Joshi',
    'Saxena',
    'Agarwal',
    'Bansal',
    'Chaudhary',
    'Rana',
    'Thakur',
    'Malhotra',
    'Kapoor',
    'Khan',
    'Ansari',
    'Siddiqui',
];

let nameCounter = 0;
function randomName() {
    nameCounter++;
    return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
}
function randomPhone() {
    return String(randomInt(6, 9)) + String(randomInt(100_000_000, 999_999_999));
}

// ── Category content templates ───────────────────────────────────────────────
const CATEGORY_CONTENT = {
    'Road Damage': {
        titles: [
            'Large crack across road surface',
            'Road caved in near junction',
            'Damaged road stretch causing traffic',
        ],
        descriptions: [
            'A long stretch of the road has cracked and sunk, making it difficult for two-wheelers to pass safely.',
            'The road surface near the junction has caved in after recent traffic load, creating a hazard for vehicles.',
            'Uneven, broken tarmac has been causing frequent minor accidents during night hours.',
        ],
    },
    Pothole: {
        titles: [
            'Deep pothole near market entrance',
            'Multiple potholes on main stretch',
            'Pothole filled with stagnant water',
        ],
        descriptions: [
            'A deep pothole has formed near the market entrance and is filling with water after every rain, damaging vehicle tyres.',
            'Several potholes have appeared along this stretch, forcing vehicles to swerve into oncoming traffic.',
            'This pothole has been growing for weeks and now poses a serious risk to two-wheeler riders.',
        ],
    },
    Garbage: {
        titles: [
            'Uncollected garbage pile for days',
            'Overflowing garbage bin',
            'Garbage dumped on roadside',
        ],
        descriptions: [
            'Household waste has piled up on the roadside for several days without collection, attracting stray animals.',
            'The community garbage bin is overflowing and spilling onto the footpath, causing a foul smell in the area.',
            'Residents have been dumping garbage on an empty plot, and it has not been cleared in over a week.',
        ],
    },
    'Water Leakage': {
        titles: [
            'Pipeline leaking near main road',
            'Continuous water leakage flooding street',
            'Broken water pipe wasting water',
        ],
        descriptions: [
            'A municipal water pipeline has been leaking continuously for two days, flooding the street and wasting drinking water.',
            'Water is gushing out of a broken underground pipe joint, creating a slippery patch on the road.',
            'A valve near the main junction is leaking heavily, and the resulting waterlogging is affecting nearby shops.',
        ],
    },
    Drainage: {
        titles: [
            'Blocked drain causing waterlogging',
            'Open drain overflowing onto street',
            'Choked drainage line near colony',
        ],
        descriptions: [
            'The drainage line is completely choked with silt and plastic waste, causing waterlogging after every rain.',
            'An open drain has overflowed onto the main street, creating an unhygienic and slippery walking surface.',
            'Stagnant water in the blocked drain has become a breeding ground for mosquitoes near residential homes.',
        ],
    },
    Streetlight: {
        titles: [
            'Streetlight not working for weeks',
            'Flickering streetlight near park',
            'Dark stretch due to broken streetlights',
        ],
        descriptions: [
            'The streetlight at this junction has not worked for over two weeks, making the area unsafe after dark.',
            'Several streetlights along this stretch are flickering intermittently and need urgent repair.',
            'A long stretch of road remains completely dark at night due to multiple non-functional streetlights.',
        ],
    },
    Sewage: {
        titles: [
            'Sewage overflow on residential street',
            'Broken sewer line leaking waste',
            'Open sewage line health hazard',
        ],
        descriptions: [
            'Raw sewage has been overflowing onto the street for two days, creating a serious health hazard for residents.',
            'A sewer line has cracked and is leaking waste water directly onto the road near a school.',
            'The open sewage drain near the colony entrance is emitting a strong odour and attracting insects.',
        ],
    },
    Encroachment: {
        titles: [
            'Illegal stall blocking footpath',
            'Encroachment narrowing main road',
            'Shop extension onto public land',
        ],
        descriptions: [
            'A vendor has set up a permanent stall on the footpath, forcing pedestrians to walk on the busy road.',
            'Illegal construction has narrowed the road width, causing regular traffic jams during peak hours.',
            'A shopkeeper has extended their shop onto public land, blocking access for two-wheelers.',
        ],
    },
    'Illegal Dumping': {
        titles: [
            'Construction debris dumped on empty plot',
            'Illegal waste dumping near river bank',
            'Truckloads of debris left on roadside',
        ],
        descriptions: [
            'Contractors have been dumping construction debris on an empty plot without any permission, blocking a footpath.',
            'Someone is illegally dumping mixed waste near the river bank at night, polluting the water source.',
            'Truckloads of demolition debris have been left on the roadside for days, obstructing pedestrian movement.',
        ],
    },
    Other: {
        titles: [
            'Damaged public bench in park',
            'Stray cattle causing traffic hazard',
            'Broken boundary wall near school',
        ],
        descriptions: [
            'A public bench in the community park has broken and is now a safety hazard for children.',
            'Stray cattle have been gathering near the main road, frequently causing near-miss accidents.',
            'The boundary wall near the school has partially collapsed and needs urgent attention.',
        ],
    },
};

const WEATHER_SENSITIVE = ['Water Leakage', 'Drainage', 'Sewage', 'Road Damage', 'Pothole'];
const HIGH_SEVERITY_CATEGORIES = ['Sewage', 'Water Leakage', 'Road Damage'];

function buildComplaintContent(category) {
    const content = CATEGORY_CONTENT[category] ?? CATEGORY_CONTENT.Other;
    return {
        title: randomItem(content.titles),
        description: randomItem(content.descriptions),
    };
}

function randomSeverity(category) {
    return HIGH_SEVERITY_CATEGORIES.includes(category) ? randomInt(5, 10) : randomInt(1, 8);
}

function complaintImage(category, i) {
    return `https://picsum.photos/seed/${encodeURIComponent(category)}-${i}/900/700`;
}

// ── Main seeding routine ─────────────────────────────────────────────────────
async function seed() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Veyu — Realistic Dataset Seeding');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('Cleaning existing database...');
    await Promise.all([
        Ward.deleteMany({}),
        User.deleteMany({}),
        Complaint.deleteMany({}),
        Assignment.deleteMany({}),
        Observation.deleteMany({}),
        Vote.deleteMany({}),
        Notification.deleteMany({}),
        Forecast.deleteMany({}),
    ]);
    console.log('  ✓ Cleared\n');

    // ── 1. Wards ─────────────────────────────────────────────────────────────
    console.log('Seeding Wards...');

    // Synthetic (but non-overlapping, gap-free) ward boundary polygons —
    // see utils/voronoi.util.js for why. Real deployments should swap this
    // for actual municipal ward-boundary GeoJSON if available.
    const wardCenters = WARD_DEFS.map((w) => ({
        lat: CITY_CENTER.lat + w.dLat,
        lon: CITY_CENTER.lon + w.dLon,
    }));
    const wardCells = computeWardVoronoiCells(wardCenters);

    const wardsData = WARD_DEFS.map((w, i) => {
        const cell = wardCells[i];
        return {
            _id: new ObjectId(),
            wardNumber: i + 1,
            name: `${w.name}`,
            city: CITY,
            centerLat: cell.lat,
            centerLon: cell.lng,
            location: { type: 'Point', coordinates: [cell.lng, cell.lat] },
            boundary: cell.polygon ? { type: 'Polygon', coordinates: [cell.polygon] } : undefined,
            pulseVelocity: 1.0,
            stressBand: 'stable',
            healthScore: 100,
            isActive: true,
        };
    });

    const wards = await Ward.insertMany(wardsData.map(({ centerLat, centerLon, ...doc }) => doc));
    // keep the local lat/lon lookup for coordinate generation
    wards.forEach((w, i) => {
        w._centerLat = wardsData[i].centerLat;
        w._centerLon = wardsData[i].centerLon;
    });
    console.log(`  ✓ Inserted ${wards.length} wards\n`);

    // ── 2. Users ─────────────────────────────────────────────────────────────
    console.log('Seeding Users...');
    const preHashed = await bcrypt.hash(PASS, 12);

    // Demo accounts (created via .create to exercise the password hashing hook)
    const demoDefs = [
        {
            name: 'Anmol Kumar',
            email: 'citizen@veyu.dev',
            role: 'citizen',
            password: PASS,
            phone: randomPhone(),
        },
        {
            name: 'Priya Sharma',
            email: 'officer@veyu.dev',
            role: 'officer',
            password: PASS,
            assignedWard: wards[0]._id,
            phone: randomPhone(),
        },
        {
            name: 'Ravi Singh',
            email: 'worker@veyu.dev',
            role: 'worker',
            password: PASS,
            assignedWard: wards[1]._id,
            phone: randomPhone(),
        },
        {
            name: 'Admin Nagarik',
            email: 'admin@veyu.dev',
            role: 'admin',
            password: PASS,
            phone: randomPhone(),
        },
    ];
    const demoUsers = [];
    for (const u of demoDefs) demoUsers.push(await User.create({ ...u, isVerified: true }));
    const [demoCitizen, demoOfficer, demoWorker, demoAdmin] = demoUsers;

    // Bulk citizens
    const NUM_CITIZENS = 130;
    const bulkCitizens = Array.from({ length: NUM_CITIZENS }).map((_, i) => ({
        _id: new ObjectId(),
        name: randomName(),
        email: `citizen${i}@mail.test`,
        role: 'citizen',
        password: preHashed,
        phone: randomPhone(),
        isVerified: true,
        reputationScore: 0,
        createdAt: daysAgo(randomInt(5, 900)),
    }));

    // One officer per remaining ward (ward[0] already has demoOfficer)
    const bulkOfficers = wards.slice(1).map((w, i) => ({
        _id: new ObjectId(),
        name: randomName(),
        email: `officer${i}@veyu.dev`,
        role: 'officer',
        password: preHashed,
        phone: randomPhone(),
        isVerified: true,
        assignedWard: w._id,
        createdAt: daysAgo(randomInt(200, 900)),
    }));
    // One spare, unassigned officer
    bulkOfficers.push({
        _id: new ObjectId(),
        name: randomName(),
        email: 'officer.spare@veyu.dev',
        role: 'officer',
        password: preHashed,
        phone: randomPhone(),
        isVerified: true,
        assignedWard: null,
        createdAt: daysAgo(120),
    });

    // Two workers per ward (demoWorker already covers one slot on ward[1])
    const bulkWorkers = [];
    wards.forEach((w, wi) => {
        for (let i = 0; i < 2; i++) {
            bulkWorkers.push({
                _id: new ObjectId(),
                name: randomName(),
                email: `worker${wi}_${i}@veyu.dev`,
                role: 'worker',
                password: preHashed,
                phone: randomPhone(),
                isVerified: true,
                assignedWard: w._id,
                fieldPoints: 0,
                createdAt: daysAgo(randomInt(150, 900)),
            });
        }
    });

    const bulkUsers = await User.insertMany([...bulkCitizens, ...bulkOfficers, ...bulkWorkers]);
    const allUsers = [...demoUsers, ...bulkUsers];

    const citizens = [demoCitizen, ...bulkUsers.filter((u) => u.role === 'citizen')];
    const officers = [demoOfficer, ...bulkUsers.filter((u) => u.role === 'officer')];
    const workers = [demoWorker, ...bulkUsers.filter((u) => u.role === 'worker')];

    console.log(
        `  ✓ Inserted ${allUsers.length} users (${citizens.length} citizens, ${officers.length} officers, ${workers.length} workers)\n`
    );

    // Link each ward to its officer
    console.log('Linking wards to officers...');
    const officerByWard = new Map();
    for (const o of officers) {
        if (o.assignedWard) officerByWard.set(String(o.assignedWard), o);
    }
    await Ward.bulkWrite(
        wards
            .filter((w) => officerByWard.has(String(w._id)))
            .map((w) => ({
                updateOne: {
                    filter: { _id: w._id },
                    update: { $set: { officerId: officerByWard.get(String(w._id))._id } },
                },
            }))
    );
    wards.forEach((w) => {
        w.officerId = officerByWard.get(String(w._id))?._id ?? null;
    });
    console.log('  ✓ Linked\n');

    const workersByWard = new Map();
    workers.forEach((w) => {
        if (!w.assignedWard) return;
        const key = String(w.assignedWard);
        if (!workersByWard.has(key)) workersByWard.set(key, []);
        workersByWard.get(key).push(w);
    });
    const workerFor = (wardId) => {
        const list = workersByWard.get(String(wardId));
        return list && list.length ? randomItem(list) : randomItem(workers);
    };
    const officerFor = (wardId) => officerByWard.get(String(wardId)) ?? randomItem(officers);

    // ── 3. Complaints ────────────────────────────────────────────────────────
    console.log('Seeding Complaints...');

    // Choose 3 (ward, category) pairs to carry a strong, multi-year seasonal
    // signal so SilentSignal has genuine seasonal patterns to detect.
    const SEASONAL_PAIRS = [
        { ward: wards[2], category: 'Water Leakage' },
        { ward: wards[5], category: 'Drainage' },
        { ward: wards[8], category: 'Sewage' },
    ];

    let imgCounter = 0;
    const complaints = []; // will be inserted in one shot at the end

    function pickStatusForAge(ageDays) {
        const r = Math.random();
        if (ageDays > 60) {
            if (r < 0.68) return COMPLAINT_STATUS.RESOLVED;
            if (r < 0.78) return COMPLAINT_STATUS.REJECTED;
            if (r < 0.86) return COMPLAINT_STATUS.IN_PROGRESS;
            if (r < 0.94) return COMPLAINT_STATUS.ASSIGNED;
            return COMPLAINT_STATUS.VERIFIED;
        }
        if (ageDays > 14) {
            if (r < 0.4) return COMPLAINT_STATUS.RESOLVED;
            if (r < 0.6) return COMPLAINT_STATUS.IN_PROGRESS;
            if (r < 0.78) return COMPLAINT_STATUS.ASSIGNED;
            if (r < 0.9) return COMPLAINT_STATUS.VERIFIED;
            return COMPLAINT_STATUS.SUBMITTED;
        }
        if (r < 0.05) return COMPLAINT_STATUS.RESOLVED;
        if (r < 0.15) return COMPLAINT_STATUS.IN_PROGRESS;
        if (r < 0.35) return COMPLAINT_STATUS.ASSIGNED;
        if (r < 0.6) return COMPLAINT_STATUS.VERIFIED;
        return COMPLAINT_STATUS.SUBMITTED;
    }

    function buildStatusHistory(status, createdAt, wardId) {
        const officer = officerFor(wardId);
        const worker = workerFor(wardId);
        const history = [];
        let cursor = new Date(createdAt.getTime() + randomInt(2, 20) * 3_600_000);

        const pushIfPast = (s, actor) => {
            history.push({ status: s, changedBy: actor._id, changedAt: cursor, note: null });
            cursor = new Date(cursor.getTime() + randomInt(6, 48) * 3_600_000);
        };

        if (
            [
                COMPLAINT_STATUS.VERIFIED,
                COMPLAINT_STATUS.ASSIGNED,
                COMPLAINT_STATUS.IN_PROGRESS,
                COMPLAINT_STATUS.RESOLVED,
            ].includes(status)
        ) {
            pushIfPast(COMPLAINT_STATUS.VERIFIED, officer);
        }
        if (
            [
                COMPLAINT_STATUS.ASSIGNED,
                COMPLAINT_STATUS.IN_PROGRESS,
                COMPLAINT_STATUS.RESOLVED,
            ].includes(status)
        ) {
            pushIfPast(COMPLAINT_STATUS.ASSIGNED, officer);
        }
        if ([COMPLAINT_STATUS.IN_PROGRESS, COMPLAINT_STATUS.RESOLVED].includes(status)) {
            pushIfPast(COMPLAINT_STATUS.IN_PROGRESS, worker);
        }
        if (status === COMPLAINT_STATUS.RESOLVED) {
            pushIfPast(COMPLAINT_STATUS.RESOLVED, worker);
        }
        if (status === COMPLAINT_STATUS.REJECTED) {
            pushIfPast(COMPLAINT_STATUS.VERIFIED, officer);
            history.push({
                status: COMPLAINT_STATUS.REJECTED,
                changedBy: officer._id,
                changedAt: cursor,
                note: randomItem([
                    'Duplicate of an already resolved issue.',
                    'Could not verify the reported issue on-site.',
                    'Outside municipal jurisdiction.',
                ]),
            });
        }
        const resolvedEntry = history.find((h) => h.status === COMPLAINT_STATUS.RESOLVED);
        return { history, resolvedAt: resolvedEntry ? resolvedEntry.changedAt : null };
    }

    function makeComplaint({ ward, category, createdAt, createdBy, forceStatus }) {
        const status = forceStatus ?? pickStatusForAge((Date.now() - createdAt.getTime()) / DAY_MS);
        const { title, description } = buildComplaintContent(category);
        const { history, resolvedAt } = buildStatusHistory(status, createdAt, ward._id);
        const [lng, lat] = jitterCoords(ward._centerLat, ward._centerLon);

        imgCounter++;
        return {
            _id: new ObjectId(),
            title,
            description,
            category,
            status,
            statusHistory: history,
            imageUrl: complaintImage(category, imgCounter),
            resolutionImageUrl:
                status === COMPLAINT_STATUS.RESOLVED
                    ? complaintImage(`${category}-fix`, imgCounter)
                    : null,
            location: { type: 'Point', coordinates: [lng, lat] },
            address: `${randomItem(STREETS)}, ${ward.name}, ${CITY}`,
            wardId: ward._id,
            severity: randomSeverity(category),
            aiConfidence: randomFloat(0.55, 0.98),
            categorySource: Math.random() < 0.85 ? 'ai' : 'manual',
            upvotes: 0,
            createdBy,
            createdAt,
            resolvedAt,
            cascadeRisk: false,
            cascadeSource: null,
            duplicateOf: null,
        };
    }

    // 3a. Historical baseline — spread over the last ~3.5 years, excluding
    // the most recent 90 days.
    const HISTORICAL_COUNT = 450;
    for (let i = 0; i < HISTORICAL_COUNT; i++) {
        const ward = randomItem(wards);
        const category = randomItem(COMPLAINT_CATEGORIES);
        const createdAt = daysAgo(randomInt(91, 1280));
        complaints.push(
            makeComplaint({ ward, category, createdAt, createdBy: randomItem(citizens)._id })
        );
    }

    // 3b. Recent activity — last 90 days, feeds PulseGrid velocity directly.
    const RECENT_COUNT = 300;
    for (let i = 0; i < RECENT_COUNT; i++) {
        const ward = randomItem(wards);
        const category = randomItem(COMPLAINT_CATEGORIES);
        const createdAt = daysAgo(randomInt(0, 90));
        complaints.push(
            makeComplaint({ ward, category, createdAt, createdBy: randomItem(citizens)._id })
        );
    }

    // 3c. Seasonal injection — the data SilentSignal's detectSeasonalPatterns()
    // needs: concentrated complaint bursts in the same ~2-week window of the
    // year, repeated across at least two prior years.
    const now = new Date();
    for (const { ward, category } of SEASONAL_PAIRS) {
        for (const yearsBack of [1, 2, 3]) {
            const anchor = new Date(now);
            anchor.setFullYear(now.getFullYear() - yearsBack);
            const burstCount = randomInt(9, 14);
            for (let i = 0; i < burstCount; i++) {
                const jitterDays = randomInt(-6, 6);
                const createdAt = new Date(
                    anchor.getTime() + jitterDays * DAY_MS - randomInt(0, 23) * 3_600_000
                );
                // These are historical, so they should mostly be resolved.
                const forceStatus =
                    Math.random() < 0.8 ? COMPLAINT_STATUS.RESOLVED : COMPLAINT_STATUS.REJECTED;
                complaints.push(
                    makeComplaint({
                        ward,
                        category,
                        createdAt,
                        createdBy: randomItem(citizens)._id,
                        forceStatus,
                    })
                );
            }
        }
    }

    // 3d. Duplicates — reference an earlier complaint of the same ward/category.
    const DUPLICATE_COUNT = 35;
    const duplicateCandidates = complaints.filter((c) => c.status !== COMPLAINT_STATUS.DUPLICATE);
    for (let i = 0; i < DUPLICATE_COUNT; i++) {
        const original = randomItem(duplicateCandidates);
        const ward = wards.find((w) => String(w._id) === String(original.wardId));
        const createdAt = new Date(original.createdAt.getTime() + randomInt(1, 10) * DAY_MS);
        if (createdAt.getTime() > Date.now()) continue;
        const [lng, lat] = jitterCoords(ward._centerLat, ward._centerLon, 0.05);
        imgCounter++;
        complaints.push({
            _id: new ObjectId(),
            title: original.title,
            description: original.description,
            category: original.category,
            status: COMPLAINT_STATUS.DUPLICATE,
            statusHistory: [],
            imageUrl: complaintImage(original.category, imgCounter),
            resolutionImageUrl: null,
            location: { type: 'Point', coordinates: [lng, lat] },
            address: original.address,
            wardId: original.wardId,
            severity: original.severity,
            aiConfidence: randomFloat(0.55, 0.95),
            categorySource: 'ai',
            upvotes: 0,
            createdBy: randomItem(citizens)._id,
            createdAt,
            resolvedAt: null,
            cascadeRisk: false,
            cascadeSource: null,
            duplicateOf: original._id,
        });
    }

    // 3e. CascadeRisk demonstration — verified Water Leakage / Sewage
    // complaints with nearby Road Damage / Pothole / Drainage complaints
    // flagged as being at cascade risk, exactly as evaluateCascadeRisk()
    // would flag them in production.
    const CASCADE_CLUSTERS = 18;
    for (let i = 0; i < CASCADE_CLUSTERS; i++) {
        const ward = randomItem(wards);
        const triggerCategory = randomItem(CASCADE_RISK.TRIGGER_CATEGORIES);
        const trigger = makeComplaint({
            ward,
            category: triggerCategory,
            createdAt: daysAgo(randomInt(1, 45)),
            createdBy: randomItem(citizens)._id,
            forceStatus: COMPLAINT_STATUS.VERIFIED,
        });
        complaints.push(trigger);

        const targetCount = randomInt(1, 2);
        for (let j = 0; j < targetCount; j++) {
            const targetCategory = randomItem(CASCADE_RISK.TARGET_CATEGORIES);
            const target = makeComplaint({
                ward,
                category: targetCategory,
                createdAt: new Date(trigger.createdAt.getTime() + randomInt(1, 5) * 3_600_000),
                createdBy: randomItem(citizens)._id,
                forceStatus: randomItem([COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.VERIFIED]),
            });
            const [triggerLng, triggerLat] = trigger.location.coordinates;
            const [lng, lat] = metresOffset(
                triggerLat,
                triggerLng,
                randomInt(30, CASCADE_RISK.RADIUS_METRES - 20)
            );
            target.location.coordinates = [lng, lat];
            target.cascadeRisk = true;
            target.cascadeSource = trigger._id;
            complaints.push(target);
        }
    }

    await Complaint.insertMany(complaints);
    console.log(`  ✓ Inserted ${complaints.length} complaints\n`);

    // ── 4. FieldMesh Observations ────────────────────────────────────────────
    console.log('Seeding FieldMesh Observations...');
    const OBS_COUNT = 150;
    const observations = [];
    const observationCompanionComplaints = [];

    const OBS_STATUS_WEIGHTS = [
        [OBSERVATION_STATUS.ELEVATED, 0.23],
        [OBSERVATION_STATUS.AI_REVIEWED, 0.37],
        [OBSERVATION_STATUS.DISMISSED, 0.2],
        [OBSERVATION_STATUS.FLAGGED, 0.1],
        [OBSERVATION_STATUS.PENDING, 0.1],
    ];
    function pickObsStatus() {
        const r = Math.random();
        let acc = 0;
        for (const [status, weight] of OBS_STATUS_WEIGHTS) {
            acc += weight;
            if (r <= acc) return status;
        }
        return OBSERVATION_STATUS.PENDING;
    }

    for (let i = 0; i < OBS_COUNT; i++) {
        const ward = randomItem(wards);
        const worker = workerFor(ward._id);
        const category = randomItem(COMPLAINT_CATEGORIES);
        const status = pickObsStatus();
        const createdAt = daysAgo(randomInt(0, 200));
        const [lng, lat] = jitterCoords(ward._centerLat, ward._centerLon);

        let aiConfidence;
        if (status === OBSERVATION_STATUS.ELEVATED) aiConfidence = randomFloat(0.8, 0.98);
        else if (status === OBSERVATION_STATUS.FLAGGED) aiConfidence = randomFloat(0.1, 0.39);
        else aiConfidence = randomFloat(0.4, 0.79);

        const obsId = new ObjectId();
        const obs = {
            _id: obsId,
            workerId: worker._id,
            wardId: ward._id,
            imageUrl: `https://picsum.photos/seed/observation-${i}/900/700`,
            note: randomItem(CATEGORY_CONTENT[category].descriptions),
            location: { type: 'Point', coordinates: [lng, lat] },
            address: `${randomItem(STREETS)}, ${ward.name}, ${CITY}`,
            aiCategory: category,
            aiSeverity: randomSeverity(category),
            aiConfidence,
            status,
            elevatedTo: null,
            elevatedAt: null,
            reviewedBy: null,
            reviewNote: null,
            pointsAwarded: 0,
            createdAt,
        };

        if (status === OBSERVATION_STATUS.ELEVATED) {
            const companion = {
                _id: new ObjectId(),
                title: `${category} reported by field worker`,
                description: obs.note,
                category,
                status: COMPLAINT_STATUS.VERIFIED,
                statusHistory: [],
                imageUrl: obs.imageUrl,
                resolutionImageUrl: null,
                location: obs.location,
                address: obs.address,
                wardId: ward._id,
                severity: obs.aiSeverity,
                aiConfidence: obs.aiConfidence,
                categorySource: 'ai',
                upvotes: 0,
                createdBy: worker._id,
                createdAt,
                resolvedAt: null,
                cascadeRisk: false,
                cascadeSource: null,
                duplicateOf: null,
            };
            observationCompanionComplaints.push(companion);

            obs.elevatedTo = companion._id;
            obs.elevatedAt = new Date(createdAt.getTime() + randomInt(1, 6) * 3_600_000);
            obs.pointsAwarded = FIELDMESH.POINTS_OBSERVATION_ELEVATED;
            // Half auto-elevated (no officer review), half officer-reviewed.
            if (Math.random() < 0.5) {
                obs.reviewedBy = officerFor(ward._id)._id;
                obs.reviewNote = 'Confirmed on review — escalated to a full complaint.';
            }
        } else if (status === OBSERVATION_STATUS.DISMISSED) {
            obs.reviewedBy = officerFor(ward._id)._id;
            obs.reviewNote = randomItem([
                'Not significant enough to escalate.',
                'Already being handled through an existing complaint.',
                'Image unclear — requested a follow-up visit instead.',
            ]);
        }

        observations.push(obs);
    }

    if (observationCompanionComplaints.length) {
        await Complaint.insertMany(observationCompanionComplaints);
    }
    await Observation.insertMany(observations);
    console.log(
        `  ✓ Inserted ${observations.length} observations (${observationCompanionComplaints.length} auto-elevated to complaints)\n`
    );

    // ── 5. Assignments ───────────────────────────────────────────────────────
    console.log('Seeding Assignments...');
    const allComplaints = [...complaints, ...observationCompanionComplaints];
    const assignable = allComplaints.filter((c) =>
        [
            COMPLAINT_STATUS.ASSIGNED,
            COMPLAINT_STATUS.IN_PROGRESS,
            COMPLAINT_STATUS.RESOLVED,
        ].includes(c.status)
    );

    const assignments = assignable.map((c) => {
        const worker = workerFor(c.wardId);
        const officer = officerFor(c.wardId);
        const assignedAt = new Date(c.createdAt.getTime() + randomInt(6, 30) * 3_600_000);

        let status;
        let acknowledgedAt = null;
        let arrivedAt = null;
        let completedAt = null;
        let completionNote = null;
        let completionImageUrl = null;

        if (c.status === COMPLAINT_STATUS.ASSIGNED) {
            status = randomItem([ASSIGNMENT_STATUS.PENDING, ASSIGNMENT_STATUS.ACKNOWLEDGED]);
            if (status === ASSIGNMENT_STATUS.ACKNOWLEDGED) {
                acknowledgedAt = new Date(assignedAt.getTime() + randomInt(1, 12) * 3_600_000);
            }
        } else if (c.status === COMPLAINT_STATUS.IN_PROGRESS) {
            status = randomItem([
                ASSIGNMENT_STATUS.ACKNOWLEDGED,
                ASSIGNMENT_STATUS.EN_ROUTE,
                ASSIGNMENT_STATUS.ON_SITE,
            ]);
            acknowledgedAt = new Date(assignedAt.getTime() + randomInt(1, 12) * 3_600_000);
            if (status !== ASSIGNMENT_STATUS.ACKNOWLEDGED) {
                arrivedAt = new Date(acknowledgedAt.getTime() + randomInt(1, 20) * 3_600_000);
            }
        } else {
            status = ASSIGNMENT_STATUS.COMPLETED;
            acknowledgedAt = new Date(assignedAt.getTime() + randomInt(1, 12) * 3_600_000);
            arrivedAt = new Date(acknowledgedAt.getTime() + randomInt(1, 20) * 3_600_000);
            completedAt =
                c.resolvedAt ?? new Date(arrivedAt.getTime() + randomInt(2, 30) * 3_600_000);
            completionNote = 'Issue resolved on-site and verified with a photo.';
            completionImageUrl = `https://picsum.photos/seed/completion-${String(c._id)}/900/700`;
        }

        return {
            _id: new ObjectId(),
            complaintId: c._id,
            workerId: worker._id,
            assignedBy: officer._id,
            wardId: c.wardId,
            status,
            instructions: randomItem([
                'Please attend within 24 hours and share photo proof once resolved.',
                'Coordinate with the local ward supervisor before starting work.',
                'Priority issue — residents have complained multiple times.',
                null,
            ]),
            queuePosition: randomInt(0, 3),
            acknowledgedAt,
            arrivedAt,
            completedAt,
            completionNote,
            completionImageUrl,
            createdAt: assignedAt,
        };
    });

    await Assignment.insertMany(assignments);
    console.log(`  ✓ Inserted ${assignments.length} assignments\n`);

    // ── 6. Votes ─────────────────────────────────────────────────────────────
    console.log('Seeding Votes...');
    const voteEligible = complaints.filter((c) => c.status !== COMPLAINT_STATUS.DUPLICATE);
    const votedComplaints = sample(voteEligible, Math.min(400, voteEligible.length));

    const votes = [];
    for (const c of votedComplaints) {
        const voterCount = randomInt(1, 16);
        const voters = sample(
            citizens.filter((u) => String(u._id) !== String(c.createdBy)),
            voterCount
        );
        for (const voter of voters) {
            votes.push({
                _id: new ObjectId(),
                complaintId: c._id,
                userId: voter._id,
                voteType: 'upvote',
                createdAt: new Date(c.createdAt.getTime() + randomInt(1, 30) * DAY_MS),
            });
        }
    }
    if (votes.length) await Vote.insertMany(votes);

    // Sync complaint.upvotes with the actual vote counts.
    const voteCounts = await Vote.aggregate([
        { $group: { _id: '$complaintId', count: { $sum: 1 } } },
    ]);
    if (voteCounts.length) {
        await Complaint.bulkWrite(
            voteCounts.map((v) => ({
                updateOne: { filter: { _id: v._id }, update: { $set: { upvotes: v.count } } },
            }))
        );
    }
    console.log(`  ✓ Inserted ${votes.length} votes across ${votedComplaints.length} complaints\n`);

    // ── 7. Reputation & Field Points ────────────────────────────────────────
    console.log('Computing reputation and field points...');
    const citizenIds = citizens.map((c) => c._id);
    const reputationAgg = await Complaint.aggregate([
        { $match: { createdBy: { $in: citizenIds }, status: { $ne: COMPLAINT_STATUS.DUPLICATE } } },
        { $group: { _id: '$createdBy', count: { $sum: 1 }, upvotes: { $sum: '$upvotes' } } },
    ]);
    await User.bulkWrite(
        reputationAgg.map((r) => ({
            updateOne: {
                filter: { _id: r._id },
                update: {
                    $set: {
                        reputationScore:
                            r.count * REPUTATION.POINTS_COMPLAINT_SUBMITTED +
                            r.upvotes * REPUTATION.POINTS_UPVOTE_RECEIVED,
                    },
                },
            },
        }))
    );

    const completedAssignmentAgg = await Assignment.aggregate([
        { $match: { status: ASSIGNMENT_STATUS.COMPLETED } },
        { $group: { _id: '$workerId', count: { $sum: 1 } } },
    ]);
    const observationPointsAgg = await Observation.aggregate([
        {
            $group: {
                _id: '$workerId',
                submitted: { $sum: 1 },
                elevatedPoints: { $sum: '$pointsAwarded' },
            },
        },
    ]);
    const fieldPointsByWorker = new Map();
    completedAssignmentAgg.forEach((a) => {
        const key = String(a._id);
        fieldPointsByWorker.set(
            key,
            (fieldPointsByWorker.get(key) ?? 0) + a.count * FIELDMESH.POINTS_TASK_COMPLETED
        );
    });
    observationPointsAgg.forEach((o) => {
        const key = String(o._id);
        const submissionPoints = o.submitted * FIELDMESH.POINTS_OBSERVATION_SUBMITTED;
        fieldPointsByWorker.set(
            key,
            (fieldPointsByWorker.get(key) ?? 0) + submissionPoints + o.elevatedPoints
        );
    });
    await User.bulkWrite(
        Array.from(fieldPointsByWorker.entries()).map(([workerId, points]) => ({
            updateOne: { filter: { _id: workerId }, update: { $set: { fieldPoints: points } } },
        }))
    );
    console.log('  ✓ Reputation and field points computed\n');

    // ── 8. Notifications ─────────────────────────────────────────────────────
    console.log('Seeding Notifications...');

    function renderNotification(type, data) {
        switch (type) {
            case NOTIFICATION_TYPES.REPUTATION_EARNED:
                return {
                    title: 'Reputation earned',
                    message: `You earned +${data.points} reputation points.`,
                };
            case NOTIFICATION_TYPES.COMPLAINT_VERIFIED:
                return {
                    title: 'Complaint verified',
                    message: `Your report "${data.title}" has been verified and is being reviewed for assignment.`,
                };
            case NOTIFICATION_TYPES.COMPLAINT_ASSIGNED:
                return {
                    title: 'Complaint assigned',
                    message: `Your report "${data.title}" has been assigned to a field worker.`,
                };
            case NOTIFICATION_TYPES.COMPLAINT_IN_PROGRESS:
                return {
                    title: 'Work in progress',
                    message: `A field worker is now actively working on "${data.title}".`,
                };
            case NOTIFICATION_TYPES.COMPLAINT_RESOLVED:
                return {
                    title: 'Complaint resolved',
                    message: `Great news — "${data.title}" has been marked resolved.`,
                };
            case NOTIFICATION_TYPES.COMPLAINT_REJECTED:
                return {
                    title: 'Complaint rejected',
                    message: data.note
                        ? `Your report "${data.title}" was rejected: ${data.note}`
                        : `Your report "${data.title}" was rejected by an officer.`,
                };
            case NOTIFICATION_TYPES.UPVOTE_RECEIVED:
                return {
                    title: 'Your report got an upvote',
                    message: `"${data.title}" just received community support. +2 reputation.`,
                };
            case NOTIFICATION_TYPES.DUPLICATE_DETECTED:
                return {
                    title: 'Similar issue found',
                    message: `Your report was linked to an existing complaint: "${data.title}". Consider upvoting it instead.`,
                };
            case NOTIFICATION_TYPES.CASCADE_RISK_FLAGGED:
                return {
                    title: 'Cascade risk flagged',
                    message: `"${data.title}" was flagged as cascade risk following a nearby verified water/sewage complaint.`,
                };
            case NOTIFICATION_TYPES.OBSERVATION_NEEDS_REVIEW:
                return {
                    title: 'FieldMesh observation needs review',
                    message: `A worker submitted a ${data.category} observation in ${data.wardName} that needs your review.`,
                };
            case NOTIFICATION_TYPES.TASK_ASSIGNED:
                return {
                    title: 'New task assigned',
                    message: `You've been assigned: "${data.title}".${data.instructions ? ` Note: ${data.instructions}` : ''}`,
                };
            case NOTIFICATION_TYPES.FIELD_POINTS_AWARDED:
                return {
                    title: 'Field points awarded',
                    message: `+${data.points} field points for ${data.reason}.`,
                };
            case NOTIFICATION_TYPES.STRESS_BAND_ELEVATED:
                return {
                    title: `${data.wardName} stress elevated`,
                    message: `Complaint velocity in ${data.wardName} has risen to "${data.stressBand}". Velocity: ${data.velocity}×.`,
                };
            default:
                return { title: 'Notification', message: 'You have a new update.' };
        }
    }

    const wardById = new Map(wards.map((w) => [String(w._id), w]));
    const notifications = [];
    const pushNotif = (userId, type, data, refModel, refId, createdAt) => {
        const { title, message } = renderNotification(type, data);
        const isRead = Math.random() < 0.55;
        notifications.push({
            _id: new ObjectId(),
            userId,
            type,
            title,
            message,
            refModel: refModel ?? null,
            refId: refId ?? null,
            isRead,
            readAt: isRead ? new Date(createdAt.getTime() + randomInt(1, 48) * 3_600_000) : null,
            createdAt,
        });
    };

    // Reputation + status-change notifications for citizen-submitted complaints.
    for (const c of complaints) {
        const isCitizenOwned = citizenIds.some((id) => String(id) === String(c.createdBy));
        if (!isCitizenOwned) continue;

        if (c.status !== COMPLAINT_STATUS.DUPLICATE) {
            pushNotif(
                c.createdBy,
                NOTIFICATION_TYPES.REPUTATION_EARNED,
                { points: REPUTATION.POINTS_COMPLAINT_SUBMITTED },
                'Complaint',
                c._id,
                c.createdAt
            );
        } else {
            const original = complaints.find((o) => String(o._id) === String(c.duplicateOf));
            pushNotif(
                c.createdBy,
                NOTIFICATION_TYPES.DUPLICATE_DETECTED,
                { title: original?.title ?? 'an existing report' },
                'Complaint',
                c.duplicateOf,
                c.createdAt
            );
        }

        const statusNotifMap = {
            [COMPLAINT_STATUS.VERIFIED]: NOTIFICATION_TYPES.COMPLAINT_VERIFIED,
            [COMPLAINT_STATUS.IN_PROGRESS]: NOTIFICATION_TYPES.COMPLAINT_IN_PROGRESS,
            [COMPLAINT_STATUS.RESOLVED]: NOTIFICATION_TYPES.COMPLAINT_RESOLVED,
            [COMPLAINT_STATUS.REJECTED]: NOTIFICATION_TYPES.COMPLAINT_REJECTED,
        };
        const notifType = statusNotifMap[c.status];
        if (notifType) {
            const rejectionEntry = c.statusHistory.find(
                (h) => h.status === COMPLAINT_STATUS.REJECTED
            );
            pushNotif(
                c.createdBy,
                notifType,
                { title: c.title, note: rejectionEntry?.note },
                'Complaint',
                c._id,
                c.resolvedAt ?? new Date(c.createdAt.getTime() + randomInt(1, 5) * DAY_MS)
            );
        }

        if (
            c.status === COMPLAINT_STATUS.ASSIGNED ||
            c.status === COMPLAINT_STATUS.IN_PROGRESS ||
            c.status === COMPLAINT_STATUS.RESOLVED
        ) {
            pushNotif(
                c.createdBy,
                NOTIFICATION_TYPES.COMPLAINT_ASSIGNED,
                { title: c.title },
                'Complaint',
                c._id,
                new Date(c.createdAt.getTime() + randomInt(1, 3) * DAY_MS)
            );
        }

        if (c.upvotes > 0) {
            pushNotif(
                c.createdBy,
                NOTIFICATION_TYPES.UPVOTE_RECEIVED,
                { title: c.title },
                'Complaint',
                c._id,
                new Date(c.createdAt.getTime() + randomInt(1, 20) * DAY_MS)
            );
        }

        if (c.cascadeRisk) {
            pushNotif(
                c.createdBy,
                NOTIFICATION_TYPES.CASCADE_RISK_FLAGGED,
                { title: c.title },
                'Complaint',
                c._id,
                new Date(c.createdAt.getTime() + randomInt(1, 12) * 3_600_000)
            );
        }
    }

    // Task assignment notifications for workers.
    for (const a of assignments) {
        pushNotif(
            a.workerId,
            NOTIFICATION_TYPES.TASK_ASSIGNED,
            {
                title:
                    allComplaints.find((c) => String(c._id) === String(a.complaintId))?.title ??
                    'a task',
                instructions: a.instructions,
            },
            'Assignment',
            a._id,
            a.createdAt
        );
        if (a.status === ASSIGNMENT_STATUS.COMPLETED) {
            pushNotif(
                a.workerId,
                NOTIFICATION_TYPES.FIELD_POINTS_AWARDED,
                { points: FIELDMESH.POINTS_TASK_COMPLETED, reason: 'completing a task' },
                'Assignment',
                a._id,
                a.completedAt
            );
        }
    }

    // Observation review + elevation notifications.
    for (const o of observations) {
        if (o.status === OBSERVATION_STATUS.AI_REVIEWED) {
            const ward = wardById.get(String(o.wardId));
            const officer = officerFor(o.wardId);
            pushNotif(
                officer._id,
                NOTIFICATION_TYPES.OBSERVATION_NEEDS_REVIEW,
                { category: o.aiCategory, wardName: ward?.name ?? 'the ward' },
                'Observation',
                o._id,
                o.createdAt
            );
        }
        if (o.status === OBSERVATION_STATUS.ELEVATED) {
            pushNotif(
                o.workerId,
                NOTIFICATION_TYPES.FIELD_POINTS_AWARDED,
                {
                    points: FIELDMESH.POINTS_OBSERVATION_ELEVATED,
                    reason: 'an elevated FieldMesh observation',
                },
                'Observation',
                o._id,
                o.elevatedAt ?? o.createdAt
            );
        }
    }

    if (notifications.length) await Notification.insertMany(notifications);
    console.log(`  ✓ Inserted ${notifications.length} notifications\n`);

    // ── 9. Ward Pulse & Health (real service functions) ─────────────────────
    console.log('Recomputing PulseGrid velocity and ward health scores...');
    await recomputeAllWards();
    await recomputeAllWardStats();
    console.log('  ✓ Ward stress bands, velocity and health scores computed\n');

    // Notify officers of wards that ended up in a high-stress band, mirroring
    // what the PulseGrid cron would emit in production.
    const stressedWards = await Ward.find({
        stressBand: { $in: ['rising', 'critical', 'emergency'] },
    });
    const stressNotifs = [];
    for (const w of stressedWards) {
        const officer = officerByWard.get(String(w._id));
        if (!officer) continue;
        const { title, message } = renderNotification(NOTIFICATION_TYPES.STRESS_BAND_ELEVATED, {
            wardName: w.name,
            stressBand: w.stressBand,
            velocity: w.pulseVelocity,
        });
        stressNotifs.push({
            _id: new ObjectId(),
            userId: officer._id,
            type: NOTIFICATION_TYPES.STRESS_BAND_ELEVATED,
            title,
            message,
            refModel: 'Ward',
            refId: w._id,
            isRead: false,
            readAt: null,
            createdAt: new Date(),
        });
    }
    if (stressNotifs.length) await Notification.insertMany(stressNotifs);
    console.log(`  ✓ ${stressNotifs.length} ward(s) currently elevated — officers notified\n`);

    // ── 10. SilentSignal Forecasts ───────────────────────────────────────────
    console.log('Running SilentSignal forecast generation...');
    let liveForecastResult = { created: 0 };
    try {
        liveForecastResult = await generateForecasts();
    } catch (err) {
        console.warn(
            '  ⚠ generateForecasts() failed (likely no weather API access in this environment):',
            err.message
        );
    }
    console.log(
        `  ✓ Generated ${liveForecastResult.created} live forecast(s) from seasonal patterns\n`
    );

    // Also seed a short history of already-scored forecasts so the accuracy
    // dashboard (getForecastAccuracy) has something meaningful to show.
    console.log('Seeding historical (scored) forecasts...');
    const historicalForecasts = SEASONAL_PAIRS.map(({ ward, category }, i) => {
        const predictedStartDate = daysAgo(380 - i * 20);
        const predictedEndDate = new Date(predictedStartDate.getTime() + 10 * DAY_MS);
        const wasAccurate = i !== 1; // mix of confirmed and expired outcomes
        return {
            _id: new ObjectId(),
            wardId: ward._id,
            category,
            predictedStartDate,
            predictedEndDate,
            expectedMultiplier: randomFloat(2.0, 4.5),
            trigger: FORECAST_TRIGGERS.SEASONAL,
            confidence: randomFloat(0.72, 0.94),
            summary: `${ward.name} historically receives a surge of ${category} complaints during this period of the year, based on prior monsoon seasons.`,
            historicalYears: [now.getFullYear() - 3, now.getFullYear() - 2],
            baselineAvgComplaints: randomFloat(2, 5),
            status: wasAccurate ? FORECAST_STATUS.CONFIRMED : FORECAST_STATUS.EXPIRED,
            actualComplaintsInWindow: wasAccurate ? randomInt(8, 16) : randomInt(0, 2),
            acknowledgedBy: officerByWard.get(String(ward._id))?._id ?? null,
            acknowledgedAt: new Date(predictedStartDate.getTime() + randomInt(1, 3) * DAY_MS),
            createdAt: new Date(predictedStartDate.getTime() - 2 * DAY_MS),
        };
    });
    await Forecast.insertMany(historicalForecasts);
    console.log(`  ✓ Inserted ${historicalForecasts.length} historical forecasts\n`);

    // ── Summary ──────────────────────────────────────────────────────────────
    const finalCounts = await Promise.all([
        Ward.countDocuments(),
        User.countDocuments(),
        Complaint.countDocuments(),
        Assignment.countDocuments(),
        Observation.countDocuments(),
        Vote.countDocuments(),
        Notification.countDocuments(),
        Forecast.countDocuments(),
    ]);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Done Seeding');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Wards:         ${finalCounts[0]}`);
    console.log(`  Users:         ${finalCounts[1]}`);
    console.log(`  Complaints:    ${finalCounts[2]}`);
    console.log(`  Assignments:   ${finalCounts[3]}`);
    console.log(`  Observations:  ${finalCounts[4]}`);
    console.log(`  Votes:         ${finalCounts[5]}`);
    console.log(`  Notifications: ${finalCounts[6]}`);
    console.log(`  Forecasts:     ${finalCounts[7]}`);
    console.log('');
    console.log('Demo Credentials (all passwords: demo1234)');
    demoDefs.forEach((u) => console.log(`  ${u.role.padEnd(8)} → ${u.email}`));
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
