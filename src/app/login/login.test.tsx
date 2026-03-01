import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/en.json';
import LoginPage from './page';

const postJson = vi.fn();
let originalAppUrl: string | undefined;

vi.mock('@/lib/api', () => ({
    postJson: (...args: unknown[]) => postJson(...args),
}));

vi.mock('next/link', () => ({
    default: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const renderWithIntl = (ui: React.ReactElement) =>
    render(
        <NextIntlClientProvider locale="en" messages={messages}>
            {ui}
        </NextIntlClientProvider>,
    );

describe('LoginPage', () => {
    beforeEach(() => {
        postJson.mockReset();
        originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
        delete process.env.NEXT_PUBLIC_APP_URL;
    });

    afterEach(() => {
        if (originalAppUrl) {
            process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
        } else {
            delete process.env.NEXT_PUBLIC_APP_URL;
        }
    });

    it('renders basic form validation attributes', () => {
        renderWithIntl(<LoginPage />);

        const input = screen.getByLabelText(/email address/i);
        expect(input).toHaveAttribute('required');
        expect(input).toHaveAttribute('type', 'email');
    });

    it('submits email and shows success message', async () => {
        postJson.mockResolvedValue({ ok: true });

        renderWithIntl(<LoginPage />);

        await userEvent.type(
            screen.getByLabelText(/email address/i),
            'user@test.com',
        );
        await userEvent.click(
            screen.getByRole('button', { name: /send magic link/i }),
        );

        expect(postJson).toHaveBeenCalledWith('/auth/magic-link', {
            email: 'user@test.com',
        });
        expect(
            await screen.findByText(/check your email/i),
        ).toBeInTheDocument();
    });

    it('shows dev login link when provided', async () => {
        postJson.mockResolvedValue({
            ok: true,
            dev_login_url: 'http://dev-link',
        });

        renderWithIntl(<LoginPage />);

        await userEvent.type(
            screen.getByLabelText(/email address/i),
            'user@test.com',
        );
        await userEvent.click(
            screen.getByRole('button', { name: /send magic link/i }),
        );

        expect(await screen.findByText(/dev login link/i)).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'http://dev-link' }),
        ).toHaveAttribute('href', 'http://dev-link');
    });

    it('uses NEXT_PUBLIC_APP_URL for dev login link when set', async () => {
        process.env.NEXT_PUBLIC_APP_URL = 'https://test.gnailuy.com';
        postJson.mockResolvedValue({
            ok: true,
            dev_login_url: 'http://127.0.0.1:3000/auth/verify?token=abc',
        });

        renderWithIntl(<LoginPage />);

        await userEvent.type(
            screen.getByLabelText(/email address/i),
            'user@test.com',
        );
        await userEvent.click(
            screen.getByRole('button', { name: /send magic link/i }),
        );

        expect(await screen.findByText(/dev login link/i)).toBeInTheDocument();
        expect(
            screen.getByRole('link', {
                name: 'https://test.gnailuy.com/auth/verify?token=abc',
            }),
        ).toHaveAttribute(
            'href',
            'https://test.gnailuy.com/auth/verify?token=abc',
        );
    });
    it('shows error message on failure', async () => {
        postJson.mockRejectedValue(new Error('nope'));

        renderWithIntl(<LoginPage />);

        await userEvent.type(
            screen.getByLabelText(/email address/i),
            'user@test.com',
        );
        await userEvent.click(
            screen.getByRole('button', { name: /send magic link/i }),
        );

        expect(await screen.findByText('nope')).toBeInTheDocument();
    });
});
