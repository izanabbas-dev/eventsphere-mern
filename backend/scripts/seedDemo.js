// Demo data for the presentation video.
// WARNING: this DELETES all data in the database and all uploaded files first.
// Run with: npm run seed:demo
import "dotenv/config";
import mongoose from "mongoose";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import Expo from "../models/Expo.js";
import Booth from "../models/Booth.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import Session from "../models/Session.js";
import Registration from "../models/Registration.js";
import Bookmark from "../models/Bookmark.js";
import BoothVisit from "../models/BoothVisit.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Feedback from "../models/Feedback.js";

const BACKEND_FOLDER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const UPLOADS = path.join(BACKEND_FOLDER, "uploads");
const PRIVATE_UPLOADS = path.join(BACKEND_FOLDER, "private_uploads");

const ADMIN_PASSWORD = "Admin@12345";
const DEMO_PASSWORD = "Demo@1234";

// ---------- small helpers ----------

// Same "random" numbers on every run, so the demo always looks the same
let seed = 42;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const randomInt = (min, max) => min + Math.floor(random() * (max - min + 1));
const pick = (list) => list[Math.floor(random() * list.length)];

// A date some days before now, at a random time of the day
const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(randomInt(9, 21), randomInt(0, 59), randomInt(0, 59), 0);
  return date > new Date() ? new Date(Date.now() - randomInt(5, 120) * 60 * 1000) : date;
};

// Pakistan time (UTC+5), e.g. pkTime("2026-12-08", "10:00")
const pkTime = (day, time) => new Date(`${day}T${time}:00+05:00`);

const makeTicketCode = () => `ES-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const initials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const escapeXml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------- SVG images ----------

const logoSvg = (name, color) => `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="${color}"/>
  <circle cx="210" cy="46" r="70" fill="#ffffff" fill-opacity="0.12"/>
  <text x="128" y="128" dy="0.35em" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="96" font-weight="700" fill="#ffffff">${initials(name)}</text>
</svg>`;

const bannerSvg = (title, subtitle, from, to) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="600" viewBox="0 0 1600 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="600" fill="url(#bg)"/>
  <circle cx="1400" cy="80" r="260" fill="#ffffff" fill-opacity="0.08"/>
  <circle cx="1250" cy="560" r="180" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="120" cy="620" r="220" fill="#ffffff" fill-opacity="0.05"/>
  <text x="110" y="280" font-family="Segoe UI, Arial, sans-serif" font-size="84" font-weight="700" fill="#ffffff">${escapeXml(title)}</text>
  <text x="114" y="360" font-family="Segoe UI, Arial, sans-serif" font-size="38" fill="#ffffff" fill-opacity="0.85">${escapeXml(subtitle)}</text>
  <rect x="114" y="410" width="120" height="8" rx="4" fill="#ffffff" fill-opacity="0.7"/>
</svg>`;

// Saves an SVG in uploads and returns its public url
const saveSvg = async (fileName, svg) => {
  await fs.writeFile(path.join(UPLOADS, fileName), svg);
  return `/uploads/${fileName}`;
};

// ---------- step 1: clear everything ----------

const clearFolder = async (folder) => {
  const files = await fs.readdir(folder).catch(() => []);
  for (const file of files) {
    if (file !== ".gitkeep") await fs.rm(path.join(folder, file), { recursive: true, force: true });
  }
};

const clearAll = async () => {
  console.log("\n!!! WARNING: deleting ALL data in the database and all uploaded files !!!\n");

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    await mongoose.connection.db.collection(name).deleteMany({});
  }

  await fs.mkdir(UPLOADS, { recursive: true });
  await fs.mkdir(PRIVATE_UPLOADS, { recursive: true });
  await clearFolder(UPLOADS);
  await clearFolder(PRIVATE_UPLOADS);
  console.log(`Cleared ${collections.length} collections and the upload folders`);
};

// ---------- step 2: users ----------

