// scripts/run-cron.js - Wrapper for GitHub Actions
import { config } from 'dotenv';

// Load environment variables
config();

// Mock req/res objects for Vercel functions
function createMockRequest() {
  return {
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET || 'github-actions'}`
    },
    method: 'POST',
    body: {}
  };
}

function createMockResponse() {
  return {
    status: (code) => ({
      json: (data) => {
        if (code >= 400) {
          console.error('❌ Error response:', data);
          process.exit(1);
        } else {
          console.log('✅ Success response:', data);
          process.exit(0);
        }
      }
    }),
    json: (data) => {
      console.log('✅ Success response:', data);
      process.exit(0);
    }
  };
}

async function runCronJob(jobType) {
  console.log(`🚀 Starting ${jobType} job via GitHub Actions`);
  
  const req = createMockRequest();
  const res = createMockResponse();
  
  try {
    let handler;
    
    if (jobType === 'market-update') {
      const module = await import('../api/cron/market-update.js');
      handler = module.default;
    } else if (jobType === 'degen-alert') {
      const module = await import('../api/cron/degen-alert.js');
      handler = module.default;
    } else {
      throw new Error(`Unknown job type: ${jobType}`);
    }
    
    await handler(req, res);
    
  } catch (error) {
    console.error(`❌ ${jobType} failed:`, error);
    process.exit(1);
  }
}

// Get job type from command line argument
const jobType = process.argv[2];

if (!jobType) {
  console.error('❌ Please specify job type: market-update or degen-alert');
  process.exit(1);
}

// Set CRON_SECRET if not provided
if (!process.env.CRON_SECRET) {
  process.env.CRON_SECRET = 'github-actions';
}

runCronJob(jobType);
