import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AddExpense from '../AddExpense';
import * as api from '../../utils/api';

vi.mock('../../utils/api');

describe('AddExpense', () => {
  it('renders the form and submits data correctly', async () => {
    const user = userEvent.setup();
    const categories = [
      { id: 1, name: 'Food', typeId: 1 },
      { id: 2, name: 'Transport', typeId: 1 },
    ];
    api.get.mockResolvedValue({ data: categories });
    const postMock = api.post.mockResolvedValue({ data: {} });
    render(
      <MemoryRouter>
        <AddExpense />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Description'), 'Test Expense');
    await user.type(screen.getByPlaceholderText('Amount'), '100');
    await user.selectOptions(screen.getByRole('combobox'), 'Food');
    await user.type(screen.getByPlaceholderText('Date'), '2024-01-01');
    
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    expect(postMock).toHaveBeenCalledWith('/add-expense', {
      description: 'Test Expense',
      amount: '100',
      category: 'Food',
      date: '2024-01-01',
    });
  });
}); 