const exhibitorData = [
  {
    name: "Usman Siddiqui",
    email: "usman@nexabyte.pk",
    phone: "+92 321 2456789",
    color: "#2563eb",
    profile: {
      companyName: "NexaByte Technologies",
      category: "Technology",
      description:
        "Karachi-based software house building cloud, AI and mobile solutions for banks, telcos and retail brands across Pakistan and the Gulf.",
      productsServices: ["NexaCloud ERP", "AI Chatbot for Business", "Mobile App Development", "Cyber Security Audits"],
      website: "https://nexabyte.pk",
      contact: { person: "Usman Siddiqui", email: "info@nexabyte.pk", phone: "+92 21 34567890", address: "Shahrah-e-Faisal, Karachi" },
    },
  },
  {
    name: "Hina Malik",
    email: "hina@lahorizaiqa.pk",
    phone: "+92 300 4123456",
    color: "#ea580c",
    profile: {
      companyName: "Lahori Zaiqa Foods",
      category: "Food",
      description:
        "Ready-to-cook spice mixes, pickles and frozen snacks made with traditional Lahori recipes. Serving homes and restaurants since 2009.",
      productsServices: ["Masala Mixes", "Achaar Range", "Frozen Samosas & Rolls", "Catering Packages"],
      website: "https://lahorizaiqa.pk",
      contact: { person: "Hina Malik", email: "orders@lahorizaiqa.pk", phone: "+92 42 35761234", address: "Gulberg III, Lahore" },
    },
  },
  {
    name: "Sana Qureshi",
    email: "sana@kaarigar.pk",
    phone: "+92 333 5678123",
    color: "#db2777",
    profile: {
      companyName: "Kaarigar Couture",
      category: "Fashion",
      description:
        "Hand-embroidered eastern wear by local artisans from Multan and Hyderabad. Bridal, formal and pret collections with nationwide delivery.",
      productsServices: ["Bridal Collection", "Luxury Pret", "Hand-made Khussay", "Ajrak Shawls"],
      website: "https://kaarigar.pk",
      contact: { person: "Sana Qureshi", email: "hello@kaarigar.pk", phone: "+92 42 35123456", address: "MM Alam Road, Lahore" },
    },
  },
  {
    name: "Faisal Chaudhry",
    email: "faisal@indusdrive.pk",
    phone: "+92 345 8765432",
    color: "#0f766e",
    profile: {
      companyName: "IndusDrive Motors",
      category: "Automotive",
      description:
        "Electric bikes, rickshaws and EV charging stations designed for Pakistani roads. Cleaner and cheaper city travel.",
      productsServices: ["E-Bike Rider 70", "Electric Rickshaw", "Home EV Charger", "Fleet Tracking System"],
      website: "https://indusdrive.pk",
      contact: { person: "Faisal Chaudhry", email: "sales@indusdrive.pk", phone: "+92 51 2654321", address: "I-9 Industrial Area, Islamabad" },
    },
  },
  {
    name: "Dr. Amna Rizvi",
    email: "amna@roshanlearning.pk",
    phone: "+92 302 1122334",
    color: "#7c3aed",
    profile: {
      companyName: "Roshan Learning",
      category: "Education",
      description:
        "Online and campus courses in coding, design and English for students in Urdu and English. 40,000+ learners trained.",
      productsServices: ["Web Development Bootcamp", "Kids Coding Club", "IELTS Preparation", "Teacher Training"],
      website: "https://roshanlearning.pk",
      contact: { person: "Dr. Amna Rizvi", email: "admissions@roshanlearning.pk", phone: "+92 51 8899001", address: "Blue Area, Islamabad" },
    },
  },
  {
    name: "Dr. Kamran Shah",
    email: "kamran@shifacare.pk",
    phone: "+92 311 9988776",
    color: "#059669",
    profile: {
      companyName: "ShifaCare Health",
      category: "Health",
      description:
        "Telemedicine app, home lab sampling and affordable health plans. Connects patients with 500+ verified doctors.",
      productsServices: ["ShifaCare Telehealth App", "Home Lab Tests", "Family Health Plan", "Smart BP Monitor"],
      website: "https://shifacare.pk",
      contact: { person: "Dr. Kamran Shah", email: "care@shifacare.pk", phone: "+92 21 111744322", address: "Clifton Block 5, Karachi" },
    },
  },
];

const attendeeData = [
  { name: "Ayesha Khan", email: "ayesha.khan@demo.pk", phone: "+92 300 1234567" },
  { name: "Ali Raza", email: "ali.raza@demo.pk", phone: "+92 321 7654321" },
  { name: "Fatima Noor", email: "fatima.noor@demo.pk", phone: "+92 333 2223344" },
  { name: "Bilal Ahmed", email: "bilal.ahmed@demo.pk", phone: "+92 345 5556677" },
  { name: "Zainab Hussain", email: "zainab.hussain@demo.pk", phone: "+92 301 8889900" },
  { name: "Hamza Tariq", email: "hamza.tariq@demo.pk", phone: "+92 322 4445566" },
  { name: "Mariam Javed", email: "mariam.javed@demo.pk", phone: "+92 312 6677889" },
  { name: "Omar Farooq", email: "omar.farooq@demo.pk", phone: "+92 335 9900112" },
];

