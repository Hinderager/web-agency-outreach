import fs from "fs";
import Handlebars from "handlebars";
import { markEmailSent, markProcessingError } from './sheets_integration_row_based.js';

const IN = "data/output/ready_for_email.json";
const OUT = "data/output/instantly_import.csv";

const emailTpl = Handlebars.compile(`Hi {{firstName}},

I mocked up a modern hero for {{company}} using your current brand cues.

Preview: {{preview_url}}

If helpful, I can deliver the full live site in 7 days and make SEO-improving updates monthly.

— Eric`);

function csvRow(arr){ return arr.map(v => `"${String(v??"").replaceAll("\"","\"\"")}`).join(",") }

(async ()=>{
  if (!fs.existsSync(IN)) {
    console.log("❌ Error: ready_for_email.json not found");
    console.log("Please run: node scripts/branches_and_previews.js first");
    return;
  }
  
  const rows = JSON.parse(fs.readFileSync(IN,"utf-8"));
  const out = [
    csvRow(["email","first_name","company","domain","city","preview_url","screenshot_url","email_body"])
  ];
  for (const r of rows) {
    const firstName = (r.company||"").split(" ")[0] || "there";
    const body = emailTpl({
      firstName, company: r.company, preview_url: r.preview_url
    });
    const screenshotUrl = r.preview_url ? `${r.preview_url}/prospects/${r.slug}/hero.png` : "";
    out.push(csvRow([r.email, firstName, r.company, r.domain, r.city, r.preview_url||"", screenshotUrl, body]));
  }
  fs.writeFileSync(OUT, out.join("\n"));
  console.log(`🎉 Wrote ${OUT} (${rows.length} rows)`);
  
  // Mark each lead as "email sent" in Google Sheets
  console.log(`📧 Updating Google Sheets status to "email sent"...`);
  for (const r of rows) {
    try {
      if (r.rowNumber) {
        await markEmailSent({ rowNumber: r.rowNumber });
        console.log(`✅ Marked row ${r.rowNumber} as "email sent"`);
      }
    } catch (error) {
      console.error(`❌ Failed to mark row ${r.rowNumber} as sent:`, error.message);
      if (r.rowNumber) {
        await markProcessingError({ rowNumber: r.rowNumber }, `Failed to mark email sent: ${error.message}`);
      }
    }
  }
  
  console.log(`🎉 All ${rows.length} leads marked as "email sent" in Google Sheets!`);
})();