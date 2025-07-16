import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Balance from '../Balance';
import * as api from '../../utils/api';

vi.mock('../../utils/api');

describe('Balance', () => {
  it('renders the form and displays the balance on submit', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ status: 200, data: { balance: 1000 } });
    render(
      <MemoryRouter>
        <Balance />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Month [MM/YY]'), '01/24');
    const submitButton = screen.getByRole('button', { name: /request balance/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/balance/01/24');
    });
    
    expect(await screen.findByText('Balance in requested month: $1000')).toBeInTheDocument();
  });
}); 