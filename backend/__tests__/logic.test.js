const { getFinancialHealthScore } = require('../financial-health');

describe('Business Logic Unit Tests', () => {
  describe('getFinancialHealthScore', () => {
    it('should calculate the financial health score correctly based on mock data', async () => {
      const mockSupabase = {
        from: jest.fn((tableName) => {
          const mockData = {
            transactions: [
              { amount: 5000, typeId: 2 }, // Income
              { amount: 1000, typeId: 3 }, // Savings
              { amount: 3500, typeId: 1 }, // Expense
            ],
            budgets: [{ amount: 4000, categoryId: 'cat1' }],
            liabilities: [{ amount: 15000 }],
            assets: [{ value: 10000, type: 'Cash' }],
          };

          const eqMock = jest.fn();

          if (tableName === 'transactions') {
            eqMock
              .mockImplementationOnce((column, value) => { // Mock for income
                return { data: mockData.transactions.filter(t => t.typeId === 2), error: null };
              })
              .mockImplementationOnce((column, value) => { // Mock for savings
                return { data: mockData.transactions.filter(t => t.typeId === 3), error: null };
              })
              .mockImplementationOnce((column, value) => { // Mock for expenses
                return { data: mockData.transactions.filter(t => t.typeId === 1), error: null };
              });
          } else {
            eqMock.mockResolvedValue({ data: mockData[tableName], error: null });
          }

          return {
            select: jest.fn().mockReturnThis(),
            eq: eqMock,
          };
        }),
      };

      const score = await getFinancialHealthScore(mockSupabase, 'test-user-id');
      expect(score).toBeDefined();
      expect(score.overallScore).toBe(65); // Or whatever the expected score is based on the logic
      expect(score.summary.savingsRate.value).toBe(20);
    });
  });
}); 