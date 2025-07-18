const request = require('supertest');
const app = require('../api');
const { createClient } = require('@supabase/supabase-js');

jest.mock('@supabase/supabase-js');

describe('Premium API Endpoints', () => {
  let server;

  beforeAll((done) => {
    const supabaseMock = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'test-user-id', user_metadata: { role: 'premium' } },
          },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        gte: jest.fn().mockResolvedValue({ data: [], error: null }),
        lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        single: jest.fn().mockResolvedValue({ data: { subscription_tier: 'premium' }, error: null }),
      }),
    };
    createClient.mockReturnValue(supabaseMock);
    server = app.listen(3003, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /premium/financial-health-score', () => {
    it('should calculate and return the financial health score', async () => {
      const response = await request(server)
        .get('/premium/financial-health-score')
        .set('Authorization', 'Bearer fake-token');
      expect(response.status).toBe(200);
    });
  });
}); 