const consent = () => ({ termsAccepted: true, acceptedAt: daysAgo(30) });

const createUsers = async () => {
  const admin = await User.create({
    name: "EventSphere Admin",
    email: "admin@eventsphere.com",
    password: ADMIN_PASSWORD,
    role: "admin",
    phone: "+92 21 111222333",
    consent: consent(),
  });

  const exhibitors = [];
  for (const item of exhibitorData) {
    const user = await User.create({
      name: item.name,
      email: item.email,
      password: DEMO_PASSWORD,
      role: "exhibitor",
      phone: item.phone,
      consent: consent(),
    });
    const slug = item.profile.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const logo = await saveSvg(`demo-logo-${slug}.svg`, logoSvg(item.profile.companyName, item.color));
    const profile = await ExhibitorProfile.create({ ...item.profile, user: user._id, logo });
    exhibitors.push({ user, profile });
  }

  const attendees = [];
  for (const item of attendeeData) {
    attendees.push(
      await User.create({ ...item, password: DEMO_PASSWORD, role: "attendee", consent: consent() })
    );
  }

  console.log(`Created 1 admin, ${exhibitors.length} exhibitors, ${attendees.length} attendees`);
  return { admin, exhibitors, attendees };
};

// ---------- step 3: expos ----------

const createExpos = async (admin) => {
  const techBanner = await saveSvg(
    "demo-banner-tech-summit.svg",
    bannerSvg("Pakistan Tech Summit 2026", "8 - 10 December 2026  ·  Expo Centre Karachi", "#1e3a8a", "#0ea5e9")
  );
  const foodBanner = await saveSvg(
    "demo-banner-food-expo.svg",
    bannerSvg("Lahore Food & Lifestyle Expo 2026", "18 - 20 December 2026  ·  Expo Centre Lahore", "#9a3412", "#f59e0b")
  );
  const eduBanner = await saveSvg(
    "demo-banner-education-fair.svg",
    bannerSvg("Islamabad Education Fair 2026", "January 2027  ·  Pak-China Friendship Centre", "#4c1d95", "#14b8a6")
  );

  const tech = await Expo.create({
    title: "Pakistan Tech Summit 2026",
    description:
      "Pakistan's biggest technology event. Meet startups, software houses and investors, explore AI, fintech, EVs and health-tech, and join three days of keynotes, workshops and panels.",
    theme: "AI, Startups & Digital Pakistan",
    startDate: pkTime("2026-12-08", "10:00"),
    endDate: pkTime("2026-12-10", "18:00"),
    location: "Expo Centre Karachi, University Road, Karachi",
    banner: techBanner,
    status: "published",
    floorPlan: { rows: 6, cols: 8 },
    organizer: admin._id,
  });

  const food = await Expo.create({
    title: "Lahore Food & Lifestyle Expo 2026",
    description:
      "Three days of food, fashion and lifestyle in the heart of Lahore. Taste local brands, see the newest eastern wear, and learn from chefs and designers.",
    theme: "Taste, Style & Living",
    startDate: pkTime("2026-12-18", "11:00"),
    endDate: pkTime("2026-12-20", "21:00"),
    location: "Expo Centre Lahore, Johar Town, Lahore",
    banner: foodBanner,
    status: "published",
    floorPlan: { rows: 6, cols: 8 },
    organizer: admin._id,
  });

  const education = await Expo.create({
    title: "Islamabad Education Fair 2026",
    description:
      "Universities, colleges and ed-tech companies under one roof. Admissions guidance, scholarships and career counselling for students and parents.",
    theme: "Future of Learning",
    startDate: pkTime("2027-01-15", "10:00"),
    endDate: pkTime("2027-01-16", "17:00"),
    location: "Pak-China Friendship Centre, Islamabad",
    banner: eduBanner,
    status: "draft",
    floorPlan: { rows: 6, cols: 8 },
    organizer: admin._id,
  });

  console.log("Created 3 expos (2 published, 1 draft)");
  return { tech, food, education };
};

// ---------- step 4: booths ----------

