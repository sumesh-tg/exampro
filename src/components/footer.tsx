
'use client';
import Link from 'next/link';

export function Footer() {
    return (
      <footer className="bg-primary/80 text-primary-foreground">
        <div className="mx-auto max-w-6xl py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
                <p>&copy; {new Date().getFullYear()} ExamsPro.in. All rights reserved.</p>
                 <div className="flex items-center space-x-6">
                    <Link href="/help" className="text-sm hover:underline">Help & FAQ</Link>
                </div>
            </div>
        </div>
      </footer>
    );
}
