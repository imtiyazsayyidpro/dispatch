import app from './app.js';
import dotenv from 'dotenv';
import { startScheduler } from './scheduler/scheduler.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`Scheduler running on port ${PORT}`);
  await startScheduler();
});