// Booths stand on rows 0, 2 and 4. Rows 1, 3 and 5 are walking paths.
const halls = [
  { name: "Hall A", letter: "A", row: 0, size: "large", price: 150000 },
  { name: "Hall B", letter: "B", row: 2, size: "medium", price: 95000 },
  { name: "Hall C", letter: "C", row: 4, size: "small", price: 60000 },
];

// boothsPerHall e.g. [5, 5, 4] = 14 booths
const createBooths = async (expo, boothsPerHall) => {
  const booths = [];
  for (let h = 0; h < halls.length; h++) {
    const hall = halls[h];
    for (let i = 0; i < boothsPerHall[h]; i++) {
      booths.push({
        expo: expo._id,
        boothNumber: `${hall.letter}-${String(i + 1).padStart(2, "0")}`,
        hall: hall.name,
        position: { row: hall.row, col: i + 1 },
        size: hall.size,
        price: hall.price,
      });
    }
  }
  return Booth.insertMany(booths);
};

const staffNames = [
  ["Saad Iqbal", "Booth Manager"],
  ["Rabia Aslam", "Sales Executive"],
  ["Kashif Mehmood", "Product Specialist"],
  ["Iqra Shafiq", "Marketing Lead"],
  ["Waleed Akhtar", "Technical Support"],
  ["Nimra Butt", "Customer Relations"],
];

const bookBooth = async (booth, exhibitor) => {
  booth.status = "booked";
  booth.exhibitor = exhibitor.user._id;
  booth.productsShowcased = exhibitor.profile.productsServices.slice(0, 3);
  booth.staff = [0, 1].map(() => {
    const [name, role] = pick(staffNames);
    return { name, role, phone: `+92 3${randomInt(0, 4)}${randomInt(0, 9)} ${randomInt(1000000, 9999999)}` };
  });
  await booth.save();
};

const reserveBooth = async (booth, exhibitor) => {
  booth.status = "reserved";
  booth.exhibitor = exhibitor.user._id;
  await booth.save();
};

// ---------- step 5: applications ----------

// plan: [{ exhibitor, status, boothIndex, message, adminNote }]
const createApplications = async (expo, booths, plan) => {
  for (const item of plan) {
    const booth = item.boothIndex !== undefined ? booths[item.boothIndex] : null;

    if (booth && item.status === "approved") await bookBooth(booth, item.exhibitor);
    if (booth && item.status === "pending") await reserveBooth(booth, item.exhibitor);

    await ExhibitorApplication.create({
      expo: expo._id,
      exhibitor: item.exhibitor.user._id,
      profile: item.exhibitor.profile._id,
      message: item.message,
      preferredBooths: booth ? [booth._id] : [],
      assignedBooth: booth && item.status === "approved" ? booth._id : null,
      status: item.status,
      adminNote: item.adminNote || "",
      createdAt: daysAgo(randomInt(15, 25)),
    });
  }
};

// ---------- step 6: sessions ----------

const techSessions = [
  ["2026-12-08", "10:30", "11:30", "keynote", "Opening Keynote: Digital Pakistan 2030", "Digital Transformation", "Main Auditorium", 300,
    [["Dr. Imran Haider", "Chairman, Digital Pakistan Council"]]],
  ["2026-12-08", "12:00", "13:30", "workshop", "Build Your First AI Chatbot in Urdu", "Artificial Intelligence", "Workshop Room 1", 40,
    [["Usman Siddiqui", "CEO, NexaByte Technologies"]]],
  ["2026-12-08", "15:00", "16:00", "panel", "Funding Pakistani Startups in 2027", "Startups & Investment", "Main Auditorium", 200,
    [["Nadia Hameed", "Founder, Karachi Startup Hub"], ["Saqib Mirza", "Angel Investor"], ["Rehana Aziz", "Venture Partner"]]],
  ["2026-12-09", "10:00", "11:00", "keynote", "Fintech and the Next 100 Million Users", "Fintech", "Main Auditorium", 300,
    [["Mehreen Aftab", "Head of Digital Banking"]]],
  ["2026-12-09", "11:30", "13:00", "workshop", "Cloud Basics for Students (Hands-on)", "Cloud Computing", "Workshop Room 1", 35,
    [["Rizwan Ali", "Senior Cloud Architect"]]],
  ["2026-12-09", "14:30", "15:30", "session", "Electric Vehicles on Pakistani Roads", "Automotive & EV", "Hall B Stage", 120,
    [["Faisal Chaudhry", "Founder, IndusDrive Motors"]]],
  ["2026-12-09", "16:00", "17:00", "panel", "Women in Tech: Breaking Barriers", "Diversity", "Main Auditorium", 180,
    [["Sobia Khalid", "Founder, Women Coders Pakistan"], ["Dr. Saima Hassan", "Professor, NUST"]]],
  ["2026-12-10", "10:30", "11:30", "session", "Health-Tech: Doctors on Your Phone", "Health Technology", "Hall B Stage", 100,
    [["Dr. Kamran Shah", "CEO, ShifaCare Health"]]],
  ["2026-12-10", "12:00", "13:30", "workshop", "Cyber Security for Small Businesses", "Cyber Security", "Workshop Room 1", 30,
    [["Hassan Javaid", "Security Consultant"]]],
  ["2026-12-10", "15:00", "16:00", "keynote", "Closing Keynote: From Freelancer to Founder", "Careers", "Main Auditorium", 300,
    [["Ahmed Nadeem", "Founder, Remote Pakistan"]]],
];

