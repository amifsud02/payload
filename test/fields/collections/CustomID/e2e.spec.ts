import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { navigateToDoc } from 'helpers/e2e/navigateToDoc.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { customIdSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

describe('Radio', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, customIdSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })
    if (client) {
      await client.logout()
    }
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()
    await ensureCompilationIsDone({ page, serverURL })
  })

  function createCustomIDDoc(id: string) {
    return payload.create({
      collection: customIdSlug,
      data: {
        id,
      },
    })
  }

  test('allow create of non standard ID', async () => {
    await createCustomIDDoc('id 1')
    await page.goto(url.list)

    await navigateToDoc(page, url)

    // Page should load and ID should be correct
    await expect(page.locator('#field-id')).toHaveValue('id 1')
    await expect(page.locator('.id-label')).toContainText('id 1')
  })
})
