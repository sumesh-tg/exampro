"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { suggestQuizTopics } from "@/ai/flows/suggest-topics";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "./ui/badge";

const formSchema = z.object({
  interests: z.string().min(2, {
    message: "Interests must be at least 2 characters.",
  }),
});

export function TopicSuggester() {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interests: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setTopics([]);
    try {
      const result = await suggestQuizTopics({ interests: values.interests });
      setTopics(result.topics);
    } catch (error) {
      console.error("Failed to suggest topics:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          <CardTitle>Stuck for ideas?</CardTitle>
        </div>
        <CardDescription>Let AI suggest some quiz topics based on your interests.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Interests</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Space exploration, 90s rock music" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Suggest Topics
            </Button>
          </form>
        </Form>
        {topics.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold">Suggested Topics:</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {topics.map((topic, index) => (
                <Badge key={index} variant="secondary">{topic}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
