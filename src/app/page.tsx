'use client';

import { useState, useEffect } from 'react';
import { allProducts } from '@/lib/data';
import { ProductCard } from '@/components/ProductCard';
import { PersonalizedRecommendations } from '@/components/PersonalizedRecommendations';
import { ArrowDown, Mail, Phone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { firestore } from '@/firebase/client';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { submitSubscription } from '@/firebase/firestore/subscriptions';
import { useActiveSection } from '@/hooks/use-active-section';
import { AboutStats } from '@/components/AboutStats';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitFeedback } from '@/firebase/firestore/feedbacks';

export default function Home() {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user);
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { activeSection, setActiveSection } = useActiveSection();

  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const sections = ['home', 'about', 'featured-products', 'contact'];
    if (user) {
      sections.push('for-you');
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -50% 0px',
      }
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      sections.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [setActiveSection, user]);

  useEffect(() => {
    if (userProfile) {
      setFeedbackName(userProfile.displayName);
      setFeedbackEmail(userProfile.email);
    }
  }, [userProfile]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not connect to the database. Please try again later.',
        });
        return;
    }
    if (!user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'You must be logged in to subscribe.',
      });
      return;
    }
    
    setIsSubscribing(true);
    try {
      await submitSubscription(firestore, { name: userProfile.displayName, email: userProfile.email });
      toast({
        title: 'Subscribed!',
        description: "Thanks for subscribing. We'll keep you updated on the latest products.",
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Subscription Failed',
        description: "There was an error subscribing. You may already be on our list.",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not connect to the database. Please try again later.',
        });
        return;
    }
    if (!feedbackName || !feedbackEmail) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill out all fields to submit feedback.',
      });
      return;
    }
    if (!feedbackMessage && !suggestionMessage) {
      toast({
        variant: 'destructive',
        title: 'Empty Message',
        description: 'Please provide either feedback or a suggestion.',
      });
      return;
    }
    
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback(firestore, { name: feedbackName, email: feedbackEmail, feedback: feedbackMessage, suggestion: suggestionMessage });
      toast({
        title: 'Feedback Sent!',
        description: "Thanks for your feedback. We appreciate you taking the time.",
      });
      setFeedbackMessage('');
      setSuggestionMessage('');
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: "There was an error sending your feedback. Please try again.",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const faqItems = [
    {
      question: "What kind of products do you sell?",
      answer: "We sell a wide range of high-quality digital assets, including digital notebooks, planners, code libraries, academic notes, and skill development guides designed for students, developers, and creatives."
    },
    {
      question: "How do I access my purchased products?",
      answer: "Once your purchase is complete, you can find all your products in the 'My Purchased Products' and 'My Downloads' sections of your user dashboard."
    },
    {
      question: "What is the AI PDF Creator?",
      answer: "The AI PDF Creator is a tool that allows you to generate custom documents. You provide a detailed prompt, and our AI will create the content for you. You can then purchase and download the final PDF."
    },
    {
      question: "Are the payments secure?",
      answer: "Yes, all payments are processed securely through Razorpay, a trusted and widely-used payment gateway. We do not store any of your payment information on our servers."
    },
    {
      question: "Can I get a refund?",
      answer: "Due to the digital nature of our products, all sales are final and we do not offer refunds. Please make sure to read the product descriptions carefully before making a purchase."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header id="home" className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4 relative">
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-r from-slate-200 via-slate-400 to-slate-500 bg-clip-text text-transparent pb-4">
          Discover Your Next Digital Asset
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
          A curated marketplace for high-quality digital assets. Fuel your creativity and productivity with our exclusive collection.
        </p>
        <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            <Button size="lg" asChild>
                <Link href="/products">Browse All Products</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
                <Link href="/#contact">Contact Us</Link>
            </Button>
            <Button size="lg" asChild>
                <Link href="/ai-pdf-generator"><Sparkles className="mr-2 h-5 w-5" />AI PDF Generator</Link>
            </Button>
        </div>
         <div className="absolute bottom-4 md:bottom-8 translate-y-4">
            <ArrowDown className="h-8 w-8 text-muted-foreground down-arrow" />
        </div>
      </header>

      <section id="about" className="my-16 sm:my-24 scroll-mt-20">
        <div className="text-center max-w-5xl mx-auto">
            <h2 className="text-4xl font-extrabold tracking-tighter mb-6">What is Eleven Docs?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
                Eleven Docs is a curated digital marketplace designed for the modern student, developer, and creative professional. Our mission is to provide high-quality, meticulously crafted digital assets that fuel your productivity, accelerate your learning, and inspire your next big project.
            </p>
            <AboutStats />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-card p-6 rounded-xl border">
                    <h3 className="font-bold text-xl mb-2">For Students</h3>
                    <p className="text-muted-foreground">
                        Unlock your academic potential with our extensive library of resources for students from <strong>Class 8 onwards</strong>. Our materials, tailored for <strong>CBSE and ICSE boards</strong>, include comprehensive, chapter-wise notes for subjects like Physics, Chemistry, and Biology, along with exam-specific preparation kits like sample papers, formula sheets, and revision guides. We cover everything from school curriculum to competitive exams and beyond, with study aids designed to help you understand concepts deeply, not just memorize them.
                    </p>
                </div>
                <div className="bg-card p-6 rounded-xl border">
                    <h3 className="font-bold text-xl mb-2">For Developers & Tech Enthusiasts</h3>
                    <p className="text-muted-foreground">
                        Accelerate your development workflow with our collection of code libraries, UI kits for frameworks like React and Vue, and ready-to-use Python automation scripts. Dive into complex topics like Data Structures, Algorithms, AI & Machine Learning, and Cyber Security with our beginner-friendly notes and concept guides, designed to make learning practical and accessible.
                    </p>
                </div>
                <div className="bg-card p-6 rounded-xl border">
                    <h3 className="font-bold text-xl mb-2">For Creatives & Self-Improvers</h3>
                    <p className="text-muted-foreground">
                        Fuel your personal growth and creativity. Find beautifully designed planners, digital journals, and goal-setting workbooks to organize your life. Develop new skills with our guides on public speaking, guitar, creative writing, and more. Our resources are crafted to help you build better habits, manage your time, and unlock your creative potential.
                    </p>
                </div>
                <div className="bg-card p-6 rounded-xl border">
                    <h3 className="font-bold text-xl mb-2">AI-Powered Tools</h3>
                    <p className="text-muted-foreground">
                        Experience the future of content creation with our unique AI PDF Generator. Simply describe the document you need – whether it's a study guide, a business report, or a meal planner – and our AI will craft a professional-quality PDF for you in seconds. It's your personal content creation assistant, available 24/7.
                    </p>
                </div>
            </div>
            <p className="mt-12 text-lg text-muted-foreground leading-relaxed">
                At Eleven Docs, every product is either carefully created by experts or generated by cutting-edge AI to meet our high standards of quality and utility. We believe in secure, seamless transactions, which is why we've integrated Razorpay for payments. Your dashboard keeps all your purchases organized and accessible anytime.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Welcome to a smarter way to learn, create, and grow. Welcome to Eleven Docs.
            </p>
        </div>
      </section>

      <section id="featured-products" className="my-8 sm:my-12 scroll-mt-20">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
           <Button variant="outline" asChild>
            <Link href="/products">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {allProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-12 text-center">
            <Button asChild size="lg">
                <Link href="/products">View All Products</Link>
            </Button>
        </div>
      </section>

      {user && (
         <section className="my-8 sm:my-12 scroll-mt-20" id="for-you">
            <PersonalizedRecommendations key={user.uid} products={allProducts} />
        </section>
      )}

      <section id="contact" className="mt-12 py-12 sm:py-16 scroll-mt-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4">
            Get In Touch
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            We'd love to hear from you! Subscribe to our newsletter or use the contact information below to reach out.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-card p-8 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Subscribe to get notified about latest product</h2>
              {user ? (
                <form onSubmit={handleSubscribe}>
                  <Button type="submit" className="w-full" size="lg" disabled={isSubscribing}>
                    {isSubscribing ? 'Subscribing...' : 'Subscribe to Newsletter'}
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-4">
                    <p className='text-muted-foreground'>Log in to subscribe to our newsletter and get the latest updates.</p>
                    <Button asChild className='w-full' size="lg">
                        <Link href="/login?redirect=/#contact">Login to Subscribe</Link>
                    </Button>
                </div>
              )}
          </div>

          <div className="space-y-8">
              <h2 className="text-2xl font-bold">Contact Information</h2>
              <div className="space-y-6">
                  <div className="flex items-start gap-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-full">
                          <Mail className="h-6 w-6" />
                      </div>
                      <div>
                          <h3 className="font-semibold text-lg">Email</h3>
                          <p className="text-muted-foreground">Reach out to us via email for any inquiries.</p>
                          <a href="mailto:the.designer.crevva@gmail.com" className="text-primary hover:underline">the.designer.crevva@gmail.com</a>
                      </div>
                  </div>
              </div>
          </div>
        </div>

        <div id="feedback" className="mt-16 sm:mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tighter text-center mb-8">
            Give us Feedback
          </h2>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Share Your Thoughts</CardTitle>
              <CardDescription>We're always looking to improve. Let us know what you think!</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedback-name">Name</Label>
                    <Input id="feedback-name" placeholder="Your Name" required value={feedbackName} onChange={(e) => setFeedbackName(e.target.value)} className="rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback-email">Email</Label>
                    <Input id="feedback-email" type="email" placeholder="your@email.com" required value={feedbackEmail} onChange={(e) => setFeedbackEmail(e.target.value)} className="rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-message">General Feedback</Label>
                  <Textarea id="feedback-message" placeholder="What's on your mind?" value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} rows={5} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestion-message">What can we add more?</Label>
                  <Textarea id="suggestion-message" placeholder="Suggest new products, features, or improvements..." value={suggestionMessage} onChange={(e) => setSuggestionMessage(e.target.value)} rows={5} className="rounded-xl" />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmittingFeedback}>
                  {isSubmittingFeedback ? 'Sending...' : 'Send Feedback'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 sm:mt-24 max-w-4xl mx-auto">
        <h2 className="text-4xl font-extrabold tracking-tighter text-center mb-12">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg text-left">{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      </section>
    </div>
  );
}
