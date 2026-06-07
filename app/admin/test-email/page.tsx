'use client';

import { useState, useTransition } from 'react';
import { testEmailAction } from './actions';
import { supabase } from '@/lib/supabase';

export default function TestEmailPage() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<any>(null);
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('Vee-Care order alert test');
    const [message, setMessage] = useState('If you receive this, order emails are working.');

    const handleSend = () => {
        setResult(null);
        startTransition(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';
            const res = await testEmailAction(to, subject, message, token);
            setResult(res);
        });
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Test Email Integration</h1>
            <p className="text-gray-600 mb-6 max-w-2xl">
                Uses Resend. Order and customer alerts go to every address in <code className="text-sm bg-gray-100 px-1 rounded">ADMIN_EMAIL</code>
                {' '}(comma-separated), plus <code className="text-sm bg-gray-100 px-1 rounded">MOOLRE_MERCHANT_EMAIL</code>,{' '}
                <code className="text-sm bg-gray-100 px-1 rounded">HUBTEL_MERCHANT_EMAIL</code>, and the support inbox.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Send Test Email</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                            <input
                                type="email"
                                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-mauve/40 outline-none"
                                placeholder="admin@example.com"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-mauve/40 outline-none"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-mauve/40 outline-none h-24"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={isPending}
                            className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${isPending
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-brand-espresso hover:bg-brand-cocoa'
                                }`}
                        >
                            {isPending ? 'Sending...' : 'Send Test Email'}
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Response & Debug Log</h2>

                    {result ? (
                        <div className="space-y-3">
                            {result.error && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                    {result.error}
                                </div>
                            )}
                            {result.message && (
                                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                                    {result.message}
                                </div>
                            )}
                            {result.from && (
                                <p className="text-sm text-gray-600">
                                    From: <strong>{result.from}</strong>
                                </p>
                            )}
                            {result.adminRecipients?.length > 0 && (
                                <p className="text-sm text-gray-600">
                                    Order alerts configured for: <strong>{result.adminRecipients.join(', ')}</strong>
                                </p>
                            )}
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-auto max-h-[500px]">
                                <pre>{JSON.stringify(result, null, 2)}</pre>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed rounded-md min-h-[200px]">
                            Waiting for response...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
