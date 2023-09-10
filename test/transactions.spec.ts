import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transaction routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New',
        amount: 5000,
        type: 'credit',
      })

    const cookie = createTransactionResponse.get('Set-Cookie')

    const listTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookie)
      .expect(200)

    expect(listTransactionResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New',
        amount: 5000,
      }),
    ])
  })

  it('should be able to get a specefic transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New',
        amount: 5000,
        type: 'credit',
      })

    const cookie = createTransactionResponse.get('Set-Cookie')

    const listTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookie)
      .expect(200)

    const transactionId = listTransactionResponse.body.transactions[0].id

    const getTransactionsResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookie)
      .expect(200)

    expect(getTransactionsResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New',
        amount: 5000,
      }),
    )
  })

  it('should be able to get a summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookie = createTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 3000,
        type: 'debit',
      })
      .set('Cookie', cookie)

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookie)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({ amount: 2000 })
  })
})
