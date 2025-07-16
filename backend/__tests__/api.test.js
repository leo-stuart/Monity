const request = require('supertest');
let app;
let server;

jest.doMock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('API Endpoints', () => {
  let supabaseMock;

  beforeAll((done) => {
    supabaseMock = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      })),
    };
    require('@supabase/supabase-js').createClient.mockReturnValue(supabaseMock);
    app = require('../api');
    server = app.listen(3001, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should respond with "Monity API is running."', async () => {
      const response = await request(server).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Monity API is running.');
    });
  });

  describe('POST /signup', () => {
    it('should create a new user and return 201', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'fake-token' };
      supabaseMock.auth.signUp.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });

      const response = await request(server)
        .post('/signup')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });

      expect(response.status).toBe(201);
      expect(response.body.user).toEqual(mockUser);
      expect(supabaseMock.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
            data: {
                role: 'user',
                name: 'Test User'
            }
        }
      });
    });

    it('should return 400 if signup fails', async () => {
      const errorMessage = 'User already registered';
      supabaseMock.auth.signUp.mockResolvedValue({ data: {}, error: { message: errorMessage } });

      const response = await request(server)
        .post('/signup')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(errorMessage);
    });
  });

  describe('GET /transactions', () => {
    it('should return 401 if no token is provided', async () => {
      const response = await request(server).get('/transactions');
      expect(response.status).toBe(401);
    });

    it('should return transactions for the authenticated user', async () => {
      const mockUser = { id: '123', user_metadata: { role: 'user' } };
      supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      const mockTransactions = [{ id: 1, description: 'Test Transaction' }];
      const selectMock = jest.fn().mockResolvedValue({ data: mockTransactions, error: null });
      supabaseMock.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: selectMock,
      });

      const response = await request(server)
        .get('/transactions')
        .set('Authorization', 'Bearer fake-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTransactions);
      expect(supabaseMock.from).toHaveBeenCalledWith('transactions');
      expect(supabaseMock.from().select).toHaveBeenCalledWith('*');
      expect(selectMock).toHaveBeenCalledWith('userId', '123');
    });
  });
});