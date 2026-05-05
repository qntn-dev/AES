#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const runtimes = [
  {
    name: 'chrome',
    srcDir: path.join(rootDir, 'chrome-extension', 'src'),
  },
  {
    name: 'firefox',
    srcDir: path.join(rootDir, 'firefox-extension', 'src'),
  },
  {
    name: 'safari',
    srcDir: path.join(rootDir, 'dist', 'safari', 'Autotask Enhancement Suite', 'Autotask Enhancement Suite Extension', 'Resources', 'src'),
  },
];

// These routes are intentionally handled by specialized Peek/native paths
// instead of the normal tab forwarding path. Keep this list small and explain
// additions in the surrounding code when possible.
const ROUTE_SYNC_EXCEPTIONS = new Set([
  '/mvc/inventory/receipthistory.mvc',
  '/mvc/inventory/emailpurchaseorder.mvc/emailpurchaseorder',
]);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function normalizeRoute(route) {
  return String(route || '').toLowerCase().replace(/\/index$/, '');
}

function extractArrayStrings(source, arrayName) {
  const pattern = new RegExp(`${arrayName}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
  const match = source.match(pattern);
  if (!match) return [];
  const body = match[1];
  const values = [];
  const stringPattern = /'([^']+)'|"([^"]+)"/g;
  let stringMatch;
  while ((stringMatch = stringPattern.exec(body))) {
    values.push(normalizeRoute(stringMatch[1] || stringMatch[2]));
  }
  return values;
}

function extractShellExactRoutes(source) {
  const routes = new Set();
  const pattern = /if\s*\(\s*p\s*===\s*'([^']+)'\s*\)\s*return\s*'([^']+)'/g;
  let match;
  while ((match = pattern.exec(source))) {
    const route = normalizeRoute(match[1]);
    const type = String(match[2] || '').toLowerCase();
    if (type && type !== 'unknown') routes.add(route);
  }
  return routes;
}

function extractIframeExtractorRoutes(source) {
  const routes = new Set();
  const pattern = /if\s*\(\s*p\s*===\s*'([^']+)'\s*\)\s*\{\s*return\s+extract[A-Za-z0-9_]+Info\s*\(/g;
  let match;
  while ((match = pattern.exec(source))) {
    routes.add(normalizeRoute(match[1]));
  }
  return routes;
}

function routeCovered(route, exactRoutes, includeFragments) {
  if (exactRoutes.has(route)) return true;
  for (const fragment of includeFragments) {
    if (fragment && route.includes(fragment)) return true;
  }
  return false;
}

function readGate(srcDir, fileName, exactArrayName, includeArrayName) {
  const source = read(path.join(srcDir, fileName));
  return {
    exact: new Set([
      ...extractArrayStrings(source, exactArrayName),
      ...extractArrayStrings(source, 'NATIVE_HOME_PATHS'),
      ...extractArrayStrings(source, 'AES.NATIVE_HOME_PATHS'),
    ]),
    includes: [
      ...extractArrayStrings(source, includeArrayName),
      ...extractArrayStrings(source, 'AES.HANDLED_PATH_INCLUDES'),
    ],
  };
}

let hasError = false;

for (const runtime of runtimes) {
  const shell = read(path.join(runtime.srcDir, 'aes-shell.js'));
  const iframe = read(path.join(runtime.srcDir, 'aes-iframe-bridge.js'));

  const requiredRoutes = new Set([
    ...extractShellExactRoutes(shell),
    ...extractIframeExtractorRoutes(iframe),
  ]);

  const gates = [
    {
      name: 'shared',
      ...readGate(runtime.srcDir, 'aes-shared.js', 'AES.HANDLED_PATHS', 'AES.HANDLED_PATH_INCLUDES'),
    },
    {
      name: 'page bridge',
      ...readGate(runtime.srcDir, 'aes-page-bridge.js', 'HANDLED_PATHS', 'HANDLED_PATH_INCLUDES'),
    },
    {
      name: 'background',
      ...readGate(runtime.srcDir, 'aes-background.js', 'HANDLED_PATHS', 'HANDLED_PATH_INCLUDES'),
    },
  ];

  for (const route of [...requiredRoutes].sort()) {
    if (ROUTE_SYNC_EXCEPTIONS.has(route)) continue;
    for (const gate of gates) {
      if (routeCovered(route, gate.exact, gate.includes)) continue;
      hasError = true;
      console.error(
        `[${runtime.name}] Route ${route} is classified/extracted but missing from ${gate.name} handled routes.`
      );
    }
  }
}

if (hasError) {
  console.error('\nRoute allowlist verification failed.');
  console.error('When adding AES tab compatibility, update shared, page bridge, background, shell type, and iframe metadata together.');
  process.exit(1);
}

console.log('Route allowlist verification passed.');
