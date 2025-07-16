import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AddIncome from '../AddIncome';
import * as api from '../../utils/api';

vi.mock('../../utils/api');

describe('AddIncome', () => {
  it('renders the form and submits data correctly', async () => {
    const user = userEvent.setup();
    const categories = [
      { id: 1, name: 'Salary', typeId: 2 },
      { id: 2, name: 'Freelance', typeId: 2 },
    ];
    api.get.mockResolvedValue({ data: categories });
    const postMock = api.post.mockResolvedValue({ data: {} });
    render(
      <MemoryRouter>
        <AddIncome />
      </MemoryRouter>
    );

    await screen.findByText('Salary');
    await user.selectOptions(screen.getByRole('combobox'), 'Salary');
    await user.type(screen.getByPlaceholderText('Amount'), '1000');
    await user.type(screen.getByPlaceholderText('Date (DD/MM/YY)'), '01/01/2024');
    
    const submitButton = screen.getByRole('button', { name: /add income/i });
    await user.click(submitButton);

    expect(postMock).toHaveBeenCalledWith('/add-income', {
      category: 'Salary',
      amount: '1000',
      date: '01/01/2024',
    });
  });
}); 