const foodSessions = [
  ["2026-12-18", "12:00", "13:00", "keynote", "Opening Keynote: The Future of Pakistani Food Brands", "Food Business", "Main Stage", 250,
    [["Chef Asad Latif", "Executive Chef, Lahore"]]],
  ["2026-12-18", "14:00", "15:30", "workshop", "Live Cooking: Authentic Lahori Nihari", "Cooking", "Kitchen Studio", 30,
    [["Hina Malik", "Founder, Lahori Zaiqa Foods"]]],
  ["2026-12-18", "17:00", "18:00", "panel", "Home Kitchens to Big Brands", "Entrepreneurship", "Main Stage", 150,
    [["Naheed Akhtar", "Food Expert"], ["Junaid Mukhtar", "Restaurant Owner"]]],
  ["2026-12-19", "12:00", "13:00", "session", "Sustainable Fashion with Local Artisans", "Fashion", "Fashion Lounge", 100,
    [["Sana Qureshi", "Creative Director, Kaarigar Couture"]]],
  ["2026-12-19", "14:00", "15:30", "workshop", "Ajrak and Block Printing Basics", "Crafts", "Workshop Room", 25,
    [["Ustad Allah Bachaya", "Master Artisan, Hyderabad"]]],
  ["2026-12-19", "16:30", "17:30", "panel", "Selling Online: Instagram, Daraz and Beyond", "E-commerce", "Main Stage", 150,
    [["Mahnoor Shah", "Digital Marketer"], ["Adeel Rana", "E-commerce Consultant"]]],
  ["2026-12-19", "19:00", "20:00", "session", "Bridal Trends 2027 Fashion Show", "Fashion", "Fashion Lounge", 200,
    [["Areeba Saleem", "Fashion Stylist"]]],
  ["2026-12-20", "12:00", "13:00", "session", "Healthy Eating on a Desi Diet", "Health & Nutrition", "Main Stage", 120,
    [["Dr. Ayesha Abbas", "Nutritionist, ShifaCare Health"]]],
  ["2026-12-20", "15:00", "16:30", "workshop", "Food Photography with Your Phone", "Photography", "Workshop Room", 30,
    [["Arsalan Sheikh", "Food Photographer"]]],
];

const createSessions = async (expo, list) => {
  const docs = list.map(([day, start, end, type, title, topic, location, capacity, speakers]) => ({
    expo: expo._id,
    title,
    description: `${title}. A ${type} at ${expo.title} about ${topic.toLowerCase()}, with time for questions at the end.`,
    topic,
    type,
    speakers: speakers.map(([name, designation]) => ({
      name,
      designation,
      bio: `${designation}. Speaking at ${expo.title}.`,
    })),
    location,
    startTime: pkTime(day, start),
    endTime: pkTime(day, end),
    capacity,
  }));
  return Session.insertMany(docs);
};

// ---------- step 7: registrations, bookmarks, visits ----------

