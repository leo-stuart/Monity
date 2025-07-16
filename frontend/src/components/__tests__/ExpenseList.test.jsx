import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ExpenseList from '../ExpenseList';
import * as api from '../../utils/api';

vi.mock('../../utils/api');

describe('ExpenseList', () => {
  it('renders no expenses message when there are no expenses', async () => {
    api.get.mockResolvedValue({ data: [] });
    render(
      <MemoryRouter>
        <ExpenseList />
      </MemoryRouter>
    );
    expect(await screen.findByText('No expenses found.')).toBeInTheDocument();
  });

  it('renders a list of expenses', async () => {
    const expenses = [
      { id: 1, date: '2024-01-01', category: 'Food', description: 'Lunch', amount: 15.00, typeId: 1 },
      { id: 2, date: '2024-01-01', category: 'Transport', description: 'Train', amount: 5.00, typeId: 1 },
    ];
    api.get.mockResolvedValue({ data: expenses });
    render(
      <MemoryRouter>
        <ExpenseList />
      </MemoryRouter>
    );
    const foodElements = await screen.findAllByText('Food');
    expect(foodElements.length).toBeGreaterThan(0);

    const transportElements = await screen.findAllByText('Transport');
    expect(transportElements.length).toBeGreaterThan(0);
  });
}); 