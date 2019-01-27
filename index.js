#!/usr/bin/env node

const path = require("path");
const Credentials = require("local-credentials");
const { prompt } = require('enquirer');
const puppeteer = require('puppeteer');
const program = require("commander");

const packageDetails = require(path.join(__dirname, "package.json"));

(async () => {
    // Allow for command line arguments
    program
        .version(packageDetails.version)
        .option('-u, --username <name>', 'Username to log in with')
        .option('-p, --password <password>', 'Password to log in with')
        .option('-c, --credentials [name]', 'Profile from ~/.vanguard/credentials to use', "default")
        .parse(process.argv);

    // Read the config file if it exists
    let credentials = {};
    try {
        credentials = await new Credentials("~/.vanguard/credentials").get(program.credentials);
    } catch (e) {
        // It's ok if we couldn't read the credentials file, we can just prompt
    }

    // If we have command line credentials, those override the config file
    if (program.username) { credentials.username = program.username; }
    if (program.password) { credentials.password = program.password; }

    // If we still need username or password, prompt for them
    if (!credentials.username || !credentials.password) {
        // Prompt for details 
        const question = [
            {
                type: 'input',
                name: 'username',
                message: `What is your username? (${credentials.username || 'required'})`
            },
            {
                type: 'password',
                name: 'password',
                message: `What is your password? (${credentials.password ? '[masked]' : 'required'})`
            }
        ];

        let answers = await prompt(question);

        if (answers.username) { credentials.username = answers.username; }
        if (answers.password) { credentials.password = answers.password; }
    }

    if (!credentials.username) { console.log("Username is required"); process.exit(1); }
    if (!credentials.password) { console.log("Password is required"); process.exit(1); }

    // At this point, we have enough credentials to log in
    const browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage()

    await page.goto('https://secure.vanguardinvestor.co.uk/Login');

    await page.type('#\__GUID_1007', credentials.username);
    await page.type('#\__GUID_1008', credentials.password);

    await page.click('.submit > .btn-primary');

    await page.waitForNavigation();

    // Wait for "Investments" link
    // This is a terrible selector, but it's the best we can do unless it gets 
    // a more unique identifier
    await page.waitForSelector('.col-xxs-12:nth-child(2) .action > a');
    await page.click('.col-xxs-12:nth-child(2) .action > a');

    // Wait for the table to load
    await page.waitForSelector('.table-investments-simple');
    const data = await page.$$eval('table.table-investments-simple tr td', tds => tds.map((td) => {
        return td.textContent;
    }));

    // There are 6 columns available
    // We care about the first 5 and skip the last one
    const rows = [];
    for (let i=0; i < data.length; i) {
        row = {
            "holdings": data[i++].replace("actionsTop-upSellSwitch", ""),
            "current_weight": data[i++],
            "total_cost": data[i++],
            "current_value": data[i++],
            "change": data[i++].replace("Change (£)", ""),
        }

        i++; // Skip actions column

        // We want to skip the Total Holdings column
        if (row.holdings.toLowerCase() !== 'total holdings') {
            rows.push(row);
        }

    }

    console.log(JSON.stringify({
        "date": (new Date).toISOString().split('T')[0],
        "funds": rows
    }));

    await browser.close()
})()
