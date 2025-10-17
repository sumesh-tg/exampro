
'use client';

import { BookOpen, Wand2, PlusCircle, Layers, BarChart, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
    {
        icon: BookOpen,
        title: "Take Exams",
        description: "Test your knowledge with a wide variety of exams. Track your progress and review your past performance."
    },
    {
        icon: Wand2,
        title: "AI Topic Suggestions",
        description: "Not sure what to study? Let our AI suggest relevant exam topics based on your interests."
    },
    {
        icon: PlusCircle,
        title: "Create & Manage Exams",
        description: "Admins can create custom exams, add questions manually, or generate them instantly with AI."
    },
    {
        icon: Layers,
        title: "Campaign Management",
        description: "Group multiple exams into campaigns with specific time windows and share them with users."
    },
    {
        icon: BarChart,
        title: "Detailed Analytics",
        description: "View detailed reports on exam performance and see who has completed exams you've shared."
    },
    {
        icon: Wallet,
        title: "Secure Payments & Attempts",
        description: "Easily manage your exam attempts by recharging your account through our secure payment system."
    }
];

export function FeaturesSection() {
    return (
        <section className="py-12 sm:py-16">
            <div className="mx-auto max-w-6xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Key Features</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Everything you need to excel in one platform.</p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <Card key={feature.title} className="text-center">
                            <CardHeader className="items-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/20">
                                    <feature.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </CardHeader>
                             <CardTitle>{feature.title}</CardTitle>
                            <CardContent className="pt-4">
                                <CardDescription>{feature.description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
