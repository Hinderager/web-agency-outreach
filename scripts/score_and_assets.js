import fs from "fs";
import path from "path";
import { parse } from "fast-csv";
import puppeteer from "puppeteer";
import { Vibrant } from "node-vibrant/node";
import slugify from "slugify";

const INPUT = "data/input/leads.csv";
const OUT_JSON = "data/output/scored.json";

async function run() {
  console.log("🚀 Starting website analysis...");
  
  const rows = [];
  await new Promise((res, rej) => fs.createReadStream(INPUT).pipe(parse({ headers:true }))
    .on("data", r => rows.push(r)).on("end", res).on("error", rej));

  console.log(`📊 Found ${rows.length} leads to analyze`);
  console.log("✅ Script is working! Ready for full analysis.");
}

run().catch(console.error);
