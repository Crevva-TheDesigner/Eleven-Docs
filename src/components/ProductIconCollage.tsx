'use client';

import type { ProductCategory } from '@/lib/types';
import {
    // General
    BookText, ClipboardCheck, Code, Library, Trophy, TrendingUp, Calendar, Package, Notebook, BookHeart, Sparkles, Brain, Landmark, FileText, Calculator, Globe, Languages, Mic, Palette, Lightbulb, Target,
    // Academic & Science
    FlaskConical, Dna, Atom, TestTube, Sigma, GraduationCap, School, Pencil, Clock, CheckSquare,
    // Tech
    Terminal, Server, GitBranch, Component, Puzzle, Layers, Edit,
    // Growth & Dev
    Award, BarChart, Presentation, Sprout, Mountain, Milestone,
    // Organizers
    ListTodo, GanttChartSquare, Folder,
    // Bundles
    Boxes, Archive,
    // Writing & Journals
    Highlighter, Feather, Heart, Smile,
    // AI
    Bot, Cpu, ToyBrick,
    // Social & People
    Users, MessageSquare, HeartHandshake,
    // Finance & Econ
    Banknote, Coins, CandlestickChart,
    Briefcase
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import React from 'react';

const collageIcons: Record<ProductCategory, React.ElementType<LucideProps>[]> = {
    'Academic Notes': [BookText, FileText, Notebook, Globe, Atom, FlaskConical, Dna, GraduationCap],
    'Exam Prep': [ClipboardCheck, TestTube, Calculator, Target, Sigma, Clock, CheckSquare, Edit],
    'Coding & Tech': [Code, Dna, Atom, Brain, Globe, Terminal, Server, GitBranch],
    'Code Libraries': [Library, Code, Package, FileText, Component, Puzzle, Layers],
    'Skill Development': [Trophy, Mic, Briefcase, Palette, Languages, Award, BarChart, Presentation],
    'Personal Growth': [TrendingUp, Lightbulb, Brain, Target, BookHeart, Sprout, Mountain, Milestone],
    'Planners & Organizers': [Calendar, ClipboardCheck, Notebook, Target, ListTodo, GanttChartSquare, Folder],
    'Bundles': [Package, Library, BookText, FileText, Boxes, Archive, Layers],
    'Digital Notebooks': [Notebook, FileText, BookHeart, Edit, Pencil, Highlighter],
    'Digital Journals': [BookHeart, Notebook, FileText, Feather, Heart, Smile],
    'AI Services': [Sparkles, Brain, Code, Lightbulb, Bot, Cpu, ToyBrick],
    'Psychology': [Brain, Mic, BookHeart, Lightbulb, TrendingUp, Users, MessageSquare, HeartHandshake],
    'Economics': [Landmark, BarChart, TrendingUp, Globe, Calculator, Banknote, Coins, CandlestickChart],
};

const iconPositions = [
    { top: '10%', left: '15%', size: '20%' },
    { top: '20%', left: '70%', size: '25%' },
    { top: '65%', left: '10%', size: '22%' },
    { top: '60%', left: '80%', size: '28%' },
    { top: '40%', left: '40%', size: '35%' },
    { top: '80%', left: '45%', size: '18%' },
    { top: '5%', left: '45%', size: '15%' },
    { top: '45%', left: '85%', size: '15%' },
];

interface ProductIconCollageProps {
    category: ProductCategory;
}

export function ProductIconCollage({ category }: ProductIconCollageProps) {
    const Icons = collageIcons[category] || collageIcons['Bundles'];

    return (
        <div className="relative w-full h-full opacity-30">
            {Icons.slice(0, 8).map((Icon, index) => {
                const pos = iconPositions[index];
                if (!pos) return null;
                return (
                    <Icon
                        key={index}
                        className="absolute text-muted-foreground animate-icon-float"
                        strokeWidth={1}
                        style={{
                            top: pos.top,
                            left: pos.left,
                            width: pos.size,
                            height: pos.size,
                            animationDelay: `${index * 1.2}s`,
                            animationDuration: `${Math.floor(Math.random() * 5) + 6}s`,
                        }}
                    />
                );
            })}
        </div>
    );
}
