
'use client';

import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const userFaqs = [
    {
        q: 'How do I take an exam?',
        a: 'From the dashboard, simply find an exam you want to take from the "Available Exams" list and click the "Start Exam" button. This will use one of your available attempts.'
    },
    {
        q: 'What is the AI Topic Suggester?',
        a: 'If you\'re not sure what to study, you can use the AI Topic Suggester on the dashboard. Type in some of your interests, and our AI will suggest relevant exam topics for you. Clicking a suggested topic will generate a new exam, which costs one attempt.'
    },
    {
        q: 'How do I see my past results?',
        a: 'Your "Exam History" is available on the right side of the dashboard. It shows your score for each exam you\'ve taken. You can also rate exams you\'ve completed to provide feedback.'
    },
    {
        q: 'What are attempts and how do I get more?',
        a: 'You get a certain number of free attempts when you sign up. Each time you start an exam, one attempt is used. You can purchase more attempts by clicking on the "Recharge Attempts" option in your account menu (top right corner).'
    },
    {
        q: 'What is an Organization Account?',
        a: 'An Organization Account allows you to create, manage, and share your own exams with other users. You can request to upgrade your account from your Profile page.'
    },
];

const adminFaqs = [
    {
        q: 'How do I create a new exam?',
        a: 'As an admin, you will see a "Create Exam" button on your dashboard. You can define the exam details, and then either add questions manually, import them from an Excel file, or generate them using AI by providing a topic.'
    },
    {
        q: 'What are Campaigns?',
        a: 'Campaigns allow you to group multiple exams together and make them available to users for a specific period. Users can join a campaign via a unique link and take the exams included within it. You can create campaigns from the dashboard.'
    },
    {
        q: 'How can I see who took an exam I shared?',
        a: 'On the dashboard, click the "View Share Report" button. This will show you a report of all users who have completed exams using links you\'ve shared.'
    },
     {
        q: 'How do I edit or delete an exam?',
        a: 'In the "Available Exams" list, click the three-dots menu on the right side of an exam entry. You will see options to "Edit" or "Delete" the exam.'
    }
];

const superAdminFaqs = [
    {
        q: 'How do I manage users?',
        a: 'In your account menu, select "User Management". From there, you can view all users, promote users to admin, disable accounts, or delete them.'
    },
    {
        q: 'How do I approve admin requests?',
        a: 'Navigate to "Admin Requests" from your account menu. You will see a list of all pending requests from users who want to become admins. Clicking "Approve" will grant them the admin role.'
    },
    {
        q: 'How do I change application settings?',
        a: 'Go to "App Configuration" from your account menu. Here you can control global settings like login methods, AI feature availability, and payment options for all users.'
    },
    {
        q: 'Where can I see all platform activity?',
        a: 'The "Super Admin: All User History" report on your dashboard provides a complete log of every exam attempt made by every user on the platform. The "Attempt Balance History" page in your menu shows a log of all transactions affecting user attempt balances.'
    }
];


export default function HelpPage() {
  useRequireAuth();
  const { isAdmin, isSuperAdmin } = useAuth();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Help & FAQ</h1>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
            
            {/* User FAQs */}
            <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><HelpCircle className="text-primary" /> General Questions</h2>
                 <Accordion type="single" collapsible className="w-full">
                    {userFaqs.map((faq, index) => (
                        <AccordionItem value={`user-${index}`} key={`user-${index}`}>
                            <AccordionTrigger>{faq.q}</AccordionTrigger>
                            <AccordionContent className="text-base">
                                {faq.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>
            
            {/* Admin FAQs */}
            {(isAdmin || isSuperAdmin) && (
                <section>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><HelpCircle className="text-accent" /> Admin Questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {adminFaqs.map((faq, index) => (
                            <AccordionItem value={`admin-${index}`} key={`admin-${index}`}>
                                <AccordionTrigger>{faq.q}</AccordionTrigger>
                                <AccordionContent className="text-base">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </section>
            )}

            {/* Super Admin FAQs */}
            {isSuperAdmin && (
                 <section>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><HelpCircle className="text-destructive" /> Super Admin Questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {superAdminFaqs.map((faq, index) => (
                            <AccordionItem value={`super-admin-${index}`} key={`super-admin-${index}`}>
                                <AccordionTrigger>{faq.q}</AccordionTrigger>
                                <AccordionContent className="text-base">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </section>
            )}
        </div>
      </main>
    </div>
  );
}
