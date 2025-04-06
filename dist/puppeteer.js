"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateLogin = simulateLogin;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
async function simulateLogin(username, password) {
    const url = "https://fantasy.premierleague.com/";
    const usernameSelector = "#loginUsername";
    const passwordSelector = "#loginLoginWrap";
    const submitSelector = `button[type="submit"]`;
    const cookieButtonSelector = "#onetrust-accept-btn-handler";
    const teamUrl = "https://fantasy.premierleague.com/my-team";
    const browser = await puppeteer_extra_1.default.launch({
        headless: false,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });
    const page = await browser.newPage();
    const responses = [];
    // page.on('response', async (response) => {
    //     try {
    //         if (
    //             // response.url().indexOf(".png") === -1 &&
    //             // response.url().indexOf("css") === -1 &&
    //             // response.url().indexOf(".js") === -1 &&
    //             // response.url().indexOf(".svg") === -1 &&
    //             // response.url().indexOf(".woff2") === -1 &&
    //             // response.url().indexOf(".jpg") === -1 &&
    //             response.url().indexOf("\"https://fantasy.premierleague.com/api\"") >= 0
    //         ) {
    //             responses.push({
    //                 url: response.url(),
    //                 headers: response.headers(),
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Error processing response:', error);
    //     }
    // });
    try {
        await page.goto(url);
        await page.waitForSelector(cookieButtonSelector);
        await page.click(cookieButtonSelector);
        await page.waitForSelector(usernameSelector);
        await page.type(usernameSelector, username);
        await page.type(passwordSelector, password);
        console.log('Submitting the form...');
        await page.click("form button");
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await page.click("form button");
        await page.$eval('form', (form) => form.submit());
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await sleep(5000);
        console.log('Login process completed.');
        console.log(`Navigating to: ${teamUrl}`);
        await page.goto(teamUrl);
        await page.waitForNavigation();
    }
    catch (error) {
        console.error('Puppeteer error:', error);
    }
    finally {
        await browser.close();
        return responses;
    }
}
async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}
