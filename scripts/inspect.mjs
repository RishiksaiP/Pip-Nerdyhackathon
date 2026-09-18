import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts/screenshots',{recursive:true});
const browser=await chromium.launch({...(process.platform==='darwin'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{}),headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
for(const route of ['','world','demo']){await page.goto((process.env.PIP_TEST_URL||'http://localhost:3000')+'/'+route);await page.waitForTimeout(1200);await page.screenshot({path:`artifacts/screenshots/${route||'landing'}-desktop.png`,fullPage:true});console.log(route||'landing',await page.locator('h1').textContent());}
await browser.close();
