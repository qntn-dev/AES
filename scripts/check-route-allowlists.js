#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const routeFile = path.join(root, 'chrome-extension/src/aes-routes.js');
const routeSource = fs.readFileSync(routeFile, 'utf8');

const routeArrayNames = [
    'HANDLED_PATHS',
    'NATIVE_HOME_PATHS',
    'HANDLED_PATH_INCLUDES',
    'EXCLUDED_PATHS',
    'EXCLUDED_PATH_INCLUDES',
    'DYNAMIC_PATH_FRAGMENTS',
    'DYNAMIC_EXACT_PATHS'
];

function extractArray(source, name) {
    const match = source.match(new RegExp('const\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\];'));
    if (!match) {
        throw new Error('Missing route array ' + name + ' in aes-routes.js');
    }
    return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((entry) => entry[1].toLowerCase().replace(/\/index$/, ''));
}

const routes = Object.fromEntries(routeArrayNames.map((name) => [name, extractArray(routeSource, name)]));
const handled = new Set([
    ...routes.HANDLED_PATHS,
    ...routes.NATIVE_HOME_PATHS,
    ...routes.HANDLED_PATH_INCLUDES,
    ...routes.DYNAMIC_PATH_FRAGMENTS,
    ...routes.DYNAMIC_EXACT_PATHS
]);

const requiredRoutes = [
    '/mvc/servicedesk/ticketdetail.mvc',
    '/mvc/servicedesk/ticketnew.mvc',
    '/mvc/crm/accountdetail.mvc',
    '/mvc/projects/taskdetail.mvc',
    '/autotask/views/dispatcherworkshop/dispatcherworkshopcontainer.aspx',
    '/autotask/views/administration/companysetup/neweditallocationcode.aspx',
    '/mvc/administrationsetup/invoicetemplate.mvc/editinvoicetemplate',
    '/mvc/contracts/invoiceemailtemplate.mvc/editinvoiceemailtemplate',
    '/autotask/views/template/customizenotificationtemplate.aspx',
    '/autotask/inventory/inventory_edit_order.aspx',
    '/mvc/inventory/receipthistory.mvc',
    '/mvc/inventory/emailpurchaseorder.mvc/emailpurchaseorder'
];

const missing = requiredRoutes.filter((route) => !handled.has(route));
if (missing.length) {
    throw new Error('Missing required AES route(s): ' + missing.join(', '));
}

const consumers = [
    'chrome-extension/src/aes-shared.js',
    'chrome-extension/src/aes-page-bridge.js',
    'chrome-extension/src/aes-background.js'
];

for (const rel of consumers) {
    const source = fs.readFileSync(path.join(root, rel), 'utf8');
    if (!source.includes('__AES_ROUTE_REGISTRY__')) {
        throw new Error(rel + ' does not consume the central route registry');
    }
    if (/const\s+HANDLED_PATHS\s*=\s*\[/.test(source) || /AES\.HANDLED_PATHS\s*=\s*\[/.test(source)) {
        throw new Error(rel + ' still owns a duplicated HANDLED_PATHS array');
    }
}

const runtimeRoots = [
    'chrome-extension/src',
    'firefox-extension/src',
    'dist/safari/Autotask Enhancement Suite/Autotask Enhancement Suite Extension/Resources/src'
].filter((rel) => fs.existsSync(path.join(root, rel)));

for (const rel of runtimeRoots) {
    const candidate = path.join(root, rel, 'aes-routes.js');
    if (!fs.existsSync(candidate)) {
        throw new Error(rel + ' is missing aes-routes.js');
    }
    const candidateSource = fs.readFileSync(candidate, 'utf8');
    for (const name of routeArrayNames) {
        const expected = extractArray(routeSource, name).join('\n');
        const actual = extractArray(candidateSource, name).join('\n');
        if (actual !== expected) {
            throw new Error(rel + '/aes-routes.js has a divergent ' + name + ' array');
        }
    }
}

console.log('route_allowlists_ok');