const createRegistrations = async (expo, attendees, sessions, cancelledIndex) => {
  let count = 0;
  for (let i = 0; i < attendees.length; i++) {
    const attendee = attendees[i];
    const createdAt = daysAgo(randomInt(1, 20));

    await Registration.create({
      attendee: attendee._id,
      expo: expo._id,
      ticketCode: makeTicketCode(),
      status: i === cancelledIndex ? "cancelled" : "registered",
      createdAt,
    });
    count++;
    if (i === cancelledIndex) continue;

    // 2 to 4 sessions for each attendee
    const chosen = [...sessions].sort(() => random() - 0.5).slice(0, randomInt(2, 4));
    for (const session of chosen) {
      await Registration.create({
        attendee: attendee._id,
        expo: expo._id,
        session: session._id,
        createdAt: new Date(createdAt.getTime() + randomInt(5, 600) * 60 * 1000),
      });
      await Session.updateOne({ _id: session._id }, { $inc: { registeredCount: 1 } });
      count++;
    }

    // 1 to 3 bookmarks
    const bookmarked = [...sessions].sort(() => random() - 0.5).slice(0, randomInt(1, 3));
    for (const session of bookmarked) {
      await Bookmark.create({
        user: attendee._id,
        session: session._id,
        expo: expo._id,
        remindBeforeMinutes: pick([15, 30, 60]),
      });
    }
  }
  return count;
};

// Booked booths get most of the visits, so the traffic chart looks real
const createBoothVisits = async (expo, booths, attendees, total) => {
  const booked = booths.filter((b) => b.status === "booked");
  const others = booths.filter((b) => b.status !== "booked");
  const visits = [];

  for (let i = 0; i < total; i++) {
    const booth = random() < 0.8 ? pick(booked) : pick(others);
    visits.push({
      booth: booth._id,
      expo: expo._id,
      visitor: pick(attendees)._id,
      source: random() < 0.6 ? "floor_plan" : "profile_view",
      createdAt: daysAgo(randomInt(0, 14)),
    });
  }
  await BoothVisit.insertMany(visits);
  return visits.length;
};

// ---------- step 8: chat, notifications, feedback ----------

const createConversation = async (expo, type, users, lines) => {
  const conversation = await Conversation.create({
    participants: users.map((u) => u._id),
    expo: expo._id,
    type,
  });

  // lines: [[senderIndex, text], ...]. The last message is left unread.
  let time = Date.now() - (lines.length + 1) * 47 * 60 * 1000;
  let lastMessage = null;
  for (let i = 0; i < lines.length; i++) {
    const [senderIndex, text] = lines[i];
    time += 47 * 60 * 1000;
    lastMessage = await Message.create({
      conversation: conversation._id,
      sender: users[senderIndex]._id,
      text,
      isRead: i < lines.length - 1,
      createdAt: new Date(time),
    });
  }

  conversation.lastMessage = lastMessage._id;
  await conversation.save();
  return conversation;
};

const createChats = async (tech, food, admin, exhibitors, attendees) => {
  const [nexabyte, lahoriZaiqa, kaarigar, indusDrive, , shifaCare] = exhibitors.map((e) => e.user);
  const [ayesha, ali, fatima] = attendees;

  const chats = [
    await createConversation(tech, "attendee_exhibitor", [ayesha, nexabyte], [
      [0, "Assalam o Alaikum! Will you show the Urdu AI chatbot live at your booth?"],
      [1, "Walaikum Assalam Ayesha! Yes, we will have a live demo every hour at booth A-01."],
      [0, "Great. Do you also offer internships for computer science students?"],
      [1, "Yes, we are hiring 10 interns for summer 2027. Please bring your CV to the booth."],
    ]),
    await createConversation(tech, "attendee_exhibitor", [ali, indusDrive], [
      [0, "What is the price of the E-Bike Rider 70?"],
      [1, "Expo special price is Rs. 2,45,000 with free home charger. Test rides are free at booth A-02."],
      [0, "Can I book a test ride on 9th December?"],
    ]),
    await createConversation(tech, "exhibitor_exhibitor", [nexabyte, shifaCare], [
      [1, "Hi Usman, we liked your chatbot. Can it work with our telehealth app?"],
      [0, "Definitely Dr. Kamran. Let's meet at your booth on day one after the keynote."],
      [1, "Perfect, see you at 12 pm."],
    ]),
    await createConversation(food, "support", [admin, kaarigar], [
      [1, "Hello, can we get two extra power sockets at our booth for lighting?"],
      [0, "Yes, extra sockets are available for Rs. 3,000 each. We have added two to your booth."],
      [1, "Thank you so much!"],
    ]),
    await createConversation(food, "attendee_exhibitor", [fatima, lahoriZaiqa], [
      [0, "Will you have free tasting at the expo?"],
      [1, "Yes! Free tasting of all masala mixes, and 20% off on every order at the expo."],
    ]),
  ];
  return chats;
};

