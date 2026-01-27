/**
 * PDF Generation Service
 * Uses Puppeteer to render the dashboard as PDF
 */

const puppeteer = require('puppeteer');
const config = require('../config/env');

/**
 * Generate PDF from the dashboard page
 * @param {string} url - The URL to render as PDF
 * @returns {Promise<Buffer>} - PDF file buffer
 */
async function generateDashboardPDF(url = config.api.corsOrigin) {
  let browser = null;

  try {
    console.log(`Generating PDF for URL: ${url}`);

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle0', // Wait until network is idle
      timeout: 60000, // 60 second timeout
    });

    // Wait for charts to render (Recharts uses SVG)
    await page.waitForSelector('.recharts-wrapper', { timeout: 30000 });

    // Additional wait to ensure all data is loaded
    await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 3000); // Wait 3 seconds for data to settle
      });
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px;">
          <span>HPC Monitoring Dashboard - Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    });

    console.log('PDF generated successfully');
    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generateDashboardPDF,
};
