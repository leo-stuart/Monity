const request = require('supertest');
const { app } = require('../api');
const { createClient } = require('@supabase/supabase-js');

jest.mock('@supabase/supabase-js');

describe('API', () => {
    let supabaseMock;

    beforeEach(() => {
        jest.clearAllMocks();
        supabaseMock = {
            auth: {
                signUp: jest.fn(),
                signIn: jest.fn(),
                getUser: jest.fn(),
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
            })),
        };
        createClient.mockReturnValue(supabaseMock);
    });

    describe('POST /signup', () => {
        it('should create a new user and return 201', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            supabaseMock.auth.signUp.mockResolvedValue({ data: { user: mockUser }, error: null });

            const response = await request(app)
                .post('/signup')
                .send({ email: 'test@example.com', password: 'password123' });
            
            expect(response.status).toBe(201);
            expect(response.body.user).toEqual(mockUser);
        });

        it('should return 400 if signup fails', async () => {
            const errorMessage = 'User already registered';
            supabaseMock.auth.signUp.mockResolvedValue({ data: { user: null }, error: { message: errorMessage } });

            const response = await request(app)
                .post('/signup')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(errorMessage);
        });
    });
}); 