const createNotifications = async (tech, food, admin, exhibitors, attendees, chats) => {
  const notes = [];
  const add = (user, title, message, type, link, isRead, days) =>
    notes.push({ user: user._id, title, message, type, link, isRead, createdAt: daysAgo(days) });

  const [nexabyte, lahoriZaiqa, , indusDrive, roshan] = exhibitors.map((e) => e.user);

  add(nexabyte, "Application approved", `Your application for ${tech.title} was approved. Booth A-01 is booked for you.`, "application", "/applications/my", true, 12);
  add(nexabyte, "New message", "Ayesha Khan sent you a message", "message", `/chat/${chats[0]._id}`, false, 0);
  add(indusDrive, "Application approved", `Your application for ${tech.title} was approved. Booth A-02 is booked for you.`, "application", "/applications/my", true, 11);
  add(indusDrive, "New message", "Ali Raza sent you a message", "message", `/chat/${chats[1]._id}`, false, 0);
  add(lahoriZaiqa, "Application rejected", `Your application for ${tech.title} was rejected. See the admin note for details.`, "application", "/applications/my", false, 9);
  add(lahoriZaiqa, "Application approved", `Your application for ${food.title} was approved. Booth A-01 is booked for you.`, "application", "/applications/my", true, 10);
  add(roshan, "Application received", `Your application for ${tech.title} is under review.`, "application", "/applications/my", false, 3);
  add(admin, "New exhibitor application", `Roshan Learning applied for ${tech.title}`, "application", "/admin/applications", false, 3);
  add(admin, "New feedback", "An attendee sent new feedback", "info", "/admin/feedback", false, 1);

  for (const attendee of attendees.slice(0, 5)) {
    add(attendee, "Registration confirmed", `You are registered for ${tech.title}. Your ticket is ready.`, "registration", `/expos/${tech._id}`, true, randomInt(4, 15));
  }
  add(attendees[0], "New message", "NexaByte Technologies replied to your message", "message", `/chat/${chats[0]._id}`, false, 0);
  add(attendees[1], "Session update", "\"Electric Vehicles on Pakistani Roads\" will now be held at Hall B Stage", "session", "/sessions/", false, 2);
  add(attendees[2], "Welcome to EventSphere", "Explore upcoming expos and register to get your ticket.", "system", "", true, 20);

  await Notification.insertMany(notes);
  return notes.length;
};

const createFeedback = async (tech, food, exhibitors, attendees) => {
  const items = [
    { user: attendees[0], expo: tech, type: "suggestion", subject: "Please add a session on freelancing",
      message: "Many students want to learn about freelancing on Upwork and Fiverr. A short workshop would be very helpful.",
      rating: 5, status: "resolved", adminResponse: "Thank you Ayesha! We added the closing keynote 'From Freelancer to Founder'." },
    { user: attendees[1], expo: tech, type: "issue", subject: "Ticket email not received",
      message: "I registered for the summit but did not get the ticket email. I can see the ticket in the app though.",
      rating: 4, status: "in_progress", adminResponse: "We are checking the email service. Your ticket in the app is valid at the gate." },
    { user: attendees[2], expo: food, type: "suggestion", subject: "More vegetarian food stalls",
      message: "It would be nice to have more vegetarian options at the food expo.",
      rating: 4, status: "open" },
    { user: attendees[3], expo: tech, type: "complaint", subject: "Workshop seats filled too fast",
      message: "The cloud workshop was full within one day. Please increase the seats or add a second slot.",
      rating: 3, status: "open" },
    { user: attendees[4], expo: food, type: "other", subject: "Loved the floor plan feature",
      message: "Finding booths on the interactive floor plan is very easy. Great work!",
      rating: 5, status: "resolved", adminResponse: "Thank you for the kind words, Zainab!" },
    { user: attendees[5], expo: null, type: "issue", subject: "Dark mode request",
      message: "Please add a dark mode to the app, it is hard to use at night.",
      rating: null, status: "open" },
    { user: exhibitors[2].user, expo: food, type: "suggestion", subject: "Booth lighting options",
      message: "Fashion booths need better lighting. Please offer a lighting package for exhibitors.",
      rating: 4, status: "in_progress", adminResponse: "We are talking to the venue about a lighting package." },
    { user: exhibitors[0].user, expo: tech, type: "other", subject: "Smooth application process",
      message: "Applying for a booth and getting approval was quick and simple.",
      rating: 5, status: "resolved", adminResponse: "Glad to hear that. See you at the summit!" },
  ];

  await Feedback.insertMany(
    items.map((item) => ({
      ...item,
      user: item.user._id,
      expo: item.expo ? item.expo._id : null,
      adminResponse: item.adminResponse || "",
      createdAt: daysAgo(randomInt(1, 10)),
    }))
  );
  return items.length;
};

// ---------- run ----------

const printAccounts = (admin, exhibitors, attendees) => {
  const rows = [{ Role: "admin", Name: admin.name, Email: admin.email, Password: ADMIN_PASSWORD }];
  exhibitors.forEach(({ user, profile }) =>
    rows.push({ Role: "exhibitor", Name: `${user.name} (${profile.companyName})`, Email: user.email, Password: DEMO_PASSWORD })
  );
  attendees.forEach((user) => rows.push({ Role: "attendee", Name: user.name, Email: user.email, Password: DEMO_PASSWORD }));

  console.log("\nDemo accounts:");
  console.table(rows);
};

const seedDemo = async () => {
  await connectDB();
  await clearAll();

  const { admin, exhibitors, attendees } = await createUsers();
  const [nexabyte, lahoriZaiqa, kaarigar, indusDrive, roshan, shifaCare] = exhibitors;
  const { tech, food } = await createExpos(admin);

  // Tech summit: 14 booths
  const techBooths = await createBooths(tech, [5, 5, 4]);
  await createApplications(tech, techBooths, [
    { exhibitor: nexabyte, status: "approved", boothIndex: 0, message: "We will demo our Urdu AI chatbot and ERP." },
    { exhibitor: indusDrive, status: "approved", boothIndex: 1, message: "We need space to display two e-bikes and a rickshaw." },
    { exhibitor: shifaCare, status: "approved", boothIndex: 6, message: "We will offer free BP checks with our telehealth demo." },
    { exhibitor: roshan, status: "pending", boothIndex: 11, message: "We would like to run free coding mini-classes for kids." },
    { exhibitor: lahoriZaiqa, status: "rejected", message: "We would like to set up a food stall for visitors.",
      adminNote: "This summit is only for technology companies. Please apply for the Lahore Food & Lifestyle Expo instead." },
  ]);

  // Food expo: 16 booths
  const foodBooths = await createBooths(food, [6, 5, 5]);
  await createApplications(food, foodBooths, [
    { exhibitor: lahoriZaiqa, status: "approved", boothIndex: 0, message: "Food stall with live tasting counter." },
    { exhibitor: kaarigar, status: "approved", boothIndex: 1, message: "Bridal and pret collection display with a small ramp." },
    { exhibitor: shifaCare, status: "approved", boothIndex: 7, message: "Healthy living corner with free nutrition advice." },
    { exhibitor: nexabyte, status: "pending", boothIndex: 12, message: "We want to show our restaurant POS and ordering app." },
    { exhibitor: indusDrive, status: "pending", message: "Electric delivery bikes for food businesses." },
  ]);
  console.log(`Created ${techBooths.length + foodBooths.length} booths and 10 applications`);

  const techSessionDocs = await createSessions(tech, techSessions);
  const foodSessionDocs = await createSessions(food, foodSessions);
  console.log(`Created ${techSessionDocs.length + foodSessionDocs.length} sessions`);

  // Tech: 7 attendees (the 4th one cancelled). Food: 6 attendees.
  let registrations = await createRegistrations(tech, attendees.slice(0, 7), techSessionDocs, 3);
  registrations += await createRegistrations(food, attendees.slice(2, 8), foodSessionDocs, -1);
  console.log(`Created ${registrations} registrations and some bookmarks`);

  // Reload booths to get the new statuses
  const visits =
    (await createBoothVisits(tech, await Booth.find({ expo: tech._id }), attendees, 160)) +
    (await createBoothVisits(food, await Booth.find({ expo: food._id }), attendees, 130));
  console.log(`Created ${visits} booth visits`);

  const chats = await createChats(tech, food, admin, exhibitors, attendees);
  const notifications = await createNotifications(tech, food, admin, exhibitors, attendees, chats);
  const feedback = await createFeedback(tech, food, exhibitors, attendees);
  console.log(`Created ${chats.length} conversations, ${notifications} notifications, ${feedback} feedback items`);

  printAccounts(admin, exhibitors, attendees);
  console.log("Demo data is ready!\n");

  await mongoose.disconnect();
};

seedDemo().catch(async (error) => {
  console.error("Seeding failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
